"use client";

import Orb from "../orb";
import { cn } from "@/lib/utils";
import {
  type MotionValue,
  motion,
  useAnimationControls,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AIAmplitude,
  type AIState,
  useAmplitudeValue,
} from "../ai-core";

const VIEWBOX = 100;
const CENTER = VIEWBOX / 2;
const EYE_OFFSET = 16;
const EYE_Y = 44;
const EYE_WIDTH = 11;
const EYE_HEIGHT = 26;
/** How far the pupils can travel from centre, in viewBox units. */
const GAZE_RANGE = 5.5;
/** Cursor distance, in px, at which the gaze reaches full deflection. */
const GAZE_FALLOFF = 220;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN = [0.4, 0, 1, 1] as const;

const BLINK_MIN_MS = 3200;
const BLINK_EXTRA_MS = 2600;
const DOUBLE_BLINK_CHANCE = 0.25;

const IDLE_GLANCE_DELAY_MS = 2400;
const IDLE_GLANCE_INTERVAL_MIN_MS = 2200;
const IDLE_GLANCE_INTERVAL_EXTRA_MS = 2400;

/** Thinking saccades: eyes glance upward/sideways as if searching. */
const SACCADE_MIN_MS = 550;
const SACCADE_EXTRA_MS = 900;
const SACCADE_TARGETS = [
  { x: -1, y: -0.95 },
  { x: 1, y: -0.95 },
  { x: -0.65, y: -0.45 },
  { x: 0.8, y: -0.85 },
  { x: -0.25, y: -1 },
  { x: 0.3, y: -0.55 },
] as const;

/** Orb draws its sphere at this fraction of its box; the rest is glow room. */
const ORB_SPHERE_FRACTION = 0.86;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * An expression is two eyes, parameterized into curved Bezier silhouettes.
 *
 * `topArch` and `botArch` bend the vertical midpoints so the exact same SVG
 * command topology morphs cleanly between tall neutral capsules, squinted bars,
 * upward cheerful `⌒` crescents (`joy`), and outward-drooping `︶` sad eyes.
 */
export interface EyeShape {
  /** Center curvature bend in viewBox units. Negative arches upward (`^`), positive cups downward. */
  arch?: number;
  /** Optional independent bottom-edge curvature override. */
  botArch?: number;
  /** Vertical offset in viewBox units. Negative sits higher. */
  dy?: number;
  /** Multiplier on the resting height. */
  h: number;
  /** Degrees. Positive tilts top inward (`cross`); negative tilts outer edge down (`sad`). */
  rotate?: number;
  /** Optional independent top-edge curvature override. */
  topArch?: number;
  /** Multiplier on the resting width. */
  w: number;
}

export interface Expression {
  left: EyeShape;
  right: EyeShape;
}

const EYE = (
  h: number,
  w = 1,
  rotate = 0,
  dy = 0,
  topArch = 0,
  botArch = topArch
): EyeShape => ({
  arch: topArch,
  botArch,
  dy,
  h,
  rotate,
  topArch,
  w,
});

/** Mirrored: opposite rotation per eye so expressions remain symmetric. */
const symmetric = (
  h: number,
  w = 1,
  rotate = 0,
  dy = 0,
  topArch = 0,
  botArch = topArch
): Expression => ({
  left: EYE(h, w, rotate, dy, topArch, botArch),
  right: EYE(h, w, -rotate, dy, topArch, botArch),
});

export const EXPRESSIONS = {
  /** Wide. Paying attention. */
  alert: symmetric(1.18, 1.06, 0, -1),
  /** Upward joyful smile-arcs (`⌒ ⌒`). */
  content: symmetric(0.24, 1.32, 0, 1, -6.0),
  /** Both eyes tilted inward. */
  cross: symmetric(0.85, 1, 18),
  /** Flat dashes. Unimpressed. */
  deadpan: symmetric(0.14, 1.35),
  /** One eye narrowed. Pensive or skeptical. */
  doubtful: { left: EYE(1, 1), right: EYE(0.45, 1.1, -14) },
  /** Narrowed and level. Working on it. */
  focused: symmetric(0.6, 1.06),
  /** Wide bright upturned eager eyes — perked up at a second chance. */
  hopeful: {
    left: EYE(1.24, 1.12, 4, -2.4, -2.0, -0.4),
    right: EYE(1.24, 1.12, -4, -2.4, -2.0, -0.4),
  },
  /** Upward joyful smile-arcs (`⌒ ⌒`). */
  joy: symmetric(0.24, 1.32, 0, 1, -6.0),
  /** Resting. */
  neutral: symmetric(1),
  /** Drooping outer corners with heavy downcast curves (`︶ ︶`). */
  sad: {
    left: EYE(0.24, 1.24, -18, 2.5, 4.5),
    right: EYE(0.24, 1.24, 18, 2.5, 4.5),
  },
  /** Small and high. Caught off guard. */
  surprised: symmetric(0.5, 0.55, 0, -3),
  /** One curved cheerful wink, one open. */
  wink: { left: EYE(1, 1), right: EYE(0.2, 1.24, 0, 1.5, -4.5) },
} satisfies Record<string, Expression>;

