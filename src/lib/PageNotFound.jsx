import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 neon-glow">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-6xl font-black text-primary neon-text mb-4">404</h1>
        <p className="text-lg font-medium mb-2">Page not found</p>
        <p className="text-sm text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 neon-glow">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}