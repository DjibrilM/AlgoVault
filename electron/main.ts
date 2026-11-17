import dotenv from 'dotenv'
import { app, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { MainModule } from './main.module.ts'
import { setupApplicationMenu } from './menu.ts'

dotenv.config({ quiet: true })

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null
let mainModule: MainModule | null = null
let appMenuController: ReturnType<typeof setupApplicationMenu> | null = null

app.setName('AlgoVault')

function resolveAppIconPath(): string {
  const candidates = [
    path.join(process.env.VITE_PUBLIC, 'icon.png'),
    path.join(process.env.APP_ROOT, 'build', 'icon.png'),
    path.join(process.env.APP_ROOT, 'public', 'icon.png'),
  ]
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]
}

function createWindow(): BrowserWindow {
  const iconPath = resolveAppIconPath()
  const nextWin = new BrowserWindow({
    title: 'AlgoVault',
    backgroundColor: '#141414',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 15 },
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })
  win = nextWin

  nextWin.on('closed', () => {
    if (win === nextWin) {
      win = null
    }
  })

  // Test active push message to Renderer-process.
  nextWin.webContents.on('did-finish-load', () => {
    nextWin.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    nextWin.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    nextWin.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  return nextWin
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', async () => {
  if (appMenuController) {
    appMenuController.dispose()
    appMenuController = null
  }
  if (mainModule) {
    await mainModule.onModuleDestroy()
    mainModule = null
  }
})

app.whenReady().then(async () => {
  const iconPath = resolveAppIconPath()

  app.setAboutPanelOptions({
    applicationName: 'AlgoVault',
    applicationVersion: app.getVersion(),
    credits: 'Offline algorithm practice and challenge generation studio.',
    iconPath,
  })

  if (process.platform === 'darwin' && app.dock) {
    const dockIcon = nativeImage.createFromPath(iconPath)
    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon)
    }
  }

  mainModule = await MainModule.bootstrap({ ipcMain })
  createWindow()

  appMenuController = setupApplicationMenu({
    getWindow: () => win,
    createWindow,
  })
})
