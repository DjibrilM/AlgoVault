export type DraftContentType =
  | 'Practice Questions'
  | 'Marathon Track'
  | 'Category & Challenges'

export type DraftDifficulty =
  | 'Easy'
  | 'Medium'
  | 'Hard'
  | 'Progressive (Easy → Hard)'

export type DraftQuestionStyle = 'Implementation' | 'Conceptual' | 'Mixed'

export interface GenerationDraft {
  category: string | null
  topic: string | null
  contentType: DraftContentType | null
  difficulty: DraftDifficulty | null
  questionCount: number | null
  questionStyle: DraftQuestionStyle | null
  readyToGenerate: boolean
  generated: boolean
}

export type DraftFieldKey =
  | 'category'
  | 'topic'
  | 'contentType'
  | 'difficulty'
  | 'questionCount'
  | 'questionStyle'

const TOPIC_CATALOG: Array<{
  keywords: string[]
  topic: string
  category: string
}> = [
  {
    keywords: ['linked list', 'linkedlist', 'linked-list'],
    topic: 'Linked Lists',
    category: 'Data Structures',
  },
  {
    keywords: ['binary tree', 'trees', 'tree', 'bst'],
    topic: 'Trees & BST',
    category: 'Data Structures',
  },
  {
    keywords: ['graph', 'bfs', 'dfs', 'dijkstra', 'topological'],
    topic: 'Graphs & Traversal',
    category: 'Algorithms',
  },
  {
    keywords: ['dynamic programming', 'dp', 'knapsack', 'memoization'],
    topic: 'Dynamic Programming',
    category: 'Algorithms',
  },
  {
    keywords: ['sliding window'],
    topic: 'Sliding Window',
    category: 'Algorithms',
  },
  {
    keywords: ['two pointer', 'two-pointer'],
    topic: 'Two Pointers',
    category: 'Algorithms',
  },
  {
    keywords: ['binary search'],
    topic: 'Binary Search',
    category: 'Algorithms',
  },
  {
    keywords: ['trie', 'prefix tree'],
    topic: 'Tries & Prefix Trees',
    category: 'Data Structures',
  },
  {
    keywords: ['heap', 'priority queue'],
    topic: 'Heaps & Priority Queues',
    category: 'Data Structures',
  },
  {
    keywords: ['stack', 'queue', 'monotonic'],
    topic: 'Stacks & Queues',
    category: 'Data Structures',
  },
  {
    keywords: ['backtracking', 'recursion', 'permutation'],
    topic: 'Backtracking & Recursion',
    category: 'Algorithms',
  },
  {
    keywords: ['hash', 'hashmap', 'dictionary', 'array', 'string'],
    topic: 'Arrays & Hashing',
    category: 'Data Structures',
  },
]

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
}

export function isReadyToGenerate(draft: GenerationDraft): boolean {
  return Boolean(
    draft.category &&
      draft.topic &&
      draft.contentType &&
      draft.difficulty &&
      draft.questionCount &&
      draft.questionStyle
  )
}

export function isConfirmationIntent(input: string): boolean {
  const lower = input.trim().toLowerCase()
  return /^(yes|yep|yeah|sure|ok|okay|go ahead|generate|create|build it|do it|looks good|confirm|start|proceed)\b/.test(
    lower
  )
}

