/**
 * ClipForge Advanced Voice System
 * Structured voice categories with personality types, presets, and auto-selection
 */

export const VOICE_CATEGORIES = [
  {
    id: 'storytelling',
    label: 'Storytelling',
    icon: '📖',
    voices: [
      { id: 'morgan_deep', name: 'Morgan', gender: 'male', tone: 'deep', speed: 0.9, pitch: 0.85, emphasis: 'medium', description: 'Deep, calm narrator', useCase: 'Long-form storytelling, documentaries' },
      { id: 'alex_warm', name: 'Alex', gender: 'male', tone: 'warm', speed: 1.0, pitch: 0.95, emphasis: 'medium', description: 'Warm & engaging', useCase: 'Biographical stories, history' },
      { id: 'claire_soothing', name: 'Claire', gender: 'female', tone: 'soothing', speed: 0.95, pitch: 1.05, emphasis: 'soft', description: 'Soothing female narrator', useCase: 'Personal stories, emotional content' },
      { id: 'nova_clear', name: 'Nova', gender: 'female', tone: 'clear', speed: 1.0, pitch: 1.0, emphasis: 'medium', description: 'Clear & articulate', useCase: 'True crime, mystery' },
    ]
  },
  {
    id: 'motivational',
    label: 'Motivational',
    icon: '🔥',
    voices: [
      { id: 'titan_power', name: 'Titan', gender: 'male', tone: 'energetic', speed: 1.1, pitch: 0.9, emphasis: 'strong', description: 'Powerful motivator', useCase: 'Success, discipline, hustle' },
      { id: 'blaze_bold', name: 'Blaze', gender: 'male', tone: 'bold', speed: 1.15, pitch: 0.95, emphasis: 'strong', description: 'Bold & commanding', useCase: 'Fitness, mindset, goals' },
      { id: 'sophia_inspire', name: 'Sophia', gender: 'female', tone: 'inspiring', speed: 1.05, pitch: 1.1, emphasis: 'strong', description: 'Strong female voice', useCase: 'Female empowerment, mindset' },
      { id: 'zara_fierce', name: 'Zara', gender: 'female', tone: 'fierce', speed: 1.1, pitch: 1.0, emphasis: 'strong', description: 'Fierce & energetic', useCase: 'Hustle culture, success' },
    ]
  },
  {
    id: 'emotional',
    label: 'Emotional',
    icon: '💔',
    voices: [
      { id: 'eli_tender', name: 'Eli', gender: 'male', tone: 'tender', speed: 0.95, pitch: 1.0, emphasis: 'soft', description: 'Tender & heartfelt', useCase: 'Life lessons, personal growth' },
      { id: 'luna_warm', name: 'Luna', gender: 'female', tone: 'warm', speed: 0.9, pitch: 1.05, emphasis: 'soft', description: 'Warm & emotional', useCase: 'Healing, self-love, relationships' },
      { id: 'sage_gentle', name: 'Sage', gender: 'female', tone: 'gentle', speed: 0.88, pitch: 1.08, emphasis: 'soft', description: 'Gentle & caring', useCase: 'Mental health, comfort content' },
    ]
  },
  {
    id: 'calm_meditation',
    label: 'Calm / Meditation',
    icon: '🧘',
    voices: [
      { id: 'zen_deep', name: 'Zen', gender: 'male', tone: 'calm', speed: 0.8, pitch: 0.9, emphasis: 'none', description: 'Ultra calm & deep', useCase: 'Meditation, sleep, breathwork' },
      { id: 'aurora_soft', name: 'Aurora', gender: 'female', tone: 'soft', speed: 0.78, pitch: 1.1, emphasis: 'none', description: 'Soft & ethereal', useCase: 'Guided meditation, mindfulness' },
      { id: 'reed_peaceful', name: 'Reed', gender: 'male', tone: 'peaceful', speed: 0.82, pitch: 0.95, emphasis: 'none', description: 'Peaceful & slow', useCase: 'Relaxation, anxiety relief' },
    ]
  },
  {
    id: 'educational',
    label: 'Educational',
    icon: '🎓',
    voices: [
      { id: 'marcus_clear', name: 'Marcus', gender: 'male', tone: 'clear', speed: 1.0, pitch: 1.0, emphasis: 'medium', description: 'Clear & informative', useCase: 'Facts, science, history' },
      { id: 'ivy_crisp', name: 'Ivy', gender: 'female', tone: 'crisp', speed: 1.02, pitch: 1.05, emphasis: 'medium', description: 'Crisp & authoritative', useCase: 'Educational facts, explainers' },
      { id: 'theo_smart', name: 'Theo', gender: 'male', tone: 'smart', speed: 1.05, pitch: 0.98, emphasis: 'medium', description: 'Smart & engaging', useCase: 'Psychology, finance, business' },
    ]
  },
  {
    id: 'dark_intense',
    label: 'Dark / Intense',
    icon: '🌑',
    voices: [
      { id: 'raven_dark', name: 'Raven', gender: 'male', tone: 'deep', speed: 0.85, pitch: 0.78, emphasis: 'dramatic', description: 'Dark & brooding', useCase: 'Horror, dark psychology, creepy' },
      { id: 'shadow_intense', name: 'Shadow', gender: 'male', tone: 'intense', speed: 0.88, pitch: 0.82, emphasis: 'dramatic', description: 'Intense & foreboding', useCase: 'Thriller, unsolved mysteries' },
      { id: 'void_eerie', name: 'Void', gender: 'female', tone: 'eerie', speed: 0.82, pitch: 1.02, emphasis: 'dramatic', description: 'Eerie female tone', useCase: 'Horror stories, paranormal' },
    ]
  },
  {
    id: 'ugc_casual',
    label: 'UGC / Casual',
    icon: '📱',
    voices: [
      { id: 'jake_casual', name: 'Jake', gender: 'male', tone: 'casual', speed: 1.05, pitch: 1.0, emphasis: 'natural', description: 'Natural & relatable', useCase: 'Product reviews, tutorials' },
      { id: 'mia_friendly', name: 'Mia', gender: 'female', tone: 'friendly', speed: 1.08, pitch: 1.1, emphasis: 'natural', description: 'Friendly & upbeat', useCase: 'Lifestyle, trends, tutorials' },
      { id: 'kai_trendy', name: 'Kai', gender: 'male', tone: 'trendy', speed: 1.1, pitch: 1.02, emphasis: 'natural', description: 'Trendy & cool', useCase: 'Pop culture, Gen Z content' },
    ]
  },
  {
    id: 'professional',
    label: 'Professional / Corporate',
    icon: '💼',
    voices: [
      { id: 'sterling_pro', name: 'Sterling', gender: 'male', tone: 'authoritative', speed: 0.98, pitch: 0.95, emphasis: 'medium', description: 'Authoritative & polished', useCase: 'Business, finance, leadership' },
      { id: 'diana_executive', name: 'Diana', gender: 'female', tone: 'executive', speed: 0.96, pitch: 1.0, emphasis: 'medium', description: 'Executive female voice', useCase: 'Corporate, B2B, professional' },
    ]
  },
];

