import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  isDark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggle: () => {
        const next = !get().isDark
        set({ isDark: next })
        document.documentElement.classList.toggle('dark', next)
      },
    }),
    { name: 'cssbuddy-theme' }
  )
)

export function applyStoredTheme() {
  const raw = localStorage.getItem('cssbuddy-theme')
  if (raw) {
    const parsed = JSON.parse(raw)
    if (parsed?.state?.isDark) document.documentElement.classList.add('dark')
  }
}
