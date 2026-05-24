import React from 'react';
import { Bell, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TopBar() {
  return (
    <header className="h-14 md:h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      {/* Logo — only visible on mobile (sidebar hidden) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <span className="text-base font-bold tracking-tight">
          <span className="text-primary">Clip</span>
          <span className="text-foreground">Forge</span>
        </span>
      </div>

      {/* Desktop: empty left spacer */}
      <div className="hidden md:block flex-1" />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground w-8 h-8 md:w-9 md:h-9">
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
        </div>
      </div>
    </header>
  );
}