export const VOICE_PRESETS = [
  {
    id: 'deep_story_narrator',
    label: 'Deep Story Narrator',
    icon: '🎙️',
    voiceId: 'morgan_deep',
    speed: 0.9,
    pitch: 0.85,
    emphasis: 'medium',
    pauseBetweenSentences: 0.8,
    emotionalIntensity: 0.5,
    description: 'Perfect for long-form storytelling and documentaries',
  },
  {
    id: 'soft_female_inspiration',
    label: 'Soft Female Inspiration',
    icon: '✨',
    voiceId: 'luna_warm',
    speed: 0.9,
    pitch: 1.05,
    emphasis: 'soft',
    pauseBetweenSentences: 1.0,
    emotionalIntensity: 0.7,
    description: 'Warm, emotional voice for inspirational content',
  },
  {
    id: 'high_energy_motivator',
    label: 'High Energy Motivator',
    icon: '⚡',
    voiceId: 'titan_power',
    speed: 1.15,
    pitch: 0.9,
    emphasis: 'strong',
    pauseBetweenSentences: 0.3,
    emotionalIntensity: 0.95,
    description: 'Explosive energy for motivation and hustle content',
  },
  {
    id: 'calm_documentary',
    label: 'Calm Documentary Voice',
    icon: '🎬',
    voiceId: 'marcus_clear',
    speed: 1.0,
    pitch: 1.0,
    emphasis: 'medium',
    pauseBetweenSentences: 0.6,
    emotionalIntensity: 0.3,
    description: 'Clear, calm tone for educational and documentary style',
  },
  {
    id: 'dark_psychology',
    label: 'Dark Psychology Reader',
    icon: '🌑',
    voiceId: 'raven_dark',
    speed: 0.85,
    pitch: 0.78,
    emphasis: 'dramatic',
    pauseBetweenSentences: 1.2,
    emotionalIntensity: 0.8,
    description: 'Slow, deep, unsettling voice for dark content',
  },
  {
    id: 'casual_ugc',
    label: 'Casual UGC Creator',
    icon: '📱',
    voiceId: 'mia_friendly',
    speed: 1.08,
    pitch: 1.1,
    emphasis: 'natural',
    pauseBetweenSentences: 0.4,
    emotionalIntensity: 0.5,
    description: 'Natural, friendly tone like a real content creator',
  },
];

