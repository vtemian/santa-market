import { NextRequest } from 'next/server';
import { runSimulationStreaming, ModelCaller } from '@/sim/runner';
import { getScenario } from '@/sim/scenarios';
import { AgentConfig, Order } from '@/sim/types';
import { callModelTwoPhase, MODEL_IDS } from '@/sim/ai-gateway';

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

const mockModelCaller: ModelCaller = async (agent, state) => {
  const orders: Order[] = [];

  if (state.day === 1) {
    orders.push({ ticker: 'SANTA', action: 'BUY', quantity: 200 });
  } else if (state.day === 7 && state.regime.phase === 'holiday_rush') {
    orders.push({ ticker: 'GIFT', action: 'BUY', quantity: 100 });
  }

  const reasoning = `Day ${state.day}: Market in ${state.regime.phase} phase. ` +
    `Consumer sentiment at ${state.macro.consumerSentiment.toFixed(0)}. ` +
    (orders.length > 0
      ? `Executing ${orders.length} trade(s).`
      : 'Holding current positions.');

  return { reasoning, orders };
};

const aiGatewayModelCaller: ModelCaller = async (agent, state) => {
  return callModelTwoPhase(agent, state);
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const scenarioId = body.scenarioId || 'calm-q4';

  const scenario = getScenario(scenarioId);
  if (!scenario) {
    return new Response(JSON.stringify({ error: `Unknown scenario: ${scenarioId}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const useMock = process.env.USE_MOCK_MODELS === 'true' || !process.env.AI_GATEWAY_API_KEY;
  const modelCaller = useMock ? mockModelCaller : aiGatewayModelCaller;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await runSimulationStreaming({
          scenario,
          agents: AGENTS,
          totalDays: 14,
          modelCaller,
          onProgress: (progress) => {
            const data = `data: ${JSON.stringify(progress)}\n\n`;
            controller.enqueue(encoder.encode(data));
          },
        });
        controller.close();
      } catch (error) {
        console.error('Streaming simulation error:', error);
        const errorData = `data: ${JSON.stringify({ type: 'error', message: 'Simulation failed' })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
