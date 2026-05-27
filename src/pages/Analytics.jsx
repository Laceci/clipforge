import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2, Film, RefreshCw, ArrowUpRight } from 'lucide-react';
import ExportButton from '../components/ui/ExportButton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import PlatformBadge from '../components/publish/PlatformBadge';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

// Generate simulated analytics for a post
function simulateStats(post, seed) {
  const s = (seed % 7) + 1;
  const views   = Math.round((s * 8400 + (seed * 1337)) % 480000 + 1200);
  const likes   = Math.round(views * (0.04 + (s * 0.008)));
  const comments = Math.round(likes * 0.12);
  const shares  = Math.round(likes * 0.07);
  const engRate = (((likes + comments + shares) / views) * 100).toFixed(1);
  return { views, likes, comments, shares, engRate: parseFloat(engRate) };
}

function generateTrend(seed, days = 14) {
  return Array.from({ length: days }, (_, i) => {
    const base = (seed * 300 + i * 450 + Math.sin(i + seed) * 800);
    return {
      date: format(subDays(new Date(), days - 1 - i), 'MMM d'),
      views: Math.max(0, Math.round(base + (i * i * 12))),
    };
  });
}

const METRIC_CONFIG = [
  { key: 'views',    label: 'Views',       icon: Eye,            color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  { key: 'likes',    label: 'Likes',       icon: Heart,          color: 'text-pink-400',    bg: 'bg-pink-400/10' },
  { key: 'comments', label: 'Comments',    icon: MessageCircle,  color: 'text-amber-400',   bg: 'bg-amber-400/10' },
  { key: 'shares',   label: 'Shares',      icon: Share2,         color: 'text-primary',     bg: 'bg-primary/10' },
];

function StatCard({ metric, value, prev }) {
  const Icon = metric.icon;
  const delta = prev > 0 ? (((value - prev) / prev) * 100).toFixed(1) : null;
  const up = delta >= 0;
  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', metric.bg)}>
        <Icon className={cn('w-5 h-5', metric.color)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{metric.label}</p>
        <p className="text-xl font-bold">{value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}</p>
      </div>
      {delta !== null && (
        <div className={cn('ml-auto flex items-center gap-1 text-xs font-semibold shrink-0', up ? 'text-emerald-400' : 'text-destructive')}>
          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {Math.abs(delta)}%
        </div>
      )}
    </div>
  );
}

function VideoRow({ post, stats, index, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left glass-card rounded-xl p-3 flex items-center gap-3 transition-all',
        selected ? 'ring-1 ring-primary/40 bg-primary/5' : 'hover:bg-secondary/30'
      )}
    >
      {post.thumbnail_url
        ? <img src={post.thumbnail_url} className="w-10 h-14 object-cover rounded-lg shrink-0" alt="" />
        : <div className="w-10 h-14 bg-secondary/60 rounded-lg shrink-0 flex items-center justify-center"><Film className="w-4 h-4 text-muted-foreground/30" /></div>}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{post.project_title || 'Untitled'}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {post.platforms?.map(p => <PlatformBadge key={p} platform={p} />)}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{stats.views >= 1000 ? `${(stats.views/1000).toFixed(1)}K` : stats.views}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{stats.likes >= 1000 ? `${(stats.likes/1000).toFixed(1)}K` : stats.likes}</span>
          <span className={cn('font-medium', stats.engRate >= 5 ? 'text-primary' : 'text-muted-foreground')}>
            {stats.engRate}% eng.
          </span>
        </div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
    </button>
  );
}

