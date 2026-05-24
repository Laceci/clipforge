import React, { useEffect, useState, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { buildCaptionSegments, tokenizeWithTiming } from '@/lib/timingEngine';

/**
 * CaptionRenderer — Live animated caption overlay synced to voice timing.
 * Props:
 *   scene         — scene object with text, caption_segments, highlight_words, duration
 *   voiceSettings — { voice_speed, voice_pause, voice_emphasis }
 *   captionStyle  — 'word_by_word' | 'tiktok_bold' | 'sentence' | 'highlight' | 'minimal'
 *   captionColor  — hex string
 *   highlightColor — hex string
 *   isPlaying     — boolean, drives the animation clock
 *   currentTime   — optional override (seconds since scene start)
 */
export default function CaptionRenderer({
  scene,
  voiceSettings = {},
  captionStyle = 'tiktok_bold',
  captionColor = '#FFFFFF',
  highlightColor = '#A3E635',
  isPlaying = false,
  currentTime: externalTime,
}) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  // Build segments from scene data (or recompute if missing)
  const segments = React.useMemo(() => {
    if (scene?.caption_segments?.length) return scene.caption_segments;
    if (!scene?.text) return [];
    const tokens = tokenizeWithTiming(scene.text, voiceSettings);
    return buildCaptionSegments(tokens, captionStyle, highlightColor);
  }, [scene?.text, scene?.caption_segments, captionStyle, voiceSettings.voice_speed, voiceSettings.voice_pause]);

  // Animation clock
  useEffect(() => {
    if (externalTime !== undefined) {
      setElapsed(externalTime);
      return;
    }
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    startRef.current = performance.now() - elapsed * 1000;

    const tick = () => {
      const now = performance.now();
      const t = (now - startRef.current) / 1000;
      setElapsed(Math.min(t, scene?.duration || 10));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, externalTime]);

  // Reset on scene change
  useEffect(() => {
    setElapsed(0);
    startRef.current = null;
  }, [scene?.text]);

  if (!segments.length) return null;

  // Find active segment
  const activeSegIdx = segments.findLastIndex?.(s => s.startTime <= elapsed) ?? segments.findIndex((s, i) => {
    const next = segments[i + 1];
    return s.startTime <= elapsed && (!next || next.startTime > elapsed);
  });
  const activeSeg = activeSegIdx >= 0 ? segments[activeSegIdx] : null;

  if (!activeSeg) return null;

  const containerStyle = { color: captionColor };

  // ── word_by_word ──
  if (captionStyle === 'word_by_word') {
    const word = activeSeg.words[0] || '';
    return (
      <CaptionContainer>
        <span
          key={word + activeSegIdx}
          className="font-extrabold text-2xl tracking-wide uppercase drop-shadow-lg animate-caption-pop"
          style={{
            ...containerStyle,
            color: activeSeg.highlight ? highlightColor : captionColor,
            textShadow: '0 2px 12px rgba(0,0,0,0.7)',
          }}
        >
          {word}
        </span>
      </CaptionContainer>
    );
  }

  // ── tiktok_bold / highlight — karaoke active-word highlighting ──
  if (captionStyle === 'tiktok_bold' || captionStyle === 'highlight') {
    const tokens = activeSeg.tokens || activeSeg.words.map(w => ({ word: w }));
    // Find which word in the chunk is currently being spoken
    const activeWordIdx = activeSeg.tokens
      ? activeSeg.tokens.findLastIndex?.(t => t.startTime <= elapsed) ?? 0
      : 0;

    return (
      <CaptionContainer>
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
          {tokens.map((tok, i) => {
            const word = tok.word || tok;
            const isActive = i === activeWordIdx;
            const isPast = i < activeWordIdx;
            const isPower = tok.isPower || activeSeg.powerWords?.has?.(word.toLowerCase());
            return (
              <span
                key={i}
                className={cn(
                  'font-extrabold text-xl tracking-wide uppercase transition-all duration-75 drop-shadow-lg',
                  isActive && 'scale-110',
                )}
                style={{
                  color: isActive && isPower ? highlightColor
                    : isActive ? captionColor
                    : isPast ? `${captionColor}99`
                    : `${captionColor}66`,
                  textShadow: isActive ? `0 2px 16px rgba(0,0,0,0.8), 0 0 8px ${highlightColor}44` : '0 2px 8px rgba(0,0,0,0.6)',
                  display: 'inline-block',
                  transform: isActive ? 'scale(1.12)' : 'scale(1)',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </CaptionContainer>
    );
  }

  // ── sentence ──
  if (captionStyle === 'sentence') {
    const powerWords = activeSeg.powerWords || new Set();
    return (
      <CaptionContainer>
        <p className="text-base font-semibold text-center leading-snug drop-shadow-lg" style={containerStyle}>
          {activeSeg.words.map((w, i) => (
            <span
              key={i}
              style={{ color: powerWords.has(w.toLowerCase()) ? highlightColor : captionColor }}
            >
              {w}{' '}
            </span>
          ))}
        </p>
      </CaptionContainer>
    );
  }

  // ── minimal ──
  if (captionStyle === 'minimal') {
    return (
      <CaptionContainer>
        <p className="text-lg font-bold tracking-widest uppercase text-center drop-shadow-lg opacity-80" style={containerStyle}>
          {activeSeg.words.join(' ')}
        </p>
      </CaptionContainer>
    );
  }

  return null;
}

function CaptionContainer({ children }) {
  return (
    <div className="absolute bottom-14 left-0 right-0 flex justify-center px-4 z-10">
      <div className="max-w-[85%] text-center">
        {children}
      </div>
    </div>
  );
}