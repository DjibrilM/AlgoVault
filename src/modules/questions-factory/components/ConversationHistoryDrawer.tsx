import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Loader2, MessageSquare, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FactoryConversationSnapshot } from '../types'

interface ConversationHistoryDrawerProps {
  isOpen: boolean
  activeConversationId: string
  conversations: FactoryConversationSnapshot[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  onLoadMore: () => void
  onClose: () => void
  onSelectConversation: (conversation: FactoryConversationSnapshot) => void
  onNewConversation: () => void
}

function formatRelativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime()
  if (Number.isNaN(timestamp)) return ''
  const diffSec = Math.max(Math.floor((Date.now() - timestamp) / 1000), 0)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Slide-over conversation history drawer with 10-per-page infinite scrolling
 * to browse and resume previous Questions Factory sessions.
 */
export function ConversationHistoryDrawer({
  isOpen,
  activeConversationId,
  conversations,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onClose,
  onSelectConversation,
  onNewConversation,
}: ConversationHistoryDrawerProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Trigger next page fetch when the bottom sentinel nears the viewport
  useEffect(() => {
    if (!isOpen || !hasNextPage) return
    const root = scrollContainerRef.current
    const target = sentinelRef.current
    if (!root || !target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore()
        }
      },
      { root, rootMargin: '80px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [isOpen, hasNextPage, onLoadMore, conversations.length])

  const handleScroll = () => {
    if (!hasNextPage || isFetchingNextPage) return
    const el = scrollContainerRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      onLoadMore()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Click-away backdrop */}
          <motion.div
            key="history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="absolute inset-0 z-20 bg-black/40"
          />

          {/* Slide-over drawer */}
          <motion.aside
            key="history-drawer"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 right-0 z-30 w-[360px] max-w-full border-l border-white/[0.08] bg-[#161616] shadow-2xl flex flex-col"
          >
            {/* Drawer header */}
            <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center min-w-0">
                <span className="text-xs font-medium text-[#E5E5E5] truncate">
                  Conversation History
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onNewConversation}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-[#D4D4D4] hover:text-white bg-white/[0.05] hover:bg-white/[0.1] transition-colors cursor-pointer"
                >
                  <Plus className="size-3" />
                  <span>New</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close conversation history"
                  className="inline-flex items-center justify-center size-6 rounded-md text-[#737373] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Infinite scroll list */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3"
            >
              {isLoading ? (
                <div className="space-y-3 p-0.5">
                  {Array.from({ length: 4 }, (_, idx) => (
                    <div
                      key={idx}
                      className="h-11 rounded-lg bg-white/[0.03] animate-pulse"
                    />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12 space-y-2">
                  <MessageSquare className="size-5 text-[#525252]" />
                  <p className="text-xs font-medium text-[#D4D4D4]">
                    No saved conversations yet
                  </p>
                  <p className="text-[11px] text-[#737373]">
                    Your Questions Factory sessions will appear here automatically.
                  </p>
                </div>
              ) : (
                <>
                  {conversations.map((conversation) => {
                    const isActive = conversation.id === activeConversationId
                    const userTurns = conversation.messages.filter(
                      (m) => m.from === 'user'
                    ).length

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => onSelectConversation(conversation)}
                        className={cn(
                          'w-full text-left rounded-lg px-3 py-1.5 transition-colors cursor-pointer space-y-0.5',
                          isActive
                            ? 'bg-white/[0.08] text-white'
                            : 'bg-white/[0.02] hover:bg-white/[0.05] text-[#E5E5E5]'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 leading-4">
                          <span className="text-xs font-medium truncate">
                            {conversation.title}
                          </span>
                          {conversation.draft?.generated && (
                            <span className="text-[10px] px-1.5 py-0 rounded bg-white/[0.06] text-[#A3A3A3] leading-4 shrink-0">
                              Generated
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] leading-4 text-[#737373]">
                          <span className="truncate">
                            {userTurns} {userTurns === 1 ? 'prompt' : 'prompts'}
                            {conversation.draft?.difficulty
                              ? ` · ${conversation.draft.difficulty}`
                              : ''}
                          </span>
                          <span className="shrink-0 tabular-nums">
                            {formatRelativeTime(conversation.updatedAt)}
                          </span>
                        </div>
                      </button>
                    )
                  })}

                  {/* Infinite scroll sentinel & status footer */}
                  <div ref={sentinelRef} className="py-2 flex items-center justify-center">
                    {isFetchingNextPage ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#737373]">
                        <Loader2 className="size-3 animate-spin" />
                        <span>Loading older conversations...</span>
                      </span>
                    ) : !hasNextPage && conversations.length > 0 ? (
                      <span className="text-[10px] text-[#525252]">
                        All conversations loaded
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

