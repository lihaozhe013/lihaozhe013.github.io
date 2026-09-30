import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as THREE from 'three';
import {
  InkFluidSimulation,
  type InkFluidStepOptions,
  type InkPresentationOptions,
  type InkSplat,
} from '@/components/inkFluid';

const inkDebugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.info('[ink_fluid]', ...args);
};

const inkDebugWarn = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.warn('[ink_fluid]', ...args);
};

const inkDebugError = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.error('[ink_fluid]', ...args);
};

const STROKE_IDLE_RESET_MS = 140;
const STROKE_DEAD_ZONE_PX = 3;
const STROKE_RAMP_END_PX = 14;
const STROKE_SAMPLE_SPACING_PX = 3.5;
const STROKE_PIGMENT_RADIUS = 0.0053;
const POINTER_DOWN_PIGMENT_RADIUS = STROKE_PIGMENT_RADIUS * 2;
const STROKE_PIGMENT_BASE_STRENGTH = 0.2;
const STROKE_PIGMENT_SPEED_STRENGTH = 0.9;

interface PointerState {
  position: THREE.Vector2;
  clientPosition: THREE.Vector2;
  lastEmissionClientPosition: THREE.Vector2;
  speed: number;
  pixelSpeed: number;
  strokeTravel: number;
  strokeGain: number;
  active: boolean;
  hasSample: boolean;
  lastEventAt: number;
  lastMoveAt: number;
  pulseAt: number;
}

interface BackgroundMode {
  modeStrength: number;
  grainStrength: number;
  ambientMotion: number;
}

function getBackgroundMode(pathname: string): BackgroundMode {
  if (pathname === '/') {
    return {
      modeStrength: 1,
      grainStrength: 0.88,
      ambientMotion: 1,
    };
  }

  if (pathname.startsWith('/projects/')) {
    return {
      modeStrength: 0.22,
      grainStrength: 0.2,
      ambientMotion: 0,
    };
  }

  return {
    modeStrength: 0.42,
    grainStrength: 0.34,
    ambientMotion: 0,
  };
}

function createPointerState(): PointerState {
  return {
    position: new THREE.Vector2(0.5, 0.5),
    clientPosition: new THREE.Vector2(),
    lastEmissionClientPosition: new THREE.Vector2(),
    speed: 0,
    pixelSpeed: 0,
    strokeTravel: 0,
    strokeGain: 0,
    active: false,
    hasSample: false,
    lastEventAt: 0,
    lastMoveAt: 0,
    pulseAt: 0,
  };
}

function getPointerPositionFromClient(
  clientPosition: THREE.Vector2,
): THREE.Vector2 {
  return new THREE.Vector2(
    THREE.MathUtils.clamp(clientPosition.x / window.innerWidth, 0, 1),
    THREE.MathUtils.clamp(1 - clientPosition.y / window.innerHeight, 0, 1),
  );
}

function getPointerPosition(event: PointerEvent): THREE.Vector2 {
  return getPointerPositionFromClient(
    new THREE.Vector2(event.clientX, event.clientY),
  );
}

function smoothstep(minimum: number, maximum: number, value: number): number {
  const amount = THREE.MathUtils.clamp(
    (value - minimum) / (maximum - minimum),
    0,
    1,
  );
  return amount * amount * (3 - 2 * amount);
}

function resizeFallback(
  canvas: HTMLCanvasElement,
): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return context;
}

function drawFallback(
  context: CanvasRenderingContext2D,
  pointer: PointerState,
  modeStrength: number,
): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const x = pointer.position.x * width;
  const y = (1 - pointer.position.y) * height;
  const radius = Math.max(width, height) * (0.17 - pointer.speed * 0.08);
  context.clearRect(0, 0, width, height);

  const wash = context.createRadialGradient(x, y, 0, x, y, radius);
  wash.addColorStop(0, `rgba(238, 238, 234, ${0.13 * modeStrength})`);
  wash.addColorStop(0.45, `rgba(186, 186, 182, ${0.055 * modeStrength})`);
  wash.addColorStop(1, 'rgba(38, 38, 38, 0)');
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);
}

function createDebugPanel(): HTMLDivElement | null {
  if (
    !import.meta.env.DEV ||
    !new URLSearchParams(window.location.search).has('inkDebug')
  ) {
    return null;
  }
  const panel = document.createElement('div');
  panel.className = 'ink-debug-panel';
  panel.textContent = '[ink_fluid] initializing';
  document.body.appendChild(panel);
  return panel;
}

