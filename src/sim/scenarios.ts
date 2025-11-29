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
