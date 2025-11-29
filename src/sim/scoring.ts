import { AgentState, AgentScore, TradingStyle, Prices, TICKERS } from './types';
import { computeEquity } from './engine';

export function computeMaxDrawdown(series: number[]): number {
  if (series.length === 0) return 0;

  let peak = series[0];
  let maxDrawdown = 0;

  for (const value of series) {
    if (value > peak) {
      peak = value;
    }

    const drawdown = peak > 0 ? (peak - value) / peak : 0;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

export function detectTradingStyle(agent: AgentState, initialCash: number): TradingStyle {
  const totalDays = agent.equityHistory.length || 14;
  const avgTradesPerDay = agent.totalTrades / totalDays;

  // Compute average cash ratio
  const currentCash = agent.portfolio.cash;
  const equity = agent.equityHistory[agent.equityHistory.length - 1] || initialCash;
  const cashRatio = equity > 0 ? currentCash / equity : 1;

  if (avgTradesPerDay >= 3 && cashRatio < 0.15) {
    return 'aggressive';
  }

  if (avgTradesPerDay < 1 && cashRatio > 0.3) {
    return 'conservative';
  }

  // Could analyze buy/sell timing vs price trends for momentum/contrarian
  // For now, default to momentum
  return 'momentum';
}

export function scoreAgent(agent: AgentState, prices: Prices): AgentScore {
  const finalValue = computeEquity(agent.portfolio, prices);
  const initialValue = 100000; // TODO: pass as parameter
  const totalReturn = (finalValue - initialValue) / initialValue;

  const maxDrawdown = computeMaxDrawdown(agent.equityHistory);

  // Penalties
  const violationPenalty = agent.violations.length * 1000;
  const turnoverPenalty = agent.turnover * 0.0002;
  const drawdownPenalty = maxDrawdown * finalValue * 0.05;

  const score = finalValue - violationPenalty - turnoverPenalty - drawdownPenalty;

  const tradingStyle = detectTradingStyle(agent, initialValue);

  return {
    agentId: agent.config.id,
    name: agent.config.name,
    rank: 0, // Set later when ranking all agents
    finalValue,
    totalReturn,
    score,
    maxDrawdown,
    totalTrades: agent.totalTrades,
    turnover: agent.turnover,
    violations: agent.violations,
    tradingStyle,
  };
}

export function rankAgents(scores: AgentScore[]): AgentScore[] {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return sorted.map((score, index) => ({
    ...score,
    rank: index + 1,
  }));
}
