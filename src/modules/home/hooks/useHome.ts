import { useAtomValue, useSetAtom } from 'jotai'
import {
  categoriesAtom,
  marathonStepsAtom,
  problemsAtom,
  selectCategoryAtom,
  generateCategoryAtom,
} from '@/shared/store'

export function useHome() {
  const categories = useAtomValue(categoriesAtom)
  const marathonSteps = useAtomValue(marathonStepsAtom)
  const problems = useAtomValue(problemsAtom)
  const selectCategory = useSetAtom(selectCategoryAtom)
  const generateCategory = useSetAtom(generateCategoryAtom)

  const handleSelectCategory = (categoryName: string, isMarathon = false) => {
    selectCategory({ name: categoryName, isMarathon })
  }

  const handleGenerateCategory = (prompt: string) => {
    generateCategory(prompt)
  }

  return {
    categories,
    marathonSteps,
    problems,
    handleSelectCategory,
    handleGenerateCategory,
  }
}
