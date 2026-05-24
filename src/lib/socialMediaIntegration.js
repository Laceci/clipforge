/**
 * Social Media Integration
 * Manages platform connections and video publishing
 */

import { base44 } from '@/api/base44Client';

export const SOCIAL_PLATFORMS = {
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    maxDuration: 600,
    minDuration: 3,
    aspectRatio: '9:16',
    features: ['hashtags', 'captions', 'music'],
  },
  youtube: {
    name: 'YouTube',
    icon: '▶️',
    color: '#FF0000',
    maxDuration: 3600,
    minDuration: 3,
    aspectRatio: '16:9',
    features: ['description', 'hashtags', 'thumbnails', 'playlist'],
  },
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: '#E1306C',
    maxDuration: 600,
    minDuration: 3,
    aspectRatio: '9:16',
    features: ['hashtags', 'captions', 'music'],
  },
};

/**
 * Format video for platform specifications
 */
export function formatVideoForPlatform(video, platform) {
  if (!SOCIAL_PLATFORMS[platform]) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const specs = SOCIAL_PLATFORMS[platform];
  const duration = video.duration || 0;

  // Validate duration
  if (duration > specs.maxDuration) {
    return {
      valid: false,
      error: `Video too long for ${specs.name} (max ${specs.maxDuration}s)`,
    };
  }

  if (duration < specs.minDuration) {
    return {
      valid: false,
      error: `Video too short for ${specs.name} (min ${specs.minDuration}s)`,
    };
  }

  return {
    valid: true,
    platform,
    title: video.title,
    description: video.script || video.topic || '',
    duration,
    thumbnail: video.thumbnail_url,
    videoUrl: video.video_url,
    specs,
  };
}

/**
 * Prepare video upload payload for platform
 */
export function prepareUploadPayload(video, platform, caption, hashtags) {
  const formatted = formatVideoForPlatform(video, platform);

  if (!formatted.valid) {
    throw new Error(formatted.error);
  }

  const basePayload = {
    platform,
    video_id: video.id,
    title: formatted.title,
    caption: caption || formatted.description,
    hashtags: hashtags || '',
    video_url: formatted.videoUrl,
    thumbnail_url: formatted.thumbnail,
    duration: formatted.duration,
    status: 'pending',
    scheduled_at: null,
  };

  // Platform-specific payload
  switch (platform) {
    case 'tiktok':
      return {
        ...basePayload,
        tiktok_desc: caption || formatted.description,
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      };
    case 'youtube':
      return {
        ...basePayload,
        youtube_title: formatted.title,
        youtube_description: caption || formatted.description,
        youtube_tags: hashtags?.split('#').filter(Boolean) || [],
        visibility: 'private', // Start as private, user can publish
        thumbnail: formatted.thumbnail,
      };
    case 'instagram':
      return {
        ...basePayload,
        instagram_caption: caption || formatted.description,
        instagram_location: '',
        disable_comments: false,
      };
    default:
      return basePayload;
  }
}

/**
 * Validate scheduled upload
 */
export function validateScheduledUpload(uploadData) {
  const errors = [];

  if (!uploadData.platform) errors.push('Platform is required');
  if (!uploadData.video_id) errors.push('Video ID is required');
  if (!uploadData.account_id) errors.push('Account connection is required');
  if (!uploadData.caption && !uploadData.description) errors.push('Caption is required');

  if (uploadData.scheduled_at) {
    const scheduledTime = new Date(uploadData.scheduled_at);
    const now = new Date();
    if (scheduledTime < now) {
      errors.push('Scheduled time must be in the future');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get upload status badge
 */
export function getUploadStatusBadge(status) {
  const statuses = {
    pending: { label: 'Pending', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
    scheduled: { label: 'Scheduled', color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
    uploading: { label: 'Uploading', color: 'text-cyan-500', bgColor: 'bg-cyan-500/20' },
    published: { label: 'Published', color: 'text-green-500', bgColor: 'bg-green-500/20' },
    failed: { label: 'Failed', color: 'text-destructive', bgColor: 'bg-destructive/20' },
  };

  return statuses[status] || statuses.pending;
}

/**
 * Calculate upload priority
 */
export function calculateUploadPriority(video, platform) {
  let priority = 0;

  // Recent videos get higher priority
  const ageMs = Date.now() - new Date(video.created_date).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours < 24) priority += 3;
  else if (ageHours < 72) priority += 2;
  else if (ageHours < 168) priority += 1;

  // Video quality score
  if (video.duration > 30) priority += 1; // Longer videos
  if (video.thumbnail_url) priority += 2; // Has thumbnail
  if (video.caption) priority += 1; // Has caption

  return Math.min(priority, 10); // Max priority 10
}

/**
 * Estimate upload time
 */
export function estimateUploadTime(videoDuration, platform) {
  const baseTime = videoDuration * 0.5; // ~0.5s per 1s of video
  const platformMultiplier = {
    tiktok: 0.8,
    youtube: 1.5,
    instagram: 0.9,
  };

  const multiplier = platformMultiplier[platform] || 1;
  return Math.round(baseTime * multiplier);
}

/**
 * Get platform upload requirements
 */
export function getPlatformRequirements(platform) {
  const requirements = {
    tiktok: {
      minFileSize: 1024 * 1024, // 1MB
      maxFileSize: 2048 * 1024 * 1024, // 2GB
      supportedFormats: ['mp4', 'mov'],
      aspectRatio: '9:16',
      maxDuration: 600,
    },
    youtube: {
      minFileSize: 1024 * 1024, // 1MB
      maxFileSize: 256 * 1024 * 1024 * 1024, // 256GB (generous)
      supportedFormats: ['mp4', 'mov', 'avi', 'mkv'],
      aspectRatio: '16:9',
      maxDuration: 3600,
    },
    instagram: {
      minFileSize: 1024 * 1024, // 1MB
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      supportedFormats: ['mp4', 'mov'],
      aspectRatio: '9:16',
      maxDuration: 600,
    },
  };

  return requirements[platform];
}