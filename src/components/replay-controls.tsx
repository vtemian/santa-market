'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
} from 'lucide-react';

interface ReplayControlsProps {
  currentDay: number;
  totalDays: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSetSpeed: (speed: number) => void;
  onReset: () => void;
  onDaySelect: (day: number) => void;
}

const SPEED_OPTIONS = [1, 2, 4] as const;

export function ReplayControls({
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
  onDaySelect,
}: ReplayControlsProps) {
  const isAtStart = currentDay === 1;
  const isAtEnd = currentDay === totalDays;

  return (
    <div className="border-2 border-foreground bg-card">
      <div className="px-4 py-3 flex items-center gap-6">
        {/* Transport Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            disabled={isAtStart}
            className="h-8 w-8 rounded-none"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevDay}
            disabled={isAtStart}
            className="h-8 w-8 rounded-none"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={isPlaying ? onPause : onPlay}
            disabled={isAtEnd}
            className={`h-10 w-10 rounded-none border-2 border-foreground ${
              isPlaying ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextDay}
            disabled={isAtEnd}
            className="h-8 w-8 rounded-none"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 flex items-center gap-4">
          <span className="font-mono text-xs text-muted-foreground w-8">D{currentDay}</span>
          <Slider
            value={[currentDay]}
            onValueChange={([value]) => onDaySelect(value)}
            min={1}
            max={totalDays}
            step={1}
            className="flex-1"
          />
          <span className="font-mono text-xs text-muted-foreground w-8">D{totalDays}</span>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2">
          <span className="terminal-header text-xs text-muted-foreground">SPEED</span>
          <div className="flex border-2 border-foreground">
            {SPEED_OPTIONS.map((speedOption) => (
              <button
                key={speedOption}
                onClick={() => onSetSpeed(speedOption)}
                className={`px-3 py-1 font-mono text-xs font-bold transition-colors ${
                  speed === speedOption
                    ? 'bg-foreground text-background'
                    : 'bg-background text-foreground hover:bg-muted'
                } ${speedOption !== 4 ? 'border-r-2 border-foreground' : ''}`}
              >
                {speedOption}x
              </button>
            ))}
          </div>
        </div>

        {/* Day Display */}
        <div className="font-mono text-sm border-2 border-foreground px-3 py-1">
          DAY {currentDay}/{totalDays}
        </div>
      </div>
    </div>
  );
}
