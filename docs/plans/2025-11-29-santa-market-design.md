# Santa Market - Design Document

**Date**: 2025-11-29
**Status**: Approved
**Hackathon**: AI Gateway Game Hackathon (Deadline: Dec 12, 2025)
**Category**: Simulation

---

## Overview

Santa Market is a Christmas-themed AI trading competition where 6 LLM models compete as portfolio managers, trading 5 fictional stocks over 14 simulated days. The simulation runs autonomously, and users watch a replay with full transparency into each model's reasoning.

### Key Differentiators

1. **Transparency Focus**: Two-phase model calls expose genuine reasoning, not just trades
2. **Scenario Variety**: Curated scenarios with distinct market conditions and scripted events

### Models

- GPT-4o
- Claude Sonnet
- Gemini Pro
- Grok
- Deepseek V3
- Llama 3.1 70B

### Tickers

| Ticker | Starting Price | Theme | Characteristics |
|--------|----------------|-------|-----------------|
| SANTA | $100 | Core holiday retail | Steady, holiday boost |
| REIN | $40 | Logistics | Stable |
| ELF | $20 | Labor | Volatile, strike risk |
| COAL | $5 | ESG-problematic | Downtrend, high volatility |
| GIFT | $80 | E-commerce | Growth |

---

## Tech Stack

- **Framework**: Next.js 15 (App Router), TypeScript
- **UI**: React + Tailwind
- **Backend**: Node/TS route handlers in same Next.js app
- **Models**: AI Gateway (6 models)
- **State**: In-memory per simulation run

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App                             │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React + Tailwind)                                    │
│  ├── Scenario selector                                          │
│  ├── Equity chart (all models over time)                        │
│  ├── Model Thoughts panel (reasoning per day)                   │
│  ├── Agent cards (portfolio breakdown per day)                  │
│  └── Replay controls                                            │
├─────────────────────────────────────────────────────────────────┤
│  API Routes                                                     │
│  └── POST /api/run-sim → runs full 14-day simulation            │
├─────────────────────────────────────────────────────────────────┤
│  Simulation Engine (pure TS)                                    │
│  ├── Market state machine (prices, macro, regime, events)       │
│  ├── Agent state tracking (cash, portfolio, equity history)     │
│  └── Two-phase model caller (analyze → trade)                   │
├─────────────────────────────────────────────────────────────────┤
│  AI Gateway                                                     │
│  └── 6 models × 14 days × 2 calls = 168 API calls per run       │
└─────────────────────────────────────────────────────────────────┘
```

---

## UI Layout (nof1.ai Style)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SANTA MARKET                           SCENARIOS ▼    [Run Simulation]     │
├─────────────────────────────────────────────────────────────────────────────┤
│  SANTA $102.30  REIN $41.20  ELF $18.50  COAL $4.80  GIFT $85.60           │
├───────────────────────────────────────────┬─────────────────────────────────┤
│                                           │  MODEL THOUGHTS         Day 7 ▼│
│   PORTFOLIO VALUE                         │  ─────────────────────────────  │
│   $120k ┤                                 │  GPT-4o | Aggressive    Day 7   │
│         │         ╭──── GPT-4o            │  "Holiday rush is peaking.      │
│   $110k ┤    ╭───╯                        │  SANTA momentum strong but I'm  │
│         │   ╱    ╭─── Claude              │  seeing ESG pressure on COAL.   │
│   $100k ┼──╳────╳─────────────            │  Rotating 20% from COAL to      │
│         │   ╲    ╰─── Gemini              │  GIFT for e-commerce upside."   │
│   $90k  ┤    ╰───╮                        │  → BUY GIFT x50, SELL COAL x200 │
│         │        ╰──── Grok               │  ─────────────────────────────  │
│   $80k  ┤                                 │  Claude | Conservative  Day 7   │
│         ├────┬────┬────┬────┬────┬────┬── │  "Maintaining defensive stance. │
│        D1   D3   D5   D7   D9  D11  D13   │  Labor disruption risk at 0.7   │
│                                           │  makes ELF too risky..."        │
│   Click chart to select day               │  → No trades                    │
├───────────────────────────────────────────┴─────────────────────────────────┤
│  DAY 7 DETAILS                                              [◀ Prev] [Next ▶]│
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ GPT-4o  #1  │ │ Claude  #2  │ │ Deepseek #3 │ │ Gemini  #4  │ ...        │
│  │ $112,340    │ │ $108,200    │ │ $106,800    │ │ $102,100    │            │
│  │ +12.3%      │ │ +8.2%       │ │ +6.8%       │ │ +2.1%       │            │
│  │ SANTA: 45%  │ │ SANTA: 60%  │ │ GIFT: 40%   │ │ REIN: 35%   │            │
│  │ GIFT:  30%  │ │ Cash:  25%  │ │ SANTA: 35%  │ │ SANTA: 30%  │            │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key UI Elements

| Element | Purpose |
|---------|---------|
| **Equity Chart** | Line chart, all 6 models, clickable to select day |
| **Model Thoughts Panel** | Scrollable feed of reasoning per model per day |
| **Day Selector** | Click chart or use prev/next to navigate days |
| **Agent Cards** | Portfolio allocation, rank, P&L for selected day |
| **Price Ticker** | Current prices for all 5 tickers |

### Interactions

- Click day on chart → updates Model Thoughts + Agent Cards to that day
- Filter Model Thoughts by model
- Expand reasoning to see full analysis
- Replay button animates through days automatically

---

## Two-Phase Model Calling

Each day, for each model, we make **two API calls** to capture genuine reasoning.

### Phase 1: Analysis (free-form thinking)

```
System: You are a SantaCorp portfolio manager. Analyze the market and explain your thinking.

