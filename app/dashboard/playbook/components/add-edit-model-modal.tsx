'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LexicalEditor } from '@/components/ui/editor/lexical-editor'
import { Plus, X, AlertTriangle as Warning, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Rule {
  text: string
  category: 'entry' | 'exit' | 'risk' | 'general'
}

interface TradingModel {
  id: string
  name: string
  rules: (Rule | string)[]
  setups?: string[]
  notes?: string | null
  createdAt: string
  updatedAt: string
}

interface AddEditModelModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string; rules: Rule[]; setups?: string[]; notes?: string | null }) => Promise<void>
  model?: TradingModel | null
  mode: 'add' | 'edit'
}

export function AddEditModelModal({ isOpen, onClose, onSave, model, mode }: AddEditModelModalProps) {
  const [name, setName] = useState('')
  const [rules, setRules] = useState<Rule[]>([
    { text: '', category: 'entry' },
    { text: '', category: 'exit' },
    { text: '', category: 'risk' }
  ])
  const [setups, setSetups] = useState<string[]>([])
  const [newSetup, setNewSetup] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize form when model changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && model) {
        setName(model.name)
        // Handle migration from string[] to Rule[]
        const modelRules = Array.isArray(model.rules) ? model.rules : []
        const formattedRules = modelRules.map((r: any) => {
          if (typeof r === 'string') return { text: r, category: 'general' as const }
          return r as Rule
        })
        setRules(formattedRules.length > 0 ? [...formattedRules] : [
          { text: '', category: 'entry' },
          { text: '', category: 'exit' },
          { text: '', category: 'risk' }
        ])
        setSetups(Array.isArray(model.setups) ? [...model.setups] : [])
        setNotes(model.notes || '')
      } else {
        setName('')
        setRules([
          { text: '', category: 'entry' },
          { text: '', category: 'exit' },
          { text: '', category: 'risk' }
        ])
        setSetups([])
        setNewSetup('')
        setNotes('')
      }
      setHasChanges(false)
    }
  }, [isOpen, model, mode])

  // Track changes
  useEffect(() => {
    if (!isOpen) return

    if (mode === 'edit' && model) {
      const nameChanged = name !== model.name
      
      // Normalize both sides for comparison
      const currentRules = rules.filter(r => r.text.trim())
      const modelRules = (model.rules || []).map((r: any) => {
        if (typeof r === 'string') return { text: r, category: 'general' }
        return { text: r.text, category: r.category }
      })

      const rulesChanged = JSON.stringify(currentRules) !== JSON.stringify(modelRules)
      const notesChanged = notes !== (model.notes || '')
      setHasChanges(nameChanged || rulesChanged || notesChanged)
    } else {
      setHasChanges(name.trim() !== '' || rules.some(r => r.text.trim() !== '') || notes.trim() !== '')
    }
  }, [name, rules, notes, model, mode, isOpen])

  const handleAddRule = () => {
    setRules([...rules, { text: '', category: 'general' }])
  }

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const handleRuleChange = (index: number, field: keyof Rule, value: string) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], [field]: value }
    setRules(newRules)
  }

  const handleClose = () => {
    if (hasChanges) {
      setShowUnsavedWarning(true)
    } else {
      onClose()
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Model name is required')
      return
    }

    setIsSaving(true)
    try {
      const filteredRules = rules.filter(rule => rule.text.trim() !== '')
      await onSave({
        name: name.trim(),
        rules: filteredRules,
        setups: setups.filter(s => s.trim()),
        notes: notes.trim() || null,
      })
      toast.success(mode === 'add' ? 'Model created successfully' : 'Model updated successfully')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save model')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-background border-border/40">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-black tracking-tighter uppercase">
              {mode === 'add' ? 'INITIALIZE STRATEGY' : 'REFINE STRATEGY'}
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
              {mode === 'add'
                ? 'Building a systematic framework for risk and execution'
                : `Updating protocol: ${model?.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* Model Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                Strategy Designation <span className="text-destructive">*</span>
              </Label>
                <Input
                  id="name"
                  aria-label="Strategy Designation"
                  placeholder="e.g., HTF EQUILIBRIUM, SMART MONEY CONCEPTS"
                  className="font-bold tracking-tight h-11 bg-muted/10 border-border/40 focus:border-primary/50 transition-all uppercase"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                />
            </div>

            {/* Rules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Execution Protocol (Rules)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRule}
                  className="h-8 px-3 font-black uppercase tracking-tighter text-[10px]"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  Append Rule
                </Button>
              </div>
              <div className="space-y-3">
                {rules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Select value={rule.category} onValueChange={(v) => handleRuleChange(index, 'category', v as any)}>
                      <SelectTrigger className="h-10 w-[90px] shrink-0 text-[10px] font-black uppercase tracking-tighter border-border/40 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry" className="text-[10px] font-bold uppercase">Entry</SelectItem>
                        <SelectItem value="exit" className="text-[10px] font-bold uppercase">Exit</SelectItem>
                        <SelectItem value="risk" className="text-[10px] font-bold uppercase">Risk</SelectItem>
                        <SelectItem value="general" className="text-[10px] font-bold uppercase">Gen</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Define specific condition..."
                      className="font-medium text-sm h-10 bg-muted/10 border-border/40"
                      value={rule.text}
                      onChange={(e) => handleRuleChange(index, 'text', e.target.value)}
                      maxLength={100}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRule(index)}
                      className="h-10 w-10 shrink-0 opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/50 font-medium italic">
                Structured protocols ensure consistency. Define criteria for entry, exit, and risk management.
              </p>
            </div>

            {/* Setups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Trade Setups</Label>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/50 font-medium italic">
                Define specific setups within this strategy (e.g., &quot;A+ Breakout&quot;, &quot;Failed Reversal&quot;, &quot;Liquidity Grab&quot;). You can tag trades with these setups later.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g., A+ Breakout"
                  className="font-medium text-sm h-9 bg-muted/10 border-border/40"
                  value={newSetup}
                  onChange={(e) => setNewSetup(e.target.value)}
                  maxLength={50}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSetup.trim()) {
                      e.preventDefault()
                      if (!setups.includes(newSetup.trim())) {
                        setSetups([...setups, newSetup.trim()])
                      }
                      setNewSetup('')
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newSetup.trim() && !setups.includes(newSetup.trim())) {
                      setSetups([...setups, newSetup.trim()])
                      setNewSetup('')
                    }
                  }}
                  disabled={!newSetup.trim()}
                  className="h-9 px-3 font-black uppercase tracking-tighter text-[10px] shrink-0"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              {setups.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {setups.map((setup, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                      <span className="text-[11px] font-bold text-primary">{setup}</span>
                      <button
                        type="button"
                        onClick={() => setSetups(setups.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes (Optional)
              </Label>
              <LexicalEditor
                placeholder="Add any additional notes about this model..."
                value={notes}
                onChange={setNotes}
                minHeight="150px"
              />
              <p className="text-xs text-muted-foreground">
                {notes.length}/1000 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
              {isSaving ? 'Saving...' : mode === 'add' ? 'Create Model' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Warning className="h-5 w-5 text-warning" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedWarning(false)}>
              Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUnsavedWarning(false)
                onClose()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

