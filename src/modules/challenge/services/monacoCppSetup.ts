import * as monaco from 'monaco-editor'

interface CppCompletionItem {
  label: string
  kind: monaco.languages.CompletionItemKind
  detail: string
  documentation: string
  insertText: string
  isSnippet?: boolean
}

const CPP_KEYWORDS: string[] = [
  'auto', 'bool', 'break', 'case', 'char', 'class', 'const', 'constexpr',
  'continue', 'default', 'delete', 'do', 'double', 'else', 'enum', 'explicit',
  'false', 'float', 'for', 'friend', 'if', 'inline', 'int', 'long', 'mutable',
  'namespace', 'new', 'noexcept', 'nullptr', 'operator', 'private', 'protected',
  'public', 'return', 'short', 'signed', 'sizeof', 'static', 'static_cast',
  'struct', 'switch', 'template', 'this', 'true', 'typedef', 'typename',
  'unsigned', 'using', 'virtual', 'void', 'while',
]

const CPP_STL_TYPES_AND_FUNCTIONS: CppCompletionItem[] = [
  {
    label: 'vector',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'std::vector<T>',
    documentation: 'Dynamic contiguous array supporting O(1) random access and amortized O(1) push_back.',
    insertText: 'vector<${1:int}>',
    isSnippet: true,
  },
  {
    label: 'unordered_map',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'std::unordered_map<Key, T>',
    documentation: 'Hash table mapping keys to values in O(1) average time.',
    insertText: 'unordered_map<${1:int}, ${2:int}>',
    isSnippet: true,
  },
  {
    label: 'unordered_set',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'std::unordered_set<Key>',
    documentation: 'Hash set of unique keys with O(1) average lookup and insertion.',
    insertText: 'unordered_set<${1:int}>',
    isSnippet: true,
  },
  {
    label: 'map',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'std::map<Key, T>',
    documentation: 'Ordered red-black tree map with O(log n) lookup, insertion, and deletion.',
    insertText: 'map<${1:int}, ${2:int}>',
    isSnippet: true,
  },
  {
    label: 'set',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'std::set<Key>',
    documentation: 'Ordered red-black tree set of unique keys with O(log n) operations.',
    insertText: 'set<${1:int}>',
    isSnippet: true,
  },
  {
    label: 'priority_queue',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'std::priority_queue<T, Container, Compare>',
    documentation: 'Max-heap by default; pass greater<T> for a min-heap.',
    insertText: 'priority_queue<${1:int}>',
    isSnippet: true,
  },
  {
    label: 'queue',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'std::queue<T>',
    documentation: 'FIFO queue container adapter.',
    insertText: 'queue<${1:int}>',
    isSnippet: true,
  },
  {
    label: 'deque',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'std::deque<T>',
    documentation: 'Double-ended queue with O(1) insertion and removal at both ends.',
    insertText: 'deque<${1:int}>',
    isSnippet: true,
  },
  {
    label: 'stack',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'std::stack<T>',
    documentation: 'LIFO stack container adapter.',
    insertText: 'stack<${1:int}>',
    isSnippet: true,
  },
  {
    label: 'pair',
    kind: monaco.languages.CompletionItemKind.Struct,
    detail: 'std::pair<T1, T2>',
    documentation: '2-tuple holding .first and .second.',
    insertText: 'pair<${1:int}, ${2:int}>',
    isSnippet: true,
  },
  {
    label: 'string',
    kind: monaco.languages.CompletionItemKind.Class,
    detail: 'std::string',
    documentation: 'Standard mutable character sequence.',
    insertText: 'string',
  },
  {
    label: 'ListNode',
    kind: monaco.languages.CompletionItemKind.Struct,
    detail: 'struct ListNode { int val; ListNode *next; }',
    documentation: 'Singly-linked list node.',
    insertText: 'ListNode',
  },
  {
    label: 'TreeNode',
    kind: monaco.languages.CompletionItemKind.Struct,
    detail: 'struct TreeNode { int val; TreeNode *left; TreeNode *right; }',
    documentation: 'Binary tree node.',
    insertText: 'TreeNode',
  },
  {
    label: 'sort',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'std::sort(RandomIt first, RandomIt last[, Compare comp])',
    documentation: 'Sorts elements in range [first, last) in O(N log N) time.',
    insertText: 'sort(${1:v}.begin(), ${1:v}.end());',
    isSnippet: true,
  },
  {
    label: 'reverse',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'std::reverse(BidirIt first, BidirIt last)',
    documentation: 'Reverses the order of elements in range [first, last) in O(N) time.',
    insertText: 'reverse(${1:v}.begin(), ${1:v}.end());',
    isSnippet: true,
  },
  {
    label: 'lower_bound',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'std::lower_bound(ForwardIt first, ForwardIt last, const T& value)',
    documentation: 'Returns iterator to the first element >= value in O(log N) time.',
    insertText: 'lower_bound(${1:v}.begin(), ${1:v}.end(), ${2:target})',
    isSnippet: true,
  },
  {
    label: 'upper_bound',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'std::upper_bound(ForwardIt first, ForwardIt last, const T& value)',
    documentation: 'Returns iterator to the first element > value in O(log N) time.',
    insertText: 'upper_bound(${1:v}.begin(), ${1:v}.end(), ${2:target})',
    isSnippet: true,
  },
  {
    label: 'max',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'std::max(const T& a, const T& b) -> const T&',
    documentation: 'Returns the greater of the given values.',
    insertText: 'max(${1:a}, ${2:b})',
    isSnippet: true,
  },
  {
    label: 'min',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'std::min(const T& a, const T& b) -> const T&',
    documentation: 'Returns the smaller of the given values.',
    insertText: 'min(${1:a}, ${2:b})',
    isSnippet: true,
  },
  {
    label: 'accumulate',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'std::accumulate(InputIt first, InputIt last, T init)',
    documentation: 'Computes the sum of the given value init and the elements in [first, last).',
    insertText: 'accumulate(${1:v}.begin(), ${1:v}.end(), ${2:0})',
    isSnippet: true,
  },
  {
    label: 'swap',
    kind: monaco.languages.CompletionItemKind.Function,
    detail: 'std::swap(T& a, T& b) noexcept',
    documentation: 'Exchanges the given values in O(1).',
    insertText: 'swap(${1:a}, ${2:b});',
    isSnippet: true,
  },
  {
    label: 'INT_MAX',
    kind: monaco.languages.CompletionItemKind.Constant,
    detail: '#define INT_MAX 2147483647',
    documentation: 'Maximum value of a signed 32-bit int (2^31 - 1).',
    insertText: 'INT_MAX',
  },
  {
    label: 'INT_MIN',
    kind: monaco.languages.CompletionItemKind.Constant,
    detail: '#define INT_MIN (-2147483648)',
    documentation: 'Minimum value of a signed 32-bit int (-2^31).',
    insertText: 'INT_MIN',
  },
]

