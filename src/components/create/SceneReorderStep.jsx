import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, ArrowRight, ImageIcon, Clock, RefreshCw, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VISUAL_EFFECTS } from '@/lib/aiEnhancements';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SceneReorderStep({ scenes = [], projectData = {}, onConfirm }) {
  const [orderedScenes, setOrderedScenes] = useState(scenes);
  const [replacingIndex, setReplacingIndex] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loadingIndex, setLoadingIndex] = useState(null);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedScenes);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setOrderedScenes(items.map((s, i) => ({ ...s, order: i })));
  };

  const totalDuration = orderedScenes.reduce((sum, s) => sum + (s.duration || 5), 0);

  const handleReplace = async (index, promptOverride) => {
    const scene = orderedScenes[index];
    const prompt = promptOverride || scene.text || '';
    if (!prompt.trim()) return;

    setLoadingIndex(index);
    try {
      const provider = projectData.video_provider || 'image_fallback';
      const result = await base44.functions.invoke('generateVideoClip', {
        sceneText: prompt,
        prompt,
        provider,
        duration: scene.duration || 5,
        mood: projectData.mood || 'cinematic',
        visualStyle: projectData.visual_style || 'cinematic',
      });

      const data = result?.data;

      // Pexels / image_fallback return immediately
      if (data?.image_url || data?.video_url) {
        const updated = orderedScenes.map((s, i) =>
          i === index
            ? { ...s, image_url: data.video_url || data.image_url, video_url: data.video_url || s.video_url }
            : s
        );
        setOrderedScenes(updated);
        setReplacingIndex(null);
        setCustomPrompt('');
        toast.success('Visual replaced');
        return;
      }

      toast.error(data?.failure_reason || 'Could not generate a new visual');
    } catch (err) {
      toast.error('Replace failed: ' + err.message);
    } finally {
      setLoadingIndex(null);
    }
  };

  const openReplace = (index) => {
    setReplacingIndex(prev => prev === index ? null : index);
    setCustomPrompt('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Review & Edit Scenes</h2>
        <p className="text-sm text-muted-foreground">
          Drag to reorder · tap the refresh icon to replace any visual
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-primary" />
          {orderedScenes.length} scenes
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" />
          ~{Math.round(totalDuration)}s total
        </span>
      </div>

      {/* Drag-and-drop list */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="scenes">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2"
            >
              {orderedScenes.map((scene, index) => (
                <Draggable key={`scene-${scene.order ?? index}-${index}`} draggableId={`scene-${index}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        'glass-card rounded-xl overflow-hidden transition-all select-none',
                        snapshot.isDragging && 'ring-2 ring-primary/40 bg-primary/5 shadow-2xl scale-[1.02]'
                      )}
                    >
                      {/* Main row */}
                      <div className="flex items-center gap-3 p-3">
                        {/* Drag handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-secondary/60 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                        </div>

                        {/* Scene number */}
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary">{index + 1}</span>
                        </div>

                        {/* Thumbnail */}
                        <div className="relative shrink-0 group">
                          {scene.image_url ? (
                            <img
                              src={scene.image_url}
                              alt=""
                              className="w-10 h-14 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-secondary/60 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground/30" />
                            </div>
                          )}
                          {loadingIndex === index && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Text */}
                        <p className="flex-1 text-xs text-muted-foreground line-clamp-3 leading-relaxed min-w-0">
                          {scene.text}
                        </p>

                        {/* Right side */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-[10px] text-muted-foreground/50">{Math.round(scene.duration || 5)}s</span>
                          {scene.animation && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70 capitalize">
                              {scene.animation.replace(/_/g, ' ')}
                            </span>
                          )}
                          {/* Replace button */}
                          <button
                            onClick={() => openReplace(index)}
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                              replacingIndex === index
                                ? 'bg-primary/20 text-primary'
                                : 'bg-secondary/60 text-muted-foreground hover:bg-primary/20 hover:text-primary'
                            )}
                            title="Replace visual"
                          >
                            {replacingIndex === index
                              ? <X className="w-3 h-3" />
                              : <RefreshCw className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Replace panel */}
                      {replacingIndex === index && (
                        <div className="px-3 pb-3 space-y-2 border-t border-border/40 pt-2">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Replace Visual</p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Describe a new visual, or leave blank to regenerate..."
                              value={customPrompt}
                              onChange={e => setCustomPrompt(e.target.value)}
                              className="flex-1 h-8 text-xs bg-secondary/50 border-border rounded-lg"
                              onKeyDown={e => e.key === 'Enter' && handleReplace(index, customPrompt || undefined)}
                            />
                            <Button
                              onClick={() => handleReplace(index, customPrompt || undefined)}
                              disabled={loadingIndex === index}
                              size="sm"
                              className="h-8 px-3 text-xs gap-1.5"
                            >
                              {loadingIndex === index
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Check className="w-3 h-3" />}
                              {loadingIndex === index ? 'Generating...' : 'Replace'}
                            </Button>
                          </div>
                          <p className="text-[9px] text-muted-foreground/50">
                            Uses your current video provider ({projectData.video_provider || 'image fallback'})
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        onClick={() => onConfirm(orderedScenes)}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-base gap-2 neon-glow"
      >
        Confirm & Render
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
