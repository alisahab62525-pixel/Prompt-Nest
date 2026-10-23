import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { fetchPrompts, fetchUserBookmarks, deletePrompt } from '../services/promptService.ts';
import { Prompt, Bookmark } from '../types/index.ts';
import { PromptCard } from './PromptCard.tsx';
import {
  User,
  Settings,
  Bookmark as BookmarkIcon,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface UserProfileViewProps {
  onOpenPublish: () => void;
  onSelectPrompt: (p: Prompt) => void;
  onOpenAuth: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  onOpenPublish,
  onSelectPrompt,
  onOpenAuth
}) => {
  const { user, userProfile, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'prompts' | 'bookmarks' | 'settings'>('prompts');
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [myBookmarks, setMyBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setAvatarUrl(userProfile.avatarUrl || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    Promise.all([
      fetchPrompts({ authorId: user.uid, onlyApproved: false }),
      fetchUserBookmarks(user.uid)
    ])
      .then(([prompts, bookmarks]) => {
        setMyPrompts(prompts);
        setMyBookmarks(bookmarks);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({ displayName, bio, avatarUrl });
      setSettingsFeedback('Profile updated successfully.');
      setTimeout(() => setSettingsFeedback(null), 3000);
    } catch (err: any) {
      setSettingsFeedback('Failed to update: ' + err.message);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to remove this prompt?')) return;
    try {
      await deletePrompt(id);
      setMyPrompts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <User className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Sign In Required</h2>
        <p className="text-xs text-zinc-500 mt-2 mb-4">
          Please sign in to view your published prompts, saved bookmarks, and profile settings.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden ring-4 ring-zinc-100 dark:ring-zinc-800 shrink-0 flex items-center justify-center text-2xl font-bold text-zinc-700 dark:text-zinc-300">
          {userProfile?.avatarUrl ? (
            <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            userProfile?.displayName?.charAt(0).toUpperCase() || 'U'
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                {userProfile?.displayName || 'Prompt Artisan'}
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">{user.email}</p>
            </div>

            <button
              onClick={onOpenPublish}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-sm self-center sm:self-auto mt-2 sm:mt-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish New Prompt</span>
            </button>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3 max-w-2xl leading-relaxed">
            {userProfile?.bio || 'Prompt engineer crafting specialized generations for modern creative pipelines.'}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-zinc-500">
            <span className="font-mono">
              <strong className="text-zinc-900 dark:text-white tabular-nums">{myPrompts.length}</strong> Prompts
            </span>
            <span>·</span>
            <span className="font-mono">
              <strong className="text-zinc-900 dark:text-white tabular-nums">{myBookmarks.length}</strong> Saved Bookmarks
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('prompts')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'prompts'
              ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          My Submissions ({myPrompts.length})
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'bookmarks'
              ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Saved Bookmarks ({myBookmarks.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Account Settings
        </button>
      </div>

      {/* Tab 1: My Submissions */}
      {activeTab === 'prompts' && (
        <div>
          {myPrompts.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <Sparkles className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">No Prompts Published Yet</h3>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                Share your creative prompts and build your audience in the AI community.
              </p>
              <button
                onClick={onOpenPublish}
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold"
              >
                Publish Your First Prompt
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPrompts.map((p) => (
                <div key={p.id} className="relative flex flex-col">
                  {/* Status badge over card */}
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span
                      className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${
                        p.status === 'approved'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : p.status === 'pending'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-500'
                      }`}
                    >
                      Status: {p.status}
                    </span>

                    <button
                      onClick={() => handleDeletePrompt(p.id)}
                      className="text-zinc-400 hover:text-red-500 p-1"
                      title="Delete prompt"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <PromptCard prompt={p} onSelect={onSelectPrompt} onOpenAuth={onOpenAuth} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div>
          {myBookmarks.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <BookmarkIcon className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">No Bookmarks Saved</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Click the bookmark icon on any prompt card while exploring to save it for later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBookmarks.map((b) => (
                <div
                  key={b.promptId}
                  onClick={() => {
                    // Navigate or select
                    onSelectPrompt({
                      id: b.promptId,
                      title: b.title,
                      description: '',
                      promptText: 'Click card to view details',
                      category: b.category,
                      model: b.model,
                      tags: [],
                      previewImageUrl: b.previewImageUrl,
                      authorId: '',
                      authorName: 'Saved Creator',
                      status: 'approved',
                      likesCount: 0,
                      bookmarksCount: 0,
                      copiesCount: 0,
                      viewsCount: 0,
                      createdAt: b.createdAt,
                      updatedAt: b.createdAt
                    });
                  }}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 transition-colors cursor-pointer group"
                >
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-3">
                    <img src={b.previewImageUrl} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mb-1">
                    <span className="capitalize">{b.category}</span>
                    <span>·</span>
                    <span>{b.model}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-white line-clamp-1">{b.title}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-xl p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Edit Profile</h3>

          {settingsFeedback && (
            <div className="mb-4 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{settingsFeedback}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold shadow-sm hover:bg-zinc-800 transition-colors"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
