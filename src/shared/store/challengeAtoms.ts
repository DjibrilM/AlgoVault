import { atom } from 'jotai'
import { SupportedLang, RunResult } from '@/shared/types/problem'
import {
  selectedProblemIdAtom,
  activeProblemsAtom,
} from './problemAtoms'

export const editorCodeAtom = atom<string>('')
export const selectedLangAtom = atom<SupportedLang>('typescript')
export const isRunningAtom = atom<boolean>(false)
export const runResultAtom = atom<RunResult>({ status: 'idle' })

// Pagination Actions
export const prevProblemAtom = atom(
  null,
  (get, set) => {
    const problems = get(activeProblemsAtom)
    const selectedId = get(selectedProblemIdAtom)
    const idx = problems.findIndex((p) => p.id === selectedId)
    if (idx > 0) {
      set(selectedProblemIdAtom, problems[idx - 1].id)
      set(runResultAtom, { status: 'idle' })
    }
  }
)

export const nextProblemAtom = atom(
  null,
  (get, set) => {
    const problems = get(activeProblemsAtom)
    const selectedId = get(selectedProblemIdAtom)
    const idx = problems.findIndex((p) => p.id === selectedId)
    if (idx < problems.length - 1) {
      set(selectedProblemIdAtom, problems[idx + 1].id)
      set(runResultAtom, { status: 'idle' })
    }
  }
)

