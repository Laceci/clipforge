import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Link2, Unlink2, Plus, Settings, AlertCircle, CheckCircle2,
  Copy, RefreshCw, Loader2, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SOCIAL_PLATFORMS } from '@/lib/socialMediaIntegration';

export default function SocialMediaManager() {
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [showConnect, setShowConnect] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [accountName, setAccountName] = useState('');

  // Fetch connected accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: () => base44.entities.ConnectedAccount.list(),
  });

  // Connect account mutation
  const connectMutation = useMutation({
    mutationFn: (data) => base44.entities.ConnectedAccount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
      setShowConnect(false);
      setApiKey('');
      setAccountName('');
      setSelectedPlatform(null);
      toast.success('Account connected successfully!');
    },
    onError: (err) => {
      toast.error('Failed to connect account: ' + err.message);
    },
  });

  // Disconnect account mutation
  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
      toast.success('Account disconnected');
    },
  });

  const handleConnect = () => {
    if (!selectedPlatform || !accountName.trim() || !apiKey.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    connectMutation.mutate({
      platform: selectedPlatform,
      account_name: accountName,
      access_token: apiKey,
      status: 'connected',
    });
  };

  const connectedByPlatform = Object.keys(SOCIAL_PLATFORMS).map(platform => ({
    platform,
    accounts: accounts.filter(acc => acc.platform === platform),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Social Media Accounts</h2>
          <p className="text-xs text-muted-foreground mt-1">Connect accounts to auto-publish videos</p>
        </div>
        <Button
          onClick={() => setShowConnect(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" /> Connect Account
        </Button>
      </div>

      {/* Connected Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectedByPlatform.map(({ platform, accounts: platformAccounts }) => {
          const platformInfo = SOCIAL_PLATFORMS[platform];

          return (
            <div key={platform} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{platformInfo.icon}</span>
                  <h3 className="font-semibold">{platformInfo.name}</h3>
                </div>
                {platformAccounts.length > 0 && (
                  <Badge className="bg-green-500/20 text-green-500 border-0">
                    {platformAccounts.length} connected
                  </Badge>
                )}
              </div>

              {platformAccounts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-3">No accounts connected</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlatform(platform);
                      setShowConnect(true);
                    }}
                    className="w-full rounded-lg gap-1"
                  >
                    <Link2 className="w-3 h-3" /> Connect {platformInfo.name}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {platformAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{account.account_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {account.status === 'connected' ? (
                            <Badge className="bg-green-500/20 text-green-500 border-0 text-[10px]">
                              ✓ Connected
                            </Badge>
                          ) : account.status === 'expired' ? (
                            <Badge className="bg-yellow-500/20 text-yellow-500 border-0 text-[10px]">
                              ⚠ Token Expired
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-500 border-0 text-[10px]">
                              ✗ Disconnected
                            </Badge>
                          )}
                          {account.followers && (
                            <span className="text-[10px] text-muted-foreground">
                              {account.followers.toLocaleString()} followers
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => disconnectMutation.mutate(account.id)}
                        disabled={disconnectMutation.isPending}
                        className="h-8 w-8 text-destructive/60 hover:text-destructive"
                      >
                        <Unlink2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Platform info */}
              <div className="pt-2 border-t border-border text-[10px] text-muted-foreground space-y-1">
                <p>• Max duration: {platformInfo.maxDuration}s</p>
                <p>• Aspect ratio: {platformInfo.aspectRatio}</p>
                <p>• Features: {platformInfo.features.join(', ')}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection Dialog */}
      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Connect Social Account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Platform selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Platform</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SOCIAL_PLATFORMS).map(([key, platform]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPlatform(key)}
                    className={cn(
                      'py-2 px-3 rounded-lg border text-center transition-all',
                      selectedPlatform === key
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'bg-secondary/40 border-border text-muted-foreground hover:border-primary/20'
                    )}
                  >
                    <span className="text-lg block mb-1">{platform.icon}</span>
                    <span className="text-[10px] font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Account Name</label>
              <Input
                placeholder="e.g., @mybrand"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                className="bg-secondary/40 border-border rounded-xl"
              />
            </div>

            {/* API Key / Token */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                {selectedPlatform === 'tiktok' ? 'TikTok Access Token' :
                 selectedPlatform === 'youtube' ? 'YouTube API Key' :
                 selectedPlatform === 'instagram' ? 'Instagram Graph API Token' :
                 'Access Token'}
              </label>
              <textarea
                placeholder="Paste your access token here"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/40 text-sm font-mono text-muted-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                {selectedPlatform === 'tiktok' && '🔗 Get from TikTok Developer Portal'}
                {selectedPlatform === 'youtube' && '🔗 Get from Google Cloud Console'}
                {selectedPlatform === 'instagram' && '🔗 Get from Meta Business Suite'}
              </p>
            </div>

            {/* Warning */}
            <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-600">Keep your access token secure. Never share it publicly.</p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={connectMutation.isPending || !selectedPlatform || !accountName || !apiKey}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg gap-2"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Connect Account
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}