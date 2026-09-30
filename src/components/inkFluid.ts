import * as THREE from 'three';

export interface InkSplat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  strength: number;
  pigmentStrength: number;
  pigmentRadius: number;
}

export interface InkFluidStepOptions {
  delta: number;
  splats: InkSplat[];
  pointer: THREE.Vector2;
  pointerActive: boolean;
  pointerPulse: number;
  pointerSpeed: number;
  modeStrength: number;
}

export interface InkPresentationOptions {
  modeStrength: number;
  grainStrength: number;
  ambientMotion: number;
  pointer: THREE.Vector2;
  pointerActive: boolean;
  pointerPulse: number;
  pointerSpeed: number;
  time: number;
}

const MAX_SPLATS = 8;
const PARTICLE_TEXTURE_WIDTH = 128;
const PARTICLE_TEXTURE_HEIGHT = 64;
const PARTICLE_COUNT = PARTICLE_TEXTURE_WIDTH * PARTICLE_TEXTURE_HEIGHT;
const PIGMENT_DIFFUSION_SCALE = 4 / 3;
const PIGMENT_DECAY_RATE_SCALE = 3 / 2;
const PIGMENT_ADVECTION_FACTOR = 0.64 * PIGMENT_DIFFUSION_SCALE;
const PARTICLE_LIFETIME_SCALE = 2 / 3;
const FLOW_RADIUS_MULTIPLIER = 1.6;

const fullscreenVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const splatUniformShader = Array.from(
  { length: MAX_SPLATS },
  (_, index) =>
    `uniform vec4 uSplat${index};\nuniform float uSplatStrength${index};\nuniform float uSplatPigmentStrength${index};\nuniform float uSplatPigmentRadius${index};`,
).join('\n  ');

const splatLoopShader = Array.from(
  { length: MAX_SPLATS },
  (_, index) => `
    if (${index} < uSplatCount) {
      vec4 splat = uSplat${index};
      float strength = uSplatStrength${index};
      vec2 offset = vUv - splat.xy;
      offset.x *= uAspect;
      float radius = max(uSplatPigmentRadius${index} * ${FLOW_RADIUS_MULTIPLIER.toFixed(2)}, 0.004);
      float brush = exp(-dot(offset, offset) / (radius * radius));
      float edge = exp(-pow(length(offset) - radius * 1.45, 2.0) / (radius * radius * 0.52));
      vec2 tangent = vec2(-offset.y, offset.x);
      inkSplat${index}(splat, strength, brush, edge, tangent, value);
    }`,
).join('\n');

const velocityFragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  uniform float uAspect;
  uniform float uDelta;
  uniform int uSplatCount;
  ${splatUniformShader}
  varying vec2 vUv;

  void inkSplat0(vec4 splat, float strength, float brush, float edge, vec2 tangent, inout vec2 value) {
    vec2 offset = vUv - splat.xy;
    offset.x *= uAspect;
    vec2 radial = normalize(offset + vec2(0.0001));
    value += (splat.zw * 3.8 + tangent * (0.34 + length(splat.zw) * 2.5)) * brush * strength;
    value += radial * edge * strength * 0.22;
  }

  void inkSplat1(vec4 splat, float strength, float brush, float edge, vec2 tangent, inout vec2 value) {
    vec2 offset = vUv - splat.xy;
    offset.x *= uAspect;
    vec2 radial = normalize(offset + vec2(0.0001));
    value += (splat.zw * 3.8 + tangent * (0.34 + length(splat.zw) * 2.5)) * brush * strength;
    value += radial * edge * strength * 0.22;
  }

  void inkSplat2(vec4 splat, float strength, float brush, float edge, vec2 tangent, inout vec2 value) {
    vec2 offset = vUv - splat.xy;
    offset.x *= uAspect;
    vec2 radial = normalize(offset + vec2(0.0001));
    value += (splat.zw * 3.8 + tangent * (0.34 + length(splat.zw) * 2.5)) * brush * strength;
    value += radial * edge * strength * 0.22;
  }

  void inkSplat3(vec4 splat, float strength, float brush, float edge, vec2 tangent, inout vec2 value) {
    vec2 offset = vUv - splat.xy;
    offset.x *= uAspect;
    vec2 radial = normalize(offset + vec2(0.0001));
    value += (splat.zw * 3.8 + tangent * (0.34 + length(splat.zw) * 2.5)) * brush * strength;
    value += radial * edge * strength * 0.22;
  }

  void inkSplat4(vec4 splat, float strength, float brush, float edge, vec2 tangent, inout vec2 value) {
    vec2 offset = vUv - splat.xy;
    offset.x *= uAspect;
    vec2 radial = normalize(offset + vec2(0.0001));
    value += (splat.zw * 3.8 + tangent * (0.34 + length(splat.zw) * 2.5)) * brush * strength;
    value += radial * edge * strength * 0.22;
  }

  void inkSplat5(vec4 splat, float strength, float brush, float edge, vec2 tangent, inout vec2 value) {
    vec2 offset = vUv - splat.xy;
    offset.x *= uAspect;
    vec2 radial = normalize(offset + vec2(0.0001));
    value += (splat.zw * 3.8 + tangent * (0.34 + length(splat.zw) * 2.5)) * brush * strength;
    value += radial * edge * strength * 0.22;
  }

  void inkSplat6(vec4 splat, float strength, float brush, float edge, vec2 tangent, inout vec2 value) {
    vec2 offset = vUv - splat.xy;
    offset.x *= uAspect;
    vec2 radial = normalize(offset + vec2(0.0001));
    value += (splat.zw * 3.8 + tangent * (0.34 + length(splat.zw) * 2.5)) * brush * strength;
    value += radial * edge * strength * 0.22;
  }

  void inkSplat7(vec4 splat, float strength, float brush, float edge, vec2 tangent, inout vec2 value) {
    vec2 offset = vUv - splat.xy;
    offset.x *= uAspect;
    vec2 radial = normalize(offset + vec2(0.0001));
    value += (splat.zw * 3.8 + tangent * (0.34 + length(splat.zw) * 2.5)) * brush * strength;
    value += radial * edge * strength * 0.22;
  }

  void main() {
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    vec2 backtrace = clamp(vUv - velocity * uDelta * 0.72, 0.001, 0.999);
    vec2 value = texture2D(uVelocity, backtrace).xy;
    value *= exp(-uDelta * 0.68);
    ${Array.from({ length: MAX_SPLATS }, (_, index) => `inkSplat${index}(uSplat${index}, uSplatStrength${index}, 0.0, 0.0, vec2(0.0), value);`).join('\n    ')}

    ${splatLoopShader}
    gl_FragColor = vec4(clamp(value, vec2(-2.0), vec2(2.0)), 0.0, 1.0);
  }
