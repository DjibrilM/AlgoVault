import { useState, useRef, useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Home as HomeSolid,
  Settings as SettingsSolid,
  File as FileSolid,
} from '@ui/icons/solid'
import {
  Home as HomeLinear,
  Settings as SettingsLinear,
  File as FileLinear,
} from '@ui/icons/linear'
import { NavSection } from './types'

interface PersistentRailProps {
  activeNav: NavSection
  onNavChange: (nav: NavSection) => void
}

export function PersistentRail({ activeNav, onNavChange }: PersistentRailProps) {
  const navItems = [
    {
      id: 'home' as NavSection,
      label: 'Home',
      SolidIcon: HomeSolid,
      LinearIcon: HomeLinear,
      activeColorClass: 'text-[#F59E0B]',
    },
    {
      id: 'settings' as NavSection,
      label: 'Settings',
      SolidIcon: SettingsSolid,
      LinearIcon: SettingsLinear,
      activeColorClass: 'text-[#F43F5E]',
    },
    {
      id: 'favorites' as NavSection,
      label: 'Favorites',
      SolidIcon: Bookmark,
      LinearIcon: Bookmark,
      activeColorClass: 'text-[#F59E0B]',
      fillOnActive: true,
    },
    {
      id: 'todos' as NavSection,
      label: 'To-dos',
      SolidIcon: FileSolid,
      LinearIcon: FileLinear,
      activeColorClass: 'text-[#10B981]',
    },
  ]

  const navRef = useRef<HTMLElement | null>(null)
  const iconRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [indicatorStyle, setIndicatorStyle] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)

  // Update sliding indicator position whenever activeNav changes or on mount/resize
  useEffect(() => {
    const updatePosition = () => {
      const activeEl = iconRefs.current[activeNav]
      const container = navRef.current
      if (activeEl && container) {
        const activeRect = activeEl.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()

        setIndicatorStyle({
          top: activeRect.top - containerRect.top,
          left: activeRect.left - containerRect.left,
          width: activeRect.width,
          height: activeRect.height,
        })
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [activeNav])

  return (
    <aside className="w-15 bg-[#141414] flex flex-col items-center py-4 justify-between select-none shrink-0 z-20">
      {/* Navigation Items Container with Relative Positioning for the Sliding Pill */}
      <nav ref={navRef} className="relative pl-4 flex flex-col items-center gap-6 w-full px-2">
        {/* Sliding Active Indicator Background */}
        {indicatorStyle && (
          <div
            className="absolute rounded-xl bg-[#262626] border border-[#333333]/60 shadow-md pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] z-0"
            style={{
              top: `${indicatorStyle.top}px`,
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              height: `${indicatorStyle.height}px`,
            }}
          />
        )}

        {/* Navigation Buttons */}
        {navItems.map((item) => {
          const isActive = activeNav === item.id
          const Icon = isActive ? item.SolidIcon : item.LinearIcon

          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className={cn(
                'group relative z-10 flex flex-col items-center justify-center gap-1.5 w-full py-1.5 rounded-xl transition-all cursor-pointer',
                {
                  'text-white': isActive,
                  'text-[#737373] hover:text-white': !isActive,
                }
              )}
            >
              {/* Icon Tile (target for sliding indicator) */}
              <div
                ref={(el) => {
                  iconRefs.current[item.id] = el
                }}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  isActive
                    ? item.activeColorClass
                    : 'group-hover:bg-[#1F1F1F]/60 text-[#A3A3A3] group-hover:text-white'
                )}
              >
                <Icon
                  size={22}
                  className={cn('transition-transform group-hover:scale-105', {
                    'fill-current': isActive && item.fillOnActive,
                  })}
                />
              </div>

              {/* Text Label */}
              <span
                className={cn(
                  'text-[11px] font-medium tracking-tight transition-colors whitespace-nowrap',
                  {
                    'text-white font-semibold': isActive,
                    'text-[#A3A3A3]': !isActive,
                  }
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Bottom Status / Profile Avatar Indicator */}
      <div className="flex flex-col items-center w-full px-2">
        <button
          className="relative h-9 w-9 rounded-full bg-[#202020] border border-[#333333] flex items-center justify-center text-white/90 font-semibold text-xs shadow-md hover:border-white/30 transition-all cursor-pointer"
          title="Profile & Workspace Status"
        >
          <span>AV</span>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#141414]" />
        </button>
      </div>
    </aside>
  )
}

export default PersistentRail