export type ExpressionName = keyof typeof EXPRESSIONS;

const STATE_EXPRESSION: Record<AIState, ExpressionName> = {
  done: "joy",
  error: "sad",
  idle: "neutral",
  listening: "alert",
  streaming: "focused",
  thinking: "doubtful",
};

type StateShaderPreset = {
  colors?: [string, string];
  flow: number;
  rim: number;
  saturation: number;
  specular: number;
  speed: number;
  turbulence: number;
  wobble: number;
};

const STATE_SHADER: Record<AIState, StateShaderPreset> = {
  done: {
    flow: 0.76,
    rim: 1.55,
    saturation: 1,
    specular: 0.28,
    speed: 1.25,
    turbulence: 0.38,
    wobble: 0.22,
  },
  error: {
    colors: ["#df5555", "#f4d3d0"],
    flow: 0.24,
    rim: 0.85,
    saturation: 1,
    specular: 0.12,
    speed: 0.32,
    turbulence: 0.18,
    wobble: 0.04,
  },
  idle: {
    flow: 0.55,
    rim: 1.25,
    saturation: 1,
    specular: 0.2,
    speed: 0.7,
    turbulence: 0.34,
    wobble: 0.03,
  },
  listening: {
    flow: 0.72,
    rim: 1.48,
    saturation: 1,
    specular: 0.26,
    speed: 1.15,
    turbulence: 0.44,
    wobble: 0.12,
  },
  streaming: {
    flow: 0.85,
    rim: 1.4,
    saturation: 1,
    specular: 0.24,
    speed: 1.45,
    turbulence: 0.54,
    wobble: 0.14,
  },
  thinking: {
    flow: 0.92,
    rim: 1.35,
    saturation: 1,
    specular: 0.22,
    speed: 2.2,
    turbulence: 0.78,
    wobble: 0.08,
  },
};

export type AIOrbFaceProps = {
  /** Accessible label. Omit to keep the character decorative. */
  "aria-label"?: string;
  /** Live audio/activity level, 0–1. Drives fluid motion and voice breathing. */
  amplitude?: AIAmplitude;
  className?: string;
  colors?: { body?: string; bodyEdge?: string; feature?: string };
  /**
   * Set the face directly, ignoring `state`. Either a name from
   * `EXPRESSIONS` or a pair of eye shapes of your own.
   */
  expression?: ExpressionName | Expression;
  /**
   * Follow the pointer with its gaze. Turn off inside dense UI where a dozen
   * of these tracking the cursor would be noise.
   */
  gaze?: boolean;
  /** Rendered size. Numbers are pixels. */
  size?: number | string;
  /**
   * Optional scale factor for motion translations (defaults to `size / 100` for numeric sizes).
   * Pass `renderedPx / 100` when using a percentage `size` like `"100%"` across zoom transitions.
   */
  motionScale?: number;
  /** Incrementing trigger (`kind: 'hopeful'`) plays an optimistic second-chance perk bounce. */
  moodImpulse?: { kind: "hopeful"; seq: number } | null;
  state?: AIState;
};

const DEFAULT_COLORS = {
  body: "oklch(72% 0.21 322)",
  bodyEdge: "oklch(97% 0.02 322)",
  feature: "oklch(24% 0.03 280)",
};

/**
 * Generates an eye path centered at `(0, 0)` with a fixed 6-cubic Bezier topology
 * so Motion interpolates smoothly across neutral capsules, joyful arches, and sad curves.
 */
