import { FormEvent } from 'react'
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { TodoImportance } from '@/shared/types/problem'
import { TodosScreenProps } from '../types'
import {
  type TodoImportanceFilter,
  type TodoStatusFilter,
  parseDeadlineDaysRemaining,
  useTodos,
} from '../hooks'

const STATUS_OPTIONS: Array<{ id: TodoStatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'completed', label: 'Completed' },
]

const IMPORTANCE_FILTER_OPTIONS: Array<{ id: TodoImportanceFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
]

const IMPORTANCE_META: Record<
  TodoImportance,
  {
    label: string
    hint: string
    dotClass: string
    selectedDotClass: string
  }
> = {
  low: {
    label: 'Low',
    hint: 'Backlog & flexible timing',
    dotClass: 'bg-[#525252]',
    selectedDotClass: 'bg-[#525252]',
  },
  medium: {
    label: 'Medium',
    hint: 'Standard study cadence',
    dotClass: 'bg-[#A3A3A3]',
    selectedDotClass: 'bg-[#404040]',
  },
  high: {
    label: 'High',
    hint: 'Prioritize this week',
    dotClass: 'bg-[#E5E5E5]',
    selectedDotClass: 'bg-[#111111]',
  },
  critical: {
    label: 'Critical',
    hint: 'Immediate focus required',
    dotClass: 'bg-[#F43F5E]',
    selectedDotClass: 'bg-[#F43F5E]',
  },
}

function formatDeadlineLabel(deadline: string | null, completed: boolean) {
  if (!deadline) return null
  const days = parseDeadlineDaysRemaining(deadline)
  const [y, m, d] = deadline.split('-').map(Number)
  const formatted =
    y && m && d
      ? new Date(y, m - 1, d).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : deadline

  if (completed || days === null) {
    return { label: formatted, overdue: false }
  }
  if (days < 0) {
    return { label: `Overdue · ${formatted}`, overdue: true }
  }
  if (days === 0) {
    return { label: 'Today', overdue: false }
  }
  if (days === 1) {
    return { label: 'Tomorrow', overdue: false }
  }
  return { label: formatted, overdue: false }
}

