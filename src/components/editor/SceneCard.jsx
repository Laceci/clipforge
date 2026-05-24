import React from 'react';
import { GripVertical, Trash2, Image, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function SceneCard({ scene, index, onUpdate, onDelete, isDragging }) {
  return (
    <div className={`glass-card rounded-xl p-4 flex gap-4 group transition-all duration-200 ${isDragging ? 'neon-glow ring-1 ring-primary/30' : ''}`}>
      <div className="flex flex-col items-center gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab" />
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{index + 1}</span>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="w-20 h-28 rounded-lg overflow-hidden bg-secondary/50 shrink-0">
        {scene.image_url ? (
          <img src={scene.image_url} alt={`Scene ${index + 1}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-5 h-5 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <Textarea
          value={scene.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="bg-secondary/30 border-border/50 rounded-lg text-sm resize-none min-h-[80px]"
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {scene.duration || 5}s
          </div>
          <span className="text-xs text-muted-foreground/50">
            {scene.animation || 'pan_zoom'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8"
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}