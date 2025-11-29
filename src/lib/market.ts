import { db, marketState, agents, ticks, trades } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { generateNews, getSeasonalContext, applyNewsToPrice } from './news';

const TICKERS = ['SANTA', 'REIN', 'ELF', 'GIFT', 'COAL'] as const;

const INITIAL_PRICES: Record<string, number> = {
  SANTA: 100,
  REIN: 45,
  ELF: 75,
  GIFT: 80,
  COAL: 15,
};

const AGENTS_CONFIG = [
  { id: 'gpt-5', name: 'GPT-5.1' },
  { id: 'claude-opus', name: 'Claude Opus 4.5' },
  { id: 'gemini-pro', name: 'Gemini 3 Pro' },
  { id: 'grok', name: 'Grok 4' },
  { id: 'deepseek', name: 'Deepseek V3.2' },
];

const INITIAL_CASH = 100000;
const TICK_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

export async function getMarketState() {
  const [state] = await db.select().from(marketState).where(eq(marketState.id, 1));
  return state;
}

export async function getAgents() {
  return db.select().from(agents).orderBy(desc(agents.totalValue));
}

export async function getRecentTicks(limit = 50) {
  return db.select().from(ticks).orderBy(desc(ticks.tickNumber)).limit(limit);
}

export async function getRecentTrades(tickNumber: number) {
  return db.select().from(trades).where(eq(trades.tickNumber, tickNumber));
}

export async function getRecentTradesForAgent(agentId: string, limit = 5) {
  return db.select()
    .from(trades)
    .where(eq(trades.agentId, agentId))
    .orderBy(desc(trades.tickNumber))
    .limit(limit);
}

export async function getPriceHistory(limit = 7): Promise<Record<string, number[]>> {
  const recentTicks = await db.select()
    .from(ticks)
    .orderBy(desc(ticks.tickNumber))
    .limit(limit);

  // Reverse to get chronological order (oldest first)
  recentTicks.reverse();

  // Build price history per ticker
  const history: Record<string, number[]> = {
    SANTA: [],
    REIN: [],
    ELF: [],
    GIFT: [],
    COAL: [],
  };

  for (const tick of recentTicks) {
    const prices = tick.prices as Record<string, number>;
    for (const ticker of TICKERS) {
      if (prices[ticker] !== undefined) {
        history[ticker].push(prices[ticker]);
      }
    }
  }

  return history;
}

export async function initializeMarket() {
  const existing = await getMarketState();
  if (existing) return existing;

  const now = new Date();
  const nextTick = new Date(now.getTime() + TICK_INTERVAL_MS);

  // Initialize market state
  await db.insert(marketState).values({
    id: 1,
    tickNumber: 0,
    prices: INITIAL_PRICES,
    macro: { sentiment: 70, energy: 1.0, supplyChain: 50 },
    season: getSeasonalContext(now),
    currentNews: null,
    nextTickAt: nextTick,
  });

  // Initialize agents
  for (const agent of AGENTS_CONFIG) {
    await db.insert(agents).values({
      id: agent.id,
      name: agent.name,
      cash: INITIAL_CASH.toString(),
      holdings: { SANTA: 0, REIN: 0, ELF: 0, GIFT: 0, COAL: 0 },
      totalValue: INITIAL_CASH.toString(),
    });
  }

  return getMarketState();
}

