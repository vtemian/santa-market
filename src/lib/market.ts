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
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'claude-sonnet', name: 'Claude Sonnet' },
  { id: 'gemini-pro', name: 'Gemini Pro' },
  { id: 'grok', name: 'Grok' },
  { id: 'deepseek', name: 'Deepseek V3' },
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

  // Update prices with random walk + news impact
  const newPrices: Record<string, number> = {};
  for (const ticker of TICKERS) {
    let price = state.prices[ticker];

    // Random walk: ±0.5-2%
    const randomChange = (random() - 0.5) * 4; // -2% to +2%
    price = price * (1 + randomChange / 100);

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
  reasoning: string,
  orders: Array<{ ticker: string; action: string; quantity: number; price: number }>
) {
  await db.insert(trades).values({
    tickNumber,
    agentId,
    reasoning,
    orders,
  });
}
