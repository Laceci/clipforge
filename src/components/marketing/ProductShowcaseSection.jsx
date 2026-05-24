import React from 'react';
import { Film, Zap } from 'lucide-react';

const SHOWCASE_ITEMS = [
  {
    icon: Film,
    title: 'Realistic Video Generation',
    description: 'Watch as ClipForge renders photorealistic video clips with cinematic lighting, smooth motion, and professional production value.',
    visual: '🎬',
  },
  {
    icon: Zap,
    title: 'Voice Picker & Avatars',
    description: 'Choose from 20+ AI voices with different personalities, accents, and emotional tones. Preview voice samples instantly.',
    visual: '🎤',
  },
  {
    icon: Film,
    title: 'Visual Style Selection',
    description: 'Pick from cinematic, documentary, motivational, dark, anime, and more. See live previews of your style choice.',
    visual: '🎨',
  },
  {
    icon: Zap,
    title: 'Auto-Publishing Dashboard',
    description: 'Schedule posts across platforms. Watch as ClipForge automatically publishes your videos at optimal times.',
    visual: '📱',
  },
];

export default function ProductShowcaseSection() {
  return (
    <div className="mb-12">
      <div className="text-center space-y-3 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">See It in Action</h2>
        <p className="text-muted-foreground text-lg">Experience the ClipForge workflow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SHOWCASE_ITEMS.map((item, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-8 border border-primary/10 hover:border-primary/30 transition-all group space-y-4"
          >
            <div className="space-y-3">
              <div className="text-5xl">{item.visual}</div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-primary font-semibold">← See this in the app dashboard</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}