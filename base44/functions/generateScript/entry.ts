// @ts-nocheck
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CATEGORY_PROMPTS = {
  motivation:       'Write in a powerful, punchy motivational style. Use strong imperatives and emotional triggers. Build towards an empowering conclusion.',
  storytelling:     'Write in an engaging narrative style. Build suspense, use vivid descriptions, and create emotional connection with the viewer.',
  facts:            'Write in a curious, surprising style. Lead with a shocking or counterintuitive fact. Use "Did you know..." or "Scientists discovered..." hooks.',
  horror:           'Write in a slow-build eerie style. Create atmosphere and dread. Use pauses and short punchy reveals for maximum impact.',
  finance:          'Write in a confident, insider-knowledge style. Make viewers feel they are learning secrets most people don\'t know.',
  fitness:          'Write in an energetic, action-driving style. Use direct commands and vivid physical imagery. Make viewers want to move.',
  dark_psychology:  'Write in a calm but unsettling revelatory style. Expose hidden manipulation tactics or psychological truths people ignore.',
  self_improvement: 'Write in a warm but direct coaching style. Identify a relatable pain point, then walk through a clear transformation.',
  business:         'Write in a sharp, insight-driven style. Share counterintuitive business truths with the authority of someone who has been inside.',
  custom:           'Write in whatever style best suits the topic. Prioritise emotional resonance and viewer retention.',
};

// Visual style context tells GPT-4o what kind of image to describe
const VISUAL_STYLE_GUIDE = {
  motivation:       'dramatic motivational imagery — silhouettes, sunrise, lone figure, urban grit, achievement',
  storytelling:     'cinematic narrative — moody lighting, close-ups of faces, atmospheric environments',
  facts:            'documentary style — scientific imagery, nature, space, microscopic, historical photos',
  horror:           'dark horror atmosphere — abandoned places, shadows, dim light, eerie emptiness, fog',
  finance:          'wealth and money imagery — city skylines, gold, charts, luxury minimalism, hands holding cash',
  fitness:          'athletic and body imagery — training, muscles, sweat, gym, outdoor sports, motion blur',
  dark_psychology:  'psychological tension — chess pieces, faces in shadow, manipulation metaphors, mirrors',
  self_improvement: 'personal growth imagery — person reading, journaling, calm spaces, morning routines',
  business:         'sharp corporate imagery — boardrooms, handshakes, minimalist offices, leadership moments',
  custom:           'cinematic photorealistic imagery matching the topic',
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { topic, category = 'motivation', target_duration = 50 } = await req.json();

    if (!topic?.trim()) return Response.json({ error: 'topic is required' }, { status: 400 });

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) return Response.json({ error: 'OPENAI_API_KEY not set in Base44 Secrets' }, { status: 500 });

    const styleGuide = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.custom;
    const visualGuide = VISUAL_STYLE_GUIDE[category] || VISUAL_STYLE_GUIDE.custom;
    const sceneCount = Math.max(5, Math.min(10, Math.round(target_duration / 7)));

    const systemPrompt = `You are an expert viral short-form video scriptwriter and visual director. You create scripts for faceless AI-narrated videos on TikTok, Instagram Reels, and YouTube Shorts that generate millions of views.`;

    const userPrompt = `Write a viral ${target_duration}-second faceless video script AND matching visual descriptions.

TOPIC: ${topic}
NARRATION STYLE: ${styleGuide}
VISUAL DIRECTION: ${visualGuide}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "scenes": [
    {
      "narration": "spoken narration text for this scene",
      "visual": "specific cinematic image description for AI image generation"
    }
  ]
}

NARRATION RULES (${sceneCount} scenes):
- Each scene: 1-3 short punchy sentences, 10-20 words each
- Scene 1 MUST be an irresistible scroll-stopping hook
- Use curiosity gaps, pattern interrupts, emotional triggers
- Last scene: powerful CTA or conclusion that drives comments/shares
- NO stage directions, NO "(pause)", NO asterisks — pure spoken words only
- NO filler like "In conclusion" or "To summarize"
- Write as if speaking to ONE person alone at 2am

VISUAL RULES (one per scene, must match narration mood):
- Describe a specific photorealistic image: subject, setting, lighting, angle
- 9:16 vertical composition, cinematic quality, dramatic lighting
- NO text, NO logos, NO watermarks in description
- Match the emotional tone of the narration
- Be specific: "silhouette of a lone man standing on a rooftop at sunset, city lights below, warm orange haze" not "inspirational image"

Return exactly ${sceneCount} scenes.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.85,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error (${res.status}): ${err.slice(0, 150)}`);
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('OpenAI returned empty response');

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('OpenAI returned invalid JSON');
    }

    const scenes: Array<{ narration: string; visual: string }> = parsed.scenes || [];
    if (!scenes.length) throw new Error('No scenes in response');

    // Build script string for backward compat (ScriptStep shows it as plain text)
    const script = scenes.map(s => s.narration).join('\n[SCENE]\n');
    const scene_visuals = scenes.map(s => s.visual);

    const wordCount = scenes.reduce((n, s) => n + s.narration.split(/\s+/).filter(Boolean).length, 0);
    const estimatedDuration = Math.round(wordCount / 2.3);

    console.log(`[GenerateScript] ✅ ${scenes.length} scenes | ~${estimatedDuration}s | topic: "${topic.slice(0, 50)}"`);

    return Response.json({ script, scene_visuals, estimated_duration: estimatedDuration, word_count: wordCount });

  } catch (err) {
    console.error('[GenerateScript] ❌', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
