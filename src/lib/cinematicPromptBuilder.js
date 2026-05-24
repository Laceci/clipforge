/**
 * Cinematic Prompt Builder for Video Clip Generation
 * Converts scene specifications into video generation prompts
 * Focuses on MOVING VIDEO CLIPS, not static images
 */

import {
  generateSceneSpec,
  getVisualModeForCategory,
  CINEMATIC_MODES,
} from './cinematicStorytellingEngine.js';

/**
 * Build cinematic video generation prompt
 * Output: Video clip, not image
 */
export function buildCinematicVideoPrompt(sceneText, category = 'storytelling', duration = 5) {
  const sceneSpec = generateSceneSpec(sceneText, getVisualModeForCategory(category), duration);
  const mode = CINEMATIC_MODES[sceneSpec.cinematicMode.name] || CINEMATIC_MODES.cinematic_realism;

  // Build narrative prompt for video generation
  const prompt = `
GENERATE A CINEMATIC VIDEO CLIP (NOT A STILL IMAGE)

Script: "${sceneText}"

CLIP SPECIFICATIONS:
- Type: Professional cinema video clip
- Duration: ${sceneSpec.duration} seconds
- Realism: Photorealistic humans and environments
- Motion: Continuous natural movement (NOT static)

CINEMATIC MODE: ${mode.label}
- Style: ${mode.clipStyle}
- Color Grade: ${mode.colorGrade}
- Motion Quality: ${mode.motionQuality}
- Camera Language: ${mode.cameraLanguage}
- Lighting: ${mode.lightingStyle}
- FPS Target: ${mode.fpsTarget}

EMOTIONAL CONTEXT:
- Mood: ${sceneSpec.mood}
- Energy Level: ${sceneSpec.energy}
- Narrative Purpose: ${getSceneNarrativePurpose(sceneText)}

CAMERA WORK:
- Shot Type: ${sceneSpec.cameraType}
- Camera Movement: ${sceneSpec.cameraMovement}
- Framing: ${sceneSpec.framingStyle}
- Movement Speed: ${getMoveSpeed(sceneSpec.paceProfile)}

VISUAL ENVIRONMENT:
- Setting: ${sceneSpec.setting}
- Lighting Setup: ${sceneSpec.lighting}
- Color Grading: ${sceneSpec.colorGrade}
- Atmosphere: ${getAtmosphere(sceneSpec.mood, sceneSpec.setting)}

ACTION & MOTION:
- Primary Action: ${sceneSpec.action}
- Motion Style: ${sceneSpec.motionStyle}
- Human Elements: ${sceneSpec.humanPresence ? 'Include realistic humans' : 'Abstract environmental shots'}
- Movement Quality: Natural, organic, cinematic

PRODUCTION QUALITY:
- Aspect Ratio: 9:16 (vertical short-form)
- Resolution: 1080p minimum
- Quality: Professional broadcast cinema
- Authenticity: Photorealistic (no cartoons, no illustrated style)

EDITING NOTES:
- Transition Style: ${sceneSpec.transitionStyle}
- Pacing: ${getPacingDescription(sceneSpec.paceProfile)}
- Visual Rhythm: ${getVisualRhythm(sceneSpec.mood)}

CRITICAL: Generate an ACTUAL MOVING VIDEO CLIP with continuous motion.
Do NOT generate a static image. Do NOT generate a slideshow frame.
The output must be a ${sceneSpec.duration}s cinematic video with realistic motion and depth.
  `.trim();

  sceneSpec.generatedPrompt = prompt;
  return sceneSpec;
}

/**
 * Build prompt for emotional video clips (human-focused)
 */
export function buildEmotionalVideoPrompt(emotion, sceneText, duration = 5) {
  const emotionProfiles = {
    fear: 'tight close-up with dramatic shadows, subtle head movement, eyes focused',
    joy: 'medium shot with natural movement, open body language, warm lighting',
    anger: 'close-up with sharp movements, intense eye contact, cold harsh lighting',
    sadness: 'soft focus close-up, slow gentle motion, warm intimate lighting',
    confidence: 'medium-to-wide shot, steady assured movement, bright natural lighting',
    mystery: 'silhouette or rim-lit close-up, slow deliberate movement, dramatic shadows',
  };

  return `
GENERATE EMOTIONAL CINEMATIC VIDEO CLIP

Emotion: ${emotion}
Script Context: "${sceneText}"
Duration: ${duration}s

PERFORMANCE DIRECTION:
${emotionProfiles[emotion] || emotionProfiles.confidence}

REQUIREMENTS:
- Photorealistic human actor or realistic appearance
- Authentic emotional expression
- Natural continuous movement (NOT frozen moments)
- Professional cinema production quality
- Aspect ratio: 9:16 vertical format
- Smooth 24fps cinematic motion

Generate a ${duration} second video clip with genuine emotional authenticity.
  `.trim();
}

/**
 * Build prompt for action/movement video clips
 */