`;

const divergenceFragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  varying vec2 vUv;

  void main() {
    float left = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
    float right = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
    float bottom = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
    float top = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
    gl_FragColor = vec4(0.5 * (right - left + top - bottom), 0.0, 0.0, 1.0);
  }
`;

const pressureFragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexel;
  varying vec2 vUv;

  void main() {
    float left = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float right = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float bottom = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float top = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    float divergence = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((left + right + bottom + top - divergence) * 0.25, 0.0, 0.0, 1.0);
  }
`;

const gradientFragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uPressure;
  uniform vec2 uTexel;
  varying vec2 vUv;

  void main() {
    float left = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float right = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float bottom = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float top = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity -= vec2(right - left, top - bottom) * 0.5;
    gl_FragColor = vec4(velocity * 0.995, 0.0, 1.0);
  }
`;

const pigmentFragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uPigment;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  uniform float uAspect;
  uniform float uDelta;
  uniform int uSplatCount;
  ${splatUniformShader}
  varying vec2 vUv;

  float paperNoise(vec2 point) {
    return fract(sin(dot(point, vec2(41.17, 289.23))) * 43758.5453);
  }

  void main() {
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    vec2 backtrace = clamp(vUv - velocity * uDelta * ${PIGMENT_ADVECTION_FACTOR.toFixed(6)}, 0.001, 0.999);
    vec4 value = texture2D(uPigment, backtrace);
    vec4 north = texture2D(uPigment, vUv + vec2(0.0, uTexel.y));
    vec4 south = texture2D(uPigment, vUv - vec2(0.0, uTexel.y));
    vec4 east = texture2D(uPigment, vUv + vec2(uTexel.x, 0.0));
    vec4 west = texture2D(uPigment, vUv - vec2(uTexel.x, 0.0));
    float wetness = clamp(value.g, 0.0, 1.0);
    float diffusion = (0.04 + wetness * 0.14) * ${PIGMENT_DIFFUSION_SCALE.toFixed(6)};
    value = mix(value, (north + south + east + west) * 0.25, diffusion * uDelta * 5.0);
    value.r *= exp(-uDelta * mix(0.18, 0.38, 1.0 - wetness) * ${PIGMENT_DECAY_RATE_SCALE.toFixed(6)});
    value.g *= exp(-uDelta * 0.42 * ${PIGMENT_DECAY_RATE_SCALE.toFixed(6)});
    value.b = max(value.b * exp(-uDelta * 0.25 * ${PIGMENT_DECAY_RATE_SCALE.toFixed(6)}), 0.0);
    float strokeDensity = 0.0;
    float strokeWetness = 0.0;
    float strokeGranulation = 0.0;

    ${Array.from(
      { length: MAX_SPLATS },
      (_, index) => `
    if (${index} < uSplatCount) {
      vec4 splat${index} = uSplat${index};
      vec2 offset${index} = vUv - splat${index}.xy;
      offset${index}.x *= uAspect;
      float speed${index} = clamp(length(splat${index}.zw) * 18.0, 0.0, 1.0);
      float radius${index} = uSplatPigmentRadius${index};
      float brush${index} = exp(-dot(offset${index}, offset${index}) / (radius${index} * radius${index}));
      float rim${index} = exp(-pow(length(offset${index}) - radius${index} * 1.35, 2.0) / (radius${index} * radius${index} * 0.42));
      float deposit${index} = uSplatPigmentStrength${index} * (brush${index} * mix(0.68, 0.3, speed${index}) + rim${index} * 0.15);
      strokeDensity = max(strokeDensity, deposit${index});
      strokeWetness = max(strokeWetness, deposit${index} * 1.35);
      strokeGranulation = max(strokeGranulation, rim${index} * uSplatPigmentStrength${index} * (0.3 + paperNoise(vUv * 240.0) * 0.8));
    }`,
    ).join('\n')}

    value.r = max(value.r, strokeDensity);
    value.g = max(value.g, min(1.0, strokeWetness));
    value.b = max(value.b, strokeGranulation);

    gl_FragColor = vec4(clamp(value, 0.0, 1.0));
  }
