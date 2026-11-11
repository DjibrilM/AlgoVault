import { Problem } from '../types/problem'
import { EASY_PROBLEMS } from './problems/easyProblems'
import { MEDIUM_HARD_PROBLEMS } from './problems/mediumHardProblems'

export { EASY_PROBLEMS } from './problems/easyProblems'
export { MEDIUM_HARD_PROBLEMS } from './problems/mediumHardProblems'
export { INITIAL_MARATHON_STEPS } from './tracks/marathonData'
export { INITIAL_AI_CATEGORIES } from './tracks/categoryData'

export const INITIAL_PROBLEMS: Problem[] = [
  ...EASY_PROBLEMS,
  ...MEDIUM_HARD_PROBLEMS,
]
