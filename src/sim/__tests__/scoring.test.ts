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
