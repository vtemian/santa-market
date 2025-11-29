# Santa Market Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Christmas-themed AI trading competition where 6 LLM models compete as portfolio managers over 14 days, with full transparency into their reasoning.

**Architecture:** Next.js 15 app with simulation engine in TypeScript, API route for running simulations, React frontend with nof1.ai-style UI (equity chart + model thoughts panel). Two-phase model calls via AI Gateway capture reasoning before trades.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, AI SDK + AI Gateway, Recharts (charts), Zod (validation)

---

## Phase 1: Project Setup

### Task 1.1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`

**Step 1: Create Next.js app with TypeScript and Tailwind**

Run:
```bash
cd /Users/whitemonk/projects/ai/santa-market
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

When prompted, accept defaults (Yes to all).

**Step 2: Verify installation**

Run: `npm run dev`

Expected: Server starts at http://localhost:3000

**Step 3: Stop dev server and commit**

```bash
git add -A
git commit -m "chore: initialize Next.js 15 with TypeScript and Tailwind"
```

---

### Task 1.2: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install production dependencies**

Run:
```bash
npm install zod recharts ai @ai-sdk/openai
```

**Step 2: Verify package.json updated**

Run: `cat package.json | grep -A5 '"dependencies"'`

Expected: Shows zod, recharts, ai, @ai-sdk/openai

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zod, recharts, ai-sdk dependencies"
```

---

## Phase 2: Simulation Engine - Types

### Task 2.1: Create Core Types

**Files:**
- Create: `src/sim/types.ts`

**Step 1: Create sim directory**

Run: `mkdir -p src/sim`

**Step 2: Write types file**

Create `src/sim/types.ts`:

```typescript
// Core domain types for Santa Market simulation

export type Ticker = 'SANTA' | 'REIN' | 'ELF' | 'COAL' | 'GIFT';

export const TICKERS: Ticker[] = ['SANTA', 'REIN', 'ELF', 'COAL', 'GIFT'];

export type Prices = Record<Ticker, number>;

// ─────────────────────────────────────────────────────────────
// Market State
// ─────────────────────────────────────────────────────────────

export interface MacroState {
  consumerSentiment: number;      // 0-100
  laborDisruptionRisk: number;    // 0-1
  supplyChainPressure: number;    // 0-100
  energyCostIndex: number;        // 0.5-2.0
}

export type RegimePhase = 'pre_season' | 'holiday_rush' | 'post_peak';

export interface RegimeState {
  phase: RegimePhase;
  daysInPhase: number;
  volatilityMultiplier: number;
}

export interface EventDescriptor {
  ticker: Ticker | 'ALL';
  type: 'labor' | 'esg' | 'weather' | 'demand' | 'ops';
  impact: 'positive' | 'negative';
  magnitude: 'small' | 'medium' | 'large';
  message: string;
}

export interface MarketState {
  day: number;
  totalDays: number;
  prices: Prices;
  priceHistory: Record<Ticker, number[]>;
  macro: MacroState;
  regime: RegimeState;
  events: EventDescriptor[];
}

// ─────────────────────────────────────────────────────────────
// Agent Types
// ─────────────────────────────────────────────────────────────

export type OrderAction = 'BUY' | 'SELL';

export interface Order {
  ticker: Ticker;
  action: OrderAction;
  quantity: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  modelId: string;
  systemPrompt: string;
}

export interface Portfolio {
  cash: number;
  holdings: Record<Ticker, number>;
}

export interface AgentState {
  config: AgentConfig;
  portfolio: Portfolio;
  equityHistory: number[];
  violations: string[];
  turnover: number;
  totalTrades: number;
}

// ─────────────────────────────────────────────────────────────
// Turn State (what the model sees)
// ─────────────────────────────────────────────────────────────

export interface TurnState {
  day: number;
  totalDays: number;
  portfolio: Portfolio;
  prices: Prices;
  priceHistory: Record<Ticker, number[]>;
  macro: MacroState;
  regime: RegimeState;
  events: EventDescriptor[];
  constraints: Constraints;
}

export interface Constraints {
  maxPositionPct: number;    // 0.6 = 60%
  maxCoalPct: number;        // 0.2 = 20%
  initialCash: number;       // 100000
}

// ─────────────────────────────────────────────────────────────
// Simulation Results
// ─────────────────────────────────────────────────────────────

export interface AgentDayLog {
  agentId: string;
  reasoning: string;
  orders: Order[];
  equity: number;
  violations: string[];
}

export interface DaySnapshot {
  day: number;
  prices: Prices;
  events: EventDescriptor[];
  agentLogs: AgentDayLog[];
}

export type TradingStyle = 'aggressive' | 'conservative' | 'momentum' | 'contrarian';

export interface AgentScore {
  agentId: string;
  name: string;
  rank: number;
  finalValue: number;
  totalReturn: number;
  score: number;
  maxDrawdown: number;
  totalTrades: number;
  turnover: number;
  violations: string[];
  tradingStyle: TradingStyle;
}

export interface SimulationResult {
  scenarioId: string;
  timeline: DaySnapshot[];
  scores: AgentScore[];
}

// ─────────────────────────────────────────────────────────────
// Scenario Types
// ─────────────────────────────────────────────────────────────

export interface ScriptedEvent {
  day: number;
  event: EventDescriptor;
  priceShock?: Partial<Record<Ticker, number>>;
}

export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  seed: number;
  initialPrices?: Partial<Prices>;
  macroOverrides?: Partial<MacroState>;
  scriptedEvents: ScriptedEvent[];
}

// ─────────────────────────────────────────────────────────────
// Simulation Config
// ─────────────────────────────────────────────────────────────

export interface SimulationConfig {
  scenario: ScenarioConfig;
  totalDays: number;
  constraints: Constraints;
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 4: Commit**

```bash
git add src/sim/types.ts
git commit -m "feat(sim): add core type definitions"
```

---

### Task 2.2: Create Zod Schemas for Validation

**Files:**
- Create: `src/sim/schemas.ts`

**Step 1: Write schemas file**

Create `src/sim/schemas.ts`:

```typescript
import { z } from 'zod';
import { TICKERS } from './types';

export const TickerSchema = z.enum(['SANTA', 'REIN', 'ELF', 'COAL', 'GIFT']);

export const OrderSchema = z.object({
  ticker: TickerSchema,
  action: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
});

