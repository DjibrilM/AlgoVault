import { useCallback, useEffect, useRef, useState } from 'react'

const SIMULATION_STEPS = [
  'I want to practice some LinkedList problems.',
  '5 questions please',
  'Progress from easiest to hardest',
  'A mixture of both',
  'Yes',
] as const

interface UsePipelineSimulationOptions {
  onResetSession: () => void
  onSetPromptText: (text: string) => void
  onSubmitStep: (text: string) => Promise<void>
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Drives the automated multi-turn UI simulation pipeline with clean cancellation
 * when stopped manually or on unmount.
 */
export function usePipelineSimulation({
  onResetSession,
  onSetPromptText,
  onSubmitStep,
}: UsePipelineSimulationOptions) {
  const [isSimulating, setIsSimulating] = useState(false)
  const simulationIdRef = useRef(0)

  // Always call the latest callbacks across awaited delays
  const submitStepRef = useRef(onSubmitStep)
  submitStepRef.current = onSubmitStep

  useEffect(() => {
    return () => {
      simulationIdRef.current += 1
    }
  }, [])

  const stopSimulation = useCallback(() => {
    simulationIdRef.current += 1
    setIsSimulating(false)
    onSetPromptText('')
  }, [onSetPromptText])

  const runSimulation = useCallback(async () => {
    const runId = ++simulationIdRef.current
    setIsSimulating(true)
    onResetSession()

    for (const stepText of SIMULATION_STEPS) {
      if (simulationIdRef.current !== runId) return
      // Populate prompt input briefly so the orb enters listening state
      onSetPromptText(stepText)
      await wait(900)
      if (simulationIdRef.current !== runId) return
      await submitStepRef.current(stepText)
      await wait(1400)
    }

    if (simulationIdRef.current === runId) {
      setIsSimulating(false)
    }
  }, [onResetSession, onSetPromptText])

  return {
    isSimulating,
    runSimulation,
    stopSimulation,
  }
}

