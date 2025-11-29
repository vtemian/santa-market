'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DaySnapshot, AgentScore, Order } from '@/sim/types';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface ModelThoughtsProps {
  timeline: DaySnapshot[];
  scores: AgentScore[];
  selectedDay: number;
}

export function ModelThoughts({
  timeline,
  scores,
  selectedDay,
}: ModelThoughtsProps) {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  const snapshot = timeline.find((s) => s.day === selectedDay);

  if (!snapshot) {
    return (
      <div className="border-2 border-foreground bg-card h-full flex items-center justify-center">
        <p className="terminal-text text-muted-foreground">
          Select a day to view model reasoning
        </p>
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
    if (orders.length === 0) return 'No trades';
    return orders.map((o) => `${o.action} ${o.ticker} x${o.quantity}`).join(', ');
  };

  const shouldTruncate = (text: string): boolean => text.length > 200;

  return (
    <div className="border-2 border-foreground bg-card h-full flex flex-col" style={{ minHeight: '400px' }}>
      <div className="border-b-2 border-foreground px-4 py-2 flex items-center justify-between">
        <span className="terminal-header">MODEL REASONING</span>
        <span className="font-mono text-xs text-muted-foreground">DAY {selectedDay}</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {snapshot.agentLogs.map((log) => {
            const agentScore = scores.find((s) => s.agentId === log.agentId);
            const isExpanded = expandedAgents.has(log.agentId);
            const needsTruncation = shouldTruncate(log.reasoning);
            const displayText =
              isExpanded || !needsTruncation
                ? log.reasoning
                : log.reasoning.substring(0, 200) + '...';

            return (
              <div
                key={log.agentId}
                className="border border-border p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="terminal-header text-xs">
                    {agentScore?.name || log.agentId}
                  </span>
                  {agentScore && (
                    <span className="font-mono text-xs text-muted-foreground uppercase">
                      {agentScore.tradingStyle}
                    </span>
                  )}
                </div>

                <p className="font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {displayText}
                </p>

                {needsTruncation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(log.agentId)}
                    className="h-6 px-2 text-xs font-mono rounded-none"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        LESS
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        MORE
                      </>
                    )}
                  </Button>
                )}

                <div className="pt-2 border-t border-border">
                  <div className="font-mono text-xs text-secondary">
                    &gt; {formatOrders(log.orders)}
                  </div>
                </div>

                {log.violations.length > 0 && (
                  <div className="pt-2 border-t border-destructive">
                    {log.violations.map((violation, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 font-mono text-xs text-destructive"
                      >
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{violation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
