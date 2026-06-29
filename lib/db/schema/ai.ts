import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, doublePrecision, json } from 'drizzle-orm/pg-core';
import { AdminFeatureFlag, AdminSharingPolicy, User, UserSettings, ImportJob, Notification, Feedback, UserGeoLog, SharedReport, Subscription, Synchronization } from './users';
import { FeedbackReply, DonationAddress, SiteUiSettings, ErrorLog, PaymentRecord, PromoCode, PromoRedemption, FreeAccessInvite, AIChatMessage, AdminAISetting, AIChatUsageLog } from './misc';

export const WeeklyAIReview = pgTable('weekly_a_i_review', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull(),
  weekStart: timestamp('weekStart', { withTimezone: true, mode: 'date' }).notNull(),
  weekEnd: timestamp('weekEnd', { withTimezone: true, mode: 'date' }).notNull(),
  summary: text('summary').notNull(),
  highlights: jsonb('highlights').default('[]'),
  lowlights: jsonb('lowlights').default('[]'),
  stats: jsonb('stats').default('{}'),
  grade: text('grade').default(''),
  focusNextWeek: text('focus_next_week'),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export type WeeklyAIReviewType = typeof WeeklyAIReview.$inferSelect;
export type NewWeeklyAIReview = typeof WeeklyAIReview.$inferInsert;

export const AIChat = pgTable('a_i_chat', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull(),
  title: text('title').default('New Conversation'),
  isPinned: boolean('isPinned').default(false),
  isArchived: boolean('isArchived').default(false),
  isDeleted: boolean('isDeleted').default(false),
  accounts: text('accounts').array().notNull(),
  dateRange: text('dateRange').notNull(),
  customFrom: timestamp('custom_from', { withTimezone: true, mode: 'date' }),
  customTo: timestamp('custom_to', { withTimezone: true, mode: 'date' }),
  dataSources: text('dataSources').array().notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull(),
});

export type AIChatType = typeof AIChat.$inferSelect;
export type NewAIChat = typeof AIChat.$inferInsert;

export const AISavedInsight = pgTable('a_i_saved_insight', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').default('insight'),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull(),
});

export type AISavedInsightType = typeof AISavedInsight.$inferSelect;
export type NewAISavedInsight = typeof AISavedInsight.$inferInsert;

export const WeeklyAIReviewRelations = relations(WeeklyAIReview, ({ one, many }) => ({
  User: one(User, {
    fields: [WeeklyAIReview.userId],
    references: [User.id]
  }),
}));

export const AIChatRelations = relations(AIChat, ({ one, many }) => ({
  User: one(User, {
    fields: [AIChat.userId],
    references: [User.id]
  }),
  messages: many(AIChatMessage),
}));

export const AISavedInsightRelations = relations(AISavedInsight, ({ one, many }) => ({
  User: one(User, {
    fields: [AISavedInsight.userId],
    references: [User.id]
  }),
}));

