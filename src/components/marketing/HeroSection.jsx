import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden mb-12">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background opacity-60" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative px-6 md:px-8 py-16 md:py-24 text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold text-primary">
          <Zap className="w-3.5 h-3.5" />
          AI-Powered Faceless Video Factory
        </div>

        {/* Main headline */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
            Create Viral Videos
            <span className="block text-primary neon-text">In Minutes, Not Days</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Generate scripts, render cinematic visuals, sync realistic AI voices, auto-caption, select music, and publish across all platforms—from one unified system.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to="/create" className="w-full sm:w-auto">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-6 text-base font-bold neon-glow gap-2">
              Start Creating Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="outline" className="w-full sm:w-auto rounded-xl py-6 text-base font-bold border-primary/30 gap-2">
            <Play className="w-4 h-4" />
            Watch Demo Video
          </Button>
        </div>

        {/* Trust line */}
        <p className="text-xs text-muted-foreground">
          ✨ Trusted by 1000+ creators | Processing 10k+ videos monthly | 98% publish success rate
        </p>
      </div>
    </div>
  );
}