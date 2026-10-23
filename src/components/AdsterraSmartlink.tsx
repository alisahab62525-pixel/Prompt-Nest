import React from 'react';
import { ExternalLink, Sparkles, Zap } from 'lucide-react';

export const ADSTERRA_SMARTLINK_URL = 'https://arwf.org/4/e101c959d3b1aa449062abf63e31ecb5';

interface SmartlinkButtonProps {
  label?: string;
  variant?: 'navbar' | 'prompt-cta' | 'card' | 'badge';
  className?: string;
}

export const AdsterraSmartlinkButton: React.FC<SmartlinkButtonProps> = ({
  label,
  variant = 'navbar',
  className = ''
}) => {
  if (variant === 'navbar') {
    return (
      <a
        href={ADSTERRA_SMARTLINK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-300/40 dark:border-amber-600/40 transition-all shadow-xs ${className}`}
        title="Explore Partner AI Tools & Special Offers"
      >
        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
        <span>{label || 'AI Tools & Credits'}</span>
        <ExternalLink className="w-3 h-3 opacity-70" />
      </a>
    );
  }

  if (variant === 'prompt-cta') {
    return (
      <a
        href={ADSTERRA_SMARTLINK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-95 transition-opacity shadow-sm ${className}`}
      >
        <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600" />
        <span>{label || 'Generate with Partner AI (Free Credits)'}</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </a>
    );
  }

  if (variant === 'card') {
    return (
      <a
        href={ADSTERRA_SMARTLINK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`group block p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 hover:border-amber-400 dark:hover:border-amber-600 transition-all shadow-sm ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <Zap className="w-3 h-3" />
            Featured Partner
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
        </div>
        <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          Unlock Unlimited AI Image & Video Generations
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
          Access high-performance neural compute, cloud GPU engines, and partner perks tailored for prompt artisans.
        </p>
      </a>
    );
  }

  return (
    <a
      href={ADSTERRA_SMARTLINK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline ${className}`}
    >
      <span>{label || 'Partner AI'}</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  );
};
