import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * ClipForge Video Clip Generator
 * Supports: fal.ai (video), Runway ML, Luma AI, with image fallback
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const {
      sceneText,
      sceneIndex,
      duration = 5,
      mood = 'neutral',
      action = '',
      visualMode = 'cinematic_realism',
      visualStyle = 'cinematic',
      resolution = '1080p',
      provider = null, // override from settings
    } = payload;

    // Determine which provider to use
    const selectedProvider = provider
      || Deno.env.get('VIDEO_PROVIDER')
      || 'image_fallback';

    console.log(`[ClipForge] 🎬 Scene ${sceneIndex} | Provider: ${selectedProvider}`);
    console.log(`[ClipForge] 📝 Prompt: "${sceneText.slice(0, 60)}..."`);
    console.log(`[ClipForge] ⚙️ Duration: ${duration}s | Mood: ${mood} | Style: ${visualStyle}`);

    const visualPrompt = buildVisualPrompt(sceneText, mood, action, visualMode, visualStyle);

    let result;

    if (selectedProvider === 'fal_video') {
      result = await generateWithFal(visualPrompt, duration, resolution);
    } else if (selectedProvider === 'runway') {
      result = await generateWithRunway(visualPrompt, duration, resolution);
    } else if (selectedProvider === 'luma') {
      result = await generateWithLuma(visualPrompt, duration);
    } else if (selectedProvider === 'higgsfield') {
      result = await generateWithHiggsfield(base44, visualPrompt, sceneText, duration);
    } else {
      // Default: use ClipForge built-in image generation (always works)
      result = await generateWithImageFallback(base44, visualPrompt, sceneText);
    }

    console.log(`[ClipForge] ✅ Scene ${sceneIndex} done | URL: ${result.url}`);
    console.log(`[ClipForge] 📊 Type: ${result.type} | Provider used: ${result.provider}`);

    return Response.json({
      video_url: result.type === 'video' ? result.url : null,
      image_url: result.url,
      scene_index: sceneIndex,
      duration,
      mood,
      clip_type: result.type === 'video' ? 'cinematic-video' : 'image-preview',
      provider_used: result.provider,
      status: 'generated',
    });

  } catch (error) {
    const reason = classifyError(error);
    console.error(`[ClipForge] ❌ Scene generation failed: ${error.message}`);
    console.error(`[ClipForge] 🔍 Failure reason: ${reason}`);
    return Response.json(
      { error: error.message, failure_reason: reason },
      { status: 500 }
    );
  }
});

// ─── Prompt Builder ──────────────────────────────────────────────────────────

function buildVisualPrompt(sceneText, mood, action, visualMode, visualStyle) {
  const moodMap = {
    neutral: 'natural lighting, balanced composition',
    dramatic: 'high contrast dramatic lighting, cinematic shadows',
    energetic: 'dynamic composition, vibrant colors, motion blur',
    calm: 'soft golden hour lighting, peaceful serene atmosphere',
    intense: 'dark moody atmosphere, intense close-up framing',
    inspirational: 'uplifting warm light, expansive landscape, motivational',
  };
  const moodDesc = moodMap[mood] || moodMap.neutral;

  return `Cinematic ${visualStyle} scene: ${sceneText}. ${moodDesc}. ${action ? `Action: ${action}.` : ''} Professional cinematography, 9:16 vertical format, photorealistic, broadcast quality, no text or watermarks.`;
}

// ─── fal.ai — MiniMax Video-01 (text-to-video) ──────────────────────────────
// Uses fal.ai's async queue pattern: submit → poll status → fetch result.
// MiniMax Video-01 generates realistic cinematic clips from text descriptions.
// No input image required — true text-to-video.

