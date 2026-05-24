import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Check, Zap, AlertCircle, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PROVIDERS = [
  {
    id: 'image_fallback',
    label: 'ClipForge Built-in (Images)',
    description: 'Uses ClipForge AI image generation. Always works, no API key needed. Great for previews.',
    free: true,
    keyName: null,
    docsUrl: null,
  },
  {
    id: 'fal_video',
    label: 'fal.ai (Real Video)',
    description: 'Fast, affordable AI video generation. Powered by Runway Gen-3 via fal.',
    keyName: 'FAL_API_KEY',
    docsUrl: 'https://fal.ai/dashboard/keys',
    keyPlaceholder: 'fal_...',
  },
  {
    id: 'runway',
    label: 'Runway ML (Gen-3)',
    description: 'Industry-leading video generation. High quality cinematic clips.',
    keyName: 'RUNWAY_API_KEY',
    docsUrl: 'https://app.runwayml.com/settings/api-keys',
    keyPlaceholder: 'key_...',
  },
  {
    id: 'luma',
    label: 'Luma AI (Dream Machine)',
    description: 'High quality video generation with smooth motion.',
    keyName: 'LUMA_API_KEY',
    docsUrl: 'https://lumalabs.ai/dream-machine/api',
    keyPlaceholder: 'luma-...',
  },
];

const FAILURE_REASONS = {
  missing_api_key: { label: 'API Key Missing', color: 'text-yellow-500', icon: '🔑' },
  invalid_api_key: { label: 'API Key Invalid', color: 'text-red-500', icon: '❌' },
  no_credits: { label: 'No Credits/Quota', color: 'text-orange-500', icon: '💳' },
  provider_timeout: { label: 'Provider Timeout', color: 'text-amber-500', icon: '⏱' },
  empty_response: { label: 'Empty Response', color: 'text-red-400', icon: '📭' },
  invalid_request: { label: 'Invalid Request', color: 'text-red-400', icon: '⚠️' },
  unknown_error: { label: 'Unknown Error', color: 'text-muted-foreground', icon: '❓' },
};

export default function VideoProviderSettings({ prefs, onChange }) {
  const selectedProvider = prefs.video_provider || 'image_fallback';
  const [apiKeys, setApiKeys] = useState({});
  const [showKey, setShowKey] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider);

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
        setTestResult({
          success: true,
          url: data.video_url || data.image_url,
          type: data.clip_type,
          provider: data.provider_used,
        });
        toast.success(`Test successful! ${data.clip_type === 'cinematic-video' ? '🎥 Video' : '🖼 Image'} generated.`);
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      const reason = err.response?.data?.failure_reason || 'unknown_error';
      const reasonInfo = FAILURE_REASONS[reason] || FAILURE_REASONS.unknown_error;
      setTestResult({ success: false, reason, reasonInfo, message: err.message });
      toast.error(`Test failed: ${reasonInfo.label}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Choose how ClipForge generates visual clips for each scene. Start with the built-in option (no setup needed), then upgrade to real video providers.
      </p>

      {/* Provider selector */}
      <div className="space-y-2">
        {PROVIDERS.map(p => (
          <button
            key={p.id}
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
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold">{p.label}</p>
                {p.free && (
                  <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">FREE</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{p.description}</p>
              {p.keyName && selectedProvider === p.id && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type={showKey[p.id] ? 'text' : 'password'}
                      placeholder={p.keyPlaceholder || 'API Key...'}
                      value={apiKeys[p.keyName] || prefs[`api_key_${p.id}`] || ''}
                      onChange={e => {
                        setApiKeys(k => ({ ...k, [p.keyName]: e.target.value }));
                        onChange(`api_key_${p.id}`, e.target.value);
                      }}
                      className="bg-background border-border rounded-lg h-7 text-xs flex-1"
                      onClick={e => e.stopPropagation()}
                    />
                    <button
                      onClick={e => { e.stopPropagation(); setShowKey(s => ({ ...s, [p.id]: !s[p.id] })); }}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground"
                    >
                      {showKey[p.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  {p.docsUrl && (
                    <a
                      href={p.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      Get API key from {p.label}
                    </a>
                  )}
                </div>
              )}
            </div>
            {selectedProvider === p.id && <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />}
          </button>
        ))}
      </div>

      {/* Test connection */}
      <Button
        onClick={handleTest}
        disabled={testing}
        variant="outline"
        className="w-full gap-2 border-primary/30 text-primary text-xs h-8"
      >
        {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
        {testing ? 'Generating test clip...' : `Test Provider (${currentProvider?.label})`}
      </Button>

      {/* Test result */}
      {testResult && (
        <div className={cn(
          'rounded-xl p-3 border text-xs space-y-2',
          testResult.success
            ? 'bg-primary/5 border-primary/20'
            : 'bg-destructive/5 border-destructive/20'
        )}>
          {testResult.success ? (
            <>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Check className="w-3.5 h-3.5" />
                Test passed — {testResult.type === 'cinematic-video' ? 'Real video clip' : 'Image preview'} generated
              </div>
              {testResult.url && (
                <img src={testResult.url} alt="Test clip" className="w-full rounded-lg aspect-[9/16] object-cover max-h-48" />
              )}
              <p className="text-muted-foreground">Provider: {testResult.provider}</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                {testResult.reasonInfo?.icon} {testResult.reasonInfo?.label || 'Test failed'}
              </div>
              <p className="text-muted-foreground">{testResult.message}</p>
              {testResult.reason === 'missing_api_key' && currentProvider?.docsUrl && (
                <a href={currentProvider.docsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="w-2.5 h-2.5" /> Get your API key
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}