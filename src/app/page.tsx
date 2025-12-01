'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { EquityChart } from '@/components/equity-chart';
import { ModelThoughts } from '@/components/model-thoughts';
import { AgentCard } from '@/components/agent-card';
import type { Prices, Ticker, Order } from '@/sim/types';

interface NewsItem {
  type?: string;
  headline?: string;
  message: string;
  impact: Record<string, number>;
}

interface MarketData {
  tickNumber: number;
  prices: Record<string, number>;
  season: string;
  news: NewsItem | null;
  nextTickAt: string;
  agents: Array<{
    id: string;
    name: string;
    rank: number;
    cash: number;
    holdings: Record<string, number>;
    totalValue: number;
  }>;
  tradesByAgent: Record<string, {
    prompt: string;
    reasoning: string;
    orders: Array<{ ticker: string; action: string; quantity: number; price: number }>;
  }>;
  priceHistory: Array<{
    tick: number;
    prices: Record<string, number>;
    news: NewsItem | null;
    agentSnapshots: Record<string, number> | null;
  }>;
}

const INITIAL_CASH = 100000;
const POLL_INTERVAL = 15000; // 15 seconds

// Format seconds into MM:SS
function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Calculate time until next tick
function getSecondsUntilTick(nextTickAt: string): number {
  const now = new Date().getTime();
  const next = new Date(nextTickAt).getTime();
  const diff = Math.max(0, Math.floor((next - now) / 1000));
  return diff;
}