export function isRejectionIntent(input: string): boolean {
  const lower = input.trim().toLowerCase()
  return /^(no|nope|nah|not yet|don'?t|do not|cancel|hold on|wait|stop)\b/.test(lower)
}

export function extractDraftUpdates(
  input: string,
  currentDraft: GenerationDraft | null
): {
  draft: GenerationDraft | null
  updatedFields: DraftFieldKey[]
  hasGenerationIntent: boolean
} {
  const lower = input.toLowerCase()

  const intentSignal =
    currentDraft !== null ||
    /\b(practice|create|build|make|generate|want|need|give me|prepare|marathon|track|challenge|question|problem|study|learn)\b/i.test(
      input
    )

  if (!intentSignal) {
    return { draft: null, updatedFields: [], hasGenerationIntent: false }
  }

  const next: GenerationDraft = currentDraft
    ? { ...currentDraft }
    : {
        category: null,
        topic: null,
        contentType: null,
        difficulty: null,
        questionCount: null,
        questionStyle: null,
        readyToGenerate: false,
        generated: false,
      }

  const updatedFields: DraftFieldKey[] = []

  // 1. Topic & Category
  const matchedTopic = TOPIC_CATALOG.find((entry) =>
    entry.keywords.some((kw) => lower.includes(kw))
  )
  if (matchedTopic) {
    if (next.topic !== matchedTopic.topic) {
      next.topic = matchedTopic.topic
      updatedFields.push('topic')
    }
    if (next.category !== matchedTopic.category) {
      next.category = matchedTopic.category
      updatedFields.push('category')
    }
  } else if (!next.topic && currentDraft === null) {
    const cleaned = input
      .replace(
        /^(i want to|i'd like to|can you|please|let's|help me|create|build|make|generate|practice|some|a|an|the|problems?|challenges?|questions?|about|on|for)\s+/gi,
        ''
      )
      .replace(/\b(problems?|challenges?|questions?|practice|marathon|track)\b/gi, '')
      .trim()
    if (cleaned.length >= 2) {
      const formatted = cleaned
        .split(/\s+/)
        .slice(0, 4)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
      next.topic = formatted
      updatedFields.push('topic')
    }
    if (!next.category) {
      next.category = 'Problem Solving'
      updatedFields.push('category')
    }
  }

  // 2. Content Type
  if (/\b(marathon|track|roadmap|path)\b/i.test(lower)) {
    if (next.contentType !== 'Marathon Track') {
      next.contentType = 'Marathon Track'
      updatedFields.push('contentType')
    }
  } else if (/\b(category|collection|module)\b/i.test(lower)) {
    if (next.contentType !== 'Category & Challenges') {
      next.contentType = 'Category & Challenges'
      updatedFields.push('contentType')
    }
  } else if (!next.contentType) {
    next.contentType = 'Practice Questions'
    updatedFields.push('contentType')
  }

  // 3. Difficulty
  let detectedDifficulty: DraftDifficulty | null = null
  if (
    /\b(progress|progressive|easiest to hardest|easy to hard|ramp|gradual|all levels)\b/i.test(
      lower
    )
  ) {
    detectedDifficulty = 'Progressive (Easy → Hard)'
  } else if (/\b(easy|beginner|simple|basic)\b/i.test(lower)) {
    detectedDifficulty = 'Easy'
  } else if (/\b(medium|intermediate|moderate)\b/i.test(lower)) {
    detectedDifficulty = 'Medium'
  } else if (/\b(hard|advanced|tough|challenging)\b/i.test(lower)) {
    detectedDifficulty = 'Hard'
  }
  if (detectedDifficulty && next.difficulty !== detectedDifficulty) {
    next.difficulty = detectedDifficulty
    updatedFields.push('difficulty')
  }

  // 4. Number of Questions
  let detectedCount: number | null = null
  const numMatch = lower.match(/\b(\d{1,2})\b/)
  if (numMatch) {
    const parsed = Number.parseInt(numMatch[1], 10)
    if (parsed >= 1 && parsed <= 30) {
      detectedCount = parsed
    }
  } else {
    for (const [word, val] of Object.entries(WORD_NUMBERS)) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
        detectedCount = val
        break
      }
    }
  }
  if (detectedCount !== null && next.questionCount !== detectedCount) {
    next.questionCount = detectedCount
    updatedFields.push('questionCount')
  }

  // 5. Question Style
  let detectedStyle: DraftQuestionStyle | null = null
  if (/\b(mix|mixture|both|combo|combination)\b/i.test(lower)) {
    detectedStyle = 'Mixed'
  } else if (/\b(concept|conceptual|theory|theoretical|quiz)\b/i.test(lower)) {
    detectedStyle = 'Conceptual'
  } else if (/\b(implement|implementation|coding|code|hands-on|algorithmic)\b/i.test(lower)) {
    detectedStyle = 'Implementation'
  }
  if (detectedStyle && next.questionStyle !== detectedStyle) {
    next.questionStyle = detectedStyle
    updatedFields.push('questionStyle')
  }

  next.readyToGenerate = isReadyToGenerate(next)

  return {
    draft: next,
    updatedFields,
    hasGenerationIntent: true,
  }
}

