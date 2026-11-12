/**
 * @file test-judge-pipeline.ts
 * @description Verifies simplified request/response evaluation cycle in CodeTestService.
 *
 * The client sends only the challenge ID and code submission, and the backend service handles
 * the execution, output comparison, and telemetry.
 *
 * Run with:
 *   node electron/modules/code-test/scripts/test-judge-pipeline.ts
 */

import assert from 'node:assert'
import { EASY_PROBLEMS } from '../../../../src/shared/data/problems/easyProblems.ts'
import {
  CodeTestService,
  CodeTestController,
  CODE_TEST_CHANNELS,
  type EvaluateCodeDto,
  type EvaluationResultDto,
  type RunCodeDto,
  type CodeTestResultDto,
} from '../index.ts'

console.log('Testing Simplified Request/Response Challenge Evaluation Cycle...\n')

// -------------------------------------------------------------------------- //
// 1. Mock IPC Dispatcher
// -------------------------------------------------------------------------- //

class MockIpcMain {
  handlers = new Map<string, (...args: any[]) => any>()

  handle(channel: string, listener: (...args: any[]) => any): void {
    this.handlers.set(channel, listener)
  }

  removeHandler(channel: string): void {
    this.handlers.delete(channel)
  }

  async invoke(channel: string, ...args: any[]): Promise<any> {
    const handler = this.handlers.get(channel)
    if (!handler) throw new Error(`Channel not registered: ${channel}`)
    return handler({} as any, ...args)
  }
}

// -------------------------------------------------------------------------- //
// 2. Service Subclass overriding low-level SandboxVm execution for tests
// -------------------------------------------------------------------------- //

