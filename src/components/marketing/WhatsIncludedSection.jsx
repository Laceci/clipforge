import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const INCLUDED_ITEMS = [
  'Training & Tutorials',
  'AI Script Generator',
  'Realistic Narrator Voices',
  'Cinematic Video Styles',
  'Manual Editing Tools',
  'Auto Captions',
  'Render Engine',
  'YouTube Publishing',
  'TikTok Publishing',
  'Instagram Reels Support',
  'Facebook Reels Support',
  'Monthly Video Exports',
  'Scheduling System',
  'Analytics Dashboard',
  'Brand Customization',
  'Multiple Projects',
];

export default function WhatsIncludedSection() {
  return (
    <div className="mb-12">
      <div className="text-center space-y-3 mb-10">
        <h2 className="text-3xl md:text-4xl font-bold">What's Included in ClipForge</h2>
        <p className="text-muted-foreground text-lg">Everything you need to become a video production powerhouse</p>
      </div>

      <div className="glass-card rounded-3xl p-10 border border-primary/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INCLUDED_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span className="text-base">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}