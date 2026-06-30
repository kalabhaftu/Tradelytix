import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, doublePrecision, json } from 'drizzle-orm/pg-core';
import { BacktestDirectionEnum, BacktestOutcomeEnum, BacktestSessionEnum, BacktestModelEnum } from './enums';
import { AdminFeatureFlag, AdminSharingPolicy, User, UserSettings, ImportJob, Notification, Feedback, UserGeoLog, SharedReport, Subscription, Synchronization } from './users';

export const BacktestTrade = pgTable('BacktestTrade', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull(),
  pair: text('pair').notNull(),
  direction: BacktestDirectionEnum('direction').notNull(),
  outcome: BacktestOutcomeEnum('outcome').notNull(),
  session: BacktestSessionEnum('session').notNull(),
  model: BacktestModelEnum('model').notNull(),
  customModel: text('custom_model'),
  riskRewardRatio: doublePrecision('riskRewardRatio').notNull(),
  entryPrice: doublePrecision('entryPrice').notNull(),
  stopLoss: doublePrecision('stopLoss').notNull(),
  takeProfit: doublePrecision('takeProfit').notNull(),
  exitPrice: doublePrecision('exitPrice').notNull(),
  pnl: doublePrecision('pnl').notNull(),
  imageOne: text('image_one'),
  imageTwo: text('image_two'),
  imageThree: text('image_three'),
  imageFour: text('image_four'),
  imageFive: text('image_five'),
  imageSix: text('image_six'),
  cardPreviewImage: text('card_preview_image'),
  notes: text('notes'),
  tags: text('tags').array().notNull(),
  dateExecuted: timestamp('dateExecuted', { withTimezone: true, mode: 'date' }).notNull(),
  backtestDate: timestamp('backtest_date', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull(),
  riskPoints: doublePrecision('riskPoints').default(0),
  rewardPoints: doublePrecision('rewardPoints').default(0),
});

export type BacktestTradeType = typeof BacktestTrade.$inferSelect;
export type NewBacktestTrade = typeof BacktestTrade.$inferInsert;

export const BacktestTradeRelations = relations(BacktestTrade, ({ one, many }) => ({
  User: one(User, {
    fields: [BacktestTrade.userId],
    references: [User.id]
  }),
}));

