"use client";

import { cn } from "@/lib/utils";
import type { MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * A configurable WebGL2 orb: a lit sphere with colour marbling inside it.
 *
 * Two ideas carry the whole thing.
 *
 * The loop is seamless by construction, not by crossfade. Every point walks a
 * circle in a flow field whose angle advances by exactly one turn per loop, so
 * the displacement returns to where it started. Neighbouring points begin at
 * different angles, and that is what reads as swirling — offset the whole
 * domain by one shared vector instead and you get a pulse.
 *
 * Colour is mixed in OkLab. The midpoint between two stops stays clean instead
 * of going muddy through sRGB, each picked colour reproduces exactly at its own
 * stop, and the hue ripple is a real rotation in the a/b plane.
 *
 * Everything else is lighting on a sphere impostor: the normal is derived per
 * pixel from the distance to the centre, which is what lets a rim, a highlight
 * and a shaded side exist at all. A radial gradient has no surface, and that is
 * the entire difference between this and a coloured circle.
 *
 * Contains two public-domain pieces of prior art, marked at their definitions:
 * the MurmurHash3 finalizer (Austin Appleby) and the OkLab transform matrices
 * (Björn Ottosson).
 */

export interface OrbProps {
  /**
   * Rim dispersion. Splits the palette lookup per channel toward the edge, the
   * way a lens fringes.
   */
  aberration?: number;
  /** Which colour dominates. `0.5` is even; below favours the first stop. */
  balance?: number;
  /** Interior cell size. Small is busy, large is one slow swell. */
  blobScale?: number;
  /** Hue ripple through the palette. */
  chroma?: number;
  className?: string;
  /** Two to four stops. Two read as a material, four as iridescent. */
  colors?: string[];
  /** Lightness contrast around the midpoint. */
  contrast?: number;
  /** Seconds for one full, seamless loop. */
  duration?: number;
  /** How far the flow field carries the field over a loop. */
  flow?: number;
  /** A halo cast outside the silhouette. `0` is none. */
  glow?: number;
  /** Film grain. Also hides the banding large soft gradients show. */
  grain?: number;
  /** Internal scatter, offset away from the highlight. Fake subsurface. */
  inner?: number;
  /** Fresnel-driven hue rotation — thin-film sheen. */
  iridescence?: number;
  /** Light direction, x. */
  lightX?: number | MotionValue<number>;
  /** Light direction, y. */
  lightY?: number | MotionValue<number>;
  /** Freeze on the current frame. */
  paused?: boolean;
  /** Bends the noise lookup by the surface normal. */
  refraction?: number;
  /** Fresnel edge brightness. This is what reads as glass. */
  rim?: number;
  /** Blends the palette toward plain diffuse shading. */
  shading?: number;
  /** Rotates the palette. */
  shift?: number;
  /** Rendered size. Numbers are pixels. */
  size?: number | string;
  /** Edge feather. `0` still resolves to about 1.5 device pixels. */
  softness?: number;
  /** Specular highlight strength. */
  specular?: number;
  /** Flow playback speed multiplier (`1` = `duration`). */
  speed?: number;
  /** Live energy (0–1, or MotionValue) driving flow, turbulence and wobble smoothly at 60fps. */
  amplitude?: number | MotionValue<number>;
  /** Strength of the second, nested warp — marbling rather than blobs. */
  turbulence?: number;
  /** Silhouette deformation, so the orb is a drop rather than a ball. */
  wobble?: number;
}

/** The editor's own defaults, which are a good orb rather than a neutral one. */
const DEFAULTS = {
  aberration: 0.8,
  amplitude: 0 as number | MotionValue<number>,
  balance: 0.5,
  blobScale: 3,
  chroma: 1,
  colors: ["#f25aed", "#ffffff"],
  contrast: 1,
  duration: 7,
  flow: 0.6,
  glow: 0,
  grain: 0.18,
  inner: 0.38,
  iridescence: 0,
  lightX: -0.6 as number | MotionValue<number>,
  lightY: -1 as number | MotionValue<number>,
  refraction: 0.25,
  rim: 1.3,
  shading: 0.05,
  shift: 0.23,
  softness: 0.002,
  specular: 0.2,
  speed: 1,
  turbulence: 0.4,
  wobble: 0,
} as const;

const MAX_STOPS = 4;
const MAX_DPR = 3;
const RGB_MAX = 255;
const SRGB_KNEE = 0.040_45;
const TAU = Math.PI * 2;
/** Ambient motion gains nothing from 120 Hz. */
const FRAME_CAP_MS = 1000 / 60;
const LIGHT_Z = 0.65;
const BALANCE_BASE = 5;
/** Keeps rendering slightly before the orb scrolls into view. */
const ROOT_MARGIN = "120px";

/* The covering triangle is built from gl_VertexID, so there is no vertex
   buffer and no attribute state to manage. */
const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;   // the hash needs full 32-bit ints

uniform vec2  uRes;
uniform float uPhase;
uniform vec3  uLab[4];
uniform float uCount;
uniform float uScaleN;
uniform float uFlow;
uniform float uTurb;
uniform float uShift;
uniform float uBalance;
uniform float uChroma;
uniform float uContrast;
uniform float uRim;
uniform float uSpec;
uniform float uInner;
uniform float uShading;
uniform float uRefract;
uniform float uIrid;
uniform float uAberr;
uniform float uGrain;
uniform float uSoft;
uniform float uWobble;
uniform float uGlow;
uniform vec3  uLight;

out vec4 fragColor;

const float TAU = 6.28318530718;
const float RAD = 0.86;         // sphere radius in uv units; the rest is glow room
const float RMAX = 1.0 / RAD;   // radius reached at the nearest canvas edge

/* MurmurHash3 finalizer, Austin Appleby, public domain. Exact at any lattice
   coordinate, so unlike a fract(sin(...)) hash it never bands as the input
   grows — which matters for the grain, whose input runs into the thousands. */
uint hashU(uint x) {
  x ^= x >> 16; x *= 0x85EBCA6Bu;
  x ^= x >> 13; x *= 0xC2B2AE35u;
  x ^= x >> 16;
  return x;
}
uint hashU2(uvec2 p) { return hashU(p.x * 0x9E3779B9u ^ hashU(p.y)); }
uint hashU3(uvec3 p) { return hashU(p.x * 0x9E3779B9u ^ hashU(p.y) ^ hashU(p.z) * 0x27D4EB2Fu); }
float rand2(ivec2 p) { return float(hashU2(uvec2(p + 4096)) >> 8) / 16777216.0; }
float rand3(ivec3 p) { return float(hashU3(uvec3(p + 4096)) >> 8) / 16777216.0; }

float vnoise(vec2 p) {
  ivec2 i = ivec2(floor(p));
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(rand2(i),               rand2(i + ivec2(1, 0)), u.x),
             mix(rand2(i + ivec2(0, 1)), rand2(i + ivec2(1, 1)), u.x), u.y);
}

