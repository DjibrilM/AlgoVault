import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { AVATARS } from '@/shared/data/avatars'
import { cn } from '@/lib/utils'

interface AvatarPickerGridProps {
  selectedAvatarId: string
  onSelect: (avatarId: string) => void
  className?: string
}

/**
 * Clean circular avatar selection grid displaying all bundled 3D avatars.
 */
export function AvatarPickerGrid({
  selectedAvatarId,
  onSelect,
  className,
}: AvatarPickerGridProps) {
  return (
    <div className={cn('grid grid-cols-6 sm:grid-cols-7 gap-3 p-2', className)}>
      {AVATARS.map((avatar) => {
        const isSelected = avatar.id === selectedAvatarId
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.id)}
            title={avatar.label}
            aria-label={`Select ${avatar.label} avatar`}
            aria-pressed={isSelected}
            className={cn(
              'group relative aspect-square rounded-full transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
              isSelected
                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#141414] scale-[1.04]'
                : 'opacity-80 hover:opacity-100 hover:scale-[1.03]'
            )}
          >
            <div className="h-full w-full rounded-full overflow-hidden">
              <motion.img
                src={avatar.src}
                alt={avatar.label}
                loading="lazy"
                animate={
                  isSelected
                    ? { filter: ['blur(8px)', 'blur(0px)'], scale: [0.92, 1], opacity: [0.65, 1] }
                    : { filter: 'blur(0px)', scale: 1, opacity: 1 }
                }
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full object-cover"
              />
            </div>
            {isSelected && (
              <span className="absolute -bottom-0.5 -right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[#0B0B0C] ring-2 ring-[#141414] shadow">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
