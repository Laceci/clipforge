// @ts-nocheck
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// OpenAI voice mapping (natural, non-robotic voices)
const OPENAI_VOICE_MAP = {
  morgan_deep:     'onyx',    // deep narrator male
  alex_warm:       'echo',    // warm American male
  claire_soothing: 'nova',    // warm female
  nova_clear:      'shimmer', // clear female
  titan_power:     'onyx',    // powerful male
  blaze_bold:      'echo',    // bold male
  sophia_inspire:  'nova',    // inspiring female
  zara_fierce:     'alloy',   // strong female
  zen_deep:        'onyx',    // calm deep male
  aurora_soft:     'shimmer', // soft female
  marcus_clear:    'echo',    // clear male
  ivy_crisp:       'nova',    // crisp female
  sterling_pro:    'onyx',    // professional male
  diana_executive: 'shimmer', // executive female
  jake_casual:     'fable',   // casual male
  mia_friendly:    'nova',    // friendly female
};
const DEFAULT_OPENAI_VOICE = 'onyx';

// ElevenLabs fallback mapping
const ELEVENLABS_VOICE_MAP = {
  morgan_deep:     'nPczCjzI2devNBz1zQrb',
  alex_warm:       'ErXwobaYiN019PkySvjV',
  claire_soothing: 'EXAVITQu4vr4xnSDxMaL',
  nova_clear:      '21m00Tcm4TlvDq8ikWAM',
  titan_power:     'VR6AewLTigWG4xSOukaG',
  blaze_bold:      'N2lVS1w4EtoT3dr4eOWO',
  sophia_inspire:  'pMsXgVXv3BLzUgSXRplE',
  zara_fierce:     'AZnzlk1XvdvUeBnXmlld',
  zen_deep:        'TxGEqnHWrfWFTfGW9XjX',
  aurora_soft:     'pFZP5JQG7iQjIQuC4Bku',
  marcus_clear:    'TX3LPaxmHKxFdv7VOQHJ',
  ivy_crisp:       '21m00Tcm4TlvDq8ikWAM',
  sterling_pro:    'onwK4e9ZLuTAKqWW03F9',
  diana_executive: 'pMsXgVXv3BLzUgSXRplE',
  jake_casual:     'IKne3meq5aSn9XLyUdCD',
  mia_friendly:    'EXAVITQu4vr4xnSDxMaL',
};
const DEFAULT_ELEVENLABS_VOICE = '21m00Tcm4TlvDq8ikWAM';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const script = (body.script || '').trim();
    const voice_id = body.voice_id || 'morgan_deep';
    const voice_speed = Math.min(1.2, Math.max(0.7, Number(body.voice_speed) || 1.0));
    const voice_stability = Math.min(1, Math.max(0, Number(body.voice_stability) || 0.35));

    if (!script) return Response.json({ error: 'script is required' }, { status: 400 });

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const elKey = Deno.env.get('ELEVENLABS_API_KEY');

    // ── Primary: OpenAI TTS (most natural sounding) ──────────────────────
    if (openaiKey) {
      const openaiVoice = OPENAI_VOICE_MAP[voice_id] || DEFAULT_OPENAI_VOICE;
      console.log('[Voiceover] Using OpenAI TTS, voice:', openaiVoice);

      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + openaiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          input: script.slice(0, 4096),
          voice: openaiVoice,
          speed: voice_speed,
          response_format: 'mp3',
        }),
      });

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        const uint8 = new Uint8Array(audioBuffer);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        const audioBase64 = btoa(binary);
        console.log('[Voiceover] OpenAI TTS success:', (audioBuffer.byteLength / 1024).toFixed(1), 'KB');
        return Response.json({
          audio_data: audioBase64,
          content_type: 'audio/mpeg',
          size_bytes: audioBuffer.byteLength,
          voice_used: openaiVoice,
          provider: 'openai',
          speed: voice_speed,
        });
      }
      const errText = await res.text();
      console.warn('[Voiceover] OpenAI TTS failed:', res.status, errText.slice(0, 100));
    }

    // ── Fallback: ElevenLabs ──────────────────────────────────────────────
    if (!elKey) {
      throw new Error('No TTS API key configured. Add OPENAI_API_KEY or ELEVENLABS_API_KEY in Base44 Secrets.');
    }

    const elVoiceId = ELEVENLABS_VOICE_MAP[voice_id] || DEFAULT_ELEVENLABS_VOICE;
    console.log('[Voiceover] Falling back to ElevenLabs, voice:', elVoiceId);

    const elRes = await fetch(
      'https://api.elevenlabs.io/v1/text-to-speech/' + elVoiceId + '?output_format=mp3_44100_128',
      {
        method: 'POST',
        headers: {
          'xi-api-key': elKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: script.slice(0, 5000),
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: voice_stability,
            similarity_boost: 0.75,
            style: 0.30,
            use_speaker_boost: true,
            speed: voice_speed,
          },
        }),
      }
    );

    if (!elRes.ok) {
      const errBody = await elRes.text();
      throw new Error('ElevenLabs error ' + elRes.status + ': ' + errBody.slice(0, 200));
    }

    const audioBuffer = await elRes.arrayBuffer();
    const uint8 = new Uint8Array(audioBuffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    const audioBase64 = btoa(binary);

    return Response.json({
      audio_data: audioBase64,
      content_type: 'audio/mpeg',
      size_bytes: audioBuffer.byteLength,
      voice_used: elVoiceId,
      provider: 'elevenlabs',
      speed: voice_speed,
    });

  } catch (error) {
    console.error('[Voiceover] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
