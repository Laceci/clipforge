/**
 * Cinematic Storytelling Engine
 * Analyzes script scenes and generates cinematic video clip specifications
 * Not image-based, but true moving video generation
 */

const MOOD_PROFILES = {
  tension: {
    energy: 'high',
    pace: 'slow',
    camera: 'close-up',
    lighting: 'dramatic-shadows',
    duration: '4-6s',
    motionStyle: 'deliberate-slow',
    colorGrade: 'desaturated-cool',
    examples: ['tense-conversation', 'dramatic-pause', 'building-suspense'],
  },
  success: {
    energy: 'confident',
    pace: 'steady',
    camera: 'medium-wide',
    lighting: 'bright-natural',
    duration: '3-5s',
    motionStyle: 'assertive-walking',
    colorGrade: 'warm-golden',
    examples: ['confident-walk', 'celebration-moment', 'achievement-reveal'],
  },
  introspection: {
    energy: 'calm',
    pace: 'slow',
    camera: 'close-up-profile',
    lighting: 'soft-intimate',
    duration: '4-6s',
    motionStyle: 'contemplative-stillness',
    colorGrade: 'neutral-warm',
    examples: ['thoughtful-gaze', 'reflection-moment', 'quiet-realization'],
  },
  betrayal: {
    energy: 'shocked',
    pace: 'quick',
    camera: 'over-shoulder',
    lighting: 'cold-harsh',
    duration: '2-4s',
    motionStyle: 'sharp-turns',
    colorGrade: 'desaturated-cold',
    examples: ['sudden-realization', 'emotional-reaction', 'conflict-moment'],
  },
  darkPsychology: {
    energy: 'mysterious',
    pace: 'deliberate',
    camera: 'close-up-shadows',
    lighting: 'rim-lighting',
    duration: '5-7s',
    motionStyle: 'subtle-ominous',
    colorGrade: 'dark-moody',
    examples: ['power-dynamic', 'manipulation-reveal', 'psychological-moment'],
  },
  motivation: {
    energy: 'inspiring',
    pace: 'steady-building',
    camera: 'wide-to-medium',
    lighting: 'cinematic-natural',
    duration: '4-6s',
    motionStyle: 'purposeful-movement',
    colorGrade: 'warm-vibrant',
    examples: ['inspirational-moment', 'breakthrough-scene', 'empowerment-reveal'],
  },
  storytelling: {
    energy: 'narrative',
    pace: 'natural',
    camera: 'varied-cinematic',
    lighting: 'realistic-natural',
    duration: '3-5s',
    motionStyle: 'natural-human',
    colorGrade: 'realistic',
    examples: ['scene-setting', 'dialogue-scene', 'narrative-beat'],
  },
};

const SETTING_PROFILES = {
  office: {
    clipType: 'professional-environment',
    lighting: 'fluorescent-natural-mix',
    motion: 'deliberate-professional',
    camera: ['medium-shot', 'over-shoulder', 'desk-setup'],
    visualElements: ['desk', 'computer', 'papers', 'professional-attire'],
  },
  city_night: {
    clipType: 'urban-cinematic',
    lighting: 'neon-streetlight',
    motion: 'walking-urban',
    camera: ['wide-street-shot', 'close-face-in-shadows', 'walking-tracking'],
    visualElements: ['buildings', 'lights', 'streets', 'people-silhouettes'],
  },
  nature: {
    clipType: 'outdoor-cinematic',
    lighting: 'natural-golden-hour',
    motion: 'slow-environmental',
    camera: ['wide-landscape', 'slow-pan', 'nature-close-up'],
    visualElements: ['trees', 'sky', 'water', 'natural-light'],
  },
  abstract: {
    clipType: 'cinematic-overlay',
    lighting: 'high-contrast',
    motion: 'dynamic-flowing',
    camera: ['creative-framing', 'macro-perspectives', 'layered-compositions'],
    visualElements: ['particles', 'light-effects', 'geometric-shapes'],
  },
  intimate: {
    clipType: 'close-personal',
    lighting: 'soft-intimate',
    motion: 'subtle-emotional',
    camera: ['close-up-face', 'profile-shot', 'eye-contact'],
    visualElements: ['facial-expressions', 'hands', 'subtle-backgrounds'],
  },
};

