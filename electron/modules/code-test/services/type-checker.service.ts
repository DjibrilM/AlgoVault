/**
 * @file type-checker.service.ts
 * @description NestJS-style Provider performing static TypeScript type analysis via Babel parser.
 *
 * Statically analyzes pure function submissions without bundling heavy compiler runtimes,
 * catching return type violations (e.g. `return 9;` on `: number[]`), syntax errors, and
 * invalid return statements to report authoritative Compile Error diagnostics with line numbers.
 */

import { parse } from '@babel/parser'

export interface ITypeCheckerService {
  checkTypeScript(code: string): string[]
}

/**
 * NestJS-style Injectable Provider for TypeScript static AST type checking.
 */
export class TypeCheckerService implements ITypeCheckerService {
  /**
   * Performs static type analysis on TypeScript source code.
   *
   * @param code Pure TypeScript code string to evaluate.
   * @returns Array of formatted compiler error messages (empty if valid).
   */
  checkTypeScript(code: string): string[] {
    let ast: any
    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'classProperties', 'decorators-legacy'],
      })
    } catch (err: any) {
      const line = err.loc?.line ?? 1
      const col = err.loc?.column ?? 1
      const cleanMsg = (err.message || String(err)).replace(/\s*\(\d+:\d+\)$/, '')
      return [`Line ${line}:${col}: SyntaxError: ${cleanMsg}`]
    }

    const errors: string[] = []

    const getDeclaredType = (ann: any): { key: string; display: string } | null => {
      if (!ann) return null
      const t = ann.type === 'TSTypeAnnotation' ? ann.typeAnnotation : ann
      if (t.type === 'TSArrayType') {
        const elem = t.elementType?.type === 'TSNumberKeyword' ? 'number[]' : 'any[]'
        return { key: 'array', display: elem }
      }
      if (t.type === 'TSBooleanKeyword') return { key: 'boolean', display: 'boolean' }
      if (t.type === 'TSNumberKeyword') return { key: 'number', display: 'number' }
      if (t.type === 'TSStringKeyword') return { key: 'string', display: 'string' }
      if (t.type === 'TSVoidKeyword') return { key: 'void', display: 'void' }
      return null
    }

    const getExpressionType = (expr: any): string | null => {
      if (!expr) return 'void'
      if (expr.type === 'ArrayExpression') return 'array'
      if (expr.type === 'NumericLiteral') return 'number'
      if (expr.type === 'StringLiteral') return 'string'
      if (expr.type === 'BooleanLiteral') return 'boolean'
      return null // Dynamic expression or identifier
    }

    for (const node of ast.program.body) {
      let fn: any = null
      if (node.type === 'FunctionDeclaration') {
        fn = node
      } else if (
        node.type === 'ExportNamedDeclaration' &&
        node.declaration?.type === 'FunctionDeclaration'
      ) {
        fn = node.declaration
      } else if (node.type === 'ClassDeclaration') {
        for (const member of node.body.body) {
          if (member.type === 'ClassMethod') {
            fn = member
            break
          }
        }
      }

      if (!fn) continue

      const declared = getDeclaredType(fn.returnType)
      if (!declared) continue

      // Find all return statements within this function scope (ignoring closures / inner functions)
      const returns: any[] = []
      const walk = (curr: any) => {
        if (!curr || typeof curr !== 'object') return
        if (
          curr !== fn &&
          (curr.type === 'FunctionDeclaration' ||
            curr.type === 'FunctionExpression' ||
            curr.type === 'ArrowFunctionExpression')
        ) {
          return // Do not descend into nested function scopes
        }
        if (curr.type === 'ReturnStatement') {
          returns.push(curr)
        }
        for (const k of Object.keys(curr)) {
          if (k === 'parent') continue
          const v = curr[k]
          if (Array.isArray(v)) v.forEach(walk)
          else if (v && typeof v === 'object' && v.type) walk(v)
        }
      }
      walk(fn.body)

      for (const ret of returns) {
        const line = ret.loc?.start?.line ?? 1
        const col = ret.loc?.start?.column ?? 1

        if (!ret.argument) {
          if (declared.key !== 'void') {
            errors.push(
              `Line ${line}:${col}: error TS2355: A function whose declared type is neither 'void' nor 'any' must return a value.`
            )
          }
          continue
        }

        const actualType = getExpressionType(ret.argument)
        if (actualType && actualType !== declared.key) {
          errors.push(
            `Line ${line}:${col}: error TS2322: Type '${actualType}' is not assignable to type '${declared.display}'.`
          )
        }
      }
    }

    return errors
  }
}
