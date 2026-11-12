/**
 * @file babelInjector.ts
 * @description Injects standard I/O driver harnesses into pure LeetCode-style function submissions.
 *
 * Uses `@babel/parser` to inspect TypeScript/JavaScript ASTs, extract target function identifiers
 * and parameters, and append the necessary I/O driver harness before sending code to the backend.
 */

import { parse } from '@babel/parser'
import type { SupportedLang, Problem } from '../types/index.ts'

export interface FunctionMetadata {
  name: string
  params: string[]
  isClass?: boolean
  className?: string
}

/**
 * Checks if the source code already contains standard I/O operations.
 */
export function hasStandardIO(code: string, lang: SupportedLang): boolean {
  if (lang === 'typescript' || lang === 'javascript') {
    return (
      code.includes('readFileSync') ||
      code.includes('createInterface') ||
      code.includes('process.stdin') ||
      code.includes('fs.read') ||
      code.includes('readline')
    )
  }

  if (lang === 'python') {
    return code.includes('sys.stdin') || code.includes('input(') || code.includes('sys.argv')
  }

  if (lang === 'cpp') {
    return code.includes('int main') // If user already wrote int main(), it has standard I/O
  }

  return false
}

/**
 * Parses JavaScript/TypeScript code using `@babel/parser` and extracts target function metadata.
 */
export function extractFunctionMetadata(code: string): FunctionMetadata | null {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'classProperties', 'decorators-legacy'],
    })

    const getParamNames = (params: any[]): string[] => {
      return params.map((p) => {
        if (p.type === 'Identifier') return p.name
        if (p.type === 'AssignmentPattern' && p.left?.type === 'Identifier') return p.left.name
        if (p.type === 'RestElement' && p.argument?.type === 'Identifier') return p.argument.name
        return 'arg'
      })
    }

    // 1. Direct function declaration: `function twoSum(...)`
    for (const node of ast.program.body) {
      if (node.type === 'FunctionDeclaration' && node.id) {
        return {
          name: node.id.name,
          params: getParamNames(node.params),
        }
      }

      // 2. Exported function: `export function twoSum(...)`
      if (
        node.type === 'ExportNamedDeclaration' &&
        node.declaration?.type === 'FunctionDeclaration' &&
        node.declaration.id
      ) {
        return {
          name: node.declaration.id.name,
          params: getParamNames(node.declaration.params),
        }
      }

      // 3. Arrow function or function expression: `const twoSum = (...) => ...`
      if (node.type === 'VariableDeclaration') {
        for (const decl of node.declarations) {
          if (
            decl.id.type === 'Identifier' &&
            decl.init &&
            (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression')
          ) {
            return {
              name: decl.id.name,
              params: getParamNames(decl.init.params),
            }
          }
        }
      }

      // 4. Exported variable declaration
      if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration') {
        for (const decl of node.declaration.declarations) {
          if (
            decl.id.type === 'Identifier' &&
            decl.init &&
            (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression')
          ) {
            return {
              name: decl.id.name,
              params: getParamNames(decl.init.params),
            }
          }
        }
      }

      // 5. Class declaration: `class Solution { twoSum(...) { ... } }`
      if (node.type === 'ClassDeclaration') {
        const className = node.id?.name || 'Solution'
        for (const member of node.body.body) {
          if (member.type === 'ClassMethod' && member.key.type === 'Identifier') {
            return {
              name: member.key.name,
              params: getParamNames(member.params),
              isClass: true,
              className,
            }
          }
        }
      }
    }

    return null
  } catch {
    // If Babel parsing fails (e.g. syntax error in user code), return null
    return null
  }
}

/**
 * Extracts Python target function metadata via regex.
 */