function updateDebugPanel(
  panel: HTMLDivElement | null,
  simulation: InkFluidSimulation,
  pointer: PointerState,
): void {
  if (!panel) return;
  const info = simulation.getDebugInfo();
  panel.textContent = [
    '[ink_fluid]',
    `velocity ${info.velocity}`,
    `pigment ${info.pigment}`,
    `particles ${info.particles}`,
    `splats ${info.splats}`,
    `energy ${info.energy.toFixed(3)}`,
    `speed ${pointer.pixelSpeed.toFixed(1)}px/s`,
    `travel ${pointer.strokeTravel.toFixed(1)}px`,
    `gain ${pointer.strokeGain.toFixed(2)}`,
  ].join('  ');
}

export default function InkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null);
  const location = useLocation();
  const modeRef = useRef(getBackgroundMode(location.pathname));
  const coverVisibleRef = useRef(location.pathname === '/');
  const coverObserverRef = useRef<IntersectionObserver | null>(null);
  const requestFrameRef = useRef<(() => void) | null>(null);
  const simulationRef = useRef<InkFluidSimulation | null>(null);

  useEffect(() => {
    modeRef.current = getBackgroundMode(location.pathname);
    coverObserverRef.current?.disconnect();
    coverObserverRef.current = null;
    coverVisibleRef.current = location.pathname === '/';

    if (location.pathname === '/') {
      const cover = document.getElementById('cover');
      if (cover && 'IntersectionObserver' in window) {
        coverObserverRef.current = new IntersectionObserver(
          ([entry]) => {
            coverVisibleRef.current = entry.isIntersecting;
            requestFrameRef.current?.();
          },
          { threshold: 0.02 },
        );
        coverObserverRef.current.observe(cover);
      }
    }

    simulationRef.current?.reset();
    requestFrameRef.current?.();
  }, [location.pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fallbackCanvas = fallbackCanvasRef.current;
    if (!canvas || !fallbackCanvas) return;

    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    let reducedMotion = reducedMotionQuery.matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const pointer = createPointerState();
    const pendingSplats: InkSplat[] = [];
    const debugPanel = createDebugPanel();
    let fallbackContext = resizeFallback(fallbackCanvas);
    let simulation: InkFluidSimulation | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let frameId = 0;
    let lastFrameAt = performance.now();
    let lastAmbientFrameAt = 0;
    let lastDebugAt = 0;
    let energy = 0;
    let active = true;

    const showFallback = (reason: string) => {
      fallbackCanvas.classList.add('is-visible');
      canvas.classList.add('is-hidden');
      active = false;
      inkDebugWarn('fallback enabled', reason);
    };

    const ambientIsActive = () =>
      !reducedMotion &&
      !coarsePointer &&
      modeRef.current.ambientMotion > 0 &&
      coverVisibleRef.current;

    const scheduleFrame = () => {
      if (frameId === 0 && !document.hidden) {
        frameId = window.requestAnimationFrame(render);
      }
    };
    requestFrameRef.current = scheduleFrame;

    const enqueueSplat = (sample: InkSplat) => {
      pendingSplats.push(sample);
      if (pendingSplats.length > 32)
        pendingSplats.splice(0, pendingSplats.length - 32);
      scheduleFrame();
    };

    const beginStroke = (
      clientPosition: THREE.Vector2,
      position: THREE.Vector2,
      now: number,
    ) => {
      pointer.clientPosition.copy(clientPosition);
      pointer.lastEmissionClientPosition.copy(clientPosition);
      pointer.position.copy(position);
      pointer.speed = 0;
      pointer.pixelSpeed = 0;
      pointer.strokeTravel = 0;
      pointer.strokeGain = 0;
      pointer.active = true;
      pointer.hasSample = true;
      pointer.lastEventAt = now;
      pointer.lastMoveAt = now;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (coarsePointer && event.pointerType !== 'mouse') return;
      const now = performance.now();
      const clientPosition = new THREE.Vector2(event.clientX, event.clientY);
      const nextPosition = getPointerPositionFromClient(clientPosition);
      const startsNewStroke =
        !pointer.hasSample || now - pointer.lastEventAt > STROKE_IDLE_RESET_MS;
      if (startsNewStroke) {
        beginStroke(clientPosition, nextPosition, now);
        scheduleFrame();
        return;
      }

      const pixelDelta = clientPosition.clone().sub(pointer.clientPosition);
      const pixelDistance = pixelDelta.length();
      if (pixelDistance < 0.05) return;
      const elapsedSeconds = Math.max(
        0.001,
        (now - pointer.lastEventAt) / 1000,
      );
      const rawPixelSpeed = pixelDistance / elapsedSeconds;
      pointer.pixelSpeed = THREE.MathUtils.lerp(
        pointer.pixelSpeed,
        rawPixelSpeed,
        0.28,
      );
      pointer.strokeTravel += pixelDistance;
      pointer.strokeGain = smoothstep(
        STROKE_DEAD_ZONE_PX,
        STROKE_RAMP_END_PX,
        pointer.strokeTravel,
      );
      const normalizedSpeed = smoothstep(35, 650, pointer.pixelSpeed);
      pointer.speed = normalizedSpeed * pointer.strokeGain;
      pointer.clientPosition.copy(clientPosition);
      pointer.position.copy(nextPosition);
      pointer.active = true;
      pointer.lastEventAt = now;
      pointer.lastMoveAt = now;

      const distanceFromEmission = clientPosition.distanceTo(
        pointer.lastEmissionClientPosition,
      );
      if (
        !reducedMotion &&
        pointer.strokeGain > 0 &&
        distanceFromEmission >= STROKE_SAMPLE_SPACING_PX
      ) {
        const emissionStart = pointer.lastEmissionClientPosition.clone();
        const emissionDelta = clientPosition.clone().sub(emissionStart);
        const sampleCount = Math.min(
          8,
          Math.max(
            1,
            Math.ceil(distanceFromEmission / STROKE_SAMPLE_SPACING_PX),
          ),
        );
        const startPosition = getPointerPositionFromClient(emissionStart);
        const flowDirection = nextPosition.clone().sub(startPosition);
        if (flowDirection.lengthSq() > 0) flowDirection.normalize();
        const flowMagnitude = THREE.MathUtils.lerp(
          0.006,
          0.18,
          normalizedSpeed,
        );
        const forceStrength =
          (0.38 + normalizedSpeed * 0.68) * pointer.strokeGain;
        const pigmentStrength =
          (STROKE_PIGMENT_BASE_STRENGTH +
            normalizedSpeed * STROKE_PIGMENT_SPEED_STRENGTH) *
          pointer.strokeGain;

        for (let index = 1; index <= sampleCount; index += 1) {
          const sampleClientPosition = emissionStart
            .clone()
            .addScaledVector(emissionDelta, index / sampleCount);
          const samplePosition =
            getPointerPositionFromClient(sampleClientPosition);
          enqueueSplat({
            x: samplePosition.x,
            y: samplePosition.y,
            vx: flowDirection.x * flowMagnitude,
            vy: flowDirection.y * flowMagnitude,
            strength: forceStrength,
            pigmentStrength,
            pigmentRadius: STROKE_PIGMENT_RADIUS,
          });
        }
        pointer.lastEmissionClientPosition.copy(clientPosition);
      }
      scheduleFrame();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const now = performance.now();
      const clientPosition = new THREE.Vector2(event.clientX, event.clientY);
      const nextPosition = getPointerPosition(event);
      beginStroke(clientPosition, nextPosition, now);
      pointer.pulseAt = now;
      if (!reducedMotion) {
        const strength = event.pointerType === 'touch' ? 0.42 : 0.72;
        enqueueSplat({
          x: nextPosition.x,
          y: nextPosition.y,
          vx: 0,
          vy: 0,
          strength,
          pigmentStrength: strength,
          pigmentRadius: POINTER_DOWN_PIGMENT_RADIUS,
        });
      }
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.hasSample = false;
      pointer.speed = 0;
      pointer.pixelSpeed = 0;
      pointer.strokeTravel = 0;
      pointer.strokeGain = 0;
      scheduleFrame();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (frameId !== 0) window.cancelAnimationFrame(frameId);
        frameId = 0;
        return;
      }
      pointer.speed = 0;
      pointer.pixelSpeed = 0;
      pointer.strokeTravel = 0;
      pointer.strokeGain = 0;
      pointer.active = false;
      pointer.hasSample = false;
      lastFrameAt = performance.now();
      scheduleFrame();
    };

    const handleReducedMotion = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion && !pointer.active && pendingSplats.length === 0) {
        if (frameId !== 0) window.cancelAnimationFrame(frameId);
        frameId = 0;
        if (active && simulation) {
          simulation.setPresentation({
            modeStrength: modeRef.current.modeStrength,
            grainStrength: modeRef.current.grainStrength,
            ambientMotion: 0,
            pointer: pointer.position,
            pointerActive: false,
            pointerPulse: 0,
            pointerSpeed: 0,
            time: performance.now() / 1000,
          });
          simulation.render();
        }
        return;
      }
      scheduleFrame();
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      showFallback('WebGL context lost');
    };

    const resize = () => {
      renderer?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer?.setSize(window.innerWidth, window.innerHeight, false);
      simulation?.resize(window.innerWidth, window.innerHeight);
      fallbackContext = resizeFallback(fallbackCanvas);
      scheduleFrame();
    };

    const render = (time: number) => {
      frameId = 0;
      if (document.hidden) return;
      const now = time || performance.now();
      const animateAmbient = ambientIsActive();
      if (animateAmbient && now - lastAmbientFrameAt < 1000 / 30) {
        scheduleFrame();
        return;
      }
      if (animateAmbient) lastAmbientFrameAt = now;
      const delta = Math.min(
        0.035,
        Math.max(0.001, (now - lastFrameAt) / 1000),
      );
      lastFrameAt = now;
      const idleSeconds = pointer.lastMoveAt
        ? Math.max(0, (now - pointer.lastMoveAt) / 1000)
        : 10;
      const pointerSpeed = pointer.speed * Math.exp(-idleSeconds * 5.8);
      const pointerActive = pointer.active && idleSeconds < 0.3;
      const pointerPulse = pointer.pulseAt
        ? Math.exp((-Math.max(0, now - pointer.pulseAt) / 1000) * 2.4)
        : 0;
      const splats = pendingSplats.splice(
        Math.max(0, pendingSplats.length - 8),
        8,
      );
      pointer.speed = pointerSpeed;

      if (active && simulation) {
        const presentation: InkPresentationOptions = {
          ...modeRef.current,
          ambientMotion: animateAmbient ? modeRef.current.ambientMotion : 0,
          pointer: pointer.position,
          pointerActive,
          pointerPulse,
          pointerSpeed,
          time: now / 1000,
        };
        simulation.setPresentation(presentation);
        const fluidIsActive =
          energy > 0.008 ||
          splats.length > 0 ||
          pendingSplats.length > 0 ||
          pointerActive ||
          pointerPulse > 0.01;
        if (fluidIsActive) {
          const stepOptions: InkFluidStepOptions = {
            delta,
            splats,
            pointer: pointer.position,
            pointerActive,
            pointerPulse,
            pointerSpeed,
            modeStrength: modeRef.current.modeStrength,
          };
          energy = simulation.step(stepOptions, now / 1000);
        }
        simulation.render(now / 1000);
        if (debugPanel && now - lastDebugAt > 500) {
          updateDebugPanel(debugPanel, simulation, pointer);
          lastDebugAt = now;
        }
      } else if (fallbackContext) {
        drawFallback(fallbackContext, pointer, modeRef.current.modeStrength);
      }

      if (
        ambientIsActive() ||
        energy > 0.008 ||
        pendingSplats.length > 0 ||
        pointerActive ||
        pointerPulse > 0.01
      ) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    inkDebugLog('mount', {
      reducedMotion,
      coarsePointer,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      const gl = renderer.getContext();
      const version = String(gl.getParameter(gl.VERSION));
      if (!version.includes('WebGL 2'))
        throw new Error(`WebGL2 required, received ${version}`);
      if (!gl.getExtension('EXT_color_buffer_float')) {
        throw new Error(
          'EXT_color_buffer_float is required for fluid render targets',
        );
      }
      inkDebugLog('renderer created', {
        version,
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        renderer: gl.getParameter(gl.RENDERER),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      });
      if (import.meta.env.DEV) {
        renderer.debug.checkShaderErrors = true;
        renderer.debug.onShaderError = (
          context,
          program,
          vertexShader,
          fragmentShader,
        ) => {
          inkDebugError('shader compilation failed', {
            program: context.getProgramInfoLog(program),
            vertex: context.getShaderInfoLog(vertexShader),
            fragment: context.getShaderInfoLog(fragmentShader),
          });
        };
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.setClearColor(0x000000, 0);
      simulation = new InkFluidSimulation(
        renderer,
        window.innerWidth,
        window.innerHeight,
      );
      simulationRef.current = simulation;
      canvas.classList.remove('is-hidden');
      fallbackCanvas.classList.remove('is-visible');
      inkDebugLog('fluid simulation ready', simulation.getDebugInfo());
    } catch (error) {
      inkDebugError('fluid initialization failed', error);
      showFallback('initialization exception');
    }

    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    window.addEventListener('pointerdown', handlePointerDown, {
      passive: true,
    });
    window.addEventListener('pointerleave', handlePointerLeave, {
      passive: true,
    });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);
    reducedMotionQuery.addEventListener('change', handleReducedMotion);
    canvas.addEventListener('webglcontextlost', handleContextLost);

    if (fallbackContext)
      drawFallback(fallbackContext, pointer, modeRef.current.modeStrength);
    render(0);
    if (ambientIsActive()) scheduleFrame();

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      reducedMotionQuery.removeEventListener('change', handleReducedMotion);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      coverObserverRef.current?.disconnect();
      coverObserverRef.current = null;
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      requestFrameRef.current = null;
      simulationRef.current = null;
      debugPanel?.remove();
      simulation?.dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        id="webgl-canvas"
        className="webgl-canvas"
        aria-hidden="true"
      />
      <canvas
        ref={fallbackCanvasRef}
        className="ink-fallback-canvas"
        aria-hidden="true"
      />
    </>
  );
}
