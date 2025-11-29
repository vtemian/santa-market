'use client';

import { useState, useEffect } from 'react';
import { SimulationResult, ScenarioOption } from './components/types';

export default function Home() {
  const [scenarios, setScenarios] = useState<ScenarioOption[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('calm-q4');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch scenarios on mount
  useEffect(() => {
    fetch('/api/run-sim')
      .then(res => res.json())
      .then(data => setScenarios(data.scenarios))
      .catch(err => console.error('Failed to load scenarios:', err));
  }, []);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-green-400 mb-2">
          🎄 Santa Market
        </h1>
        <p className="text-slate-400">
          AI models compete as portfolio managers in a Christmas-themed market
        </p>
      </header>

      <div className="flex gap-4 mb-8">
        <select
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-4 py-2"
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
          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-6 py-2 rounded font-semibold"
        >
          {loading ? 'Running...' : 'Run Simulation'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-8">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Final Standings</h2>
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Model</th>
                    <th className="px-4 py-3 text-right">Final Value</th>
                    <th className="px-4 py-3 text-right">Return</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-left">Style</th>
                  </tr>
                </thead>
                <tbody>
                  {result.scores.map((score) => (
                    <tr key={score.agentId} className="border-t border-slate-700">
                      <td className="px-4 py-3">
                        {score.rank === 1 ? '🥇' : score.rank === 2 ? '🥈' : score.rank === 3 ? '🥉' : score.rank}
                      </td>
                      <td className="px-4 py-3 font-medium">{score.name}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        ${score.finalValue.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${
                        score.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(score.totalReturn * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {score.score.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-400 capitalize">
                        {score.tradingStyle}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Timeline ({result.timeline.length} days)
            </h2>
            <pre className="bg-slate-800 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(result.timeline, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </main>
  );
}
