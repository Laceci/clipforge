import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StoryGenerationStep({ error, isGenerating }) {
  const steps = [
    { label: 'Analyzing your photos', progress: 15 },
    { label: 'Generating story narrative', progress: 30 },
    { label: 'Creating cinematic scenes', progress: 60 },
    { label: 'Integrating your characters', progress: 80 },
    { label: 'Adding voiceover & music', progress: 95 },
    { label: 'Finalizing video', progress: 100 },
  ];

  return (
    <div className="space-y-8">
      {error ? (
        <div className="glass-card rounded-2xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Generation Failed</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-10 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">Creating Your Cinematic Story</h3>
            <p className="text-muted-foreground text-sm">This may take a few minutes...</p>
          </div>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{step.label}</span>
                  <span className="text-muted-foreground">{step.progress}%</span>
                </div>
                <div className="h-2 bg-secondary/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700"
                    style={{
                      width: isGenerating ? `${step.progress}%` : '0%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="flex justify-center gap-1 items-center h-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary/40"
                  style={{
                    animation: 'pulse 1s infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">Processing your cinematic story...</p>
          </div>
        </div>
      )}
    </div>
  );
}