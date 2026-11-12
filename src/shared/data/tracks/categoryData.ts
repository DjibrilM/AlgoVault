import { AICategory } from '../../types/problem'

// AI Collections / Freeform Categories
export const INITIAL_AI_CATEGORIES: AICategory[] = [
  {
    id: 'arithmetic-warmup',
    name: 'Basic Arithmetic & Warmup',
    description: 'Multiplication, Factorials & Warmup Arithmetic (Quick Sandbox Testing)',
    problemIds: [101, 102, 100, 9],
  },
  {
    id: 'data-structures',
    name: 'Data Structures',
    description: 'Arrays, Stacks, Queues, Hash Maps & Linked Lists',
    problemIds: [1, 20, 146],
  },
  {
    id: 'algorithms',
    name: 'Core Algorithms',
    description: 'Two Pointers, Sliding Window, Search',
    problemIds: [1, 9, 3, 42],
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    description: 'Optimal Substructure & Memoization',
    problemIds: [70, 322],
  },
]

