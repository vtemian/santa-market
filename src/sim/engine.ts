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
