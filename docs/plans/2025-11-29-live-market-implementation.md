# Live Market Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Santa Market from simulation replay to a live, continuous market with AI agents reacting every 3 minutes.

**Architecture:** Vercel Cron triggers tick endpoint every 3 min → generates news, updates prices, calls AI agents → persists to Vercel Postgres → frontend polls for updates.

**Tech Stack:** Next.js 16, Vercel Postgres, Drizzle ORM, Vercel Cron, AI Gateway

---

## Task 1: Set Up Vercel Postgres + Drizzle ORM

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Create: `drizzle.config.ts`
- Modify: `package.json`

**Step 1: Install dependencies**

Run:
```bash
npm install drizzle-orm @vercel/postgres
npm install -D drizzle-kit
```

**Step 2: Create database schema**

Create `src/db/schema.ts`:
```typescript
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
```

**Step 3: Create database client**

Create `src/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
export * from './schema';
```

**Step 4: Create Drizzle config**

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
```

**Step 5: Add scripts to package.json**

Add to `package.json` scripts:
```json
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

**Step 6: Commit**

```bash
git add src/db/ drizzle.config.ts package.json package-lock.json
git commit -m "feat: add Vercel Postgres with Drizzle ORM schema"
```

---

## Task 2: Create News Generation System

**Files:**
- Create: `src/lib/news.ts`

**Step 1: Create news generator**

Create `src/lib/news.ts`:
```typescript
type Season = 'early_season' | 'peak_shopping' | 'crunch_time' | 'christmas_eve' | 'christmas_day' | 'post_christmas' | 'off_season';

interface NewsEvent {
  message: string;
  impact: Record<string, number>; // ticker -> % change
}

const NEWS_POOLS: Record<Season, NewsEvent[]> = {
  early_season: [
    { message: "Holiday shopping season kicks off with strong consumer enthusiasm", impact: { GIFT: 3, SANTA: 2 } },
    { message: "Retailers report early signs of robust gift demand", impact: { GIFT: 4, ELF: 2 } },
    { message: "Supply chains ramping up for peak season", impact: { REIN: 2, ELF: 1 } },
    { message: "Consumer confidence survey shows optimistic holiday outlook", impact: { GIFT: 3, SANTA: 2, ELF: 1 } },
    { message: "Early bird shoppers drive unexpected surge in pre-orders", impact: { GIFT: 5 } },
  ],
  peak_shopping: [
    { message: "Black Friday results exceed analyst expectations", impact: { GIFT: 6, SANTA: 3 } },
    { message: "Shipping carriers report operating at full capacity", impact: { REIN: 4, SANTA: 2 } },
    { message: "Popular toy shortages reported in key markets", impact: { GIFT: -3, ELF: 5 } },
    { message: "Record online sales strain fulfillment operations", impact: { SANTA: -2, GIFT: 4 } },
    { message: "Elf workforce expansion announced to meet demand", impact: { ELF: 6 } },
  ],
  crunch_time: [
    { message: "Last-minute shoppers flood stores as Christmas approaches", impact: { GIFT: 8, SANTA: 4 } },
    { message: "Express shipping premiums skyrocket amid delivery rush", impact: { REIN: 7, SANTA: 3 } },
    { message: "Elf overtime reaches record levels as deadline looms", impact: { ELF: 5, SANTA: 2 } },
    { message: "Will Santa deliver on time? Analysts express uncertainty", impact: { SANTA: -4, REIN: -2 } },
    { message: "Emergency coal reserves activated for naughty list surge", impact: { COAL: 10 } },
    { message: "Weather concerns threaten Christmas Eve operations", impact: { REIN: -6, SANTA: -5 } },
  ],
  christmas_eve: [
    { message: "It's Christmas Eve! Final deliveries underway worldwide", impact: { SANTA: 8, REIN: 6 } },
    { message: "Santa's sleigh tracking shows record-breaking efficiency", impact: { SANTA: 10, REIN: 5 } },
    { message: "Last-minute gift rush crashes online retailers", impact: { GIFT: -5, SANTA: 3 } },
    { message: "Reindeer team performing flawlessly under pressure", impact: { REIN: 8 } },
  ],
  christmas_day: [
    { message: "Christmas miracle: All gifts delivered successfully!", impact: { SANTA: 12, REIN: 8, ELF: 6 } },
    { message: "Holiday cheer at all-time high as families celebrate", impact: { GIFT: 5, SANTA: 4 } },
    { message: "Minor delivery delays disappoint some households", impact: { SANTA: -6, REIN: -4 } },
    { message: "Social media flooded with unboxing videos", impact: { GIFT: 4 } },
  ],
  post_christmas: [
    { message: "Returns flood in as holiday hangover begins", impact: { GIFT: -8 } },
    { message: "Coal sales spike as naughty list recipients seek revenge trades", impact: { COAL: 12 } },
    { message: "Year-end portfolio rebalancing drives volatility", impact: { SANTA: -3, ELF: -2, GIFT: -2 } },
    { message: "Analysts downgrade GIFT after disappointing return rates", impact: { GIFT: -6 } },
    { message: "Santa Corp announces vacation policy for exhausted workforce", impact: { ELF: -4, SANTA: -2 } },
  ],
  off_season: [
    { message: "Quiet period begins at North Pole operations", impact: { SANTA: -1, ELF: -2 } },
    { message: "Planning begins for next holiday season", impact: { SANTA: 1, ELF: 1 } },
    { message: "Reindeer herd reports healthy recovery after busy season", impact: { REIN: 2 } },
    { message: "Coal prices stabilize as demand normalizes", impact: { COAL: -2 } },
  ],
};

export function getSeasonalContext(date: Date): Season {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 12) {
    if (day <= 10) return 'early_season';
    if (day <= 17) return 'peak_shopping';
    if (day <= 23) return 'crunch_time';
    if (day === 24) return 'christmas_eve';
    if (day === 25) return 'christmas_day';
    return 'post_christmas';
  }
  return 'off_season';
}

export function generateNews(date: Date, random: () => number): NewsEvent | null {
  const season = getSeasonalContext(date);
  const pool = NEWS_POOLS[season];

  // 30% chance of news each tick
  if (random() > 0.3) {
    return null;
  }

  const index = Math.floor(random() * pool.length);
  return pool[index];
}

export function applyNewsToPrice(basePrice: number, impactPercent: number): number {
  return basePrice * (1 + impactPercent / 100);
}
```