class MockCodeTestService extends CodeTestService {
  override async runCode(dto: RunCodeDto): Promise<CodeTestResultDto> {
    // Check for simulated compiler error in C++
    if (dto.lang === 'cpp' && dto.code.includes('error_variable')) {
      return {
        success: true,
        compile: {
          exitCode: 1,
          signal: null,
          timedOut: false,
          stdout: '',
          stderr: "error: 'error_variable' was not declared in this scope",
          timeMs: 120,
          cpuMs: 100,
          memoryKb: 45000,
          outputTruncated: false,
        },
        runs: [],
      }
    }

    // Check for simulated infinite loop
    if (dto.code.includes('while True: pass')) {
      return {
        success: true,
        compile: null,
        runs: (dto.tests || []).map(() => ({
          exitCode: null,
          signal: 'SIGKILL',
          timedOut: true,
          stdout: '',
          stderr: 'Time limit exceeded',
          timeMs: 5005,
          cpuMs: 5000,
          memoryKb: 12000,
          outputTruncated: false,
        })),
      }
    }

    // Check for flawed multiplication instead of addition
    if (dto.code.includes('a * b')) {
      return {
        success: true,
        compile: null,
        runs: (dto.tests || []).map((t) => {
          const nums = (t.stdin || '').match(/-?\d+/g)?.map(Number) || [0, 0]
          const a = nums[0] ?? 0
          const b = nums[1] ?? 0
          return {
            exitCode: 0,
            signal: null,
            timedOut: false,
            stdout: `${a * b}\n`,
            stderr: '',
            timeMs: 8,
            cpuMs: 5,
            memoryKb: 4000,
            outputTruncated: false,
          }
        }),
      }
    }

    // Normal correct A + B evaluation
    if (
      !dto.code.includes('multiply') &&
      !dto.code.includes('factorial') &&
      (dto.code.includes('sum-of-two-numbers') ||
        dto.code.includes('sum') ||
        (dto.tests && dto.tests.some(t => (t.stdin || '').includes('a = '))) ||
        (dto.tests && dto.tests.some(t => (t.stdin || '').trim().match(/^-?\d+\s+-?\d+$/))))
    ) {
      return {
        success: true,
        compile: null,
        runs: (dto.tests || []).map((t) => {
          const raw = (t.stdin || '').trim()
          let a = 0, b = 0
          const match = raw.match(/a\s*=\s*(-?\d+).*?b\s*=\s*(-?\d+)/)
          if (match) {
            a = Number(match[1])
            b = Number(match[2])
          } else {
            const parts = raw.split(/\s+/).map(Number)
            a = parts[0] ?? 0
            b = parts[1] ?? 0
          }
          return {
            exitCode: 0,
            signal: null,
            timedOut: false,
            stdout: `${a + b}\n`,
            stderr: '',
            timeMs: 6,
            cpuMs: 4,
            memoryKb: 3800,
            outputTruncated: false,
          }
        }),
      }
    }

    // Two Sum evaluation
    if (dto.code.includes('twoSum')) {
      const answers: Record<string, string> = {
        'nums = [2,7,11,15], target = 9': '[0, 1]',
        'nums = [3,2,4], target = 6': '[1, 2]',
        'nums = [3,3], target = 6': '[0, 1]',
        'nums = [-1,-2,-3,-4,-5], target = -8': '[2, 4]',
        'nums = [1000000000, 500000000, -500000000], target = 0': '[1, 2]',
      }
      return {
        success: true,
        compile: null,
        runs: (dto.tests || []).map((t) => {
          const raw = (t.stdin || '').trim()
          const expected = answers[raw] || '[0, 1]'
          return {
            exitCode: 0,
            signal: null,
            timedOut: false,
            stdout: `${expected}\n`,
            stderr: '',
            timeMs: 5,
            cpuMs: 3,
            memoryKb: 3500,
            outputTruncated: false,
          }
        }),
      }
    }

    // Multiplication evaluation
    if (dto.code.includes('multiply')) {
      const isWrong22 = dto.code.includes('return 22')
      return {
        success: true,
        compile: null,
        runs: (dto.tests || []).map((t) => {
          const raw = (t.stdin || '').trim()
          const nums = raw.match(/-?\d+/g)?.map(Number) || [0, 0]
          const a = nums[0] ?? 0
          const b = nums[1] ?? 0
          const out = isWrong22 ? 22 : a * b
          return {
            exitCode: 0,
            signal: null,
            timedOut: false,
            stdout: `${out}\n`,
            stderr: '',
            timeMs: 4,
            cpuMs: 2,
            memoryKb: 3200,
            outputTruncated: false,
          }
        }),
      }
    }

    // Factorial evaluation
    if (dto.code.includes('factorial')) {
      const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1))
      return {
        success: true,
        compile: null,
        runs: (dto.tests || []).map((t) => {
          const raw = (t.stdin || '').trim()
          const n = Number(raw.match(/\d+/)?.[0] ?? 0)
          return {
            exitCode: 0,
            signal: null,
            timedOut: false,
            stdout: `${fact(n)}\n`,
            stderr: '',
            timeMs: 4,
            cpuMs: 2,
            memoryKb: 3200,
            outputTruncated: false,
          }
        }),
      }
    }

    // Default fallback
    return {
      success: true,
      compile: null,
      runs: (dto.tests || []).map(() => ({
        exitCode: 0,
        signal: null,
        timedOut: false,
        stdout: '8\n',
        stderr: '',
        timeMs: 6,
        cpuMs: 4,
        memoryKb: 3800,
        outputTruncated: false,
      })),
    }
  }

  override async startVm() { return { running: true, versions: {} } }
  override async stopVm() {}
}

// -------------------------------------------------------------------------- //
// 3. Tests
// -------------------------------------------------------------------------- //

