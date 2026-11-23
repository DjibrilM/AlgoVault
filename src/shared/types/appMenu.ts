export const APP_MENU_CHANNELS = {
  ACTION: 'app-menu:action',
  SYNC_STATE: 'app-menu:sync-state',
} as const

export type AppMenuAction =
  | 'new-questions-studio'
  | 'nav-home'
  | 'open-questions-factory'
  | 'open-marathons'
  | 'nav-favorites'
  | 'nav-todos'
  | 'open-settings'
  | 'nav-back'
  | 'nav-forward'
  | 'toggle-sidebar'
  | 'challenge-run'
  | 'challenge-submit'
  | 'challenge-prev'
  | 'challenge-next'

export interface AppMenuState {
  canGoBack: boolean
  canGoForward: boolean
  isSolvingChallenge: boolean
  canPrevChallenge: boolean
  canNextChallenge: boolean
  isRunning: boolean
}

export interface AppMenuBridge {
  onAction: (listener: (action: AppMenuAction) => void) => () => void
  syncState: (state: Partial<AppMenuState>) => void
}