User:
Day 7 of 14. Your portfolio: $108,200 cash, 150 SANTA, 0 REIN, 50 ELF, 0 COAL, 80 GIFT.

Current prices: SANTA $102.30, REIN $41.20, ELF $18.50, COAL $4.80, GIFT $85.60

Market conditions:
- Regime: holiday_rush (day 3 of phase)
- Consumer sentiment: 72/100
- Labor disruption risk: 0.7
- Events: "Elf union threatens overtime strike"

Analyze this situation. What do you observe? What risks and opportunities do you see?
```

### Phase 2: Trade Decision (structured JSON)

```
System: You are a SantaCorp portfolio manager. Output your trades as JSON only.

Constraints:
- Max 60% in any single ticker
- Max 20% in COAL
- No shorting

User:
Based on your analysis, what trades do you make today?
Return ONLY: { "orders": [{ "ticker": "...", "action": "BUY"|"SELL", "quantity": N }] }
```

### Storage per day

```ts
interface AgentDayLog {
  agentId: string;
  reasoning: string;      // Phase 1 output
  orders: Order[];        // Phase 2 output (validated)
  equity: number;
  violations: string[];
}
```

---

## Scenario System (Hybrid)

Each scenario combines **parameter overrides** + **scripted key events**.

### ScenarioConfig Type

```ts
interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  seed: number;

  // Parameter overrides
  initialPrices?: Partial<Prices>;
  macroOverrides?: Partial<MacroState>;
  regimeSchedule?: RegimePhase[];

  // Scripted events (1-2 per scenario)
  scriptedEvents: ScriptedEvent[];
}

interface ScriptedEvent {
  day: number;
  event: EventDescriptor;
  priceShock?: Partial<Record<Ticker, number>>;
}
```

### Curated Scenarios

| Scenario | Theme | Key Conditions | Scripted Events |
|----------|-------|----------------|-----------------|
| **Holiday Boom** | Bull market | High consumer sentiment (80+), low disruption risk | Day 5: "Record toy sales reported" (+10% SANTA) |
| **ESG Meltdown** | COAL crisis | COAL starts at $8, ESG pressure high | Day 4: "Major pension fund divests COAL" (-20% COAL) |
| **Supply Chain Chaos** | Volatility | High supply chain pressure, volatile regime | Day 6: "Port strike delays shipments" (-8% GIFT, -5% SANTA) |
| **Elf Strike** | Labor crisis | Labor risk 0.8, ELF starts higher ($25) | Day 3: "Elf union walks out" (-25% ELF), Day 10: "Strike resolved" (+15% ELF) |
| **Calm Q4** | Baseline | Default parameters, no scripted events | None - pure simulation |

---

## Market Simulation Engine

The engine is **deterministic** - same seed + scenario = same market movements.

### Price Evolution

```ts
newPrice = oldPrice × (1 + baseTrend + volatilityShock + newsShock + scriptedShock)
```

| Component | Source | Range |
|-----------|--------|-------|
| `baseTrend` | Ticker + regime phase | -0.1% to +0.4% daily |
| `volatilityShock` | RNG × baseVol × regimeMultiplier | ±2-4% |
| `newsShock` | Sum of event impacts | ±0.5-1.5% per event |
| `scriptedShock` | Scenario scripted events | ±5-25% (dramatic) |

### Ticker Profiles

```ts
const TICKER_PROFILES = {
  SANTA: { baseTrend: 0.002, baseVol: 0.02, regime: 'retail' },
  REIN:  { baseTrend: 0.001, baseVol: 0.018, regime: 'logistics' },
  ELF:   { baseTrend: 0.0005, baseVol: 0.025, regime: 'labor' },
  COAL:  { baseTrend: -0.001, baseVol: 0.03, regime: 'esg' },
  GIFT:  { baseTrend: 0.0015, baseVol: 0.02, regime: 'ecommerce' },
};
```

### Regime Phases

```
Days 1-4:   pre_season     → volatility 1.0×, mixed news
Days 5-10:  holiday_rush   → volatility 1.3×, retail positive bias
Days 11-14: post_peak      → volatility 1.4×, energy negative bias
```

### Macro State (random walk, bounded)

- `consumerSentiment`: 0-100, affects SANTA/GIFT trends
- `laborDisruptionRisk`: 0-1, affects ELF event probability
- `supplyChainPressure`: 0-100, affects all logistics
- `energyCostIndex`: 0.5-2.0, affects COAL sentiment

### Event Generation

```ts
// ~30% chance of random event per day
if (rng() < 0.3) {
  const ticker = weightedRandomTicker(rng, macro);
  const type = randomEventType(rng);
  const impact = macro.laborDisruptionRisk > 0.6 && ticker === 'ELF'
    ? 'negative' : randomImpact(rng);

  events.push({ ticker, type, impact, magnitude, message });
}
```

---

## Scoring System

### Formula

```ts
score = finalPortfolioValue
      - (violations × 1000)
      - (turnover × 0.0002)
      - (maxDrawdown × finalValue × 0.05)