export default function Analytics() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['published-posts'],
    queryFn: () => base44.entities.ScheduledPost.filter({ status: 'published' }, '-created_date'),
  });

  // For demo: also show scheduled posts as "published" if no published exist
  const { data: allPosts = [] } = useQuery({
    queryKey: ['all-posts-analytics'],
    queryFn: () => base44.entities.ScheduledPost.list('-created_date'),
  });

  const displayPosts = posts.length > 0 ? posts : allPosts.slice(0, 8);

  // Pre-compute stats for all posts
  const allStats = displayPosts.map((p, i) => simulateStats(p, i + 1));

  const totals = allStats.reduce(
    (acc, s) => ({ views: acc.views + s.views, likes: acc.likes + s.likes, comments: acc.comments + s.comments, shares: acc.shares + s.shares }),
    { views: 0, likes: 0, comments: 0, shares: 0 }
  );
  const prevTotals = { views: Math.round(totals.views * 0.78), likes: Math.round(totals.likes * 0.71), comments: Math.round(totals.comments * 0.82), shares: Math.round(totals.shares * 0.65) };

  const selectedPost = displayPosts[selectedIndex];
  const selectedStats = allStats[selectedIndex];
  const trendData = selectedPost ? generateTrend(selectedIndex + 1) : [];

  // Platform breakdown
  const platformTotals = {};
  displayPosts.forEach((p, i) => {
    p.platforms?.forEach(plat => {
      if (!platformTotals[plat]) platformTotals[plat] = { views: 0, likes: 0, posts: 0 };
      platformTotals[plat].views += allStats[i].views;
      platformTotals[plat].likes += allStats[i].likes;
      platformTotals[plat].posts += 1;
    });
  });
  const platformData = Object.entries(platformTotals).map(([name, v]) => ({ name, ...v }));

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-secondary/30" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl bg-secondary/30" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Track performance across all published videos</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            rows={displayPosts.map((p, i) => ({ ...p, ...allStats[i] }))}
            columns={[
              { label: 'Video Title',      getValue: r => r.project_title || 'Untitled' },
              { label: 'Platforms',        getValue: r => r.platforms?.join(', ') || '' },
              { label: 'Views',            key: 'views' },
              { label: 'Likes',            key: 'likes' },
              { label: 'Comments',         key: 'comments' },
              { label: 'Shares',           key: 'shares' },
              { label: 'Engagement Rate',  getValue: r => `${r.engRate}%` },
            ]}
            filename="clipforge-analytics"
            title="Video Analytics"
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 px-3 py-2 rounded-xl">
            <RefreshCw className="w-3.5 h-3.5" />
            Simulated · Connect platforms for live data
          </div>
        </div>
      </div>

      {displayPosts.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-semibold mb-2">No published posts yet</p>
          <p className="text-sm text-muted-foreground">Publish a video to start seeing analytics here.</p>
        </div>
      ) : (
        <>
          {/* Overview stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {METRIC_CONFIG.map(m => (
              <StatCard key={m.key} metric={m} value={totals[m.key]} prev={prevTotals[m.key]} />
            ))}
          </div>

          <Tabs defaultValue="videos">
            <TabsList className="bg-secondary/50 rounded-xl p-1">
              <TabsTrigger value="videos" className="rounded-lg text-sm">Video Performance</TabsTrigger>
              <TabsTrigger value="platforms" className="rounded-lg text-sm">By Platform</TabsTrigger>
              <TabsTrigger value="growth" className="rounded-lg text-sm">Growth Trend</TabsTrigger>
            </TabsList>

            {/* ── VIDEO PERFORMANCE ── */}
            <TabsContent value="videos" className="mt-5">
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
                {/* Video list */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {displayPosts.map((post, i) => (
                    <VideoRow
                      key={post.id}
                      post={post}
                      stats={allStats[i]}
                      index={i}
                      selected={i === selectedIndex}
                      onClick={() => setSelectedIndex(i)}
                    />
                  ))}
                </div>

                {/* Selected video detail */}
                {selectedPost && (
                  <div className="glass-card rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      {selectedPost.thumbnail_url
                        ? <img src={selectedPost.thumbnail_url} className="w-12 h-16 object-cover rounded-xl shrink-0" alt="" />
                        : <div className="w-12 h-16 bg-secondary/60 rounded-xl shrink-0 flex items-center justify-center"><Film className="w-5 h-5 text-muted-foreground/30" /></div>}
                      <div className="min-w-0">
                        <p className="font-bold text-base truncate">{selectedPost.project_title || 'Untitled'}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {selectedPost.platforms?.map(p => <PlatformBadge key={p} platform={p} />)}
                        </div>
                      </div>
                    </div>

                    {/* Metric grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {METRIC_CONFIG.map(m => {
                        const Icon = m.icon;
                        return (
                          <div key={m.key} className={cn('rounded-xl p-4', m.bg)}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon className={cn('w-3.5 h-3.5', m.color)} />
                              <span className="text-xs text-muted-foreground">{m.label}</span>
                            </div>
                            <p className="text-xl font-bold">
                              {selectedStats[m.key] >= 1000
                                ? `${(selectedStats[m.key] / 1000).toFixed(1)}K`
                                : selectedStats[m.key]}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Engagement rate</span>
                      <span className={cn('font-bold', selectedStats.engRate >= 5 ? 'text-primary neon-text' : 'text-foreground')}>
                        {selectedStats.engRate}%
                      </span>
                    </div>

                    {/* View trend */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">14-day Views</p>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 17%)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} interval={3} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} width={40}
                            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                          <Tooltip
                            contentStyle={{ background: 'hsl(240 10% 5.5%)', border: '1px solid hsl(240 5% 17%)', borderRadius: 12, fontSize: 12 }}
                            labelStyle={{ color: 'hsl(0 0% 95%)' }}
                          />
                          <Line type="monotone" dataKey="views" stroke="hsl(82 85% 55%)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── BY PLATFORM ── */}
            <TabsContent value="platforms" className="mt-5 space-y-5">
              {platformData.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground text-sm">No platform data yet.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {platformData.map(p => (
                      <div key={p.name} className="glass-card rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <PlatformBadge platform={p.name} />
                          <span className="text-xs text-muted-foreground">{p.posts} video{p.posts !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Views</span>
                            <span className="font-bold">{p.views >= 1000 ? `${(p.views/1000).toFixed(1)}K` : p.views}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Likes</span>
                            <span className="font-bold">{p.likes >= 1000 ? `${(p.likes/1000).toFixed(1)}K` : p.likes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Avg. eng. rate</span>
                            <span className="font-bold text-primary">{((p.likes / p.views) * 100 * 2).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="glass-card rounded-2xl p-6">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Views by Platform</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={platformData} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 17%)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(240 5% 55%)', textTransform: 'capitalize' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} width={45}
                          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                        <Tooltip
                          contentStyle={{ background: 'hsl(240 10% 5.5%)', border: '1px solid hsl(240 5% 17%)', borderRadius: 12, fontSize: 12 }}
                        />
                        <Bar dataKey="views" fill="hsl(82 85% 55%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </TabsContent>

            {/* ── GROWTH TREND ── */}
            <TabsContent value="growth" className="mt-5 space-y-5">
              <div className="glass-card rounded-2xl p-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Total Views — Last 14 Days</p>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={generateTrend(99, 14).map((d, i) => ({
                    ...d,
                    views: allStats.reduce((sum, s, si) => sum + generateTrend(si + 1, 14)[i].views, 0),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 17%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} width={50}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(240 10% 5.5%)', border: '1px solid hsl(240 5% 17%)', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: 'hsl(0 0% 95%)' }}
                    />
                    <Line type="monotone" dataKey="views" stroke="hsl(82 85% 55%)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top performers */}
              <div className="glass-card rounded-2xl p-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Top Performing Videos</p>
                <div className="space-y-3">
                  {[...displayPosts]
                    .map((p, i) => ({ post: p, stats: allStats[i] }))
                    .sort((a, b) => b.stats.views - a.stats.views)
                    .slice(0, 5)
                    .map(({ post, stats }, rank) => (
                      <div key={post.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground/50 w-4">#{rank + 1}</span>
                        {post.thumbnail_url
                          ? <img src={post.thumbnail_url} className="w-8 h-11 object-cover rounded-lg shrink-0" alt="" />
                          : <div className="w-8 h-11 bg-secondary/60 rounded-lg shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{post.project_title || 'Untitled'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {post.platforms?.map(p => <PlatformBadge key={p} platform={p} />)}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">{stats.views >= 1000 ? `${(stats.views/1000).toFixed(1)}K` : stats.views}</p>
                          <p className="text-[10px] text-primary">{stats.engRate}% eng.</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}