**Step 2: Commit**

```bash
git add src/lib/news.ts
git commit -m "feat: add seasonal news generation system"
```

---

## Task 3: Create Market State Manager

**Files:**
- Create: `src/lib/market.ts`

**Step 1: Create market state manager**

Create `src/lib/market.ts`:
```typescript
import { db, marketState, agents, ticks, trades } from '@/db';
import { eq } from 'drizzle-orm';
import { generateNews, getSeasonalContext, applyNewsToPrice } from './news';

const TICKERS = ['SANTA', 'REIN', 'ELF', 'GIFT', 'COAL'] as const;

const INITIAL_PRICES: Record<string, number> = {
  SANTA: 100,
  REIN: 45,
  ELF: 75,
  GIFT: 80,
  COAL: 15,
};

const AGENTS_CONFIG = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'claude-sonnet', name: 'Claude Sonnet' },
  { id: 'gemini-pro', name: 'Gemini Pro' },
  { id: 'grok', name: 'Grok' },
  { id: 'deepseek', name: 'Deepseek V3' },
];

const INITIAL_CASH = 100000;
const TICK_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

export async function getMarketState() {
  const [state] = await db.select().from(marketState).where(eq(marketState.id, 1));
  return state;
}

export async function getAgents() {
  return db.select().from(agents).orderBy(agents.totalValue);
}

export async function getRecentTicks(limit = 50) {
  return db.select().from(ticks).orderBy(ticks.tickNumber).limit(limit);
}

export async function getRecentTrades(tickNumber: number) {
  return db.select().from(trades).where(eq(trades.tickNumber, tickNumber));
}

export async function initializeMarket() {
  const existing = await getMarketState();
  if (existing) return existing;

  const now = new Date();
  const nextTick = new Date(now.getTime() + TICK_INTERVAL_MS);

  // Initialize market state
  await db.insert(marketState).values({
    id: 1,
    tickNumber: 0,
    prices: INITIAL_PRICES,
    macro: { sentiment: 70, energy: 1.0, supplyChain: 50 },
    season: getSeasonalContext(now),
    currentNews: null,
    nextTickAt: nextTick,
  });

  // Initialize agents
  for (const agent of AGENTS_CONFIG) {
    await db.insert(agents).values({
      id: agent.id,
      name: agent.name,
      cash: INITIAL_CASH.toString(),
      holdings: { SANTA: 0, REIN: 0, ELF: 0, GIFT: 0, COAL: 0 },
      totalValue: INITIAL_CASH.toString(),
    });
  }

  return getMarketState();
}

function seededRandom(seed: number) {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

export async function advanceMarket(): Promise<{ news: any; prices: Record<string, number> }> {
  const state = await getMarketState();
  if (!state) throw new Error('Market not initialized');

  const now = new Date();
  const newTickNumber = state.tickNumber + 1;
  const random = seededRandom(now.getTime());

  // Generate news
  const news = generateNews(now, random);

  // Update prices with random walk + news impact
  const newPrices: Record<string, number> = {};
  for (const ticker of TICKERS) {
    let price = state.prices[ticker];

    // Random walk: ±0.5-2%
    const randomChange = (random() - 0.5) * 4; // -2% to +2%
    price = price * (1 + randomChange / 100);

    // Apply news impact if applicable
    if (news && news.impact[ticker]) {
      price = applyNewsToPrice(price, news.impact[ticker]);
    }

    // Clamp to reasonable bounds
    price = Math.max(1, Math.min(500, price));
    newPrices[ticker] = Math.round(price * 100) / 100;
  }

  // Update market state
  const nextTick = new Date(now.getTime() + TICK_INTERVAL_MS);
  await db.update(marketState).set({
    tickNumber: newTickNumber,
    prices: newPrices,
    season: getSeasonalContext(now),
    currentNews: news,
    nextTickAt: nextTick,
    updatedAt: now,
  }).where(eq(marketState.id, 1));

  // Record tick
  await db.insert(ticks).values({
    tickNumber: newTickNumber,
    prices: newPrices,
    news: news,
    season: getSeasonalContext(now),
  });

  return { news, prices: newPrices };
}

export async function updateAgentPortfolio(
  agentId: string,
  cash: number,
  holdings: Record<string, number>,
  prices: Record<string, number>
) {
  const totalValue = cash + TICKERS.reduce((sum, t) => sum + (holdings[t] || 0) * prices[t], 0);

  await db.update(agents).set({
    cash: cash.toString(),
    holdings,
    totalValue: totalValue.toString(),
    updatedAt: new Date(),
  }).where(eq(agents.id, agentId));
}

export async function recordTrade(
  tickNumber: number,
  agentId: string,
  reasoning: string,
  orders: Array<{ ticker: string; action: string; quantity: number; price: number }>
) {
  await db.insert(trades).values({
    tickNumber,
    agentId,
    reasoning,
    orders,
  });
}
```

