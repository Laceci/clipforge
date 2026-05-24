import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      images,
      story_prompt,
      story_type,
      story_tone,
      video_length,
    } = await req.json();

    if (!images || !story_prompt) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract character labels and consolidate face embeddings for identity consistency
    const characterMap = {};
    images.forEach(img => {
      const label = img.character_label;
      if (label) {
        if (!characterMap[label]) {
          characterMap[label] = [];
        }
        characterMap[label].push(img.face_embedding);
      }
    });

    // Merge multiple embeddings per character into a single unified identity profile
    const consolidatedCharacters = await Promise.all(
      Object.entries(characterMap).map(async ([label, embeddings]) => {
        if (embeddings.length === 1) {
          return { label, identity_profile: embeddings[0] };
        }

        // If multiple images of same person, merge embeddings for stronger consistency
        const mergedResult = await base44.integrations.Core.InvokeLLM({
          prompt: `You have ${embeddings.length} facial analysis descriptions for the same person labeled "${label}". 
Merge them into a single unified identity profile that highlights the most consistent features across all images:

${embeddings.map((e, i) => `Image ${i + 1}: ${e}`).join('\n\n')}

Create a master identity profile that describes this person with maximum consistency for scene generation. Focus on invariant features that won't change across different poses/angles/lighting.`,
          model: 'gpt_5'
        });

        return {
          label,
          identity_profile: typeof mergedResult === 'string' ? mergedResult : mergedResult.toString(),
        };
      })
    );

    const characters = consolidatedCharacters.map(c => c.label);
    const characterIdentities = consolidatedCharacters.reduce((acc, c) => ({
      ...acc,
      [c.label]: c.identity_profile,
    }), {});

    // Generate story narrative using LLM
    const storyResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cinematic story writer. Create an engaging ${video_length} story where these characters appear.

Characters: ${characters.join(', ')}
User's story idea: ${story_prompt}
Story type: ${story_type}
Tone: ${story_tone}

Generate a compelling narrative that will be visualized as a cinematic video. Include:
1. Opening hook (what's happening)
2. Build-up (rising action with characters)
3. Climax (peak moment)
4. Resolution (satisfying ending)

Keep it vivid and cinematic. The story will be turned into video scenes.`,
      model: 'gpt_5'
    });

    const generatedStory = typeof storyResult === 'string' ? storyResult : storyResult.toString();

    // Generate scene breakdown with explicit identity consistency instructions
    const identityConstraints = Object.entries(characterIdentities)
      .map(([label, profile]) => `${label}: ${profile}`)
      .join('\n\n');

    const scenesResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Break down this story into 5-8 cinematic video scenes for a ${video_length} video.

CRITICAL: ALL scenes must feature characters with IDENTICAL appearance throughout.

Character Identity Profiles (MUST MAINTAIN EXACT CONSISTENCY):
${identityConstraints}

Story: ${generatedStory}
Characters: ${characters.join(', ')}
Story Type: ${story_type}

For each scene, describe:
- Scene index
- 1-2 sentence description
- Environment/setting
- Which characters appear (use exact character labels)
- Action/movement
- Camera angle
- CONSISTENCY NOTES: How each character maintains their exact appearance in this scene

FORMAT as JSON: {scene_index, description, environment, characters: [], action, camera_angle, consistency_notes}

IMPORTANT: Each character must be visually identical across all scenes. No face changes, no different features, same person in every appearance.`,
      response_json_schema: {
        type: 'object',
        properties: {
          scenes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                scene_index: { type: 'number' },
                description: { type: 'string' },
                environment: { type: 'string' },
                characters: { type: 'array', items: { type: 'string' } },
                action: { type: 'string' },
                camera_angle: { type: 'string' },
              },
            },
          },
        },
      },
      model: 'gpt_5'
    });

    const scenes = scenesResult.scenes || [];

    // Generate voiceover narration
    const voiceoverResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Write an engaging voiceover narration for this cinematic story. Make it emotional, dramatic, and match the ${story_tone} tone.

Story: ${generatedStory}

Write a cohesive voiceover script that ties the scenes together. It should feel like a movie narrator.`,
      model: 'gpt_5'
    });

    const voiceover_script = typeof voiceoverResult === 'string' ? voiceoverResult : voiceoverResult.toString();

    // Validate identity consistency across all scenes
    const consistencyValidation = await base44.integrations.Core.InvokeLLM({
      prompt: `Review these scenes and confirm character identity consistency. Each character must appear IDENTICAL in every scene.

Character Profiles:
${Object.entries(characterIdentities).map(([label, profile]) => `${label}: ${profile}`).join('\n\n')}

Scenes:
${scenes.map((s, i) => `Scene ${i + 1}: ${s.description}. Characters: ${s.characters.join(', ')}`).join('\n')}

Provide a JSON validation report: {
  is_consistent: boolean,
  character_consistency: {[character_label]: {is_consistent: boolean, notes: string}},
  issues: [string],
  recommendations: [string]
}

If any inconsistencies are detected, provide specific recommendations to fix them.`,
      response_json_schema: {
        type: 'object',
        properties: {
          is_consistent: { type: 'boolean' },
          character_consistency: { type: 'object' },
          issues: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
      },
      model: 'gpt_5'
    });

    console.log('[ImageToStory] Identity Consistency Check:', consistencyValidation);

    // Build scene objects with identity consistency enforcement
    const processedScenes = scenes.map((scene, idx) => ({
      scene_index: scene.scene_index || idx,
      description: scene.description,
      environment: scene.environment,
      characters: scene.characters || [],
      action: scene.action,
      camera_angle: scene.camera_angle,
      character_identities: scene.characters.reduce((acc, char) => ({
        ...acc,
        [char]: characterIdentities[char],
      }), {}),
      consistency_notes: scene.consistency_notes || 'Maintain character identity from scene 1',
      video_url: `https://placeholder-video-${idx}.mp4`, // Placeholder for actual video generation
      duration: parseInt(video_length) / scenes.length,
    }));

    // Calculate total duration based on video length
    const durationSeconds = parseInt(video_length);
    
    // Generate thumbnail from first image
    const thumbnail_url = images[0]?.image_url || '';

    return Response.json({
      generated_story: generatedStory,
      voiceover_script,
      scenes: processedScenes,
      character_identities: characterIdentities,
      identity_consistency: consistencyValidation,
      thumbnail_url,
      video_duration: durationSeconds,
      final_video_url: `https://placeholder-final-video.mp4`, // Placeholder for actual rendering
      music_track: 'epic_cinematic',
    });
  } catch (error) {
    console.error('[ImageToStory] Error:', error);
    return Response.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
});