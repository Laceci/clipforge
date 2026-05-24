import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',         icon: '🎵' },
  { id: 'instagram', label: 'Instagram',      icon: '📸' },
  { id: 'youtube',   label: 'YouTube Shorts', icon: '▶️' },
  { id: 'facebook',  label: 'Facebook Reels', icon: '📘' },
];

export default function PublishSettingsPanel({ projectData, onChange }) {
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(projectData.auto_publish_enabled || false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(projectData.auto_publish_platforms || []);
  const [caption, setCaption] = useState(projectData.auto_publish_caption || '');
  const [hashtags, setHashtags] = useState(projectData.auto_publish_hashtags || '');

  const handleTogglePlatform = (platform) => {
    const updated = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter(p => p !== platform)
      : [...selectedPlatforms, platform];
    setSelectedPlatforms(updated);
  };

  const handleSave = () => {
    onChange({
      auto_publish_enabled: autoPublishEnabled,
      auto_publish_platforms: selectedPlatforms,
      auto_publish_caption: caption,
      auto_publish_hashtags: hashtags,
    });
  };

  const hasChanges =
    autoPublishEnabled !== (projectData.auto_publish_enabled || false) ||
    JSON.stringify(selectedPlatforms) !== JSON.stringify(projectData.auto_publish_platforms || []) ||
    caption !== (projectData.auto_publish_caption || '') ||
    hashtags !== (projectData.auto_publish_hashtags || '');

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 border border-primary/15 space-y-5">
      <div>
        <h3 className="text-sm font-bold mb-2">Auto Publish</h3>
        <p className="text-xs text-muted-foreground mb-4">Automatically publish this video after generation completes</p>

        <div className="flex items-center gap-3">
          <Switch
            checked={autoPublishEnabled}
            onCheckedChange={setAutoPublishEnabled}
          />
          <span className="text-xs font-medium">
            {autoPublishEnabled ? '✓ Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {autoPublishEnabled && (
        <div className="space-y-4 border-t border-border pt-4">
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Publish to platforms</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleTogglePlatform(p.id)}
                  className={cn(
                    'flex items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all',
                    selectedPlatforms.includes(p.id)
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <span>{p.icon}</span>
                  <span className="hidden sm:inline">{p.label}</span>
                  {selectedPlatforms.includes(p.id) && (
                    <Check className="w-3 h-3 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Caption</p>
            <Textarea
              placeholder="Video caption (can be different from script)"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="bg-secondary/40 border-border rounded-lg text-xs h-20"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Hashtags</p>
            <Input
              placeholder="#hashtag #viral #content"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              className="bg-secondary/40 border-border rounded-lg text-xs"
            />
          </div>

          {hasChanges && (
            <Button
              onClick={handleSave}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-bold h-8"
            >
              Save Auto Publish Settings
            </Button>
          )}
        </div>
      )}
    </div>
  );
}