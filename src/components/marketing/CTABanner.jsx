import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function CTABanner({ 
  title = 'Ready to Scale Your Video Content?',
  subtitle = 'Join thousands of creators using ClipForge to automate video production',
  cta = 'Start Creating Now',
  secondary = false,
  className = ''
}) {
  return (
    <div className={cn(
      'rounded-3xl p-12 text-center space-y-6 border',
      secondary 
        ? 'glass-card border-border' 
        : 'glass-card border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5'
    )}>
      <div className="space-y-2">
        <h3 className="text-2xl md:text-3xl font-bold">{title}</h3>
        <p className="text-muted-foreground text-lg">{subtitle}</p>
      </div>
      
      <Link to="/create" className="inline-block">
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-3 px-8 font-bold text-base neon-glow gap-2">
          {cta}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}