import { useState, useRef, useEffect } from 'react'
import {
  Home as HomeSolid,
  Settings as SettingsSolid,
  Clock as ClockSolid,
  File as FileSolid,
} from '@ui/icons/solid'
import {
  Home as HomeLinear,
  Settings as SettingsLinear,
  Clock as ClockLinear,
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
    },
    {
      id: 'settings' as NavSection,
      label: 'Settings',
      SolidIcon: SettingsSolid,
      LinearIcon: SettingsLinear,
    },
    {
      id: 'history' as NavSection,
      label: 'History',
      SolidIcon: ClockSolid,
      LinearIcon: ClockLinear,
    },
    {
      id: 'todos' as NavSection,
      label: 'To-dos',
      SolidIcon: FileSolid,
      LinearIcon: FileLinear,
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
              className={`group relative z-10 flex flex-col items-center justify-center gap-1.5 w-full py-1.5 rounded-xl transition-all cursor-pointer ${isActive
                ? 'text-white'
                : 'text-[#737373] hover:text-white'
                }`}
            >
              {/* Icon Tile (target for sliding indicator) */}
              <div
                ref={(el) => {
                  iconRefs.current[item.id] = el
                }}
                className={`p-2 rounded-xl transition-colors ${!isActive ? 'group-hover:bg-[#1F1F1F]/60 text-[#A3A3A3] group-hover:text-white' : 'text-white'
                  }`}
              >
                <Icon size={22} className="transition-transform group-hover:scale-105" />
              </div>

              {/* Text Label */}
              <span
                className={`text-[11px] font-medium tracking-tight transition-colors ${isActive ? 'text-white font-semibold' : 'text-[#A3A3A3]'
                  }`}
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
          className="h-10 w-10 rounded-full bg-[#16A34A] border-2 border-[#16A34A]/40 flex items-center justify-center text-white font-semibold text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
          title="Profile & Status (Online)"
        >
          <span className="sr-only">Profile</span>
        </button>
      </div>
    </aside>
  )
}

export default PersistentRail
