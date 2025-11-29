'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { DaySnapshot, AgentScore } from '@/sim/types';

interface EquityChartProps {
  timeline: DaySnapshot[];
  scores: AgentScore[];
  selectedDay: number;
  onDaySelect: (day: number) => void;
}

const chartConfig = {
  'gpt-4o': {
    label: 'GPT-4o',
    color: '#22c55e',
  },
  'claude-3-7-sonnet': {
    label: 'Claude Sonnet',
    color: '#3b82f6',
  },
  'gemini-2-flash': {
    label: 'Gemini Flash',
    color: '#a855f7',
  },
  'grok-2': {
    label: 'Grok',
    color: '#f59e0b',
  },
  'llama-3-3': {
    label: 'Llama 3.3',
    color: '#ec4899',
  },
  'deepseek-3': {
    label: 'Deepseek V3',
    color: '#14b8a6',
  },
} satisfies ChartConfig;

export function EquityChart({
  timeline,
  scores,
  selectedDay,
  onDaySelect,
}: EquityChartProps) {
  const chartData = timeline.map((snapshot) => {
    const dataPoint: Record<string, number> = { day: snapshot.day };
    snapshot.agentLogs.forEach((log) => {
      dataPoint[log.agentId] = log.equity;
    });
    return dataPoint;
  });

  const agentIds = scores.map((score) => score.agentId);

  return (
    <div className="border-2 border-foreground bg-card h-full flex flex-col" style={{ minHeight: '400px' }}>
      <div className="border-b-2 border-foreground px-4 py-2">
        <span className="terminal-header">PORTFOLIO PERFORMANCE</span>
      </div>
      <div className="flex-1 p-4">
        <ChartContainer config={chartConfig} className="h-full w-full" style={{ minHeight: '320px' }}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            onClick={(e) => {
              if (e && e.activeLabel) {
                onDaySelect(Number(e.activeLabel));
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `D${value}`}
              style={{ fontFamily: 'monospace', fontSize: '10px' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              width={50}
              style={{ fontFamily: 'monospace', fontSize: '10px' }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Day ${value}`}
                  formatter={(value, name) => (
                    <div className="flex items-center justify-between gap-8 font-mono text-xs">
                      <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label || name}</span>
                      <span className="font-bold">${Number(value).toLocaleString()}</span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {agentIds.map((agentId) => (
              <Line
                key={agentId}
                type="monotone"
                dataKey={agentId}
                stroke={`var(--color-${agentId})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
