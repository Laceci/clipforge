import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stopSpeech, previewVoice } from '@/lib/ttsEngine';
import { VOICE_LIBRARY, validateVoiceSelection, logVoiceSelection } from '@/lib/voiceIdentity';
import { base44 } from '@/api/base44Client';

// Map library voices to component format for backward compatibility
const VOICES = VOICE_LIBRARY.map(voice => ({
  id: voice.id,
  name: voice.name,
  gender: voice.gender,
  category: voice.category,
  tags: voice.tags,
  description: voice.description,
  avatar: voice.avatar,
  speed: voice.ttsProfile.rate,
  pitch: voice.ttsProfile.pitch,
  emphasis: voice.tone,
}));

// Legacy voices (for compatibility)
const LEGACY_VOICES = [
  // Stories / Storytelling
  { id: 'dominic', name: 'Dominic', gender: 'male', tags: ['#STORIES', '#SCARY'], description: 'Deep male voice, great for stories and horror', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80', speed: 0.88, pitch: 0.82, emphasis: 'dramatic', category: 'stories' },
  { id: 'ethan', name: 'Ethan', gender: 'male', tags: ['#STORIES', '#MOTIVATIONAL'], description: 'Dominant, commanding storyteller', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80', speed: 0.92, pitch: 0.88, emphasis: 'strong', category: 'stories' },
  { id: 'claire', name: 'Claire', gender: 'female', tags: ['#STORIES', '#EMOTIONAL'], description: 'Soothing female narrator for personal stories', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80', speed: 0.95, pitch: 1.05, emphasis: 'soft', category: 'stories' },
  { id: 'nova', name: 'Nova', gender: 'female', tags: ['#STORIES', '#TRUE CRIME'], description: 'Clear and articulate, perfect for mystery', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80', speed: 1.0, pitch: 1.0, emphasis: 'medium', category: 'stories' },

  // Educational
  { id: 'marcus', name: 'Marcus', gender: 'male', tags: ['#EDUCATIONAL', '#FACTS'], description: 'Clear and informative, science and history', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80', speed: 1.0, pitch: 1.0, emphasis: 'medium', category: 'educational' },
  { id: 'ivy', name: 'Ivy', gender: 'female', tags: ['#EDUCATIONAL', '#PROFESSIONAL'], description: 'Crisp and authoritative female educator', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&q=80', speed: 1.02, pitch: 1.05, emphasis: 'medium', category: 'educational' },
  { id: 'theo', name: 'Theo', gender: 'male', tags: ['#EDUCATIONAL', '#BUSINESS'], description: 'Smart and engaging, finance and psychology', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&q=80', speed: 1.05, pitch: 0.98, emphasis: 'medium', category: 'educational' },

  // Motivational
  { id: 'hugo', name: 'Hugo', gender: 'male', tags: ['#MOTIVATIONAL', '#HUSTLE'], description: 'Expressive, deep and emotive power voice', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&q=80', speed: 1.1, pitch: 0.9, emphasis: 'strong', category: 'motivational' },
  { id: 'sophia', name: 'Sophia', gender: 'female', tags: ['#MOTIVATIONAL', '#EMPOWERMENT'], description: 'Strong female voice for mindset content', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&q=80', speed: 1.05, pitch: 1.1, emphasis: 'strong', category: 'motivational' },
  { id: 'zara', name: 'Zara', gender: 'female', tags: ['#MOTIVATIONAL', '#FITNESS'], description: 'Fierce and energetic, hustle culture', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80', speed: 1.1, pitch: 1.0, emphasis: 'strong', category: 'motivational' },

  // Spiritual / Calm
  { id: 'aurora', name: 'Aurora', gender: 'female', tags: ['#SPIRITUAL', '#MEDITATION'], description: 'Soft and ethereal, guided meditation', avatar: 'https://images.unsplash.com/photo-1520810627419-35e592be37f8?w=120&q=80', speed: 0.78, pitch: 1.1, emphasis: 'none', category: 'spiritual' },
  { id: 'zen', name: 'Zen', gender: 'male', tags: ['#SPIRITUAL', '#CALM'], description: 'Ultra calm and deep, breathwork and sleep', avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=120&q=80', speed: 0.8, pitch: 0.9, emphasis: 'none', category: 'spiritual' },

  // Professional
  { id: 'sterling', name: 'Sterling', gender: 'male', tags: ['#PROFESSIONAL', '#BUSINESS'], description: 'Authoritative and polished, leadership', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&q=80', speed: 0.98, pitch: 0.95, emphasis: 'medium', category: 'professional' },
  { id: 'diana', name: 'Diana', gender: 'female', tags: ['#PROFESSIONAL', '#CORPORATE'], description: 'Executive female voice for B2B content', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80', speed: 0.96, pitch: 1.0, emphasis: 'medium', category: 'professional' },

  // UGC
  { id: 'jake', name: 'Jake', gender: 'male', tags: ['#UGC', '#CASUAL'], description: 'Natural and relatable, product reviews', avatar: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=120&q=80', speed: 1.05, pitch: 1.0, emphasis: 'natural', category: 'ugc' },
  { id: 'mia', name: 'Mia', gender: 'female', tags: ['#UGC', '#LIFESTYLE'], description: 'Friendly and upbeat, lifestyle content', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80', speed: 1.08, pitch: 1.1, emphasis: 'natural', category: 'ugc' },
];

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'stories', label: '#stories' },
  { id: 'educational', label: '#educational' },
  { id: 'motivational', label: '#motivational' },
  { id: 'spiritual', label: '#spiritual' },
  { id: 'professional', label: '#professional' },
  { id: 'ugc', label: '#ugc' },
];

export function getVoiceById(id) {
  return VOICES.find(v => v.id === id) || VOICES[0];
}

export default function VoiceAvatarPicker({ value, onChange }) {
  const [activeTab, setActiveTab] = useState('all');
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [validationWarning, setValidationWarning] = useState(null);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  const selectedId = value || VOICES[0].id;

  // Validate voice selection on mount and when value changes
  useEffect(() => {
    if (value) {
      const validation = validateVoiceSelection(value);
      if (!validation.valid) {
        setValidationWarning(validation.warnings.join(', '));
      } else {
        setValidationWarning(null);
        logVoiceSelection(value, 'Voice picker mounted');
      }
    }
  }, [value]);

  const filtered = activeTab === 'all' ? VOICES : VOICES.filter(v => v.category === activeTab);

  const stopCurrent = () => {
    stopSpeech();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    setPlayingId(null);
    setLoadingId(null);
  };

  const handlePreview = async (e, voice) => {
    e.stopPropagation();

    if (playingId === voice.id) { stopCurrent(); return; }
    stopCurrent();

    const voiceData = VOICE_LIBRARY.find(v => v.id === voice.id);
    const text = voiceData?.previewText || 'Welcome to ClipForge. Your video is ready to create.';

    // Create AudioContext synchronously during the click gesture so mobile
    // browsers keep the audio permission alive through the async API call.
    let audioCtx = null;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {}

    setLoadingId(voice.id);
    try {
      const result = await base44.functions.invoke('generateVideoClip', {
        voice_mode: 'tts',
        script: text,
        voice_id: voice.id,
        voice_speed: voice.speed || 1.0,
      });

      const audioData = result?.data?.audio_data;
      if (!audioData) throw new Error('No audio returned');

      const binary = atob(audioData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      setLoadingId(null);
      setPlayingId(voice.id);
      logVoiceSelection(voice.id, 'Preview started via ElevenLabs');

      if (audioCtx) {
        // AudioContext path — works on mobile where <Audio>.play() is blocked
        const decoded = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
        const source = audioCtx.createBufferSource();
        source.buffer = decoded;
        source.connect(audioCtx.destination);
        source.start(0);
        source.onended = () => { audioCtx.close(); stopCurrent(); };
      } else {
        // Fallback to blob URL for desktop
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        await audio.play();
        audio.onended = () => stopCurrent();
        audio.onerror = () => stopCurrent();
      }
    } catch {
      setLoadingId(null);
      audioCtx?.close();
      // Fallback: browser TTS with proper per-voice settings
      setPlayingId(voice.id);
      await previewVoice(voice.id, voice.speed || 1.0, voice.pitch || 1.0);
      setPlayingId(null);
    }
  };

  const handleSelect = (voice) => {
    // Validate before selection
    const validation = validateVoiceSelection(voice.id);
    if (!validation.valid) {
      setValidationWarning(`Cannot select: ${validation.warnings.join(', ')}`);
      return;
    }

    logVoiceSelection(voice.id, 'Voice selected by user');

    onChange({
      voice_id: voice.id,
      voice_style: voice.emphasis,
      voice_speed: voice.speed,
      voice_pitch: voice.pitch,
      voice_emphasis: voice.emphasis,
    });
    setValidationWarning(null);
  };

  return (
    <div className="space-y-4">
      {/* Validation warning */}
      {validationWarning && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400">{validationWarning}</p>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1 rounded-full text-[11px] font-semibold transition-all border',
              activeTab === tab.id
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-secondary/40 text-muted-foreground border-transparent hover:border-border'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Voice cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
        {filtered.map(voice => {
          const isSelected = selectedId === voice.id;
          const isPlaying = playingId === voice.id;
          return (
            <button
              key={voice.id}
              onClick={() => handleSelect(voice)}
              className={cn(
                'relative p-3 rounded-2xl border-2 text-left transition-all group space-y-2',
                isSelected
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                  : 'border-transparent bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50'
              )}
            >
              {/* Avatar */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                <img
                  src={voice.avatar}
                  alt={voice.name}
                  className="w-full h-full object-cover object-top"
                />
                {/* Play button overlay */}
                <button
                  onClick={(e) => handlePreview(e, voice)}
                  className={cn(
                    'absolute inset-0 flex items-center justify-center transition-all',
                    isPlaying || loadingId === voice.id ? 'bg-black/40' : 'bg-black/0 group-hover:bg-black/30'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    isPlaying || loadingId === voice.id ? 'bg-primary opacity-100' : 'bg-black/60 opacity-0 group-hover:opacity-100'
                  )}>
                    {loadingId === voice.id
                      ? <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
                      : isPlaying
                        ? <Pause className="w-3.5 h-3.5 text-primary-foreground" />
                        : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
                  </div>
                </button>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">{voice.name}</p>
                  <span className={cn(
                    'text-[8px] font-bold px-1.5 py-0.5 rounded-full',
                    voice.gender === 'male' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                  )}>
                    {voice.gender === 'male' ? '♂' : '♀'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {voice.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[8px] font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{voice.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}