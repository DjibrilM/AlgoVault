import { useState } from 'react'
import { TopHeader } from './TopHeader'
import { PersistentRail } from './PersistentRail'
import { AppLayoutProps, NavSection } from './types'

export function AppLayout({
  children,
  secondarySidebar,
  activeNav: controlledActiveNav,
  onNavChange: controlledOnNavChange,
}: AppLayoutProps) {
  const [internalActiveNav, setInternalActiveNav] = useState<NavSection>('home')

  const activeNav = controlledActiveNav ?? internalActiveNav
  const handleNavChange = controlledOnNavChange ?? setInternalActiveNav

  const hasSecondary = Boolean(secondarySidebar)

  return (
    <div className="h-screen w-screen bg-[#141414] text-[#FFFFFF] flex flex-col font-sans overflow-hidden select-none">
      {/* 1. Top Header with Traffic Lights, Navigation Arrows, and Centered Search */}
      <TopHeader />

      {/* 2. Main Frame */}
      <div className="flex-1 flex overflow-hidden pr-3 pb-3">
        {/* Persistent Narrow Rail */}
        <PersistentRail
          activeNav={activeNav}
          onNavChange={handleNavChange}
        />

        {/* Floating Rounded Canvas Container */}
        <div className="flex-1 flex ml-2.5 rounded-2xl bg-[#1A1A1A] border border-[#262626] overflow-hidden shadow-2xl">
          {/* On-Demand Secondary Side Menu with its rich #181818 background */}
          {hasSecondary && (
            <aside className="w-60 bg-[#181818] border-r border-[#262626] flex flex-col shrink-0 overflow-hidden z-10">
              <div className="w-60 h-full flex flex-col overflow-y-auto">
                {secondarySidebar}
              </div>
            </aside>
          )}

          {/* Screen Canvas Area */}
          <main className="flex-1 bg-[#1A1A1A] flex flex-col overflow-hidden relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