export const CINEMATIC_MODES = {
  cinematic_realism: {
    label: 'Cinematic Realism',
    clipStyle: 'professional-cinema',
    colorGrade: 'warm-natural',
    motionQuality: 'smooth-cinematic',
    fpsTarget: 24,
    cameraLanguage: 'professional-filmmaking',
    lightingStyle: 'three-point-cinema',
    edgeTreatment: 'soft-natural',
  },
  dark_psychology: {
    label: 'Dark Psychology Film',
    clipStyle: 'noir-psychological',
    colorGrade: 'desaturated-cold',
    motionQuality: 'slow-deliberate',
    fpsTarget: 24,
    cameraLanguage: 'psychological-thriller',
    lightingStyle: 'dramatic-shadows',
    edgeTreatment: 'vignette-dramatic',
  },
  documentary: {
    label: 'Documentary Storytelling',
    clipStyle: 'documentary-realism',
    colorGrade: 'natural-warm',
    motionQuality: 'handheld-authentic',
    fpsTarget: 30,
    cameraLanguage: 'documentary-observational',
    lightingStyle: 'natural-environmental',
    edgeTreatment: 'none-authentic',
  },
  luxury_motivation: {
    label: 'Luxury Motivation',
    clipStyle: 'premium-cinematic',
    colorGrade: 'warm-golden-luxe',
    motionQuality: 'smooth-premium',
    fpsTarget: 60,
    cameraLanguage: 'high-end-commercial',
    lightingStyle: 'premium-lighting',
    edgeTreatment: 'subtle-elegant',
  },
  emotional_drama: {
    label: 'Emotional Drama',
    clipStyle: 'dramatic-cinematic',
    colorGrade: 'warm-moody',
    motionQuality: 'fluid-emotional',
    fpsTarget: 24,
    cameraLanguage: 'emotional-storytelling',
    lightingStyle: 'dramatic-intimate',
    edgeTreatment: 'soft-emotional',
  },
  business_authority: {
    label: 'Business Authority',
    clipStyle: 'corporate-cinematic',
    colorGrade: 'cool-professional',
    motionQuality: 'smooth-authoritative',
    fpsTarget: 30,
    cameraLanguage: 'professional-authority',
    lightingStyle: 'clean-modern',
    edgeTreatment: 'crisp-professional',
  },
};

/**
 * Analyze script text and detect mood
 */
export function detectSceneMood(text) {
  const lowerText = text.toLowerCase();

  // Mood detection keywords
  const moods = {
    tension: ['tension', 'suspense', 'pressure', 'crisis', 'conflict', 'danger', 'urgent', 'critical'],
    success: ['success', 'achievement', 'victory', 'triumph', 'breakthrough', 'win', 'accomplish'],
    introspection: ['think', 'realize', 'understand', 'reflect', 'wonder', 'question', 'contemplate'],
    betrayal: ['betrayal', 'deceived', 'wrong', 'shocked', 'unexpected', 'twist', 'reveal'],
    darkPsychology: ['psychology', 'manipulation', 'power', 'control', 'psychological', 'dark', 'shadow'],
    motivation: ['motivation', 'inspire', 'powerful', 'can', 'you', 'will', 'achieve', 'transform'],
    storytelling: ['story', 'once', 'there', 'was', 'began', 'happened', 'said', 'did'],
  };

  for (const [mood, keywords] of Object.entries(moods)) {
    const matches = keywords.filter(kw => lowerText.includes(kw)).length;
    if (matches > 0) return mood;
  }

  return 'storytelling'; // Default to neutral storytelling
}

/**
 * Analyze script for setting/location
 */
export function detectSetting(text) {
  const lowerText = text.toLowerCase();

  const settings = {
    office: ['office', 'desk', 'work', 'company', 'corporate', 'meeting', 'colleague'],
    city_night: ['night', 'city', 'street', 'dark', 'lights', 'urban', 'downtown'],
    nature: ['nature', 'outside', 'forest', 'water', 'sky', 'outdoor', 'landscape', 'mountains'],
    abstract: ['world', 'universe', 'mind', 'dream', 'consciousness', 'digital', 'abstract'],
    intimate: ['face', 'eyes', 'close', 'personal', 'intimate', 'home', 'alone'],
  };

  for (const [setting, keywords] of Object.entries(settings)) {
    const matches = keywords.filter(kw => lowerText.includes(kw)).length;
    if (matches > 0) return setting;
  }

  return 'abstract'; // Default to cinematic abstract
}

/**
 * Detect action/movement type
 */
export function detectAction(text) {
  const lowerText = text.toLowerCase();

  const actions = {
    walking: ['walk', 'move', 'go', 'travel', 'journey', 'path', 'forward'],
    stillness: ['stop', 'pause', 'wait', 'stand', 'still', 'quiet', 'calm'],
    gesture: ['hand', 'gesture', 'move', 'reach', 'touch', 'point', 'express'],
    reaction: ['shocked', 'surprised', 'angry', 'sad', 'happy', 'react', 'response'],
    interaction: ['talk', 'speak', 'listen', 'conversation', 'dialogue', 'discuss'],
  };

  for (const [action, keywords] of Object.entries(actions)) {
    const matches = keywords.filter(kw => lowerText.includes(kw)).length;
    if (matches > 0) return action;
  }

  return 'interaction'; // Default interaction
}

