import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const VISUAL_STYLES = [
  {
    id: 'realistic',
    label: 'Realistic',
    description: 'Real human-looking scenes',
    prompt: 'photorealistic, ultra-detailed, cinematic lighting, real people, 8k quality',
    thumb: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
  },
  {
    id: '3d',
    label: '3D',
    description: 'Stylized 3D rendered visuals',
    prompt: '3D render, octane render, hyper-realistic 3D, studio lighting, ultra detailed',
    thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80',
  },
  {
    id: 'anime',
    label: 'Anime',
    description: 'Japanese animation style',
    prompt: 'anime style, studio ghibli, detailed anime illustration, vibrant colors',
    thumb: 'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=300&q=80',
  },
  {
    id: 'pov',
    label: 'POV',
    description: 'First-person perspective shots',
    prompt: 'first person POV, gopro style, immersive perspective, action camera',
    thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80',
  },
  {
    id: 'scary_comic',
    label: 'Scary Comic',
    description: 'Dark comic book aesthetic',
    prompt: 'dark comic book art, horror illustration, graphic novel style, dramatic ink',
    thumb: 'https://images.unsplash.com/photo-1535448033526-c0e85c9e6968?w=300&q=80',
  },
  {
    id: 'true_crime',
    label: 'True Crime',
    description: 'Gritty documentary look',
    prompt: 'gritty documentary photography, noir aesthetic, high contrast, moody shadows',
    thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80',
  },
  {
    id: 'documentary',
    label: 'Documentary',
    description: 'Cinematic doc-style footage',
    prompt: 'documentary style photography, naturalistic lighting, raw cinematic look',
    thumb: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=80',
  },
  {
    id: 'horror',
    label: 'Horror',
    description: 'Dark, unsettling imagery',
    prompt: 'horror aesthetic, dark atmosphere, eerie lighting, ominous shadows, unsettling',
    thumb: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=300&q=80',
  },
];

export function getVisualStylePromptSuffix(styleId) {
  const style = VISUAL_STYLES.find(s => s.id === styleId);
  return style?.prompt || VISUAL_STYLES[0].prompt;
}

export default function VisualStylePicker({ value, onChange }) {
  const selected = value || 'realistic';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {VISUAL_STYLES.map(style => {
        const isSelected = selected === style.id;
        return (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            className={cn(
              'relative rounded-xl overflow-hidden border-2 transition-all group text-left',
              isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-primary/30'
            )}
          >
            {/* Thumbnail */}
            <div className="aspect-[9/14] relative overflow-hidden bg-secondary/50">
              <img
                src={style.thumb}
                alt={style.label}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className={cn(
                'absolute inset-0 transition-opacity',
                isSelected ? 'bg-primary/20' : 'bg-black/20'
              )} />
            </div>

            {/* Label */}
            <div className={cn(
              'absolute bottom-0 left-0 right-0 px-2 py-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent',
            )}>
              <p className="text-white text-xs font-bold leading-tight">{style.label}</p>
              <p className="text-white/60 text-[9px] leading-tight mt-0.5 hidden sm:block">{style.description}</p>
            </div>

            {/* Selected checkmark */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}