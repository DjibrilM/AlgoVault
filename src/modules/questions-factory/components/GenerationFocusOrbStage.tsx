import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RotateCcw } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { AIAmplitude, AIState } from '@/components/ui/smoothui/ai-core'
import AIOrbFace from '@/components/ui/smoothui/ai-orb-face'
import StaggerFromCenter from '@/components/ui/smoothui/stagger-from-center'
import { cn } from '@/lib/utils'
import type { GenerationOverlayPhase, GenerationProcessStatus } from '../types'

interface GenerationFocusOrbStageProps {
  orbSlotRef: RefObject<HTMLDivElement>
  phase: GenerationOverlayPhase
  processStatus: GenerationProcessStatus | null
  orbState: AIState
  amplitude: AIAmplitude
  isRetryPromptVisible: boolean
  retryImpulseSeq: number
  onRetry: () => void
  onCancelRetry: () => void
  onReturnComplete: () => void
}

interface SlotBox {
  left: number
  top: number
  width: number
  height: number
}

const BASE_ORB_SIZE = 140
const CENTER_VERTICAL_OFFSET = 32
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const
const ORB_TRANSITIONS = {
  reduced: { duration: 0.05 },
  idle: { duration: 0 },
  preparing: { duration: 0.56, ease: EASE_OUT_EXPO },
  returning: { duration: 0.5, ease: EASE_OUT_EXPO },
} as const
const CELEBRATION_SHADOW_TIMES = [0, 0.1, 0.34, 0.52, 0.7, 0.86, 1]
const HOPEFUL_SHADOW_TIMES = [0, 0.22, 0.4, 0.58, 0.74, 0.88, 1]

/**
 * Coordinates the single persistent AIOrbFace across the header corner slot and
 * center-stage generation overlay so its WebGL2 context stays live throughout zoom transitions.
 */
