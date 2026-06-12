// Unified Mock Data Store for Demo Mode
// Decouples massive mock data objects from production client components/hooks

export const MOCK_ACCOUNTS = [
  {
    id: 'mock-acc-1',
    number: 'DEMO-123',
    name: 'Demo Account',
    propfirm: '',
    broker: 'Mock Broker',
    startingBalance: 100000,
    calculatedEquity: 105432,
    pnl: 5432,
    currentBalance: 105432,
    currentEquity: 105432,
    status: 'active',
    createdAt: new Date().toISOString(),
    userId: 'demo-user',
    groupId: null,
    group: null,
    accountType: 'live',
    displayName: 'Demo Account (DEMO-123)',
    tradeCount: 80,
    owner: null,
    isOwner: true,
    currentPhase: null
  },
  {
    id: 'mock-propfirm-1',
    number: 'FTMO-PHASE-1',
    name: 'Demo Prop Firm Account',
    propfirm: 'FTMO',
    broker: 'Mock Broker',
    startingBalance: 100000,
    calculatedEquity: 105432,
    pnl: 5432,
    currentBalance: 105432,
    currentEquity: 105432,
    status: 'active',
    createdAt: new Date().toISOString(),
    userId: 'demo-user',
    groupId: null,
    group: null,
    accountType: 'prop-firm',
    displayName: 'Demo Prop Firm Account (Phase 1)',
    tradeCount: 80,
    owner: null,
    isOwner: true,
    currentPhase: 1,
    phaseAccountNumber: 'FTMO-PHASE-1',
    isArchived: false,
    currentPhaseDetails: {
      phaseNumber: 1,
      status: 'active',
      phaseId: 'FTMO-PHASE-1',
      masterAccountId: 'mock-propfirm-1',
      masterAccountName: 'Demo Prop Firm Account',
      evaluationType: 'Two Step'
    }
  }
];

export const MOCK_LIVE_ACCOUNT_DETAILS = {
  id: 'mock-acc-1',
  number: 'DEMO-123',
  name: 'Demo Account',
  broker: 'Mock Broker',
  displayName: 'Demo Account (DEMO-123)',
  startingBalance: 100000,
  currentEquity: 105432,
  status: 'active',
  accountType: 'live',
  tradeCount: 80,
  profitLoss: 5432,
  createdAt: new Date().toISOString()
};

export const MOCK_PROP_FIRM_DETAILS = {
  account: {
    id: 'mock-propfirm-1',
    accountName: 'Demo Prop Firm Account',
    propFirmName: 'FTMO',
    accountSize: 100000,
    evaluationType: 'Two Step',
    currentPhase: {
      id: 'mock-phase-1',
      phaseNumber: 1,
      phaseId: 'FTMO-PHASE-1',
      status: 'active',
      profitTargetPercent: 10,
      dailyDrawdownPercent: 5,
      maxDrawdownPercent: 10,
      maxDrawdownType: 'balance',
      minTradingDays: 4,
      timeLimitDays: null,
      consistencyRulePercent: 0,
      profitSplitPercent: 80,
      payoutCycleDays: 14,
      startDate: new Date().toISOString(),
      endDate: null
    },
    status: 'active',
    phases: [
      {
        id: 'mock-phase-1',
        phaseNumber: 1,
        phaseId: 'FTMO-PHASE-1',
        status: 'active',
        profitTargetPercent: 10,
        dailyDrawdownPercent: 5,
        maxDrawdownPercent: 10,
        maxDrawdownType: 'balance',
        minTradingDays: 4,
        timeLimitDays: null,
        consistencyRulePercent: 0,
        profitSplitPercent: 80,
        payoutCycleDays: 14,
        startDate: new Date().toISOString(),
        endDate: null
      }
    ],
    currentPnL: 5432,
    currentGrossPnL: 5600,
    currentNetPnL: 5432,
    currentBalance: 105432,
    currentEquity: 105432,
    dailyDrawdownRemaining: 4568,
    maxDrawdownRemaining: 9568,
    profitTargetProgress: 54.32,
    lastUpdated: new Date().toISOString()
  },
  drawdown: {
    dailyDrawdownRemaining: 4568,
    maxDrawdownRemaining: 9568,
    dailyStartBalance: 100000,
    highestEquity: 105432,
    currentEquity: 105432,
    isBreached: false
  }
};

export const MOCK_PROP_FIRM_SETTINGS = {
  id: 'mock-propfirm-1',
  number: 'FTMO-PHASE-1',
  name: 'Demo Prop Firm Account',
  propfirm: 'FTMO',
  status: 'active',
  currentEquity: 105432,
  currentBalance: 105432,
  startingBalance: 100000,
  dailyDrawdownLimit: 5000,
  maxDrawdownLimit: 10000,
  profitTarget: 10000,
  timezone: 'UTC',
  dailyResetTime: '17:00',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isArchived: false,
  notes: ''
};

export const MOCK_PAYOUT_ELIGIBILITY = {
  isEligible: true,
  daysSinceFunded: 15,
  daysSinceLastPayout: 15,
  netProfitSinceLastPayout: 5432,
  minDaysRequired: 14,
  profitSplitAmount: 4345.60,
  blockers: []
};

export const MOCK_USER_PROFILE = {
  id: 'demo-user',
  email: 'demo@tradelytix.eu.cc',
  username: 'demo_trader',
  firstName: 'Demo',
  lastName: 'Trader',
  timezone: 'America/New_York',
  use24HourFormat: true,
  isFirstConnection: false,
  breakEvenThreshold: 1.5,
  pnlDisplayMode: 'net',
  aiInsightsEnabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const MOCK_SUBSCRIPTION = {
  id: 'sub-mock',
  userId: 'demo-user',
  status: 'active',
  priceId: 'premium-monthly',
  tier: 'premium',
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  cancelAtPeriodEnd: false
};

export const MOCK_WEBHOOK_TOKEN = {
  token: 'demo_webhook_token_xyz123'
};
