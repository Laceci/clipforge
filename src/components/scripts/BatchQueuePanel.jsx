import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Play, X, CheckCircle2, AlertCircle, Loader2, Film, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  queued:  { label: 'Queued',     color: 'text-muted-foreground', icon: null },
  running: { label: 'Generating', color: 'text-primary',          icon: Loader2 },
  done:    { label: 'Done',       color: 'text-emerald-400',      icon: CheckCircle2 },
  failed:  { label: 'Failed',     color: 'text-destructive',      icon: AlertCircle },
};

function JobRow({ job, onRemove }) {
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;
  const Icon = cfg.icon;

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-all',
      job.status === 'running'  && 'bg-primary/5 border-primary/20',
      job.status === 'done'     && 'bg-emerald-500/5 border-emerald-500/20',
      job.status === 'failed'   && 'bg-destructive/5 border-destructive/20',
      job.status === 'queued'   && 'bg-secondary/30 border-border/40',
    )}>
      {/* Index / icon */}
      <div className="shrink-0">
        {Icon
          ? <Icon className={cn('w-4 h-4', cfg.color, job.status === 'running' && 'animate-spin')} />
          : <div className="w-4 h-4 rounded-full border-2 border-border/50" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{job.title}</p>
        {job.status === 'running' && (
          <div className="mt-1 space-y-0.5">
            <p className="text-[10px] text-muted-foreground truncate">{job.progressLabel || 'Processing...'}</p>
            <Progress value={job.progress} className="h-1" />
          </div>
        )}
        {job.status === 'failed' && (
          <p className="text-[10px] text-destructive truncate">{job.error}</p>
        )}
        {job.status === 'done' && job.projectId && (
          <Link to={`/editor?id=${job.projectId}`}
            className="text-[10px] text-emerald-400 hover:underline">
            Open in editor →
          </Link>
        )}
        {job.status === 'queued' && (
          <p className="text-[10px] text-muted-foreground capitalize">{job.category}</p>
        )}
      </div>

      {/* Status label */}
      <span className={cn('text-[10px] font-semibold shrink-0', cfg.color)}>{cfg.label}</span>

      {/* Remove (only if not running) */}
      {job.status !== 'running' && (
        <button onClick={() => onRemove(job.id)}
          className="text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function BatchQueuePanel({ jobs, isRunning, onRun, onRemove, onClear }) {
  const queued  = jobs.filter(j => j.status === 'queued').length;
  const done    = jobs.filter(j => j.status === 'done').length;
  const failed  = jobs.filter(j => j.status === 'failed').length;

  if (jobs.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center space-y-2">
        <Zap className="w-8 h-8 text-muted-foreground/20 mx-auto" />
        <p className="text-sm text-muted-foreground">Select scripts below and click "Add to Queue"</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Generation Queue</span>
          <span className="text-xs text-muted-foreground">({jobs.length} videos)</span>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning && done + failed > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}
              className="h-7 px-2 text-[10px] text-muted-foreground">
              Clear done
            </Button>
          )}
          {queued > 0 && !isRunning && (
            <Button onClick={onRun} size="sm"
              className="h-7 px-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs gap-1.5 neon-glow">
              <Play className="w-3 h-3" />
              Run {queued} {queued === 1 ? 'job' : 'jobs'}
            </Button>
          )}
          {isRunning && (
            <span className="text-xs text-primary font-medium flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Running…
            </span>
          )}
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 text-[10px]">
        {queued > 0  && <span className="px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">{queued} queued</span>}
        {done > 0    && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{done} done</span>}
        {failed > 0  && <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{failed} failed</span>}
      </div>

      {/* Job list */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
        {jobs.map(job => (
          <JobRow key={job.id} job={job} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}