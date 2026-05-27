import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, SkipBack, SkipForward, Download, Send, Edit,
  RefreshCw, CheckCircle2, AlertCircle, Volume2, VolumeX, Mic, Music, ImageIcon, Zap, Loader2, Film, Link2, Check as CheckIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { downloadVideo } from '@/lib/downloadVideo';
import { Link } from 'react-router-dom';
import { computeSceneTiming } from '@/lib/timingEngine';
import CaptionRenderer from '@/components/preview/CaptionRenderer';
import CinematicVideoPlayer from '@/components/preview/CinematicVideoPlayer';
import SchedulePostModal from '@/components/publish/SchedulePostModal';
import { useQueryClient } from '@tanstack/react-query';
import { speakScene, stopSpeech, isTTSSupported, estimateSpeakDuration } from '@/lib/ttsEngine';
import { VISUAL_EFFECTS, MUSIC_TRACKS } from '@/lib/aiEnhancements';
import { preloadSceneImages, getOptimalSettings, detectDevicePerformance } from '@/lib/imageOptimization';

function fmtTime(sec) {
  const s = Math.floor(sec || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ─── Real Video Player (Optimized Preview) ─────────────────────────────────
function VideoPlayer({ projectData }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneTime, setSceneTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);
  const [useLightMode, setUseLightMode] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const mutedRef = useRef(false);
  const preloadedRef = useRef({});

  const voiceSettings = {
    voice_id: projectData.voice_id || null,
    voice_speed: projectData.voice_speed || 1.0,
    voice_pause: projectData.voice_pause ?? 0.6,
    voice_emphasis: projectData.voice_emphasis || 'medium',
    voice_pitch: projectData.voice_pitch || 1.0,
  };

  const scenes = projectData.scenes || [];
  const timedScenes = React.useMemo(() => computeSceneTiming(scenes, voiceSettings), [scenes]);

  const safeIdx = Math.min(sceneIdx, timedScenes.length - 1);
  const currentScene = timedScenes[safeIdx];
  const sceneDuration = currentScene?.duration || estimateSpeakDuration(currentScene?.text, voiceSettings.voice_speed);
  const totalDuration = timedScenes.reduce((s, sc) => s + (sc.duration || 5), 0);
  const elapsed = timedScenes.slice(0, safeIdx).reduce((s, sc) => s + (sc.duration || 5), 0) + sceneTime;
  const progressPct = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  // Check TTS support and preload images on mount
  useEffect(() => {
    const checkTTS = () => {
      setTtsReady(isTTSSupported());
    };
    checkTTS();
    window.speechSynthesis?.addEventListener('voiceschanged', checkTTS);

    // Detect device performance and start preloading
    const perf = detectDevicePerformance();
    setUseLightMode(perf.tier === 'low');
    console.log(`[Video Player] Device tier: ${perf.tier}, Light mode: ${perf.tier === 'low'}`);

    // Preload images for smooth playback
    preloadSceneImages(timedScenes, (loaded, total) => {
      console.log(`[Video Player] Preloaded ${loaded}/${total} scenes`);
      if (loaded === total) {
        setIsPreloading(false);
      }
    }).catch(err => {
      console.warn('[Video Player] Preload error:', err);
      setIsPreloading(false); // Continue anyway
    });

    return () => window.speechSynthesis?.removeEventListener('voiceschanged', checkTTS);
  }, [timedScenes]);

  // Sync mutedRef for use in async TTS
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Scene playback loop with preload optimization
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!isPlaying) {
      stopSpeech();
      isSpeakingRef.current = false;
      return;
    }

    startRef.current = performance.now() - sceneTime * 1000;

    // Speak current scene via TTS with natural speech patterns
    if (!isSpeakingRef.current && currentScene?.text) {
      isSpeakingRef.current = true;
      console.log(`[ClipForge] 🎙 Speaking scene ${safeIdx + 1} (natural speech): "${currentScene.text.slice(0, 40)}..."`);
      speakScene(currentScene.text, {
        voice_id: voiceSettings.voice_id,
        voice_speed: voiceSettings.voice_speed,
        voice_pitch: voiceSettings.voice_pitch,
        voice_tone: voiceSettings.voice_style || 'neutral',
        voice_emphasis: voiceSettings.voice_emphasis,
        contentType: projectData.template_category || 'general',
        isShortForm: true,
        muted: mutedRef.current,
      }).then(() => {
        isSpeakingRef.current = false;
      });
    }

    // Preload next scene image
    if (safeIdx < timedScenes.length - 1) {
      const nextScene = timedScenes[safeIdx + 1];
      if (nextScene?.image_url && !preloadedRef.current[nextScene.image_url]) {
        const img = new Image();
        img.onload = () => {
          preloadedRef.current[nextScene.image_url] = true;
        };
        img.src = nextScene.image_url;
      }
    }

    const tick = () => {
      const t = (performance.now() - startRef.current) / 1000;
      if (t >= sceneDuration) {
        if (safeIdx < timedScenes.length - 1) {
          console.log(`[ClipForge] ⏭ Advancing to scene ${safeIdx + 2}`);
          isSpeakingRef.current = false;
          setSceneIdx(i => i + 1);
          setSceneTime(0);
          startRef.current = performance.now();
        } else {
          console.log('[ClipForge] ✅ Playback complete');
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

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, safeIdx, sceneDuration]);

  // Stop speech when muted toggled mid-play
  useEffect(() => {
    if (muted) stopSpeech();
    else if (isPlaying && currentScene?.text && !isSpeakingRef.current) {
    isSpeakingRef.current = true;
    speakScene(currentScene.text, { voice_id: voiceSettings.voice_id, voice_speed: voiceSettings.voice_speed, voice_pitch: voiceSettings.voice_pitch, voice_emphasis: voiceSettings.voice_emphasis, muted: false })
      .then(() => { isSpeakingRef.current = false; });
    }
  }, [muted]);

  // Cleanup on unmount
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); stopSpeech(); }, []);

  const handlePlay = () => {
    if (!isPlaying) {
      console.log('[ClipForge] ▶ Playback started');
    } else {
      console.log('[ClipForge] ⏸ Playback paused');
      stopSpeech();
      isSpeakingRef.current = false;
    }
    setIsPlaying(p => !p);
  };

  const goTo = (idx) => {
    stopSpeech();
    isSpeakingRef.current = false;
    setSceneIdx(Math.max(0, Math.min(idx, timedScenes.length - 1)));
    setSceneTime(0);
    setIsPlaying(false);
  };

  if (!currentScene) {
    return (
      <div className="aspect-[9/16] bg-secondary/20 rounded-2xl flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No scenes generated</p>
      </div>
    );
  }

  if (isPreloading) {
    return (
      <div className="aspect-[9/16] max-h-[520px] bg-secondary/20 rounded-2xl flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Loading video scenes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden bg-black select-none" style={{ aspectRatio: '9/16', maxHeight: 520 }}>
        {/* Scene image with Ken Burns (optimized for performance) */}
        {currentScene.image_url ? (
          <img
            key={sceneIdx}
            src={currentScene.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              animation: !useLightMode && (currentScene.animation === 'pan_zoom' || !currentScene.animation)
                ? 'resultsKenBurns 8s ease-in-out infinite alternate'
                : undefined,
              filter: !useLightMode && VISUAL_EFFECTS[currentScene.visual_effect]?.filter || '',
            }}
            loading="lazy"
            decoding="async"
            onLoad={() => console.log(`[ClipForge] 🖼 Scene ${safeIdx + 1} image loaded successfully`)}
            onError={() => console.warn(`[ClipForge] ⚠️ Scene ${safeIdx + 1} image failed to load`)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
            <span className="text-5xl opacity-20">🎬</span>
          </div>
        )}

        {/* Cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        <div className="absolute top-0 left-0 right-0 h-8 bg-black/60" />

        {/* Scene counter */}
        <div className="absolute top-10 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] text-white/80 font-medium">
          {safeIdx + 1} / {timedScenes.length}
        </div>

        {/* Live speaking indicator */}
        {isPlaying && !muted && ttsReady && (
          <div className="absolute top-10 left-3 bg-primary/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <div className="flex gap-0.5 items-end h-3">
              <div className="w-0.5 bg-black rounded-full animate-bounce" style={{ height: '40%', animationDelay: '0ms' }} />
              <div className="w-0.5 bg-black rounded-full animate-bounce" style={{ height: '80%', animationDelay: '150ms' }} />
              <div className="w-0.5 bg-black rounded-full animate-bounce" style={{ height: '60%', animationDelay: '300ms' }} />
            </div>
            <span className="text-[9px] font-bold text-black">LIVE</span>
          </div>
        )}

        {/* Captions */}
        {currentScene && (
          <CaptionRenderer
            scene={currentScene}
            voiceSettings={voiceSettings}
            captionStyle={projectData.caption_style || 'tiktok_bold'}
            captionColor={projectData.caption_color || '#FFFFFF'}
            highlightColor={projectData.highlight_color || '#A3E635'}
            isPlaying={isPlaying}
            currentTime={sceneTime}
          />
        )}

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Progress bar */}
          <div
            className="h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              const target = pct * totalDuration;
              let acc = 0;
              for (let i = 0; i < timedScenes.length; i++) {
                const d = timedScenes[i].duration || 5;
                if (acc + d >= target) {
                  stopSpeech();
                  isSpeakingRef.current = false;
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
            <button onClick={() => goTo(safeIdx - 1)} disabled={safeIdx === 0}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition-all">
              <SkipBack className="w-3.5 h-3.5 text-white" />
            </button>

            <button
              onClick={handlePlay}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-all neon-glow flex-shrink-0"
            >
              {isPlaying
                ? <Pause className="w-5 h-5 text-black" />
                : <Play className="w-5 h-5 text-black ml-0.5" />}
            </button>

            <button onClick={() => goTo(safeIdx + 1)} disabled={safeIdx >= timedScenes.length - 1}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition-all">
              <SkipForward className="w-3.5 h-3.5 text-white" />
            </button>

            <div className="flex-1" />

            <button onClick={() => setMuted(m => !m)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              {muted ? <VolumeX className="w-3.5 h-3.5 text-white/60" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>

          <p className="text-center text-[10px] text-white/50">{fmtTime(elapsed)} / {fmtTime(totalDuration)}</p>
        </div>

        <style>{`
          @keyframes resultsKenBurns {
            from { transform: scale(1) translate(0,0); }
            to   { transform: scale(1.08) translate(-1%,-1%); }
          }
        `}</style>
      </div>

      {/* Performance & TTS status hint */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-center text-muted-foreground">
          {ttsReady
            ? '▶ Press play · AI voiceover + captions sync live'
            : '▶ Press play · Enable browser audio for voiceover'}
        </p>
        {useLightMode && (
          <p className="text-[9px] text-center text-amber-600/80 flex items-center justify-center gap-1">
            <Zap className="w-2.5 h-2.5" />
            Light mode active · Optimized for your device
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Asset Status Row ─────────────────────────────────────────────────────────
function AssetStatus({ icon: Icon, label, status }) {
  const colors = {
    ok:      'text-primary',
    missing: 'text-muted-foreground/40',
    warn:    'text-yellow-500',
  };
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className={cn('w-3.5 h-3.5', colors[status])} />
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('ml-auto font-medium', colors[status])}>
        {status === 'ok' ? '✓ Ready' : status === 'warn' ? '~ Partial' : '— Missing'}
      </span>
    </div>
  );
}

// ─── Results Panel ────────────────────────────────────────────────────────────
export default function ResultsPanel({ projectData, projectId, onExport, onRetry, onRender, renderState = { status: 'idle' } }) {
  const scenes = projectData.scenes || [];
  const hasScenes = scenes.length > 0;
  const hasImages = scenes.some(s => s.image_url);
  const hasCaptions = scenes.some(s => s.caption || s.caption_segments);
  const isFailed = projectData.status === 'failed';
  const isReady = !isFailed && hasScenes && hasImages;

  const [showSchedule, setShowSchedule] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const queryClient = useQueryClient();

  const getFilename = () =>
    `${(projectData.title || projectData.topic || 'clipforge-video').replace(/[^a-z0-9_\- ]/gi, '').trim() || 'video'}.mp4`;

  const handleDownload = async () => {
    if (!projectData.video_url || downloading) return;
    setDownloading(true);
    await downloadVideo(projectData.video_url, projectData.title || projectData.topic);
    setDownloading(false);
  };

  const handleCopyLink = () => {
    if (!projectData.video_url) return;
    navigator.clipboard.writeText(projectData.video_url).then(() => {
      setCopyDone(true);
      toast.success('Link copied! Paste it into any browser to download or share.');
      setTimeout(() => setCopyDone(false), 3000);
    });
  };

  // Logging on mount
  useEffect(() => {
    if (isReady) {
      console.log('[ClipForge] ✅ Results panel loaded — project ready');
      console.log(`[ClipForge] 📊 Scenes: ${scenes.length}, Duration: ${Math.round(projectData.duration || 0)}s`);
      console.log(`[ClipForge] 🖼 Images: ${scenes.filter(s => s.image_url).length}/${scenes.length}`);
      console.log(`[ClipForge] 📝 Captions: ${hasCaptions ? 'yes' : 'no'}`);
      console.log(`[ClipForge] 🎵 Music track: ${projectData.music_track || 'none'}`);
      console.log(`[ClipForge] 🎤 Voice: ${projectData.voice_id || 'browser TTS'}`);
      console.log(`[ClipForge] 🖼 Thumbnail: ${projectData.thumbnail_url ? 'yes' : 'no'}`);
    } else if (isFailed) {
      console.error('[ClipForge] ❌ Project failed:', projectData.error_message);
    }
  }, []);

  const projectForModal = {
    id: projectId,
    title: projectData.title || projectData.topic || 'Untitled',
    thumbnail_url: projectData.thumbnail_url || scenes[0]?.image_url || '',
    duration: projectData.duration,
    resolution: projectData.resolution || '1080p',
    script: projectData.script,
    topic: projectData.topic,
    visual_style: projectData.visual_style,
  };

  return (
    <div className="space-y-6">
      {/* Status header */}
      <div className="text-center space-y-1">
        {isFailed ? (
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
        )}
        <h2 className="text-xl font-bold">
          {isFailed ? 'Generation Failed' : isReady ? 'Video Ready!' : 'Rendering…'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isFailed
            ? (projectData.error_message || 'Something went wrong during generation.')
            : isReady
              ? `${scenes.length} scenes · ${Math.round(projectData.duration || 0)}s · ${(projectData.visual_style || 'cinematic').replace(/_/g, ' ')} style`
              : 'Generating your video — please wait…'}
        </p>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 md:gap-5">
        {/* Preview */}
        <div>
          {isReady ? (
            <CinematicVideoPlayer projectData={projectData} />
          ) : isFailed ? (
            <div className="aspect-[9/16] max-h-[400px] bg-destructive/5 border border-destructive/20 rounded-2xl flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-8 h-8 text-destructive/50" />
              <p className="text-sm text-destructive/70 text-center px-4">
                {projectData.error_message || 'Generation failed. Please retry.'}
              </p>
            </div>
          ) : (
            <div className="aspect-[9/16] max-h-[400px] bg-secondary/20 rounded-2xl flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Rendering in progress…</p>
            </div>
          )}
        </div>

        {/* Metadata + Actions */}
        <div className="space-y-4">
          {/* Video details */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Video Details</p>
            {[
              { label: 'Duration',     value: `${Math.round(projectData.duration || 0)}s` },
              { label: 'Scenes',       value: `${scenes.length}` },
              { label: 'Visual Style', value: (projectData.visual_style || 'cinematic').replace(/_/g, ' ') },
              { label: 'Captions',     value: (projectData.caption_style || 'tiktok bold').replace(/_/g, ' ') },
              { label: 'Resolution',   value: projectData.resolution || '1080p' },
              { label: 'Status',       value: isFailed ? 'Failed' : isReady ? 'Ready' : 'Rendering', highlight: isReady },
              { label: 'Music',        value: MUSIC_TRACKS[projectData.music_track]?.label || (projectData.music_track || 'None').replace(/_/g,' ') },
              ...(projectData.music_mood ? [{ label: 'Mood', value: `${projectData.music_mood} · ${projectData.music_energy || ''}` }] : []),
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className={cn('font-medium capitalize', highlight && 'text-primary', isFailed && label === 'Status' && 'text-destructive')}>{value}</span>
              </div>
            ))}
          </div>

          {/* Asset status */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Render Status</p>
            <AssetStatus icon={ImageIcon} label="Scene visuals" status={hasImages ? 'ok' : 'missing'} />
            <AssetStatus icon={Mic} label="AI voiceover (TTS)" status={isTTSSupported() ? 'ok' : 'warn'} />
            <AssetStatus icon={Music} label="Background music" status={projectData.music_track ? 'warn' : 'missing'} />
            <AssetStatus icon={CheckCircle2} label="Captions" status={hasCaptions ? 'ok' : 'missing'} />
            <AssetStatus icon={ImageIcon} label="Thumbnail" status={projectData.thumbnail_url ? 'ok' : hasImages ? 'warn' : 'missing'} />
          </div>

          {/* AI Enhancements summary */}
          {isReady && scenes.some(s => s.visual_effect_ai || s.transition_ai) && (
            <div className="glass-card rounded-xl p-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">✨ AI Enhancements</p>
              {scenes.some(s => s.transition_ai) && (
                <p className="text-[10px] text-muted-foreground">🎞 Transitions: AI-matched per scene mood</p>
              )}
              {scenes.some(s => s.visual_effect_ai) && (
                <p className="text-[10px] text-muted-foreground">🎨 Filters: AI cinematic effects per scene</p>
              )}
              {projectData.music_ai_selected && (
                <p className="text-[10px] text-muted-foreground">🎵 Music: AI-selected · {projectData.music_reason || ''}</p>
              )}
            </div>
          )}

          {/* Note */}
          <div className={cn('rounded-xl p-3 text-xs border',
            isFailed
              ? 'bg-destructive/5 border-destructive/20 text-destructive'
              : projectData.video_url
                ? 'bg-primary/5 border-primary/20 text-primary/80'
                : 'bg-amber-500/5 border-amber-500/20 text-amber-600/80'
          )}>
            {isFailed
              ? '⚠️ Generation failed. Check your topic and retry.'
              : projectData.video_url
                ? '✅ Your MP4 is ready. Click Download to save it.'
                : renderState.status === 'rendering' || renderState.status === 'submitting'
                  ? '⏳ Rendering your MP4 with ElevenLabs voiceover + Creatomate...'
                  : '▶ Preview ready — press Play to watch. Click Render & Download MP4 to export.'}
          </div>

          {/* Rendered MP4 player — shown when final video is available */}
          {isReady && projectData.video_url && (
            <div className="rounded-xl overflow-hidden border border-primary/20 bg-black">
              <video
                src={projectData.video_url}
                controls
                playsInline
                className="w-full"
                style={{ maxHeight: 180 }}
                onError={() => console.warn('[ClipForge] ⚠️ Inline video failed to load')}
              >
                Your browser does not support HTML5 video.
              </video>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {isFailed ? (
              <Button onClick={onRetry} className="w-full rounded-xl gap-2 bg-primary text-primary-foreground neon-glow">
                <RefreshCw className="w-4 h-4" /> Retry Generation
              </Button>
            ) : isReady ? (
              <>
                {/* ── MP4 render / download ── */}
                {projectData.video_url ? (
                  <>
                    {/* Primary: Download MP4 */}
                    <Button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 neon-glow font-bold"
                    >
                      {downloading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing download...</>
                        : <><Download className="w-4 h-4" /> Download MP4</>}
                    </Button>

                    {/* Copy link fallback */}
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors py-1"
                    >
                      {copyDone
                        ? <><CheckIcon className="w-3 h-3 text-primary" /> Link copied!</>
                        : <><Link2 className="w-3 h-3" /> Copy video link (if download doesn't start)</>}
                    </button>

                    {/* Secondary: Post to Social */}
                    <Button
                      onClick={() => setShowSchedule(true)}
                      variant="outline"
                      className="w-full rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Send className="w-4 h-4" /> Post to Social Media
                    </Button>

                    {/* Tertiary: back to dashboard */}
                    <button
                      onClick={onExport}
                      className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors pt-1"
                    >
                      ← Back to Dashboard
                    </button>
                  </>
                ) : renderState.status === 'submitting' ? (
                  <Button disabled className="w-full rounded-xl gap-2 bg-primary/50 text-primary-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating voiceover...
                  </Button>
                ) : renderState.status === 'rendering' ? (
                  <div className="space-y-2">
                    <Button disabled className="w-full rounded-xl gap-2 bg-primary/50 text-primary-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Rendering MP4...
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">
                      This takes 1–2 min · stay on this page
                    </p>
                  </div>
                ) : renderState.status === 'failed' ? (
                  <div className="space-y-2">
                    <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-2.5 text-[10px] text-destructive flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{renderState.error || 'Render failed. Check your API keys in Base44 Secrets.'}</span>
                    </div>
                    <Button onClick={onRender} className="w-full rounded-xl gap-2 bg-primary text-primary-foreground neon-glow">
                      <RefreshCw className="w-4 h-4" /> Retry Render
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={onRender}
                    className="w-full rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 neon-glow font-bold"
                  >
                    <Film className="w-4 h-4" /> Render & Download MP4
                  </Button>
                )}
              </>
            ) : (
              <Button disabled className="w-full rounded-xl gap-2 opacity-50">
                <RefreshCw className="w-4 h-4 animate-spin" /> Rendering…
              </Button>
            )}
          </div>
        </div>
      </div>

      {showSchedule && (
        <SchedulePostModal
          open={showSchedule}
          onClose={() => setShowSchedule(false)}
          project={projectForModal}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })}
        />
      )}
    </div>
  );
}