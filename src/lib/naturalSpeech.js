/**
 * ClipForge Natural Speech Engine
 * Converts text into human-like speech patterns with emotional delivery,
 * natural pauses, emphasis, and conversational pacing for short-form content.
 */

/**
 * Break text into natural speech phrases with strategic pauses
 * Identifies sentence boundaries, commas, and natural speaking chunks
 */
export function phraseText(text, maxPhraseLength = 20) {
  if (!text) return [];

  // Normalize text
  let processed = text.trim();

  // Add slight pauses at natural speech boundaries
  processed = processed
    .replace(/([.!?])\s+/g, '$1 |PAUSE| ')       // After sentence endings
    .replace(/,\s+/g, ', |BREATH| ')              // After commas
    .replace(/—/g, ' |BREATH| ')                  // Em-dashes as breathing points
    .replace(/;/g, '; |PAUSE| ')                  // Semicolons
    .replace(/:\s+/g, ': |BREATH| ');             // Colons

  // Split on pause markers
  const segments = processed.split(/\s*\|PAUSE\|\s*|\s*\|BREATH\|\s*/);

  // Further break long segments into natural phrases at word boundaries
  const phrases = [];
  for (const segment of segments) {
    if (!segment.trim()) continue;

    const words = segment.trim().split(/\s+/);
    let currentPhrase = [];

    for (const word of words) {
      currentPhrase.push(word);

      // Natural phrase length around 15-20 words
      if (currentPhrase.length >= maxPhraseLength) {
        phrases.push(currentPhrase.join(' '));
        currentPhrase = [];
      }
    }

    if (currentPhrase.length > 0) {
      phrases.push(currentPhrase.join(' '));
    }
  }

  return phrases.filter(p => p.trim());
}

/**
 * Calculate dynamic speech rate for short-form content
 * Varies based on content type and emphasis
 */
export function calculateDynamicRate(baseRate = 0.95, contentType = 'general', isEmphasis = false) {
  const contentRates = {
    tiktok: 1.05,      // Slightly faster for engagement
    shorts: 1.03,      // YouTube Shorts - moderate pace
    motivational: 1.15, // Energy and urgency
    calm: 0.80,        // Meditation/relaxation
    educational: 0.98, // Clarity and comprehension
    general: 0.95,     // Default balanced pace
  };

  let finalRate = contentRates[contentType] || baseRate;

  // Slightly slow down emphasized words for impact
  if (isEmphasis) {
    finalRate = finalRate * 0.92;
  }

  return Math.max(0.5, Math.min(2.0, finalRate));
}

/**
 * Calculate dynamic pitch for emotional delivery
 * Varies pitch slightly for emphasis and engagement
 */
export function calculateDynamicPitch(basePitch = 1.0, tone = 'neutral', isEmphasis = false) {
  const toneVariations = {
    calm: -0.08,
    warm: 0.05,
    energetic: 0.12,
    curious: 0.15,
    tender: 0.10,
    dark: -0.15,
    inspiring: 0.18,
    neutral: 0,
  };

  let finalPitch = basePitch + (toneVariations[tone] || 0);

  // Add pitch variation on emphasized words
  if (isEmphasis) {
    finalPitch = finalPitch + 0.08;
  }

  return Math.max(0.5, Math.min(2.0, finalPitch));
}

/**
 * Identify words that should receive emphasis
 * Based on position, length, and semantic importance
 */
export function identifyEmphasizedWords(text) {
  if (!text) return new Set();

  const emphasized = new Set();

  // Emphasized phrases (all caps or with emphasis markers)
  const allCapsPattern = /\b([A-Z]{2,})\b/g;
  let match;
  while ((match = allCapsPattern.exec(text)) !== null) {
    emphasized.add(match[1].toLowerCase());
  }

  // Punctuation-emphasized words (exclamation proximity)
  const words = text.split(/\s+/);
  words.forEach((word, idx) => {
    const cleanWord = word.replace(/[!?.,;:—-]/g, '').toLowerCase();
    if (word.includes('!') || (idx > 0 && words[idx - 1]?.includes('!'))) {
      if (cleanWord) emphasized.add(cleanWord);
    }
  });

  // Superlatives and power words
  const powerWords = [
    'revolutionary', 'incredible', 'amazing', 'stunning', 'powerful', 'transformative',
    'never', 'always', 'absolutely', 'completely', 'entirely', 'literally',
    'extraordinary', 'remarkable', 'magnificent', 'brilliant', 'outstanding'
  ];
  const lowerText = text.toLowerCase();
  powerWords.forEach(word => {
    if (lowerText.includes(word)) {
      emphasized.add(word);
    }
  });

  return emphasized;
}

/**
 * Adjust text for short-form content (TikTok, YouTube Shorts)
 * - Keep sentences concise
 * - Add hooks
 * - Vary sentence length
 * - Remove filler words
 */
