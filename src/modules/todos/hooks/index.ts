import { useCallback, useMemo, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  activeCategoryAtom,
  activeNavAtom,
  openChallengeAtom,
  problemsAtom,
} from '@/shared/store'
import {
  useClearCompletedTodosMutation,
  useCreateTodoMutation,
  useDeleteTodoMutation,
  useTodosQuery,
  useToggleTodoMutation,
} from '@/shared/hooks/useWorkspaceQueries'
import type { TodoImportance, TodoRecordDto } from '@/shared/types/problem'

export type TodoStatusFilter = 'all' | 'open' | 'completed'
export type TodoImportanceFilter = 'all' | TodoImportance
export type DeadlinePreset = 'today' | 'tomorrow' | 'in3days' | 'nextWeek' | 'clear'

const IMPORTANCE_RANK: Record<TodoImportance, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDeadlineDaysRemaining(deadline: string | null | undefined): number | null {
  if (!deadline) return null
  const [y, m, d] = deadline.split('-').map(Number)
  if (!y || !m || !d) return null

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const targetStart = new Date(y, m - 1, d).getTime()
  if (Number.isNaN(targetStart)) return null

  return Math.round((targetStart - todayStart) / 86_400_000)
}

export function getDeadlinePresetDate(preset: Exclude<DeadlinePreset, 'clear'>): string {
  const date = new Date()
  if (preset === 'tomorrow') date.setDate(date.getDate() + 1)
  if (preset === 'in3days') date.setDate(date.getDate() + 3)
  if (preset === 'nextWeek') date.setDate(date.getDate() + 7)
  return toLocalDateString(date)
}

