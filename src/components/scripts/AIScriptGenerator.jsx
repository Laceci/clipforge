import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Copy, Save, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generateVideoScript, formatScriptForDisplay, validateScript, getEmotionalCues } from '@/lib/scriptGenerator';
import { base44 } from '@/api/base44Client';

const CONTENT_TYPES = [
  { value: 'motivation', label: '🔥 Motivation' },
  { value: 'storytelling', label: '📖 Storytelling' },
  { value: 'facts', label: '🧠 Facts' },
  { value: 'horror', label: '👻 Horror' },
  { value: 'finance', label: '💰 Finance' },
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'general', label: '✨ General' },
];

const DURATIONS = [
  { value: 15, label: '15s (TikTok)' },
  { value: 30, label: '30s (Shorts)' },
  { value: 60, label: '60s (Reels)' },
];

export default function AIScriptGenerator({ onScriptGenerated }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('general');
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptCategory, setScriptCategory] = useState('custom');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateVideoScript(topic, contentType, duration);
      const validation = validateScript(result);

      if (!validation.valid) {
        toast.error('Generated script has errors: ' + validation.errors.join(', '));
        return;
      }

      setGeneratedScript(result);
      setScriptTitle(result.title || topic);
      toast.success('Script generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate script. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveScript = async () => {
    if (!generatedScript) return;

    setIsSaving(true);
    try {
      const formatted = formatScriptForDisplay(generatedScript);
      const wordCount = formatted.fullScript.split(/\s+/).length;

      await base44.entities.SavedScript.create({
        title: scriptTitle || generatedScript.title,
        content: formatted.fullScript,
        category: scriptCategory,
        word_count: wordCount,
        estimated_duration: Math.round(formatted.duration),
      });

      toast.success('Script saved to library!');
      setOpen(false);
      setGeneratedScript(null);
      setTopic('');
      onScriptGenerated?.();
    } catch (error) {
      toast.error('Failed to save script');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const emotionalCues = generatedScript ? getEmotionalCues(generatedScript) : [];

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 rounded-xl gap-2"
      >
        <Sparkles className="w-4 h-4" />
        AI Script Generator
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Script Generator
            </DialogTitle>
          </DialogHeader>

          {!generatedScript ? (
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Topic</label>
                <Input
                  placeholder="e.g., '5 signs you have social anxiety', 'How to make passive income', etc."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="bg-secondary/40 border-border rounded-xl text-sm"
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Content Type</label>
                  <Select value={contentType} onValueChange={setContentType} disabled={isGenerating}>
                    <SelectTrigger className="bg-secondary/40 border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {CONTENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Duration</label>
                  <Select value={duration.toString()} onValueChange={v => setDuration(parseInt(v))} disabled={isGenerating}>
                    <SelectTrigger className="bg-secondary/40 border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {DURATIONS.map(d => (
                        <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Script
                  </>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                AI will generate a structured script with hooks, emotional cues, scene breakdowns, and visual prompts optimized for short-form video.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Script Preview */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Title & Save */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Script Title</label>
                  <Input
                    placeholder="Script title"
                    value={scriptTitle}
                    onChange={e => setScriptTitle(e.target.value)}
                    className="bg-secondary/40 border-border rounded-xl text-sm"
                  />
                </div>

                {/* Hook */}
                {generatedScript.hook && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-primary">🎯 HOOK (Attention Grab)</p>
                      <button
                        onClick={() => copyToClipboard(generatedScript.hook)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed">{generatedScript.hook}</p>
                  </div>
                )}

                {/* Main Script */}
                {generatedScript.main_script && (
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">📝 MAIN SCRIPT</p>
                      <button
                        onClick={() => copyToClipboard(generatedScript.main_script)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{generatedScript.main_script}</p>
                  </div>
                )}

                {/* Emotional Cues & Scenes */}
                {emotionalCues.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground">🎬 SCENE BREAKDOWN</p>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {emotionalCues.map((cue, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-2.5 rounded-lg bg-secondary/40 border border-border text-[11px] space-y-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{cue.text}</p>
                              <p className="text-muted-foreground mt-1">
                                <span className="font-semibold text-amber-400">Emotion:</span> {cue.emotion}
                              </p>
                              {cue.visual && (
                                <p className="text-muted-foreground">
                                  <span className="font-semibold text-cyan-400">Visual:</span> {cue.visual}
                                </p>
                              )}
                              <p className="text-muted-foreground mt-1">
                                <span className="font-semibold text-emerald-400">Duration:</span> {cue.duration}s
                              </p>
                            </div>
                            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold whitespace-nowrap">
                              Scene {idx + 1}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Closing */}
                {generatedScript.closing && (
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-2">
                    <p className="text-xs font-bold text-foreground">🎬 CLOSING</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{generatedScript.closing}</p>
                  </div>
                )}

                {/* Keywords */}
                {generatedScript.keywords?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground">#️⃣ KEYWORDS & HASHTAGS</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedScript.keywords.map((kw, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                          #{kw.replace(/\s+/g, '')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Section */}
                <div className="space-y-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Save to Library</label>
                  <Select value={scriptCategory} onValueChange={setScriptCategory}>
                    <SelectTrigger className="bg-secondary/40 border-border rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="motivation">Motivation</SelectItem>
                      <SelectItem value="storytelling">Storytelling</SelectItem>
                      <SelectItem value="facts">Facts</SelectItem>
                      <SelectItem value="horror">Horror</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleSaveScript}
                    disabled={isSaving}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 font-bold"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save to Script Library
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>

              <Button
                variant="outline"
                onClick={() => setGeneratedScript(null)}
                className="w-full rounded-xl border-border"
              >
                Generate Another
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}