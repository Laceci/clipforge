import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * ClipForge — API Connection Health Checker
 * Runs lightweight auth-only checks on each third-party API.
 * Does NOT generate any content — safe to call at any time with no cost.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const results: Record<string, unknown> = {};

    // ── ElevenLabs ────────────────────────────────────────────────────────────
    const elKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elKey) {
      results.elevenlabs = { ok: false, error: 'ELEVENLABS_API_KEY not configured' };
    } else {
      try {
        const res = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': elKey },
        });
        if (res.ok) {
          const data = await res.json();
          const sub = data.subscription || {};
          results.elevenlabs = {
            ok: true,
            plan: sub.tier || 'unknown',
            characters_used: sub.character_count ?? null,
            characters_limit: sub.character_limit ?? null,
          };
        } else {
          const body = await res.text();
          results.elevenlabs = {
            ok: false,
            error: res.status === 401
              ? 'API key is invalid or expired'
              : `HTTP ${res.status}: ${body.slice(0, 100)}`,
          };
        }
      } catch (e) {
        results.elevenlabs = { ok: false, error: e.message };
      }
    }

    // ── Creatomate ────────────────────────────────────────────────────────────
    const cmKey = Deno.env.get('CREATOMATE_API_KEY');
    if (!cmKey) {
      results.creatomate = { ok: false, error: 'CREATOMATE_API_KEY not configured' };
    } else {
      try {
        const res = await fetch('https://api.creatomate.com/v1/renders?limit=1', {
          headers: { Authorization: `Bearer ${cmKey}` },
        });
        if (res.ok) {
          results.creatomate = { ok: true };
        } else {
          const body = await res.text();
          results.creatomate = {
            ok: false,
            error: res.status === 401
              ? 'API key is invalid or expired'
              : `HTTP ${res.status}: ${body.slice(0, 100)}`,
          };
        }
      } catch (e) {
        results.creatomate = { ok: false, error: e.message };
      }
    }

    // ── Video Provider ─────────────────────────────────────────────────────────
    const provider = Deno.env.get('VIDEO_PROVIDER') || 'image_fallback';
    const providerKeyMap: Record<string, string> = {
      fal_video:   'FAL_API_KEY',
      runway:      'RUNWAY_API_KEY',
      luma:        'LUMA_API_KEY',
      higgsfield:  'HIGGSFIELD_API_KEY',
    };

    if (provider === 'image_fallback') {
      results.video_provider = { ok: true, name: provider, note: 'Built-in — no API key required' };
    } else {
      const envKey = providerKeyMap[provider];
      const hasKey = envKey ? !!Deno.env.get(envKey) : false;
      results.video_provider = {
        ok: hasKey,
        name: provider,
        error: hasKey ? null : `${envKey} not configured`,
      };
    }

    return Response.json(results);
  } catch (error) {
    console.error('[checkApiConnections] ❌', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
