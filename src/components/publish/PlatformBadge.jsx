import React from 'react';
import { cn } from '@/lib/utils';

const config = {
  tiktok: { label: 'TikTok', color: 'bg-black text-white', dot: 'bg-white' },
  instagram: { label: 'Instagram', color: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white', dot: 'bg-white' },
  youtube: { label: 'YouTube Shorts', color: 'bg-red-600 text-white', dot: 'bg-white' },
};

export default function PlatformBadge({ platform, size = 'sm' }) {
  const c = config[platform];
  if (!c) return null;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      c.color,
      size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
    )}>
      {c.label}
    </span>
  );
}