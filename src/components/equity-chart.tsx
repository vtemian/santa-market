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
  'claude-sonnet': {
    label: 'Claude Sonnet',
    color: '#3b82f6',
  },
  'gemini-pro': {
    label: 'Gemini Pro',
    color: '#a855f7',
  },
  'grok': {
    label: 'Grok',
    color: '#f59e0b',
  },
  'deepseek': {
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

  // Calculate dynamic Y-axis domain based on actual data
  const allValues = chartData.flatMap((point) =>
    agentIds.map((id) => point[id]).filter((v): v is number => v !== undefined)
  );
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100000;
  const range = maxValue - minValue;
  const padding = range > 0 ? range * 0.1 : 1000; // 10% padding, or $1k if flat
  const yDomain: [number, number] = [
    Math.floor((minValue - padding) / 100) * 100,
    Math.ceil((maxValue + padding) / 100) * 100,
  ];

  return (
    <div className="border-2 border-foreground bg-card">
      <div className="border-b-2 border-foreground px-4 py-2">
        <span className="terminal-header">PORTFOLIO PERFORMANCE</span>
      </div>
      <div className="p-4">
        <ChartContainer config={chartConfig} className="w-full" style={{ height: '700px' }}>
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
              domain={yDomain}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              width={55}
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
