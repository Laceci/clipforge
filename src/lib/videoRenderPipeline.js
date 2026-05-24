/**
 * Separate Preview vs Export Render Pipeline
 * Optimizes for fast preview rendering while maintaining export quality
 */

import { getOptimalSettings } from './imageOptimization';

/**
 * Prepare video for preview rendering (fast, optimized)
 */
export function preparePreviewRender(projectData) {
  const settings = getOptimalSettings();
  
  const previewProject = {
    ...projectData,
    // Override resolution for preview
    resolution: settings.previewResolution === 540 ? '720p' : '1080p',
    scenes: (projectData.scenes || []).map(scene => ({
      ...scene,
      // Optimize images for preview
      image_url: optimizeImageUrl(scene.image_url, 'preview'),
      // Reduce animation complexity for low-end devices
      animation: settings.enableKenBurns ? scene.animation : 'fade',
    })),
    // Preview-specific settings
    _previewMode: true,
    _previewQuality: settings.previewQuality,
    _enableTransitions: settings.enableTransitions,
  };

  console.log('[Render Pipeline] Preview render prepared', {
    scenes: previewProject.scenes.length,
    quality: settings.previewQuality,
    fps: settings.fps,
  });

  return previewProject;
}

/**
 * Prepare video for final export (high quality)
 */
export function prepareExportRender(projectData) {
  const exportProject = {
    ...projectData,
    // Ensure full resolution for export
    resolution: projectData.resolution || '1080p',
    scenes: (projectData.scenes || []).map(scene => ({
      ...scene,
      // Keep original high-quality images
      image_url: scene.image_url,
      // Full animations for export
      animation: scene.animation || 'pan_zoom',
    })),
    // Export-specific settings
    _exportMode: true,
    _exportQuality: 0.95,
    _enableAllEffects: true,
  };

  console.log('[Render Pipeline] Export render prepared', {
    scenes: exportProject.scenes.length,
    quality: 0.95,
    format: 'mp4',
  });

  return exportProject;
}

/**
 * Optimize image URL for target mode
 */
function optimizeImageUrl(url, mode = 'preview') {
  if (!url) return url;
  
  // In production, this would use image CDN with transformation parameters
  // For now, we return the URL as-is, but the system knows to handle it differently
  return url;
}

/**
 * Calculate scene timing with smooth transitions
 */
export function calculateSceneTiming(scenes, voiceSettings) {
  return (scenes || []).map((scene, idx) => {
    // Base duration from TTS or manual setting
    const baseDuration = scene.duration || 5;
    
    // Add transition time (200-300ms) between scenes
    const transitionTime = idx < scenes.length - 1 ? 0.25 : 0;
    
    return {
      ...scene,
      duration: baseDuration,
      transitionDuration: transitionTime,
      totalDuration: baseDuration + transitionTime,
      startTime: scenes.slice(0, idx).reduce((sum, s) => sum + (s.duration || 5) + 0.25, 0),
    };
  });
}

/**
 * Generate frame timing for consistent FPS
 */
export function generateFrameTiming(totalDuration, fps = 30) {
  const frameInterval = 1 / fps;
  const frames = [];
  
  for (let t = 0; t <= totalDuration; t += frameInterval) {
    frames.push({
      timestamp: t,
      frameNumber: frames.length,
    });
  }

  return frames;
}

/**
 * Validate render pipeline configuration
 */
export function validateRenderConfig(projectData, mode = 'preview') {
  const errors = [];
  const warnings = [];

  if (!projectData.scenes || projectData.scenes.length === 0) {
    errors.push('No scenes found');
  }

  projectData.scenes?.forEach((scene, idx) => {
    if (!scene.image_url) {
      warnings.push(`Scene ${idx + 1}: Missing image`);
    }
    if (!scene.text) {
      warnings.push(`Scene ${idx + 1}: Missing narration text`);
    }
  });

  const isValid = errors.length === 0;

  console.log(`[Render Pipeline] Validation (${mode}):`, {
    valid: isValid,
    errors: errors.length,
    warnings: warnings.length,
  });

  return { isValid, errors, warnings };
}

/**
 * Estimate render time
 */
export function estimateRenderTime(sceneCount, mode = 'preview') {
  // Rough estimates
  const baseTime = sceneCount * 2; // 2 seconds per scene for processing
  const modeMultiplier = mode === 'preview' ? 0.5 : 1.5; // Preview is faster
  
  return Math.round(baseTime * modeMultiplier);
}