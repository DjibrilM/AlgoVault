import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ModulePlaceholderProps {
  icon: ReactNode
  iconColorClass: string
  title: string
  description: string
  onReturnHome: () => void
}

/**
 * Consistent placeholder canvas for upcoming feature modules.
 */
export function ModulePlaceholder({
  icon,
  iconColorClass,
  title,
  description,
  onReturnHome,
}: ModulePlaceholderProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#1A1A1A]">
      <div
        className={cn(
          'h-16 w-16 rounded-2xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center mb-4 shadow-lg',
          iconColorClass
        )}
      >
        {icon}
      </div>
      <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      <p className="text-sm text-[#A3A3A3] max-w-md mt-2">{description}</p>
      <button
        onClick={onReturnHome}
        className="mt-6 px-4 py-2 rounded-xl bg-[#6366F1] text-white text-xs font-semibold hover:bg-[#4F46E5] transition-all cursor-pointer"
      >
        Return to Home
      </button>
    </div>
  )
}
