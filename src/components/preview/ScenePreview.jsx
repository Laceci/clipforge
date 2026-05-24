import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';
import CaptionRenderer from './CaptionRenderer';
import { computeSceneTiming } from '@/lib/timingEngine';
import { speakScene, stopSpeech } from '@/lib/ttsEngine';
import { VISUAL_EFFECTS } from '@/lib/aiEnhancements';

function fmtTime(sec) {
  const s = Math.floor(sec || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * ScenePreview — Full video preview with voice-synced caption animation.
 */
export default function ScenePreview({ scenes = [], projectData = {} }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneTime, setSceneTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const audioRef = useRef(null);
  const mutedRef = useRef(false);

  const voiceSettings = {
    voice_speed: projectData.voice_speed || 1.0,
    voice_pause: projectData.voice_pause ?? 0.6,
    voice_emphasis: projectData.voice_emphasis || 'medium',
    voice_pitch: projectData.voice_pitch || 1.0,
  };

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const timedScenes = React.useMemo(
    () => computeSceneTiming(scenes, voiceSettings),
    [scenes, voiceSettings.voice_speed, voiceSettings.voice_pause]
  );

  // Reset index if scenes change (e.g. after drag-reorder in editor)
  useEffect(() => {
    setSceneIdx(0);
    setSceneTime(0);
    setIsPlaying(false);
  }, [scenes.length]);

  const safeIdx = Math.min(sceneIdx, timedScenes.length - 1);
  const currentScene = timedScenes[safeIdx];
  const sceneDuration = currentScene?.duration || 5;

  // TTS + rAF playback loop
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!isPlaying) {
      stopSpeech();
      isSpeakingRef.current = false;
      return;
    }
    startRef.current = performance.now() - sceneTime * 1000;

    if (!isSpeakingRef.current && currentScene?.text) {
      isSpeakingRef.current = true;
      speakScene(currentScene.text, {
        voice_speed: voiceSettings.voice_speed,
        voice_pitch: voiceSettings.voice_pitch,
        muted: mutedRef.current,
      }).then(() => { isSpeakingRef.current = false; });
    }

    const tick = () => {
      const t = (performance.now() - startRef.current) / 1000;
      if (t >= sceneDuration) {
        if (safeIdx < timedScenes.length - 1) {
          isSpeakingRef.current = false;
          setSceneIdx(i => i + 1);
          setSceneTime(0);
          startRef.current = performance.now();
        } else {
          stopSpeech();
          isSpeakingRef.current = false;
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
  }, [isPlaying, safeIdx, sceneDuration]);

  // Handle mute toggle mid-play
  useEffect(() => {
    if (muted) {
      stopSpeech();
    } else if (isPlaying && currentScene?.text && !isSpeakingRef.current) {
      isSpeakingRef.current = true;
      speakScene(currentScene.text, { voice_speed: voiceSettings.voice_speed, voice_pitch: voiceSettings.voice_pitch, muted: false })
        .then(() => { isSpeakingRef.current = false; });
    }
  }, [muted]);

  // Background music via HTML audio
  useEffect(() => {
    const MUSIC_TRACKS = {
      epic_cinematic: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
    };
    if (!projectData.music_track || muted) return;
    const url = MUSIC_TRACKS[projectData.music_track];
    if (!url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.loop = true;
      audioRef.current.volume = (projectData.music_volume || 30) / 100;
    }
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
    return () => {};
  }, [isPlaying, muted, projectData.music_track]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    stopSpeech();
    audioRef.current?.pause();
  }, []);

  const goToScene = (idx) => {
    stopSpeech();
    isSpeakingRef.current = false;
    const clamped = Math.max(0, Math.min(idx, timedScenes.length - 1));
    setSceneIdx(clamped);
    setSceneTime(0);
    setIsPlaying(false);
  };

  const totalDuration = timedScenes.reduce((s, sc) => s + (sc.duration || 5), 0);
  const elapsed = timedScenes.slice(0, safeIdx).reduce((s, sc) => s + (sc.duration || 5), 0) + sceneTime;
  const progressPct = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  if (!currentScene) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black select-none" style={{ aspectRatio: '9/16', maxHeight: 480 }}>
      {currentScene.image_url ? (
        <img
          key={safeIdx}
          src={currentScene.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            animation: 'sceneKenBurns 8s ease-in-out infinite alternate',
            filter: VISUAL_EFFECTS[currentScene.visual_effect]?.filter || '',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
          <span className="text-5xl opacity-30">🎬</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] text-white/80 font-medium">
        {safeIdx + 1} / {timedScenes.length}
      </div>

      <CaptionRenderer
        scene={currentScene}
        voiceSettings={voiceSettings}
        captionStyle={projectData.caption_style || 'tiktok_bold'}
        captionColor={projectData.caption_color || '#FFFFFF'}
        highlightColor={projectData.highlight_color || '#A3E635'}
        isPlaying={isPlaying}
        currentTime={sceneTime}
      />

      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%`, transition: 'width 0.1s linear' }} />
        </div>

        <div className="flex items-center justify-center gap-3">
          <button onClick={() => goToScene(safeIdx - 1)} disabled={safeIdx === 0}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition-all">
            <SkipBack className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => { if (isPlaying) { stopSpeech(); isSpeakingRef.current = false; } setIsPlaying(p => !p); }}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-all neon-glow">
            {isPlaying ? <Pause className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 text-black ml-0.5" />}
          </button>
          <button onClick={() => goToScene(safeIdx + 1)} disabled={safeIdx >= timedScenes.length - 1}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition-all">
            <SkipForward className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setMuted(m => !m)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            {muted ? <VolumeX className="w-3.5 h-3.5 text-white/50" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>

        <p className="text-center text-[10px] text-white/50">{fmtTime(elapsed)} / {fmtTime(totalDuration)}</p>
      </div>

      <style>{`
        @keyframes sceneKenBurns {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.08) translate(-1%, -1%); }
        }
      `}</style>
    </div>
  );
}