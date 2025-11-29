'use client';

import { AgentDayLog, Prices, Ticker, TICKERS } from '@/sim/types';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface AgentCardProps {
  agentId: string;
  name: string;
  rank: number;
  dayLog: AgentDayLog;
  prices: Prices;
  initialCash: number;
}

export function AgentCard({
  name,
  rank,
  dayLog,
  prices,
  initialCash,
}: AgentCardProps) {
  const totalReturn = ((dayLog.equity - initialCash) / initialCash) * 100;
  const isPositive = totalReturn >= 0;

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
  }).filter((a) => a.percentage > 0);

  const cashValue = dayLog.portfolio?.cash || 0;
  const cashPercentage = dayLog.equity > 0 ? (cashValue / dayLog.equity) * 100 : 0;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="border-2 border-foreground bg-card">
      {/* Header */}
      <div className="border-b-2 border-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="terminal-header text-muted-foreground">#{rank}</span>
          <span className="terminal-header">{name}</span>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-bold">{formatCurrency(dayLog.equity)}</div>
          <div
            className={`font-mono text-sm font-bold flex items-center justify-end gap-1 ${
              isPositive ? 'text-secondary' : 'text-primary'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {formatPercentage(totalReturn)}
          </div>
        </div>
      </div>

      {/* Portfolio */}
      <div className="px-4 py-3 space-y-3">
        <div className="terminal-header text-xs text-muted-foreground">PORTFOLIO</div>

        {allocations.length > 0 ? (
          <div className="space-y-2">
            {allocations.map((allocation) => (
              <div key={allocation.ticker} className="space-y-1">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold">{allocation.ticker}</span>
                  <span className="text-muted-foreground">
                    {allocation.percentage.toFixed(1)}% | {formatCurrency(allocation.value)}
                  </span>
                </div>
                <div className="h-1 w-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all"
                    style={{ width: `${Math.min(allocation.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="font-mono text-xs text-muted-foreground">No positions</div>
        )}

        {/* Cash */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-muted-foreground">CASH</span>
            <span>
              <span className="font-bold">{formatCurrency(cashValue)}</span>
              <span className="text-muted-foreground ml-2">({cashPercentage.toFixed(1)}%)</span>
            </span>
          </div>
        </div>

        {/* Violations */}
        {dayLog.violations.length > 0 && (
          <div className="pt-2 border-t border-destructive">
            <div className="flex items-center gap-2 text-destructive font-mono text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>{dayLog.violations.length} violation(s)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
