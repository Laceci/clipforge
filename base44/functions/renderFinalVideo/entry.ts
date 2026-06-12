import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * ClipForge — Final Video Renderer (two-phase)
 *
 * Phase 1 (submit): Generate voiceover → upload audio → build composition → submit Creatomate job
 *   Returns: { pending: true, render_id, audio_url }
 *
 * Phase 2 (poll): Pass render_id → check Creatomate status
 *   Returns: { pending: true, status } OR { pending: false, video_url }
 *
 * Required env vars:
 *   ELEVENLABS_API_KEY  — from elevenlabs.io
 *   CREATOMATE_API_KEY  — from creatomate.com
 */

const OPENAI_VOICE_MAP: Record<string, string> = {
  morgan_deep: 'onyx',   alex_warm: 'echo',      claire_soothing: 'nova',
  nova_clear: 'shimmer', titan_power: 'onyx',    blaze_bold: 'echo',
  sophia_inspire: 'nova', zara_fierce: 'alloy',  zen_deep: 'onyx',
  aurora_soft: 'shimmer', marcus_clear: 'echo',  ivy_crisp: 'nova',
  sterling_pro: 'onyx',  diana_executive: 'shimmer', jake_casual: 'fable',
  mia_friendly: 'nova',  eli_tender: 'echo',     luna_warm: 'nova',
  sage_gentle: 'shimmer', reed_peaceful: 'onyx', theo_smart: 'echo',
  raven_dark: 'onyx',    shadow_intense: 'onyx', void_eerie: 'shimmer',
  kai_trendy: 'fable',
};

// ElevenLabs voice map — verified stable premade voice IDs
// Male: Brian(nPcz), Antoni(ErXw), Arnold(VR6A), Josh(TxGE), Liam(TX3L), Adam(pNIn), Dave(IKne)
// Female: Rachel(21m0), Bella(EXAV), Elli(MF3m), Dorothy(ThT5), Freya(pFZP), Domi(AZnz)
const EL_VOICE_MAP: Record<string, string> = {
  morgan_deep:     'nPczCjzI2devNBz1zQrb', // Brian — deep male narrator
  alex_warm:       'ErXwobaYiN019PkySvjV',  // Antoni — warm male
  claire_soothing: 'EXAVITQu4vr4xnSDxMaL', // Bella — soothing female
  nova_clear:      '21m00Tcm4TlvDq8ikWAM',  // Rachel — clear female
  titan_power:     'VR6AewLTigWG4xSOukaG',  // Arnold — powerful male
  blaze_bold:      'pNInz6obpgDQGcFmaJgB',  // Adam — bold assertive male (fixed: was female Domi ID)
  sophia_inspire:  'MF3mGyEYCl7XYWbV9V6O',  // Elli — inspiring female (fixed: was duplicate)
  zara_fierce:     'AZnzlk1XvdvUeBnXmlld',  // Domi — fierce female
  zen_deep:        'TxGEqnHWrfWFTfGW9XjX',  // Josh — calm deep male
  aurora_soft:     'pFZP5JQG7iQjIQuC4Bku',  // Freya — soft female
  marcus_clear:    'TX3LPaxmHKxFdv7VOQHJ',  // Liam — clear informative male
  ivy_crisp:       'ThT5KcBeYPX3keUQqHPh',  // Dorothy — crisp female (fixed: was Rachel duplicate)
  sterling_pro:    'onwK4e9ZLuTAKqWW03F9',  // Adam variant — professional male
  diana_executive: '21m00Tcm4TlvDq8ikWAM',  // Rachel — executive female (fixed: was duplicate)
  jake_casual:     'IKne3meq5aSn9XLyUdCD',  // Dave — casual male
  mia_friendly:    'MF3mGyEYCl7XYWbV9V6O',  // Elli — friendly female (fixed: was Bella duplicate)
  eli_tender:      'ErXwobaYiN019PkySvjV',   // Antoni — tender male
  luna_warm:       'pFZP5JQG7iQjIQuC4Bku',  // Freya — warm female
  sage_gentle:     'EXAVITQu4vr4xnSDxMaL',  // Bella — gentle female
  reed_peaceful:   'TxGEqnHWrfWFTfGW9XjX',  // Josh — peaceful male
  theo_smart:      'TX3LPaxmHKxFdv7VOQHJ',  // Liam — smart male
  raven_dark:      'nPczCjzI2devNBz1zQrb',  // Brian — dark male
  shadow_intense:  'VR6AewLTigWG4xSOukaG',  // Arnold — intense male
  void_eerie:      'AZnzlk1XvdvUeBnXmlld',  // Domi — eerie female
  kai_trendy:      'IKne3meq5aSn9XLyUdCD',  // Dave — trendy male
};
const DEFAULT_EL_VOICE = '21m00Tcm4TlvDq8ikWAM'; // Rachel

