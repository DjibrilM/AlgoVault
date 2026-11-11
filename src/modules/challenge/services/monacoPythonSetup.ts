import * as monaco from 'monaco-editor'

interface PyCompletionItem {
  label: string
  kind: monaco.languages.CompletionItemKind
  detail: string
  documentation: string
  insertText: string
  isSnippet?: boolean
}

const PYTHON_KEYWORDS: string[] = [
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for',
  'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None',
  'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try',
  'while', 'with', 'yield', 'self',
]

const PYTHON_BUILTINS_AND_STDLIB: PyCompletionItem[] = [
  {
    label: 'len',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'len(obj: Sized) -> int',
    documentation: 'Return the number of items in a container in O(1) time.',
    insertText: 'len(${1:obj})',
    isSnippet: true,
  },
  {
    label: 'range',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'range(start, stop[, step]) -> range',
    documentation: 'Return an immutable sequence of numbers from start to stop.',
    insertText: 'range(${1:n})',
    isSnippet: true,
  },
  {
    label: 'enumerate',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'enumerate(iterable, start=0) -> Iterator[tuple[int, T]]',
    documentation: 'Yield (index, value) pairs from an iterable.',
    insertText: 'enumerate(${1:iterable})',
    isSnippet: true,
  },
  {
    label: 'zip',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'zip(*iterables) -> Iterator[tuple]',
    documentation: 'Iterate over several iterables in parallel, producing tuples.',
    insertText: 'zip(${1:a}, ${2:b})',
    isSnippet: true,
  },
  {
    label: 'sorted',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'sorted(iterable, *, key=None, reverse=False) -> list[T]',
    documentation: 'Return a new sorted list from the items in iterable (Timsort, O(n log n)).',
    insertText: 'sorted(${1:iterable})',
    isSnippet: true,
  },
  {
    label: 'min',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'min(iterable, *[, key, default]) -> T',
    documentation: 'Return the smallest item in an iterable or the smallest of two or more arguments.',
    insertText: 'min(${1:a}, ${2:b})',
    isSnippet: true,
  },
  {
    label: 'max',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'max(iterable, *[, key, default]) -> T',
    documentation: 'Return the largest item in an iterable or the largest of two or more arguments.',
    insertText: 'max(${1:a}, ${2:b})',
    isSnippet: true,
  },
  {
    label: 'sum',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'sum(iterable, /, start=0) -> number',
    documentation: 'Sums start and the items of an iterable from left to right.',
    insertText: 'sum(${1:iterable})',
    isSnippet: true,
  },
  {
    label: 'abs',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'abs(x: number) -> number',
    documentation: 'Return the absolute value of a number.',
    insertText: 'abs(${1:x})',
    isSnippet: true,
  },
  {
    label: 'ord',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'ord(c: str) -> int',
    documentation: 'Return the Unicode code point for a one-character string.',
    insertText: 'ord(${1:ch})',
    isSnippet: true,
  },
  {
    label: 'chr',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'chr(i: int) -> str',
    documentation: 'Return a Unicode string of one character with ordinal i.',
    insertText: 'chr(${1:code})',
    isSnippet: true,
  },
  {
    label: 'defaultdict',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'collections.defaultdict(default_factory)',
    documentation: 'Dict subclass that calls a factory function to supply missing values.',
    insertText: 'defaultdict(${1:list})',
    isSnippet: true,
  },
  {
    label: 'Counter',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'collections.Counter(iterable)',
    documentation: 'Dict subclass for counting hashable objects in O(n) time.',
    insertText: 'Counter(${1:iterable})',
    isSnippet: true,
  },
  {
    label: 'deque',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'collections.deque(iterable=(), maxlen=None)',
    documentation: 'Double-ended queue with O(1) appends and pops from either side.',
    insertText: 'deque(${1:[]})',
    isSnippet: true,
  },
  {
    label: 'heappush',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'heapq.heappush(heap: list, item: Any) -> None',
    documentation: 'Push the value item onto the min-heap in O(log n) time.',
    insertText: 'heappush(${1:heap}, ${2:item})',
    isSnippet: true,
  },
  {
    label: 'heappop',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'heapq.heappop(heap: list) -> Any',
    documentation: 'Pop and return the smallest item from the min-heap in O(log n) time.',
    insertText: 'heappop(${1:heap})',
    isSnippet: true,
  },
  {
    label: 'heapify',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'heapq.heapify(x: list) -> None',
    documentation: 'Transform list x into a min-heap, in-place, in O(n) time.',
    insertText: 'heapify(${1:nums})',
    isSnippet: true,
  },
  {
    label: 'bisect_left',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'bisect.bisect_left(a, x, lo=0, hi=len(a)) -> int',
    documentation: 'Locate the leftmost insertion point for x in sorted list a in O(log n) time.',
    insertText: 'bisect_left(${1:arr}, ${2:target})',
    isSnippet: true,
  },
  {
    label: 'bisect_right',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'bisect.bisect_right(a, x, lo=0, hi=len(a)) -> int',
    documentation: 'Locate the rightmost insertion point for x in sorted list a in O(log n) time.',
    insertText: 'bisect_right(${1:arr}, ${2:target})',
    isSnippet: true,
  },
  {
    label: 'lru_cache',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: '@functools.lru_cache(maxsize=None)',
    documentation: 'Memoize a function for top-down dynamic programming.',
    insertText: '@lru_cache(None)',
  },
  {
    label: 'ListNode',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'class ListNode(val=0, next=None)',
    documentation: 'Singly-linked list node with .val and .next.',
    insertText: 'ListNode(${1:0})',
    isSnippet: true,
  },
  {
    label: 'TreeNode',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'class TreeNode(val=0, left=None, right=None)',
    documentation: 'Binary tree node with .val, .left, and .right.',
    insertText: 'TreeNode(${1:0})',
    isSnippet: true,
  },
]

