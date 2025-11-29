'use client';

import { AgentDayLog, Prices, Ticker } from '@/app/components/types';
import { TICKERS } from '@/sim/types';

interface AgentCardProps {
  agentId: string;
  name: string;
  rank: number;
  dayLog: AgentDayLog;
  prices: Prices;
  initialCash: number;
}

// Ticker colors for allocation bars
const TICKER_COLORS: Record<Ticker, string> = {
  SANTA: '#10B981',
  REIN: '#3B82F6',
  ELF: '#8B5CF6',
  COAL: '#6B7280',
  GIFT: '#EC4899',
};

export default function AgentCard({
  agentId,
  name,
  rank,
  dayLog,
  prices,
  initialCash,
}: AgentCardProps) {
  // Calculate total return
  const totalReturn = ((dayLog.equity - initialCash) / initialCash) * 100;
  const isPositive = totalReturn >= 0;

  // Get rank badge
  const getRankBadge = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  // Calculate portfolio allocations
  interface Allocation {
    ticker: Ticker;
    value: number;
    percentage: number;
  }

  const allocations: Allocation[] = TICKERS.map((ticker) => {
    const holdings = dayLog.portfolio?.holdings[ticker] || 0;
    const value = holdings * prices[ticker];
    const percentage = dayLog.equity > 0 ? (value / dayLog.equity) * 100 : 0;
    return { ticker, value, percentage };
  }).filter((a) => a.percentage > 0); // Only show tickers with holdings

  // Calculate cash allocation
  const cashValue = dayLog.portfolio?.cash || 0;
  const cashPercentage = dayLog.equity > 0 ? (cashValue / dayLog.equity) * 100 : 0;

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
      {/* Header: Name, Rank, Equity */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getRankBadge(rank)}</span>
          <span className="text-slate-200 font-medium">{name}</span>
        </div>
        <div className="text-right">
          <div className="text-slate-200 font-semibold">
            {formatCurrency(dayLog.equity)}
          </div>
          <div
            className={`text-sm font-medium ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatPercentage(totalReturn)}
          </div>
        </div>
      </div>

      {/* Portfolio Allocation Bars */}
      {allocations.length > 0 && (
        <div className="space-y-2">
          <div className="text-slate-400 text-xs font-medium">Portfolio Allocation</div>
          {allocations.map((allocation) => (
            <div key={allocation.ticker} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{allocation.ticker}</span>
                <span className="text-slate-400">
                  {allocation.percentage.toFixed(1)}% • {formatCurrency(allocation.value)}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="rounded-full h-2 transition-all duration-300"
                  style={{
                    width: `${allocation.percentage}%`,
                    backgroundColor: TICKER_COLORS[allocation.ticker],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cash Remaining */}
      <div className="pt-2 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Cash</span>
          <div className="text-right">
            <span className="text-slate-300 font-medium">
              {formatCurrency(cashValue)}
            </span>
            <span className="text-slate-500 ml-2">
              ({cashPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Violations warning */}
      {dayLog.violations.length > 0 && (
        <div className="pt-2 border-t border-slate-700">
          <div className="text-red-400 text-xs flex items-center gap-1">
            <span>⚠</span>
            <span>{dayLog.violations.length} violation(s)</span>
          </div>
        </div>
      )}
    </div>
  );
}
