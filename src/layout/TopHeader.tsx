import { useEffect, useMemo, useRef, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { ChevronLeft, ChevronRight, Code2, FolderOpen, Layers, Search, Terminal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  canGoBackAtom,
  canGoForwardAtom,
  categoriesAtom,
  goBackAtom,
  goForwardAtom,
  marathonsAtom,
  openChallengeAtom,
  problemsAtom,
  selectCategoryAtom,
  submissionsAtom,
} from '@/shared/store'
import { buildSearchIndex, querySearchIndex, type SearchHit } from '@/shared/utils/searchIndex'

interface TopHeaderProps {
  onSearch?: (query: string) => void
}

function getDifficultyBadgeClass(difficulty?: string): string {
  if (difficulty === 'Hard') return 'text-rose-400 bg-rose-500/10'
  if (difficulty === 'Medium') return 'text-amber-400 bg-amber-500/10'
  if (difficulty === 'Easy') return 'text-emerald-400 bg-emerald-500/10'
  return 'text-[#A3A3A3] bg-white/[0.06]'
}

export function TopHeader({ onSearch }: TopHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const canGoBack = useAtomValue(canGoBackAtom)
  const canGoForward = useAtomValue(canGoForwardAtom)
  const goBack = useSetAtom(goBackAtom)
  const goForward = useSetAtom(goForwardAtom)

  const problems = useAtomValue(problemsAtom)
  const categories = useAtomValue(categoriesAtom)
  const marathons = useAtomValue(marathonsAtom)
  const submissions = useAtomValue(submissionsAtom)
  const selectCategory = useSetAtom(selectCategoryAtom)
  const openChallenge = useSetAtom(openChallengeAtom)

  const searchIndex = useMemo(
    () => buildSearchIndex(problems, categories, marathons, submissions),
    [problems, categories, marathons, submissions]
  )

  const hits = useMemo(
    () => querySearchIndex(searchIndex, searchQuery),
    [searchIndex, searchQuery]
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [searchQuery])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    onSearch?.(val)
  }

  const handleSelectHit = (hit: SearchHit) => {
    const { doc } = hit
    if (doc.problemId !== undefined) {
      const matchedProblem = problems.find((p) => p.id === doc.problemId)
      const categoryName = doc.categoryName || matchedProblem?.category || 'General'
      selectCategory({ name: categoryName, isMarathon: false, startSolving: true })
      openChallenge(doc.problemId)
    } else if (doc.categoryName) {
      selectCategory({
        name: doc.categoryName,
        isMarathon: Boolean(doc.isMarathon),
        startSolving: false,
      })
    }

    setSearchQuery('')
    setIsFocused(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchQuery('')
      setIsFocused(false)
      inputRef.current?.blur()
      return
    }
    if (hits.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % hits.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + hits.length) % hits.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = hits[activeIndex] ?? hits[0]
      if (selected) handleSelectHit(selected)
    }
  }

  const showDropdown = isFocused && searchQuery.trim().length > 0

  return (
    <header className="h-12 bg-[#141414] flex items-center justify-between px-4 select-none shrink-0 z-30">
      {/* Left: macOS Traffic Lights & Nav Arrows */}
      <div className="flex items-center gap-5 w-64">
        <div className="w-12" />

        <div className="flex items-center gap-1.5 text-[#A3A3A3]">
          <button
            onClick={() => goBack()}
            disabled={!canGoBack}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#222222] hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Go back"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <button
            onClick={() => goForward()}
            disabled={!canGoForward}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#222222] hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Go forward"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Center: Search Bar Pill + Indexed Results Popover */}
      <div ref={containerRef} className="flex-1 mt-0.5 max-w-lg mx-auto relative">
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Allow click handlers on dropdown items to fire before closing
              window.setTimeout(() => {
                if (!containerRef.current?.contains(document.activeElement)) {
                  setIsFocused(false)
                }
              }, 120)
            }}
            onKeyDown={handleKeyDown}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={isFocused ? 'Search titles, questions, explanations, difficulty…' : ''}
            className={cn(
              'w-full h-8 text-xs rounded-lg bg-[#222222] border border-[#2E2E2E] hover:border-[#3D3D3D] focus:border-white/20 focus:bg-[#1A1A1A] focus:ring-1 focus:ring-white/10 text-white placeholder:text-[#525252] transition-all outline-none',
              {
                'text-left pl-3.5 pr-8': isFocused || searchQuery,
                'text-center px-4': !isFocused && !searchQuery,
              }
            )}
          />

          {!isFocused && !searchQuery && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none text-xs">
              <Search className="h-3.5 w-3.5 text-[#737373] shrink-0" />
              <span className="text-[#525252]">Search problems, topics, solutions...</span>
            </div>
          )}

          {searchQuery && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/[0.08] bg-[#1C1C1F] shadow-[0_24px_70px_rgba(0,0,0,0.88)] overflow-hidden z-50">
            {hits.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#737373]">
                No matches found for &ldquo;{searchQuery.trim()}&rdquo;
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
                {hits.map((hit, idx) => {
                  const isActive = idx === activeIndex
                  const Icon =
                    hit.doc.kind === 'problem'
                      ? Code2
                      : hit.doc.kind === 'marathon'
                        ? Layers
                        : hit.doc.kind === 'submission'
                          ? Terminal
                          : FolderOpen
                  return (
                    <button
                      key={hit.doc.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelectHit(hit)}
                      className={cn(
                        'w-full text-left rounded-lg px-3 py-2 flex items-start gap-3 transition-colors cursor-pointer',
                        isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 text-[#737373] mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-white truncate">
                            {hit.doc.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-[#737373]">
                              {hit.matchedField}
                            </span>
                            {hit.doc.difficulty && (
                              <span
                                className={cn(
                                  'rounded px-1.5 py-0.5 text-[10px] font-medium',
                                  getDifficultyBadgeClass(hit.doc.difficulty)
                                )}
                              >
                                {hit.doc.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] text-[#8C8C8C] truncate">
                          {hit.snippet || hit.doc.subtitle}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Spacer (matches left width for perfect center alignment) */}
      <div className="w-64" />
    </header>
  )
}

export default TopHeader
