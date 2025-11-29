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

    const agentLogs: AgentDayLog[] = [];

    for (const agent of agents) {
      // Build turn state for this agent
      const turnState = buildTurnState(market, agent, DEFAULT_CONSTRAINTS);

      // Call model (two phases handled by caller)
      let reasoning = '';
      let orders: Order[] = [];

      try {
        const response = await modelCaller(agent.config, turnState);
        reasoning = response.reasoning;
        orders = response.orders;
      } catch (error) {
        reasoning = 'Model call failed';
        orders = [];
        agent.violations.push('Model error: no orders');
      }

      // Apply orders
      const { appliedOrders, violations, turnoverDelta } = applyOrders(
        agent,
        orders,
        market.prices,
        DEFAULT_CONSTRAINTS
      );

      agent.turnover += turnoverDelta;
      agent.violations.push(...violations);

      // Record equity
      const equity = computeEquity(agent.portfolio, market.prices);
      agent.equityHistory.push(equity);

      agentLogs.push({
        agentId: agent.config.id,
        reasoning,
        orders: appliedOrders,
        equity,
        violations,
      });
    }

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
