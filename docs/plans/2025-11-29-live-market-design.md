# Santa Market: Live AI Trading Competition

## Overview

Transform Santa Market from a simulation replay into a **live, continuous market** where AI models compete as portfolio managers in real-time. The market ticks every 3 minutes, generating news and allowing AI agents to react to market conditions.

## Project Story

**What if Wall Street met the North Pole?**

Five AI models - GPT-4o, Claude, Gemini, Grok, and Deepseek - each start with $100,000 and must navigate the volatile Christmas market on the North Pole Stock Exchange.

**Tickers:**
- **$SANTA** - Santa Claus Enterprises (logistics & delivery)
- **$REIN** - Reindeer Transportation Corp (air freight)
- **$ELF** - Elf Manufacturing Inc (labor & production)
- **$GIFT** - Global Gift Industries (consumer goods)
- **$COAL** - North Pole Energy (commodities)

**Tagline:** "Five AIs. One market. Who survives Christmas?"

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL DEPLOYMENT                        │
├──────────────────────┬──────────────────────────────────────┤
│   Vercel Cron        │        Next.js App                   │
│   (every 3 min)      │                                       │
│         │            │   Frontend (React)                   │
│         ▼            │   - Polls /api/market every 15s      │
│   /api/cron/tick ────│   - Shows live prices, news          │
│                      │   - Agent cards & reasoning          │
│                      │   - Countdown to next tick           │
│                      │                                       │
│                      │   /api/market (GET)                  │
│                      │   - Returns current state            │
└──────────────────────┴──────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Vercel Postgres │
                    └─────────────────┘
```

## Tick Execution Flow

Every 3 minutes, the cron job executes:

1. **Generate News** - Roll for random events, check seasonal events
2. **Update Base Prices** - Random walk + news impact + macro conditions
3. **Call AI Agents** (parallel) - Send market state, receive orders
4. **Execute Trades** - Validate and apply orders, adjust prices ±10% based on volume
5. **Persist to Database** - Save tick, portfolios, trades, reasoning

## Seasonal News System

News is contextual based on real calendar date:

| Phase | Dates | News Themes |
|-------|-------|-------------|
| Early Season | Dec 1-10 | Shopping kickoff, supply chain prep |
| Peak Shopping | Dec 11-17 | Strong demand, shipping at capacity |
| Crunch Time | Dec 18-23 | Last-minute panic, elf overtime, shortages |
| Christmas Eve | Dec 24 | Final deliveries, binary outcomes |
| Christmas Day | Dec 25 | Relief rally or disappointment |
| Post-Christmas | Dec 26-31 | Returns, coal sales, rebalancing |
| Off-Season | Jan+ | Low volatility, planning for next year |

## Price Model

**Hybrid approach:**
- Base price from market engine (random walk + events)
- Agent trades add market impact: ±0-10% based on net buy/sell pressure

## Database Schema

```sql
-- Current market state (single row)
CREATE TABLE market_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  tick_number INTEGER NOT NULL,
  prices JSONB NOT NULL,
  macro JSONB NOT NULL,
  season TEXT NOT NULL,
  next_tick_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Historical tick records
CREATE TABLE ticks (
  id SERIAL PRIMARY KEY,
  tick_number INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  prices JSONB NOT NULL,
  news JSONB,
  season TEXT NOT NULL
);

-- Agent portfolios
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cash DECIMAL NOT NULL,
  holdings JSONB NOT NULL,
  total_value DECIMAL NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trade history with reasoning
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  tick_number INTEGER NOT NULL,
  agent_id TEXT NOT NULL,
  reasoning TEXT,
  orders JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Frontend UI Elements

1. **Price ticker bar** - All 5 stock prices with % change
2. **News banner** - Latest market-moving news with timestamp
3. **Countdown timer** - Progress bar to next tick, season indicator
4. **Price chart** - Historical prices over last 50 ticks
5. **Agent leaderboard** - Ranked by portfolio value, reasoning snippets
6. **Recent trades** - What each agent did last tick

## Tech Stack

- **Frontend:** Next.js 16, React, Tailwind CSS, Recharts
- **Backend:** Next.js API routes, Vercel Cron
- **Database:** Vercel Postgres
- **AI Gateway:** Vercel AI SDK with AI Gateway
- **Deployment:** Vercel

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Real-time updates | Polling (15s) | Simple, serverless-compatible |
| Tick scheduler | Vercel Cron | Native integration, free tier |
| Persistence | Vercel Postgres | Cheap, Vercel-native |
| Price model | Hybrid | Interesting dynamics, agents affect market |

## Migration from Simulation

The existing simulation code can be largely reused:
- Market engine (price generation, macro conditions)
- AI agent calling (two-phase prompting)
- Order validation and execution
- Scoring calculations

New code needed:
- Cron endpoint for tick execution
- Database layer (Drizzle ORM recommended)
- Market API endpoint for polling
- Frontend polling and countdown logic
- News generation system with seasonal awareness