**Step 2: Commit**

```bash
git add src/lib/market.ts
git commit -m "feat: add market state manager with database operations"
```

---

## Task 4: Create Cron Tick Endpoint

**Files:**
- Create: `src/app/api/cron/tick/route.ts`
- Create: `vercel.json`

**Step 1: Create tick endpoint**

Create `src/app/api/cron/tick/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { advanceMarket, getMarketState, getAgents, updateAgentPortfolio, recordTrade } from '@/lib/market';
import { callModelTwoPhase, MODEL_IDS } from '@/sim/ai-gateway';

const AGENTS_CONFIG = [
  { id: 'gpt-4o', name: 'GPT-4o', modelId: MODEL_IDS['gpt-4o'] },
  { id: 'claude-sonnet', name: 'Claude Sonnet', modelId: MODEL_IDS['claude-sonnet'] },
  { id: 'gemini-pro', name: 'Gemini Pro', modelId: MODEL_IDS['gemini-pro'] },
  { id: 'grok', name: 'Grok', modelId: MODEL_IDS['grok'] },
  { id: 'deepseek', name: 'Deepseek V3', modelId: MODEL_IDS['deepseek'] },
];

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Advance market (prices + news)
    const { news, prices } = await advanceMarket();
    const state = await getMarketState();
    if (!state) throw new Error('Failed to get market state');

    // 2. Get current agent portfolios
    const agentRows = await getAgents();

    // 3. Call all AI agents in parallel
    const agentCalls = AGENTS_CONFIG.map(async (config) => {
      const agentRow = agentRows.find(a => a.id === config.id);
      if (!agentRow) return null;

      const holdings = agentRow.holdings as Record<string, number>;
      const cash = parseFloat(agentRow.cash);

      // Build prompt context
      const turnState = {
        day: state.tickNumber,
        totalDays: 999, // continuous
        portfolio: { cash, holdings },
        prices: state.prices,
        priceHistory: {}, // TODO: add price history
        macro: state.macro,
        regime: { phase: state.season, daysInPhase: 1, volatilityMultiplier: 1 },
        events: news ? [{ message: news.message }] : [],
        constraints: { maxPositionPct: 0.6, maxCoalPct: 0.2, initialCash: 100000 },
      };

      try {
        const result = await callModelTwoPhase(
          { id: config.id, name: config.name, modelId: config.modelId, systemPrompt: 'You are a portfolio manager on the North Pole Stock Exchange.' },
          turnState as any
        );

        // Execute trades
        let newCash = cash;
        const newHoldings = { ...holdings };
        const executedOrders: Array<{ ticker: string; action: string; quantity: number; price: number }> = [];

        for (const order of result.orders) {
          const price = prices[order.ticker];
          if (order.action === 'BUY') {
            const cost = price * order.quantity;
            if (cost <= newCash) {
              newCash -= cost;
              newHoldings[order.ticker] = (newHoldings[order.ticker] || 0) + order.quantity;
              executedOrders.push({ ...order, price });
            }
          } else if (order.action === 'SELL') {
            if ((newHoldings[order.ticker] || 0) >= order.quantity) {
              newCash += price * order.quantity;
              newHoldings[order.ticker] -= order.quantity;
              executedOrders.push({ ...order, price });
            }
          }
        }

        // Update portfolio
        await updateAgentPortfolio(config.id, newCash, newHoldings, prices);

        // Record trade
        await recordTrade(state.tickNumber, config.id, result.reasoning, executedOrders);

        return { agentId: config.id, success: true };
      } catch (error) {
        console.error(`Agent ${config.id} failed:`, error);
        await recordTrade(state.tickNumber, config.id, `Error: ${error}`, []);
        return { agentId: config.id, success: false };
      }
    });

    await Promise.all(agentCalls);

    return NextResponse.json({
      success: true,
      tickNumber: state.tickNumber,
      news: news?.message || null,
    });
  } catch (error) {
    console.error('Tick failed:', error);
    return NextResponse.json({ error: 'Tick failed' }, { status: 500 });
  }
}
```

