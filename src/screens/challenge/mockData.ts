export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface TestCase {
  id: number
  input: string
  expected: string
}

export interface Problem {
  id: number
  slug: string
  title: string
  difficulty: Difficulty
  category: string
  acceptance: string
  solved: boolean
  starred: boolean
  isAIGenerated?: boolean
  description: string
  examples: Array<{
    id: number
    input: string
    output: string
    explanation?: string
  }>
  constraints: string[]
  hints: string[]
  tags: string[]
  codeTemplates: {
    typescript: string
    python: string
    javascript: string
    cpp: string
  }
  testCases: TestCase[]
}

export interface MarathonStep {
  step: number
  problemId: number
  locked: boolean
  completed: boolean
}

export interface AICategory {
  id: string
  name: string
  icon?: string
  description?: string
  isCustom?: boolean
  problemIds: number[]
}

export const INITIAL_PROBLEMS: Problem[] = [
  {
    id: 1,
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Data Structures',
    acceptance: '51.8%',
    solved: true,
    starred: true,
    tags: ['Array', 'Hash Table'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the *same* element twice.

You can return the answer in any order.`,
    examples: [
      {
        id: 1,
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        id: 2,
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    hints: [
      'Can you think of a way to track seen complements in a hash map?',
      'Store visited numbers and their indices to achieve O(N) lookup.',
    ],
    codeTemplates: {
      typescript: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff)!, i];
    map.set(nums[i], i);
  }
  return [];
}`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, n in enumerate(nums):
            diff = target - n
            if diff in seen: return [seen[diff], i]
            seen[n] = i
        return []`,
      javascript: `var twoSum = function(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
};`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (seen.count(complement)) return {seen[complement], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
    },
    testCases: [
      { id: 1, input: 'nums = [2,7,11,15], target = 9', expected: '[0, 1]' },
      { id: 2, input: 'nums = [3,2,4], target = 6', expected: '[1, 2]' },
    ],
  },
  {
    id: 20,
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Data Structures',
    acceptance: '40.6%',
    solved: true,
    starred: true,
    tags: ['String', 'Stack'],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { id: 1, input: 's = "()"', output: 'true' },
      { id: 2, input: 's = "()[]{}"', output: 'true' },
      { id: 3, input: 's = "(]"', output: 'false' },
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only "()[]{}"',
    ],
    hints: [
      'Use a stack to push opening brackets and pop matching pairs.',
    ],
    codeTemplates: {
      typescript: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const ch of s) {
    if (ch in map) {
      if (stack.pop() !== map[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        pairs = {')': '(', '}': '{', ']': '['}
        for char in s:
            if char in pairs:
                if not stack or stack.pop() != pairs[char]: return False
            else:
                stack.append(char)
        return len(stack) == 0`,
      javascript: `var isValid = function(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let ch of s) {
    if (map[ch]) {
      if (stack.pop() !== map[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
};`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(' || c == '{' || c == '[') st.push(c);
            else {
                if (st.empty()) return false;
                if (c == ')' && st.top() != '(') return false;
                if (c == '}' && st.top() != '{') return false;
                if (c == ']' && st.top() != '[') return false;
                st.pop();
            }
        }
        return st.empty();
    }
};`,
    },
    testCases: [
      { id: 1, input: 's = "()"', expected: 'true' },
      { id: 2, input: 's = "()[]{}"', expected: 'true' },
    ],
  },
  {
    id: 3,
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'Algorithms',
    acceptance: '34.2%',
    solved: false,
    starred: false,
    tags: ['Hash Table', 'String', 'Sliding Window'],
    description: `Given a string \`s\`, find the length of the **longest substring** without duplicate characters.`,
    examples: [
      {
        id: 1,
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        id: 2,
        input: 's = "bbbbb"',
        output: '1',
      },
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    hints: [
      'Use a two-pointer sliding window to maintain non-repeating characters.',
    ],
    codeTemplates: {
      typescript: `function lengthOfLongestSubstring(s: string): number {
  const map = new Map<string, number>();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (map.has(ch) && map.get(ch)! >= left) {
      left = map.get(ch)! + 1;
    }
    map.set(ch, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        char_idx = {}
        left = max_len = 0
        for right, ch in enumerate(s):
            if ch in char_idx and char_idx[ch] >= left:
                left = char_idx[ch] + 1
            char_idx[ch] = right
            max_len = max(max_len, right - left + 1)
        return max_len`,
      javascript: `var lengthOfLongestSubstring = function(s) {
  const map = new Map();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right]) && map.get(s[right]) >= left) {
      left = map.get(s[right]) + 1;
    }
    map.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
};`,
      cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> seen;
        int left = 0, maxLen = 0;
        for (int right = 0; right < s.size(); ++right) {
            if (seen.count(s[right]) && seen[s[right]] >= left) {
                left = seen[s[right]] + 1;
            }
            seen[s[right]] = right;
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
    },
    testCases: [
      { id: 1, input: 's = "abcabcbb"', expected: '3' },
      { id: 2, input: 's = "bbbbb"', expected: '1' },
    ],
  },
  {
    id: 146,
    slug: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'Medium',
    category: 'Data Structures',
    acceptance: '42.1%',
    solved: false,
    starred: true,
    tags: ['Hash Table', 'Linked List', 'Design'],
    description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class with \`get\` and \`put\` in O(1) time complexity.`,
    examples: [
      {
        id: 1,
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
      },
    ],
    constraints: ['1 <= capacity <= 3000', '0 <= key <= 10^4'],
    hints: ['Combine a hash map with a doubly linked list.'],
    codeTemplates: {
      typescript: `class LRUCache {
  private cap: number;
  private map: Map<number, number>;
  constructor(capacity: number) {
    this.cap = capacity;
    this.map = new Map();
  }
  get(key: number): number {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }
  put(key: number, value: number): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.cap) {
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
  }
}`,
      python: `class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = collections.OrderedDict()
    def get(self, key: int) -> int:
        if key not in self.cache: return -1
        self.cache.move_to_end(key)
        return self.cache[key]
    def put(self, key: int, value: int) -> None:
        if key in self.cache: self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap: self.cache.popitem(last=False)`,
      javascript: `var LRUCache = function(capacity) {
  this.cap = capacity;
  this.map = new Map();
};`,
      cpp: `class LRUCache {
public:
    LRUCache(int capacity) {}
};`,
    },
    testCases: [
      { id: 1, input: 'capacity = 2, put(1, 1), get(1)', expected: '1' },
    ],
  },
  {
    id: 42,
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    category: 'Algorithms',
    acceptance: '60.4%',
    solved: false,
    starred: false,
    tags: ['Array', 'Two Pointers', 'Dynamic Programming'],
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    examples: [
      {
        id: 1,
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
      },
    ],
    constraints: ['1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
    hints: ['Calculate water trapped as min(max_left, max_right) - height[i].'],
    codeTemplates: {
      typescript: `function trap(height: number[]): number {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, total = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) leftMax = height[left];
      else total += leftMax - height[left];
      left++;
    } else {
      if (height[right] >= rightMax) rightMax = height[right];
      else total += rightMax - height[right];
      right--;
    }
  }
  return total;
}`,
      python: `class Solution:
    def trap(self, height: List[int]) -> int:
        l, r = 0, len(height) - 1
        l_max = r_max = res = 0
        while l < r:
            if height[l] < height[r]:
                if height[l] >= l_max: l_max = height[l]
                else: res += l_max - height[l]
                l += 1
            else:
                if height[r] >= r_max: r_max = height[r]
                else: res += r_max - height[r]
                r -= 1
        return res`,
      javascript: `var trap = function(height) {};`,
      cpp: `class Solution {
public:
    int trap(vector<int>& height) { return 0; }
};`,
    },
    testCases: [
      { id: 1, input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', expected: '6' },
    ],
  },
  {
    id: 70,
    slug: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    category: 'Dynamic Programming',
    acceptance: '52.6%',
    solved: true,
    starred: false,
    tags: ['Math', 'Dynamic Programming', 'Memoization'],
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { id: 1, input: 'n = 2', output: '2', explanation: '1. 1 step + 1 step\n2. 2 steps' },
      { id: 2, input: 'n = 3', output: '3', explanation: '1. 1 + 1 + 1\n2. 1 + 2\n3. 2 + 1' },
    ],
    constraints: ['1 <= n <= 45'],
    hints: ['To reach step n, you could have come from n-1 or n-2.'],
    codeTemplates: {
      typescript: `function climbStairs(n: number): number {
  if (n <= 2) return n;
  let prev1 = 2, prev2 = 1;
  for (let i = 3; i <= n; i++) {
    const cur = prev1 + prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
      python: `class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2: return n
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b`,
      javascript: `var climbStairs = function(n) {};`,
      cpp: `class Solution { public: int climbStairs(int n) { return n; } };`,
    },
    testCases: [
      { id: 1, input: 'n = 2', expected: '2' },
      { id: 2, input: 'n = 3', expected: '3' },
    ],
  },
  {
    id: 322,
    slug: 'coin-change',
    title: 'Coin Change',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    acceptance: '43.2%',
    solved: false,
    starred: true,
    tags: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.`,
    examples: [
      { id: 1, input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' },
      { id: 2, input: 'coins = [2], amount = 3', output: '-1' },
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    hints: ['dp[i] represents minimum coins needed to make amount i.'],
    codeTemplates: {
      typescript: `function coinChange(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const c of coins) {
      if (i - c >= 0) dp[i] = Math.min(dp[i], dp[i - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      python: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        for i in range(1, amount + 1):
            for c in coins:
                if i - c >= 0: dp[i] = min(dp[i], dp[i - c] + 1)
        return dp[amount] if dp[amount] != float('inf') else -1`,
      javascript: `var coinChange = function(coins, amount) {};`,
      cpp: `class Solution { public: int coinChange(vector<int>& coins, int amount) { return 0; } };`,
    },
    testCases: [
      { id: 1, input: 'coins = [1,2,5], amount = 11', expected: '3' },
    ],
  },
]

// 1. Marathon Mode: Sequential ordered challenges from easiest to hardest
export const INITIAL_MARATHON_STEPS: MarathonStep[] = [
  { step: 1, problemId: 1, completed: true, locked: false },       // Two Sum (Easy)
  { step: 2, problemId: 20, completed: true, locked: false },      // Valid Parentheses (Easy)
  { step: 3, problemId: 70, completed: false, locked: false },     // Climbing Stairs (Easy) -> Current Step!
  { step: 4, problemId: 3, completed: false, locked: true },       // Longest Substring (Medium) -> Locked!
  { step: 5, problemId: 322, completed: false, locked: true },     // Coin Change (Medium) -> Locked!
  { step: 6, problemId: 146, completed: false, locked: true },     // LRU Cache (Medium) -> Locked!
  { step: 7, problemId: 42, completed: false, locked: true },      // Trapping Rain Water (Hard) -> Locked!
]

// 2. AI Collections / Freeform Categories
export const INITIAL_AI_CATEGORIES: AICategory[] = [
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
    problemIds: [1, 3, 42],
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    description: 'Optimal Substructure & Memoization',
    problemIds: [70, 322],
  },
]
