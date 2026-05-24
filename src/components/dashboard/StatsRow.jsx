import React, { useEffect, useRef, useState } from 'react';
import { Film, TrendingUp, Download, AlertCircle, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    const duration = 600;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prevRef.current = end;
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <span>{display}</span>;
}

export default function StatsRow({ projects, onFilter, activeFilter }) {
  const total = projects.length;
  const processing = projects.filter(p => p.status === 'generating' || p.status === 'rendering').length;
  const rendered = projects.filter(p => ['ready', 'exported'].includes(p.status)).length;
  const exported = projects.filter(p => p.status === 'exported').length;
  const failed = projects.filter(p => p.status === 'failed').length;
  const thisWeek = projects.filter(p => {
    const created = new Date(p.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  }).length;

  const stats = [
    { id: 'all',        label: 'Total Projects', value: total,      icon: Film,         color: 'text-primary',      bg: 'bg-primary/10',      border: 'border-primary/20',      glow: 'hover:shadow-primary/20' },
    { id: 'processing', label: 'Processing',      value: processing, icon: Clock,        color: 'text-amber-400',    bg: 'bg-amber-400/10',    border: 'border-amber-400/20',    glow: 'hover:shadow-amber-400/20' },
    { id: 'rendered',   label: 'Rendered',         value: rendered,   icon: CheckCircle2, color: 'text-emerald-400',  bg: 'bg-emerald-400/10',  border: 'border-emerald-400/20',  glow: 'hover:shadow-emerald-400/20' },
    { id: 'exported',   label: 'Exported',         value: exported,   icon: Download,     color: 'text-blue-400',     bg: 'bg-blue-400/10',     border: 'border-blue-400/20',     glow: 'hover:shadow-blue-400/20' },
    { id: 'failed',     label: 'Failed',           value: failed,     icon: AlertCircle,  color: 'text-destructive',  bg: 'bg-destructive/10',  border: 'border-destructive/20',  glow: 'hover:shadow-destructive/20' },
    { id: 'week',       label: 'This Week',        value: thisWeek,   icon: Calendar,     color: 'text-violet-400',   bg: 'bg-violet-400/10',   border: 'border-violet-400/20',   glow: 'hover:shadow-violet-400/20' },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
      {stats.map((stat, i) => {
        const isActive = activeFilter === stat.id;
        return (
          <motion.button
            key={stat.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onFilter(stat.id)}
            className={cn(
              'glass-card rounded-2xl p-3 md:p-4 text-left w-full cursor-pointer transition-all duration-200 border',
              'hover:shadow-lg hover:-translate-y-0.5 active:scale-95',
              stat.glow,
              isActive ? `${stat.bg} ${stat.border} ring-1 ring-inset` : 'border-transparent'
            )}
          >
            <div className={cn('w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center mb-2 md:mb-3', stat.bg)}>
              <stat.icon className={cn('w-3.5 h-3.5 md:w-4 md:h-4', stat.color)} />
            </div>
            <p className={cn('text-xl md:text-2xl font-bold', stat.color)}>
              <AnimatedNumber value={stat.value} />
            </p>
            <p className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5 leading-tight font-medium">{stat.label}</p>
            {isActive && (
              <div className={cn('w-full h-0.5 rounded-full mt-2', stat.bg.replace('/10', '/60'))} />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}