import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Wand2, Loader2, Mic, Music, Volume2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VOICE_ENHANCEMENTS = [
  { key: 'noise_reduction', label: 'Noise Reduction' },
  { key: 'clarity_boost', label: 'Clarity Boost' },
  { key: 'normalize', label: 'Normalize Levels' },
  { key: 'de_ess', label: 'De-esser' },
];

export default function AIAudioPanel({ project, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [applied, setApplied] = useState(false);

  const voiceVolume = project?.voice_volume ?? 80;
  const musicVolume = project?.music_volume ?? 30;
  const enhancements = project?.audio_enhancements ?? {};

  const update = (changes) => onUpdate(changes);

  const analyzeAudio = async () => {
    setLoading(true);
    setSuggestion(null);
    setApplied(false);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional audio engineer for short-form video content. Suggest optimal audio settings for this video.

Video info:
- Voice style: ${project?.voice_style || 'motivational'}
- Music track: ${project?.music_track || 'epic_cinematic'}
- Category: ${project?.template_category || 'custom'}
- Duration: ${project?.duration || 'unknown'}s

Suggest ideal voice volume (0-100), music volume (0-100), and which audio enhancements to enable.
Available enhancements: noise_reduction, clarity_boost, normalize, de_ess`,
      response_json_schema: {
        type: 'object',
        properties: {
          voice_volume: { type: 'number' },
          music_volume: { type: 'number' },
          enhancements: {
            type: 'object',
            properties: {
              noise_reduction: { type: 'boolean' },
              clarity_boost: { type: 'boolean' },
              normalize: { type: 'boolean' },
              de_ess: { type: 'boolean' },
            },
          },
          tips: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    setSuggestion(result);
    setLoading(false);
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    update({
      voice_volume: suggestion.voice_volume,
      music_volume: suggestion.music_volume,
      audio_enhancements: suggestion.enhancements,
    });
    setApplied(true);
  };

  const toggleEnhancement = (key) => {
    const newEnhancements = { ...enhancements, [key]: !enhancements[key] };
    update({ audio_enhancements: newEnhancements });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">AI balances voiceover and music levels for the perfect mix.</p>
        <Button
          size="sm"
          onClick={analyzeAudio}
          disabled={loading}
          className="bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs border-0 shrink-0"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
          Auto-Mix
        </Button>
      </div>

      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-primary">AI Recommendation</p>
              <Button
                size="sm"
                onClick={applySuggestion}
                disabled={applied}
                className="h-6 px-2 text-[10px] bg-primary text-primary-foreground rounded-lg"
              >
                {applied ? <><Check className="w-2.5 h-2.5 mr-1" /> Applied</> : 'Apply All'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-secondary/40 rounded-lg p-2">
                <p className="text-muted-foreground">Voice</p>
                <p className="font-bold text-foreground">{suggestion.voice_volume}%</p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-2">
                <p className="text-muted-foreground">Music</p>
                <p className="font-bold text-foreground">{suggestion.music_volume}%</p>
              </div>
            </div>
            {suggestion.tips?.length > 0 && (
              <ul className="space-y-0.5">
                {suggestion.tips.map((tip, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground flex gap-1">
                    <span className="text-primary shrink-0">·</span>{tip}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume controls */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Mic className="w-3.5 h-3.5 text-primary" /> Voiceover
            </div>
            <span className="text-xs text-muted-foreground">{voiceVolume}%</span>
          </div>
          <Slider
            value={[voiceVolume]}
            onValueChange={([v]) => update({ voice_volume: v })}
            min={0} max={100} step={1}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Music className="w-3.5 h-3.5 text-blue-400" /> Background Music
            </div>
            <span className="text-xs text-muted-foreground">{musicVolume}%</span>
          </div>
          <Slider
            value={[musicVolume]}
            onValueChange={([v]) => update({ music_volume: v })}
            min={0} max={100} step={1}
          />
        </div>
      </div>

      {/* Enhancements */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Voice Enhancements</p>
        <div className="grid grid-cols-2 gap-2">
          {VOICE_ENHANCEMENTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleEnhancement(key)}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition-all border ${
                enhancements[key]
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-secondary/40 text-muted-foreground border-transparent hover:border-border'
              }`}
            >
              <Volume2 className="w-3 h-3 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}