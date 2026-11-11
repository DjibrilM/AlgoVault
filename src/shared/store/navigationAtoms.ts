import { atom } from 'jotai'
import { NavSection } from '@/layout/types'

export const activeNavAtom = atom<NavSection>('home')
export const searchQueryAtom = atom<string>('')