const CPP_MEMBER_METHODS: CppCompletionItem[] = [
  { label: 'push_back', kind: monaco.languages.CompletionItemKind.Method, detail: 'void push_back(const T& value)', documentation: 'Appends the given element to the end of the container in amortized O(1).', insertText: 'push_back(${1:val})', isSnippet: true },
  { label: 'emplace_back', kind: monaco.languages.CompletionItemKind.Method, detail: 'reference emplace_back(Args&&... args)', documentation: 'Constructs an element in-place at the end of the container.', insertText: 'emplace_back(${1:args})', isSnippet: true },
  { label: 'pop_back', kind: monaco.languages.CompletionItemKind.Method, detail: 'void pop_back()', documentation: 'Removes the last element of the container in O(1).', insertText: 'pop_back()' },
  { label: 'push', kind: monaco.languages.CompletionItemKind.Method, detail: 'void push(const T& value)', documentation: 'Inserts element into stack / queue / priority_queue.', insertText: 'push(${1:val})', isSnippet: true },
  { label: 'pop', kind: monaco.languages.CompletionItemKind.Method, detail: 'void pop()', documentation: 'Removes the top/front element from stack / queue / priority_queue.', insertText: 'pop()' },
  { label: 'top', kind: monaco.languages.CompletionItemKind.Method, detail: 'const T& top() const', documentation: 'Accesses the top element of stack or priority_queue.', insertText: 'top()' },
  { label: 'front', kind: monaco.languages.CompletionItemKind.Method, detail: 'reference front()', documentation: 'Accesses the first element of the container.', insertText: 'front()' },
  { label: 'back', kind: monaco.languages.CompletionItemKind.Method, detail: 'reference back()', documentation: 'Accesses the last element of the container.', insertText: 'back()' },
  { label: 'begin', kind: monaco.languages.CompletionItemKind.Method, detail: 'iterator begin() noexcept', documentation: 'Returns an iterator to the beginning.', insertText: 'begin()' },
  { label: 'end', kind: monaco.languages.CompletionItemKind.Method, detail: 'iterator end() noexcept', documentation: 'Returns an iterator to the end.', insertText: 'end()' },
  { label: 'size', kind: monaco.languages.CompletionItemKind.Method, detail: 'size_type size() const noexcept', documentation: 'Returns the number of elements in the container in O(1).', insertText: 'size()' },
  { label: 'empty', kind: monaco.languages.CompletionItemKind.Method, detail: 'bool empty() const noexcept', documentation: 'Checks whether the container is empty.', insertText: 'empty()' },
  { label: 'clear', kind: monaco.languages.CompletionItemKind.Method, detail: 'void clear() noexcept', documentation: 'Clears the contents of the container.', insertText: 'clear()' },
  { label: 'find', kind: monaco.languages.CompletionItemKind.Method, detail: 'iterator find(const Key& key)', documentation: 'Finds an element with key equivalent to key.', insertText: 'find(${1:key})', isSnippet: true },
  { label: 'count', kind: monaco.languages.CompletionItemKind.Method, detail: 'size_type count(const Key& key) const', documentation: 'Returns the number of elements matching specific key (0 or 1 for unique containers).', insertText: 'count(${1:key})', isSnippet: true },
  { label: 'insert', kind: monaco.languages.CompletionItemKind.Method, detail: 'pair<iterator, bool> insert(const value_type& value)', documentation: 'Inserts element(s) into the container.', insertText: 'insert(${1:val})', isSnippet: true },
  { label: 'erase', kind: monaco.languages.CompletionItemKind.Method, detail: 'size_type erase(const Key& key)', documentation: 'Erases elements from the container.', insertText: 'erase(${1:key})', isSnippet: true },
  { label: 'substr', kind: monaco.languages.CompletionItemKind.Method, detail: 'string substr(size_t pos = 0, size_t count = npos) const', documentation: 'Returns a substring [pos, pos + count).', insertText: 'substr(${1:pos}, ${2:len})', isSnippet: true },
  { label: 'first', kind: monaco.languages.CompletionItemKind.Property, detail: 'T1 first', documentation: 'First element of std::pair.', insertText: 'first' },
  { label: 'second', kind: monaco.languages.CompletionItemKind.Property, detail: 'T2 second', documentation: 'Second element of std::pair.', insertText: 'second' },
  { label: 'val', kind: monaco.languages.CompletionItemKind.Property, detail: 'int val', documentation: 'Node value in ListNode / TreeNode.', insertText: 'val' },
  { label: 'next', kind: monaco.languages.CompletionItemKind.Property, detail: 'ListNode* next', documentation: 'Next pointer in ListNode.', insertText: 'next' },
  { label: 'left', kind: monaco.languages.CompletionItemKind.Property, detail: 'TreeNode* left', documentation: 'Left child pointer in TreeNode.', insertText: 'left' },
  { label: 'right', kind: monaco.languages.CompletionItemKind.Property, detail: 'TreeNode* right', documentation: 'Right child pointer in TreeNode.', insertText: 'right' },
]

