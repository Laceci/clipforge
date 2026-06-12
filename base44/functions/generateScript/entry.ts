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
    const sceneCount = Math.max(5, Math.min(10, Math.round(target_duration / 7)));

    const systemPrompt = `You are an expert viral short-form video scriptwriter. You write scripts specifically for faceless AI-narrated videos on TikTok, Instagram Reels, and YouTube Shorts. Your scripts generate millions of views because you understand viewer psychology, retention hooks, and pattern interrupts.`;

    const userPrompt = `Write a viral ${target_duration}-second faceless video script.

TOPIC: ${topic}
CATEGORY STYLE: ${styleGuide}

STRICT REQUIREMENTS:
- Exactly ${sceneCount} scenes, each separated by [SCENE]
- Each scene: 1-3 short punchy sentences (10-20 words each)
- Scene 1 MUST be an irresistible hook that stops the scroll
- Use pattern interrupts, curiosity gaps, and emotional triggers throughout
- End with a powerful CTA or conclusion that drives comments/shares
- NO stage directions, NO "(pause)", NO asterisks, NO descriptions — pure narration text only
- NO filler phrases like "In conclusion" or "To summarise"
- Write as if speaking directly to ONE person watching alone at 2am

OUTPUT: Only the script text with [SCENE] separating each scene. Nothing else.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.85,
        max_tokens: 800,
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
    const script = json.choices?.[0]?.message?.content?.trim();

    if (!script) throw new Error('OpenAI returned empty script');

    const wordCount = script.replace(/\[SCENE\]/g, '').split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.round(wordCount / 2.3);

    console.log(`[GenerateScript] ✅ ${sceneCount} scenes | ~${estimatedDuration}s | topic: "${topic.slice(0, 50)}"`);

    return Response.json({ script, estimated_duration: estimatedDuration, word_count: wordCount });

  } catch (err) {
    console.error('[GenerateScript] ❌', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
