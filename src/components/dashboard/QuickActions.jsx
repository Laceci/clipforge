import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, BookOpen, Brain, Ghost, DollarSign, Dumbbell, Sparkles, RefreshCw, Send, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { icon: Flame,    label: 'Motivation',    category: 'motivation',    color: 'from-orange-500/15 to-red-500/10',    border: 'hover:border-orange-500/40',  iconColor: 'text-orange-400' },
  { icon: BookOpen, label: 'Storytelling',  category: 'storytelling',  color: 'from-blue-500/15 to-purple-500/10',   border: 'hover:border-blue-500/40',    iconColor: 'text-blue-400' },
  { icon: Brain,    label: 'Fun Facts',     category: 'facts',         color: 'from-cyan-500/15 to-blue-500/10',     border: 'hover:border-cyan-500/40',    iconColor: 'text-cyan-400' },
  { icon: Ghost,    label: 'Horror',        category: 'horror',        color: 'from-slate-500/15 to-gray-500/10',    border: 'hover:border-slate-500/40',   iconColor: 'text-slate-400' },
  { icon: DollarSign, label: 'Finance',     category: 'finance',       color: 'from-emerald-500/15 to-green-500/10', border: 'hover:border-emerald-500/40', iconColor: 'text-emerald-400' },
  { icon: Dumbbell, label: 'Fitness',       category: 'fitness',       color: 'from-pink-500/15 to-rose-500/10',     border: 'hover:border-pink-500/40',    iconColor: 'text-pink-400' },
];

const actions = [
  { icon: Sparkles,      label: 'New from Template', to: '/templates',            color: 'text-primary',     bg: 'bg-primary/10',      border: 'hover:border-primary/40' },
  { icon: RefreshCw,     label: 'Retry Failed Jobs', to: '/?filter=failed',       color: 'text-destructive', bg: 'bg-destructive/10',  border: 'hover:border-destructive/40' },
  { icon: Send,          label: 'Publish Queue',     to: '/publish',              color: 'text-violet-400',  bg: 'bg-violet-400/10',   border: 'hover:border-violet-400/40' },
  { icon: LayoutTemplate, label: 'Script Library',  to: '/scripts',              color: 'text-blue-400',    bg: 'bg-blue-400/10',     border: 'hover:border-blue-400/40' },
];

export default function QuickActions({ failedCount }) {
  return (
    <div className="space-y-4">
      {/* Category quick start */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Quick Start by Category</h2>
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
        {categories.map((t, i) => (
          <motion.div
            key={t.category}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              to={`/create?category=${t.category}`}
              className={cn(
                'glass-card rounded-xl p-3 md:p-4 flex flex-col items-center gap-1.5 group',
                'transition-all duration-200 border border-transparent hover:-translate-y-0.5',
                `bg-gradient-to-br ${t.color}`, t.border
              )}
            >
              <t.icon className={cn('w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110', t.iconColor)} />
              <span className="text-[10px] md:text-xs font-semibold text-center leading-tight">{t.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Action shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {actions.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
          >
            <Link
              to={a.to}
              className={cn(
                'flex items-center gap-2.5 p-3 rounded-xl glass-card border border-transparent',
                'transition-all duration-200 hover:-translate-y-0.5 group',
                a.border
              )}
            >
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', a.bg)}>
                <a.icon className={cn('w-3.5 h-3.5', a.color)} />
              </div>
              <span className="text-xs font-medium leading-tight">{a.label}</span>
              {a.label === 'Retry Failed Jobs' && failedCount > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">{failedCount}</span>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}