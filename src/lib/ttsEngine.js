/**
 * ClipForge TTS Engine — Browser Web Speech API
 * Implements real voice differentiation using pitch, rate, and voice matching.
 * Each "voice character" maps to distinct browser voice characteristics.
 */

import { generateSpeechConfig, applyNaturalVariation } from './naturalSpeech.js';

// Voice personality profiles — these map to actual TTS parameters
// Each produces a meaningfully different sound on supported browsers
export const VOICE_PROFILES = {
  // Male - Deep/Dark
  dominic: { rate: 0.82, pitch: 0.55, genderHint: 'male', nameHints: ['David', 'Daniel', 'Alex', 'Fred', 'James'] },
  raven_dark: { rate: 0.80, pitch: 0.50, genderHint: 'male', nameHints: ['David', 'Daniel', 'Fred'] },
  shadow_intense: { rate: 0.83, pitch: 0.55, genderHint: 'male', nameHints: ['Daniel', 'David', 'Fred'] },
  zen_deep: { rate: 0.72, pitch: 0.60, genderHint: 'male', nameHints: ['David', 'Daniel'] },
  reed_peaceful: { rate: 0.75, pitch: 0.65, genderHint: 'male', nameHints: ['David', 'Fred'] },
  sterling_pro: { rate: 0.92, pitch: 0.75, genderHint: 'male', nameHints: ['Daniel', 'David', 'Alex'] },

  // Male - Warm/Storytelling
  morgan_deep: { rate: 0.88, pitch: 0.70, genderHint: 'male', nameHints: ['Daniel', 'David', 'Alex'] },
  alex_warm: { rate: 0.94, pitch: 0.80, genderHint: 'male', nameHints: ['Alex', 'Daniel', 'David'] },
  ethan: { rate: 0.90, pitch: 0.75, genderHint: 'male', nameHints: ['Daniel', 'Alex', 'Fred'] },
  eli_tender: { rate: 0.88, pitch: 0.85, genderHint: 'male', nameHints: ['Alex', 'Daniel'] },
  marcus_clear: { rate: 0.97, pitch: 0.85, genderHint: 'male', nameHints: ['Daniel', 'Alex', 'David'] },
  marcus: { rate: 0.97, pitch: 0.85, genderHint: 'male', nameHints: ['Daniel', 'Alex'] },
  theo_smart: { rate: 1.00, pitch: 0.88, genderHint: 'male', nameHints: ['Alex', 'Daniel'] },
  theo: { rate: 1.00, pitch: 0.88, genderHint: 'male', nameHints: ['Alex', 'Daniel'] },

  // Male - Energetic/Motivational
  titan_power: { rate: 1.08, pitch: 0.82, genderHint: 'male', nameHints: ['Daniel', 'Alex', 'David'] },
  blaze_bold: { rate: 1.12, pitch: 0.85, genderHint: 'male', nameHints: ['Alex', 'Daniel'] },
  hugo: { rate: 1.08, pitch: 0.80, genderHint: 'male', nameHints: ['Daniel', 'David'] },
  jake_casual: { rate: 1.05, pitch: 0.92, genderHint: 'male', nameHints: ['Alex', 'Daniel', 'Fred'] },
  jake: { rate: 1.05, pitch: 0.92, genderHint: 'male', nameHints: ['Alex', 'Fred'] },
  kai_trendy: { rate: 1.10, pitch: 0.95, genderHint: 'male', nameHints: ['Alex', 'Daniel'] },

  // Female - Soft/Emotional
  claire_soothing: { rate: 0.90, pitch: 1.20, genderHint: 'female', nameHints: ['Samantha', 'Victoria', 'Karen', 'Moira', 'Tessa'] },
  claire: { rate: 0.90, pitch: 1.20, genderHint: 'female', nameHints: ['Samantha', 'Victoria', 'Karen'] },
  luna_warm: { rate: 0.88, pitch: 1.25, genderHint: 'female', nameHints: ['Samantha', 'Victoria', 'Moira'] },
  sage_gentle: { rate: 0.84, pitch: 1.30, genderHint: 'female', nameHints: ['Victoria', 'Samantha', 'Karen'] },
  aurora_soft: { rate: 0.76, pitch: 1.35, genderHint: 'female', nameHints: ['Samantha', 'Victoria', 'Moira'] },
  aurora: { rate: 0.76, pitch: 1.35, genderHint: 'female', nameHints: ['Samantha', 'Victoria'] },
  void_eerie: { rate: 0.80, pitch: 1.10, genderHint: 'female', nameHints: ['Karen', 'Victoria'] },

  // Female - Confident/Clear
  nova_clear: { rate: 0.98, pitch: 1.10, genderHint: 'female', nameHints: ['Samantha', 'Karen', 'Victoria'] },
  nova: { rate: 0.98, pitch: 1.10, genderHint: 'female', nameHints: ['Samantha', 'Karen'] },
  ivy_crisp: { rate: 1.00, pitch: 1.15, genderHint: 'female', nameHints: ['Karen', 'Samantha', 'Victoria'] },
  ivy: { rate: 1.00, pitch: 1.15, genderHint: 'female', nameHints: ['Karen', 'Samantha'] },
  diana_executive: { rate: 0.94, pitch: 1.05, genderHint: 'female', nameHints: ['Victoria', 'Karen', 'Samantha'] },
  diana: { rate: 0.94, pitch: 1.05, genderHint: 'female', nameHints: ['Victoria', 'Karen'] },

  // Female - Energetic
  sophia_inspire: { rate: 1.03, pitch: 1.18, genderHint: 'female', nameHints: ['Samantha', 'Karen', 'Victoria'] },
  sophia: { rate: 1.03, pitch: 1.18, genderHint: 'female', nameHints: ['Samantha', 'Karen'] },
  zara_fierce: { rate: 1.08, pitch: 1.08, genderHint: 'female', nameHints: ['Karen', 'Samantha'] },
  zara: { rate: 1.08, pitch: 1.08, genderHint: 'female', nameHints: ['Karen', 'Samantha'] },
  mia_friendly: { rate: 1.06, pitch: 1.22, genderHint: 'female', nameHints: ['Samantha', 'Victoria'] },
  mia: { rate: 1.06, pitch: 1.22, genderHint: 'female', nameHints: ['Samantha', 'Victoria'] },
};

