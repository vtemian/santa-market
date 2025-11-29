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
// Trade History (for agent memory)
// ─────────────────────────────────────────────────────────────

export interface TradeHistoryEntry {
  tick: number;
  orders: Array<{ ticker: string; action: string; quantity: number; price: number }>;
  reasoning: string;
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
  tradeHistory?: TradeHistoryEntry[];  // Recent trades for this agent
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
  portfolio: Portfolio;
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
