'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DaySnapshot, AgentScore } from '@/app/components/types';

interface EquityChartProps {
  timeline: DaySnapshot[];
  scores: AgentScore[];
  selectedDay: number;
  onDaySelect: (day: number) => void;
}

// Define distinct colors for each model
const AGENT_COLORS: Record<string, string> = {
  'gpt-4o': '#10B981',           // emerald-500
  'claude-3-7-sonnet': '#3B82F6', // blue-500
  'gemini-2-flash': '#8B5CF6',    // violet-500
  'grok-2': '#F59E0B',            // amber-500
  'llama-3-3': '#EC4899',         // pink-500
  'deepseek-3': '#14B8A6',        // teal-500
};

export default function EquityChart({
  timeline,
  scores,
  selectedDay,
  onDaySelect,
}: EquityChartProps) {
  // Transform timeline data into Recharts format
  const chartData = timeline.map((snapshot) => {
    const dataPoint: Record<string, number> = {
      day: snapshot.day,
    };

    // Add each agent's equity for this day
    snapshot.agentLogs.forEach((log) => {
      dataPoint[log.agentId] = log.equity;
    });

    return dataPoint;
  });

  // Get agent IDs from scores to ensure consistent ordering
  const agentIds = scores.map((score) => score.agentId);

  // Custom tooltip to show all agent values
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded p-3">
          <p className="text-slate-200 font-semibold mb-2">
            Day {payload[0].payload.day}
          </p>
          {payload.map((entry: any) => (
            <p
              key={entry.dataKey}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.dataKey}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          onClick={(e) => {
            if (e && e.activeLabel) {
              onDaySelect(Number(e.activeLabel));
            }
          }}
        >
          <XAxis
            dataKey="day"
            label={{ value: 'Day', position: 'insideBottom', offset: -5 }}
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft' }}
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '10px',
              fontSize: '12px',
            }}
          />
          {agentIds.map((agentId) => (
            <Line
              key={agentId}
              type="monotone"
              dataKey={agentId}
              stroke={AGENT_COLORS[agentId] || '#64748b'}
              strokeWidth={selectedDay ? 1.5 : 2}
              dot={false}
              activeDot={{ r: 6 }}
              name={scores.find((s) => s.agentId === agentId)?.name || agentId}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
