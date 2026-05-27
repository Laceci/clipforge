import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Play, Clock, Film, Loader2, AlertCircle, Edit, Send, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const statusConfig = {
  draft:      { color: 'bg-muted-foreground/20 text-muted-foreground', label: 'Draft' },
  generating: { color: 'bg-amber-500/20 text-amber-400',               label: 'Generating' },
  rendering:  { color: 'bg-blue-500/20 text-blue-400',                 label: 'Rendering' },
  ready:      { color: 'bg-primary/20 text-primary',                   label: 'Ready' },
  exported:   { color: 'bg-emerald-500/20 text-emerald-400',           label: 'Exported' },
  failed:     { color: 'bg-destructive/20 text-destructive',           label: 'Failed' },
};

export default function ProjectCard({ project, onDelete, onRetry, index = 0 }) {
  const cfg = statusConfig[project.status] || statusConfig.draft;
  const isGenerating = project.status === 'generating' || project.status === 'rendering';
  const isFailed = project.status === 'failed';
  const isReady = project.status === 'ready' || project.status === 'exported';
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = project.video_url;
    if (!url || downloading) return;
    setDownloading(true);
    const toastId = toast.loading('Preparing download...');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${(project.title || 'video').replace(/[^a-z0-9_\- ]/gi, '').trim() || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
      toast.success('Download started! Check your Downloads folder.', { id: toastId });
    } catch {
      toast.dismiss(toastId);
      window.open(url, '_blank');
      toast.info('Video opened in new tab — right-click the video → Save video as…', { duration: 8000 });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card rounded-2xl overflow-hidden group hover:neon-glow hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[9/12] bg-secondary/50 overflow-hidden">
        {project.thumbnail_url ? (
          <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2.5">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <div className="w-3/4 space-y-1">
              <div className="h-1 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${project.generation_progress || 30}%` }}
                />
              </div>
              <p className="text-[9px] text-center text-primary/70">{project.generation_progress || 30}%</p>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-7 h-7 text-destructive" />
            <p className="text-[9px] text-destructive/80 px-3 text-center line-clamp-2">{project.error_message || 'Generation failed'}</p>
          </div>
        )}

        {/* Hover actions overlay */}
        {isReady && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-3 gap-2">
            <div className="flex gap-1.5">
              <Link
                to={`/editor?id=${project.id}`}
                className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors"
                title="Preview / Edit"
              >
                <Play className="w-3.5 h-3.5 text-black ml-0.5" />
              </Link>
              <Link
                to={`/editor?id=${project.id}`}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Edit"
              >
                <Edit className="w-3.5 h-3.5 text-white" />
              </Link>
              {/* Download MP4 — only shown when final video is rendered */}
              {project.video_url && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-8 h-8 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center hover:bg-primary transition-colors disabled:opacity-50"
                  title="Download MP4"
                >
                  {downloading
                    ? <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
                    : <Download className="w-3.5 h-3.5 text-black" />}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 rounded-lg">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border text-xs">
              <DropdownMenuItem asChild>
                <Link to={`/editor?id=${project.id}`} className="flex items-center gap-2">
                  <Edit className="w-3 h-3" /> Edit
                </Link>
              </DropdownMenuItem>
              {isReady && project.video_url && (
                <DropdownMenuItem onClick={handleDownload} className="flex items-center gap-2">
                  {downloading
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Downloading...</>
                    : <><Download className="w-3 h-3" /> Download MP4</>}
                </DropdownMenuItem>
              )}
              {isFailed && (
                <DropdownMenuItem onClick={() => onRetry?.(project)} className="flex items-center gap-2 text-amber-400">
                  <RefreshCw className="w-3 h-3" /> Retry
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive flex items-center gap-2" onClick={() => onDelete(project.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <Badge className={`${cfg.color} border-0 text-[8px] md:text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5`}>
            {cfg.label}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5 md:p-3">
        <h3 className="font-semibold text-xs md:text-sm truncate mb-1.5">{project.title}</h3>
        <div className="flex items-center justify-between text-[9px] md:text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            <span>{project.duration ? `${project.duration}s` : '—'}</span>
          </div>
          <span>{format(new Date(project.created_date), 'MMM d')}</span>
        </div>
      </div>
    </motion.div>
  );
}