/**
 * Detect emotional energy level
 */
export function detectEnergyLevel(text) {
  const lowerText = text.toLowerCase();
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const wordCount = text.split(/\s+/).length;

  if (exclamations > wordCount * 0.05) return 'high';
  if (questions > wordCount * 0.1) return 'medium';
  return 'calm';
}

/**
 * Generate complete scene specification for video clip
 */
export function generateSceneSpec(sceneText, categoryMode = 'cinematic_realism', duration = 5) {
  const mood = detectSceneMood(sceneText);
  const setting = detectSetting(sceneText);
  const action = detectAction(sceneText);
  const energy = detectEnergyLevel(sceneText);

  const moodProfile = MOOD_PROFILES[mood];
  const settingProfile = SETTING_PROFILES[setting];
  const cinematicMode = CINEMATIC_MODES[categoryMode];

  return {
    // Input analysis
    mood,
    setting,
    action,
    energy,

    // Video clip specification (NOT an image)
    clipType: 'cinematic-video',
    duration: Math.min(duration, parseInt(moodProfile.duration.split('-')[1]) || 5),

    // Visual specifications
    moodProfile,
    settingProfile,
    cinematicMode,

    // Camera language
    cameraType: moodProfile.camera,
    cameraMovement: getCameraMovement(mood, action),
    framingStyle: getFramingStyle(mood, energy),

    // Lighting and color
    lighting: moodProfile.lighting,
    colorGrade: cinematicMode.colorGrade,
    motionQuality: cinematicMode.motionQuality,
    fps: cinematicMode.fpsTarget,

    // Motion characteristics
    motionStyle: moodProfile.motionStyle,
    paceProfile: moodProfile.pace,

    // Human elements
    humanPresence: shouldIncludeHuman(setting),
    humanRealism: 'photorealistic', // Always realistic, never cartoon

    // Editing & transitions
    transitionStyle: getTransitionStyle(mood),
    edgeTreatment: cinematicMode.edgeTreatment,

    // Prompt for generation
    generatedPrompt: null, // Will be populated by prompt builder
  };
}

/**
 * Get camera movement for mood and action
 */
function getCameraMovement(mood, action) {
  const movements = {
    tension_walking: 'slow-tracking-close',
    tension_stillness: 'subtle-push-in',
    success_walking: 'confident-wide-tracking',
    introspection_stillness: 'slow-push-in-profile',
    darkPsychology_gesture: 'circling-shot',
    motivation_walking: 'steady-following-shot',
  };

  return movements[`${mood}_${action}`] || 'natural-cinematic-movement';
}

/**
 * Get framing style based on mood and energy
 */
function getFramingStyle(mood, energy) {
  if (mood === 'darkPsychology') return 'close-up-dramatic';
  if (mood === 'introspection') return 'profile-intimate';
  if (mood === 'success') return 'medium-confident';
  if (energy === 'high') return 'tight-focused';
  return 'balanced-cinematic';
}

/**
 * Determine if scene should include humans
 */
function shouldIncludeHuman(setting) {
  const noHumanSettings = ['abstract', 'nature'];
  return !noHumanSettings.includes(setting);
}

/**
 * Get transition style for mood
 */
function getTransitionStyle(mood) {
  const transitions = {
    tension: 'sharp-cut',
    success: 'smooth-dissolve',
    introspection: 'fade-through-black',
    betrayal: 'jump-cut-disorienting',
    darkPsychology: 'fade-to-black-subtle',
    motivation: 'smooth-wipe',
    storytelling: 'natural-cut',
  };

  return transitions[mood] || 'natural-cut';
}

/**
 * Get visual mode by category
 */
export function getVisualModeForCategory(category) {
  const modes = {
    motivation: 'luxury_motivation',
    dark_psychology: 'dark_psychology',
    storytelling: 'cinematic_realism',
    horror: 'dark_psychology',
    finance: 'business_authority',
    fitness: 'luxury_motivation',
    self_improvement: 'emotional_drama',
    business: 'business_authority',
  };

  return modes[category] || 'cinematic_realism';
}

/**
 * Validate scene spec
 */
export function validateSceneSpec(spec) {
  const errors = [];

  if (!spec.mood) errors.push('Mood detection failed');
  if (!spec.clipType || spec.clipType !== 'cinematic-video') errors.push('Must be video clip, not image');
  if (spec.duration < 2 || spec.duration > 10) errors.push('Duration must be 2-10 seconds');
  if (spec.humanRealism !== 'photorealistic') errors.push('Must use photorealistic humans');

  return {
    valid: errors.length === 0,
    errors,
  };
}