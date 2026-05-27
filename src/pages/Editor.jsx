import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Save, Download, Play, Film, Sparkles, Layers, Palette, Volume2, Send, AlertCircle, Mic, Loader2 } from 'lucide-react';
import SceneEditorCard from '../components/editor/SceneEditorCard';
import AITransitionsPanel from '../components/editor/AITransitionsPanel';
import AIColorGradingPanel from '../components/editor/AIColorGradingPanel';
import AIAudioPanel from '../components/editor/AIAudioPanel';
import VoicePreviewPanel from '../components/editor/VoicePreviewPanel';
import ScenePreview from '../components/preview/ScenePreview';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';

export default function Editor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }),
    enabled: !!projectId,
    select: (data) => data[0],
  });

  const [editedProject, setEditedProject] = useState(null);
  const [renderState, setRenderState] = useState({ status: 'idle', error: null });
  const [downloading, setDownloading] = useState(false);
  const pollIntervalRef = useRef(null);
  const currentData = editedProject || project;

  useEffect(() => {
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, []);

  useEffect(() => {
    if (project && !editedProject) setEditedProject({ ...project });
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project saved!');
    },
  });

  const updateScene = (index, updates) => {
    const newScenes = [...(currentData.scenes || [])];
    newScenes[index] = { ...newScenes[index], ...updates };
    setEditedProject({ ...currentData, scenes: newScenes });
  };

  const deleteScene = (index) => {
    const newScenes = (currentData.scenes || []).filter((_, i) => i !== index);
    setEditedProject({ ...currentData, scenes: newScenes });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const scenes = Array.from(currentData.scenes || []);
    const [moved] = scenes.splice(result.source.index, 1);
    scenes.splice(result.destination.index, 0, moved);
    setEditedProject({ ...currentData, scenes: scenes.map((s, i) => ({ ...s, order: i })) });
  };

  const handleDownload = async () => {
    const url = currentData?.video_url;
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
      a.download = `${(currentData.title || 'video').replace(/[^a-z0-9_\- ]/gi, '').trim() || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
      toast.success('Download started! Check your Downloads folder.', { id: toastId });
    } catch {
      toast.dismiss(toastId);
      window.open(url, '_blank');
      toast.info('Video opened in new tab — right-click → Save video as…', { duration: 8000 });
    } finally {
      setDownloading(false);
    }
  };

  const handleRender = async () => {
    const scenes = currentData?.scenes;
    if (!scenes?.length) { toast.error('No scenes to render.'); return; }
    setRenderState({ status: 'submitting', error: null });
    try {
      const script = scenes.map(s => s.text || s.caption || '').filter(Boolean).join(' ') || currentData.topic || '';
      const result = await base44.functions.invoke('renderFinalVideo', {
        script,
        voice_id: currentData.voice_id,
        voice_speed: currentData.voice_speed || 1.0,
        scenes: scenes.map(s => ({
          image_url: s.image_url || null,
          video_url: s.video_url || null,
          duration: s.duration || 5,
          caption: s.caption || s.text || '',
        })),
        caption_style: currentData.caption_style || 'tiktok_bold',
        highlight_color: currentData.highlight_color || '#A3E635',
        resolution: currentData.resolution || '1080p',
      });
      const data = result?.data;
      if (data?.error) throw new Error(data.error);
      if (!data?.render_id) throw new Error('No render ID returned. Check ELEVENLABS_API_KEY and CREATOMATE_API_KEY in Base44 Secrets.');
      const renderId = data.render_id;
      setRenderState({ status: 'rendering', error: null });
      toast.success('Voiceover done! Rendering MP4 — check back in 1–2 min…');
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const poll = await base44.functions.invoke('renderFinalVideo', { render_id: renderId });
          const pd = poll?.data;
          if (!pd?.pending) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            if (pd?.video_url) {
              await base44.entities.Project.update(projectId, { video_url: pd.video_url, status: 'exported' }).catch(() => {});
              setEditedProject(prev => ({ ...prev, video_url: pd.video_url }));
              setRenderState({ status: 'done', error: null });
              toast.success('MP4 ready! Click Export to download.');
            } else {
              setRenderState({ status: 'failed', error: pd?.error || 'Render failed' });
              toast.error(pd?.error || 'Render failed');
            }
          }
        } catch (pollErr) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setRenderState({ status: 'failed', error: pollErr.message });
          toast.error('Polling error: ' + pollErr.message);
        }
      }, 6000);
    } catch (err) {
      setRenderState({ status: 'failed', error: err.message });
      toast.error('Render failed: ' + err.message);
    }
  };

  const handleSave = () => {
    const { id, created_date, updated_date, created_by, ...data } = editedProject;
    updateMutation.mutate(data);
  };

  const updateProject = (changes) => setEditedProject(prev => ({ ...prev, ...changes }));

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48 bg-secondary/30" />
        <Skeleton className="h-64 w-full bg-secondary/30 rounded-2xl" />
      </div>
    );
  }

  if (!currentData) {
    return (
      <div className="text-center py-20">
        <Film className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">Back to Dashboard</Button>
      </div>
    );
  }

  const totalDuration = currentData.scenes?.reduce((sum, s) => sum + (s.duration || 5), 0) || 0;
  const isFailed = currentData.status === 'failed';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Input
            value={currentData.title || ''}
            onChange={(e) => setEditedProject({ ...currentData, title: e.target.value })}
            className="text-lg font-bold bg-transparent border-none shadow-none focus-visible:ring-0 w-56"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden md:block">{totalDuration}s · {currentData.scenes?.length || 0} scenes</span>
          <Link to="/publish">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 border-border text-xs">
              <Send className="w-3.5 h-3.5" />
              Publish
            </Button>
          </Link>
          <Button variant="outline" onClick={handleSave} disabled={updateMutation.isPending} className="rounded-xl gap-2 border-border text-sm">
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
          {currentData?.video_url ? (
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 text-sm neon-glow"
            >
              {downloading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Downloading...</>
                : <><Download className="w-4 h-4" /> Download MP4</>}
            </Button>
          ) : renderState.status === 'submitting' ? (
            <Button disabled className="bg-primary/50 text-primary-foreground rounded-xl gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Generating voiceover...
            </Button>
          ) : renderState.status === 'rendering' ? (
            <Button disabled className="bg-primary/50 text-primary-foreground rounded-xl gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Rendering MP4...
            </Button>
          ) : (
            <Button
              onClick={handleRender}
              disabled={renderState.status === 'submitting' || renderState.status === 'rendering'}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 text-sm neon-glow"
            >
              <Download className="w-4 h-4" />
              {renderState.status === 'failed' ? 'Retry Render' : 'Export MP4'}
            </Button>
          )}
        </div>
      </div>

      {/* Failed alert */}
      {isFailed && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-destructive">Generation Failed</p>
            <p className="text-xs text-muted-foreground truncate">{currentData.error_message || 'An error occurred. Try regenerating.'}</p>
          </div>
        </div>
      )}

      {/* Main 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_280px] gap-5">
        {/* Live Preview with synced captions */}
        <div className="self-start sticky top-4 space-y-2">
          <ScenePreview scenes={currentData.scenes || []} projectData={currentData} />
          <p className="text-[10px] text-center text-muted-foreground">
            {currentData.scenes?.length || 0} scenes · {totalDuration}s · captions synced
          </p>
        </div>

        {/* Scene Timeline with DnD */}
        <div className="space-y-3 min-w-0">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Scene Timeline</h3>
          {currentData.scenes?.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="scenes">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {currentData.scenes.map((scene, i) => (
                      <Draggable key={i} draggableId={`scene-${i}`} index={i}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <SceneEditorCard
                              scene={scene}
                              index={i}
                              isDragging={snapshot.isDragging}
                              visualStyle={currentData.visual_style}
                              onUpdate={(updates) => updateScene(i, updates)}
                              onDelete={() => deleteScene(i)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Film className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No scenes. Generate a video first.</p>
            </div>
          )}
        </div>

        {/* AI Panel */}
        <div className="glass-card rounded-2xl p-4 self-start sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">AI Enhance</span>
          </div>

          <Tabs defaultValue="voice">
            <TabsList className="w-full bg-secondary/50 rounded-xl p-1 mb-4 grid grid-cols-4">
              <TabsTrigger value="voice" className="rounded-lg text-[10px]">
                <Mic className="w-3 h-3 mr-1" /> Voice
              </TabsTrigger>
              <TabsTrigger value="transitions" className="rounded-lg text-[10px]">
                <Layers className="w-3 h-3 mr-1" /> Cuts
              </TabsTrigger>
              <TabsTrigger value="color" className="rounded-lg text-[10px]">
                <Palette className="w-3 h-3 mr-1" /> Color
              </TabsTrigger>
              <TabsTrigger value="audio" className="rounded-lg text-[10px]">
                <Volume2 className="w-3 h-3 mr-1" /> Audio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voice">
              <p className="text-xs font-semibold mb-3">Voice Preview</p>
              <VoicePreviewPanel
                scenes={currentData.scenes || []}
                projectData={currentData}
                onUpdateScene={(index, updates) => updateScene(index, updates)}
              />
            </TabsContent>

            <TabsContent value="transitions">
              <p className="text-xs font-semibold mb-3">Scene Transitions</p>
              <AITransitionsPanel
                scenes={currentData.scenes || []}
                onApply={(updatedScenes) => {
                  setEditedProject({ ...currentData, scenes: updatedScenes });
                  toast.success('Transitions applied!');
                }}
              />
            </TabsContent>

            <TabsContent value="color">
              <p className="text-xs font-semibold mb-3">Color Grading</p>
              <AIColorGradingPanel project={currentData} onUpdate={updateProject} />
            </TabsContent>

            <TabsContent value="audio">
              <p className="text-xs font-semibold mb-3">Audio Enhancement</p>
              <AIAudioPanel project={currentData} onUpdate={updateProject} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}