import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * ClipForge — Final Video Renderer
 *
 * Pipeline:
 *   1. Generate voiceover via ElevenLabs → MP3 binary
 *   2. Upload MP3 to Creatomate asset storage → audio CDN URL
 *   3. Build Creatomate JSON composition:
 *        - One image/video element per scene (Ken Burns zoom on images)
 *        - Caption text overlay per scene
 *        - Single voiceover audio track
 *   4. Submit render to Creatomate → poll until complete
 *   5. Return final MP4 URL
 *
 * Required env vars:
 *   ELEVENLABS_API_KEY  — from elevenlabs.io
 *   CREATOMATE_API_KEY  — from creatomate.com
 */

// ─── ElevenLabs voice map ─────────────────────────────────────────────────────
const EL_VOICE_MAP: Record<string, string> = {
  morgan_deep:     'nPczCjzI2devNBz1zQrb',
  alex_warm:       'ErXwobaYiN019PkySvjV',
  claire_soothing: 'EXAVITQu4vr4xnSDxMaL',
  nova_clear:      '21m00Tcm4TlvDq8ikWAM',
  titan_power:     'VR6AewLTigWG4xSOukaG',
  blaze_bold:      'N2lVS1w4EtoT3dr4eOWO',
  sophia_inspire:  'pMsXgVXv3BLzUgSXRplE',
  zara_fierce:     'AZnzlk1XvdvUeBnXmlld',
  eli_tender:      'GBv7mTt0atIp3Br8iCZE',
  luna_warm:       'EXAVITQu4vr4xnSDxMaL',
  sage_gentle:     '21m00Tcm4TlvDq8ikWAM',
  zen_deep:        'TxGEqnHWrfWFTfGW9XjX',
  aurora_soft:     'pFZP5JQG7iQjIQuC4Bku',
  reed_peaceful:   'GBv7mTt0atIp3Br8iCZE',
  marcus_clear:    'TX3LPaxmHKxFdv7VOQHJ',
  ivy_crisp:       '21m00Tcm4TlvDq8ikWAM',
  theo_smart:      'IKne3meq5aSn9XLyUdCD',
  raven_dark:      'TxGEqnHWrfWFTfGW9XjX',
  shadow_intense:  'nPczCjzI2devNBz1zQrb',
  void_eerie:      '21m00Tcm4TlvDq8ikWAM',
  jake_casual:     'IKne3meq5aSn9XLyUdCD',
  mia_friendly:    'EXAVITQu4vr4xnSDxMaL',
  kai_trendy:      '29vD33N1CtxCmqQRPOHJ',
  sterling_pro:    'onwK4e9ZLuTAKqWW03F9',
  diana_executive: 'pMsXgVXv3BLzUgSXRplE',
};
const DEFAULT_EL_VOICE = '21m00Tcm4TlvDq8ikWAM'; // Rachel

