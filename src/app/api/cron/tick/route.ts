import { NextRequest, NextResponse } from 'next/server';
import { advanceMarket, getMarketState, getAgents, updateAgentPortfolio, recordTrade, applyTradePressure, saveAgentSnapshots, getRecentTradesForAgent } from '@/lib/market';
import { callModelTwoPhase, MODEL_IDS } from '@/sim/ai-gateway';

const AGENTS_CONFIG = [
  { id: 'gpt-5', name: 'GPT-5.1', modelId: MODEL_IDS['gpt-5'] },
  { id: 'claude-opus', name: 'Claude Opus 4.5', modelId: MODEL_IDS['claude-opus'] },
  { id: 'gemini-pro', name: 'Gemini 3 Pro', modelId: MODEL_IDS['gemini-pro'] },
  { id: 'grok', name: 'Grok 4', modelId: MODEL_IDS['grok'] },
  { id: 'deepseek', name: 'Deepseek V3.2', modelId: MODEL_IDS['deepseek'] },
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

    // 2. Get current agent portfolios
    const agentRows = await getAgents();

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
        priceHistory: {}, // TODO: add price history from recent ticks
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
          { id: config.id, name: config.name, modelId: config.modelId, systemPrompt: 'You are a portfolio manager on the North Pole Stock Exchange.' },
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
