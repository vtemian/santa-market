import { describe, it, expect } from 'vitest';
import { runSimulation } from '../runner';
import { AgentConfig, TurnState, Order } from '../types';
import { getScenario } from '../scenarios';

// Mock model caller that always buys SANTA
const mockModelCaller = async (
  agent: AgentConfig,
  state: TurnState
): Promise<{ reasoning: string; orders: Order[] }> => {
  return {
    reasoning: `Day ${state.day}: I think SANTA is a good buy.`,
    orders: state.day === 1 ? [{ ticker: 'SANTA', action: 'BUY', quantity: 100 }] : [],
  };
};

describe('runSimulation', () => {
  it('runs complete simulation', async () => {
    const scenario = getScenario('calm-q4')!;
    const agents: AgentConfig[] = [
      { id: 'test-1', name: 'Test 1', modelId: 'test', systemPrompt: '' },
      { id: 'test-2', name: 'Test 2', modelId: 'test', systemPrompt: '' },
    ];

    const result = await runSimulation({
      scenario,
      agents,
      totalDays: 14,
      modelCaller: mockModelCaller,
    });

    expect(result.timeline).toHaveLength(14);
    expect(result.scores).toHaveLength(2);
    expect(result.scenarioId).toBe('calm-q4');
  });

  it('captures reasoning in day logs', async () => {
    const scenario = getScenario('calm-q4')!;
    const agents: AgentConfig[] = [
      { id: 'test-1', name: 'Test 1', modelId: 'test', systemPrompt: '' },
    ];

    const result = await runSimulation({
      scenario,
      agents,
      totalDays: 3,
      modelCaller: mockModelCaller,
    });

    const day1Log = result.timeline[0].agentLogs[0];
    expect(day1Log.reasoning).toContain('Day 1');
  });

  it('applies orders and tracks equity', async () => {
    const scenario = getScenario('calm-q4')!;
    const agents: AgentConfig[] = [
      { id: 'test-1', name: 'Test 1', modelId: 'test', systemPrompt: '' },
    ];

    const result = await runSimulation({
      scenario,
      agents,
      totalDays: 3,
      modelCaller: mockModelCaller,
    });

    // After day 1, should have bought 100 SANTA
    const day1Log = result.timeline[0].agentLogs[0];
    expect(day1Log.orders).toHaveLength(1);
    expect(day1Log.orders[0].ticker).toBe('SANTA');
  });

  it('ranks agents by score', async () => {
    const scenario = getScenario('calm-q4')!;
    const agents: AgentConfig[] = [
      { id: 'test-1', name: 'Test 1', modelId: 'test', systemPrompt: '' },
      { id: 'test-2', name: 'Test 2', modelId: 'test', systemPrompt: '' },
    ];

    const result = await runSimulation({
      scenario,
      agents,
      totalDays: 3,
      modelCaller: mockModelCaller,
    });

    expect(result.scores[0].rank).toBe(1);
    expect(result.scores[1].rank).toBe(2);
  });
});
