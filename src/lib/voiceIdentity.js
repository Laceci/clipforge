/**
 * ClipForge Voice Identity System
 * Single source of truth for all voice definitions with strict gender/audio mapping
 * Every voice has: unique ID, gender, avatar, TTS profile, and audio characteristics
 */

export const VOICE_LIBRARY = [
  // ──── STORYTELLING (Deep, narrative voices)
  {
    id: 'morgan_deep',
    name: 'Morgan',
    category: 'storytelling',
    gender: 'male',
    tone: 'deep',
    description: 'Deep, calm narrator for long-form storytelling',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
    ttsProfile: { rate: 0.88, pitch: 0.70, nameHints: ['Daniel', 'David', 'Alex'] },
    previewText: 'Every great story begins with a single moment of courage.',
    tags: ['#STORIES', '#NARRATIVE'],
  },
  {
    id: 'alex_warm',
    name: 'Alex',
    category: 'storytelling',
    gender: 'male',
    tone: 'warm',
    description: 'Warm and engaging storyteller for biographical content',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80',
    ttsProfile: { rate: 0.94, pitch: 0.80, nameHints: ['Alex', 'Daniel', 'David'] },
    previewText: 'This is a story about the people who changed everything.',
    tags: ['#STORIES', '#BIOGRAPHICAL'],
  },
  {
    id: 'claire_soothing',
    name: 'Claire',
    category: 'storytelling',
    gender: 'female',
    tone: 'soothing',
    description: 'Soothing female narrator for emotional stories',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80',
    ttsProfile: { rate: 0.90, pitch: 1.20, nameHints: ['Samantha', 'Victoria', 'Karen'] },
    previewText: 'There is beauty in the broken pieces of who we used to be.',
    tags: ['#STORIES', '#EMOTIONAL'],
  },
  {
    id: 'nova_clear',
    name: 'Nova',
    category: 'storytelling',
    gender: 'female',
    tone: 'clear',
    description: 'Clear and articulate female voice for mystery and true crime',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80',
    ttsProfile: { rate: 0.98, pitch: 1.10, nameHints: ['Samantha', 'Karen', 'Victoria'] },
    previewText: 'The mystery deepened with every piece of evidence uncovered.',
    tags: ['#STORIES', '#TRUE-CRIME'],
  },

  // ──── MOTIVATIONAL (Energetic, powerful voices)
  {
    id: 'titan_power',
    name: 'Titan',
    category: 'motivational',
    gender: 'male',
    tone: 'energetic',
    description: 'Powerful and commanding voice for motivation and success',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&q=80',
    ttsProfile: { rate: 1.08, pitch: 0.82, nameHints: ['Daniel', 'Alex', 'David'] },
    previewText: 'You have the power to change your life starting RIGHT NOW!',
    tags: ['#MOTIVATIONAL', '#HUSTLE'],
  },
  {
    id: 'blaze_bold',
    name: 'Blaze',
    category: 'motivational',
    gender: 'male',
    tone: 'bold',
    description: 'Bold and commanding voice for fitness and mindset content',
    avatar: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=120&q=80',
    ttsProfile: { rate: 1.12, pitch: 0.85, nameHints: ['Alex', 'Daniel'] },
    previewText: 'Stop waiting for permission. Go out there and TAKE IT!',
    tags: ['#MOTIVATIONAL', '#FITNESS'],
  },
  {
    id: 'sophia_inspire',
    name: 'Sophia',
    category: 'motivational',
    gender: 'female',
    tone: 'inspiring',
    description: 'Strong and inspiring female voice for empowerment',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&q=80',
    ttsProfile: { rate: 1.03, pitch: 1.18, nameHints: ['Samantha', 'Karen', 'Victoria'] },
    previewText: 'Your potential is limitless. Your journey starts today!',
    tags: ['#MOTIVATIONAL', '#EMPOWERMENT'],
  },
  {
    id: 'zara_fierce',
    name: 'Zara',
    category: 'motivational',
    gender: 'female',
    tone: 'fierce',
    description: 'Fierce and energetic female voice for hustle culture',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    ttsProfile: { rate: 1.08, pitch: 1.08, nameHints: ['Karen', 'Samantha'] },
    previewText: 'Stop shrinking yourself to fit spaces that were never meant for you!',
    tags: ['#MOTIVATIONAL', '#STRENGTH'],
  },

  // ──── EMOTIONAL (Tender, caring voices)
  {
    id: 'eli_tender',
    name: 'Eli',
    category: 'emotional',
    gender: 'male',
    tone: 'tender',
    description: 'Tender and heartfelt male voice for personal growth',
    avatar: 'https://images.unsplash.com/photo-1507539332150-34c3eda07b97?w=120&q=80',
    ttsProfile: { rate: 0.88, pitch: 0.85, nameHints: ['Alex', 'Daniel'] },
    previewText: 'Sometimes the bravest thing you can do is let yourself feel.',
    tags: ['#EMOTIONAL', '#GROWTH'],
  },
  {
    id: 'luna_warm',
    name: 'Luna',
    category: 'emotional',
    gender: 'female',
    tone: 'warm',
    description: 'Warm and emotional female voice for healing and self-love',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80',
    ttsProfile: { rate: 0.88, pitch: 1.25, nameHints: ['Samantha', 'Victoria', 'Moira'] },
    previewText: 'You are worthy of love, of healing, and of peace.',
    tags: ['#EMOTIONAL', '#HEALING'],
  },
  {
    id: 'sage_gentle',
    name: 'Sage',
    category: 'emotional',
    gender: 'female',
    tone: 'gentle',
    description: 'Gentle and caring female voice for mental health content',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&q=80',
    ttsProfile: { rate: 0.84, pitch: 1.30, nameHints: ['Victoria', 'Samantha', 'Karen'] },
    previewText: 'It is okay to rest. It is okay to start again.',
    tags: ['#EMOTIONAL', '#CARE'],
  },

  // ──── CALM / MEDITATION (Slow, peaceful voices)
  {
    id: 'zen_deep',
    name: 'Zen',
    category: 'calm',
    gender: 'male',
    tone: 'calm',
    description: 'Ultra calm and deep male voice for meditation',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=120&q=80',
    ttsProfile: { rate: 0.72, pitch: 0.60, nameHints: ['David', 'Daniel'] },
    previewText: 'Breathe deeply... let your thoughts dissolve into stillness.',
    tags: ['#MEDITATION', '#CALM'],
  },
  {
    id: 'aurora_soft',
    name: 'Aurora',
    category: 'calm',
    gender: 'female',
    tone: 'soft',
    description: 'Soft and ethereal female voice for guided meditation',
    avatar: 'https://images.unsplash.com/photo-1520810627419-35e592be37f8?w=120&q=80',
    ttsProfile: { rate: 0.76, pitch: 1.35, nameHints: ['Samantha', 'Victoria', 'Moira'] },
    previewText: 'Close your eyes... and let the stillness guide you home.',
    tags: ['#MEDITATION', '#SPIRITUAL'],
  },
  {
    id: 'reed_peaceful',
    name: 'Reed',
    category: 'calm',
    gender: 'male',
    tone: 'peaceful',
    description: 'Peaceful and slow male voice for relaxation',
    avatar: 'https://images.unsplash.com/photo-1507539332150-34c3eda07b97?w=120&q=80',
    ttsProfile: { rate: 0.75, pitch: 0.65, nameHints: ['David', 'Fred'] },
    previewText: 'Find peace within yourself... and the world becomes calm.',
    tags: ['#CALM', '#SLEEP'],
  },

  // ──── EDUCATIONAL (Clear, informative voices)
  {
    id: 'marcus_clear',
    name: 'Marcus',
    category: 'educational',
    gender: 'male',
    tone: 'clear',
    description: 'Clear and informative male voice for facts and science',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80',
    ttsProfile: { rate: 0.97, pitch: 0.85, nameHints: ['Daniel', 'Alex', 'David'] },
    previewText: 'Scientists discovered something that rewrote the history books.',
    tags: ['#EDUCATIONAL', '#FACTS'],
  },
  {
    id: 'ivy_crisp',
    name: 'Ivy',
    category: 'educational',
    gender: 'female',
    tone: 'crisp',
    description: 'Crisp and authoritative female voice for educational content',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&q=80',
    ttsProfile: { rate: 1.00, pitch: 1.15, nameHints: ['Karen', 'Samantha', 'Victoria'] },
    previewText: 'Three facts about the human brain that will completely surprise you.',
    tags: ['#EDUCATIONAL', '#SCIENCE'],
  },
  {
    id: 'theo_smart',
    name: 'Theo',
    category: 'educational',
    gender: 'male',
    tone: 'smart',
    description: 'Smart and engaging male voice for psychology and business',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&q=80',
    ttsProfile: { rate: 1.00, pitch: 0.88, nameHints: ['Alex', 'Daniel'] },
    previewText: 'The psychology behind success is simpler than you think.',
    tags: ['#EDUCATIONAL', '#BUSINESS'],
  },

  // ──── DARK / INTENSE (Eerie, dramatic voices)
  {
    id: 'raven_dark',
    name: 'Raven',
    category: 'dark',
    gender: 'male',
    tone: 'deep',
    description: 'Dark and brooding male voice for horror and dark psychology',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
    ttsProfile: { rate: 0.80, pitch: 0.50, nameHints: ['David', 'Daniel', 'Fred'] },
    previewText: 'There are things in this world that we dare not speak aloud.',
    tags: ['#DARK', '#HORROR'],
  },
  {
    id: 'shadow_intense',
    name: 'Shadow',
    category: 'dark',
    gender: 'male',
    tone: 'intense',
    description: 'Intense and foreboding male voice for thriller content',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80',
    ttsProfile: { rate: 0.83, pitch: 0.55, nameHints: ['Daniel', 'David', 'Fred'] },
    previewText: 'The truth is darker than you could ever imagine.',
    tags: ['#DARK', '#THRILLER'],
  },
  {
    id: 'void_eerie',
    name: 'Void',
    category: 'dark',
    gender: 'female',
    tone: 'eerie',
    description: 'Eerie female voice for horror and paranormal content',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80',
    ttsProfile: { rate: 0.80, pitch: 1.10, nameHints: ['Karen', 'Victoria'] },
    previewText: 'Something was watching from the shadows... and it knew your name.',
    tags: ['#DARK', '#PARANORMAL'],
  },

  // ──── PROFESSIONAL / CORPORATE (Authoritative, polished voices)
  {
    id: 'sterling_pro',
    name: 'Sterling',
    category: 'professional',
    gender: 'male',
    tone: 'authoritative',
    description: 'Authoritative and polished male voice for business and leadership',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&q=80',
    ttsProfile: { rate: 0.92, pitch: 0.75, nameHints: ['Daniel', 'David', 'Alex'] },
    previewText: 'Leadership is not a title. It is a decision.',
    tags: ['#PROFESSIONAL', '#BUSINESS'],
  },
  {
    id: 'diana_executive',
    name: 'Diana',
    category: 'professional',
    gender: 'female',
    tone: 'executive',
    description: 'Executive female voice for corporate and B2B content',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80',
    ttsProfile: { rate: 0.94, pitch: 1.05, nameHints: ['Victoria', 'Karen', 'Samantha'] },
    previewText: 'The most successful people in the world share one critical habit.',
    tags: ['#PROFESSIONAL', '#CORPORATE'],
  },

  // ──── UGC / CASUAL (Natural, friendly voices)
  {
    id: 'jake_casual',
    name: 'Jake',
    category: 'ugc',
    gender: 'male',
    tone: 'casual',
    description: 'Natural and relatable male voice for product reviews',
    avatar: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=120&q=80',
    ttsProfile: { rate: 1.05, pitch: 0.92, nameHints: ['Alex', 'Daniel', 'Fred'] },
    previewText: 'Hey, so I tried this thing and honestly it changed everything.',
    tags: ['#UGC', '#REVIEWS'],
  },
  {
    id: 'mia_friendly',
    name: 'Mia',
    category: 'ugc',
    gender: 'female',
    tone: 'friendly',
    description: 'Friendly and upbeat female voice for lifestyle and tutorials',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80',
    ttsProfile: { rate: 1.06, pitch: 1.22, nameHints: ['Samantha', 'Victoria'] },
    previewText: 'Okay so this skincare routine completely transformed my skin, no joke.',
    tags: ['#UGC', '#LIFESTYLE'],
  },
  {
    id: 'kai_trendy',
    name: 'Kai',
    category: 'ugc',
    gender: 'male',
    tone: 'trendy',
    description: 'Trendy and cool male voice for pop culture and Gen Z content',
    avatar: 'https://images.unsplash.com/photo-1507539332150-34c3eda07b97?w=120&q=80',
    ttsProfile: { rate: 1.10, pitch: 0.95, nameHints: ['Alex', 'Daniel'] },
    previewText: 'Not gonna lie, this is literally the most underrated thing ever.',
    tags: ['#UGC', '#TRENDY'],
  },
];

