import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X } from 'lucide-react';
import ExportButton from '../components/ui/ExportButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import StatsRow from '../components/dashboard/StatsRow';
import QuickActions from '../components/dashboard/QuickActions';
import ProjectCard from '../components/dashboard/ProjectCard';
import HeroSection from '../components/dashboard/HeroSection';
import OnboardingPanel from '../components/dashboard/OnboardingPanel';
import ActivityPanel from '../components/dashboard/ActivityPanel';
import MarketingHero from '../components/marketing/HeroSection';
import FeaturesSection from '../components/marketing/FeaturesSection';
import ProductShowcaseSection from '../components/marketing/ProductShowcaseSection';
import TrustSection from '../components/marketing/TrustSection';
import CTABanner from '../components/marketing/CTABanner';
import LargeProductShowcase from '../components/marketing/LargeProductShowcase';

const CATEGORY_CHIPS = [
  { id: 'motivation',       label: '🔥 Motivation' },
  { id: 'storytelling',     label: '📖 Storytelling' },
  { id: 'facts',            label: '🧠 Facts' },
  { id: 'horror',           label: '👻 Horror' },
  { id: 'finance',          label: '💰 Finance' },
  { id: 'fitness',          label: '💪 Fitness' },
  { id: 'dark_psychology',  label: '🧪 Dark Psych' },
  { id: 'business',         label: '📊 Business' },
];

