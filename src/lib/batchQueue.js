/**
 * Batch video generation queue
 * Manages a list of script → video jobs, running them sequentially.
 */
import { base44 } from '@/api/base44Client';
import { runVideoPipeline } from './videoPipeline';
import { autoSelectSettings } from './voiceSystem';

export function buildJobFromScript(script, overrides = {}) {
  const autoSettings = autoSelectSettings(script.category || 'custom');
  return {
    id: `job_${script.id}_${Date.now()}`,
    scriptId: script.id,
    title: script.title,
    content: script.content,
    category: script.category,
    status: 'queued', // queued | running | done | failed
    progress: 0,
    progressLabel: '',
    projectId: null,
    error: null,
    // pipeline settings (can be overridden)
    ...autoSettings,
    voice_speed: overrides.voice_speed ?? autoSettings.voice_speed,
    visual_style: overrides.visual_style ?? autoSettings.visual_style,
    caption_style: overrides.caption_style ?? 'tiktok_bold',
    highlight_color: overrides.highlight_color ?? '#A3E635',
    animation_style: overrides.animation_style ?? autoSettings.animation_style,
    resolution: overrides.resolution ?? '1080p',
  };
}

/**
 * Runs a batch queue sequentially.
 * @param {Array} jobs - Array of job objects from buildJobFromScript
 * @param {Function} onJobUpdate - Called with (jobId, updates) on every status change
 */
export async function runBatchQueue(jobs, onJobUpdate) {
  for (const job of jobs) {
    onJobUpdate(job.id, { status: 'running', progress: 0 });

    try {
      const projectData = {
        script: job.content,
        topic: job.title,
        template_category: job.category,
        voice_style: job.voice_style,
        voice_speed: job.voice_speed,
        visual_style: job.visual_style,
        caption_style: job.caption_style,
        highlight_color: job.highlight_color,
        animation_style: job.animation_style,
        resolution: job.resolution,
        duration_target: '60s',
      };

      // Create project record
      const project = await base44.entities.Project.create({
        title: job.title,
        status: 'generating',
        template_category: job.category,
        generation_progress: 0,
        ...projectData,
      });

      const result = await runVideoPipeline(projectData, (prog) => {
        onJobUpdate(job.id, { progress: prog.progress, progressLabel: prog.label });
        base44.entities.Project.update(project.id, {
          generation_progress: prog.progress,
          status: 'generating',
        }).catch(() => {});
      });

      await base44.entities.Project.update(project.id, {
        ...result,
        title: job.title,
        thumbnail_url: result.scenes?.[0]?.image_url || '',
        status: 'ready',
      });

      onJobUpdate(job.id, { status: 'done', progress: 100, projectId: project.id });
    } catch (err) {
      onJobUpdate(job.id, { status: 'failed', error: err.message || 'Unknown error' });
    }
  }
}