// Royalty-free background music (CC0 / free-for-commercial-use from Pixabay)
const MUSIC_URLS: Record<string, string> = {
  epic_cinematic:      'https://cdn.pixabay.com/audio/2023/06/14/audio_6abda0d2f9.mp3',
  dark_ambient:        'https://cdn.pixabay.com/audio/2022/10/25/audio_946e3a0e34.mp3',
  motivational_piano:  'https://cdn.pixabay.com/audio/2023/04/08/audio_a4d5c77d8c.mp3',
  lofi_chill:          'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3',
  dramatic_orchestral: 'https://cdn.pixabay.com/audio/2023/07/18/audio_15e5df1d60.mp3',
  upbeat_corporate:    'https://cdn.pixabay.com/audio/2022/12/23/audio_c95f54a7ec.mp3',
};

interface SceneInput {
  image_url: string | null;
  video_url: string | null;
  duration: number;
  caption: string;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const cmKey = Deno.env.get('CREATOMATE_API_KEY');

    // ── PHASE 2: Poll existing render ────────────────────────────────────────
    if (body.render_id) {
      if (!cmKey) throw new Error('CREATOMATE_API_KEY is not set in environment variables.');

      const pollRes = await fetch(`https://api.creatomate.com/v1/renders/${body.render_id}`, {
        headers: { 'Authorization': `Bearer ${cmKey}` },
      });

      if (!pollRes.ok) {
        const errText = await pollRes.text();
        throw new Error(`Creatomate poll failed (${pollRes.status}): ${errText.slice(0, 100)}`);
      }

      const data = await pollRes.json();
      console.log(`[RenderFinal] Poll ${body.render_id} | status: ${data.status}`);

      if (data.status === 'succeeded') {
        return Response.json({
          pending:   false,
          video_url: data.url,
          render_id: body.render_id,
          duration:  data.duration,
        });
      }

      if (data.status === 'failed') {
        return Response.json({
          pending:   false,
          error:     data.error_message || 'Render failed on Creatomate',
          render_id: body.render_id,
        });
      }

      // Still planned/rendering
      return Response.json({
        pending:   true,
        status:    data.status,
        render_id: body.render_id,
        progress:  data.progress || 0,
      });
    }

    // ── PHASE 1: Submit new render ────────────────────────────────────────────
    const {
      script,
      voice_id,
      voice_speed = 1.0,
      scenes,
      caption_style = 'tiktok_bold',
      highlight_color = '#A3E635',
      resolution = '1080p',
      music_track = 'none',
      music_volume = 20,
    } = body;

    if (!script?.trim()) return Response.json({ error: 'script is required' }, { status: 400 });
    if (!scenes?.length)  return Response.json({ error: 'scenes array is required' }, { status: 400 });

