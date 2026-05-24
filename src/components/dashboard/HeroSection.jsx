import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wand2, Play, Link2, Zap, Video, Mic, Music, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Wand2,  label: 'AI Script',      desc: 'Write scripts in seconds with GPT' },
  { icon: Video,  label: 'Scene Visuals',   desc: 'Auto-generate cinematic imagery' },
  { icon: Mic,    label: 'AI Voiceover',    desc: '20+ unique voice characters' },
  { icon: Music,  label: 'Music & SFX',     desc: 'AI-matched background audio' },
  { icon: Share2, label: 'Auto Publish',    desc: 'Push to TikTok, YouTube, Instagram' },
  { icon: Zap,    label: 'One Workflow',    desc: 'Idea → Published Short in minutes' },
];

export default function HeroSection({ projectCount }) {
  const isNewUser = projectCount === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-3xl overflow-hidden border border-border glass-card"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-violet-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative px-5 pt-6 pb-5 md:px-8 md:pt-8 md:pb-7">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-semibold text-primary tracking-wide uppercase">AI Video Factory</span>
        </motion.div>

        {/* Headline */}
        <h1 className="text-2xl md:text-4xl font-extrabold leading-tight tracking-tight mb-2 md:mb-3">
          Create viral faceless videos
          <br />
          <span className="text-primary neon-text">in minutes — automatically.</span>
        </h1>

        <p className="text-muted-foreground text-xs md:text-sm max-w-xl leading-relaxed mb-5 md:mb-6">
          From idea to published Short in one AI-powered workflow. Generate scripts, voiceovers, visuals,
          captions, music, and auto-publish to your social platforms — no editing skills needed.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
          <Link to="/create">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 font-bold neon-glow text-xs md:text-sm h-9 md:h-10 px-4 md:px-5">
              <Wand2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {isNewUser ? 'Create First Video' : 'New Video'}
            </Button>
          </Link>
          <Link to="/templates">
            <Button variant="outline" className="rounded-xl gap-2 border-border text-xs md:text-sm h-9 md:h-10 px-4 md:px-5">
              <Play className="w-3.5 h-3.5" /> Browse Templates
            </Button>
          </Link>
          <Link to="/publish">
            <Button variant="ghost" className="rounded-xl gap-2 text-muted-foreground text-xs md:text-sm h-9 md:h-10 px-4 md:px-5">
              <Link2 className="w-3.5 h-3.5" /> Connect Accounts
            </Button>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="flex flex-col gap-1 p-2.5 rounded-xl bg-secondary/40 border border-border/50 hover:border-primary/30 hover:bg-secondary/60 transition-all"
            >
              <f.icon className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-foreground leading-tight">{f.label}</p>
              <p className="text-[10px] text-muted-foreground leading-snug hidden md:block">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}