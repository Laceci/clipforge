import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Starter',
    subtitle: 'Perfect for testing',
    price: '$29',
    billing: '/month',
    videos: '4 videos/month',
    features: [
      'AI Script Generation',
      'Basic Voice Personas (5)',
      '1080p Rendering',
      'TikTok & Instagram Publishing',
      'Basic Analytics',
      'Email Support',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Pro',
    subtitle: 'Most popular',
    price: '$79',
    billing: '/month',
    videos: '20 videos/month',
    features: [
      'Everything in Starter',
      'Premium Voice Personas (20)',
      '4K Rendering',
      'All Platforms (YouTube, TikTok, Instagram, Facebook)',
      'Advanced Analytics',
      'Scheduling & Queue System',
      'Brand Customization',
      'Priority Support',
    ],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    name: 'Elite',
    subtitle: 'For agencies & teams',
    price: '$199',
    billing: '/month',
    videos: 'Unlimited videos',
    features: [
      'Everything in Pro',
      'All Voice Personas (30+)',
      'Cinematic 4K Premium',
      'Advanced AI Enhancements',
      'Custom Integrations',
      'Team Collaboration',
      'Dedicated Account Manager',
      'Priority 24/7 Support',
    ],
    cta: 'Contact Sales',
    featured: false,
  },
];

export default function PricingCards() {
  return (
    <div className="mb-12">
      <div className="text-center space-y-3 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Simple, Transparent Pricing</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose the plan that fits your content production needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan, i) => (
          <div
            key={i}
            className={cn(
              'rounded-3xl p-8 space-y-6 border transition-all',
              plan.featured
                ? 'glass-card border-primary/50 bg-primary/5 ring-2 ring-primary/30 transform md:scale-105'
                : 'glass-card border-border hover:border-primary/20 hover:bg-primary/5'
            )}
          >
            {plan.featured && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  Most Popular
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
            </div>

            <div className="space-y-1">
              <div className="text-4xl font-black">
                {plan.price}
                <span className="text-sm text-muted-foreground font-normal">{plan.billing}</span>
              </div>
              <p className="text-sm text-primary font-semibold">{plan.videos}</p>
            </div>

            <div className="space-y-3">
              {plan.features.map((feature, j) => (
                <div key={j} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              className={cn(
                'w-full rounded-xl font-bold py-3 text-base',
                plan.featured
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 neon-glow'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              )}
            >
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        All plans include a 14-day free trial. No credit card required.
      </p>
    </div>
  );
}