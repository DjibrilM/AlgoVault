import { MarathonStep } from '../../types/problem'

// Marathon Mode: Sequential ordered challenges from easiest to hardest
export const INITIAL_MARATHON_STEPS: MarathonStep[] = [
  { step: 1, problemId: 1, completed: true, locked: false },       // Two Sum (Easy)
  { step: 2, problemId: 20, completed: true, locked: false },      // Valid Parentheses (Easy)
  { step: 3, problemId: 70, completed: false, locked: false },     // Climbing Stairs (Easy) -> Current Step!
  { step: 4, problemId: 3, completed: false, locked: true },       // Longest Substring (Medium) -> Locked!
  { step: 5, problemId: 322, completed: false, locked: true },     // Coin Change (Medium) -> Locked!
  { step: 6, problemId: 146, completed: false, locked: true },     // LRU Cache (Medium) -> Locked!
  { step: 7, problemId: 42, completed: false, locked: true },      // Trapping Rain Water (Hard) -> Locked!
]