function seededRandom(seed: number) {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

export async function advanceMarket(): Promise<{ news: any; prices: Record<string, number> }> {
  const state = await getMarketState();
  if (!state) throw new Error('Market not initialized');

  const now = new Date();
  const newTickNumber = state.tickNumber + 1;
  const random = seededRandom(now.getTime());

  // Generate news
  const news = generateNews(now, random);

  // Update prices with random walk + momentum + news impact
  const newPrices: Record<string, number> = {};
  for (const ticker of TICKERS) {
    let price = state.prices[ticker];
    const initialPrice = INITIAL_PRICES[ticker];

    // Base random walk: ±5% per tick (more volatile)
    const randomChange = (random() - 0.5) * 10; // -5% to +5%

    // Add momentum: if price moved away from initial, slight tendency to continue
    const priceRatio = price / initialPrice;
    const momentum = priceRatio > 1.1 ? 0.5 : priceRatio < 0.9 ? -0.5 : 0;

    // Add mean reversion at extremes
    const meanReversion = priceRatio > 1.5 ? -1 : priceRatio < 0.6 ? 1 : 0;

    // Occasional volatility spike (10% chance of 2x volatility)
    const volatilitySpike = random() < 0.1 ? 2 : 1;

    const totalChange = (randomChange + momentum + meanReversion) * volatilitySpike;
    price = price * (1 + totalChange / 100);

    // Apply news impact if applicable
    if (news && news.impact[ticker]) {
      price = applyNewsToPrice(price, news.impact[ticker]);
    }

    // Clamp to reasonable bounds
    price = Math.max(1, Math.min(500, price));
    newPrices[ticker] = Math.round(price * 100) / 100;
  }

  // Update market state
  const nextTick = new Date(now.getTime() + TICK_INTERVAL_MS);
  await db.update(marketState).set({
    tickNumber: newTickNumber,
    prices: newPrices,
    season: getSeasonalContext(now),
    currentNews: news,
    nextTickAt: nextTick,
    updatedAt: now,
  }).where(eq(marketState.id, 1));

  // Record tick
  await db.insert(ticks).values({
    tickNumber: newTickNumber,
    prices: newPrices,
    news: news,
    season: getSeasonalContext(now),
  });

  return { news, prices: newPrices };
}

export async function updateAgentPortfolio(
  agentId: string,
  cash: number,
  holdings: Record<string, number>,
  prices: Record<string, number>
) {
  const totalValue = cash + TICKERS.reduce((sum, t) => sum + (holdings[t] || 0) * prices[t], 0);

  await db.update(agents).set({
    cash: cash.toString(),
    holdings,
    totalValue: totalValue.toString(),
    updatedAt: new Date(),
  }).where(eq(agents.id, agentId));
}

export async function recordTrade(
  tickNumber: number,
  agentId: string,
  prompt: string,
  reasoning: string,
  orders: Array<{ ticker: string; action: string; quantity: number; price: number }>
) {
  await db.insert(trades).values({
    tickNumber,
    agentId,
    prompt,
    reasoning,
    orders,
  });
}

/**
 * Apply trade pressure to prices based on net buy/sell volume.
 * Formula: price impact = 0.1% per 100 net shares traded
 * Buys push price up, sells push price down.
 */
export async function saveAgentSnapshots(tickNumber: number) {
  const agentRows = await getAgents();
  const snapshots: Record<string, number> = {};
  for (const agent of agentRows) {
    snapshots[agent.id] = parseFloat(agent.totalValue);
  }

  await db.update(ticks).set({
    agentSnapshots: snapshots,
  }).where(eq(ticks.tickNumber, tickNumber));
}

export async function applyTradePressure(
  allOrders: Array<{ ticker: string; action: string; quantity: number }>
) {
  const state = await getMarketState();
  if (!state) return;

  // Calculate net volume per ticker (positive = net buying, negative = net selling)
  const netVolume: Record<string, number> = {};
  for (const order of allOrders) {
    const delta = order.action === 'BUY' ? order.quantity : -order.quantity;
    netVolume[order.ticker] = (netVolume[order.ticker] || 0) + delta;
  }

  // Apply price pressure: 0.5% per 50 net shares (more impactful trading)
  const PRESSURE_FACTOR = 0.005; // 0.5% per 50 shares
  const BASE_VOLUME = 50;

  const newPrices: Record<string, number> = { ...state.prices };
  for (const ticker of TICKERS) {
    if (netVolume[ticker]) {
      const pressurePct = (netVolume[ticker] / BASE_VOLUME) * PRESSURE_FACTOR;
      newPrices[ticker] = newPrices[ticker] * (1 + pressurePct);
      // Clamp to bounds
      newPrices[ticker] = Math.max(1, Math.min(500, newPrices[ticker]));
      newPrices[ticker] = Math.round(newPrices[ticker] * 100) / 100;
    }
  }

  // Update market state with new prices
  await db.update(marketState).set({
    prices: newPrices,
    updatedAt: new Date(),
  }).where(eq(marketState.id, 1));

  // Also update the latest tick record
  const [latestTick] = await db.select().from(ticks).orderBy(desc(ticks.tickNumber)).limit(1);
  if (latestTick) {
    await db.update(ticks).set({
      prices: newPrices,
    }).where(eq(ticks.tickNumber, latestTick.tickNumber));
  }

  return { netVolume, newPrices };
}
