import { useCallback, useRef, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import type { AIState } from '@/components/ui/smoothui/ai-core'
import { useCreateCategoryMutation } from '@/shared/hooks/useWorkspaceQueries'
import { databaseClient } from '@/shared/services/databaseClient'
import {
  categoriesAtom,
  findCategoryByTitle,
  marathonsAtom,
  problemsAtom,
  selectCategoryAtom,
} from '@/shared/store'
import type { Problem } from '@/shared/types/problem'
import type { GeneratedTarget, StudioMessage } from '../types'
import {
  buildGeneratedQuestions,
  type GeneratedQuestionItem,
  type GenerationDraft,
} from '../utils/draftEngine'

interface UseGenerationExecutorOptions {
  onActivityChange: (state: AIState) => void
  onMarkDraftGenerated: () => void
  onAppendMessage: (message: StudioMessage) => void
  onGenerationComplete?: (payload: {
    questions: GeneratedQuestionItem[]
    target: GeneratedTarget
  }) => void
}

const DEFAULT_SOLUTIONS = {
  typescript: 'function solve(n: number): boolean {\n  return n > 0;\n}',
  javascript: 'function solve(n) {\n  return n > 0;\n}',
  python: 'def solve(n: int) -> bool:\n    return n > 0',
  cpp: 'bool solve(int n) {\n    return n > 0;\n}',
}

function buildChallengeInput(
  topic: string,
  category: string | null,
  question: GeneratedQuestionItem
) {
  return {
    title: question.title,
    description: question.description,
    difficulty: question.difficulty,
    tags: [topic, category ?? 'Questions Factory', question.style],
    examples: [
      { id: 1, input: 'n = 5', output: 'true', explanation: 'Sample verification case.' },
    ],
    constraints: ['$1 \\le n \\le 10^5$'],
    hints: [
      'Start by identifying the core invariant and edge cases.',
      'Aim for optimal time and space complexity.',
    ],
    initialSolutions: DEFAULT_SOLUTIONS,
    testCases: [{ id: 1, input: 'n = 5', expected: 'true' }],
  }
}

function buildFallbackProblems(
  categoryTitle: string,
  questions: GeneratedQuestionItem[],
  baseId: number
): Problem[] {
  return questions.map((question, idx) => ({
    id: baseId + idx,
    slug: `${question.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${baseId}-${idx}`,
    title: question.title,
    difficulty: question.difficulty,
    category: categoryTitle,
    acceptance: '50.0%',
    solved: false,
    starred: false,
    isAIGenerated: true,
    description: question.description,
    examples: [{ id: 1, input: 'n = 5', output: 'true', explanation: 'Sample verification case.' }],
    constraints: ['$1 \\le n \\le 10^5$'],
    hints: ['Start by identifying the core invariant and edge cases.'],
    tags: [categoryTitle, question.style],
    codeTemplates: DEFAULT_SOLUTIONS,
    testCases: [{ id: 1, input: 'n = 5', expected: 'true' }],
  }))
}

/**
 * Executes final generation from a confirmed draft—persisting either a
 * Marathon Track or attaching questions to an existing/new Category in SQLite.
 */
export function useGenerationExecutor({
  onActivityChange,
  onMarkDraftGenerated,
  onAppendMessage,
  onGenerationComplete,
}: UseGenerationExecutorOptions) {
  const [isGenerating, setIsGenerating] = useState(false)
  const isGeneratingRef = useRef(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionItem[]>([])
  const [generatedTarget, setGeneratedTarget] = useState<GeneratedTarget | null>(null)

  const createCategoryMutation = useCreateCategoryMutation()
  const categories = useAtomValue(categoriesAtom)
  const setCategories = useSetAtom(categoriesAtom)
  const problems = useAtomValue(problemsAtom)
  const setProblems = useSetAtom(problemsAtom)
  const setMarathons = useSetAtom(marathonsAtom)
  const selectCategory = useSetAtom(selectCategoryAtom)

  const resetGeneratedOutput = useCallback(() => {
    setGeneratedTarget(null)
    setGeneratedQuestions([])
  }, [])

  const restoreGeneratedOutput = useCallback(
    (questions: GeneratedQuestionItem[], target: GeneratedTarget | null) => {
      setGeneratedQuestions(questions)
      setGeneratedTarget(target)
    },
    []
  )

  const openWorkspace = useCallback(() => {
    if (!generatedTarget) return
    selectCategory({
      name: generatedTarget.name,
      isMarathon: generatedTarget.isMarathon,
      startSolving: true,
    })
  }, [generatedTarget, selectCategory])

  const executeGeneration = useCallback(
    async (targetDraft: GenerationDraft) => {
      if (isGeneratingRef.current) return
      isGeneratingRef.current = true
      setIsGenerating(true)
      onActivityChange('thinking')

      try {
        const topic = targetDraft.topic ?? 'Custom Practice'
        const builtQuestions = buildGeneratedQuestions(targetDraft)

        if (targetDraft.contentType === 'Marathon Track') {
          const title = `${topic} Marathon`
          const stepCount = Math.min(
            Math.max(builtQuestions.length, 1),
            problems.length || builtQuestions.length
          )
          const stepProblems = problems.slice(0, stepCount)

          setMarathons((prev) => [
            {
              id: `marathon-${Date.now()}`,
              title,
              subtitle: `${targetDraft.questionStyle ?? 'Mixed'} · ${targetDraft.difficulty ?? 'Progressive'}`,
              description: `Generated from your Questions Factory draft for ${topic}.`,
              coverIndex: prev.length % 100,
              difficultyRange: targetDraft.difficulty ?? 'Easy - Hard',
              tags: [targetDraft.category ?? 'Practice', topic],
              steps: stepProblems.map((p, idx) => ({
                step: idx + 1,
                problemId: p.id,
                locked: idx > 0,
                completed: p.solved,
              })),
            },
            ...prev,
          ])

          const nextTarget: GeneratedTarget = { name: title, isMarathon: true }
          setGeneratedQuestions(builtQuestions)
          onMarkDraftGenerated()
          setGeneratedTarget(nextTarget)
          onAppendMessage({
            id: `assistant-gen-${Date.now()}`,
            from: 'assistant',
            reasoning: `Built ${builtQuestions.length} track items for "${title}" (${targetDraft.difficulty}, ${targetDraft.questionStyle}).`,
            content: `Your **${title}** track with **${builtQuestions.length} questions** is ready.\n\nClick **Open Workspace** in the side panel to start solving.`,
          })
          onGenerationComplete?.({ questions: builtQuestions, target: nextTarget })
        } else {
          const existingCategory = findCategoryByTitle(categories, topic)
          const targetTitle = existingCategory?.name ?? topic
          const description = `${targetDraft.category ?? 'Practice'} · ${builtQuestions.length} ${targetDraft.questionStyle ?? 'Mixed'} questions (${targetDraft.difficulty ?? 'Medium'})`

          let resolvedTitle = targetTitle
          let reusedExisting = Boolean(existingCategory)

          if (databaseClient.isAvailable()) {
            const dbResult = await createCategoryMutation.mutateAsync({
              title: targetTitle,
              description,
              challenges: builtQuestions.map((question) =>
                buildChallengeInput(targetTitle, targetDraft.category, question)
              ),
            })
            resolvedTitle = dbResult?.category?.title ?? targetTitle
            reusedExisting = reusedExisting || dbResult?.created === false
          } else {
            const fallbackProblems = buildFallbackProblems(targetTitle, builtQuestions, Date.now())
            const fallbackIds = fallbackProblems.map((p) => p.id)
            setProblems((prev) => [...fallbackProblems, ...prev])

            if (existingCategory) {
              setCategories((prev) =>
                prev.map((cat) =>
                  cat.id === existingCategory.id
                    ? { ...cat, problemIds: [...cat.problemIds, ...fallbackIds] }
                    : cat
                )
              )
            } else {
              setCategories((prev) => [
                {
                  id: `cat-${Date.now()}`,
                  name: targetTitle,
                  description,
                  isCustom: true,
                  problemIds: fallbackIds,
                },
                ...prev,
              ])
            }
          }

          const nextTarget: GeneratedTarget = { name: resolvedTitle, isMarathon: false }
          setGeneratedQuestions(builtQuestions)
          onMarkDraftGenerated()
          setGeneratedTarget(nextTarget)
          onAppendMessage({
            id: `assistant-gen-${Date.now()}`,
            from: 'assistant',
            reasoning: reusedExisting
              ? `Reused existing "${resolvedTitle}" category and saved ${builtQuestions.length} questions (${targetDraft.difficulty}, ${targetDraft.questionStyle}).`
              : `Created "${resolvedTitle}" category and saved ${builtQuestions.length} questions (${targetDraft.difficulty}, ${targetDraft.questionStyle}).`,
            content: reusedExisting
              ? `All **${builtQuestions.length}** questions have been generated and added to your existing **${resolvedTitle}** category.\n\nClick **Open Workspace** in the side panel to start solving.`
              : `All **${builtQuestions.length} ${resolvedTitle}** questions have been generated and saved to your workspace.\n\nClick **Open Workspace** in the side panel to start solving.`,
          })
          onGenerationComplete?.({ questions: builtQuestions, target: nextTarget })
        }

        onActivityChange('done')
        setTimeout(() => {
          onActivityChange('idle')
        }, 1500)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        onAppendMessage({
          id: `assistant-err-${Date.now()}`,
          from: 'assistant',
          content: `Could not generate that content: ${errorMessage}`,
        })
        onActivityChange('error')
        setTimeout(() => {
          onActivityChange('idle')
        }, 1400)
      } finally {
        isGeneratingRef.current = false
        setIsGenerating(false)
      }
    },
    [
      categories,
      createCategoryMutation,
      onActivityChange,
      onAppendMessage,
      onGenerationComplete,
      onMarkDraftGenerated,
      problems,
      setCategories,
      setMarathons,
      setProblems,
    ]
  )

  return {
    isGenerating,
    isGeneratingRef,
    generatedQuestions,
    generatedTarget,
    executeGeneration,
    resetGeneratedOutput,
    restoreGeneratedOutput,
    openWorkspace,
  }
}

