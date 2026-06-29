'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LexicalEditor } from '@/components/ui/editor/lexical-editor'
import { Spinner } from '@/components/ui/spinner'
import { Trash2, Save, Check } from 'lucide-react'
import { cn, cleanContent, formatNoteContent } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useData } from '@/context/data-provider'

interface TradeCommentProps {
  tradeIds: string[]
  comment: string | null
  onCommentChange?: (comment: string | null) => void
}

export function TradeComment({ tradeIds, comment: initialComment, onCommentChange }: TradeCommentProps) {
  const { updateTrades } = useData()
  const [localComment, setLocalComment] = useState(initialComment || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [open, setOpen] = useState(false)

  // Sync localComment with comment prop
  useEffect(() => {
    setLocalComment(initialComment || '')
  }, [initialComment])

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      // Update local state immediately
      const newComment = localComment || null

      // Update all trades in the list
      await updateTrades(tradeIds, { comment: newComment })

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 1000)
      setOpen(false)
    } catch (error) {
      // Revert local state on error
      setLocalComment(initialComment || '')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClear = async () => {
    setIsUpdating(true)
    try {
      // Update local state immediately
      setLocalComment("")

      // Update all trades in the list
      await updateTrades(tradeIds, { comment: null })

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 1000)
    } catch (error) {
      // Revert local state on error
      setLocalComment(initialComment || '')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="max-w-[200px]">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div>
            <Button
              variant="ghost"
              className={cn(
                "h-8 w-full justify-start px-2 gap-2 truncate",
                !localComment && "text-muted-foreground font-normal"
              )}
            >
              {localComment ? (
                <div className="truncate">
                  {cleanContent(formatNoteContent(localComment))}
                </div>
              ) : "Add comment"}
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(32rem,calc(100vw-1rem))] p-4"
          align="start"
          side="bottom"
          forceMount
          sideOffset={8}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Trade Comment</Label>
              {isUpdating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-3 w-3 text-primary" />
                  Saving...
                </div>
              )}
              {showSuccess && !isUpdating && (
                <div className="flex items-center gap-2 text-sm text-long animate-in fade-in zoom-in duration-300">
                  <Check className="h-3 w-3" />
                  Saved
                </div>
              )}
            </div>
            <div className="space-y-2">
              <LexicalEditor
                value={localComment}
                onChange={setLocalComment}
                placeholder="Add your trade analysis and reflections..."
                minHeight="300px"
              />
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdating || !localComment}
                onClick={handleClear}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Comment
              </Button>
              <Button
                size="sm"
                disabled={isUpdating}
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-2" />
                {"Save"}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
