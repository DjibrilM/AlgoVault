import { ReactNode } from 'react'

export type NavSection = 'home' | 'settings' | 'favorites' | 'todos'

export interface NavRailItem {
  id: NavSection
  label: string
  iconName: string
  badge?: number | string
}

export interface AppLayoutProps {
  children: ReactNode
  secondarySidebar?: ReactNode
  activeNav?: NavSection
  onNavChange?: (nav: NavSection) => void
}
