import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * ClipForge — AI Voiceover Generator
 * Calls ElevenLabs text-to-speech and returns raw MP3 audio.
 * Maps internal ClipForge voice IDs to real ElevenLabs voice IDs.
 *
 * Phase 2: This can be used for in-browser audio preview before rendering.
 * Phase 1: Called internally by renderFinalVideo.
 */

// ─── Internal voice ID → ElevenLabs voice ID mapping ─────────────────────────
// All voices below are ElevenLabs pre-made voices (available on free tier).
const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  // Storytelling
  morgan_deep:     'nPczCjzI2devNBz1zQrb', // Brian  — deep narrator
  alex_warm:       'ErXwobaYiN019PkySvjV',  // Antoni — warm American male
  claire_soothing: 'EXAVITQu4vr4xnSDxMaL', // Bella  — warm American female
  nova_clear:      '21m00Tcm4TlvDq8ikWAM',  // Rachel — clear American female

  // Motivational
  titan_power:     'VR6AewLTigWG4xSOukaG',  // Arnold  — crisp, energetic
  blaze_bold:      'N2lVS1w4EtoT3dr4eOWO',  // Callum  — intense American male
  sophia_inspire:  'pMsXgVXv3BLzUgSXRplE',  // Serena  — pleasant female
  zara_fierce:     'AZnzlk1XvdvUeBnXmlld',  // Domi    — strong American female

  // Emotional
  eli_tender:      'GBv7mTt0atIp3Br8iCZE',  // Thomas  — calm, tender male
  luna_warm:       'EXAVITQu4vr4xnSDxMaL',  // Bella   — warm female
  sage_gentle:     '21m00Tcm4TlvDq8ikWAM',  // Rachel  — gentle female

  // Calm / Meditation
  zen_deep:        'TxGEqnHWrfWFTfGW9XjX',  // Josh    — deep, calm male
  aurora_soft:     'pFZP5JQG7iQjIQuC4Bku',  // Lily    — warm British female
  reed_peaceful:   'GBv7mTt0atIp3Br8iCZE',  // Thomas  — calm male

  // Educational
  marcus_clear:    'TX3LPaxmHKxFdv7VOQHJ',  // Liam    — neutral American male
  ivy_crisp:       '21m00Tcm4TlvDq8ikWAM',  // Rachel  — crisp female
  theo_smart:      'IKne3meq5aSn9XLyUdCD',  // Charlie — natural Australian male

  // Dark / Intense
  raven_dark:      'TxGEqnHWrfWFTfGW9XjX',  // Josh    — deep dark male
  shadow_intense:  'nPczCjzI2devNBz1zQrb',  // Brian   — deep intense
  void_eerie:      '21m00Tcm4TlvDq8ikWAM',  // Rachel  — eerie female cadence

  // UGC / Casual
  jake_casual:     'IKne3meq5aSn9XLyUdCD',  // Charlie — natural, conversational
  mia_friendly:    'EXAVITQu4vr4xnSDxMaL',  // Bella   — friendly female
  kai_trendy:      '29vD33N1CtxCmqQRPOHJ',  // Drew    — well-rounded male

  // Professional / Corporate
  sterling_pro:    'onwK4e9ZLuTAKqWW03F9',  // Daniel  — authoritative British male
  diana_executive: 'pMsXgVXv3BLzUgSXRplE',  // Serena  — professional female
};
const DEFAULT_ELEVENLABS_VOICE = '21m00Tcm4TlvDq8ikWAM'; // Rachel (safe all-purpose default)

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      script,
      voice_id,
      voice_speed = 1.0,
      voice_stability = 0.5,
    } = await req.json();

    if (!script?.trim()) {
      return Response.json({ error: 'script is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      throw new Error(
        'ELEVENLABS_API_KEY is not configured. ' +
        'Add it in Base44 → Functions → Environment Variables.'
      );
    }

    const elVoiceId = ELEVENLABS_VOICE_MAP[voice_id] || DEFAULT_ELEVENLABS_VOICE;

    // ElevenLabs speed range: 0.7 – 1.2
    const speed = Math.min(1.2, Math.max(0.7, Number(voice_speed) || 1.0));

    console.log(`[Voiceover] 🎤 Voice: "${voice_id}" → EL: ${elVoiceId} | speed: ${speed}`);
    console.log(`[Voiceover] 📝 Script: ${script.length} chars`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${elVoiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: script.slice(0, 5000), // ElevenLabs free tier limit
          model_id: 'eleven_turbo_v2_5', // fastest, cheapest model
          voice_settings: {
            stability: Math.min(1, Math.max(0, Number(voice_stability) || 0.5)),
            similarity_boost: 0.75,
            speed,
          },
        }),
      }
    );

    console.log(`[Voiceover] ElevenLabs status: ${response.status}`);

    if (!response.ok) {
      const errBody = await response.text();
      if (response.status === 401) throw new Error('ELEVENLABS_API_KEY is invalid or expired.');
      if (response.status === 422) throw new Error(`ElevenLabs rejected the request: ${errBody.slice(0, 200)}`);
      if (response.status === 429) throw new Error('ElevenLabs rate limit or character quota exceeded. Check your plan at elevenlabs.io.');
      throw new Error(`ElevenLabs error ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`[Voiceover] ✅ Audio generated: ${(audioBuffer.byteLength / 1024).toFixed(1)} KB`);

    // Encode as base64 so the frontend SDK can consume it via invoke()
    const uint8 = new Uint8Array(audioBuffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    const audioBase64 = btoa(binary);

    return Response.json({
      audio_data: audioBase64,
      content_type: 'audio/mpeg',
      size_bytes: audioBuffer.byteLength,
      voice_used: elVoiceId,
      speed,
    });

  } catch (error) {
    console.error('[Voiceover] ❌ Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
