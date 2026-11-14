import type { Problem } from '../../types/problem.ts'

export const EASY_PROBLEMS: Problem[] = [
  {
    id: 100,
    slug: 'sum-of-two-numbers',
    title: 'Sum of Two Numbers',
    difficulty: 'Easy',
    category: 'Warmup',
    acceptance: '98.5%',
    solved: false,
    starred: false,
    tags: ['Math', 'Warmup', 'Arithmetic'],
    description: `Welcome to the AlgoVault sandbox! This warmup problem lets you verify your execution environment and test your code directly inside the QEMU micro-VM using a pure return-based function.

### Problem Statement

Given two integers \`a\` and \`b\`, return their sum:

$$
S = a + b
$$

### Examples
- \`a = 3, b = 5\` $\\to$ \`8\`
- \`a = 40, b = 2\` $\\to$ \`42\`

### Constraints
- $-10^9 \\le a, b \\le 10^9$
- The sum fits comfortably in a standard 64-bit signed integer.`,
    examples: [
      {
        id: 1,
        input: 'a = 3, b = 5',
        output: '8',
        explanation: '3 + 5 = 8',
      },
      {
        id: 2,
        input: 'a = 40, b = 2',
        output: '42',
        explanation: '40 + 2 = 42',
      },
    ],
    constraints: [
      '$-10^9 \\le a, b \\le 10^9$',
      'Result fits in a 64-bit integer.',
    ],
    hints: [
      'Return the sum of a and b using the addition operator (+).',
    ],
    codeTemplates: {
      typescript: `function sum(a: number, b: number): number {
  return a + b;
}
`,
      javascript: `function sum(a, b) {
  return a + b;
}
`,
      python: `def sum(a: int, b: int) -> int:
    return a + b
`,
      cpp: `class Solution {
public:
    long long sum(long long a, long long b) {
        return a + b;
    }
};
`,
    },
    testCases: [
      // Visible test cases (shown in Testcases tab and evaluated on Run)
      { id: 1, input: 'a = 3, b = 5', expected: '8', stdin: '3 5\n', hidden: false },
      { id: 2, input: 'a = 40, b = 2', expected: '42', stdin: '40 2\n', hidden: false },

      // Hidden test cases (evaluated on Submit)
      { id: 3, input: 'a = 0, b = 0', expected: '0', stdin: '0 0\n', hidden: true },
      { id: 4, input: 'a = -10, b = 25', expected: '15', stdin: '-10 25\n', hidden: true },
      { id: 5, input: 'a = -50, b = -50', expected: '-100', stdin: '-50 -50\n', hidden: true },
      { id: 6, input: 'a = 1000000000, b = 2000000000', expected: '3000000000', stdin: '1000000000 2000000000\n', hidden: true },
    ],
  },
  {
    id: 101,
    slug: 'multiply-two-numbers',
    title: 'Multiply Two Numbers',
    difficulty: 'Easy',
    category: 'Arithmetic',
    acceptance: '99.1%',
    solved: false,
    starred: false,
    tags: ['Math', 'Arithmetic', 'Basic'],
    description: `Given two integers \`a\` and \`b\`, return their product:

$$
P = a \\times b
$$

This basic arithmetic challenge is ideal for testing pure function evaluation without standard I/O boilerplate.`,
    examples: [
      { id: 1, input: 'a = 3, b = 4', output: '12', explanation: '3 * 4 = 12' },
      { id: 2, input: 'a = -5, b = 6', output: '-30', explanation: '-5 * 6 = -30' },
      { id: 3, input: 'a = 0, b = 100', output: '0', explanation: '0 * 100 = 0' },
    ],
    constraints: [
      '$-10^9 \\le a, b \\le 10^9$',
      'The result fits in a standard 64-bit signed integer.',
    ],
    hints: [
      'Return the product of a and b using the multiplication operator (*).',
    ],
    codeTemplates: {
      typescript: `function multiply(a: number, b: number): number {
  return a * b;
}
`,
      javascript: `function multiply(a, b) {
  return a * b;
}
`,
      python: `def multiply(a: int, b: int) -> int:
    return a * b
`,
      cpp: `class Solution {
public:
    long long multiply(long long a, long long b) {
        return a * b;
    }
};
`,
    },
    testCases: [
      // Visible test cases (shown in Testcases tab and evaluated on Run)
      { id: 1, input: 'a = 3, b = 4', expected: '12', stdin: '3 4\n', hidden: false },
      { id: 2, input: 'a = -5, b = 6', expected: '-30', stdin: '-5 6\n', hidden: false },
      { id: 3, input: 'a = 7, b = 8', expected: '56', stdin: '7 8\n', hidden: false },

      // Hidden test cases (evaluated on Submit)
      { id: 4, input: 'a = 0, b = 999', expected: '0', stdin: '0 999\n', hidden: true },
      { id: 5, input: 'a = -12, b = -12', expected: '144', stdin: '-12 -12\n', hidden: true },
      { id: 6, input: 'a = 1000, b = 250', expected: '250000', stdin: '1000 250\n', hidden: true },
      { id: 7, input: 'a = 1, b = -1', expected: '-1', stdin: '1 -1\n', hidden: true },
    ],
  },
  {
    id: 102,
    slug: 'factorial-of-a-number',
    title: 'Factorial of a Number',
    difficulty: 'Easy',
    category: 'Arithmetic',
    acceptance: '94.2%',
    solved: false,
    starred: false,
    tags: ['Math', 'Recursion', 'Arithmetic'],
    description: `Given a non-negative integer \`n\`, return its factorial $n!$:

$$
n! = \\prod_{i=1}^{n} i = 1 \\times 2 \\times 3 \\times \\dots \\times n
$$

By mathematical convention, $0! = 1$.`,
    examples: [
      { id: 1, input: 'n = 5', output: '120', explanation: '5! = 5 * 4 * 3 * 2 * 1 = 120' },
      { id: 2, input: 'n = 0', output: '1', explanation: '0! = 1 by definition.' },
      { id: 3, input: 'n = 3', output: '6', explanation: '3! = 3 * 2 * 1 = 6' },
    ],
    constraints: [
      '$0 \\le n \\le 12$',
      'The result fits in a standard 32-bit integer.',
    ],
    hints: [
      'You can calculate the factorial either iteratively with a for loop or recursively.',
      'Remember that 0! is 1, not 0.',
    ],
    codeTemplates: {
      typescript: `function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}
`,
      javascript: `function factorial(n) {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}
`,
      python: `def factorial(n: int) -> int:
    if n <= 1:
        return 1
    res = 1
    for i in range(2, n + 1):
        res *= i
    return res
`,
      cpp: `class Solution {
public:
    long long factorial(int n) {
        if (n <= 1) return 1;
        long long res = 1;
        for (int i = 2; i <= n; ++i) res *= i;
        return res;
    }
};
`,
    },
    testCases: [
      // Visible test cases (shown in Testcases tab and evaluated on Run)
      { id: 1, input: 'n = 5', expected: '120', stdin: '5\n', hidden: false },
      { id: 2, input: 'n = 0', expected: '1', stdin: '0\n', hidden: false },
      { id: 3, input: 'n = 3', expected: '6', stdin: '3\n', hidden: false },

      // Hidden test cases (evaluated on Submit)
      { id: 4, input: 'n = 1', expected: '1', stdin: '1\n', hidden: true },
      { id: 5, input: 'n = 4', expected: '24', stdin: '4\n', hidden: true },
      { id: 6, input: 'n = 6', expected: '720', stdin: '6\n', hidden: true },
      { id: 7, input: 'n = 10', expected: '3628800', stdin: '10\n', hidden: true },
    ],
  },
  {
    id: 9,
    slug: 'palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'Easy',
    category: 'Math',
    acceptance: '54.2%',
    solved: false,
    starred: false,
    tags: ['Math', 'String'],
    description: `Given an integer \`x\`, return \`true\` if \`x\` is a **palindrome**, and \`false\` otherwise.

An integer is a palindrome when it reads the same forward and backward. For example, \`121\` is a palindrome while \`123\` is not.

### Examples
- \`x = 121\` $\\to$ \`true\`
- \`x = -121\` $\\to$ \`false\` (from left to right: \`-121\`; from right to left: \`121-\`)
- \`x = 10\` $\\to$ \`false\` (reads \`01\` from right to left)`,
    examples: [
      { id: 1, input: 'x = 121', output: 'true', explanation: '121 reads as 121 from left to right and from right to left.' },
      { id: 2, input: 'x = -121', output: 'false', explanation: 'From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.' },
      { id: 3, input: 'x = 10', output: 'false', explanation: 'Reads 01 from right to left. Therefore it is not a palindrome.' },
    ],
    constraints: ['$-2^{31} \\le x \\le 2^{31} - 1$'],
    hints: [
      'Negative numbers cannot be palindromes due to the leading minus sign.',
      'You can convert the number to a string and check if it equals its reverse, or reverse half the number arithmetically.',
    ],
    codeTemplates: {
      python: `def isPalindrome(x: int) -> bool:
    if x < 0:
        return False
    s = str(x)
    return s == s[::-1]
`,
      typescript: `function isPalindrome(x: number): boolean {
  if (x < 0) return false;
  const s = String(x);
  return s === s.split('').reverse().join('');
}
`,
      javascript: `function isPalindrome(x) {
  if (x < 0) return false;
  const s = String(x);
  return s === s.split('').reverse().join('');
}
`,
      cpp: `class Solution {
public:
    bool isPalindrome(int x) {
        if (x < 0) return false;
        long long rev = 0, orig = x;
        while (x > 0) {
            rev = rev * 10 + x % 10;
            x /= 10;
        }
        return rev == orig;
    }
};
`,
    },
    testCases: [
      // Visible test cases
      { id: 1, input: 'x = 121', expected: 'true', stdin: '121\n', hidden: false },
      { id: 2, input: 'x = -121', expected: 'false', stdin: '-121\n', hidden: false },

      // Hidden test cases
      { id: 3, input: 'x = 10', expected: 'false', stdin: '10\n', hidden: true },
      { id: 4, input: 'x = 0', expected: 'true', stdin: '0\n', hidden: true },
      { id: 5, input: 'x = 12321', expected: 'true', stdin: '12321\n', hidden: true },
      { id: 6, input: 'x = 1000021', expected: 'false', stdin: '1000021\n', hidden: true },
    ],
  },
  {
    id: 1,
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Data Structures',
    acceptance: '51.8%',
    solved: true,
    starred: false,
    tags: ['Array', 'Hash Table'],
    description: `Given an array of integers \`nums\` of length $n$ and an integer \`target\`, return *indices of the two numbers* $i$ and $j$ ($0 \\le i < j < n$) such that they satisfy:

$$
\\text{nums}[i] + \\text{nums}[j] = \\text{target}
$$

You may assume that each input would have ***exactly one solution***, and you may not use the *same* element twice ($i \\neq j$).

You can return the answer in any order.`,
    examples: [
      {
        id: 1,
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        id: 2,
        input: 'nums = [3,2,4], target = 6',
        output: '[1, 2]',
        explanation: 'Here nums[1] + nums[2] == 6, yielding indices [1, 2].',
      },
    ],
    constraints: [
      '$2 \\le \\text{nums.length} \\le 10^4$',
      '$-10^9 \\le \\text{nums}[i] \\le 10^9$',
      '$-10^9 \\le \\text{target} \\le 10^9$',
      'Only **one valid answer** exists.',
    ],
    hints: [
      'For each element $x = \\text{nums}[i]$, its required complement is $y = \\text{target} - x$.',
      'Store visited numbers in a hash map mapping value $\\to$ index for $\\mathcal{O}(1)$ lookup.',
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
}
`,
      python: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i
    return []
`,
      javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}
`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int diff = target - nums[i];
            if (seen.count(diff)) return {seen[diff], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};
`,
    },
    testCases: [
      // Visible test cases
      { id: 1, input: 'nums = [2,7,11,15], target = 9', expected: '[0, 1]', stdin: '4 9\n2 7 11 15\n', hidden: false },
      { id: 2, input: 'nums = [3,2,4], target = 6', expected: '[1, 2]', stdin: '3 6\n3 2 4\n', hidden: false },

      // Hidden test cases
      { id: 3, input: 'nums = [3,3], target = 6', expected: '[0, 1]', stdin: '2 6\n3 3\n', hidden: true },
      { id: 4, input: 'nums = [-1,-2,-3,-4,-5], target = -8', expected: '[2, 4]', stdin: '5 -8\n-1 -2 -3 -4 -5\n', hidden: true },
      { id: 5, input: 'nums = [1000000000, 500000000, -500000000], target = 0', expected: '[1, 2]', stdin: '3 0\n1000000000 500000000 -500000000\n', hidden: true },
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
    starred: false,
    tags: ['String', 'Stack'],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is **valid**.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { id: 1, input: 's = "()"', output: 'true', explanation: 'Balanced single pair.' },
      { id: 2, input: 's = "()[]{}"', output: 'true', explanation: 'All delimiter pairs match properly.' },
      { id: 3, input: 's = "(]"', output: 'false', explanation: 'Mismatched closing bracket ] for opening (.' },
    ],
    constraints: [
      '$1 \\le s.\\text{length} \\le 10^4$',
      's consists of parentheses only: \`()[]{}\`',
    ],
    hints: [
      'Use a stack to push opening brackets and pop matching pairs in $\\mathcal{O}(1)$ time.',
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
}
`,
      python: `def isValid(s: str) -> bool:
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in pairs:
            if not stack or stack.pop() != pairs[char]:
                return False
        else:
            stack.append(char)
    return len(stack) == 0
