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
  entryId: text('entry_id'),
  closeId: text('close_id'),
  tradeIdentityKey: text('trade_identity_key'),
  instrument: text('instrument').notNull(),
  entryPrice: text('entryPrice').notNull(),
  closePrice: text('closePrice').notNull(),
  entryDate: text('entryDate').notNull(),
  closeDate: text('closeDate').notNull(),
  entryPriceValue: doublePrecision('entry_price_value'),
  closePriceValue: doublePrecision('close_price_value'),
  pnl: doublePrecision('pnl').notNull(),
  timeInPosition: doublePrecision('timeInPosition').default(0),
  userId: text('userId').notNull(),
  side: text('side'),
  commission: doublePrecision('commission').default(0),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).defaultNow(),
  comment: text('comment'),
  groupId: text('group_id'),
  cardPreviewImage: text('card_preview_image'),
  cardPreviewTransform: jsonb('card_preview_transform'),
  imageOne: text('image_one'),
  imageTwo: text('image_two'),
  imageThree: text('image_three'),
  imageFour: text('image_four'),
  imageFive: text('image_five'),
  imageSix: text('image_six'),
  accountId: text('account_id'),
  phaseAccountId: text('phase_account_id'),
  symbol: text('symbol'),
  entryTime: timestamp('entry_time', { withTimezone: true, mode: 'date' }),
  exitTime: timestamp('exit_time', { withTimezone: true, mode: 'date' }),
  closeReason: text('close_reason'),
  stopLoss: text('stop_loss'),
  stopLossValue: doublePrecision('stop_loss_value'),
  takeProfit: text('take_profit'),
  takeProfitValue: doublePrecision('take_profit_value'),
  tags: text('tags').array().notNull(),
  marketBias: MarketBiasEnum('market_bias'),
  modelId: text('model_id'),
  selectedRules: jsonb('selected_rules'),
  outcome: TradeOutcomeEnum('outcome'),
  ruleBroken: boolean('ruleBroken').default(false),
  newsDay: boolean('newsDay').default(false),
  selectedNews: text('selected_news'),
  newsTraded: boolean('newsTraded').default(false),
  biasTimeframe: text('bias_timeframe'),
  narrativeTimeframe: text('narrative_timeframe'),
  entryTimeframe: text('entry_timeframe'),
  structureTimeframe: text('structure_timeframe'),
  orderType: text('order_type'),
  chartLinks: text('chart_links'),
  chartLinksList: text('chartLinksList').array().default([]),
  plannedEntry: text('planned_entry'),
  plannedStopLoss: text('planned_stop_loss'),
  plannedTakeProfit: text('planned_take_profit'),
  plannedSize: doublePrecision('planned_size'),
  planNotes: text('plan_notes'),
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
  executedAt: timestamp('executed_at', { withTimezone: true, mode: 'date' }),
  pnl: doublePrecision('pnl').default(0),
  commission: doublePrecision('commission').default(0),
  brokerExecutionId: text('broker_execution_id'),
  legacySourceTradeId: text('legacy_source_trade_id'),
  closeReason: text('close_reason'),
  rawSymbol: text('raw_symbol'),
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

