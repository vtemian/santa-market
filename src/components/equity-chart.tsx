'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
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
  'gpt-5': {
    label: 'GPT-5.1',
    color: '#22c55e',
  },
  'claude-opus': {
    label: 'Claude Opus 4.5',
    color: '#3b82f6',
  },
  'gemini-pro': {
    label: 'Gemini 3 Pro',
    color: '#a855f7',
  },
  'grok': {
    label: 'Grok 4',
    color: '#f59e0b',
  },
  'deepseek': {
    label: 'Deepseek V3.2',
    color: '#14b8a6',
  },
} satisfies ChartConfig;

export function EquityChart({
  timeline,
  scores,
  selectedDay,
  onDaySelect,
}: EquityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Zoom state: [startIndex, endIndex] - null means show all
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);

  const fullChartData = timeline.map((snapshot) => {
    const dataPoint: Record<string, number> = { day: snapshot.day };
    snapshot.agentLogs.forEach((log) => {
      dataPoint[log.agentId] = log.equity;
    });
    return dataPoint;
  });

  const agentIds = scores.map((score) => score.agentId);

  // Apply zoom to get visible data
  const chartData = zoomRange
    ? fullChartData.slice(zoomRange[0], zoomRange[1] + 1)
    : fullChartData;

  // Store data length in ref for use in native event handler
  const dataLengthRef = useRef(fullChartData.length);
  dataLengthRef.current = fullChartData.length;

  // Handle mouse wheel zoom with native event listener to properly prevent scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const totalPoints = dataLengthRef.current;
      if (totalPoints <= 1) return;

      const zoomFactor = 0.1;
      const direction = e.deltaY > 0 ? 1 : -1; // positive = zoom out, negative = zoom in

      setZoomRange((prev) => {
        const [start, end] = prev ?? [0, totalPoints - 1];
        const currentRange = end - start;
        const center = (start + end) / 2;

        // Calculate new range
        const rangeChange = Math.max(1, Math.floor(currentRange * zoomFactor)) * direction;
        let newStart = Math.round(center - (currentRange + rangeChange) / 2);
        let newEnd = Math.round(center + (currentRange + rangeChange) / 2);

        // Clamp to valid bounds
        newStart = Math.max(0, newStart);
        newEnd = Math.min(totalPoints - 1, newEnd);

        // Ensure minimum visible points
        if (newEnd - newStart < 2) {
          return prev;
        }

        // If showing all data, return null
        if (newStart === 0 && newEnd === totalPoints - 1) {
          return null;
        }

        return [newStart, newEnd];
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Calculate dynamic Y-axis domain based on visible data
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

  const isZoomed = zoomRange !== null;

  return (
    <div className="border-2 border-foreground bg-card">
      <div className="border-b-2 border-foreground px-4 py-2 flex items-center justify-between">
        <span className="terminal-header">PORTFOLIO PERFORMANCE</span>
        <div className="flex items-center gap-2">
          {isZoomed && (
            <button
              onClick={() => setZoomRange(null)}
              className="font-mono text-xs px-2 py-1 border border-foreground hover:bg-muted"
            >
              RESET ZOOM
            </button>
          )}
          <span className="font-mono text-xs text-muted-foreground">
            scroll to zoom
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="p-4"
      >
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
              tickFormatter={(value) => `T${value}`}
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
                  labelFormatter={(value, payload) => {
                    const day = payload?.[0]?.payload?.day;
                    return `Tick ${day ?? value}`;
                  }}
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
            <ReferenceLine
              x={selectedDay}
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
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
