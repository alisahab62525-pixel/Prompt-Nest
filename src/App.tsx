import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { PromptCard } from './components/PromptCard.tsx';
import { PromptDetailModal } from './components/PromptDetailModal.tsx';
import { PublishModal } from './components/PublishModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { UserProfileView } from './components/UserProfileView.tsx';
import { AboutPage, ContactPage, PrivacyPolicyPage, TermsOfServicePage, ReportModal } from './components/StaticPages.tsx';
import { fetchPrompts } from './services/promptService.ts';
import { fetchSiteSettings, DEFAULT_SITE_SETTINGS } from './services/settingsService.ts';
import { Prompt, PromptCategory, AIModel, SortOption, SiteSettings } from './types/index.ts';
import { CATEGORIES_LIST, AI_MODELS_LIST } from './data/seedData.ts';
import { AdsterraBanner } from './components/AdsterraBanner.tsx';
import { AdsterraNativeBanner } from './components/AdsterraNativeBanner.tsx';
import { AdsterraSmartlinkButton } from './components/AdsterraSmartlink.tsx';
import { GoogleAdSenseUnit } from './components/GoogleAdSenseUnit.tsx';

// Verified generated hero visual asset
import heroPortraitImg from './assets/images/hero_ai_portrait_1792731508078.jpg';

import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  Users,
  Compass,
  Check,
  ChevronDown,
  Layers,
  Filter
} from 'lucide-react';

const CREATORS_LIST = [
  {
    id: 'creator-elena',
    name: 'Elena Rostova',
    handle: '@elena_ai',
    specialty: 'Fashion & Chiaroscuro Portraiture',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    followers: 1420,
    promptsCount: 28
  },
  {
    id: 'creator-arata',
    name: 'Arata Kenji',
    handle: '@arata_neotokyo',
    specialty: 'Cyberpunk Architecture & Environments',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    followers: 2850,
    promptsCount: 41
  },
  {
    id: 'creator-dev',
    name: 'Alex Thorne',
    handle: '@thorne_architect',
    specialty: 'TypeScript & LLM System Engineering',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    followers: 3910,
    promptsCount: 56
  },
  {
    id: 'creator-clara',
    name: 'Clara Dubois',
    handle: '@clara_botanicals',
    specialty: 'Macro Glass & Fine Art Flora',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    followers: 1890,
    promptsCount: 19
  }
];