export function extractPythonMetadata(code: string): FunctionMetadata | null {
  // Check for class Solution:
  const classMatch = code.match(/class\s+([A-Za-z_]\w*):[\s\S]*?def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/)
  if (classMatch) {
    const className = classMatch[1]
    const fnName = classMatch[2]
    const rawParams = classMatch[3]
      .split(',')
      .map((p) => p.trim().split(':')[0].split('=')[0].trim())
      .filter((p) => p && p !== 'self')
    return { name: fnName, params: rawParams, isClass: true, className }
  }

  // Check top-level function: def fn_name(a, b):
  const fnMatch = code.match(/def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/)
  if (fnMatch) {
    const fnName = fnMatch[1]
    const rawParams = fnMatch[2]
      .split(',')
      .map((p) => p.trim().split(':')[0].split('=')[0].trim())
      .filter(Boolean)
    return { name: fnName, params: rawParams }
  }

  return null
}

export interface CppFunctionMetadata extends FunctionMetadata {
  returnType: string
}

/**
 * Extracts C++ target function or class method metadata via regex.
 */
export function extractCppMetadata(code: string): CppFunctionMetadata | null {
  const isClass = code.includes('class ')
  const classMatch = code.match(/class\s+([A-Za-z_]\w*)/)
  const className = classMatch ? classMatch[1] : undefined

  const methodRegex = /(?:public:\s*)?([A-Za-z0-9_<>\s*&]+?)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/g
  let m: RegExpExecArray | null
  while ((m = methodRegex.exec(code)) !== null) {
    const rawRetType = m[1].trim().replace(/^(public|private|protected):\s*/, '').trim()
    const fnName = m[2].trim()
    const rawParams = m[3].trim()

    if (['if', 'while', 'for', 'switch', 'catch'].includes(fnName)) continue
    if (className && fnName === className) continue

    const params = rawParams
      ? rawParams.split(',').map((p) => {
          const parts = p.trim().split(/\s+/)
          return parts[parts.length - 1].replace(/[*&]/g, '')
        })
      : []

    return {
      name: fnName,
      params,
      isClass: Boolean(isClass && className),
      className,
      returnType: rawRetType,
    }
  }

  return null
}

/**
 * Normalizes C++ code by ensuring unclosed braces in class Solution are closed with semicolon.
 */
export function normalizeCppCode(code: string): string {
  let normalized = code
  if (normalized.includes('class Solution') || normalized.includes('class ')) {
    let openBraces = 0
    for (let i = 0; i < normalized.length; i++) {
      if (normalized[i] === '{') openBraces++
      else if (normalized[i] === '}') openBraces--
    }
    if (openBraces > 0) {
      normalized = normalized.trimEnd() + '\n};\n'.repeat(openBraces)
    } else if (!normalized.trim().endsWith(';')) {
      normalized = normalized.trimEnd() + ';\n'
    }
  }
  return normalized
}

/**
 * Injects driver harness into pure function user code before sending it to the backend.
 */
