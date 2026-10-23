import React from 'react';

interface FooterProps {
  setCurrentView: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView }) => {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-100 dark:border-zinc-800/80 text-xs">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black flex items-center justify-center text-xs">
                P
              </span>
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">PromptNest</span>
            </div>
            <p className="text-zinc-500 leading-relaxed max-w-xs">
              The premier curated marketplace for verified, high-performance generative AI prompts.
            </p>
          </div>

          {/* Explore Links */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
              Marketplace
            </h4>
            <ul className="space-y-2 text-zinc-500 dark:text-zinc-400">
              <li>
                <button onClick={() => setCurrentView('explore')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Explore All Prompts
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('categories')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Categories & Domains
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('creators')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Featured Creators
                </button>
              </li>
            </ul>
          </div>

          {/* Models */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
              Supported Models
            </h4>
            <ul className="space-y-2 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
              <li>Midjourney v6.1 & Niji</li>
              <li>FLUX.1 Schnell & Dev</li>
              <li>Stable Diffusion XL</li>
              <li>Claude 3.5 Sonnet & GPT-4o</li>
              <li>Runway Gen-3 & Sora</li>
            </ul>
          </div>

          {/* Governance & Trust */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
              Platform & Trust
            </h4>
            <ul className="space-y-2 text-zinc-500 dark:text-zinc-400">
              <li>
                <button onClick={() => setCurrentView('about')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  About PromptNest
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('contact')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Contact & Support
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('privacy')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('terms')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Quiet copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>© {new Date().getFullYear()} PromptNest Marketplace. Built with Google Cloud Firestore.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('privacy')} className="hover:text-zinc-600 dark:hover:text-zinc-300">
              Privacy
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setCurrentView('terms')} className="hover:text-zinc-600 dark:hover:text-zinc-300">
              Terms
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setCurrentView('contact')} className="hover:text-zinc-600 dark:hover:text-zinc-300">
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
