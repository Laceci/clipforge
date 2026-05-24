import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function FeatureHighlightCard({
  title,
  description,
  icon: CustomIcon,
  visual,
  premium = false,
  plan = 'Pro',
  cta = 'Learn More',
  ctaLink = '/pricing',
  className = '',
}) {
  return (
    <div className={cn(
      'rounded-2xl p-6 border transition-all group',
      premium
        ? 'glass-card border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5'
        : 'glass-card border-border hover:border-primary/20'
    )}>
      <div className="space-y-4">
        {/* Visual */}
        {visual && (
          <div className="text-4xl leading-none">{visual}</div>
        )}

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {CustomIcon && <CustomIcon className="w-5 h-5 text-primary" />}
            <h3 className="font-semibold">{title}</h3>
            {premium && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-semibold ml-auto">
                <Lock className="w-2.5 h-2.5" />
                {plan}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <Link to={ctaLink} className="inline-block">
            <Button
              size="sm"
              variant={premium ? 'default' : 'outline'}
              className={cn(
                'rounded-lg text-xs',
                premium && 'bg-primary/20 text-primary hover:bg-primary/30'
              )}
            >
              {cta}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}