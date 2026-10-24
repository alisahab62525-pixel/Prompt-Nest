import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  fetchPendingPrompts,
  fetchPrompts,
  moderatePrompt,
  deletePrompt,
  updatePrompt,
  fetchAllReports,
  updateReportStatus
} from '../services/promptService.ts';
import {
  fetchSiteSettings,
  saveSiteSettings,
  DEFAULT_SITE_SETTINGS
} from '../services/settingsService.ts';
import { Prompt, ReportItem, SiteSettings, PromptCategory, AIModel } from '../types/index.ts';
import { CATEGORIES_LIST, AI_MODELS_LIST } from '../data/seedData.ts';
import {
  ShieldCheck,
  Check,
  X,
  Star,
  Trash2,
  AlertTriangle,
  FileText,
  Users,
  RefreshCw,
  ExternalLink,
  Lock,
  Settings,
  Pencil,
  Plus,
  Save,
  Globe,
  Bell,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Download,
  Copy
} from 'lucide-react';

// Canvas-based image compressor for gallery photo replacement during prompt editing
function compressGalleryPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        // Optimal 800px dimension keeps size under 60KB while crystal-sharp for all screens
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Ultra-clean 0.75 JPEG compression ensures instant cloud upload and universal browser display
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Failed to parse image from gallery.'));
    };
    reader.onerror = () => reject(new Error('Could not read image file.'));
  });
}

