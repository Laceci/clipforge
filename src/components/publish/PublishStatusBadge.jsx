import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  draft:      { icon: Clock,       color: 'text-muted-foreground',  bg: 'bg-secondary/40',         label: 'Draft' },
  scheduled:  { icon: Clock,       color: 'text-amber-400',         bg: 'bg-amber-400/10',         label: 'Scheduled' },
  processing: { icon: Loader2,     color: 'text-primary',           bg: 'bg-primary/10',           label: 'Publishing' },
  published:  { icon: CheckCircle2, color: 'text-emerald-400',       bg: 'bg-emerald-400/10',       label: 'Published' },
  failed:     { icon: AlertTriangle, color: 'text-destructive',       bg: 'bg-destructive/10',       label: 'Failed' },
};

export default function PublishStatusBadge({ status, animated = false }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;

  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg', cfg.bg)}>
      <Icon className={cn('w-3 h-3', cfg.color, animated && status === 'processing' && 'animate-spin')} />
      <span className={cn('text-[10px] font-semibold', cfg.color)}>{cfg.label}</span>
    </div>
  );
}