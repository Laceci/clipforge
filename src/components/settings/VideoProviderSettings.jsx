import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Check, Zap, AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
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
    id: 'higgsfield',
    label: 'Higgsfield AI — Cinematic Video',
    description: 'DoP cinematic video generation. Add HF_KEY (key_id:key_secret) in Base44 Secrets.',
    badge: 'NEW',
  },
  {
    id: 'pexels_stock',
    label: 'Pexels Stock Video — Cinematic Clips',
    description: 'Free stock video library. Real cinematic footage matched to each scene. Add PEXELS_API_KEY in Base44 Secrets.',
    badge: 'FREE',
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
  const [testingConn, setTestingConn] = useState(false);
  const [connResult, setConnResult] = useState(null);

  const currentLabel = PROVIDERS.find(p => p.id === selectedProvider)?.label || 'Auto';

  const handleTestConnection = async () => {
    setTestingConn(true);
    setConnResult(null);
    try {
      const result = await base44.functions.invoke('generateVideoClip', {
        hf_test_connection: true,
      });
      const data = result.data;
      setConnResult({ connected: data?.connected, error: data?.error });
      if (data?.connected) {
        toast.success('Higgsfield API connected!');
      } else {
        toast.error(`Connection failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err.message;
      setConnResult({ connected: false, error: msg });
      toast.error(`Connection test failed: ${msg}`);
    } finally {
      setTestingConn(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await base44.functions.invoke('generateVideoClip', {
        sceneText: 'A person walking through a sunlit forest path, cinematic close-up shot',
        sceneIndex: 0,
        duration: 5,
        mood: 'calm',
        action: 'walking forward',
        visualStyle: 'cinematic',
        provider: selectedProvider,
      });

      const data = result.data;

      // If Higgsfield returns a pending job, poll it
      if (data?.pending && data?.hf_status_url) {
        toast.info('Higgsfield clip submitted — polling for result...');
        for (let i = 0; i < 24; i++) {
          await new Promise(r => setTimeout(r, 5000));
          const poll = await base44.functions.invoke('generateVideoClip', {
            request_id: data.request_id,
            hf_status_url: data.hf_status_url,
          });
          const pd = poll.data;
          if (!pd?.pending) {
            if (pd?.video_url || pd?.image_url) {
              setTestResult({ success: true, url: pd.video_url || pd.image_url, type: pd.clip_type, provider: pd.provider_used });
              toast.success(`Test passed — video generated via ${pd.provider_used}`);
            } else {
              throw new Error(pd?.failure_reason || 'No video URL in result');
            }
            return;
          }
        }
        throw new Error('Higgsfield clip timed out after 2 min');
      }

      if (data?.image_url || data?.video_url) {
        setTestResult({ success: true, url: data.video_url || data.image_url, type: data.clip_type, provider: data.provider_used });
        toast.success(`Test passed — ${data.clip_type === 'cinematic-video' ? '🎥 Video' : '🖼 Image'} generated via ${data.provider_used}`);
      } else {
        throw new Error(data?.failure_reason || 'No media URL returned');
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
            onClick={() => { onChange('video_provider', p.id); setTestResult(null); setConnResult(null); }}
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
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full font-semibold',
                    p.badge === 'NEW'  ? 'bg-amber-500/20 text-amber-400' :
                    p.badge === 'FREE' ? 'bg-green-500/20 text-green-400' :
                    'bg-primary/20 text-primary'
                  )}>{p.badge}</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{p.description}</p>
            </div>
            {selectedProvider === p.id && <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />}
          </button>
        ))}
      </div>

      {/* Higgsfield-specific buttons */}
      {selectedProvider === 'higgsfield' && (
        <div className="space-y-2">
          <Button
            onClick={handleTestConnection}
            disabled={testingConn || testing}
            variant="outline"
            className="w-full gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs h-8"
          >
            {testingConn
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : connResult?.connected
                ? <Wifi className="w-3.5 h-3.5" />
                : connResult?.connected === false
                  ? <WifiOff className="w-3.5 h-3.5" />
                  : <Wifi className="w-3.5 h-3.5" />}
            {testingConn ? 'Testing connection...' : 'Test Higgsfield Connection'}
          </Button>

          {connResult && (
            <div className={cn(
              'rounded-xl p-2 border text-[10px] flex items-center gap-2',
              connResult.connected
                ? 'bg-primary/5 border-primary/20 text-primary'
                : 'bg-destructive/5 border-destructive/20 text-destructive'
            )}>
              {connResult.connected
                ? <><Check className="w-3 h-3 shrink-0" /> Connected to Higgsfield API</>
                : <><AlertCircle className="w-3 h-3 shrink-0" /> {connResult.error}</>}
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleTest}
        disabled={testing || testingConn}
        variant="outline"
        className="w-full gap-2 border-primary/30 text-primary text-xs h-8"
      >
        {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
        {testing
          ? selectedProvider === 'higgsfield' ? 'Generating 5-second test clip...' : 'Generating test clip...'
          : selectedProvider === 'higgsfield' ? 'Generate 5-second Higgsfield Test Clip' : `Test Provider (${currentLabel})`}
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
                testResult.type === 'cinematic-video'
                  ? <video src={testResult.url} controls className="w-full rounded-lg aspect-[9/16] object-cover max-h-48" />
                  : <img src={testResult.url} alt="Test" className="w-full rounded-lg aspect-[9/16] object-cover max-h-48" />
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

      {selectedProvider === 'higgsfield' && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 text-[10px] text-amber-400/80 space-y-1">
          <p className="font-semibold">Setup: Add to Base44 Secrets</p>
          <p><span className="font-mono bg-black/20 px-1 rounded">HF_KEY</span> = your key_id:key_secret (combined, colon-separated)</p>
          <p className="text-amber-400/50">Or separately: <span className="font-mono bg-black/20 px-1 rounded">HF_API_KEY</span> and <span className="font-mono bg-black/20 px-1 rounded">HF_API_SECRET</span></p>
        </div>
      )}

      {selectedProvider === 'pexels_stock' && (
        <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3 text-[10px] text-green-400/80 space-y-1.5">
          <p className="font-semibold text-green-400">Setup: Free Pexels API Key</p>
          <p>1. Go to <span className="font-mono bg-black/20 px-1 rounded">pexels.com/api</span> and sign up (free)</p>
          <p>2. Copy your API key and add it to Base44 Secrets:</p>
          <p><span className="font-mono bg-black/20 px-1 rounded">PEXELS_API_KEY</span> = your_key_here</p>
          <p className="text-green-400/50">Pexels gives you 200 requests/hour and 20,000/month — plenty for production use.</p>
        </div>
      )}
    </div>
  );
}
