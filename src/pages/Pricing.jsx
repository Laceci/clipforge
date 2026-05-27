import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import PricingCards from '../components/marketing/PricingCards';
import CTABanner from '../components/marketing/CTABanner';

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="gap-2 text-muted-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold">
            Simple Pricing for Every Creator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a free 7-day trial (14 videos). Scale as you grow.
          </p>
        </div>

        <PricingCards />

        <div className="mt-16 space-y-8">
          <CTABanner
            title="Start Your Free Trial"
            subtitle="7 days free — 14 videos included. No credit card required."
            cta="Create Your First Video"
          />

          <div className="glass-card rounded-2xl p-8 border border-border space-y-6">
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <details className="group">
                <summary className="font-semibold cursor-pointer list-none py-3 border-b border-border">
                  Can I cancel anytime?
                </summary>
                <p className="text-muted-foreground text-sm py-3">
                  Yes, cancel your subscription anytime with no questions asked. You'll have access until the end of your billing period.
                </p>
              </details>

              <details className="group">
                <summary className="font-semibold cursor-pointer list-none py-3 border-b border-border">
                  Do you offer refunds?
                </summary>
                <p className="text-muted-foreground text-sm py-3">
                  We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team for a full refund.
                </p>
              </details>

              <details className="group">
                <summary className="font-semibold cursor-pointer list-none py-3 border-b border-border">
                  Can I upgrade or downgrade?
                </summary>
                <p className="text-muted-foreground text-sm py-3">
                  Absolutely. Change your plan anytime, and we'll prorate the difference. Upgrade or downgrade instantly.
                </p>
              </details>

              <details className="group">
                <summary className="font-semibold cursor-pointer list-none py-3">
                  What about team accounts?
                </summary>
                <p className="text-muted-foreground text-sm py-3">
                  Elite plans include team collaboration. Add up to 5 team members and share your ClipForge workspace.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}