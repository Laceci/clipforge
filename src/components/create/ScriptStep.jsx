import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Wand2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const categories = [
  { value: 'motivation', label: 'Motivation' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'facts', label: 'Fun Facts' },
  { value: 'horror', label: 'Horror / Creepy' },
  { value: 'finance', label: 'Finance / Money' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'dark_psychology', label: 'Dark Psychology' },
  { value: 'self_improvement', label: 'Self Improvement' },
  { value: 'business', label: 'Business Mindset' },
  { value: 'custom', label: 'Custom' },
];

export default function ScriptStep({ data, onChange, initialCategory }) {
  const [generating, setGenerating] = useState(false);
  const [category, setCategory] = useState(initialCategory || data.template_category || 'motivation');

  const generateScript = async () => {
    if (!data.topic?.trim()) return;
    setGenerating(true);
    try {
      const result = await base44.functions.invoke('generateScript', {
        topic: data.topic.trim(),
        category,
        target_duration: 50,
      });
      const { script, scene_visuals, estimated_duration } = result?.data || {};
      if (!script) throw new Error(result?.data?.error || 'No script returned');
      onChange({ script, scene_visuals, template_category: category, duration: estimated_duration || 50 });
    } catch (err) {
      toast.error('Script generation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Write Your Script</h2>
        <p className="text-muted-foreground text-sm">Enter a topic and let AI create a viral script, or write your own</p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-secondary/50 border-border rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {categories.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Topic or Hook</label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. The untold story of Nikola Tesla's last invention..."
              value={data.topic || ''}
              onChange={(e) => onChange({ topic: e.target.value })}
              className="bg-secondary/50 border-border rounded-xl flex-1"
            />
            <Button
              onClick={generateScript}
              disabled={generating || !data.topic?.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 neon-glow shrink-0"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Generate
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Script</label>
            {data.script && (
              <span className="text-xs text-muted-foreground">
                ~{data.duration || Math.round((data.script?.split(/\s+/).length || 0) / 2.5)}s
              </span>
            )}
          </div>
          <Textarea
            placeholder="Your script will appear here, or write your own..."
            value={data.script || ''}
            onChange={(e) => {
              const wordCount = e.target.value.split(/\s+/).length;
              onChange({ script: e.target.value, duration: Math.round(wordCount / 2.5) });
            }}
            className="bg-secondary/50 border-border rounded-xl min-h-[240px] resize-none text-sm leading-relaxed"
          />
        </div>
      </div>

      {data.script && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 text-primary text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Script ready! Proceed to generate your video.</span>
        </motion.div>
      )}
    </motion.div>
  );
}