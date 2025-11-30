import { generateText, createGateway } from 'ai';
import { AgentConfig, TurnState, Order } from './types';

// AI Gateway client - uses built-in gateway provider
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// Model IDs for AI Gateway (provider/model format)
export const MODEL_IDS = {
  'gpt-5': 'openai/gpt-5.1-thinking',
  'claude-opus': 'anthropic/claude-opus-4.5',
  'gemini-pro': 'google/gemini-3-pro-preview',
  'grok': 'xai/grok-4-fast-reasoning',
  'deepseek': 'deepseek/deepseek-v3',
} as const;

// Temperature for model calls (0 = deterministic, 1 = creative, 2 = chaotic)
const TEMPERATURE = 0.7;

/**
 * Calls an AI model through Vercel AI Gateway using a two-phase approach:
 * Phase 1: Free-form analysis and reasoning
 * Phase 2: Structured JSON trade decision based on analysis
 */
export async function callModelTwoPhase(
  agent: AgentConfig,
  state: TurnState
): Promise<{ prompt: string; reasoning: string; orders: Order[] }> {
  const timeout = 120000; // 2 minutes for thinking models

  try {
    // Phase 1: Analysis call (free-form reasoning)
    const phase1Prompt = buildAnalysisPrompt(agent, state);

    const analysisResult = await Promise.race([
      generateText({
        model: gateway(agent.modelId),
        system: agent.systemPrompt,
        prompt: phase1Prompt,
        temperature: TEMPERATURE,
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
        temperature: TEMPERATURE,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Phase 2 timeout')), timeout)
      ),
    ]);

    // Parse JSON from Phase 2, strip markdown fences if present
    const orders = parseOrders(tradeResult.text);

    return { prompt: phase1Prompt, reasoning, orders };
  } catch (error) {
    console.error(`Model call failed for ${agent.id}:`, error);
    // Return empty orders on failure
    return {
      prompt: '',
      reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      orders: [],
    };
  }
}

/**
 * Build Phase 1 prompt: Ask model to analyze the market
 */
function buildAnalysisPrompt(agent: AgentConfig, state: TurnState): string {
  const holdingsText = Object.entries(state.portfolio.holdings)
    .filter(([_, qty]) => qty > 0)
    .map(([ticker, qty]) => `- ${ticker}: ${qty} shares @ $${state.prices[ticker as keyof typeof state.prices].toFixed(2)} = $${(qty * state.prices[ticker as keyof typeof state.prices]).toFixed(2)}`)
    .join('\n');

  return `
=== NORTH POLE STOCK EXCHANGE - TICK #${state.day} ===

IMPORTANT: This is a LIVE CONTINUOUS MARKET. Ticks occur every 10 minutes, NOT daily.
Multiple ticks happen per real-world hour. Plan your strategy accordingly - you can
trade frequently, but transaction costs add up. The market follows real calendar dates
for seasonal phases (Christmas approaches in real-time).

CURRENT SEASON: ${state.regime.phase.toUpperCase().replace(/_/g, ' ')}
- Volatility: ${state.regime.volatilityMultiplier.toFixed(2)}x normal

MACRO CONDITIONS:
- Consumer Sentiment: ${state.macro.consumerSentiment.toFixed(0)}/100
- Labor Disruption Risk: ${(state.macro.laborDisruptionRisk * 100).toFixed(0)}%
- Supply Chain Pressure: ${state.macro.supplyChainPressure.toFixed(0)}/100
- Energy Cost Index: ${state.macro.energyCostIndex.toFixed(2)}x

CURRENT PRICES:
${Object.entries(state.prices).map(([ticker, price]) => `- ${ticker}: $${price.toFixed(2)}`).join('\n')}

PRICE HISTORY (last 7 ticks):
${formatPriceHistory(state.priceHistory)}

YOUR PORTFOLIO:
- Cash: $${state.portfolio.cash.toFixed(2)}
${holdingsText || '- No holdings'}
- Total Value: $${(state.portfolio.cash + Object.entries(state.portfolio.holdings).reduce((sum, [t, q]) => sum + q * (state.prices[t as keyof typeof state.prices] || 0), 0)).toFixed(2)}

NEWS THIS TICK:
${state.events.length > 0 ? state.events.map(e => e.message).join('\n\n') : 'No breaking news.'}

YOUR RECENT TRADES (last 5 ticks):
${formatTradeHistory(state.tradeHistory)}

TRADING RULES:
- Max position: ${(state.constraints.maxPositionPct * 100).toFixed(0)}% of portfolio in any single stock
- Max COAL: ${(state.constraints.maxCoalPct * 100).toFixed(0)}% (risky contrarian play)
- Your trades affect prices! Heavy buying pushes prices up, selling pushes down.
- You compete against other AI models. They see the same news but may interpret differently.

Analyze the market. Consider: news implications, price momentum, portfolio balance, and what your competitors might do.
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
 * Format trade history for agent memory
 */
function formatTradeHistory(tradeHistory?: Array<{
  tick: number;
  orders: Array<{ ticker: string; action: string; quantity: number; price: number }>;
  reasoning: string;
}>): string {
  if (!tradeHistory || tradeHistory.length === 0) {
    return 'No previous trades yet.';
  }

  const lines: string[] = [];
  for (const entry of tradeHistory) {
    if (entry.orders.length === 0) {
      lines.push(`- Tick #${entry.tick}: No trades`);
      if (entry.reasoning && !entry.reasoning.startsWith('Error')) {
        // Truncate reasoning to first 150 chars for brevity
        const shortReasoning = entry.reasoning.slice(0, 150).replace(/\n/g, ' ');
        lines.push(`  Reasoning: "${shortReasoning}${entry.reasoning.length > 150 ? '...' : ''}"`);
      }
    } else {
      const orderStrings = entry.orders.map(o =>
        `${o.action} ${o.quantity} ${o.ticker} @ $${o.price.toFixed(2)}`
      ).join(', ');
      lines.push(`- Tick #${entry.tick}: ${orderStrings}`);
      if (entry.reasoning && !entry.reasoning.startsWith('Error')) {
        const shortReasoning = entry.reasoning.slice(0, 150).replace(/\n/g, ' ');
        lines.push(`  Reasoning: "${shortReasoning}${entry.reasoning.length > 150 ? '...' : ''}"`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Parse orders from model output, handling various formats:
 * - Plain JSON array
 * - Markdown code fences
 * - Thinking text before JSON (for reasoning models)
 */
function parseOrders(text: string): Order[] {
  try {
    let cleaned = text.trim();

    // Strip markdown code fences
    if (cleaned.includes('```')) {
      const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        cleaned = match[1].trim();
      }
    }

    // Try to find JSON array in the text (for thinking models that add reasoning before JSON)
    if (!cleaned.startsWith('[')) {
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        cleaned = arrayMatch[0];
      }
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
