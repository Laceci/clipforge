import React, { useState, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Volume2, AlertCircle, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TONES = [
  { id: 'professional', label: '💼 Professional', desc: 'Formal, authoritative, clear' },
  { id: 'casual', label: '😄 Casual', desc: 'Friendly, conversational, relatable' },
  { id: 'dramatic', label: '🎭 Dramatic', desc: 'Intense, emotional, cinematic' },
  { id: 'inspirational', label: '✨ Inspirational', desc: 'Motivational, uplifting, empowering' },
];

function calculatePacingMetrics(text) {
  const words = text.trim().split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const avgWordsPerSentence = sentences > 0 ? Math.round(words / sentences) : 0;
  const estimatedDuration = Math.round(words / 130); // Average speaking pace: 130 words/min

  return {
    wordCount: words,
    sentenceCount: sentences,
    avgWordsPerSentence,
    estimatedDuration,
    pacingScore: avgWordsPerSentence <= 15 ? 'good' : avgWordsPerSentence <= 20 ? 'moderate' : 'dense',
  };
}

function calculateEngagement(text) {
  const emotionalKeywords = [
    'incredible', 'amazing', 'breathtaking', 'stunning', 'incredible', 'unforgettable',
    'dangerous', 'thrilling', 'epic', 'dramatic', 'emotional', 'heart', 'passion',
    'suddenly', 'unexpectedly', 'shockingly', 'surprisingly', 'moment', 'feel', 'witness'
  ];

  const questionMarks = (text.match(/\?/g) || []).length;
  const exclamationMarks = (text.match(/!/g) || []).length;
  const emotionalMatches = emotionalKeywords.filter(kw => text.toLowerCase().includes(kw)).length;

  const engagementScore = (emotionalMatches * 2 + questionMarks * 1.5 + exclamationMarks * 1) / (text.split(/\s+/).length / 10);
  
  return {
    hasQuestions: questionMarks > 0,
    questionCount: questionMarks,
    exclamationCount: exclamationMarks,
    emotionalWords: emotionalMatches,
    engagementLevel: engagementScore < 0.5 ? 'low' : engagementScore < 1 ? 'moderate' : 'high',
    engagementScore: Math.round(engagementScore * 100) / 100,
  };
}

export default function ScriptEditorPanel({ initialScript, onScriptChange, projectData, onToneChange }) {
  const [script, setScript] = useState(initialScript || '');
  const [selectedTone, setSelectedTone] = useState(projectData?.story_tone || 'dramatic');
  const [isRewriting, setIsRewriting] = useState(false);

  const pacing = useMemo(() => calculatePacingMetrics(script), [script]);
  const engagement = useMemo(() => calculateEngagement(script), [script]);

  const handleToneChange = (tone) => {
    setSelectedTone(tone);
    onToneChange?.(tone);
  };

  const handleRewriteForTone = async () => {
    if (!script.trim()) {
      toast.error('Please enter a script first');
      return;
    }

    setIsRewriting(true);
    try {
      const toneConfig = TONES.find(t => t.id === selectedTone);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Rewrite this voiceover script in a ${toneConfig.label} tone. Keep the same story content and pacing, but adjust the language, word choice, and delivery style to match the ${toneConfig.label.split(' ')[0]} tone.

Original script:
${script}

Guidelines for ${selectedTone} tone:
${toneConfig.desc}

Rewrite to maintain clarity and impact while shifting the tone. Keep similar length and structure.`,
      });

      const newScript = typeof result === 'string' ? result : result.toString();
      setScript(newScript);
      onScriptChange?.(newScript);
      toast.success(`Script rewritten in ${toneConfig.label} tone`);
    } catch (err) {
      toast.error('Rewrite failed: ' + err.message);
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="font-bold text-lg">Script Editor</h3>
        <p className="text-xs text-muted-foreground">Adjust tone and review pacing metrics</p>
      </div>

      {/* Tone Selector */}
      <div className="space-y-3">
        <label className="text-sm font-semibold">Narrative Tone</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TONES.map(tone => (
            <button
              key={tone.id}
              onClick={() => handleToneChange(tone.id)}
              className={cn(
                'p-3 rounded-xl border text-sm font-medium transition-all text-left',
                selectedTone === tone.id
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              <p className="font-semibold">{tone.label}</p>
              <p className="text-xs mt-1 opacity-70">{tone.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Script Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">Voiceover Script</label>
          <Button
            onClick={handleRewriteForTone}
            disabled={isRewriting || !script.trim()}
            variant="outline"
            size="sm"
            className="gap-1.5 border-primary/30 text-primary text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isRewriting ? 'Rewriting...' : `Rewrite for ${TONES.find(t => t.id === selectedTone)?.label.split(' ')[0]}`}
          </Button>
        </div>
        <Textarea
          value={script}
          onChange={(e) => {
            setScript(e.target.value);
            onScriptChange?.(e.target.value);
          }}
          placeholder="Your voiceover script will appear here..."
          className="bg-secondary/40 border-border rounded-xl text-sm min-h-[200px] resize-none font-mono"
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Word Count */}
        <div className="bg-secondary/20 rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase">Words</p>
          <p className="text-2xl font-bold">{pacing.wordCount}</p>
          <p className="text-[10px] text-muted-foreground">{pacing.estimatedDuration}s duration</p>
        </div>

        {/* Sentences */}
        <div className="bg-secondary/20 rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase">Sentences</p>
          <p className="text-2xl font-bold">{pacing.sentenceCount}</p>
          <p className="text-[10px] text-muted-foreground">{pacing.avgWordsPerSentence} avg words</p>
        </div>

        {/* Pacing */}
        <div className={cn('rounded-xl p-4 space-y-1', 
          pacing.pacingScore === 'good' ? 'bg-primary/10' : 'bg-secondary/20'
        )}>
          <p className="text-xs text-muted-foreground font-semibold uppercase">Pacing</p>
          <p className="text-lg font-bold capitalize">{pacing.pacingScore}</p>
          <p className="text-[10px] text-muted-foreground">
            {pacing.pacingScore === 'good' ? '✓ Optimal' : pacing.pacingScore === 'moderate' ? '⚠ Moderate' : '⚠ Dense'}
          </p>
        </div>

        {/* Engagement */}
        <div className={cn('rounded-xl p-4 space-y-1',
          engagement.engagementLevel === 'high' ? 'bg-primary/10' : engagement.engagementLevel === 'moderate' ? 'bg-secondary/20' : 'bg-amber-500/10'
        )}>
          <p className="text-xs text-muted-foreground font-semibold uppercase">Engagement</p>
          <p className="text-lg font-bold capitalize">{engagement.engagementLevel}</p>
          <p className="text-[10px] text-muted-foreground">{engagement.engagementScore}/10</p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Engagement Breakdown</p>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-secondary/20 rounded-lg p-3 space-y-1">
            <p className="text-muted-foreground">Emotional Words</p>
            <p className="text-lg font-bold">{engagement.emotionalWords}</p>
          </div>
          <div className="bg-secondary/20 rounded-lg p-3 space-y-1">
            <p className="text-muted-foreground">Questions</p>
            <p className="text-lg font-bold">{engagement.questionCount}</p>
          </div>
          <div className="bg-secondary/20 rounded-lg p-3 space-y-1">
            <p className="text-muted-foreground">Exclamations</p>
            <p className="text-lg font-bold">{engagement.exclamationCount}</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-2 bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <p className="text-xs font-semibold">Script Quality Tips</p>
            {pacing.pacingScore === 'dense' && (
              <p className="text-[10px] text-muted-foreground">
                💡 Your sentences are a bit long. Try breaking them into shorter, punchier lines for better pacing.
              </p>
            )}
            {engagement.engagementLevel === 'low' && (
              <p className="text-[10px] text-muted-foreground">
                💡 Add more emotional words, questions, or exclamations to increase engagement.
              </p>
            )}
            {pacing.pacingScore === 'good' && engagement.engagementLevel === 'high' && (
              <p className="text-[10px] text-muted-foreground">
                ✓ Great pacing and engagement! This script is ready to narrate.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}