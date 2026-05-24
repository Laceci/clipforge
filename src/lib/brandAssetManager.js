/**
 * ClipForge Brand Asset Manager
 * Centralizes brand configuration and applies it globally to projects
 */

import { validateWatermarkConfig, logWatermarkApplication } from './watermarkEngine.js';

/**
 * Get complete brand configuration from user preferences
 */
export function getBrandConfig(userPrefs) {
  if (!userPrefs) {
    console.warn('[Brand Manager] No user preferences found');
    return getDefaultBrandConfig();
  }

  return {
    // Colors
    colors: {
      primary: userPrefs.brand_primary_color || '#A3E635',
      accent: userPrefs.brand_accent_color || '#FFFFFF',
      background: userPrefs.brand_background_color || '#000000',
    },

    // Font
    font: {
      name: userPrefs.brand_font_name || '',
      url: userPrefs.brand_font_url || '',
      enabled: !!userPrefs.brand_font_url,
    },

    // Watermark
    watermark: {
      logo_url: userPrefs.brand_watermark_logo_url || '',
      position: userPrefs.brand_watermark_position || 'bottom-right',
      opacity: userPrefs.brand_watermark_opacity || 0.8,
      scale: userPrefs.brand_watermark_scale || 0.15,
      enabled: userPrefs.brand_watermark_enabled || false,
    },

    // Hashtags
    hashtags: userPrefs.brand_hashtags_global || '',
  };
}

/**
 * Get default brand configuration
 */
export function getDefaultBrandConfig() {
  return {
    colors: {
      primary: '#A3E635',
      accent: '#FFFFFF',
      background: '#000000',
    },
    font: {
      name: '',
      url: '',
      enabled: false,
    },
    watermark: {
      logo_url: '',
      position: 'bottom-right',
      opacity: 0.8,
      scale: 0.15,
      enabled: false,
    },
    hashtags: '',
  };
}

/**
 * Apply brand configuration to project data
 * Merges brand assets into project while preserving user overrides
 */
export function applyBrandConfigToProject(projectData, brandConfig) {
  if (!brandConfig || !brandConfig.watermark.enabled) {
    return projectData;
  }

  // Validate watermark config
  const validation = validateWatermarkConfig(brandConfig.watermark);
  if (!validation.valid) {
    console.warn('[Brand Manager] Watermark validation errors:', validation.errors);
    return projectData;
  }

  logWatermarkApplication(brandConfig.watermark);

  return {
    ...projectData,
    watermark: {
      enabled: true,
      logo_url: brandConfig.watermark.logo_url,
      position: brandConfig.watermark.position,
      opacity: brandConfig.watermark.opacity,
      scale: brandConfig.watermark.scale,
    },
  };
}

/**
 * Inject brand font into document
 */
export function injectBrandFont(fontUrl, fontName) {
  if (!fontUrl || !fontName) return;

  // Check if font is already injected
  const styleId = `brand-font-${fontName}`;
  if (document.getElementById(styleId)) {
    console.log(`[Brand Manager] Font "${fontName}" already injected`);
    return;
  }

  // Create and inject font-face rule
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    @font-face {
      font-family: '${fontName}';
      src: url('${fontUrl}') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
  `;
  document.head.appendChild(style);

  console.log(`[Brand Manager] Injected font: ${fontName}`);
}

/**
 * Apply brand colors to elements
 */
export function applyBrandColors(colors) {
  if (!colors) return;

  // This can be used to update CSS variables or element styles
  document.documentElement.style.setProperty('--brand-primary', colors.primary);
  document.documentElement.style.setProperty('--brand-accent', colors.accent);
  document.documentElement.style.setProperty('--brand-background', colors.background);

  console.log('[Brand Manager] Applied brand colors');
}

/**
 * Get caption styling using brand colors
 */
export function getBrandCaptionStyle(brandConfig) {
  return {
    textColor: brandConfig.colors.accent,
    highlightColor: brandConfig.colors.primary,
    shadowColor: brandConfig.colors.background,
    fontFamily: brandConfig.font.enabled ? `'${brandConfig.font.name}', sans-serif` : 'inherit',
  };
}

/**
 * Log brand configuration
 */
export function logBrandConfig(config) {
  console.log('[Brand Manager] 🎨 Brand Configuration:');
  console.log(`  Colors: Primary=${config.colors.primary}, Accent=${config.colors.accent}`);
  console.log(`  Font: ${config.font.enabled ? config.font.name : 'Default'}`);
  console.log(`  Watermark: ${config.watermark.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`  Hashtags: ${config.hashtags ? '✓ Set' : '✗ Empty'}`);
}