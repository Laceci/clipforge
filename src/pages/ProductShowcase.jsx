import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/marketing/HeroSection';
import FeaturesSection from '../components/marketing/FeaturesSection';
import ProductShowcaseSection from '../components/marketing/ProductShowcaseSection';
import WhatsIncludedSection from '../components/marketing/WhatsIncludedSection';
import TrustSection from '../components/marketing/TrustSection';
import PricingCards from '../components/marketing/PricingCards';
import CTABanner from '../components/marketing/CTABanner';

export default function ProductShowcase() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-16">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <HeroSection />
        <FeaturesSection />
        <ProductShowcaseSection />
        <WhatsIncludedSection />
        <TrustSection />
        
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Join the ClipForge Revolution?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start creating professional faceless videos today. Free 14-day trial, no credit card required.
            </p>
          </div>

          <PricingCards />
        </div>

        <CTABanner 
          title="Your AI Video Factory Awaits"
          subtitle="From first idea to viral video in minutes"
          cta="Create Your First Video"
        />

        <div className="glass-card rounded-2xl p-8 border border-border space-y-6">
          <h2 className="text-2xl font-bold">Why Creators Choose ClipForge</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold">⚡ Speed</h3>
              <p className="text-sm text-muted-foreground">
                Generate professional videos in minutes instead of hours. Automatic everything — script, visuals, voiceover, captions, music.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">🎬 Quality</h3>
              <p className="text-sm text-muted-foreground">
                Photorealistic cinematic video clips with smooth motion, professional lighting, and premium production value.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">📊 Scale</h3>
              <p className="text-sm text-muted-foreground">
                Produce unlimited videos monthly on Elite plans. Automate your entire content calendar and publishing schedule.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">🔗 Integration</h3>
              <p className="text-sm text-muted-foreground">
                One-click publishing to TikTok, Instagram, YouTube, and Facebook. No manual uploads or formatting required.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">💡 Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered script generation, mood-matched music selection, and auto-caption syncing. Smart systems all the way.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">📈 Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track video performance across platforms. Get insights on engagement, reach, and audience growth metrics.
              </p>
            </div>
          </div>
        </div>

        <CTABanner 
          title="Start Your Free 14-Day Trial"
          subtitle="Create professional AI videos with no credit card required"
          cta="Get Started Now"
          secondary={true}
        />
      </div>
    </div>
  );
}