import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function UpgradePrompt({ 
  title,
  description,
  feature,
  plan = 'Pro',
  variant = 'default',
  className = ''
}) {
  return (
    <div className={cn(
      'rounded-2xl p-6 border flex items-center justify-between',
      variant === 'default' ? 'glass-card border-primary/20 bg-primary/5' : 'glass-card border-amber-400/20 bg-amber-400/5',
      className
    )}>
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {feature && <p className="text-xs text-primary mt-1">✨ {feature}</p>}
        </div>
      </div>

      <Link to="/pricing" className="shrink-0 ml-3">
        <Button 
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg gap-1.5"
        >
          Upgrade to {plan}
          <ArrowRight className="w-3 h-3" />
        </Button>
      </Link>
    </div>
  );
}