// Default profile used when voice_id not found
const DEFAULT_PROFILE = { rate: 0.95, pitch: 1.00, genderHint: 'male', nameHints: ['Daniel', 'Alex', 'David', 'Samantha'] };

export function isTTSSupported() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Get the best matching browser voice for a given profile.
 * Tries to match by gender and preferred name hints.
 */
function selectBrowserVoice(profile, voiceId = null) {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const enVoices = voices.filter(v => v.lang.startsWith('en'));
  if (!enVoices.length) return voices[0];

  // Log the voice selection attempt
  console.log(`[TTS] Selecting browser voice for "${voiceId}" | Gender hint: ${profile.genderHint}`);

  // 1. Try to find a premium/natural voice matching name hints
  for (const hint of (profile.nameHints || [])) {
    const match = enVoices.find(v =>
      v.name.toLowerCase().includes(hint.toLowerCase()) &&
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Enhanced') || v.name.includes('Premium') || v.localService)
    );
    if (match) {
      console.log(`[TTS] ✓ Matched premium voice: ${match.name}`);
      return match;
    }
  }

  // 2. Try any voice matching name hints
  for (const hint of (profile.nameHints || [])) {
    const match = enVoices.find(v => v.name.toLowerCase().includes(hint.toLowerCase()));
    if (match) {
      console.log(`[TTS] ✓ Matched voice by name: ${match.name}`);
      return match;
    }
  }

  // 3. Fallback: match by gender (female voices tend to have higher default pitch)
  if (profile.genderHint === 'female') {
    const femaleVoice = enVoices.find(v =>
      v.name.includes('Female') || v.name.includes('female') ||
      ['Samantha', 'Victoria', 'Karen', 'Moira', 'Tessa', 'Veena', 'Fiona'].some(n => v.name.includes(n))
    );
    if (femaleVoice) {
      console.log(`[TTS] ✓ Matched female voice: ${femaleVoice.name}`);
      return femaleVoice;
    }
  } else if (profile.genderHint === 'male') {
    const maleVoice = enVoices.find(v =>
      v.name.includes('Male') || v.name.includes('male') ||
      ['Daniel', 'David', 'Alex', 'Fred', 'James'].some(n => v.name.includes(n))
    );
    if (maleVoice) {
      console.log(`[TTS] ✓ Matched male voice: ${maleVoice.name}`);
      return maleVoice;
    }
  }

  // 4. Best available English voice
  const fallback = enVoices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Enhanced')) || enVoices[0];
  console.log(`[TTS] ⚠️ Using fallback voice: ${fallback?.name}`);
  return fallback;
}

