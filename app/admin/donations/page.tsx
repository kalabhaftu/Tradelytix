'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Trash2, Pencil, GripVertical, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'

export default function AdminDonationsPage() {
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ token: '', network: '', address: '', sortOrder: 0 })
  const [saving, setSaving] = useState(false)

  const fetchAddresses = useCallback(() => {
    setLoading(true)
    fetch('/api/v1/admin/donations')
      .then(r => r.json())
      .then(data => { if (data.success) setAddresses(data.data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAddresses() }, [fetchAddresses])

  const openCreateDialog = () => {
    setEditing(null)
    setForm({ token: '', network: '', address: '', sortOrder: addresses.length })
    setDialogOpen(true)
  }

  const openEditDialog = (addr: any) => {
    setEditing(addr)
    setForm({ token: addr.token, network: addr.network, address: addr.address, sortOrder: addr.sortOrder })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.token || !form.network || !form.address) {
      toast.error('All fields are required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await fetch(`/api/v1/admin/donations/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        toast.success('Address updated')
      } else {
        await fetch('/api/v1/admin/donations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        toast.success('Address created')
      }
      setDialogOpen(false)
      fetchAddresses()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/v1/admin/donations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    fetchAddresses()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/v1/admin/donations/${id}`, { method: 'DELETE' })
    fetchAddresses()
    toast.success('Address deleted')
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Donation Addresses</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage crypto wallet addresses shown on the donation page</p>
          </div>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1" />Add Address
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : addresses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No donation addresses configured</p>
              <Button size="sm" className="mt-4" onClick={openCreateDialog}>Add your first address</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {addresses.map(addr => (
              <Card key={addr.id} className={!addr.isActive ? 'opacity-50' : ''}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{addr.token}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{addr.network}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{addr.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={addr.isActive}
                      onCheckedChange={v => handleToggle(addr.id, v)}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(addr)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Address</AlertDialogTitle>
                          <AlertDialogDescription>Remove {addr.token} ({addr.network}) address?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(addr.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Donation Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Token Symbol</Label>
                <Input placeholder="BTC" value={form.token} onChange={e => setForm(p => ({ ...p, token: e.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Network</Label>
                <Input placeholder="Bitcoin" value={form.network} onChange={e => setForm(p => ({ ...p, network: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Wallet Address</Label>
              <Input placeholder="0x..." value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size="sm" /> : editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
