import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Sparkles,
  Plus,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Bookmark,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenAuth: () => void;
  onOpenPublish: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenAuth,
  onOpenPublish,
  isDarkMode,
  toggleTheme
}) => {
  const { user, userProfile, isAdmin, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single element) */}
        <button
          onClick={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 text-left text-zinc-900 dark:text-white font-bold tracking-tight text-xl whitespace-nowrap shrink-0 group focus:outline-none"
        >
          <span className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-black text-base shadow-sm group-hover:scale-105 transition-transform">
            P
          </span>
          <span className="tracking-tight text-lg">PromptNest</span>
        </button>

        {/* Zone 2: Navigation Links (4-5 single-line clean text links) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <button
            onClick={() => setCurrentView('explore')}
            className={`whitespace-nowrap transition-colors hover:text-zinc-900 dark:hover:text-white ${
              currentView === 'explore' ? 'text-zinc-950 dark:text-white font-semibold underline underline-offset-8 decoration-2 decoration-zinc-900 dark:decoration-white' : ''
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setCurrentView('categories')}
            className={`whitespace-nowrap transition-colors hover:text-zinc-900 dark:hover:text-white ${
              currentView === 'categories' ? 'text-zinc-950 dark:text-white font-semibold underline underline-offset-8 decoration-2 decoration-zinc-900 dark:decoration-white' : ''
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setCurrentView('creators')}
            className={`whitespace-nowrap transition-colors hover:text-zinc-900 dark:hover:text-white ${
              currentView === 'creators' ? 'text-zinc-950 dark:text-white font-semibold underline underline-offset-8 decoration-2 decoration-zinc-900 dark:decoration-white' : ''
            }`}
          >
            Featured Creators
          </button>
          <button
            onClick={() => setCurrentView('about')}
            className={`whitespace-nowrap transition-colors hover:text-zinc-900 dark:hover:text-white ${
              currentView === 'about' ? 'text-zinc-950 dark:text-white font-semibold underline underline-offset-8 decoration-2 decoration-zinc-900 dark:decoration-white' : ''
            }`}
          >
            About
          </button>

          {isAdmin && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                currentView === 'admin'
                  ? 'text-zinc-950 dark:text-white font-semibold underline underline-offset-8'
                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action + Utility items */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Primary Action: Publish */}
          <button
            onClick={() => {
              if (!user) {
                onOpenAuth();
              } else {
                onOpenPublish();
              }
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Prompt</span>
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                {userProfile?.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.displayName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-700 dark:text-zinc-200">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1.5 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {userProfile?.displayName || 'User'}
                    </p>
                    <p className="text-zinc-500 truncate text-[11px]">{user.email}</p>
                    {isAdmin && (
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                        Admin Access
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentView('profile')}
                    className="w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-700 dark:text-zinc-300"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>My Dashboard & Prompts</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('profile');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-700 dark:text-zinc-300"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Saved Bookmarks</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setCurrentView('admin')}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin Moderation</span>
                    </button>
                  )}

                  <div className="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-3 pb-5 space-y-2 text-sm">
          <button
            onClick={() => {
              setCurrentView('explore');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-zinc-700 dark:text-zinc-300"
          >
            Explore
          </button>
          <button
            onClick={() => {
              setCurrentView('categories');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-zinc-700 dark:text-zinc-300"
          >
            Categories
          </button>
          <button
            onClick={() => {
              setCurrentView('creators');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-zinc-700 dark:text-zinc-300"
          >
            Featured Creators
          </button>
          <button
            onClick={() => {
              setCurrentView('about');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-zinc-700 dark:text-zinc-300"
          >
            About
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setCurrentView('admin');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 font-medium text-amber-600 dark:text-amber-400"
            >
              Admin Console
            </button>
          )}
          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (!user) onOpenAuth();
                else onOpenPublish();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Prompt</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