// Auto-select best voice + settings based on category
export const CATEGORY_VOICE_MAP = {
  motivation:       { presetId: 'high_energy_motivator', music: 'epic_cinematic', visual: 'cinematic', animation: 'pan_zoom', caption: 'tiktok_bold', highlight: '#FF6B35' },
  storytelling:     { presetId: 'deep_story_narrator', music: 'dramatic_orchestral', visual: 'documentary', animation: 'fade', caption: 'sentence', highlight: '#A3E635' },
  facts:            { presetId: 'calm_documentary', music: 'upbeat_corporate', visual: 'cinematic', animation: 'zoom_in', caption: 'highlight', highlight: '#38BDF8' },
  horror:           { presetId: 'dark_psychology', music: 'dark_ambient', visual: 'dark', animation: 'glitch', caption: 'word_by_word', highlight: '#EF4444' },
  finance:          { presetId: 'calm_documentary', music: 'lofi_chill', visual: 'realistic', animation: 'pan_zoom', caption: 'tiktok_bold', highlight: '#34D399' },
  fitness:          { presetId: 'high_energy_motivator', music: 'epic_cinematic', visual: 'motivational', animation: 'pan_zoom', caption: 'tiktok_bold', highlight: '#F59E0B' },
  dark_psychology:  { presetId: 'dark_psychology', music: 'dark_ambient', visual: 'dark', animation: 'fade', caption: 'highlight', highlight: '#8B5CF6' },
  self_improvement: { presetId: 'soft_female_inspiration', music: 'motivational_piano', visual: 'cinematic', animation: 'pan_zoom', caption: 'sentence', highlight: '#A3E635' },
  business:         { presetId: 'calm_documentary', music: 'upbeat_corporate', visual: 'cinematic', animation: 'pan_zoom', caption: 'tiktok_bold', highlight: '#F59E0B' },
  custom:           { presetId: 'deep_story_narrator', music: 'epic_cinematic', visual: 'cinematic', animation: 'pan_zoom', caption: 'tiktok_bold', highlight: '#A3E635' },
};

export function getVoiceById(voiceId) {
  for (const cat of VOICE_CATEGORIES) {
    const voice = cat.voices.find(v => v.id === voiceId);
    if (voice) return { ...voice, category: cat.id };
  }
  return null;
}

export function getPresetById(presetId) {
  return VOICE_PRESETS.find(p => p.id === presetId) || VOICE_PRESETS[0];
}

export function autoSelectSettings(category) {
  const map = CATEGORY_VOICE_MAP[category] || CATEGORY_VOICE_MAP.custom;
  const preset = getPresetById(map.presetId);
  const voice = getVoiceById(preset.voiceId);
  return {
    voice_preset: preset.id,
    voice_id: preset.voiceId,
    voice_style: voice?.tone || 'deep',
    voice_speed: preset.speed,
    voice_pitch: preset.pitch,
    voice_emphasis: preset.emphasis,
    voice_pause: preset.pauseBetweenSentences,
    voice_intensity: preset.emotionalIntensity,
    music_track: map.music,
    visual_style: map.visual,
    animation_style: map.animation,
    caption_style: map.caption,
    highlight_color: map.highlight,
  };
}