export function injectHarnessWithBabel(
  code: string,
  lang: SupportedLang,
  _problem?: Problem
): string {
  // If the user already wrote standard I/O (readFileSync, sys.stdin, cin), keep code unchanged
  if (hasStandardIO(code, lang)) {
    return code
  }

  // TypeScript / JavaScript injection via Babel AST
  if (lang === 'typescript' || lang === 'javascript') {
    const meta = extractFunctionMetadata(code)
    if (!meta) {
      return code
    }

    const paramCount = meta.params.length
    const paramList = meta.params.join(',')
    const targetCall = meta.isClass
      ? `new ${meta.className}()[${JSON.stringify(meta.name)}](...(__args as any))`
      : `(${meta.name} as any)(...(__args as any))`

    const harness = `
// --- Injected Driver Harness via Babel Parser ---
import { readFileSync as __rf } from 'node:fs';

try {
  const __raw = __rf(0, 'utf8').trim();
  if (__raw) {
    let __args: any[] = [];
    const __paramCount = ${paramCount};

    // 1. Direct JSON array or value
    try {
      const __parsed = JSON.parse(__raw);
      if (Array.isArray(__parsed) && __paramCount > 1 && __parsed.length === __paramCount) {
        __args = __parsed;
      } else if (__paramCount === 1) {
        __args = [__parsed];
      }
    } catch {}

    // 2. LeetCode assignments: e.g. "nums = [2,7,11,15], target = 9" or "x = 121"
    if (__args.length === 0) {
      try {
        const __fn = new Function('let ' + __raw + '; return [${paramList}];');
        const __res = __fn();
        if (Array.isArray(__res) && __res.length === __paramCount) {
          __args = __res;
        }
      } catch {}
    }

    // 3. Line-by-line JSON values
    if (__args.length === 0) {
      const __lines = __raw.split(/\\r?\\n/).map((l: string) => l.trim()).filter(Boolean);
      if (__lines.length === __paramCount) {
        try {
          __args = __lines.map((l: string) => JSON.parse(l));
        } catch {}
      }
    }

    // 4. Space-separated tokens (competitive programming format)
    if (__args.length === 0) {
      const __tokens = __raw.split(/\\s+/).map(Number);
      if (__tokens.length === __paramCount && __tokens.every((n: number) => !isNaN(n))) {
        __args = __tokens;
      } else if (__paramCount === 2 && __tokens.length >= 2 + (__tokens[0] || 0)) {
        const __n = __tokens[0];
        const __target = __tokens[1];
        const __nums = __tokens.slice(2, 2 + __n);
        __args = [__nums, __target];
      }
    }

    if (__args.length === 0) {
      __args = [__raw];
    }

    const __result = ${targetCall};
    if (typeof __result === 'boolean') {
      console.log(__result ? 'true' : 'false');
    } else if (typeof __result === 'object' && __result !== null) {
      console.log(JSON.stringify(__result));
    } else {
      console.log(__result);
    }
  }
} catch (err) {
  console.error(err);
  process.exit(1);
}
`

    return code + '\n' + harness
  }

  // Python injection
  if (lang === 'python') {
    const meta = extractPythonMetadata(code)
    if (!meta) {
      return code
    }

    const targetCall = meta.isClass
      ? `${meta.className}().${meta.name}(*_args)`
      : `${meta.name}(*_args)`

    const harness = `
# --- Injected Driver Harness ---
if __name__ == "__main__":
    import sys, json, re

    def __parse_args(raw, param_names):
        trimmed = raw.strip()
        if not trimmed:
            return []
        try:
            val = json.loads(trimmed)
            if isinstance(val, list) and len(param_names) > 1 and len(val) == len(param_names):
                return val
            if len(param_names) == 1:
                return [val]
        except Exception:
            pass
        try:
            py_code = re.sub(r',\\s*([a-zA-Z_]\\w*\\s*=)', r'\\n\\1', trimmed)
            loc = {}
            exec(py_code, {}, loc)
            if all(p in loc for p in param_names):
                return [loc[p] for p in param_names]
        except Exception:
            pass
        tokens = trimmed.split()
        if len(param_names) == 2 and len(tokens) >= 2:
            try:
                nums = [int(t) for t in tokens]
                n = nums[0]
                target = nums[1]
                arr = nums[2:2+n]
                return [arr, target]
            except Exception:
                pass
        if len(tokens) == len(param_names):
            try:
                return [int(t) for t in tokens]
            except Exception:
                pass
        return [trimmed]

    _raw = sys.stdin.read()
    _args = __parse_args(_raw, ${JSON.stringify(meta.params)})
    _res = ${targetCall}
    if isinstance(_res, bool):
        print("true" if _res else "false")
    elif isinstance(_res, (list, dict)):
        print(json.dumps(_res))
    else:
        print(_res)
`

    return code + '\n' + harness
  }

  // C++ injection
  if (lang === 'cpp') {
    const normalizedCode = normalizeCppCode(code)
    const meta = extractCppMetadata(normalizedCode)
    if (!meta) {
      return normalizedCode
    }

    const targetCall = meta.isClass
      ? `Solution().${meta.name}`
      : `${meta.name}`

    const includes = `
#ifndef ALGOVAULT_CPP_INCLUDES
#define ALGOVAULT_CPP_INCLUDES
#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <algorithm>
#include <sstream>
#include <cctype>
#include <cmath>

using namespace std;
#endif
`

    let invocation = ''
    if (meta.name === 'twoSum') {
      invocation = `
    vector<int> nums;
    int target = 0;
    size_t lbracket = raw.find('[');
    size_t rbracket = raw.find(']');
    if (lbracket != string::npos && rbracket != string::npos) {
        string arrStr = raw.substr(lbracket, rbracket - lbracket + 1);
        auto arrNums = __extract_all_numbers(arrStr);
        for (auto n : arrNums) nums.push_back((int)n);
        string rest = raw.substr(rbracket + 1);
        auto targetNums = __extract_all_numbers(rest);
        if (!targetNums.empty()) target = (int)targetNums[0];
    } else {
        auto allNums = __extract_all_numbers(raw);
        if (allNums.size() >= 2) {
            int n = (int)allNums[0];
            target = (int)allNums[1];
            for (size_t i = 2; i < 2 + n && i < allNums.size(); ++i) {
                nums.push_back((int)allNums[i]);
            }
        }
    }
    auto __res = ${targetCall}(nums, target);
    cout << "[" << (__res.size() > 0 ? __res[0] : 0) << ", " << (__res.size() > 1 ? __res[1] : 0) << "]\\n";
`
    } else if (meta.name === 'isValid' || meta.name === 'lengthOfLongestSubstring' || (meta.params.length === 1 && meta.returnType === 'bool')) {
      invocation = `
    string s = __extract_string_arg(raw);
    auto __res = ${targetCall}(s);
    cout << (__res ? "true" : "false") << "\\n";
`
    } else if (meta.params.length === 2) {
      invocation = `
    auto __nums = __extract_all_numbers(raw);
    long long a = __nums.size() > 0 ? __nums[0] : 0;
    long long b = __nums.size() > 1 ? __nums[1] : 0;
    auto __res = ${targetCall}(a, b);
    cout << __res << "\\n";
`
    } else if (meta.params.length === 1) {
      if (meta.returnType === 'bool') {
        invocation = `
    auto __nums = __extract_all_numbers(raw);
    long long x = __nums.size() > 0 ? __nums[0] : 0;
    auto __res = ${targetCall}(x);
    cout << (__res ? "true" : "false") << "\\n";
`
      } else {
        invocation = `
    auto __nums = __extract_all_numbers(raw);
    long long x = __nums.size() > 0 ? __nums[0] : 0;
    auto __res = ${targetCall}(x);
    cout << __res << "\\n";
`
      }
    } else {
      invocation = `
    auto __nums = __extract_all_numbers(raw);
    if (__nums.size() >= 2) {
        cout << ${targetCall}(__nums[0], __nums[1]) << "\\n";
    } else if (__nums.size() == 1) {
        cout << ${targetCall}(__nums[0]) << "\\n";
    }
`
    }

    const harness = `
// --- Injected Driver Harness for C++ ---
static vector<long long> __extract_all_numbers(const string& str) {
    vector<long long> res;
    size_t i = 0;
    while (i < str.size()) {
        if (str[i] == '-' || isdigit(str[i])) {
            if (str[i] == '-' && (i + 1 >= str.size() || !isdigit(str[i + 1]))) {
                i++;
                continue;
            }
            size_t start = i;
            if (str[i] == '-') i++;
            while (i < str.size() && isdigit(str[i])) i++;
            try {
                res.push_back(stoll(str.substr(start, i - start)));
            } catch (...) {}
        } else {
            i++;
        }
    }
    return res;
}

static string __extract_string_arg(const string& str) {
    size_t firstQuote = str.find('"');
    if (firstQuote != string::npos) {
        size_t secondQuote = str.find('"', firstQuote + 1);
        if (secondQuote != string::npos) {
            return str.substr(firstQuote + 1, secondQuote - firstQuote - 1);
        }
    }
    stringstream ss(str);
    string token;
    while (ss >> token) {
        if (token != "=" && token != "s" && token != "str") {
            return token;
        }
    }
    return str;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string raw, line;
    while (getline(cin, line)) {
        raw += line + " ";
    }
    if (raw.empty()) return 0;
${invocation}
    return 0;
}
`

    return includes + '\n' + normalizedCode + '\n' + harness
  }

  return code
}