`,
      javascript: `function isValid(s) {
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
}
`,
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
};
`,
    },
    testCases: [
      // Visible test cases
      { id: 1, input: 's = "()"', expected: 'true', stdin: '()\n', hidden: false },
      { id: 2, input: 's = "()[]{}"', expected: 'true', stdin: '()[]{}\n', hidden: false },

      // Hidden test cases
      { id: 3, input: 's = "(]"', expected: 'false', stdin: '(]\n', hidden: true },
      { id: 4, input: 's = "([)]"', expected: 'false', stdin: '([)]\n', hidden: true },
      { id: 5, input: 's = "{[]}"', expected: 'true', stdin: '{[]}\n', hidden: true },
      { id: 6, input: 's = "["', expected: 'false', stdin: '[\n', hidden: true },
      { id: 7, input: 's = "((((((()))))))"', expected: 'true', stdin: '((((((()))))))\n', hidden: true },
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

Each time you can either climb $1$ or $2$ steps. In how many distinct ways can you climb to the top?

### Recurrence Relation
$$
dp[n] = dp[n - 1] + dp[n - 2]
$$
with base cases $dp[1] = 1$ and $dp[2] = 2$.`,
    examples: [
      { id: 1, input: 'n = 2', output: '2', explanation: '1 step + 1 step, or 2 steps.' },
      { id: 2, input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, or 2+1.' },
    ],
    constraints: ['$1 \\le n \\le 45$'],
    hints: [
      'To reach step $n$, your last move was either from $n - 1$ or $n - 2$.',
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
}
`,
      python: `def climbStairs(n: int) -> int:
    if n <= 2:
        return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b
`,
      javascript: `function climbStairs(n) {
  if (n <= 2) return n;
  let prev1 = 2, prev2 = 1;
  for (let i = 3; i <= n; i++) {
    const cur = prev1 + prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}
`,
      cpp: `class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; ++i) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
};
`,
    },
    testCases: [
      // Visible test cases
      { id: 1, input: 'n = 2', expected: '2', stdin: '2\n', hidden: false },
      { id: 2, input: 'n = 3', expected: '3', stdin: '3\n', hidden: false },

      // Hidden test cases
      { id: 3, input: 'n = 1', expected: '1', stdin: '1\n', hidden: true },
      { id: 4, input: 'n = 4', expected: '5', stdin: '4\n', hidden: true },
      { id: 5, input: 'n = 10', expected: '89', stdin: '10\n', hidden: true },
      { id: 6, input: 'n = 45', expected: '1836311903', stdin: '45\n', hidden: true },
    ],
  },
]
