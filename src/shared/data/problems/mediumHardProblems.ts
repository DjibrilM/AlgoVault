import type { Problem } from '../../types/problem.ts'

export const MEDIUM_HARD_PROBLEMS: Problem[] = [
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
    description: `Given a string \`s\` of length $n$, find the length $L^*$ of the **longest contiguous substring** $s[l..r]$ without duplicate characters:

$$
L^* = \\max_{0 \\le l \\le r < n} \\left\\{ r - l + 1 \\;\\middle|\\; |\\{s[k] : l \\le k \\le r\\}| = r - l + 1 \\right\\}
$$

Maintain a sliding window $[l, r]$ in $\\mathcal{O}(n)$ time and $\\mathcal{O}(|\\Sigma|)$ auxiliary space.`,
    examples: [
      {
        id: 1,
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The longest unique window is `"abc"` with length $r - l + 1 = 3$.',
      },
      {
        id: 2,
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'Every window of length $\\ge 2$ repeats `"b"`, so $L^* = 1$.',
      },
    ],
    constraints: [
      '$0 \\le s.\\text{length} \\le 5 \\times 10^4$',
      '$s$ consists of ASCII characters ($|\\Sigma| \\le 128$).',
    ],
    hints: [
      'Use a two-pointer sliding window $[l, r]$ and update $l \\leftarrow \\max(l, \\text{last}[s[r]] + 1)$ whenever $s[r]$ was seen inside the current window.',
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
    starred: false,
    tags: ['Hash Table', 'Linked List', 'Design'],
    description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache** with capacity $C$.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` — Initialize the cache with positive size $C \\ge 1$.
- \`int get(int key)\` — Return the value of \`key\` if it exists in the cache, otherwise return $-1$.
- \`void put(int key, int value)\` — Update or insert \`(key, value)\`. When the number of keys exceeds $C$, evict key $k^* = \\arg\\min_{k} \\text{lastAccess}(k)$.

Both \`get\` and \`put\` must run in $\\mathcal{O}(1)$ average time complexity.`,
    examples: [
      {
        id: 1,
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
        explanation: 'When key $3$ is inserted at capacity $C = 2$, key $2$ has the oldest timestamp and is evicted in $\\mathcal{O}(1)$ time.',
      },
    ],
    constraints: ['$1 \\le \\text{capacity} \\le 3000$', '$0 \\le \\text{key} \\le 10^4$', '$0 \\le \\text{value} \\le 10^5$'],
    hints: ['Combine a hash table $H: \\text{key} \\mapsto \\text{Node}^*$ with a doubly linked list to support $\\mathcal{O}(1)$ splice and eviction.'],
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
    id: 322,
    slug: 'coin-change',
    title: 'Coin Change',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    acceptance: '43.2%',
    solved: false,
    starred: false,
    tags: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
    description: `You are given an integer array \`coins\` representing coins of different denominations $c_1, c_2, \\dots, c_k$ and an integer \`amount\` $A$ representing a total amount of money.

Return *the fewest number of coins* needed to make up that amount $A$. Formally, solve the **unbounded knapsack recurrence**:

$$
dp(x) = \\begin{cases} 0 & \\text{if } x = 0 \\\\ \\min_{c \\in \\text{coins},\\, c \\le x} \\big\\{ 1 + dp(x - c) \\big\\} & \\text{if } x > 0 \\end{cases}
$$

If $dp(A) = +\\infty$, return \`-1\`.`,
    examples: [
      { id: 1, input: 'coins = [1,2,5], amount = 11', output: '3', explanation: 'Optimal decomposition: $11 = 5 + 5 + 1$ using $3$ coins.' },
      { id: 2, input: 'coins = [2], amount = 3', output: '-1', explanation: 'No non-negative integer solution to $2k = 3$ exists.' },
    ],
    constraints: ['$1 \\le \\text{coins.length} \\le 12$', '$1 \\le \\text{coins}[i] \\le 2^{31} - 1$', '$0 \\le \\text{amount} \\le 10^4$'],
    hints: ['Tabulate $dp[i]$ for $i = 1 \\dots A$ in $\\mathcal{O}(A \\cdot |\\text{coins}|)$ time and $\\mathcal{O}(A)$ space.'],
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
    description: `Given $n$ non-negative integers $h[0], h[1], \\dots, h[n-1]$ representing an elevation map where the width of each bar is $1$, compute the total volume $W$ of water trapped after raining:

$$
W = \\sum_{i=0}^{n-1} \\max\\!\\left(0,\\; \\min\\!\\left(\\max_{0 \\le j \\le i} h[j],\\; \\max_{i \\le k < n} h[k]\\right) - h[i]\\right)
$$

Can you compute $W$ in $\\mathcal{O}(n)$ time and $\\mathcal{O}(1)$ auxiliary space using two converging pointers?`,
    examples: [
      {
        id: 1,
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: 'The elevation map traps $1 + 1 + 2 + 1 + 1 = 6$ units of rain water.',
      },
    ],
    constraints: ['$1 \\le n \\le 2 \\times 10^4$', '$0 \\le \\text{height}[i] \\le 10^5$'],
    hints: ['Water above index $i$ is determined by $\\min(L_{\\max}(i), R_{\\max}(i)) - h[i]$.'],
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
]
