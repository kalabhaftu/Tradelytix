'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Pencil, GripVertical, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { KNOWN_TOKEN_OPTIONS, getTokenMeta, resolveKnownTokenSymbol } from '@/lib/constants/crypto-tokens'

const CUSTOM_TOKEN_VALUE = '__CUSTOM__'

type DonationForm = {
  tokenChoice: string
  token: string
  network: string
  address: string
  sortOrder: number
}

const emptyForm: DonationForm = {
  tokenChoice: CUSTOM_TOKEN_VALUE,
  token: '',
  network: '',
  address: '',
  sortOrder: 0,
}

export default function AdminDonationsPage() {
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<DonationForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchAddresses = useCallback(() => {
    setLoading(true)
    fetch('/api/v1/admin/donations')
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setAddresses(data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const openCreateDialog = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      sortOrder: addresses.length,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (addr: any) => {
    const resolved = resolveKnownTokenSymbol(addr.token)

    setEditing(addr)
    setForm({
      tokenChoice: resolved ?? CUSTOM_TOKEN_VALUE,
      token: addr.token,
      network: addr.network,
      address: addr.address,
      sortOrder: addr.sortOrder,
    })
    setDialogOpen(true)
  }

  const handleTokenChoiceChange = (value: string) => {
    if (value === CUSTOM_TOKEN_VALUE) {
      setForm((current) => ({
        ...current,
        tokenChoice: CUSTOM_TOKEN_VALUE,
      }))
      return
    }

    const meta = getTokenMeta(value)

    setForm((current) => ({
      ...current,
      tokenChoice: value,
      token: meta.symbol,
      network: current.network || meta.name,
    }))
  }

  const handleSave = async () => {
    if (!form.token || !form.network || !form.address) {
      toast.error('Token, network, and address are required')
      return
    }

    setSaving(true)

    try {
      const payload = {
        token: form.token.trim(),
        network: form.network.trim(),
        address: form.address.trim(),
        sortOrder: form.sortOrder,
      }

      if (editing) {
        await fetch(`/api/v1/admin/donations/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('Address updated')
      } else {
        await fetch('/api/v1/admin/donations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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

  const selectedMeta = form.token ? getTokenMeta(form.token) : null
  const isCustom = form.tokenChoice === CUSTOM_TOKEN_VALUE

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
            {addresses.map((addr) => {
              const meta = getTokenMeta(addr.token)

              return (
                <Card key={addr.id} className={!addr.isActive ? 'opacity-50' : ''}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{meta.symbol}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{addr.network}</span>
                          <span className="text-xs text-muted-foreground">{meta.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{addr.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={addr.isActive}
                        onCheckedChange={(value) => handleToggle(addr.id, value)}
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
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Donation Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Token Preset</Label>
              <Select value={form.tokenChoice} onValueChange={handleTokenChoiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a known token or Custom" />
                </SelectTrigger>
                <SelectContent>
                  {KNOWN_TOKEN_OPTIONS.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.name} ({token.symbol})
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_TOKEN_VALUE}>Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Token Symbol</Label>
                <Input
                  placeholder="BTC"
                  value={form.token}
                  disabled={!isCustom}
                  onChange={(event) => setForm((current) => ({ ...current, token: event.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Network</Label>
                <Input
                  placeholder={selectedMeta?.name || 'Ethereum'}
                  value={form.network}
                  onChange={(event) => setForm((current) => ({ ...current, network: event.target.value }))}
                />
              </div>
            </div>

            {selectedMeta && (
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Public donate page will resolve this token as <span className="font-medium text-foreground">{selectedMeta.name}</span> with its matching icon when possible.
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs">Wallet Address</Label>
              <Input
                placeholder="0x..."
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Sort Order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: parseInt(event.target.value, 10) || 0 }))}
              />
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
