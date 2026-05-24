import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORY_TYPES = [
  { id: 'adventure', label: '🏔️ Adventure', desc: 'Exploration & discovery' },
  { id: 'emotional', label: '❤️ Emotional', desc: 'Heartwarming & meaningful' },
  { id: 'fantasy', label: '✨ Fantasy', desc: 'Magic & supernatural' },
  { id: 'luxury', label: '💎 Luxury', desc: 'Wealth & prestige' },
  { id: 'horror', label: '👻 Horror', desc: 'Thrilling & dark' },
];

const STORY_TONES = [
  { id: 'fun', label: '😄 Fun' },
  { id: 'intense', label: '⚡ Intense' },
  { id: 'inspirational', label: '🌟 Inspirational' },
  { id: 'dramatic', label: '🎭 Dramatic' },
];

const STORY_PROMPTS = [
  '🌋 We are escaping a volcano eruption',
  '✈️ We are flying in a private jet to paradise',
  '🦖 We are running from dinosaurs',
  '🌴 We are on a jungle adventure',
  '💰 We just became millionaires',
  '🏔️ We are climbing the world\'s highest mountain',
  '🏰 We discovered an ancient castle',
  '🚁 We are on a helicopter rescue mission',
];

export default function StorySelectionStep({ data, onChange }) {
  return (
    <div className="glass-card rounded-2xl p-8 space-y-8">
      {/* Story Type */}
      <div className="space-y-3">
        <label className="text-sm font-semibold">Story Type</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {STORY_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => onChange({ story_type: type.id })}
              className={cn(
                'p-3 rounded-xl border text-sm font-medium transition-all text-left',
                data.story_type === type.id
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              <p className="font-semibold">{type.label}</p>
              <p className="text-xs mt-1 opacity-70">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Story Tone */}
      <div className="space-y-3">
        <label className="text-sm font-semibold">Tone</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {STORY_TONES.map(tone => (
            <button
              key={tone.id}
              onClick={() => onChange({ story_tone: tone.id })}
              className={cn(
                'py-2 px-4 rounded-xl border text-sm font-medium transition-all',
                data.story_tone === tone.id
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Video Length */}
      <div className="space-y-3">
        <label className="text-sm font-semibold">Video Length</label>
        <div className="grid grid-cols-3 gap-2">
          {['30s', '60s', '120s'].map(length => (
            <button
              key={length}
              onClick={() => onChange({ video_length: length })}
              className={cn(
                'py-2 px-4 rounded-xl border text-sm font-medium transition-all',
                data.video_length === length
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              {length}
            </button>
          ))}
        </div>
      </div>

      {/* Quick story prompts */}
      <div className="space-y-3">
        <label className="text-sm font-semibold">Quick Prompts</label>
        <div className="grid grid-cols-1 gap-2">
          {STORY_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => onChange({ story_prompt: prompt })}
              className="text-left p-3 rounded-xl border bg-secondary/40 border-border hover:border-primary/30 text-sm transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Custom story prompt */}
      <div className="space-y-3">
        <label className="text-sm font-semibold">Or Write Your Own Story</label>
        <Textarea
          placeholder="Describe what you want to happen in your story..."
          value={data.story_prompt || ''}
          onChange={(e) => onChange({ story_prompt: e.target.value })}
          className="bg-secondary/40 border-border rounded-xl text-sm min-h-[120px] resize-none"
        />
        <p className="text-xs text-muted-foreground">Be creative! Describe the setting, action, and emotions you want to feel.</p>
      </div>
    </div>
  );
}