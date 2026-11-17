import { useEffect, useRef } from 'react'
import type { AppMenuAction } from '../types/appMenu'

/**
 * Subscribes to native Electron application menu actions without re-binding on handler updates.
 */
export function useAppMenuAction(handler: (action: AppMenuAction) => void) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const bridge = typeof window !== 'undefined' ? window.appMenu : undefined
    if (!bridge) return

    return bridge.onAction((action) => {
      handlerRef.current(action)
    })
  }, [])
}

