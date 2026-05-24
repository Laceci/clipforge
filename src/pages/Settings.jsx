import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Check, Zap, Mic, Palette, Music, Type, Globe, Calendar, Video, Activity } from 'lucide-react';
import { VOICE_PRESETS, VOICE_CATEGORIES } from '../lib/voiceSystem';
import { CATEGORIES } from '../lib/categoryPresets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import BrandSettings from '../components/settings/BrandSettings';
import VideoProviderSettings from '../components/settings/VideoProviderSettings';
import ApiConnectionsPanel from '../components/settings/ApiConnectionsPanel';

const MUSIC_OPTIONS = [
  { value: 'epic_cinematic', label: 'Epic Cinematic' },
  { value: 'dark_ambient', label: 'Dark Ambient' },
  { value: 'motivational_piano', label: 'Motivational Piano' },
  { value: 'lofi_chill', label: 'Lo-Fi Chill' },
  { value: 'dramatic_orchestral', label: 'Dramatic Orchestral' },
  { value: 'upbeat_corporate', label: 'Upbeat Corporate' },
];

const VISUAL_STYLES = ['realistic','cinematic','documentary','dark','anime','motivational'];
const ANIMATION_STYLES = ['pan_zoom','fade','slide','glitch','zoom_in'];
const CAPTION_STYLES = ['word_by_word','sentence','tiktok_bold','highlight','minimal'];
const PLATFORMS = ['youtube','tiktok','instagram','facebook'];
const PLATFORM_LABELS = { youtube: 'YouTube Shorts', tiktok: 'TikTok', instagram: 'Instagram Reels', facebook: 'Facebook Reels' };

