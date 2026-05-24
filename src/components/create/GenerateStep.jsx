import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Mic, Eye, Type, Music, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

const voiceStyles = [
  { value: 'deep', label: 'Deep & Powerful' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'motivational', label: 'Motivational' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'calm', label: 'Calm & Soothing' },
  { value: 'energetic', label: 'Energetic' },
];

const visualStyles = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'dark', label: 'Dark & Moody' },
  { value: 'anime', label: 'Anime' },
];

const captionStyles = [
  { value: 'word_by_word', label: 'Word by Word' },
  { value: 'sentence', label: 'Sentence' },
  { value: 'tiktok_bold', label: 'TikTok Bold' },
  { value: 'highlight', label: 'Highlight Keywords' },
  { value: 'minimal', label: 'Minimal' },
];

const musicTracks = [
  { value: 'epic_cinematic', label: 'Epic Cinematic' },
  { value: 'dark_ambient', label: 'Dark Ambient' },
  { value: 'motivational_piano', label: 'Motivational Piano' },
  { value: 'lofi_chill', label: 'Lo-Fi Chill' },
  { value: 'dramatic_orchestral', label: 'Dramatic Orchestral' },
  { value: 'upbeat_corporate', label: 'Upbeat Corporate' },
  { value: 'none', label: 'No Music' },
];

export default function GenerateStep({ data, onChange, onGenerate }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    // Parse script into scenes
    const scriptParts = data.script.split('[SCENE]').map(s => s.trim()).filter(Boolean);
    const scenes = scriptParts.length > 1 ? scriptParts : data.script.split('\n\n').filter(s => s.trim());
    
    // Generate scene images using AI
    const generatedScenes = [];
    for (let i = 0; i < scenes.length; i++) {
      const sceneText = scenes[i].trim();
      if (!sceneText) continue;

      const imageResult = await base44.integrations.Core.GenerateImage({
        prompt: `${data.visual_style || 'cinematic'} style, vertical 9:16 aspect ratio, dramatic lighting, high quality. Scene: ${sceneText.substring(0, 200)}`,
      });

      generatedScenes.push({
        text: sceneText,
        image_url: imageResult.url,
        duration: Math.round((sceneText.split(/\s+/).length / 2.5)),
        animation: 'pan_zoom',
        order: i,
      });
    }

    onChange({ scenes: generatedScenes, status: 'ready' });
    setGenerating(false);
    onGenerate();
  };

  const SettingSection = ({ icon: Icon, title, children }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Customize & Generate</h2>
        <p className="text-muted-foreground text-sm">Configure voice, visuals, and captions for your video</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voiceover */}
        <div className="glass-card rounded-2xl p-5">
          <SettingSection icon={Mic} title="AI Voiceover">
            <Select value={data.voice_style || 'motivational'} onValueChange={(v) => onChange({ voice_style: v })}>
              <SelectTrigger className="bg-secondary/50 border-border rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {voiceStyles.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Speed</span>
                <span>{data.voice_speed || 1.0}x</span>
              </div>
              <Slider
                value={[data.voice_speed || 1.0]}
                onValueChange={([v]) => onChange({ voice_speed: v })}
                min={0.5}
                max={2.0}
                step={0.1}
                className="py-2"
              />
            </div>
          </SettingSection>
        </div>

        {/* Visual Style */}
        <div className="glass-card rounded-2xl p-5">
          <SettingSection icon={Eye} title="Visual Style">
            <Select value={data.visual_style || 'cinematic'} onValueChange={(v) => onChange({ visual_style: v })}>
              <SelectTrigger className="bg-secondary/50 border-border rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {visualStyles.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </SettingSection>
        </div>

        {/* Captions */}
        <div className="glass-card rounded-2xl p-5">
          <SettingSection icon={Type} title="Caption Style">
            <Select value={data.caption_style || 'tiktok_bold'} onValueChange={(v) => onChange({ caption_style: v })}>
              <SelectTrigger className="bg-secondary/50 border-border rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {captionStyles.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </SettingSection>
        </div>

        {/* Music */}
        <div className="glass-card rounded-2xl p-5">
          <SettingSection icon={Music} title="Background Music">
            <Select value={data.music_track || 'epic_cinematic'} onValueChange={(v) => onChange({ music_track: v })}>
              <SelectTrigger className="bg-secondary/50 border-border rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {musicTracks.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Volume</span>
                <span>{data.music_volume || 30}%</span>
              </div>
              <Slider
                value={[data.music_volume || 30]}
                onValueChange={([v]) => onChange({ music_volume: v })}
                min={0}
                max={100}
                step={5}
                className="py-2"
              />
            </div>
          </SettingSection>
        </div>
      </div>

      {/* Generate Button */}
      <div className="text-center pt-4">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 font-bold text-base px-10 neon-glow"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Scenes...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate Video
            </>
          )}
        </Button>
        {generating && (
          <p className="text-xs text-muted-foreground mt-3">This may take a minute while we create your scenes...</p>
        )}
      </div>
    </motion.div>
  );
}