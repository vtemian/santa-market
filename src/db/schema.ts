import { pgTable, serial, text, integer, decimal, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const marketState = pgTable('market_state', {
  id: integer('id').primaryKey().default(1),
  tickNumber: integer('tick_number').notNull(),
  prices: jsonb('prices').notNull().$type<Record<string, number>>(),
  macro: jsonb('macro').notNull().$type<{ sentiment: number; energy: number; supplyChain: number }>(),
  season: text('season').notNull(),
  currentNews: jsonb('current_news').$type<{ message: string; impact: Record<string, number> } | null>(),
  nextTickAt: timestamp('next_tick_at').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const ticks = pgTable('ticks', {
  id: serial('id').primaryKey(),
  tickNumber: integer('tick_number').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  prices: jsonb('prices').notNull().$type<Record<string, number>>(),
  news: jsonb('news').$type<{ message: string; impact: Record<string, number> } | null>(),
  season: text('season').notNull(),
});

export const agents = pgTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  cash: decimal('cash', { precision: 12, scale: 2 }).notNull(),
  holdings: jsonb('holdings').notNull().$type<Record<string, number>>(),
  totalValue: decimal('total_value', { precision: 12, scale: 2 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const trades = pgTable('trades', {
  id: serial('id').primaryKey(),
  tickNumber: integer('tick_number').notNull(),
  agentId: text('agent_id').notNull(),
  reasoning: text('reasoning'),
  orders: jsonb('orders').$type<Array<{ ticker: string; action: string; quantity: number; price: number }>>(),
  timestamp: timestamp('timestamp').defaultNow(),
});
