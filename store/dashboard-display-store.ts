import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DashboardDisplayMode } from '@/lib/dashboard/display-mode'

type DashboardDisplayStore = {
  mode: DashboardDisplayMode
  setMode: (mode: DashboardDisplayMode) => void
}

export const useDashboardDisplayStore = create<DashboardDisplayStore>()(
  persist(
    (set) => ({
      mode: 'dollars',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'dashboard-display-mode',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