const PYTHON_DOT_METHODS: PyCompletionItem[] = [
  { label: 'append', kind: monaco.languages.CompletionItemKind.Method, detail: 'list.append(item) -> None', documentation: 'Append object to the end of the list in amortized O(1).', insertText: 'append(${1:item})', isSnippet: true },
  { label: 'pop', kind: monaco.languages.CompletionItemKind.Method, detail: 'list.pop(index=-1) -> T', documentation: 'Remove and return item at index (default last) in O(1).', insertText: 'pop($0)', isSnippet: true },
  { label: 'popleft', kind: monaco.languages.CompletionItemKind.Method, detail: 'deque.popleft() -> T', documentation: 'Remove and return an element from the left side of the deque in O(1).', insertText: 'popleft()' },
  { label: 'appendleft', kind: monaco.languages.CompletionItemKind.Method, detail: 'deque.appendleft(x) -> None', documentation: 'Add x to the left side of the deque in O(1).', insertText: 'appendleft(${1:x})', isSnippet: true },
  { label: 'extend', kind: monaco.languages.CompletionItemKind.Method, detail: 'list.extend(iterable) -> None', documentation: 'Extend list by appending elements from the iterable.', insertText: 'extend(${1:iterable})', isSnippet: true },
  { label: 'sort', kind: monaco.languages.CompletionItemKind.Method, detail: 'list.sort(*, key=None, reverse=False) -> None', documentation: 'Sort the list in ascending order in-place (O(n log n)).', insertText: 'sort($0)', isSnippet: true },
  { label: 'reverse', kind: monaco.languages.CompletionItemKind.Method, detail: 'list.reverse() -> None', documentation: 'Reverse the elements of the list in-place.', insertText: 'reverse()' },
  { label: 'items', kind: monaco.languages.CompletionItemKind.Method, detail: 'dict.items() -> dict_items[K, V]', documentation: 'Return a set-like view of (key, value) pairs.', insertText: 'items()' },
  { label: 'keys', kind: monaco.languages.CompletionItemKind.Method, detail: 'dict.keys() -> dict_keys[K]', documentation: 'Return a set-like view of dictionary keys.', insertText: 'keys()' },
  { label: 'values', kind: monaco.languages.CompletionItemKind.Method, detail: 'dict.values() -> dict_values[V]', documentation: 'Return a view of dictionary values.', insertText: 'values()' },
  { label: 'get', kind: monaco.languages.CompletionItemKind.Method, detail: 'dict.get(key, default=None) -> V', documentation: 'Return the value for key if key is in the dictionary, else default.', insertText: 'get(${1:key}, ${2:0})', isSnippet: true },
  { label: 'add', kind: monaco.languages.CompletionItemKind.Method, detail: 'set.add(elem) -> None', documentation: 'Add an element to a set in O(1) average time.', insertText: 'add(${1:elem})', isSnippet: true },
  { label: 'discard', kind: monaco.languages.CompletionItemKind.Method, detail: 'set.discard(elem) -> None', documentation: 'Remove an element from a set if it is a member (no KeyError).', insertText: 'discard(${1:elem})', isSnippet: true },
  { label: 'split', kind: monaco.languages.CompletionItemKind.Method, detail: 'str.split(sep=None, maxsplit=-1) -> list[str]', documentation: 'Return a list of the words in the string.', insertText: 'split($0)', isSnippet: true },
  { label: 'join', kind: monaco.languages.CompletionItemKind.Method, detail: 'str.join(iterable) -> str', documentation: 'Concatenate any number of strings in O(n) time.', insertText: 'join(${1:iterable})', isSnippet: true },
  { label: 'isalnum', kind: monaco.languages.CompletionItemKind.Method, detail: 'str.isalnum() -> bool', documentation: 'Return True if the string is an alpha-numeric string.', insertText: 'isalnum()' },
  { label: 'isdigit', kind: monaco.languages.CompletionItemKind.Method, detail: 'str.isdigit() -> bool', documentation: 'Return True if the string is a digit string.', insertText: 'isdigit()' },
  { label: 'val', kind: monaco.languages.CompletionItemKind.Property, detail: 'int', documentation: 'Value stored in ListNode / TreeNode.', insertText: 'val' },
  { label: 'next', kind: monaco.languages.CompletionItemKind.Property, detail: 'Optional[ListNode]', documentation: 'Pointer to the next ListNode.', insertText: 'next' },
  { label: 'left', kind: monaco.languages.CompletionItemKind.Property, detail: 'Optional[TreeNode]', documentation: 'Left child TreeNode.', insertText: 'left' },
  { label: 'right', kind: monaco.languages.CompletionItemKind.Property, detail: 'Optional[TreeNode]', documentation: 'Right child TreeNode.', insertText: 'right' },
]

