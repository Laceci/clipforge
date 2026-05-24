import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TRANSITION_OPTIONS = [
  { value: 'pan_zoom', label: 'Pan & Zoom', desc: 'Slow cinematic zoom' },
  { value: 'fade', label: 'Fade', desc: 'Smooth cross-fade' },
  { value: 'cut', label: 'Hard Cut', desc: 'Instant switch' },
  { value: 'slide_left', label: 'Slide Left', desc: 'Horizontal wipe' },
  { value: 'glitch', label: 'Glitch', desc: 'Digital distortion' },
  { value: 'zoom_in', label: 'Zoom In', desc: 'Push into scene' },
];

export default function AITransitionsPanel({ scenes, onApply }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [applied, setApplied] = useState(false);

  const suggestTransitions = async () => {
    if (!scenes?.length) return;
    setLoading(true);
    setApplied(false);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional video editor. Given these ${scenes.length} scenes, suggest the best transition for each scene based on its emotional content.

Scenes:
${scenes.map((s, i) => `Scene ${i + 1}: "${s.text?.substring(0, 120) || 'visual scene'}"`).join('\n')}

Available transitions: pan_zoom, fade, cut, slide_left, glitch, zoom_in

For each scene, pick the most cinematic/engaging transition. Return JSON only.`,
      response_json_schema: {
        type: 'object',
        properties: {
          transitions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                scene_index: { type: 'number' },
                transition: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setSuggestions(result.transitions || []);
    setLoading(false);
  };

  const applyAll = () => {
    if (!suggestions) return;
    const updatedScenes = scenes.map((scene, i) => {
      const suggestion = suggestions.find(s => s.scene_index === i);
      return suggestion ? { ...scene, animation: suggestion.transition } : scene;
    });
    onApply(updatedScenes);
    setApplied(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">AI analyzes your scene content and picks the best transition for each.</p>
        <Button
          size="sm"
          onClick={suggestTransitions}
          disabled={loading || !scenes?.length}
          className="bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs border-0 shrink-0"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
          Analyze
        </Button>
      </div>

      <AnimatePresence>
        {suggestions && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            {suggestions.map((s, i) => {
              const opt = TRANSITION_OPTIONS.find(o => o.value === s.transition);
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {s.scene_index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{opt?.label || s.transition}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.reason}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                </div>
              );
            })}
            <Button
              onClick={applyAll}
              disabled={applied}
              size="sm"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs neon-glow mt-1"
            >
              {applied ? <><Check className="w-3 h-3 mr-1" /> Applied!</> : 'Apply All Transitions'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual selection grid */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Or set manually for all scenes</p>
        <div className="grid grid-cols-3 gap-2">
          {TRANSITION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onApply(scenes.map(s => ({ ...s, animation: opt.value })))}
              className="p-2 rounded-lg bg-secondary/40 hover:bg-primary/10 hover:text-primary text-center transition-colors group"
            >
              <p className="text-xs font-medium">{opt.label}</p>
              <p className="text-[9px] text-muted-foreground group-hover:text-primary/70">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}