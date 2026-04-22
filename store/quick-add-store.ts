import { create } from 'zustand'

type QuickAddStore = {
  isOpen: boolean
  openQuickAdd: () => void
  closeQuickAdd: () => void
  setQuickAddOpen: (open: boolean) => void
}

export const useQuickAddStore = create<QuickAddStore>()((set) => ({
  isOpen: false,
  openQuickAdd: () => set({ isOpen: true }),
  closeQuickAdd: () => set({ isOpen: false }),
  setQuickAddOpen: (open) => set({ isOpen: open }),
}))
