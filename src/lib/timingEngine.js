/**
 * ClipForge Timing Engine
 * Computes voice-synced captions, scene durations, and keyword highlights
 * purely from text + voice settings — no external TTS API required.
 *
 * Speech model: average spoken English ≈ 150 wpm at speed 1.0
 * Adjustments apply voice_speed, natural pauses (punctuation), and emphasis.
 */

const BASE_WPM = 150;            // words per minute at speed 1.0
const CHARS_PER_WORD = 5.5;      // average chars per word

// Pause durations (seconds) per punctuation, scaled by voice_pause setting
const PUNCTUATION_PAUSES = {
  '.': 0.55,
  '!': 0.5,
  '?': 0.55,
  ',': 0.22,
  ';': 0.3,
  ':': 0.3,
  '—': 0.25,
  '–': 0.2,
};

// Power words that get highlight emphasis
const POWER_WORDS = new Set([
  'never', 'always', 'secret', 'truth', 'most', 'every', 'only', 'real',
  'powerful', 'deadly', 'shocking', 'hidden', 'exposed', 'unstoppable',
  'proven', 'instant', 'massive', 'dangerous', 'critical', 'ultimate',
  'elite', 'rare', 'impossible', 'incredible', 'extraordinary', 'warning',
  'stop', 'start', 'now', 'today', 'forever', 'never', 'nobody', 'everyone',
  'million', 'billion', 'zero', 'first', 'last', 'best', 'worst',
]);

/**
 * Tokenise text into words with timing metadata.
 * Returns array of { word, startTime, endTime, isPause, isPower }
 */
