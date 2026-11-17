import { ipcRenderer, contextBridge } from 'electron'
import {
  APP_MENU_CHANNELS,
  type AppMenuAction,
  type AppMenuBridge,
  type AppMenuState,
} from '../src/shared/types/appMenu.ts'
import {
  AI_CHANNELS,
  type AiBridge,
  type AiStreamEvent,
} from '../src/shared/types/ai.ts'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

const appMenuBridge: AppMenuBridge = {
  onAction(listener) {
    const handler = (_event: Electron.IpcRendererEvent, action: AppMenuAction) => {
      listener(action)
    }
    ipcRenderer.on(APP_MENU_CHANNELS.ACTION, handler)
    return () => {
      ipcRenderer.removeListener(APP_MENU_CHANNELS.ACTION, handler)
    }
  },
  syncState(state: Partial<AppMenuState>) {
    ipcRenderer.send(APP_MENU_CHANNELS.SYNC_STATE, state)
  },
}

contextBridge.exposeInMainWorld('appMenu', appMenuBridge)

const aiBridge: AiBridge = {
  getConfig: () => ipcRenderer.invoke(AI_CHANNELS.GET_CONFIG),
  saveConfig: (dto) => ipcRenderer.invoke(AI_CHANNELS.SAVE_CONFIG, dto),
  listModels: (dto) => ipcRenderer.invoke(AI_CHANNELS.LIST_MODELS, dto),
  testConnection: (dto) => ipcRenderer.invoke(AI_CHANNELS.TEST_CONNECTION, dto),
  runStudioTurn: (dto) => ipcRenderer.invoke(AI_CHANNELS.RUN_STUDIO_TURN, dto),
  abortRun: (runId) => ipcRenderer.invoke(AI_CHANNELS.ABORT_RUN, runId),
  onStreamEvent(listener) {
    const handler = (_event: Electron.IpcRendererEvent, streamEvent: AiStreamEvent) => {
      listener(streamEvent)
    }
    ipcRenderer.on(AI_CHANNELS.STREAM_EVENT, handler)
    return () => {
      ipcRenderer.removeListener(AI_CHANNELS.STREAM_EVENT, handler)
    }
  },
}

contextBridge.exposeInMainWorld('aiClient', aiBridge)
