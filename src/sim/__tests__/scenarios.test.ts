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
