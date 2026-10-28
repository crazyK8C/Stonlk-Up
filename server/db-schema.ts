import {
  pgTable,
  uuid,
  text,
  integer,
  bigserial,
  bigint,
  timestamp,
  date,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import type { ContentQuestion } from '../shared/types.js';
export const users = pgTable('users', {
  id: uuid().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  password_hash: text().notNull(),
  xp: integer().notNull().default(0),
  coins: integer().notNull().default(0),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
export const concepts = pgTable('concepts', { id: text().primaryKey(), title: text().notNull() });
export const marketEvents = pgTable('market_events', {
  id: text().primaryKey(),
  title: text().notNull(),
  event_date: date({ mode: 'date' }),
  source_url: text().notNull(),
  verified: boolean().notNull().default(false),
});
export const questionContent = pgTable('questions', {
  id: text().primaryKey(),
  content: jsonb().$type<ContentQuestion>().notNull(),
  concept_id: text().references(() => concepts.id),
  event_id: text().references(() => marketEvents.id),
  published: boolean().notNull().default(true),
});
export const attempts = pgTable('attempts', {
  id: bigserial({ mode: 'number' }).primaryKey(),
  user_id: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  question_id: text()
    .notNull()
    .references(() => questionContent.id),
  option_id: text().notNull(),
  correct: boolean().notNull(),
  xp: integer().notNull(),
  coins: integer().notNull(),
  mode: text().notNull(),
  day: date({ mode: 'date' }).notNull(),
  at: timestamp({ withTimezone: true }).notNull(),
  duration: integer().notNull(),
  category: text().notNull(),
  difficulty: text().notNull().default('Beginner'),
  confidence: integer(),
});
export const xpTransactions = pgTable('xp_transactions', {
  attempt_id: bigint({ mode: 'number' })
    .primaryKey()
    .references(() => attempts.id),
  user_id: uuid()
    .notNull()
    .references(() => users.id),
  amount: integer().notNull(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
