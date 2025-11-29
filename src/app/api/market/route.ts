import { NextResponse } from 'next/server';
import { getMarketState, getAgents, getRecentTicks, getRecentTrades, initializeMarket } from '@/lib/market';

export async function GET() {
  try {
    // Ensure market is initialized
    let state = await getMarketState();
    if (!state) {
      state = await initializeMarket();
    }

    const [agentRows, recentTicks, recentTrades] = await Promise.all([
      getAgents(),
      getRecentTicks(50),
      state ? getRecentTrades(state.tickNumber) : [],
    ]);

    // Format agents with ranking
    const agents = agentRows
      .map(a => ({
        id: a.id,
        name: a.name,
        cash: parseFloat(a.cash),
        holdings: a.holdings,
        totalValue: parseFloat(a.totalValue),
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .map((a, i) => ({ ...a, rank: i + 1 }));

    // Format trades by agent
    const tradesByAgent: Record<string, any> = {};
    for (const trade of recentTrades) {
      tradesByAgent[trade.agentId] = {
        prompt: trade.prompt,
        reasoning: trade.reasoning,
        orders: trade.orders,
      };
    }

    return NextResponse.json({
      tickNumber: state?.tickNumber || 0,
      prices: state?.prices || {},
      season: state?.season || 'off_season',
      news: state?.currentNews,
      nextTickAt: state?.nextTickAt,
      agents,
      tradesByAgent,
      priceHistory: [...recentTicks].reverse().map(t => ({
        tick: t.tickNumber,
        prices: t.prices,
        news: t.news,
      })),
    });
  } catch (error) {
    console.error('Market API error:', error);
    return NextResponse.json({ error: 'Failed to get market state' }, { status: 500 });
  }
}
