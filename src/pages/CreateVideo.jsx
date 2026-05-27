import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Wand2, Calendar, ChevronDown, ChevronUp, Check, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AutoSettingsPanel from '../components/create/AutoSettingsPanel';
import PipelineProgress from '../components/create/PipelineProgress';
import ResultsPanel from '../components/create/ResultsPanel';
import SceneReorderStep from '../components/create/SceneReorderStep';
import PublishSettingsPanel from '../components/publish/PublishSettingsPanel';
import { runVideoPipeline } from '../lib/videoPipeline';
import { autoSelectSettings, getPresetById } from '../lib/voiceSystem';
import { CATEGORY_PRESETS, CATEGORIES } from '../lib/categoryPresets';
import { getBrandConfig, applyBrandConfigToProject, injectBrandFont, logBrandConfig } from '../lib/brandAssetManager';
import UpgradePrompt from '../components/marketing/UpgradePrompt';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Input' },
  { num: 2, label: 'Settings' },
  { num: 3, label: 'Generating' },
  { num: 3.5, label: 'Review Scenes' },
  { num: 4, label: 'Results' },
];

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube Shorts', icon: '▶️' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'instagram', label: 'Instagram Reels', icon: '📸' },
  { id: 'facebook', label: 'Facebook Reels', icon: '📘' },
];

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="flex items-center gap-1.5">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              current > s.num ? 'bg-primary text-primary-foreground' :
              current === s.num ? 'bg-primary/20 text-primary ring-2 ring-primary/40' :
              'bg-secondary text-muted-foreground'
            )}>
              {current > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
            </div>
            <span className={cn('text-xs font-medium hidden md:block', current === s.num ? 'text-primary' : 'text-muted-foreground')}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('w-8 h-0.5 rounded-full transition-all', current > s.num ? 'bg-primary' : 'bg-secondary')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CreateVideo() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('category') || 'custom';

  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ step: '', progress: 0, label: '' });
  const [genError, setGenError] = useState(null);
  const [savedProjectId, setSavedProjectId] = useState(null);
  const [showScriptInput, setShowScriptInput] = useState(false);

  // Load user preferences
  const { data: prefsList = [] } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => base44.entities.UserPreferences.list(),
  });
  const userPrefs = prefsList[0];

  const buildDefaults = (category) => {
    const preset = CATEGORY_PRESETS[category] || CATEGORY_PRESETS.custom;
    const voiceSettings = autoSelectSettings(category);
    return {
      title: '',
      status: 'draft',
      template_category: category,
      platforms: userPrefs?.default_platforms || [],
      publish_mode: userPrefs?.default_publish_mode || 'instant',
      scheduled_at: '',
      // auto settings from category + user prefs
      voice_preset: userPrefs?.default_voice_preset || voiceSettings.voice_preset,
      voice_id: voiceSettings.voice_id,
      voice_style: voiceSettings.voice_style,
      voice_speed: userPrefs?.default_voice_speed ?? voiceSettings.voice_speed,
      voice_pitch: userPrefs?.default_voice_pitch ?? voiceSettings.voice_pitch,
      voice_emphasis: voiceSettings.voice_emphasis,
      voice_pause: voiceSettings.voice_pause,
      voice_intensity: voiceSettings.voice_intensity,
      visual_style: userPrefs?.default_visual_style || preset.visual_style,
      caption_style: userPrefs?.default_caption_style || preset.caption_style,
      caption_color: userPrefs?.default_caption_color || '#FFFFFF',
      highlight_color: userPrefs?.default_highlight_color || preset.highlight_color,
      animation_style: userPrefs?.default_animation_style || preset.animation_style,
      music_track: userPrefs?.default_music_category || preset.music_track,
      music_volume: preset.music_volume,
      voice_volume: 80,
      resolution: userPrefs?.default_resolution || preset.resolution,
      duration_target: preset.duration_target,
    };
  };

  const [projectData, setProjectData] = useState(() => buildDefaults(initialCategory));
  const updateData = (updates) => setProjectData(prev => ({ ...prev, ...updates }));
  const updatePublishSettings = (settings) => {
    setProjectData(prev => ({ ...prev, ...settings }));
  };

  // Reapply defaults when category changes
  const handleCategoryChange = (cat) => {
    const newDefaults = buildDefaults(cat);
    setProjectData(prev => ({ ...newDefaults, topic: prev.topic, script: prev.script, title: prev.title }));
  };

  const handleGenerate = async () => {
    if (!projectData.topic?.trim() && !projectData.script?.trim()) {
      toast.error('Enter a topic or script first.');
      return;
    }
    setIsGenerating(true);
    setGenError(null);
    setStep(3);

    try {
      // Get and apply brand configuration
      const brandConfig = getBrandConfig(userPrefs);
      logBrandConfig(brandConfig);

      // Inject brand font if available
      if (brandConfig.font.enabled) {
        injectBrandFont(brandConfig.font.url, brandConfig.font.name);
      }

      // Apply brand watermark to project if enabled
      let enhancedProjectData = { ...projectData };
      if (brandConfig.watermark.enabled) {
        enhancedProjectData = applyBrandConfigToProject(enhancedProjectData, brandConfig);
        toast.success('Watermark will be applied to your video');
      }

      // Save initial project record with brand assets
      const initProject = await base44.entities.Project.create({
        title: projectData.topic || 'Untitled',
        status: 'generating',
        template_category: projectData.template_category,
        generation_progress: 0,
        ...enhancedProjectData,
      });
      setSavedProjectId(initProject.id);

      // Use image_fallback by default to avoid fal.ai costs during testing
      enhancedProjectData.video_provider = userPrefs?.video_provider ?? 'image_fallback';

      const result = await runVideoPipeline(enhancedProjectData, (prog) => {
        setGenProgress(prog);
        updateData({ generation_progress: prog.progress });
        if (savedProjectId || initProject?.id) {
          base44.entities.Project.update(initProject.id, { generation_progress: prog.progress, status: 'generating' }).catch(() => {});
        }
      });

      // Save completed project
      const { title, topic } = projectData;
      await base44.entities.Project.update(initProject.id, {
        ...result,
        title: title || topic || 'Untitled',
        thumbnail_url: result.scenes?.[0]?.image_url || '',
        status: 'ready',
      });

      updateData({ ...result, id: initProject.id });
      setSavedProjectId(initProject.id);
      setIsGenerating(false);
      setStep(3.5);
      toast.success('Scenes generated! Review and reorder before final render.');

      // Auto-publish if mode is instant and platforms selected
      if (projectData.publish_mode === 'instant' && projectData.platforms?.length > 0) {
        await base44.entities.ScheduledPost.create({
          project_id: initProject.id,
          project_title: title || topic || 'Untitled',
          thumbnail_url: result.scenes?.[0]?.image_url || '',
          platforms: projectData.platforms,
          status: 'scheduled',
          hashtags: userPrefs?.default_hashtags?.[projectData.template_category] || '',
        });
        toast.success(`Queued for publishing to ${projectData.platforms.join(', ')}`);
      }
    } catch (err) {
      setGenError(err.message || 'Generation failed. Please try again.');
      setIsGenerating(false);
      if (savedProjectId) {
        await base44.entities.Project.update(savedProjectId, { status: 'failed', error_message: err.message }).catch(() => {});
      }
      updateData({ status: 'failed' });
    }
  };

  const handleSceneConfirm = async (reorderedScenes) => {
    updateData({ scenes: reorderedScenes });
    if (savedProjectId) {
      await base44.entities.Project.update(savedProjectId, { scenes: reorderedScenes }).catch(() => {});
    }
    setStep(4);
  };

  const handleExport = async () => {
    if (savedProjectId) {
      await base44.entities.Project.update(savedProjectId, { status: 'exported' });
    }
    await base44.entities.UsageLog.create({ action: 'video_exported', project_id: savedProjectId, details: { title: projectData.title } }).catch(() => {});
    navigate('/');
  };

  const togglePlatform = (id) => {
    const current = projectData.platforms || [];
    const next = current.includes(id) ? current.filter(p => p !== id) : [...current, id];
    updateData({ platforms: next });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-8 gap-3">
        <Button variant="ghost" onClick={() => navigate('/')} disabled={isGenerating} className="gap-1.5 text-muted-foreground px-2 md:px-4">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
        </Button>
        <StepBar current={step} />
        <div className="w-8 md:w-24" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>

          {/* ── STEP 1: INPUT ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold mb-1">What's your video about?</h2>
                <p className="text-xs md:text-sm text-muted-foreground">Enter a topic and let ClipForge do everything automatically</p>
              </div>

              <div className="glass-card rounded-2xl p-6 space-y-5">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {CATEGORIES.slice(0, 10).map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => handleCategoryChange(cat.value)}
                        className={cn(
                          'flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-center transition-all',
                          projectData.template_category === cat.value
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/20'
                        )}
                      >
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-[10px] font-medium leading-tight">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Topic or Hook</label>
                  <Input
                    placeholder="e.g. The untold secret of successful people's morning routine..."
                    value={projectData.topic || ''}
                    onChange={e => updateData({ topic: e.target.value, title: e.target.value })}
                    className="bg-secondary/50 border-border rounded-xl text-sm"
                  />
                </div>

                {/* Optional script toggle */}
                <button
                  onClick={() => setShowScriptInput(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showScriptInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showScriptInput ? 'Hide' : 'Paste your own script (optional)'}
                </button>
                {showScriptInput && (
                  <Textarea
                    placeholder="Paste your script here, or leave empty to auto-generate..."
                    value={projectData.script || ''}
                    onChange={e => updateData({ script: e.target.value })}
                    className="bg-secondary/50 border-border rounded-xl text-sm min-h-[140px] resize-none"
                  />
                )}

                {/* Platform selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Publish To</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all',
                          projectData.platforms?.includes(p.id)
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/20'
                        )}
                      >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                        {projectData.platforms?.includes(p.id) && <Check className="w-3 h-3 ml-auto" />}
                      </button>
                    ))}
                  </div>
                  {projectData.platforms?.length === 0 && (
                    <UpgradePrompt
                      title="Unlock Multi-Platform Publishing"
                      description="Auto-publish to all platforms with one click"
                      feature="Available in Pro plan"
                      plan="Pro"
                      image="📱"
                      features={['Scheduled posts', 'Auto captions', 'Analytics tracking']}
                    />
                  )}
                </div>

                {/* Publish mode */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">When to Publish</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'instant', label: 'Publish Now', icon: <Zap className="w-3.5 h-3.5" /> },
                      { id: 'scheduled', label: 'Schedule Later', icon: <Calendar className="w-3.5 h-3.5" /> },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => updateData({ publish_mode: opt.id })}
                        className={cn('flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all',
                          projectData.publish_mode === opt.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/20')}>
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                  {projectData.publish_mode === 'scheduled' && (
                    <Input type="datetime-local" value={projectData.scheduled_at || ''} onChange={e => updateData({ scheduled_at: e.target.value })}
                      className="bg-secondary/50 border-border rounded-xl text-xs" />
                  )}
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!projectData.topic?.trim() && !projectData.script?.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-3 font-bold text-sm md:text-base neon-glow sticky bottom-20 md:static"
              >
                Continue →
              </Button>
            </div>
          )}

          {/* ── STEP 2: AUTO SETTINGS ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold mb-1">Auto Settings Applied</h2>
                <p className="text-xs md:text-sm text-muted-foreground">Optimized for <strong>{CATEGORY_PRESETS[projectData.template_category]?.label}</strong> — override if needed</p>
              </div>

              <AutoSettingsPanel data={projectData} onChange={updateData} category={projectData.template_category} />
              
              <PublishSettingsPanel projectData={projectData} onChange={updatePublishSettings} />

              <div className="flex gap-3 sticky bottom-20 md:static">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl border-border">
                  ← Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  className="flex-[2] bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-sm md:text-base neon-glow gap-2"
                >
                  <Wand2 className="w-4 h-4 md:w-5 md:h-5" />
                  {projectData.platforms?.length > 0 ? 'Generate & Publish' : 'Generate Video'}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: GENERATING ── */}
          {step === 3 && (
            <div className="space-y-4">
              <PipelineProgress
                currentStep={genProgress.step}
                progress={genProgress.progress}
                statusLabel={genProgress.label}
                error={genError}
              />
              {genError && (
                <Button onClick={() => setStep(2)} className="w-full rounded-xl" variant="outline">
                  ← Go Back & Retry
                </Button>
              )}
            </div>
          )}

          {/* ── STEP 3.5: SCENE REORDER ── */}
          {step === 3.5 && (
            <SceneReorderStep
              scenes={projectData.scenes || []}
              projectData={projectData}
              onConfirm={handleSceneConfirm}
            />
          )}

          {/* ── STEP 4: RESULTS ── */}
          {step === 4 && (
            <ResultsPanel
              projectData={projectData}
              projectId={savedProjectId}
              onExport={handleExport}
              onRetry={() => { setStep(2); setGenError(null); }}
            />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}