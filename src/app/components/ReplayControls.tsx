'use client';

interface ReplayControlsProps {
  currentDay: number;
  totalDays: number;
  isPlaying: boolean;
  speed: number; // 1, 2, or 4
  onPlay: () => void;
  onPause: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSetSpeed: (speed: number) => void;
  onReset: () => void;
}

const SPEED_OPTIONS = [1, 2, 4] as const;

export default function ReplayControls({
  currentDay,
  totalDays,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onPrevDay,
  onNextDay,
  onSetSpeed,
  onReset,
}: ReplayControlsProps) {
  const isAtStart = currentDay === 1;
  const isAtEnd = currentDay === totalDays;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-center gap-6">
        {/* Reset Button */}
        <button
          onClick={onReset}
          disabled={isAtStart}
          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
            isAtStart
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 text-slate-200 hover:bg-slate-600 active:bg-slate-500'
          }`}
          title="Reset to day 1"
        >
          ⏮ Reset
        </button>

        {/* Previous Day Button */}
        <button
          onClick={onPrevDay}
          disabled={isAtStart}
          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
            isAtStart
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 text-slate-200 hover:bg-slate-600 active:bg-slate-500'
          }`}
          title="Previous day"
        >
          ◀ Prev
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={isAtEnd}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            isAtEnd
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : isPlaying
                ? 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700'
                : 'bg-green-600 text-white hover:bg-green-500 active:bg-green-700'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        {/* Next Day Button */}
        <button
          onClick={onNextDay}
          disabled={isAtEnd}
          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
            isAtEnd
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 text-slate-200 hover:bg-slate-600 active:bg-slate-500'
          }`}
          title="Next day"
        >
          Next ▶
        </button>

        {/* Speed Selector */}
        <div className="flex gap-1">
          {SPEED_OPTIONS.map((speedOption) => (
            <button
              key={speedOption}
              onClick={() => onSetSpeed(speedOption)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                speed === speedOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600 active:bg-slate-500'
              }`}
              title={`${speedOption}x speed`}
            >
              {speedOption}x
            </button>
          ))}
        </div>

        {/* Day Indicator */}
        <div className="text-slate-200 font-medium text-sm min-w-fit">
          Day {currentDay} of {totalDays}
        </div>
      </div>
    </div>
  );
}