`;

const particleUpdateFragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uParticles;
  uniform sampler2D uSeed;
  uniform sampler2D uVelocity;
  uniform sampler2D uPigment;
  uniform vec2 uPointer;
  uniform float uPointerActive;
  uniform float uPointerPulse;
  uniform float uPointerSpeed;
  uniform float uAspect;
  uniform float uDelta;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec4 state = texture2D(uParticles, vUv);
    vec4 seed = texture2D(uSeed, vUv);
    vec2 position = state.xy;
    float life = state.w - uDelta;
    float pointerEnergy = max(uPointerSpeed, uPointerPulse * 0.72) * uPointerActive;
    vec2 spawnOffset = position - uPointer;
    spawnOffset.x *= uAspect;
    float spawnDistance = length(spawnOffset);
    float spawn = step(spawnDistance, 0.025 + uPointerSpeed * 0.02) * pointerEnergy;

    if (life <= 0.0 && spawn > 0.02) {
      vec2 jitter = (seed.xy - 0.5) * (0.012 + uPointerSpeed * 0.012);
      jitter.x /= uAspect;
      position = clamp(uPointer + jitter, vec2(0.002), vec2(0.998));
      life = mix(0.35, 1.55, seed.z) * (0.7 + pointerEnergy * 0.5) * ${PARTICLE_LIFETIME_SCALE.toFixed(6)};
    }

    if (life > 0.0) {
      vec2 velocity = texture2D(uVelocity, position).xy;
      float pigment = texture2D(uPigment, position).r;
      vec2 drift = velocity * uDelta * (0.7 + pigment * 0.8);
      vec2 noise = vec2(
        sin(uTime * 1.6 + seed.x * 31.0),
        cos(uTime * 1.3 + seed.y * 29.0)
      ) * uDelta * 0.012;
      position = clamp(position + drift + noise, vec2(0.001), vec2(0.999));
    } else {
      position = vec2(seed.x, seed.y);
    }

    gl_FragColor = vec4(position, seed.z, life);
  }
`;

const particleVertexShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uParticles;
  uniform float uAspect;
  uniform float uMode;
  uniform float uParticleSize;
  attribute vec2 aParticleUv;
  attribute float aSeed;
  varying float vLife;
  varying float vSeed;

  void main() {
    vec4 state = texture2D(uParticles, aParticleUv);
    vec3 point = vec3((state.x - 0.5) * 2.0 * uAspect, (state.y - 0.5) * 2.0, state.z * 0.2);
    vec4 mvPosition = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uParticleSize * (0.55 + state.w * 1.8) * (1.0 + aSeed * 0.45) * uMode;
    vLife = clamp(state.w, 0.0, 1.0);
    vSeed = aSeed;
  }
