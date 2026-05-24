/**
 * ClipForge Watermark Engine
 * Handles watermark positioning, sizing, and application to video frames
 */

export const POSITION_COORDS = {
  'top-left': { x: '5%', y: '5%', anchorX: 'left', anchorY: 'top' },
  'top-right': { x: '95%', y: '5%', anchorX: 'right', anchorY: 'top' },
  'bottom-left': { x: '5%', y: '95%', anchorX: 'left', anchorY: 'bottom' },
  'bottom-right': { x: '95%', y: '95%', anchorX: 'right', anchorY: 'bottom' },
  'center': { x: '50%', y: '50%', anchorX: 'center', anchorY: 'center' },
};

/**
 * Calculate watermark dimensions based on video size and scale
 */
export function calculateWatermarkDimensions(videoWidth, videoHeight, scale = 0.15) {
  const maxDimension = Math.max(videoWidth, videoHeight);
  const size = maxDimension * scale;
  return {
    width: size,
    height: size,
    maxWidth: `${scale * 100}%`,
  };
}

/**
 * Get CSS transform for watermark positioning
 */
export function getWatermarkTransform(position = 'bottom-right', scale = 0.15) {
  const coords = POSITION_COORDS[position] || POSITION_COORDS['bottom-right'];
  const dimension = scale * 100;

  const transforms = {
    'top-left': `translate(${dimension * 0.1}px, ${dimension * 0.1}px)`,
    'top-right': `translate(calc(-100% - ${dimension * 0.1}px), ${dimension * 0.1}px)`,
    'bottom-left': `translate(${dimension * 0.1}px, calc(-100% - ${dimension * 0.1}px))`,
    'bottom-right': `translate(calc(-100% - ${dimension * 0.1}px), calc(-100% - ${dimension * 0.1}px))`,
    'center': `translate(-50%, -50%)`,
  };

  return transforms[position] || transforms['bottom-right'];
}

/**
 * Generate watermark CSS for HTML/Canvas rendering
 */
export function generateWatermarkCSS(logoUrl, position = 'bottom-right', opacity = 0.8, scale = 0.15) {
  if (!logoUrl) return '';

  const positionMap = {
    'top-left': 'top: 1rem; left: 1rem;',
    'top-right': 'top: 1rem; right: 1rem;',
    'bottom-left': 'bottom: 1rem; left: 1rem;',
    'bottom-right': 'bottom: 1rem; right: 1rem;',
    'center': 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
  };

  return `
    .watermark-logo {
      position: absolute;
      ${positionMap[position] || positionMap['bottom-right']}
      width: ${scale * 100}%;
      max-width: 150px;
      opacity: ${opacity};
      pointer-events: none;
      z-index: 100;
      background-image: url('${logoUrl}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
  `;
}

/**
 * Create HTML watermark element
 */
export function createWatermarkElement(logoUrl, position = 'bottom-right', opacity = 0.8, scale = 0.15) {
  const div = document.createElement('div');
  div.className = 'watermark-logo';
  div.style.position = 'absolute';
  div.style.opacity = opacity.toString();
  div.style.zIndex = '100';
  div.style.pointerEvents = 'none';
  div.style.width = `${scale * 100}%`;
  div.style.maxWidth = '150px';
  div.style.aspectRatio = '1';
  div.style.backgroundImage = `url('${logoUrl}')`;
  div.style.backgroundSize = 'contain';
  div.style.backgroundRepeat = 'no-repeat';
  div.style.backgroundPosition = 'center';

  // Set position
  const positionStyles = {
    'top-left': { top: '1rem', left: '1rem' },
    'top-right': { top: '1rem', right: '1rem' },
    'bottom-left': { bottom: '1rem', left: '1rem' },
    'bottom-right': { bottom: '1rem', right: '1rem' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  };

  const styles = positionStyles[position] || positionStyles['bottom-right'];
  Object.assign(div.style, styles);

  return div;
}

/**
 * Validate watermark configuration
 */
export function validateWatermarkConfig(config) {
  const validation = {
    valid: true,
    errors: [],
  };

  if (!config) {
    validation.valid = false;
    validation.errors.push('Watermark config is missing');
    return validation;
  }

  if (!config.logo_url) {
    validation.errors.push('Logo URL is missing');
  }

  if (!config.position || !POSITION_COORDS[config.position]) {
    validation.errors.push(`Invalid position: ${config.position}`);
  }

  if (config.opacity < 0 || config.opacity > 1) {
    validation.errors.push('Opacity must be between 0 and 1');
  }

  if (config.scale < 0.05 || config.scale > 0.4) {
    validation.errors.push('Scale must be between 5% and 40%');
  }

  if (validation.errors.length > 0) {
    validation.valid = false;
  }

  return validation;
}

/**
 * Log watermark application
 */
export function logWatermarkApplication(config) {
  if (!config.enabled) {
    console.log('[Watermark] 🚫 Watermark disabled');
    return;
  }

  console.log('[Watermark] 🎨 Applying watermark:');
  console.log(`  Position: ${config.position}`);
  console.log(`  Size: ${Math.round(config.scale * 100)}% of video`);
  console.log(`  Opacity: ${Math.round(config.opacity * 100)}%`);
  console.log(`  Logo: ${config.logo_url ? '✓ Loaded' : '✗ Missing'}`);
}