function Section({ icon: Icon, title, children }) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: prefsList = [], isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => base44.entities.UserPreferences.list(),
  });

  const existing = prefsList[0];

  const [prefs, setPrefs] = useState({
    default_voice_preset: 'deep_story_narrator',
    default_voice_speed: 1.0,
    default_voice_pitch: 1.0,
    default_visual_style: 'cinematic',
    default_caption_style: 'tiktok_bold',
    default_caption_color: '#FFFFFF',
    default_highlight_color: '#A3E635',
    default_animation_style: 'pan_zoom',
    default_music_category: 'epic_cinematic',
    default_resolution: '1080p',
    default_platforms: [],
    default_publish_mode: 'instant',
    default_hashtags: {},
    auto_publish: false,
  });

  useEffect(() => {
    if (existing) setPrefs({ ...prefs, ...existing });
  }, [existing]);

  const update = (key, val) => setPrefs(prev => ({ ...prev, [key]: val }));
  const updateBrand = (key, val) => setPrefs(prev => ({ ...prev, [key]: val }));
  const updateHashtag = (cat, val) => setPrefs(prev => ({ ...prev, default_hashtags: { ...prev.default_hashtags, [cat]: val } }));
  const togglePlatform = (p) => {
    const current = prefs.default_platforms || [];
    update('default_platforms', current.includes(p) ? current.filter(x => x !== p) : [...current, p]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { id, created_date, updated_date, created_by, ...data } = prefs;
      if (existing?.id) return base44.entities.UserPreferences.update(existing.id, data);
      return base44.entities.UserPreferences.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      toast.success('Default settings saved!');
    },
  });

  if (isLoading) return <div className="text-center py-20 text-muted-foreground text-sm">Loading preferences...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Set your defaults — every new video uses these automatically</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 neon-glow"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save Defaults'}
        </Button>
      </div>

      {/* API Connections */}
      <Section icon={Activity} title="API Connections">
        <ApiConnectionsPanel />
      </Section>

      {/* Voice */}
      <Section icon={Mic} title="Default Voice">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Choose your default voice preset for all new videos</p>
          <div className="grid grid-cols-1 gap-2">
            {VOICE_PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => update('default_voice_preset', p.id)}
                className={cn('flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                  prefs.default_voice_preset === p.id ? 'bg-primary/10 border-primary/40' : 'bg-secondary/30 border-border hover:border-primary/20')}
              >
                <span className="text-lg shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground">{p.description}</p>
                </div>
                {prefs.default_voice_preset === p.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { key: 'default_voice_speed', label: 'Speed', min: 0.5, max: 2.0, step: 0.05, fmt: v => `${v}x` },
              { key: 'default_voice_pitch', label: 'Pitch', min: 0.5, max: 1.5, step: 0.05, fmt: v => `${v}x` },
            ].map(({ key, label, min, max, step, fmt }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{label}</span>
                  <span className="text-foreground font-medium">{fmt(prefs[key] ?? 1.0)}</span>
                </div>
                <Slider value={[prefs[key] ?? 1.0]} onValueChange={([v]) => update(key, v)} min={min} max={max} step={step} />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Visual */}
      <Section icon={Palette} title="Default Visual Style">
        <div className="grid grid-cols-3 gap-2">
          {VISUAL_STYLES.map(s => (
            <button key={s} onClick={() => update('default_visual_style', s)}
              className={cn('py-2 rounded-xl text-xs font-medium capitalize transition-all',
                prefs.default_visual_style === s ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70')}>
              {s.replace('_',' ')}
            </button>
          ))}
        </div>
      </Section>

      {/* Captions */}
      <Section icon={Type} title="Default Captions">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {CAPTION_STYLES.map(s => (
            <button key={s} onClick={() => update('default_caption_style', s)}
              className={cn('py-2 rounded-xl text-xs font-medium transition-all',
                prefs.default_caption_style === s ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70')}>
              {s.replace(/_/g,' ')}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Text Color</p>
            <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-2 h-9">
              <input type="color" value={prefs.default_caption_color} onChange={e => update('default_caption_color', e.target.value)} className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer" />
              <span className="text-xs text-muted-foreground">{prefs.default_caption_color}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Highlight Color</p>
            <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-2 h-9">
              <input type="color" value={prefs.default_highlight_color} onChange={e => update('default_highlight_color', e.target.value)} className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer" />
              <span className="text-xs text-muted-foreground">{prefs.default_highlight_color}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Music */}
      <Section icon={Music} title="Default Music">
        <Select value={prefs.default_music_category} onValueChange={v => update('default_music_category', v)}>
          <SelectTrigger className="bg-secondary/50 border-border rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {MUSIC_OPTIONS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Section>

      {/* Publishing */}
      <Section icon={Globe} title="Default Publishing">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Which platforms to publish to by default</p>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map(p => (
              <button key={p} onClick={() => togglePlatform(p)}
                className={cn('flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all',
                  prefs.default_platforms?.includes(p) ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/20')}>
                {prefs.default_platforms?.includes(p) && <Check className="w-3 h-3" />}
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Default Publish Mode</p>
            <div className="grid grid-cols-2 gap-2">
              {[{id:'instant',label:'Instant'},{id:'scheduled',label:'Scheduled'}].map(opt => (
                <button key={opt.id} onClick={() => update('default_publish_mode', opt.id)}
                  className={cn('py-2 rounded-xl text-xs font-semibold transition-all',
                    prefs.default_publish_mode === opt.id ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-secondary/40 text-muted-foreground')}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
            <div>
              <p className="text-xs font-semibold">Auto-Publish After Generation</p>
              <p className="text-[10px] text-muted-foreground">Immediately queue to selected platforms</p>
            </div>
            <button
              onClick={() => update('auto_publish', !prefs.auto_publish)}
              className={cn('w-10 h-5 rounded-full transition-all relative', prefs.auto_publish ? 'bg-primary' : 'bg-secondary')}
            >
              <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', prefs.auto_publish ? 'left-5' : 'left-0.5')} />
            </button>
          </div>
        </div>
      </Section>

      {/* Video Provider */}
      <Section icon={Video} title="Video Generation Provider">
        <VideoProviderSettings prefs={prefs} onChange={update} />
      </Section>

      {/* Brand Settings */}
      <BrandSettings
        prefs={prefs}
        onChange={updateBrand}
        onSave={() => saveMutation.mutate()}
        isSaving={saveMutation.isPending}
      />

      {/* Hashtags by category */}
      <Section icon={Calendar} title="Default Hashtags by Category">
        <p className="text-xs text-muted-foreground">Auto-applied when publishing in each category</p>
        <div className="space-y-2">
          {CATEGORIES.slice(0, 6).map(cat => (
            <div key={cat.value} className="flex items-center gap-3">
              <span className="text-sm w-5">{cat.icon}</span>
              <span className="text-xs text-muted-foreground w-24 shrink-0">{cat.label}</span>
              <Input
                placeholder={`#${cat.value} #viral`}
                value={prefs.default_hashtags?.[cat.value] || ''}
                onChange={e => updateHashtag(cat.value, e.target.value)}
                className="bg-secondary/40 border-border rounded-lg h-7 text-xs flex-1"
              />
            </div>
          ))}
        </div>
      </Section>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-3 font-bold text-base neon-glow gap-2"
      >
        <Save className="w-5 h-5" />
        {saveMutation.isPending ? 'Saving...' : 'Save All Defaults'}
      </Button>
    </div>
  );
}