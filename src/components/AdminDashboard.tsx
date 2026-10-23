import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  fetchPendingPrompts,
  fetchPrompts,
  moderatePrompt,
  deletePrompt,
  fetchAllReports,
  updateReportStatus
} from '../services/promptService.ts';
import { Prompt, ReportItem } from '../types/index.ts';
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
  Lock
} from 'lucide-react';

export const AdminDashboard: React.FC<{
  onSelectPrompt: (p: Prompt) => void;
}> = ({ onSelectPrompt }) => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'moderation' | 'all' | 'reports' | 'audit'>('moderation');
  const [pendingPrompts, setPendingPrompts] = useState<Prompt[]>([]);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pending, all, rep] = await Promise.all([
        fetchPendingPrompts(),
        fetchPrompts({ onlyApproved: false, limitCount: 100 }),
        fetchAllReports()
      ]);
      setPendingPrompts(pending);
      setAllPrompts(all);
      setReports(rep);
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
    setTimeout(() => setActionFeedback(null), 3000);
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

  // Security gate
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <Lock className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Admin Access Restricted</h2>
        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
          The Admin Console is strictly guarded and requires verified administrator privileges.
          If you are the platform administrator, please ensure you are signed in with the bootstrapped administrator email.
        </p>
      </div>
    );
  }

  const totalLikes = allPrompts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const totalCopies = allPrompts.reduce((acc, p) => acc + (p.copiesCount || 0), 0);
  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Governance Console</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Superadmin: <span className="font-mono text-zinc-700 dark:text-zinc-300">{user?.email}</span> (Protected via Firestore ABAC Rules)
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {actionFeedback && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
          {actionFeedback}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">Total Prompts</span>
          <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-white tabular-nums">
            {allPrompts.length}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <span className="text-[11px] uppercase tracking-wider text-amber-500 block mb-1">Pending Moderation</span>
          <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {pendingPrompts.length}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">Total Copies / Uses</span>
          <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-white tabular-nums">
            {totalCopies}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <span className="text-[11px] uppercase tracking-wider text-red-500 block mb-1">Open Reports</span>
          <span className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 tabular-nums">
            {pendingReportsCount}
          </span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 px-1 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
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
          className={`pb-3 px-1 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <span>Prompt Catalog & Feature</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-1 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
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
          className={`pb-3 px-1 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
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
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-20 h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
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
                      Inspect
                    </button>
                    <button
                      onClick={() => handleReject(p.id)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
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

      {/* Tab 2: All Prompts & Feature Toggle */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="py-3 px-3">Prompt</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Featured</th>
                  <th className="py-3 px-3">Metrics</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {allPrompts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-3 max-w-xs">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate">{p.title}</p>
                      <p className="text-zinc-400 text-[11px]">{p.authorName}</p>
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
                          onClick={() => onSelectPrompt(p)}
                          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
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
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
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
    </div>
  );
};
