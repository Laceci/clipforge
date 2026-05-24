import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Check, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PROVIDERS = [
  {
    id: null,
    label: 'Auto (recommended)',
    description: 'Uses the video provider configured by the app. No setup needed.',
    badge: 'DEFAULT',
  },
  {
    id: 'fal_video',
    label: 'fal.ai — Real Video',
    description: 'Fast AI video generation. Produces real cinematic clips per scene.',
  },
  {
    id: 'runway',
    label: 'Runway ML (Gen-3)',
    description: 'Industry-leading video generation. High quality cinematic clips.',
  },
  {
    id: 'luma',
    label: 'Luma AI (Dream Machine)',
    description: 'High quality video generation with smooth motion.',
  },
  {
    id: 'image_fallback',
    label: 'ClipForge Built-in (Images)',
    description: 'Still image previews only. Use for testing the pipeline layout.',
  },
];

const FAILURE_REASONS = {
  missing_api_key: { label: 'API Key Missing', color: 'text-yellow-500' },
  invalid_api_key: { label: 'API Key Invalid', color: 'text-red-500' },
  no_credits:      { label: 'No Credits/Quota', color: 'text-orange-500' },
  provider_timeout:{ label: 'Provider Timeout', color: 'text-amber-500' },
  empty_response:  { label: 'Empty Response', color: 'text-red-400' },
  unknown_error:   { label: 'Unknown Error', color: 'text-muted-foreground' },
};

export default function VideoProviderSettings({ prefs, onChange }) {
  const selectedProvider = prefs.video_provider ?? null;
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const currentLabel = PROVIDERS.find(p => p.id === selectedProvider)?.label || 'Auto';

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await base44.functions.invoke('generateVideoClip', {
        sceneText: 'A person walking through a sunlit forest path, cinematic close-up shot',
        sceneIndex: 0,
        duration: 4,
        mood: 'calm',
        action: 'walking forward',
        visualStyle: 'cinematic',
        provider: selectedProvider,
      });

      const data = result.data;
      if (data?.image_url || data?.video_url) {
        setTestResult({ success: true, url: data.video_url || data.image_url, type: data.clip_type, provider: data.provider_used });
        toast.success(`Test passed — ${data.clip_type === 'cinematic-video' ? '🎥 Video' : '🖼 Image'} generated via ${data.provider_used}`);
      } else {
        throw new Error('No media URL returned');
      }
    } catch (err) {
      const reason = err.response?.data?.failure_reason || 'unknown_error';
      const info = FAILURE_REASONS[reason] || FAILURE_REASONS.unknown_error;
      setTestResult({ success: false, reason, info, message: err.message });
      toast.error(`Test failed: ${info.label}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Choose the video generation engine for your users. API keys are configured by you in Base44 Secrets — your users never need to enter them.
      </p>

      <div className="space-y-2">
        {PROVIDERS.map(p => (
          <button
            key={String(p.id)}
            onClick={() => onChange('video_provider', p.id)}
            className={cn(
              'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
              selectedProvider === p.id
                ? 'bg-primary/10 border-primary/40'
                : 'bg-secondary/30 border-border hover:border-primary/20'
            )}
          >
            <div className={cn(
              'w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0',
              selectedProvider === p.id ? 'border-primary' : 'border-muted-foreground'
            )}>
              {selectedProvider === p.id && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold">{p.label}</p>
                {p.badge && (
                  <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">{p.badge}</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{p.description}</p>
            </div>
            {selectedProvider === p.id && <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />}
          </button>
        ))}
      </div>

      <Button
        onClick={handleTest}
        disabled={testing}
        variant="outline"
        className="w-full gap-2 border-primary/30 text-primary text-xs h-8"
      >
        {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
        {testing ? 'Generating test clip...' : `Test Provider (${currentLabel})`}
      </Button>

      {testResult && (
        <div className={cn(
          'rounded-xl p-3 border text-xs space-y-2',
          testResult.success ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'
        )}>
          {testResult.success ? (
            <>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Check className="w-3.5 h-3.5" />
                {testResult.type === 'cinematic-video' ? 'Real video clip' : 'Image preview'} generated via {testResult.provider}
              </div>
              {testResult.url && (
                <img src={testResult.url} alt="Test" className="w-full rounded-lg aspect-[9/16] object-cover max-h-48" />
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-destructive font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              {testResult.info?.label} — {testResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
