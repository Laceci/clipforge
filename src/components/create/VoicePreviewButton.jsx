import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Loader2, Volume2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { previewVoice, stopSpeech, isTTSSupported } from '@/lib/ttsEngine';
import { cn } from '@/lib/utils';

// Short sample per voice — used for ElevenLabs preview
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
const DEFAULT_SAMPLE = 'Welcome to ClipForge. Your video is ready to create.';

function base64ToBlob(base64, contentType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: contentType });
}

export default function VoicePreviewButton({ voiceId = null, voiceStyle = 'motivational', voiceSpeed = 1.0 }) {
  const [status, setStatus] = useState('idle'); // idle | loading | playing
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  const supported = isTTSSupported();

  // Cleanup on unmount or voice change
  useEffect(() => {
    return () => {
      stopSpeech();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    };
  }, [voiceId, voiceStyle]);

  const handleStop = () => {
    stopSpeech();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    setStatus('idle');
  };

  const handleToggle = async () => {
    if (status === 'playing') { handleStop(); return; }

    setStatus('loading');

    const idToPreview = voiceId || voiceStyle;
    const sampleText = PREVIEW_SAMPLES[idToPreview] || DEFAULT_SAMPLE;

    // Try ElevenLabs first
    try {
      const result = await base44.functions.invoke('generateVoiceover', {
        script: sampleText,
        voice_id: idToPreview,
        voice_speed: voiceSpeed,
        voice_stability: 0.5,
      });

      const { audio_data, content_type } = result.data || {};
      if (audio_data) {
        const blob = base64ToBlob(audio_data, content_type || 'audio/mpeg');
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        setStatus('playing');

        audio.play();
        audio.onended = () => {
          URL.revokeObjectURL(url);
          blobUrlRef.current = null;
          audioRef.current = null;
          setStatus('idle');
        };
        audio.onerror = () => { handleStop(); };
        return;
      }
    } catch {
      // ElevenLabs unavailable — fall through to browser TTS
    }

    // Fallback: browser Web Speech API
    if (!supported) { setStatus('idle'); return; }
    setStatus('playing');
    await previewVoice(idToPreview, voiceSpeed, 1.0, voiceStyle);
    setStatus('idle');
  };

  if (!supported && !base44) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-full transition-all shrink-0',
          status === 'playing'
            ? 'bg-primary text-primary-foreground neon-glow'
            : 'bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === 'playing' ? (
          <Square className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium capitalize text-foreground/80">
          {voiceId ? voiceId.replace(/_/g, ' ') : voiceStyle.replace(/_/g, ' ')} — voice preview
        </p>
        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
          Click to hear a sample narration for this voice
        </p>
      </div>

      {status === 'playing' && (
        <div className="flex gap-0.5 items-end h-4 shrink-0">
          <div className="w-0.5 bg-primary rounded-full animate-bounce" style={{ height: '40%', animationDelay: '0ms' }} />
          <div className="w-0.5 bg-primary rounded-full animate-bounce" style={{ height: '80%', animationDelay: '120ms' }} />
          <div className="w-0.5 bg-primary rounded-full animate-bounce" style={{ height: '55%', animationDelay: '240ms' }} />
          <div className="w-0.5 bg-primary rounded-full animate-bounce" style={{ height: '70%', animationDelay: '60ms' }} />
        </div>
      )}

      {status === 'idle' && (
        <Volume2 className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
      )}
    </div>
  );
}