function getCompletedSteps(projects, connectedAccounts) {
  const steps = [];
  if (projects.length > 0) steps.push(1);
  if (projects.some(p => p.voice_style || p.visual_style)) steps.push(2);
  if (connectedAccounts > 0) steps.push(3);
  if (projects.some(p => p.status === 'exported' || p.status === 'ready')) steps.push(4);
  return steps;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const location = useLocation();

  // Parse ?filter= from URL
  const urlParams = new URLSearchParams(location.search);
  const urlFilter = urlParams.get('filter') || 'all';

  const [activeFilter, setActiveFilter] = useState(urlFilter);
  const [search, setSearch] = useState('');
  const [categoryChip, setCategoryChip] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', currentUser?.email],
    queryFn: () => base44.entities.Project.filter(
      { is_template: false, created_by: currentUser.email },
      '-created_date'
    ),
    enabled: !!currentUser?.email,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasActive = Array.isArray(data) && data.some(p => p.status === 'generating' || p.status === 'rendering');
      return hasActive ? 4000 : false;
    },
  });

  const { data: connectedAccounts = [] } = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: () => base44.entities.ConnectedAccount.filter({ status: 'connected' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  // Auto-fail projects stuck in generating/rendering for more than 15 minutes
  useEffect(() => {
    if (!projects.length) return;
    const TIMEOUT_MS = 15 * 60 * 1000;
    const now = Date.now();
    const stale = projects.filter(p => {
      if (p.status !== 'generating' && p.status !== 'rendering') return false;
      const lastUpdate = new Date(p.updated_date || p.created_date).getTime();
      return now - lastUpdate > TIMEOUT_MS;
    });
    stale.forEach(p => {
      base44.entities.Project.update(p.id, { status: 'failed' })
        .then(() => queryClient.invalidateQueries({ queryKey: ['projects'] }))
        .catch(() => {});
    });
  }, [projects]);

  const handleFilter = (filterId) => {
    setActiveFilter(prev => prev === filterId ? 'all' : filterId);
    setCategoryChip(null);
  };

  const handleCategoryChip = (chipId) => {
    setCategoryChip(prev => prev === chipId ? null : chipId);
    setActiveFilter('all');
  };

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    // Status filter
    if (activeFilter === 'processing') list = list.filter(p => p.status === 'generating' || p.status === 'rendering');
    else if (activeFilter === 'rendered')   list = list.filter(p => ['ready', 'exported'].includes(p.status));
    else if (activeFilter === 'exported')   list = list.filter(p => p.status === 'exported');
    else if (activeFilter === 'failed')     list = list.filter(p => p.status === 'failed');
    else if (activeFilter === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      list = list.filter(p => new Date(p.created_date) > weekAgo);
    }

    // Category chip filter
    if (categoryChip) list = list.filter(p => p.template_category === categoryChip);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title?.toLowerCase().includes(q) || p.topic?.toLowerCase().includes(q));
    }

    return list;
  }, [projects, activeFilter, categoryChip, search]);

  const failedCount = projects.filter(p => p.status === 'failed').length;
  const completedSteps = getCompletedSteps(projects, connectedAccounts.length);
  const isNewUser = projects.length === 0;
  const hasActiveFilter = activeFilter !== 'all' || categoryChip || search.trim();

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Premium Marketing Layer for New Users */}
      {isNewUser ? (
        <div className="max-w-7xl mx-auto space-y-12">
          <MarketingHero />
          <FeaturesSection />
          <LargeProductShowcase />
          <ProductShowcaseSection />
          <TrustSection />
          <CTABanner />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-5 md:space-y-6">
          {/* Returning user dashboard */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground text-xs mt-0.5">From idea to published Short — one workflow.</p>
            </div>
            <Link to="/create">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 font-semibold neon-glow text-xs md:text-sm h-8 md:h-9 px-3 md:px-4">
                <Plus className="w-3.5 h-3.5" />
                New Video
              </Button>
            </Link>
          </div>

          {/* Stats — clickable / filterable */}
          <StatsRow projects={projects} onFilter={handleFilter} activeFilter={activeFilter} />

          {/* Onboarding panel for new/early users */}
          {projects.length < 3 && (
            <OnboardingPanel completedSteps={completedSteps} />
          )}

          {/* Activity: processing / failed / ready */}
          <ActivityPanel projects={projects} />

          {/* Quick actions */}
          <QuickActions failedCount={failedCount} />
        </div>
      )}

      {/* Projects section */}
      <div className="max-w-7xl mx-auto">
      <div className="space-y-3">
        {/* Section header + search + filters */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-semibold">
              {hasActiveFilter ? 'Filtered Projects' : 'Recent Projects'}
              {filteredProjects.length > 0 && (
                <span className="ml-2 text-[10px] text-muted-foreground font-normal">({filteredProjects.length})</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <ExportButton
                rows={filteredProjects}
                columns={[
                  { label: 'Title',        key: 'title' },
                  { label: 'Status',       key: 'status' },
                  { label: 'Duration (s)', key: 'duration' },
                  { label: 'Scenes',       getValue: r => r.scenes?.length ?? '' },
                  { label: 'Visual Style', key: 'visual_style' },
                  { label: 'Resolution',   key: 'resolution' },
                  { label: 'Created',      getValue: r => r.created_date ? new Date(r.created_date).toLocaleDateString('en-GB') : '' },
                ]}
                filename="clipforge-projects"
                title={hasActiveFilter ? 'Filtered Projects' : 'All Projects'}
              />
              {hasActiveFilter && (
                <button
                  onClick={() => { setActiveFilter('all'); setCategoryChip(null); setSearch(''); }}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search projects by title or topic..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-secondary/40 border-border rounded-xl pl-9 h-8 text-xs"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_CHIPS.map(chip => (
              <button
                key={chip.id}
                onClick={() => handleCategoryChip(chip.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                  categoryChip === chip.id
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden">
                <Skeleton className="aspect-[9/12] bg-secondary/30" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3.5 w-3/4 bg-secondary/30" />
                  <Skeleton className="h-3 w-1/2 bg-secondary/30" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-2xl p-10 md:p-14 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm mb-1.5">
              {hasActiveFilter ? 'No projects match this filter' : 'No projects yet'}
            </h3>
            <p className="text-muted-foreground text-xs mb-4">
              {hasActiveFilter
                ? 'Try clearing filters or create a new video.'
                : 'Create your first viral video in minutes — just enter a topic.'}
            </p>
            <Link to="/create">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl neon-glow text-sm">
                {hasActiveFilter ? 'Create New Video' : 'Get Started'}
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            <AnimatePresence>
              {filteredProjects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  onDelete={deleteMutation.mutate}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
        </div>
        </div>
        </div>
        );
        }