function buildEyePath(shape: EyeShape): string {
  const width = EYE_WIDTH * shape.w;
  const height = Math.max(EYE_HEIGHT * shape.h, 1.4);
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(hw, hh);
  const capY = Math.max(0, hh - r);
  const flatX = Math.max(0, hw - r);
  const k = 0.5523;
  const kx = flatX * 0.52 + k * r;

  const tArch = shape.topArch ?? shape.arch ?? 0;
  const bArch = shape.botArch ?? shape.arch ?? 0;
  const meanArch = (tArch + bArch) * 0.5;
  const edgeDrop = -meanArch * 0.42;

  const endSlope = clamp(-meanArch / Math.max(hw, 1), -0.75, 0.75);
  const ky = k * r * (1 - Math.abs(endSlope) * 0.45);
  const tipOutX = r * 0.35 * Math.abs(endSlope);

  const sideTopY = -capY + edgeDrop;
  const sideBotY = capY + edgeDrop;
  const topPeakY = -hh + tArch + edgeDrop;
  const botTroughY = hh + bArch + edgeDrop;

  const topTipDelta = tipOutX * (tArch < 0 ? 0.5 : -0.5);
  const botTipDelta = tipOutX * (bArch > 0 ? 0.5 : -0.5);

  const f = (n: number) => n.toFixed(2);

  return [
    `M ${f(-hw)} ${f(sideTopY)}`,
    `C ${f(-hw - topTipDelta)} ${f(sideTopY - ky)} ${f(-kx)} ${f(topPeakY)} 0.00 ${f(topPeakY)}`,
    `C ${f(kx)} ${f(topPeakY)} ${f(hw + topTipDelta)} ${f(sideTopY - ky)} ${f(hw)} ${f(sideTopY)}`,
    `C ${f(hw)} ${f(sideTopY + capY * 0.33)} ${f(hw)} ${f(sideBotY - capY * 0.33)} ${f(hw)} ${f(sideBotY)}`,
    `C ${f(hw + botTipDelta)} ${f(sideBotY + ky)} ${f(kx)} ${f(botTroughY)} 0.00 ${f(botTroughY)}`,
    `C ${f(-kx)} ${f(botTroughY)} ${f(-hw - botTipDelta)} ${f(sideBotY + ky)} ${f(-hw)} ${f(sideBotY)}`,
    `C ${f(-hw)} ${f(sideBotY - capY * 0.33)} ${f(-hw)} ${f(sideTopY + capY * 0.33)} ${f(-hw)} ${f(sideTopY)}`,
    "Z",
  ].join(" ");
}

interface OrbEyeProps {
  fill: string;
  gazeX: MotionValue<number>;
  gazeY: MotionValue<number>;
  lidControls: ReturnType<typeof useAnimationControls>;
  shape: EyeShape;
  shouldReduceMotion: boolean;
  side: -1 | 1;
}

/**
 * Single eye rendered inside nested SVG groups so spherical gaze projection,
 * volume-preserving blinks, and shape morphing compose cleanly without jitter.
 */
function OrbEye({
  fill,
  gazeX,
  gazeY,
  lidControls,
  shape,
  shouldReduceMotion,
  side,
}: OrbEyeProps) {
  const restX = CENTER + side * EYE_OFFSET;
  const restY = EYE_Y + EYE_HEIGHT / 2;

  const projX = useTransform(gazeX, (gx) => {
    const compression = Math.max(0, side * (gx / GAZE_RANGE));
    return restX + gx * (1 - compression * 0.14);
  });

  const projY = useTransform([gazeX, gazeY], (values: number[]) => {
    const [gx, gy] = values;
    const edgeDrop = Math.abs(gx / GAZE_RANGE) * 0.55 * (gy >= 0 ? 1 : -0.6);
    return restY + gy + edgeDrop;
  });

  const projScaleX = useTransform(gazeX, (gx) => {
    const lead = clamp(side * (gx / GAZE_RANGE), -0.25, 1);
    return 1 - Math.max(0, lead) * 0.15;
  });

  const projRotate = useTransform([gazeX, gazeY], (values: number[]) => {
    const [gx, gy] = values;
    return (gx / GAZE_RANGE) * (gy / GAZE_RANGE) * side * 3.5;
  });

  const eyePath = buildEyePath(shape);
  const morphTransition = shouldReduceMotion
    ? { duration: 0 }
    : { bounce: 0.16, duration: 0.28, type: "spring" as const };

  return (
    <motion.g
      style={{
        rotate: projRotate,
        scaleX: projScaleX,
        transformOrigin: "0px 0px",
        x: projX,
        y: projY,
      }}
    >
      <motion.g
        animate={lidControls}
        initial={{ scaleX: 1, scaleY: 1, y: 0 }}
        style={{ transformOrigin: "0px 0px" }}
      >
        <motion.g
          animate={{ rotate: shape.rotate ?? 0, y: shape.dy ?? 0 }}
          style={{ transformOrigin: "0px 0px" }}
          transition={morphTransition}
        >
          <motion.path
            animate={{ d: eyePath }}
            fill={fill}
            initial={false}
            transition={morphTransition}
          />
        </motion.g>
      </motion.g>
    </motion.g>
  );
}

