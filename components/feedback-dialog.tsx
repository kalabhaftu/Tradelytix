'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const MAX_FILES = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showDiscardAlert, setShowDiscardAlert] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasUnsavedChanges = category || subject.trim() || message.trim() || files.length > 0

  const handleClose = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges && !submitted) {
      setShowDiscardAlert(true)
      return
    }
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  const resetForm = () => {
    setCategory('')
    setSubject('')
    setMessage('')
    setFiles([])
    setSubmitted(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    const validFiles = newFiles.filter(f => {
      if (f.size > MAX_FILE_SIZE) { toast.error(`${f.name} exceeds 5MB`); return false }
      const ext = f.name.split('.').pop()?.toLowerCase()
      if (['exe', 'bat', 'sh', 'js', 'php', 'dll', 'cmd', 'ps1'].includes(ext || '')) {
        toast.error(`${f.name}: type not allowed`); return false
      }
      return true
    })
    setFiles(prev => [...prev, ...validFiles].slice(0, MAX_FILES))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !subject.trim() || !message.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('category', category)
      formData.append('subject', subject.trim())
      formData.append('message', message.trim())
      files.forEach(f => formData.append('files', f))

      const res = await fetch('/api/v1/feedback', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.success) {
        setSubmitted(true)
        toast.success('Feedback submitted!')
      } else {
        toast.error(data.error || 'Failed to submit')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDiscard = () => {
    setShowDiscardAlert(false)
    resetForm()
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{submitted ? 'Thank You!' : 'Send Feedback'}</DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-sm text-muted-foreground">Your feedback has been submitted successfully.</p>
              <Button className="mt-4" onClick={() => { resetForm(); onOpenChange(false) }}>Close</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Category <span className="text-destructive">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUG_REPORT">Bug Report</SelectItem>
                    <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Subject <span className="text-destructive">*</span></Label>
                <Input placeholder="Brief summary" value={subject} onChange={e => setSubject(e.target.value)} maxLength={200} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Message <span className="text-destructive">*</span></Label>
                <Textarea placeholder="Describe in detail..." value={message} onChange={e => setMessage(e.target.value)} rows={5} maxLength={5000} />
                <p className="text-[10px] text-muted-foreground text-right">{message.length}/5000</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Attachments <span className="text-muted-foreground">(optional)</span></Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                      <span className="truncate max-w-24">{f.name}</span>
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {files.length < MAX_FILES && (
                    <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-3 w-3 mr-1" />Attach
                    </Button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.csv,.txt" multiple />
              </div>

              <Button type="submit" className="w-full" disabled={submitting || !category || !subject.trim() || !message.trim()}>
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDiscardAlert} onOpenChange={setShowDiscardAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard feedback?</AlertDialogTitle>
            <AlertDialogDescription>You have unsaved changes. Are you sure you want to close without submitting?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
