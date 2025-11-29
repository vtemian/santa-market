import { NextRequest, NextResponse } from 'next/server';
import { advanceMarket, getMarketState, getAgents, updateAgentPortfolio, recordTrade, applyTradePressure, saveAgentSnapshots, getRecentTradesForAgent, getPriceHistory } from '@/lib/market';
import { callModelTwoPhase, MODEL_IDS } from '@/sim/ai-gateway';

const AGENTS_CONFIG = [
  {
    id: 'gpt-5',
    name: 'GPT-5.1',
    modelId: MODEL_IDS['gpt-5'],
    systemPrompt: `You are an elite portfolio manager competing on the North Pole Stock Exchange.

Your SOLE OBJECTIVE is to maximize profit and beat the other AI traders. You are competing against Claude, Gemini, Grok, and DeepSeek - all managing identical starting portfolios.

WINNING STRATEGY PRINCIPLES:
- Analyze news for alpha opportunities before others react
- Consider what your competitors might do and position accordingly
- Balance risk vs reward - big gains require calculated risks
- React quickly to market-moving events but avoid panic trades
- Track your performance vs competitors and adjust strategy

You have $100,000 starting capital. The winner is whoever has the highest portfolio value. Trade aggressively but intelligently. Every tick is an opportunity to gain an edge.`
  },
  {
    id: 'claude-opus',
    name: 'Claude Opus 4.5',
    modelId: MODEL_IDS['claude-opus'],
    systemPrompt: `You are an elite portfolio manager competing on the North Pole Stock Exchange.

Your SOLE OBJECTIVE is to maximize profit and beat the other AI traders. You are competing against GPT-5, Gemini, Grok, and DeepSeek - all managing identical starting portfolios.

WINNING STRATEGY PRINCIPLES:
- Look for contrarian opportunities - when others panic, you profit
- Identify second-order effects of news that others might miss
- Consider game theory: what will the herd do, and how can you exploit it
- Build positions before catalysts, not after
- Be willing to go against consensus when your analysis supports it

You have $100,000 starting capital. The winner is whoever has the highest portfolio value. Think independently and find edges others overlook.`
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 3 Pro',
    modelId: MODEL_IDS['gemini-pro'],
    systemPrompt: `You are an elite portfolio manager competing on the North Pole Stock Exchange.

Your SOLE OBJECTIVE is to maximize profit and beat the other AI traders. You are competing against GPT-5, Claude, Grok, and DeepSeek - all managing identical starting portfolios.

WINNING STRATEGY PRINCIPLES:
- Use price momentum and trends to time entries/exits
- Watch for technical patterns in price history
- Ride winners, cut losers quickly
- Scale into positions rather than going all-in
- Seasonal patterns matter - Christmas approach changes everything

You have $100,000 starting capital. The winner is whoever has the highest portfolio value. Follow the trend but stay nimble.`
  },
  {
    id: 'grok',
    name: 'Grok 4',
    modelId: MODEL_IDS['grok'],
    systemPrompt: `You are an elite portfolio manager competing on the North Pole Stock Exchange.

Your SOLE OBJECTIVE is to maximize profit and beat the other AI traders. You are competing against GPT-5, Claude, Gemini, and DeepSeek - all managing identical starting portfolios.

WINNING STRATEGY PRINCIPLES:
- Fortune favors the bold - take calculated high-conviction bets
- COAL is the wildcard - high risk but massive upside potential
- When you spot an edge, size up aggressively
- Don't be afraid to concentrate in your best ideas
- Black swan events are opportunities, not just risks

You have $100,000 starting capital. The winner is whoever has the highest portfolio value. Play to win, not to avoid losing.`
  },
  {
    id: 'deepseek',
    name: 'Deepseek V3.2',
    modelId: MODEL_IDS['deepseek'],
    systemPrompt: `You are an elite portfolio manager competing on the North Pole Stock Exchange.

Your SOLE OBJECTIVE is to maximize profit and beat the other AI traders. You are competing against GPT-5, Claude, Gemini, and Grok - all managing identical starting portfolios.

WINNING STRATEGY PRINCIPLES:
- Focus on macro conditions and seasonal patterns
- Consumer sentiment and supply chain pressures drive fundamentals
- Build positions aligned with the current market regime
- Value matters - buy underpriced assets, sell overpriced ones
- Long-term positioning beats short-term noise

You have $100,000 starting capital. The winner is whoever has the highest portfolio value. Let fundamentals guide your conviction.`
  },
];

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Advance market (prices + news)
    const { news, prices } = await advanceMarket();
    const state = await getMarketState();
    if (!state) throw new Error('Failed to get market state');

    // 2. Get current agent portfolios and price history
    const agentRows = await getAgents();
    const priceHistory = await getPriceHistory(7);

    // 3. Call all AI agents in parallel
    const allExecutedOrders: Array<{ ticker: string; action: string; quantity: number }> = [];

    const agentCalls = AGENTS_CONFIG.map(async (config) => {
      const agentRow = agentRows.find(a => a.id === config.id);
      if (!agentRow) return { agentId: config.id, success: false, orders: [] };

      const holdings = agentRow.holdings as Record<string, number>;
      const cash = parseFloat(agentRow.cash);

      // Fetch recent trades for this agent (for memory/context)
      const recentTrades = await getRecentTradesForAgent(config.id, 5);
      const tradeHistory = recentTrades.map(t => ({
        tick: t.tickNumber,
        orders: (t.orders as Array<{ ticker: string; action: string; quantity: number; price: number }>) || [],
        reasoning: t.reasoning || '',
      }));

      // Build prompt context - map simplified DB schema to full TurnState
      const turnState = {
        day: state.tickNumber,
        totalDays: 999, // continuous
        portfolio: { cash, holdings },
        prices: state.prices,
        priceHistory,
        macro: {
          // Map from DB schema (sentiment, energy, supplyChain) to TurnState schema
          consumerSentiment: (state.macro as any).sentiment,
          laborDisruptionRisk: 0.1, // Default value - could be derived from season
          supplyChainPressure: (state.macro as any).supplyChain,
          energyCostIndex: (state.macro as any).energy,
        },
        regime: {
          // Map season to regime phase
          phase: state.season === 'christmas_eve' || state.season === 'crunch_time' ? 'holiday_rush' as const :
                 state.season === 'post_christmas' || state.season === 'off_season' ? 'post_peak' as const :
                 'pre_season' as const,
          daysInPhase: 1,
          volatilityMultiplier: 1,
        },
        events: news ? [{
          ticker: 'ALL' as const,
          type: 'demand' as const,
          impact: 'positive' as const,
          magnitude: 'medium' as const,
          message: news.message
        }] : [],
        constraints: { maxPositionPct: 0.6, maxCoalPct: 0.2, initialCash: 100000 },
        tradeHistory,
      };

      try {
        const result = await callModelTwoPhase(
          { id: config.id, name: config.name, modelId: config.modelId, systemPrompt: config.systemPrompt },
          turnState as any
        );

        // Execute trades
        let newCash = cash;
        const newHoldings = { ...holdings };
        const executedOrders: Array<{ ticker: string; action: string; quantity: number; price: number }> = [];

        for (const order of result.orders) {
          const price = prices[order.ticker];
          if (order.action === 'BUY') {
            const cost = price * order.quantity;
            if (cost <= newCash) {
              newCash -= cost;
              newHoldings[order.ticker] = (newHoldings[order.ticker] || 0) + order.quantity;
              executedOrders.push({ ...order, price });
            }
          } else if (order.action === 'SELL') {
            if ((newHoldings[order.ticker] || 0) >= order.quantity) {
              newCash += price * order.quantity;
              newHoldings[order.ticker] -= order.quantity;
              executedOrders.push({ ...order, price });
            }
          }
        }

        // Update portfolio
        await updateAgentPortfolio(config.id, newCash, newHoldings, prices);

        // Record trade
        await recordTrade(state.tickNumber, config.id, result.prompt, result.reasoning, executedOrders);

        return { agentId: config.id, success: true, orders: executedOrders };
      } catch (error) {
        console.error(`Agent ${config.id} failed:`, error);
        await recordTrade(state.tickNumber, config.id, '', `Error: ${error}`, []);
        return { agentId: config.id, success: false, orders: [] };
      }
    });

    const results = await Promise.all(agentCalls);

    // 4. Collect all executed orders and apply trade pressure
    for (const result of results) {
      if (result?.orders) {
        allExecutedOrders.push(...result.orders);
      }
    }

    if (allExecutedOrders.length > 0) {
      await applyTradePressure(allExecutedOrders);
    }

    // 5. Save agent snapshots for chart history
    await saveAgentSnapshots(state.tickNumber);

    return NextResponse.json({
      success: true,
      tickNumber: state.tickNumber,
      news: news?.message || null,
    });
  } catch (error) {
    console.error('Tick failed:', error);
    return NextResponse.json({ error: 'Tick failed' }, { status: 500 });
  }
}
