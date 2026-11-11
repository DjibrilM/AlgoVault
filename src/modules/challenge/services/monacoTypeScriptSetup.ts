import * as monaco from 'monaco-editor'

const ALGO_AMBIENT_TYPES = `
/**
 * Standard Singly-Linked List Node used across algorithm challenges.
 */
declare class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null);
}

/**
 * Standard Binary Tree Node used across algorithm challenges.
 */
declare class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null);
}

/**
 * Graph / N-ary Tree / Random Pointer Node used across algorithm challenges.
 */
declare class _Node {
  val: number;
  neighbors: _Node[];
  children: _Node[];
  next: _Node | null;
  random: _Node | null;
  constructor(val?: number, neighbors?: _Node[]);
}

/**
 * Min-Priority Queue helper available in JavaScript/TypeScript environments.
 */
declare class MinPriorityQueue<T = number> {
  constructor(options?: { priority?: (el: T) => number });
  enqueue(element: T, priority?: number): this;
  dequeue(): { element: T; priority: number } | null;
  front(): { element: T; priority: number } | null;
  back(): { element: T; priority: number } | null;
  size(): number;
  isEmpty(): boolean;
  toArray(): Array<{ element: T; priority: number }>;
  clear(): void;
}

/**
 * Max-Priority Queue helper available in JavaScript/TypeScript environments.
 */
declare class MaxPriorityQueue<T = number> {
  constructor(options?: { priority?: (el: T) => number });
  enqueue(element: T, priority?: number): this;
  dequeue(): { element: T; priority: number } | null;
  front(): { element: T; priority: number } | null;
  back(): { element: T; priority: number } | null;
  size(): number;
  isEmpty(): boolean;
  toArray(): Array<{ element: T; priority: number }>;
  clear(): void;
}
`

interface TsSnippetDef {
  label: string
  detail: string
  documentation: string
  insertText: string
}

const TS_JS_SNIPPETS: TsSnippetDef[] = [
  {
    label: 'fori',
    detail: 'Indexed for loop',
    documentation: 'Standard indexed for loop over an array or length.',
    insertText: [
      'for (let ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {',
      '\t$0',
      '}',
    ].join('\n'),
  },
  {
    label: 'foro',
    detail: 'for..of loop',
    documentation: 'Iterate over iterable elements (Array, Set, Map, String).',
    insertText: [
      'for (const ${1:item} of ${2:items}) {',
      '\t$0',
      '}',
    ].join('\n'),
  },
  {
    label: 'bsearch',
    detail: 'Binary Search template',
    documentation: 'Standard O(log n) binary search on a sorted range [left, right].',
    insertText: [
      'let left = 0;',
      'let right = ${1:nums}.length - 1;',
      'while (left <= right) {',
      '\tconst mid = left + ((right - left) >> 1);',
      '\tif (${1:nums}[mid] === ${2:target}) {',
      '\t\treturn mid;',
      '\t} else if (${1:nums}[mid] < ${2:target}) {',
      '\t\tleft = mid + 1;',
      '\t} else {',
      '\t\tright = mid - 1;',
      '\t}',
      '}',
      '$0',
    ].join('\n'),
  },
  {
    label: 'bfs',
    detail: 'Breadth-First Search (BFS) template',
    documentation: 'Level-order BFS traversal using a queue.',
    insertText: [
      'const queue: ${1:TreeNode}[] = [${2:root}];',
      'while (queue.length > 0) {',
      '\tconst levelSize = queue.length;',
      '\tfor (let i = 0; i < levelSize; i++) {',
      '\t\tconst node = queue.shift()!;',
      '\t\t$0',
      '\t}',
      '}',
    ].join('\n'),
  },
  {
    label: 'dfs',
    detail: 'Depth-First Search (DFS) helper',
    documentation: 'Recursive DFS helper function.',
    insertText: [
      'const dfs = (${1:node}: ${2:TreeNode | null}): ${3:number} => {',
      '\tif (!${1:node}) return ${4:0};',
      '\t$0',
      '\treturn ${4:0};',
      '};',
    ].join('\n'),
  },
  {
    label: 'unionfind',
    detail: 'Disjoint Set / Union-Find with path compression & rank',
    documentation: 'Near O(1) amortized union and find operations.',
    insertText: [
      'const parent = Array.from({ length: ${1:n} }, (_, i) => i);',
      'const rank = new Array(${1:n}).fill(0);',
      '',
      'const find = (x: number): number => {',
      '\tif (parent[x] !== x) parent[x] = find(parent[x]);',
      '\treturn parent[x];',
      '};',
      '',
      'const union = (a: number, b: number): boolean => {',
      '\tconst rootA = find(a);',
      '\tconst rootB = find(b);',
      '\tif (rootA === rootB) return false;',
      '\tif (rank[rootA] < rank[rootB]) parent[rootA] = rootB;',
      '\telse if (rank[rootA] > rank[rootB]) parent[rootB] = rootA;',
      '\telse {',
      '\t\tparent[rootB] = rootA;',
      '\t\trank[rootA]++;',
      '\t}',
      '\treturn true;',
      '};',
    ].join('\n'),
  },
]

let isTsConfigured = false

export function setupMonacoTypeScript(): void {
  if (isTsConfigured) return
  isTsConfigured = true

  const ts = monaco.typescript
  if (!ts) return

  const compilerOptions: monaco.typescript.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    strict: true,
    noImplicitAny: false,
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: true,
    noEmit: true,
    esModuleInterop: true,
  }

  ts.typescriptDefaults.setEagerModelSync(true)
  ts.javascriptDefaults.setEagerModelSync(true)

  ts.typescriptDefaults.setCompilerOptions(compilerOptions)
  ts.javascriptDefaults.setCompilerOptions(compilerOptions)

  ts.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: false,
    onlyVisible: false,
  })
  ts.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: false,
    onlyVisible: false,
  })

  ts.typescriptDefaults.setInlayHintsOptions({
    includeInlayParameterNameHints: 'literals',
    includeInlayFunctionLikeReturnTypeHints: true,
  })
  ts.javascriptDefaults.setInlayHintsOptions({
    includeInlayParameterNameHints: 'literals',
    includeInlayFunctionLikeReturnTypeHints: true,
  })

  ts.typescriptDefaults.addExtraLib(
    ALGO_AMBIENT_TYPES,
    'ts:filename/algovault-globals.d.ts'
  )
  ts.javascriptDefaults.addExtraLib(
    ALGO_AMBIENT_TYPES,
    'ts:filename/algovault-globals.d.ts'
  )

  for (const lang of ['typescript', 'javascript'] as const) {
    monaco.languages.registerCompletionItemProvider(lang, {
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position)
        const range: monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        const suggestions: monaco.languages.CompletionItem[] =
          TS_JS_SNIPPETS.map((snippet) => ({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: snippet.detail,
            documentation: { value: snippet.documentation },
            insertText: snippet.insertText,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          }))

        return { suggestions }
      },
    })
  }
}

