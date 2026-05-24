import React, { useState } from 'react';
import { VOICE_CATEGORIES, VOICE_PRESETS, getVoiceById } from '@/lib/voiceSystem';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Play, Check, Mic, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function VoicePicker({ data, onChange }) {
  const [activeTab, setActiveTab] = useState('presets');
  const [playingId, setPlayingId] = useState(null);

  const selectedPresetId = data.voice_preset || 'deep_story_narrator';
  const selectedVoiceId = data.voice_id;

  const handlePreset = (preset) => {
    const voice = getVoiceById(preset.voiceId);
    onChange({
      voice_preset: preset.id,
      voice_id: preset.voiceId,
      voice_style: voice?.tone || 'deep',
      voice_speed: preset.speed,
      voice_pitch: preset.pitch,
      voice_emphasis: preset.emphasis,
      voice_pause: preset.pauseBetweenSentences,
      voice_intensity: preset.emotionalIntensity,
    });
  };

  const handleVoice = (voice) => {
    onChange({ voice_id: voice.id, voice_style: voice.tone, voice_speed: voice.speed, voice_pitch: voice.pitch });
  };

  const handlePreview = (e, id) => {
    e.stopPropagation();
    setPlayingId(id);
    toast.info('Voice preview requires a connected TTS API. A real voice preview will play when configured.', { duration: 3000 });
    setTimeout(() => setPlayingId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 rounded-xl p-1 w-full">
          <TabsTrigger value="presets" className="flex-1 rounded-lg text-xs">
            <Zap className="w-3 h-3 mr-1" /> Presets
          </TabsTrigger>
          <TabsTrigger value="voices" className="flex-1 rounded-lg text-xs">
            <Mic className="w-3 h-3 mr-1" /> All Voices
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 rounded-lg text-xs">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* PRESETS */}
        <TabsContent value="presets" className="mt-3 space-y-2">
          {VOICE_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handlePreset(preset)}
              className={cn(
                'w-full text-left p-3 rounded-xl border transition-all',
                selectedPresetId === preset.id
                  ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/30'
                  : 'bg-secondary/30 border-border hover:border-primary/20'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{preset.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{preset.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{preset.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => handlePreview(e, preset.id)}
                    className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Play className={cn('w-2.5 h-2.5', playingId === preset.id ? 'text-primary' : 'text-muted-foreground')} />
                  </button>
                  {selectedPresetId === preset.id && <Check className="w-3.5 h-3.5 text-primary" />}
                </div>
              </div>
            </button>
          ))}
        </TabsContent>

        {/* ALL VOICES by category */}
        <TabsContent value="voices" className="mt-3 space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {VOICE_CATEGORIES.map(cat => (
            <div key={cat.id}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {cat.icon} {cat.label}
              </p>
              <div className="space-y-1.5">
                {cat.voices.map(voice => (
                  <button
                    key={voice.id}
                    onClick={() => handleVoice(voice)}
                    className={cn(
                      'w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-3',
                      selectedVoiceId === voice.id
                        ? 'bg-primary/10 border-primary/40'
                        : 'bg-secondary/20 border-border hover:border-primary/20'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                      voice.gender === 'male' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                    )}>
                      {voice.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{voice.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{voice.gender}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{voice.tone}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{voice.useCase}</p>
                    </div>
                    <button
                      onClick={(e) => handlePreview(e, voice.id)}
                      className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0"
                    >
                      <Play className="w-2.5 h-2.5 text-muted-foreground" />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* VOICE SETTINGS */}
        <TabsContent value="settings" className="mt-3 space-y-4">
          {[
            { key: 'voice_speed', label: 'Speed', min: 0.5, max: 2.0, step: 0.05, format: v => `${v}x` },
            { key: 'voice_pitch', label: 'Pitch', min: 0.5, max: 1.5, step: 0.05, format: v => `${v}x` },
            { key: 'voice_pause', label: 'Pause Between Sentences', min: 0, max: 2.0, step: 0.1, format: v => `${v}s` },
            { key: 'voice_intensity', label: 'Emotional Intensity', min: 0, max: 1.0, step: 0.05, format: v => `${Math.round(v * 100)}%` },
          ].map(({ key, label, min, max, step, format }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{label}</span>
                <span className="text-foreground font-medium">{format(data[key] ?? (key === 'voice_speed' ? 1 : key === 'voice_pitch' ? 1 : key === 'voice_pause' ? 0.5 : 0.5))}</span>
              </div>
              <Slider
                value={[data[key] ?? (key === 'voice_speed' ? 1 : key === 'voice_pitch' ? 1 : key === 'voice_pause' ? 0.5 : 0.5)]}
                onValueChange={([v]) => onChange({ [key]: v })}
                min={min} max={max} step={step}
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}