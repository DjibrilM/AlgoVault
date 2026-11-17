import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  shell,
  type IpcMainEvent,
  type MenuItemConstructorOptions,
  type MessageBoxOptions,
} from 'electron'
import {
  APP_MENU_CHANNELS,
  type AppMenuAction,
  type AppMenuState,
} from '../src/shared/types/appMenu.ts'

export interface ApplicationMenuOptions {
  getWindow: () => BrowserWindow | null
  createWindow: () => BrowserWindow
}

const INITIAL_MENU_STATE: AppMenuState = {
  canGoBack: false,
  canGoForward: false,
  isSolvingChallenge: false,
  canPrevChallenge: false,
  canNextChallenge: false,
  isRunning: false,
}

/**
 * Builds and registers AlgoVault's native OS application menu bar
 * (following Electron's Application Menu pattern with macOS-aware roles)
 * and keeps context-sensitive items synced with renderer navigation state.
 */
export function setupApplicationMenu(options: ApplicationMenuOptions) {
  const isMac = process.platform === 'darwin'
  let state: AppMenuState = { ...INITIAL_MENU_STATE }

  const showInfoDialog = (boxOptions: MessageBoxOptions) => {
    const win = options.getWindow()
    return win && !win.isDestroyed()
      ? dialog.showMessageBox(win, boxOptions)
      : dialog.showMessageBox(boxOptions)
  }

  const dispatchAction = (action: AppMenuAction) => {
    let win = options.getWindow()
    if (!win || win.isDestroyed()) {
      win = options.createWindow()
    }

    if (win.isMinimized()) {
      win.restore()
    }
    win.focus()

    const send = () => {
      if (win && !win.isDestroyed()) {
        win.webContents.send(APP_MENU_CHANNELS.ACTION, action)
      }
    }

    if (win.webContents.isLoadingMainFrame()) {
      win.webContents.once('did-finish-load', send)
    } else {
      send()
    }
  }

  const applyMenuState = (menu: Menu | null, nextState: AppMenuState) => {
    if (!menu) return

    const enabledById: Record<string, boolean> = {
      'nav-back': nextState.canGoBack,
      'nav-forward': nextState.canGoForward,
      'toggle-sidebar': nextState.isSolvingChallenge,
      'run-code': nextState.isSolvingChallenge && !nextState.isRunning,
      'submit-code': nextState.isSolvingChallenge && !nextState.isRunning,
      'prev-challenge': nextState.canPrevChallenge,
      'next-challenge': nextState.canNextChallenge,
    }

    for (const [id, enabled] of Object.entries(enabledById)) {
      const item = menu.getMenuItemById(id)
      if (item) {
        item.enabled = enabled
      }
    }
  }

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              {
                label: 'Settings…',
                accelerator: 'CommandOrControl+,',
                click: () => dispatchAction('open-settings'),
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ] satisfies MenuItemConstructorOptions[])
      : []),

    {
      label: 'File',
      submenu: [
        {
          label: 'New Questions Studio',
          accelerator: 'CommandOrControl+N',
          click: () => dispatchAction('new-questions-studio'),
        },
        ...(!isMac
          ? ([
              { type: 'separator' },
              {
                label: 'Settings…',
                accelerator: 'CommandOrControl+,',
                click: () => dispatchAction('open-settings'),
              },
            ] satisfies MenuItemConstructorOptions[])
          : []),
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },

    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? ([
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [
                  { role: 'startSpeaking' },
                  { role: 'stopSpeaking' },
                ],
              },
            ] satisfies MenuItemConstructorOptions[])
          : ([
              { role: 'delete' },
              { type: 'separator' },
              { role: 'selectAll' },
            ] satisfies MenuItemConstructorOptions[])),
      ],
    },

    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Home',
          accelerator: 'CommandOrControl+1',
          click: () => dispatchAction('nav-home'),
        },
        {
          label: 'Questions Factory',
          accelerator: 'CommandOrControl+2',
          click: () => dispatchAction('open-questions-factory'),
        },
        {
          label: 'All Marathons',
          accelerator: 'CommandOrControl+3',
          click: () => dispatchAction('open-marathons'),
        },
        {
          label: 'Favorites',
          accelerator: 'CommandOrControl+4',
          click: () => dispatchAction('nav-favorites'),
        },
        {
          label: 'To-dos',
          accelerator: 'CommandOrControl+5',
          click: () => dispatchAction('nav-todos'),
        },
        { type: 'separator' },
        {
          id: 'nav-back',
          label: 'Back',
          accelerator: isMac ? 'Command+[' : 'Alt+Left',
          enabled: false,
          click: () => dispatchAction('nav-back'),
        },
        {
          id: 'nav-forward',
          label: 'Forward',
          accelerator: isMac ? 'Command+]' : 'Alt+Right',
          enabled: false,
          click: () => dispatchAction('nav-forward'),
        },
      ],
    },

    {
      label: 'Challenge',
      submenu: [
        {
          id: 'run-code',
          label: 'Run Code',
          accelerator: 'CommandOrControl+Enter',
          enabled: false,
          click: () => dispatchAction('challenge-run'),
        },
        {
          id: 'submit-code',
          label: 'Submit Solution',
          accelerator: 'CommandOrControl+Shift+Enter',
          enabled: false,
          click: () => dispatchAction('challenge-submit'),
        },
        { type: 'separator' },
        {
          id: 'prev-challenge',
          label: 'Previous Challenge',
          accelerator: 'CommandOrControl+Alt+Left',
          enabled: false,
          click: () => dispatchAction('challenge-prev'),
        },
        {
          id: 'next-challenge',
          label: 'Next Challenge',
          accelerator: 'CommandOrControl+Alt+Right',
          enabled: false,
          click: () => dispatchAction('challenge-next'),
        },
      ],
    },

    {
      label: 'View',
      submenu: [
        {
          id: 'toggle-sidebar',
          label: 'Toggle Challenge Sidebar',
          accelerator: 'CommandOrControl+B',
          enabled: false,
          click: () => dispatchAction('toggle-sidebar'),
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? ([
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ] satisfies MenuItemConstructorOptions[])
          : ([{ role: 'close' }] satisfies MenuItemConstructorOptions[])),
      ],
    },

    {
      role: 'help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          click: async () => {
            const mod = isMac ? '⌘' : 'Ctrl+'
            const navBack = isMac ? '⌘[' : 'Alt+Left'
            const navForward = isMac ? '⌘]' : 'Alt+Right'
            const prevNext = isMac ? '⌥⌘← / ⌥⌘→' : 'Ctrl+Alt+Left / Right'
            const submit = isMac ? '⇧⌘↩' : 'Ctrl+Shift+Enter'
            const run = isMac ? '⌘↩' : 'Ctrl+Enter'

            await showInfoDialog({
              type: 'info',
              title: 'AlgoVault Keyboard Shortcuts',
              message: 'Keyboard Shortcuts',
              detail: [
                `${mod}N — New Questions Studio`,
                `${mod}, — Settings`,
                `${mod}1..5 — Home / Questions Factory / Marathons / Favorites / To-dos`,
                `${navBack} / ${navForward} — Navigate Back / Forward`,
                `${mod}B — Toggle Challenge Sidebar`,
                `${run} — Run Code`,
                `${submit} — Submit Solution`,
                `${prevNext} — Previous / Next Challenge`,
              ].join('\n'),
            })
          },
        },
        { type: 'separator' },
        {
          label: 'Electron Documentation',
          click: async () => {
            await shell.openExternal('https://www.electronjs.org')
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  applyMenuState(menu, state)

  const handleSyncState = (_event: IpcMainEvent, patch: Partial<AppMenuState>) => {
    if (!patch || typeof patch !== 'object') return
    state = { ...state, ...patch }
    applyMenuState(menu, state)
  }

  ipcMain.on(APP_MENU_CHANNELS.SYNC_STATE, handleSyncState)

  return {
    updateState(patch: Partial<AppMenuState>) {
      state = { ...state, ...patch }
      applyMenuState(menu, state)
    },
    dispose() {
      ipcMain.removeListener(APP_MENU_CHANNELS.SYNC_STATE, handleSyncState)
    },
  }
}