**Step 2: Create vercel.json for cron**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/tick",
      "schedule": "*/3 * * * *"
    }
  ]
}
```

**Step 3: Commit**

```bash
git add src/app/api/cron/tick/route.ts vercel.json
git commit -m "feat: add cron tick endpoint for live market updates"
```

---

## Task 5: Create Market API Endpoint

**Files:**
- Create: `src/app/api/market/route.ts`

**Step 1: Create market API**

Create `src/app/api/market/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { getMarketState, getAgents, getRecentTicks, getRecentTrades, initializeMarket } from '@/lib/market';

export async function GET() {
  try {
    // Ensure market is initialized
    let state = await getMarketState();
    if (!state) {
      state = await initializeMarket();
    }

    const [agentRows, recentTicks, recentTrades] = await Promise.all([
      getAgents(),
      getRecentTicks(50),
      state ? getRecentTrades(state.tickNumber) : [],
    ]);

    // Format agents with ranking
    const agents = agentRows
      .map(a => ({
        id: a.id,
        name: a.name,
        cash: parseFloat(a.cash),
        holdings: a.holdings,
        totalValue: parseFloat(a.totalValue),
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .map((a, i) => ({ ...a, rank: i + 1 }));

    // Format trades by agent
    const tradesByAgent: Record<string, any> = {};
    for (const trade of recentTrades) {
      tradesByAgent[trade.agentId] = {
        reasoning: trade.reasoning,
        orders: trade.orders,
      };
    }

    return NextResponse.json({
      tickNumber: state?.tickNumber || 0,
      prices: state?.prices || {},
      season: state?.season || 'off_season',
      news: state?.currentNews,
      nextTickAt: state?.nextTickAt,
      agents,
      tradesByAgent,
      priceHistory: recentTicks.map(t => ({
        tick: t.tickNumber,
        prices: t.prices,
        news: t.news,
      })),
    });
  } catch (error) {
    console.error('Market API error:', error);
    return NextResponse.json({ error: 'Failed to get market state' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/market/route.ts
git commit -m "feat: add market API endpoint for polling"
```

---

## Task 6: Update Frontend for Live Mode

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Rewrite page for live market**

Replace `src/app/page.tsx` with live market UI that:
- Polls `/api/market` every 15 seconds
- Shows countdown to next tick
- Displays current news
- Shows agent leaderboard with live rankings
- Shows recent trades

(This is a large file - implement based on the UI wireframe in the design doc)

**Key changes:**
1. Remove simulation trigger button
2. Add useEffect for polling every 15s
3. Add countdown timer component
4. Add news banner component
5. Update agent cards to show live data
6. Update chart to show live price history

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: update frontend for live market mode"
```

---

## Task 7: Add Environment Variables

**Files:**
- Create: `.env.example`

**Step 1: Document required env vars**

Create `.env.example`:
```bash
# Vercel Postgres (from Vercel dashboard)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=

# AI Gateway
AI_GATEWAY_API_KEY=

# Cron security (optional, auto-set by Vercel)
CRON_SECRET=
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add environment variables example"
```

---

## Task 8: Database Migration

**Step 1: Generate migration**

Run:
```bash
npm run db:generate
```

**Step 2: Push schema to database**

Run:
```bash
npm run db:push
```

**Step 3: Verify with studio**

Run:
```bash
npm run db:studio
```

---

## Deployment Checklist

1. [ ] Create Vercel Postgres database in Vercel dashboard
2. [ ] Copy env vars to Vercel project settings
3. [ ] Run `npm run db:push` with production connection
4. [ ] Deploy to Vercel
5. [ ] Verify cron job appears in Vercel dashboard
6. [ ] Trigger manual tick via `/api/cron/tick` to initialize
7. [ ] Watch market update every 3 minutes
