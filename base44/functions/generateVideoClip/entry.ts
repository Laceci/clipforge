// @ts-nocheck
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FAL_QUEUE_BASE = 'https://queue.fal.run';
const VIDEO_MODEL = 'fal-ai/kling-video/v1.6/standard/text-to-video';
const HF_BASE = 'https://api.higgsfield.ai';

// OpenAI TTS voice map
const OPENAI_VOICE_MAP = {
  morgan_deep: 'onyx', alex_warm: 'echo', claire_soothing: 'nova',
  nova_clear: 'shimmer', titan_power: 'onyx', blaze_bold: 'echo',
  sophia_inspire: 'nova', zara_fierce: 'alloy', zen_deep: 'onyx',
  aurora_soft: 'shimmer', marcus_clear: 'echo', ivy_crisp: 'nova',
  sterling_pro: 'onyx', diana_executive: 'shimmer', jake_casual: 'fable', mia_friendly: 'nova',
  // Extended voice library
  eli_tender: 'echo', luna_warm: 'nova', sage_gentle: 'shimmer',
  reed_peaceful: 'onyx', theo_smart: 'echo', raven_dark: 'onyx',
  shadow_intense: 'onyx', void_eerie: 'shimmer', kai_trendy: 'fable',
};

// ElevenLabs voice map — covers every voice in VOICE_LIBRARY
const EL_VOICE_MAP = {
  morgan_deep: 'nPczCjzI2devNBz1zQrb', alex_warm: 'ErXwobaYiN019PkySvjV',
  claire_soothing: 'EXAVITQu4vr4xnSDxMaL', nova_clear: '21m00Tcm4TlvDq8ikWAM',
  titan_power: 'VR6AewLTigWG4xSOukaG', blaze_bold: 'N2lVS1w4EtoT3dr4eOWO',
  sophia_inspire: 'pMsXgVXv3BLzUgSXRplE', zara_fierce: 'AZnzlk1XvdvUeBnXmlld',
  zen_deep: 'TxGEqnHWrfWFTfGW9XjX', aurora_soft: 'pFZP5JQG7iQjIQuC4Bku',
  marcus_clear: 'TX3LPaxmHKxFdv7VOQHJ', ivy_crisp: '21m00Tcm4TlvDq8ikWAM',
  sterling_pro: 'onwK4e9ZLuTAKqWW03F9', diana_executive: 'pMsXgVXv3BLzUgSXRplE',
  jake_casual: 'IKne3meq5aSn9XLyUdCD', mia_friendly: 'EXAVITQu4vr4xnSDxMaL',
  // Extended voice library
  eli_tender: 'ErXwobaYiN019PkySvjV',   // Antoni — warm male
  luna_warm: 'pFZP5JQG7iQjIQuC4Bku',    // Freya — warm female
  sage_gentle: 'EXAVITQu4vr4xnSDxMaL',  // Bella — gentle female
  reed_peaceful: 'TxGEqnHWrfWFTfGW9XjX',// Arnold — calm deep male
  theo_smart: 'TX3LPaxmHKxFdv7VOQHJ',   // Liam — clear smart male
  raven_dark: 'nPczCjzI2devNBz1zQrb',   // Brian — dark deep male
  shadow_intense: 'VR6AewLTigWG4xSOukaG',// Sam — intense male
  void_eerie: 'AZnzlk1XvdvUeBnXmlld',   // Domi — eerie female
  kai_trendy: 'IKne3meq5aSn9XLyUdCD',   // Dave — casual trendy male
};

function toBase64(buffer) {
  const uint8 = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
  return btoa(binary);
}

const STOP_WORDS = new Set(['a','an','the','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','this','that','these','those','with','from','into','through','during','before','after','above','below','to','of','in','on','at','by','for','and','or','but','not','so','yet','both','either','each','few','more','most','other','some','such','than','then','too','very','just','about','over','when','where','who','which','how','its','it','they','them','their','we','our','you','your','he','she','him','her','his','my','what']);

function extractKeywords(text: string): string {
  const words = text.toLowerCase()
    .replace(/\[scene[^\]]*\]/gi, '')
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
  const unique = [...new Set(words)];
  return unique.slice(0, 4).join(' ') || text.slice(0, 50);
}

