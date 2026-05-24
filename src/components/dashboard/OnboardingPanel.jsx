import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wand2, Mic, Link2, Rocket, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const steps = [
  {
    num: 1,
    icon: Wand2,
    title: 'Create your first video',
    desc: 'Pick a category, enter a topic, and let the AI do the rest.',
    action: { label: 'Start Creating', to: '/create' },
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    num: 2,
    icon: Mic,
    title: 'Choose a voice & style',
    desc: 'Select from 20+ AI voices and cinematic visual styles.',
    action: { label: 'Explore Voices', to: '/create' },
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
  },
  {
    num: 3,
    icon: Link2,
    title: 'Connect social accounts',
    desc: 'Link TikTok, YouTube, and Instagram for one-click publishing.',
    action: { label: 'Connect Now', to: '/publish' },
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  {
    num: 4,
    icon: Rocket,
    title: 'Generate & publish',
    desc: 'Review your video, then auto-publish or schedule it.',
    action: { label: 'View Queue', to: '/publish' },
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
];

export default function OnboardingPanel({ completedSteps = [] }) {
  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-2xl p-4 md:p-6 border border-primary/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm md:text-base font-bold">Get Started</h2>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">Complete these steps to launch your first video</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-primary">{completedSteps.length}/{steps.length}</p>
          <p className="text-[9px] text-muted-foreground">steps done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden mb-5">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step, i) => {
          const done = completedSteps.includes(step.num);
          return (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={cn(
                'rounded-xl p-3 border transition-all',
                done ? 'bg-secondary/20 border-border opacity-60' : `${step.bg} ${step.border}`
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0', done ? 'bg-primary/20' : step.bg)}>
                  {done
                    ? <Check className="w-3 h-3 text-primary" />
                    : <span className={cn('text-[10px] font-bold', step.color)}>{step.num}</span>}
                </div>
                <p className={cn('text-xs font-semibold leading-tight', done ? 'line-through text-muted-foreground' : '')}>{step.title}</p>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug mb-2.5">{step.desc}</p>
              {!done && (
                <Link to={step.action.to}>
                  <Button size="sm" className={cn('w-full rounded-lg text-[10px] h-6 font-semibold', done ? 'opacity-0 pointer-events-none' : '')}>
                    {step.action.label}
                  </Button>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}