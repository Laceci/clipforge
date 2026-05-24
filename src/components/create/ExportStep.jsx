import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Play, Check, Monitor, Share2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function ExportStep({ data, onChange, onExport, projectId }) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    onChange({ status: 'exported' });
    setExported(true);
    setExporting(false);
    onExport();
  };

  const totalDuration = data.scenes?.reduce((sum, s) => sum + (s.duration || 5), 0) || data.duration || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-1">Preview & Export</h2>
        <p className="text-muted-foreground text-sm">Review your video and export or publish it</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preview panel */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="aspect-[9/16] bg-black relative">
            {data.scenes?.[0]?.image_url ? (
              <img src={data.scenes[0].image_url} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-xs font-bold line-clamp-3 leading-relaxed" style={{ color: data.caption_color || '#ffffff' }}>
                {data.scenes?.[0]?.text?.substring(0, 120) || '...'}
              </p>
            </div>
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
              <span className="text-white text-xs font-medium">{totalDuration}s</span>
            </div>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground text-center">{data.scenes?.length || 0} scenes · {data.resolution || '1080p'} · 9:16</p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Monitor className="w-4 h-4 text-primary" />
              Export Settings
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Resolution</label>
              <Select value={data.resolution || '1080p'} onValueChange={(v) => onChange({ resolution: v })}>
                <SelectTrigger className="bg-secondary/50 border-border rounded-xl h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 text-xs">
              {[
                ['Format', '9:16 Vertical'],
                ['Scenes', data.scenes?.length || 0],
                ['Duration', `~${totalDuration}s`],
                ['Voice', data.voice_style || '—'],
                ['Music', data.music_track || '—'],
                ['Watermark', 'None'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-muted-foreground">
                  <span>{k}</span><span className="text-foreground font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Share2 className="w-4 h-4 text-primary" />
              After Export
            </h3>
            <Link to="/publish">
              <Button variant="outline" size="sm" className="w-full rounded-xl text-xs gap-2 border-border">
                <ExternalLink className="w-3.5 h-3.5" />
                Schedule & Publish
              </Button>
            </Link>
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting}
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 font-bold neon-glow"
          >
            {exported ? (
              <><Check className="w-5 h-5" /> Exported!</>
            ) : exporting ? (
              <><Download className="w-5 h-5 animate-bounce" /> Saving...</>
            ) : (
              <><Download className="w-5 h-5" /> Export Video</>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}