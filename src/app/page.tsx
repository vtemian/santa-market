'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationResult, DaySnapshot, AgentScore } from '@/sim/types';
import { EquityChart } from '@/components/equity-chart';
import { ModelThoughts } from '@/components/model-thoughts';
import { AgentCard } from '@/components/agent-card';
import { ReplayControls } from '@/components/replay-controls';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface ScenarioOption {
  id: string;
  name: string;
  description: string;
}

interface SimulationProgress {
  type: 'day' | 'complete' | 'error';
  day?: number;
  totalDays: number;
  snapshot?: DaySnapshot;
  result?: SimulationResult;
  message?: string;
}

const INITIAL_CASH = 100000;
const TOTAL_DAYS = 14;

// Agent name mapping for display during streaming
const AGENT_NAMES: Record<string, string> = {
  'gpt-4o': 'GPT-4o',
  'claude-sonnet': 'Claude Sonnet',
  'gemini-pro': 'Gemini Pro',
  'grok': 'Grok',
  'deepseek': 'Deepseek V3',
  'llama': 'Llama 3.1 70B',
};

// Generate temporary scores during streaming (before final scoring)
function generateTempScores(timeline: DaySnapshot[]): AgentScore[] {
  if (timeline.length === 0) return [];

  const latestSnapshot = timeline[timeline.length - 1];
  const agentEquities: { agentId: string; equity: number }[] = [];

  for (const log of latestSnapshot.agentLogs) {
    agentEquities.push({ agentId: log.agentId, equity: log.equity });
  }

  // Sort by equity descending to assign ranks
  agentEquities.sort((a, b) => b.equity - a.equity);

  return agentEquities.map((agent, idx) => ({
    agentId: agent.agentId,
    name: AGENT_NAMES[agent.agentId] || agent.agentId,
    finalValue: agent.equity,
    totalReturn: ((agent.equity - INITIAL_CASH) / INITIAL_CASH) * 100,
    maxDrawdown: 0,
    totalTrades: 0,
    turnover: 0,
    violations: [],
    tradingStyle: 'conservative',
    score: 0,
    rank: idx + 1,
  }));
}

