import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { GripVertical, ArrowRight, ImageIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VISUAL_EFFECTS } from '@/lib/aiEnhancements';

export default function SceneReorderStep({ scenes = [], projectData = {}, onConfirm }) {
  const [orderedScenes, setOrderedScenes] = useState(scenes);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedScenes);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setOrderedScenes(items.map((s, i) => ({ ...s, order: i })));
  };

  const totalDuration = orderedScenes.reduce((sum, s) => sum + (s.duration || 5), 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Review Scene Order</h2>
        <p className="text-sm text-muted-foreground">
          Drag scenes to reorder your narrative before the final render
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
                        'glass-card rounded-xl p-3 flex items-center gap-3 transition-all select-none',
                        snapshot.isDragging && 'ring-2 ring-primary/40 bg-primary/5 shadow-2xl scale-[1.02]'
                      )}
                    >
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
                      {scene.image_url ? (
                        <img
                          src={scene.image_url}
                          alt=""
                          className="w-10 h-14 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-secondary/60 rounded-lg shrink-0 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Text */}
                      <p className="flex-1 text-xs text-muted-foreground line-clamp-3 leading-relaxed min-w-0">
                        {scene.text}
                      </p>

                      {/* Meta badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-muted-foreground/50">{Math.round(scene.duration || 5)}s</span>
                        {scene.animation && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70 capitalize">
                            {scene.animation.replace(/_/g, ' ')}
                          </span>
                        )}
                        {scene.visual_effect && scene.visual_effect !== 'none' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary/80 text-muted-foreground capitalize">
                            {VISUAL_EFFECTS[scene.visual_effect]?.label || scene.visual_effect}
                          </span>
                        )}
                      </div>
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
        Confirm Order & Render
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
}