// Reads HF_KEY (key_id:key_secret) or HF_API_KEY + HF_API_SECRET
function getHiggsfieldToken() {
  const hfKey = Deno.env.get('HF_KEY');
  if (hfKey) return hfKey;
  const id = Deno.env.get('HF_API_KEY');
  const secret = Deno.env.get('HF_API_SECRET');
  if (id && secret) return `${id}:${secret}`;
  return null;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const falKey = Deno.env.get('FAL_API_KEY');

    // ── MODE: TTS voiceover ───────────────────────────────────────────────
    if (body.voice_mode === 'tts') {
      const script = (body.script || '').trim();
      if (!script) return Response.json({ error: 'script required' }, { status: 400 });

      const voiceId = body.voice_id || 'morgan_deep';
      const speed = Math.min(1.2, Math.max(0.7, Number(body.voice_speed) || 1.0));
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      const elKey = Deno.env.get('ELEVENLABS_API_KEY');

      // Try ElevenLabs first — most expressive, unique voice per persona
      if (elKey) {
        const elVoice = EL_VOICE_MAP[voiceId] || '21m00Tcm4TlvDq8ikWAM';
        console.log('[TTS] ElevenLabs, voice:', elVoice, 'persona:', voiceId);
        const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + elVoice + '?output_format=mp3_44100_128', {
          method: 'POST',
          headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
          body: JSON.stringify({
            text: script.slice(0, 5000),
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.35, similarity_boost: 0.75, style: 0.30, use_speaker_boost: true, speed: speed },
          }),
        });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          console.log('[TTS] ElevenLabs success:', (buf.byteLength / 1024).toFixed(1), 'KB');
          return Response.json({ audio_data: toBase64(buf), content_type: 'audio/mpeg', provider: 'elevenlabs' });
        }
        const errText = await res.text();
        console.warn('[TTS] ElevenLabs failed:', res.status, errText.slice(0, 100));
      }

      // Fallback: OpenAI TTS
      if (openaiKey) {
        const voice = OPENAI_VOICE_MAP[voiceId] || 'onyx';
        console.log('[TTS] OpenAI fallback, voice:', voice);
        const res = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + openaiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'tts-1-hd', input: script.slice(0, 4096), voice: voice, speed: speed, response_format: 'mp3' }),
        });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          console.log('[TTS] OpenAI success:', (buf.byteLength / 1024).toFixed(1), 'KB');
          return Response.json({ audio_data: toBase64(buf), content_type: 'audio/mpeg', provider: 'openai' });
        }
        console.warn('[TTS] OpenAI failed:', res.status);
      }

      return Response.json({ error: 'No TTS key available (add ELEVENLABS_API_KEY or OPENAI_API_KEY)' }, { status: 500 });
    }

    // ── MODE: Higgsfield connection test ─────────────────────────────────
    if (body.hf_test_connection) {
      const token = getHiggsfieldToken();
      if (!token) {
        return Response.json({ connected: false, error: 'HF_KEY not set in Base44 Secrets (format: key_id:key_secret)' });
      }
      try {
        // Lightweight GET to validate credentials without generating video
        const res = await fetch(`${HF_BASE}/v1/generations?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        if (res.status === 401 || res.status === 403) {
          const body = await res.text().catch(() => '');
          return Response.json({ connected: false, error: `Auth failed (${res.status}) — check HF_KEY format: key_id:key_secret` });
        }
        // 200 or even 404/400 means the token was accepted
        console.log('[HF] Connection test:', res.status);
        return Response.json({ connected: true, http_status: res.status });
      } catch (e) {
        return Response.json({ connected: false, error: `Network error: ${e.message}` });
      }
    }

    // ── MODE: Poll Higgsfield job ─────────────────────────────────────────
    if (body.request_id && body.hf_status_url) {
      const token = getHiggsfieldToken();
      if (!token) return Response.json({ error: 'HF_KEY not set' }, { status: 500 });

      const statusRes = await fetch(body.hf_status_url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });

      if (!statusRes.ok) {
        const errText = await statusRes.text();
        console.warn('[HF] Poll error:', statusRes.status, errText.slice(0, 100));
        return Response.json({ pending: true, request_id: body.request_id, hf_status_url: body.hf_status_url });
      }

      const data = await statusRes.json();
      const status = (data.status || '').toLowerCase();
      console.log('[HF] Poll status:', status, 'for job:', body.request_id);

      if (status === 'completed' || status === 'succeeded' || status === 'success') {
        const videoUrl = data.video_url || data.output?.video_url || data.result?.video_url || data.url;
        if (videoUrl) {
          return Response.json({ video_url: videoUrl, image_url: videoUrl, clip_type: 'cinematic-video', provider_used: 'higgsfield', pending: false });
        }
        return Response.json({ failure_reason: 'no_video_url_in_result', pending: false });
      }

      if (status === 'failed' || status === 'error') {
        const errMsg = data.error || data.message || 'higgsfield_generation_failed';
        console.error('[HF] Generation failed:', errMsg);
        return Response.json({ failure_reason: 'higgsfield_failed', error: errMsg, pending: false });
      }

      // Still processing (pending / processing / queued / running)
      return Response.json({ pending: true, request_id: body.request_id, hf_status_url: body.hf_status_url });
    }

    // ── MODE: Poll existing fal.ai job ───────────────────────────────────
    if (body.request_id && body.status_url) {
      if (!falKey) return Response.json({ error: 'FAL_API_KEY not set' }, { status: 500 });

      const statusRes = await fetch(body.status_url, { headers: { 'Authorization': 'Key ' + falKey } });
      const statusData = await statusRes.json();

      if (statusData.status === 'COMPLETED') {
        const resultRes = await fetch(body.result_url, { headers: { 'Authorization': 'Key ' + falKey } });
        const resultData = await resultRes.json();
        const videoUrl = resultData.video && resultData.video.url ? resultData.video.url : resultData.url;
        if (videoUrl) {
          return Response.json({ video_url: videoUrl, image_url: videoUrl, clip_type: 'cinematic-video', provider_used: 'kling-v1.6', pending: false });
        }
        return Response.json({ failure_reason: 'no_video_url_in_result', pending: false });
      }

      if (statusData.status === 'FAILED') {
        return Response.json({ failure_reason: statusData.error || 'kling_failed', pending: false });
      }

      return Response.json({ pending: true, request_id: body.request_id, status_url: body.status_url, result_url: body.result_url });
    }

    const provider = body.provider || Deno.env.get('VIDEO_PROVIDER') || 'image_fallback';

    // ── MODE: Higgsfield video generation ────────────────────────────────
    if (provider === 'higgsfield') {
      const token = getHiggsfieldToken();
      if (!token) {
        return Response.json({
          failure_reason: 'missing_api_key',
          error: 'Higgsfield credentials not set. Add HF_KEY (format: key_id:key_secret) in Base44 Secrets.',
        }, { status: 500 });
      }

      const prompt = (body.sceneText || body.prompt || '').slice(0, 500);
      const duration = body.duration || 5;

      console.log('[HF] Submitting text-to-video:', prompt.slice(0, 80));

      // POST to Higgsfield DoP model (Director of Photography — cinematic quality)
      const submitRes = await fetch(`${HF_BASE}/v1/generation/dop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          duration: duration,
          aspect_ratio: '9:16',
          motion_strength: 'medium',
        }),
      });

      if (submitRes.status === 401 || submitRes.status === 403) {
        return Response.json({
          failure_reason: 'invalid_api_key',
          error: 'Higgsfield auth failed — check HF_KEY format: key_id:key_secret',
        }, { status: 401 });
      }

      if (!submitRes.ok) {
        const errText = await submitRes.text();
        throw new Error('Higgsfield ' + submitRes.status + ': ' + errText.slice(0, 300));
      }

      const submitData = await submitRes.json();
      const generationId = submitData.id || submitData.generation_id || submitData.request_id;

      if (!generationId) {
        throw new Error('Higgsfield returned no generation ID: ' + JSON.stringify(submitData).slice(0, 200));
      }

      const statusUrl = `${HF_BASE}/v1/generation/${generationId}`;
      console.log('[HF] Job submitted:', generationId);

      return Response.json({
        pending: true,
        request_id: generationId,
        hf_status_url: statusUrl,
        provider: 'higgsfield',
      });
    }

    // ── MODE: Pexels stock video ─────────────────────────────────────────
    if (provider === 'pexels_stock') {
      const pexelsKey = Deno.env.get('PEXELS_API_KEY');
      if (!pexelsKey) {
        return Response.json({ failure_reason: 'missing_api_key', error: 'PEXELS_API_KEY not set in Base44 Secrets. Get a free key at pexels.com/api' }, { status: 500 });
      }

      const query = extractKeywords(body.sceneText || body.prompt || '');
      console.log('[Pexels] Searching for:', query);

      const searchRes = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=10&size=medium`,
        { headers: { 'Authorization': pexelsKey } }
      );

      if (!searchRes.ok) {
        const errText = await searchRes.text();
        console.warn('[Pexels] Search failed:', searchRes.status, errText.slice(0, 100));
        // Fall through to image fallback
      } else {
        const searchData = await searchRes.json();
        const videos = searchData.videos || [];

        if (videos.length > 0) {
          // Pick a random video from the top results for variety
          const video = videos[Math.floor(Math.random() * Math.min(videos.length, 5))];
          // Prefer portrait HD files (height > width), then any file
          const portraitFiles = (video.video_files || []).filter((f: any) => f.height >= f.width);
          const files = portraitFiles.length > 0 ? portraitFiles : (video.video_files || []);
          // Sort by resolution descending, pick the best
          const sorted = files.sort((a: any, b: any) => b.height - a.height);
          const best = sorted[0];

          if (best?.link) {
            console.log('[Pexels] Found video:', video.id, best.width + 'x' + best.height);
            return Response.json({
              video_url: best.link,
              image_url: video.image,
              clip_type: 'cinematic-video',
              provider_used: 'pexels',
              pending: false,
            });
          }
        }
        console.warn('[Pexels] No suitable video found for query:', query, '— falling back to image');
      }
    }

    // ── MODE: Image fallback (DALL-E 3 via OpenAI) ──────────────────────
    // Also catches unknown/unsupported providers (fal_video, runway, luma, etc.)
    const SUPPORTED_PROVIDERS = ['higgsfield', 'pexels_stock', 'image_fallback'];
    if (provider === 'image_fallback' || !falKey || !SUPPORTED_PROVIDERS.includes(provider)) {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiKey) {
        try {
          const imagePrompt = (body.sceneText || body.prompt || '').slice(0, 900);
          const dalleRes = await fetch('https://api.openai.com/v1/images/generate', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + openaiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'dall-e-3',
              prompt: `Cinematic portrait photo for a vertical social media video: ${imagePrompt}. No text, no watermarks, dramatic lighting, 9:16 vertical composition, photorealistic.`,
              n: 1,
              size: '1024x1792',
              quality: 'standard',
            }),
          });
          if (dalleRes.ok) {
            const dalleData = await dalleRes.json();
            const imageUrl = dalleData.data?.[0]?.url;
            if (imageUrl) {
              console.log('[Image] DALL-E 3 success');
              return Response.json({ image_url: imageUrl, clip_type: 'still-image', provider_used: 'dalle3', pending: false });
            }
          } else {
            const errText = await dalleRes.text();
            console.warn('[Image] DALL-E 3 failed:', dalleRes.status, errText.slice(0, 150));
          }
        } catch (imgErr) {
          console.warn('[Image] DALL-E 3 exception:', imgErr.message);
        }
      }
      return Response.json({ failure_reason: 'image_generation_failed', error: 'Add OPENAI_API_KEY in Base44 Secrets to enable image generation', pending: false });
    }

    // ── MODE: Submit Kling v1.6 video job ────────────────────────────────
    const prompt = (body.sceneText || body.prompt || '').slice(0, 500);
    const submitRes = await fetch(FAL_QUEUE_BASE + '/' + VIDEO_MODEL, {
      method: 'POST',
      headers: { 'Authorization': 'Key ' + falKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, duration: '5', aspect_ratio: '9:16' }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      throw new Error('fal.ai ' + submitRes.status + ': ' + errText.slice(0, 200));
    }

    const submitData = await submitRes.json();
    const requestId = submitData.request_id;
    const statusUrl = FAL_QUEUE_BASE + '/' + VIDEO_MODEL + '/requests/' + requestId + '/status';
    const resultUrl = FAL_QUEUE_BASE + '/' + VIDEO_MODEL + '/requests/' + requestId;

    console.log('[generateVideoClip] Kling job submitted:', requestId);
    return Response.json({ pending: true, request_id: requestId, status_url: statusUrl, result_url: resultUrl });

  } catch (err) {
    console.error('[generateVideoClip] Error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