/**
 * Add natural pauses by splitting text at punctuation.
 * Creates more human-like delivery with strategic breathing points.
 */
function addNaturalPhrasing(text) {
  return text
    .replace(/\.\.\./g, '... ')           // Ellipsis as natural trailing
    .replace(/—/g, ', ')                  // Em-dash as brief pause
    .replace(/([.!?])\s+/g, '$1  ')       // Extra space after sentence endings
    .replace(/,\s+/g, ', ')               // Slight pause after commas
    .trim();
}

/**
 * Speak a single scene's text with the selected voice profile.
 * Enhanced with natural speech patterns for human-like delivery.
 * Returns a Promise that resolves when done.
 */
export function speakScene(text, {
  voice_id = null,
  voice_speed = 1.0,
  voice_pitch = 1.0,
  voice_emphasis = 'medium',
  voice_tone = 'neutral',
  muted = false,
  contentType = 'general',
  isShortForm = false
} = {}) {
  return new Promise((resolve) => {
    if (!isTTSSupported() || muted || !text?.trim()) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    // Generate optimal speech configuration
    const config = generateSpeechConfig(text.trim(), voice_tone, contentType, isShortForm);

    // Get the voice profile for the selected voice
    const profile = (voice_id && VOICE_PROFILES[voice_id]) || DEFAULT_PROFILE;

    // Apply user overrides + natural variation for human-like delivery
    let currentPhraseIndex = 0;
    const speakNextPhrase = () => {
      if (currentPhraseIndex >= config.phrases.length) {
        resolve();
        return;
      }

      const phrase = config.phrases[currentPhraseIndex];
      const isLastPhrase = currentPhraseIndex === config.phrases.length - 1;

      // Apply natural variation to this phrase
      const variation = applyNaturalVariation(
        currentPhraseIndex,
        config.phrases.length,
        config.rate,
        config.pitch
      );

      // Check if phrase contains emphasized words
      const words = phrase.split(/\s+/);
      const hasEmphasis = words.some(w => config.emphasis.has(w.toLowerCase().replace(/[^a-z]/g, '')));

      const finalRate = Math.max(0.5, Math.min(2.0, (profile.rate * variation.rate * voice_speed) / 1.0));
      const emphasisPitch = hasEmphasis ? 0.08 : 0;
      const finalPitch = Math.max(0.5, Math.min(2.0, (profile.pitch * variation.pitch * voice_pitch) / 1.0 + emphasisPitch));

      const utter = new SpeechSynthesisUtterance(addNaturalPhrasing(phrase));
      utter.rate = finalRate;
      utter.pitch = finalPitch;
      utter.volume = 1.0;

      // Select the best matching browser voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const selectedVoice = selectBrowserVoice(profile, voice_id);
        if (selectedVoice) {
          utter.voice = selectedVoice;
          if (currentPhraseIndex === 0) {
            console.log(`[ClipForge TTS] 🎙 Voice: "${voice_id || 'default'}" → "${selectedVoice.name}"`);
            console.log(`[ClipForge TTS] 📝 Tone: ${voice_tone} | Type: ${contentType}${isShortForm ? ' (SHORT-FORM)' : ''}`);
            console.log(`[ClipForge TTS] ⏱ Duration: ${config.duration.toFixed(1)}s | Phrases: ${config.phrases.length}`);
          }
        }
      }

      utter.onend = () => {
        currentPhraseIndex++;
        // Small natural pause between phrases
        setTimeout(speakNextPhrase, 150);
      };

      utter.onerror = (e) => {
        console.warn('[ClipForge TTS] Speech error:', e.error);
        resolve();
      };

      window.speechSynthesis.speak(utter);
    };

    speakNextPhrase();
  });
}

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Play a short preview sample for a voice — uses a characteristic sentence
 * that showcases the voice's style with natural speech patterns.
 */