export const AdminDashboard: React.FC<{
  onSelectPrompt: (p: Prompt) => void;
  onOpenPublish?: () => void;
}> = ({ onSelectPrompt, onOpenPublish }) => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'moderation' | 'all' | 'reports' | 'audit' | 'settings'>('moderation');
  const [pendingPrompts, setPendingPrompts] = useState<Prompt[]>([]);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Site Settings state
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Edit Prompt Modal state
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPromptText, setEditPromptText] = useState('');
  const [editNegativePrompt, setEditNegativePrompt] = useState('');
  const [editCategory, setEditCategory] = useState<PromptCategory>('image-generation');
  const [editModel, setEditModel] = useState<AIModel>('Midjourney v6.1');
  const [editTags, setEditTags] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editStatus, setEditStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [editFeatured, setEditFeatured] = useState(false);
  const [isSavingPromptEdit, setIsSavingPromptEdit] = useState(false);
  const [isCompressingEditPhoto, setIsCompressingEditPhoto] = useState(false);

  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [copiedAdsTxt, setCopiedAdsTxt] = useState(false);

  const handleCopyAdsTxt = () => {
    navigator.clipboard.writeText('google.com, pub-8327085156281154, DIRECT, f08c47fec0942fa0');
    setCopiedAdsTxt(true);
    setTimeout(() => setCopiedAdsTxt(false), 2500);
  };

  const handleDownloadAdsTxt = () => {
    const content = 'google.com, pub-8327085156281154, DIRECT, f08c47fec0942fa0\n';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ads.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDistZip = () => {
    const link = document.createElement('a');
    link.href = '/promptshouse-dist.zip';
    link.download = 'promptshouse-dist.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pending, all, rep, settings] = await Promise.all([
        fetchPendingPrompts(),
        fetchPrompts({ onlyApproved: false, limitCount: 150 }),
        fetchAllReports(),
        fetchSiteSettings()
      ]);
      setPendingPrompts(pending);
      setAllPrompts(all);
      setReports(rep);
      setSiteSettings(settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleApprove = async (promptId: string) => {
    try {
      await moderatePrompt(promptId, 'approved');
      setPendingPrompts((prev) => prev.filter((p) => p.id !== promptId));
      setAllPrompts((prev) => prev.map((p) => (p.id === promptId ? { ...p, status: 'approved' } : p)));
      showFeedback('Prompt approved and published live.');
    } catch (err: any) {
      showFeedback('Error approving: ' + err.message);
    }
  };

  const handleReject = async (promptId: string) => {
    try {
      await moderatePrompt(promptId, 'rejected');
      setPendingPrompts((prev) => prev.filter((p) => p.id !== promptId));
      setAllPrompts((prev) => prev.map((p) => (p.id === promptId ? { ...p, status: 'rejected' } : p)));
      showFeedback('Prompt rejected.');
    } catch (err: any) {
      showFeedback('Error rejecting: ' + err.message);
    }
  };

  const handleToggleFeature = async (promptId: string) => {
    try {
      await moderatePrompt(promptId, 'feature_toggle');
      setAllPrompts((prev) =>
        prev.map((p) => (p.id === promptId ? { ...p, isFeatured: !p.isFeatured } : p))
      );
      showFeedback('Featured status updated.');
    } catch (err: any) {
      showFeedback('Error: ' + err.message);
    }
  };

  const handleDelete = async (promptId: string) => {
    if (!confirm('Are you sure you want to permanently delete this prompt?')) return;
    try {
      await deletePrompt(promptId);
      setPendingPrompts((prev) => prev.filter((p) => p.id !== promptId));
      setAllPrompts((prev) => prev.filter((p) => p.id !== promptId));
      showFeedback('Prompt deleted.');
    } catch (err: any) {
      showFeedback('Error: ' + err.message);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'reviewed' | 'dismissed') => {
    try {
      await updateReportStatus(reportId, action);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: action } : r))
      );
      showFeedback(`Report marked as ${action}.`);
    } catch (err: any) {
      showFeedback('Error updating report: ' + err.message);
    }
  };

  // Open Edit Prompt Modal
  const startEditPrompt = (p: Prompt) => {
    setEditingPrompt(p);
    setEditTitle(p.title);
    setEditDescription(p.description || '');
    setEditPromptText(p.promptText);
    setEditNegativePrompt(p.negativePrompt || '');
    setEditCategory(p.category);
    setEditModel(p.model);
    setEditTags(Array.isArray(p.tags) ? p.tags.join(', ') : '');
    setEditImageUrl(p.previewImageUrl || '');
    setEditStatus(p.status || 'approved');
    setEditFeatured(!!p.isFeatured);
  };

  // Gallery photo selection in Edit Prompt Modal
  const handleEditPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingEditPhoto(true);
    try {
      const compressed = await compressGalleryPhoto(file);
      setEditImageUrl(compressed);
      showFeedback('Photo selected and compressed from gallery.');
    } catch (err: any) {
      showFeedback('Error loading gallery photo: ' + err.message);
    } finally {
      setIsCompressingEditPhoto(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  // Save prompt edits
  const handleSavePromptEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt) return;

    setIsSavingPromptEdit(true);
    try {
      const tagsArray = editTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const updates: Partial<Prompt> = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        promptText: editPromptText.trim(),
        negativePrompt: editNegativePrompt.trim() || undefined,
        category: editCategory,
        model: editModel,
        tags: tagsArray,
        previewImageUrl: editImageUrl.trim(),
        status: editStatus,
        isFeatured: editFeatured
      };

      await updatePrompt(editingPrompt.id, updates);

      setAllPrompts((prev) =>
        prev.map((p) => (p.id === editingPrompt.id ? { ...p, ...updates } : p))
      );
      if (editStatus !== 'pending') {
        setPendingPrompts((prev) => prev.filter((p) => p.id !== editingPrompt.id));
      }

      showFeedback(`Prompt "${editTitle}" synced and published live across all users!`);
      setEditingPrompt(null);
    } catch (err: any) {
      showFeedback('Error saving prompt edit: ' + err.message);
    } finally {
      setIsSavingPromptEdit(false);
    }
  };

  // Save Site Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveSuccess(false);

    try {
      await saveSiteSettings(siteSettings);
      setSettingsSaveSuccess(true);
      showFeedback('All site settings, text, and details updated across the marketplace!');
      setTimeout(() => setSettingsSaveSuccess(false), 3000);
    } catch (err: any) {
      showFeedback('Error saving site settings: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetSettingsToDefault = () => {
    if (confirm('Are you sure you want to restore default site settings?')) {
      setSiteSettings(DEFAULT_SITE_SETTINGS);
      saveSiteSettings(DEFAULT_SITE_SETTINGS);
      showFeedback('Site settings restored to system defaults.');
    }
  };

  // Security gate
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <Lock className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Admin Access Restricted</h2>
        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
          The Admin Console is strictly guarded and requires verified administrator privileges.
          Only authenticated administrators can view or access this panel.
        </p>
      </div>
    );
  }

  const totalCopies = allPrompts.reduce((acc, p) => acc + (p.copiesCount || 0), 0);
  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Governance Console</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Superadmin: <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">{user?.email}</span> (Protected via ABAC & Whitelist)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenPublish && (
            <button
              onClick={onOpenPublish}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish Prompt</span>
            </button>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">Total Prompts</span>
          <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-white tabular-nums">
            {allPrompts.length}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-amber-500 block mb-1">Pending Moderation</span>
          <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {pendingPrompts.length}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">Total Copies / Uses</span>
          <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-white tabular-nums">
            {totalCopies}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-red-500 block mb-1">Open Reports</span>
          <span className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 tabular-nums">
            {pendingReportsCount}
          </span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 px-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'moderation'
              ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <span>Moderation Queue</span>
          {pendingPrompts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] font-mono">
              {pendingPrompts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <span>Prompt Catalog & Edit</span>
        </button>

        {/* Tab 5: Site Settings & Details */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Site Settings & Content</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <span>Flagged Reports</span>
          {pendingReportsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-[10px] font-mono">
              {pendingReportsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <span>Security & Deployment</span>
        </button>
      </div>

      {/* Tab 1: Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          {pendingPrompts.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Moderation Queue is Empty</h3>
              <p className="text-xs text-zinc-500 mt-1">All submitted AI prompts have been reviewed and resolved.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPrompts.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-20 h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                      {p.previewImageUrl ? (
                        <img src={p.previewImageUrl} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 text-[10px]">No Image</div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                        <span className="capitalize">{p.category}</span>
                        <span>·</span>
                        <span>{p.model}</span>
                        <span>·</span>
                        <span>Author: {p.authorName}</span>
                      </div>
                      <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">{p.title}</h3>
                      <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1">{p.promptText}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      onClick={() => onSelectPrompt(p)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => startEditPrompt(p)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    >
                      Edit Prompt
                    </button>
                    <button
                      onClick={() => handleReject(p.id)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(p.id)}
                      className="px-3.5 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-sm"
                    >
                      Approve & Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Prompt Catalog & Edit */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Showing all {allPrompts.length} database entries</span>
            <span>Click pencil icon to edit prompt text, category, or gallery image</span>
          </div>

          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Prompt</th>
                  <th className="py-2.5 px-3 font-medium">Model</th>
                  <th className="py-2.5 px-3 font-medium">Category</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium">Featured</th>
                  <th className="py-2.5 px-3 font-medium">Metrics</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {allPrompts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-3 max-w-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                          {p.previewImageUrl ? (
                            <img src={p.previewImageUrl} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-[9px]">Img</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-white truncate">{p.title}</p>
                          <p className="text-zinc-400 text-[11px] truncate">{p.authorName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono">{p.model}</td>
                    <td className="py-3 px-3 capitalize whitespace-nowrap">{p.category}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-mono capitalize ${
                          p.status === 'approved'
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                            : p.status === 'pending'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-500'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleFeature(p.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          p.isFeatured
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700'
                        }`}
                        title="Toggle Featured"
                      >
                        <Star className={`w-3.5 h-3.5 ${p.isFeatured ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono tabular-nums text-zinc-500">
                      {p.likesCount || 0}L · {p.copiesCount || 0}C
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEditPrompt(p)}
                          className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                          title="Edit Prompt Details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectPrompt(p)}
                          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          title="View Preview"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
                          title="Delete Prompt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Site Settings & Content Manager */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
          {/* Header & Save Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-zinc-500" />
                <span>Global Site Settings & Copy Manager</span>
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Edit website headlines, identity, contact information, and top announcement banner in real-time.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetSettingsToDefault}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold shadow-sm hover:bg-zinc-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingSettings ? 'Saving...' : 'Save All Settings'}</span>
              </button>
            </div>
          </div>

          {settingsSaveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>All site settings and text details saved successfully!</span>
            </div>
          )}

          {/* Section 1: Brand & Hero Copy */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Globe className="w-4 h-4 text-zinc-500" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Storefront Hero & Identity</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Marketplace Name
                </label>
                <input
                  type="text"
                  required
                  value={siteSettings.siteName}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tagline / Sub-label
                </label>
                <input
                  type="text"
                  value={siteSettings.tagline}
                  onChange={(e) => setSiteSettings({ ...siteSettings, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Hero Badge Text
              </label>
              <input
                type="text"
                value={siteSettings.heroBadge}
                onChange={(e) => setSiteSettings({ ...siteSettings, heroBadge: e.target.value })}
                placeholder="e.g. v2.5 Verified Catalog"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Hero Main Headline
              </label>
              <input
                type="text"
                required
                value={siteSettings.heroHeadline}
                onChange={(e) => setSiteSettings({ ...siteSettings, heroHeadline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Hero Description Paragraph
              </label>
              <textarea
                rows={3}
                required
                value={siteSettings.heroDescription}
                onChange={(e) => setSiteSettings({ ...siteSettings, heroDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Browse CTA Button Text
              </label>
              <input
                type="text"
                value={siteSettings.exploreBadgeText}
                onChange={(e) => setSiteSettings({ ...siteSettings, exploreBadgeText: e.target.value })}
                placeholder="e.g. Browse 1,200+ Prompts"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Section 2: Announcement Notice Banner */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Announcement Banner</h4>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={siteSettings.announcementActive}
                  onChange={(e) => setSiteSettings({ ...siteSettings, announcementActive: e.target.checked })}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 h-4 w-4"
                />
                <span className="font-medium text-zinc-700 dark:text-zinc-300 text-xs">
                  {siteSettings.announcementActive ? 'Banner Active' : 'Banner Disabled'}
                </span>
              </label>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Announcement Message
              </label>
              <input
                type="text"
                value={siteSettings.announcementText}
                onChange={(e) => setSiteSettings({ ...siteSettings, announcementText: e.target.value })}
                placeholder="e.g. 🔥 New FLUX.1 Schnell & Midjourney v6.1 verified prompts now live!"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Section 3: Contact & Business Details */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Mail className="w-4 h-4 text-blue-500" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Contact & Support Details</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={siteSettings.supportEmail}
                  onChange={(e) => setSiteSettings({ ...siteSettings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Contact / Business Email
                </label>
                <input
                  type="email"
                  value={siteSettings.contactEmail}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Contact Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={siteSettings.contactPhone}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Headquarters / Address
                </label>
                <input
                  type="text"
                  value={siteSettings.addressText}
                  onChange={(e) => setSiteSettings({ ...siteSettings, addressText: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Copyright Notice
                </label>
                <input
                  type="text"
                  value={siteSettings.copyrightText}
                  onChange={(e) => setSiteSettings({ ...siteSettings, copyrightText: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Social & Community Links */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Users className="w-4 h-4 text-emerald-500" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Community & Social Links</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Twitter / X Profile URL
                </label>
                <input
                  type="url"
                  value={siteSettings.twitterUrl}
                  onChange={(e) => setSiteSettings({ ...siteSettings, twitterUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Discord Server URL
                </label>
                <input
                  type="url"
                  value={siteSettings.discordUrl}
                  onChange={(e) => setSiteSettings({ ...siteSettings, discordUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={siteSettings.githubUrl}
                  onChange={(e) => setSiteSettings({ ...siteSettings, githubUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Google AdSense & Ads.txt Deployment Hub */}
          <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Google AdSense & Ads.txt Status Hub</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                ca-pub-8327085156281154
              </span>
            </div>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Google AdSense requires your site domain (<code>promptshouse.netlify.app</code>) to serve this exact <code>ads.txt</code> entry. If AdSense says &quot;Not found&quot;, it means Netlify hasn&apos;t received this updated file yet or Google&apos;s crawler is awaiting the next scan cycle.
            </p>

            {/* Ads.txt Code Box */}
            <div className="p-3 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-[11px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-zinc-800">
              <span className="select-all break-all text-amber-300">
                google.com, pub-8327085156281154, DIRECT, f08c47fec0942fa0
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyAdsTxt}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1.5 text-xs font-sans font-medium"
                >
                  {copiedAdsTxt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAdsTxt ? 'Copied!' : 'Copy Snippet'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAdsTxt}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-colors flex items-center gap-1.5 text-xs font-sans"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ads.txt</span>
                </button>
              </div>
            </div>

            {/* Netlify Deploy Helper & Dist Zip */}
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>Netlify Fast-Deploy Archive (Ready to Upload)</span>
                  </h5>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Download the complete production build containing <code>index.html</code> (AdSense meta + script) and <code>ads.txt</code> ready to drag &amp; drop onto Netlify.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadDistZip}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-1.5 text-xs shrink-0 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Site Build (.zip)</span>
                </button>
              </div>

              <div className="pt-2 text-[10px] text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>
                  💡 <strong>Direct Check:</strong> Visit <code>promptshouse.netlify.app/ads.txt</code> in browser. If it shows 404, upload this file to Netlify.
                </span>
                <a
                  href="https://app.netlify.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium shrink-0"
                >
                  <span>Open Netlify Deploys</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs shadow-md hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving Settings...' : 'Save All Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Flagged Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">No Flagged Reports</h3>
              <p className="text-xs text-zinc-500 mt-1">No community reports have been filed against marketplace content.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                        <span>Report #{r.id}</span>
                        <span>·</span>
                        <span>Target Prompt: {r.promptId}</span>
                        <span>·</span>
                        <span className="font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white">Reason: {r.reason}</p>
                      {r.details && <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{r.details}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResolveReport(r.id, 'dismissed')}
                      className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        handleDelete(r.promptId);
                        handleResolveReport(r.id, 'reviewed');
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold"
                    >
                      Delete Infringing Prompt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Security & Deployment Architecture */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 text-xs">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Security Architecture & Auditing</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            PromptNest uses zero-trust Attribute-Based Access Control (ABAC) in Google Cloud Firestore.
            All client write operations are guarded by deployed Firestore security rules.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Rule Enforcements</h3>
              <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
                <li>Public users can only view prompts with status == 'approved'</li>
                <li>Authors can view and update their own pending prompts</li>
                <li>Admins can approve, reject, feature, and delete any prompt</li>
                <li>Regular users cannot self-promote to admin role</li>
                <li>Interaction counters are isolated and guarded</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Bootstrapped Administrator</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Primary Superadmin:{' '}
                <span className="font-mono font-medium text-zinc-900 dark:text-white">{user?.email}</span>
              </p>
              <p className="text-zinc-500 text-[11px]">
                Configured via firestore.rules server-side whitelist.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Prompt Details */}
      {editingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setEditingPrompt(null)} />

          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  Edit Prompt: {editingPrompt.title}
                </h3>
                <p className="text-xs text-zinc-500">ID: {editingPrompt.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPrompt(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromptEdit} className="overflow-y-auto space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Prompt Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as PromptCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
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
                    AI Model
                  </label>
                  <select
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value as AIModel)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
                  >
                    {AI_MODELS_LIST.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Prompt Text
                </label>
                <textarea
                  rows={4}
                  required
                  value={editPromptText}
                  onChange={(e) => setEditPromptText(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Negative Prompt (Optional)
                </label>
                <input
                  type="text"
                  value={editNegativePrompt}
                  onChange={(e) => setEditNegativePrompt(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
                />
              </div>

              {/* Photo Preview & Gallery Uploader */}
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Preview Image (Gallery Photo or URL)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-14 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 shrink-0 bg-zinc-100 dark:bg-zinc-800">
                    {editImageUrl ? (
                      <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      placeholder="Image URL or choose from gallery"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-xs"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.heic"
                        onChange={handleEditPhotoSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload From Gallery</span>
                      </button>
                      {isCompressingEditPhoto && (
                        <span className="text-[10px] text-zinc-500 animate-pulse">Compressing photo...</span>
                      )}
                      {editImageUrl.startsWith('data:') && !isCompressingEditPhoto && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Optimized ({Math.round((editImageUrl.length * 0.75) / 1024)} KB) · Cloud Sync Ready</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
                  >
                    <option value="approved">Approved & Public</option>
                    <option value="pending">Pending Moderation</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFeatured}
                      onChange={(e) => setEditFeatured(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 h-4 w-4"
                    />
                    <span className="font-semibold text-zinc-900 dark:text-white">Feature on Marketplace</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPrompt(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPromptEdit}
                  className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSavingPromptEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
