import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Unlink, RefreshCw, Users } from 'lucide-react';
import PlatformBadge from './PlatformBadge';

const platformIcons = {
  tiktok: '🎵',
  instagram: '📸',
  youtube: '▶️',
};

export default function ConnectedAccountCard({ account, onDisconnect }) {
  const statusColor = account.status === 'connected'
    ? 'text-emerald-400'
    : account.status === 'expired'
      ? 'text-amber-400'
      : 'text-muted-foreground';

  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center text-2xl shrink-0">
        {account.avatar_url
          ? <img src={account.avatar_url} className="w-full h-full object-cover rounded-xl" alt="" />
          : platformIcons[account.platform]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <PlatformBadge platform={account.platform} />
          <span className={`text-[10px] font-medium ${statusColor}`}>● {account.status}</span>
        </div>
        <p className="font-semibold text-sm truncate">{account.account_name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <Users className="w-3 h-3" />
          {account.followers ? `${(account.followers / 1000).toFixed(1)}K followers` : 'No data'}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        {account.status === 'expired' && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-400 hover:text-amber-300">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDisconnect(account.id)}
        >
          <Unlink className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}