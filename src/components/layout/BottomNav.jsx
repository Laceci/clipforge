import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, Send, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: Plus, label: 'Create', path: '/create' },
  { icon: Send, label: 'Publish', path: '/publish' },
  { icon: BarChart2, label: 'Stats', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-0',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(163,230,53,0.6)]')} />
              <span className={cn('text-[10px] font-semibold', isActive ? 'text-primary' : 'text-muted-foreground')}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-full -translate-y-px" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}