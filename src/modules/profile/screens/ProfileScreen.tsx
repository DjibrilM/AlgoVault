import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, CheckCircle2, Copy, Download, Pencil, Share2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { getAvatarById } from '@/shared/data/avatars'
import type { Problem, SubmissionRecordDto, UserProfileDto } from '@/shared/types/problem'
import { AvatarPickerGrid } from '../components/AvatarPickerGrid'
import { ContributionHeatmap } from '../components/ContributionHeatmap'
import {
  copyProfileCardPng,
  downloadProfileCardPng,
  renderProfileCardPng,
} from '../utils/exportProfilePng'

interface ProfileScreenProps {
  profile: UserProfileDto
  problems: Problem[]
  submissions: SubmissionRecordDto[]
  isSavingProfile: boolean
  onSaveProfile: (payload: {
    displayName: string
    bio?: string
    avatarId: string
  }) => Promise<void> | void
  onOpenProblem: (problemId: number) => void
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Minimal GitHub-inspired profile displaying the user's name, avatar,
 * and contribution heatmap (each contribution = 1 passed submission).
 */
export function ProfileScreen({
  profile,
  problems,
  submissions,
  isSavingProfile,
  onSaveProfile,
  onOpenProblem,
}: ProfileScreenProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number | 'last-year'>('last-year')
  const [visibleActivityCount, setVisibleActivityCount] = useState(12)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(profile.displayName)
  const [editBio, setEditBio] = useState(profile.bio)
  const [editAvatarId, setEditAvatarId] = useState(profile.avatarId)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [sharePreview, setSharePreview] = useState<{ blob: Blob; dataUrl: string } | null>(null)
  const [isRenderingShare, setIsRenderingShare] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')

  const avatar = getAvatarById(profile.avatarId)

  const { countsByDate, yearlyCount, countsByYear, availableYears, visibleGroups, hasMoreActivity } =
    useMemo(() => {
      const accepted = submissions.filter((s) => s.status === 'passed')
      const counts = new Map<string, number>()
      const byYear = new Map<number, number>()
      const yearSet = new Set<number>([currentYear])
      const problemTitleById = new Map(problems.map((p) => [p.id, p.title]))

      const oneYearAgo = new Date()
      oneYearAgo.setHours(0, 0, 0, 0)
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      let rollingCount = 0
      const filteredActivity: Array<{
        id: number
        challengeId: number
        title: string
        lang: string
        passedCases: number
        totalCases: number
        date: Date
        monthKey: string
        monthLabel: string
      }> = []

      for (const sub of accepted) {
        const dt = new Date(sub.createdAt)
        if (Number.isNaN(dt.getTime())) continue
        const key = toLocalDateKey(dt)
        counts.set(key, (counts.get(key) ?? 0) + 1)

        const y = dt.getFullYear()
        yearSet.add(y)
        byYear.set(y, (byYear.get(y) ?? 0) + 1)

        if (dt.getTime() >= oneYearAgo.getTime()) {
          rollingCount += 1
        }

        const inSelectedRange =
          selectedYear === 'last-year' ? dt.getTime() >= oneYearAgo.getTime() : y === selectedYear
        if (inSelectedRange) {
          const monthKey = `${y}-${String(dt.getMonth() + 1).padStart(2, '0')}`
          const monthLabel = dt.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })
          filteredActivity.push({
            id: sub.id,
            challengeId: sub.challengeId,
            title:
              sub.challenge?.title ??
              problemTitleById.get(sub.challengeId) ??
              `Challenge #${sub.challengeId}`,
            lang: sub.lang,
            passedCases: sub.passedCases,
            totalCases: sub.totalCases,
            date: dt,
            monthKey,
            monthLabel,
          })
        }
      }

      const slice = filteredActivity.slice(0, visibleActivityCount)
      const grouped = new Map<string, { label: string; items: typeof filteredActivity }>()
      for (const item of slice) {
        const bucket = grouped.get(item.monthKey)
        if (bucket) {
          bucket.items.push(item)
        } else {
          grouped.set(item.monthKey, { label: item.monthLabel, items: [item] })
        }
      }

      return {
        countsByDate: counts,
        yearlyCount: rollingCount,
        countsByYear: byYear,
        availableYears: Array.from(yearSet).sort((a, b) => b - a),
        visibleGroups: Array.from(grouped.values()),
        hasMoreActivity: slice.length < filteredActivity.length,
      }
    }, [currentYear, problems, selectedYear, submissions, visibleActivityCount])

  useEffect(() => {
    setVisibleActivityCount(12)
  }, [selectedYear])

  useEffect(() => {
    if (!hasMoreActivity) return
    const sentinel = loadMoreRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleActivityCount((prev) => prev + 12)
        }
      },
      { rootMargin: '120px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMoreActivity])

  const displayedCount =
    selectedYear === 'last-year' ? yearlyCount : (countsByYear.get(selectedYear) ?? 0)
  const solvedCount = useMemo(
    () => problems.filter((p) => p.solved).length,
    [problems]
  )

  const openShareModal = async () => {
    setIsShareOpen(true)
    setCopyStatus('idle')
    setIsRenderingShare(true)
    try {
      const rendered = await renderProfileCardPng({
        displayName: profile.displayName,
        username: profile.username,
        bio: profile.bio,
        avatarSrc: avatar?.src,
        countsByDate,
        selectedYear,
        displayedCount,
        solvedCount,
        totalProblems: problems.length,
      })
      setSharePreview(rendered)
    } finally {
      setIsRenderingShare(false)
    }
  }

  const handleCopyShareImage = async () => {
    if (!sharePreview) return
    try {
      await copyProfileCardPng(sharePreview.blob)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      downloadProfileCardPng(sharePreview.blob, profile.username)
    }
  }

  const handleDownloadShareImage = () => {
    if (!sharePreview) return
    downloadProfileCardPng(sharePreview.blob, profile.username)
  }

  const openEditModal = () => {
    setEditName(profile.displayName)
    setEditBio(profile.bio)
    setEditAvatarId(profile.avatarId)
    setIsEditing(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return
    await onSaveProfile({
      displayName: editName.trim(),
      bio: editBio.trim(),
      avatarId: editAvatarId,
    })
    setIsEditing(false)
  }

  return (
    <div className="h-full overflow-y-auto bg-[#1A1A1A] text-[#E5E5E5] px-8 py-10 select-none scrollbar-thin">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Name & Avatar Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-white/15 bg-[#121214] shrink-0">
              {avatar && (
                <img
                  src={avatar.src}
                  alt={profile.displayName}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {profile.displayName}
                </h1>
                <span className="text-xs text-[#737373]">@{profile.username}</span>
              </div>
              {profile.bio && (
                <p className="text-xs text-[#A3A3A3] max-w-xl leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openShareModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit profile</span>
            </button>
          </div>
        </div>

        {/* GitHub-like Contributions Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-[#E5E5E5] tabular-nums">
              {displayedCount.toLocaleString()}{' '}
              {displayedCount === 1 ? 'contribution' : 'contributions'}{' '}
              {selectedYear === 'last-year' ? 'in the last year' : `in ${selectedYear}`}
            </h2>
          </div>

          <div className="flex items-start gap-5">
            <div className="w-fit max-w-full min-w-0 rounded-xl border border-white/[0.08] bg-[#161618] p-4 overflow-hidden">
              <ContributionHeatmap countsByDate={countsByDate} year={selectedYear} />
            </div>

            <div className="hidden sm:flex flex-col gap-1 w-24 shrink-0">
              {availableYears.map((yr) => {
                const isSelected = selectedYear === yr || (selectedYear === 'last-year' && yr === currentYear)
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() =>
                      setSelectedYear((cur) =>
                        cur === yr ? 'last-year' : yr
                      )
                    }
                    className={cn(
                      'w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer tabular-nums',
                      isSelected
                        ? 'bg-white text-[#111111]'
                        : 'text-[#8C8C8C] hover:text-white hover:bg-white/[0.05]'
                    )}
                  >
                    {yr}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* GitHub-like Contribution Activity Timeline */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-[#E5E5E5]">Contribution activity</h2>

          {visibleGroups.length === 0 ? (
            <p className="text-xs text-[#737373] py-4">
              No accepted submissions recorded in this period yet.
            </p>
          ) : (
            <div className="space-y-6">
              {visibleGroups.map((group) => (
                <div key={group.label} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-[#A3A3A3] shrink-0">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>

                  <div className="relative pl-6 space-y-2.5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/[0.08]">
                    {group.items.map((item) => (
                      <div key={item.id} className="relative flex items-center justify-between gap-4">
                        <span className="absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full bg-[#1A1A1A] text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenProblem(item.challengeId)}
                          className="text-xs text-[#D4D4D4] hover:text-white transition-colors text-left truncate cursor-pointer"
                        >
                          Solved <span className="font-medium text-white">{item.title}</span>
                          <span className="text-[#737373]">
                            {' '}· {item.lang} · {item.passedCases}/{item.totalCases} cases
                          </span>
                        </button>
                        <span className="text-[11px] text-[#666666] tabular-nums shrink-0">
                          {item.date.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {hasMoreActivity && (
                <div ref={loadMoreRef} className="py-3 text-center text-[11px] text-[#737373]">
                  Loading more activity…
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="w-[min(92vw,600px)] sm:max-w-[600px] max-h-[90vh] overflow-y-auto scrollbar-thin bg-[#1C1C1E] border-0 ring-0 text-[#E5E5E5] p-0 shadow-[0_28px_90px_rgba(0,0,0,0.85)]">
          <DialogHeader className="px-7 pt-6 pb-1">
            <DialogTitle className="text-base font-semibold text-white">
              Edit profile
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8C8C8C]">
              Update your display name, bio, or avatar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleSaveEdit(e)} className="px-7 pb-6 pt-4 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="edit-profile-name"
                className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block"
              >
                Display Name
              </label>
              <div className="rounded-xl bg-[#131315] border border-white/[0.06] focus-within:border-white/[0.18] focus-within:ring-1 focus-within:ring-white/[0.06] transition-all px-4 py-2.5">
                <input
                  id="edit-profile-name"
                  type="text"
                  maxLength={60}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-profile-bio"
                className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block"
              >
                Bio
              </label>
              <div className="rounded-xl bg-[#131315] border border-white/[0.06] focus-within:border-white/[0.18] focus-within:ring-1 focus-within:ring-white/[0.06] transition-all px-4 py-2.5">
                <input
                  id="edit-profile-bio"
                  type="text"
                  maxLength={140}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Practicing algorithms & data structures"
                  className="w-full bg-transparent text-sm text-white placeholder:text-[#525252] outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block">
                Avatar
              </span>
              <AvatarPickerGrid
                selectedAvatarId={editAvatarId}
                onSelect={setEditAvatarId}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg px-3.5 py-2 text-xs font-medium text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile || !editName.trim()}
                className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#111111] hover:bg-[#E5E5E5] transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Profile Card Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="bg-[#1B1B1E] border-white/[0.08] text-[#E5E5E5] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Share profile card</DialogTitle>
            <DialogDescription className="text-[#8C8C8C]">
              Copy or download your AlgoVault progress card to share on social media.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#121214] overflow-hidden aspect-[940/500] flex items-center justify-center">
              {isRenderingShare || !sharePreview ? (
                <span className="text-xs text-[#737373]">Rendering card preview...</span>
              ) : (
                <img
                  src={sharePreview.dataUrl}
                  alt={`${profile.displayName} AlgoVault profile card`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCopyShareImage}
                disabled={!sharePreview || isRenderingShare}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50 px-3.5 py-2 text-xs font-medium text-[#E5E5E5] hover:text-white transition-colors cursor-pointer"
              >
                {copyStatus === 'copied' ? (
                  <Check className="h-3.5 w-3.5 text-[#39d353]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copyStatus === 'copied' ? 'Copied image' : 'Copy image'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadShareImage}
                disabled={!sharePreview || isRenderingShare}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#111111] hover:bg-[#E5E5E5] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
