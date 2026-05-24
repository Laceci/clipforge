import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Plus, Send, Calendar, CheckCircle2, XCircle, Clock, Trash2,
  AlertTriangle, Film, RefreshCw, Wifi, WifiOff, Info
} from 'lucide-react';
import { format } from 'date-fns';
import PlatformBadge from '../components/publish/PlatformBadge';
import ConnectedAccountCard from '../components/publish/ConnectedAccountCard';
import SchedulePostModal from '../components/publish/SchedulePostModal';
import PublishCalendar from '../components/publish/PublishCalendar';
import SocialMediaManager from '../components/publish/SocialMediaManager';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const PLATFORM_CONFIG = {
  tiktok:    { label: 'TikTok', icon: '🎵', desc: 'Post vertical videos directly to TikTok' },
  instagram: { label: 'Instagram', icon: '📸', desc: 'Share Reels to your Instagram profile' },
  youtube:   { label: 'YouTube', icon: '▶️', desc: 'Publish Shorts to your YouTube channel' },
  facebook:  { label: 'Facebook', icon: '📘', desc: 'Publish Reels to your Facebook page' },
};

const ERROR_MESSAGES = {
  expired_token:  { label: 'Connection Expired', color: 'text-amber-400', icon: WifiOff, action: 'Reconnect' },
  upload_failed:  { label: 'Upload Failed', color: 'text-destructive', icon: XCircle, action: 'Retry' },
  render_failed:  { label: 'Render Failed', color: 'text-destructive', icon: XCircle, action: 'Retry' },
  missing_media:  { label: 'Missing Media', color: 'text-destructive', icon: AlertTriangle, action: 'Fix' },
  api_timeout:    { label: 'API Timeout', color: 'text-amber-400', icon: AlertTriangle, action: 'Retry' },
};

