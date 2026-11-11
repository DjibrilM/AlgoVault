import * as monaco from 'monaco-editor'

const DIAGNOSTICS_OWNER_PYTHON = 'algovault-python-diagnostics'
const DIAGNOSTICS_OWNER_CPP = 'algovault-cpp-diagnostics'

interface BracketEntry {
  char: '(' | '[' | '{'
  lineNumber: number
  column: number
}

const MATCHING_OPEN: Record<string, '(' | '[' | '{'> = {
  ')': '(',
  ']': '[',
  '}': '{',
}

const MATCHING_CLOSE: Record<'(' | '[' | '{', string> = {
  '(': ')',
  '[': ']',
  '{': '}',
}

/**
 * Strips comments and string literals from a single line while preserving column positions
 * (replacing characters inside strings/comments with spaces), and reports any unterminated
 * single-line string literal.
 */
function sanitizeLineAndCheckStrings(
  line: string,
  lineNumber: number,
  commentStart: string,
  markers: monaco.editor.IMarkerData[]
): string {
  const chars = line.split('')
  let inSingle = false
  let inDouble = false
  let quoteStartCol = 1

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    const next = chars[i + 1]

    if (!inSingle && !inDouble) {
      if (commentStart === '#' && ch === '#') {
        for (let j = i; j < chars.length; j++) chars[j] = ' '
        break
      }
      if (commentStart === '//' && ch === '/' && next === '/') {
        for (let j = i; j < chars.length; j++) chars[j] = ' '
        break
      }
      if (ch === "'") {
        // Ignore Python triple quotes for single-line check
        if (commentStart === '#' && next === "'" && chars[i + 2] === "'") {
          for (let j = i; j < chars.length; j++) chars[j] = ' '
          break
        }
        inSingle = true
        quoteStartCol = i + 1
        chars[i] = ' '
      } else if (ch === '"') {
        if (commentStart === '#' && next === '"' && chars[i + 2] === '"') {
          for (let j = i; j < chars.length; j++) chars[j] = ' '
          break
        }
        inDouble = true
        quoteStartCol = i + 1
        chars[i] = ' '
      }
    } else if (inSingle) {
      if (ch === '\\') {
        chars[i] = ' '
        if (i + 1 < chars.length) {
          chars[i + 1] = ' '
          i++
        }
      } else if (ch === "'") {
        inSingle = false
        chars[i] = ' '
      } else {
        chars[i] = ' '
      }
    } else if (inDouble) {
      if (ch === '\\') {
        chars[i] = ' '
        if (i + 1 < chars.length) {
          chars[i + 1] = ' '
          i++
        }
      } else if (ch === '"') {
        inDouble = false
        chars[i] = ' '
      } else {
        chars[i] = ' '
      }
    }
  }

  if (inSingle || inDouble) {
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: 'SyntaxError: Unterminated string literal.',
      startLineNumber: lineNumber,
      startColumn: quoteStartCol,
      endLineNumber: lineNumber,
      endColumn: line.length + 1,
    })
  }

  return chars.join('')
}

function checkBracketBalance(
  sanitizedLines: string[],
  markers: monaco.editor.IMarkerData[]
): BracketEntry[] {
  const stack: BracketEntry[] = []

  for (let i = 0; i < sanitizedLines.length; i++) {
    const line = sanitizedLines[i]
    const lineNumber = i + 1

    for (let col = 0; col < line.length; col++) {
      const ch = line[col]
      if (ch === '(' || ch === '[' || ch === '{') {
        stack.push({ char: ch, lineNumber, column: col + 1 })
      } else if (ch === ')' || ch === ']' || ch === '}') {
        const expectedOpen = MATCHING_OPEN[ch]
        const top = stack[stack.length - 1]
        if (!top) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: `SyntaxError: Unmatched closing '${ch}'.`,
            startLineNumber: lineNumber,
            startColumn: col + 1,
            endLineNumber: lineNumber,
            endColumn: col + 2,
          })
        } else if (top.char !== expectedOpen) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: `SyntaxError: Closing '${ch}' does not match opening '${top.char}' on line ${top.lineNumber}.`,
            startLineNumber: lineNumber,
            startColumn: col + 1,
            endLineNumber: lineNumber,
            endColumn: col + 2,
          })
          stack.pop()
        } else {
          stack.pop()
        }
      }
    }
  }

  for (const unclosed of stack) {
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: `SyntaxError: '${unclosed.char}' was never closed (expected '${MATCHING_CLOSE[unclosed.char]}').`,
      startLineNumber: unclosed.lineNumber,
      startColumn: unclosed.column,
      endLineNumber: unclosed.lineNumber,
      endColumn: unclosed.column + 1,
    })
  }

  return stack
}

