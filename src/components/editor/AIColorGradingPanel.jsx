import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Wand2, Loader2, Check, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESETS = [
  { name: 'Cinematic', values: { brightness: 5, contrast: 15, saturation: -10, warmth: 8, vignette: 30 } },
  { name: 'Dark & Moody', values: { brightness: -15, contrast: 20, saturation: -20, warmth: -5, vignette: 50 } },
  { name: 'Vibrant', values: { brightness: 10, contrast: 10, saturation: 30, warmth: 5, vignette: 10 } },
  { name: 'Vintage', values: { brightness: -5, contrast: -10, saturation: -30, warmth: 20, vignette: 40 } },
  { name: 'Clean', values: { brightness: 15, contrast: 5, saturation: 5, warmth: 3, vignette: 0 } },
  { name: 'Horror', values: { brightness: -25, contrast: 30, saturation: -40, warmth: -15, vignette: 60 } },
];

const DEFAULT_VALUES = { brightness: 0, contrast: 0, saturation: 0, warmth: 0, vignette: 0 };

export default function AIColorGradingPanel({ project, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [values, setValues] = useState(project?.color_grade || DEFAULT_VALUES);
  const [activePreset, setActivePreset] = useState(null);

  const suggestGrading = async () => {
    setLoading(true);
    setSuggestion(null);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional colorist. Based on this video's style and genre, suggest ideal color grading settings.

Video info:
- Visual style: ${project?.visual_style || 'cinematic'}
- Category: ${project?.template_category || 'custom'}
- Topic: ${project?.topic || 'unknown'}

Return color grading parameters as JSON. Values range from -100 to 100.`,
      response_json_schema: {
        type: 'object',
        properties: {
          preset_name: { type: 'string' },
          values: {
            type: 'object',
            properties: {
              brightness: { type: 'number' },
              contrast: { type: 'number' },
              saturation: { type: 'number' },
              warmth: { type: 'number' },
              vignette: { type: 'number' },
            },
          },
          reasoning: { type: 'string' },
        },
      },
    });

    setSuggestion(result);
    setLoading(false);
  };

  const applyValues = (newValues, presetName = null) => {
    setValues(newValues);
    setActivePreset(presetName);
    onUpdate({ color_grade: newValues });
  };

  const reset = () => applyValues(DEFAULT_VALUES, null);

  const sliders = [
    { key: 'brightness', label: 'Brightness' },
    { key: 'contrast', label: 'Contrast' },
    { key: 'saturation', label: 'Saturation' },
    { key: 'warmth', label: 'Warmth' },
    { key: 'vignette', label: 'Vignette' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">AI picks the perfect color grade based on your video's style.</p>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={reset} className="h-7 px-2 text-xs text-muted-foreground">
            <RotateCcw className="w-3 h-3 mr-1" /> Reset
          </Button>
          <Button
            size="sm"
            onClick={suggestGrading}
            disabled={loading}
            className="bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs border-0"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
            Auto-Grade
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-primary">AI Suggestion: {suggestion.preset_name}</p>
              <Button
                size="sm"
                onClick={() => applyValues(suggestion.values, suggestion.preset_name)}
                className="h-6 px-2 text-[10px] bg-primary text-primary-foreground rounded-lg"
              >
                <Check className="w-2.5 h-2.5 mr-1" /> Apply
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">{suggestion.reasoning}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-1.5">
        {PRESETS.map(p => (
          <button
            key={p.name}
            onClick={() => applyValues(p.values, p.name)}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-medium transition-all ${
              activePreset === p.name
                ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Manual sliders */}
      <div className="space-y-3 pt-1">
        {sliders.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">{label}</span>
              <span className={values[key] !== 0 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                {values[key] > 0 ? '+' : ''}{values[key]}
              </span>
            </div>
            <Slider
              value={[values[key]]}
              onValueChange={([v]) => {
                const newVals = { ...values, [key]: v };
                setValues(newVals);
                setActivePreset(null);
                onUpdate({ color_grade: newVals });
              }}
              min={-100}
              max={100}
              step={1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}