export const AgentOutputSchema = z.object({
  orders: z.array(OrderSchema),
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;

export function parseAgentOutput(raw: string): AgentOutput | null {
  try {
    // Strip markdown code fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    const result = AgentOutputSchema.safeParse(parsed);

    if (result.success) {
      return result.data;
    }
    return null;
  } catch {
    return null;
  }
}
```

**Step 2: Verify compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 3: Commit**

```bash
git add src/sim/schemas.ts
git commit -m "feat(sim): add Zod schemas for agent output validation"
```

---

## Phase 3: Simulation Engine - Core

### Task 3.1: Implement RNG and Market Initialization

**Files:**
- Create: `src/sim/engine.ts`
- Create: `src/sim/__tests__/engine.test.ts`

**Step 1: Create test directory**

Run: `mkdir -p src/sim/__tests__`

**Step 2: Write failing test for RNG**

Create `src/sim/__tests__/engine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createRng, initMarketState } from '../engine';
import { TICKERS } from '../types';

describe('createRng', () => {
  it('produces deterministic sequence for same seed', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);

    const seq1 = [rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2()];

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(43);

    expect(rng1()).not.toEqual(rng2());
  });

  it('produces values between 0 and 1', () => {
    const rng = createRng(12345);

    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe('initMarketState', () => {
  it('initializes with correct starting prices', () => {
    const rng = createRng(42);
    const market = initMarketState(14, rng);

    expect(market.prices.SANTA).toBe(100);
    expect(market.prices.REIN).toBe(40);
    expect(market.prices.ELF).toBe(20);
    expect(market.prices.COAL).toBe(5);
    expect(market.prices.GIFT).toBe(80);
  });

  it('initializes price history with starting prices', () => {
    const rng = createRng(42);
    const market = initMarketState(14, rng);

    for (const ticker of TICKERS) {
      expect(market.priceHistory[ticker]).toHaveLength(1);
      expect(market.priceHistory[ticker][0]).toBe(market.prices[ticker]);
    }
  });

  it('starts at day 0 with pre_season regime', () => {
    const rng = createRng(42);
    const market = initMarketState(14, rng);

    expect(market.day).toBe(0);
    expect(market.totalDays).toBe(14);
    expect(market.regime.phase).toBe('pre_season');
  });
});
```

**Step 3: Install vitest**

Run: `npm install -D vitest @vitejs/plugin-react`

**Step 4: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 5: Add test script to package.json**

Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 6: Run test to verify it fails**

Run: `npm run test:run`

Expected: FAIL - module './engine' not found

**Step 7: Write implementation**

Create `src/sim/engine.ts`:

```typescript
import {
  Ticker,
  TICKERS,
  Prices,
  MacroState,
  RegimeState,
  MarketState,
  EventDescriptor,
} from './types';

// ─────────────────────────────────────────────────────────────
// Deterministic RNG (Mulberry32)
// ─────────────────────────────────────────────────────────────

export type Rng = () => number;

export function createRng(seed: number): Rng {
  let state = seed;
  return function(): number {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────
// Default Starting Values
// ─────────────────────────────────────────────────────────────

const DEFAULT_PRICES: Prices = {
  SANTA: 100,
  REIN: 40,
  ELF: 20,
  COAL: 5,
  GIFT: 80,
};

const DEFAULT_MACRO: MacroState = {
  consumerSentiment: 60,
  laborDisruptionRisk: 0.4,
  supplyChainPressure: 40,
  energyCostIndex: 1.0,
};

// ─────────────────────────────────────────────────────────────
// Market Initialization
// ─────────────────────────────────────────────────────────────

export function initMarketState(totalDays: number, rng: Rng): MarketState {
  const prices = { ...DEFAULT_PRICES };

  const priceHistory: Record<Ticker, number[]> = {
    SANTA: [prices.SANTA],
    REIN: [prices.REIN],
    ELF: [prices.ELF],
    COAL: [prices.COAL],
    GIFT: [prices.GIFT],
  };

  const regime: RegimeState = {
    phase: 'pre_season',
    daysInPhase: 0,
    volatilityMultiplier: 1.0,
  };

  return {
    day: 0,
    totalDays,
    prices,
    priceHistory,
    macro: { ...DEFAULT_MACRO },
    regime,
    events: [],
  };
}
```

**Step 8: Run test to verify it passes**

Run: `npm run test:run`

Expected: All tests PASS

**Step 9: Commit**

```bash
git add src/sim/engine.ts src/sim/__tests__/engine.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat(sim): add RNG and market initialization"
```

---

### Task 3.2: Implement Price Advancement

**Files:**
- Modify: `src/sim/engine.ts`
- Modify: `src/sim/__tests__/engine.test.ts`

**Step 1: Add failing tests for advanceMarket**

Append to `src/sim/__tests__/engine.test.ts`:

```typescript
import { createRng, initMarketState, advanceMarket } from '../engine';

describe('advanceMarket', () => {
  it('increments day', () => {
    const rng = createRng(42);
    let market = initMarketState(14, rng);

    market = advanceMarket(market, rng);
    expect(market.day).toBe(1);

    market = advanceMarket(market, rng);
    expect(market.day).toBe(2);
  });

  it('updates prices (deterministically)', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);

    let market1 = initMarketState(14, rng1);
    let market2 = initMarketState(14, rng2);

    market1 = advanceMarket(market1, rng1);
    market2 = advanceMarket(market2, rng2);

    expect(market1.prices).toEqual(market2.prices);
  });

  it('appends to price history', () => {
    const rng = createRng(42);
    let market = initMarketState(14, rng);

    market = advanceMarket(market, rng);

    for (const ticker of TICKERS) {
      expect(market.priceHistory[ticker]).toHaveLength(2);
    }
  });

  it('transitions regime phases correctly', () => {
    const rng = createRng(42);
    let market = initMarketState(14, rng);

    // Days 1-4: pre_season
    for (let i = 1; i <= 4; i++) {
      market = advanceMarket(market, rng);
      expect(market.regime.phase).toBe('pre_season');
    }

    // Days 5-10: holiday_rush
    market = advanceMarket(market, rng);
    expect(market.regime.phase).toBe('holiday_rush');

    // Skip to day 11
    for (let i = 6; i <= 10; i++) {
      market = advanceMarket(market, rng);
    }
    expect(market.regime.phase).toBe('holiday_rush');

    // Day 11+: post_peak
    market = advanceMarket(market, rng);
    expect(market.regime.phase).toBe('post_peak');
  });

  it('keeps prices positive', () => {
    const rng = createRng(42);
    let market = initMarketState(14, rng);

    for (let i = 0; i < 14; i++) {
      market = advanceMarket(market, rng);
      for (const ticker of TICKERS) {
        expect(market.prices[ticker]).toBeGreaterThan(0);
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run`

Expected: FAIL - advanceMarket not exported

**Step 3: Implement advanceMarket**

Add to `src/sim/engine.ts`:

```typescript
// ─────────────────────────────────────────────────────────────
// Ticker Profiles
// ─────────────────────────────────────────────────────────────

interface TickerProfile {
  baseTrend: number;
  baseVol: number;
}

const TICKER_PROFILES: Record<Ticker, TickerProfile> = {
  SANTA: { baseTrend: 0.002, baseVol: 0.02 },
  REIN: { baseTrend: 0.001, baseVol: 0.018 },
  ELF: { baseTrend: 0.0005, baseVol: 0.025 },
  COAL: { baseTrend: -0.001, baseVol: 0.03 },
  GIFT: { baseTrend: 0.0015, baseVol: 0.02 },
};

// ─────────────────────────────────────────────────────────────
// Regime Calculation
// ─────────────────────────────────────────────────────────────

function calculateRegime(day: number, totalDays: number, prevRegime: RegimeState): RegimeState {
  const fraction = day / totalDays;

  let phase: RegimeState['phase'];
  let volatilityMultiplier: number;

  if (fraction <= 4 / 14) {
    phase = 'pre_season';
    volatilityMultiplier = 1.0;
  } else if (fraction <= 10 / 14) {
    phase = 'holiday_rush';
    volatilityMultiplier = 1.3;
  } else {
    phase = 'post_peak';
    volatilityMultiplier = 1.4;
  }

  const daysInPhase = phase === prevRegime.phase ? prevRegime.daysInPhase + 1 : 1;

  return { phase, daysInPhase, volatilityMultiplier };
}

// ─────────────────────────────────────────────────────────────
// Price Calculation
// ─────────────────────────────────────────────────────────────

function calculateNewsShock(ticker: Ticker, events: EventDescriptor[]): number {
  let shock = 0;

  for (const event of events) {
    if (event.ticker === ticker || event.ticker === 'ALL') {
      const mag = event.magnitude === 'small' ? 0.005
        : event.magnitude === 'medium' ? 0.01
        : 0.015;
      shock += event.impact === 'positive' ? mag : -mag;
    }
  }

  return shock;
}

function advancePrices(
  prices: Prices,
  regime: RegimeState,
  events: EventDescriptor[],
  rng: Rng
): Prices {
  const newPrices = { ...prices };

  for (const ticker of TICKERS) {
    const profile = TICKER_PROFILES[ticker];

    // Regime-adjusted trend
    let trend = profile.baseTrend;
    if (regime.phase === 'holiday_rush' && (ticker === 'SANTA' || ticker === 'GIFT')) {
      trend *= 1.5;
    }

    // Volatility shock
    const vol = profile.baseVol * regime.volatilityMultiplier;
    const volShock = (rng() * 2 - 1) * vol;

    // News shock
    const newsShock = calculateNewsShock(ticker, events);

    // Calculate new price (minimum 0.01)
    const change = 1 + trend + volShock + newsShock;
    newPrices[ticker] = Math.max(0.01, prices[ticker] * change);
  }

  return newPrices;
}

// ─────────────────────────────────────────────────────────────
// Macro Update
// ─────────────────────────────────────────────────────────────

function advanceMacro(macro: MacroState, rng: Rng): MacroState {
  const jitter = (range: number) => (rng() * 2 - 1) * range;

  return {
    consumerSentiment: Math.max(0, Math.min(100, macro.consumerSentiment + jitter(3))),
    laborDisruptionRisk: Math.max(0, Math.min(1, macro.laborDisruptionRisk + jitter(0.05))),
    supplyChainPressure: Math.max(0, Math.min(100, macro.supplyChainPressure + jitter(3))),
    energyCostIndex: Math.max(0.5, Math.min(2, macro.energyCostIndex + jitter(0.05))),
  };
}

// ─────────────────────────────────────────────────────────────
// Event Generation
// ─────────────────────────────────────────────────────────────

const EVENT_MESSAGES: Record<string, string[]> = {
  labor_negative: [
    'Elf union threatens overtime strike',
    'Workshop workers demand better conditions',
    'Labor negotiations stall at North Pole',
  ],
  labor_positive: [
    'New labor agreement reached',
    'Worker productivity hits record high',
    'Union approves new contract',
  ],
  esg_negative: [
    'Environmental groups target COAL operations',
    'ESG fund announces divestment',
    'Carbon emissions report sparks concern',
  ],
  demand_positive: [
    'Holiday shopping season exceeds expectations',
    'Consumer confidence surges',
    'Online sales break records',
  ],
};

function generateEvents(macro: MacroState, rng: Rng): EventDescriptor[] {
  const events: EventDescriptor[] = [];

  // ~30% chance of an event
  if (rng() < 0.3) {
    const ticker = TICKERS[Math.floor(rng() * TICKERS.length)];
    const types: EventDescriptor['type'][] = ['labor', 'esg', 'weather', 'demand', 'ops'];
    const type = types[Math.floor(rng() * types.length)];

    // Labor events more likely negative when risk is high
    let impact: EventDescriptor['impact'];
    if (type === 'labor' && macro.laborDisruptionRisk > 0.6) {
      impact = 'negative';
    } else {
      impact = rng() > 0.5 ? 'positive' : 'negative';
    }

    const magnitudes: EventDescriptor['magnitude'][] = ['small', 'medium', 'large'];
    const magnitude = magnitudes[Math.floor(rng() * magnitudes.length)];

    const messageKey = `${type}_${impact}`;
    const messages = EVENT_MESSAGES[messageKey] || [`${ticker} faces ${type} ${impact === 'positive' ? 'boost' : 'pressure'}`];
    const message = messages[Math.floor(rng() * messages.length)];

    events.push({ ticker, type, impact, magnitude, message });
  }

  return events;
}

// ─────────────────────────────────────────────────────────────
// Main Market Advancement
// ─────────────────────────────────────────────────────────────

export function advanceMarket(market: MarketState, rng: Rng): MarketState {
  const day = market.day + 1;
  const regime = calculateRegime(day, market.totalDays, market.regime);
  const macro = advanceMacro(market.macro, rng);
  const events = generateEvents(macro, rng);
  const prices = advancePrices(market.prices, regime, events, rng);

  const priceHistory: Record<Ticker, number[]> = {
    SANTA: [...market.priceHistory.SANTA, prices.SANTA],
    REIN: [...market.priceHistory.REIN, prices.REIN],
    ELF: [...market.priceHistory.ELF, prices.ELF],
    COAL: [...market.priceHistory.COAL, prices.COAL],
    GIFT: [...market.priceHistory.GIFT, prices.GIFT],
  };

  return {
    ...market,
    day,
    prices,
    priceHistory,
    macro,
    regime,
    events,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/sim/engine.ts src/sim/__tests__/engine.test.ts
git commit -m "feat(sim): add market price advancement"
```

---

### Task 3.3: Implement Agent Initialization and Order Application

**Files:**
- Modify: `src/sim/engine.ts`
- Modify: `src/sim/__tests__/engine.test.ts`

**Step 1: Add failing tests for agent functions**

Append to `src/sim/__tests__/engine.test.ts`:

```typescript
import {
  createRng,
  initMarketState,
  advanceMarket,
  initAgentState,
  applyOrders,
  computeEquity,
} from '../engine';
import { AgentConfig, Order, Constraints } from '../types';

const testAgentConfig: AgentConfig = {
  id: 'test-agent',
  name: 'Test Agent',
  modelId: 'test-model',
  systemPrompt: 'Test prompt',
};

const testConstraints: Constraints = {
  maxPositionPct: 0.6,
  maxCoalPct: 0.2,
  initialCash: 100000,
};

describe('initAgentState', () => {
  it('initializes with correct cash and empty holdings', () => {
    const agent = initAgentState(testAgentConfig, testConstraints);

    expect(agent.portfolio.cash).toBe(100000);
    expect(agent.portfolio.holdings.SANTA).toBe(0);
    expect(agent.portfolio.holdings.COAL).toBe(0);
    expect(agent.equityHistory).toEqual([]);
    expect(agent.violations).toEqual([]);
    expect(agent.turnover).toBe(0);
  });
});

describe('computeEquity', () => {
  it('computes equity correctly', () => {
    const agent = initAgentState(testAgentConfig, testConstraints);
    agent.portfolio.cash = 50000;
    agent.portfolio.holdings.SANTA = 100;

    const prices = { SANTA: 100, REIN: 40, ELF: 20, COAL: 5, GIFT: 80 };
    const equity = computeEquity(agent.portfolio, prices);

    expect(equity).toBe(50000 + 100 * 100); // 60000
  });
});

describe('applyOrders', () => {
  it('executes valid BUY order', () => {
    const agent = initAgentState(testAgentConfig, testConstraints);
    const prices = { SANTA: 100, REIN: 40, ELF: 20, COAL: 5, GIFT: 80 };
    const orders: Order[] = [{ ticker: 'SANTA', action: 'BUY', quantity: 100 }];

    const result = applyOrders(agent, orders, prices, testConstraints);

    expect(result.appliedOrders).toHaveLength(1);
    expect(agent.portfolio.holdings.SANTA).toBe(100);
    expect(agent.portfolio.cash).toBe(100000 - 100 * 100);
    expect(result.violations).toHaveLength(0);
  });

  it('executes valid SELL order', () => {
    const agent = initAgentState(testAgentConfig, testConstraints);
    agent.portfolio.holdings.SANTA = 100;
    agent.portfolio.cash = 90000;

    const prices = { SANTA: 100, REIN: 40, ELF: 20, COAL: 5, GIFT: 80 };
    const orders: Order[] = [{ ticker: 'SANTA', action: 'SELL', quantity: 50 }];

    const result = applyOrders(agent, orders, prices, testConstraints);

    expect(result.appliedOrders).toHaveLength(1);
    expect(agent.portfolio.holdings.SANTA).toBe(50);
    expect(agent.portfolio.cash).toBe(90000 + 50 * 100);
  });

  it('rejects BUY when insufficient cash', () => {
    const agent = initAgentState(testAgentConfig, testConstraints);
    const prices = { SANTA: 100, REIN: 40, ELF: 20, COAL: 5, GIFT: 80 };
    const orders: Order[] = [{ ticker: 'SANTA', action: 'BUY', quantity: 2000 }];

    const result = applyOrders(agent, orders, prices, testConstraints);

    expect(result.appliedOrders).toHaveLength(0);
    expect(result.violations).toContain('Insufficient cash for BUY SANTA x2000');
  });

  it('rejects SELL when insufficient holdings', () => {
    const agent = initAgentState(testAgentConfig, testConstraints);
    const prices = { SANTA: 100, REIN: 40, ELF: 20, COAL: 5, GIFT: 80 };
    const orders: Order[] = [{ ticker: 'SANTA', action: 'SELL', quantity: 100 }];

    const result = applyOrders(agent, orders, prices, testConstraints);

    expect(result.appliedOrders).toHaveLength(0);
    expect(result.violations).toContain('No holdings to SELL SANTA');
  });

  it('flags position limit violation', () => {
    const agent = initAgentState(testAgentConfig, testConstraints);
    const prices = { SANTA: 100, REIN: 40, ELF: 20, COAL: 5, GIFT: 80 };
    // Buy 700 SANTA = $70,000, which is 70% of $100k portfolio
    const orders: Order[] = [{ ticker: 'SANTA', action: 'BUY', quantity: 700 }];

    const result = applyOrders(agent, orders, prices, testConstraints);

    expect(result.appliedOrders).toHaveLength(1);
    expect(result.violations.some(v => v.includes('Position limit exceeded'))).toBe(true);
  });

  it('flags COAL limit violation', () => {
    const agent = initAgentState(testAgentConfig, testConstraints);
    const prices = { SANTA: 100, REIN: 40, ELF: 20, COAL: 5, GIFT: 80 };
    // Buy 5000 COAL = $25,000, which is 25% > 20% limit
    const orders: Order[] = [{ ticker: 'COAL', action: 'BUY', quantity: 5000 }];

    const result = applyOrders(agent, orders, prices, testConstraints);

    expect(result.appliedOrders).toHaveLength(1);
    expect(result.violations.some(v => v.includes('COAL exposure'))).toBe(true);
  });

  it('calculates turnover correctly', () => {
    const agent = initAgentState(testAgentConfig, testConstraints);
    const prices = { SANTA: 100, REIN: 40, ELF: 20, COAL: 5, GIFT: 80 };
    const orders: Order[] = [
      { ticker: 'SANTA', action: 'BUY', quantity: 100 },
      { ticker: 'REIN', action: 'BUY', quantity: 50 },
    ];

    const result = applyOrders(agent, orders, prices, testConstraints);

    expect(result.turnoverDelta).toBe(100 * 100 + 50 * 40);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run`

Expected: FAIL - functions not exported

**Step 3: Implement agent functions**

Add to `src/sim/engine.ts`:

```typescript
import {
  Ticker,
  TICKERS,
  Prices,
  MacroState,
  RegimeState,
  MarketState,
  EventDescriptor,
  AgentConfig,
  AgentState,
  Portfolio,
  Order,
  Constraints,
} from './types';

// ... existing code ...

// ─────────────────────────────────────────────────────────────
// Agent Initialization
// ─────────────────────────────────────────────────────────────

export function initAgentState(config: AgentConfig, constraints: Constraints): AgentState {
  const portfolio: Portfolio = {
    cash: constraints.initialCash,
    holdings: {
      SANTA: 0,
      REIN: 0,
      ELF: 0,
      COAL: 0,
      GIFT: 0,
    },
  };

  return {
    config,
    portfolio,
    equityHistory: [],
    violations: [],
    turnover: 0,
    totalTrades: 0,
  };
}

// ─────────────────────────────────────────────────────────────
// Equity Calculation
// ─────────────────────────────────────────────────────────────

export function computeEquity(portfolio: Portfolio, prices: Prices): number {
  let equity = portfolio.cash;

  for (const ticker of TICKERS) {
    equity += portfolio.holdings[ticker] * prices[ticker];
  }

  return equity;
}

// ─────────────────────────────────────────────────────────────
// Order Application
// ─────────────────────────────────────────────────────────────

interface ApplyOrdersResult {
  appliedOrders: Order[];
  violations: string[];
  turnoverDelta: number;
}

export function applyOrders(
  agent: AgentState,
  orders: Order[],
  prices: Prices,
  constraints: Constraints
): ApplyOrdersResult {
  const applied: Order[] = [];
  const violations: string[] = [];
  let turnover = 0;

  for (const order of orders) {
    const { ticker, action, quantity } = order;

    if (!TICKERS.includes(ticker)) {
      violations.push(`Invalid ticker: ${ticker}`);
      continue;
    }

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      violations.push(`Invalid quantity: ${quantity}`);
      continue;
    }

    const price = prices[ticker];
    const notional = quantity * price;

    if (action === 'BUY') {
      if (notional > agent.portfolio.cash) {
        violations.push(`Insufficient cash for BUY ${ticker} x${quantity}`);
        continue;
      }

      agent.portfolio.cash -= notional;
      agent.portfolio.holdings[ticker] += quantity;
      turnover += notional;
      applied.push(order);
      agent.totalTrades++;

    } else if (action === 'SELL') {
      const held = agent.portfolio.holdings[ticker];

      if (held <= 0) {
        violations.push(`No holdings to SELL ${ticker}`);
        continue;
      }

      const actualQuantity = Math.min(quantity, held);
      const actualNotional = actualQuantity * price;

      agent.portfolio.cash += actualNotional;
      agent.portfolio.holdings[ticker] -= actualQuantity;
      turnover += actualNotional;
      applied.push({ ...order, quantity: actualQuantity });
      agent.totalTrades++;
    }
  }

  // Check constraints after applying orders
  const constraintViolations = checkConstraints(agent.portfolio, prices, constraints);
  violations.push(...constraintViolations);

  return { appliedOrders: applied, violations, turnoverDelta: turnover };
}

function checkConstraints(
  portfolio: Portfolio,
  prices: Prices,
  constraints: Constraints
): string[] {
  const violations: string[] = [];
  const equity = computeEquity(portfolio, prices);

  if (equity <= 0) return violations;

  // Check position limits
  for (const ticker of TICKERS) {
    const positionValue = portfolio.holdings[ticker] * prices[ticker];
    const pct = positionValue / equity;

    if (pct > constraints.maxPositionPct + 0.0001) {
      violations.push(
        `Position limit exceeded for ${ticker}: ${(pct * 100).toFixed(1)}% > ${constraints.maxPositionPct * 100}%`
      );
    }
  }

  // Check COAL limit
  const coalValue = portfolio.holdings.COAL * prices.COAL;
  const coalPct = coalValue / equity;

  if (coalPct > constraints.maxCoalPct + 0.0001) {
    violations.push(
      `COAL exposure ${(coalPct * 100).toFixed(1)}% > max ${constraints.maxCoalPct * 100}%`
    );
  }

  return violations;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/sim/engine.ts src/sim/__tests__/engine.test.ts
git commit -m "feat(sim): add agent initialization and order application"
```

---

### Task 3.4: Implement Scoring System

**Files:**
- Create: `src/sim/scoring.ts`
- Create: `src/sim/__tests__/scoring.test.ts`

**Step 1: Write failing tests for scoring**

Create `src/sim/__tests__/scoring.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeMaxDrawdown, scoreAgent, detectTradingStyle } from '../scoring';
import { AgentState, AgentConfig, Prices } from '../types';

const testConfig: AgentConfig = {
  id: 'test',
  name: 'Test',
  modelId: 'test',
  systemPrompt: '',
};

const testPrices: Prices = {
  SANTA: 100,
  REIN: 40,
  ELF: 20,
  COAL: 5,
  GIFT: 80,
};

describe('computeMaxDrawdown', () => {
  it('returns 0 for monotonically increasing series', () => {
    const series = [100, 110, 120, 130, 140];
    expect(computeMaxDrawdown(series)).toBe(0);
  });

  it('computes drawdown correctly', () => {
    const series = [100, 120, 90, 100, 80];
    // Peak at 120, lowest after peak is 80
    // Drawdown = (120 - 80) / 120 = 0.333...
    expect(computeMaxDrawdown(series)).toBeCloseTo(0.333, 2);
  });

  it('handles empty series', () => {
    expect(computeMaxDrawdown([])).toBe(0);
  });
});

describe('scoreAgent', () => {
  it('scores based on final value minus penalties', () => {
    const agent: AgentState = {
      config: testConfig,
      portfolio: { cash: 50000, holdings: { SANTA: 500, REIN: 0, ELF: 0, COAL: 0, GIFT: 0 } },
      equityHistory: [100000, 105000, 100000],
      violations: ['test violation'],
      turnover: 200000,
      totalTrades: 10,
    };

    const score = scoreAgent(agent, testPrices);

    // Final value = 50000 + 500*100 = 100000
    expect(score.finalValue).toBe(100000);
    expect(score.totalReturn).toBe(0); // (100000 - 100000) / 100000

    // Score = 100000 - 1000 (violation) - 40 (turnover) - drawdown penalty
    expect(score.score).toBeLessThan(100000);
    expect(score.violations).toContain('test violation');
  });
});

describe('detectTradingStyle', () => {
  it('detects aggressive style', () => {
    const agent: AgentState = {
      config: testConfig,
      portfolio: { cash: 1000, holdings: { SANTA: 900, REIN: 0, ELF: 0, COAL: 0, GIFT: 0 } },
      equityHistory: Array(14).fill(100000),
      violations: [],
      turnover: 500000,
      totalTrades: 50,
    };

    expect(detectTradingStyle(agent, 100000)).toBe('aggressive');
  });

  it('detects conservative style', () => {
    const agent: AgentState = {
      config: testConfig,
      portfolio: { cash: 80000, holdings: { SANTA: 200, REIN: 0, ELF: 0, COAL: 0, GIFT: 0 } },
      equityHistory: Array(14).fill(100000),
      violations: [],
      turnover: 20000,
      totalTrades: 2,
    };

    expect(detectTradingStyle(agent, 100000)).toBe('conservative');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run`

Expected: FAIL - module '../scoring' not found

**Step 3: Implement scoring functions**

Create `src/sim/scoring.ts`:

```typescript
import { AgentState, AgentScore, TradingStyle, Prices, TICKERS } from './types';
import { computeEquity } from './engine';

export function computeMaxDrawdown(series: number[]): number {
  if (series.length === 0) return 0;

  let peak = series[0];
  let maxDrawdown = 0;

  for (const value of series) {
    if (value > peak) {
      peak = value;
    }

    const drawdown = peak > 0 ? (peak - value) / peak : 0;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

export function detectTradingStyle(agent: AgentState, initialCash: number): TradingStyle {
  const totalDays = agent.equityHistory.length || 14;
  const avgTradesPerDay = agent.totalTrades / totalDays;

  // Compute average cash ratio
  const currentCash = agent.portfolio.cash;
  const equity = agent.equityHistory[agent.equityHistory.length - 1] || initialCash;
  const cashRatio = equity > 0 ? currentCash / equity : 1;

  if (avgTradesPerDay >= 3 && cashRatio < 0.15) {
    return 'aggressive';
  }

  if (avgTradesPerDay < 1 && cashRatio > 0.3) {
    return 'conservative';
  }

  // Could analyze buy/sell timing vs price trends for momentum/contrarian
  // For now, default to momentum
  return 'momentum';
}

export function scoreAgent(agent: AgentState, prices: Prices): AgentScore {
  const finalValue = computeEquity(agent.portfolio, prices);
  const initialValue = 100000; // TODO: pass as parameter
  const totalReturn = (finalValue - initialValue) / initialValue;

  const maxDrawdown = computeMaxDrawdown(agent.equityHistory);

  // Penalties
  const violationPenalty = agent.violations.length * 1000;
  const turnoverPenalty = agent.turnover * 0.0002;
  const drawdownPenalty = maxDrawdown * finalValue * 0.05;

  const score = finalValue - violationPenalty - turnoverPenalty - drawdownPenalty;

  const tradingStyle = detectTradingStyle(agent, initialValue);

  return {
    agentId: agent.config.id,
    name: agent.config.name,
    rank: 0, // Set later when ranking all agents
    finalValue,
    totalReturn,
    score,
    maxDrawdown,
    totalTrades: agent.totalTrades,
    turnover: agent.turnover,
    violations: agent.violations,
    tradingStyle,
  };
}

export function rankAgents(scores: AgentScore[]): AgentScore[] {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return sorted.map((score, index) => ({
    ...score,
    rank: index + 1,
  }));
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/sim/scoring.ts src/sim/__tests__/scoring.test.ts
git commit -m "feat(sim): add scoring system"
```

---

### Task 3.5: Implement Scenario System

**Files:**
- Create: `src/sim/scenarios.ts`
- Create: `src/sim/__tests__/scenarios.test.ts`

**Step 1: Write failing test**

Create `src/sim/__tests__/scenarios.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { SCENARIOS, getScenario, applyScriptedEvents } from '../scenarios';
import { initMarketState, createRng } from '../engine';

describe('SCENARIOS', () => {
  it('has at least 5 scenarios', () => {
    expect(Object.keys(SCENARIOS).length).toBeGreaterThanOrEqual(5);
  });

  it('each scenario has required fields', () => {
    for (const scenario of Object.values(SCENARIOS)) {
      expect(scenario.id).toBeDefined();
      expect(scenario.name).toBeDefined();
      expect(scenario.description).toBeDefined();
      expect(scenario.seed).toBeDefined();
      expect(scenario.scriptedEvents).toBeDefined();
    }
  });
});

describe('getScenario', () => {
  it('returns scenario by id', () => {
    const scenario = getScenario('calm-q4');
    expect(scenario?.name).toBe('Calm Q4');
  });

  it('returns undefined for unknown id', () => {
    expect(getScenario('nonexistent')).toBeUndefined();
  });
});

describe('applyScriptedEvents', () => {
  it('applies price shocks on scripted day', () => {
    const rng = createRng(42);
    let market = initMarketState(14, rng);

    const scenario = getScenario('esg-meltdown')!;

    // Advance to scripted event day
    for (let i = 0; i < 4; i++) {
      market.day = i + 1;
      market = applyScriptedEvents(market, scenario, market.day);
    }

    // Day 4 should have ESG event
    expect(market.events.some(e => e.ticker === 'COAL')).toBe(true);
  });

  it('does not apply events on non-scripted days', () => {
    const rng = createRng(42);
    const market = initMarketState(14, rng);

    const scenario = getScenario('calm-q4')!;
    const result = applyScriptedEvents(market, scenario, 1);

    // Calm Q4 has no scripted events
    expect(result.events).toEqual(market.events);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run`

Expected: FAIL - module '../scenarios' not found

**Step 3: Implement scenarios**

Create `src/sim/scenarios.ts`:

```typescript
import { ScenarioConfig, MarketState, EventDescriptor, Ticker } from './types';

export const SCENARIOS: Record<string, ScenarioConfig> = {
  'calm-q4': {
    id: 'calm-q4',
    name: 'Calm Q4',
    description: 'Baseline scenario with default parameters and no scripted events',
    seed: 12345,
    scriptedEvents: [],
  },

  'holiday-boom': {
    id: 'holiday-boom',
    name: 'Holiday Boom',
    description: 'Bull market with high consumer sentiment and record sales',
    seed: 54321,
    macroOverrides: {
      consumerSentiment: 85,
      laborDisruptionRisk: 0.2,
    },
    scriptedEvents: [
      {
        day: 5,
        event: {
          ticker: 'SANTA',
          type: 'demand',
          impact: 'positive',
          magnitude: 'large',
          message: 'Record toy sales reported across all major retailers',
        },
        priceShock: { SANTA: 0.10, GIFT: 0.05 },
      },
    ],
  },

  'esg-meltdown': {
    id: 'esg-meltdown',
    name: 'ESG Meltdown',
    description: 'Environmental crisis triggers COAL sell-off',
    seed: 98765,
    initialPrices: { COAL: 8 },
    macroOverrides: {
      energyCostIndex: 1.5,
    },
    scriptedEvents: [
      {
        day: 4,
        event: {
          ticker: 'COAL',
          type: 'esg',
          impact: 'negative',
          magnitude: 'large',
          message: 'Major pension funds announce complete COAL divestment',
        },
        priceShock: { COAL: -0.20 },
      },
    ],
  },

  'supply-chain-chaos': {
    id: 'supply-chain-chaos',
    name: 'Supply Chain Chaos',
    description: 'Port strikes and logistics disruptions cause volatility',
    seed: 11111,
    macroOverrides: {
      supplyChainPressure: 80,
    },
    scriptedEvents: [
      {
        day: 6,
        event: {
          ticker: 'ALL',
          type: 'ops',
          impact: 'negative',
          magnitude: 'large',
          message: 'Major port strike delays holiday shipments worldwide',
        },
        priceShock: { GIFT: -0.08, SANTA: -0.05, REIN: -0.03 },
      },
    ],
  },

  'elf-strike': {
    id: 'elf-strike',
    name: 'Elf Strike',
    description: 'Labor crisis at the North Pole workshop',
    seed: 22222,
    initialPrices: { ELF: 25 },
    macroOverrides: {
      laborDisruptionRisk: 0.8,
    },
    scriptedEvents: [
      {
        day: 3,
        event: {
          ticker: 'ELF',
          type: 'labor',
          impact: 'negative',
          magnitude: 'large',
          message: 'Elf union walks out! Production halted at North Pole',
        },
        priceShock: { ELF: -0.25 },
      },
      {
        day: 10,
        event: {
          ticker: 'ELF',
          type: 'labor',
          impact: 'positive',
          magnitude: 'medium',
          message: 'Strike resolved! Elves return to work with new contract',
        },
        priceShock: { ELF: 0.15 },
      },
    ],
  },
};

export function getScenario(id: string): ScenarioConfig | undefined {
  return SCENARIOS[id];
}

export function getAllScenarios(): ScenarioConfig[] {
  return Object.values(SCENARIOS);
}

export function applyScriptedEvents(
  market: MarketState,
  scenario: ScenarioConfig,
  day: number
): MarketState {
  const scriptedForDay = scenario.scriptedEvents.filter(e => e.day === day);

  if (scriptedForDay.length === 0) {
    return market;
  }

  const newEvents = [...market.events];
  const newPrices = { ...market.prices };

  for (const scripted of scriptedForDay) {
    newEvents.push(scripted.event);

    if (scripted.priceShock) {
      for (const [ticker, shock] of Object.entries(scripted.priceShock)) {
        newPrices[ticker as Ticker] *= (1 + shock);
      }
    }
  }

  return {
    ...market,
    events: newEvents,
    prices: newPrices,
  };
}

export function applyScenarioOverrides(
  market: MarketState,
  scenario: ScenarioConfig
): MarketState {
  let result = { ...market };

  if (scenario.initialPrices) {
    result.prices = { ...result.prices, ...scenario.initialPrices };
  }

  if (scenario.macroOverrides) {
    result.macro = { ...result.macro, ...scenario.macroOverrides };
  }

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/sim/scenarios.ts src/sim/__tests__/scenarios.test.ts
git commit -m "feat(sim): add scenario system with 5 curated scenarios"
```

---

### Task 3.6: Implement Main Simulation Runner

**Files:**
- Create: `src/sim/runner.ts`
- Create: `src/sim/__tests__/runner.test.ts`

**Step 1: Write failing test**

Create `src/sim/__tests__/runner.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { runSimulation } from '../runner';
import { AgentConfig, TurnState, Order } from '../types';
import { getScenario } from '../scenarios';

// Mock model caller that always buys SANTA
const mockModelCaller = async (
  agent: AgentConfig,
  state: TurnState
): Promise<{ reasoning: string; orders: Order[] }> => {
  return {
    reasoning: `Day ${state.day}: I think SANTA is a good buy.`,
    orders: state.day === 1 ? [{ ticker: 'SANTA', action: 'BUY', quantity: 100 }] : [],
  };
};

describe('runSimulation', () => {
  it('runs complete simulation', async () => {
    const scenario = getScenario('calm-q4')!;
    const agents: AgentConfig[] = [
      { id: 'test-1', name: 'Test 1', modelId: 'test', systemPrompt: '' },
      { id: 'test-2', name: 'Test 2', modelId: 'test', systemPrompt: '' },
    ];

    const result = await runSimulation({
      scenario,
      agents,
      totalDays: 14,
      modelCaller: mockModelCaller,
    });

    expect(result.timeline).toHaveLength(14);
    expect(result.scores).toHaveLength(2);
    expect(result.scenarioId).toBe('calm-q4');
  });

  it('captures reasoning in day logs', async () => {
    const scenario = getScenario('calm-q4')!;
    const agents: AgentConfig[] = [
      { id: 'test-1', name: 'Test 1', modelId: 'test', systemPrompt: '' },
    ];

    const result = await runSimulation({
      scenario,
      agents,
      totalDays: 3,
      modelCaller: mockModelCaller,
    });

    const day1Log = result.timeline[0].agentLogs[0];
    expect(day1Log.reasoning).toContain('Day 1');
  });

  it('applies orders and tracks equity', async () => {
    const scenario = getScenario('calm-q4')!;
    const agents: AgentConfig[] = [
      { id: 'test-1', name: 'Test 1', modelId: 'test', systemPrompt: '' },
    ];

    const result = await runSimulation({
      scenario,
      agents,
      totalDays: 3,
      modelCaller: mockModelCaller,
    });

    // After day 1, should have bought 100 SANTA
    const day1Log = result.timeline[0].agentLogs[0];
    expect(day1Log.orders).toHaveLength(1);
    expect(day1Log.orders[0].ticker).toBe('SANTA');
  });

  it('ranks agents by score', async () => {
    const scenario = getScenario('calm-q4')!;
    const agents: AgentConfig[] = [
      { id: 'test-1', name: 'Test 1', modelId: 'test', systemPrompt: '' },
      { id: 'test-2', name: 'Test 2', modelId: 'test', systemPrompt: '' },
    ];

    const result = await runSimulation({
      scenario,
      agents,
      totalDays: 3,
      modelCaller: mockModelCaller,
    });

    expect(result.scores[0].rank).toBe(1);
    expect(result.scores[1].rank).toBe(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run`

Expected: FAIL - module '../runner' not found

**Step 3: Implement simulation runner**

Create `src/sim/runner.ts`:

```typescript
import {
  AgentConfig,
  AgentState,
  AgentDayLog,
  DaySnapshot,
  SimulationResult,
  TurnState,
  Order,
  Constraints,
  ScenarioConfig,
  TICKERS,
} from './types';
import {
  createRng,
  initMarketState,
  advanceMarket,
  initAgentState,
  applyOrders,
  computeEquity,
} from './engine';
import { applyScriptedEvents, applyScenarioOverrides } from './scenarios';
import { scoreAgent, rankAgents } from './scoring';

export type ModelCaller = (
  agent: AgentConfig,
  state: TurnState
) => Promise<{ reasoning: string; orders: Order[] }>;

interface RunSimulationParams {
  scenario: ScenarioConfig;
  agents: AgentConfig[];
  totalDays: number;
  modelCaller: ModelCaller;
}

const DEFAULT_CONSTRAINTS: Constraints = {
  maxPositionPct: 0.6,
  maxCoalPct: 0.2,
  initialCash: 100000,
};

export async function runSimulation(
  params: RunSimulationParams
): Promise<SimulationResult> {
  const { scenario, agents: agentConfigs, totalDays, modelCaller } = params;

  const rng = createRng(scenario.seed);
  let market = initMarketState(totalDays, rng);
  market = applyScenarioOverrides(market, scenario);

  const agents: AgentState[] = agentConfigs.map(config =>
    initAgentState(config, DEFAULT_CONSTRAINTS)
  );

  const timeline: DaySnapshot[] = [];

  for (let day = 1; day <= totalDays; day++) {
    // Advance market (prices, macro, regime, random events)
    market = advanceMarket(market, rng);

    // Apply scripted events for this day
    market = applyScriptedEvents(market, scenario, day);

    const agentLogs: AgentDayLog[] = [];

    for (const agent of agents) {
      // Build turn state for this agent
      const turnState = buildTurnState(market, agent, DEFAULT_CONSTRAINTS);

      // Call model (two phases handled by caller)
      let reasoning = '';
      let orders: Order[] = [];

      try {
        const response = await modelCaller(agent.config, turnState);
        reasoning = response.reasoning;
        orders = response.orders;
      } catch (error) {
        reasoning = 'Model call failed';
        orders = [];
        agent.violations.push('Model error: no orders');
      }

      // Apply orders
      const { appliedOrders, violations, turnoverDelta } = applyOrders(
        agent,
        orders,
        market.prices,
        DEFAULT_CONSTRAINTS
      );

      agent.turnover += turnoverDelta;
      agent.violations.push(...violations);

      // Record equity
      const equity = computeEquity(agent.portfolio, market.prices);
      agent.equityHistory.push(equity);

      agentLogs.push({
        agentId: agent.config.id,
        reasoning,
        orders: appliedOrders,
        equity,
        violations,
      });
    }

    timeline.push({
      day,
      prices: { ...market.prices },
      events: [...market.events],
      agentLogs,
    });
  }

  // Score and rank agents
  const scores = agents.map(agent => scoreAgent(agent, market.prices));
  const rankedScores = rankAgents(scores);

  return {
    scenarioId: scenario.id,
    timeline,
    scores: rankedScores,
  };
}

function buildTurnState(
  market: import('./types').MarketState,
  agent: AgentState,
  constraints: Constraints
): TurnState {
  return {
    day: market.day,
    totalDays: market.totalDays,
    portfolio: { ...agent.portfolio },
    prices: { ...market.prices },
    priceHistory: {
      SANTA: [...market.priceHistory.SANTA].slice(-30),
      REIN: [...market.priceHistory.REIN].slice(-30),
      ELF: [...market.priceHistory.ELF].slice(-30),
      COAL: [...market.priceHistory.COAL].slice(-30),
      GIFT: [...market.priceHistory.GIFT].slice(-30),
    },
    macro: { ...market.macro },
    regime: { ...market.regime },
    events: [...market.events],
    constraints,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/sim/runner.ts src/sim/__tests__/runner.test.ts
git commit -m "feat(sim): add main simulation runner"
```

---

## Phase 4: API Route

### Task 4.1: Create Simulation API Endpoint

**Files:**
- Create: `src/app/api/run-sim/route.ts`

**Step 1: Write the API route**

Create `src/app/api/run-sim/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { runSimulation, ModelCaller } from '@/sim/runner';
import { getScenario, getAllScenarios } from '@/sim/scenarios';
import { AgentConfig, TurnState, Order } from '@/sim/types';
import { parseAgentOutput } from '@/sim/schemas';

// Agent configurations (will be moved to separate file later)
const AGENTS: AgentConfig[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    modelId: 'gpt-4o',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    modelId: 'claude-3-5-sonnet-20241022',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    modelId: 'gemini-1.5-pro',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'grok',
    name: 'Grok',
    modelId: 'grok-beta',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'deepseek',
    name: 'Deepseek V3',
    modelId: 'deepseek-chat',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'llama',
    name: 'Llama 3.1 70B',
    modelId: 'llama-3.1-70b-versatile',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
];

// Mock model caller for testing (replace with AI Gateway later)
const mockModelCaller: ModelCaller = async (agent, state) => {
  // Simulate some basic trading logic
  const orders: Order[] = [];

  if (state.day === 1) {
    // Initial position: buy some SANTA
    orders.push({ ticker: 'SANTA', action: 'BUY', quantity: 200 });
  } else if (state.day === 7 && state.regime.phase === 'holiday_rush') {
    // Add to position during holiday rush
    orders.push({ ticker: 'GIFT', action: 'BUY', quantity: 100 });
  }

  const reasoning = `Day ${state.day}: Market in ${state.regime.phase} phase. ` +
    `Consumer sentiment at ${state.macro.consumerSentiment.toFixed(0)}. ` +
    (orders.length > 0
      ? `Executing ${orders.length} trade(s).`
      : 'Holding current positions.');

  return { reasoning, orders };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scenarioId = body.scenarioId || 'calm-q4';

    const scenario = getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json(
        { error: `Unknown scenario: ${scenarioId}` },
        { status: 400 }
      );
    }

    const result = await runSimulation({
      scenario,
      agents: AGENTS,
      totalDays: 14,
      modelCaller: mockModelCaller, // TODO: Replace with real AI Gateway caller
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: 'Simulation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return list of available scenarios
  const scenarios = getAllScenarios().map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
  }));

  return NextResponse.json({ scenarios });
}
```

**Step 2: Test the API manually**

Run: `npm run dev`

Then in another terminal:
```bash
curl -X POST http://localhost:3000/api/run-sim -H "Content-Type: application/json" -d '{"scenarioId": "calm-q4"}'
```

Expected: JSON response with timeline and scores

**Step 3: Commit**

```bash
git add src/app/api/run-sim/route.ts
git commit -m "feat(api): add simulation API endpoint"
```

---

## Phase 5: Frontend - Basic Structure

### Task 5.1: Create Page Layout and Types

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/components/types.ts`

**Step 1: Create shared frontend types**

Create `src/app/components/types.ts`:

```typescript
// Re-export types needed by frontend
export type {
  Ticker,
  Prices,
  Order,
  AgentDayLog,
  DaySnapshot,
  AgentScore,
  SimulationResult,
  ScenarioConfig,
} from '@/sim/types';

export interface ScenarioOption {
  id: string;
  name: string;
  description: string;
}
```

**Step 2: Create basic page structure**

Replace `src/app/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { SimulationResult, ScenarioOption } from './components/types';

export default function Home() {
  const [scenarios, setScenarios] = useState<ScenarioOption[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('calm-q4');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch scenarios on mount
  useState(() => {
    fetch('/api/run-sim')
      .then(res => res.json())
      .then(data => setScenarios(data.scenarios))
      .catch(err => console.error('Failed to load scenarios:', err));
  });

  const runSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/run-sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: selectedScenario }),
      });

      if (!res.ok) {
        throw new Error('Simulation failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-green-400 mb-2">
          🎄 Santa Market
        </h1>
        <p className="text-slate-400">
          AI models compete as portfolio managers in a Christmas-themed market
        </p>
      </header>

      <div className="flex gap-4 mb-8">
        <select
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-4 py-2"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-6 py-2 rounded font-semibold"
        >
          {loading ? 'Running...' : 'Run Simulation'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-8">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Final Standings</h2>
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Model</th>
                    <th className="px-4 py-3 text-right">Final Value</th>
                    <th className="px-4 py-3 text-right">Return</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-left">Style</th>
                  </tr>
                </thead>
                <tbody>
                  {result.scores.map((score) => (
                    <tr key={score.agentId} className="border-t border-slate-700">
                      <td className="px-4 py-3">
                        {score.rank === 1 ? '🥇' : score.rank === 2 ? '🥈' : score.rank === 3 ? '🥉' : score.rank}
                      </td>
                      <td className="px-4 py-3 font-medium">{score.name}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        ${score.finalValue.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${
                        score.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(score.totalReturn * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {score.score.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-400 capitalize">
                        {score.tradingStyle}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Timeline ({result.timeline.length} days)
            </h2>
            <pre className="bg-slate-800 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(result.timeline, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </main>
  );
}
```

**Step 3: Verify page loads**

Run: `npm run dev`

Open http://localhost:3000 and verify the page loads with scenario selector and run button.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/components/types.ts
git commit -m "feat(ui): add basic page structure with scenario selector"
```

---

## Phase 6: Frontend - Full UI Components

*Continue with Tasks 6.1-6.5 for:*
- EquityChart component (using Recharts)
- ModelThoughts panel
- AgentCard component
- ReplayControls
- Integration and animations

---

## Phase 7: AI Gateway Integration

*Tasks for:*
- Create AI Gateway client wrapper
- Implement two-phase model calling
- Connect to real models

---

## Phase 8: Polish

*Tasks for:*
- Shareable URLs with scenario in query params
- Responsive design
- Loading states and animations
- Error handling improvements

---

## Verification Checklist

Before considering this implementation complete:

- [ ] All tests pass (`npm run test:run`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] Dev server runs (`npm run dev`)
- [ ] Simulation runs end-to-end with mock models
- [ ] UI displays results correctly
- [ ] AI Gateway connected and working
- [ ] All 5 scenarios functional
- [ ] Deployed to Vercel