`;

const particleFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uMode;
  uniform float uPointerSpeed;
  uniform vec3 uParticleColor;
  varying float vLife;
  varying float vSeed;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float distanceToCenter = length(point);
    float softness = smoothstep(0.5, 0.05, distanceToCenter);
    vec3 color = uParticleColor * (0.82 + vSeed * 0.18);
    float alpha = softness * vLife * (0.035 + uPointerSpeed * 0.07) * uMode;
    if (alpha < 0.001) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

const compositeFragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uPigment;
  uniform sampler2D uVelocity;
  uniform vec2 uResolution;
  uniform float uAspect;
  uniform float uMode;
  uniform float uGrainStrength;
  uniform float uAmbientMotion;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPointerPulse;
  uniform float uPointerActive;
  uniform vec3 uBaseColor;
  uniform vec3 uHazeColor;
  uniform vec3 uPigmentMidColor;
  uniform vec3 uPigmentCoreColor;
  varying vec2 vUv;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x),
      local.y
    );
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int index = 0; index < 4; index++) {
      value += amplitude * noise(point);
      point = point * 2.03 + vec2(13.2, 7.1);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 point = (vUv - 0.5) * vec2(uAspect, 1.0);
    vec2 pointerPoint = (uPointer - 0.5) * vec2(uAspect, 1.0);
    vec2 pointerDelta = point - pointerPoint;
    float pointerWake = exp(-dot(pointerDelta, pointerDelta) * 8.0) * max(uPointerActive, uPointerPulse);
    vec2 flow = texture2D(uVelocity, vUv).xy;
    float sway = sin(uTime * 0.18) * uAmbientMotion;
    vec2 warpedPoint = point + flow * 0.05
      + vec2(sway * 0.07, cos(uTime * 0.14) * uAmbientMotion * 0.025)
      + pointerDelta * pointerWake * 0.035;
    vec2 cloudA = (warpedPoint - vec2(-0.31 + sway * 0.15, 0.22)) * vec2(1.15, 1.8);
    vec2 cloudB = (warpedPoint - vec2(0.36 - sway * 0.1, -0.06)) * vec2(1.45, 1.3);
    vec2 cloudC = (warpedPoint - vec2(-0.02, -0.58 + sway * 0.12)) * vec2(0.72, 1.8);
    float haze = exp(-dot(cloudA, cloudA) * 1.05) * 0.68
      + exp(-dot(cloudB, cloudB) * 1.18) * 0.56
      + exp(-dot(cloudC, cloudC) * 1.2) * 0.44
      + pointerWake * 0.24;
    float cloudGrain = fbm(warpedPoint * 1.3 + vec2(sway * 0.25, 0.0));
    float light = clamp((haze * 0.47 + smoothstep(0.3, 0.72, cloudGrain) * 0.14) * uMode, 0.0, 0.66);
    vec3 background = mix(uBaseColor, uHazeColor, light);
    vec2 grainSize = max(uResolution / 1800.0, vec2(1.0));
    float grain = hash(floor(gl_FragCoord.xy / grainSize));
    background += (grain - 0.5) * 0.15 * uGrainStrength;
    vec4 pigment = texture2D(uPigment, vUv);
    float pigmentDensity = clamp(pigment.r, 0.0, 1.0);
    float wetness = clamp(pigment.g, 0.0, 1.0);
    float granulation = noise(vUv * 280.0 + pigment.b * 20.0);
    float pigmentEdge = smoothstep(0.2, 0.86, pigmentDensity) * (0.8 + granulation * 0.2);
    float rim = smoothstep(0.14, 0.42, length(flow)) * pigmentDensity * 0.2;
    float inkAmount = clamp(pigmentDensity * 0.9 + wetness * 0.08 + rim, 0.0, 0.96);
    vec3 pigmentColor = mix(uPigmentMidColor, uPigmentCoreColor, smoothstep(0.14, 0.72, pigmentDensity));
    vec3 ink = mix(pigmentColor, uPigmentCoreColor, pigmentEdge * 0.18);
    gl_FragColor = vec4(mix(background, ink, inkAmount), 1.0);
  }
`;

function createRenderTarget(
  width: number,
  height: number,
  type: THREE.TextureDataType,
): THREE.WebGLRenderTarget {
  const target = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type,
    depthBuffer: false,
    stencilBuffer: false,
  });
  target.texture.wrapS = THREE.ClampToEdgeWrapping;
  target.texture.wrapT = THREE.ClampToEdgeWrapping;
  return target;
}

function createSplatUniforms(): Record<string, THREE.IUniform> {
  const uniforms: Record<string, THREE.IUniform> = {
    uSplatCount: { value: 0 },
  };
  for (let index = 0; index < MAX_SPLATS; index += 1) {
    uniforms[`uSplat${index}`] = { value: new THREE.Vector4() };
    uniforms[`uSplatStrength${index}`] = { value: 0 };
    uniforms[`uSplatPigmentStrength${index}`] = { value: 0 };
    uniforms[`uSplatPigmentRadius${index}`] = { value: 0.016 };
  }
  return uniforms;
}

function clearTarget(
  renderer: THREE.WebGLRenderer,
  target: THREE.WebGLRenderTarget,
): void {
  renderer.setRenderTarget(target);
  renderer.clear(true, true, true);
}

function readThemeColor(name: string, fallback: string): THREE.Vector3 {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const hex = /^#[\da-f]{6}$/i.test(value) ? value : fallback;
  const channel = (offset: number) =>
    parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return new THREE.Vector3(channel(1), channel(3), channel(5));
}

