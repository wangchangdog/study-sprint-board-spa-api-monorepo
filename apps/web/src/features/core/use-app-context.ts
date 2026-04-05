import { useContext } from 'react'

import { AppContext } from './app-context-shared'

export function useAppContext() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useAppContext は AppProvider の内側で使用してください。')
  }

  return context
}