export function GenerationFocusOrbStage({
  orbSlotRef,
  phase,
  processStatus,
  orbState,
  amplitude,
  isRetryPromptVisible,
  retryImpulseSeq,
  onRetry,
  onCancelRetry,
  onReturnComplete,
}: GenerationFocusOrbStageProps) {
  const shouldReduceMotion = Boolean(useReducedMotion())
  const [slotBox, setSlotBox] = useState<SlotBox | null>(null)
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }))
  const [hopefulShadowSeq, setHopefulShadowSeq] = useState(0)

  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const onReturnCompleteRef = useRef(onReturnComplete)
  onReturnCompleteRef.current = onReturnComplete
  const returnNotifiedRef = useRef(false)
  const lastRetrySeqRef = useRef(0)

  useEffect(() => {
    if (orbState === 'error' || orbState === 'done' || phase !== 'preparing') {
      setHopefulShadowSeq(0)
      return
    }
    if (retryImpulseSeq <= 0 || retryImpulseSeq === lastRetrySeqRef.current) return
    lastRetrySeqRef.current = retryImpulseSeq
    setHopefulShadowSeq(retryImpulseSeq)
    const timerId = window.setTimeout(() => {
      setHopefulShadowSeq((cur) => (cur === retryImpulseSeq ? 0 : cur))
    }, 1250)
    return () => window.clearTimeout(timerId)
  }, [orbState, phase, retryImpulseSeq])

  const measureGeometry = useCallback(() => {
    const slotEl = orbSlotRef.current
    if (slotEl) {
      const rect = slotEl.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setSlotBox((prev) =>
          prev &&
          Math.abs(prev.left - rect.left) < 0.5 &&
          Math.abs(prev.top - rect.top) < 0.5 &&
          Math.abs(prev.width - rect.width) < 0.5 &&
          Math.abs(prev.height - rect.height) < 0.5
            ? prev
            : { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
        )
      }
    }

    if (typeof window !== 'undefined') {
      setViewport((prev) =>
        prev.width === window.innerWidth && prev.height === window.innerHeight
          ? prev
          : { width: window.innerWidth, height: window.innerHeight }
      )
    }
  }, [orbSlotRef])

  useLayoutEffect(() => {
    measureGeometry()
  }, [measureGeometry])

  useEffect(() => {
    const slotEl = orbSlotRef.current
    const headerEl = slotEl?.closest('header') ?? null
    const shellEl = headerEl?.parentElement ?? null

    const observer = new ResizeObserver(measureGeometry)
    if (slotEl) observer.observe(slotEl)
    if (headerEl) observer.observe(headerEl)
    if (shellEl) observer.observe(shellEl)

    window.addEventListener('resize', measureGeometry)
    window.addEventListener('scroll', measureGeometry, true)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measureGeometry)
      window.removeEventListener('scroll', measureGeometry, true)
    }
  }, [measureGeometry, orbSlotRef])

  const notifyReturnCompleteOnce = useCallback(() => {
    if (phaseRef.current !== 'returning' || returnNotifiedRef.current) return
    returnNotifiedRef.current = true
    onReturnCompleteRef.current()
  }, [])

  // Safety fallback so reduced-motion or skipped animations never trap the orb in 'returning'
  useEffect(() => {
    if (phase !== 'returning') {
      returnNotifiedRef.current = false
      return
    }

    returnNotifiedRef.current = false
    measureGeometry()
    const fallbackMs = shouldReduceMotion ? 60 : 620
    const timeoutId = window.setTimeout(notifyReturnCompleteOnce, fallbackMs)
    return () => window.clearTimeout(timeoutId)
  }, [measureGeometry, notifyReturnCompleteOnce, phase, shouldReduceMotion])

  if (typeof document === 'undefined' || !slotBox) {
    return null
  }

  const centerSize = Math.min(
    BASE_ORB_SIZE,
    Math.max(96, Math.round(Math.min(viewport.width, viewport.height) * 0.22))
  )
  const centerX = Math.round(viewport.width / 2)
  const centerY = Math.round(viewport.height / 2 - CENTER_VERTICAL_OFFSET)
  const slotCenterX = slotBox.left + slotBox.width / 2
  const slotCenterY = slotBox.top + slotBox.height / 2

  const isCentered = phase === 'preparing'
  const targetCenterX = isCentered ? centerX : slotCenterX
  const targetCenterY = isCentered ? centerY : slotCenterY
  const targetScale = (isCentered ? centerSize : slotBox.width) / BASE_ORB_SIZE
  const translateX = Math.round(targetCenterX - BASE_ORB_SIZE / 2)
  const translateY = Math.round(targetCenterY - BASE_ORB_SIZE / 2)

  const floorShadowTop = centerY + Math.round(centerSize / 2) + 16
  const processTextTop = floorShadowTop + 52
  const isErrorState = orbState === 'error'
  const isDoneState = orbState === 'done'
  const isHopefulBounce = hopefulShadowSeq > 0 && !isErrorState && !isDoneState

  const orbTransition = shouldReduceMotion ? ORB_TRANSITIONS.reduced : ORB_TRANSITIONS[phase]

  // Match directional floor shadow expansion/contraction to the orb's height above the floor
  const floorShadowAnimate = shouldReduceMotion
    ? { opacity: 0.92, scaleX: 1, scaleY: 1, x: 0 }
    : isDoneState
      ? {
          scaleX: [1, 1.16, 0.56, 1.09, 0.74, 1.04, 1],
          scaleY: [1, 1.12, 0.72, 1.04, 0.84, 1.01, 1],
          opacity: [0.95, 1, 0.34, 0.96, 0.58, 0.95, 0.95],
          x: [0, 0, -2, 2, 2, -1, 0],
        }
      : isHopefulBounce
        ? {
            scaleX: [0.94, 0.68, 1.06, 0.76, 1.04, 0.92, 1],
            scaleY: [1.04, 0.78, 1.05, 0.85, 1.02, 0.96, 1],
            opacity: [0.96, 0.46, 0.95, 0.56, 0.94, 0.82, 0.92],
            x: [-2, 2, -2, 2, -1, 0, 0],
          }
        : isErrorState
          ? { scaleX: 0.94, scaleY: 1.04, opacity: 1, x: -2 }
          : {
              scaleX: [1, 0.91, 1],
              scaleY: [1, 0.95, 1],
              opacity: [0.92, 0.74, 0.92],
              x: 0,
            }

  const floorShadowTransition = shouldReduceMotion
    ? { duration: 0.1 }
    : isDoneState
      ? { duration: 1.15, ease: EASE_OUT_EXPO, times: CELEBRATION_SHADOW_TIMES }
      : isHopefulBounce
        ? { duration: 1.15, ease: EASE_OUT_EXPO, times: HOPEFUL_SHADOW_TIMES }
        : isErrorState
          ? { duration: 0.5, ease: EASE_OUT_EXPO }
          : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const }

  const progressFraction = processStatus
    ? processStatus.stepIndex >= processStatus.totalSteps
      ? 1
      : Math.min(0.94, (processStatus.stepIndex + 1) / Math.max(1, processStatus.totalSteps + 0.25))
    : 0

  return createPortal(
    <>
      <AnimatePresence>
        {phase === 'preparing' && (
          <motion.div
            key="generation-focus-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            aria-modal="true"
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-50 bg-[#0A0A0C]/92 backdrop-blur-2xl backdrop-saturate-150 select-none"
          >
            {/* Sculpted dark studio room gradient with natural depth falloff */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 84% 72% at 50% 42%, rgba(32, 32, 38, 0.44) 0%, rgba(12, 12, 15, 0.8) 54%, rgba(5, 5, 7, 0.96) 100%)',
              }}
            />

            {/* Soft top-left key fill & behind-orb rim separation */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-opacity duration-500"
              style={{
                background: isErrorState
                  ? `radial-gradient(230px circle at 50% ${centerY}px, rgba(225, 29, 72, 0.12), transparent 72%)`
                  : isDoneState || isHopefulBounce
                    ? `radial-gradient(260px circle at 50% ${centerY}px, rgba(255, 255, 255, 0.085), rgba(216, 180, 254, 0.04) 46%, transparent 74%)`
                    : `radial-gradient(220px circle at 48% ${centerY - 8}px, rgba(255, 255, 255, 0.055), transparent 72%)`,
              }}
            />

            {/* Lit matte studio floor plane receiving both contact shadow & caustic refraction */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 520px 104px at 50% ${floorShadowTop + 12}px, rgba(255, 255, 255, 0.055) 0%, rgba(255, 255, 255, 0.018) 44%, transparent 74%)`,
              }}
            />

            {/* Multi-layered directional shadow + translucent caustic bounce on the floor plane */}
            <motion.div
              aria-hidden
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.55 }}
              transition={{ duration: 0.42, delay: 0.14, ease: EASE_OUT_EXPO }}
              style={{ top: floorShadowTop }}
              className="pointer-events-none fixed left-1/2 -translate-x-1/2 flex items-center justify-center"
            >
              <motion.div
                animate={floorShadowAnimate}
                transition={floorShadowTransition}
                className="relative flex items-center justify-center"
              >
                {/* Wide soft directional penumbra angled down-right away from top-left light */}
                <div
                  className="w-52 h-9 rounded-full blur-xl translate-x-[10px] translate-y-[2px]"
                  style={{
                    background:
                      'radial-gradient(ellipse at 44% 48%, rgba(0, 0, 0, 0.90) 0%, rgba(0, 0, 0, 0.46) 52%, transparent 80%)',
                  }}
                />

                {/* Mid ground occlusion umbra */}
                <div
                  className="absolute w-30 h-4 rounded-full blur-[6px] translate-x-[4px]"
                  style={{
                    background:
                      'radial-gradient(ellipse at 46% 50%, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.72) 55%, transparent 82%)',
                  }}
                />

                {/* Tightest shadow anchor beneath lower sphere curvature */}
                <div className="absolute w-16 h-1.5 rounded-full bg-black/95 blur-[2.5px] translate-x-[2px]" />

                {/* Faint translucent caustic light passing through the glowing sphere */}
                <div
                  className="absolute w-20 h-2.5 rounded-full blur-[7px] translate-x-[6px] translate-y-[1px]"
                  style={{
                    background: isErrorState
                      ? 'radial-gradient(ellipse at center, rgba(244, 63, 94, 0.14) 0%, transparent 78%)'
                      : 'radial-gradient(ellipse at center, rgba(226, 178, 255, 0.22) 0%, rgba(242, 90, 237, 0.10) 48%, transparent 80%)',
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Staggered center-out AI companion copy, progress track, and retry action */}
            {processStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.3, delay: 0.12, ease: EASE_OUT_EXPO }}
                style={{ top: processTextTop }}
                className="fixed left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 flex flex-col items-center text-center gap-4"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${processStatus.stepIndex}-${processStatus.label}`}
                    initial={{ opacity: 1 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -10, filter: 'blur(4px)' }
                    }
                    transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <StaggerFromCenter
                      delay={processStatus.stepIndex === 0 && !isHopefulBounce ? 140 : 15}
                      stagger={14}
                      className={cn(
                        'text-[15px] font-medium tracking-[-0.01em]',
                        isErrorState
                          ? 'text-rose-200'
                          : isDoneState || isHopefulBounce
                            ? 'text-white'
                            : 'text-[#F4F4F5]'
                      )}
                    >
                      {processStatus.label}
                    </StaggerFromCenter>

                    {processStatus.detail && (
                      <motion.p
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.36,
                          delay: processStatus.stepIndex === 0 && !isHopefulBounce ? 0.24 : 0.14,
                          ease: EASE_OUT_EXPO,
                        }}
                        className="text-xs text-[#8C8C96]"
                      >
                        {processStatus.detail}
                      </motion.p>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Minimal architectural progress track */}
                <div
                  aria-hidden
                  className="w-36 h-[2px] rounded-full bg-white/[0.08] overflow-hidden"
                >
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: progressFraction }}
                    transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
                    style={{ originX: 0 }}
                    className={cn(
                      'h-full w-full rounded-full transition-colors duration-300',
                      isErrorState
                        ? 'bg-rose-400'
                        : isDoneState
                          ? 'bg-white'
                          : 'bg-white/75'
                    )}
                  />
                </div>

                {/* Second-chance retry prompt rendered neatly on failure */}
                <AnimatePresence>
                  {isRetryPromptVisible && (
                    <motion.div
                      key="generation-retry-actions"
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                      className="flex items-center gap-2.5 pt-1"
                    >
                      <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-1.5 rounded-md bg-white hover:bg-white/90 text-[#111113] text-xs font-medium h-8 px-4 shadow-lg shadow-black/40 transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>Retry</span>
                      </button>

                      <button
                        type="button"
                        onClick={onCancelRetry}
                        className="inline-flex items-center rounded-md text-xs text-[#8C8C96] hover:text-white h-8 px-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single persistent orb animated strictly with GPU transforms */}
      <motion.div
        initial={false}
        animate={{
          x: translateX,
          y: translateY,
          scale: targetScale,
        }}
        transition={orbTransition}
        onAnimationComplete={() => {
          if (phaseRef.current === 'returning') {
            notifyReturnCompleteOnce()
          }
        }}
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          width: BASE_ORB_SIZE,
          height: BASE_ORB_SIZE,
          transformOrigin: 'center center',
          zIndex: phase === 'idle' ? 20 : 60,
        }}
      >
        <AIOrbFace
          amplitude={amplitude}
          aria-label={`Questions Factory is ${orbState}`}
          moodImpulse={retryImpulseSeq > 0 ? { kind: 'hopeful', seq: retryImpulseSeq } : null}
          size={BASE_ORB_SIZE}
          state={orbState}
        />
      </motion.div>
    </>,
    document.body
  )
}
