import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Wand2, Play, Pause, GripVertical } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

export default function TimelineEditor({ scenes, onScenesChange, characterIdentities, projectData }) {
  const [playingSceneIdx, setPlayingSceneIdx] = useState(null);
  const [generatingSceneIdx, setGeneratingSceneIdx] = useState(null);
  const [sceneVariations, setSceneVariations] = useState({});

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const updated = Array.from(scenes);
    const [removed] = updated.splice(source.index, 1);
    updated.splice(destination.index, 0, removed);
    
    // Update scene indices
    const reordered = updated.map((scene, idx) => ({
      ...scene,
      scene_index: idx,
    }));

    onScenesChange(reordered);
    toast.success('Scenes reordered');
  };

  const handleDurationChange = (idx, newDuration) => {
    const updated = [...scenes];
    updated[idx] = { ...updated[idx], duration: Math.max(1, newDuration) };
    onScenesChange(updated);
  };

  const handleDeleteScene = (idx) => {
    if (scenes.length <= 1) {
      toast.error('Cannot delete the last scene');
      return;
    }
    const updated = scenes.filter((_, i) => i !== idx);
    onScenesChange(updated);
    toast.success('Scene removed');
  };

  const handleGenerateVariation = async (idx) => {
    const scene = scenes[idx];
    setGeneratingSceneIdx(idx);

    try {
      // Prepare character identity data
      const charactersData = Object.entries(characterIdentities || {})
        .map(([label, profile]) => `${label}: ${profile}`)
        .join('\n\n');

      // Call backend to regenerate this specific scene
      const result = await base44.functions.invoke('generateSceneVariation', {
        scene_index: idx,
        scene_description: scene.description,
        environment: scene.environment,
        characters: scene.characters || [],
        character_identities: charactersData,
        action: scene.action,
        camera_angle: scene.camera_angle,
        consistency_notes: scene.consistency_notes,
        story_type: projectData?.story_type,
        story_tone: projectData?.story_tone,
      });

      // Update the specific scene with new video URL
      const updated = [...scenes];
      updated[idx] = {
        ...updated[idx],
        video_url: result.data?.video_url || result.video_url,
        variation_count: (updated[idx].variation_count || 0) + 1,
      };
      onScenesChange(updated);
      toast.success(`Scene ${idx + 1} regenerated with new variation`);
    } catch (err) {
      toast.error('Variation generation failed: ' + err.message);
    } finally {
      setGeneratingSceneIdx(null);
    }
  };

  const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 5), 0);

  return (
    <div className="glass-card rounded-2xl p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="font-bold text-lg">Timeline Editor</h3>
        <p className="text-xs text-muted-foreground">
          Reorder scenes, adjust duration, and generate variations
        </p>
      </div>

      {/* Timeline Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-secondary/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total Duration</p>
          <p className="text-xl font-bold">{totalDuration}s</p>
        </div>
        <div className="bg-secondary/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Scene Count</p>
          <p className="text-xl font-bold">{scenes.length}</p>
        </div>
        <div className="bg-secondary/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Avg Duration</p>
          <p className="text-xl font-bold">{Math.round(totalDuration / scenes.length)}s</p>
        </div>
      </div>

      {/* Draggable Timeline */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="scenes-timeline">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'space-y-3 rounded-xl p-4 transition-all',
                snapshot.isDraggingOver ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/20'
              )}
            >
              {scenes.map((scene, idx) => (
                <Draggable key={`scene-${idx}`} draggableId={`scene-${idx}`} index={idx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        'bg-card rounded-xl border transition-all p-4 space-y-3',
                        snapshot.isDragging ? 'border-primary/40 shadow-lg shadow-primary/20' : 'border-border'
                      )}
                    >
                      {/* Scene Header */}
                      <div className="flex items-start gap-3">
                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing mt-1">
                          <GripVertical className="w-5 h-5 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div>
                              <p className="font-semibold text-sm">Scene {idx + 1}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {scene.environment} • {scene.characters?.join(', ')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary">{scene.duration || 5}s</p>
                              <p className="text-[10px] text-muted-foreground">duration</p>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground mb-3">{scene.description}</p>

                          {/* Duration Slider */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Duration</span>
                              <span className="font-semibold">{scene.duration || 5}s</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="15"
                              value={scene.duration || 5}
                              onChange={(e) => handleDurationChange(idx, parseInt(e.target.value))}
                              className="w-full h-1.5 rounded-full bg-secondary/40 cursor-pointer"
                              style={{
                                backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((scene.duration || 5) / 15) * 100}%, hsl(var(--secondary)) ${((scene.duration || 5) / 15) * 100}%, hsl(var(--secondary)) 100%)`,
                              }}
                            />
                          </div>

                          {/* Video Preview */}
                          {scene.video_url && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex-1 h-12 rounded-lg bg-black/20 flex items-center justify-center relative overflow-hidden">
                                <video
                                  src={scene.video_url}
                                  className="w-full h-full object-cover"
                                  style={{ display: 'none' }}
                                />
                                <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                                  <span className="text-xs text-muted-foreground">Video clip</span>
                                </div>
                              </div>
                              <button
                                onClick={() => setPlayingSceneIdx(playingSceneIdx === idx ? null : idx)}
                                className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all"
                              >
                                {playingSceneIdx === idx ? (
                                  <Pause className="w-4 h-4 text-primary" />
                                ) : (
                                  <Play className="w-4 h-4 text-primary" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          onClick={() => handleGenerateVariation(idx)}
                          disabled={generatingSceneIdx === idx}
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5 border-primary/30 text-primary text-xs h-8"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          {generatingSceneIdx === idx ? 'Generating...' : 'New Variation'}
                        </Button>
                        <Button
                          onClick={() => handleDeleteScene(idx)}
                          disabled={scenes.length === 1}
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-destructive/30 text-destructive text-xs h-8"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {scene.variation_count ? (
                        <p className="text-[10px] text-muted-foreground text-center pt-1">
                          {scene.variation_count} variation{scene.variation_count > 1 ? 's' : ''} generated
                        </p>
                      ) : null}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Info Box */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground">💡 Timeline Tips</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Drag scenes to reorder them</li>
          <li>Adjust duration slider to make scenes longer or shorter</li>
          <li>Click "New Variation" to regenerate a clip while keeping others intact</li>
          <li>Total duration should match your target video length</li>
        </ul>
      </div>
    </div>
  );
}