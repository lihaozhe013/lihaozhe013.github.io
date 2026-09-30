import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  InkFluidSimulation,
  type InkFluidStepOptions,
  type InkPresentationOptions,
  type InkSplat,
} from '@/components/inkFluid';

const STROKE_IDLE_RESET_MS = 140;
const STROKE_DEAD_ZONE_PX = 3;
const STROKE_RAMP_END_PX = 14;
const STROKE_SAMPLE_SPACING_PX = 3.5;
const STROKE_PIGMENT_RADIUS = 0.0053;

interface InkCanvasProps {
  backgroundSrc: string;
  backgroundAlt: string;
}

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

function getLocalPoint(
  event: PointerEvent,
  host: HTMLElement,
): { client: THREE.Vector2; position: THREE.Vector2 } {
  const bounds = host.getBoundingClientRect();
  const client = new THREE.Vector2(event.clientX, event.clientY);
  return {
    client,
    position: getLocalPosition(client, bounds),
  };
}

function getLocalPosition(
  client: THREE.Vector2,
  bounds: DOMRect,
): THREE.Vector2 {
  return new THREE.Vector2(
    THREE.MathUtils.clamp((client.x - bounds.left) / bounds.width, 0, 1),
    THREE.MathUtils.clamp(1 - (client.y - bounds.top) / bounds.height, 0, 1),
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
  host: HTMLElement,
): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const bounds = host.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.max(1, Math.floor(bounds.width * dpr));
  canvas.height = Math.max(1, Math.floor(bounds.height * dpr));
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return context;
}

function drawFallback(
  context: CanvasRenderingContext2D | null,
  host: HTMLElement,
  position: THREE.Vector2,
  strength: number,
): void {
  if (!context) return;
  const bounds = host.getBoundingClientRect();
  const x = position.x * bounds.width;
  const y = (1 - position.y) * bounds.height;
  const radius = Math.max(bounds.width, bounds.height) * 0.3;
  context.clearRect(0, 0, bounds.width, bounds.height);
  const wash = context.createRadialGradient(x, y, 0, x, y, radius);
  wash.addColorStop(0, `rgba(41, 40, 36, ${0.19 * strength})`);
  wash.addColorStop(0.42, `rgba(98, 95, 88, ${0.1 * strength})`);
  wash.addColorStop(1, 'rgba(98, 95, 88, 0)');
  context.fillStyle = wash;
  context.fillRect(0, 0, bounds.width, bounds.height);
}

