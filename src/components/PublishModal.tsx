import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { createPrompt } from '../services/promptService.ts';
import { CATEGORIES_LIST, AI_MODELS_LIST } from '../data/seedData.ts';
import { PromptCategory, AIModel } from '../types/index.ts';
import { X, Upload, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

// Preset sample images for quick selection
import heroPortraitImg from '../assets/images/hero_ai_portrait_1792731508078.jpg';
import cyberpunkCityImg from '../assets/images/prompt_cyberpunk_city_1792731509616.jpg';
import isometricTechImg from '../assets/images/prompt_isometric_tech_1792731508750.jpg';
import botanicalMacroImg from '../assets/images/prompt_botanical_macro_1792731509207.jpg';

const SAMPLE_PRESETS = [
  { name: 'Editorial Portrait', url: heroPortraitImg },
  { name: 'Cyberpunk Metropolis', url: cyberpunkCityImg },
  { name: 'Quantum Workstation', url: isometricTechImg },
  { name: 'Crystal Orchid', url: botanicalMacroImg },
];

interface PublishModalProps {
  onClose: () => void;
  onSuccess: (promptId: string) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ onClose, onSuccess }) => {
  const { user, userProfile, isAdmin } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [promptText, setPromptText] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [category, setCategory] = useState<PromptCategory>('image-generation');
  const [model, setModel] = useState<AIModel>('Midjourney v6.1');
  const [tagsInput, setTagsInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [previewImageUrl, setPreviewImageUrl] = useState(heroPortraitImg);
  const [imageMode, setImageMode] = useState<'preset' | 'upload' | 'url'>('preset');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ id: string; status: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Type & Size (Max 2MB)
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 2MB limit. Please choose a smaller image.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('You must be logged in to publish a prompt.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Prompt title is required.');
      return;
    }
    if (title.length > 160) {
      setErrorMsg('Title cannot exceed 160 characters.');
      return;
    }
    if (!promptText.trim()) {
      setErrorMsg('Prompt text is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)
      .slice(0, 8);

    try {
      const promptId = await createPrompt(
        {
          title: title.trim(),
          description: description.trim(),
          promptText: promptText.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          category,
          model,
          tags,
          previewImageUrl,
          authorId: user.uid,
          authorName: userProfile?.displayName || user.email?.split('@')[0] || 'Artisan',
          authorAvatar: userProfile?.avatarUrl || '',
          status: isAdmin ? 'approved' : 'pending',
          parameters: {
            aspectRatio
          }
        },
        isAdmin
      );

      setSuccessInfo({
        id: promptId,
        status: isAdmin ? 'approved' : 'pending'
      });
      setTimeout(() => {
        onSuccess(promptId);
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish prompt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Publish New AI Prompt</h2>
            <p className="text-xs text-zinc-500">
              {isAdmin ? 'Admin mode: Prompts are instantly approved.' : 'Submissions undergo quality moderation before going live.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {successInfo ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-in zoom-in-75 duration-200" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Prompt Submitted!</h3>
            <p className="text-xs text-zinc-500 max-w-md">
              {successInfo.status === 'approved'
                ? 'Your prompt has been published and is now live on PromptNest marketplace.'
                : 'Your prompt has been submitted for moderation. Once reviewed by our team, it will appear publicly on the marketplace.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Prompt Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ultra-realistic Cinematic Street Photography"
                maxLength={160}
                required
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            {/* Category & Model Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PromptCategory)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  {CATEGORIES_LIST.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  AI Model <span className="text-red-500">*</span>
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value as AIModel)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  {AI_MODELS_LIST.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prompt Text */}
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Full Prompt Text <span className="text-red-500">*</span>
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Paste the full working prompt text, including model directives..."
                rows={4}
                required
                className="w-full px-3 py-2 font-mono text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 leading-relaxed"
              />
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Negative Prompt (Optional)
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="e.g. blurry, cartoonish, low resolution, extra fingers"
                className="w-full px-3 py-2 font-mono text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            {/* Description & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain when to use this prompt or key stylistic nuances"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="portrait, cinematic, 85mm, studio"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
            </div>

            {/* Preview Image Selection */}
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Visual Preview Image
              </label>

              {/* Mode switch */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setImageMode('preset')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    imageMode === 'preset' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Gallery Presets
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    imageMode === 'upload' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    imageMode === 'url' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Image URL
                </button>
              </div>

              {imageMode === 'preset' && (
                <div className="grid grid-cols-4 gap-2">
                  {SAMPLE_PRESETS.map((p) => (
                    <div
                      key={p.name}
                      onClick={() => setPreviewImageUrl(p.url)}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        previewImageUrl === p.url ? 'border-zinc-900 dark:border-white ring-2 ring-zinc-400' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {imageMode === 'upload' && (
                <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                    <Upload className="w-6 h-6 text-zinc-400 mb-1" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Click to upload preview image</span>
                    <span className="text-[11px] text-zinc-400">PNG, JPG, or WebP up to 2MB</span>
                  </label>
                </div>
              )}

              {imageMode === 'url' && (
                <input
                  type="url"
                  value={previewImageUrl}
                  onChange={(e) => setPreviewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none"
                />
              )}
            </div>

            {/* Submit CTA */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Publishing...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Publish Prompt</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
