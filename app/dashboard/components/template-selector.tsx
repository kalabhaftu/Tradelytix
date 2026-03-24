'use client'

import { useState } from 'react'
import { useTemplates } from '@/context/template-provider'
import { useTemplateEditStore } from '@/store/template-edit-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LayoutGrid, Check, Plus, Pencil, Trash2, Copy, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function TemplateSelector() {
  const { templates, activeTemplate, switchTemplate, createTemplate, deleteTemplate, updateLayout } = useTemplates()
  const { isEditMode, enterEditMode } = useTemplateEditStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  // Clone/rename dialog state
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)
  const [cloneName, setCloneName] = useState('')

  const handleSwitch = async (templateId: string) => {
    if (templateId === activeTemplate?.id) return
    try {
      await switchTemplate(templateId)
    } catch (e) {
      // error toast handled in context
    }
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      const t = await createTemplate(name)
      await switchTemplate(t.id)
      setNewName('')
      setIsCreating(false)
    } catch (e) {
      // error toast handled in context
    }
  }

  /** Generate a unique template name — appends 1, 2, etc. if taken */
  const getUniqueName = (baseName: string): string => {
    const existingNames = new Set(templates.map(t => t.name.toLowerCase()))
    if (!existingNames.has(baseName.toLowerCase())) return baseName
    let counter = 1
    while (existingNames.has(`${baseName}${counter}`.toLowerCase())) counter++
    return `${baseName}${counter}`
  }

  /** Open clone dialog with suggested name */
  const openCloneDialog = () => {
    if (!activeTemplate) return
    const suggested = getUniqueName(`${activeTemplate.name} Copy`)
    setCloneName(suggested)
    setCloneDialogOpen(true)
  }

  /** Execute clone after user confirms name */
  const handleCloneConfirm = async () => {
    if (!activeTemplate || !cloneName.trim()) return
    const finalName = getUniqueName(cloneName.trim())
    try {
      const cloned = await createTemplate(finalName)
      await updateLayout(cloned.id, activeTemplate.layout)
      await switchTemplate(cloned.id)
      toast.success(`Template "${finalName}" created — you can now edit it`)
    } catch (e) {
      // error toast handled in context
    }
    setCloneDialogOpen(false)
    setCloneName('')
  }

  /** Open delete confirmation dialog */
  const handleDeleteClick = (templateId: string, name: string) => {
    setDeleteTarget({ id: templateId, name })
  }

  /** Execute delete after user confirms */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteTemplate(deleteTarget.id)
    } catch (e) {
      // error toast handled in context
    }
    setDeleteTarget(null)
  }

  const handleEdit = () => {
    if (!activeTemplate) return
    if (activeTemplate.isDefault) {
      toast.info('Default template is read-only. Clone it to edit.')
      openCloneDialog()
      return
    }
    enterEditMode(activeTemplate.layout)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-8 px-3 text-xs">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline truncate max-w-[100px]">
              {activeTemplate?.name || 'Templates'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Template list */}
          {templates.map(t => (
            <DropdownMenuItem
              key={t.id}
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => handleSwitch(t.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {t.isActive ? (
                  <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                ) : (
                  <div className="w-3.5" />
                )}
                <span className="truncate">{t.name}</span>
                {t.isDefault && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
              </div>
              {!t.isDefault && (
                <button
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive p-0.5"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteClick(t.id, t.name)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {/* Edit current (only non-default) */}
          {!isEditMode && activeTemplate && !activeTemplate.isDefault && (
            <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit Layout
            </DropdownMenuItem>
          )}

          {/* Clone default */}
          {activeTemplate?.isDefault && (
            <DropdownMenuItem onClick={openCloneDialog} className="cursor-pointer">
              <Copy className="h-3.5 w-3.5 mr-2" />
              Clone & Edit
            </DropdownMenuItem>
          )}

          {/* Create new (empty) */}
          {isCreating ? (
            <div className="p-2 flex items-center gap-2">
              <Input
                autoFocus
                placeholder="Template name"
                className="h-7 text-xs"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') setIsCreating(false)
                }}
              />
              <Button size="sm" className="h-7 px-2 text-xs" onClick={handleCreate}>
                Add
              </Button>
            </div>
          ) : (
            <DropdownMenuItem onClick={() => setIsCreating(true)} className="cursor-pointer">
              <Plus className="h-3.5 w-3.5 mr-2" />
              New Template
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clone Name Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clone Template</DialogTitle>
            <DialogDescription>
              Enter a name for the new template. If the name already exists, a unique suffix will be added.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Template name"
            value={cloneName}
            onChange={e => setCloneName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCloneConfirm()
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloneConfirm} disabled={!cloneName.trim()}>
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
