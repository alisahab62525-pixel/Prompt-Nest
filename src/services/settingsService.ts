import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { SiteSettings } from '../types/index.ts';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'PromptNest',
  tagline: 'Curated AI Prompt Engineering',
  heroBadge: 'v2.5 Catalog',
  heroHeadline: 'Discover tested prompts for Midjourney, FLUX, and LLMs.',
  heroDescription: 'PromptNest is the verified catalog for creators and developers. Copy production-grade prompts, test parameters, and publish your own craft.',
  exploreBadgeText: 'Browse 1,200+ Prompts',
  supportEmail: 'support@promptnest.ai',
  contactEmail: 'contact@promptnest.ai',
  contactPhone: '+1 (555) 019-2834',
  addressText: 'San Francisco, CA & Neo-Tokyo Creative Cloud',
  copyrightText: '© 2026 PromptNest AI. All rights reserved.',
  announcementActive: true,
  announcementText: '🔥 New FLUX.1 Schnell & Midjourney v6.1 verified prompts now live in the catalog!',
  announcementLink: '',
  twitterUrl: 'https://twitter.com',
  discordUrl: 'https://discord.com',
  githubUrl: 'https://github.com'
};

const SETTINGS_STORAGE_KEY = 'promptnest_site_settings';

export async function fetchSiteSettings(): Promise<SiteSettings> {
  // Check local cache first for instant render
  try {
    const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Try to sync with firestore in background
      try {
        const snap = await getDoc(doc(db, 'settings', 'site_config'));
        if (snap.exists()) {
          const fresh = snap.data() as SiteSettings;
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(fresh));
          return { ...DEFAULT_SITE_SETTINGS, ...fresh };
        }
      } catch {}
      return { ...DEFAULT_SITE_SETTINGS, ...parsed };
    }
  } catch {}

  // Otherwise fetch from Firestore
  try {
    const snap = await getDoc(doc(db, 'settings', 'site_config'));
    if (snap.exists()) {
      const data = snap.data() as SiteSettings;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
      return { ...DEFAULT_SITE_SETTINGS, ...data };
    }
  } catch (err) {
    console.warn('Using default site settings:', err);
  }

  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SITE_SETTINGS));
  return DEFAULT_SITE_SETTINGS;
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const updated = { ...settings, updatedAt: new Date().toISOString() };
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

  // Trigger cross-component update event
  window.dispatchEvent(new CustomEvent('promptnest_settings_updated', { detail: updated }));

  try {
    const docRef = doc(db, 'settings', 'site_config');
    await setDoc(docRef, updated, { merge: true });
  } catch (err) {
    console.warn('Saved settings to local storage:', err);
  }
}
