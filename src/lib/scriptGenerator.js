/**
 * ClipForge AI Script Generator
 * Takes a topic and generates structured short-form video scripts
 * with scene breakdowns, hooks, and emotional cues.
 */

import { base44 } from '@/api/base44Client';

/**
 * Generate a complete video script from a topic
 */
export async function generateVideoScript(topic, contentType = 'general', duration = 30) {
  if (!topic?.trim()) {
    throw new Error('Topic is required');
  }

  console.log(`[Script Generator] Generating script for: "${topic}"`);
  console.log(`[Script Generator] Type: ${contentType}, Target duration: ${duration}s`);

  const prompt = buildScriptPrompt(topic, contentType, duration);

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          hook: { type: 'string' },
          main_script: { type: 'string' },
          closing: { type: 'string' },
          scenes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                emotional_cue: { type: 'string' },
                visual_prompt: { type: 'string' },
                duration_seconds: { type: 'number' },
              },
            },
          },
          key_moments: {
            type: 'array',
            items: { type: 'string' },
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
          },
          estimated_duration_seconds: { type: 'number' },
        },
      },
    });

    console.log(`[Script Generator] ✅ Generated ${result.scenes?.length || 0} scenes`);
    return result;
  } catch (error) {
    console.error('[Script Generator] ❌ Generation failed:', error);
    throw error;
  }
}

/**
 * Build the LLM prompt for script generation
 */
function buildScriptPrompt(topic, contentType, duration) {
  const contentTypeGuides = {
    motivation: 'Create an inspiring, action-oriented script with powerful language and calls to action.',
    storytelling: 'Create a narrative-driven script with character development and emotional arcs.',
    facts: 'Create an educational script with surprising facts, statistics, and clear explanations.',
    horror: 'Create a dark, unsettling script with suspense, mystery, and atmospheric tension.',
    finance: 'Create a script about money/investing with clear explanations and actionable insights.',
    fitness: 'Create a fitness/wellness script with energy, motivation, and practical tips.',
    general: 'Create an engaging, entertaining script optimized for short-form video.',
  };

  const typeGuide = contentTypeGuides[contentType] || contentTypeGuides.general;

  return `You are an expert short-form video scriptwriter. Create a compelling, engaging video script optimized for TikTok, YouTube Shorts, or Instagram Reels.

TOPIC: "${topic}"
SCRIPT TYPE: ${contentType}
TARGET DURATION: ${duration} seconds (~${Math.round(duration * 2.5)} words)

${typeGuide}

REQUIREMENTS:
1. Start with a HOOK (first 3-5 seconds) that grabs attention immediately
2. Deliver main content in clear, conversational language
3. Include emotional cues for each scene (e.g., "urgent energy", "thoughtful pause", "excitement")
4. Suggest specific visual prompts for each scene
5. Break into natural scenes that pace well for video editing
6. End with a memorable closing statement

OUTPUT FORMAT:
Return a JSON object with:
- title: Catchy title for the video
- hook: 1-2 sentence hook that captures attention (first 3-5 seconds)
- main_script: The main script content (conversational, engaging)
- closing: A strong closing statement or call-to-action
- scenes: Array of scenes with:
  - text: What the narrator says in this scene
  - emotional_cue: How this should be delivered (e.g., "eager energy", "mysterious tone", "warm reassurance")
  - visual_prompt: What visuals should accompany this (specific descriptions for video makers)
  - duration_seconds: How long this scene should be
- key_moments: Array of pivotal moments in the script (for editing emphasis)
- keywords: Array of SEO/hashtag keywords relevant to the content
- estimated_duration_seconds: Total script duration in seconds

TIPS:
- Keep sentences short and punchy
- Use active voice and strong verbs
- Include pauses where appropriate
- Build momentum toward the closing
- Make it shareable and memorable
- Optimize for algorithm engagement (hooks, retention, calls-to-action)

Generate the response as valid JSON only, no markdown.`;
}

/**
 * Format generated script for display
 */
export function formatScriptForDisplay(scriptData) {
  if (!scriptData) return null;

  const script = {
    title: scriptData.title || 'Untitled Script',
    hook: scriptData.hook || '',
    main: scriptData.main_script || '',
    closing: scriptData.closing || '',
    scenes: scriptData.scenes || [],
    keyMoments: scriptData.key_moments || [],
    keywords: scriptData.keywords || [],
    duration: scriptData.estimated_duration_seconds || 30,
  };

  // Combine hook + main + closing for full script
  script.fullScript = `${script.hook}\n\n${script.main}\n\n${script.closing}`.trim();

  return script;
}

/**
 * Convert generated script to SavedScript format
 */
export function convertToSavedScript(generatedScript, category = 'custom') {
  const formatted = formatScriptForDisplay(generatedScript);

  return {
    title: formatted.title,
    content: formatted.fullScript,
    category,
    word_count: formatted.fullScript.split(/\s+/).length,
    estimated_duration: Math.round(formatted.duration),
  };
}

/**
 * Extract hooks from script
 */
export function extractHooks(script) {
  if (!script?.hook) return [];

  const hooks = script.hook.split(/\n/).filter(h => h.trim());
  return hooks.map(h => ({
    text: h,
    type: 'hook',
    duration: 3, // Typical hook duration
  }));
}

/**
 * Get emotional cues from scenes
 */
export function getEmotionalCues(script) {
  return (script?.scenes || []).map(scene => ({
    text: scene.text,
    emotion: scene.emotional_cue || 'neutral',
    visual: scene.visual_prompt || '',
    duration: scene.duration_seconds || 5,
  }));
}

/**
 * Create visual storyboard from script
 */
export function createStoryboard(script) {
  const scenes = (script?.scenes || []).map((scene, idx) => ({
    number: idx + 1,
    text: scene.text,
    emotion: scene.emotional_cue || 'neutral',
    visual: scene.visual_prompt || '',
    duration: scene.duration_seconds || 5,
    isKeyMoment: script.key_moments?.some(m => m.toLowerCase().includes(scene.text.slice(0, 20).toLowerCase())),
  }));

  return {
    title: script?.title || 'Storyboard',
    hook: script?.hook || '',
    scenes,
    keyMoments: script?.key_moments || [],
    totalDuration: script?.estimated_duration_seconds || 30,
  };
}

/**
 * Validate generated script
 */
export function validateScript(script) {
  const validation = {
    valid: true,
    warnings: [],
    errors: [],
  };

  if (!script) {
    validation.valid = false;
    validation.errors.push('Script is missing');
    return validation;
  }

  if (!script.title) validation.warnings.push('Title is missing');
  if (!script.hook) validation.warnings.push('Hook is missing');
  if (!script.main_script) {
    validation.valid = false;
    validation.errors.push('Main script content is missing');
  }
  if (!script.scenes || script.scenes.length === 0) {
    validation.warnings.push('No scenes defined');
  }

  if (validation.errors.length > 0) {
    validation.valid = false;
  }

  return validation;
}