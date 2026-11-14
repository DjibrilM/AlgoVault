/**
 * @file test-code-test.ts
 * @description Unit/integration test verifying NestJS architecture, Dependency Injection, and lifecycle hooks.
 *
 * Run with:
 *   node electron/modules/code-test/scripts/test-code-test.ts
 */

import assert from 'node:assert'
import {
  CodeTestModule,
  CodeTestController,
  CODE_TEST_CHANNELS,
  type ICodeTestService,
  type RunCodeDto,
  type CodeTestResultDto,
  type VmStatusDto,
  type EvaluateCodeDto,
  type EvaluationResultDto,
} from '../index.ts'

console.log('Testing NestJS architecture for code-test module...\n')

// -------------------------------------------------------------------------- //
// 1. Mock IPC Implementation
// -------------------------------------------------------------------------- //

class MockIpcMain {
  handlers = new Map<string, (...args: any[]) => any>()

  handle(channel: string, listener: (...args: any[]) => any): void {
    if (this.handlers.has(channel)) {
      throw new Error(`Handler already registered for channel: ${channel}`)
    }
    this.handlers.set(channel, listener)
  }

  removeHandler(channel: string): void {
    this.handlers.delete(channel)
  }

  async invoke(channel: string, ...args: any[]): Promise<any> {
    const handler = this.handlers.get(channel)
    if (!handler) {
      throw new Error(`No handler registered for channel: ${channel}`)
    }
    return handler({} as any, ...args)
  }
}

// -------------------------------------------------------------------------- //
// 2. Mock Service Provider (for testing NestJS Dependency Injection)
// -------------------------------------------------------------------------- //

class MockCodeTestService implements ICodeTestService {
  calls: string[] = []
  mockVmRunning = false

  async evaluate(dto: EvaluateCodeDto): Promise<EvaluationResultDto> {
    this.calls.push(`evaluate:${dto.problemId}`)
    return {
      status: 'passed',
      verdict: 'Accepted',
      passedCases: 2,
      totalCases: 2,
      runtime: '5 ms',
      memory: '3.5 MB',
      timeMs: 5,
      memoryKb: 3500,
      output: 'Passed',
      testCases: [],
    }
  }

  async runCode(dto: RunCodeDto): Promise<CodeTestResultDto> {
    this.calls.push(`runCode:${dto.lang}`)
    return {
      success: true,
      compile: null,
      runs: [
        {
          exitCode: 0,
          signal: null,
          timedOut: false,
          stdout: 'mock-output\n',
          stderr: '',
          timeMs: 12,
          cpuMs: 8,
          memoryKb: 4096,
          outputTruncated: false,
        },
      ],
    }
  }

  async startVm(): Promise<VmStatusDto> {
    this.calls.push('startVm')
    this.mockVmRunning = true
    return { running: true, versions: { python: '3.12.0', test: 'mock' } }
  }

  async stopVm(): Promise<void> {
    this.calls.push('stopVm')
    this.mockVmRunning = false
  }

  setDataSource(): void {}

  async getWorkspaceData() {
    return { categories: [], challenges: [], submissions: [] }
  }

  async saveChallengeProgress() {
    return null
  }

  async createCategory() {
    return { category: null }
  }

  async getSubmissions() {
    return []
  }

  async getFavorites() {
    return []
  }

  async toggleFavorite() {
    return { favorited: true }
  }

  async getFactoryConversations() {
    return { items: [], page: 0, limit: 10, total: 0, hasMore: false }
  }

  async saveFactoryConversation() {
    return null
  }

  getStatus(): VmStatusDto {
    this.calls.push('getStatus')
    return { running: this.mockVmRunning, versions: { test: 'mock' } }
  }
}

// -------------------------------------------------------------------------- //
// 3. Tests
// -------------------------------------------------------------------------- //

