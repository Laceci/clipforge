import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, ChevronDown, ChevronUp, Mic, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tokenizeWithTiming } from '@/lib/timingEngine';
import { toast } from 'sonner';

const EMPHASIS_OPTIONS = ['none', 'soft', 'medium', 'strong', 'dramatic'];

// Generates a stable fake waveform from text content
function generateWaveform(text, bars = 60) {
  const seed = text ? text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 42;
  return Array.from({ length: bars }, (_, i) => {
    const x = Math.sin(seed * 0.01 + i * 0.4) * 0.5 + 0.5;
    const y = Math.cos(seed * 0.007 + i * 0.6) * 0.3 + 0.5;
    return Math.max(0.08, Math.min(1, (x + y) / 2 + (Math.sin(i * 1.3) * 0.15)));
  });
}

function Waveform({ bars, progress, color = '#A3E635', isPlaying }) {
  return (
    <div className="flex items-center gap-[2px] h-14 w-full">
      {bars.map((h, i) => {
        const pct = i / bars.length;
        const isPast = pct < progress;
        const isActive = Math.abs(pct - progress) < 0.03;
        return (
          <div
            key={i}
            className="rounded-full flex-1 transition-all duration-75"
            style={{
              height: `${Math.round(h * 100)}%`,
              background: isPast
                ? color
                : isActive && isPlaying
                ? color
                : 'rgba(255,255,255,0.12)',
              opacity: isActive && isPlaying ? 1 : isPast ? 0.85 : 0.4,
              transform: isActive && isPlaying ? 'scaleY(1.3)' : 'scaleY(1)',
            }}
          />
        );
      })}
    </div>
  );
}

