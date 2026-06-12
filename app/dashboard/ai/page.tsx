'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Sparkles,
  Plus,
  Trash2,
  Archive,
  Pin,
  Edit3,
  Check,
  X,
  Bookmark,
  ChevronRight,
  Info,
  Calendar,
  List,
  ArrowRight,
  Lock,
  RefreshCw,
  AlertCircle,
  BookOpen,
  TrendingUp,
  Sliders,
  DollarSign,
  Heart,
  User,
  History,
  Send,
  PinOff
} from 'lucide-react'
import { useData } from '@/context/data-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { PromptBox } from '@/components/ui/ai-prompt-input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { format } from 'date-fns'

interface ChatSession {
  id: string
  title: string
  isPinned: boolean
  isArchived: boolean
  accounts: string[]
  dateRange: string
  customFrom: string | null
  customTo: string | null
  dataSources: string[]
  createdAt: string
  updatedAt: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface SavedInsight {
  id: string
  title: string
  content: string
  category: string
  createdAt: string
}

// Templates list
const templates = [
  {
    id: 'performance',
    title: 'Performance Review',
    icon: TrendingUp,
    description: 'Comprehensive analysis of strengths, weaknesses, and win-rate trends.',
    prompt: 'Analyze my trading performance over the selected period. Identify strengths, weaknesses, recurring mistakes, and improvement opportunities.',
    dataSources: ['trades', 'performance']
  },
  {
    id: 'risk',
    title: 'Risk Analysis',
    icon: DollarSign,
    description: 'Calculates risk consistency and flags asymmetric drawdowns.',
    prompt: 'Calculate my risk per trade across all selected accounts. Identify accounts with inconsistent risk management or sizing errors.',
    dataSources: ['trades', 'statistics', 'performance']
  },
  {
    id: 'psychology',
    title: 'Psychology & Mood Review',
    icon: Brain,
    description: 'Correlates journal emotions with P&L outcomes.',
    prompt: 'Analyze my journal notes and identify recurring emotional patterns affecting performance.',
    dataSources: ['journals']
  },
  {
    id: 'strategy',
    title: 'Strategy Expectancy',
    icon: Sliders,
    description: 'Evaluates win-rate expectancy and profit factors by setup.',
    prompt: 'Evaluate the performance of my strategy setups. Highlight expectancy, profit factor, win rate, and potential decay.',
    dataSources: ['trades', 'performance']
  },
  {
    id: 'monthly',
    title: 'Monthly Trading Audit',
    icon: Calendar,
    description: 'Generates a deep-dive monthly card review.',
    prompt: 'Generate a comprehensive monthly trading review. Synthesize trade execution quality, news trading behavior, and drawdown recovery.',
    dataSources: ['trades', 'journals', 'reviews', 'performance', 'statistics']
  }
]

// Follow-up prompts maps
const followUpSuggestions: Record<string, string[]> = {
  default: [
    'Analyze Losing Trades',
    'Review Risk Management',
    'Find Recurring Mistakes',
    'Compare Against Previous Month'
  ],
  performance: [
    'Analyze my worst losers this month',
    'What hours do I lose the most money?',
    'Show me trades where I broke rules',
    'Suggest how to improve win rate'
  ],
  risk: [
    'How do I stop letting losers run?',
    'Compare my average win vs average loss',
    'Analyze my funded account drawdown',
    'Verify if my position sizing is consistent'
  ],
  psychology: [
    'What trades did I make when frustrated?',
    'Show me performance when I log focused vs anxious',
    'Identify overtrading patterns',
    'Provide discipline exercise recommendations'
  ]
}

export default function AIChatWorkspace() {
  const { accounts, isDemoMode } = useData()
  
  // State variables
  const [activeTab, setActiveTab] = useState<'chats' | 'insights' | 'history'>('chats')
  const [chats, setChats] = useState<ChatSession[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([])
  const [weeklyAIReviews, setWeeklyAIReviews] = useState<any[]>([])
  
  // Context Selection States
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [selectedDateRange, setSelectedDateRange] = useState<string>('last-30-days')
  const [customFromDate, setCustomFromDate] = useState<string>('')
  const [customToDate, setCustomToDate] = useState<string>('')
  const [selectedSources, setSelectedSources] = useState<string[]>([
    'trades', 'journals', 'performance', 'statistics'
  ])
  
  // Chatting State
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [isRenameMode, setIsRenameMode] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [paywallError, setPaywallError] = useState<string | null>(null)
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Initialize
  useEffect(() => {
    if (isDemoMode) {
      // Setup mock chats for Demo
      const mockChats: ChatSession[] = [
        {
          id: 'demo-1',
          title: 'Review Risk on NQ & ES',
          isPinned: true,
          isArchived: false,
          accounts: ['demo-funded'],
          dateRange: 'last-30-days',
          customFrom: null,
          customTo: null,
          dataSources: ['trades', 'statistics'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'demo-2',
          title: 'Psychology Audit: Anxious Days',
          isPinned: false,
          isArchived: false,
          accounts: ['demo-personal'],
          dateRange: 'last-90-days',
          customFrom: null,
          customTo: null,
          dataSources: ['journals'],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]
      setChats(mockChats)
      
      const mockInsights: SavedInsight[] = [
        {
          id: 'insight-1',
          title: 'Revenge Trading Pattern Identified',
          content: 'Data shows a 73% loss rate on trades taken within 45 minutes of a losing trade. Sizing is 1.5x larger on average due to revenge impulse.',
          category: 'mistake',
          createdAt: new Date().toISOString()
        }
      ]
      setSavedInsights(mockInsights)
      setIsLoadingChats(false)
      setIsInitializing(false)
    } else {
      // Fetch user chats, insights, and reviews
      loadWorkspaceData()
    }
  }, [isDemoMode])

  const loadWorkspaceData = async () => {
    setIsInitializing(true)
    setIsLoadingChats(true)
    setPaywallError(null)
    try {
      const [chatsRes, insightsRes, profileRes] = await Promise.all([
        fetch('/api/v1/ai/chats'),
        fetch('/api/v1/ai/insights'),
        fetch('/api/auth/profile') // to check if paywalled
      ])

      if (chatsRes.status === 403 || insightsRes.status === 403) {
        const payload = await chatsRes.json()
        setPaywallError(payload.error || 'Upgrade to a Pro plan to use the AI assistant.')
        setIsInitializing(false)
        setIsLoadingChats(false)
        return
      }

      if (chatsRes.ok) {
        const payload = await chatsRes.json()
        setChats(payload.data || [])
      }

      if (insightsRes.ok) {
        const payload = await insightsRes.json()
        setSavedInsights(payload.data || [])
      }
      
      // Also fetch weekly reviews
      const reviewsRes = await fetch('/api/v1/journal/ai-analysis?startDate=' + format(subDays(new Date(), 90), 'yyyy-MM-dd') + '&endDate=' + format(new Date(), 'yyyy-MM-dd'))
      if (reviewsRes.ok) {
        const reviewData = await reviewsRes.json()
        if (reviewData.analysis) {
          setWeeklyAIReviews([reviewData.analysis])
        }
      }
    } catch (err) {
      toast.error('Failed to load AI Assistant data.')
    } finally {
      setIsInitializing(false)
      setIsLoadingChats(false)
    }
  }

  // Pre-populate account selector when accounts are loaded
  useEffect(() => {
    if (accounts && accounts.length > 0 && selectedAccounts.length === 0) {
      setSelectedAccounts([accounts[0].id])
    }
  }, [accounts])

  // Fetch Messages for Selected Chat
  const handleChatSelect = async (chatId: string) => {
    setSelectedChatId(chatId)
    setIsLoadingMessages(true)
    setInputMessage('')
    setStreamingText('')
    
    if (isDemoMode) {
      if (chatId === 'demo-1') {
        setMessages([
          { id: 'm1', role: 'user', content: 'What is my risk per trade across the funded account?', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { 
            id: 'm2', 
            role: 'assistant', 
            content: `### Key Findings
Your average risk per trade is highly inconsistent, swinging from $120 to over $450 per trade.

### Root Causes
- Sizing up after consecutive wins (overconfidence trap).
- Changing stop loss sizes mid-trade instead of using pre-calculated sizes.

### Evidence
- On **Funded Account**, your largest single loss was **$680** on ES, while your average win was only **$190**.
- Risk-to-Reward ratio is currently skewed at **0.42** (average win divided by average loss), creating a negative edge.

### Recommended Actions
- Set a hard max loss limit of **$200** per trade.
- Standardize stop loss parameters at entry and never slide stops wider.`, 
            createdAt: new Date(Date.now() - 3500000).toISOString() 
          }
        ])
      } else {
        setMessages([
          { id: 'm3', role: 'user', content: 'Analyze my journal for emotional patterns.', createdAt: new Date(Date.now() - 7200000).toISOString() },
          { 
            id: 'm4', 
            role: 'assistant', 
            content: `### Key Findings
Emotional states directly correlate with performance. Operating under stress or frustration is highly destructive.

### Root Causes
- Trading before 9:30 AM EST often results in impulsive entries because you feel you are "missing out" (FOMO).
- Lack of patience when market consolidates.

### Evidence
- Days logged as **Frustrated** or **Impulsive** generated **-$840** in P&L across 7 trades.
- Days logged as **Focused** or **Disciplined** generated **+$1,250** across 12 trades.

### Recommended Actions
- Perform a 5-minute breathing exercise before opening trading platform.
- Write down your pre-trade checklist: if rules are not met, close the laptop.`, 
            createdAt: new Date(Date.now() - 7100000).toISOString() 
          }
        ])
      }
      setIsLoadingMessages(false)
      return
    }

    try {
      const response = await fetch(`/api/v1/ai/chats/${chatId}`)
      if (response.ok) {
        const payload = await response.json()
        setMessages(payload.data?.messages || [])
      }
    } catch {
      toast.error('Failed to load chat history.')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Create Chat and Send Message
  const handleStartChat = async (customPrompt?: string, sourceOverride?: string[]) => {
    const promptToSend = customPrompt || inputMessage
    if (!promptToSend.trim()) return

    setIsSending(true)
    setInputMessage('')

    if (isDemoMode) {
      // Simulate Demo Streaming Response
      const newChat: ChatSession = {
        id: `demo-${Date.now()}`,
        title: promptToSend.slice(0, 30) + '...',
        isPinned: false,
        isArchived: false,
        accounts: selectedAccounts,
        dateRange: selectedDateRange,
        customFrom: null,
        customTo: null,
        dataSources: sourceOverride || selectedSources,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setChats(prev => [newChat, ...prev])
      setSelectedChatId(newChat.id)
      
      const userMsg: ChatMessage = {
        id: `m-u-${Date.now()}`,
        role: 'user',
        content: promptToSend,
        createdAt: new Date().toISOString()
      }
      setMessages([userMsg])
      
      // Stream mock response
      let fullText = `### Key Findings
[DEMO MODE PREVIEW] You are experiencing the AI assistant simulator.
In a real subscription, the assistant analyzes your actual trading records. Here is a sample analysis of the mock data:

### Root Causes
- Inconsistent risk rules.
- Trading during high-impact news releases without an edge.

### Evidence
- Your simulated win rate is **48%**.
- Profit factor is **1.14** over 30 days.

### Recommended Actions
- Upgrade your subscription to connect live MT4/5, Rithmic, or dxFeed accounts and audit your actual performance.
- Maintain a strict rule of no news trading.`

      let current = ''
      const words = fullText.split(' ')
      let i = 0
      
      const interval = setInterval(() => {
        if (i < words.length) {
          current += words[i] + ' '
          setStreamingText(current)
          i++
        } else {
          clearInterval(interval)
          const assistantMsg: ChatMessage = {
            id: `m-a-${Date.now()}`,
            role: 'assistant',
            content: fullText,
            createdAt: new Date().toISOString()
          }
          setMessages(prev => [...prev, assistantMsg])
          setStreamingText('')
          setIsSending(false)
        }
      }, 70)
      return
    }

    try {
      // 1. Create chat if none selected
      let chatId = selectedChatId
      if (!chatId) {
        const response = await fetch('/api/v1/ai/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: promptToSend.slice(0, 40) + '...',
            accounts: selectedAccounts,
            dateRange: selectedDateRange,
            customFrom: selectedDateRange === 'custom' ? customFromDate : null,
            customTo: selectedDateRange === 'custom' ? customToDate : null,
            dataSources: sourceOverride || selectedSources
          })
        })

        if (!response.ok) {
          const payload = await response.json()
          toast.error(payload.error || 'Failed to start conversation.')
          setIsSending(false)
          return
        }

        const payload = await response.json()
        const createdChat = payload.data
        setChats(prev => [createdChat, ...prev])
        chatId = createdChat.id
        setSelectedChatId(chatId)
      }

      // Add user message locally first
      const userMsg: ChatMessage = {
        id: `local-u-${Date.now()}`,
        role: 'user',
        content: promptToSend,
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, userMsg])

      // 2. Stream AI message response
      const response = await fetch(`/api/v1/ai/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend })
      })

      if (!response.ok) {
        const payload = await response.json()
        toast.error(payload.error || 'Failed to send message.')
        setIsSending(false)
        return
      }

      // Read SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantResponse = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          
          // Parse Vercel AI SDK text protocol (e.g. 0:"text chunk")
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.slice(2))
                assistantResponse += text
                setStreamingText(assistantResponse)
              } catch {}
            }
          }
        }
      }

      // Reload chat messages from backend to get official saved ids
      const reloadRes = await fetch(`/api/v1/ai/chats/${chatId}`)
      if (reloadRes.ok) {
        const payload = await reloadRes.json()
        setMessages(payload.data?.messages || [])
      }

      setStreamingText('')
      
      // Update chat title if it was a new chat
      await fetch('/api/v1/ai/chats')
        .then(res => res.json())
        .then(payload => {
          if (payload.success) setChats(payload.data)
        })

    } catch (err) {
      toast.error('An error occurred during response transmission.')
    } finally {
      setIsSending(false)
    }
  }

  // Manage Chat Actions
  const handleTogglePin = async (chat: ChatSession) => {
    if (isDemoMode) {
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, isPinned: !c.isPinned } : c))
      toast.success(chat.isPinned ? 'Chat unpinned' : 'Chat pinned')
      return
    }

    try {
      const response = await fetch(`/api/v1/ai/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !chat.isPinned })
      })
      if (response.ok) {
        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, isPinned: !chat.isPinned } : c))
        toast.success(chat.isPinned ? 'Chat unpinned' : 'Chat pinned')
      }
    } catch {
      toast.error('Failed to pin chat.')
    }
  }

  const handleToggleArchive = async (chat: ChatSession) => {
    if (isDemoMode) {
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, isArchived: !c.isArchived } : c))
      toast.success(chat.isArchived ? 'Chat restored' : 'Chat archived')
      return
    }

    try {
      const response = await fetch(`/api/v1/ai/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !chat.isArchived })
      })
      if (response.ok) {
        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, isArchived: !chat.isArchived } : c))
        toast.success(chat.isArchived ? 'Chat restored' : 'Chat archived')
        if (selectedChatId === chat.id) {
          setSelectedChatId(null)
          setMessages([])
        }
      }
    } catch {
      toast.error('Failed to archive chat.')
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    if (isDemoMode) {
      setChats(prev => prev.filter(c => c.id !== chatId))
      if (selectedChatId === chatId) {
        setSelectedChatId(null)
        setMessages([])
      }
      toast.success('Chat deleted')
      return
    }

    try {
      const response = await fetch(`/api/v1/ai/chats/${chatId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId))
        if (selectedChatId === chatId) {
          setSelectedChatId(null)
          setMessages([])
        }
        toast.success('Conversation deleted')
      }
    } catch {
      toast.error('Failed to delete chat.')
    }
  }

  const handleRenameChat = async (chatId: string) => {
    if (!renameValue.trim()) return

    if (isDemoMode) {
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: renameValue } : c))
      setIsRenameMode(false)
      toast.success('Chat renamed')
      return
    }

    try {
      const response = await fetch(`/api/v1/ai/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameValue })
      })
      if (response.ok) {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: renameValue } : c))
        setIsRenameMode(false)
        toast.success('Chat renamed')
      }
    } catch {
      toast.error('Failed to rename chat.')
    }
  }

  // Saved Insights Actions
  const handleSaveInsight = async (msg: ChatMessage) => {
    if (isDemoMode) {
      const newInsight: SavedInsight = {
        id: `insight-${Date.now()}`,
        title: 'Key AI Insight',
        content: msg.content,
        category: 'insight',
        createdAt: new Date().toISOString()
      }
      setSavedInsights(prev => [newInsight, ...prev])
      toast.success('Insight saved to library!')
      return
    }

    try {
      const response = await fetch('/api/v1/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Coach Insight: ' + new Date().toLocaleDateString(),
          content: msg.content,
          category: 'insight'
        })
      })

      if (response.ok) {
        const payload = await response.json()
        setSavedInsights(prev => [payload.data, ...prev])
        toast.success('Insight saved to library!')
      }
    } catch {
      toast.error('Failed to save insight.')
    }
  }

  const handleDeleteInsight = async (insightId: string) => {
    if (isDemoMode) {
      setSavedInsights(prev => prev.filter(i => i.id !== insightId))
      toast.success('Insight removed')
      return
    }

    try {
      const response = await fetch(`/api/v1/ai/insights/${insightId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setSavedInsights(prev => prev.filter(i => i.id !== insightId))
        toast.success('Insight removed')
      }
    } catch {
      toast.error('Failed to delete insight.')
    }
  }

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }

  const handleAccountToggle = (accId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accId) 
        ? prev.filter(a => a !== accId)
        : [...prev, accId]
    )
  }

  // Get Suggested Follow Ups based on messages length and context
  const getFollowUps = () => {
    if (messages.length === 0) return []
    // Look at last user message content to suggest category
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    const content = lastUserMsg?.content.toLowerCase() || ''
    
    if (content.includes('risk') || content.includes('drawdown')) return followUpSuggestions.risk
    if (content.includes('journal') || content.includes('emotion')) return followUpSuggestions.psychology
    if (content.includes('performance') || content.includes('win')) return followUpSuggestions.performance
    
    return followUpSuggestions.default
  }

  // Helper to render customized markdown tags as sleek styled JSX
  const renderMessageContent = (text: string) => {
    if (!text) return null
    
    const lines = text.split('\n')
    return (
      <div className="space-y-3">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="text-sm font-bold mt-4 mb-2 text-foreground tracking-tight border-b border-border/40 pb-1">{line.slice(4)}</h4>
          }
          if (line.startsWith('## ')) {
            return <h3 key={idx} className="text-base font-bold mt-4 mb-2 text-primary tracking-tight">{line.slice(3)}</h3>
          }
          if (line.startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-2 text-sm pl-2">
                <span className="text-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="leading-relaxed text-muted-foreground">{line.slice(2)}</span>
              </div>
            )
          }
          if (line.trim().length === 0) return null
          
          return (
            <p key={idx} className="text-sm leading-relaxed text-muted-foreground">
              {line}
            </p>
          )
        })}
      </div>
    )
  }

  if (paywallError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6">
        <div className="p-4 bg-primary/10 rounded-full">
          <Brain className="h-16 w-16 text-primary animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">AI Trading Coach</h2>
        <p className="max-w-md text-muted-foreground text-sm leading-relaxed">
          {paywallError}
        </p>
        <Button size="lg" className="px-8 font-semibold" onClick={() => window.location.href = '/subscribe'}>
          Upgrade to Premium
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-background">
      
      {/* 1. SIDEBAR PANEL */}
      <div className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border/50 bg-card flex flex-col">
        {/* Sidebar Tabs */}
        <div className="flex border-b border-border/40 shrink-0">
          <button
            onClick={() => setActiveTab('chats')}
            className={cn(
              "flex-1 py-3.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors",
              activeTab === 'chats' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={cn(
              "flex-1 py-3.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors",
              activeTab === 'insights' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 py-3.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors",
              activeTab === 'history' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Analyses
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] lg:min-h-0">
          
          {/* Chats Tab */}
          {activeTab === 'chats' && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-dashed border-border/60 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSelectedChatId(null)
                  setMessages([])
                }}
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </Button>

              {isLoadingChats ? (
                <div className="flex justify-center py-8">
                  <Spinner size="sm" />
                </div>
              ) : chats.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No conversations yet.</p>
              ) : (
                <div className="space-y-1">
                  {chats.map(chat => (
                    <div
                      key={chat.id}
                      className={cn(
                        "group flex items-center justify-between p-2.5 rounded-xl text-sm transition-all cursor-pointer",
                        selectedChatId === chat.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden mr-2">
                        {chat.isPinned ? (
                          <Pin className="h-3.5 w-3.5 text-primary shrink-0 rotate-45" />
                        ) : (
                          <History className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        )}
                        <span className="truncate text-xs">{chat.title}</span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTogglePin(chat); }}
                          className="p-1 hover:bg-background rounded-md text-muted-foreground hover:text-foreground"
                        >
                          <Pin className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleArchive(chat); }}
                          className="p-1 hover:bg-background rounded-md text-muted-foreground hover:text-foreground"
                        >
                          <Archive className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }}
                          className="p-1 hover:bg-background rounded-md text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-3">
              {savedInsights.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No saved insights yet.</p>
              ) : (
                savedInsights.map(insight => (
                  <Card key={insight.id} className="border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow relative group">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-foreground truncate max-w-[85%]">{insight.title}</h4>
                        <button
                          onClick={() => handleDeleteInsight(insight.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded text-muted-foreground hover:text-red-500 transition-all absolute top-2 right-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pr-2">{insight.content}</p>
                      <span className="text-[10px] text-muted-foreground opacity-75">{new Date(insight.createdAt).toLocaleDateString()}</span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Analyses Tab */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {weeklyAIReviews.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No previous weekly analyses found.</p>
              ) : (
                weeklyAIReviews.map((review, idx) => (
                  <Card key={idx} className="border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground">Weekly Performance Audit</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">Grade {review.riskGrade || 'A'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{review.summary}</p>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                        <span>Consistency: {review.consistencyScore || '7'}/10</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => {
                            setSelectedChatId(null)
                            handleStartChat(`Summarize and expand on my weekly analysis: ${review.summary}`)
                          }}
                        >
                          Discuss
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* 2. MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-primary/20 border-b border-primary/20 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <Info className="h-4 w-4 shrink-0" />
              <span>You are viewing the <strong>AI Assistant Demo Preview</strong>. Upgrade to Pro to connect your real trading accounts.</span>
            </div>
            <Button size="sm" className="h-7 text-xs px-3 font-semibold" onClick={() => window.location.href = '/subscribe'}>
              Upgrade
            </Button>
          </div>
        )}

        {/* Chatting View */}
        {selectedChatId ? (
          <div className="flex-1 flex flex-col min-h-0 bg-background">
            {/* Active Chat Header */}
            <div className="px-5 py-3 border-b border-border/40 bg-background flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 overflow-hidden mr-4">
                <Brain className="h-5 w-5 text-primary shrink-0" />
                {isRenameMode ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="border border-border/80 bg-background text-sm rounded px-2 py-0.5 max-w-[200px]"
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameChat(selectedChatId)}
                      autoFocus
                    />
                    <button onClick={() => handleRenameChat(selectedChatId)} className="p-1 hover:bg-muted rounded text-green-500">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setIsRenameMode(false)} className="p-1 hover:bg-muted rounded text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <h3 className="text-sm font-semibold truncate max-w-[250px] text-foreground">
                      {chats.find(c => c.id === selectedChatId)?.title || 'Active Conversation'}
                    </h3>
                    <button
                      onClick={() => {
                        const currentChat = chats.find(c => c.id === selectedChatId)
                        setRenameValue(currentChat?.title || '')
                        setIsRenameMode(true)
                      }}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs rounded-xl"
                  onClick={() => {
                    setSelectedChatId(null)
                    setMessages([])
                  }}
                >
                  Configure Context
                </Button>
              </div>
            </div>

            {/* Chat message bubbles */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 bg-background custom-scrollbar">
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Spinner size="lg" />
                  <span className="text-xs text-muted-foreground">Retrieving analysis history...</span>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto w-full space-y-6">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === 'user' ? (
                        <div className="bg-muted dark:bg-[#303030] text-foreground rounded-[20px] px-4 py-2.5 max-w-[85%] sm:max-w-[75%] shadow-sm text-sm">
                          <p className="leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ) : (
                        <div className="w-full text-foreground leading-relaxed text-xs sm:text-sm py-4 border-b border-border/10 relative group">
                          <div className="flex items-start gap-3.5">
                            <div className="bg-primary/10 rounded-lg p-1.5 w-7 h-7 flex items-center justify-center shrink-0 border border-primary/20">
                              <Brain className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0 pr-8">
                              {renderMessageContent(msg.content)}
                            </div>
                          </div>

                          {/* Save insight trigger */}
                          <div className="absolute right-0 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                            <button
                              onClick={() => handleSaveInsight(msg)}
                              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-all bg-card border shadow-sm"
                              title="Save Insight to Library"
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Streaming SSE Message */}
                  {streamingText && (
                    <div className="flex w-full justify-start">
                      <div className="w-full text-foreground leading-relaxed text-xs sm:text-sm py-4 border-b border-border/10">
                        <div className="flex items-start gap-3.5">
                          <div className="bg-primary/10 rounded-lg p-1.5 w-7 h-7 flex items-center justify-center shrink-0 border border-primary/20">
                            <Brain className="h-4 w-4 text-primary animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {renderMessageContent(streamingText)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isSending && !streamingText && (
                    <div className="flex w-full justify-start">
                      <div className="flex items-center gap-3 py-4 text-muted-foreground text-xs sm:text-sm">
                        <Spinner size="sm" />
                        <span>Coach is analyzing your metrics...</span>
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-Ups */}
                  {messages.length > 0 && !isSending && !streamingText && (
                    <div className="pt-6 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suggested Follow-Ups</p>
                      <div className="flex flex-wrap gap-2">
                        {getFollowUps().map((followUp, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleStartChat(followUp)}
                            className="px-3.5 py-1.5 bg-card hover:bg-muted border border-border/40 hover:border-primary/30 rounded-full text-xs text-muted-foreground hover:text-primary transition-all shadow-sm font-medium"
                          >
                            {followUp}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Message Input Box */}
            <div className="p-4 border-t border-border/40 bg-background shrink-0">
              <div className="max-w-3xl mx-auto w-full">
                <PromptBox
                  onSubmit={(message) => handleStartChat(message)}
                  placeholder="Ask your Coach (e.g. why am I losing on EURUSD?)"
                  disabled={isSending}
                />
              </div>
            </div>
          </div>
        ) : (
          
          /* 3. INITIAL CHATGPT-STYLE HOMEPAGE */
          <div className="flex-1 flex flex-col justify-between p-6 max-w-3xl mx-auto w-full min-h-0 bg-background">
            
            {/* Centered Welcome Title & Context Selector */}
            <div className="flex-1 flex flex-col justify-center items-center space-y-8 min-h-0">
              <div className="space-y-3 text-center">
                <div className="mx-auto bg-primary/10 rounded-2xl p-4 w-16 h-16 flex items-center justify-center border border-primary/20 shadow-inner">
                  <Brain className="h-9 w-9 text-primary" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  AI Performance Coach
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Get objective, numbers-driven audits on your trading behavior, risk management, and discipline.
                </p>
              </div>

              {/* Clean Context Status Bar (ChatGPT Style Dropdowns) */}
              <div className="flex flex-wrap items-center justify-center gap-3 bg-muted/40 p-1.5 rounded-2xl border border-border/40 shadow-inner">
                {/* Account Selection Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 rounded-xl px-3 text-xs font-semibold gap-1.5 hover:bg-background shadow-sm">
                      <Sliders className="h-3.5 w-3.5 text-primary" />
                      <span>
                        {selectedAccounts.length === 0 
                          ? 'Select Accounts' 
                          : selectedAccounts.length === accounts.length 
                            ? 'All Accounts' 
                            : `${selectedAccounts.length} Account${selectedAccounts.length > 1 ? 's' : ''}`}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2 rounded-2xl bg-card border border-border/80 shadow-lg" align="center">
                    <div className="flex justify-between items-center px-2 py-1.5 border-b border-border/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Accounts Selection</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedAccounts(accounts.map(a => a.id))}
                          className="text-[10px] text-primary hover:underline font-semibold"
                        >
                          Select All
                        </button>
                        <button 
                          onClick={() => setSelectedAccounts([])}
                          className="text-[10px] text-muted-foreground hover:underline font-semibold"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 p-1 pt-2 custom-scrollbar">
                      {accounts.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No connected accounts.</p>
                      ) : (
                        accounts.map(acc => {
                          const isSelected = selectedAccounts.includes(acc.id)
                          return (
                            <div
                              key={acc.id}
                              className={cn(
                                "flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer",
                                isSelected 
                                  ? "bg-primary/5 border-primary/20 text-foreground" 
                                  : "border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                              )}
                              onClick={() => handleAccountToggle(acc.id)}
                            >
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => handleAccountToggle(acc.id)}
                                className="pointer-events-none"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold truncate leading-tight">{acc.displayName || acc.name || acc.number}</span>
                                <span className="text-[9px] text-muted-foreground leading-normal">{acc.propfirm || acc.broker || 'Live Broker'}</span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="h-4 w-px bg-border/60" />

                {/* Period Selector Dropdown */}
                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                  <SelectTrigger className="h-8 border-none bg-transparent hover:bg-background rounded-xl shadow-none px-3 text-xs font-semibold gap-1.5 focus:ring-0">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/80 bg-card">
                    <SelectItem value="last-7-days" className="text-xs">Last 7 Days</SelectItem>
                    <SelectItem value="last-30-days" className="text-xs">Last 30 Days</SelectItem>
                    <SelectItem value="last-90-days" className="text-xs">Last 90 Days</SelectItem>
                    <SelectItem value="custom" className="text-xs">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Pickers when selected */}
              {selectedDateRange === 'custom' && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border/40 rounded-2xl animate-in fade-in duration-300">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">From</span>
                    <input
                      type="date"
                      value={customFromDate}
                      onChange={(e) => setCustomFromDate(e.target.value)}
                      className="border border-border/80 rounded-xl px-2 py-1 text-xs bg-background outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">To</span>
                    <input
                      type="date"
                      value={customToDate}
                      onChange={(e) => setCustomToDate(e.target.value)}
                      className="border border-border/80 rounded-xl px-2 py-1 text-xs bg-background outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              {/* Quick Prompt Cards */}
              <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                {templates.slice(0, 4).map(tpl => {
                  const Icon = tpl.icon
                  return (
                    <Card
                      key={tpl.id}
                      className="border-border/40 bg-card hover:bg-muted/40 hover:border-primary/20 transition-all duration-300 shadow-sm cursor-pointer hover:shadow"
                      onClick={() => handleStartChat(tpl.prompt)}
                    >
                      <CardContent className="p-3.5 flex gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center">
                          <Icon className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div className="space-y-0.5 min-w-0 text-left">
                          <h4 className="text-xs font-bold text-foreground tracking-tight">{tpl.title}</h4>
                          <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2">{tpl.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Bottom Prompt Box Container */}
            <div className="pt-4 max-w-2xl mx-auto w-full shrink-0">
              <PromptBox 
                onSubmit={(message) => handleStartChat(message)}
                placeholder="Ask your Coach (e.g. why am I losing on EURUSD?)"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// Helper to go back N days for review fetching
function subDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}
