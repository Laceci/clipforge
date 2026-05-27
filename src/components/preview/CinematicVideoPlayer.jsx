import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CaptionRenderer from './CaptionRenderer';
import { VOICE_PROFILES } from '@/lib/ttsEngine';
import { base44 } from '@/api/base44Client';

/**
 * Cinematic Video Player
 * Renders actual video clips (not slideshow of images)
 * Supports both real video clips and fallback image animations
 */
export default function CinematicVideoPlayer({ projectData }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneTime, setSceneTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [useLightMode, setUseLightMode] = useState(false);
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const utteranceRef = useRef(null);
  const sceneAudioRef = useRef(null);
  const sceneBlobUrlRef = useRef(null);
  const audioCache = useRef(new Map()); // sceneIdx → blob URL

  const scenes = projectData.scenes || [];
  const totalDuration = scenes.reduce((s, sc) => s + (sc.duration || sc.clip_duration || 5), 0);

  useEffect(() => {
    if (scenes.length === 0) {
      setIsLoading(false);
      return;
    }
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [scenes.length]);

  // Pre-fetch TTS for all scenes in the background when player loads
  useEffect(() => {
    if (scenes.length === 0) return;
    audioCache.current.clear();

    const controller = new AbortController();
    scenes.forEach((scene, i) => {
      // Use stored audio_data if pipeline already generated it
      if (scene.audio_data) {
        try {
          const binary = atob(scene.audio_data);
          const bytes = new Uint8Array(binary.length);
          for (let k = 0; k < binary.length; k++) bytes[k] = binary.charCodeAt(k);
          const blob = new Blob([bytes], { type: scene.audio_content_type || 'audio/mpeg' });
          audioCache.current.set(i, URL.createObjectURL(blob));
          console.log(`[Player] 🎙 Scene ${i + 1} audio from pipeline cache`);
        } catch (e) {
          console.warn(`[Player] ⚠️ Scene ${i + 1} pipeline audio decode failed:`, e.message);
        }
        return;
      }
      // Otherwise fetch from API
      const text = (scene.text || scene.caption || '').replace(/\[SCENE\]/gi, '').trim();
      if (!text) return;
      console.log(`[Player] 🔄 Scene ${i + 1} fetching TTS from API...`);
      base44.functions.invoke('generateVideoClip', {
        voice_mode: 'tts',
        script: text,
        voice_id: projectData.voice_id || 'morgan_deep',
        voice_speed: projectData.voice_speed || 1.0,
      }).then(result => {
        if (controller.signal.aborted) return;
        const audioData = result?.data?.audio_data;
        if (!audioData) {
          console.warn(`[Player] ⚠️ Scene ${i + 1} TTS returned no audio. Full response:`, JSON.stringify(result?.data).slice(0, 300));
          return;
        }
        try {
          const binary = atob(audioData);
          const bytes = new Uint8Array(binary.length);
          for (let k = 0; k < binary.length; k++) bytes[k] = binary.charCodeAt(k);
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          audioCache.current.set(i, URL.createObjectURL(blob));
          console.log(`[Player] 🎙 Scene ${i + 1} audio ready (${result.data.provider}, ${(audioData.length * 0.75 / 1024).toFixed(0)}KB)`);
        } catch (e) {
          console.warn(`[Player] ⚠️ Scene ${i + 1} audio decode failed:`, e.message);
        }
      }).catch(err => {
        console.warn(`[Player] ⚠️ Scene ${i + 1} TTS API call failed:`, err?.message || err);
      });
    });

    return () => {
      controller.abort();
      audioCache.current.forEach(url => URL.revokeObjectURL(url));
      audioCache.current.clear();
    };
  }, [scenes.length, projectData.voice_id]);

  // Actually play/pause the <video> element when isPlaying changes or scene changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(e => console.warn('[Player] Video play blocked:', e.message));
    } else {
      video.pause();
    }
  }, [isPlaying, sceneIdx]);

  // Scene audio: play ElevenLabs audio if stored in scene, else fall back to browser TTS
  useEffect(() => {
    // Stop any previously playing scene audio
    window.speechSynthesis?.cancel();
    if (sceneAudioRef.current) {
      sceneAudioRef.current.pause();
      sceneAudioRef.current = null;
    }
    if (sceneBlobUrlRef.current) {
      URL.revokeObjectURL(sceneBlobUrlRef.current);
      sceneBlobUrlRef.current = null;
    }

    if (!isPlaying || !scenes[sceneIdx] || muted) return;

    const scene = scenes[sceneIdx];

    // Use pre-fetched OpenAI TTS audio from cache if available
    const cachedUrl = audioCache.current.get(safeIdx);
    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      audio.play().catch(e => console.warn('[Player] Audio play blocked:', e.message));
      sceneAudioRef.current = audio;
      return () => { audio.pause(); sceneAudioRef.current = null; };
    }

    // Fallback: browser Web Speech API
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const text = (scene.caption || scene.text || '').replace(/\[SCENE\]/gi, '').trim();
    if (!text) return;

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voiceId = projectData.voice_id || 'morgan_deep';
      const profile = VOICE_PROFILES[voiceId] || VOICE_PROFILES.morgan_deep;
      utterance.rate = Math.min(1.5, Math.max(0.5, (profile?.rate || 1.0) * (projectData.voice_speed || 1.0)));
      utterance.pitch = profile?.pitch || 1.0;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const hints = profile?.nameHints || ['Daniel', 'David'];
        const match = voices.find(v => hints.some(h => v.name.includes(h)));
        if (match) utterance.voice = match;
      }
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) speak();
    else window.speechSynthesis.onvoiceschanged = speak;

    return () => { window.speechSynthesis.cancel(); };
  }, [isPlaying, sceneIdx, muted]);

  const safeIdx = Math.min(sceneIdx, scenes.length - 1);
  const currentScene = scenes[safeIdx];
  const sceneDuration = currentScene?.duration || currentScene?.clip_duration || 5;
  const elapsed = scenes.slice(0, safeIdx).reduce((s, sc) => s + (sc.duration || sc.clip_duration || 5), 0) + sceneTime;
  const progressPct = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  const isVideoClip = currentScene?.clip_type === 'cinematic-video';
  const isFallback = currentScene?.clip_type === 'still-image-fallback';

  // Playback loop
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!isPlaying || !currentScene) return;

    startRef.current = performance.now() - sceneTime * 1000;

    const tick = () => {
      const t = (performance.now() - startRef.current) / 1000;
      if (t >= sceneDuration) {
        if (safeIdx < scenes.length - 1) {
          setSceneIdx(i => i + 1);
          setSceneTime(0);
          startRef.current = performance.now();
        } else {
          setIsPlaying(false);
          setSceneTime(0);
          setSceneIdx(0);
        }
      } else {
        setSceneTime(t);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, safeIdx, sceneDuration, scenes.length]);

  if (!currentScene) {
    return (
      <div className="aspect-[9/16] bg-secondary/20 rounded-2xl flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No scenes generated</p>
      </div>
    );
  }

  const fmtTime = (sec) => {
    const s = Math.floor(sec || 0);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden bg-black select-none" style={{ aspectRatio: '9/16', maxHeight: 520 }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Video Clip or Fallback Image */}
        {isVideoClip && currentScene.video_url ? (
          <video
            key={safeIdx}
            ref={videoRef}
            src={currentScene.video_url}
            className="w-full h-full object-cover"
            muted={muted}
            playsInline
            onLoadedMetadata={() => setIsLoading(false)}
            onTimeUpdate={(e) => setSceneTime(e.currentTarget.currentTime)}
            onEnded={() => {
              if (safeIdx < scenes.length - 1) {
                setSceneIdx(i => i + 1);
                setSceneTime(0);
              } else {
                setIsPlaying(false);
                setSceneIdx(0);
                setSceneTime(0);
              }
            }}
            onError={() => console.warn('[CinematicPlayer] Video playback error')}
          />
        ) : (
          <img
            key={safeIdx}
            src={currentScene.image_url || currentScene.video_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              animation: isFallback && !isVideoClip
                ? 'cinematicFallbackAnimation 8s ease-in-out infinite alternate'
                : undefined,
            }}
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Cinematic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        <div className="absolute top-0 left-0 right-0 h-8 bg-black/60" />

        {/* Scene Counter */}
        <div className="absolute top-10 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] text-white/80 font-medium">
          {safeIdx + 1} / {scenes.length}
        </div>

        {/* Playback Status */}
        {isPlaying && (
          <div className="absolute top-10 left-3 bg-primary/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <div className="flex gap-0.5 items-end h-3">
              <div className="w-0.5 bg-black rounded-full animate-bounce" style={{ height: '40%', animationDelay: '0ms' }} />
              <div className="w-0.5 bg-black rounded-full animate-bounce" style={{ height: '80%', animationDelay: '150ms' }} />
              <div className="w-0.5 bg-black rounded-full animate-bounce" style={{ height: '60%', animationDelay: '300ms' }} />
            </div>
            <span className="text-[9px] font-bold text-black ml-1">
              {isVideoClip ? 'CINEMA' : 'PLAYBACK'}
            </span>
          </div>
        )}

        {/* Fallback Indicator */}
        {isFallback && (
          <div className="absolute bottom-4 left-4 bg-amber-500/20 backdrop-blur-sm border border-amber-500/40 rounded-full px-2.5 py-1 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-medium text-amber-400">Cinematic fallback</span>
          </div>
        )}

        {/* Captions */}
        {currentScene && (
          <CaptionRenderer
            scene={currentScene}
            voiceSettings={{
              voice_speed: projectData.voice_speed || 1.0,
              voice_pitch: projectData.voice_pitch || 1.0,
            }}
            captionStyle={projectData.caption_style || 'tiktok_bold'}
            captionColor={projectData.caption_color || '#FFFFFF'}
            highlightColor={projectData.highlight_color || '#A3E635'}
            isPlaying={isPlaying}
            currentTime={sceneTime}
          />
        )}

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Progress Bar */}
          <div
            className="h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              const target = pct * totalDuration;
              let acc = 0;
              for (let i = 0; i < scenes.length; i++) {
                const d = scenes[i].duration || scenes[i].clip_duration || 5;
                if (acc + d >= target) {
                  setSceneIdx(i);
                  setSceneTime(target - acc);
                  setIsPlaying(false);
                  return;
                }
                acc += d;
              }
            }}
          >
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>

          {/* Transport */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSceneIdx(Math.max(0, safeIdx - 1));
                setSceneTime(0);
              }}
              disabled={safeIdx === 0}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition-all"
            >
              <SkipBack className="w-3.5 h-3.5 text-white" />
            </button>

            <button
              onClick={() => setIsPlaying(p => !p)}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-all neon-glow flex-shrink-0"
            >
              {isPlaying
                ? <Pause className="w-5 h-5 text-black" />
                : <Play className="w-5 h-5 text-black ml-0.5" />}
            </button>

            <button
              onClick={() => {
                setSceneIdx(Math.min(scenes.length - 1, safeIdx + 1));
                setSceneTime(0);
              }}
              disabled={safeIdx >= scenes.length - 1}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition-all"
            >
              <SkipForward className="w-3.5 h-3.5 text-white" />
            </button>

            <div className="flex-1" />

            <button
              onClick={() => setMuted(m => !m)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5 text-white/60" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>

          <p className="text-center text-[10px] text-white/50">{fmtTime(elapsed)} / {fmtTime(totalDuration)}</p>
        </div>

        <style>{`
          @keyframes cinematicFallbackAnimation {
            from { transform: scale(1) translate(0,0); }
            to   { transform: scale(1.08) translate(-1%,-1%); }
          }
        `}</style>
      </div>

      {/* Info */}
      <div className="space-y-1.5 text-center">
        <p className="text-[10px] text-muted-foreground">
          {isVideoClip
            ? '▶ Cinematic video clip · Press play for live preview'
            : '▶ Cinematic sequence · Press play for animated preview'}
        </p>
        {projectData.cinematicMode && (
          <p className="text-[9px] text-primary/70">
            🎬 {projectData.cinematicMode.replace(/_/g, ' ').toUpperCase()}
          </p>
        )}
      </div>
    </div>
  );
}