function SceneVoiceControls({ scene, index, globalSettings, onUpdate, highlightColor }) {
  const [expanded, setExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  // Per-scene overrides, fall back to global
  const speed = scene.voice_speed ?? globalSettings.voice_speed ?? 1.0;
  const pitch = scene.voice_pitch ?? globalSettings.voice_pitch ?? 1.0;
  const pause = scene.voice_pause ?? globalSettings.voice_pause ?? 0.6;
  const emphasis = scene.voice_emphasis ?? globalSettings.voice_emphasis ?? 'medium';

  const tokens = React.useMemo(
    () => tokenizeWithTiming(scene.text || '', { voice_speed: speed, voice_pause: pause, voice_emphasis: emphasis }),
    [scene.text, speed, pause, emphasis]
  );
  const duration = tokens.length
    ? tokens[tokens.length - 1].endTime + tokens[tokens.length - 1].pauseAfter
    : 4;

  const waveform = React.useMemo(() => generateWaveform(scene.text, 55), [scene.text]);

  const handlePlay = () => {
    if (isPlaying) {
      cancelAnimationFrame(rafRef.current);
      setIsPlaying(false);
      return;
    }
    startRef.current = performance.now() - progress * duration * 1000;
    setIsPlaying(true);
    toast.info('Live TTS preview requires ElevenLabs/OpenAI API key — showing timing simulation.', { id: 'tts-notice', duration: 3000 });
  };

  useEffect(() => {
    if (!isPlaying) { cancelAnimationFrame(rafRef.current); return; }
    const tick = () => {
      const t = (performance.now() - startRef.current) / 1000;
      const p = Math.min(t / duration, 1);
      setProgress(p);
      if (p >= 1) { setIsPlaying(false); setProgress(0); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, duration]);

  const handleStop = () => {
    cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setProgress(0);
  };

  const update = (key, val) => onUpdate({ [key]: val });

  // Active word index
  const elapsed = progress * duration;
  const activeWordIdx = tokens.findLastIndex?.(t => t.startTime <= elapsed) ?? -1;

  return (
    <div className={cn('glass-card rounded-xl p-3 space-y-3 transition-all', expanded && 'ring-1 ring-primary/20')}>
      {/* Header row */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-primary">{index + 1}</span>
        </div>
        <p className="text-[11px] text-muted-foreground flex-1 truncate">{scene.text?.slice(0, 50) || 'Empty scene'}…</p>
        <span className="text-[10px] text-muted-foreground shrink-0">{duration.toFixed(1)}s</span>
        <button onClick={() => setExpanded(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Waveform + playback */}
      <div className="space-y-1.5">
        <Waveform bars={waveform} progress={progress} color={highlightColor} isPlaying={isPlaying} />

        {/* Karaoke text preview */}
        <div className="flex flex-wrap gap-x-1 gap-y-0.5 min-h-[18px]">
          {tokens.slice(0, 12).map((t, i) => (
            <span key={i} className={cn('text-[10px] transition-all duration-75',
              i === activeWordIdx ? 'font-bold' : i < activeWordIdx ? 'text-muted-foreground/50' : 'text-muted-foreground/30'
            )} style={{ color: i === activeWordIdx ? highlightColor : undefined }}>
              {t.word}
            </span>
          ))}
          {tokens.length > 12 && <span className="text-[10px] text-muted-foreground/20">…</span>}
        </div>

        {/* Transport controls */}
        <div className="flex items-center gap-2">
          <button onClick={handlePlay}
            className="w-7 h-7 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-all">
            {isPlaying ? <Pause className="w-3 h-3 text-primary" /> : <Play className="w-3 h-3 text-primary ml-0.5" />}
          </button>
          {isPlaying && (
            <button onClick={handleStop}
              className="w-7 h-7 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-all">
              <Square className="w-2.5 h-2.5 text-muted-foreground" />
            </button>
          )}
          <div className="flex-1 h-1 bg-secondary/50 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="text-[9px] text-muted-foreground shrink-0">{(elapsed).toFixed(1)}s</span>
        </div>
      </div>

      {/* Per-scene controls (expanded) */}
      {expanded && (
        <div className="space-y-3 pt-1 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Scene Overrides</p>

          {[
            { key: 'voice_speed', label: 'Speed', min: 0.5, max: 2.0, step: 0.05, val: speed, fmt: v => `${v.toFixed(2)}x`, global: globalSettings.voice_speed },
            { key: 'voice_pitch', label: 'Pitch',  min: 0.5, max: 1.5, step: 0.05, val: pitch, fmt: v => `${v.toFixed(2)}x`, global: globalSettings.voice_pitch },
            { key: 'voice_pause', label: 'Pause',  min: 0,   max: 2.0, step: 0.1,  val: pause, fmt: v => `${v.toFixed(1)}s`,  global: globalSettings.voice_pause },
          ].map(({ key, label, min, max, step, val, fmt, global: gval }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1.5">
                  {scene[key] !== undefined && scene[key] !== gval && (
                    <button onClick={() => { const s = { ...scene }; delete s[key]; onUpdate({ [key]: undefined }); }}
                      className="text-[9px] text-primary/60 hover:text-primary underline">reset</button>
                  )}
                  <span className="font-medium text-foreground">{fmt(val)}</span>
                </div>
              </div>
              <Slider value={[val]} onValueChange={([v]) => update(key, v)} min={min} max={max} step={step} />
            </div>
          ))}

          {/* Emphasis */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground">Emphasis</p>
            <div className="flex gap-1">
              {EMPHASIS_OPTIONS.map(opt => (
                <button key={opt} onClick={() => update('voice_emphasis', opt)}
                  className={cn('flex-1 py-1 rounded-lg text-[9px] font-medium capitalize transition-all',
                    emphasis === opt ? 'bg-primary/20 text-primary' : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/60')}>
                  {opt === 'none' ? '—' : opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VoicePreviewPanel({ scenes = [], projectData = {}, onUpdateScene }) {
  const [globalPlaying, setGlobalPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);

  const globalSettings = {
    voice_speed: projectData.voice_speed ?? 1.0,
    voice_pitch: projectData.voice_pitch ?? 1.0,
    voice_pause: projectData.voice_pause ?? 0.6,
    voice_emphasis: projectData.voice_emphasis ?? 'medium',
  };

  const highlightColor = projectData.highlight_color || '#A3E635';

  if (!scenes.length) {
    return (
      <div className="text-center py-8 space-y-2">
        <Mic className="w-8 h-8 text-muted-foreground/20 mx-auto" />
        <p className="text-xs text-muted-foreground">No scenes yet. Generate a video first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">Per-scene voice controls · click ▾ to override</p>
        <span className="text-[10px] text-primary font-medium">{scenes.length} scenes</span>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
        {scenes.map((scene, i) => (
          <SceneVoiceControls
            key={i}
            scene={scene}
            index={i}
            globalSettings={globalSettings}
            highlightColor={highlightColor}
            onUpdate={(updates) => onUpdateScene(i, updates)}
          />
        ))}
      </div>

      <p className="text-[9px] text-muted-foreground/50 text-center pt-1">
        🎙️ Live audio preview available with ElevenLabs or OpenAI TTS API key
      </p>
    </div>
  );
}