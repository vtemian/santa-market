// Re-export types needed by frontend
export type {
  Ticker,
  Prices,
  Order,
  AgentDayLog,
  DaySnapshot,
  AgentScore,
  SimulationResult,
  ScenarioConfig,
} from '@/sim/types';

export interface ScenarioOption {
  id: string;
  name: string;
  description: string;
}
