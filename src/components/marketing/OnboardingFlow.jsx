import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Lock, Zap, Sparkles, Music, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ONBOARDING_STEPS = [
  {
    number: 1,
    title: 'Create Your First Video',
    description: 'Start with a topic or paste a script. ClipForge generates everything.',
    icon: Sparkles,
    cta: 'Create',
    ctaLink: '/create',
    free: true,
  },
  {
    number: 2,
    title: 'Pick Your Voice & Style',
    description: 'Choose from realistic AI voices and cinematic visual modes.',
    icon: Music,
    cta: 'Choose',
    free: true,
  },
  {
    number: 3,
    title: 'Auto-Publish to Platforms',
    description: 'Connect accounts and publish to TikTok, Instagram, YouTube with one click.',
    icon: Send,
    cta: 'Connect',
    free: false,
    plan: 'Pro',
  },
  {
    number: 4,
    title: 'Scale & Automate',
    description: 'Schedule posts, track analytics, and produce unlimited videos monthly.',
    icon: Zap,
    cta: 'Upgrade',
    ctaLink: '/pricing',
    free: false,
    plan: 'Elite',
  },
];

export default function OnboardingFlow({ completedSteps = [] }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Your ClipForge Journey</h3>
        <p className="text-xs text-muted-foreground">
          {completedSteps.length} of {ONBOARDING_STEPS.length} steps completed
        </p>
      </div>

      <div className="space-y-3">
        {ONBOARDING_STEPS.map((step, i) => {
          const isCompleted = completedSteps.includes(step.number);
          const Icon = step.icon;

          return (
            <div
              key={i}
              className={cn(
                'rounded-2xl p-4 border transition-all cursor-pointer group',
                isCompleted
                  ? 'glass-card border-primary/20 bg-primary/5'
                  : 'glass-card border-border hover:border-primary/20 hover:bg-primary/5'
              )}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="flex items-start gap-3">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                ) : (
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold',
                    step.free
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary/40 text-muted-foreground'
                  )}>
                    {step.number}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      'font-semibold text-sm',
                      isCompleted && 'line-through text-muted-foreground'
                    )}>
                      {step.title}
                    </h4>
                    {!step.free && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-semibold shrink-0">
                        <Lock className="w-2.5 h-2.5" />
                        {step.plan}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>

                <Icon className={cn(
                  'w-5 h-5 shrink-0 mt-0.5 transition-all',
                  isCompleted ? 'text-primary/50' : 'text-muted-foreground group-hover:text-primary'
                )} />
              </div>

              {expanded === i && (
                <div className="mt-4 pt-4 border-t border-border">
                  {step.ctaLink ? (
                    <Link to={step.ctaLink} className="inline-block">
                      <Button size="sm" className="bg-primary/20 text-primary hover:bg-primary/30 rounded-lg text-xs">
                        {step.cta}
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" className="bg-primary/20 text-primary hover:bg-primary/30 rounded-lg text-xs">
                      {step.cta}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Link to="/pricing" className="block">
        <Button variant="outline" className="w-full rounded-xl border-primary/30 text-primary text-sm font-semibold">
          View Upgrade Plans
        </Button>
      </Link>
    </div>
  );
}