'use client'

import { useEffect, useState } from 'react'
import { AdminShell, AdminPageHeader } from '../components/admin-shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { 
  Brain, 
  Cpu, 
  Settings, 
  BarChart3, 
  Database, 
  DollarSign, 
  Clock, 
  Users, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react'

interface AISettings {
  enabled: boolean
  demoModeEnabled: boolean
  freePlanAccess: boolean
  paidPlanAccess: boolean
  adminAccess: boolean
  maxContextSize: number
  maxMessagesPerDay: number
  maxTokensPerResponse: number
  conversationRetentionDays: number
}

interface Analytics {
  totalRequests: number
  totalPromptTokens: number
  totalCompletionTokens: number
  totalTokens: number
  totalCost: number
  avgResponseTime: number
  uniqueUsersCount: number
  dailyStats: Array<{
    date: string
    count: number
    cost: number
    tokens: number
  }>
}

export default function AdminAIPage() {
  const [settings, setSettings] = useState<AISettings | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch Settings & Analytics
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v1/admin/ai-settings')
      const payload = await res.json()
      if (payload.success) {
        setSettings(payload.data.settings)
        setAnalytics(payload.data.analytics)
      } else {
        toast.error('Failed to load settings.')
      }
    } catch {
      toast.error('Failed to fetch AI configuration.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof AISettings) => {
    if (!settings) return
    setSettings({
      ...settings,
      [key]: !settings[key]
    })
  }

  const handleNumberChange = (key: keyof AISettings, value: string) => {
    if (!settings) return
    const num = parseInt(value, 10)
    setSettings({
      ...settings,
      [key]: isNaN(num) ? 0 : num
    })
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/admin/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const payload = await res.json()
      if (payload.success) {
        setSettings(payload.data)
        toast.success('AI configuration saved successfully!')
      } else {
        toast.error(payload.error || 'Failed to save settings.')
      }
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          title="AI Assistant Controls"
          description="Manage AI engine parameters, plan visibility tiers, and monitor token consumption."
          hint="Admins bypass subscription gates, but are subject to admin tier settings toggled here."
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : !settings ? (
          <p className="text-muted-foreground text-sm">Failed to load configuration.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Left Columns - Settings Panels */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Section A: Global Availability */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cpu className="h-4.5 w-4.5 text-primary" />
                    Availability & Tiers
                  </CardTitle>
                  <CardDescription>
                    Control general access and plan eligibility rules.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 border rounded-xl bg-muted/10">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Enable AI Assistant</Label>
                      <p className="text-xs text-muted-foreground">Toggles AI workspace visibility across the platform.</p>
                    </div>
                    <Switch checked={settings.enabled} onCheckedChange={() => handleToggle('enabled')} />
                  </div>

                  <div className="flex items-center justify-between p-3.5 border rounded-xl bg-muted/10">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Enable Demo Mode</Label>
                      <p className="text-xs text-muted-foreground">Allows free users to experience mock AI conversations.</p>
                    </div>
                    <Switch checked={settings.demoModeEnabled} onCheckedChange={() => handleToggle('demoModeEnabled')} />
                  </div>

                  <div className="pt-2 border-t space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan Visibility Access</h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Allow Free Plan Users</Label>
                        <Switch checked={settings.freePlanAccess} onCheckedChange={() => handleToggle('freePlanAccess')} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Allow Paid Plan Users (Pro)</Label>
                        <Switch checked={settings.paidPlanAccess} onCheckedChange={() => handleToggle('paidPlanAccess')} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Allow Admin Accounts</Label>
                        <Switch checked={settings.adminAccess} onCheckedChange={() => handleToggle('adminAccess')} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section B: Model Parameters & Thresholds */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4.5 w-4.5 text-primary" />
                    Model & Guardrails
                  </CardTitle>
                  <CardDescription>
                    Configure context limits to manage Grok token consumption.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Max Context Size (Tokens)</Label>
                      <Input
                        type="number"
                        value={settings.maxContextSize}
                        onChange={(e) => handleNumberChange('maxContextSize', e.target.value)}
                        className="rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Limits database items queried per request.</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Max Daily Messages</Label>
                      <Input
                        type="number"
                        value={settings.maxMessagesPerDay}
                        onChange={(e) => handleNumberChange('maxMessagesPerDay', e.target.value)}
                        className="rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Usage capping per user per day.</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Max Tokens Per Response</Label>
                      <Input
                        type="number"
                        value={settings.maxTokensPerResponse}
                        onChange={(e) => handleNumberChange('maxTokensPerResponse', e.target.value)}
                        className="rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Clamps maximum length of responses.</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Chat Retention Period (Days)</Label>
                      <Input
                        type="number"
                        value={settings.conversationRetentionDays}
                        onChange={(e) => handleNumberChange('conversationRetentionDays', e.target.value)}
                        className="rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Time before conversation records expire.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Save Button */}
              <div className="flex justify-end">
                <Button size="lg" className="px-8 font-semibold" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>

            </div>

            {/* Right Column - Analytics Dashboard */}
            <div className="space-y-6">
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4.5 w-4.5 text-primary" />
                    AI Platform Metrics
                  </CardTitle>
                  <CardDescription>
                    Real-time Grok token and cost telemetry.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics ? (
                    <div className="space-y-4">
                      
                      {/* Metric Stat A: Cost */}
                      <div className="p-3 border rounded-xl bg-muted/10 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Est. Consumption Cost</span>
                          <p className="text-lg font-bold">${analytics.totalCost.toFixed(4)}</p>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <DollarSign className="h-4 w-4 text-emerald-500" />
                        </div>
                      </div>

                      {/* Metric Stat B: Requests */}
                      <div className="p-3 border rounded-xl bg-muted/10 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Messages</span>
                          <p className="text-lg font-bold">{analytics.totalRequests}</p>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                      </div>

                      {/* Metric Stat C: Adoption */}
                      <div className="p-3 border rounded-xl bg-muted/10 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Users</span>
                          <p className="text-lg font-bold">{analytics.uniqueUsersCount}</p>
                        </div>
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                          <Users className="h-4 w-4 text-indigo-500" />
                        </div>
                      </div>

                      {/* Metric Stat D: Latency */}
                      <div className="p-3 border rounded-xl bg-muted/10 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Avg Latency</span>
                          <p className="text-lg font-bold">{(analytics.avgResponseTime / 1000).toFixed(2)}s</p>
                        </div>
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                          <Clock className="h-4 w-4 text-yellow-500" />
                        </div>
                      </div>

                      {/* Token details */}
                      <div className="pt-2 border-t text-xs space-y-1.5 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Prompt Tokens:</span>
                          <span className="font-semibold text-foreground">{analytics.totalPromptTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completion Tokens:</span>
                          <span className="font-semibold text-foreground">{analytics.totalCompletionTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-foreground">
                          <span>Total Tokens:</span>
                          <span>{analytics.totalTokens.toLocaleString()}</span>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No analytics logs recorded yet.</p>
                  )}
                </CardContent>
              </Card>

            </div>

          </div>
        )}
      </div>
    </AdminShell>
  )
}
