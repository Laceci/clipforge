import React, { useState, useRef } from 'react';
import { VOICE_CATEGORIES, VOICE_PRESETS, getVoiceById } from '@/lib/voiceSystem';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Play, Square, Check, Mic, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const PREVIEW_SAMPLES = {
  morgan_deep:     'Every great story begins with a single moment of courage.',
  alex_warm:       'This is a story about the people who changed everything.',
  claire_soothing: 'There is beauty in the broken pieces of who we used to be.',
  nova_clear:      'The mystery deepened with every piece of evidence uncovered.',
  titan_power:     'You have the power to change your life starting right now.',
  blaze_bold:      'Stop waiting for permission. Go out there and take it.',
  sophia_inspire:  'Your potential is limitless. Your journey starts today.',
  zara_fierce:     'Stop shrinking yourself to fit spaces that were never meant for you.',
  zen_deep:        'Breathe deeply. Let your thoughts dissolve into stillness.',
  aurora_soft:     'Close your eyes and let the stillness guide you home.',
  marcus_clear:    'Scientists discovered something that rewrote the history books.',
  ivy_crisp:       'Three facts about the human brain that will completely surprise you.',
  sterling_pro:    'Leadership is not a title. It is a decision.',
  diana_executive: 'The most successful people in the world share one critical habit.',
  jake_casual:     'Hey, so I tried this thing and honestly it changed everything.',
  mia_friendly:    'This skincare routine completely transformed my skin, no joke.',
};

export default function VoicePicker({ data, onChange }) {
  const [activeTab, setActiveTab] = useState('presets');
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

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

  const stopCurrent = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    setPlayingId(null);
  };

  const handlePreview = async (e, id) => {
    e.stopPropagation();

    // Stop if already playing this voice
    if (playingId === id) { stopCurrent(); return; }
    stopCurrent();

    setLoadingId(id);
    const text = PREVIEW_SAMPLES[id] || 'Welcome to ClipForge. Your video is ready to create.';

    try {
      const result = await base44.functions.invoke('generateVideoClip', {
        voice_mode: 'tts',
        script: text,
        voice_id: id,
        voice_speed: data.voice_speed || 1.0,
      });

      const audioData = result?.data?.audio_data;
      if (!audioData) throw new Error(result?.data?.error || 'No audio returned');

      const binary = atob(audioData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      setLoadingId(null);
      setPlayingId(id);

      audio.play();
      audio.onended = () => { stopCurrent(); };
      audio.onerror = () => { stopCurrent(); };
    } catch (err) {
      setLoadingId(null);
      console.error('[VoicePicker] Preview failed:', err.message);
      // Fallback to browser TTS so the user hears something
      if (window.speechSynthesis) {
        setPlayingId(id);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setPlayingId(null);
        window.speechSynthesis.speak(utterance);
      }
    }
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
                    className={cn('w-6 h-6 rounded-full flex items-center justify-center transition-colors', playingId === preset.id ? 'bg-primary/20' : 'bg-secondary hover:bg-primary/20')}
                  >
                    {loadingId === preset.id ? <Loader2 className="w-2.5 h-2.5 text-primary animate-spin" /> :
                     playingId === preset.id ? <Square className="w-2.5 h-2.5 text-primary fill-current" /> :
                     <Play className="w-2.5 h-2.5 text-muted-foreground" />}
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
                      className={cn('w-6 h-6 rounded-full flex items-center justify-center transition-colors shrink-0', playingId === voice.id ? 'bg-primary/20' : 'bg-secondary hover:bg-primary/20')}
                    >
                      {loadingId === voice.id ? <Loader2 className="w-2.5 h-2.5 text-primary animate-spin" /> :
                       playingId === voice.id ? <Square className="w-2.5 h-2.5 text-primary fill-current" /> :
                       <Play className="w-2.5 h-2.5 text-muted-foreground" />}
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