export function buildClarificationResponse(
  draft: GenerationDraft,
  updatedFields: DraftFieldKey[]
): { message: string; reasoning: string } {
  const updatedText =
    updatedFields.length > 0
      ? `Updated ${updatedFields.join(', ')} in the generation draft.`
      : 'Reviewed current generation draft.'

  if (!draft.topic) {
    return {
      reasoning: `${updatedText} Topic is still missing.`,
      message:
        'Got it! Which **topic or data structure** would you like to focus on (for example, Linked Lists, Trees, or Dynamic Programming)?',
    }
  }

  if (!draft.questionCount) {
    return {
      reasoning: `${updatedText} Asking for question count next.`,
      message: `I've started a **${draft.topic}** draft for you. **How many questions** would you like to practice?`,
    }
  }

  if (!draft.difficulty) {
    return {
      reasoning: `${updatedText} Question count confirmed (${draft.questionCount}). Asking for difficulty progression next.`,
      message: `Great — **${draft.questionCount} questions** on **${draft.topic}**. Should they all share the same difficulty (Easy, Medium, or Hard), or **progress from easiest to hardest**?`,
    }
  }

  if (!draft.questionStyle) {
    return {
      reasoning: `${updatedText} Difficulty confirmed (${draft.difficulty}). Asking for question style next.`,
      message: `Perfect. Would you prefer **conceptual questions**, **implementation challenges**, or a **mixture of both**?`,
    }
  }

  return {
    reasoning: `${updatedText} All specification fields are confirmed. Asking user to confirm generation.`,
    message: `Everything is set for your **${draft.questionCount} ${draft.topic}** ${draft.contentType?.toLowerCase()} (**${draft.difficulty}**, **${draft.questionStyle}**).\n\nShould I create these questions now? Reply **Yes** or **No**.`,
  }
}

export interface GeneratedQuestionItem {
  id: string
  index: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  style: 'Conceptual' | 'Implementation'
  description: string
}

const TOPIC_TITLES: Record<string, string[]> = {
  'Linked Lists': [
    'Traverse & Count Linked List Nodes',
    'Reverse a Singly Linked List',
    'Detect Cycle Using Fast & Slow Pointers',
    'Merge Two Sorted Linked Lists',
    'Remove Nth Node From End of List',
    'Find Middle Node & Check Palindrome',
    'Reorder Linked List Alternating Ends',
    'Design LRU Cache with Doubly Linked List',
  ],
  'Trees & BST': [
    'Invert a Binary Tree',
    'Level-Order Breadth-First Traversal',
    'Validate Binary Search Tree Bounds',
    'Lowest Common Ancestor in BST',
    'Maximum Path Sum in Binary Tree',
  ],
  'Graphs & Traversal': [
    'Breadth-First Shortest Path Unweighted',
    'Number of Connected Components',
    'Detect Cycle in Directed Graph',
    'Topological Sort Course Schedule',
    'Dijkstra Shortest Weighted Path',
  ],
  'Sliding Window': [
    'Maximum Sum Subarray of Size K',
    'Longest Substring Without Repeating Characters',
    'Minimum Window Substring Cover',
    'Longest Repeating Character Replacement',
    'Permutation in String Match',
  ],
}

export function buildGeneratedQuestions(draft: GenerationDraft): GeneratedQuestionItem[] {
  const count = Math.min(Math.max(draft.questionCount ?? 3, 1), 15)
  const topic = draft.topic ?? 'Algorithm'
  const catalog = TOPIC_TITLES[topic] ?? []

  return Array.from({ length: count }, (_, idx) => {
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
    if (draft.difficulty === 'Easy' || draft.difficulty === 'Medium' || draft.difficulty === 'Hard') {
      difficulty = draft.difficulty
    } else {
      const ratio = count === 1 ? 0.5 : idx / (count - 1)
      difficulty = ratio < 0.34 ? 'Easy' : ratio < 0.72 ? 'Medium' : 'Hard'
    }

    const style: 'Conceptual' | 'Implementation' =
      draft.questionStyle === 'Conceptual'
        ? 'Conceptual'
        : draft.questionStyle === 'Implementation'
          ? 'Implementation'
          : idx % 2 === 0
            ? 'Implementation'
            : 'Conceptual'

    const title = catalog[idx] ?? `${topic} Problem ${idx + 1}`

    return {
      id: `${Date.now()}-${idx}`,
      index: idx + 1,
      title,
      difficulty,
      style,
      description: `### ${title}\n\nGenerated for **${topic}** (${difficulty} · ${style}).\n\nImplement an optimal solution satisfying the problem constraints and edge cases.`,
    }
  })
}