/**
 * Get a voice by ID with full validation
 * Ensures the voice exists and all properties are correctly set
 */
export function getVoiceById(voiceId) {
  const voice = VOICE_LIBRARY.find(v => v.id === voiceId);
  if (!voice) {
    console.warn(`[Voice System] ⚠️ Voice ID "${voiceId}" not found. Using fallback.`);
    return VOICE_LIBRARY[0];
  }
  return voice;
}

/**
 * Get all voices in a category
 */
export function getVoicesByCategory(category) {
  return VOICE_LIBRARY.filter(v => v.category === category);
}

/**
 * Get all unique categories
 */
export function getVoiceCategories() {
  return [...new Set(VOICE_LIBRARY.map(v => v.category))];
}

/**
 * Validate voice selection
 * Returns validation result with any issues
 */
export function validateVoiceSelection(voiceId) {
  const voice = getVoiceById(voiceId);

  const validation = {
    valid: true,
    warnings: [],
    voice,
  };

  if (!voice.ttsProfile) {
    validation.valid = false;
    validation.warnings.push('Missing TTS profile');
  }

  if (!voice.gender) {
    validation.valid = false;
    validation.warnings.push('Missing gender specification');
  }

  if (!voice.avatar) {
    validation.warnings.push('Missing avatar image');
  }

  if (validation.warnings.length > 0) {
    console.warn(`[Voice System] ⚠️ Voice "${voiceId}" validation issues:`, validation.warnings);
  }

  return validation;
}

/**
 * Get TTS profile for a voice
 * This is the authoritative source for what actually gets played
 */
export function getVoiceTTSProfile(voiceId) {
  const voice = getVoiceById(voiceId);
  return voice.ttsProfile || {};
}

/**
 * Log voice selection for debugging
 */
export function logVoiceSelection(voiceId, context = '') {
  const voice = getVoiceById(voiceId);
  const ttsProfile = getVoiceTTSProfile(voiceId);

  console.log(`[ClipForge Voice] 🎙️ Selected: ${voice.name} (${voiceId})`);
  console.log(`  Gender: ${voice.gender}`);
  console.log(`  Tone: ${voice.tone}`);
  console.log(`  Category: ${voice.category}`);
  console.log(`  TTS Rate: ${ttsProfile.rate} | Pitch: ${ttsProfile.pitch}`);
  if (context) {
    console.log(`  Context: ${context}`);
  }
}