export function buildActionVideoPrompt(actionType, setting, duration = 5) {
  const actionDescriptions = {
    walking: 'person walking with purpose through environment, smooth tracking shot following movement',
    running: 'dynamic running motion, energy and momentum, tracking camera following action',
    gesture: 'hand and arm movements, expressive gestures, close medium framing capturing detail',
    stillness: 'person in contemplative stillness, subtle breathing and micro-movements only',
    turning: 'smooth body turn revealing environment or moment, 180-degree pivot motion',
  };

  const settingContexts = {
    office: 'professional office environment with desk, chairs, windows, modern design',
    city_night: 'nighttime city streets with neon signs, street lights, urban atmosphere',
    nature: 'outdoor natural environment with trees, sky, natural lighting',
    abstract: 'minimalist environment or abstract space allowing focus on human movement',
    intimate: 'close personal space, soft lighting, minimal background',
  };

  return `
GENERATE ACTION/MOVEMENT CINEMATIC VIDEO CLIP

Action Type: ${actionType}
Setting: ${setting}
Duration: ${duration}s

ACTION PERFORMANCE:
${actionDescriptions[actionType] || actionDescriptions.walking}

ENVIRONMENT:
${settingContexts[setting] || settingContexts.abstract}

VIDEO SPECIFICATIONS:
- Photorealistic human movement (no animation, no illustrations)
- Continuous smooth motion for ${duration} seconds
- Professional cinema camera work and framing
- Natural lighting appropriate to setting
- 9:16 aspect ratio (vertical short-form)
- 24fps cinematic frame rate

Generate a professional cinematic video with authentic human movement and natural physics.
  `.trim();
}

/**
 * Determine narrative purpose from text
 */
function getSceneNarrativePurpose(text) {
  const lower = text.toLowerCase();
  if (lower.includes('success') || lower.includes('win')) return 'triumph-moment';
  if (lower.includes('dark') || lower.includes('fear')) return 'dramatic-tension';
  if (lower.includes('explain') || lower.includes('reveal')) return 'informational-beat';
  if (lower.includes('transform') || lower.includes('change')) return 'revelation-moment';
  return 'narrative-beat';
}

/**
 * Get camera movement speed description
 */
function getMoveSpeed(paceProfile) {
  const speeds = {
    'slow': 'slow deliberate movement',
    'steady': 'measured consistent motion',
    'steady-building': 'gradually increasing energy',
    'quick': 'rapid punchy movement',
    'natural': 'organic natural pacing',
  };
  return speeds[paceProfile] || 'cinematic natural motion';
}

/**
 * Get atmosphere description
 */
function getAtmosphere(mood, setting) {
  const atmospheres = {
    'tension_office': 'tense professional workplace atmosphere',
    'tension_city_night': 'dark suspenseful urban night',
    'success_office': 'bright confident workplace moment',
    'darkPsychology_abstract': 'mysterious shadowy psychological space',
    'introspection_intimate': 'soft intimate personal reflection',
    'motivation_nature': 'inspiring expansive outdoor energy',
  };

  return atmospheres[`${mood}_${setting}`] || 'cinematic authentic atmosphere';
}

/**
 * Get pacing description
 */
function getPacingDescription(paceProfile) {
  const pacings = {
    'slow': 'Slow deliberate pacing, emphasizes every moment',
    'steady': 'Even measured pacing, balanced rhythm',
    'steady-building': 'Gradually building intensity and pace',
    'quick': 'Fast rapid-fire pacing, energetic cuts',
    'natural': 'Natural organic pacing matching human interaction',
  };

  return pacings[paceProfile] || 'balanced cinematic pacing';
}

/**
 * Get visual rhythm description
 */
function getVisualRhythm(mood) {
  const rhythms = {
    'tension': 'Suspenseful rhythm with tension beats',
    'success': 'Triumphant uplifting rhythm',
    'introspection': 'Contemplative slow rhythm',
    'betrayal': 'Shocking disruptive rhythm',
    'darkPsychology': 'Ominous creeping rhythm',
    'motivation': 'Inspirational building rhythm',
    'storytelling': 'Natural narrative rhythm',
  };

  return rhythms[mood] || 'balanced cinematic rhythm';
}

/**
 * Generate high-quality video generation request
 */
export function generateVideoClipRequest(sceneSpec) {
  return {
    type: 'video-clip-generation', // NOT image-based
    duration: sceneSpec.duration,
    specification: sceneSpec.generatedPrompt,
    format: 'mp4',
    resolution: '1080p',
    aspectRatio: '9:16',
    fps: sceneSpec.fps,
    qualityTier: 'cinematic-broadcast',
    humanPreference: 'photorealistic',
    motionType: 'continuous-smooth',
    fallbackAllowed: false, // No fallback to static images unless absolutely necessary
  };
}

/**
 * Enhance existing prompt with cinematic directives
 */
export function enhancePromptWithCinematic(basePrompt, moodOverride = null) {
  const enhancement = `

---CINEMATIC VIDEO ENHANCEMENT---
This is a video clip request, not an image.
Generate continuous motion for the full duration.
Use professional cinema language and techniques.
Include authentic human movement and natural physics.
No static frames. No animation. No illustrated style.
Photorealistic output only.
  `;

  return basePrompt + enhancement;
}