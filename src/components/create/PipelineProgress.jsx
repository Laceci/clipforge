import React from 'react';
import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'script',    label: 'Generating Script',      icon: '📝' },
  { key: 'splitting', label: 'Splitting into Scenes',   icon: '✂️' },
  { key: 'prompts',   label: 'Creating Visual Prompts', icon: '🎨' },
  { key: 'visuals',   label: 'Generating Visuals',      icon: '🖼️' },
  { key: 'voiceover', label: 'AI Voiceover',            icon: '🎙️' },
  { key: 'captions',  label: 'Syncing Captions',        icon: '💬' },
  { key: 'music',     label: 'Adding Music',            icon: '🎵' },
  { key: 'rendering', label: 'Rendering Video',         icon: '🎬' },
];

export default function PipelineProgress({ currentStep, progress, error, statusLabel }) {
  const currentIdx = STEPS.findIndex(s => s.key === currentStep);

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-4 py-8">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="font-bold text-lg">Generation Failed</h3>
        <p className="text-sm text-muted-foreground bg-secondary/40 rounded-xl p-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 py-4">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
        <h3 className="font-bold text-xl">Generating Your Video</h3>
        <p className="text-sm text-muted-foreground">{statusLabel || 'Running automation pipeline...'}</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress || 0)}%</span>
        </div>
        <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out neon-glow"
            style={{ width: `${progress || 0}%` }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          const isPending = i > currentIdx;
          return (
            <div key={step.key} className={cn(
              'flex items-center gap-3 p-3 rounded-xl transition-all',
              isActive ? 'bg-primary/10 border border-primary/20' : isDone ? 'opacity-60' : 'opacity-30'
            )}>
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', isDone ? 'bg-primary/20' : isActive ? 'bg-primary/30' : 'bg-secondary/40')}>
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-primary" />
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                )}
              </div>
              <span className="text-xs">{step.icon} {step.label}</span>
              {isActive && <span className="ml-auto text-[10px] text-primary font-medium">Running…</span>}
              {isDone && <span className="ml-auto text-[10px] text-primary/60">Done</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}