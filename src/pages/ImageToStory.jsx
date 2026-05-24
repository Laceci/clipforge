import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Upload, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUploadStep from '../components/imageToStory/ImageUploadStep';
import CharacterLabelingStep from '../components/imageToStory/CharacterLabelingStep';
import StorySelectionStep from '../components/imageToStory/StorySelectionStep';
import StoryGenerationStep from '../components/imageToStory/StoryGenerationStep';
import ScriptEditorPanel from '../components/imageToStory/ScriptEditorPanel';
import TimelineEditor from '../components/imageToStory/TimelineEditor';
import ResultsPanel from '../components/imageToStory/ResultsPanel';
import { cn } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Upload Photos' },
  { num: 2, label: 'Label Characters' },
  { num: 3, label: 'Choose Story' },
  { num: 4, label: 'Generate' },
  { num: 4.5, label: 'Edit Script' },
  { num: 4.7, label: 'Timeline' },
  { num: 5, label: 'Results' },
];

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
            current > s.num ? 'bg-primary text-primary-foreground' :
            current === s.num ? 'bg-primary/20 text-primary ring-2 ring-primary/40' :
            'bg-secondary text-muted-foreground'
          )}>
            {s.num}
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('w-8 h-0.5 rounded-full transition-all', current > s.num ? 'bg-primary' : 'bg-secondary')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ImageToStory() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({
    title: 'Story Video',
    status: 'draft',
    uploaded_images: [],
    character_count: 0,
    story_prompt: '',
    story_type: 'adventure',
    story_tone: 'fun',
    video_length: '60s',
    generated_story: '',
    scenes: [],
    voiceover_script: '',
    music_track: 'epic_cinematic',
    generation_progress: 0,
  });
  const [savedProjectId, setSavedProjectId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  const updateData = (updates) => setProjectData(prev => ({ ...prev, ...updates }));

  const handleNext = async () => {
    if (step === 1) {
      if (projectData.uploaded_images.length === 0) {
        alert('Please upload at least one photo');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const allLabeled = projectData.uploaded_images.every(img => img.character_label?.trim());
      if (!allLabeled) {
        alert('Please label all characters');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!projectData.story_prompt?.trim()) {
        alert('Please enter a story prompt');
        return;
      }
      setStep(4);
      await handleGenerate();
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError(null);

    try {
      // Save initial project
      const initProject = await base44.entities.ImageToStoryProject.create({
        title: projectData.story_prompt.slice(0, 50) || 'Story Video',
        status: 'generating',
        uploaded_images: projectData.uploaded_images,
        character_count: projectData.uploaded_images.length,
        story_prompt: projectData.story_prompt,
        story_type: projectData.story_type,
        story_tone: projectData.story_tone,
        video_length: projectData.video_length,
        generation_progress: 0,
      });
      setSavedProjectId(initProject.id);

      // Call backend to generate story and scenes
      const result = await base44.functions.invoke('generateImageToStory', {
        images: projectData.uploaded_images,
        story_prompt: projectData.story_prompt,
        story_type: projectData.story_type,
        story_tone: projectData.story_tone,
        video_length: projectData.video_length,
      });

      // Update with generated story
      await base44.entities.ImageToStoryProject.update(initProject.id, {
        ...result,
        status: 'ready',
        generation_progress: 100,
      });

      updateData({
        ...result,
        id: initProject.id,
        status: 'ready',
      });
      setSavedProjectId(initProject.id);
      setStep(4.5);
      setIsGenerating(false);
    } catch (err) {
      setGenError(err.message || 'Generation failed');
      setIsGenerating(false);
      if (savedProjectId) {
        await base44.entities.ImageToStoryProject.update(savedProjectId, {
          status: 'failed',
          error_message: err.message,
        });
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-3">
        <Button variant="ghost" onClick={() => navigate('/')} disabled={isGenerating} className="gap-1.5 text-muted-foreground px-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Button>
        <StepBar current={step} />
        <div className="w-24" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>

          {/* STEP 1: Upload Photos */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">Upload Your Photos</h2>
                <p className="text-muted-foreground text-sm">Upload 1–5 photos of yourself or others to appear in your story</p>
              </div>
              <ImageUploadStep data={projectData} onChange={updateData} />
              <Button
                onClick={handleNext}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-3 font-bold neon-glow gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: Label Characters */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">Name Your Characters</h2>
                <p className="text-muted-foreground text-sm">Label each person so they stay consistent in your story</p>
              </div>
              <CharacterLabelingStep data={projectData} onChange={updateData} />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl border-border">
                  ← Back
                </Button>
                <Button onClick={handleNext} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold neon-glow gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Choose Story */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">Create Your Story</h2>
                <p className="text-muted-foreground text-sm">Tell us what adventure you want to be in</p>
              </div>
              <StorySelectionStep data={projectData} onChange={updateData} />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-xl border-border">
                  ← Back
                </Button>
                <Button onClick={handleNext} disabled={!projectData.story_prompt?.trim()} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold neon-glow gap-2">
                  <Sparkles className="w-4 h-4" /> Generate Story
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Generate */}
          {step === 4 && (
            <StoryGenerationStep error={genError} isGenerating={isGenerating} />
          )}

          {/* STEP 4.5: Script Editor */}
          {step === 4.5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">Fine-Tune Your Script</h2>
                <p className="text-muted-foreground text-sm">Adjust the tone and review pacing metrics</p>
              </div>
              <ScriptEditorPanel
                initialScript={projectData.voiceover_script}
                onScriptChange={(newScript) => updateData({ voiceover_script: newScript })}
                projectData={projectData}
                onToneChange={(tone) => updateData({ story_tone: tone })}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1 rounded-xl border-border">
                  ← Back
                </Button>
                <Button
                  onClick={() => setStep(4.7)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold neon-glow gap-2"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4.7: Timeline Editor */}
          {step === 4.7 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">Timeline Editor</h2>
                <p className="text-muted-foreground text-sm">Reorder scenes, adjust timing, or generate new variations</p>
              </div>
              <TimelineEditor
                scenes={projectData.scenes || []}
                onScenesChange={(newScenes) => updateData({ scenes: newScenes })}
                characterIdentities={projectData.character_identities || {}}
                projectData={projectData}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4.5)} className="flex-1 rounded-xl border-border">
                  ← Back
                </Button>
                <Button
                  onClick={() => setStep(5)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold neon-glow gap-2"
                >
                  Finalize <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: Results */}
          {step === 5 && (
            <ResultsPanel projectData={projectData} projectId={savedProjectId} />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}