import { NextRequest, NextResponse } from 'next/server';
import { runSimulation, ModelCaller } from '@/sim/runner';
import { getScenario, getAllScenarios } from '@/sim/scenarios';
import { AgentConfig, TurnState, Order } from '@/sim/types';
import { parseAgentOutput } from '@/sim/schemas';

// Agent configurations (will be moved to separate file later)
const AGENTS: AgentConfig[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    modelId: 'gpt-4o',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    modelId: 'claude-3-5-sonnet-20241022',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    modelId: 'gemini-1.5-pro',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'grok',
    name: 'Grok',
    modelId: 'grok-beta',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'deepseek',
    name: 'Deepseek V3',
    modelId: 'deepseek-chat',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'llama',
    name: 'Llama 3.1 70B',
    modelId: 'llama-3.1-70b-versatile',
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
];

// Mock model caller for testing (replace with AI Gateway later)
const mockModelCaller: ModelCaller = async (agent, state) => {
  // Simulate some basic trading logic
  const orders: Order[] = [];

  if (state.day === 1) {
    // Initial position: buy some SANTA
    orders.push({ ticker: 'SANTA', action: 'BUY', quantity: 200 });
  } else if (state.day === 7 && state.regime.phase === 'holiday_rush') {
    // Add to position during holiday rush
    orders.push({ ticker: 'GIFT', action: 'BUY', quantity: 100 });
  }

  const reasoning = `Day ${state.day}: Market in ${state.regime.phase} phase. ` +
    `Consumer sentiment at ${state.macro.consumerSentiment.toFixed(0)}. ` +
    (orders.length > 0
      ? `Executing ${orders.length} trade(s).`
      : 'Holding current positions.');

  return { reasoning, orders };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scenarioId = body.scenarioId || 'calm-q4';

    const scenario = getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json(
        { error: `Unknown scenario: ${scenarioId}` },
        { status: 400 }
      );
    }

    const result = await runSimulation({
      scenario,
      agents: AGENTS,
      totalDays: 14,
      modelCaller: mockModelCaller, // TODO: Replace with real AI Gateway caller
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: 'Simulation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return list of available scenarios
  const scenarios = getAllScenarios().map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
  }));

  return NextResponse.json({ scenarios });
}