```

| Component | Purpose | Example Impact |
|-----------|---------|----------------|
| `finalPortfolioValue` | Raw performance | $112,000 |
| `violations × 1000` | Punish constraint breaks | -3,000 (3 violations) |
| `turnover × 0.0002` | Discourage churning | -400 ($2M turnover) |
| `maxDrawdown × 0.05` | Reward risk management | -560 (10% drawdown) |

### Constraint Violations (each = -1000 points)

- Position > 60% of portfolio in single ticker
- COAL > 20% of portfolio
- Attempting to short (sell more than held)
- Invalid JSON response (orders ignored)
- Model timeout/error (orders ignored)

### Leaderboard Data

```ts
interface AgentScore {
  agentId: string;
  name: string;
  rank: number;
  finalValue: number;
  totalReturn: number;
  score: number;
  maxDrawdown: number;
  volatility: number;
  sharpeRatio: number;
  totalTrades: number;
  turnover: number;
  violations: string[];
  tradingStyle: 'aggressive' | 'conservative' | 'momentum' | 'contrarian';
}
```

### Trading Style Detection

```ts
function detectStyle(agent: AgentState): string {
  const avgTradesPerDay = agent.totalTrades / 14;
  const cashRatio = avgCashHeld / initialCash;

  if (avgTradesPerDay > 3 && cashRatio < 0.1) return 'aggressive';
  if (avgTradesPerDay < 1 && cashRatio > 0.3) return 'conservative';
  // momentum/contrarian based on buy/sell timing vs price trends
}
```

---

## File Structure

```
/sim
  types.ts          # All shared types
  engine.ts         # Market simulation engine
  scoring.ts        # Scoring functions
  agents.ts         # Agent configs and model caller
  scenarios.ts      # Scenario definitions

/app
  /api/run-sim/route.ts    # Simulation API endpoint
  page.tsx                  # Main UI
  /components
    EquityChart.tsx         # Line chart with day selection
    ModelThoughts.tsx       # Reasoning panel
    AgentCard.tsx           # Portfolio breakdown card
    ReplayControls.tsx      # Play/pause/speed controls
    ScenarioSelector.tsx    # Dropdown for scenarios
    Leaderboard.tsx         # Final standings table
```

---

## API Shape

### POST /api/run-sim

**Request**:
```json
{
  "scenarioId": "esg-meltdown"
}
```

**Response**:
```json
{
  "scenario": { "id": "esg-meltdown", "name": "ESG Meltdown", ... },
  "timeline": [
    {
      "day": 1,
      "prices": { "SANTA": 100.5, "REIN": 40.2, ... },
      "events": [],
      "agentLogs": [
        {
          "agentId": "gpt-4o",
          "reasoning": "Day 1, establishing initial positions...",
          "orders": [{ "ticker": "SANTA", "action": "BUY", "quantity": 100 }],
          "equity": 100000,
          "violations": []
        },
        ...
      ]
    },
    ...
  ],
  "scores": [
    { "agentId": "gpt-4o", "rank": 1, "finalValue": 112340, "score": 111380, ... },
    ...
  ]
}
```

---

## Milestones

1. **M1 - Core Engine**: Types, RNG, market init, price advancement, order validation, scoring
2. **M2 - API Route**: `/api/run-sim` with mock agents (no AI Gateway)
3. **M3 - Basic UI**: Fetch simulation, render JSON summary
4. **M4 - Full UI**: Equity chart, Model Thoughts panel, Agent cards, day selection
5. **M5 - AI Gateway**: Two-phase model calls, 6 real models
6. **M6 - Scenarios**: Implement 5 curated scenarios
7. **M7 - Polish**: Replay animations, shareable URLs, responsive design
