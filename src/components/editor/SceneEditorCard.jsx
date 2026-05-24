import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, Trash2, RefreshCw, Loader2, Clock, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function SceneEditorCard({ scene, index, onUpdate, onDelete, isDragging, visualStyle }) {
  const [regenerating, setRegenerating] = useState(false);

  const regenerateImage = async () => {
    setRegenerating(true);
    const imageResult = await base44.integrations.Core.GenerateImage({
      prompt: `${scene.visual_prompt || scene.text}, ${visualStyle || 'cinematic'} style, vertical 9:16 aspect ratio, no text, no watermarks, photorealistic, high quality`,
    });
    onUpdate({ image_url: imageResult.url });
    setRegenerating(false);
    toast.success('Scene image regenerated!');
  };

  return (
    <div className={`glass-card rounded-xl p-4 flex gap-3 group transition-all duration-200 ${isDragging ? 'neon-glow ring-1 ring-primary/40 scale-[1.01]' : ''}`}>
      {/* Drag + index */}
      <div className="flex flex-col items-center gap-2 pt-1">
        <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary">{index + 1}</span>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-secondary/50 shrink-0 group/img">
        {scene.image_url ? (
          <img src={scene.image_url} alt={`Scene ${index + 1}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-muted-foreground/30" />
          </div>
        )}
        <button
          onClick={regenerateImage}
          disabled={regenerating}
          className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"
        >
          {regenerating
            ? <Loader2 className="w-4 h-4 text-white animate-spin" />
            : <RefreshCw className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Text editor */}
      <div className="flex-1 space-y-2 min-w-0">
        <Textarea
          value={scene.text || ''}
          onChange={(e) => onUpdate({ text: e.target.value, caption: e.target.value })}
          className="bg-secondary/30 border-border/50 rounded-lg text-xs resize-none min-h-[72px] leading-relaxed"
          placeholder="Scene narration text..."
        />
        <Textarea
          value={scene.visual_prompt || ''}
          onChange={(e) => onUpdate({ visual_prompt: e.target.value })}
          className="bg-secondary/20 border-border/30 rounded-lg text-[10px] resize-none min-h-[40px] text-muted-foreground"
          placeholder="Visual prompt (used for image generation)..."
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <input
              type="number"
              min={1}
              max={30}
              value={scene.duration || 5}
              onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
              className="w-8 bg-transparent text-[10px] text-center focus:outline-none text-foreground"
            />
            <span>s</span>
          </div>
          <span className="text-[10px] text-muted-foreground/50">{scene.animation || 'pan_zoom'}</span>
        </div>
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8 self-start shrink-0"
        onClick={onDelete}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}