import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, RefreshCw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROVIDER_LABELS = {
  fal_video:     'fal.ai (MiniMax)',
  runway:        'Runway ML',
  luma:          'Luma AI',
  higgsfield:    'Higgsfield AI',
  image_fallback:'ClipForge Built-in',
};

function StatusBadge({ ok, loading }) {
  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  if (ok === true)  return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (ok === false) return <XCircle className="w-4 h-4 text-destructive" />;
  return <div className="w-4 h-4 rounded-full bg-secondary border border-border" />;
}

function ConnectionRow({ label, status, loading, detail }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
      <StatusBadge ok={status?.ok} loading={loading} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold">{label}</p>
        {!loading && status && (
          <p className={cn('text-[10px] mt-0.5', status.ok ? 'text-muted-foreground' : 'text-destructive')}>
            {status.ok
              ? detail || 'Connected'
              : status.error || 'Not connected'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ApiConnectionsPanel() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('checkApiConnections', {});
      setResults(res.data || res);
      setLastChecked(new Date());
    } catch (e) {
      // checkApiConnections may not be deployed on all Base44 plans.
      // Show a helpful message rather than a raw error.
      const msg = e.message || '';
      if (msg.includes('not found') || msg.includes('404') || msg.includes('Backend Platform')) {
        setResults({
          _error: 'Connection checker not available on this Base44 plan. Your secrets are configured via Base44 → Secrets. Test the pipeline directly from Create Video.',
        });
      } else {
        setResults({ _error: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const elDetail = () => {
    if (!results?.elevenlabs?.ok) return null;
    const { plan, characters_used, characters_limit } = results.elevenlabs;
    const parts = [];
    if (plan) parts.push(`Plan: ${plan}`);
    if (characters_used != null && characters_limit != null) {
      parts.push(`${characters_used.toLocaleString()} / ${characters_limit.toLocaleString()} chars used`);
    }
    return parts.join(' · ') || 'Connected';
  };

  const videoDetail = () => {
    if (!results?.video_provider) return null;
    const { name, note } = results.video_provider;
    return note || PROVIDER_LABELS[name] || name;
  };

  const allOk = results &&
    results.elevenlabs?.ok &&
    results.creatomate?.ok &&
    results.video_provider?.ok;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Verify that each API key is valid before generating a video.
      </p>

      <div className="rounded-xl border border-border bg-secondary/20 px-4 py-1">
        <ConnectionRow
          label="ElevenLabs (Voiceover)"
          status={results?.elevenlabs}
          loading={loading}
          detail={elDetail()}
        />
        <ConnectionRow
          label="Creatomate (MP4 Rendering)"
          status={results?.creatomate}
          loading={loading}
        />
        <ConnectionRow
          label={`Video Provider: ${results?.video_provider ? (PROVIDER_LABELS[results.video_provider.name] || results.video_provider.name) : '—'}`}
          status={results?.video_provider}
          loading={loading}
          detail={videoDetail()}
        />
      </div>

      {results?._error && (
        <p className="text-xs text-destructive">Check failed: {results._error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={runCheck}
          disabled={loading}
          variant="outline"
          className="gap-2 border-primary/30 text-primary text-xs h-8"
        >
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : results
              ? <RefreshCw className="w-3.5 h-3.5" />
              : <Zap className="w-3.5 h-3.5" />
          }
          {loading ? 'Checking...' : results ? 'Re-check Connections' : 'Check API Connections'}
        </Button>

        {allOk && !loading && (
          <span className="text-xs text-green-500 font-semibold">All systems go</span>
        )}
        {lastChecked && !loading && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            Last checked {lastChecked.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
