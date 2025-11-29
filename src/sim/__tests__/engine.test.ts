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
