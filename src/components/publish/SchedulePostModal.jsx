import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Send, Calendar, Clock, Film, Hash, Sparkles, Loader2 } from 'lucide-react';
import PlatformBadge from './PlatformBadge';
import { toast } from 'sonner';

const PLATFORMS = ['tiktok', 'instagram', 'youtube'];

export default function SchedulePostModal({ open, onClose, project, onSuccess }) {
  const { data: prefsList = [] } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => base44.entities.UserPreferences.list(),
  });
  const brandHashtags = prefsList[0]?.brand_hashtags_global || '';

  const [selectedPlatforms, setSelectedPlatforms] = useState(['tiktok']);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [scheduleType, setScheduleType] = useState('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [platformCaptions, setPlatformCaptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);

  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const platformStyles = {
        tiktok: 'short, punchy, trend-driven, uses emojis, Gen-Z tone',
        instagram: 'aesthetic, slightly longer, storytelling, lifestyle-oriented, uses emojis',
        youtube: 'informative, engaging hook, slightly formal, broader audience',
      };
      const platformContext = selectedPlatforms.length > 0
        ? selectedPlatforms.map(p => `${p} (${platformStyles[p] || 'engaging'})`).join(', ')
        : 'social media';

      const prompt = `You are a social media copywriter. Generate an engaging video caption and relevant hashtags for the following video.

Video Title: ${project.title || 'Untitled'}
Topic/Script: ${project.script || project.topic || project.title || 'No script available'}
Target Platforms: ${platformContext}
Visual Style: ${project.visual_style || 'cinematic'}

Requirements:
- Caption should be optimized for ${platformContext}
- Include a strong hook in the first line
- Keep it authentic and engaging
- Generate 8-12 relevant hashtags (mix of popular and niche)
- Do NOT include the brand hashtags, only content-specific ones

Respond with a JSON object: { "caption": "...", "hashtags": "#tag1 #tag2 ..." }`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            caption: { type: 'string' },
            hashtags: { type: 'string' },
          },
        },
      });

      if (result.caption) setCaption(result.caption);
      if (result.hashtags) setHashtags(result.hashtags);
      toast.success('AI caption generated!');
    } catch (err) {
      toast.error('Failed to generate caption. Try again.');
    } finally {
      setGeneratingCaption(false);
    }
  };

  const togglePlatform = (p) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async () => {
    if (!selectedPlatforms.length) {
      toast.error('Select at least one platform.');
      return;
    }
    if (scheduleType === 'schedule' && !scheduledDate) {
      toast.error('Pick a date to schedule the post.');
      return;
    }
    setLoading(true);

    const scheduled_at = scheduleType === 'schedule' && scheduledDate
      ? new Date(`${scheduledDate}T${scheduledTime || '09:00'}`).toISOString()
      : null;

    const combinedHashtags = [hashtags, brandHashtags].filter(Boolean).join(' ');

    await base44.entities.ScheduledPost.create({
      project_id: project.id,
      project_title: project.title,
      thumbnail_url: project.thumbnail_url,
      platforms: selectedPlatforms,
      caption,
      hashtags: combinedHashtags,
      platform_captions: platformCaptions,
      scheduled_at,
      status: scheduled_at ? 'scheduled' : 'draft',
    });

    setLoading(false);
    onSuccess?.();
    onClose();
    toast.success(
      scheduled_at
        ? `Scheduled for ${new Date(scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`
        : `Added to queue for ${selectedPlatforms.join(', ')}`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Send className="w-4 h-4 text-primary" />
            Schedule Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Video preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
            {project.thumbnail_url
              ? <img src={project.thumbnail_url} className="w-12 h-16 object-cover rounded-lg shrink-0" alt="" />
              : <div className="w-12 h-16 bg-secondary/60 rounded-lg shrink-0 flex items-center justify-center"><Film className="w-5 h-5 text-muted-foreground/40" /></div>}
            <div>
              <p className="font-semibold text-sm">{project.title}</p>
              <p className="text-xs text-muted-foreground">{project.duration ? `${project.duration}s` : '—'} · {project.resolution || '1080p'}</p>
            </div>
          </div>

          {/* Platform selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platforms</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    selectedPlatforms.includes(p)
                      ? 'bg-primary/20 text-primary border-primary/40'
                      : 'bg-secondary/40 text-muted-foreground border-border hover:border-primary/30'
                  }`}
                >
                  <PlatformBadge platform={p} />
                </button>
              ))}
            </div>
          </div>

          {/* Caption per platform */}
          <Tabs defaultValue="global">
            <TabsList className="bg-secondary/50 rounded-xl p-1 text-xs">
              <TabsTrigger value="global" className="rounded-lg text-xs">All Platforms</TabsTrigger>
              {selectedPlatforms.map(p => (
                <TabsTrigger key={p} value={p} className="rounded-lg text-xs capitalize">{p}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="global" className="space-y-3 mt-3">
              <button
                onClick={handleGenerateCaption}
                disabled={generatingCaption}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-primary/30 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-all disabled:opacity-60"
              >
                {generatingCaption
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating with AI...</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Auto-Generate Caption with AI</>}
              </button>
              <Textarea
                placeholder="Write your caption or auto-generate with AI above..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="bg-secondary/40 border-border rounded-xl text-sm resize-none min-h-[80px]"
              />
              <div className="relative">
                <Input
                  placeholder="#hashtags #viral #content"
                  value={hashtags}
                  onChange={e => setHashtags(e.target.value)}
                  className="bg-secondary/40 border-border rounded-xl text-sm"
                />
              </div>
              {brandHashtags && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                  <Hash className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-primary font-semibold mb-0.5">Brand hashtags auto-appended</p>
                    <p className="text-[10px] text-muted-foreground break-all">{brandHashtags}</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {selectedPlatforms.map(p => (
              <TabsContent key={p} value={p} className="space-y-3 mt-3">
                <Textarea
                  placeholder={`Custom caption for ${p}...`}
                  value={platformCaptions[p] || ''}
                  onChange={e => setPlatformCaptions(prev => ({ ...prev, [p]: e.target.value }))}
                  className="bg-secondary/40 border-border rounded-xl text-sm resize-none min-h-[80px]"
                />
              </TabsContent>
            ))}
          </Tabs>

          {/* Scheduling */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">When to Post</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setScheduleType('now')}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                  scheduleType === 'now'
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : 'bg-secondary/40 text-muted-foreground border-border'
                }`}
              >
                <Send className="w-3 h-3" /> Post Now
              </button>
              <button
                onClick={() => setScheduleType('schedule')}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                  scheduleType === 'schedule'
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : 'bg-secondary/40 text-muted-foreground border-border'
                }`}
              >
                <Calendar className="w-3 h-3" /> Schedule
              </button>
            </div>
            {scheduleType === 'schedule' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="bg-secondary/40 border-border rounded-xl text-xs pl-9"
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="bg-secondary/40 border-border rounded-xl text-xs pl-9"
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedPlatforms.length}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold neon-glow"
          >
            <Send className="w-4 h-4 mr-2" />
            {scheduleType === 'schedule' ? 'Schedule Post' : 'Add to Queue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}