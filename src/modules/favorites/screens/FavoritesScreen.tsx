import { useAtomValue, useSetAtom } from 'jotai'
import { ArrowLeft, Bookmark, CheckCircle2, ChevronRight } from 'lucide-react'
import {
  activeCategoryAtom,
  activeNavAtom,
  openChallengeAtom,
  problemsAtom,
} from '@/shared/store'
import {
  useFavoritesQuery,
  useToggleFavoriteMutation,
} from '@/shared/hooks/useWorkspaceQueries'
import { challengeService } from '@/modules/challenge/services/challengeService'
import { cn } from '@/lib/utils'

interface FavoritesScreenProps {
  onReturnHome?: () => void
}

export function FavoritesScreen({ onReturnHome }: FavoritesScreenProps) {
  const { data: favorites = [] } = useFavoritesQuery()
  const toggleFavoriteMutation = useToggleFavoriteMutation()
  const problems = useAtomValue(problemsAtom)
  const openChallenge = useSetAtom(openChallengeAtom)
  const setActiveNav = useSetAtom(activeNavAtom)
  const setActiveCategory = useSetAtom(activeCategoryAtom)

  const handleBack = () => {
    if (onReturnHome) {
      onReturnHome()
    } else {
      setActiveNav('home')
    }
  }

  const handleOpenChallenge = (challengeId: number, fallbackCategory?: string) => {
    const problem = problems.find((p) => p.id === challengeId)
    const categoryName = problem?.category ?? fallbackCategory ?? 'Arrays & Hashing'
    setActiveNav('home')
    setActiveCategory({ name: categoryName, isMarathon: false })
    openChallenge(challengeId)
  }

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] text-[#E5E5E5] overflow-y-auto select-none p-8 space-y-6 scrollbar-thin">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white" />
          <span>Back to Home</span>
        </button>

        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-[#F59E0B] fill-current" />
            <span>Favorites</span>
          </h1>
          <p className="text-xs text-[#8C8C8C]">
            Bookmarked challenges saved in your SQLite workspace for quick practice.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-2 pb-8">
        {favorites.length === 0 ? (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-[#202020] text-center space-y-2">
            <p className="text-sm font-medium text-white">No favorite challenges yet</p>
            <p className="text-xs text-[#8C8C8C]">
              Click the bookmark icon on any challenge to save it here.
            </p>
          </div>
        ) : (
          favorites.map((fav) => {
            const challenge = fav.challenge
            if (!challenge) return null

            return (
              <div
                key={fav.id}
                className="group rounded-lg border border-white/[0.04] hover:border-white/[0.08] bg-[#202020] hover:bg-[#252525] transition-colors px-3.5 py-2.5 flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() =>
                    handleOpenChallenge(challenge.id, challenge.category?.title)
                  }
                  className="flex-1 min-w-0 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  {challenge.solved ? (
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-white/20 shrink-0" />
                  )}

                  <span className="text-xs font-semibold text-white truncate">
                    {challenge.id}. {challenge.title}
                  </span>

                  <span
                    className={cn(
                      'text-[10px] font-medium px-2 py-0.5 rounded shrink-0',
                      challengeService.getDifficultyBadge(challenge.difficulty)
                    )}
                  >
                    {challenge.difficulty}
                  </span>

                  {challenge.category?.title && (
                    <span className="text-[11px] text-[#8C8C8C] truncate hidden sm:inline">
                      {challenge.category.title}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleFavoriteMutation.mutate(challenge.id)}
                    className="p-1.5 rounded hover:bg-white/5 text-[#F59E0B] transition-colors cursor-pointer"
                    title="Remove from Favorites"
                  >
                    <Bookmark className="h-3.5 w-3.5 fill-current" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenChallenge(challenge.id, challenge.category?.title)
                    }
                    className="p-1.5 rounded hover:bg-white/5 text-[#8C8C8C] group-hover:text-white transition-colors cursor-pointer"
                    title="Open Challenge"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default FavoritesScreen