    const elKey  = Deno.env.get('ELEVENLABS_API_KEY');
    const oaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!cmKey) throw new Error('CREATOMATE_API_KEY is not set in environment variables. Add it in Base44 → Functions.');
    if (!elKey && !oaiKey) throw new Error('No TTS key found. Add ELEVENLABS_API_KEY or OPENAI_API_KEY in Base44 → Functions.');

    // 1. Generate voiceover — ElevenLabs first, OpenAI TTS as silent fallback
    const speed = Math.min(1.2, Math.max(0.7, Number(voice_speed) || 1.0));
    let audioBuffer: ArrayBuffer | null = null;
    let ttsProvider = 'none';

    if (elKey) {
      const elVoiceId = EL_VOICE_MAP[voice_id] || DEFAULT_EL_VOICE;
      console.log(`[RenderFinal] 🎤 ElevenLabs | voice: ${elVoiceId} | speed: ${speed}`);
      try {
        const elRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${elVoiceId}?output_format=mp3_44100_128`,
          {
            method: 'POST',
            headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
            body: JSON.stringify({
              text: script.slice(0, 5000),
              model_id: 'eleven_turbo_v2_5',
              voice_settings: { stability: 0.50, similarity_boost: 0.80, style: 0.40, use_speaker_boost: true },
              speed: speed,
            }),
          }
        );
        if (elRes.ok) {
          audioBuffer = await elRes.arrayBuffer();
          ttsProvider = 'elevenlabs';
        } else {
          const errBody = await elRes.text();
          console.warn(`[RenderFinal] ⚠️  ElevenLabs failed (${elRes.status}): ${errBody.slice(0, 100)} — trying OpenAI TTS`);
        }
      } catch (e) {
        console.warn(`[RenderFinal] ⚠️  ElevenLabs error: ${e.message} — trying OpenAI TTS`);
      }
    }

    if (!audioBuffer && oaiKey) {
      const oaiVoice = OPENAI_VOICE_MAP[voice_id] || 'onyx';
      console.log(`[RenderFinal] 🎤 OpenAI TTS | voice: ${oaiVoice} | speed: ${speed}`);
      const oaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${oaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'tts-1-hd', input: script.slice(0, 4096), voice: oaiVoice, speed, response_format: 'mp3' }),
      });
      if (oaiRes.ok) {
        audioBuffer = await oaiRes.arrayBuffer();
        ttsProvider = 'openai';
      } else {
        const errBody = await oaiRes.text();
        throw new Error(`OpenAI TTS failed (${oaiRes.status}): ${errBody.slice(0, 150)}`);
      }
    }

    if (!audioBuffer) throw new Error('Voiceover generation failed — both ElevenLabs and OpenAI TTS unavailable.');
    console.log(`[RenderFinal] ✅ Voiceover via ${ttsProvider}: ${(audioBuffer.byteLength / 1024).toFixed(1)} KB`);

    // 2. Upload audio to Creatomate asset storage
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

    // 3. Build Creatomate composition
    const isHD  = resolution === '4k';
    const width  = isHD ? 2160 : 1080;
    const height = isHD ? 3840 : 1920; // 9:16 vertical

    const captionCss = buildCaptionStyle(caption_style, highlight_color);

    let currentTime = 0;
    const elements: unknown[] = [];

    for (const scene of scenes as SceneInput[]) {
      const dur      = Math.max(1, Number(scene.duration) || 5);
      const mediaUrl = scene.video_url || scene.image_url;
      const isVideo  = !!scene.video_url;

      if (!mediaUrl) {
        console.warn(`[RenderFinal] ⚠️  Scene at t=${currentTime}s has no media URL — skipping`);
        currentTime += dur;
        continue;
      }

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

      // Ken Burns zoom on still images
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

    // Background music (low volume, loops to fill video)
    const musicUrl = MUSIC_URLS[music_track];
    if (musicUrl && music_track !== 'none') {
      const vol = Math.min(40, Math.max(5, Number(music_volume) || 20));
      elements.push({
        type:   'audio',
        source: musicUrl,
        time:   0,
        volume: `${vol}%`,
        audio_fade_in:  1,
        audio_fade_out: 1.5,
      });
      console.log(`[RenderFinal] 🎵 Music: ${music_track} @ ${vol}%`);
    }

    // Voiceover on top at full volume
    elements.push({
      type:   'audio',
      source: audioUrl,
      time:   0,
      volume: '100%',
    });

    const totalDuration = currentTime;
    console.log(`[RenderFinal] 🎬 Composition: ${elements.length} elements | ${totalDuration.toFixed(1)}s`);

    // 4. Submit render — return render_id immediately, frontend polls
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

    console.log(`[RenderFinal] 🚀 Render submitted: ${renderId} | status: ${render.status}`);

    return Response.json({
      pending:   true,
      render_id: renderId,
      audio_url: audioUrl,
      status:    render.status,
    });

  } catch (error) {
    console.error('[RenderFinal] ❌', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

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
