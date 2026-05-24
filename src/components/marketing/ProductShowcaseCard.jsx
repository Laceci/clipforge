import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function ProductShowcaseCard({
  title,
  description,
  image,
  icon: Icon,
  cta = 'Upgrade Now',
  ctaLink = '/pricing',
  variant = 'default',
  imagePosition = 'right',
  className = ''
}) {
  const isLeftImage = imagePosition === 'left';

  return (
    <div className={cn(
      'glass-card rounded-3xl overflow-hidden border',
      variant === 'default' ? 'border-border' : 'border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5',
      className
    )}>
      <div className={cn(
        'grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8 md:p-12',
        isLeftImage && 'md:grid-cols-2'
      )}>
        {/* Image section */}
        {image && (
          <div className={cn('flex items-center justify-center', isLeftImage && 'md:order-first')}>
            {typeof image === 'string' ? (
              <img
                src={image}
                alt={title}
                className="w-full max-w-sm h-auto rounded-2xl object-cover shadow-2xl"
              />
            ) : (
              <div className="w-full max-w-sm h-80 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center text-6xl">
                {image}
              </div>
            )}
          </div>
        )}

        {/* Content section */}
        <div className="space-y-4">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <h3 className="text-2xl md:text-3xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground text-base leading-relaxed">{description}</p>
          </div>
          <Link to={ctaLink} className="inline-block pt-2">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold gap-2 neon-glow">
              {cta}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}