function validatePythonModel(model: monaco.editor.ITextModel): void {
  const markers: monaco.editor.IMarkerData[] = []
  const rawLines = model.getLinesContent()
  const sanitizedLines = rawLines.map((line, idx) =>
    sanitizeLineAndCheckStrings(line, idx + 1, '#', markers)
  )

  checkBracketBalance(sanitizedLines, markers)

  const blockHeaderRe =
    /^\s*(?:async\s+def|def|class|if|elif|else|for|while|try|except|finally|with)\b/

  let openParensDepth = 0

  for (let i = 0; i < sanitizedLines.length; i++) {
    const sanitized = sanitizedLines[i]
    const raw = rawLines[i]
    const lineNumber = i + 1
    const trimmed = sanitized.trim()

    const prevDepth = openParensDepth
    for (const ch of sanitized) {
      if (ch === '(' || ch === '[' || ch === '{') openParensDepth++
      else if (ch === ')' || ch === ']' || ch === '}')
        openParensDepth = Math.max(0, openParensDepth - 1)
    }

    if (!trimmed) continue

    // Check invalid JS/C-style operators in Python
    const invalidOpMatch = /(===|!==|&&|\|\|)/.exec(sanitized)
    if (invalidOpMatch && invalidOpMatch.index !== undefined) {
      const op = invalidOpMatch[1]
      const replacement =
        op === '===' ? '==' : op === '!==' ? '!=' : op === '&&' ? 'and' : 'or'
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: `SyntaxError: Invalid operator '${op}' in Python. Use '${replacement}' instead.`,
        startLineNumber: lineNumber,
        startColumn: invalidOpMatch.index + 1,
        endLineNumber: lineNumber,
        endColumn: invalidOpMatch.index + 1 + op.length,
      })
    }

    // Check missing colon on single-line compound statement headers
    if (
      prevDepth === 0 &&
      openParensDepth === 0 &&
      blockHeaderRe.test(sanitized) &&
      !trimmed.endsWith(':') &&
      !trimmed.endsWith('\\')
    ) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: "SyntaxError: Expected ':' at the end of compound statement.",
        startLineNumber: lineNumber,
        startColumn: Math.max(1, raw.trimEnd().length),
        endLineNumber: lineNumber,
        endColumn: raw.trimEnd().length + 1,
      })
    }
  }

  monaco.editor.setModelMarkers(model, DIAGNOSTICS_OWNER_PYTHON, markers)
}

function validateCppModel(model: monaco.editor.ITextModel): void {
  const markers: monaco.editor.IMarkerData[] = []
  const rawLines = model.getLinesContent()
  const sanitizedLines = rawLines.map((line, idx) =>
    sanitizeLineAndCheckStrings(line, idx + 1, '//', markers)
  )

  checkBracketBalance(sanitizedLines, markers)

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i]
    const sanitized = sanitizedLines[i]
    const lineNumber = i + 1

    // Check malformed #include directive
    const includeMatch = /^\s*#\s*include\s+(.+)$/.exec(raw)
    if (includeMatch) {
      const target = includeMatch[1].trim()
      if (
        !(target.startsWith('<') && target.endsWith('>')) &&
        !(target.startsWith('"') && target.endsWith('"'))
      ) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'error: #include expects "FILENAME" or <FILENAME>.',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: raw.length + 1,
        })
      }
    }

    // Check Python-style def inside C++
    const pyDefMatch = /^\s*(def|elif)\b/.exec(sanitized)
    if (pyDefMatch && pyDefMatch.index !== undefined) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: `error: Unknown type name '${pyDefMatch[1]}' in C++.`,
        startLineNumber: lineNumber,
        startColumn: pyDefMatch.index + 1,
        endLineNumber: lineNumber,
        endColumn: pyDefMatch.index + 1 + pyDefMatch[1].length,
      })
    }
  }

  monaco.editor.setModelMarkers(model, DIAGNOSTICS_OWNER_CPP, markers)
}

let isDiagnosticsConfigured = false

export function setupMonacoDiagnostics(): void {
  if (isDiagnosticsConfigured) return
  isDiagnosticsConfigured = true

  const timers = new Map<string, number>()

  const runValidation = (model: monaco.editor.ITextModel) => {
    if (model.isDisposed()) return
    const lang = model.getLanguageId()
    if (lang === 'python') {
      validatePythonModel(model)
    } else if (lang === 'cpp') {
      validateCppModel(model)
    } else {
      monaco.editor.setModelMarkers(model, DIAGNOSTICS_OWNER_PYTHON, [])
      monaco.editor.setModelMarkers(model, DIAGNOSTICS_OWNER_CPP, [])
    }
  }

  const scheduleValidation = (model: monaco.editor.ITextModel) => {
    const key = model.uri.toString()
    const existing = timers.get(key)
    if (existing !== undefined) window.clearTimeout(existing)
    const handle = window.setTimeout(() => {
      timers.delete(key)
      runValidation(model)
    }, 300)
    timers.set(key, handle)
  }

  const attachModel = (model: monaco.editor.ITextModel) => {
    runValidation(model)
    model.onDidChangeContent(() => scheduleValidation(model))
  }

  monaco.editor.onDidCreateModel(attachModel)
  monaco.editor.onDidChangeModelLanguage((e) => runValidation(e.model))
  monaco.editor.onWillDisposeModel((model) => {
    const key = model.uri.toString()
    const existing = timers.get(key)
    if (existing !== undefined) window.clearTimeout(existing)
    timers.delete(key)
  })

  for (const model of monaco.editor.getModels()) {
    attachModel(model)
  }
}

