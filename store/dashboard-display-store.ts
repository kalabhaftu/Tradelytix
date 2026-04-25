import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DashboardDisplayMode } from '@/lib/dashboard/display-mode'

export type WidgetSurfaceStyle = 'default' | 'glass'

type DashboardDisplayStore = {
  mode: DashboardDisplayMode
  setMode: (mode: DashboardDisplayMode) => void
  widgetStyle: WidgetSurfaceStyle
  setWidgetStyle: (style: WidgetSurfaceStyle) => void
}

export const useDashboardDisplayStore = create<DashboardDisplayStore>()(
  persist(
    (set) => ({
      mode: 'dollars',
      setMode: (mode) => set({ mode }),
      widgetStyle: 'default',
      setWidgetStyle: (widgetStyle) => set({ widgetStyle }),
    }),
    {
      name: 'dashboard-display-mode',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
