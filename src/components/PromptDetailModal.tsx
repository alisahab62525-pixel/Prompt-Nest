import React, { useState, useEffect } from 'react';
import { Prompt } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  toggleLikePrompt,
  toggleBookmarkPrompt,
  checkUserLiked,
  checkUserBookmarked,
  incrementCopyCount
} from '../services/promptService.ts';
import { AdsterraBanner } from './AdsterraBanner.tsx';
import { AdsterraNativeBanner } from './AdsterraNativeBanner.tsx';
import { AdsterraSmartlinkButton } from './AdsterraSmartlink.tsx';
import { GoogleAdSenseUnit } from './GoogleAdSenseUnit.tsx';
import {
  X,
  Copy,
  Check,
  Heart,
  Bookmark,
  Share2,
  Flag,
  UserPlus,
  UserCheck,
  Sparkles,
  ExternalLink,
  Sliders,
  Maximize2,
  Zap
} from 'lucide-react';

interface PromptDetailModalProps {
  prompt: Prompt | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onSelectPrompt: (p: Prompt) => void;
  allPrompts: Prompt[];
  onOpenReport: (promptId: string, promptTitle: string) => void;
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
  prompt,
  onClose,
  onOpenAuth,
  onSelectPrompt,
  allPrompts,
  onOpenReport
}) => {
  const { user, toggleFollowCreator, followingList } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(prompt?.likesCount || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  useEffect(() => {
    if (!prompt) return;
    if (user) {
      checkUserLiked(prompt.id, user.uid).then(setHasLiked);
      checkUserBookmarked(prompt.id, user.uid).then(setIsBookmarked);
    }
    setLikesCount(prompt.likesCount || 0);
    setIsFollowing(followingList.includes(prompt.authorId));
  }, [prompt, user, followingList]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!prompt) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [prompt]);

  const handleCopyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopied(true);
      incrementCopyCount(prompt.id);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    if (!prompt) return;
    const url = window.location.origin + '?prompt=' + prompt.id;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleLike = async () => {
    if (!prompt) return;
    if (!user) {
      onOpenAuth();
      return;
    }
    const prevLiked = hasLiked;
    const prevCount = likesCount;
    setHasLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await toggleLikePrompt(prompt.id, user.uid);
      setHasLiked(res.liked);
      setLikesCount(res.newCount);
    } catch {
      setHasLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleBookmark = async () => {
    if (!prompt) return;
    if (!user) {
      onOpenAuth();
      return;
    }
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      const res = await toggleBookmarkPrompt(prompt, user.uid);
      setIsBookmarked(res.bookmarked);
    } catch {
      setIsBookmarked(prev);
    }
  };

  const handleFollow = async () => {
    if (!prompt) return;
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      const status = await toggleFollowCreator(prompt.authorId);
      setIsFollowing(status);
    } catch {
      //
    }
  };

  if (!prompt) return null;

  const relatedPrompts = allPrompts
    .filter((p) => p.id !== prompt.id && (p.category === prompt.category || p.model === prompt.model))
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
      {/* Background click to dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="capitalize">{prompt.category.replace('-', ' ')}</span>
            <span aria-hidden="true">·</span>
            <span>{prompt.model}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Copy link"
            >
              {shareCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onOpenReport(prompt.id, prompt.title)}
              className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Report content"
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Visual Asset Preview */}
            <div className="flex flex-col gap-3">
              <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-[4/3] w-full border border-zinc-200 dark:border-zinc-800">
                {prompt.previewImageUrl ? (
                  <img
                    src={prompt.previewImageUrl}
                    alt={prompt.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-zinc-400">
                    <Sparkles className="w-10 h-10 mb-2 opacity-40" />
                    <span className="text-xs font-mono">No visual preview</span>
                  </div>
                )}
              </div>

              {/* Action buttons strip below image */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-xs font-medium transition-colors ${
                    hasLiked
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                  <span className="tabular-nums font-mono">{likesCount} Likes</span>
                </button>

                <button
                  onClick={handleBookmark}
                  className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-xs font-medium transition-colors ${
                    isBookmarked
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
                </button>
              </div>

              {/* Creator Card */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-sm font-semibold">
                    {prompt.authorAvatar ? (
                      <img src={prompt.authorAvatar} alt={prompt.authorName} className="w-full h-full object-cover" />
                    ) : (
                      prompt.authorName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{prompt.authorName}</h4>
                    <span className="text-[11px] text-zinc-500">Prompt Creator</span>
                  </div>
                </div>

                <button
                  onClick={handleFollow}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isFollowing
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                      : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>

              {/* Adsterra Banner 300x250 (31882356) */}
              <div className="pt-2 flex justify-center">
                <AdsterraBanner size="300x250" />
              </div>
            </div>

            {/* Right Column: Prompt Text & Parameters */}
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">
                  {prompt.title}
                </h2>
                {prompt.description && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {prompt.description}
                  </p>
                )}
              </div>

              {/* Main Prompt Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Prompt Text
                  </span>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                        <span>Prompt Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed select-all overflow-x-auto whitespace-pre-wrap">
                  {prompt.promptText}
                </div>

                {/* Adsterra Smartlink (31882354) Action CTA */}
                <div className="mt-2.5">
                  <AdsterraSmartlinkButton
                    variant="prompt-cta"
                    label="⚡ Test Prompt with Partner AI Tool (Free Access)"
                  />
                </div>
              </div>

              {/* Negative Prompt if applicable */}
              {prompt.negativePrompt && (
                <div>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Negative Prompt
                  </span>
                  <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 font-mono text-xs text-red-900 dark:text-red-300 leading-relaxed whitespace-pre-wrap">
                    {prompt.negativePrompt}
                  </div>
                </div>
              )}

              {/* Parameters Grid */}
              {prompt.parameters && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Model Parameters</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {prompt.parameters.aspectRatio && (
                      <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                        <span className="text-zinc-400 block text-[10px] uppercase">Aspect Ratio</span>
                        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{prompt.parameters.aspectRatio}</span>
                      </div>
                    )}
                    {prompt.parameters.cfgScale !== undefined && (
                      <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                        <span className="text-zinc-400 block text-[10px] uppercase">CFG Scale</span>
                        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{prompt.parameters.cfgScale}</span>
                      </div>
                    )}
                    {prompt.parameters.seed && (
                      <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                        <span className="text-zinc-400 block text-[10px] uppercase">Seed</span>
                        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{prompt.parameters.seed}</span>
                      </div>
                    )}
                    {prompt.parameters.stylize !== undefined && (
                      <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                        <span className="text-zinc-400 block text-[10px] uppercase">Stylize</span>
                        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{prompt.parameters.stylize}</span>
                      </div>
                    )}
                    {prompt.parameters.steps !== undefined && (
                      <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                        <span className="text-zinc-400 block text-[10px] uppercase">Sampling Steps</span>
                        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{prompt.parameters.steps}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {prompt.tags.map((t, i) => (
                      <span key={i} className="font-mono text-[11px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Prompts */}
          {relatedPrompts.length > 0 && (
            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                Related AI Prompts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedPrompts.map((rp) => (
                  <div
                    key={rp.id}
                    onClick={() => onSelectPrompt(rp)}
                    className="group cursor-pointer rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors bg-zinc-50/50 dark:bg-zinc-900/50"
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 mb-2">
                      <img src={rp.previewImageUrl} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">{rp.title}</p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{rp.model}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Google AdSense Responsive Display Unit */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <GoogleAdSenseUnit />
          </div>

          {/* Adsterra Native Banner (31882352) */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <AdsterraNativeBanner />
          </div>
        </div>
      </div>
    </div>
  );
};
