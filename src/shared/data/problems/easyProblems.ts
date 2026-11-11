import { Problem } from '../../types/problem'

export const EASY_PROBLEMS: Problem[] = [
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
    description: `Given an array of integers \`nums\` of length $n$ and an integer \`target\`, return *indices of the two numbers* $i$ and $j$ ($0 \\le i < j < n$) such that they satisfy:

$$
\\text{nums}[i] + \\text{nums}[j] = \\text{target}
$$

You may assume that each input would have ***exactly one solution***, and you may not use the *same* element twice ($i \\neq j$).

You can return the answer in any order.

### Complexity Goal

| Approach | Time Complexity | Space Complexity |
| :--- | :--- | :--- |
| Brute Force | $\\mathcal{O}(n^2)$ | $\\mathcal{O}(1)$ |
| Hash Map (Optimal) | $\\mathcal{O}(n)$ | $\\mathcal{O}(n)$ |

> **Follow-up:** Can you come up with a single-pass algorithm that achieves strictly $\\mathcal{O}(n)$ expected time complexity?`,
    examples: [
      {
        id: 1,
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because $\\text{nums}[0] + \\text{nums}[1] = 2 + 7 = 9$, we return $[0, 1]$.',
      },
      {
        id: 2,
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Here $\\text{nums}[1] + \\text{nums}[2] = 2 + 4 = 6$, yielding indices $[1, 2]$.',
      },
    ],
    constraints: [
      '$2 \\le \\text{nums.length} \\le 10^4$',
      '$-10^9 \\le \\text{nums}[i] \\le 10^9$',
      '$-10^9 \\le \\text{target} \\le 10^9$',
      'Only **one valid answer** $(i, j)$ exists.',
    ],
    hints: [
      'For each element $x = \\text{nums}[i]$, its required complement is $y = \\text{target} - x$.',
      'Store visited numbers in a hash table mapping $\\text{nums}[i] \\mapsto i$ to achieve $\\mathcal{O}(1)$ amortized lookup and $\\mathcal{O}(n)$ total time.',
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
    description: `Given a string \`s\` of length $n$ over the alphabet $\\Sigma = \\{\\text{'('}, \\text{')'}, \\text{'\\{'}, \\text{'\\}'}, \\text{'['}, \\text{']'}\\}$, determine if the input string is **properly balanced**.

Formally, a string $s$ belongs to the **Dyck language** $D_3$ if and only if:
1. Open brackets must be closed by the **same type** of brackets.
2. Open brackets must be closed in the **correct LIFO order**.
3. Every close bracket has a corresponding open bracket, and the prefix balance satisfies $\\Delta(s[0..k]) \\ge 0$ for all $0 \\le k < n$ with $\\Delta(s) = 0$.`,
    examples: [
      { id: 1, input: 's = "()"', output: 'true', explanation: 'Balanced pair with net depth $\\Delta = 0$.' },
      { id: 2, input: 's = "()[]{}"', output: 'true', explanation: 'All $3$ delimiter pairs match in $\\mathcal{O}(n)$ time.' },
      { id: 3, input: 's = "(]"', output: 'false', explanation: 'Mismatched closing delimiter `]` for opening `(`.' },
    ],
    constraints: [
      '$1 \\le s.\\text{length} \\le 10^4$',
      '$s[i] \\in \\{\\text{"("}, \\text{")"}, \\text{"\\{"}, \\text{"\\}"}, \\text{"["}, \\text{"]"}\\}$',
    ],
    hints: [
      'Use a stack $S$ to push opening brackets and pop matching pairs in $\\mathcal{O}(1)$ per character.',
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
    id: 70,
    slug: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    category: 'Dynamic Programming',
    acceptance: '52.6%',
    solved: true,
    starred: false,
    tags: ['Math', 'Dynamic Programming', 'Memoization'],
    description: `You are climbing a staircase. It takes $n$ steps to reach the top.

Each time you can either climb $1$ or $2$ steps. In how many distinct ways $dp[n]$ can you climb to the top?

### Mathematical Formulation

The number of ways to reach step $n$ follows the **Fibonacci recurrence relation**:

$$
dp[n] = dp[n - 1] + dp[n - 2] \\quad \\text{for } n \\ge 2
$$

with base cases $dp[0] = 1$ and $dp[1] = 1$. By **Binet's formula**, the closed-form solution using the golden ratio $\\varphi = \\frac{1 + \\sqrt{5}}{2}$ is:

$$
dp[n] = \\frac{1}{\\sqrt{5}} \\left[ \\left(\\frac{1 + \\sqrt{5}}{2}\\right)^{n+1} - \\left(\\frac{1 - \\sqrt{5}}{2}\\right)^{n+1} \\right]
$$`,
    examples: [
      { id: 1, input: 'n = 2', output: '2', explanation: 'There are $dp[2] = 1 + 1 = 2$ ways: $(1 + 1)$ or $(2)$.' },
      { id: 2, input: 'n = 3', output: '3', explanation: 'There are $dp[3] = dp[2] + dp[1] = 2 + 1 = 3$ ways: $(1+1+1)$, $(1+2)$, and $(2+1)$.' },
    ],
    constraints: ['$1 \\le n \\le 45$', '$dp[n] < 2^{31} - 1$ (fits in a signed 32-bit integer)'],
    hints: [
      'To reach step $n$, your last move was either $1$ step from $n - 1$ or $2$ steps from $n - 2$, so $dp[n] = dp[n-1] + dp[n-2]$.',
    ],
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
]