export default function Home() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [ticking, setTicking] = useState(false);
  const [selectedNews, setSelectedNews] = useState<{
    tick: number;
    headline: string;
    message: string;
    type?: string;
    impact: Record<string, number>;
  } | null>(null);
  const [selectedTick, setSelectedTick] = useState<number | null>(null);

  // Manual tick trigger (for local development)
  const triggerTick = async () => {
    setTicking(true);
    try {
      const res = await fetch('/api/cron/tick');
      if (!res.ok) {
        throw new Error('Tick failed');
      }
      // Refresh market data after tick
      await fetchMarketData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tick failed');
    } finally {
      setTicking(false);
    }
  };

  // Fetch market data
  const fetchMarketData = async () => {
    try {
      const res = await fetch('/api/market');
      if (!res.ok) {
        throw new Error('Failed to fetch market data');
      }
      const data: MarketData = await res.json();
      setMarketData(data);
      setCountdown(getSecondsUntilTick(data.nextTickAt));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates every 15 seconds
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer (updates every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate price changes for ticker bar
  const getPriceChange = (ticker: string): number => {
    if (!marketData || marketData.priceHistory.length < 2) return 0;
    const current = marketData.prices[ticker];
    const previous = marketData.priceHistory[marketData.priceHistory.length - 2]?.prices[ticker];
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Collect recent headlines from price history
  const getRecentHeadlines = (): Array<{
    tick: number;
    headline: string;
    message: string;
    type?: string;
    impact: Record<string, number>;
  }> => {
    if (!marketData) return [];

    const headlines: Array<{
      tick: number;
      headline: string;
      message: string;
      type?: string;
      impact: Record<string, number>;
    }> = [];

    // Get headlines from recent ticks (reversed so newest first)
    for (const tick of [...marketData.priceHistory].reverse()) {
      if (tick.news?.headline) {
        headlines.push({
          tick: tick.tick,
          headline: tick.news.headline,
          message: tick.news.message,
          type: tick.news.type,
          impact: tick.news.impact,
        });
      }
    }

    // Also add current news if not already in history
    if (marketData.news?.headline) {
      const alreadyIncluded = headlines.some(h => h.tick === marketData.tickNumber);
      if (!alreadyIncluded) {
        headlines.unshift({
          tick: marketData.tickNumber,
          headline: marketData.news.headline,
          message: marketData.news.message,
          type: marketData.news.type,
          impact: marketData.news.impact,
        });
      }
    }

    return headlines.slice(0, 10); // Limit to 10 headlines
  };

  // Transform market data for chart component
  const getTimelineForChart = () => {
    if (!marketData) return [];

    return marketData.priceHistory.map((tick) => ({
      day: tick.tick,
      prices: tick.prices as Prices,
      events: [],
      agentLogs: marketData.agents.map((agent) => {
        const trade = marketData.tradesByAgent[agent.id];
        const orders: Order[] = trade?.orders?.map(order => ({
          ticker: order.ticker as Ticker,
          action: order.action as 'BUY' | 'SELL',
          quantity: order.quantity,
        })) || [];

        return {
          agentId: agent.id,
          equity: tick.agentSnapshots?.[agent.id] ?? agent.totalValue,
          prompt: trade?.prompt || '',
          reasoning: trade?.reasoning || '',
          orders,
          violations: [],
          portfolio: {
            cash: agent.cash,
            holdings: agent.holdings as Record<Ticker, number>,
          },
        };
      }),
    }));
  };

  // Transform agents for chart scores
  const getScoresForChart = () => {
    if (!marketData) return [];

    return marketData.agents.map((agent) => ({
      agentId: agent.id,
      name: agent.name,
      rank: agent.rank,
      finalValue: agent.totalValue,
      totalReturn: ((agent.totalValue - INITIAL_CASH) / INITIAL_CASH) * 100,
      maxDrawdown: 0,
      totalTrades: 0,
      turnover: 0,
      violations: [],
      tradingStyle: 'conservative' as const,
      score: 0,
    }));
  };

  const timeline = getTimelineForChart();
  const scores = getScoresForChart();
  const currentSnapshot = timeline[timeline.length - 1];
  const headlines = getRecentHeadlines();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Santa's Market" width={32} height={32} />
              <h1 className="terminal-header text-base">SANTA'S MARKET</h1>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <span className="terminal-header text-primary">LIVE</span>
              <span className="text-muted-foreground">|</span>
              <a href="/about" className="terminal-header text-muted-foreground hover:text-foreground cursor-pointer">ABOUT</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {marketData && (
              <div className="flex items-center gap-2 px-3 py-1 border-2 border-foreground bg-muted">
                <span className="terminal-header text-xs text-muted-foreground">TICK</span>
                <span className="font-mono text-sm font-bold">{marketData.tickNumber}</span>
              </div>
            )}
{process.env.NODE_ENV === 'development' && (
              <button
                onClick={triggerTick}
                disabled={ticking}
                className="px-3 py-1 border-2 border-primary bg-primary/20 hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs font-bold text-primary"
              >
                {ticking ? 'TICKING...' : 'TICK NOW'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Countdown Timer */}
      {marketData && (
        <div className="border-b-2 border-secondary bg-secondary/10">
          <div className="container px-4 py-2">
            <div className="flex items-center gap-4">
              <span className="terminal-header text-xs text-secondary">NEXT TICK IN</span>
              <div className="flex-1 h-2 bg-muted border border-foreground max-w-md">
                <div
                  className="h-full bg-secondary transition-all duration-1000"
                  style={{ width: `${Math.max(0, 100 - (countdown / 600) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-sm font-bold text-secondary min-w-[3rem]">
                {formatCountdown(countdown)}
              </span>
              <span className="terminal-text text-xs text-muted-foreground uppercase">
                {marketData.season.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* News Ticker */}
      {headlines.length > 0 && (
        <div className="border-b-2 border-primary bg-primary/10">
          <div className="flex items-center">
            <div className="px-4 py-2 border-r-2 border-primary bg-primary/20 shrink-0">
              <span className="terminal-header text-xs text-primary">NEWS</span>
            </div>
            <div className="news-ticker flex-1 py-2">
              <div className="news-ticker-content">
                {/* Duplicate headlines for seamless loop */}
                {[...headlines, ...headlines].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedNews(item)}
                    className="terminal-text text-sm px-8 shrink-0 hover:text-primary cursor-pointer transition-colors"
                  >
                    <span className="text-primary font-bold mr-2">
                      {item.type?.toUpperCase() || 'NEWS'}
                    </span>
                    {item.headline}
                    <span className="text-muted-foreground ml-4">#{item.tick}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="border-b-2 border-destructive bg-destructive/10 px-4 py-2">
          <p className="container terminal-text text-destructive">{error}</p>
        </div>
      )}

      {/* Price Ticker */}
      {marketData?.prices && (
        <div className="border-b-2 border-foreground bg-muted">
          <div className="container px-4 py-2">
            <div className="flex items-center gap-6 overflow-x-auto">
              {Object.entries(marketData.prices).map(([ticker, price]) => {
                const change = getPriceChange(ticker);
                const isPositive = change > 0;
                const isNegative = change < 0;

                return (
                  <div key={ticker} className="flex items-center gap-2 shrink-0">
                    <span className="terminal-header text-muted-foreground">{ticker}</span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      ${price.toFixed(2)}
                    </span>
                    {change !== 0 && (
                      <span
                        className={`font-mono text-xs ${
                          isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''
                        }`}
                      >
                        {isPositive ? '+' : ''}{change.toFixed(1)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="container px-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="terminal-header text-2xl">LOADING MARKET DATA...</div>
          </div>
        </div>
      ) : marketData ? (
        <div className="container px-4 py-6 space-y-6">
          {/* Chart + Thoughts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: '450px' }}>
            <div className="lg:col-span-3" style={{ minHeight: '400px' }}>
              <EquityChart
                timeline={timeline}
                scores={scores}
                selectedDay={selectedTick ?? timeline[timeline.length - 1]?.day ?? 0}
                onDaySelect={setSelectedTick}
              />
            </div>
            <div className="lg:col-span-2" style={{ minHeight: '400px' }}>
              <ModelThoughts
                timeline={timeline}
                scores={scores}
                selectedDay={selectedTick ?? timeline[timeline.length - 1]?.day ?? 0}
              />
            </div>
          </div>

          {/* Agent Leaderboard */}
          <div>
            <h2 className="terminal-header text-lg mb-4">AGENT LEADERBOARD</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketData.agents.map((agent) => {
                const dayLog = currentSnapshot?.agentLogs.find(
                  (log) => log.agentId === agent.id
                );

                if (!dayLog || !marketData.prices) return null;

                return (
                  <AgentCard
                    key={agent.id}
                    agentId={agent.id}
                    name={agent.name}
                    rank={agent.rank}
                    dayLog={dayLog}
                    prices={marketData.prices as Prices}
                    initialCash={INITIAL_CASH}
                  />
                );
              })}
            </div>
          </div>

          {/* Recent Trades Section */}
          <div>
            <h2 className="terminal-header text-lg mb-4">RECENT TRADES (TICK {marketData.tickNumber})</h2>
            <div className="space-y-3">
              {marketData.agents.map((agent) => {
                const trade = marketData.tradesByAgent[agent.id];
                if (!trade || !trade.orders || trade.orders.length === 0) return null;

                return (
                  <div
                    key={agent.id}
                    className="border-2 border-foreground bg-card p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="terminal-header text-sm">{agent.name}</span>
                        <span className="text-xs text-muted-foreground">#{agent.rank}</span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {trade.orders.length} order{trade.orders.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="space-y-1 mb-2">
                      {trade.orders.map((order, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-mono">
                          <span
                            className={`font-bold ${
                              order.action === 'BUY' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {order.action}
                          </span>
                          <span>{order.quantity}</span>
                          <span className="text-muted-foreground">{order.ticker}</span>
                          <span className="text-muted-foreground">@</span>
                          <span>${order.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {trade.reasoning && (
                      <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                        {trade.reasoning}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="container px-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4 max-w-md">
            <div className="terminal-header text-2xl">MARKET OFFLINE</div>
            <p className="terminal-text text-muted-foreground">
              The market is currently offline. Please try again later.
            </p>
          </div>
        </div>
      )}

      {/* News Modal */}
      {selectedNews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedNews(null)}
        >
          <div
            className="bg-background border-2 border-foreground max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-foreground p-4">
              <div className="flex items-center gap-3">
                <span className="terminal-header text-xs text-primary px-2 py-1 border border-primary">
                  {selectedNews.type?.toUpperCase() || 'NEWS'}
                </span>
                <span className="terminal-header text-xs text-muted-foreground">
                  TICK #{selectedNews.tick}
                </span>
              </div>
              <button
                onClick={() => setSelectedNews(null)}
                className="terminal-header text-sm hover:text-primary transition-colors"
              >
                [X] CLOSE
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <h2 className="terminal-header text-lg mb-4">{selectedNews.headline}</h2>
              <div className="terminal-text text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {selectedNews.message}
              </div>

              {/* Market Impact */}
              {Object.keys(selectedNews.impact).length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <h3 className="terminal-header text-xs text-muted-foreground mb-3">MARKET IMPACT</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(selectedNews.impact).map(([ticker, impact]) => (
                      <div
                        key={ticker}
                        className={`px-3 py-1 border font-mono text-sm ${
                          impact > 0
                            ? 'border-green-600 text-green-600'
                            : impact < 0
                            ? 'border-red-600 text-red-600'
                            : 'border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        {ticker} {impact > 0 ? '+' : ''}{impact}%
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
