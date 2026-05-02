'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const SHORTCUTS_MODAL_EVENT = 'open-keyboard-shortcuts-modal'

interface ShortcutGroup {
  category: string
  shortcuts: { keys: string[]; description: string }[]
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl'

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: [mod, 'D'], description: 'Go to Dashboard' },
      { keys: [mod, 'A'], description: 'Go to Accounts' },
      { keys: [mod, 'S'], description: 'Go to Data / Import' },
      { keys: [mod, 'P'], description: 'Go to Prop Firm' },
      { keys: [mod, 'T'], description: 'Go to Settings' },
    ],
  },
  {
    category: 'Actions',
    shortcuts: [
      { keys: [mod, 'K'], description: 'Open Command Palette' },
      { keys: ['?'], description: 'Show this shortcuts panel' },
      { keys: [mod, 'R'], description: 'Refresh page' },
      { keys: ['⇧', mod, 'Q'], description: 'Log out' },
    ],
  },
]

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[11px] font-bold font-mono shadow-sm min-w-[22px]">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener(SHORTCUTS_MODAL_EVENT, handler)
    return () => window.removeEventListener(SHORTCUTS_MODAL_EVENT, handler)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-background border-border/40">
        <DialogHeader>
          <DialogTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
            Keyboard Shortcuts
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">
              {isMac ? 'macOS' : 'Windows / Linux'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category}>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
                {group.category}
              </p>
              <div className="space-y-1">
                {group.shortcuts.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">{s.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      {s.keys.map((k, ki) => (
                        <Key key={ki}>{k}</Key>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground/40 font-medium mt-2 text-center">
          Press <Key>?</Key> anywhere to open this panel
        </p>
      </DialogContent>
    </Dialog>
  )
}
