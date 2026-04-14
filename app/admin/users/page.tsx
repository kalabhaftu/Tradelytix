'use client'

import { useEffect, useState, useCallback, type ComponentType } from 'react'
import { AdminShell } from '../components/admin-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, MapPin, ShieldAlert, UserCheck, UserCog } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type AdminUser = {
  id: string
  dbUserId: string | null
  authUserId: string
  email: string
  displayName: string | null
  hasDbProfile: boolean
  locationLabel: string | null
  accountCount: number
  createdAt: string | null
  lastSignInAt: string | null
}

type UsersResponse = {
  users: AdminUser[]
  total: number
  page: number
  limit: number
  totalPages: number
  summary: {
    liveUsers: number
    orphanedDbUsers: number
    authUsersMissingDbRows: number
    orphanedDbUserSamples: Array<{
      id: string
      authUserId: string
      email: string
      displayName: string | null
    }>
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<UsersResponse['summary'] | null>(null)
  const limit = 25

  const fetchUsers = useCallback((nextPage: number, nextSearch: string) => {
    setLoading(true)
    fetch(`/api/v1/admin/users?page=${nextPage}&limit=${limit}&search=${encodeURIComponent(nextSearch)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.data.users)
          setTotal(data.data.total)
          setSummary(data.data.summary)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchUsers(page, appliedSearch)
  }, [page, appliedSearch, fetchUsers])

  const handleSearch = () => {
    setPage(1)
    setAppliedSearch(search)
    fetchUsers(1, search)
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground text-sm mt-1">{summary?.liveUsers ?? total} live auth-backed users</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search email, name, location..."
                className="pl-9 w-72"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button size="sm" onClick={handleSearch}>Search</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={UserCheck}
            title="Live Users"
            value={summary?.liveUsers ?? 0}
            subtitle="Main admin list"
          />
          <SummaryCard
            icon={ShieldAlert}
            title="Orphaned DB Users"
            value={summary?.orphanedDbUsers ?? 0}
            subtitle="Deleted in auth, still in app DB"
            destructive={(summary?.orphanedDbUsers ?? 0) > 0}
          />
          <SummaryCard
            icon={UserCog}
            title="Missing App Profiles"
            value={summary?.authUsersMissingDbRows ?? 0}
            subtitle="Auth user exists, app profile missing"
          />
        </div>

        {(summary?.orphanedDbUsers ?? 0) > 0 && (
          <Card className="border-warning/30">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warning" />
                <p className="text-sm font-medium">Deleted-auth leftovers detected</p>
              </div>
              <p className="text-sm text-muted-foreground">
                These users are no longer in Supabase Auth, so they are excluded from the main list. Review the data-integrity diagnostic before cleanup.
              </p>
              <div className="flex flex-wrap gap-2">
                {summary?.orphanedDbUserSamples.map((user) => (
                  <Badge key={user.id} variant="outline" className="max-w-full truncate">
                    {user.email}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                    {users.map((user) => (
                      <tr key={user.authUserId} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="p-3 text-sm font-medium">{user.email}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {user.displayName || '—'}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {user.locationLabel ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {user.locationLabel}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="p-3 text-sm">{user.accountCount}</td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">
                              {user.createdAt
                                ? `Registered ${formatDistanceToNow(new Date(user.createdAt))} ago`
                                : 'Registered in Auth'}
                            </span>
                            {!user.hasDbProfile && (
                              <Badge variant="outline" className="w-fit text-[10px]">
                                Missing app profile
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No live users found</td></tr>
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
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage((current) => current + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  subtitle,
  destructive = false,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  value: number
  subtitle: string
  destructive?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${destructive ? 'text-destructive' : ''}`}>
              {value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-xl ${destructive ? 'bg-destructive/10' : 'bg-primary/10'}`}>
            <Icon className={`h-5 w-5 ${destructive ? 'text-destructive' : 'text-primary'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
