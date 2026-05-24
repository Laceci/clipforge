import React from 'react';
import { Sparkles, Clapperboard, Mic2, Type, Music, Zap, Send, Calendar, Palette, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Script Generation',
    description: 'Viral-ready scripts created instantly from a simple topic or hook. Auto-paced for perfect timing.',
  },
  {
    icon: Clapperboard,
    title: 'Cinematic Scene Creation',
    description: 'Generate photorealistic video clips with smooth motion, professional lighting, and premium cinematography.',
  },
  {
    icon: Mic2,
    title: 'Realistic AI Voices',
    description: 'Human-like narration with 20+ voice personas, custom speed, pitch, and emotional tone control.',
  },
  {
    icon: Type,
    title: 'Auto Captions & Styling',
    description: 'Synchronized word-by-word captions in multiple styles. Animated text overlays matching your brand.',
  },
  {
    icon: Music,
    title: 'AI Music & Sound Design',
    description: 'Mood-matched background music automatically selected from a premium royalty-free library.',
  },
  {
    icon: Zap,
    title: 'One-Click Rendering',
    description: 'Render complete, broadcast-quality videos in minutes. No manual editing or complex settings needed.',
  },
  {
    icon: Send,
    title: 'Multi-Platform Publishing',
    description: 'Auto-publish to TikTok, Instagram, YouTube, and Facebook from a single dashboard with one click.',
  },
  {
    icon: Calendar,
    title: 'Scheduling & Queue System',
    description: 'Schedule posts for optimal posting times. Automate your entire content calendar with smart scheduling.',
  },
  {
    icon: Palette,
    title: 'Multiple Video Styles',
    description: 'Choose from cinematic, documentary, motivational, dark, anime, and more visual modes per project.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Performance',
    description: 'Track video performance across platforms. Get insights on which content drives the most engagement.',
  },
];

export default function FeaturesSection() {
  return (
    <div className="mb-12">
      <div className="text-center space-y-3 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">
          Everything You Need to Create at Scale
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Professional video production tools designed for creators, entrepreneurs, and content agencies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {FEATURES.map((feature, i) => (
          <div
            key={i}
            className={cn(
              'glass-card rounded-2xl p-5 space-y-3 border border-primary/10 hover:border-primary/30 transition-all group',
              'hover:bg-primary/5 hover:shadow-xl cursor-default'
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}