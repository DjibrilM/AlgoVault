import { useSetAtom } from 'jotai'
import { activeNavAtom, activeCategoryAtom } from '@/shared/store'

export function useTodos() {
  const setActiveNav = useSetAtom(activeNavAtom)
  const setActiveCategory = useSetAtom(activeCategoryAtom)

  const returnHome = () => {
    setActiveNav('home')
    setActiveCategory(null)
  }

  return { returnHome }
}