export default function InkCanvas({
  backgroundSrc,
  backgroundAlt,
}: InkCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
      setImageReady(true);
    }
  }, [backgroundSrc]);

  useEffect(() => {
    const host = hostRef.current;
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const fallbackCanvas = fallbackCanvasRef.current;
    if (!host || !image || !canvas || !fallbackCanvas || !imageReady) return;

    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const pointer = createPointerState();
    const pendingSplats: InkSplat[] = [];
    const texture = new THREE.Texture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    let fallbackContext = resizeFallback(fallbackCanvas, host);
    let simulation: InkFluidSimulation | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let frameId = 0;
    let frameTimer = 0;
    let lastFrameAt = performance.now();
    let lastAmbientFrameAt = 0;
    let energy = 0;
    let active = true;
    let visible = true;
    let reducedMotion = reducedMotionQuery.matches;

    const mode = {
      modeStrength: 0.5,
      grainStrength: 0.68,
      ambientMotion: 1,
    };

    const showFallback = () => {
      fallbackCanvas.classList.add('is-visible');
      canvas.classList.add('is-hidden');
      active = false;
    };

    const scheduleFrame = () => {
      if (frameId === 0 && !document.hidden && visible && frameTimer === 0) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    const scheduleAmbientFrame = () => {
      if (frameTimer !== 0 || document.hidden || !visible || reducedMotion) {
        return;
      }
      frameTimer = window.setTimeout(() => {
        frameTimer = 0;
        scheduleFrame();
      }, 33);
    };

    const enqueueSplat = (sample: InkSplat) => {
      pendingSplats.push(sample);
      if (pendingSplats.length > 32) {
        pendingSplats.splice(0, pendingSplats.length - 32);
      }
      scheduleFrame();
    };

    const beginStroke = (
      client: THREE.Vector2,
      position: THREE.Vector2,
      now: number,
    ) => {
      pointer.clientPosition.copy(client);
      pointer.lastEmissionClientPosition.copy(client);
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
      const { client, position } = getLocalPoint(event, host);
      if (!active) {
        if (!reducedMotion) {
          drawFallback(fallbackContext, host, position, 0.72);
        }
        return;
      }
      const now = performance.now();
      const startsNewStroke =
        !pointer.hasSample || now - pointer.lastEventAt > STROKE_IDLE_RESET_MS;
      if (startsNewStroke) {
        beginStroke(client, position, now);
        scheduleFrame();
        return;
      }

      const delta = client.clone().sub(pointer.clientPosition);
      const distance = delta.length();
      if (distance < 0.05) return;
      const elapsedSeconds = Math.max(
        0.001,
        (now - pointer.lastEventAt) / 1000,
      );
      const rawPixelSpeed = distance / elapsedSeconds;
      pointer.pixelSpeed = THREE.MathUtils.lerp(
        pointer.pixelSpeed,
        rawPixelSpeed,
        0.28,
      );
      pointer.strokeTravel += distance;
      pointer.strokeGain = smoothstep(
        STROKE_DEAD_ZONE_PX,
        STROKE_RAMP_END_PX,
        pointer.strokeTravel,
      );
      const normalizedSpeed = smoothstep(35, 650, pointer.pixelSpeed);
      pointer.speed = normalizedSpeed * pointer.strokeGain;
      pointer.clientPosition.copy(client);
      pointer.position.copy(position);
      pointer.active = true;
      pointer.lastEventAt = now;
      pointer.lastMoveAt = now;

      const distanceFromEmission = client.distanceTo(
        pointer.lastEmissionClientPosition,
      );
      if (
        !reducedMotion &&
        pointer.strokeGain > 0 &&
        distanceFromEmission >= STROKE_SAMPLE_SPACING_PX
      ) {
        const emissionStart = pointer.lastEmissionClientPosition.clone();
        const emissionDelta = client.clone().sub(emissionStart);
        const sampleCount = Math.min(
          8,
          Math.max(
            1,
            Math.ceil(distanceFromEmission / STROKE_SAMPLE_SPACING_PX),
          ),
        );
        const bounds = host.getBoundingClientRect();
        const startPoint = getLocalPosition(emissionStart, bounds);
        const flowDirection = position.clone().sub(startPoint);
        if (flowDirection.lengthSq() > 0) flowDirection.normalize();
        const flowMagnitude = THREE.MathUtils.lerp(
          0.006,
          0.18,
          normalizedSpeed,
        );
        const forceStrength =
          (0.38 + normalizedSpeed * 0.68) * pointer.strokeGain;
        const pigmentStrength =
          (0.2 + normalizedSpeed * 0.9) * pointer.strokeGain;
        for (let index = 1; index <= sampleCount; index += 1) {
          const sampleClient = emissionStart
            .clone()
            .addScaledVector(emissionDelta, index / sampleCount);
          const sample = getLocalPosition(sampleClient, bounds);
          enqueueSplat({
            x: sample.x,
            y: sample.y,
            vx: flowDirection.x * flowMagnitude,
            vy: flowDirection.y * flowMagnitude,
            strength: forceStrength,
            pigmentStrength,
            pigmentRadius: STROKE_PIGMENT_RADIUS,
          });
        }
        pointer.lastEmissionClientPosition.copy(client);
      }
      scheduleFrame();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const { client, position } = getLocalPoint(event, host);
      const now = performance.now();
      beginStroke(client, position, now);
      pointer.pulseAt = now;
      if (!active) {
        if (!reducedMotion) {
          drawFallback(fallbackContext, host, position, 1);
          window.setTimeout(() => {
            fallbackContext?.clearRect(
              0,
              0,
              host.getBoundingClientRect().width,
              host.getBoundingClientRect().height,
            );
          }, 450);
        }
        return;
      }
      if (!reducedMotion) {
        const strength = event.pointerType === 'touch' ? 0.42 : 0.72;
        enqueueSplat({
          x: position.x,
          y: position.y,
          vx: 0,
          vy: 0,
          strength,
          pigmentStrength: strength,
          pigmentRadius: STROKE_PIGMENT_RADIUS * 2,
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
        if (frameTimer !== 0) window.clearTimeout(frameTimer);
        frameId = 0;
        frameTimer = 0;
        return;
      }
      pointer.active = false;
      pointer.hasSample = false;
      lastFrameAt = performance.now();
      scheduleFrame();
    };

    const handleReducedMotion = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion && frameTimer !== 0) {
        window.clearTimeout(frameTimer);
        frameTimer = 0;
      }
      if (!reducedMotion) scheduleAmbientFrame();
      scheduleFrame();
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      showFallback();
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      renderer?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer?.setSize(width, height, false);
      simulation?.resize(width, height);
      fallbackContext = resizeFallback(fallbackCanvas, host);
      scheduleFrame();
    };

    const render = (time: number) => {
      frameId = 0;
      if (document.hidden || !visible) return;
      const now = time || performance.now();
      if (!reducedMotion && now - lastAmbientFrameAt < 1000 / 30) {
        scheduleAmbientFrame();
        return;
      }
      lastAmbientFrameAt = now;
      const delta = Math.min(
        0.035,
        Math.max(0.001, (now - lastFrameAt) / 1000),
      );
      lastFrameAt = now;
      const idleSeconds = pointer.lastMoveAt
        ? Math.max(0, (now - pointer.lastMoveAt) / 1000)
        : 10;
      const pointerSpeed = pointer.speed * Math.exp(-idleSeconds * 5.8);
      const pointerActive =
        !reducedMotion && pointer.active && idleSeconds < 0.3;
      const pointerPulse =
        !reducedMotion && pointer.pulseAt
          ? Math.exp((-Math.max(0, now - pointer.pulseAt) / 1000) * 2.4)
          : 0;
      const splats = pendingSplats.splice(
        Math.max(0, pendingSplats.length - 8),
        8,
      );
      pointer.speed = pointerSpeed;

      if (active && simulation) {
        const presentation: InkPresentationOptions = {
          ...mode,
          ambientMotion: reducedMotion ? 0 : mode.ambientMotion,
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
            modeStrength: mode.modeStrength,
          };
          energy = simulation.step(stepOptions, now / 1000);
        }
        simulation.render(now / 1000);
      }

      if (!reducedMotion) scheduleAmbientFrame();
      if (
        energy > 0.008 ||
        pendingSplats.length > 0 ||
        pointerActive ||
        pointerPulse > 0.01
      ) {
        scheduleFrame();
      }
    };

    let intersectionObserver: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) {
            lastFrameAt = performance.now();
            scheduleFrame();
          } else {
            if (frameId !== 0) window.cancelAnimationFrame(frameId);
            if (frameTimer !== 0) window.clearTimeout(frameTimer);
            frameId = 0;
            frameTimer = 0;
          }
        },
        { threshold: 0.02 },
      );
      intersectionObserver.observe(host);
    }

    try {
      if (coarsePointer || reducedMotion)
        throw new Error('static presentation');
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      const gl = renderer.getContext();
      const version = String(gl.getParameter(gl.VERSION));
      if (!version.includes('WebGL 2')) {
        throw new Error(`WebGL2 required, received ${version}`);
      }
      if (!gl.getExtension('EXT_color_buffer_float')) {
        throw new Error('EXT_color_buffer_float is required');
      }
      const bounds = host.getBoundingClientRect();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(bounds.width, bounds.height, false);
      renderer.setClearColor(0x000000, 0);
      simulation = new InkFluidSimulation(
        renderer,
        bounds.width,
        bounds.height,
      );
      simulation.setBackgroundTexture(
        texture,
        image.naturalWidth / image.naturalHeight,
      );
      canvas.classList.remove('is-hidden');
      fallbackCanvas.classList.remove('is-visible');
    } catch {
      showFallback();
    }

    host.addEventListener('pointermove', handlePointerMove, { passive: true });
    host.addEventListener('pointerdown', handlePointerDown, { passive: true });
    host.addEventListener('pointerleave', handlePointerLeave, {
      passive: true,
    });
    document.addEventListener('visibilitychange', handleVisibility);
    reducedMotionQuery.addEventListener('change', handleReducedMotion);
    canvas.addEventListener('webglcontextlost', handleContextLost);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    fallbackCanvas.classList.toggle('is-visible', !active);
    if (fallbackContext && !active) {
      fallbackContext.clearRect(
        0,
        0,
        host.getBoundingClientRect().width,
        host.getBoundingClientRect().height,
      );
    }
    scheduleFrame();
    if (!reducedMotion && active) scheduleAmbientFrame();

    return () => {
      host.removeEventListener('pointermove', handlePointerMove);
      host.removeEventListener('pointerdown', handlePointerDown);
      host.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
      reducedMotionQuery.removeEventListener('change', handleReducedMotion);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      intersectionObserver?.disconnect();
      resizeObserver.disconnect();
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      if (frameTimer !== 0) window.clearTimeout(frameTimer);
      simulation?.dispose();
      renderer?.dispose();
      texture.dispose();
    };
  }, [imageReady]);

  return (
    <div className="ink-art-canvas" ref={hostRef}>
      <img
        ref={imageRef}
        className="ink-art-image"
        src={backgroundSrc}
        alt={backgroundAlt}
        draggable={false}
        onLoad={() => setImageReady(true)}
      />
      <canvas
        ref={canvasRef}
        className="webgl-canvas is-hidden"
        aria-hidden="true"
      />
      <canvas
        ref={fallbackCanvasRef}
        className="ink-fallback-canvas"
        aria-hidden="true"
      />
    </div>
  );
}
