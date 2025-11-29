import { generateText, createGateway } from 'ai';
import { AgentConfig, TurnState, Order } from './types';

// AI Gateway client - uses built-in gateway provider
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// Model IDs for AI Gateway (provider/model format)
export const MODEL_IDS = {
  'gpt-4o': 'openai/gpt-4o',
  'claude-sonnet': 'anthropic/claude-sonnet-4',
  'gemini-pro': 'google/gemini-2.0-flash',
  'grok': 'xai/grok-2',
  'deepseek': 'deepseek/deepseek-chat',
  // llama not available on AI Gateway
} as const;

/**
 * Calls an AI model through Vercel AI Gateway using a two-phase approach:
 * Phase 1: Free-form analysis and reasoning
 * Phase 2: Structured JSON trade decision based on analysis
 */
export async function callModelTwoPhase(
  agent: AgentConfig,
  state: TurnState
): Promise<{ reasoning: string; orders: Order[] }> {
  const timeout = 30000; // 30 seconds

  try {
    // Phase 1: Analysis call (free-form reasoning)
    const phase1Prompt = buildAnalysisPrompt(agent, state);

    const analysisResult = await Promise.race([
      generateText({
        model: gateway(agent.modelId),
        system: agent.systemPrompt,
        prompt: phase1Prompt,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Phase 1 timeout')), timeout)
      ),
    ]);

    const reasoning = analysisResult.text;

    // Phase 2: Trade decision (JSON output)
    const phase2Prompt = buildTradeDecisionPrompt(reasoning, state);

    const tradeResult = await Promise.race([
      generateText({
        model: gateway(agent.modelId),
        system: agent.systemPrompt,
        prompt: phase2Prompt,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Phase 2 timeout')), timeout)
      ),
    ]);

    // Parse JSON from Phase 2, strip markdown fences if present
    const orders = parseOrders(tradeResult.text);

    return { reasoning, orders };
  } catch (error) {
    console.error(`Model call failed for ${agent.id}:`, error);
    // Return empty orders on failure
    return {
      reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      orders: [],
    };
  }
}

/**
 * Build Phase 1 prompt: Ask model to analyze the market
 */
function buildAnalysisPrompt(agent: AgentConfig, state: TurnState): string {
  return `
Day ${state.day} of ${state.totalDays}

MARKET STATE:
- Phase: ${state.regime.phase} (day ${state.regime.daysInPhase} in phase)
- Volatility Multiplier: ${state.regime.volatilityMultiplier.toFixed(2)}

MACRO CONDITIONS:
- Consumer Sentiment: ${state.macro.consumerSentiment.toFixed(0)}/100
- Labor Disruption Risk: ${(state.macro.laborDisruptionRisk * 100).toFixed(0)}%
- Supply Chain Pressure: ${state.macro.supplyChainPressure.toFixed(0)}/100
- Energy Cost Index: ${state.macro.energyCostIndex.toFixed(2)}x

CURRENT PRICES:
${Object.entries(state.prices).map(([ticker, price]) => `- ${ticker}: $${price.toFixed(2)}`).join('\n')}

PRICE HISTORY (last 7 days):
${formatPriceHistory(state.priceHistory)}

YOUR PORTFOLIO:
- Cash: $${state.portfolio.cash.toFixed(2)}
${Object.entries(state.portfolio.holdings)
  .filter(([_, qty]) => qty > 0)
  .map(([ticker, qty]) => `- ${ticker}: ${qty} shares @ $${state.prices[ticker as keyof typeof state.prices].toFixed(2)} = $${(qty * state.prices[ticker as keyof typeof state.prices]).toFixed(2)}`)
  .join('\n')}

EVENTS TODAY:
${state.events.length > 0 ? state.events.map(e => `- ${e.message}`).join('\n') : '- No major events'}

CONSTRAINTS:
- Max position size: ${(state.constraints.maxPositionPct * 100).toFixed(0)}% of portfolio value
- Max COAL position: ${(state.constraints.maxCoalPct * 100).toFixed(0)}% of portfolio value

Analyze this market situation. What are the key factors to consider? What trading opportunities or risks do you see?
`.trim();
}

/**
 * Build Phase 2 prompt: Ask model for JSON trade orders
 */
function buildTradeDecisionPrompt(analysis: string, state: TurnState): string {
  return `
Based on your analysis:

${analysis}

Now decide what trades to make today. Return your decision as a JSON array of orders.

Each order must have:
- ticker: one of SANTA, REIN, ELF, COAL, GIFT
- action: either "BUY" or "SELL"
- quantity: a positive integer

Examples:
[{"ticker": "SANTA", "action": "BUY", "quantity": 100}]
[{"ticker": "COAL", "action": "SELL", "quantity": 50}, {"ticker": "GIFT", "action": "BUY", "quantity": 75}]
[]

Return ONLY the JSON array, nothing else. If you don't want to trade today, return an empty array [].
`.trim();
}

/**
 * Format price history for the last 7 days
 */
function formatPriceHistory(priceHistory: Record<string, number[]>): string {
  const tickers = Object.keys(priceHistory);
  const maxDays = 7;

  const lines: string[] = [];
  for (const ticker of tickers) {
    const history = priceHistory[ticker];
    const recent = history.slice(-maxDays);
    const formatted = recent.map(p => `$${p.toFixed(2)}`).join(', ');
    lines.push(`- ${ticker}: ${formatted}`);
  }

  return lines.join('\n');
}

/**
 * Parse orders from model output, stripping markdown fences if present
 */
function parseOrders(text: string): Order[] {
  try {
    // Strip markdown code fences
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    // Validate it's an array
    if (!Array.isArray(parsed)) {
      console.error('Orders response is not an array:', parsed);
      return [];
    }

    // Validate each order has required fields
    const validOrders = parsed.filter((order: any) => {
      return (
        order.ticker &&
        order.action &&
        typeof order.quantity === 'number' &&
        order.quantity > 0 &&
        ['BUY', 'SELL'].includes(order.action) &&
        ['SANTA', 'REIN', 'ELF', 'COAL', 'GIFT'].includes(order.ticker)
      );
    });

    return validOrders as Order[];
  } catch (error) {
    console.error('Failed to parse orders:', error, '\nRaw text:', text);
    return [];
  }
}