export function TodosScreen({ onReturnHome }: TodosScreenProps) {
  const {
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
    formError,
    openCount,
    completedCount,
    isAdding,
    isClearing,
    handleAddTodo,
    handleToggleTodo,
    handleDeleteTodo,
    handleClearCompleted,
    handleOpenChallenge,
    returnHome,
  } = useTodos()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    void handleAddTodo()
  }

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] text-[#E5E5E5] overflow-y-auto select-none p-8 space-y-6 scrollbar-thin">
      <div className="max-w-4xl mx-auto w-full space-y-5">
        <button
          type="button"
          onClick={onReturnHome ?? returnHome}
          className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white">To-dos</h1>
            <p className="text-xs text-[#8C8C8C]">
              Plan focused study activities, set priority levels, and track deadlines.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateDialog}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-[#111111] transition-colors hover:bg-[#E5E5E5] cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Activity</span>
          </button>
        </div>

        {/* Restrained Monochrome Filter Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <div className="flex items-center gap-1 rounded-lg bg-[#202020] p-1">
            {STATUS_OPTIONS.map((option) => {
              const active = statusFilter === option.id
              const count =
                option.id === 'all'
                  ? todos.length
                  : option.id === 'open'
                    ? openCount
                    : completedCount
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStatusFilter(option.id)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5',
                    active
                      ? 'bg-white text-[#111111] font-semibold'
                      : 'text-[#8C8C8C] hover:text-white'
                  )}
                >
                  <span>{option.label}</span>
                  <span
                    className={cn(
                      'text-[10px] tabular-nums',
                      active ? 'text-[#525252]' : 'text-[#666666]'
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg bg-[#202020] p-1">
              {IMPORTANCE_FILTER_OPTIONS.map((option) => {
                const active = importanceFilter === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setImportanceFilter(option.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                      active
                        ? 'bg-white/[0.1] text-white'
                        : 'text-[#8C8C8C] hover:text-[#D4D4D4]'
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleClearCompleted}
                disabled={isClearing}
                className="text-xs text-[#8C8C8C] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Clear completed ({completedCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="max-w-4xl mx-auto w-full space-y-2 pb-8">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="h-16 rounded-xl bg-[#202020] shimmer-surface" />
            ))}
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#202020] text-center space-y-1.5">
            <p className="text-sm font-medium text-white">
              {todos.length === 0 ? 'No activities yet' : 'No matching activities'}
            </p>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              {todos.length === 0
                ? 'Use the Add Activity button above to plan a study goal with a priority and deadline.'
                : 'Try adjusting your status or importance filters.'}
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const linkedProblem =
              todo.challenge ??
              (todo.challengeId !== null
                ? problems.find((p) => p.id === todo.challengeId)
                : undefined)
            const categoryTitle =
              todo.challenge?.category?.title ??
              (linkedProblem &&
              'category' in linkedProblem &&
              typeof linkedProblem.category === 'string'
                ? linkedProblem.category
                : undefined)
            const imp = todo.importance ?? 'medium'
            const impMeta = IMPORTANCE_META[imp] ?? IMPORTANCE_META.medium
            const deadlineLabel = formatDeadlineLabel(todo.deadline, todo.completed)

            return (
              <div
                key={todo.id}
                className={cn(
                  'group rounded-xl bg-[#202020] hover:bg-[#252525] transition-colors px-4 py-3.5 flex items-start justify-between gap-4',
                  todo.completed && 'opacity-65'
                )}
              >
                <div className="flex-1 min-w-0 flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleToggleTodo(todo.id)}
                    aria-label={todo.completed ? 'Mark as open' : 'Mark as completed'}
                    className={cn(
                      'mt-0.5 h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                      todo.completed
                        ? 'border-white bg-white text-[#111111]'
                        : 'border-white/25 hover:border-white/60 bg-transparent'
                    )}
                  >
                    {todo.completed && <Check className="h-3 w-3 stroke-[2.5]" />}
                  </button>

                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          todo.completed ? 'text-[#737373] line-through' : 'text-white'
                        )}
                      >
                        {todo.title}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-[#D4D4D4]">
                        <span className={cn('h-1.5 w-1.5 rounded-full', impMeta.dotClass)} />
                        <span>{impMeta.label}</span>
                      </span>

                      {deadlineLabel && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium',
                            deadlineLabel.overdue ? 'text-rose-300' : 'text-[#A3A3A3]'
                          )}
                        >
                          <Calendar className="h-3 w-3 opacity-75" />
                          <span>{deadlineLabel.label}</span>
                        </span>
                      )}
                    </div>

                    {todo.notes && (
                      <p className="text-xs text-[#8C8C8C] leading-relaxed break-words">
                        {todo.notes}
                      </p>
                    )}

                    {linkedProblem && (
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-[#737373]">
                        <span className="text-[#A3A3A3]">{linkedProblem.title}</span>
                        <span>·</span>
                        <span>{linkedProblem.difficulty}</span>
                        {categoryTitle && (
                          <>
                            <span>·</span>
                            <span className="hidden sm:inline">{categoryTitle}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {todo.challengeId !== null && (
                    <button
                      type="button"
                      onClick={() => handleOpenChallenge(todo.challengeId!, categoryTitle)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] px-2.5 py-1.5 text-[11px] font-medium text-[#E5E5E5] transition-colors cursor-pointer"
                      title="Open linked challenge"
                    >
                      <span className="hidden sm:inline">Solve</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#666666] hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete Activity"
                    aria-label="Delete Activity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Activity Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[min(92vw,660px)] sm:max-w-[660px] max-h-[88vh] overflow-y-auto bg-[#1C1C1E] border-0 ring-0 text-[#E5E5E5] p-0 shadow-[0_28px_90px_rgba(0,0,0,0.85)]">
          <DialogHeader className="px-7 pt-6 pb-1">
            <DialogTitle className="text-base font-semibold text-white">
              New Activity
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8C8C8C]">
              Create a study task with its priority level and target deadline.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-7 pb-6 pt-4 space-y-5">
            {/* Unified Title & Notes Editor Surface */}
            <div className="rounded-xl bg-[#131315] px-4 py-3.5 space-y-3">
              <div className="space-y-1">
                <label htmlFor="activity-title-input" className="sr-only">
                  Activity Title
                </label>
                <input
                  id="activity-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Activity title..."
                  className="w-full bg-transparent border-0 text-[15px] font-medium text-white placeholder:text-[#525252] outline-none"
                />
              </div>

              <div className="h-px bg-white/[0.05]" />

              <div className="space-y-1">
                <label htmlFor="activity-notes-input" className="sr-only">
                  Notes
                </label>
                <textarea
                  id="activity-notes-input"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes, edge cases to review, or target time (optional)..."
                  className="w-full bg-transparent border-0 text-xs text-[#C4C4C4] placeholder:text-[#525252] outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Importance Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block">
                Importance
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'critical'] as TodoImportance[]).map((level) => {
                  const cfg = IMPORTANCE_META[level]
                  const selected = importance === level
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setImportance(level)}
                      className={cn(
                        'rounded-xl p-3 text-left transition-all cursor-pointer space-y-1',
                        selected
                          ? 'bg-white text-[#111111]'
                          : 'bg-[#131315] text-[#A3A3A3] hover:bg-[#18181B] hover:text-white'
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            selected ? cfg.selectedDotClass : cfg.dotClass
                          )}
                        />
                        <span>{cfg.label}</span>
                      </div>
                      <div
                        className={cn(
                          'text-[10px] leading-snug',
                          selected ? 'text-[#525252]' : 'text-[#666666]'
                        )}
                      >
                        {cfg.hint}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Calendar Deadline Picker */}
            <div className="space-y-2">
              <label
                htmlFor="activity-deadline-trigger"
                className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block"
              >
                Deadline
              </label>
              <DatePicker
                id="activity-deadline-trigger"
                value={deadline}
                onChange={setDeadline}
                placeholder="Choose a target deadline (optional)"
              />
            </div>

            {/* Linked Challenge */}
            <div className="space-y-2">
              <label
                htmlFor="activity-challenge-select"
                className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block"
              >
                Linked Challenge <span className="normal-case font-normal">(optional)</span>
              </label>
              <select
                id="activity-challenge-select"
                value={selectedChallengeId ?? ''}
                onChange={(e) =>
                  handleSelectChallenge(e.target.value ? Number(e.target.value) : null)
                }
                className="h-10 w-full rounded-xl border-0 bg-[#131315] hover:bg-[#17171A] px-3.5 text-xs text-[#D4D4D4] outline-none cursor-pointer transition-colors"
              >
                <option value="">No linked challenge</option>
                {problems.map((problem) => (
                  <option key={problem.id} value={problem.id}>
                    #{problem.id} {problem.title} ({problem.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {formError && <p className="text-xs text-rose-400">{formError}</p>}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeCreateDialog}
                className="h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] px-4 text-xs font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding || (!title.trim() && selectedChallengeId === null)}
                className="h-9 rounded-lg bg-white hover:bg-[#E5E5E5] px-5 text-xs font-semibold text-[#111111] transition-colors cursor-pointer disabled:opacity-45 inline-flex items-center gap-1.5"
              >
                {isAdding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isAdding ? 'Saving...' : 'Save Activity'}</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TodosScreen
