import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Film, Mic, Image, Music, Zap, Type } from 'lucide-react';

const STEP_ICONS = {
  'Analyzing script...': Zap,
  'Splitting into scenes...': Film,
  'Generating visual prompts...': Type,
  'Generating scene visuals...': Image,
  'Generating AI voiceover...': Mic,
  'Syncing captions...': Type,
  'Adding background music...': Music,
  'Finalizing video...': CheckCircle2,
};

const ALL_STEPS = [
  'Analyzing script...',
  'Splitting into scenes...',
  'Generating visual prompts...',
  'Generating scene visuals...',
  'Generating AI voiceover...',
  'Syncing captions...',
  'Adding background music...',
  'Finalizing video...',
];

export default function GenerationProgress({ currentStep, progress, error }) {
  const currentIndex = ALL_STEPS.indexOf(currentStep);

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-12">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-bold text-destructive">Generation Failed</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-lg mx-auto py-10 space-y-8"
    >
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 neon-glow">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Generating Your Video</h2>
        <p className="text-muted-foreground text-sm">This takes 1-3 minutes. Don't close this tab.</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{currentStep || 'Starting...'}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full neon-glow"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-2">
        {ALL_STEPS.map((step, i) => {
          const Icon = STEP_ICONS[step] || Zap;
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isDone || isActive ? 1 : 0.35, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${isActive ? 'bg-primary/10' : ''}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                isDone ? 'bg-primary' : isActive ? 'bg-primary/20' : 'bg-secondary'
              }`}>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                ) : isActive ? (
                  <Loader2 className="w-3 h-3 text-primary animate-spin" />
                ) : (
                  <Icon className="w-3 h-3 text-muted-foreground/40" />
                )}
              </div>
              <span className={`text-sm ${isActive ? 'text-primary font-medium' : isDone ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {step}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}