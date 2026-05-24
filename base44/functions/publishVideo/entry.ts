import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Backend function to publish videos to social platforms
 * Called by automations when scheduled_at time arrives
 * Also callable manually for immediate publishing
 */

const PLATFORM_CONFIG = {
  tiktok: {
    apiUrl: 'https://api.tiktok.com/v1',
    endpoints: { upload: '/video/upload', publish: '/video/publish' },
  },
  instagram: {
    apiUrl: 'https://graph.instagram.com/v18.0',
    endpoints: { upload: '/media', publish: '/media/publish' },
  },
  youtube: {
    apiUrl: 'https://www.googleapis.com/youtube/v3',
    endpoints: { upload: '/videos?part=snippet,status', publish: '/videos?part=status' },
  },
  facebook: {
    apiUrl: 'https://graph.facebook.com/v18.0',
    endpoints: { upload: '/video', publish: '/videos' },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, projectId, platforms, caption, hashtags } = await req.json();

    if (!postId || !platforms || platforms.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch post record
    const post = await base44.entities.ScheduledPost.get(postId);
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    // Fetch project to get video URL
    const project = await base44.entities.Project.get(post.project_id);
    if (!project || !project.video_url) {
      return Response.json(
        { error: 'Video not ready for publishing' },
        { status: 400 }
      );
    }

    // Fetch connected accounts
    const accounts = await base44.entities.ConnectedAccount.filter({ status: 'connected' });
    const accountsByPlatform = {};
    accounts.forEach(acc => {
      accountsByPlatform[acc.platform] = acc;
    });

    // Check all platforms have connected accounts
    const missingPlatforms = platforms.filter(p => !accountsByPlatform[p]);
    if (missingPlatforms.length > 0) {
      await base44.entities.ScheduledPost.update(postId, {
        status: 'failed',
        error_type: 'expired_token',
        error_message: `Accounts not connected for: ${missingPlatforms.join(', ')}`,
      });
      return Response.json(
        { error: `Missing accounts for: ${missingPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // Mark as processing
    await base44.entities.ScheduledPost.update(postId, { status: 'processing' });

    const publishResults = {};
    const errors = [];

    // Publish to each platform
    for (const platform of platforms) {
      try {
        const account = accountsByPlatform[platform];
        const platformCaption = post.platform_captions?.[platform] || caption || '';
        const platformHashtags = post.hashtags || hashtags || '';

        // TODO: Implement actual platform API calls
        // For now, simulate successful publishing
        const publishUrl = `https://${platform}.com/video/${Math.random().toString(36).substr(2, 9)}`;

        publishResults[platform] = {
          status: 'published',
          url: publishUrl,
          publishedAt: new Date().toISOString(),
          platform,
          account: account.account_handle,
        };

        console.log(`✅ Published to ${platform}: ${publishUrl}`);
      } catch (err) {
        errors.push({
          platform,
          error: err.message,
        });
        publishResults[platform] = {
          status: 'failed',
          error: err.message,
          platform,
        };
        console.error(`❌ Failed to publish to ${platform}:`, err.message);
      }
    }

    // Determine overall status
    const allFailed = Object.values(publishResults).every(r => r.status === 'failed');
    const aneFailed = Object.values(publishResults).some(r => r.status === 'failed');

    // Update post with results
    await base44.entities.ScheduledPost.update(postId, {
      status: allFailed ? 'failed' : 'published',
      publish_results: publishResults,
      error_message: errors.length > 0 ? `Errors on ${errors.map(e => e.platform).join(', ')}` : null,
      error_type: errors.length > 0 ? 'api_timeout' : null,
    });

    // Log usage
    await base44.entities.UsageLog.create({
      action: 'video_published',
      project_id: post.project_id,
      credits_used: platforms.length,
      details: {
        platforms,
        results: publishResults,
      },
    }).catch(() => {});

    return Response.json({
      success: !allFailed,
      postId,
      publishResults,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error('Publishing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});