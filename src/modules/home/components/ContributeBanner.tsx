import { ExternalLink } from 'lucide-react'
import contributeBannerBg from '@/assets/images/contribute-banner-bg.webp'

const REPO_URL = 'https://github.com/DjibrilM/AlgoVault'

/**
 * Full-width community banner on HomeScreen inviting developers to contribute to AlgoVault.
 */
export function ContributeBanner() {
  const handleOpenRepo = () => {
    window.open(REPO_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={handleOpenRepo}
      className="relative w-full overflow-hidden rounded-2xl py-7 px-6 text-center transition-all cursor-pointer group shadow-lg"
    >
      <img
        src={contributeBannerBg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/45"
      />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
          Let&apos;s Make AlgoVault Better
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm font-medium text-white/95">
          Have an idea, bug fix, or new challenge in mind?
        </p>
        <p className="mt-1 text-[11px] text-white/80">
          Jump in and help us build it — pull requests, issues, and feedback are always welcome.
        </p>
        <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/90 group-hover:text-white">
          <span>Contribute on GitHub</span>
          <ExternalLink className="h-3 w-3 opacity-80 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </button>
  )
}