export function optimizeForShortForm(text, duration = 15) {
  let processed = text.trim();

  // Remove common filler words and phrases
  const fillers = [
    /\b(like|um|uh|you know|basically|actually|just|very)\b/gi,
    /\b(to be honest|in my opinion|i think)\b/gi,
  ];

  fillers.forEach(pattern => {
    processed = processed.replace(pattern, (match) => {
      // Keep some filler for natural feel, remove excess
      return Math.random() > 0.6 ? match : '';
    });
  });

  // Clean up extra spaces
  processed = processed.replace(/\s+/g, ' ').trim();

  // Estimate word count and suggest cuts if too long
  const wordCount = processed.split(/\s+/).length;
  const estimatedDuration = (wordCount / 150) * 60; // ~150 WPM average

  if (estimatedDuration > duration) {
    console.log(`[Natural Speech] ⚠️ Content ${estimatedDuration.toFixed(1)}s for ${duration}s target. Consider trimming.`);
  }

  return processed;
}

/**
 * Add SSML-like markup for emotion and emphasis
 * Simulates SSML features using text manipulation
 */
export function applyEmotionalMarkup(text, tone = 'neutral') {
  const emotionalPatterns = {
    curious: {
      markers: ['what', 'why', 'how', 'where', 'when'],
      suffix: '?',
      effect: 'slight_pitch_up'
    },
    excited: {
      markers: ['amazing', 'incredible', 'wonderful', 'brilliant'],
      effect: 'pitch_up_emphasis'
    },
    dramatic: {
      markers: ['suddenly', 'then', 'finally', 'suddenly'],
      effect: 'pause_before_after'
    },
    calm: {
      markers: ['breathe', 'slowly', 'gently', 'peace'],
      effect: 'slow_rate'
    },
  };

  let markup = text;

  // Add pauses before dramatic moments
  if (tone === 'dramatic' || tone === 'dark') {
    markup = markup.replace(/\b(suddenly|then|finally|and when)\b/gi, (match) => {
      return `[PAUSE:200ms] ${match}`;
    });
  }

  return markup;
}

/**
 * Estimate speaking duration in seconds
 * More accurate than simple word count
 */
export function estimateSpeakingDuration(text, rate = 0.95, includeNaturalPauses = true) {
  const words = text.split(/\s+/).length;
  const baseWPM = 150; // ~150 words per minute at rate 1.0
  const adjustedWPM = baseWPM * (rate / 0.95); // Adjust for actual rate

  let duration = (words / adjustedWPM) * 60; // Convert to seconds

  // Add natural pause time (~0.5s per pause marker)
  if (includeNaturalPauses) {
    const pauseCount = (text.match(/[.!?]/g) || []).length;
    duration += pauseCount * 0.4;
  }

  return Math.max(1, duration);
}

/**
 * Generate speech configuration for optimal delivery
 * Returns rate and pitch adjustments based on content analysis
 */
export function generateSpeechConfig(text, voiceTone = 'neutral', contentType = 'general', isShortForm = false) {
  const config = {
    rate: calculateDynamicRate(0.95, contentType, false),
    pitch: calculateDynamicPitch(1.0, voiceTone, false),
    emphasis: identifyEmphasizedWords(text),
    phrases: phraseText(text),
    duration: 0,
    isShortForm,
  };

  // Optimize for short-form if needed
  if (isShortForm) {
    const optimized = optimizeForShortForm(text, 15);
    config.phrases = phraseText(optimized);
    config.rate = calculateDynamicRate(config.rate, 'tiktok', false);
  }

  // Calculate duration
  config.duration = estimateSpeakingDuration(
    config.phrases.join(' '),
    config.rate,
    true
  );

  console.log(`[Natural Speech] 📊 Config: rate=${config.rate.toFixed(2)}, pitch=${config.pitch.toFixed(2)}, duration=${config.duration.toFixed(1)}s`);

  return config;
}

/**
 * Apply natural variation to prevent monotone delivery
 * Slightly varies rate and pitch across phrases for human-like delivery
 */
export function applyNaturalVariation(phraseIndex, totalPhrases, baseRate, basePitch) {
  // Slight variation to prevent perfect repetition (more natural)
  const variation = Math.sin(phraseIndex * 0.5) * 0.02;

  return {
    rate: Math.max(0.5, Math.min(2.0, baseRate + (variation * 0.5))),
    pitch: Math.max(0.5, Math.min(2.0, basePitch + (variation * 0.08))),
  };
}

/**
 * Calculate pause duration based on context
 * Different pause types for different sentence structures
 */
export function calculatePauseDuration(context = 'sentence_end') {
  const pauseDurations = {
    sentence_end: 0.6,    // Natural pause at end of sentence
    comma: 0.3,           // Brief pause at comma
    breath: 0.4,          // Breathing point
    emphasis: 0.2,        // Tiny pause for emphasis
    dramatic: 1.0,        // Longer pause for drama
    none: 0,
  };

  return pauseDurations[context] || 0;
}