float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int k = 0; k < 3; k++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s / 0.875;
}

/* Each point walks its own circle, completing exactly one turn per loop. */
vec2 flowField(vec2 p) {
  float ang = TAU * vnoise(p + 11.3) + uPhase;
  float mag = 0.35 + 0.65 * vnoise(p + 27.9);
  return vec2(cos(ang), sin(ang)) * mag;
}

/* Fresnel-driven hue rotation in the a/b plane — thin-film sheen. */
vec3 iridesce(vec3 lab, float f) {
  float a = uIrid * f * -2.2;
  float c = cos(a), s = sin(a);
  return vec3(lab.x, c * lab.y - s * lab.z, s * lab.y + c * lab.z);
}

vec3 labRamp(float x) {
  float xx = clamp(x, 0.0, 1.0) * (uCount - 1.0);
  vec3 c = mix(uLab[0], uLab[1], clamp(xx, 0.0, 1.0));
  c = mix(c, uLab[2], clamp(xx - 1.0, 0.0, 1.0));
  c = mix(c, uLab[3], clamp(xx - 2.0, 0.0, 1.0));
  return c;
}

vec3 paletteLab(float t) {
  float x = pow(clamp(0.5 + 0.5 * cos(TAU * t), 0.0, 1.0), uBalance);
  vec3 lab = labRamp(x);
  float ang = TAU * (t * 2.0 + 0.123);
  lab.yz += 0.17 * uChroma * length(lab.yz) * vec2(sin(ang), cos(ang * 1.37 + 1.1));
  /* Cap to roughly the sRGB chroma ceiling. Scaling a/b keeps the hue angle;
     overshooting and clamping RGB later posterises into flat patches. */
  float ch = length(lab.yz);
  if (ch > 0.33) { lab.yz *= 0.33 / ch; }
  lab.x = clamp(0.5 + (lab.x - 0.5) * uContrast, 0.0, 1.0);
  return lab;
}