function MarketplaceApp() {
  const { user, isAdmin } = useAuth();

  const [currentView, setCurrentView] = useState<string>('home');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('promptnest_theme') === 'dark' || true;
  });

  // Site content & copy settings (customizable via Admin Dashboard)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    fetchSiteSettings().then(setSiteSettings);
    const handleSettingsUpdated = (e: any) => {
      if (e.detail) setSiteSettings(e.detail);
    };
    window.addEventListener('promptnest_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('promptnest_settings_updated', handleSettingsUpdated);
  }, []);

  // Strict admin guard: automatically bounce non-admins from admin view
  useEffect(() => {
    if (currentView === 'admin' && !isAdmin) {
      setCurrentView('home');
    }
  }, [currentView, isAdmin]);

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);
  const [reportModalData, setReportModalData] = useState<{ id: string; title: string } | null>(null);

  // Search & Filter state for Explore page
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all');
  const [selectedModel, setSelectedModel] = useState<AIModel | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('trending');

  // Pagination for Explore
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Apply dark mode class to root document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('promptnest_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('promptnest_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Load prompts from Firestore
  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await fetchPrompts({
        category: selectedCategory,
        model: selectedModel,
        searchQuery,
        sortBy,
        onlyApproved: true
      });
      setPrompts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, [selectedCategory, selectedModel, sortBy, searchQuery]);

  // Check URL param for direct prompt linking (e.g. ?prompt=id)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promptId = params.get('prompt');
    if (promptId && prompts.length > 0) {
      const found = prompts.find((p) => p.id === promptId);
      if (found) setSelectedPrompt(found);
    }
  }, [prompts]);

  const featuredPrompts = prompts.filter((p) => p.isFeatured).slice(0, 6);
  const trendingPrompts = [...prompts].sort((a, b) => (b.copiesCount || 0) - (a.copiesCount || 0)).slice(0, 6);
  const latestPrompts = [...prompts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const displayedExplorePrompts = prompts.slice(0, visibleCount);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
      {/* Top Announcement Notice Banner (Controlled via Admin Panel) */}
      {siteSettings.announcementActive && siteSettings.announcementText && (
        <div className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 py-1.5 px-4 text-center text-[11px] font-medium tracking-wide flex items-center justify-center gap-2 border-b border-zinc-800 dark:border-zinc-200">
          <span>{siteSettings.announcementText}</span>
        </div>
      )}

      {/* Top Bar Contract Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenPublish={() => setPublishModalOpen(true)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {/* VIEW 1: HOME PAGE */}
        {currentView === 'home' && (
          <div className="space-y-16 pb-12">
            {/* Storefront Hero Section: 2-column balanced split */}
            <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 pt-10 pb-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  {/* Left Column: Headline & Action */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <span>{siteSettings.tagline}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-zinc-900 dark:text-white">{siteSettings.heroBadge}</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]" style={{ textWrap: 'balance' }}>
                      {siteSettings.heroHeadline}
                    </h1>

                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                      {siteSettings.heroDescription}
                    </p>

                    {/* Integrated Search Input in Hero */}
                    <div className="pt-2 max-w-xl">
                      <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-4" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setCurrentView('explore');
                            }
                          }}
                          placeholder="Search photorealism, architecture, Claude coding, cyberpunk..."
                          className="w-full pl-11 pr-28 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 shadow-sm"
                        />
                        <button
                          onClick={() => setCurrentView('explore')}
                          className="absolute right-2 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition-colors"
                        >
                          Explore
                        </button>
                      </div>
                    </div>

                    {/* Primary CTAs */}
                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <button
                        onClick={() => setCurrentView('explore')}
                        className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <span>{siteSettings.exploreBadgeText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (!user) setAuthModalOpen(true);
                          else setPublishModalOpen(true);
                        }}
                        className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors"
                      >
                        Publish a Prompt
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Hero High-Fidelity Asset Card */}
                  <div className="lg:col-span-5">
                    <div
                      onClick={() => {
                        const heroPrompt = prompts.find((p) => p.id === 'seed-portrait-amber') || prompts[0];
                        if (heroPrompt) setSelectedPrompt(heroPrompt);
                      }}
                      className="group cursor-pointer rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md hover:shadow-xl transition-all"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={heroPortraitImg}
                          alt="Hero AI Portrait"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono text-white">
                          Featured Spotlight
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                          <span>Photography</span>
                          <span>·</span>
                          <span>Midjourney v6.1</span>
                          <span>·</span>
                          <span>Elena Rostova</span>
                        </div>
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                          High-Fashion Royal Portraiture in Chiaroscuro
                        </h2>
                        <p className="mt-1 text-xs text-zinc-500 line-clamp-2 font-mono">
                          Cinematic high-contrast editorial portrait with volumetric amber & teal lighting...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantitative Proof Strip */}
                <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                  <div>
                    <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white tabular-nums">1,240+</span>
                    <span className="block text-zinc-500 mt-0.5">Verified Prompts</span>
                  </div>
                  <div>
                    <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white tabular-nums">10</span>
                    <span className="block text-zinc-500 mt-0.5">Tested AI Engines</span>
                  </div>
                  <div>
                    <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white tabular-nums">48k+</span>
                    <span className="block text-zinc-500 mt-0.5">Total Copies & Runs</span>
                  </div>
                  <div>
                    <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white tabular-nums">100%</span>
                    <span className="block text-zinc-500 mt-0.5">Zero-Plagiarism Screened</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Adsterra Monetization: 468x60 (Desktop/Tablet 31882355) and 320x50 (Mobile 31882359) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
              <div className="hidden sm:flex justify-center">
                <AdsterraBanner size="468x60" />
              </div>
              <div className="sm:hidden flex justify-center">
                <AdsterraBanner size="320x50" />
              </div>
            </div>

            {/* Category Navigation Strip */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Explore by Creative Domain
                </h2>
                <button
                  onClick={() => setCurrentView('categories')}
                  className="text-xs font-semibold text-zinc-900 dark:text-white hover:underline flex items-center gap-1"
                >
                  <span>View All 10 Categories</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Functional interactive filter tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentView('explore');
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 whitespace-nowrap shrink-0 shadow-sm"
                >
                  All Domains
                </button>
                {CATEGORIES_LIST.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentView('explore');
                    }}
                    className="px-3.5 py-2 text-xs font-medium rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors whitespace-nowrap shrink-0"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Featured Prompts Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-current" />
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Featured Selections</h2>
                </div>
                <button
                  onClick={() => setCurrentView('explore')}
                  className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  See All Prompts
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPrompts.map((p) => (
                  <PromptCard
                    key={p.id}
                    prompt={p}
                    onSelect={setSelectedPrompt}
                    onOpenAuth={() => setAuthModalOpen(true)}
                  />
                ))}
              </div>
            </section>

            {/* Mid-Page Monetization Section: 300x250 Banner (31882356) + Smartlink Card (31882354) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex justify-center">
                  <AdsterraBanner size="300x250" />
                </div>
                <div className="flex flex-col justify-center">
                  <AdsterraSmartlinkButton variant="card" />
                </div>
              </div>
            </section>

            {/* Trending Prompts Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Trending This Week</h2>
                </div>
                <button
                  onClick={() => {
                    setSortBy('copies');
                    setCurrentView('explore');
                  }}
                  className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  Most Copied
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingPrompts.map((p) => (
                  <PromptCard
                    key={p.id}
                    prompt={p}
                    onSelect={setSelectedPrompt}
                    onOpenAuth={() => setAuthModalOpen(true)}
                  />
                ))}
              </div>
            </section>

            {/* Featured Creators Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Top Prompt Artisans</h2>
                </div>
                <button
                  onClick={() => setCurrentView('creators')}
                  className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  View Directory
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {CREATORS_LIST.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img src={c.avatar} alt={c.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700" />
                      <div>
                        <h3 className="font-semibold text-xs text-zinc-900 dark:text-white">{c.name}</h3>
                        <p className="text-[11px] text-zinc-400 font-mono">{c.handle}</p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2">{c.specialty}</p>
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{c.promptsCount} Prompts</span>
                      <span className="font-mono tabular-nums">{c.followers} Followers</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Google AdSense Responsive Display Unit */}
            <div className="max-w-5xl mx-auto px-4">
              <GoogleAdSenseUnit />
            </div>

            {/* Adsterra Native Banner (31882352) */}
            <AdsterraNativeBanner />
          </div>
        )}

        {/* VIEW 2: EXPLORE PAGE */}
        {currentView === 'explore' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header with Search and Title */}
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
                Explore Prompt Marketplace
              </h1>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prompts by keyword, technique, or author..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 shadow-sm"
                />
              </div>
            </div>

            {/* Filter Bar */}
            <div className="space-y-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              {/* Categories Tabs */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                  Categories
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === 'all'
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    All Categories
                  </button>
                  {CATEGORIES_LIST.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Models Tabs */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                  AI Model
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedModel('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedModel === 'all'
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    All Models
                  </button>
                  {AI_MODELS_LIST.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedModel(m as AIModel)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors whitespace-nowrap ${
                        selectedModel === m
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting and Active Count */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-zinc-500">
                  Showing <strong className="text-zinc-900 dark:text-white tabular-nums">{displayedExplorePrompts.length}</strong> of{' '}
                  <span className="tabular-nums">{prompts.length}</span> matching prompts
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none"
                  >
                    <option value="trending">Trending & Popular</option>
                    <option value="newest">Newest First</option>
                    <option value="likes">Most Liked</option>
                    <option value="copies">Most Copied</option>
                  </select>
                </div>
              </div>
            </div>

              {/* Prompts Layout: Grid + Desktop Skyscraper Ad Gutter */}
              <div className="flex flex-col xl:flex-row gap-8 items-start">
                <div className="flex-1 w-full space-y-6">
                  {/* Prompts Grid */}
                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 animate-pulse">
                          <div className="aspect-[4/3] bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
                          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : displayedExplorePrompts.length === 0 ? (
                    <div className="p-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
                      <Compass className="w-10 h-10 text-zinc-400 mx-auto" />
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">No Prompts Found</h3>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        No prompts matched your search query or filters. Try adjusting your search or clearing active filters.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setSelectedModel('all');
                        }}
                        className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedExplorePrompts.map((p) => (
                        <PromptCard
                          key={p.id}
                          prompt={p}
                          onSelect={setSelectedPrompt}
                          onOpenAuth={() => setAuthModalOpen(true)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Reliable Load-More behavior */}
                  {displayedExplorePrompts.length < prompts.length && (
                    <div className="pt-6 flex justify-center">
                      <button
                        onClick={() => setVisibleCount((prev) => prev + 12)}
                        className="px-6 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
                      >
                        Load More Prompts
                      </button>
                    </div>
                  )}
                </div>

                {/* Desktop Side Gutter: Skyscraper Banners (160x600 - 31882358 & 160x300 - 31882357) */}
                <aside className="hidden xl:flex flex-col gap-6 shrink-0 w-44 sticky top-24">
                  <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-2 bg-white dark:bg-zinc-900/50 flex flex-col items-center">
                    <AdsterraBanner size="160x600" />
                  </div>
                  <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-2 bg-white dark:bg-zinc-900/50 flex flex-col items-center">
                    <AdsterraBanner size="160x300" />
                  </div>
                </aside>
              </div>

              {/* Google AdSense Responsive Display Unit */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <GoogleAdSenseUnit />
              </div>

              {/* Adsterra Native Banner (31882352) */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <AdsterraNativeBanner />
              </div>
          </div>
        )}

        {/* VIEW 3: CATEGORIES OVERVIEW */}
        {currentView === 'categories' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Marketplace Categories</h1>
              <p className="text-xs text-zinc-500 mt-1 max-w-xl">
                Browse our taxonomy of generative AI applications, from photo-realism and video directions to production coding frameworks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {CATEGORIES_LIST.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentView('explore');
                  }}
                  className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white font-bold group-hover:scale-110 transition-transform">
                      <Layers className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-mono tabular-nums text-zinc-400">
                      {cat.count} Prompts
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                    {cat.label}
                  </h3>

                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    {cat.desc}
                  </p>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center text-xs font-semibold text-zinc-900 dark:text-white gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore Prompts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Adsterra Monetization: 468x60 / 320x50 Banner Strip */}
            <div className="pt-4 flex justify-center">
              <div className="hidden sm:block">
                <AdsterraBanner size="468x60" />
              </div>
              <div className="sm:hidden block">
                <AdsterraBanner size="320x50" />
              </div>
            </div>

            {/* Adsterra Native Banner (31882352) */}
            <AdsterraNativeBanner />
          </div>
        )}

        {/* VIEW 4: CREATORS DIRECTORY */}
        {currentView === 'creators' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Featured Prompt Artisans</h1>
              <p className="text-xs text-zinc-500 mt-1 max-w-xl">
                The leading prompt engineers, digital directors, and architects contributing to the PromptNest community.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {CREATORS_LIST.map((c) => (
                <div
                  key={c.id}
                  className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col items-center text-center">
                    <img src={c.avatar} alt={c.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-zinc-100 dark:ring-zinc-800 mb-3" />
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{c.name}</h3>
                    <p className="text-xs text-zinc-400 font-mono">{c.handle}</p>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center leading-relaxed">
                    {c.specialty}
                  </p>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                    <span>{c.promptsCount} Prompts</span>
                    <span className="font-mono tabular-nums">{c.followers} Followers</span>
                  </div>

                  <button
                    onClick={() => {
                      setSearchQuery(c.name);
                      setCurrentView('explore');
                    }}
                    className="w-full py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
                  >
                    View Published Prompts
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: USER DASHBOARD / PROFILE */}
        {currentView === 'profile' && (
          <UserProfileView
            onOpenPublish={() => setPublishModalOpen(true)}
            onSelectPrompt={setSelectedPrompt}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {/* VIEW 6: PROTECTED ADMIN CONSOLE (Guarded for malikbilal33877@gmail.com) */}
        {currentView === 'admin' && isAdmin && (
          <AdminDashboard
            onSelectPrompt={setSelectedPrompt}
            onOpenPublish={() => setPublishModalOpen(true)}
          />
        )}

        {/* VIEW 7: ABOUT */}
        {currentView === 'about' && <AboutPage />}

        {/* VIEW 8: CONTACT */}
        {currentView === 'contact' && <ContactPage />}

        {/* VIEW 9: PRIVACY POLICY */}
        {currentView === 'privacy' && <PrivacyPolicyPage />}

        {/* VIEW 10: TERMS OF SERVICE */}
        {currentView === 'terms' && <TermsOfServicePage />}
      </main>

      {/* Global Footer */}
      <Footer setCurrentView={setCurrentView} />

      {/* MODAL: PROMPT DETAIL INSPECTOR */}
      {selectedPrompt && (
        <PromptDetailModal
          prompt={selectedPrompt}
          onClose={() => {
            setSelectedPrompt(null);
            // Clean URL param
            const url = new URL(window.location.href);
            url.searchParams.delete('prompt');
            window.history.replaceState({}, '', url.toString());
          }}
          onOpenAuth={() => setAuthModalOpen(true)}
          onSelectPrompt={setSelectedPrompt}
          allPrompts={prompts}
          onOpenReport={(id, title) => setReportModalData({ id, title })}
        />
      )}

      {/* MODAL: PUBLISH PROMPT */}
      {publishModalOpen && (
        <PublishModal
          onClose={() => setPublishModalOpen(false)}
          onSuccess={(id) => {
            setPublishModalOpen(false);
            loadPrompts();
          }}
        />
      )}

      {/* MODAL: AUTHENTICATION (SIGN IN / SIGN UP) */}
      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} />
      )}

      {/* MODAL: REPORT CONTENT */}
      {reportModalData && (
        <ReportModal
          promptId={reportModalData.id}
          promptTitle={reportModalData.title}
          onClose={() => setReportModalData(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MarketplaceApp />
    </AuthProvider>
  );
}
