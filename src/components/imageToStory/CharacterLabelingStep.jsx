import React from 'react';
import { Input } from '@/components/ui/input';

export default function CharacterLabelingStep({ data, onChange }) {
  const handleLabelChange = (idx, label) => {
    const updated = [...data.uploaded_images];
    updated[idx] = { ...updated[idx], character_label: label };
    onChange({ uploaded_images: updated });
  };

  return (
    <div className="glass-card rounded-2xl p-8 space-y-6">
      <div className="grid gap-6">
        {data.uploaded_images.map((img, idx) => (
          <div key={idx} className="flex gap-4 items-start">
            <img
              src={img.image_url}
              alt={`Character ${idx + 1}`}
              className="w-24 h-32 object-cover rounded-lg shrink-0"
            />
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold">Character {idx + 1}</label>
              <Input
                placeholder="e.g. 'me', 'my friend', 'John', 'mom'"
                value={img.character_label || ''}
                onChange={(e) => handleLabelChange(idx, e.target.value)}
                className="bg-secondary/40 border-border rounded-lg text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This person will appear consistently across all scenes with this name
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground">📝 Character Labels</p>
        <p>Use simple, memorable names. The AI will maintain their facial features and appearance throughout the video.</p>
      </div>
    </div>
  );
}