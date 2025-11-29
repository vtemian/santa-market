'use client';

import { useState } from 'react';
import { DaySnapshot, AgentScore, Order } from '@/app/components/types';

interface ModelThoughtsProps {
  timeline: DaySnapshot[];
  scores: AgentScore[];
  selectedDay: number;
}

// Map trading styles to badge colors
const STYLE_COLORS: Record<string, string> = {
  aggressive: 'bg-red-600/20 text-red-400 border-red-600/30',
  conservative: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  momentum: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  contrarian: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
};

export default function ModelThoughts({
  timeline,
  scores,
  selectedDay,
}: ModelThoughtsProps) {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  // Find the selected day's snapshot
  const snapshot = timeline.find((s) => s.day === selectedDay);

  if (!snapshot) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 rounded border border-slate-700">
        <p className="text-slate-500 text-sm">Select a day to view model reasoning</p>
      </div>
    );
  }

  const toggleExpand = (agentId: string) => {
    const newExpanded = new Set(expandedAgents);
    if (newExpanded.has(agentId)) {
      newExpanded.delete(agentId);
    } else {
      newExpanded.add(agentId);
    }
    setExpandedAgents(newExpanded);
  };

  const formatOrders = (orders: Order[]): string => {
    if (orders.length === 0) {
      return 'No trades';
    }
    return orders.map((o) => `${o.action} ${o.ticker} x${o.quantity}`).join(', ');
  };

  const shouldTruncate = (text: string): boolean => {
    return text.length > 300;
  };

  const getTruncatedText = (text: string): string => {
    return text.substring(0, 300) + '...';
  };

  return (
    <div className="h-full bg-slate-900 rounded border border-slate-700 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
        <h3 className="text-slate-200 font-semibold">Model Reasoning</h3>
        <p className="text-slate-400 text-sm mt-1">Day {selectedDay}</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {snapshot.agentLogs.map((log) => {
          const agentScore = scores.find((s) => s.agentId === log.agentId);
          const isExpanded = expandedAgents.has(log.agentId);
          const needsTruncation = shouldTruncate(log.reasoning);
          const displayText = isExpanded || !needsTruncation
            ? log.reasoning
            : getTruncatedText(log.reasoning);

          return (
            <div
              key={log.agentId}
              className="bg-slate-800 border border-slate-700 rounded p-4 space-y-3"
            >
              {/* Agent header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-medium">
                    {agentScore?.name || log.agentId}
                  </span>
                  {agentScore && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded border ${
                        STYLE_COLORS[agentScore.tradingStyle] ||
                        'bg-slate-600/20 text-slate-400 border-slate-600/30'
                      }`}
                    >
                      {agentScore.tradingStyle}
                    </span>
                  )}
                </div>
                <span className="text-slate-500 text-xs">Day {snapshot.day}</span>
              </div>

              {/* Reasoning text */}
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {displayText}
                {needsTruncation && (
                  <button
                    onClick={() => toggleExpand(log.agentId)}
                    className="ml-2 text-blue-400 hover:text-blue-300 text-xs underline"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              {/* Orders executed */}
              <div className="pt-2 border-t border-slate-700">
                <span className="text-slate-400 text-xs">
                  → {formatOrders(log.orders)}
                </span>
              </div>

              {/* Violations */}
              {log.violations.length > 0 && (
                <div className="pt-2 border-t border-slate-700">
                  <div className="text-red-400 text-xs space-y-1">
                    {log.violations.map((violation, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span>⚠</span>
                        <span>{violation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
