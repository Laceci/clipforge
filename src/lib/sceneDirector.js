/**
 * Scene Director System
 * Analyzes script scenes and generates cinematic clip plans
 * Determines mood, setting, camera angles, movement, lighting, and timing
 */

const MOOD_KEYWORDS = {
  tension: ['danger', 'fear', 'risk', 'threat', 'suspense', 'nervous', 'uncertain'],
  triumph: ['success', 'victory', 'achieved', 'conquered', 'won', 'breakthrough'],
  mystery: ['secret', 'hidden', 'unknown', 'discover', 'uncover', 'revelation'],
  introspection: ['thought', 'reflection', 'realize', 'understand', 'moment', 'realization'],
  betrayal: ['betrayed', 'trust', 'lost', 'alone', 'abandoned', 'heartbreak'],
  motivation: ['power', 'strength', 'unstoppable', 'push', 'drive', 'push forward'],
  intimacy: ['care', 'love', 'heart', 'connect', 'bond', 'together'],
  darkness: ['dark', 'evil', 'shadow', 'corruption', 'monster', 'horror'],
};

const SETTING_KEYWORDS = {
  office: ['office', 'desk', 'work', 'meeting', 'conference', 'corporate', 'building', 'business'],
  city: ['city', 'street', 'urban', 'downtown', 'skyscraper', 'traffic', 'crowded'],
  nature: ['nature', 'forest', 'mountain', 'water', 'sky', 'ocean', 'landscape', 'outdoor'],
  intimate: ['room', 'home', 'bedroom', 'alone', 'personal', 'private', 'space'],
  abstract: ['mind', 'thought', 'dream', 'imagination', 'reality', 'illusion', 'concept'],
};

const CAMERA_ANGLES = {
  closeup: {
    name: 'Close-up',
    description: 'Tight face or object shot',
    emotion: 'intimacy',
    distance: '0.3m',
    fov: '50mm',
  },
  medium: {
    name: 'Medium Shot',
    description: 'Waist-up character shot',
    emotion: 'engagement',
    distance: '1.5m',
    fov: '35mm',
  },
  wide: {
    name: 'Wide Shot',
    description: 'Full body and environment',
    emotion: 'context',
    distance: '4m',
    fov: '24mm',
  },
  profile: {
    name: 'Profile',
    description: 'Side view of subject',
    emotion: 'contemplation',
    distance: '2m',
    fov: '35mm',
  },
  overhead: {
    name: 'Overhead',
    description: 'Looking down at scene',
    emotion: 'power',
    distance: '3m',
    fov: '28mm',
  },
  lowangle: {
    name: 'Low Angle',
    description: 'Looking up at subject',
    emotion: 'dominance',
    distance: '2m',
    fov: '35mm',
  },
};

const MOVEMENT_STYLES = {
  static: {
    name: 'Static',
    description: 'Minimal camera movement',
    speed: 0,
    type: 'contemplative',
  },
  slowzoom: {
    name: 'Slow Zoom In',
    description: 'Gentle push toward subject',
    speed: 0.3,
    type: 'intimate',
  },
  tracking: {
    name: 'Tracking Shot',
    description: 'Smooth lateral movement',
    speed: 0.5,
    type: 'dynamic',
  },
  pan: {
    name: 'Pan',
    description: 'Horizontal head rotation',
    speed: 0.4,
    type: 'reveal',
  },
  dolly: {
    name: 'Dolly',
    description: 'Forward/backward movement',
    speed: 0.6,
    type: 'immersive',
  },
  handheld: {
    name: 'Handheld',
    description: 'Natural organic movement',
    speed: 0.4,
    type: 'authentic',
  },
};

const LIGHTING_STYLES = {
  dramatic: {
    name: 'Dramatic',
    description: 'High contrast, shadows, rim lighting',
    mood: 'tension',
    colorTemp: 'cool',
    intensity: 'high',
  },
  natural: {
    name: 'Natural',
    description: 'Soft, warm, environmental light',
    mood: 'authentic',
    colorTemp: 'warm',
    intensity: 'medium',
  },
  cinematic: {
    name: 'Cinematic',
    description: '3-point professional lighting',
    mood: 'professional',
    colorTemp: 'balanced',
    intensity: 'high',
  },
  soft: {
    name: 'Soft',
    description: 'Diffused, gentle lighting',
    mood: 'intimacy',
    colorTemp: 'warm',
    intensity: 'low',
  },
  neon: {
    name: 'Neon',
    description: 'Colored gel lighting, moody',
    mood: 'dark',
    colorTemp: 'cool',
    intensity: 'high',
  },
  golden: {
    name: 'Golden Hour',
    description: 'Warm sunset lighting',
    mood: 'triumph',
    colorTemp: 'warm-gold',
    intensity: 'medium',
  },
};

/**
 * Analyze a single scene and generate cinematic clip plan
 */