export function useTodos() {
  const setActiveNav = useSetAtom(activeNavAtom)
  const setActiveCategory = useSetAtom(activeCategoryAtom)
  const openChallenge = useSetAtom(openChallengeAtom)
  const problems = useAtomValue(problemsAtom)

  const { data: todos = [], isLoading, refetch } = useTodosQuery()
  const createTodoMutation = useCreateTodoMutation()
  const toggleTodoMutation = useToggleTodoMutation()
  const deleteTodoMutation = useDeleteTodoMutation()
  const clearCompletedMutation = useClearCompletedTodosMutation()

  const [statusFilter, setStatusFilter] = useState<TodoStatusFilter>('all')
  const [importanceFilter, setImportanceFilter] = useState<TodoImportanceFilter>('all')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [importance, setImportance] = useState<TodoImportance>('medium')
  const [deadline, setDeadline] = useState('')
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const summary = useMemo(() => {
    let openCount = 0
    let completedCount = 0
    let highPriorityCount = 0
    let dueSoonCount = 0

    for (const item of todos) {
      if (item.completed) {
        completedCount += 1
        continue
      }
      openCount += 1
      if (item.importance === 'high' || item.importance === 'critical') {
        highPriorityCount += 1
      }
      const days = parseDeadlineDaysRemaining(item.deadline)
      if (days !== null && days <= 3) {
        dueSoonCount += 1
      }
    }

    return { openCount, completedCount, highPriorityCount, dueSoonCount }
  }, [todos])

  const filteredTodos = useMemo(() => {
    const filtered = todos.filter((item) => {
      if (statusFilter === 'open' && item.completed) return false
      if (statusFilter === 'completed' && !item.completed) return false
      if (importanceFilter !== 'all' && (item.importance ?? 'medium') !== importanceFilter) {
        return false
      }
      return true
    })

    return [...filtered].sort((a: TodoRecordDto, b: TodoRecordDto) => {
      if (a.completed !== b.completed) {
        return Number(a.completed) - Number(b.completed)
      }
      const rankDiff =
        (IMPORTANCE_RANK[b.importance ?? 'medium'] ?? 2) -
        (IMPORTANCE_RANK[a.importance ?? 'medium'] ?? 2)
      if (rankDiff !== 0) return rankDiff

      const aHasDeadline = Boolean(a.deadline)
      const bHasDeadline = Boolean(b.deadline)
      if (aHasDeadline !== bHasDeadline) {
        return aHasDeadline ? -1 : 1
      }
      if (a.deadline && b.deadline && a.deadline !== b.deadline) {
        return a.deadline.localeCompare(b.deadline)
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [importanceFilter, statusFilter, todos])

  const openCreateDialog = useCallback(() => {
    setFormError(null)
    setTitle('')
    setNotes('')
    setImportance('medium')
    setDeadline('')
    setSelectedChallengeId(null)
    setIsDialogOpen(true)
  }, [])

  const closeCreateDialog = useCallback(() => {
    setFormError(null)
    setIsDialogOpen(false)
  }, [])

  const handleSelectChallenge = useCallback(
    (challengeId: number | null) => {
      setSelectedChallengeId(challengeId)
      if (challengeId !== null && !title.trim()) {
        const linked = problems.find((p) => p.id === challengeId)
        if (linked) {
          setTitle(linked.title)
        }
      }
    },
    [problems, title]
  )

  const applyDeadlinePreset = useCallback((preset: DeadlinePreset) => {
    if (preset === 'clear') {
      setDeadline('')
      return
    }
    setDeadline(getDeadlinePresetDate(preset))
  }, [])

  const handleAddTodo = useCallback(async () => {
    const linked =
      selectedChallengeId !== null
        ? problems.find((p) => p.id === selectedChallengeId)
        : undefined
    const resolvedTitle = title.trim() || linked?.title || ''
    if (!resolvedTitle) {
      setFormError('Enter an activity title or link a challenge.')
      return
    }

    setFormError(null)
    try {
      await createTodoMutation.mutateAsync({
        title: resolvedTitle,
        notes: notes.trim() || null,
        importance,
        deadline: deadline.trim() || null,
        challengeId: selectedChallengeId,
      })
      if (statusFilter === 'completed') {
        setStatusFilter('all')
      }
      if (importanceFilter !== 'all' && importanceFilter !== importance) {
        setImportanceFilter('all')
      }
      void refetch()
      setIsDialogOpen(false)
      setTitle('')
      setNotes('')
      setImportance('medium')
      setDeadline('')
      setSelectedChallengeId(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err))
    }
  }, [
    createTodoMutation,
    deadline,
    importance,
    importanceFilter,
    notes,
    problems,
    refetch,
    selectedChallengeId,
    statusFilter,
    title,
  ])

  const handleToggleTodo = useCallback(
    (id: number) => {
      toggleTodoMutation.mutate(id)
    },
    [toggleTodoMutation]
  )

  const handleDeleteTodo = useCallback(
    (id: number) => {
      deleteTodoMutation.mutate(id)
    },
    [deleteTodoMutation]
  )

  const handleClearCompleted = useCallback(() => {
    clearCompletedMutation.mutate()
  }, [clearCompletedMutation])

  const handleOpenChallenge = useCallback(
    (challengeId: number, fallbackCategory?: string) => {
      const problem = problems.find((p) => p.id === challengeId)
      const categoryName = problem?.category ?? fallbackCategory ?? 'Arrays & Hashing'
      setActiveNav('home')
      setActiveCategory({ name: categoryName, isMarathon: false })
      openChallenge(challengeId)
    },
    [openChallenge, problems, setActiveCategory, setActiveNav]
  )

  const returnHome = useCallback(() => {
    setActiveNav('home')
    setActiveCategory(null)
  }, [setActiveCategory, setActiveNav])

  return {
    todos,
    filteredTodos,
    problems,
    isLoading,
    statusFilter,
    setStatusFilter,
    importanceFilter,
    setImportanceFilter,
    isDialogOpen,
    setIsDialogOpen,
    openCreateDialog,
    closeCreateDialog,
    title,
    setTitle,
    notes,
    setNotes,
    importance,
    setImportance,
    deadline,
    setDeadline,
    selectedChallengeId,
    handleSelectChallenge,
    applyDeadlinePreset,
    formError,
    openCount: summary.openCount,
    completedCount: summary.completedCount,
    highPriorityCount: summary.highPriorityCount,
    dueSoonCount: summary.dueSoonCount,
    isAdding: createTodoMutation.isPending,
    isClearing: clearCompletedMutation.isPending,
    handleAddTodo,
    handleToggleTodo,
    handleDeleteTodo,
    handleClearCompleted,
    handleOpenChallenge,
    returnHome,
  }
}
