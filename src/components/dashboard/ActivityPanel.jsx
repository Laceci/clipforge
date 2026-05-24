import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ActivityPanel({ projects }) {
  const processing = projects.filter(p => p.status === 'generating' || p.status === 'rendering');
  const failed = projects.filter(p => p.status === 'failed').slice(0, 3);
  const recent = projects.filter(p => p.status === 'ready' || p.status === 'exported').slice(0, 3);

  if (processing.length === 0 && failed.length === 0 && recent.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-3"
    >
      {/* Processing */}
      {processing.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-amber-400/15">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <p className="text-xs font-semibold text-amber-400">Processing ({processing.length})</p>
          </div>
          <div className="space-y-2">
            {processing.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate font-medium">{p.title}</p>
                  <div className="h-1 bg-secondary/50 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${p.generation_progress || 20}%` }}
                    />
                  </div>
                </div>
                <span className="text-[9px] text-amber-400 font-bold shrink-0">{p.generation_progress || 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed */}
      {failed.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-destructive/15">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            <p className="text-xs font-semibold text-destructive">Failed ({failed.length})</p>
          </div>
          <div className="space-y-2">
            {failed.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate font-medium">{p.title}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{p.error_message || 'Unknown error'}</p>
                </div>
                <Link to={`/create`}>
                  <Button size="sm" variant="outline" className="h-6 text-[9px] px-2 border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg shrink-0">
                    <RefreshCw className="w-2.5 h-2.5 mr-1" /> Retry
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently ready */}
      {recent.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-emerald-400/15">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-xs font-semibold text-emerald-400">Ready to Publish</p>
          </div>
          <div className="space-y-2">
            {recent.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate font-medium">{p.title}</p>
                  <p className="text-[9px] text-muted-foreground">{format(new Date(p.created_date), 'MMM d · h:mm a')}</p>
                </div>
                <Link to={`/publish?project=${p.id}`}>
                  <Button size="sm" className="h-6 text-[9px] px-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg shrink-0 border-0">
                    Publish
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}