import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ResultsPanel({ projectData, projectId }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your Cinematic Story is Ready!</h2>
        <p className="text-muted-foreground text-sm">Watch as your characters come to life in an epic adventure</p>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        {/* Video preview */}
        <div className="relative w-full bg-black rounded-3xl overflow-hidden" style={{ aspectRatio: '9/16', maxHeight: '500px' }}>
          {projectData.final_video_url ? (
            <video
              src={projectData.final_video_url}
              controls
              className="w-full h-full object-cover"
              autoPlay
              muted
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-primary/20 to-primary/5">
              <div className="text-center space-y-3">
                <div className="text-5xl">🎬</div>
                <p className="text-muted-foreground text-sm">Video processing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Story details */}
        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Your Story</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{projectData.generated_story}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Duration</p>
              <p className="font-semibold">{projectData.video_duration}s</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Characters</p>
              <p className="font-semibold">{projectData.character_count} person{projectData.character_count !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Type</p>
              <p className="font-semibold capitalize">{projectData.story_type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Scenes</p>
              <p className="font-semibold">{projectData.scenes?.length || 0}</p>
            </div>
          </div>

          {projectData.voiceover_script && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Voiceover</p>
              <p className="text-sm text-muted-foreground italic">"{projectData.voiceover_script.slice(0, 150)}..."</p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-6 border-t border-border">
            <Button variant="outline" className="rounded-xl border-border gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Link to="/" className="block">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold neon-glow gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}