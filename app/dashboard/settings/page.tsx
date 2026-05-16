'use client'

import { LinkedAccounts } from "@/components/linked-accounts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DestructiveButton, PrimaryButton } from "@/components/ui/button-styles"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useTheme } from '@/context/theme-provider'
import { useAuth } from '@/context/auth-provider'
import { createClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { formatBreakevenBand } from '@/lib/metrics/outcome'
import { normalizePnlDisplayMode, type PnlDisplayMode } from '@/lib/metrics/pnl'
import { signOut } from "@/server/auth"
import { useUserStore } from '@/store/user-store'
import {
  ChevronRight as CaretRight,
  Check,
  Clock,
  Copy,
  CreditCard,
  Database,
  Pencil,
  Laptop,
  Moon,
  Palette,
  RefreshCw,
  Settings as SettingsIcon,
  Bot,
  Shield,
  LogOut as SignOut,
  Sparkles,
  BellRing,
  Sun,
  Trash2 as Trash,
  User,
  AlertCircle as WarningCircle,
  Calendar,
  Target,
  LayoutGrid,
  Zap,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from "sonner"
import { CacheManagement } from "./components/cache-management"
import { PageHeader } from "@/components/ui/page-header"
import { getUserAvatarUrl } from "@/lib/user-avatar"

const timezones = [
  'UTC',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

const defaultAiSettings = {
  autoGenerateInsights: false,
  includeAiInsightsInNotifications: false,
}

function SettingRow({
  icon: Icon,
  label,
  description,
  action,
  className
}: {
  icon: any
  label: string
  description?: string
  action: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground/85">{description}</p>
          )}
        </div>
      </div>
      <div className="flex w-full min-w-0 md:w-auto md:justify-end">
        {action}
      </div>
    </div>
  )
}

function buildTradingViewWebhookExample(token: string | null) {
  return JSON.stringify({
    token: token || "your_webhook_token",
    symbol: "EURUSD",
    side: "BUY",
    entry_price: 1.085,
    close_price: 1.092,
    quantity: 0.1,
    pnl: 70,
    entry_time: "2026-05-07T14:30:00Z",
    close_time: "2026-05-07T18:45:00Z",
    stop_loss: 1.08,
    take_profit: 1.095,
    comment: "Imported via TradingView alert"
  }, null, 2)
}

export default function SettingsPage() {
  const { theme, setTheme, accentPack, setAccentPack, widgetStyle, setWidgetStyle } = useTheme()
  const storeUser = useUserStore(state => state.supabaseUser)
  const dbUser = useUserStore(state => state.user)
  const setDbUser = useUserStore(state => state.setUser)
  const { user: authUser } = useAuth()
  const user = storeUser ?? authUser
  const timezone = useUserStore(state => state.timezone)
  const setTimezone = useUserStore(state => state.setTimezone)
  const use24HourFormat = useUserStore(state => state.use24HourFormat)
  const setUse24HourFormat = useUserStore(state => state.setUse24HourFormat)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    autoAdjustAccountDate: false,
    breakEvenThreshold: 10,
    pnlDisplayMode: 'net' as PnlDisplayMode,
    aiSettings: defaultAiSettings,
  })
  const [breakEvenDraft, setBreakEvenDraft] = useState('10')
  const [isUpdatingBreakEven, setIsUpdatingBreakEven] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingAiSettings, setIsUpdatingAiSettings] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [savedProfileNames, setSavedProfileNames] = useState({
    firstName: '',
    lastName: '',
  })
  const avatarUrl = getUserAvatarUrl(user)

  const [subscriptionData, setSubscriptionData] = useState<{
    hasAccess: boolean
    status: string
    reason?: string
    currentPeriodEnd?: string
    nextPaymentDue?: string
  } | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)

  const [webhookToken, setWebhookToken] = useState<string | null>(null)
  const [isLoadingWebhook, setIsLoadingWebhook] = useState(false)
  const [isRegeneratingWebhook, setIsRegeneratingWebhook] = useState(false)
  const [webhookCopied, setWebhookCopied] = useState(false)

  const handleThemeChange = (value: string) => {
    setTheme(value as "light" | "dark" | "system")
    toast.success("Theme updated", {
      description: `Theme changed to ${value === 'system' ? 'system default' : value} mode.`,
      duration: 2000
    })
  }

  const handleWidgetStyleChange = (value: 'default' | 'glass') => {
    setWidgetStyle(value)
    toast.success("Widget style updated", {
      description: `Widget style changed to ${value === 'glass' ? 'Glassmorphism' : 'Standard'}.`,
      duration: 2000
    })
  }

  const handleAccentChange = (value: 'classic' | 'reports') => {
    setAccentPack(value)
    toast.success("Color accent updated", {
      description: `Accent changed to ${value === 'reports' ? 'Sage & Amber' : 'Classic'}.`,
      duration: 2000
    })
  }

  useEffect(() => {
    const fetchWebhookToken = async () => {
      try {
        setIsLoadingWebhook(true)
        const res = await fetch('/api/v1/auth/webhook-token')
        const data = await res.json()
        if (data.token) setWebhookToken(data.token)
      } catch {
        // webhook feature unavailable (migration may not be applied yet)
      } finally {
        setIsLoadingWebhook(false)
      }
    }
    fetchWebhookToken()
  }, [])

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setIsLoadingSubscription(true)
        const res = await fetch('/api/v1/subscription/status')
        const data = await res.json()
        if (data.success) setSubscriptionData(data.data)
      } catch {
        // subscription check unavailable
      } finally {
        setIsLoadingSubscription(false)
      }
    }

    const handleWindowFocus = () => {
      fetchSubscription()
    }

    fetchSubscription()
    window.addEventListener('focus', handleWindowFocus)

    return () => window.removeEventListener('focus', handleWindowFocus)
  }, [])

  const regenerateWebhookToken = async () => {
    try {
      setIsRegeneratingWebhook(true)
      const res = await fetch('/api/v1/auth/webhook-token', { method: 'POST' })
      const data = await res.json()
      if (data.token) {
        setWebhookToken(data.token)
        setWebhookCopied(false)
        toast.success('Token regenerated', {
          description: 'Your TradingView webhook token has been regenerated. Update your TradingView alert.',
          duration: 4000,
        })
      }
    } catch {
      toast.error('Failed to regenerate token')
    } finally {
      setIsRegeneratingWebhook(false)
    }
  }

  const copyWebhookUrl = async () => {
    if (!webhookToken) return
    const url = `${window.location.origin}/api/v1/import/webhook/tradingview`
    await navigator.clipboard.writeText(url)
    setWebhookCopied(true)
    setTimeout(() => setWebhookCopied(false), 2500)
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true)
        const response = await fetch('/api/auth/profile')
        const result = await response.json()

        if (result.success) {
          const nextFirstName = result.data.firstName || ''
          const nextLastName = result.data.lastName || ''
          setProfileData({
            firstName: nextFirstName,
            lastName: nextLastName,
            email: result.data.email || '',
            autoAdjustAccountDate: result.data.autoAdjustAccountDate ?? false,
            breakEvenThreshold: typeof result.data.breakEvenThreshold === 'number' ? result.data.breakEvenThreshold : 10,
            pnlDisplayMode: normalizePnlDisplayMode(result.data.pnlDisplayMode),
            aiSettings: {
              ...defaultAiSettings,
              ...(result.data.aiSettings || {})
            }
          })
          setSavedProfileNames({
            firstName: nextFirstName,
            lastName: nextLastName,
          })
          const safeThreshold = typeof result.data.breakEvenThreshold === 'number' ? result.data.breakEvenThreshold : 10
          setBreakEvenDraft(String(safeThreshold))
        }
      } catch (error) {
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [])

  const handleProfileUpdate = async () => {
    setIsUpdatingProfile(true)
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          autoAdjustAccountDate: profileData.autoAdjustAccountDate
        })
      })

      const result = await response.json()

        if (result.success) {
        setSavedProfileNames({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        })
        setIsEditingProfile(false)
        toast.success("Profile updated", {
          description: "Your profile information has been saved.",
          duration: 3000
        })
      } else {
        throw new Error(result.error || 'Update failed')
      }
    } catch (error) {
      toast.error("Update failed", {
        description: error instanceof Error ? error.message : "There was an error updating your profile.",
        duration: 3000
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleTimezoneChange = (value: string) => {
    setTimezone(value)
    toast.success("Timezone updated", {
      description: `Timezone changed to ${value.replace('_', ' ')}.`,
      duration: 2000
    })
  }

  const handleAutoAdjustChange = async (checked: boolean) => {
    const previous = profileData.autoAdjustAccountDate
    setProfileData(prev => ({ ...prev, autoAdjustAccountDate: checked }))

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoAdjustAccountDate: checked })
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save Auto-adjust Account Date preference')
      }

      setProfileData(prev => ({
        ...prev,
        autoAdjustAccountDate: result.data?.autoAdjustAccountDate ?? checked
      }))
    } catch (error) {
      setProfileData(prev => ({ ...prev, autoAdjustAccountDate: previous }))
      toast.error('Auto-adjust update failed', {
        description: error instanceof Error ? error.message : 'Failed to save Auto-adjust Account Date preference.',
        duration: 3000
      })
    }
  }

  const handleBreakEvenThresholdSave = async () => {
    const parsed = Number.parseFloat(breakEvenDraft)
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Invalid threshold', {
        description: 'Break-even threshold must be a non-negative number.',
        duration: 3000
      })
      return
    }

    const normalized = Math.abs(parsed)
    const previous = profileData.breakEvenThreshold
    setIsUpdatingBreakEven(true)

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breakEvenThreshold: normalized })
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update break-even threshold')
      }

      const next = typeof result.data?.breakEvenThreshold === 'number'
        ? result.data.breakEvenThreshold
        : normalized

      setProfileData(prev => ({ ...prev, breakEvenThreshold: next }))
      setBreakEvenDraft(String(next))
      toast.success('Break-even threshold updated', {
        description: `Current band: ${formatBreakevenBand(next)}`,
        duration: 2500
      })
    } catch (error) {
      setProfileData(prev => ({ ...prev, breakEvenThreshold: previous }))
      setBreakEvenDraft(String(previous))
      toast.error('Break-even update failed', {
        description: error instanceof Error ? error.message : 'Failed to save break-even threshold.',
        duration: 3000
      })
    } finally {
      setIsUpdatingBreakEven(false)
    }
  }

  const handlePnlDisplayModeChange = async (value: string) => {
    const nextMode = normalizePnlDisplayMode(value)
    const previous = profileData.pnlDisplayMode

    setProfileData(prev => ({ ...prev, pnlDisplayMode: nextMode }))

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pnlDisplayMode: nextMode })
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update P&L display mode')
      }

        setProfileData(prev => ({
          ...prev,
          pnlDisplayMode: normalizePnlDisplayMode(result.data?.pnlDisplayMode)
        }))
        if (dbUser) {
          setDbUser({
            ...dbUser,
            pnlDisplayMode: normalizePnlDisplayMode(result.data?.pnlDisplayMode)
          } as typeof dbUser)
        }

        toast.success('P&L display updated', {
          description: nextMode === 'gross'
            ? 'Dashboard and report monetary values now prefer gross P&L before fees.'
          : 'Dashboard and report monetary values now prefer net P&L after fees.',
        duration: 2500
      })
    } catch (error) {
      setProfileData(prev => ({ ...prev, pnlDisplayMode: previous }))
      toast.error('P&L display update failed', {
        description: error instanceof Error ? error.message : 'Failed to save P&L display preference.',
        duration: 3000
      })
    }
  }

  const handleAiSettingsChange = async (
    key: keyof typeof defaultAiSettings,
    checked: boolean
  ) => {
    const previous = profileData.aiSettings
    const next = { ...previous, [key]: checked }

    setProfileData(prev => ({ ...prev, aiSettings: next }))
    setIsUpdatingAiSettings(true)

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiSettings: { [key]: checked } })
      })
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update AI preferences')
      }

      toast.success('AI preferences updated', {
        description: 'Your AI settings were saved successfully.',
        duration: 2500
      })
    } catch (error) {
      setProfileData(prev => ({ ...prev, aiSettings: previous }))
      toast.error('AI settings update failed', {
        description: error instanceof Error ? error.message : 'Failed to save AI settings.',
        duration: 3000
      })
    } finally {
      setIsUpdatingAiSettings(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'Delete my account') {
      toast.error("Confirmation required", {
        description: "Please type 'Delete my account' to confirm.",
        duration: 3000
      })
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account')
      }

      toast.success("Account deleted", {
        description: "Your account and all data have been permanently deleted.",
        duration: 3000
      })

      const supabase = createClient()
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/?deleted=true'

    } catch (error) {
      toast.error("Deletion failed", {
        description: error instanceof Error ? error.message : "There was an error deleting your account.",
        duration: 5000
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
      setDeleteConfirmText("")
    }
  }

  const isDeleteConfirmed = deleteConfirmText === 'Delete my account'

  const handleCancelProfileEdit = () => {
    setProfileData(prev => ({
      ...prev,
      firstName: savedProfileNames.firstName,
      lastName: savedProfileNames.lastName,
    }))
    setIsEditingProfile(false)
  }

  const getThemeDisplay = () => {
    if (theme === 'dark') return { icon: Moon, label: 'Dark' }
    if (theme === 'light') return { icon: Sun, label: 'Light' }
    return { icon: Laptop, label: 'System' }
  }

  const themeInfo = getThemeDisplay()

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <PageHeader title="Settings" className="gap-2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">Profile</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/85">Your personal information</CardDescription>
                </div>
              </div>
              <Button
                variant={isEditingProfile ? "secondary" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setIsEditingProfile(true)}
                disabled={isLoadingProfile || isEditingProfile}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage key={avatarUrl ?? 'settings-avatar-fallback'} src={avatarUrl} referrerPolicy="no-referrer" />
                <AvatarFallback className="text-lg">
                  {user?.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  Member since {new Date(user?.created_at || '').toLocaleDateString()}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">Active</Badge>
            </div>

            {isLoadingProfile ? (
              <div className="space-y-4">
                <div className="space-y-1.5"><Skeleton className="h-3 w-16" /><Skeleton className="h-9 w-full" /></div>
                <div className="space-y-1.5"><Skeleton className="h-3 w-16" /><Skeleton className="h-9 w-full" /></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={isLoadingProfile || !isEditingProfile}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={isLoadingProfile || !isEditingProfile}
                    className="h-9"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input id="email" type="email" value={user?.email || ''} disabled className="h-9" />
            </div>

            {isEditingProfile && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleCancelProfileEdit}
                  disabled={isUpdatingProfile}
                >
                  Cancel
                </Button>
                <PrimaryButton
                  onClick={handleProfileUpdate}
                  loading={isUpdatingProfile || isLoadingProfile}
                  loadingText={isLoadingProfile ? "Fetching..." : "Updating..."}
                  className="w-full sm:w-auto"
                >
                  Save Profile
                </PrimaryButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Subscription</CardTitle>
                <CardDescription className="text-xs text-muted-foreground/85">Your plan details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSubscription ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : subscriptionData ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground">
                      {subscriptionData.reason || subscriptionData.status}
                    </p>
                  </div>
                  <Badge variant={subscriptionData.hasAccess ? 'secondary' : 'destructive'} className="shrink-0">
                    {subscriptionData.hasAccess ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {subscriptionData.currentPeriodEnd && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Current Period Ends</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {(() => {
                        const days = Math.ceil((new Date(subscriptionData.currentPeriodEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        return days > 0 ? `${days} day${days !== 1 ? 's' : ''} left` : 'Expired'
                      })()}
                    </span>
                  </div>
                )}
                {subscriptionData.nextPaymentDue && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Next Payment</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(subscriptionData.nextPaymentDue).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}
                {!subscriptionData.hasAccess && (
                  <Link href="/subscribe">
                    <Button size="sm" className="gap-2 w-full">
                      <CreditCard className="h-3.5 w-3.5" />
                      Subscribe
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Unable to load subscription info</p>
            )}
          </CardContent>
        </Card>

        {/* AI Preferences Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Bot className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">AI Preferences</CardTitle>
                <CardDescription className="text-xs">Control AI-generated insights and automation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <SettingRow
              icon={Sparkles}
              label="Weekly AI Performance Reviews"
              description="Get an AI-generated weekly report card every weekend"
              action={
                <Switch
                  checked={profileData.aiSettings.autoGenerateInsights}
                  onCheckedChange={(checked) => handleAiSettingsChange('autoGenerateInsights', checked)}
                  disabled={isLoadingProfile || isUpdatingAiSettings}
                />
              }
            />

            <Separator />

            <SettingRow
              icon={BellRing}
              label="AI insights in notifications"
              description="Create a notification with a summary when you run an AI analysis"
              action={
                <Switch
                  checked={profileData.aiSettings.includeAiInsightsInNotifications}
                  onCheckedChange={(checked) => handleAiSettingsChange('includeAiInsightsInNotifications', checked)}
                  disabled={isLoadingProfile || isUpdatingAiSettings}
                />
              }
            />
          </CardContent>
        </Card>

        {/* Cache Management */}
        <CacheManagement />
          </div>

          <div className="flex min-w-0 flex-col gap-6">

        {/* Preferences Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <SettingsIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Preferences</CardTitle>
                <CardDescription className="text-xs text-muted-foreground/85">Customize your experience</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* Theme */}
            <SettingRow
              icon={Palette}
              label="Theme"
              description="Choose your preferred color scheme"
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 min-w-[100px]">
                      <themeInfo.icon className="h-3.5 w-3.5" />
                      {themeInfo.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                      {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                      {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                      <Laptop className="mr-2 h-4 w-4" />
                      System
                      {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />

            <Separator />

            {/* Color Accent */}
            <SettingRow
              icon={Palette}
              label="Color Accent"
              description={accentPack === 'reports' ? 'Sage & Amber' : 'Classic (Red & Green)'}
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 min-w-[120px]">
                      {accentPack === 'reports' ? 'Sage & Amber' : 'Classic'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAccentChange('classic')}>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-full bg-long" />
                          <div className="w-3 h-3 rounded-full bg-short" />
                        </div>
                        Classic
                      </div>
                      {accentPack === 'classic' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAccentChange('reports')}>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-bullish))]" />
                          <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-bearish))]" />
                        </div>
                        Sage & Amber
                      </div>
                      {accentPack === 'reports' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />

            <Separator />

            {/* Timezone */}
            <SettingRow
              icon={Clock}
              label="Timezone"
              description={timezone.replace('_', ' ')}
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      Change
                      <CaretRight className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ScrollArea className="h-[200px]">
                      <DropdownMenuRadioGroup value={timezone} onValueChange={handleTimezoneChange}>
                        {timezones.map((tz) => (
                          <DropdownMenuRadioItem key={tz} value={tz}>
                            {tz.replace('_', ' ')}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />

            <Separator />

            {/* Time Format */}
            <SettingRow
              icon={Clock}
              label="Time Format"
              description={use24HourFormat ? "24-hour" : "12-hour"}
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      Change
                      <CaretRight className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={use24HourFormat ? "24h" : "12h"} onValueChange={(v) => {
                      setUse24HourFormat(v === "24h")
                      toast.success("Time format updated", {
                        description: `Time format changed to ${v === "24h" ? "24-hour" : "12-hour"}.`,
                        duration: 2000
                      })
                    }}>
                      <DropdownMenuRadioItem value="24h">24-hour (14:30)</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="12h">12-hour (2:30 PM)</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />

            <Separator />

            <SettingRow
              icon={Target}
              label="Break-even threshold"
              description={`Breakeven band: ${formatBreakevenBand(profileData.breakEvenThreshold)}. Counted as win above +$${profileData.breakEvenThreshold}, loss below -$${profileData.breakEvenThreshold}.`}
              action={
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={breakEvenDraft}
                    onChange={(e) => setBreakEvenDraft(e.target.value)}
                    className="h-8 w-24"
                  />
                  <Button
                    size="sm"
                    onClick={handleBreakEvenThresholdSave}
                    disabled={isUpdatingBreakEven}
                  >
                    {isUpdatingBreakEven ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              }
            />

            <Separator />

            <SettingRow
              icon={Target}
              label="P&L display"
              description={profileData.pnlDisplayMode === 'gross'
                ? 'Show gross P&L before commissions and swap on dashboard/report money surfaces.'
                : 'Show net P&L after commissions and swap on dashboard/report money surfaces.'}
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      {profileData.pnlDisplayMode === 'gross' ? 'Gross' : 'Net'}
                      <CaretRight className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup
                      value={profileData.pnlDisplayMode}
                      onValueChange={handlePnlDisplayModeChange}
                    >
                      <DropdownMenuRadioItem value="net">Net (after fees)</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="gross">Gross (before fees)</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />

            <Separator />

            {/* Widget Style */}
            <SettingRow
              icon={LayoutGrid}
              label="Widget Style"
              description={widgetStyle === 'glass' ? 'Glassmorphism with distinct borders' : 'Standard muted panel style'}
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 min-w-[120px]">
                      {widgetStyle === 'glass' ? 'Glassmorphism' : 'Standard'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleWidgetStyleChange('default')}>
                      Standard
                      {widgetStyle === 'default' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleWidgetStyleChange('glass')}>
                      Glassmorphism
                      {widgetStyle === 'glass' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />

            <Separator />

            {/* Auto-adjust Account Date */}
            <SettingRow
              icon={Calendar}
              label="Auto-adjust Account Date"
              description="Automatically set account start date to your first trade"
              action={
                <div className="flex items-center space-x-2">
                  <Button
                    variant={profileData.autoAdjustAccountDate ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAutoAdjustChange(!profileData.autoAdjustAccountDate)}
                  >
                    {profileData.autoAdjustAccountDate ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              }
            />
          </CardContent>
        </Card>

        {/* Linked Accounts */}
        <LinkedAccounts />

        {/* TradingView Webhook Integration */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Zap className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">TradingView Webhook</CardTitle>
                <CardDescription className="text-xs">Auto-import trades via TradingView alerts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Paste this URL into the TradingView alert webhook field. The secret token does not go in the URL; it goes inside the JSON message body shown below.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 rounded-lg border border-border/40 bg-muted/30 px-3 py-2 font-mono text-[11px] text-muted-foreground truncate">
                {isLoadingWebhook ? (
                  <Skeleton className="h-3.5 w-full" />
                ) : webhookToken ? (
                  `${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/import/webhook/tradingview`
                ) : (
                  'Loading...'
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9"
                disabled={!webhookToken || isLoadingWebhook}
                onClick={copyWebhookUrl}
              >
                {webhookCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-muted-foreground/60">
                Regenerating creates a new URL and invalidates the old one.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs shrink-0"
                disabled={isRegeneratingWebhook}
                onClick={regenerateWebhookToken}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRegeneratingWebhook && 'animate-spin')} />
                Regenerate
              </Button>
            </div>
            <div className="space-y-2 rounded-xl border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold">TradingView alert message body</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={!webhookToken || isLoadingWebhook}
                  onClick={async () => {
                    await navigator.clipboard.writeText(buildTradingViewWebhookExample(webhookToken))
                    toast.success('Webhook example copied')
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy JSON
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-border/30 bg-background/60 p-3 text-[11px] leading-5 text-muted-foreground">
                {buildTradingViewWebhookExample(webhookToken)}
              </pre>
              <p className="text-[10px] text-muted-foreground/70">
                Required fields: `token`, `symbol`, `side`, `entry_price`, `close_price`. If `quantity`, `pnl`, `entry_time`, or `close_time` are missing, the webhook still imports but with weaker trade detail.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Management Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Account</CardTitle>
                <CardDescription className="text-xs">Manage your account and data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/data">
                <Button variant="outline" className="gap-2">
                  <Database className="h-4 w-4" />
                  Data Management
                </Button>
              </Link>

                <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  localStorage.removeItem('deltalytix_user_data')
                  signOut()
                }}
              >
                <SignOut className="h-4 w-4" />
                Sign Out
              </Button>

              <DestructiveButton
                variant="outline"
                className="gap-2"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash className="h-4 w-4" />
                Delete Account
              </DestructiveButton>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>

      </motion.div>

      {/* Delete Account Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <WarningCircle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-left space-y-3">
                <p className="text-sm">
                  This action is <strong>irreversible</strong> and will permanently delete:
                </p>
                <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Your account and profile</li>
                  <li>All trading data and history</li>
                  <li>Prop firm settings</li>
                  <li>Dashboard layouts and preferences</li>
                  <li>All uploaded files</li>
                </ul>
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <WarningCircle className="h-4 w-4" />
                    This data cannot be recovered.
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Label htmlFor="delete-confirm" className="text-sm">
              Type <code className="bg-muted px-1 py-0.5 rounded text-xs">Delete my account</code> to confirm:
            </Label>
            <Input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type here..."
              className="font-mono text-sm"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setDeleteConfirmText('')
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <DestructiveButton
              onClick={handleDeleteAccount}
              disabled={!isDeleteConfirmed || isDeleting}
              loading={isDeleting}
              loadingText="Deleting..."
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Account
            </DestructiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
