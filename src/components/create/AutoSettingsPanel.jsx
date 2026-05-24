import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { CATEGORY_PRESETS } from '@/lib/categoryPresets';
import { VOICE_PRESETS, getPresetById, getVoiceById } from '@/lib/voiceSystem';
import VisualStylePicker from './VisualStylePicker';
import VoiceAvatarPicker from './VoiceAvatarPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import VoicePreviewButton from './VoicePreviewButton';

const MUSIC_OPTIONS = [
  { value: 'epic_cinematic', label: 'Epic Cinematic' },
  { value: 'dark_ambient', label: 'Dark Ambient' },
  { value: 'motivational_piano', label: 'Motivational Piano' },
  { value: 'lofi_chill', label: 'Lo-Fi Chill' },
  { value: 'dramatic_orchestral', label: 'Dramatic Orchestral' },
  { value: 'upbeat_corporate', label: 'Upbeat Corporate' },
  { value: 'none', label: 'No Music' },
];

const CAPTION_STYLES = ['word_by_word','sentence','tiktok_bold','highlight','minimal'];

export default function AutoSettingsPanel({ data, onChange, category }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const preset = CATEGORY_PRESETS[category] || CATEGORY_PRESETS.custom;
  const voicePreset = getPresetById(data.voice_preset);
  const voice = getVoiceById(data.voice_id || voicePreset?.voiceId);

  return (
    <div className="space-y-4">
      {/* Auto-applied badge */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary">Auto-configured for {preset.label}</p>
          <p className="text-[11px] text-muted-foreground">Voice · Visuals · Music · Captions auto-selected</p>
        </div>
      </div>

      {/* Auto summary chips */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: data.voice_id || voicePreset?.label || 'Auto Voice', icon: '🎙️' },
          { label: (data.visual_style || preset.visual_style).replace(/_/g,' '), icon: '🎬' },
          { label: (data.music_track || preset.music_track).replace(/_/g,' '), icon: '🎵' },
          { label: (data.caption_style || preset.caption_style).replace(/_/g,' '), icon: '💬' },
          { label: data.duration_target || preset.duration_target, icon: '⏱️' },
        ].map(chip => (
          <span key={chip.label} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/60 text-[11px] text-muted-foreground capitalize">
            <span>{chip.icon}</span> {chip.label}
          </span>
        ))}
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(v => !v)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
      </button>

      {showAdvanced && (
        <div className="space-y-5 pt-1">
          {/* Voice */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">🎙️ Voice</p>
            <VoiceAvatarPicker value={data.voice_id} onChange={onChange} />
            <VoicePreviewButton
              voiceId={data.voice_id || null}
              voiceStyle={data.voice_style || 'motivational'}
              voiceSpeed={data.voice_speed || 1.0}
            />
          </div>

          {/* Visual */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">🎬 Visual Style</p>
            <VisualStylePicker value={data.visual_style} onChange={(v) => onChange({ visual_style: v })} />
          </div>

          {/* Music */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">🎵 Music</p>
            <Select value={data.music_track} onValueChange={v => onChange({ music_track: v })}>
              <SelectTrigger className="bg-secondary/50 border-border rounded-lg h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {MUSIC_OPTIONS.map(m => <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Volume</span><span>{data.music_volume || 30}%</span>
              </div>
              <Slider value={[data.music_volume || 30]} onValueChange={([v]) => onChange({ music_volume: v })} min={0} max={100} step={5} />
            </div>
          </div>

          {/* Captions */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">💬 Captions</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CAPTION_STYLES.map(s => (
                <button key={s} onClick={() => onChange({ caption_style: s })}
                  className={cn('py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all',
                    data.caption_style === s ? 'bg-primary/20 text-primary' : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70')}>
                  {s.replace(/_/g,' ')}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Text Color</p>
                <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-2 h-8">
                  <input type="color" value={data.caption_color || '#FFFFFF'} onChange={e => onChange({ caption_color: e.target.value })} className="w-4 h-4 rounded bg-transparent border-0 cursor-pointer" />
                  <span className="text-[10px] text-muted-foreground">{data.caption_color || '#FFFFFF'}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Highlight</p>
                <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-2 h-8">
                  <input type="color" value={data.highlight_color || '#A3E635'} onChange={e => onChange({ highlight_color: e.target.value })} className="w-4 h-4 rounded bg-transparent border-0 cursor-pointer" />
                  <span className="text-[10px] text-muted-foreground">{data.highlight_color || '#A3E635'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">📐 Output</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">Resolution</p>
                <div className="grid grid-cols-2 gap-1">
                  {['720p','1080p'].map(r => (
                    <button key={r} onClick={() => onChange({ resolution: r })}
                      className={cn('py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                        data.resolution === r ? 'bg-primary/20 text-primary' : 'bg-secondary/40 text-muted-foreground')}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">Duration</p>
                <div className="grid grid-cols-3 gap-1">
                  {['30s','60s','90s'].map(d => (
                    <button key={d} onClick={() => onChange({ duration_target: d })}
                      className={cn('py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                        data.duration_target === d ? 'bg-primary/20 text-primary' : 'bg-secondary/40 text-muted-foreground')}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}