const PYTHON_SNIPPETS: PyCompletionItem[] = [
  {
    label: 'fori',
    kind: monaco.languages.CompletionItemKind.Snippet,
    detail: 'for i in range(n):',
    documentation: 'Indexed for loop over a range.',
    insertText: 'for ${1:i} in range(${2:len(nums)}):\n\t$0',
    isSnippet: true,
  },
  {
    label: 'fore',
    kind: monaco.languages.CompletionItemKind.Snippet,
    detail: 'for i, val in enumerate(arr):',
    documentation: 'Enumerate loop yielding index and value.',
    insertText: 'for ${1:i}, ${2:val} in enumerate(${3:nums}):\n\t$0',
    isSnippet: true,
  },
  {
    label: 'bsearch',
    kind: monaco.languages.CompletionItemKind.Snippet,
    detail: 'Binary Search template',
    documentation: 'Standard O(log n) binary search loop.',
    insertText: [
      'left, right = 0, len(${1:nums}) - 1',
      'while left <= right:',
      '\tmid = (left + right) // 2',
      '\tif ${1:nums}[mid] == ${2:target}:',
      '\t\treturn mid',
      '\telif ${1:nums}[mid] < ${2:target}:',
      '\t\tleft = mid + 1',
      '\telse:',
      '\t\tright = mid - 1',
      '$0',
    ].join('\n'),
    isSnippet: true,
  },
  {
    label: 'bfs',
    kind: monaco.languages.CompletionItemKind.Snippet,
    detail: 'BFS with collections.deque',
    documentation: 'Breadth-First Search level-order traversal.',
    insertText: [
      'queue = deque([${1:root}])',
      'while queue:',
      '\tfor _ in range(len(queue)):',
      '\t\tnode = queue.popleft()',
      '\t\t$0',
    ].join('\n'),
    isSnippet: true,
  },
  {
    label: 'dfs',
    kind: monaco.languages.CompletionItemKind.Snippet,
    detail: 'Recursive DFS helper',
    documentation: 'Nested recursive Depth-First Search function.',
    insertText: [
      'def dfs(${1:node}: Optional[TreeNode]) -> ${2:int}:',
      '\tif not ${1:node}:',
      '\t\treturn ${3:0}',
      '\t$0',
      '\treturn ${3:0}',
    ].join('\n'),
    isSnippet: true,
  },
]

let isPythonConfigured = false

export function setupMonacoPython(): void {
  if (isPythonConfigured) return
  isPythonConfigured = true

  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.'],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range: monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const linePrefix = model
        .getLineContent(position.lineNumber)
        .slice(0, position.column - 1)
      const isDotAccess = linePrefix.trimEnd().endsWith('.')

      if (isDotAccess) {
        return {
          suggestions: PYTHON_DOT_METHODS.map((item) => ({
            label: item.label,
            kind: item.kind,
            detail: item.detail,
            documentation: { value: item.documentation },
            insertText: item.insertText,
            insertTextRules: item.isSnippet
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
            range,
          })),
        }
      }

      const suggestions: monaco.languages.CompletionItem[] = [
        ...PYTHON_KEYWORDS.map((kw) => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        })),
        ...PYTHON_BUILTINS_AND_STDLIB.map((item) => ({
          label: item.label,
          kind: item.kind,
          detail: item.detail,
          documentation: { value: item.documentation },
          insertText: item.insertText,
          insertTextRules: item.isSnippet
            ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            : undefined,
          range,
        })),
        ...PYTHON_SNIPPETS.map((item) => ({
          label: item.label,
          kind: item.kind,
          detail: item.detail,
          documentation: { value: item.documentation },
          insertText: item.insertText,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        })),
      ]

      return { suggestions }
    },
  })

  monaco.languages.registerHoverProvider('python', {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position)
      if (!word) return null

      const allItems = [...PYTHON_BUILTINS_AND_STDLIB, ...PYTHON_DOT_METHODS]
      const match = allItems.find((item) => item.label === word.word)
      if (!match) return null

      return {
        range: new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents: [
          { value: '```python\n' + match.detail + '\n```' },
          { value: match.documentation },
        ],
      }
    },
  })
}