/* OkLab transform, Björn Ottosson, public domain. */
vec3 oklabToLinear(vec3 c) {
  float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  vec3 lms = vec3(l_ * l_ * l_, m_ * m_ * m_, s_ * s_ * s_);
  return mat3( 4.0767416621, -1.2684380046, -0.0041960863,
              -3.3077115913,  2.6097574011, -0.7034186147,
               0.2309699292, -0.3413193965,  1.7076147010) * lms;
}

vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(max(c, 1e-5), vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(0.0031308, c));
}

void main() {
  vec2 safeRes = max(uRes, vec2(1.0));
  vec2 uv = (gl_FragCoord.xy * 2.0 - safeRes) / min(safeRes.x, safeRes.y);
  uv /= RAD;

  /* Silhouette wobble. Integer harmonics of the angle keep it continuous all
     the way round; integer multiples of the phase keep it periodic in time.
     Faded in with radius so the rim deforms like a drop while the core stays
     put — which also keeps it away from atan()'s singularity at the centre. */
  if (uWobble > 0.0) {
    float r0 = length(uv);
    float th = atan(uv.y, uv.x + 1e-6);
    float wob = 0.60 * sin(3.0 * th + uPhase)
              + 0.40 * sin(5.0 * th - 2.0 * uPhase)
              + 0.25 * sin(7.0 * th + 3.0 * uPhase);
    uv *= 1.0 - uWobble * 0.055 * wob * smoothstep(0.0, 0.5, r0);
  }

  float r = length(uv);

  // Keep a crisp ~1 device-px feather so the orb silhouette stays razor-sharp at every size.
  float w = max(uSoft, 1.0 * fwidth(r));
  float body = 1.0 - smoothstep(1.0 - w, 1.0, r);

  /* The halo has to reach exactly zero before the canvas boundary. Left alone
     it is still ~1.5/255 at the edge and gets cut off square, which shows the
     canvas box as a faint rectangle around the orb. */
  float glowF = uGlow > 0.0001 ? uGlow * exp(-max(r - 1.0, 0.0) * 20.0) : 0.0;
  glowF *= 1.0 - smoothstep(0.45, 1.0, (r - 1.0) / (RMAX - 1.0));
  float alpha = clamp(body + glowF * (1.0 - body), 0.0, 1.0);
  if (!(alpha > 0.001)) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 pd = uv / max(r, 1.0);
  float z = sqrt(max(1.0 - dot(pd, pd), 0.0));
  vec3 n = vec3(pd, z);

  /* Domain warping. The base fBm is static; all the motion comes from warping
     its input through the looping flow field, and nesting a second warp is
     what turns smooth blobs into marbled, ink-in-water flow. */
  vec2 p0 = (pd - n.xy * uRefract) * uScaleN;
  vec2 p1 = p0 + uFlow * flowField(p0);
  vec2 p2 = p1 + uTurb * flowField(p1 * 1.7 + 5.2);
  float t = mix(0.5, fbm(p2 + 3.7), 1.35) + uShift;

  float fres3 = pow(max(1.0 - n.z, 1e-4), 3.0);
  vec3 lab = iridesce(paletteLab(t), fres3);

  vec3 base;
  if (uAberr > 0.001) {
    // Dispersion: the palette lookup shifts per channel, strongest at the rim.
    float d = uAberr * 0.05 * r * r;
    base = vec3(oklabToLinear(iridesce(paletteLab(t - d), fres3)).r,
                oklabToLinear(lab).g,
                oklabToLinear(iridesce(paletteLab(t + d), fres3)).b);
  } else {
    base = oklabToLinear(lab);
  }
  base = max(base, 0.0);

  // Lighting is added in linear light, which is where it belongs.
  vec3 L = normalize(uLight);
  vec3 col = mix(base, vec3(clamp(dot(n, L), 0.0, 1.0)), uShading);

  // Internal scatter offset away from the highlight: a translucent body rather
  // than a lit opaque ball.
  vec2 op = pd + L.xy * 0.45;
  col += uInner * exp(-dot(op, op) * 2.2) * base;

  vec3 half_ = normalize(L + vec3(0.0, 0.0, 1.0));
  col += pow(max(1.0 - n.z, 1e-4), 8.0) * uRim
       + pow(max(dot(n, half_), 1e-4), 24.3) * uSpec;

  vec3 lit = linearToSrgb(col);
  vec3 flat_ = linearToSrgb(base);

  vec3 outCol = mix(flat_, lit, body);

  // Grain plus an always-on deband dither, stepped to 24 frames per loop so it
  // animates without breaking the seam.
  int frame = int(uPhase / TAU * 24.0);
  outCol += (rand3(ivec3(ivec2(gl_FragCoord.xy), frame)) - 0.5)
          * (uGrain * 0.1 + 1.0 / 255.0);

  outCol = clamp(outCol, 0.0, 1.0);
  fragColor = vec4(outCol * alpha, alpha);   // premultiplied
}`;

const OKLAB_CACHE = new Map<string, [number, number, number]>();

const isMotionScalar = (value: unknown): value is MotionValue<number> =>
  typeof value === "object" && value !== null && "get" in value;

const readScalar = (value: number | MotionValue<number>): number =>
  isMotionScalar(value) ? value.get() : value;

/**
 * Any CSS colour to OkLab, in two steps because neither alone is enough.
 *
 * `getComputedStyle` resolves `var()` and named colours, but Chrome hands back
 * `oklch(0.72 0.21 322)` verbatim rather than converting it — read that as three
 * sRGB channels and a magenta comes out blue. A 1x1 2D canvas rasterises
 * whatever syntax survives into actual pixels, which is the only step that
 * cannot lie about the result.
 */
const OKLCH_RE =
  /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([-+]?[\d.]+)(deg|rad|grad|turn)?\s*(?:\/[^)]*)?\)$/i;

const cssToOklab = (input: string): [number, number, number] => {
  const cached = OKLAB_CACHE.get(input);
  if (cached) {
    return cached;
  }

  const oklchMatch = OKLCH_RE.exec(input.trim());
  if (oklchMatch) {
    const rawL = oklchMatch[1];
    const rawC = oklchMatch[2];
    const rawH = Number.parseFloat(oklchMatch[3]);
    const unit = (oklchMatch[4] ?? "deg").toLowerCase();
    const l = rawL.endsWith("%") ? Number.parseFloat(rawL) / 100 : Number.parseFloat(rawL);
    const c = rawC.endsWith("%") ? Number.parseFloat(rawC) * 0.004 : Number.parseFloat(rawC);
    const hueRad =
      unit === "rad"
        ? rawH
        : unit === "turn"
          ? rawH * TAU
          : unit === "grad"
            ? rawH * (Math.PI / 200)
            : rawH * (Math.PI / 180);
    const direct: [number, number, number] = [l, c * Math.cos(hueRad), c * Math.sin(hueRad)];
    OKLAB_CACHE.set(input, direct);
    return direct;
  }

  const probe = document.createElement("span");
  probe.style.color = input;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();

  const surface = document.createElement("canvas");
  surface.width = 1;
  surface.height = 1;
  const ctx = surface.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return [1, 0, 0];
  }
  ctx.fillStyle = resolved;
  ctx.fillRect(0, 0, 1, 1);
  const [r8, g8, b8] = ctx.getImageData(0, 0, 1, 1).data;

  // biome-ignore-start lint/style/useNumericSeparators: published colour-space constants, kept digit-for-digit against the reference
  const [r, g, b] = [r8, g8, b8].map((channel) => {
    const u = channel / RGB_MAX;
    return u <= SRGB_KNEE ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const result: [number, number, number] = [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
  OKLAB_CACHE.set(input, result);
  return result;
  // biome-ignore-end lint/style/useNumericSeparators: published colour-space constants
};

const compileShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) => {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

export default function Orb({ className, size = 240, ...rest }: OrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The fallback lives here rather than in the caller: a stand-in drawn by
  // whoever embeds the orb ends up painted over the canvas, which hides the
  // real thing on every machine that can render it.
  const [supported, setSupported] = useState(true);

  // Read inside the loop rather than closed over, so turning a knob pushes a
  // uniform instead of tearing down and rebuilding the GL context.
  const syncConfig = useRef<(() => void) | null>(null);
  const config = useRef({ ...DEFAULTS, ...rest });
  config.current = { ...DEFAULTS, ...rest };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false, // a covering triangle has no geometric edges to sample
      depth: false,
      powerPreference: "low-power",
      premultipliedAlpha: true,
      stencil: false,
    });
    if (!gl) {
      setSupported(false);
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!(vs && fs && program)) {
      setSupported(false);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setSupported(false);
      return;
    }
    // biome-ignore lint/correctness/useHookAtTopLevel: WebGL2RenderingContext.useProgram is not a React hook.
    gl.useProgram(program);
    // Recoverable: a failed first attempt must not disable the orb forever.
    setSupported(true);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND); // the shader writes premultiplied RGBA straight out

    const at = (name: string) => gl.getUniformLocation(program, name);
    const u = {
      aberr: at("uAberr"),
      balance: at("uBalance"),
      chroma: at("uChroma"),
      contrast: at("uContrast"),
      count: at("uCount"),
      flow: at("uFlow"),
      glow: at("uGlow"),
      grain: at("uGrain"),
      inner: at("uInner"),
      irid: at("uIrid"),
      lab: at("uLab"),
      light: at("uLight"),
      phase: at("uPhase"),
      refract: at("uRefract"),
      res: at("uRes"),
      rim: at("uRim"),
      scaleN: at("uScaleN"),
      shading: at("uShading"),
      shift: at("uShift"),
      soft: at("uSoft"),
      spec: at("uSpec"),
      turb: at("uTurb"),
      wobble: at("uWobble"),
    };

    const targetLab = new Float32Array(MAX_STOPS * 3);
    const curLab = new Float32Array(MAX_STOPS * 3);
    const cur = {
      flow: config.current.flow,
      glow: config.current.glow,
      lightX: readScalar(config.current.lightX),
      lightY: readScalar(config.current.lightY),
      rim: config.current.rim,
      spec: config.current.specular,
      speed: config.current.speed,
      turb: config.current.turbulence,
      wobble: config.current.wobble,
    };
    let hasInitializedDynamic = false;

    const uploadDynamic = () => {
      gl.uniform3fv(u.lab, curLab);
      gl.uniform1f(u.flow, cur.flow);
      gl.uniform1f(u.turb, cur.turb);
      gl.uniform1f(u.rim, cur.rim);
      gl.uniform1f(u.spec, cur.spec);
      gl.uniform1f(u.wobble, cur.wobble);
      gl.uniform1f(u.glow, cur.glow);
      gl.uniform3f(u.light, cur.lightX, cur.lightY, LIGHT_Z);
    };

    const snapDynamic = () => {
      const c = config.current;
      const amp = Math.max(0, Math.min(1, readScalar(c.amplitude)));
      curLab.set(targetLab);
      cur.flow = c.flow + amp * 0.42;
      cur.turb = c.turbulence + amp * 0.36;
      cur.wobble = c.wobble + amp * 0.08;
      cur.rim = c.rim;
      cur.spec = c.specular;
      cur.glow = c.glow;
      cur.speed = c.speed;
      cur.lightX = readScalar(c.lightX);
      cur.lightY = readScalar(c.lightY);
      uploadDynamic();
    };

    const pushConfig = () => {
      const c = config.current;
      const stops = c.colors.slice(0, MAX_STOPS);
      for (let i = 0; i < MAX_STOPS; i++) {
        const [x, y, z] = cssToOklab(stops[Math.min(i, stops.length - 1)]);
        targetLab[i * 3] = x;
        targetLab[i * 3 + 1] = y;
        targetLab[i * 3 + 2] = z;
      }
      gl.uniform1f(u.count, Math.max(2, Math.min(stops.length, MAX_STOPS)));
      // The prop reads as blob size, so invert it into cell frequency.
      gl.uniform1f(u.scaleN, 1.45 / Math.max(c.blobScale, 0.05));
      gl.uniform1f(u.shift, c.shift);
      gl.uniform1f(u.balance, BALANCE_BASE ** ((0.5 - c.balance) * 2));
      gl.uniform1f(u.chroma, c.chroma);
      gl.uniform1f(u.contrast, c.contrast);
      gl.uniform1f(u.inner, c.inner);
      gl.uniform1f(u.shading, c.shading);
      gl.uniform1f(u.refract, c.refraction);
      gl.uniform1f(u.irid, c.iridescence);
      gl.uniform1f(u.aberr, c.aberration);
      gl.uniform1f(u.grain, c.grain);
      gl.uniform1f(u.soft, c.softness);

      if (!hasInitializedDynamic) {
        hasInitializedDynamic = true;
        snapDynamic();
      }
    };

    const resize = (entry?: ResizeObserverEntry) => {
      // Guarantee at least 2x (and up to 3x) supersampling so small and medium orbs stay sharp.
      const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), MAX_DPR);
      // Prefer untransformed layout box (`clientWidth`/`clientHeight`) over `getBoundingClientRect`
      // so CSS `scale(...)` containers never down-size the underlying WebGL buffer.
      const layoutW = canvas.clientWidth;
      const layoutH = canvas.clientHeight;
      const box = entry?.devicePixelContentBoxSize;
      let w: number;
      let h: number;
      if (layoutW > 0 && layoutH > 0) {
        w = Math.round(layoutW * dpr);
        h = Math.round(layoutH * dpr);
      } else if (box?.length) {
        w = Math.max(box[0].inlineSize, 1);
        h = Math.max(box[0].blockSize, 1);
      } else {
        const rect = canvas.getBoundingClientRect();
        w = Math.round(rect.width * dpr);
        h = Math.round(rect.height * dpr);
      }
      w = Math.max(1, w);
      h = Math.max(1, h);
      const changed = canvas.width !== w || canvas.height !== h;
      if (changed) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
      return changed;
    };

    const draw = () => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let phase = 0;
    let pending = 0;
    let last = 0;
    let raf = 0;
    let running = false;
    let onScreen = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(now - last, 100) : FRAME_CAP_MS;
      last = now;
      pending += dt;
      /* Half a frame of slack: without it, a display whose vsync divides the
         cap almost exactly drops an extra frame and the cadence stutters. */
      if (pending < FRAME_CAP_MS - dt * 0.5) {
        return;
      }
      const stepMs = pending;
      pending = 0;
      const dtSec = stepMs / 1000;
      const alpha = 1 - Math.exp(-dtSec * 7.5);
      const c = config.current;
      const amp = Math.max(0, Math.min(1, readScalar(c.amplitude)));

      const tFlow = c.flow + amp * 0.42;
      const tTurb = c.turbulence + amp * 0.36;
      const tWobble = c.wobble + amp * 0.08;
      const tLightX = readScalar(c.lightX);
      const tLightY = readScalar(c.lightY);

      cur.flow += (tFlow - cur.flow) * alpha;
      cur.turb += (tTurb - cur.turb) * alpha;
      cur.wobble += (tWobble - cur.wobble) * alpha;
      cur.rim += (c.rim - cur.rim) * alpha;
      cur.spec += (c.specular - cur.spec) * alpha;
      cur.glow += (c.glow - cur.glow) * alpha;
      cur.speed += (c.speed - cur.speed) * alpha;
      cur.lightX += (tLightX - cur.lightX) * alpha;
      cur.lightY += (tLightY - cur.lightY) * alpha;

      for (let i = 0; i < curLab.length; i++) {
        curLab[i] += (targetLab[i] - curLab[i]) * alpha;
      }

      phase = (phase + (dtSec / Math.max(0.25, c.duration)) * cur.speed) % 1;
      gl.uniform1f(u.phase, phase * TAU);
      uploadDynamic();
      draw();
    };

    const start = () => {
      if (running || reduce.matches || config.current.paused || !onScreen) {
        return;
      }
      running = true;
      last = 0;
      pending = 0;
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
      }
      raf = 0;
    };

    const applyMotionPreference = () => {
      if (reduce.matches || config.current.paused) {
        stop();
        snapDynamic();
        if (reduce.matches) {
          gl.uniform1f(u.phase, 0);
        }
        draw();
        return;
      }
      start();
    };

    syncConfig.current = () => {
      pushConfig();
      applyMotionPreference();
      if (!running) {
        snapDynamic();
        draw();
      }
    };

    pushConfig();
    resize();
    gl.uniform1f(u.phase, 0);
    draw();

    const observer = new ResizeObserver((entries) => {
      if (resize(entries[0]) && !running) {
        draw();
      }
    });
    try {
      observer.observe(canvas, { box: "device-pixel-content-box" });
    } catch {
      observer.observe(canvas);
    }

    /* Scrolled out of view is the common case. Nothing is gained by burning
       GPU on an orb nobody can see. */
    const seen = new IntersectionObserver(
      (entries) => {
        onScreen = entries.at(-1)?.isIntersecting ?? true;
        if (onScreen) {
          start();
        } else {
          stop();
        }
      },
      { rootMargin: ROOT_MARGIN }
    );
    seen.observe(canvas);

    reduce.addEventListener("change", applyMotionPreference);
    applyMotionPreference();

    return () => {
      syncConfig.current = null;
      stop();
      observer.disconnect();
      seen.disconnect();
      reduce.removeEventListener("change", applyMotionPreference);
      gl.deleteProgram(program);
      /* Deliberately NOT calling WEBGL_lose_context here. React remounts
         effects in development, and the second pass gets the same canvas back
         with a context that is still lost — the program then fails to link and
         the component latches into its fallback for good. Dropping the canvas
         is enough; the context goes with it. */
    };
  }, []);

  // Synchronize committed props even when animation is paused or reduced.
  // Keep the GPU resources stable; never convert colors on every frame.
  useEffect(() => {
    syncConfig.current?.();
  });

  const dimension = typeof size === "number" ? `${size}px` : size;

  if (!supported) {
    const stops = (rest.colors ?? DEFAULTS.colors).slice(0, MAX_STOPS);
    return (
      <div
        aria-hidden="true"
        className={cn("block rounded-full", className)}
        style={{
          // Lit from the same corner as the shader, so the character does not
          // change which way it faces when it falls back.
          backgroundImage: `radial-gradient(circle at 32% 28%, ${stops.join(", ")})`,
          height: dimension,
          width: dimension,
        }}
      />
    );
  }

  return (
    <canvas
      aria-hidden="true"
      className={cn("block rounded-full", className)}
      ref={canvasRef}
      style={{ background: "transparent", height: dimension, width: dimension }}
      tabIndex={-1}
    />
  );
}
