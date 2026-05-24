import React from 'react';
import { Zap, TrendingUp, Sparkles } from 'lucide-react';

const TRUST_POINTS = [
  {
    icon: Zap,
    stat: '10k+',
    label: 'Videos Generated Monthly',
    description: 'ClipForge powers thousands of creators and agencies worldwide',
  },
  {
    icon: TrendingUp,
    stat: '98%',
    label: 'Publishing Success Rate',
    description: 'Reliable, consistent delivery across all platforms',
  },
  {
    icon: Sparkles,
    stat: '50M+',
    label: 'Total Video Views',
    description: 'Creator content powered by ClipForge reaches massive audiences',
  },
];

export default function TrustSection() {
  return (
    <div className="mb-12">
      <div className="text-center space-y-3 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">
          Built for Creators at Scale
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Designed for faceless video production, AI automation, and rapid content scaling
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TRUST_POINTS.map((point, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-8 border border-primary/10 hover:border-primary/30 transition-all text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <point.icon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-primary">{point.stat}</div>
              <p className="font-semibold text-sm mt-2">{point.label}</p>
              <p className="text-xs text-muted-foreground mt-2">{point.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 glass-card rounded-2xl p-8 border border-primary/20 bg-primary/5 text-center space-y-4">
        <h3 className="text-2xl font-bold">Designed for the Future of Content</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          In a world where content velocity matters, ClipForge lets you produce weeks of videos in hours.
          Scale faster. Create smarter. Automate everything.
        </p>
      </div>
    </div>
  );
}