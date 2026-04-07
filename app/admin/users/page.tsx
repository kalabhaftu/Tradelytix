'use client'

import { useEffect, useState } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 25

  const fetchUsers = (p: number, s: string) => {
    setLoading(true)
    fetch(`/api/v1/admin/users?page=${p}&limit=${limit}&search=${encodeURIComponent(s)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setUsers(data.data.users)
          setTotal(data.data.total)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers(page, search) }, [page])

  const handleSearch = () => { setPage(1); fetchUsers(1, search) }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground text-sm mt-1">{total} total users</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search email, name..."
                className="pl-9 w-64"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button size="sm" onClick={handleSearch}>Search</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Email</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Name</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Location</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Accounts</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="p-3 text-sm font-medium">{user.email}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {user.firstName || user.lastName
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : '—'}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {user.geo ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {user.geo.city && `${user.geo.city}, `}{user.geo.country || '—'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="p-3 text-sm">{user._count.Account}</td>
                        <td className="p-3">
                          <Badge variant={user.isFirstConnection ? 'secondary' : 'default'} className="text-[10px]">
                            {user.isFirstConnection ? 'New' : 'Active'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

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
    </AdminShell>
  )
}
