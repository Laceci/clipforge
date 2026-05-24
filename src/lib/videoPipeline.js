/**
 * ClipForge Video Generation Pipeline
 * Orchestrates script → scenes → visuals → voiceover → captions → final video
 */
import { base44 } from '@/api/base44Client';
import { splitScriptByVoicePacing, computeSceneTiming, buildCaptionSegments } from './timingEngine';
import { suggestTransitions, selectMusicByMood, assignVisualEffects } from './aiEnhancements';
import {
  buildCinematicVideoPrompt,
  buildEmotionalVideoPrompt,
  buildActionVideoPrompt,
  generateVideoClipRequest,
} from './cinematicPromptBuilder';
import { getVisualModeForCategory } from './cinematicStorytellingEngine';
import { generateSceneDirectorReport, prepareDirectedScenesForPipeline } from './sceneDirector';
import { logQualityStandards, generateQualityReport } from './cinematographyQA';

const PIPELINE_STEPS = [
  { key: 'script',      label: 'Generating script...',                         progress: 7   },
  { key: 'splitting',   label: 'Splitting into scenes...',                      progress: 15  },
  { key: 'analysis',    label: 'Analyzing cinematic storytelling...',           progress: 27  },
  { key: 'prompts',     label: 'Building video generation prompts...',          progress: 35  },
  { key: 'visuals',     label: 'Generating cinematic video clips...',           progress: 68  },
  { key: 'consistency', label: 'Ensuring visual consistency...',                progress: 75  },
  { key: 'music',       label: 'AI: Selecting music by mood...',                progress: 82  },
  { key: 'captions',    label: 'Syncing captions...',                           progress: 87  },
  { key: 'voiceover',   label: 'Generating AI voiceover...',                    progress: 91  },
  { key: 'rendering',   label: 'Rendering final MP4 (this may take ~1 min)...', progress: 97  },
  { key: 'complete',    label: 'Video ready!',                                  progress: 100 },
];

