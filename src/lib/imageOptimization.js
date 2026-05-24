/**
 * Image Optimization & Performance
 * Handles image quality, compression, and efficient delivery
 */

/**
 * Enhanced image generation prompt for high-quality visuals
 */
export function buildHighQualityImagePrompt(sceneText, visualPrompt, style = 'cinematic', isKeyMoment = false) {
  const qualityDirectives = `
Create a professional, cinematic image optimized for short-form video:
- Ultra-sharp focus, high contrast, vibrant colors
- Professional lighting (no harsh shadows or blown highlights)
- ${isKeyMoment ? 'Key moment: dramatic composition, striking visual impact' : 'Smooth composition, balanced framing'}
- Vertical 9:16 aspect ratio (portrait, optimized for mobile)
- ${style === 'dark' ? 'Dark, moody lighting with high saturation' : 'Cinematic color grading with warm/cool balance'}
- No watermarks, logos, or text overlays
- High resolution (1024x1792 pixels minimum)
- Professional quality suitable for premium video content`;

  return `${qualityDirectives}

SCENE: "${sceneText}"
VISUAL STYLE: ${style} (${style === 'realistic' ? 'photorealistic, high detail' : style === 'dark' ? 'dark, mysterious, high contrast' : style === 'cinematic' ? 'film-like, color graded' : 'animated, vibrant'})
VISUAL ELEMENTS: ${visualPrompt || 'relevant visuals for the narration'}

Requirements:
- Ensure perfect vertical 9:16 aspect ratio
- Professional quality, no artifacts or blur
- Consistent with overall video tone
- Optimized for social media playback
- Generate as high-quality image`;
}

/**
 * Calculate optimal image dimensions for preview vs export
 */
export function getImageDimensions(mode = 'preview') {
  return mode === 'preview'
    ? { width: 540, height: 960, quality: 0.8, format: 'webp' } // Preview: optimized for fast loading
    : { width: 1024, height: 1792, quality: 0.95, format: 'jpg' }; // Export: high quality
}

/**
 * Build style consistency prompt to ensure all scenes match
 */
export function buildStyleConsistencyPrompt(overallStyle, sceneIndex, totalScenes) {
  const progressTone = sceneIndex / totalScenes;
  const paceGuide = 
    progressTone < 0.2 ? 'opening scene: establish mood and atmosphere' :
    progressTone > 0.8 ? 'closing scene: impactful conclusion' :
    'middle scene: maintain momentum and cohesion';

  return `
MAINTAIN VISUAL CONSISTENCY:
- Overall video style: ${overallStyle}
- Scene position: ${sceneIndex + 1}/${totalScenes} (${paceGuide})
- Lighting: consistent color temperature and brightness across scenes
- Color palette: maintain the established color scheme
- Visual language: similar composition and framing style
- Avoid sudden stylistic shifts between scenes`;
}

/**
 * Optimize image for web delivery (simulates compression)
 */
export function getOptimizedImageUrl(originalUrl, mode = 'preview') {
  if (!originalUrl) return null;

  // In a real implementation, this would use image CDN with parameters
  // For now, we tag the URL for tracking optimization
  const dims = getImageDimensions(mode);
  
  // Add query parameters that a real CDN would use
  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}opt=${mode}&w=${dims.width}&h=${dims.height}&q=${Math.round(dims.quality * 100)}`;
}

/**
 * Estimate file size reduction from optimization
 */
export function estimateCompressionSavings(originalUrl, mode = 'preview') {
  // Rough estimates: preview mode ~60% savings, export mode ~20% savings
  const savingsPercent = mode === 'preview' ? 0.6 : 0.2;
  return savingsPercent;
}

/**
 * Preload image for smooth playback
 */
export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No URL provided'));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      console.log(`[Image Preload] ✅ Loaded: ${url.slice(-50)}`);
      resolve(img);
    };
    
    img.onerror = () => {
      console.warn(`[Image Preload] ⚠️ Failed to load: ${url.slice(-50)}`);
      reject(new Error(`Failed to load image: ${url}`));
    };

    // Set timeout for slow connections
    const timeout = setTimeout(() => {
      reject(new Error('Image preload timeout'));
    }, 15000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Preload multiple images in parallel
 */
export async function preloadSceneImages(scenes, onProgress) {
  if (!scenes || scenes.length === 0) return;

  console.log(`[Image Preload] Starting preload of ${scenes.length} scenes`);
  
  const results = [];
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    if (scene.image_url) {
      try {
        await preloadImage(scene.image_url);
        results.push({ success: true, index: i });
        if (onProgress) onProgress(i + 1, scenes.length);
      } catch (error) {
        console.warn(`[Image Preload] Scene ${i} failed:`, error.message);
        results.push({ success: false, index: i, error });
      }
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`[Image Preload] ✅ Completed: ${successCount}/${scenes.length} scenes`);
  
  return results;
}

/**
 * Lazy load image with fallback
 */
export function lazyLoadImage(url, placeholder = null) {
  return new Promise((resolve) => {
    const img = new Image();
    
    // Use placeholder immediately if provided
    if (placeholder) resolve(placeholder);

    img.onload = () => {
      resolve(url);
    };

    img.onerror = () => {
      console.warn(`[Lazy Load] Failed to load: ${url}`);
      resolve(placeholder);
    };

    img.src = url;
  });
}

/**
 * Detect device performance capability
 */
export function detectDevicePerformance() {
  const perfData = {
    ram: navigator.deviceMemory || 4,
    cores: navigator.hardwareConcurrency || 2,
    connection: navigator.connection?.effectiveType || '4g',
    gpu: (() => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('webgl');
        return ctx ? 'supported' : 'limited';
      } catch {
        return 'limited';
      }
    })(),
  };

  // Determine performance tier
  const isPowerful = perfData.ram >= 8 && perfData.cores >= 4 && perfData.connection === '4g';
  const isLimited = perfData.ram <= 2 || perfData.cores <= 2 || perfData.connection === '3g';

  return {
    ...perfData,
    tier: isPowerful ? 'high' : isLimited ? 'low' : 'medium',
    shouldUseLightMode: isLimited,
  };
}

/**
 * Get optimal settings based on device performance
 */
export function getOptimalSettings() {
  const perf = detectDevicePerformance();

  const settings = {
    previewQuality: perf.tier === 'high' ? 0.95 : perf.tier === 'medium' ? 0.8 : 0.6,
    previewResolution: perf.tier === 'high' ? 1024 : perf.tier === 'medium' ? 768 : 540,
    preloadStrategy: perf.tier === 'high' ? 'aggressive' : perf.tier === 'medium' ? 'moderate' : 'lazy',
    enableKenBurns: perf.tier !== 'low',
    enableTransitions: perf.tier !== 'low',
    fps: perf.tier === 'high' ? 30 : 24,
    bufferSize: perf.tier === 'high' ? 3 : 1,
  };

  console.log(`[Performance] Device tier: ${perf.tier}`, settings);
  return settings;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}