export function tokenizeWithTiming(text, voiceSettings = {}) {
  const speed = voiceSettings.voice_speed || 1.0;
  const pauseMultiplier = voiceSettings.voice_pause ?? 0.6; // 0–2 range from UI
  const emphasis = voiceSettings.voice_emphasis || 'medium';

  const wpm = BASE_WPM * speed;
  const secPerWord = 60 / wpm;

  // Split into tokens preserving punctuation
  const raw = text.trim().split(/(\s+)/);
  const tokens = [];
  let cursor = 0;

  for (const chunk of raw) {
    if (!chunk.trim()) continue;
    const word = chunk.replace(/["""''']/g, '').trim();
    if (!word) continue;

    // Detect trailing punctuation
    const trailingPunct = word.match(/([.!?,;:—–])$/)?.[1] || null;
    const cleanWord = word.replace(/[^a-zA-Z0-9'-]/g, '');

    const wordDur = secPerWord * Math.max(0.5, cleanWord.length / CHARS_PER_WORD);
    const pauseDur = trailingPunct
      ? (PUNCTUATION_PAUSES[trailingPunct] || 0.2) * pauseMultiplier * (1 / speed)
      : 0;

    const isPower = POWER_WORDS.has(cleanWord.toLowerCase());
    const isEmphasis = emphasis === 'strong' && (isPower || word === word.toUpperCase());

    tokens.push({
      word: cleanWord || word,
      raw: word,
      startTime: cursor,
      endTime: cursor + wordDur,
      pauseAfter: pauseDur,
      isPower,
      isEmphasis,
      isSentenceEnd: !!trailingPunct && '.!?'.includes(trailingPunct),
    });

    cursor += wordDur + pauseDur;
  }

  return tokens;
}

/**
 * Compute per-scene timing data from an array of scenes + voice settings.
 * Returns enriched scenes with:
 *   - duration (seconds, voice-synced)
 *   - caption_tokens (word-level timing for karaoke captions)
 *   - highlight_words (Set of words to highlight)
 *   - sentence_breaks (array of time offsets for sentence endings)
 */
export function computeSceneTiming(scenes, voiceSettings = {}) {
  const speed = voiceSettings.voice_speed || 1.0;
  const sentencePause = voiceSettings.voice_pause ?? 0.6;

  return scenes.map((scene, i) => {
    const tokens = tokenizeWithTiming(scene.text, voiceSettings);
    if (!tokens.length) return { ...scene, duration: 4, caption_tokens: [], highlight_words: [] };

    const lastToken = tokens[tokens.length - 1];
    const rawDuration = lastToken.endTime + lastToken.pauseAfter;

    // Add end-of-scene pause (natural breath between scenes)
    const sceneEndPause = (sentencePause * 0.5 * (1 / speed));
    const duration = Math.max(3, parseFloat((rawDuration + sceneEndPause).toFixed(2)));

    const highlightWords = new Set(tokens.filter(t => t.isPower || t.isEmphasis).map(t => t.word.toLowerCase()));
    const sentenceBreaks = tokens.filter(t => t.isSentenceEnd).map(t => t.endTime + t.pauseAfter);

    return {
      ...scene,
      duration,
      caption_tokens: tokens,
      highlight_words: [...highlightWords],
      sentence_breaks: sentenceBreaks,
    };
  });
}

/**
 * Generate caption segments from tokens based on caption style.
 * Modes: 'word_by_word' | 'sentence' | 'tiktok_bold' | 'highlight' | 'minimal'
 * Returns array of { words, startTime, endTime, highlightIdx }
 */
export function buildCaptionSegments(tokens, captionStyle = 'tiktok_bold', highlightColor = '#A3E635') {
  if (!tokens || tokens.length === 0) return [];

  if (captionStyle === 'word_by_word') {
    return tokens.map((t, i) => ({
      words: [t.word],
      startTime: t.startTime,
      endTime: t.endTime + t.pauseAfter,
      highlight: t.isPower || t.isEmphasis,
    }));
  }

  if (captionStyle === 'sentence') {
    const segments = [];
    let current = [];
    tokens.forEach((t, i) => {
      current.push(t);
      if (t.isSentenceEnd || i === tokens.length - 1) {
        segments.push({
          words: current.map(x => x.word),
          startTime: current[0].startTime,
          endTime: current[current.length - 1].endTime + current[current.length - 1].pauseAfter,
          powerWords: new Set(current.filter(x => x.isPower).map(x => x.word.toLowerCase())),
        });
        current = [];
      }
    });
    return segments;
  }

  if (captionStyle === 'tiktok_bold' || captionStyle === 'highlight') {
    // 2-4 words at a time, fast cuts
    const segments = [];
    const chunkSize = captionStyle === 'tiktok_bold' ? 3 : 4;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      segments.push({
        words: chunk.map(t => t.word),
        startTime: chunk[0].startTime,
        endTime: chunk[chunk.length - 1].endTime + chunk[chunk.length - 1].pauseAfter,
        powerWords: new Set(chunk.filter(t => t.isPower).map(t => t.word.toLowerCase())),
        activeWordIdx: 0,
        tokens: chunk,
      });
    }
    return segments;
  }

  if (captionStyle === 'minimal') {
    // One segment per sentence, minimal words shown
    const segments = [];
    let current = [];
    tokens.forEach((t, i) => {
      current.push(t);
      if (t.isSentenceEnd || i === tokens.length - 1) {
        if (current.length > 0) {
          // Only show key words
          const keyWords = current.filter(x => x.isPower || x.isEmphasis).map(x => x.word);
          segments.push({
            words: keyWords.length > 0 ? keyWords : [current[Math.floor(current.length / 2)]?.word || ''],
            startTime: current[0].startTime,
            endTime: current[current.length - 1].endTime,
            minimal: true,
          });
        }
        current = [];
      }
    });
    return segments;
  }

  return [];
}

/**
 * Split a full script into scenes aligned to natural sentence boundaries.
 * Respects voice pacing to target a given duration (in seconds).
 */
export function splitScriptByVoicePacing(script, voiceSettings = {}, targetDuration = 60) {
  const speed = voiceSettings.voice_speed || 1.0;
  const wpm = BASE_WPM * speed;
  const totalWords = script.split(/\s+/).filter(Boolean).length;
  const totalDuration = (totalWords / wpm) * 60;

  // Split by sentence first
  const sentences = script.split(/(?<=[.!?])\s+/).filter(Boolean);

  // Group into scenes of ~5-8 seconds each
  const targetSceneDuration = Math.min(8, Math.max(4, totalDuration / 8));
  const scenes = [];
  let current = [];
  let currentDuration = 0;

  sentences.forEach(sentence => {
    const words = sentence.split(/\s+/).filter(Boolean).length;
    const sentenceDuration = (words / wpm) * 60;

    if (currentDuration + sentenceDuration > targetSceneDuration && current.length > 0) {
      scenes.push({ text: current.join(' '), order: scenes.length });
      current = [sentence];
      currentDuration = sentenceDuration;
    } else {
      current.push(sentence);
      currentDuration += sentenceDuration;
    }
  });

  if (current.length > 0) {
    scenes.push({ text: current.join(' '), order: scenes.length });
  }

  return scenes.length > 0 ? scenes : [{ text: script, order: 0 }];
}

/**
 * Get human-readable timing summary for a project.
 */
export function getTimingSummary(scenes, voiceSettings) {
  const timedScenes = computeSceneTiming(scenes, voiceSettings);
  const totalDuration = timedScenes.reduce((sum, s) => sum + s.duration, 0);
  const totalWords = scenes.reduce((sum, s) => sum + (s.text || '').split(/\s+/).filter(Boolean).length, 0);
  const speed = voiceSettings.voice_speed || 1.0;
  const wpm = Math.round(BASE_WPM * speed);

  return {
    totalDuration: Math.round(totalDuration),
    totalWords,
    wpm,
    sceneCount: scenes.length,
    avgSceneDuration: Math.round(totalDuration / scenes.length),
  };
}