export class InkFluidSimulation {
  readonly particleCount = PARTICLE_COUNT;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly passScene = new THREE.Scene();
  private readonly displayScene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  private readonly fullscreenGeometry = new THREE.PlaneGeometry(2, 2);
  private readonly passMesh = new THREE.Mesh(this.fullscreenGeometry);
  private readonly velocityMaterial: THREE.ShaderMaterial;
  private readonly divergenceMaterial: THREE.ShaderMaterial;
  private readonly pressureMaterial: THREE.ShaderMaterial;
  private readonly gradientMaterial: THREE.ShaderMaterial;
  private readonly pigmentMaterial: THREE.ShaderMaterial;
  private readonly particleUpdateMaterial: THREE.ShaderMaterial;
  private readonly compositeMaterial: THREE.ShaderMaterial;
  private readonly particleMaterial: THREE.ShaderMaterial;
  private readonly particleGeometry: THREE.BufferGeometry;
  private readonly seedTexture: THREE.DataTexture;
  private readonly velocityTargets: [
    THREE.WebGLRenderTarget,
    THREE.WebGLRenderTarget,
  ];
  private readonly pigmentTargets: [
    THREE.WebGLRenderTarget,
    THREE.WebGLRenderTarget,
  ];
  private readonly pressureTargets: [
    THREE.WebGLRenderTarget,
    THREE.WebGLRenderTarget,
  ];
  private readonly divergenceTarget: THREE.WebGLRenderTarget;
  private readonly particleTargets: [
    THREE.WebGLRenderTarget,
    THREE.WebGLRenderTarget,
  ];
  private velocityRead = 0;
  private pigmentRead = 0;
  private pressureRead = 0;
  private particleTexture: THREE.Texture;
  private particleWrite = 0;
  private width = 1;
  private height = 1;
  private aspect = 1;
  private energy = 0;
  private readonly splatUniforms: Record<string, THREE.IUniform>;
  private readonly debug = new Map<string, number>();

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.renderer = renderer;
    this.camera.position.z = 1;
    this.passScene.add(this.passMesh);
    this.velocityTargets = [
      createRenderTarget(1, 1, THREE.HalfFloatType),
      createRenderTarget(1, 1, THREE.HalfFloatType),
    ];
    this.pigmentTargets = [
      createRenderTarget(1, 1, THREE.HalfFloatType),
      createRenderTarget(1, 1, THREE.HalfFloatType),
    ];
    this.pressureTargets = [
      createRenderTarget(1, 1, THREE.HalfFloatType),
      createRenderTarget(1, 1, THREE.HalfFloatType),
    ];
    this.divergenceTarget = createRenderTarget(1, 1, THREE.HalfFloatType);
    this.particleTargets = [
      createRenderTarget(
        PARTICLE_TEXTURE_WIDTH,
        PARTICLE_TEXTURE_HEIGHT,
        THREE.FloatType,
      ),
      createRenderTarget(
        PARTICLE_TEXTURE_WIDTH,
        PARTICLE_TEXTURE_HEIGHT,
        THREE.FloatType,
      ),
    ];
    this.seedTexture = this.createSeedTexture();
    this.particleTexture = this.seedTexture;
    this.splatUniforms = createSplatUniforms();

