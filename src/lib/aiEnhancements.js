/**
 * AI Enhancement Helpers
 * - Scene transition suggestions
 * - Dynamic music mood selection
 * - Visual effect / filter assignment per scene
 */
import { base44 } from '@/api/base44Client';

// ── 1. Scene Transition Suggestions ─────────────────────────────────────────
// Analyses each scene's text + position to pick the best transition.
export const TRANSITIONS = {
  cut:       { label: 'Hard Cut',      css: '' },
  fade:      { label: 'Fade',          css: 'animate-pulse' },
  slide:     { label: 'Slide',         css: '' },
  zoom_in:   { label: 'Zoom In',       css: '' },
  glitch:    { label: 'Glitch',        css: '' },
  pan_zoom:  { label: 'Pan & Zoom',    css: '' },
};

export async function suggestTransitions(scenes, category) {
  const sceneList = scenes.map((s, i) => `Scene ${i + 1}: "${s.text}"`).join('\n');

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a video editor AI. Analyze these ${scenes.length} scenes from a "${category}" short video and assign the most fitting scene transition for each.

${sceneList}

Available transitions: cut, fade, slide, zoom_in, glitch, pan_zoom

Rules:
- "cut" for fast-paced, action or high-energy moments
- "fade" for emotional, reflective or slow moments  
- "slide" for narrative progression or list-style content
- "zoom_in" for reveals, climaxes or important facts
- "glitch" for shocking, dark or unexpected moments
- "pan_zoom" (Ken Burns) for cinematic, storytelling or landscape scenes

Return a JSON array of exactly ${scenes.length} transition strings, one per scene, in order.
Example: ["zoom_in", "fade", "cut", "glitch"]`,
    response_json_schema: {
      type: 'object',
      properties: {
        transitions: { type: 'array', items: { type: 'string' } },
      },
    },
  });

  const transitions = result?.transitions || [];
  return scenes.map((scene, i) => ({
    ...scene,
    animation: transitions[i] || scene.animation || 'pan_zoom',
    transition_ai: true,
  }));
}

// ── 2. Dynamic Music Mood Selection ─────────────────────────────────────────
export const MUSIC_TRACKS = {
  epic_cinematic:       { label: 'Epic Cinematic',       moods: ['epic','powerful','dramatic','intense'] },
  dark_ambient:         { label: 'Dark Ambient',         moods: ['dark','mysterious','eerie','horror'] },
  motivational_piano:   { label: 'Motivational Piano',   moods: ['uplifting','emotional','reflective','sad'] },
  lofi_chill:           { label: 'Lo-Fi Chill',          moods: ['calm','relaxed','chill','peaceful'] },
  dramatic_orchestral:  { label: 'Dramatic Orchestral',  moods: ['climactic','tense','suspenseful','grand'] },
  upbeat_corporate:     { label: 'Upbeat Corporate',     moods: ['energetic','positive','inspiring','fun'] },
};

export async function selectMusicByMood(script, topic, category, currentTrack) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a music director for short-form videos. Analyze the mood and energy of this video content and select the best background music.

Topic: "${topic || ''}"
Category: "${category || 'custom'}"
Script excerpt: "${(script || '').slice(0, 600)}"

Available tracks:
- epic_cinematic: Powerful, intense, dramatic action
- dark_ambient: Dark, mysterious, eerie, horror vibes
- motivational_piano: Uplifting, emotional, heartfelt, reflective
- lofi_chill: Calm, relaxed, peaceful, chill
- dramatic_orchestral: Climactic, tense, suspenseful, grand
- upbeat_corporate: Energetic, positive, inspiring, business

Return JSON with: { "track": "<track_key>", "mood": "<one word mood>", "energy": "low|medium|high", "reason": "<10 words max>" }`,
    response_json_schema: {
      type: 'object',
      properties: {
        track: { type: 'string' },
        mood: { type: 'string' },
        energy: { type: 'string' },
        reason: { type: 'string' },
      },
    },
  });

  return {
    music_track: result?.track || currentTrack || 'epic_cinematic',
    music_mood: result?.mood || 'epic',
    music_energy: result?.energy || 'medium',
    music_reason: result?.reason || 'Auto-selected',
    music_ai_selected: true,
  };
}

// ── 3. Visual Effects / Filters per Scene ────────────────────────────────────
export const VISUAL_EFFECTS = {
  none:        { label: 'None',           filter: '' },
  cinematic:   { label: 'Cinematic',      filter: 'contrast(1.1) saturate(0.9) brightness(0.95)' },
  vivid:       { label: 'Vivid',          filter: 'saturate(1.4) contrast(1.05)' },
  noir:        { label: 'Noir',           filter: 'grayscale(0.6) contrast(1.2) brightness(0.9)' },
  warm:        { label: 'Warm Glow',      filter: 'sepia(0.25) saturate(1.2) brightness(1.05)' },
  cold:        { label: 'Cold Blue',      filter: 'hue-rotate(200deg) saturate(0.8) brightness(0.95)' },
  dramatic:    { label: 'Dramatic',       filter: 'contrast(1.3) saturate(0.8) brightness(0.85)' },
  dreamy:      { label: 'Dreamy',         filter: 'brightness(1.1) saturate(0.7) blur(0.4px)' },
  vintage:     { label: 'Vintage',        filter: 'sepia(0.4) saturate(0.8) contrast(1.1)' },
};

export async function assignVisualEffects(scenes, visualStyle, category) {
  const sceneList = scenes.map((s, i) => `Scene ${i + 1}: "${s.text}"`).join('\n');

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a cinematographer AI. Assign the best visual filter/effect to each scene based on its emotional tone.

Visual style: "${visualStyle || 'cinematic'}"
Category: "${category || 'custom'}"
Scenes:
${sceneList}

Available effects: none, cinematic, vivid, noir, warm, cold, dramatic, dreamy, vintage

Guidelines:
- "cinematic": standard dramatic scenes, narration
- "vivid": action, excitement, positive energy
- "noir": dark, moody, mysterious, thriller
- "warm": emotional, nostalgic, motivational reveals
- "cold": tense, sad, cold facts, serious moments
- "dramatic": climax, shock, big reveals
- "dreamy": reflective, slow, peaceful, fantasy
- "vintage": historical, nostalgia, throwback
- "none": neutral / let visuals speak

Return JSON: { "effects": ["effect1", "effect2", ...] } — exactly ${scenes.length} values.`,
    response_json_schema: {
      type: 'object',
      properties: {
        effects: { type: 'array', items: { type: 'string' } },
      },
    },
  });

  const effects = result?.effects || [];
  return scenes.map((scene, i) => ({
    ...scene,
    visual_effect: effects[i] || 'cinematic',
    visual_effect_ai: true,
  }));
}