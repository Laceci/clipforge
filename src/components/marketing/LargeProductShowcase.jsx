import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Video, Zap, Image as ImageIcon, Music, Sparkles, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const SHOWCASES = [
  {
    id: 'script-to-video',
    title: 'Script to Cinematic Video in Minutes',
    description: 'Enter a topic or paste your script. ClipForge generates scenes, visuals, voiceover, captions, and music automatically.',
    icon: Video,
    image: '🎬',
    cta: 'Try Now',
    features: ['AI Script Generation', 'Scene Planning', 'Auto Voiceover'],
  },
  {
    id: 'ai-visuals',
    title: 'Photorealistic AI Visuals',
    description: 'Every scene gets professional-grade, cinematic video clips with perfect lighting, movement, and mood matching.',
    icon: ImageIcon,
    image: '✨',
    cta: 'Explore Editor',
    features: ['4K Quality', 'Cinematic Effects', 'AI Enhancement'],
  },
  {
    id: 'multi-platform',
    title: 'Auto-Publish to All Platforms',
    description: 'One click to publish across TikTok, Instagram, YouTube, and Facebook with platform-optimized captions.',
    icon: Share2,
    image: '📱',
    cta: 'Learn More',
    features: ['Scheduled Posts', 'Auto Captions', 'Analytics'],
  },
  {
    id: 'instant-edits',
    title: 'Real-Time Editing & Customization',
    description: 'Tweak every aspect—voice speed, captions, music, colors, effects—and preview instantly.',
    icon: Zap,
    image: '⚡',
    cta: 'Explore',
    features: ['Voice Control', 'Caption Sync', 'Color Grading'],
  },
];

export default function LargeProductShowcase() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl md:text-4xl font-bold">See ClipForge in Action</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Discover how creators and agencies are automating video production at scale
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SHOWCASES.map((showcase) => {
          const Icon = showcase.icon;
          return (
            <div key={showcase.id} className="glass-card rounded-3xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300">
              <div className="p-8 space-y-6 flex flex-col h-full">
                {/* Header */}
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold">{showcase.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{showcase.description}</p>
                </div>

                {/* Visual showcase */}
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl h-48 flex items-center justify-center text-6xl border border-primary/20">
                  {showcase.image}
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {showcase.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-2 mt-auto">
                  <Link to="/create" className="inline-block">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold gap-2 neon-glow w-full">
                      {showcase.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="glass-card rounded-3xl p-12 text-center space-y-4 border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5">
        <h3 className="text-2xl font-bold">Ready to Transform Your Content?</h3>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Join thousands of creators who've ditched manual video editing for AI-powered automation
        </p>
        <Link to="/create">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-3 px-8 font-bold text-base neon-glow gap-2">
            Create Your First Video
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}