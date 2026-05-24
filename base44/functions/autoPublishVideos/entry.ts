/**
 * Auto-Publish Videos
 * Scheduled automation that publishes videos to social platforms
 * Runs every 5 minutes to process scheduled posts
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch scheduled posts that are due
    const now = new Date();
    const scheduledPosts = await base44.asServiceRole.entities.ScheduledPost.filter({
      status: 'scheduled',
    });

    const duePosts = scheduledPosts.filter(post => {
      if (!post.scheduled_at) return false;
      const scheduledTime = new Date(post.scheduled_at);
      return scheduledTime <= now;
    });

    if (duePosts.length === 0) {
      console.log('[AutoPublish] ✅ No posts due for publishing');
      return Response.json({ processed: 0, success: 0, failed: 0 });
    }

    console.log(`[AutoPublish] 📤 Processing ${duePosts.length} scheduled posts...`);

    let successCount = 0;
    let failedCount = 0;

    // Process each post
    for (const post of duePosts) {
      try {
        // Get connected account
        const accounts = await base44.asServiceRole.entities.ConnectedAccount.filter({
          id: post.account_id,
        });

        if (accounts.length === 0) {
          throw new Error('Connected account not found');
        }

        const account = accounts[0];

        // Get project/video
        const projects = await base44.asServiceRole.entities.Project.filter({
          id: post.project_id,
        });

        if (projects.length === 0) {
          throw new Error('Project not found');
        }

        const project = projects[0];

        // Prepare upload for platform
        const uploadPayload = {
          platform: account.platform,
          account_id: account.id,
          account_name: account.account_name,
          video_id: project.id,
          caption: post.caption,
          hashtags: post.hashtags,
          thumbnail_url: post.thumbnail_url,
          video_url: project.video_url,
        };

        console.log(`[AutoPublish] 📤 Uploading "${post.project_title}" to ${account.platform}...`);

        // Call platform-specific upload function
        const uploadResult = await publishToSocial(uploadPayload, account.access_token);

        // Update post status
        await base44.asServiceRole.entities.ScheduledPost.update(post.id, {
          status: 'published',
          publish_results: {
            [account.platform]: {
              url: uploadResult.url,
              platform_id: uploadResult.platform_id,
              timestamp: new Date().toISOString(),
            },
          },
        });

        console.log(`[AutoPublish] ✅ Published to ${account.platform}: ${uploadResult.url}`);
        successCount++;
      } catch (error) {
        console.error(`[AutoPublish] ❌ Failed to publish post ${post.id}:`, error.message);

        // Update post with error
        await base44.asServiceRole.entities.ScheduledPost.update(post.id, {
          status: 'failed',
          error_type: 'upload_failed',
          error_message: error.message,
        }).catch(() => {});

        failedCount++;
      }
    }

    console.log(`[AutoPublish] ✅ Complete: ${successCount} published, ${failedCount} failed`);

    return Response.json({
      processed: duePosts.length,
      success: successCount,
      failed: failedCount,
    });
  } catch (error) {
    console.error('[AutoPublish] Fatal error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

/**
 * Platform-specific upload handler
 */
async function publishToSocial(uploadPayload, accessToken) {
  const { platform, caption, hashtags, video_url, account_name } = uploadPayload;

  // Placeholder implementation - in production, call actual platform APIs
  console.log(`[Upload] ${platform.toUpperCase()}: ${account_name}`);
  console.log(`[Upload] Caption: ${caption}`);
  console.log(`[Upload] Video: ${video_url}`);

  switch (platform) {
    case 'tiktok':
      return await uploadToTikTok(uploadPayload, accessToken);
    case 'youtube':
      return await uploadToYouTube(uploadPayload, accessToken);
    case 'instagram':
      return await uploadToInstagram(uploadPayload, accessToken);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Upload to TikTok
 */
async function uploadToTikTok(payload, accessToken) {
  // TikTok API integration would go here
  // For now, return mock response
  const mockId = 'ttk_' + Math.random().toString(36).slice(2);
  return {
    platform_id: mockId,
    url: `https://tiktok.com/@${payload.account_name}/video/${mockId}`,
  };
}

/**
 * Upload to YouTube
 */
async function uploadToYouTube(payload, accessToken) {
  // YouTube API integration would go here
  // For now, return mock response
  const mockId = 'yt_' + Math.random().toString(36).slice(2);
  return {
    platform_id: mockId,
    url: `https://youtube.com/shorts/${mockId}`,
  };
}

/**
 * Upload to Instagram
 */
async function uploadToInstagram(payload, accessToken) {
  // Instagram Graph API integration would go here
  // For now, return mock response
  const mockId = 'ig_' + Math.random().toString(36).slice(2);
  return {
    platform_id: mockId,
    url: `https://instagram.com/reel/${mockId}`,
  };
}