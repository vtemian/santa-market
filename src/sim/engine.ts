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