async function generateWithFal(prompt, duration, resolution) {
  const apiKey = Deno.env.get('FAL_API_KEY');
  if (!apiKey) throw new Error('FAL_API_KEY not configured. Add it in Base44 → Functions → Environment Variables.');

  const MODEL = 'fal-ai/minimax/video-01';

  console.log(`[ClipForge/fal] 🎬 MiniMax text-to-video | duration hint: ${duration}s`);
  console.log(`[ClipForge/fal] 📝 Prompt: "${prompt.slice(0, 80)}..."`);

  // ── 1. Submit to fal.ai async queue ────────────────────────────────────────
  const submitRes = await fetch(`https://queue.fal.run/${MODEL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Append vertical format hint — MiniMax respects this in the prompt
      prompt: `${prompt} Vertical portrait orientation, 9:16 aspect ratio, cinematic.`,
      prompt_optimizer: true, // MiniMax feature: auto-enhances weak prompts
    }),
  });

  console.log(`[ClipForge/fal] Queue submit: ${submitRes.status}`);

  if (!submitRes.ok) {
    const body = await submitRes.text();
    if (submitRes.status === 401) throw new Error('FAL_API_KEY is invalid or expired.');
    if (submitRes.status === 402) throw new Error('fal.ai credits exhausted. Top up at fal.ai/dashboard.');
    if (submitRes.status === 422) throw new Error(`fal.ai rejected the request: ${body.slice(0, 150)}`);
    throw new Error(`fal.ai ${submitRes.status}: ${body.slice(0, 200)}`);
  }

  const queueData = await submitRes.json();
  const requestId = queueData.request_id;

  if (!requestId) {
    console.error('[ClipForge/fal] Unexpected queue response:', JSON.stringify(queueData));
    throw new Error('fal.ai did not return a request ID. Check your FAL_API_KEY permissions.');
  }

  // fal.ai returns pre-built URLs for status and result
  const statusUrl = queueData.status_url
    || `https://queue.fal.run/${MODEL}/requests/${requestId}/status`;
  const resultUrl = queueData.response_url
    || `https://queue.fal.run/${MODEL}/requests/${requestId}`;

  console.log(`[ClipForge/fal] Queued: ${requestId}. Polling...`);

  // ── 2. Poll status until complete (max 120 s, every 5 s) ──────────────────
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 5000));

    const statusRes = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${apiKey}` },
    });
    const statusData = await statusRes.json();
    const status = statusData.status;
    console.log(`[ClipForge/fal] Poll ${i + 1}/24: ${status}`);

    if (status === 'COMPLETED') {
      // ── 3. Fetch the actual output ────────────────────────────────────────
      const resultRes = await fetch(resultUrl, {
        headers: { 'Authorization': `Key ${apiKey}` },
      });
      const result = await resultRes.json();

      // MiniMax returns { video: { url } }; handle alternate shapes defensively
      const url =
        result?.video?.url        ||
        result?.output?.video?.url ||
        result?.output?.url        ||
        result?.url;

      if (!url) {
        console.error('[ClipForge/fal] Result with no URL:', JSON.stringify(result));
        throw new Error('fal.ai completed but returned no video URL. Check Base44 function logs.');
      }

      console.log(`[ClipForge/fal] ✅ Video ready: ${url}`);
      return { url, type: 'video', provider: 'fal_video' };
    }

    if (status === 'FAILED') {
      const reason = statusData.error?.message || statusData.detail || 'unknown reason';
      throw new Error(`fal.ai MiniMax generation failed: ${reason}`);
    }

    // IN_QUEUE | IN_PROGRESS — keep polling
  }

  throw new Error('fal.ai MiniMax timed out after 120 seconds. Try again or switch to image_fallback.');
}

// ─── Runway ML ───────────────────────────────────────────────────────────────

async function generateWithRunway(prompt, duration, resolution) {
  const apiKey = Deno.env.get('RUNWAY_API_KEY');
  if (!apiKey) throw new Error('RUNWAY_API_KEY not configured. Add it in Settings → Video Provider.');

  console.log(`[ClipForge/runway] Requesting Gen-3 video: ${duration}s`);

  // Runway Gen-3 Alpha Turbo
  const submitRes = await fetch('https://api.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({
      model: 'gen3a_turbo',
      promptText: prompt,
      duration: duration <= 5 ? 5 : 10,
      ratio: '768:1280',
      watermark: false,
    }),
  });

  console.log(`[ClipForge/runway] Submit status: ${submitRes.status}`);

  if (!submitRes.ok) {
    const body = await submitRes.text();
    if (submitRes.status === 401) throw new Error('RUNWAY_API_KEY is invalid.');
    if (submitRes.status === 429) throw new Error('Runway rate limit hit. Try again in a moment.');
    throw new Error(`Runway returned ${submitRes.status}: ${body.slice(0, 200)}`);
  }

  const task = await submitRes.json();
  const taskId = task.id;
  if (!taskId) throw new Error('Runway did not return a task ID.');

  console.log(`[ClipForge/runway] Task queued: ${taskId}. Polling...`);

  // Poll for completion (max 90s)
  for (let i = 0; i < 18; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const pollRes = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' },
    });
    const pollData = await pollRes.json();
    console.log(`[ClipForge/runway] Poll ${i + 1}: status=${pollData.status}`);

    if (pollData.status === 'SUCCEEDED') {
      const url = pollData.output?.[0];
      if (!url) throw new Error('Runway task succeeded but returned no URL.');
      return { url, type: 'video', provider: 'runway' };
    }
    if (pollData.status === 'FAILED') {
      throw new Error(`Runway task failed: ${pollData.failure || 'unknown reason'}`);
    }
  }

  throw new Error('Runway task timed out after 90 seconds.');
}

// ─── Luma AI ─────────────────────────────────────────────────────────────────

async function generateWithLuma(prompt, duration) {
  const apiKey = Deno.env.get('LUMA_API_KEY');
  if (!apiKey) throw new Error('LUMA_API_KEY not configured. Add it in Settings → Video Provider.');

  console.log(`[ClipForge/luma] Requesting Dream Machine video`);

  const submitRes = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: '9:16',
      loop: false,
    }),
  });

  console.log(`[ClipForge/luma] Submit status: ${submitRes.status}`);

  if (!submitRes.ok) {
    const body = await submitRes.text();
    if (submitRes.status === 401) throw new Error('LUMA_API_KEY is invalid.');
    if (submitRes.status === 402) throw new Error('Luma AI credits exhausted.');
    throw new Error(`Luma returned ${submitRes.status}: ${body.slice(0, 200)}`);
  }

  const task = await submitRes.json();
  const taskId = task.id;
  if (!taskId) throw new Error('Luma did not return a generation ID.');

  console.log(`[ClipForge/luma] Generation queued: ${taskId}. Polling...`);

  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const pollRes = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const pollData = await pollRes.json();
    console.log(`[ClipForge/luma] Poll ${i + 1}: state=${pollData.state}`);

    if (pollData.state === 'completed') {
      const url = pollData.assets?.video;
      if (!url) throw new Error('Luma completed but returned no video URL.');
      return { url, type: 'video', provider: 'luma' };
    }
    if (pollData.state === 'failed') {
      throw new Error(`Luma generation failed: ${pollData.failure_reason || 'unknown'}`);
    }
  }

  throw new Error('Luma task timed out after 120 seconds.');
}

// ─── Image Fallback (always works via ClipForge built-in) ────────────────────

async function generateWithImageFallback(base44, visualPrompt, sceneText) {
  console.log(`[ClipForge/image] Generating cinematic still frame`);

  const result = await base44.asServiceRole.integrations.Core.GenerateImage({
    prompt: visualPrompt,
  });

  const url = result?.url;
  if (!url) throw new Error('Image generation returned no URL. Check integration credits.');

  console.log(`[ClipForge/image] Generated still frame: ${url}`);
  return { url, type: 'image', provider: 'image_fallback' };
}

// ─── Higgsfield AI (DoP model — image-to-video) ──────────────────────────────
// Higgsfield works best as a two-step process:
//   1. Generate a precise still image from the scene description
//   2. Animate that image with a cinematic camera movement via Higgsfield DoP
// This produces more consistent, higher-quality results than pure text-to-video.

async function generateWithHiggsfield(base44, visualPrompt, sceneText, duration) {
  const apiKey = Deno.env.get('HIGGSFIELD_API_KEY');
  if (!apiKey) throw new Error('HIGGSFIELD_API_KEY not configured. Add it in Base44 → Functions → Environment Variables.');

  // Higgsfield supports both key formats:
  //   - Simple token:      "Bearer sk-abc123"
  //   - Key ID + secret:   "Key KEY_ID:KEY_SECRET"
  const authHeader = apiKey.includes(':') ? `Key ${apiKey}` : `Bearer ${apiKey}`;

  // ── Step 1: Generate scene still image ─────────────────────────────────────
  console.log('[ClipForge/higgsfield] 🖼  Generating base image for scene...');
  const imageResult = await base44.asServiceRole.integrations.Core.GenerateImage({
    prompt: visualPrompt,
  });
  const imageUrl = imageResult?.url;
  if (!imageUrl) throw new Error('Higgsfield: base image generation returned no URL.');
  console.log(`[ClipForge/higgsfield] ✅ Base image: ${imageUrl}`);

  // ── Step 2: Build cinematic animation prompt ────────────────────────────────
  const animationPrompt = buildHiggsAnimationPrompt(sceneText);

  // ── Step 3: Submit to Higgsfield DoP ───────────────────────────────────────
  console.log(`[ClipForge/higgsfield] 🎬 Submitting DoP job | duration: ${duration}s`);

  const submitRes = await fetch('https://platform.higgsfield.ai/v1/image2video/dop', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        model: 'dop-turbo',
        prompt: animationPrompt,
        input_images: [{ type: 'image_url', image_url: imageUrl }],
        duration: Math.min(Math.max(duration, 3), 10), // Higgsfield range: 3-10s
      },
    }),
  });

  console.log(`[ClipForge/higgsfield] Submit status: ${submitRes.status}`);

  if (!submitRes.ok) {
    const body = await submitRes.text();
    if (submitRes.status === 401) throw new Error('HIGGSFIELD_API_KEY is invalid or expired.');
    if (submitRes.status === 402) throw new Error('Higgsfield credits exhausted. Top up at higgsfield.ai.');
    if (submitRes.status === 429) throw new Error('Higgsfield rate limit hit. Try again in a moment.');
    if (submitRes.status === 422) throw new Error(`Higgsfield rejected the request: ${body.slice(0, 150)}`);
    throw new Error(`Higgsfield ${submitRes.status}: ${body.slice(0, 200)}`);
  }

  const taskData = await submitRes.json();

  // Higgsfield may return request_id directly or nest it
  const requestId = taskData.request_id || taskData.id || taskData.requestId;
  if (!requestId) {
    console.error('[ClipForge/higgsfield] Unexpected response:', JSON.stringify(taskData));
    throw new Error('Higgsfield did not return a request ID. Check API key permissions.');
  }

  console.log(`[ClipForge/higgsfield] Task queued: ${requestId}. Polling...`);

  // ── Step 4: Poll for completion (max 90 s, every 5 s) ─────────────────────
  for (let i = 0; i < 18; i++) {
    await new Promise(r => setTimeout(r, 5000));

    const pollRes = await fetch(
      `https://platform.higgsfield.ai/requests/${requestId}/status`,
      { headers: { 'Authorization': authHeader } }
    );

    if (!pollRes.ok) {
      console.warn(`[ClipForge/higgsfield] Poll ${i + 1} returned ${pollRes.status} — retrying`);
      continue;
    }

    const pollData = await pollRes.json();
    const status = pollData.status?.toLowerCase();
    console.log(`[ClipForge/higgsfield] Poll ${i + 1}/18: status=${status}`);

    if (status === 'completed' || status === 'succeeded') {
      // Try all known response paths for the video URL
      const videoUrl =
        pollData.jobs?.[0]?.results?.raw?.url ||
        pollData.jobs?.[0]?.results?.url       ||
        pollData.result?.video?.url            ||
        pollData.video?.url                    ||
        pollData.output?.url                   ||
        pollData.url;

      if (!videoUrl) {
        console.error('[ClipForge/higgsfield] Completed but no URL found. Full response:', JSON.stringify(pollData));
        throw new Error('Higgsfield completed but returned no video URL. Check the Base44 function logs.');
      }

      console.log(`[ClipForge/higgsfield] ✅ Video ready: ${videoUrl}`);
      return { url: videoUrl, type: 'video', provider: 'higgsfield' };
    }

    if (status === 'failed' || status === 'error') {
      throw new Error(`Higgsfield generation failed: ${pollData.error || pollData.message || 'unknown reason'}`);
    }

    if (status === 'nsfw') {
      throw new Error('Higgsfield rejected the scene as NSFW. Adjust your visual prompt.');
    }
    // status: queued | in_progress | running — keep polling
  }

  throw new Error('Higgsfield task timed out after 90 seconds. Try a shorter duration or simpler scene.');
}

