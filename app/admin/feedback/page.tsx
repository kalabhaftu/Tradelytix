'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ChevronLeft, ChevronRight, MessageSquare, Trash2, Reply, Paperclip, Globe } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500/10 text-blue-500',
  IN_PROGRESS: 'bg-yellow-500/10 text-yellow-500',
  RESOLVED: 'bg-green-500/10 text-green-500',
  CLOSED: 'bg-muted text-muted-foreground',
}

const categoryLabels: Record<string, string> = {
  BUG_REPORT: 'Bug',
  FEATURE_REQUEST: 'Feature',
  GENERAL: 'General',
  OTHER: 'Other',
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [replyTarget, setReplyTarget] = useState<any>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)
  const limit = 20

  const fetchFeedback = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (categoryFilter !== 'all') params.set('category', categoryFilter)

    fetch(`/api/v1/admin/feedback?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setFeedback(data.data.feedback)
          setTotal(data.data.total)
        }
      })
      .finally(() => setLoading(false))
  }, [page, statusFilter, categoryFilter])

  useEffect(() => { fetchFeedback() }, [fetchFeedback])

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/v1/admin/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchFeedback()
    toast.success('Status updated')
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/v1/admin/feedback/${id}`, { method: 'DELETE' })
    fetchFeedback()
    toast.success('Feedback deleted')
  }

  const handleReply = async () => {
    if (!replyTarget || !replyMessage.trim()) return
    setReplying(true)
    try {
      const res = await fetch(`/api/v1/admin/feedback/${replyTarget.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Reply sent successfully')
        setReplyDialogOpen(false)
        setReplyMessage('')
        fetchFeedback()
      } else {
        toast.error(data.error || 'Failed to send reply')
      }
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setReplying(false)
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
            <p className="text-muted-foreground text-sm mt-1">{total} submissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1) }}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BUG_REPORT">Bug Report</SelectItem>
                <SelectItem value="FEATURE_REQUEST">Feature</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : feedback.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No feedback found</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {feedback.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{item.subject}</h3>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {categoryLabels[item.category] || item.category}
                        </Badge>
                        <Badge className={`text-[10px] shrink-0 ${statusColors[item.status] || ''}`}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{item.name || item.email || 'Anonymous'}</span>
                        {item.country && (
                          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{item.country}</span>
                        )}
                        {item.attachments && Array.isArray(item.attachments) && item.attachments.length > 0 && (
                          <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{item.attachments.length} file(s)</span>
                        )}
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      {item.Replies?.length > 0 && (
                        <div className="mt-3 pl-3 border-l-2 border-primary/30 space-y-2">
                          {item.Replies.map((reply: any) => (
                            <div key={reply.id} className="text-xs">
                              <span className="font-medium text-primary">Admin reply:</span>{' '}
                              <span className="text-muted-foreground">{reply.message}</span>
                              <span className="text-muted-foreground/50 ml-2">{new Date(reply.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Select value={item.status} onValueChange={v => handleStatusChange(item.id, v)}>
                        <SelectTrigger className="h-7 w-28 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { setReplyTarget(item); setReplyDialogOpen(true) }}
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete this feedback and all replies.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {page} of {Math.ceil(total / limit) || 1}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Feedback</DialogTitle>
          </DialogHeader>
          {replyTarget && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium">{replyTarget.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">{replyTarget.message}</p>
              </div>
              <Textarea
                placeholder="Write your reply..."
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReply} disabled={replying || !replyMessage.trim()}>
              {replying ? <Spinner size="sm" /> : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
