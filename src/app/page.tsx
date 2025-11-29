'use client';

import { useState, useEffect } from 'react';
import { SimulationResult, ScenarioOption } from './components/types';
import EquityChart from './components/EquityChart';
import ModelThoughts from './components/ModelThoughts';
import AgentCard from './components/AgentCard';
import ReplayControls from './components/ReplayControls';

const INITIAL_CASH = 100000;

export default function Home() {
  // Scenario management
  const [scenarios, setScenarios] = useState<ScenarioOption[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('calm-q4');

  // Simulation state
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Replay state
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1);

  // Fetch scenarios on mount
  useEffect(() => {
    fetch('/api/run-sim')
      .then(res => res.json())
      .then(data => setScenarios(data.scenarios))
      .catch(err => console.error('Failed to load scenarios:', err));
  }, []);

  // Run simulation
  const runSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/run-sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: selectedScenario }),
      });

      if (!res.ok) {
        throw new Error('Simulation failed');
      }

      const data = await res.json();
      setResult(data);
      setSelectedDay(1);
      setIsPlaying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Replay logic - auto-advance days when playing
  useEffect(() => {
    if (!isPlaying || !result) return;

    const interval = playSpeed === 1 ? 1000 : playSpeed === 2 ? 500 : 250;
    const timer = setInterval(() => {
      setSelectedDay((current) => {
        if (current >= result.timeline.length) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, result]);

  // Replay controls handlers
  const handlePlay = () => {
    if (result && selectedDay < result.timeline.length) {
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handlePrevDay = () => {
    if (selectedDay > 1) {
      setSelectedDay(selectedDay - 1);
      setIsPlaying(false);
    }
  };

  const handleNextDay = () => {
    if (result && selectedDay < result.timeline.length) {
      setSelectedDay(selectedDay + 1);
    }
  };

  const handleReset = () => {
    setSelectedDay(1);
    setIsPlaying(false);
  };

  const handleSetSpeed = (speed: number) => {
    setPlaySpeed(speed);
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    setIsPlaying(false);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-green-400">
            🎄 SANTA MARKET
          </h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-slate-200"
              disabled={loading}
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={runSimulation}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-6 py-2 rounded font-semibold transition-colors"
            >
              {loading ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      </header>

      {/* Error display */}
      {error && (
        <div className="mx-6 mt-4 bg-red-900/50 border border-red-500 rounded p-4">
          {error}
        </div>
      )}

      {/* Price Ticker Bar */}
      {result && selectedDay > 0 && selectedDay <= result.timeline.length && (
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 overflow-x-auto">
          <div className="flex items-center gap-6 text-sm font-mono">
            {Object.entries(result.timeline[selectedDay - 1].prices).map(([ticker, price]) => (
              <div key={ticker} className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">{ticker}</span>
                <span className="text-green-400">${price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard - only show if we have results */}
      {result && (
        <div className="p-6 space-y-6">
          {/* Chart and Model Thoughts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ height: '500px' }}>
            {/* Left: Equity Chart (60% width) */}
            <div className="lg:col-span-3">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 h-full">
                <h2 className="text-lg font-semibold text-slate-200 mb-4">
                  Portfolio Value Over Time
                </h2>
                <div style={{ height: 'calc(100% - 40px)' }}>
                  <EquityChart
                    timeline={result.timeline}
                    scores={result.scores}
                    selectedDay={selectedDay}
                    onDaySelect={handleDaySelect}
                  />
                </div>
              </div>
            </div>

            {/* Right: Model Thoughts (40% width) */}
            <div className="lg:col-span-2 h-full">
              <ModelThoughts
                timeline={result.timeline}
                scores={result.scores}
                selectedDay={selectedDay}
              />
            </div>
          </div>

          {/* Replay Controls */}
          <ReplayControls
            currentDay={selectedDay}
            totalDays={result.timeline.length}
            isPlaying={isPlaying}
            speed={playSpeed}
            onPlay={handlePlay}
            onPause={handlePause}
            onPrevDay={handlePrevDay}
            onNextDay={handleNextDay}
            onSetSpeed={handleSetSpeed}
            onReset={handleReset}
          />

          {/* Agent Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.scores.map((score) => {
              const dayLog = result.timeline[selectedDay - 1]?.agentLogs.find(
                (log) => log.agentId === score.agentId
              );
              const prices = result.timeline[selectedDay - 1]?.prices;

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
      )}

      {/* Empty state - show when no results */}
      {!result && !loading && (
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="text-center space-y-4">
            <p className="text-slate-400 text-lg">
              Select a scenario and click "Run Simulation" to begin
            </p>
            <p className="text-slate-500 text-sm">
              AI models compete as portfolio managers in a Christmas-themed market
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