const CPP_SNIPPETS: CppCompletionItem[] = [
  {
    label: 'fori',
    kind: monaco.languages.CompletionItemKind.Snippet,
    detail: 'for (int i = 0; i < n; ++i)',
    documentation: 'Standard indexed C++ for loop.',
    insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t$0\n}',
    isSnippet: true,
  },
  {
    label: 'fore',
    kind: monaco.languages.CompletionItemKind.Snippet,
    detail: 'for (const auto& x : container)',
    documentation: 'Range-based C++ for loop.',
    insertText: 'for (const auto& ${1:x} : ${2:nums}) {\n\t$0\n}',
    isSnippet: true,
  },
  {
    label: 'minheap',
    kind: monaco.languages.CompletionItemKind.Snippet,
    detail: 'priority_queue<T, vector<T>, greater<T>>',
    documentation: 'Declaration for a C++ STL min-heap.',
    insertText: 'priority_queue<${1:int}, vector<${1:int}>, greater<${1:int}>> ${2:pq};',
    isSnippet: true,
  },
  {
    label: 'bsearch',
    kind: monaco.languages.CompletionItemKind.Snippet,
    detail: 'Binary Search template',
    documentation: 'Standard O(log n) binary search loop in C++.',
    insertText: [
      'int left = 0, right = static_cast<int>(${1:nums}.size()) - 1;',
      'while (left <= right) {',
      '\tint mid = left + (right - left) / 2;',
      '\tif (${1:nums}[mid] == ${2:target}) return mid;',
      '\tif (${1:nums}[mid] < ${2:target}) left = mid + 1;',
      '\telse right = mid - 1;',
      '}',
      '$0',
    ].join('\n'),
    isSnippet: true,
  },
]

let isCppConfigured = false

export function setupMonacoCpp(): void {
  if (isCppConfigured) return
  isCppConfigured = true

  monaco.languages.registerCompletionItemProvider('cpp', {
    triggerCharacters: ['.', '>'],
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
        .trimEnd()
      const isMemberAccess = linePrefix.endsWith('.') || linePrefix.endsWith('->')

      if (isMemberAccess) {
        return {
          suggestions: CPP_MEMBER_METHODS.map((item) => ({
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
        ...CPP_KEYWORDS.map((kw) => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        })),
        ...CPP_STL_TYPES_AND_FUNCTIONS.map((item) => ({
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
        ...CPP_SNIPPETS.map((item) => ({
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

  monaco.languages.registerHoverProvider('cpp', {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position)
      if (!word) return null

      const allItems = [...CPP_STL_TYPES_AND_FUNCTIONS, ...CPP_MEMBER_METHODS]
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
          { value: '```cpp\n' + match.detail + '\n```' },
          { value: match.documentation },
        ],
      }
    },
  })
}