export function previewVoice(voiceId, speed = 1.0, pitch = 1.0, tone = 'neutral') {
  const SAMPLES = {
    // Male dark/deep
    dominic: "In the silence of the night, secrets begin to surface.",
    raven_dark: "There are things in this world that we dare not speak aloud.",
    shadow_intense: "The truth is darker than you could ever imagine.",
    zen_deep: "Breathe deeply... let your thoughts dissolve into stillness.",
    reed_peaceful: "Find peace within yourself... and the world becomes calm.",
    sterling_pro: "Leadership is not a title. It is a decision.",
    sterling: "Leadership is not a title. It is a decision.",

    // Male warm/story
    morgan_deep: "Every great story begins with a single moment of courage.",
    ethan: "Some people leave a mark on this world that time cannot erase.",
    alex_warm: "This is a story about the people who changed everything.",
    eli_tender: "Sometimes the bravest thing you can do is let yourself feel.",
    marcus_clear: "Scientists discovered something that rewrote the history books.",
    marcus: "Scientists discovered something that rewrote the history books.",
    theo_smart: "The psychology behind success is simpler than you think.",
    theo: "The psychology behind success is simpler than you think.",

    // Male energetic
    titan_power: "You have the power to change your life starting RIGHT NOW!",
    blaze_bold: "Stop waiting for permission. Go out there and TAKE IT!",
    hugo: "Every single day is a chance to become the person you were meant to be!",
    jake_casual: "Hey, so I tried this thing and honestly it changed everything.",
    jake: "Hey, so I tried this thing and honestly it changed everything.",
    kai_trendy: "Not gonna lie, this is literally the most underrated thing ever.",

    // Female soft/emotional
    claire_soothing: "There is beauty in the broken pieces of who we used to be.",
    claire: "There is beauty in the broken pieces of who we used to be.",
    luna_warm: "You are worthy of love, of healing, and of peace.",
    sage_gentle: "It is okay to rest. It is okay to start again.",
    aurora_soft: "Close your eyes... and let the stillness guide you home.",
    aurora: "Close your eyes... and let the stillness guide you home.",
    void_eerie: "Something was watching from the shadows... and it knew your name.",

    // Female confident
    nova_clear: "The mystery deepened with every piece of evidence uncovered.",
    nova: "The mystery deepened with every piece of evidence uncovered.",
    ivy_crisp: "Three facts about the human brain that will completely surprise you.",
    ivy: "Three facts about the human brain that will completely surprise you.",
    diana_executive: "The most successful people in the world share one critical habit.",
    diana: "The most successful people in the world share one critical habit.",

    // Female energetic
    sophia_inspire: "Your potential is limitless. Your journey starts today!",
    sophia: "Your potential is limitless. Your journey starts today!",
    zara_fierce: "Stop shrinking yourself to fit spaces that were never meant for you!",
    zara: "Stop shrinking yourself to fit spaces that were never meant for you!",
    mia_friendly: "Okay so this skincare routine completely transformed my skin, no joke.",
    mia: "Okay so this skincare routine completely transformed my skin, no joke.",
  };

  const sampleText = SAMPLES[voiceId] || "Welcome to ClipForge. Your video is ready to create.";
  return speakScene(sampleText, {
    voice_id: voiceId,
    voice_speed: speed,
    voice_pitch: pitch,
    voice_tone: tone,
    voice_emphasis: 'strong',
    contentType: 'general',
    isShortForm: false
  });
}

/**
 * Estimate speaking duration in seconds for a given text + speed.
 * ~140 words/min at rate=1.0
 */
export function estimateSpeakDuration(text, voice_speed = 1.0) {
  const words = (text || '').split(/\s+/).filter(Boolean).length;
  const wpm = 140 * voice_speed;
  return Math.max(2, (words / wpm) * 60);
}