    this.velocityMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uVelocity: { value: null },
        uTexel: { value: new THREE.Vector2() },
        uAspect: { value: 1 },
        uDelta: { value: 0 },
        ...this.splatUniforms,
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: velocityFragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    this.divergenceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uVelocity: { value: null },
        uTexel: { value: new THREE.Vector2() },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: divergenceFragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    this.pressureMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPressure: { value: null },
        uDivergence: { value: null },
        uTexel: { value: new THREE.Vector2() },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: pressureFragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    this.gradientMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uVelocity: { value: null },
        uPressure: { value: null },
        uTexel: { value: new THREE.Vector2() },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: gradientFragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    this.pigmentMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPigment: { value: null },
        uVelocity: { value: null },
        uTexel: { value: new THREE.Vector2() },
        uAspect: { value: 1 },
        uDelta: { value: 0 },
        ...this.splatUniforms,
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: pigmentFragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    this.particleUpdateMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uParticles: { value: null },
        uSeed: { value: this.seedTexture },
        uVelocity: { value: null },
        uPigment: { value: null },
        uPointer: { value: new THREE.Vector2() },
        uPointerActive: { value: 0 },
        uPointerPulse: { value: 0 },
        uPointerSpeed: { value: 0 },
        uAspect: { value: 1 },
        uDelta: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: particleUpdateFragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPigment: { value: null },
        uVelocity: { value: null },
        uResolution: { value: new THREE.Vector2(width, height) },
        uAspect: { value: 1 },
        uMode: { value: 1 },
        uGrainStrength: { value: 0.36 },
        uAmbientMotion: { value: 0 },
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2() },
        uPointerPulse: { value: 0 },
        uPointerActive: { value: 0 },
        uBaseColor: { value: readThemeColor('--shader-base', '#262626') },
        uHazeColor: { value: readThemeColor('--shader-haze', '#777777') },
        uPigmentMidColor: {
          value: readThemeColor('--shader-ink-mid', '#b7b7b3'),
        },
        uPigmentCoreColor: {
          value: readThemeColor('--shader-ink-core', '#191919'),
        },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: compositeFragmentShader,
      transparent: false,
      depthWrite: false,
      depthTest: false,
    });
    this.displayScene.add(
      new THREE.Mesh(this.fullscreenGeometry, this.compositeMaterial),
    );

    this.particleGeometry = this.createParticleGeometry();
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uParticles: { value: this.seedTexture },
        uAspect: { value: 1 },
        uMode: { value: 1 },
        uParticleSize: { value: 3.6 },
        uPointerSpeed: { value: 0 },
        uParticleColor: {
          value: readThemeColor('--shader-particle', '#ededeb'),
        },
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    this.displayScene.add(
      new THREE.Points(this.particleGeometry, this.particleMaterial),
    );
    this.resize(width, height);
    this.compositeMaterial.uniforms.uPigment.value =
      this.pigmentTargets[this.pigmentRead].texture;
    this.compositeMaterial.uniforms.uVelocity.value =
      this.velocityTargets[this.velocityRead].texture;
  }

  private createSeedTexture(): THREE.DataTexture {
    const data = new Float32Array(PARTICLE_COUNT * 4);
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const offset = index * 4;
      data[offset] = Math.random();
      data[offset + 1] = Math.random();
      data[offset + 2] = Math.random();
      data[offset + 3] = 0;
    }
    const texture = new THREE.DataTexture(
      data,
      PARTICLE_TEXTURE_WIDTH,
      PARTICLE_TEXTURE_HEIGHT,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    return texture;
  }

  private createParticleGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const uv = new Float32Array(PARTICLE_COUNT * 2);
    const seed = new Float32Array(PARTICLE_COUNT);
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const x = index % PARTICLE_TEXTURE_WIDTH;
      const y = Math.floor(index / PARTICLE_TEXTURE_WIDTH);
      uv[index * 2] = (x + 0.5) / PARTICLE_TEXTURE_WIDTH;
      uv[index * 2 + 1] = (y + 0.5) / PARTICLE_TEXTURE_HEIGHT;
      seed[index] = Math.random();
    }
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3),
    );
    geometry.setAttribute('aParticleUv', new THREE.BufferAttribute(uv, 2));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return geometry;
  }

  private setPassMaterial(material: THREE.ShaderMaterial): void {
    this.passMesh.material = material;
  }

  private renderPass(
    material: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget,
  ): void {
    this.setPassMaterial(material);
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.passScene, this.camera);
    this.renderer.setRenderTarget(null);
  }

  private setSplatUniforms(splats: InkSplat[]): void {
    this.splatUniforms.uSplatCount.value = Math.min(splats.length, MAX_SPLATS);
    for (let index = 0; index < MAX_SPLATS; index += 1) {
      const splat = splats[index];
      const vector = this.splatUniforms[`uSplat${index}`]
        .value as THREE.Vector4;
      if (splat) {
        vector.set(splat.x, splat.y, splat.vx, splat.vy);
        this.splatUniforms[`uSplatStrength${index}`].value = splat.strength;
        this.splatUniforms[`uSplatPigmentStrength${index}`].value =
          splat.pigmentStrength;
        this.splatUniforms[`uSplatPigmentRadius${index}`].value =
          splat.pigmentRadius;
      } else {
        vector.set(0, 0, 0, 0);
        this.splatUniforms[`uSplatStrength${index}`].value = 0;
        this.splatUniforms[`uSplatPigmentStrength${index}`].value = 0;
        this.splatUniforms[`uSplatPigmentRadius${index}`].value = 0.016;
      }
    }
  }

  private swapVelocity(): void {
    this.velocityRead = 1 - this.velocityRead;
  }

  private swapPigment(): void {
    this.pigmentRead = 1 - this.pigmentRead;
  }

  private swapPressure(): void {
    this.pressureRead = 1 - this.pressureRead;
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.aspect = this.width / this.height;
    const velocityResolution = Math.max(
      256,
      Math.min(768, Math.round(Math.max(this.width, this.height) * 0.62)),
    );
    const pigmentResolution = Math.max(
      512,
      Math.min(1280, Math.round(Math.max(this.width, this.height) * 1.02)),
    );
    const velocityWidth = Math.max(
      1,
      Math.round(velocityResolution * this.aspect),
    );
    const pigmentWidth = Math.max(
      1,
      Math.round(pigmentResolution * this.aspect),
    );
    for (const target of this.velocityTargets)
      target.setSize(velocityWidth, velocityResolution);
    for (const target of this.pressureTargets)
      target.setSize(velocityWidth, velocityResolution);
    this.divergenceTarget.setSize(velocityWidth, velocityResolution);
    for (const target of this.pigmentTargets)
      target.setSize(pigmentWidth, pigmentResolution);
    this.velocityRead = 0;
    this.pigmentRead = 0;
    this.pressureRead = 0;
    this.particleTexture = this.seedTexture;
    this.particleWrite = 0;
    for (const target of [
      ...this.velocityTargets,
      ...this.pigmentTargets,
      ...this.pressureTargets,
      this.divergenceTarget,
      ...this.particleTargets,
    ]) {
      clearTarget(this.renderer, target);
    }
    const texel = new THREE.Vector2(1 / velocityWidth, 1 / velocityResolution);
    const pigmentTexel = new THREE.Vector2(
      1 / pigmentWidth,
      1 / pigmentResolution,
    );
    for (const material of [
      this.divergenceMaterial,
      this.pressureMaterial,
      this.gradientMaterial,
    ]) {
      material.uniforms.uTexel.value.copy(texel);
    }
    this.velocityMaterial.uniforms.uTexel.value.copy(texel);
    this.pigmentMaterial.uniforms.uTexel.value.copy(pigmentTexel);
    this.velocityMaterial.uniforms.uAspect.value = this.aspect;
    this.pigmentMaterial.uniforms.uAspect.value = this.aspect;
    this.compositeMaterial.uniforms.uAspect.value = this.aspect;
    this.particleUpdateMaterial.uniforms.uAspect.value = this.aspect;
    this.particleMaterial.uniforms.uAspect.value = this.aspect;
    this.particleMaterial.uniforms.uParticleSize.value = Math.max(
      2.6,
      Math.min(5.2, this.width / 280),
    );
    this.compositeMaterial.uniforms.uResolution.value.set(
      this.width,
      this.height,
    );
  }

  setPresentation(options: InkPresentationOptions): void {
    this.compositeMaterial.uniforms.uMode.value = options.modeStrength;
    this.compositeMaterial.uniforms.uGrainStrength.value =
      options.grainStrength;
    this.compositeMaterial.uniforms.uAmbientMotion.value =
      options.ambientMotion;
    this.compositeMaterial.uniforms.uTime.value = options.time;
    this.compositeMaterial.uniforms.uPointer.value.copy(options.pointer);
    this.compositeMaterial.uniforms.uPointerPulse.value = options.pointerPulse;
    this.compositeMaterial.uniforms.uPointerActive.value = options.pointerActive
      ? 1
      : 0;
    this.particleMaterial.uniforms.uMode.value = options.modeStrength;
    this.particleMaterial.uniforms.uPointerSpeed.value = options.pointerSpeed;
  }

  step(options: InkFluidStepOptions, time: number): number {
    const delta = Math.min(0.035, Math.max(0.001, options.delta));
    const splats = options.splats.slice(0, MAX_SPLATS);
    this.setSplatUniforms(splats);
    const velocityReadTarget = this.velocityTargets[this.velocityRead];
    const velocityWriteTarget = this.velocityTargets[1 - this.velocityRead];
    this.velocityMaterial.uniforms.uVelocity.value = velocityReadTarget.texture;
    this.velocityMaterial.uniforms.uDelta.value = delta;
    this.renderPass(this.velocityMaterial, velocityWriteTarget);
    this.swapVelocity();

    this.divergenceMaterial.uniforms.uVelocity.value =
      this.velocityTargets[this.velocityRead].texture;
    this.renderPass(this.divergenceMaterial, this.divergenceTarget);

    clearTarget(this.renderer, this.pressureTargets[0]);
    clearTarget(this.renderer, this.pressureTargets[1]);
    for (let iteration = 0; iteration < 18; iteration += 1) {
      this.pressureMaterial.uniforms.uPressure.value =
        this.pressureTargets[this.pressureRead].texture;
      this.pressureMaterial.uniforms.uDivergence.value =
        this.divergenceTarget.texture;
      this.renderPass(
        this.pressureMaterial,
        this.pressureTargets[1 - this.pressureRead],
      );
      this.swapPressure();
    }

    const gradientVelocityRead = this.velocityTargets[this.velocityRead];
    const gradientVelocityWrite = this.velocityTargets[1 - this.velocityRead];
    this.gradientMaterial.uniforms.uVelocity.value =
      gradientVelocityRead.texture;
    this.gradientMaterial.uniforms.uPressure.value =
      this.pressureTargets[this.pressureRead].texture;
    this.renderPass(this.gradientMaterial, gradientVelocityWrite);
    this.swapVelocity();

    const pigmentReadTarget = this.pigmentTargets[this.pigmentRead];
    const pigmentWriteTarget = this.pigmentTargets[1 - this.pigmentRead];
    this.pigmentMaterial.uniforms.uPigment.value = pigmentReadTarget.texture;
    this.pigmentMaterial.uniforms.uVelocity.value =
      this.velocityTargets[this.velocityRead].texture;
    this.pigmentMaterial.uniforms.uDelta.value = delta;
    this.renderPass(this.pigmentMaterial, pigmentWriteTarget);
    this.swapPigment();

    this.particleUpdateMaterial.uniforms.uParticles.value =
      this.particleTexture;
    this.particleUpdateMaterial.uniforms.uVelocity.value =
      this.velocityTargets[this.velocityRead].texture;
    this.particleUpdateMaterial.uniforms.uPigment.value =
      this.pigmentTargets[this.pigmentRead].texture;
    this.particleUpdateMaterial.uniforms.uPointer.value.copy(options.pointer);
    this.particleUpdateMaterial.uniforms.uPointerActive.value =
      options.pointerActive ? 1 : 0;
    this.particleUpdateMaterial.uniforms.uPointerPulse.value =
      options.pointerPulse;
    this.particleUpdateMaterial.uniforms.uPointerSpeed.value =
      options.pointerSpeed;
    this.particleUpdateMaterial.uniforms.uDelta.value = delta;
    this.particleUpdateMaterial.uniforms.uTime.value = time;
    this.renderPass(
      this.particleUpdateMaterial,
      this.particleTargets[this.particleWrite],
    );
    this.particleTexture = this.particleTargets[this.particleWrite].texture;
    this.particleWrite = 1 - this.particleWrite;

    this.compositeMaterial.uniforms.uPigment.value =
      this.pigmentTargets[this.pigmentRead].texture;
    this.compositeMaterial.uniforms.uVelocity.value =
      this.velocityTargets[this.velocityRead].texture;
    this.compositeMaterial.uniforms.uMode.value = options.modeStrength;
    this.compositeMaterial.uniforms.uTime.value = time;
    this.compositeMaterial.uniforms.uPointer.value.copy(options.pointer);
    this.compositeMaterial.uniforms.uPointerPulse.value = options.pointerPulse;
    this.compositeMaterial.uniforms.uPointerActive.value = options.pointerActive
      ? 1
      : 0;
    this.particleMaterial.uniforms.uParticles.value = this.particleTexture;
    this.particleMaterial.uniforms.uMode.value = options.modeStrength;
    this.particleMaterial.uniforms.uPointerSpeed.value = options.pointerSpeed;

    this.energy = Math.max(
      options.pointerSpeed,
      options.pointerPulse,
      this.energy * Math.exp(-delta * 0.24),
    );
    if (splats.length > 0) this.energy = Math.max(this.energy, 0.42);
    this.debug.set('splats', splats.length);
    this.debug.set('energy', this.energy);
    return this.energy;
  }

  reset(): void {
    this.velocityRead = 0;
    this.pigmentRead = 0;
    this.pressureRead = 0;
    this.particleTexture = this.seedTexture;
    this.particleWrite = 0;
    this.energy = 0;
    for (const target of [
      ...this.velocityTargets,
      ...this.pigmentTargets,
      ...this.pressureTargets,
      this.divergenceTarget,
      ...this.particleTargets,
    ]) {
      clearTarget(this.renderer, target);
    }
  }

  render(time?: number): void {
    if (time !== undefined) {
      this.compositeMaterial.uniforms.uTime.value = time;
    }
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.displayScene, this.camera);
  }

  getDebugInfo(): {
    velocity: string;
    pigment: string;
    particles: number;
    energy: number;
    splats: number;
  } {
    const velocity = this.velocityTargets[this.velocityRead];
    const pigment = this.pigmentTargets[this.pigmentRead];
    return {
      velocity: `${velocity.width}×${velocity.height}`,
      pigment: `${pigment.width}×${pigment.height}`,
      particles: PARTICLE_COUNT,
      energy: this.energy,
      splats: this.debug.get('splats') ?? 0,
    };
  }

  dispose(): void {
    this.fullscreenGeometry.dispose();
    this.particleGeometry.dispose();
    this.seedTexture.dispose();
    for (const target of [
      ...this.velocityTargets,
      ...this.pigmentTargets,
      ...this.pressureTargets,
      this.divergenceTarget,
      ...this.particleTargets,
    ])
      target.dispose();
    for (const material of [
      this.velocityMaterial,
      this.divergenceMaterial,
      this.pressureMaterial,
      this.gradientMaterial,
      this.pigmentMaterial,
      this.particleUpdateMaterial,
      this.compositeMaterial,
      this.particleMaterial,
    ])
      material.dispose();
  }
}
