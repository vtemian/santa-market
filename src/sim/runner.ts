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

export const DEFAULT_CONSTRAINTS: Constraints = {
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

    // Parallelize model calls for all agents
    const modelResponses = await Promise.all(
      agents.map(async (agent) => {
        const turnState = buildTurnState(market, agent, DEFAULT_CONSTRAINTS);
        try {
          return await modelCaller(agent.config, turnState);
        } catch (error) {
          agent.violations.push('Model error: no orders');
          return { reasoning: 'Model call failed', orders: [] as Order[] };
        }
      })
    );

    // Apply orders sequentially (maintains state consistency)
    const agentLogs: AgentDayLog[] = agents.map((agent, idx) => {
      const { reasoning, orders } = modelResponses[idx];

      const { appliedOrders, violations, turnoverDelta } = applyOrders(
        agent,
        orders,
        market.prices,
        DEFAULT_CONSTRAINTS
      );

      agent.turnover += turnoverDelta;
      agent.violations.push(...violations);

      const equity = computeEquity(agent.portfolio, market.prices);
      agent.equityHistory.push(equity);

      return {
        agentId: agent.config.id,
        reasoning,
        orders: appliedOrders,
        equity,
        violations,
        portfolio: { ...agent.portfolio },
      };
    });

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

// Streaming simulation progress update
export interface SimulationProgress {
  type: 'day' | 'complete';
  day?: number;
  totalDays: number;
  snapshot?: DaySnapshot;
  result?: SimulationResult;
}

interface RunSimulationStreamingParams extends RunSimulationParams {
  onProgress: (progress: SimulationProgress) => void;
}

export async function runSimulationStreaming(
  params: RunSimulationStreamingParams
): Promise<SimulationResult> {
  const { scenario, agents: agentConfigs, totalDays, modelCaller, onProgress } = params;

  const rng = createRng(scenario.seed);
  let market = initMarketState(totalDays, rng);
  market = applyScenarioOverrides(market, scenario);

  const agents: AgentState[] = agentConfigs.map(config =>
    initAgentState(config, DEFAULT_CONSTRAINTS)
  );

  const timeline: DaySnapshot[] = [];

  for (let day = 1; day <= totalDays; day++) {
    market = advanceMarket(market, rng);
    market = applyScriptedEvents(market, scenario, day);

    const modelResponses = await Promise.all(
      agents.map(async (agent) => {
        const turnState = buildTurnState(market, agent, DEFAULT_CONSTRAINTS);
        try {
          return await modelCaller(agent.config, turnState);
        } catch (error) {
          agent.violations.push('Model error: no orders');
          return { reasoning: 'Model call failed', orders: [] as Order[] };
        }
      })
    );

    const agentLogs: AgentDayLog[] = agents.map((agent, idx) => {
      const { reasoning, orders } = modelResponses[idx];

      const { appliedOrders, violations, turnoverDelta } = applyOrders(
        agent,
        orders,
        market.prices,
        DEFAULT_CONSTRAINTS
      );

      agent.turnover += turnoverDelta;
      agent.violations.push(...violations);

      const equity = computeEquity(agent.portfolio, market.prices);
      agent.equityHistory.push(equity);

      return {
        agentId: agent.config.id,
        reasoning,
        orders: appliedOrders,
        equity,
        violations,
        portfolio: { ...agent.portfolio },
      };
    });

    const snapshot: DaySnapshot = {
      day,
      prices: { ...market.prices },
      events: [...market.events],
      agentLogs,
    };

    timeline.push(snapshot);

    // Report progress after each day
    onProgress({
      type: 'day',
      day,
      totalDays,
      snapshot,
    });
  }

  const scores = agents.map(agent => scoreAgent(agent, market.prices));
  const rankedScores = rankAgents(scores);

  const result: SimulationResult = {
    scenarioId: scenario.id,
    timeline,
    scores: rankedScores,
  };

  onProgress({
    type: 'complete',
    totalDays,
    result,
  });

  return result;
}

export function buildTurnState(
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