export default function Publish() {
  const queryClient = useQueryClient();
  const [scheduleTarget, setScheduleTarget] = useState(null);

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: () => base44.entities.ConnectedAccount.list('-created_date'),
  });

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: () => base44.entities.ScheduledPost.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-ready'],
    queryFn: () => base44.entities.Project.filter({ status: 'ready' }, '-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] }),
  });

  const retryMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledPost.update(id, { status: 'scheduled', error_type: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast.success('Post re-queued for publishing.');
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: (id, newDate) => base44.entities.ScheduledPost.update(id, { scheduled_at: newDate.toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast.success('Post rescheduled');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedAccount.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connected-accounts'] }),
  });

  const connectedPlatforms = accounts.map(a => a.platform);
  const queuedPosts = posts.filter(p => p.status === 'scheduled' || p.status === 'draft');
  const historyPosts = posts.filter(p => p.status === 'published' || p.status === 'failed');
  const failedCount = posts.filter(p => p.status === 'failed').length;

  const handleConnect = (platform) => {
    toast.info(`Connecting ${PLATFORM_CONFIG[platform].label} requires an OAuth integration. This will be available with the social API setup.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Publish</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage accounts, schedule posts, and track publishing</p>
        </div>
        <Button
          onClick={() => projects.length > 0 ? setScheduleTarget(projects[0]) : toast.info('No ready projects to publish yet.')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 neon-glow"
        >
          <Send className="w-4 h-4" />
          New Post
        </Button>
      </div>

      {/* Failed jobs alert */}
      {failedCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-destructive">{failedCount} post{failedCount > 1 ? 's' : ''} failed</p>
            <p className="text-xs text-muted-foreground">Check the History tab and retry failed posts.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="calendar">
        <TabsList className="bg-secondary/50 rounded-xl p-1">
          <TabsTrigger value="calendar" className="rounded-lg text-sm">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="accounts" className="rounded-lg text-sm">
            <Wifi className="w-3.5 h-3.5 mr-1.5" />
            Accounts
            {accounts.length > 0 && (
              <span className="ml-1.5 bg-primary/20 text-primary text-[10px] rounded-full px-1.5 font-bold">{accounts.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="queue" className="rounded-lg text-sm">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Queue
            {queuedPosts.length > 0 && (
              <span className="ml-1.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full px-1.5 font-bold">{queuedPosts.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-sm">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            History
            {failedCount > 0 && (
              <span className="ml-1.5 bg-destructive/20 text-destructive text-[10px] rounded-full px-1.5 font-bold">{failedCount}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── CALENDAR TAB ── */}
        <TabsContent value="calendar" className="mt-6">
          <PublishCalendar
            posts={posts}
            onReschedule={(postId, newDate) => rescheduleMutation.mutate(postId, newDate)}
          />
        </TabsContent>

        {/* ── ACCOUNTS TAB ── */}
        <TabsContent value="accounts" className="mt-6 space-y-6">
          <SocialMediaManager />
        </TabsContent>

        {/* ── QUEUE TAB ── */}
        <TabsContent value="queue" className="mt-6 space-y-4">
          {loadingPosts ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl bg-secondary/30" />)}
            </div>
          ) : queuedPosts.length === 0 ? (
            <div className="glass-card rounded-2xl p-14 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-semibold mb-1">No posts queued</p>
              <p className="text-sm text-muted-foreground">Select a ready video below and schedule it for publishing</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queuedPosts.map(post => (
                <PostRow key={post.id} post={post} onDelete={deleteMutation.mutate} onRetry={retryMutation.mutate} />
              ))}
            </div>
          )}

          {/* Ready-to-publish projects */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ready to Publish</h3>
              <div className="space-y-2">
                {projects.map(p => (
                  <div key={p.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                    {p.thumbnail_url
                      ? <img src={p.thumbnail_url} className="w-10 h-14 object-cover rounded-lg shrink-0" alt="" />
                      : <div className="w-10 h-14 bg-secondary/60 rounded-lg shrink-0 flex items-center justify-center"><Film className="w-4 h-4 text-muted-foreground/30" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.duration ? `${p.duration}s` : '—'} · {p.resolution || '1080p'}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setScheduleTarget(p)}
                      className="bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs border-0 shrink-0"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Post
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── HISTORY TAB ── */}
        <TabsContent value="history" className="mt-6">
          {historyPosts.length === 0 ? (
            <div className="glass-card rounded-2xl p-14 text-center">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-semibold mb-1">No publish history yet</p>
              <p className="text-sm text-muted-foreground">Published and failed posts will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyPosts.map(post => (
                <PostRow key={post.id} post={post} onDelete={deleteMutation.mutate} onRetry={retryMutation.mutate} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {scheduleTarget && (
        <SchedulePostModal
          open={!!scheduleTarget}
          onClose={() => setScheduleTarget(null)}
          project={scheduleTarget}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })}
        />
      )}
    </div>
  );
}

function PostRow({ post, onDelete, onRetry }) {
  const isFailed = post.status === 'failed';
  const errorCfg = ERROR_MESSAGES[post.error_type] || null;

  const statusDisplay = {
    scheduled: { icon: <Clock className="w-3.5 h-3.5 text-amber-400" />, label: 'Scheduled', cls: 'text-amber-400' },
    published: { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, label: 'Published', cls: 'text-emerald-400' },
    failed:    { icon: <XCircle className="w-3.5 h-3.5 text-destructive" />, label: errorCfg?.label || 'Failed', cls: 'text-destructive' },
    draft:     { icon: <Film className="w-3.5 h-3.5 text-muted-foreground" />, label: 'Draft', cls: 'text-muted-foreground' },
  }[post.status] || {};

  return (
    <div className={`glass-card rounded-xl p-4 flex items-center gap-3 group ${isFailed ? 'border border-destructive/20' : ''}`}>
      {post.thumbnail_url
        ? <img src={post.thumbnail_url} className="w-10 h-14 object-cover rounded-lg shrink-0" alt="" />
        : <div className="w-10 h-14 bg-secondary/60 rounded-lg shrink-0 flex items-center justify-center"><Film className="w-4 h-4 text-muted-foreground/30" /></div>}

      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-medium text-sm truncate">{post.project_title || 'Untitled'}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {post.platforms?.map(p => <PlatformBadge key={p} platform={p} />)}
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${statusDisplay.cls}`}>
          {statusDisplay.icon}
          <span>{statusDisplay.label}</span>
          {post.scheduled_at && (
            <span className="text-muted-foreground">· {format(new Date(post.scheduled_at), 'MMM d, h:mm a')}</span>
          )}
        </div>
        {isFailed && post.error_message && (
          <p className="text-[10px] text-destructive/70">{post.error_message}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isFailed && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
            onClick={() => onRetry(post.id)}
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Retry
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(post.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}