/**
 * Expressive AI character combining a WebGL2 marbling sphere with organically
 * choreographed face motions: spherical eye parallax, idle curiosity glances,
 * elastic blinks, joyful multi-bounce leaps on `done`, and deflated sadness on `error`.
 */
const AIOrbFace = ({
  "aria-label": ariaLabel,
  amplitude,
  className,
  colors,
  expression,
  gaze = true,
  moodImpulse,
  motionScale,
  size = 128,
  state = "idle",
}: AIOrbFaceProps) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const amplitudeValue = useAmplitudeValue(amplitude);
  const stateShader = STATE_SHADER[state] ?? STATE_SHADER.idle;
  const bodyColor =
    colors?.body ?? stateShader.colors?.[0] ?? DEFAULT_COLORS.body;
  const bodyEdgeColor =
    colors?.bodyEdge ?? stateShader.colors?.[1] ?? DEFAULT_COLORS.bodyEdge;
  const featureColor = colors?.feature ?? DEFAULT_COLORS.feature;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const leftLid = useAnimationControls();
  const rightLid = useAnimationControls();
  const gestureControls = useAnimationControls();

  // Scale translation distances cleanly so both 28px header and 128px hero sizes move naturally
  const pxScale =
    typeof motionScale === "number"
      ? Math.max(0.24, motionScale)
      : typeof size === "number"
        ? Math.max(0.24, size / 100)
        : 1;

  const gazeX = useSpring(0, { damping: 24, stiffness: 240 });
  const gazeY = useSpring(0, { damping: 24, stiffness: 240 });

  const liveX = useMotionValue(0);
  const liveY = useMotionValue(0);
  const liveScaleX = useMotionValue(1);
  const liveScaleY = useMotionValue(1);
  const liveRotate = useMotionValue(0);

  const orbLightX = useTransform(gazeX, (gx) => -0.6 + (gx / GAZE_RANGE) * 0.22);
  const orbLightY = useTransform(gazeY, (gy) => -1.0 + (gy / GAZE_RANGE) * 0.22);

  const resolvedSize = typeof size === "number" ? `${size}px` : size;

  const isDone = state === "done";
  const isThinking = state === "thinking";
  const isError = state === "error";
  const isListening = state === "listening";
  const isStreaming = state === "streaming";
  const isIdle = state === "idle";

  const [hopefulSeqActive, setHopefulSeqActive] = useState(0);
  const lastHandledImpulseRef = useRef(0);
  const isHopefulMood = hopefulSeqActive > 0 && !isError && !isDone;

  useEffect(() => {
    if (isError || isDone) {
      setHopefulSeqActive(0);
      return;
    }
    const seq = moodImpulse?.kind === "hopeful" ? moodImpulse.seq : 0;
    if (seq <= 0 || seq === lastHandledImpulseRef.current) {
      return;
    }
    lastHandledImpulseRef.current = seq;
    setHopefulSeqActive(seq);
    const timerId = window.setTimeout(() => {
      setHopefulSeqActive((cur) => (cur === seq ? 0 : cur));
    }, 1450);
    return () => window.clearTimeout(timerId);
  }, [isDone, isError, moodImpulse]);

  const active: Expression = (() => {
    if (typeof expression === "object") {
      return expression;
    }
    if (expression) {
      return EXPRESSIONS[expression];
    }
    if (isHopefulMood) {
      return EXPRESSIONS.hopeful;
    }
    return EXPRESSIONS[STATE_EXPRESSION[state] ?? "neutral"];
  })();

  const mountedRef = useRef(false);
  const lastPointerAtRef = useRef(0);
  const prevStateRef = useRef<AIState>(state);
  const lastSaccadeIdxRef = useRef(-1);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Elastic, volume-preserving blink with subtle left/right asymmetry
  const blink = useCallback(
    async (double = false) => {
      if (!mountedRef.current || shouldReduceMotion) {
        return;
      }
      const closeT = { duration: 0.065, ease: EASE_IN };
      const openT = { duration: 0.16, ease: EASE_OUT };

      const closeLeft = leftLid.start(
        { scaleX: 1.14, scaleY: 0.08, y: 1.1 },
        closeT
      );
      const closeRight = new Promise<void>((resolve) => {
        setTimeout(() => {
          if (!mountedRef.current) {
            resolve();
            return;
          }
          void rightLid
            .start({ scaleX: 1.14, scaleY: 0.08, y: 1.1 }, closeT)
            .then(resolve);
        }, 14);
      });
      await Promise.all([closeLeft, closeRight]);

      if (!mountedRef.current) {
        return;
      }

      if (double) {
        await Promise.all([
          leftLid.start({ scaleX: 1, scaleY: 0.9, y: 0 }, closeT),
          rightLid.start({ scaleX: 1, scaleY: 0.9, y: 0 }, closeT),
        ]);
        if (mountedRef.current) {
          await blink(false);
        }
        return;
      }

      await Promise.all([
        leftLid.start(
          { scaleX: [1.14, 0.97, 1], scaleY: [0.08, 1.05, 1], y: [1.1, -0.35, 0] },
          openT
        ),
        rightLid.start(
          { scaleX: [1.14, 0.97, 1], scaleY: [0.08, 1.05, 1], y: [1.1, -0.35, 0] },
          openT
        ),
      ]);
    },
    [leftLid, rightLid, shouldReduceMotion]
  );

  // Trigger a crisp transition blink when shifting attention between states
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (shouldReduceMotion || prev === state) {
      return;
    }
    if (state === "listening" || state === "done" || state === "streaming") {
      void blink(false);
    }
  }, [blink, shouldReduceMotion, state]);

  // Ambient blink cadence (slightly slower, heavier cadence when sad in error state)
  useEffect(() => {
    if (shouldReduceMotion || isDone) {
      return;
    }
    let timeout: ReturnType<typeof setTimeout>;
    let mounted = true;
    const minWait = isError ? 4200 : BLINK_MIN_MS;
    const extraWait = isError ? 2400 : BLINK_EXTRA_MS;

    const schedule = () => {
      timeout = setTimeout(
        () => {
          if (mounted) {
            void blink(!isError && Math.random() < DOUBLE_BLINK_CHANCE);
          }
          schedule();
        },
        minWait + Math.random() * extraWait
      );
    };
    schedule();
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [blink, isDone, isError, shouldReduceMotion]);

  // Pointer gaze tracking during idle, listening, and streaming
  useEffect(() => {
    if (!gaze || shouldReduceMotion || isThinking || isError || isDone) {
      return;
    }
    const handle = (event: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) {
        return;
      }
      lastPointerAtRef.current = performance.now();
      const rect = svg.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const reach = Math.min(1, distance / GAZE_FALLOFF) * GAZE_RANGE;
      const angle = Math.atan2(dy, dx);
      gazeX.set(Math.cos(angle) * reach);
      gazeY.set(Math.sin(angle) * reach);
    };
    window.addEventListener("pointermove", handle, { passive: true });
    return () => window.removeEventListener("pointermove", handle);
  }, [gaze, gazeX, gazeY, isDone, isError, isThinking, shouldReduceMotion]);

  // Idle curiosity glances when the pointer has been still
  useEffect(() => {
    if (!isIdle || shouldReduceMotion) {
      return;
    }
    let timeout: ReturnType<typeof setTimeout>;
    let returnTimeout: ReturnType<typeof setTimeout>;
    let mounted = true;

    const schedule = () => {
      timeout = setTimeout(
        () => {
          if (!mounted) {
            return;
          }
          const msSincePointer = performance.now() - lastPointerAtRef.current;
          if (msSincePointer > IDLE_GLANCE_DELAY_MS) {
            const angle = Math.random() * Math.PI * 2;
            const radius = (0.3 + Math.random() * 0.4) * GAZE_RANGE;
            gazeX.set(Math.cos(angle) * radius);
            gazeY.set(Math.sin(angle) * radius * 0.7);
            clearTimeout(returnTimeout);
            returnTimeout = setTimeout(
              () => {
                if (
                  mounted &&
                  performance.now() - lastPointerAtRef.current >
                    IDLE_GLANCE_DELAY_MS
                ) {
                  gazeX.set(0);
                  gazeY.set(0);
                }
              },
              900 + Math.random() * 700
            );
          }
          schedule();
        },
        IDLE_GLANCE_INTERVAL_MIN_MS +
          Math.random() * IDLE_GLANCE_INTERVAL_EXTRA_MS
      );
    };
    schedule();

    return () => {
      mounted = false;
      clearTimeout(timeout);
      clearTimeout(returnTimeout);
    };
  }, [gazeX, gazeY, isIdle, shouldReduceMotion]);

  // Randomized non-repeating upward saccades while thinking
  useEffect(() => {
    if (!isThinking || shouldReduceMotion) {
      return;
    }
    let timeout: ReturnType<typeof setTimeout>;
    let mounted = true;

    const schedule = () => {
      timeout = setTimeout(
        () => {
          if (!mounted) {
            return;
          }
          let nextIdx = Math.floor(Math.random() * SACCADE_TARGETS.length);
          if (nextIdx === lastSaccadeIdxRef.current) {
            nextIdx = (nextIdx + 1) % SACCADE_TARGETS.length;
          }
          lastSaccadeIdxRef.current = nextIdx;
          const target = SACCADE_TARGETS[nextIdx];
          gazeX.set(target.x * GAZE_RANGE);
          gazeY.set(target.y * GAZE_RANGE);
          schedule();
        },
        SACCADE_MIN_MS + Math.random() * SACCADE_EXTRA_MS
      );
    };
    schedule();
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [gazeX, gazeY, isThinking, shouldReduceMotion]);

  // Discrete emotional choreographies: joyful double-bounce (`done`) and sad slump (`error`)
  useEffect(() => {
    let activeRun = true;

    if (shouldReduceMotion) {
      gestureControls.set({ rotate: 0, scaleX: 1, scaleY: 1, x: 0, y: 0 });
      if (isError) {
        gazeX.set(-0.22 * GAZE_RANGE);
        gazeY.set(0.65 * GAZE_RANGE);
      } else if (isDone) {
        gazeX.set(0);
        gazeY.set(-0.2 * GAZE_RANGE);
      }
      return;
    }

    if (isDone) {
      gazeX.set(0);
      gazeY.set(-0.22 * GAZE_RANGE);
      const jumpPeak = -26 * pxScale;
      const hopPeak = -13 * pxScale;
      const crouchY = 3.5 * pxScale;

      void gestureControls.start(
        {
          rotate: [0, -2, -7, 5, 6, -3, 0],
          scaleX: [1, 1.14, 0.87, 1.13, 0.92, 1.06, 1],
          scaleY: [1, 0.84, 1.16, 0.86, 1.1, 0.94, 1],
          x: [0, 0, -2 * pxScale, 1.5 * pxScale, 2 * pxScale, -1 * pxScale, 0],
          y: [0, crouchY, jumpPeak, crouchY * 0.8, hopPeak, crouchY * 0.4, 0],
        },
        {
          duration: 1.15,
          ease: EASE_OUT,
          times: [0, 0.1, 0.34, 0.52, 0.7, 0.86, 1],
        }
      );

      return () => {
        activeRun = false;
      };
    }

    if (isError) {
      // Downcast apologetic gaze toward the floor
      gazeX.set(-0.24 * GAZE_RANGE);
      gazeY.set(0.68 * GAZE_RANGE);

      void (async () => {
        await gestureControls.start(
          {
            rotate: [0, -4, 4, -3, -7, -5.5],
            scaleX: [1, 0.99, 1.02, 1.04, 1.07, 1.05],
            scaleY: [1, 1.01, 0.97, 0.94, 0.9, 0.92],
            x: [
              0,
              -3.5 * pxScale,
              3.5 * pxScale,
              -2.5 * pxScale,
              2 * pxScale,
              0,
            ],
            y: [
              0,
              -1 * pxScale,
              1.5 * pxScale,
              4 * pxScale,
              8 * pxScale,
              9.5 * pxScale,
            ],
          },
          {
            duration: 0.78,
            ease: [0.32, 0, 0.45, 1],
            times: [0, 0.12, 0.26, 0.46, 0.76, 1],
          }
        );
        if (!activeRun || !mountedRef.current) {
          return;
        }
        // Settle softly into ongoing dejected posture until error clears
        void gestureControls.start(
          {
            rotate: -4.5,
            scaleX: 1.04,
            scaleY: 0.94,
            x: 0,
            y: 7.5 * pxScale,
          },
          { damping: 20, stiffness: 110, type: "spring" }
        );
      })();

      return () => {
        activeRun = false;
      };
    }

    if (isHopefulMood) {
      // Bright childlike perk-up gaze upward toward the user on being given a second chance
      gazeX.set(0.08 * GAZE_RANGE);
      gazeY.set(-0.34 * GAZE_RANGE);

      void gestureControls.start(
        {
          rotate: [-4, 7, -6, 5, -3, 2, 0],
          scaleX: [1.04, 0.9, 1.12, 0.91, 1.08, 0.97, 1],
          scaleY: [0.94, 1.12, 0.88, 1.1, 0.93, 1.04, 1],
          x: [
            0,
            2 * pxScale,
            -2.5 * pxScale,
            2 * pxScale,
            -1.5 * pxScale,
            0.5 * pxScale,
            0,
          ],
          y: [
            7 * pxScale,
            -18 * pxScale,
            2 * pxScale,
            -12 * pxScale,
            1 * pxScale,
            -4 * pxScale,
            0,
          ],
        },
        {
          duration: 1.15,
          ease: EASE_OUT,
          times: [0, 0.22, 0.4, 0.58, 0.74, 0.88, 1],
        }
      );

      return () => {
        activeRun = false;
      };
    }

    // Smooth spring recovery back to neutral posture when leaving done / error
    void gestureControls.start(
      { rotate: 0, scaleX: 1, scaleY: 1, x: 0, y: 0 },
      { damping: 18, stiffness: 180, type: "spring" }
    );

    return () => {
      activeRun = false;
    };
  }, [
    gestureControls,
    gazeX,
    gazeY,
    isDone,
    isError,
    isHopefulMood,
    pxScale,
    shouldReduceMotion,
  ]);

  // Continuous 60fps organic motion layer: breathing, head follow-through, speaking pulses, and sad sighs
  useAnimationFrame((time, delta) => {
    const dtSec = Math.min(delta / 1000, 0.05);
    const alpha = 1 - Math.exp(-dtSec * 8.5);

    if (shouldReduceMotion) {
      liveX.set(0);
      liveY.set(0);
      liveScaleX.set(1);
      liveScaleY.set(1);
      liveRotate.set(0);
      return;
    }

    const t = time / 1000;
    const gx = gazeX.get() / GAZE_RANGE;
    const gy = gazeY.get() / GAZE_RANGE;
    const amp = amplitudeValue.get();

    const followX = gx * 2.2 * pxScale;
    const followY = gy * 2.0 * pxScale;
    const followRot = gx * 3.2;

    let tx = followX;
    let ty = followY;
    let tsx = 1;
    let tsy = 1;
    let trot = followRot;

    if (isHopefulMood) {
      const bounce = Math.abs(Math.sin(t * 4.4));
      ty = followY - bounce * 2.4 * pxScale;
      tsx = 1 + bounce * 0.025;
      tsy = 1 - bounce * 0.015;
      trot = followRot + Math.sin(t * 2.8) * 3.0;
    } else if (isIdle) {
      const breath = Math.sin(t * 1.45) * 0.65 + Math.sin(t * 2.35 + 1.1) * 0.35;
      ty = followY - breath * 1.6 * pxScale;
      tsx = 1 + breath * 0.011;
      tsy = 1 - breath * 0.008;
      trot = followRot + Math.sin(t * 0.9) * 1.1;
    } else if (isListening) {
      ty = followY - amp * 4.5 * pxScale;
      tsx = 1 + amp * 0.055;
      tsy = 1 + amp * 0.07;
    } else if (isThinking) {
      const sway = Math.sin(t * 1.6);
      tx = followX + sway * 1.1 * pxScale;
      ty = followY - Math.abs(Math.cos(t * 1.2)) * 1.2 * pxScale;
      tsx = 1 + amp * 0.018;
      tsy = 1 - amp * 0.012;
      trot = followRot - 3.5 + sway * 2.2;
    } else if (isStreaming) {
      const nod = Math.sin(t * 4.2) * 0.35 + amp * 0.65;
      ty = followY - nod * 2.8 * pxScale;
      tsx = 1 + amp * 0.04;
      tsy = 1 + amp * 0.055;
      trot = followRot + Math.sin(t * 2.6) * 1.8;
    } else if (isDone) {
      const happyBob = Math.sin(t * 4.8) * 1.1;
      ty = followY - happyBob * pxScale;
      tsx = 1.02;
      tsy = 1.02;
    } else if (isError) {
      // Heavy slow chest sigh while slumped
      const sigh = 0.5 - 0.5 * Math.cos(t * 2.1);
      tx = 0;
      ty = sigh * 1.8 * pxScale;
      tsx = 1 + sigh * 0.025;
      tsy = 1 - sigh * 0.025;
      trot = Math.sin(t * 1.1) * 1.2;
    }

    liveX.set(liveX.get() + (tx - liveX.get()) * alpha);
    liveY.set(liveY.get() + (ty - liveY.get()) * alpha);
    liveScaleX.set(liveScaleX.get() + (tsx - liveScaleX.get()) * alpha);
    liveScaleY.set(liveScaleY.get() + (tsy - liveScaleY.get()) * alpha);
    liveRotate.set(liveRotate.get() + (trot - liveRotate.get()) * alpha);
  });

  // Orb draws its sphere at 86% of its own box, so we clip at the exact r=48
  // sphere boundary (inset-[2%]) and scale the inner canvas by 1 / 0.86.
  const orbCanvasSpan = (1 / ORB_SPHERE_FRACTION) * 100;
  const orbCanvasOffset = (100 - orbCanvasSpan) / 2;

  return (
    <div
      className={cn("relative block", className)}
      style={{
        height: resolvedSize,
        width: resolvedSize,
      }}
    >
      <motion.div
        animate={gestureControls}
        className="relative size-full"
        initial={{ rotate: 0, scaleX: 1, scaleY: 1, x: 0, y: 0 }}
      >
        <motion.div
          className="relative size-full"
          style={{
            rotate: liveRotate,
            scaleX: liveScaleX,
            scaleY: liveScaleY,
            x: liveX,
            y: liveY,
          }}
        >
          <div className="absolute inset-[2%] rounded-full overflow-hidden">
            {/* Painted understudy so the body survives WebGL context reclamation */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at 34% 30%, ${bodyEdgeColor}, ${bodyColor} 72%)`,
              }}
            />
            <div
              className="absolute"
              style={{
                height: `${orbCanvasSpan}%`,
                left: `${orbCanvasOffset}%`,
                top: `${orbCanvasOffset}%`,
                width: `${orbCanvasSpan}%`,
              }}
            >
              <Orb
                amplitude={amplitudeValue}
                className="size-full"
                colors={[bodyColor, bodyEdgeColor]}
                flow={stateShader.flow}
                glow={0}
                grain={0.14}
                lightX={orbLightX}
                lightY={orbLightY}
                rim={stateShader.rim}
                size="100%"
                softness={0.0015}
                specular={stateShader.specular}
                speed={stateShader.speed}
                turbulence={stateShader.turbulence}
                wobble={stateShader.wobble}
              />
            </div>
          </div>

          <motion.svg
            aria-hidden={ariaLabel ? undefined : true}
            aria-label={ariaLabel}
            className="absolute inset-0 block size-full overflow-visible"
            ref={svgRef}
            role={ariaLabel ? "img" : undefined}
            shapeRendering="geometricPrecision"
            viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          >
            <title>{ariaLabel ?? "AI assistant character"}</title>

            <OrbEye
              fill={featureColor}
              gazeX={gazeX}
              gazeY={gazeY}
              lidControls={leftLid}
              shape={active.left}
              shouldReduceMotion={shouldReduceMotion}
              side={-1}
            />
            <OrbEye
              fill={featureColor}
              gazeX={gazeX}
              gazeY={gazeY}
              lidControls={rightLid}
              shape={active.right}
              shouldReduceMotion={shouldReduceMotion}
              side={1}
            />
          </motion.svg>

          {/* Subtle top-left glass specular glaze so eyes read inside the curved surface */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[2%] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 32% 24%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 26%, transparent 56%)",
              boxShadow:
                "inset 0 1px 2px rgba(255,255,255,0.16), inset 0 -2px 4px rgba(0,0,0,0.22)",
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AIOrbFace;
