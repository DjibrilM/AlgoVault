/**
 * @file test-main-module.ts
 * @description Verifies MainModule composition root bootstrapping and lifecycle management.
 *
 * Run with:
 *   node electron/modules/code-test/scripts/test-main-module.ts
 */

import assert from 'node:assert'
import { MainModule } from '../../../main.module.ts'
import { CODE_TEST_CHANNELS } from '../index.ts'

console.log('Testing MainModule NestJS root composition container...\n')

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

async function runTests() {
  const mockIpc = new MockIpcMain()

  console.log('1. Testing MainModule.bootstrap()...')
  const appModule = await MainModule.bootstrap({ ipcMain: mockIpc as any })

  assert.ok(appModule instanceof MainModule, 'Must return MainModule instance')
  assert.ok(appModule.codeTestModule, 'MainModule must import and initialize CodeTestModule')
  assert.strictEqual(mockIpc.handlers.size, 5, 'All imported feature module IPC handlers must be registered')
  console.log('   ✔ MainModule.bootstrap() successfully initialized and registered feature modules')

  console.log('2. Testing IPC dispatch through MainModule...')
  const status = await mockIpc.invoke(CODE_TEST_CHANNELS.GET_STATUS)
  assert.strictEqual(status.running, false)
  console.log('   ✔ IPC channel routed successfully to CodeTestController')

  console.log('3. Testing MainModule.onModuleDestroy()...')
  await appModule.onModuleDestroy()
  assert.strictEqual(mockIpc.handlers.size, 0, 'onModuleDestroy must unregister all IPC handlers')
  console.log('   ✔ MainModule.onModuleDestroy() successfully tore down all modules')

  console.log('\nMainModule tests passed! 🎯')
}

runTests().catch((err) => {
  console.error('\nTest failed:', err)
  process.exit(1)
})