async function runTests() {
  const mockIpc = new MockIpcMain()
  const mockService = new MockCodeTestService()

  console.log('1. Verifying NestJS Controller & Constructor Injection...')
  // Inject mockService into CodeTestController
  const controller = new CodeTestController(mockService)
  controller.registerIpc(mockIpc as any)

  assert.strictEqual(mockIpc.handlers.size, 13, 'Controller must register 13 IPC handlers')
  console.log('   ✔ 13 IPC routes registered via controller')

  // Test code-test:evaluate
  const evalRes: EvaluationResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.EVALUATE, {
    problemId: 100,
    code: 'print(42)',
    lang: 'python',
  })
  assert.strictEqual(evalRes.status, 'passed')
  assert.ok(mockService.calls.includes('evaluate:100'), 'Service.evaluate must be called')
  console.log('   ✔ code-test:evaluate routed to injected service')

  // Test code-test:get-status
  const status: VmStatusDto = await mockIpc.invoke(CODE_TEST_CHANNELS.GET_STATUS)
  assert.strictEqual(status.running, false)
  assert.ok(mockService.calls.includes('getStatus'), 'Service.getStatus must be called')
  console.log('   ✔ code-test:get-status routed to injected service')

  // Test code-test:start-vm
  const startRes: VmStatusDto = await mockIpc.invoke(CODE_TEST_CHANNELS.START_VM)
  assert.strictEqual(startRes.running, true)
  assert.ok(mockService.calls.includes('startVm'), 'Service.startVm must be called')
  console.log('   ✔ code-test:start-vm routed to injected service')

  // Test code-test:run
  const runDto: RunCodeDto = { lang: 'python', code: 'print("hello nestjs")' }
  const runRes: CodeTestResultDto = await mockIpc.invoke(CODE_TEST_CHANNELS.RUN, runDto)
  assert.strictEqual(runRes.success, true)
  assert.strictEqual(runRes.runs[0].stdout, 'mock-output\n')
  assert.ok(mockService.calls.includes('runCode:python'), 'Service.runCode must be called')
  console.log('   ✔ code-test:run routed with DTO to injected service')

  // Test code-test:stop-vm
  const stopRes = await mockIpc.invoke(CODE_TEST_CHANNELS.STOP_VM)
  assert.strictEqual(stopRes.success, true)
  assert.ok(mockService.calls.includes('stopVm'), 'Service.stopVm must be called')
  console.log('   ✔ code-test:stop-vm routed to injected service')

  // Test unregisterIpc
  controller.unregisterIpc(mockIpc as any)
  assert.strictEqual(mockIpc.handlers.size, 0, 'Handlers must be cleared upon unregister')
  console.log('   ✔ Controller unregisters handlers cleanly')

  console.log('\n2. Verifying NestJS CodeTestModule (forRoot, OnModuleInit, OnModuleDestroy)...')
  const moduleIpc = new MockIpcMain()
  const codeTestModule = CodeTestModule.forRoot({ ipcMain: moduleIpc as any })

  assert.ok(codeTestModule instanceof CodeTestModule, 'forRoot() must return CodeTestModule instance')
  assert.ok(codeTestModule.service, 'Module must hold injected Service provider')
  assert.ok(codeTestModule.controller, 'Module must hold Controller with injected Service')
  assert.strictEqual(moduleIpc.handlers.size, 13, 'OnModuleInit must automatically wire and register IPC routes')
  console.log('   ✔ CodeTestModule.forRoot() wired providers into controllers and invoked onModuleInit()')

  await codeTestModule.onModuleDestroy()
  assert.strictEqual(moduleIpc.handlers.size, 0, 'OnModuleDestroy must unregister handlers and clean up')
  console.log('   ✔ onModuleDestroy() cleaned up routes and destroyed providers')

  console.log('\nAll NestJS architecture tests passed successfully! 🚀')
}

runTests().catch((err) => {
  console.error('\nTest failed:', err)
  process.exit(1)
})
