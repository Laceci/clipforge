import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Type, Palette, Hash, CheckCircle2, X, Loader2, Image, Sliders, Eye } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PALETTE_PRESETS = [
  { name: 'Lime Punch', primary: '#A3E635', accent: '#FFFFFF', bg: '#000000' },
  { name: 'Fire Red',   primary: '#EF4444', accent: '#FFFFFF', bg: '#000000' },
  { name: 'Ocean Blue', primary: '#3B82F6', accent: '#FFFFFF', bg: '#0A0F1E' },
  { name: 'Gold Rush',  primary: '#F59E0B', accent: '#FFFFFF', bg: '#000000' },
  { name: 'Purple Haze',primary: '#A855F7', accent: '#FFFFFF', bg: '#0D0010' },
  { name: 'Neon Pink',  primary: '#EC4899', accent: '#FFFFFF', bg: '#0D0010' },
];

const WATERMARK_POSITIONS = [
  { id: 'top-left', label: 'Top Left', icon: '↖️' },
  { id: 'top-right', label: 'Top Right', icon: '↗️' },
  { id: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
  { id: 'bottom-right', label: 'Bottom Right', icon: '↘️' },
  { id: 'center', label: 'Center', icon: '⊙' },
];

function ColorRow({ label, colorKey, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg border border-border shrink-0 cursor-pointer overflow-hidden relative"
        title={label}
      >
        <div className="absolute inset-0" style={{ background: value }} />
        <input
          type="color"
          value={value}
          onChange={e => onChange(colorKey, e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground font-mono">{value}</p>
      </div>
      <input
        type="color"
        value={value}
        onChange={e => onChange(colorKey, e.target.value)}
        className="opacity-0 w-0 h-0"
      />
    </div>
  );
}

export default function BrandSettings({ prefs, onChange, onSave, isSaving }) {
  const [uploadingFont, setUploadingFont] = useState(false);
  const [uploadingWatermark, setUploadingWatermark] = useState(false);
  const fontInputRef = useRef(null);
  const watermarkInputRef = useRef(null);

  const updateColor = (key, val) => onChange(key, val);

  const applyPreset = (preset) => {
    onChange('brand_primary_color', preset.primary);
    onChange('brand_accent_color', preset.accent);
    onChange('brand_background_color', preset.bg);
  };

  const handleFontUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
      toast.error('Please upload a font file (.ttf, .otf, .woff, .woff2)');
      return;
    }
    setUploadingFont(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange('brand_font_url', file_url);
      onChange('brand_font_name', file.name.replace(/\.[^.]+$/, ''));
      toast.success('Font uploaded successfully!');
    } catch {
      toast.error('Font upload failed. Please try again.');
    } finally {
      setUploadingFont(false);
    }
  };

  const removeFont = () => {
    onChange('brand_font_url', '');
    onChange('brand_font_name', '');
  };

  const handleWatermarkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, SVG)');
      return;
    }
    setUploadingWatermark(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange('brand_watermark_logo_url', file_url);
      onChange('brand_watermark_enabled', true);
      toast.success('Watermark logo uploaded!');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploadingWatermark(false);
    }
  };

  const removeWatermark = () => {
    onChange('brand_watermark_logo_url', '');
    onChange('brand_watermark_enabled', false);
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Brand Settings</h3>
      </div>

      {/* Color Palette */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-foreground">Caption Color Palette</p>
        </div>

        {/* Preset swatches */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quick Presets</p>
          <div className="grid grid-cols-3 gap-2">
            {PALETTE_PRESETS.map(preset => {
              const isActive =
                prefs.brand_primary_color === preset.primary &&
                prefs.brand_accent_color === preset.accent;
              return (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all text-left',
                    isActive ? 'border-primary/50 bg-primary/10' : 'border-border bg-secondary/30 hover:border-primary/30'
                  )}
                >
                  <div className="flex gap-0.5 shrink-0">
                    <div className="w-3 h-3 rounded-full" style={{ background: preset.primary }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: preset.bg }} />
                  </div>
                  <span className="text-[10px] leading-tight text-muted-foreground">{preset.name}</span>
                  {isActive && <CheckCircle2 className="w-3 h-3 text-primary ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual color pickers */}
        <div className="space-y-2.5 p-3 rounded-xl bg-secondary/20 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Custom Colors</p>
          <ColorRow label="Primary (highlights)" colorKey="brand_primary_color" value={prefs.brand_primary_color || '#A3E635'} onChange={updateColor} />
          <ColorRow label="Text / Accent" colorKey="brand_accent_color" value={prefs.brand_accent_color || '#FFFFFF'} onChange={updateColor} />
          <ColorRow label="Background / Shadow" colorKey="brand_background_color" value={prefs.brand_background_color || '#000000'} onChange={updateColor} />
        </div>

        {/* Live preview strip */}
        <div
          className="rounded-xl p-3 flex items-center justify-center"
          style={{ background: prefs.brand_background_color || '#000000' }}
        >
          <p className="text-sm font-black tracking-wide" style={{ color: prefs.brand_accent_color || '#FFFFFF' }}>
            Your brand caption{' '}
            <span style={{ color: prefs.brand_primary_color || '#A3E635' }}>looks like this</span>
          </p>
        </div>
      </div>

      {/* Custom Font */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-foreground">Custom Font</p>
        </div>

        {prefs.brand_font_url ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Type className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{prefs.brand_font_name || 'Custom Font'}</p>
              <p className="text-[10px] text-muted-foreground">Uploaded successfully</p>
            </div>
            <button onClick={removeFont} className="text-muted-foreground hover:text-destructive transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fontInputRef.current?.click()}
            disabled={uploadingFont}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 text-xs text-muted-foreground transition-all disabled:opacity-50"
          >
            {uploadingFont
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
              : <><Upload className="w-4 h-4" /> Upload font file (.ttf, .otf, .woff, .woff2)</>}
          </button>
        )}
        <input
          ref={fontInputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          className="hidden"
          onChange={handleFontUpload}
        />
        <p className="text-[10px] text-muted-foreground">
          Uploaded fonts will be applied to caption overlays in generated videos.
        </p>
      </div>

      {/* Brand Hashtags */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-foreground">Global Brand Hashtags</p>
        </div>
        <Textarea
          placeholder="#yourbrand #viral #content"
          value={prefs.brand_hashtags_global || ''}
          onChange={e => onChange('brand_hashtags_global', e.target.value)}
          className="bg-secondary/40 border-border rounded-xl text-sm resize-none min-h-[64px]"
        />
        <p className="text-[10px] text-muted-foreground">
          These hashtags are automatically appended to every post when scheduling — no need to type them each time.
        </p>
      </div>

      {/* Watermark Logo */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Image className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-foreground">Watermark Logo</p>
          {prefs.brand_watermark_enabled && (
            <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">AUTO-APPLY</span>
          )}
        </div>

        {prefs.brand_watermark_logo_url ? (
          <div className="space-y-3 p-3 rounded-xl bg-secondary/30 border border-border">
            {/* Logo preview */}
            <div className="rounded-lg overflow-hidden bg-black p-4 aspect-video flex items-center justify-center">
              <img
                src={prefs.brand_watermark_logo_url}
                alt="Watermark preview"
                className="max-w-full max-h-full object-contain"
                style={{ opacity: prefs.brand_watermark_opacity || 0.8 }}
              />
            </div>

            {/* Position selector */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Position</p>
              <div className="grid grid-cols-5 gap-2">
                {WATERMARK_POSITIONS.map(pos => (
                  <button
                    key={pos.id}
                    onClick={() => onChange('brand_watermark_position', pos.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all',
                      prefs.brand_watermark_position === pos.id
                        ? 'bg-primary/20 border border-primary/40 text-primary'
                        : 'bg-secondary/50 border border-transparent hover:border-primary/20'
                    )}
                    title={pos.label}
                  >
                    <span className="text-lg">{pos.icon}</span>
                    <span className="text-[9px] leading-tight">{pos.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size & opacity controls */}
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">Size</p>
                  <span className="text-[10px] text-muted-foreground">{Math.round((prefs.brand_watermark_scale || 0.15) * 100)}% of video</span>
                </div>
                <Slider
                  value={[(prefs.brand_watermark_scale || 0.15) * 100]}
                  onValueChange={([v]) => onChange('brand_watermark_scale', v / 100)}
                  min={5}
                  max={40}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">Opacity</p>
                  <span className="text-[10px] text-muted-foreground">{Math.round((prefs.brand_watermark_opacity || 0.8) * 100)}%</span>
                </div>
                <Slider
                  value={[(prefs.brand_watermark_opacity || 0.8) * 100]}
                  onValueChange={([v]) => onChange('brand_watermark_opacity', v / 100)}
                  min={20}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            {/* Auto-apply toggle */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-medium text-foreground">Apply to all videos</p>
              </div>
              <button
                onClick={() => onChange('brand_watermark_enabled', !prefs.brand_watermark_enabled)}
                className={cn(
                  'px-2 py-1 rounded-lg text-[10px] font-bold transition-all',
                  prefs.brand_watermark_enabled
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {prefs.brand_watermark_enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <button
              onClick={removeWatermark}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Remove Watermark
            </button>
          </div>
        ) : (
          <button
            onClick={() => watermarkInputRef.current?.click()}
            disabled={uploadingWatermark}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 text-xs text-muted-foreground transition-all disabled:opacity-50"
          >
            {uploadingWatermark
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
              : <><Upload className="w-4 h-4" /> Upload logo (.png, .jpg, .svg)</>}
          </button>
        )}
        <input
          ref={watermarkInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleWatermarkUpload}
        />
        <p className="text-[10px] text-muted-foreground">
          Watermark will be automatically placed on every video in your configured position and opacity.
        </p>
      </div>
    </div>
  );
}