export default function Home() {
  const [scenarios, setScenarios] = useState<ScenarioOption[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('calm-q4');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1);

  // Streaming state
  const [streamingTimeline, setStreamingTimeline] = useState<DaySnapshot[]>([]);
  const [currentSimDay, setCurrentSimDay] = useState<number>(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch('/api/run-sim')
      .then((res) => res.json())
      .then((data) => setScenarios(data.scenarios))
      .catch((err) => console.error('Failed to load scenarios:', err));
  }, []);

  const runSimulation = useCallback(async () => {
    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setIsStreaming(true);
    setError(null);
    setResult(null);
    setStreamingTimeline([]);
    setCurrentSimDay(0);
    setSelectedDay(1);
    setIsPlaying(false);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch('/api/run-sim/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: selectedScenario }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        throw new Error('Simulation failed');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6)) as SimulationProgress;

            if (data.type === 'day' && data.snapshot) {
              setStreamingTimeline(prev => [...prev, data.snapshot!]);
              setCurrentSimDay(data.day || 0);
              setSelectedDay(data.day || 1);
            } else if (data.type === 'complete' && data.result) {
              setResult(data.result);
              setIsStreaming(false);
              setLoading(false);
            } else if (data.type === 'error') {
              setError(data.message || 'Simulation failed');
              setIsStreaming(false);
              setLoading(false);
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
      setIsStreaming(false);
      setLoading(false);
    }
  }, [selectedScenario]);

  // Use streaming timeline during streaming, final result after complete
  const activeTimeline = result?.timeline || streamingTimeline;
  const timelineLength = activeTimeline.length;

  useEffect(() => {
    if (!isPlaying || timelineLength === 0) return;

    const interval = playSpeed === 1 ? 1000 : playSpeed === 2 ? 500 : 250;
    const timer = setInterval(() => {
      setSelectedDay((current) => {
        if (current >= timelineLength) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, timelineLength]);

  const handlePlay = () => {
    if (timelineLength > 0 && selectedDay < timelineLength) {
      setIsPlaying(true);
    }
  };

  const handlePause = () => setIsPlaying(false);

  const handlePrevDay = () => {
    if (selectedDay > 1) {
      setSelectedDay(selectedDay - 1);
      setIsPlaying(false);
    }
  };

  const handleNextDay = () => {
    if (selectedDay < timelineLength) {
      setSelectedDay(selectedDay + 1);
    }
  };

  const handleReset = () => {
    setSelectedDay(1);
    setIsPlaying(false);
  };

  const handleSetSpeed = (speed: number) => setPlaySpeed(speed);

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    setIsPlaying(false);
  };
  const activeScores = result?.scores || generateTempScores(streamingTimeline);
  const hasData = activeTimeline.length > 0;

  const currentPrices = activeTimeline[selectedDay - 1]?.prices;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <h1 className="terminal-header text-base">SANTA MARKET</h1>
            <nav className="hidden md:flex items-center gap-4">
              <span className="terminal-header text-primary">LIVE</span>
              <span className="text-muted-foreground">|</span>
              <span className="terminal-header text-muted-foreground hover:text-foreground cursor-pointer">LEADERBOARD</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedScenario}
              onValueChange={setSelectedScenario}
              disabled={loading}
            >
              <SelectTrigger className="w-[160px] border-2 border-foreground rounded-none font-mono text-xs">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2 border-foreground">
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="font-mono text-xs">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={runSimulation}
              disabled={loading}
              className="rounded-none border-2 border-foreground bg-secondary hover:bg-secondary/90 text-secondary-foreground font-mono text-xs font-bold px-4"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  DAY {currentSimDay}/{TOTAL_DAYS}
                </>
              ) : (
                'RUN SIM'
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar during streaming */}
      {isStreaming && (
        <div className="border-b-2 border-secondary bg-secondary/10">
          <div className="container px-4 py-2">
            <div className="flex items-center gap-4">
              <span className="terminal-header text-xs text-secondary">SIMULATING</span>
              <div className="flex-1 h-2 bg-muted border border-foreground">
                <div
                  className="h-full bg-secondary transition-all duration-300"
                  style={{ width: `${(currentSimDay / TOTAL_DAYS) * 100}%` }}
                />
              </div>
              <span className="font-mono text-xs">DAY {currentSimDay}/{TOTAL_DAYS}</span>
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
      {currentPrices && (
        <div className="border-b-2 border-foreground bg-muted">
          <div className="container px-4 py-2">
            <div className="flex items-center gap-6 overflow-x-auto">
              {Object.entries(currentPrices).map(([ticker, price]) => (
                <div key={ticker} className="flex items-center gap-2 shrink-0">
                  <span className="terminal-header text-muted-foreground">{ticker}</span>
                  <span className="font-mono text-sm font-bold text-secondary">
                    ${price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {hasData ? (
        <div className="container px-4 py-6 space-y-6">
          {/* Chart + Thoughts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: '450px' }}>
            <div className="lg:col-span-3" style={{ minHeight: '400px' }}>
              <EquityChart
                timeline={activeTimeline}
                scores={activeScores}
                selectedDay={selectedDay}
                onDaySelect={handleDaySelect}
              />
            </div>
            <div className="lg:col-span-2" style={{ minHeight: '400px' }}>
              <ModelThoughts
                timeline={activeTimeline}
                scores={activeScores}
                selectedDay={selectedDay}
              />
            </div>
          </div>

          {/* Replay Controls */}
          <ReplayControls
            currentDay={selectedDay}
            totalDays={activeTimeline.length || TOTAL_DAYS}
            isPlaying={isPlaying}
            speed={playSpeed}
            onPlay={handlePlay}
            onPause={handlePause}
            onPrevDay={handlePrevDay}
            onNextDay={handleNextDay}
            onSetSpeed={handleSetSpeed}
            onReset={handleReset}
            onDaySelect={handleDaySelect}
          />

          {/* Agent Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeScores.map((score) => {
              const dayLog = activeTimeline[selectedDay - 1]?.agentLogs.find(
                (log) => log.agentId === score.agentId
              );
              const prices = activeTimeline[selectedDay - 1]?.prices;

              if (!dayLog || !prices) return null;

              return (
                <AgentCard
                  key={score.agentId}
                  agentId={score.agentId}
                  name={score.name}
                  rank={score.rank}
                  dayLog={dayLog}
                  prices={prices}
                  initialCash={INITIAL_CASH}
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="container px-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4 max-w-md">
            <div className="terminal-header text-2xl">READY TO TRADE</div>
            <p className="terminal-text text-muted-foreground">
              Select a scenario and click RUN SIM to watch AI models
              compete as portfolio managers in a Christmas-themed market.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <div className="text-center">
                <div className="terminal-header text-primary text-lg">6</div>
                <div className="terminal-text text-xs text-muted-foreground">MODELS</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="terminal-header text-secondary text-lg">5</div>
                <div className="terminal-text text-xs text-muted-foreground">TICKERS</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="terminal-header text-lg">$100K</div>
                <div className="terminal-text text-xs text-muted-foreground">STARTING</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
