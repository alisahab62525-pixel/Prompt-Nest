import React, { useState } from 'react';
import { submitReport } from '../services/promptService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldCheck,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Users,
  Compass,
  FileText
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-3 text-center sm:text-left">
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">About PromptNest</span>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          The Marketplace for Verified AI Engineering Prompts
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
          PromptNest was created to elevate generative AI workflows from random guesswork to disciplined, repeatable creative craft. Every prompt in our catalog is benchmarked across state-of-the-art vision and language models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
          <Sparkles className="w-6 h-6 text-zinc-900 dark:text-white mb-2" />
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Tested Models</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Optimized specifically for Midjourney v6.1, FLUX.1 Dev, Stable Diffusion XL, Claude 3.5 Sonnet, GPT-4o, and Sora video generators.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
          <ShieldCheck className="w-6 h-6 text-zinc-900 dark:text-white mb-2" />
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Quality Moderation</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            All submitted prompts undergo rigorous review before appearing in public collections, preserving high signal-to-noise quality.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
          <Compass className="w-6 h-6 text-zinc-900 dark:text-white mb-2" />
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Creator First</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Follow favorite engineers, track copy metrics, collect bookmarks, and build a verified reputation as a prompt artisan.
          </p>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Contact & Support</h1>
        <p className="text-xs text-zinc-500">
          Have inquiries regarding platform moderation, creator partnerships, or technical issues? Send us a message.
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        {sent ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">Message Transmitted</h3>
            <p className="text-xs text-zinc-500">
              Thank you for reaching out. Our support team will respond to {email} within 24 business hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold shadow-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Privacy Policy</h1>
    <p>Last updated: October 2026</p>
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">1. Information We Collect</h2>
      <p>
        When you register for PromptNest using Google OAuth or Email/Password, we store basic profile credentials (display name, email address, avatar URL). Public activity such as published prompts, likes, and bookmarks are stored in Firestore.
      </p>
    </section>
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">2. How Information is Used</h2>
      <p>
        We use your account details solely to authenticate you, personalize your bookmarking workflow, attribute authored prompts to your profile, and protect the marketplace against abuse.
      </p>
    </section>
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">3. Data Retention & Erasure</h2>
      <p>
        You have the right to request deletion of your account and authored prompt history at any time through our contact portal or user settings.
      </p>
    </section>
  </div>
);

export const TermsOfServicePage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Terms of Service</h1>
    <p>Last updated: October 2026</p>
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">1. Prompt Licensing & Rights</h2>
      <p>
        By publishing prompts to PromptNest, you grant PromptNest and its global users a non-exclusive license to inspect, copy, test, and adapt the prompt text for generative AI outputs.
      </p>
    </section>
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">2. Prohibited Content</h2>
      <p>
        Prompts promoting non-consensual imagery, hate speech, malicious malware generation, or copyright infringement will be rejected or purged immediately.
      </p>
    </section>
  </div>
);

export const ReportModal: React.FC<{
  promptId: string;
  promptTitle: string;
  onClose: () => void;
}> = ({ promptId, promptTitle, onClose }) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('Inappropriate / NSFW');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitReport({
        promptId,
        promptTitle,
        reporterId: user ? user.uid : 'anonymous',
        reporterEmail: user?.email || undefined,
        reason,
        details
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 z-10 text-xs">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-700">
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Report Filed</h3>
            <p className="text-zinc-500 text-xs">
              Thank you for keeping PromptNest safe. Our admin moderation team will review this prompt.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Report Content</h3>
              </div>
              <p className="text-zinc-500">Reporting: <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate block">{promptTitle}</span></p>
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Reason for Report</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
              >
                <option value="Inappropriate / NSFW">Inappropriate or NSFW content</option>
                <option value="Copyright or Plagiarism">Copyright or Plagiarism</option>
                <option value="Misleading or Broken Prompt">Misleading or broken prompt</option>
                <option value="Harassment or Hate Speech">Harassment or hate speech</option>
                <option value="Spam or Advertising">Spam or promotional abuse</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Additional Context</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Describe why this prompt violates platform policies..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'File Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
