import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, AlertCircle, TrendingDown, Calendar as CalendarIcon,
  Clock, Zap, Plus, GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Analyze gaps in posting schedule
 */
function analyzePostingGaps(posts) {
  const scheduled = posts
    .filter(p => p.status === 'scheduled' && p.scheduled_at)
    .map(p => new Date(p.scheduled_at))
    .sort((a, b) => a - b);

  if (scheduled.length < 2) return [];

  const gaps = [];
  for (let i = 0; i < scheduled.length - 1; i++) {
    const current = scheduled[i];
    const next = scheduled[i + 1];
    const daysDiff = Math.floor((next - current) / (1000 * 60 * 60 * 24));

    if (daysDiff > 2) {
      gaps.push({
        from: current,
        to: next,
        days: daysDiff,
        severity: daysDiff > 7 ? 'high' : 'medium',
      });
    }
  }

  return gaps;
}

/**
 * Get posts for a specific day
 */
function getPostsForDay(posts, day) {
  return posts.filter(p => {
    if (p.status !== 'scheduled' || !p.scheduled_at) return false;
    return isSameDay(new Date(p.scheduled_at), day);
  });
}

/**
 * Calendar day cell
 */
function CalendarDay({ day, posts, isPrevMonth, isToday, onDragEnd }) {
  const dayPosts = getPostsForDay(posts, day);

  return (
    <div
      className={cn(
        'min-h-24 p-2 rounded-lg border transition-all',
        isPrevMonth ? 'bg-secondary/20 border-border/50' : 'bg-secondary/40 border-border hover:border-primary/30',
        isToday && 'ring-1 ring-primary/50 bg-primary/5'
      )}
    >
      {/* Day number */}
      <div className={cn('text-xs font-bold mb-1.5', isToday ? 'text-primary' : 'text-muted-foreground')}>
        {format(day, 'd')}
      </div>

      {/* Posts for this day */}
      <Droppable droppableId={format(day, 'yyyy-MM-dd')} type="POST">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'space-y-1 min-h-16',
              snapshot.isDraggingOver && 'bg-primary/10 rounded'
            )}
          >
            {dayPosts.map((post, idx) => (
              <Draggable key={post.id} draggableId={post.id} index={idx}>
                {(provided, snapshot) => (
                  <motion.div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      'flex items-center gap-1.5 p-1.5 rounded-md text-[10px] font-medium cursor-grab active:cursor-grabbing',
                      'bg-primary/20 text-primary border border-primary/30 transition-all',
                      snapshot.isDragging && 'shadow-lg ring-1 ring-primary scale-105'
                    )}
                  >
                    <div {...provided.dragHandleProps}>
                      <GripVertical className="w-2.5 h-2.5" />
                    </div>
                    <div className="flex-1 min-w-0 truncate">
                      {post.project_title ? post.project_title.slice(0, 12) : 'Untitled'}
                    </div>
                  </motion.div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function PublishCalendar({ posts, onReschedule }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month or gaps

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days from previous month
  const startDate = monthStart;
  while (startDate.getDay() !== 0) {
    startDate.setDate(startDate.getDate() - 1);
  }

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: monthEnd,
  });

  // Ensure we have 6 weeks
  while (calendarDays.length < 42) {
    calendarDays.push(new Date(calendarDays[calendarDays.length - 1].getTime() + 86400000));
  }

  const gaps = useMemo(() => analyzePostingGaps(posts), [posts]);
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const totalPosted = posts.filter(p => p.status === 'published').length;

  const handleDragEnd = (result) => {
    const { draggableId, destination } = result;

    if (!destination) return;

    const post = posts.find(p => p.id === draggableId);
    if (!post) return;

    const newDate = new Date(destination.droppableId);
    const currentTime = new Date(post.scheduled_at);
    newDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);

    onReschedule(post.id, newDate);
  };

  const stats = [
    { icon: Zap,      label: 'Scheduled',  value: scheduledCount,  color: 'text-amber-400' },
    { icon: TrendingDown, label: 'Gaps',   value: gaps.length,     color: gaps.length > 0 ? 'text-destructive' : 'text-emerald-400' },
    { icon: CalendarIcon, label: 'Posted', value: totalPosted,     color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-5">
      {/* Header with stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-3 flex items-center gap-2"
            >
              <Icon className={cn('w-3.5 h-3.5', stat.color)} />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                <p className={cn('text-xs font-bold', stat.color)}>{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Alerts for gaps */}
      {gaps.length > 0 && viewMode === 'month' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20"
        >
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-destructive mb-1">Posting gaps detected</p>
            <p className="text-muted-foreground">
              {gaps.map(g => `${g.days}-day gap`).join(', ')} — fill these to maintain audience engagement
            </p>
          </div>
        </motion.div>
      )}

      {/* View mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('month')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            viewMode === 'month'
              ? 'bg-primary/20 text-primary border border-primary/40'
              : 'bg-secondary/40 text-muted-foreground border border-border hover:border-primary/30'
          )}
        >
          Calendar View
        </button>
        <button
          onClick={() => setViewMode('gaps')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            viewMode === 'gaps'
              ? 'bg-primary/20 text-primary border border-primary/40'
              : 'bg-secondary/40 text-muted-foreground border border-border hover:border-primary/30'
          )}
        >
          Gap Analysis
        </button>
      </div>

      {/* Calendar view */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, -1))}
              className="p-2 hover:bg-secondary/60 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-bold">{format(currentDate, 'MMMM yyyy')}</h2>

            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-secondary/60 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const isPrevMonth = !daysInMonth.some(d => isSameDay(d, day));
                const isToday = isSameDay(day, new Date());

                return (
                  <CalendarDay
                    key={idx}
                    day={day}
                    posts={posts}
                    isPrevMonth={isPrevMonth}
                    isToday={isToday}
                    onDragEnd={handleDragEnd}
                  />
                );
              })}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* Gap analysis view */}
      {viewMode === 'gaps' && (
        <div className="space-y-3">
          {gaps.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold mb-1">Perfect schedule!</p>
              <p className="text-xs text-muted-foreground">Your posting frequency is consistent</p>
            </div>
          ) : (
            gaps.map((gap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'glass-card rounded-xl p-4 border',
                  gap.severity === 'high' ? 'border-destructive/30 bg-destructive/5' : 'border-amber-500/30 bg-amber-500/5'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold">{gap.days}-day gap</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(gap.from, 'MMM d')} → {format(gap.to, 'MMM d')}
                    </p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-1 rounded-full',
                    gap.severity === 'high'
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-amber-500/20 text-amber-500'
                  )}>
                    {gap.severity === 'high' ? 'High Risk' : 'Medium'}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-primary/10 text-primary hover:bg-primary/20 border-0 rounded-lg text-xs h-7 font-bold"
                >
                  <Plus className="w-3 h-3 mr-1" /> Fill Gap
                </Button>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}