export function analyzeScene(sceneText, sceneIndex, voiceSettings = {}) {
  const textLower = sceneText.toLowerCase();
  const wordCount = sceneText.split(/\s+/).length;

  // Detect mood
  const mood = detectMood(textLower);

  // Detect setting
  const setting = detectSetting(textLower);

  // Select camera angle based on mood and setting
  const cameraAngle = selectCameraAngle(mood, textLower);

  // Select movement style
  const movementStyle = selectMovementStyle(mood, cameraAngle);

  // Select lighting
  const lightingStyle = selectLighting(mood, setting);

  // Calculate clip duration based on word count and voice speed
  const voiceSpeed = voiceSettings.voice_speed || 1.0;
  const baseDuration = Math.ceil((wordCount / 130) * voiceSpeed); // ~130 words per minute
  const clipDuration = Math.max(2, Math.min(8, baseDuration)); // Clamp between 2-8s

  // Generate cinematic description
  const cinematicDescription = buildCinematicDescription({
    mood,
    setting,
    cameraAngle,
    movementStyle,
    lightingStyle,
    sceneText,
  });

  return {
    scene_index: sceneIndex,
    text: sceneText,
    mood,
    setting,
    camera_angle: cameraAngle.name,
    camera_details: cameraAngle,
    movement_style: movementStyle.name,
    movement_details: movementStyle,
    lighting_style: lightingStyle.name,
    lighting_details: lightingStyle,
    clip_duration: clipDuration,
    word_count: wordCount,
    cinematic_description: cinematicDescription,
    visual_prompt: buildVisualPrompt({
      mood,
      setting,
      cameraAngle,
      movementStyle,
      lightingStyle,
      sceneText,
      duration: clipDuration,
    }),
  };
}

/**
 * Detect scene mood from text
 */
function detectMood(textLower) {
  let moodScores = {};

  // Score each mood based on keyword matches
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    moodScores[mood] = keywords.filter(kw => textLower.includes(kw)).length;
  }

  // Return highest scoring mood, default to 'motivation'
  const topMood = Object.entries(moodScores).sort((a, b) => b[1] - a[1])[0];
  return topMood && topMood[1] > 0 ? topMood[0] : 'motivation';
}

/**
 * Detect scene setting from text
 */
function detectSetting(textLower) {
  let settingScores = {};

  for (const [setting, keywords] of Object.entries(SETTING_KEYWORDS)) {
    settingScores[setting] = keywords.filter(kw => textLower.includes(kw)).length;
  }

  const topSetting = Object.entries(settingScores).sort((a, b) => b[1] - a[1])[0];
  return topSetting && topSetting[1] > 0 ? topSetting[0] : 'abstract';
}

/**
 * Select camera angle based on mood and content
 */
function selectCameraAngle(mood, textLower) {
  const angleMap = {
    tension: CAMERA_ANGLES.closeup,
    mystery: CAMERA_ANGLES.closeup,
    intimacy: CAMERA_ANGLES.closeup,
    introspection: CAMERA_ANGLES.profile,
    triumph: CAMERA_ANGLES.wide,
    motivation: CAMERA_ANGLES.medium,
    betrayal: CAMERA_ANGLES.profile,
    darkness: CAMERA_ANGLES.lowangle,
  };

  return angleMap[mood] || CAMERA_ANGLES.medium;
}

/**
 * Select movement style based on mood and camera angle
 */
function selectMovementStyle(mood, cameraAngle) {
  const styleMap = {
    tension: MOVEMENT_STYLES.slowzoom,
    triumph: MOVEMENT_STYLES.dolly,
    mystery: MOVEMENT_STYLES.pan,
    introspection: MOVEMENT_STYLES.static,
    motivation: MOVEMENT_STYLES.dolly,
    betrayal: MOVEMENT_STYLES.handheld,
    darkness: MOVEMENT_STYLES.slowzoom,
    intimacy: MOVEMENT_STYLES.slowzoom,
  };

  return styleMap[mood] || MOVEMENT_STYLES.tracking;
}

/**
 * Select lighting based on mood and setting
 */
function selectLighting(mood, setting) {
  const lightingMap = {
    tension: LIGHTING_STYLES.dramatic,
    triumph: LIGHTING_STYLES.golden,
    mystery: LIGHTING_STYLES.dramatic,
    introspection: LIGHTING_STYLES.soft,
    motivation: LIGHTING_STYLES.cinematic,
    betrayal: LIGHTING_STYLES.dramatic,
    darkness: LIGHTING_STYLES.neon,
    intimacy: LIGHTING_STYLES.soft,
  };

  return lightingMap[mood] || LIGHTING_STYLES.cinematic;
}

/**
 * Build human-readable cinematic description
 */
function buildCinematicDescription({
  mood,
  setting,
  cameraAngle,
  movementStyle,
  lightingStyle,
  sceneText,
}) {
  return `
[${mood.toUpperCase()} SCENE]
Setting: ${setting} environment
Framing: ${cameraAngle.name} - ${cameraAngle.description}
Movement: ${movementStyle.name} - ${movementStyle.description}
Lighting: ${lightingStyle.name} - ${lightingStyle.description}

Narrative: "${sceneText}"

Direction: Focus on emotional tone. Use ${lightingStyle.name.toLowerCase()} lighting 
to emphasize ${mood} mood. Employ ${movementStyle.name.toLowerCase()} camera technique 
with ${cameraAngle.name.toLowerCase()} framing to draw viewer attention and enhance storytelling.
  `.trim();
}