// ─── Types ────────────────────────────────────────────────────────────────────
interface SceneInput {
  image_url: string | null;
  video_url: string | null;
  duration: number;
  caption: string;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      script,
      voice_id,
      voice_speed = 1.0,
      scenes,
      caption_style = 'tiktok_bold',
      highlight_color = '#A3E635',
      resolution = '1080p',
    } = await req.json();

    if (!script?.trim()) return Response.json({ error: 'script is required' }, { status: 400 });
    if (!scenes?.length)  return Response.json({ error: 'scenes array is required' }, { status: 400 });

    const elKey  = Deno.env.get('ELEVENLABS_API_KEY');
    const cmKey  = Deno.env.get('CREATOMATE_API_KEY');

    if (!elKey)  throw new Error('ELEVENLABS_API_KEY is not set in environment variables. Add it in Base44 → Functions.');
    if (!cmKey)  throw new Error('CREATOMATE_API_KEY is not set in environment variables. Add it in Base44 → Functions.');

    // ── 1. Generate voiceover ─────────────────────────────────────────────
    const elVoiceId = EL_VOICE_MAP[voice_id] || DEFAULT_EL_VOICE;
    const speed     = Math.min(1.2, Math.max(0.7, Number(voice_speed) || 1.0));

    console.log(`[RenderFinal] 🎤 Generating voiceover | voice: ${elVoiceId} | speed: ${speed}`);

    const elRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${elVoiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key':   elKey,
          'Content-Type': 'application/json',
          'Accept':       'audio/mpeg',
        },
        body: JSON.stringify({
          text:     script.slice(0, 5000),
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability:        0.5,
            similarity_boost: 0.75,
            speed,
          },
        }),
      }
    );

    if (!elRes.ok) {
      const errBody = await elRes.text();
      if (elRes.status === 401) throw new Error('ELEVENLABS_API_KEY is invalid or expired.');
      if (elRes.status === 429) throw new Error('ElevenLabs quota exceeded. Upgrade at elevenlabs.io.');
      if (elRes.status === 422) throw new Error(`ElevenLabs rejected the payload: ${errBody.slice(0, 150)}`);
      throw new Error(`ElevenLabs ${elRes.status}: ${errBody.slice(0, 150)}`);
    }

    const audioBuffer = await elRes.arrayBuffer();
    console.log(`[RenderFinal] ✅ Voiceover: ${(audioBuffer.byteLength / 1024).toFixed(1)} KB`);

    // ── 2. Upload audio to Creatomate ─────────────────────────────────────
    console.log('[RenderFinal] ⬆️  Uploading audio to Creatomate...');

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([audioBuffer], { type: 'audio/mpeg' }),
      'voiceover.mp3'
    );

    const uploadRes = await fetch('https://api.creatomate.com/v1/assets', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${cmKey}` },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      throw new Error(`Creatomate asset upload failed (${uploadRes.status}): ${errBody.slice(0, 150)}`);
    }

    const uploadedAsset = await uploadRes.json();
    const audioUrl      = uploadedAsset.url as string;
    console.log(`[RenderFinal] ✅ Audio URL: ${audioUrl}`);

    // ── 3. Build Creatomate composition ───────────────────────────────────
    const isHD      = resolution === '4k';
    const width     = isHD ? 2160 : 1080;
    const height    = isHD ? 3840 : 1920; // 9:16 vertical

    const captionCss = buildCaptionStyle(caption_style, highlight_color);

    let currentTime = 0;
    const elements: unknown[] = [];

    for (const scene of scenes as SceneInput[]) {
      const dur      = Math.max(1, Number(scene.duration) || 5);
      const mediaUrl = scene.video_url || scene.image_url;
      const isVideo  = !!scene.video_url;

      if (!mediaUrl) {
        console.warn(`[RenderFinal] ⚠️  Scene at t=${currentTime}s has no media URL — skipping visual`);
        currentTime += dur;
        continue;
      }

      // ── Scene visual ──────────────────────────────────────────────────
      const visualElement: Record<string, unknown> = {
        type:        isVideo ? 'video' : 'image',
        source:      mediaUrl,
        fit:         'cover',
        x:           '50%',
        y:           '50%',
        width:       '100%',
        height:      '100%',
        x_alignment: '50%',
        y_alignment: '50%',
        time:        currentTime,
        duration:    dur,
      };

      // Ken Burns zoom effect on still images
      if (!isVideo) {
        visualElement['animations'] = [
          {
            type:        'scale',
            time:        0,
            duration:    dur,
            start_scale: '100%',
            end_scale:   '108%',
            easing:      'linear',
          },
        ];
      }

      elements.push(visualElement);

      // ── Caption text overlay ──────────────────────────────────────────
      const captionText = (scene.caption || '').trim();
      if (captionText) {
        elements.push({
          type:        'text',
          text:        captionText,
          time:        currentTime,
          duration:    dur,
          x:           '50%',
          y:           '80%',
          width:       '88%',
          x_alignment: '50%',
          y_alignment: '0%',
          ...captionCss,
        });
      }

      currentTime += dur;
    }

    // ── Voiceover audio (full duration) ──────────────────────────────────
    elements.push({
      type:   'audio',
      source: audioUrl,
      time:   0,
      volume: '100%',
    });

    const totalDuration = currentTime;
    console.log(`[RenderFinal] 🎬 Composition: ${elements.length} elements | ${totalDuration.toFixed(1)}s total`);

    // ── 4. Submit render ──────────────────────────────────────────────────
    const renderRes = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cmKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        source: {
          output_format: 'mp4',
          width,
          height,
          frame_rate: 30,
          duration:   totalDuration,
          elements,
        },
      }),
    });

    if (!renderRes.ok) {
      const errBody = await renderRes.text();
      throw new Error(`Creatomate render submit failed (${renderRes.status}): ${errBody.slice(0, 200)}`);
    }

    const renderPayload = await renderRes.json();
    const render        = Array.isArray(renderPayload) ? renderPayload[0] : renderPayload;
    const renderId      = render.id as string;

    console.log(`[RenderFinal] 🚀 Render job: ${renderId} | status: ${render.status}`);

    // ── 5. Poll until complete (max 120 s, every 5 s) ─────────────────────
    for (let i = 0; i < 24; i++) {
      await new Promise(r => setTimeout(r, 5000));

      const pollRes  = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
        headers: { 'Authorization': `Bearer ${cmKey}` },
      });
      const pollData = await pollRes.json();

      console.log(`[RenderFinal] Poll ${i + 1}/24 | status: ${pollData.status}`);

      if (pollData.status === 'succeeded') {
        const videoUrl = pollData.url as string;
        console.log(`[RenderFinal] ✅ Final MP4: ${videoUrl}`);
        return Response.json({
          video_url:     videoUrl,
          audio_url:     audioUrl,
          duration:      totalDuration,
          render_id:     renderId,
          voice_used:    elVoiceId,
        });
      }

      if (pollData.status === 'failed') {
        throw new Error(
          `Creatomate render failed: ${pollData.error_message || JSON.stringify(pollData.error) || 'unknown reason'}`
        );
      }
    }

    throw new Error('Creatomate render timed out after 120 seconds. The job may still be processing — check creatomate.com dashboard.');

  } catch (error) {
    console.error('[RenderFinal] ❌', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ─── Caption style builder ────────────────────────────────────────────────────
function buildCaptionStyle(style: string, highlightColor: string): Record<string, string> {
  const base: Record<string, string> = {
    font_family:  'Montserrat',
    font_weight:  '700',
    font_size:    '7 vmin',
    color:        '#FFFFFF',
    stroke_color: '#000000',
    stroke_width: '0.4 vmin',
    text_align:   'center',
    line_height:  '1.2',
  };

  switch (style) {
    case 'tiktok_bold':
      return { ...base, font_size: '8 vmin', font_weight: '900', stroke_width: '0.5 vmin' };

    case 'highlight':
      return { ...base, color: highlightColor, font_size: '7.5 vmin' };

    case 'word_by_word':
      return { ...base, font_size: '9 vmin', font_weight: '900', stroke_width: '0.6 vmin' };

    case 'sentence':
      return { ...base, font_size: '6 vmin', font_weight: '600', stroke_width: '0.3 vmin' };

    default:
      return base;
  }
}
