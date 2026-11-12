/**
 * @file codeAbstractor.ts
 * @description Abstracts away standard I/O boilerplate (readFileSync, solve(), console.log)
 * at the rendering level before code reaches the UI editor, ensuring all challenges present
 * pure, return-based function signatures to the user.
 */

import type { SupportedLang } from '../types'

/**
 * Standard templates for Problem 100 (Sum of Two Numbers) across supported languages.
 */
const SUM_OF_TWO_NUMBERS_TEMPLATES: Record<string, string> = {
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
    int sum(int a, int b) {
        return a + b;
    }
};
`,
}

/**
 * Checks whether the code snippet contains legacy standard I/O boilerplate.
 */
export function containsLegacyIO(code: string): boolean {
  if (!code) return false
  return (
    code.includes('readFileSync') ||
    code.includes('process.stdin') ||
    code.includes("require('fs')") ||
    code.includes('require("fs")') ||
    /import\s+.*fs/i.test(code) ||
    /^\s*solve\(\)\s*;?/m.test(code) ||
    code.includes('sys.stdin') ||
    code.includes('cin >>') ||
    code.includes('cout <<')
  )
}

/**
 * Abstracts and sanitizes code at the rendering level before reaching the UI.
 *
 * Guarantees that:
 * 1. Standard I/O imports (`import { readFileSync } from 'node:fs';`) are completely stripped.
 * 2. Bottom function invocations (`solve();` or `main();`) are removed.
 * 3. Legacy competitive programming I/O loops are converted into pure return-based functions.
 * 4. `console.log(...)` output statements are replaced with `return ...;` statements.
 *
 * @param code Raw code from template, atom, or local storage.
 * @param lang Active language ('typescript' | 'javascript' | 'python' | 'cpp').
 * @returns Clean, pure return-based code string ready for the Monaco Editor.
 */
export function abstractUserFacingCode(code: string, lang: SupportedLang = 'typescript'): string {
  if (!code || typeof code !== 'string') return ''

  // 1. Detect if this is Problem 100 legacy boilerplate (or variant thereof)
  const isLegacyProblem100 =
    (code.includes('readFileSync') && (code.includes('a + b') || code.includes('solve'))) ||
    (code.includes('fs.readFileSync') && (code.includes('a + b') || code.includes('solve'))) ||
    (code.includes('sys.stdin') && code.includes('a + b')) ||
    (code.includes('cin >> a >> b') && code.includes('cout << a + b'))

  if (isLegacyProblem100) {
    return SUM_OF_TWO_NUMBERS_TEMPLATES[lang] || SUM_OF_TWO_NUMBERS_TEMPLATES.typescript
  }

  // 2. If code does not contain any legacy standard I/O, return as-is
  if (!containsLegacyIO(code)) {
    return code
  }

  let cleaned = code

  // Strip `import { readFileSync... } from '...';` or `import fs from '...';`
  cleaned = cleaned.replace(/import\s+\{[^}]*readFileSync[^}]*\}\s+from\s+['"][^'"]+['"];?\r?\n?/g, '')
  cleaned = cleaned.replace(/import\s+fs\s+from\s+['"][^'"]+['"];?\r?\n?/g, '')
  cleaned = cleaned.replace(/(const|let|var)\s+fs\s*=\s*require\(['"][^'"]+['"]\);?\r?\n?/g, '')
  cleaned = cleaned.replace(/import\s+sys\r?\n?/g, '')

  // Strip standard I/O reading lines:
  // e.g. const input = readFileSync(0, 'utf8').trim();
  cleaned = cleaned.replace(/(const|let|var)\s+input\s*=\s*(fs\.)?readFileSync\([^)]*\)\.trim\(\);?\r?\n?/g, '')
  cleaned = cleaned.replace(/if\s*\(!input\)\s*return;?\r?\n?/g, '')
  cleaned = cleaned.replace(/line\s*=\s*sys\.stdin\.read\(\)\.strip\(\)\r?\n?/g, '')
  cleaned = cleaned.replace(/if\s+not\s+line:\s*\r?\n?\s*return\r?\n?/g, '')

  // Strip trailing `solve();` or `main();`
  cleaned = cleaned.replace(/^\s*solve\(\)\s*;?\s*$/gm, '')
  cleaned = cleaned.replace(/^\s*main\(\)\s*;?\s*$/gm, '')
  cleaned = cleaned.replace(/if\s+__name__\s*==\s*["']__main__["']:\s*\r?\n?\s*main\(\)\s*$/gm, '')

  // Transform `console.log(expr)` inside solve/main to `return expr;`
  cleaned = cleaned.replace(/console\.log\(([^)]+)\);?/g, 'return $1;')
  cleaned = cleaned.replace(/print\(([^)]+)\)/g, 'return $1')

  // Transform `function solve(): void` to `function solve(): any`
  cleaned = cleaned.replace(/function\s+solve\(\):\s*void/g, 'function solve()')

  // Clean extra blank lines at beginning and end
  cleaned = cleaned.replace(/^\s*\n+/, '').replace(/\n{3,}/g, '\n\n').trim()

  return cleaned ? cleaned + '\n' : ''
}

