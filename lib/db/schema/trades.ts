import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, doublePrecision, json } from 'drizzle-orm/pg-core';
import { MarketBiasEnum, TradeOutcomeEnum, TradeExecutionKindEnum } from './enums';
import { Account, LiveAccountTransaction, MasterAccount, Payout, PhaseAccount } from './accounts';
import { TradingModel, ActivityLog, UserGoal } from './playbook';
import { AdminFeatureFlag, AdminSharingPolicy, User, UserSettings, ImportJob, Notification, Feedback, UserGeoLog, SharedReport, Subscription, Synchronization } from './users';

export const Trade = pgTable('Trade', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountNumber: text('accountNumber').notNull(),
  quantity: doublePrecision('quantity').default(0),
  entryId: text('entryId'),
  closeId: text('closeId'),
  tradeIdentityKey: text('tradeIdentityKey'),
  instrument: text('instrument').notNull(),
  entryPrice: text('entryPrice').notNull(),
  closePrice: text('closePrice').notNull(),
  entryDate: text('entryDate').notNull(),
  closeDate: text('closeDate').notNull(),
  entryPriceValue: doublePrecision('entryPriceValue'),
  closePriceValue: doublePrecision('closePriceValue'),
  pnl: doublePrecision('pnl').notNull(),
  timeInPosition: doublePrecision('timeInPosition').default(0),
  userId: text('userId').notNull(),
  side: text('side'),
  commission: doublePrecision('commission').default(0),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).defaultNow(),
  comment: text('comment'),
  groupId: text('groupId'),
  cardPreviewImage: text('cardPreviewImage'),
  cardPreviewTransform: jsonb('cardPreviewTransform'),
  imageOne: text('imageOne'),
  imageTwo: text('imageTwo'),
  imageThree: text('imageThree'),
  imageFour: text('imageFour'),
  imageFive: text('imageFive'),
  imageSix: text('imageSix'),
  accountId: text('accountId'),
  phaseAccountId: text('phaseAccountId'),
  symbol: text('symbol'),
  entryTime: timestamp('entryTime', { withTimezone: true, mode: 'date' }),
  exitTime: timestamp('exitTime', { withTimezone: true, mode: 'date' }),
  closeReason: text('closeReason'),
  stopLoss: text('stopLoss'),
  stopLossValue: doublePrecision('stopLossValue'),
  takeProfit: text('takeProfit'),
  takeProfitValue: doublePrecision('takeProfitValue'),
  tags: text('tags').array().notNull(),
  marketBias: MarketBiasEnum('marketBias'),
  modelId: text('modelId'),
  selectedRules: jsonb('selectedRules'),
  outcome: TradeOutcomeEnum('outcome'),
  ruleBroken: boolean('ruleBroken').default(false),
  newsDay: boolean('newsDay').default(false),
  selectedNews: text('selectedNews'),
  newsTraded: boolean('newsTraded').default(false),
  biasTimeframe: text('biasTimeframe'),
  narrativeTimeframe: text('narrativeTimeframe'),
  entryTimeframe: text('entryTimeframe'),
  structureTimeframe: text('structureTimeframe'),
  orderType: text('orderType'),
  chartLinks: text('chartLinks'),
  chartLinksList: text('chartLinksList').array().default([]),
  plannedEntry: text('plannedEntry'),
  plannedStopLoss: text('plannedStopLoss'),
  plannedTakeProfit: text('plannedTakeProfit'),
  plannedSize: doublePrecision('plannedSize'),
  planNotes: text('planNotes'),
  mae: doublePrecision('mae'),
  mfe: doublePrecision('mfe'),
  setup: text('setup'),
});

export type TradeType = typeof Trade.$inferSelect;
export type NewTrade = typeof Trade.$inferInsert;

export const TradeExecution = pgTable('TradeExecution', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tradeId: text('tradeId').notNull(),
  userId: text('userId').notNull(),
  kind: TradeExecutionKindEnum('kind').notNull(),
  quantity: doublePrecision('quantity').default(0),
  price: doublePrecision('price'),
  executedAt: timestamp('executedAt', { withTimezone: true, mode: 'date' }),
  pnl: doublePrecision('pnl').default(0),
  commission: doublePrecision('commission').default(0),
  brokerExecutionId: text('brokerExecutionId'),
  legacySourceTradeId: text('legacySourceTradeId'),
  closeReason: text('closeReason'),
  rawSymbol: text('rawSymbol'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull(),
});

export type TradeExecutionType = typeof TradeExecution.$inferSelect;
export type NewTradeExecution = typeof TradeExecution.$inferInsert;

export const TradeTag = pgTable('TradeTag', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  color: text('color').default('#3b82f6'),
  userId: text('userId').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull(),
});

export type TradeTagType = typeof TradeTag.$inferSelect;
export type NewTradeTag = typeof TradeTag.$inferInsert;

export const TradeRelations = relations(Trade, ({ one, many }) => ({
  Account: one(Account, {
    fields: [Trade.accountId],
    references: [Account.id]
  }),
  TradingModel: one(TradingModel, {
    fields: [Trade.modelId],
    references: [TradingModel.id]
  }),
  PhaseAccount: one(PhaseAccount, {
    fields: [Trade.phaseAccountId],
    references: [PhaseAccount.id]
  }),
  executions: many(TradeExecution),
}));

export const TradeExecutionRelations = relations(TradeExecution, ({ one, many }) => ({
  Trade: one(Trade, {
    fields: [TradeExecution.tradeId],
    references: [Trade.id]
  }),
}));

export const TradeTagRelations = relations(TradeTag, ({ one, many }) => ({
  User: one(User, {
    fields: [TradeTag.userId],
    references: [User.id]
  }),
}));