// ─── Higgsfield animation prompt builder ─────────────────────────────────────
// Produces concise cinematic motion directives that work well with DoP-turbo.
function buildHiggsAnimationPrompt(sceneText) {
  const text = sceneText.toLowerCase();

  // Pick a camera movement that fits the scene content
  let movement = 'slow cinematic push-in, smooth motion';

  if (text.includes('walk') || text.includes('move') || text.includes('run')) {
    movement = 'smooth tracking shot following subject, steady motion';
  } else if (text.includes('reveal') || text.includes('discover') || text.includes('open')) {
    movement = 'slow crane-up reveal, cinematic dolly';
  } else if (text.includes('intense') || text.includes('dramatic') || text.includes('dark')) {
    movement = 'slow push-in close-up, dramatic lighting shift';
  } else if (text.includes('sky') || text.includes('landscape') || text.includes('wide')) {
    movement = 'slow aerial pan, sweeping cinematic motion';
  } else if (text.includes('person') || text.includes('face') || text.includes('character')) {
    movement = 'gentle push-in portrait, subtle camera drift';
  }

  return `${movement}, 9:16 vertical frame, cinematic quality, photorealistic, broadcast quality, no text`;
}

// ─── Error Classifier ─────────────────────────────────────────────────────────

function classifyError(error) {
  const msg = error.message?.toLowerCase() || '';
  if (msg.includes('api_key') || msg.includes('not configured') || msg.includes('apikey')) return 'missing_api_key';
  if (msg.includes('invalid') && msg.includes('key')) return 'invalid_api_key';
  if (msg.includes('credits') || msg.includes('quota') || msg.includes('exhausted') || msg.includes('402')) return 'no_credits';
  if (msg.includes('timed out') || msg.includes('timeout')) return 'provider_timeout';
  if (msg.includes('empty') || msg.includes('no url')) return 'empty_response';
  if (msg.includes('422') || msg.includes('invalid request')) return 'invalid_request';
  if (msg.includes('401') || msg.includes('unauthorized')) return 'invalid_api_key';
  return 'unknown_error';
}