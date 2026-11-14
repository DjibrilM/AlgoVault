/**
 * @file seeds/default-categories.seed.ts
 * @description Initial seed data and idempotent seeder for the 20 most famous DSA categories on first install.
 */

import type { DataSource } from 'typeorm'
import { CategoryEntity, type CategoryRecord } from '../entities/category.entity.ts'

export interface DefaultCategorySeed {
  title: string
  description: string
}

export const DEFAULT_CATEGORIES: readonly DefaultCategorySeed[] = [
  {
    title: 'Arrays & Hashing',
    description:
      'Contiguous memory layouts, hash tables, frequency maps, and prefix sums.',
  },
  {
    title: 'Two Pointers',
    description:
      'Converging and parallel index traversal on sorted arrays and sequences.',
  },
  {
    title: 'Sliding Window',
    description:
      'Dynamic contiguous subarrays and substrings with invariant maintenance.',
  },
  {
    title: 'Stack & Monotonic Stack',
    description:
      'LIFO evaluation, expression parsing, and next-greater element spans.',
  },
  {
    title: 'Binary Search',
    description:
      'Logarithmic search over sorted arrays and monotonic answer spaces.',
  },
  {
    title: 'Linked Lists',
    description:
      'Singly and doubly linked pointer manipulation, cycle detection, and LRU structures.',
  },
  {
    title: 'Trees & Binary Search Trees',
    description:
      'Hierarchical traversal (DFS/BFS), BST properties, and lowest common ancestor queries.',
  },
  {
    title: 'Tries (Prefix Trees)',
    description:
      'Character prefix trees for fast dictionary lookup, autocomplete, and word search.',
  },
  {
    title: 'Heap / Priority Queue',
    description:
      'Top-K selection, running median maintenance, and k-way stream merging.',
  },
  {
    title: 'Backtracking',
    description:
      'Exhaustive state-space search with pruning for permutations, combinations, and puzzles.',
  },
  {
    title: 'Graphs (BFS & DFS)',
    description:
      'Connected components, topological sorting, cycle detection, and shortest unweighted paths.',
  },
  {
    title: 'Advanced Graphs',
    description:
      'Dijkstra, Bellman-Ford, Floyd-Warshall, and Minimum Spanning Trees (Kruskal & Prim).',
  },
  {
    title: 'Union-Find (Disjoint Set)',
    description:
      'Dynamic connectivity, path compression, and rank-based component merging.',
  },
  {
    title: '1-D Dynamic Programming',
    description:
      'Optimal substructure and overlapping subproblems across linear state spaces.',
  },
  {
    title: '2-D Dynamic Programming',
    description:
      'Grid paths, knapsack variants, edit distance, and interval DP tables.',
  },
  {
    title: 'Greedy Algorithms',
    description:
      'Locally optimal choices that guarantee global optimality via exchange arguments.',
  },
  {
    title: 'Intervals & Sweep Line',
    description:
      'Merging, inserting, and scheduling overlapping time or coordinate intervals.',
  },
  {
    title: 'Math & Number Theory',
    description:
      'Modular arithmetic, prime sieves, combinatorics, and matrix transformations.',
  },
  {
    title: 'Bit Manipulation',
    description:
      'Bitwise XOR tricks, bitmasks, power-of-two checks, and low-level register operations.',
  },
  {
    title: 'Strings & Pattern Matching',
    description:
      'Palindromes, rolling hashes (Rabin-Karp), KMP prefix tables, and lexicographical analysis.',
  },
]

/**
 * Seeds the 20 default categories into the database if the `categories` table is currently empty.
 * Safe to invoke on every application startup (idempotent).
 */
export async function seedDefaultCategories(
  dataSource: DataSource
): Promise<CategoryRecord[]> {
  const categoryRepo = dataSource.getRepository(CategoryEntity)
  const existingCount = await categoryRepo.count()

  if (existingCount > 0) {
    return categoryRepo.find({ order: { id: 'ASC' } })
  }

  const entities = DEFAULT_CATEGORIES.map((seed) =>
    categoryRepo.create({
      title: seed.title,
      description: seed.description,
    })
  )

  return categoryRepo.save(entities)
}

