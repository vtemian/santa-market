import { NextRequest, NextResponse } from 'next/server';
import { runSimulation, ModelCaller } from '@/sim/runner';
import { getScenario, getAllScenarios } from '@/sim/scenarios';
import { AgentConfig, TurnState, Order } from '@/sim/types';
import { callModelTwoPhase, MODEL_IDS } from '@/sim/ai-gateway';

// Agent configurations (will be moved to separate file later)
const AGENTS: AgentConfig[] = [
  {
    id: 'gpt-5',
    name: 'GPT-5.1',
    modelId: MODEL_IDS['gpt-5'],
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'claude-opus',
    name: 'Claude Opus 4.5',
    modelId: MODEL_IDS['claude-opus'],
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 3 Pro',
    modelId: MODEL_IDS['gemini-pro'],
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'grok',
    name: 'Grok 4',
    modelId: MODEL_IDS['grok'],
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
  {
    id: 'deepseek',
    name: 'Deepseek V3.2',
    modelId: MODEL_IDS['deepseek'],
    systemPrompt: 'You are a SantaCorp portfolio manager.',
  },
];

// Mock model caller for testing
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

// AI Gateway model caller (calls real models)
const aiGatewayModelCaller: ModelCaller = async (agent, state) => {
  return callModelTwoPhase(agent, state);
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

    // Use AI Gateway if API key is available and USE_MOCK_MODELS is not set
    const useMock = process.env.USE_MOCK_MODELS === 'true' || !process.env.AI_GATEWAY_API_KEY;
    const modelCaller = useMock ? mockModelCaller : aiGatewayModelCaller;

    const result = await runSimulation({
      scenario,
      agents: AGENTS,
      totalDays: 14,
      modelCaller,
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
