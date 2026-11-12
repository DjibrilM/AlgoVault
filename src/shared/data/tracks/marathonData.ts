import { MarathonStep, MarathonTrack } from '../../types/problem'

// Marathon Mode: Sequential ordered challenges from easiest to hardest
export const INITIAL_MARATHON_STEPS: MarathonStep[] = [
  { step: 1, problemId: 101, completed: false, locked: false },     // Multiply Two Numbers (Easy)
  { step: 2, problemId: 102, completed: false, locked: false },     // Factorial of a Number (Easy)
  { step: 3, problemId: 1, completed: true, locked: false },        // Two Sum (Easy)
  { step: 4, problemId: 9, completed: false, locked: false },       // Palindrome Number (Easy)
  { step: 5, problemId: 20, completed: true, locked: false },       // Valid Parentheses (Easy)
  { step: 6, problemId: 70, completed: false, locked: false },      // Climbing Stairs (Easy)
  { step: 7, problemId: 3, completed: false, locked: true },        // Longest Substring (Medium) -> Locked!
  { step: 8, problemId: 322, completed: false, locked: true },      // Coin Change (Medium) -> Locked!
  { step: 9, problemId: 146, completed: false, locked: true },      // LRU Cache (Medium) -> Locked!
  { step: 10, problemId: 42, completed: false, locked: true },      // Trapping Rain Water (Hard) -> Locked!
]

// Collection of Curated Marathon Tracks (each paired with its unique blue mountain cover artwork)
export const INITIAL_MARATHONS: MarathonTrack[] = [
  {
    id: 'marathon-ascent',
    title: 'The Algorithmic Ascent',
    subtitle: 'From Arithmetic Fundamentals to Hard DP Summits',
    description: 'The flagship progression path. Complete each challenge in strict sequential order to unlock higher elevation summits.',
    coverIndex: 0,
    difficultyRange: 'Easy → Hard',
    tags: ['Flagship', 'Full Spectrum', '10 Milestones'],
    steps: INITIAL_MARATHON_STEPS,
  },
  {
    id: 'marathon-foundations',
    title: 'Data Structures Expedition',
    subtitle: 'Hash Tables, Arrays, Stack & Linked Lists',
    description: 'Master core memory layouts and access patterns under rigorous real-world space and time constraints.',
    coverIndex: 1,
    difficultyRange: 'Easy → Medium',
    tags: ['Data Structures', 'Pointers', '6 Milestones'],
    steps: [
      { step: 1, problemId: 1, completed: true, locked: false },
      { step: 2, problemId: 20, completed: true, locked: false },
      { step: 3, problemId: 9, completed: false, locked: false },
      { step: 4, problemId: 146, completed: false, locked: true },
      { step: 5, problemId: 42, completed: false, locked: true },
    ],
  },
  {
    id: 'marathon-algorithms',
    title: 'Core Algorithms Ridge',
    subtitle: 'Sliding Window, Two Pointers & Substrings',
    description: 'Traverse sequential arrays with optimal pointer coordination and linear amortized time.',
    coverIndex: 2,
    difficultyRange: 'Medium → Hard',
    tags: ['Algorithms', 'Two Pointers', '5 Milestones'],
    steps: [
      { step: 1, problemId: 1, completed: true, locked: false },
      { step: 2, problemId: 9, completed: false, locked: false },
      { step: 3, problemId: 3, completed: false, locked: false },
      { step: 4, problemId: 42, completed: false, locked: true },
    ],
  },
  {
    id: 'marathon-dynamic-programming',
    title: 'Dynamic Programming Odyssey',
    subtitle: 'Subproblems, Memoization & Tabulation',
    description: 'Formulate recurrence relations and climb step-by-step from base cases to high-dimensional state spaces.',
    coverIndex: 3,
    difficultyRange: 'Medium → Hard',
    tags: ['Optimization', 'DP', '4 Milestones'],
    steps: [
      { step: 1, problemId: 70, completed: false, locked: false },
      { step: 2, problemId: 322, completed: false, locked: true },
      { step: 3, problemId: 42, completed: false, locked: true },
    ],
  },
  {
    id: 'marathon-warmup-sprint',
    title: 'Arithmetic & Precision Sprint',
    subtitle: 'Multiplication, Factorials & Numeric Proofs',
    description: 'Fast-paced execution sprint testing integer ranges, edge cases, and arithmetic invariants.',
    coverIndex: 4,
    difficultyRange: 'Easy',
    tags: ['Warmup', 'Arithmetic', '3 Milestones'],
    steps: [
      { step: 1, problemId: 100, completed: true, locked: false },
      { step: 2, problemId: 101, completed: false, locked: false },
      { step: 3, problemId: 102, completed: false, locked: false },
    ],
  },
  {
    id: 'marathon-graph-frontiers',
    title: 'Graph & Tree Frontiers',
    subtitle: 'Balanced Trees, Traversals & State Search',
    description: 'Navigate hierarchical structures and connected components with optimal space complexity.',
    coverIndex: 5,
    difficultyRange: 'Easy → Hard',
    tags: ['Trees', 'Graphs', '4 Milestones'],
    steps: [
      { step: 1, problemId: 1, completed: true, locked: false },
      { step: 2, problemId: 20, completed: false, locked: false },
      { step: 3, problemId: 146, completed: false, locked: true },
      { step: 4, problemId: 42, completed: false, locked: true },
    ],
  },
  {
    id: 'marathon-systems-cache',
    title: 'Systems & Memory Architecture',
    subtitle: 'LRU Eviction, Constant-Time Lookups & Streams',
    description: 'Design low-latency data structures engineered for high-throughput systems interviews.',
    coverIndex: 6,
    difficultyRange: 'Medium → Hard',
    tags: ['Systems', 'Caching', '4 Milestones'],
    steps: [
      { step: 1, problemId: 1, completed: true, locked: false },
      { step: 2, problemId: 3, completed: false, locked: false },
      { step: 3, problemId: 146, completed: false, locked: true },
      { step: 4, problemId: 42, completed: false, locked: true },
    ],
  },
  {
    id: 'marathon-combinatorics',
    title: 'Recursion & State Space',
    subtitle: 'Factorials, Staircases & Change Combinations',
    description: 'Master recursive decomposition and state transitions across classic mathematical problems.',
    coverIndex: 7,
    difficultyRange: 'Easy → Medium',
    tags: ['Recursion', 'Math', '4 Milestones'],
    steps: [
      { step: 1, problemId: 102, completed: false, locked: false },
      { step: 2, problemId: 70, completed: false, locked: false },
      { step: 3, problemId: 322, completed: false, locked: true },
      { step: 4, problemId: 42, completed: false, locked: true },
    ],
  },
]