async function runTests() {
  const mockIpc = new MockIpcMain()
  const service = new MockCodeTestService()
  const controller = new CodeTestController(service)
  controller.registerIpc(mockIpc as any)

  const warmup = EASY_PROBLEMS.find((p) => p.id === 100)!
  assert.ok(warmup, 'Problem 100 (Sum of Two Numbers) must exist in catalog')

  console.log('1. Testing "Run Code" request (mode: "run")...')
  // Client only sends problemId, code, lang, and mode
  const runDto: EvaluateCodeDto = {
    problemId: 100,
    code: warmup.codeTemplates.python,
    lang: 'python',
    mode: 'run',
  }
  const runRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, runDto)

  assert.strictEqual(runRes.status, 'passed')
  assert.strictEqual(runRes.verdict, 'Accepted')
  assert.strictEqual(runRes.passedCases, 2)
  assert.strictEqual(runRes.totalCases, 2)
  assert.ok(runRes.runtime.endsWith('ms'))
  assert.ok(runRes.memory.endsWith('MB'))
  console.log(`   ✔ Status: ${runRes.status} (${runRes.verdict})`)
  console.log(`   ✔ Passed: ${runRes.passedCases}/${runRes.totalCases} visible test cases`)
  console.log(`   ✔ Resources: Time=${runRes.runtime}, Memory=${runRes.memory}`)

  console.log('\n2. Testing "Submit Code" request (mode: "submit")...')
  // Client only sends problemId, code, lang, and mode: 'submit'
  const submitDto: EvaluateCodeDto = {
    problemId: 100,
    code: warmup.codeTemplates.python,
    lang: 'python',
    mode: 'submit',
  }
  const submitRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, submitDto)

  assert.strictEqual(submitRes.status, 'passed')
  assert.strictEqual(submitRes.verdict, 'Accepted')
  assert.strictEqual(submitRes.passedCases, 6)
  assert.strictEqual(submitRes.totalCases, 6)
  console.log(`   ✔ Status: ${submitRes.status} (${submitRes.verdict})`)
  console.log(`   ✔ Passed: ${submitRes.passedCases}/${submitRes.totalCases} cases (including 4 hidden cases)`)

  console.log('\n3. Testing Failed Evaluation (Wrong Answer)...')
  const wrongDto: EvaluateCodeDto = {
    problemId: 100,
    code: 'a * b', // Flawed multiplication
    lang: 'python',
    mode: 'run',
  }
  const wrongRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, wrongDto)

  assert.strictEqual(wrongRes.status, 'failed')
  assert.strictEqual(wrongRes.verdict, 'Wrong Answer')
  assert.strictEqual(wrongRes.failedCase?.caseIndex, 1)
  assert.strictEqual(wrongRes.failedCase?.expected, '8')
  assert.strictEqual(wrongRes.failedCase?.actual, '15')
  console.log(`   ✔ Status: ${wrongRes.status} (${wrongRes.verdict})`)
  console.log(`   ✔ Detected failure on case #${wrongRes.failedCase?.caseIndex}: Expected "${wrongRes.failedCase?.expected}", got "${wrongRes.failedCase?.actual}"`)

  console.log('\n4. Testing Compile Error Evaluation...')
  const compileErrDto: EvaluateCodeDto = {
    problemId: 100,
    code: 'int main() { return error_variable; }',
    lang: 'cpp',
    mode: 'run',
  }
  const compileErrRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, compileErrDto)

  assert.strictEqual(compileErrRes.status, 'error')
  assert.strictEqual(compileErrRes.verdict, 'Compile Error')
  assert.ok(compileErrRes.compileError?.includes('error_variable'))
  console.log(`   ✔ Status: ${compileErrRes.status} (${compileErrRes.verdict})`)
  console.log(`   ✔ Compiler stderr captured properly`)

  console.log('\n5. Testing Time Limit Exceeded Evaluation...')
  const tleDto: EvaluateCodeDto = {
    problemId: 100,
    code: 'while True: pass',
    lang: 'python',
    mode: 'run',
  }
  const tleRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, tleDto)

  assert.strictEqual(tleRes.status, 'failed')
  assert.strictEqual(tleRes.verdict, 'Time Limit Exceeded')
  console.log(`   ✔ Status: ${tleRes.status} (${tleRes.verdict})`)

  console.log('\n6. Testing Pure LeetCode-style Function Submission (Problem 1: Two Sum)...')
  const twoSumPureCode = `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff)!, i];
    map.set(nums[i], i);
  }
  return [];
}`

  assert.ok(!twoSumPureCode.includes('readFileSync'), 'Pure function must NOT contain readFileSync')
  assert.ok(!twoSumPureCode.includes('process.stdin'), 'Pure function must NOT contain process.stdin')
  assert.ok(!twoSumPureCode.includes('console.log'), 'Pure function must NOT contain console.log')

  // Run mode (visible cases)
  const twoSumRunDto: EvaluateCodeDto = {
    problemId: 1,
    code: twoSumPureCode,
    lang: 'typescript',
    mode: 'run',
  }
  const twoSumRunRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, twoSumRunDto)
  assert.strictEqual(twoSumRunRes.status, 'passed')
  assert.strictEqual(twoSumRunRes.verdict, 'Accepted')
  assert.strictEqual(twoSumRunRes.passedCases, 2)
  console.log(`   ✔ Run Mode: Passed ${twoSumRunRes.passedCases}/${twoSumRunRes.totalCases} visible cases`)

  // Submit mode (all 5 cases including hidden cases)
  const twoSumSubmitDto: EvaluateCodeDto = {
    problemId: 1,
    code: twoSumPureCode,
    lang: 'typescript',
    mode: 'submit',
  }
  const twoSumSubmitRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, twoSumSubmitDto)
  assert.strictEqual(twoSumSubmitRes.status, 'passed')
  assert.strictEqual(twoSumSubmitRes.verdict, 'Accepted')
  assert.strictEqual(twoSumSubmitRes.passedCases, 5)
  assert.strictEqual(twoSumSubmitRes.totalCases, 5)
  console.log(`   ✔ Submit Mode: Passed all ${twoSumSubmitRes.passedCases}/${twoSumSubmitRes.totalCases} cases (including hidden edge cases)`)
  console.log(`   ✔ Babel successfully injected harness behind the scenes!`)

  console.log('\n7. Testing TypeScript Type Mismatch (return 9 on function returning number[])...')
  const badReturnCode = `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff)!, i];
    map.set(nums[i], i);
  }
  return 9;
}`

  const badTypeDto: EvaluateCodeDto = {
    problemId: 1,
    code: badReturnCode,
    lang: 'typescript',
    mode: 'run',
  }
  const badTypeRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, badTypeDto)
  assert.strictEqual(badTypeRes.status, 'error')
  assert.strictEqual(badTypeRes.verdict, 'Compile Error')
  assert.ok(badTypeRes.compileError?.includes("Type 'number' is not assignable to type 'number[]'"))
  console.log(`   ✔ Status: ${badTypeRes.status} (${badTypeRes.verdict})`)
  console.log(`   ✔ Caught expected Compile Error: ${badTypeRes.compileError?.trim()}`)

  console.log('\n8. Testing Basic Arithmetic Challenge (Problem 101: Multiply Two Numbers)...')
  const multCode = `function multiply(a: number, b: number): number {
  return a * b;
}`
  const multSubmitRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, {
    problemId: 101,
    code: multCode,
    lang: 'typescript',
    mode: 'submit',
  })
  assert.strictEqual(multSubmitRes.status, 'passed')
  assert.strictEqual(multSubmitRes.verdict, 'Accepted')
  assert.strictEqual(multSubmitRes.passedCases, 7)
  assert.strictEqual(multSubmitRes.totalCases, 7)
  console.log(`   ✔ Passed all ${multSubmitRes.passedCases}/${multSubmitRes.totalCases} test cases (visible & hidden)`)

  console.log('\n9. Testing Basic Arithmetic Challenge (Problem 102: Factorial of a Number)...')
  const factCode = `function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}`
  const factSubmitRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, {
    problemId: 102,
    code: factCode,
    lang: 'typescript',
    mode: 'submit',
  })
  assert.strictEqual(factSubmitRes.status, 'passed')
  assert.strictEqual(factSubmitRes.verdict, 'Accepted')
  assert.strictEqual(factSubmitRes.passedCases, 7)
  assert.strictEqual(factSubmitRes.totalCases, 7)
  console.log(`   ✔ Passed all ${factSubmitRes.passedCases}/${factSubmitRes.totalCases} test cases (visible & hidden)`)

  console.log('\n10. Testing Arithmetic Problem with Type Violation (return [22] on function returning number)...')
  const badMultArrayCode = `function multiply(a: number, b: number): number {
  return [22];
}`
  const badMultRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, {
    problemId: 101,
    code: badMultArrayCode,
    lang: 'typescript',
    mode: 'run',
  })
  assert.strictEqual(badMultRes.status, 'error')
  assert.strictEqual(badMultRes.verdict, 'Compile Error')
  assert.ok(badMultRes.compileError?.includes("Type 'array' is not assignable to type 'number'"))
  console.log(`   ✔ Status: ${badMultRes.status} (${badMultRes.verdict})`)
  console.log(`   ✔ Successfully caught Compile Error: ${badMultRes.compileError?.trim()}`)

  console.log('\n11. Testing Arithmetic Problem with Wrong Logic (return 22 instead of a * b)...')
  const wrongMultLogicCode = `function multiply(a: number, b: number): number {
  return 22;
}`
  const wrongLogicRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, {
    problemId: 101,
    code: wrongMultLogicCode,
    lang: 'typescript',
    mode: 'run',
  })
  assert.strictEqual(wrongLogicRes.status, 'failed')
  assert.strictEqual(wrongLogicRes.verdict, 'Wrong Answer')
  assert.strictEqual(wrongLogicRes.failedCase?.caseIndex, 1)
  assert.strictEqual(wrongLogicRes.failedCase?.expected, '12')
  assert.strictEqual(wrongLogicRes.failedCase?.actual, '22')
  console.log(`   ✔ Status: ${wrongLogicRes.status} (${wrongLogicRes.verdict})`)
  console.log(`   ✔ Detected failure on case #1: Expected "12", got "22"`)

  console.log('\n12. Testing C++ Pure Function Submission (class Solution with sum)...')
  const cppCode = `class Solution {
public:
    long long sum(long long a, long long b) {
        return a + b;
    }
};`
  const cppRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, {
    problemId: 100,
    code: cppCode,
    lang: 'cpp',
    mode: 'run',
  })
  assert.strictEqual(cppRes.status, 'passed')
  assert.strictEqual(cppRes.verdict, 'Accepted')
  assert.strictEqual(cppRes.passedCases, 2)
  console.log(`   ✔ Status: ${cppRes.status} (${cppRes.verdict})`)
  console.log(`   ✔ Passed: ${cppRes.passedCases}/${cppRes.totalCases} visible test cases in C++`)

  console.log('\n13. Testing C++ with unclosed class brace (auto-normalized)...')
  const unclosedCppCode = `class Solution {
public:
    long long sum(long long a, long long b) {
        return a + b;
    }`
  const unclosedRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, {
    problemId: 100,
    code: unclosedCppCode,
    lang: 'cpp',
    mode: 'run',
  })
  assert.strictEqual(unclosedRes.status, 'passed')
  assert.strictEqual(unclosedRes.verdict, 'Accepted')
  console.log(`   ✔ Status: ${unclosedRes.status} (${unclosedRes.verdict})`)
  console.log(`   ✔ Auto-normalized unclosed class Solution and executed successfully!`)

  controller.unregisterIpc(mockIpc as any)
  console.log('\nAll Simplified Request/Response cycle tests passed successfully! 🏆')
}

runTests().catch((err) => {
  console.error('\nTest failed:', err)
  process.exit(1)
})
