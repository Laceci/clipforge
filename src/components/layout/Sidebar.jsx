import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, FileText, Layers, Send, Sparkles, Zap, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Plus, label: 'New Video', path: '/create' },
  { icon: FileText, label: 'Scripts', path: '/scripts' },
  { icon: Layers, label: 'Templates', path: '/templates' },
  { icon: Send, label: 'Publish', path: '/publish' },
  { icon: BarChart2, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center neon-glow">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xl font-bold tracking-tight">
          <span className="text-primary neon-text">Clip</span>
          <span className="text-foreground">Forge</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary neon-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 mx-3 mb-4 rounded-xl glass-card">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Unlimited Plan</span>
        </div>
        <p className="text-xs text-muted-foreground">Create unlimited videos with no restrictions.</p>
      </div>
    </aside>
  );
}