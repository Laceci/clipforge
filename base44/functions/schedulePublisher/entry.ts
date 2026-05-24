import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Scheduled automation function
 * Runs every 5 minutes to check for posts ready to publish
 * and publishes them automatically
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find all scheduled posts ready to publish
    const now = new Date();
    const allPosts = await base44.asServiceRole.entities.ScheduledPost.list('-created_date');

    const readyPosts = allPosts.filter(p => {
      if (p.status !== 'scheduled') return false;
      if (!p.scheduled_at) return false;

      const scheduledTime = new Date(p.scheduled_at);
      return scheduledTime <= now;
    });

    console.log(`[Scheduler] Found ${readyPosts.length} posts ready to publish`);

    const results = [];

    // Process each ready post
    for (const post of readyPosts) {
      try {
        // Call the publish function
        const publishRes = await base44.asServiceRole.functions.invoke('publishVideo', {
          postId: post.id,
          projectId: post.project_id,
          platforms: post.platforms,
          caption: post.caption,
          hashtags: post.hashtags,
        });

        results.push({
          postId: post.id,
          status: publishRes.success ? 'published' : 'failed',
          platforms: post.platforms,
        });

        console.log(`✅ Published post ${post.id} to ${post.platforms.join(', ')}`);
      } catch (err) {
        console.error(`❌ Failed to publish post ${post.id}:`, err.message);
        results.push({
          postId: post.id,
          status: 'error',
          error: err.message,
        });
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Scheduler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});