import { AICategory } from '../../types/problem'

// Initial 20 Famous DSA & Coding Interview Categories available on first install
export const INITIAL_AI_CATEGORIES: AICategory[] = [
  {
    id: 'arrays-and-hashing',
    name: 'Arrays & Hashing',
    description:
      'Contiguous memory layouts, hash tables, frequency maps, and prefix sums.',
    problemIds: [1, 100, 101],
  },
  {
    id: 'two-pointers',
    name: 'Two Pointers',
    description:
      'Converging and parallel index traversal on sorted arrays and sequences.',
    problemIds: [42, 9, 1],
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window',
    description:
      'Dynamic contiguous subarrays and substrings with invariant maintenance.',
    problemIds: [3, 42],
  },
  {
    id: 'stack-and-monotonic-stack',
    name: 'Stack & Monotonic Stack',
    description:
      'LIFO evaluation, expression parsing, and next-greater element spans.',
    problemIds: [20, 42],
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    description:
      'Logarithmic search over sorted arrays and monotonic answer spaces.',
    problemIds: [1, 100],
  },
  {
    id: 'linked-lists',
    name: 'Linked Lists',
    description:
      'Singly and doubly linked pointer manipulation, cycle detection, and LRU structures.',
    problemIds: [146],
  },
  {
    id: 'trees-and-bst',
    name: 'Trees & Binary Search Trees',
    description:
      'Hierarchical traversal (DFS/BFS), BST properties, and lowest common ancestor queries.',
    problemIds: [102, 70],
  },
  {
    id: 'tries',
    name: 'Tries (Prefix Trees)',
    description:
      'Character prefix trees for fast dictionary lookup, autocomplete, and word search.',
    problemIds: [3, 20],
  },
  {
    id: 'heap-priority-queue',
    name: 'Heap / Priority Queue',
    description:
      'Top-K selection, running median maintenance, and k-way stream merging.',
    problemIds: [146, 322],
  },
  {
    id: 'backtracking',
    name: 'Backtracking',
    description:
      'Exhaustive state-space search with pruning for permutations, combinations, and puzzles.',
    problemIds: [102, 70],
  },
  {
    id: 'graphs-bfs-dfs',
    name: 'Graphs (BFS & DFS)',
    description:
      'Connected components, topological sorting, cycle detection, and shortest unweighted paths.',
    problemIds: [322, 146],
  },
  {
    id: 'advanced-graphs',
    name: 'Advanced Graphs',
    description:
      'Dijkstra, Bellman-Ford, Floyd-Warshall, and Minimum Spanning Trees (Kruskal & Prim).',
    problemIds: [322, 42],
  },
  {
    id: 'union-find',
    name: 'Union-Find (Disjoint Set)',
    description:
      'Dynamic connectivity, path compression, and rank-based component merging.',
    problemIds: [1, 146],
  },
  {
    id: '1d-dynamic-programming',
    name: '1-D Dynamic Programming',
    description:
      'Optimal substructure and overlapping subproblems across linear state spaces.',
    problemIds: [70, 322],
  },
  {
    id: '2d-dynamic-programming',
    name: '2-D Dynamic Programming',
    description:
      'Grid paths, knapsack variants, edit distance, and interval DP tables.',
    problemIds: [322, 42],
  },
  {
    id: 'greedy-algorithms',
    name: 'Greedy Algorithms',
    description:
      'Locally optimal choices that guarantee global optimality via exchange arguments.',
    problemIds: [42, 3],
  },
  {
    id: 'intervals-and-sweep-line',
    name: 'Intervals & Sweep Line',
    description:
      'Merging, inserting, and scheduling overlapping time or coordinate intervals.',
    problemIds: [1, 42],
  },
  {
    id: 'math-and-number-theory',
    name: 'Math & Number Theory',
    description:
      'Modular arithmetic, prime sieves, combinatorics, and matrix transformations.',
    problemIds: [100, 101, 102, 9],
  },
  {
    id: 'bit-manipulation',
    name: 'Bit Manipulation',
    description:
      'Bitwise XOR tricks, bitmasks, power-of-two checks, and low-level register operations.',
    problemIds: [100, 101, 9],
  },
  {
    id: 'strings-and-pattern-matching',
    name: 'Strings & Pattern Matching',
    description:
      'Palindromes, rolling hashes (Rabin-Karp), KMP prefix tables, and lexicographical analysis.',
    problemIds: [3, 9, 20],
  },
]
