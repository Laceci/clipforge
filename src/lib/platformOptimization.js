/**
 * Platform-specific content optimization
 * Formats videos, captions, and metadata for each platform
 */

export const PLATFORM_SPECS = {
  tiktok: {
    name: 'TikTok',
    maxCaptionLength: 2200,
    recommendedDuration: '15-60s',
    resolutions: ['1080x1920', '720x1280'],
    videoCodec: 'h264',
    audioCodec: 'aac',
    maxHashtags: 30,
    captionStyle: 'word_by_word',
    autoCaption: true,
    aspectRatio: '9:16',
  },
  instagram: {
    name: 'Instagram Reels',
    maxCaptionLength: 2200,
    recommendedDuration: '3-90s',
    resolutions: ['1080x1920', '720x1280'],
    videoCodec: 'h264',
    audioCodec: 'aac',
    maxHashtags: 30,
    captionStyle: 'sentence',
    autoCaption: false,
    aspectRatio: '9:16',
  },
  youtube: {
    name: 'YouTube Shorts',
    maxCaptionLength: 5000,
    recommendedDuration: '15-60s',
    resolutions: ['1080x1920', '2560x1440'],
    videoCodec: 'vp9',
    audioCodec: 'opus',
    maxHashtags: 100,
    captionStyle: 'sentence',
    autoCaption: true,
    aspectRatio: '9:16',
  },
  facebook: {
    name: 'Facebook Reels',
    maxCaptionLength: 63206,
    recommendedDuration: '3-120s',
    resolutions: ['1080x1920', '1280x720'],
    videoCodec: 'h264',
    audioCodec: 'aac',
    maxHashtags: 50,
    captionStyle: 'sentence',
    autoCaption: false,
    aspectRatio: '9:16',
  },
};

/**
 * Optimize caption for platform constraints
 */
export function optimizeCaptionForPlatform(caption, platform) {
  const spec = PLATFORM_SPECS[platform];
  if (!spec) return caption;

  let optimized = caption;

  // Trim to platform max length
  if (optimized.length > spec.maxCaptionLength) {
    optimized = optimized.substring(0, spec.maxCaptionLength - 3) + '...';
  }

  return optimized.trim();
}

/**
 * Optimize hashtags for platform
 */
export function optimizeHashtagsForPlatform(hashtags, platform) {
  const spec = PLATFORM_SPECS[platform];
  if (!spec) return hashtags;

  const tags = hashtags
    .split(/\s+/)
    .filter(tag => tag.startsWith('#'))
    .slice(0, spec.maxHashtags);

  return tags.join(' ');
}

/**
 * Format caption for platform style
 */
export function formatCaptionForPlatform(text, platform) {
  const spec = PLATFORM_SPECS[platform];
  if (!spec) return text;

  // Different platforms have different caption preferences
  if (platform === 'tiktok') {
    // TikTok: shorter lines, more emojis friendly
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n');
  }

  if (platform === 'youtube') {
    // YouTube: longer form, supports full sentences
    return text;
  }

  if (platform === 'instagram') {
    // Instagram: longer captions, can use line breaks creatively
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n');
  }

  if (platform === 'facebook') {
    // Facebook: conversational tone
    return text;
  }

  return text;
}

/**
 * Get recommended video specs for platform
 */
export function getVideoSpecsForPlatform(platform) {
  return PLATFORM_SPECS[platform] || PLATFORM_SPECS.tiktok;
}

/**
 * Validate video is compatible with platform
 */
export function validateVideoForPlatform(video, platform) {
  const spec = PLATFORM_SPECS[platform];
  const issues = [];

  // Check duration (rough check based on reported duration)
  if (video.duration) {
    const durationMatch = spec.recommendedDuration.match(/(\d+)-(\d+)/);
    if (durationMatch) {
      const [, min, max] = durationMatch;
      if (video.duration < parseInt(min) || video.duration > parseInt(max)) {
        issues.push(`Video duration ${video.duration}s outside recommended ${spec.recommendedDuration}`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    spec,
  };
}

/**
 * Prepare video for multi-platform publishing
 */
export function prepareForMultiPlatform(caption, hashtags, platforms) {
  const result = {};

  platforms.forEach(platform => {
    result[platform] = {
      caption: optimizeCaptionForPlatform(
        formatCaptionForPlatform(caption, platform),
        platform
      ),
      hashtags: optimizeHashtagsForPlatform(hashtags, platform),
      spec: getVideoSpecsForPlatform(platform),
    };
  });

  return result;
}