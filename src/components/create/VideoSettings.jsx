import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Mic, Eye, Type, Music, Monitor, Palette, Clock } from 'lucide-react';

const voiceStyles = [
  { value: 'deep', label: 'Deep & Powerful' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'motivational', label: 'Motivational' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'calm', label: 'Calm & Soothing' },
  { value: 'energetic', label: 'Energetic' },
];

const visualStyles = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'dark', label: 'Dark & Moody' },
  { value: 'anime', label: 'Anime' },
  { value: 'motivational', label: 'Motivational' },
];

const captionStyles = [
  { value: 'word_by_word', label: 'Word by Word' },
  { value: 'sentence', label: 'Sentence' },
  { value: 'tiktok_bold', label: 'TikTok Bold' },
  { value: 'highlight', label: 'Highlight Keywords' },
  { value: 'minimal', label: 'Minimal' },
];

const animationStyles = [
  { value: 'pan_zoom', label: 'Pan & Zoom' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'glitch', label: 'Glitch' },
  { value: 'zoom_in', label: 'Zoom In' },
];

const musicTracks = [
  { value: 'epic_cinematic', label: 'Epic Cinematic' },
  { value: 'dark_ambient', label: 'Dark Ambient' },
  { value: 'motivational_piano', label: 'Motivational Piano' },
  { value: 'lofi_chill', label: 'Lo-Fi Chill' },
  { value: 'dramatic_orchestral', label: 'Dramatic Orchestral' },
  { value: 'upbeat_corporate', label: 'Upbeat Corporate' },
  { value: 'none', label: 'No Music' },
];

function Section({ icon: Icon, title, children }) {
  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function VideoSettings({ data, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Voice */}
      <Section icon={Mic} title="Voice">
        <Select value={data.voice_style || 'motivational'} onValueChange={v => onChange({ voice_style: v })}>
          <SelectTrigger className="bg-secondary/50 border-border rounded-lg h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {voiceStyles.map(v => <SelectItem key={v.value} value={v.value} className="text-xs">{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Speed</span><span>{data.voice_speed || 1.0}x</span>
          </div>
          <Slider value={[data.voice_speed || 1.0]} onValueChange={([v]) => onChange({ voice_speed: v })} min={0.5} max={2.0} step={0.1} />
        </div>
      </Section>

      {/* Visual Style */}
      <Section icon={Eye} title="Visual Style">
        <Select value={data.visual_style || 'cinematic'} onValueChange={v => onChange({ visual_style: v })}>
          <SelectTrigger className="bg-secondary/50 border-border rounded-lg h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {visualStyles.map(v => <SelectItem key={v.value} value={v.value} className="text-xs">{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={data.animation_style || 'pan_zoom'} onValueChange={v => onChange({ animation_style: v })}>
          <SelectTrigger className="bg-secondary/50 border-border rounded-lg h-8 text-xs">
            <SelectValue placeholder="Animation style" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {animationStyles.map(a => <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Section>

      {/* Captions */}
      <Section icon={Type} title="Captions">
        <Select value={data.caption_style || 'tiktok_bold'} onValueChange={v => onChange({ caption_style: v })}>
          <SelectTrigger className="bg-secondary/50 border-border rounded-lg h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {captionStyles.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Text Color</p>
            <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-2 h-8">
              <input type="color" value={data.caption_color || '#FFFFFF'} onChange={e => onChange({ caption_color: e.target.value })} className="w-4 h-4 rounded cursor-pointer bg-transparent border-0" />
              <span className="text-[10px] text-muted-foreground">{data.caption_color || '#FFFFFF'}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Highlight</p>
            <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-2 h-8">
              <input type="color" value={data.highlight_color || '#A3E635'} onChange={e => onChange({ highlight_color: e.target.value })} className="w-4 h-4 rounded cursor-pointer bg-transparent border-0" />
              <span className="text-[10px] text-muted-foreground">{data.highlight_color || '#A3E635'}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Music */}
      <Section icon={Music} title="Music">
        <Select value={data.music_track || 'epic_cinematic'} onValueChange={v => onChange({ music_track: v })}>
          <SelectTrigger className="bg-secondary/50 border-border rounded-lg h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {musicTracks.map(m => <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Volume</span><span>{data.music_volume || 30}%</span>
          </div>
          <Slider value={[data.music_volume || 30]} onValueChange={([v]) => onChange({ music_volume: v })} min={0} max={100} step={5} />
        </div>
      </Section>

      {/* Output */}
      <Section icon={Monitor} title="Output Quality">
        <div className="grid grid-cols-2 gap-2">
          {['720p', '1080p'].map(res => (
            <button
              key={res}
              onClick={() => onChange({ resolution: res })}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                (data.resolution || '1080p') === res
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">Format: 9:16 Vertical · No watermark</p>
      </Section>

      {/* Duration target */}
      <Section icon={Clock} title="Duration Target">
        <div className="grid grid-cols-3 gap-1.5">
          {['30s', '60s', '90s'].map(d => (
            <button
              key={d}
              onClick={() => onChange({ duration_target: d })}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                (data.duration_target || '60s') === d
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}