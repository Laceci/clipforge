import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Entity automation triggered when a Project is created/updated
 * If auto_publish is enabled on the project, creates a ScheduledPost
 */

Deno.serve(async (req) => {
  try {
    // ── Phase 2: Social publishing is not yet implemented ──────────────────
    // Auto-publishing is disabled for MVP. Re-enable after OAuth and real
    // platform API calls are wired in publishVideo/entry.ts.
    return Response.json({ success: true, message: 'Auto-publish disabled (Phase 2 feature)' });

    // eslint-disable-next-line no-unreachable
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data } = await req.json();

    // Check if this is a project creation or update with auto_publish enabled
    if (event.type !== 'create' && event.type !== 'update') {
      return Response.json({ success: true });
    }

    const project = data;

    // Auto-publish must be enabled and video must be ready
    if (!project.auto_publish_enabled || project.status !== 'ready') {
      return Response.json({ success: true });
    }

    // Check if platforms are selected
    if (!project.auto_publish_platforms || project.auto_publish_platforms.length === 0) {
      return Response.json({ success: true });
    }

    // Check if ScheduledPost already exists for this project
    const existing = await base44.entities.ScheduledPost.filter({
      project_id: project.id,
      auto_publish: true,
    });

    if (existing.length > 0) {
      console.log(`Auto-publish post already exists for project ${project.id}`);
      return Response.json({ success: true });
    }

    // Create a ScheduledPost with immediate publish (scheduled_at = null)
    const post = await base44.entities.ScheduledPost.create({
      project_id: project.id,
      project_title: project.title,
      thumbnail_url: project.thumbnail_url,
      platforms: project.auto_publish_platforms,
      caption: project.auto_publish_caption || project.script || '',
      hashtags: project.auto_publish_hashtags || '',
      scheduled_at: null, // Publish immediately
      status: 'scheduled',
      auto_publish: true,
    });

    console.log(`✅ Created auto-publish post ${post.id} for project ${project.id}`);

    // Immediately trigger publishing
    await base44.asServiceRole.functions.invoke('publishVideo', {
      postId: post.id,
      projectId: project.id,
      platforms: project.auto_publish_platforms,
      caption: project.auto_publish_caption || project.script || '',
      hashtags: project.auto_publish_hashtags || '',
    }).catch(err => {
      console.error('Auto-publish error:', err.message);
    });

    return Response.json({
      success: true,
      postId: post.id,
      platforms: project.auto_publish_platforms,
    });
  } catch (error) {
    console.error('Auto-publish automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});