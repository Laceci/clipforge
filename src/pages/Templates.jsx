import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, BookOpen, Brain, Ghost, DollarSign, Dumbbell, ArrowRight, Sparkles, Target, TrendingUp, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const templates = [
  {
    category: 'motivation',
    icon: Flame,
    title: 'Motivational Reels',
    description: 'Powerful speeches and quotes that inspire action and go viral',
    gradient: 'from-orange-600/30 to-red-600/30',
    examples: ['Success mindset', 'Never give up', 'Morning motivation'],
    defaults: { voice_style: 'motivational', visual_style: 'cinematic', caption_style: 'tiktok_bold', music_track: 'motivational_piano', animation_style: 'pan_zoom' },
  },
  {
    category: 'storytelling',
    icon: BookOpen,
    title: 'Storytelling Reels',
    description: 'Captivating stories with cinematic flow that hook from second one',
    gradient: 'from-blue-600/30 to-purple-600/30',
    examples: ['True crime', 'Historical events', 'Urban legends'],
    defaults: { voice_style: 'storytelling', visual_style: 'documentary', caption_style: 'sentence', music_track: 'dramatic_orchestral', animation_style: 'fade' },
  },
  {
    category: 'facts',
    icon: Brain,
    title: 'Fun Facts',
    description: 'Mind-blowing discoveries and psychology tricks that get millions of views',
    gradient: 'from-cyan-600/30 to-blue-600/30',
    examples: ['Science facts', 'Space discoveries', 'Psychology tricks'],
    defaults: { voice_style: 'energetic', visual_style: 'cinematic', caption_style: 'highlight', music_track: 'upbeat_corporate', animation_style: 'zoom_in' },
  },
  {
    category: 'horror',
    icon: Ghost,
    title: 'Horror & Creepy',
    description: 'Dark psychology and creepy content that keeps viewers watching',
    gradient: 'from-gray-600/30 to-slate-600/30',
    examples: ['Scary stories', 'Unsolved mysteries', 'Haunted places'],
    defaults: { voice_style: 'deep', visual_style: 'dark', caption_style: 'word_by_word', music_track: 'dark_ambient', animation_style: 'glitch' },
  },
  {
    category: 'finance',
    icon: DollarSign,
    title: 'Finance & Money',
    description: 'Wealth-building content that positions you as the authority',
    gradient: 'from-emerald-600/30 to-green-600/30',
    examples: ['Passive income', 'Investing basics', 'Money mistakes'],
    defaults: { voice_style: 'calm', visual_style: 'realistic', caption_style: 'tiktok_bold', music_track: 'lofi_chill', animation_style: 'pan_zoom' },
  },
  {
    category: 'fitness',
    icon: Dumbbell,
    title: 'Fitness & Health',
    description: 'Transformation content and workout motivation that builds your audience',
    gradient: 'from-pink-600/30 to-rose-600/30',
    examples: ['Workout tips', 'Diet hacks', 'Transformation stories'],
    defaults: { voice_style: 'energetic', visual_style: 'motivational', caption_style: 'tiktok_bold', music_track: 'epic_cinematic', animation_style: 'pan_zoom' },
  },
  {
    category: 'dark_psychology',
    icon: Moon,
    title: 'Dark Psychology',
    description: 'Mind control, manipulation tactics, and social influence content',
    gradient: 'from-violet-600/30 to-purple-900/30',
    examples: ['Manipulation tactics', 'Mind control', 'Body language'],
    defaults: { voice_style: 'deep', visual_style: 'dark', caption_style: 'highlight', music_track: 'dark_ambient', animation_style: 'fade' },
  },
  {
    category: 'self_improvement',
    icon: Target,
    title: 'Self Improvement',
    description: 'Daily habits, discipline, and personal development that people bookmark',
    gradient: 'from-teal-600/30 to-cyan-600/30',
    examples: ['Morning routine', 'Discipline habits', 'Focus hacks'],
    defaults: { voice_style: 'calm', visual_style: 'cinematic', caption_style: 'sentence', music_track: 'motivational_piano', animation_style: 'pan_zoom' },
  },
  {
    category: 'business',
    icon: TrendingUp,
    title: 'Business Mindset',
    description: 'Entrepreneur stories and business lessons that attract high-value audiences',
    gradient: 'from-amber-600/30 to-orange-600/30',
    examples: ['Startup stories', 'Business lessons', 'Entrepreneur mindset'],
    defaults: { voice_style: 'motivational', visual_style: 'cinematic', caption_style: 'tiktok_bold', music_track: 'epic_cinematic', animation_style: 'pan_zoom' },
  },
];

export default function Templates() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose a template — it pre-configures voice, visuals, captions, and music for you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t, i) => (
          <motion.div
            key={t.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              to={`/create?category=${t.category}`}
              className={`block glass-card rounded-2xl p-6 bg-gradient-to-br ${t.gradient} group hover:neon-glow transition-all duration-300 h-full`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <t.icon className="w-5 h-5 text-foreground/70" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-bold text-lg mb-1.5">{t.title}</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {t.examples.map(ex => (
                  <span key={ex} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-muted-foreground">
                    {ex}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground/70">
                <span>🎙 {t.defaults.voice_style}</span>
                <span>🎬 {t.defaults.visual_style}</span>
                <span>🎵 {t.defaults.music_track.replace(/_/g, ' ')}</span>
                <span>✏️ {t.defaults.caption_style.replace(/_/g, ' ')}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
        <h3 className="font-bold text-lg mb-2">Custom Template</h3>
        <p className="text-sm text-muted-foreground mb-4">Start from scratch with your own unique idea and full control</p>
        <Link to="/create">
          <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors neon-glow">
            Create Custom Video
          </button>
        </Link>
      </div>
    </div>
  );
}