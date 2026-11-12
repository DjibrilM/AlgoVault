import { MarathonStep } from '../../types/problem'

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

