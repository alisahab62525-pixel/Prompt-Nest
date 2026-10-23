import React, { useState } from 'react';
import { Prompt } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { toggleLikePrompt, incrementCopyCount, toggleBookmarkPrompt } from '../services/promptService.ts';
import { Heart, Copy, Check, Bookmark, Sparkles, Image as ImageIcon } from 'lucide-react';

interface PromptCardProps {
  prompt: Prompt;
  onSelect: (prompt: Prompt) => void;
  onOpenAuth: () => void;
  isBookmarkedInitial?: boolean;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onSelect,
  onOpenAuth,
  isBookmarkedInitial = false
}) => {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState<number>(prompt.likesCount || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(isBookmarkedInitial);
  const [copied, setCopied] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    // Optimistic update
    const previousLiked = hasLiked;
    const previousCount = likesCount;
    setHasLiked(!previousLiked);
    setLikesCount(previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      const res = await toggleLikePrompt(prompt.id, user.uid);
      setHasLiked(res.liked);
      setLikesCount(res.newCount);
    } catch (err) {
      // Revert on error
      setHasLiked(previousLiked);
      setLikesCount(previousCount);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    const previousBookmarked = isBookmarked;
    setIsBookmarked(!previousBookmarked);

    try {
      const res = await toggleBookmarkPrompt(prompt, user.uid);
      setIsBookmarked(res.bookmarked);
    } catch {
      setIsBookmarked(previousBookmarked);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopied(true);
      incrementCopyCount(prompt.id);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div
      onClick={() => onSelect(prompt)}
      className="group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer hover:shadow-sm"
    >
      {/* Visual Slot: 65-75% visual prominence with fallback */}
      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {!imgError && prompt.previewImageUrl ? (
          <img
            src={prompt.previewImageUrl}
            alt={prompt.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-zinc-400 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800">
            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{prompt.model}</span>
          </div>
        )}

        {/* Hover quick-actions overlay */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleBookmark}
            aria-label="Bookmark prompt"
            className={`p-2 rounded-lg backdrop-blur-md transition-colors ${
              isBookmarked
                ? 'bg-amber-500 text-white'
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            onClick={handleCopy}
            aria-label="Copy prompt text"
            className="p-2 rounded-lg bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quiet Model Label at bottom edge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="text-[11px] font-medium text-white px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
            {prompt.model}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Unboxed metadata line with typographic separators */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="capitalize">{prompt.category.replace('-', ' ')}</span>
            <span aria-hidden="true">·</span>
            <span>{prompt.authorName}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
            {prompt.title}
          </h3>

          {/* Prompt excerpt preview */}
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 font-mono leading-relaxed">
            {prompt.promptText}
          </p>
        </div>

        {/* Card Footer: Metrics & Interactive Actions */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          {/* Like button & counter */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors ${
              hasLiked ? 'text-red-500 font-semibold' : 'hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
            <span className="tabular-nums font-mono text-xs">{likesCount}</span>
          </button>

          {/* Copy Prompt CTA button */}
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-zinc-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
