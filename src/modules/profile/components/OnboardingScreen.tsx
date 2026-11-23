import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { AVATARS, getAvatarById } from '@/shared/data/avatars'
import { AvatarPickerGrid } from './AvatarPickerGrid'

interface OnboardingScreenProps {
  isSaving: boolean
  onComplete: (payload: {
    displayName: string
    bio?: string
    avatarId: string
  }) => Promise<void> | void
}

/**
 * Two-step full-screen onboarding:
 * Step 1: Display name & optional bio
 * Step 2: 3D avatar selection
 */
export function OnboardingScreen({ isSaving, onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedAvatarId, setSelectedAvatarId] = useState(AVATARS[0]?.id ?? 'cat')
  const [error, setError] = useState<string | null>(null)

  const selectedAvatar = getAvatarById(selectedAvatarId)

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Enter your name to continue.')
      return
    }
    setError(null)
    setStep(2)
  }

  const handleFinish = async () => {
    const trimmed = displayName.trim()
    if (!trimmed) {
      setStep(1)
      setError('Enter your name to continue.')
      return
    }
    await onComplete({
      displayName: trimmed,
      bio: bio.trim(),
      avatarId: selectedAvatarId,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-[#141414] px-6 py-10 select-none overflow-y-auto scrollbar-thin">
      <div className="w-full max-w-xl my-auto">
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-4 min-w-0">
            {step === 2 && selectedAvatar && (
              <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-white/15 shrink-0 bg-[#111114]">
                <motion.img
                  key={selectedAvatar.id}
                  src={selectedAvatar.src}
                  alt={selectedAvatar.label}
                  initial={{ opacity: 0.45, filter: 'blur(10px)', scale: 0.92 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-white tracking-tight">
                {step === 1 ? 'Welcome to AlgoVault' : 'Choose your avatar'}
              </h1>
              <p className="text-xs text-[#8C8C8C] mt-0.5">
                {step === 1
                  ? 'Enter your name to set up your developer profile.'
                  : `Pick an avatar for ${displayName.trim() || 'your profile'}.`}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-medium text-[#737373] shrink-0 tabular-nums">
            Step {step} of 2
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="onboarding-step-1"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleNextStep}
              className="pt-7 space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor="onboarding-name"
                  className="text-[11px] font-medium uppercase tracking-wider text-[#8C8C8C] block"
                >
                  Display Name
                </label>
                <div className="rounded-xl bg-[#1B1B1E] border border-white/[0.06] hover:border-white/[0.11] focus-within:border-white/[0.18] focus-within:bg-[#1E1E22] focus-within:ring-1 focus-within:ring-white/[0.06] transition-all px-4 py-3">
                  <input
                    id="onboarding-name"
                    type="text"
                    autoFocus
                    maxLength={60}
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder="Alex Rivera"
                    className="w-full bg-transparent text-sm text-white placeholder:text-[#55555B] outline-none"
                  />
                </div>
                {error && <p className="text-xs text-rose-400">{error}</p>}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="onboarding-bio"
                  className="text-[11px] font-medium uppercase tracking-wider text-[#8C8C8C] block"
                >
                  Bio (optional)
                </label>
                <div className="rounded-xl bg-[#1B1B1E] border border-white/[0.06] hover:border-white/[0.11] focus-within:border-white/[0.18] focus-within:bg-[#1E1E22] focus-within:ring-1 focus-within:ring-white/[0.06] transition-all px-4 py-3">
                  <input
                    id="onboarding-bio"
                    type="text"
                    maxLength={140}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Practicing algorithms & data structures"
                    className="w-full bg-transparent text-sm text-white placeholder:text-[#55555B] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#111111] hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="onboarding-step-2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="pt-7 space-y-6"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#8C8C8C]">
                    Select Avatar
                  </span>
                  <span className="text-[11px] text-[#A3A3A3]">
                    {selectedAvatar?.label}
                  </span>
                </div>

                <AvatarPickerGrid
                  selectedAvatarId={selectedAvatarId}
                  onSelect={setSelectedAvatarId}
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 text-xs font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleFinish()}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#111111] hover:bg-[#E5E5E5] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>{isSaving ? 'Saving…' : 'Get Started'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