/**
 * Build visual prompt for video generation API
 */
function buildVisualPrompt({
  mood,
  setting,
  cameraAngle,
  movementStyle,
  lightingStyle,
  sceneText,
  duration,
}) {
  return `PREMIUM CINEMATIC VIDEO GENERATION REQUEST

NARRATIVE TEXT: "${sceneText}"
DURATION: ${duration} seconds
ASPECT RATIO: 9:16 (vertical, mobile-optimized)
RESOLUTION: 1080p minimum (high-quality)
FRAMERATE: 24fps (cinematic standard)
CODEC: H.264 or better

═══════════════════════════════════════════════════════════

CINEMATIC SPECIFICATION:
• Mood: ${mood} (${MOOD_KEYWORDS[mood]?.join(', ')})
• Setting: ${setting} environment
• Camera: ${cameraAngle.name} (${cameraAngle.fov} focal length)
• Movement: ${movementStyle.name} (${movementStyle.speed * 100}% speed - SMOOTH & PROFESSIONAL)
• Lighting: ${lightingStyle.name} (${lightingStyle.colorTemp} temperature, professional-grade)

═══════════════════════════════════════════════════════════

QUALITY & REALISM REQUIREMENTS (CRITICAL):
✓ PHOTOREALISTIC HUMANS - No cartoon, illustration, or anime
✓ Professional makeup and grooming on all subjects
✓ Natural authentic human movement and expressions
✓ Realistic physics (no floaty/floating subjects)
✓ Professional cinema lighting (three-point or better)
✓ Premium color grading matching mood
✓ Smooth camera motion (no jerky or artificial movement)
✓ Professional production design and composition
✓ High-end broadcast quality cinematography
✓ Natural skin tones and realistic textures

═══════════════════════════════════════════════════════════

AVOID (EXPLICITLY):
✗ Generic AI-generated look
✗ Plastic or artificial-looking textures
✗ Stiff or unnatural human movement
✗ Flat lighting or overexposed faces
✗ Obvious digital artifacts
✗ Overly saturated or unrealistic colors
✗ Low production value
✗ Amateur-looking cinematography

═══════════════════════════════════════════════════════════

PRODUCTION QUALITY TIER: BROADCAST PREMIUM
- Use best available models and rendering
- Prioritize quality over speed
- Premium human realism over cost-saving
- Cinematic post-production standards

MOTION SPECIFICATION:
- Continuous smooth movement throughout
- Professional camera operator technique
- No freeze frames or jumps
- Seamless transitions
- Natural handheld feel (where appropriate)

COLOR & LIGHTING:
- Professional color grading with LUT
- Matched white balance and exposure
- Mood-appropriate color palette
- Cinema-standard dynamic range
- Professional highlight/shadow handling

This is a REAL PROFESSIONAL MOVING VIDEO, not a slide show or artificial animation.`;
}

/**
 * Create full scene director report for entire script
 */
export function generateSceneDirectorReport(scenes, voiceSettings = {}) {
  const directedScenes = scenes.map((scene, idx) =>
    analyzeScene(scene.text || scene, idx, voiceSettings)
  );

  return {
    total_scenes: directedScenes.length,
    total_duration: directedScenes.reduce((s, sc) => s + sc.clip_duration, 0),
    mood_distribution: getMoodDistribution(directedScenes),
    camera_variety: getCameraVariety(directedScenes),
    lighting_palette: getLightingPalette(directedScenes),
    scenes: directedScenes,
  };
}

/**
 * Analyze mood distribution across all scenes
 */
function getMoodDistribution(scenes) {
  const distribution = {};
  scenes.forEach(scene => {
    distribution[scene.mood] = (distribution[scene.mood] || 0) + 1;
  });
  return distribution;
}

/**
 * Check camera variety for visual interest
 */
function getCameraVariety(scenes) {
  const cameras = new Set(scenes.map(s => s.camera_angle));
  return {
    unique_angles: cameras.size,
    variety_score: Math.min(100, (cameras.size / scenes.length) * 100),
    suggestions: cameras.size < scenes.length / 2 ? 'Consider more camera angle variety' : 'Good camera variety',
  };
}

/**
 * Analyze lighting palette
 */
function getLightingPalette(scenes) {
  const lightings = new Set(scenes.map(s => s.lighting_style));
  return {
    unique_styles: lightings.size,
    palette: Array.from(lightings),
  };
}

/**
 * Export scene director data for use in pipeline
 */
export function prepareDirectedScenesForPipeline(directorReport) {
  return directorReport.scenes.map(scene => ({
    text: scene.text,
    mood: scene.mood,
    setting: scene.setting,
    camera_angle: scene.camera_angle,
    movement_style: scene.movement_style,
    lighting_style: scene.lighting_style,
    duration: scene.clip_duration,
    visual_prompt: scene.visual_prompt,
    cinematic_description: scene.cinematic_description,
  }));
}