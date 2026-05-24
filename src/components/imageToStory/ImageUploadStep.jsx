import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ImageUploadStep({ data, onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalImages = data.uploaded_images.length + files.length;
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploading(true);
    try {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const result = await base44.integrations.Core.UploadFile({ file });
          
          // Generate face embedding for identity consistency
          const embeddingResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this photo and describe the person's facial features in detail for consistent character recreation:
- Face shape and structure
- Eye color, shape, and spacing
- Nose shape and size
- Mouth and lips
- Skin tone and complexion
- Hair color, style, and length
- Any distinctive features (scars, freckles, marks)
- Age estimate
- Overall appearance description for cinematic consistency

Be precise and detailed so this person can be recreated identically across multiple scenes.`,
            file_urls: [result.file_url],
            model: 'gpt_5'
          });

          return {
            image_url: result.file_url,
            character_label: '',
            face_embedding: typeof embeddingResult === 'string' ? embeddingResult : embeddingResult.toString(),
          };
        })
      );

      onChange({
        uploaded_images: [...data.uploaded_images, ...uploadedImages],
        character_count: data.uploaded_images.length + uploadedImages.length,
      });
      toast.success(`${uploadedImages.length} photo(s) analyzed and uploaded`);
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx) => {
    const updated = data.uploaded_images.filter((_, i) => i !== idx);
    onChange({
      uploaded_images: updated,
      character_count: updated.length,
    });
  };

  return (
    <div className="glass-card rounded-2xl p-8 space-y-6">
      {/* Upload area */}
      <div
        className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center space-y-3 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Upload className="w-7 h-7 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm mb-0.5">Click to upload or drag and drop</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB (max 5 photos)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* Uploaded images grid */}
      {data.uploaded_images.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Uploaded Images ({data.uploaded_images.length}/5)</p>
          <div className="grid grid-cols-3 gap-4">
            {data.uploaded_images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img.image_url}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-xl"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload more button */}
      {data.uploaded_images.length < 5 && (
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-xl border-primary/30 text-primary gap-2"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Add More Photos'}
        </Button>
      )}

      {/* Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground">💡 Tips for best results:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Use clear, well-lit photos with visible faces</li>
          <li>Different angles and expressions help with consistency</li>
          <li>Include full body shots for action scenes</li>
          <li>Avoid heavy filters or extreme close-ups</li>
        </ul>
      </div>
    </div>
  );
}