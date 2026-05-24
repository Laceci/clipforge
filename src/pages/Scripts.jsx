import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Trash2, Copy, Clock, Search, Check, Layers, Upload, X, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import BatchQueuePanel from '../components/scripts/BatchQueuePanel';
import AIScriptGenerator from '../components/scripts/AIScriptGenerator';
import { buildJobFromScript, runBatchQueue } from '../lib/batchQueue';

const CATEGORIES = [
  { value: 'all',          label: 'All' },
  { value: 'motivation',   label: 'Motivation' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'facts',        label: 'Facts' },
  { value: 'horror',       label: 'Horror' },
  { value: 'finance',      label: 'Finance' },
  { value: 'fitness',      label: 'Fitness' },
  { value: 'custom',       label: 'Custom' },
];

const categoryColors = {
  motivation:   'bg-orange-500/20 text-orange-400',
  storytelling: 'bg-blue-500/20 text-blue-400',
  facts:        'bg-cyan-500/20 text-cyan-400',
  horror:       'bg-gray-500/20 text-gray-400',
  finance:      'bg-emerald-500/20 text-emerald-400',
  fitness:      'bg-pink-500/20 text-pink-400',
  custom:       'bg-primary/20 text-primary',
};

export default function Scripts() {
  const queryClient = useQueryClient();

  // ── Script CRUD state ──
  const [showNew, setShowNew]     = useState(false);
  const [newScript, setNewScript] = useState({ title: '', content: '', category: 'custom' });

  // ── Filter / search state ──
  const [search, setSearch]           = useState('');
  const [filterCategory, setFilter]   = useState('all');

  // ── Selection state ──
  const [selected, setSelected]       = useState(new Set());

  // ── Batch queue state ──
  const [queue, setQueue]             = useState([]);
  const [isRunning, setIsRunning]     = useState(false);
  const [showQueue, setShowQueue]     = useState(false);

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['scripts'],
    queryFn: () => base44.entities.SavedScript.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedScript.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      setShowNew(false);
      setNewScript({ title: '', content: '', category: 'custom' });
      toast.success('Script saved!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedScript.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
    },
  });

  const handleSave = () => {
    const wordCount = newScript.content.trim().split(/\s+/).length;
    createMutation.mutate({
      ...newScript,
      word_count: wordCount,
      estimated_duration: Math.round(wordCount / 2.5),
    });
  };

  const copyScript = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  // ── Bulk import from textarea ──
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const handleBulkImport = async () => {
    // Expect blocks separated by "---" or double newlines
    const blocks = importText.split(/\n---\n|\n\n/).map(b => b.trim()).filter(Boolean);
    if (!blocks.length) { toast.error('No scripts found'); return; }

    let count = 0;
    for (const block of blocks) {
      const lines = block.split('\n');
      const title = lines[0].replace(/^#+\s*/, '').trim() || `Imported Script ${count + 1}`;
      const content = lines.slice(1).join('\n').trim() || block;
      if (!content) continue;
      const wordCount = content.split(/\s+/).length;
      await base44.entities.SavedScript.create({
        title,
        content,
        category: 'custom',
        word_count: wordCount,
        estimated_duration: Math.round(wordCount / 2.5),
      });
      count++;
    }
    queryClient.invalidateQueries({ queryKey: ['scripts'] });
    setShowImport(false);
    setImportText('');
    toast.success(`Imported ${count} script${count !== 1 ? 's' : ''}`);
  };

  // ── Selection helpers ──
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map(s => s.id)));
  };

  const clearSelection = () => setSelected(new Set());

  // ── Add selected to queue ──
  const addToQueue = () => {
    const toAdd = filtered.filter(s => selected.has(s.id));
    const newJobs = toAdd.map(s => buildJobFromScript(s));
    setQueue(prev => [...prev, ...newJobs]);
    setSelected(new Set());
    setShowQueue(true);
    toast.success(`Added ${newJobs.length} script${newJobs.length !== 1 ? 's' : ''} to queue`);
  };

  // ── Run queue ──
  const handleRunQueue = async () => {
    const pending = queue.filter(j => j.status === 'queued');
    if (!pending.length) return;
    setIsRunning(true);

    await runBatchQueue(pending, (jobId, updates) => {
      setQueue(prev => prev.map(j => j.id === jobId ? { ...j, ...updates } : j));
    });

    setIsRunning(false);
    toast.success('Batch generation complete!');
  };

  const removeJob = (jobId) => setQueue(prev => prev.filter(j => j.id !== jobId));

  const clearDone = () => setQueue(prev => prev.filter(j => j.status === 'queued' || j.status === 'running'));

  // ── Filtered list ──
  const filtered = scripts.filter(s => {
    const matchesCat = filterCategory === 'all' || s.category === filterCategory;
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const queuedCount = queue.filter(j => j.status === 'queued').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Script Library</h1>
          <p className="text-sm text-muted-foreground mt-1">{scripts.length} scripts · select to batch-generate videos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AIScriptGenerator onScriptGenerated={() => queryClient.invalidateQueries({ queryKey: ['scripts'] })} />
          <Button variant="outline" onClick={() => setShowImport(true)}
            className="rounded-xl border-border gap-2 text-sm">
            <Upload className="w-4 h-4" /> Bulk Import
          </Button>
          <Button onClick={() => setShowNew(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 neon-glow">
            <Plus className="w-4 h-4" /> New Script
          </Button>
        </div>
      </div>

      {/* Queue panel (collapsible) */}
      <div>
        <button
          onClick={() => setShowQueue(v => !v)}
          className={cn('w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
            queue.length ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/20'
          )}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Generation Queue
            {queue.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">{queue.length}</span>
            )}
          </div>
          <ChevronDown className={cn('w-4 h-4 transition-transform', showQueue && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {showQueue && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2"
            >
              <BatchQueuePanel
                jobs={queue}
                isRunning={isRunning}
                onRun={handleRunQueue}
                onRemove={removeJob}
                onClear={clearDone}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter / Search / Selection bar */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search scripts..."
              className="pl-9 bg-secondary/40 border-border rounded-xl text-sm h-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setFilter(c.value)}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                  filterCategory === c.value
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-secondary/30 border-transparent text-muted-foreground hover:border-border')}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selection action bar */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button onClick={selected.size === filtered.length ? clearSelection : selectAll}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                selected.size === filtered.length ? 'bg-primary border-primary' : 'border-border')}>
                {selected.size === filtered.length && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
              </div>
              {selected.size === filtered.length ? 'Deselect all' : `Select all (${filtered.length})`}
            </button>

            {selected.size > 0 && (
              <>
                <span>·</span>
                <span className="text-primary font-medium">{selected.size} selected</span>
                <Button size="sm" onClick={addToQueue}
                  className="h-7 px-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs gap-1.5 neon-glow ml-auto">
                  <Layers className="w-3 h-3" />
                  Add {selected.size} to Queue
                </Button>
                <button onClick={clearSelection} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Script list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full bg-secondary/30 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">{scripts.length === 0 ? 'No scripts yet' : 'No matching scripts'}</h3>
          <p className="text-sm text-muted-foreground">
            {scripts.length === 0 ? 'Save scripts or bulk import to get started' : 'Try changing the category filter or search term'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((script) => {
              const isSelected = selected.has(script.id);
              return (
                <motion.div
                  key={script.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => toggleSelect(script.id)}
                  className={cn(
                    'glass-card rounded-2xl p-5 group cursor-pointer transition-all duration-200',
                    isSelected ? 'ring-1 ring-primary/40 bg-primary/5 neon-glow' : 'hover:neon-glow'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className={cn('mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                        isSelected ? 'bg-primary border-primary' : 'border-border/60 group-hover:border-primary/40')}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{script.title}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <Badge className={cn(categoryColors[script.category], 'border-0 text-[10px]')}>
                            {script.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />~{script.estimated_duration || 0}s
                          </span>
                          <span className="text-xs text-muted-foreground">{script.word_count || 0} words</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(script.created_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyScript(script.content)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(script.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed ml-7">{script.content}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* New Script Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>New Script</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Script title" value={newScript.title}
              onChange={e => setNewScript({ ...newScript, title: e.target.value })}
              className="bg-secondary/50 border-border rounded-xl" />
            <Select value={newScript.category} onValueChange={v => setNewScript({ ...newScript, category: v })}>
              <SelectTrigger className="bg-secondary/50 border-border rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {CATEGORIES.slice(1).map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="Write your script..." value={newScript.content}
              onChange={e => setNewScript({ ...newScript, content: e.target.value })}
              className="bg-secondary/50 border-border rounded-xl min-h-[200px]" />
            <Button onClick={handleSave} disabled={!newScript.title || !newScript.content || createMutation.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
              Save Script
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="bg-card border-border max-w-xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Scripts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Paste multiple scripts separated by <code className="bg-secondary/60 px-1 rounded">---</code> on its own line,
              or by a blank line. First line of each block becomes the title.
            </p>
            <Textarea
              placeholder={`# Script One\nYour first script content here...\n\n---\n\n# Script Two\nYour second script content here...`}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="bg-secondary/50 border-border rounded-xl min-h-[260px] font-mono text-xs"
            />
            <Button onClick={handleBulkImport} disabled={!importText.trim()}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2">
              <Upload className="w-4 h-4" /> Import Scripts
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}