export async function runVideoPipeline(projectData, onProgress) {
  const step = (key, label) => {
    const s = PIPELINE_STEPS.find(p => p.key === key);
    onProgress?.({ step: key, progress: s.progress, label: label || s.label });
  };

  // Log quality standards
  logQualityStandards();

  console.log('[ClipForge] 🚀 Pipeline started');
  console.log(`[ClipForge] 📋 Topic: "${projectData.topic}", Category: ${projectData.template_category}`);

  // Step 0: Generate script if only topic provided
  step('script');
  let script = projectData.script?.trim() || '';
  if (!script && projectData.topic) {
    try {
      const generated = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a viral short-form video scriptwriter. Write a compelling ${projectData.duration_target || '60s'} script for a faceless vertical video.

Topic/Hook: "${projectData.topic}"
Category: ${projectData.template_category || 'custom'}
Voice tone: ${projectData.voice_style || 'motivational'}

Requirements:
- Short punchy sentences, each 1-2 sentences max
- Emotional hooks and cliffhangers
- 5-8 scenes/segments
- Mark scene breaks with [SCENE]
- No stage directions, only narration text
- Viral-worthy opening hook

Output the script only.`,
      });
      script = typeof generated === 'string' ? generated : generated.toString();
    } catch (err) {
      const detail = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'unknown';
      throw new Error(`Script generation failed: ${detail}`);
    }
  }

  console.log(`[ClipForge] ✍️ Script ready (${script.split(' ').length} words)`);
  step('splitting', 'Splitting into scenes...');
  // Use voice-pacing-aware splitter first (instant, no LLM call needed)
  const voiceSettings = {
    voice_speed: projectData.voice_speed,
    voice_pause: projectData.voice_pause,
    voice_emphasis: projectData.voice_emphasis,
  };
  const rawScenes = splitScriptByVoicePacing(script, voiceSettings, 60);

  // Step 2: Analyze scenes for cinematic storytelling
  step('analysis', 'Analyzing cinematic storytelling...');
  const cinematicMode = getVisualModeForCategory(projectData.template_category || 'custom');

  const scenesWithAnalysis = rawScenes.map((scene, i) => ({
    ...scene,
    order: i,
    duration: Math.ceil((scene.text.split(/\s+/).length / 130) * projectData.voice_speed || 1),
    cinematicMode,
  }));

  // Step 3: Generate video clip prompts (not image prompts)
  step('prompts', 'Building video clip generation prompts...');
  const scenesWithPrompts = scenesWithAnalysis.map((scene, i) => {
    // Build cinematic video generation prompt
    const sceneSpec = buildCinematicVideoPrompt(
      scene.text,
      cinematicMode,
      scene.duration
    );

    console.log(`[ClipForge] 🎬 Scene ${i + 1} - Video clip spec: ${sceneSpec.mood} mood, ${sceneSpec.action} action`);

    return {
      ...scene,
      sceneSpec,
      generatedPrompt: sceneSpec.generatedPrompt,
    };
  });

  console.log(`[ClipForge] ✂️ Split into ${scenesWithPrompts.length} scenes`);

  // Step 3.5: Scene Director Analysis
  step('analysis', 'Scene director analyzing cinematography...');
  const directorReport = generateSceneDirectorReport(
    scenesWithPrompts.map(s => ({ text: s.text })),
    voiceSettings
  );
  console.log(`[ClipForge] 🎬 Scene Director: ${directorReport.total_scenes} scenes analyzed`);
  console.log(`[ClipForge] 📊 Mood distribution: ${JSON.stringify(directorReport.mood_distribution)}`);
  console.log(`[ClipForge] 📹 Camera variety: ${directorReport.camera_variety.variety_score.toFixed(0)}% (${directorReport.camera_variety.unique_angles} angles)`);

  // Merge director analysis with prompt data
  const scenesWithDirection = scenesWithPrompts.map((scene, i) => ({
    ...scene,
    directedScene: directorReport.scenes[i],
  }));

  // Step 4: Generate cinematic video clips — two-phase: submit fast, poll from frontend.
  // This avoids 502s caused by Base44's hard serverless function execution timeout.
  step('visuals', 'Generating cinematic video clips...');

  const invokeWithTimeout = (fnName, payload, timeoutMs = 300000) => {
    const call = base44.functions.invoke(fnName, payload);
    const timer = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${fnName} timed out after ${timeoutMs / 1000}s — try again or switch to a different provider`)), timeoutMs)
    );
    return Promise.race([call, timer]);
  };

  // Phase 1: Submit all jobs in parallel (each call returns immediately with request_id or direct result)
  const submissions = await Promise.all(scenesWithDirection.map(async (scene, i) => {
    const directed = scene.directedScene;
    console.log(`[ClipForge] 🎬 Scene ${i + 1} - ${directed?.mood || 'neutral'} mood`);
    const cleanSceneText = (scene.text || '').replace(/\[SCENE\]/gi, '').replace(/\s+/g, ' ').trim();
    const payload = {
      sceneText: cleanSceneText,
      sceneIndex: i,
      duration: scene.duration || 5,
      mood: directed?.mood || 'neutral',
      action: directed?.setting || '',
      visualMode: cinematicMode,
      visualStyle: projectData.visual_style || 'cinematic',
      resolution: projectData.resolution || '1080p',
      provider: projectData.video_provider || null,
    };
    try {
      const result = await base44.functions.invoke('generateVideoClip', payload);
      return { scene, i, directed, payload, data: result.data, done: !result.data?.pending };
    } catch (err) {
      const detail = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'unknown';
      throw new Error(`Scene ${i + 1} clip failed: ${detail}`);
    }
  }));

  // Phase 2: Poll all pending scenes from the frontend every 5s (up to 5 min)
  const entries = [...submissions];
  for (let poll = 0; poll < 60; poll++) {
    const pending = entries.filter(e => !e.done);
    if (pending.length === 0) break;
    console.log(`[ClipForge] ⏳ Polling ${pending.length} pending scene(s)... (attempt ${poll + 1})`);
    await new Promise(r => setTimeout(r, 5000));
    await Promise.all(pending.map(async (entry) => {
      try {
        const pollResult = await base44.functions.invoke('generateVideoClip', {
          ...entry.payload,
          request_id: entry.data.request_id,
          status_url: entry.data.status_url,
          result_url: entry.data.result_url,
        });
        if (!pollResult.data?.pending) {
          entry.data = pollResult.data;
          entry.done = true;
        }
      } catch (err) {
        const detail = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'unknown';
        throw new Error(`Scene ${entry.i + 1} clip failed during polling: ${detail}`);
      }
    }));
  }

  const timedOut = entries.filter(e => !e.done);
  if (timedOut.length > 0) {
    throw new Error(`${timedOut.length} scene(s) timed out after 5 minutes. Try again or switch provider.`);
  }

  const scenesWithClips = entries.map(({ scene, i, directed, data: clipData }) => {
    if (!clipData?.image_url && !clipData?.video_url) {
      const reason = clipData?.failure_reason || 'empty_response';
      console.error(`[ClipForge] ❌ Scene ${i + 1} failed. Reason: ${reason}`);
      throw new Error(`Scene ${i + 1} generation failed: ${reason}. ${clipData?.error || ''}`);
    }
    console.log(`[ClipForge] ✅ Scene ${i + 1}: ${clipData.clip_type} via ${clipData.provider_used}`);
    return {
      ...scene,
      video_url: clipData.video_url || null,
      image_url: clipData.image_url || clipData.video_url,
      clip_type: clipData.clip_type || 'image-preview',
      provider_used: clipData.provider_used,
      clip_duration: directed?.clip_duration || scene.duration || 5,
      clip_mood: directed?.mood || 'neutral',
    };
  });

  // Step 5: Visual consistency check
  step('consistency', 'Ensuring visual consistency...');
  const scenesWithConsistency = scenesWithClips.map((scene, i) => ({
    ...scene,
    visualization_mode: cinematicMode,
    visual_consistency_tier: calculateConsistencyTier(scenesWithClips, i),
  }));

  // Step 6: AI — Select music by mood
  step('music', 'AI: Selecting music by mood...');
  let musicMeta = { music_track: projectData.music_track || 'epic_cinematic' };
  try {
    musicMeta = await selectMusicByMood(script, projectData.topic, projectData.template_category, projectData.music_track);
    console.log(`[ClipForge] 🎵 AI music: ${musicMeta.music_track} (${musicMeta.music_mood}, energy: ${musicMeta.music_energy})`);
  } catch (e) {
    console.warn('[ClipForge] ⚠️ Music selection failed, using preset:', e.message);
  }

  // Step 7: Sync captions to voice timing
  step('captions', 'Syncing captions...');
  const timedScenes = computeSceneTiming(scenesWithConsistency, voiceSettings);
  const captionStyle = projectData.caption_style || 'tiktok_bold';
  const highlightColor = projectData.highlight_color || '#A3E635';

  const scenesWithCaptions = timedScenes.map(scene => {
    const segments = buildCaptionSegments(scene.caption_tokens, captionStyle, highlightColor);
    return {
      ...scene,
      caption: scene.text,
      caption_segments: segments,
      caption_tokens: undefined,
    };
  });
  console.log(`[ClipForge] 📝 Captions synced for ${scenesWithCaptions.length} video clips`);

  // Compute totals + validate before kicking off the slow render step
  const totalDuration = scenesWithCaptions.reduce((sum, s) => sum + (s.duration || s.clip_duration || 5), 0);
  const thumbnail = scenesWithCaptions[0]?.image_url || scenesWithCaptions[0]?.video_url || '';

  const videoClipCount = scenesWithCaptions.filter(s => s.video_url && s.clip_type === 'cinematic-video').length;
  const imageCount = scenesWithCaptions.filter(s => s.image_url).length;

  console.log(`[ClipForge] 🎬 Scenes validated: ${videoClipCount} video clips, ${imageCount} image frames`);
  console.log(`[ClipForge] 🎥 Cinematic mode: ${cinematicMode} | Duration: ${Math.round(totalDuration)}s`);
  console.log(`[ClipForge] 🔧 Provider: ${projectData.video_provider || 'image_fallback'}`);

  if (imageCount === 0 && videoClipCount === 0) {
    console.error('[ClipForge] ❌ No visual content generated');
    throw new Error('No clips were generated. Check your video provider settings or retry.');
  }

  // Step 8+9: ElevenLabs voiceover + Creatomate MP4 render — two-phase to avoid server timeouts.
  // Phase 1: submit (EL + upload + queue render) → get render_id immediately.
  // Phase 2: poll render status from frontend every 10s (renders take 2-10 min).
  step('voiceover', 'Generating AI voiceover...');

  let video_url = null;
  try {
    const renderPayload = {
      script,
      voice_id:       projectData.voice_id || 'morgan_deep',
      voice_speed:    projectData.voice_speed || 1.0,
      scenes: scenesWithCaptions.map(s => ({
        image_url: s.image_url || null,
        video_url: s.video_url || null,
        duration:  s.clip_duration || s.duration || 5,
        caption:   (s.text || s.caption || '').replace(/\[SCENE\]/gi, '').trim(),
      })),
      caption_style:   captionStyle,
      highlight_color: highlightColor,
      resolution:      projectData.resolution || '1080p',
    };

    console.log('[ClipForge] 🎙 Submitting render job via generateVideoClip (ElevenLabs + Creatomate)...');
    const submitResult = await base44.functions.invoke('generateVideoClip', {
      ...renderPayload,
      render_mode: 'render_submit',
    });
    const submitData = submitResult.data;

    if (submitData?.video_url) {
      video_url = submitData.video_url;
      console.log(`[ClipForge] 🎬 Final MP4 ready: ${video_url}`);
    } else if (submitData?.render_id) {
      step('rendering', 'Rendering final MP4 (this takes 2-5 min)...');
      console.log(`[ClipForge] ⏳ Render job queued: ${submitData.render_id}. Polling...`);

      for (let poll = 0; poll < 72; poll++) {
        await new Promise(r => setTimeout(r, 10000));
        console.log(`[ClipForge] 🔄 Render poll ${poll + 1}/72...`);

        const pollResult = await base44.functions.invoke('generateVideoClip', {
          render_mode: 'render_poll',
          render_id: submitData.render_id,
        });
        const pollData = pollResult.data;

        if (pollData?.video_url) {
          video_url = pollData.video_url;
          console.log(`[ClipForge] 🎬 Final MP4 ready: ${video_url}`);
          break;
        }
        if (!pollData?.pending) {
          console.warn('[ClipForge] ⚠️ Unexpected poll response:', pollData);
          break;
        }
      }

      if (!video_url) {
        console.warn('[ClipForge] ⚠️ Render timed out after 12 min — preview still available');
      }
    } else {
      console.warn('[ClipForge] ⚠️ renderFinalVideo returned no render_id:', submitData);
    }
  } catch (renderErr) {
    console.warn(`[ClipForge] ⚠️ Final render skipped (preview still available): ${renderErr.message}`);
  }

  step('complete', 'Video ready!');
  console.log(`[ClipForge] ✅ Pipeline complete — ${videoClipCount > 0 ? videoClipCount + ' video clips' : imageCount + ' image frames'} | download: ${video_url ? 'yes' : 'no (configure API keys)'}`);

  return {
    scenes: scenesWithCaptions,
    thumbnail_url: thumbnail,
    duration: totalDuration,
    status: 'ready',
    generation_progress: 100,
    cinematicMode,
    videoClipCount,
    imageCount,
    video_url,      // ← null if render failed/skipped; real CDN URL if succeeded
    ...musicMeta,
  };
}

/**
 * Calculate visual consistency tier
 */
function calculateConsistencyTier(scenes, currentIndex) {
  const videoClips = scenes.filter(s => s.clip_type === 'cinematic-video').length;
  const total = scenes.length;
  
  if (videoClips === total) return 'high';
  if (videoClips >= total * 0.8) return 'medium-high';
  if (videoClips >= total * 0.5) return 'medium';
  return 'fallback-heavy';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}