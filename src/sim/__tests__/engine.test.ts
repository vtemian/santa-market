import { describe, it, expect } from 'vitest';
import {
  createRng,
  initMarketState,
  advanceMarket,
  initAgentState,
  applyOrders,
  computeEquity,
} from '../engine';
import { AgentConfig, Order, Constraints, TICKERS } from '../types';

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
