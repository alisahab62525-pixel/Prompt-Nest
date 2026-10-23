import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase.ts';
import { Prompt, Bookmark, ReportItem, PromptCategory, AIModel, SortOption } from '../types/index.ts';
import { SEED_PROMPTS } from '../data/seedData.ts';

const PROMPTS_COLLECTION = 'prompts';
const REPORTS_COLLECTION = 'reports';

function getLocalPrompts(): Prompt[] {
  try {
    const raw = localStorage.getItem('promptnest_local_prompts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPrompt(p: Prompt) {
  try {
    const current = getLocalPrompts();
    const updated = [p, ...current.filter((item) => item.id !== p.id)];
    localStorage.setItem('promptnest_local_prompts', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
}

// Auto-seed Firestore on first load if empty
let seedAttempted = false;
export async function seedInitialDataIfNeeded(): Promise<void> {
  if (seedAttempted) return;
  seedAttempted = true;

  try {
    const promptsCol = collection(db, PROMPTS_COLLECTION);
    const snap = await getDocs(query(promptsCol, limit(1)));
    if (snap.empty) {
      const batch = writeBatch(db);
      for (const p of SEED_PROMPTS) {
        const ref = doc(db, PROMPTS_COLLECTION, p.id);
        batch.set(ref, {
          ...p,
          status: 'approved',
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        });
      }
      await batch.commit();
    }
  } catch (err) {
    console.warn('Initial seed skipped or failed (using local seed data):', err);
  }
}

// Fetch prompts with filtering, search, and sorting
export async function fetchPrompts(options?: {
  category?: PromptCategory | 'all';
  model?: AIModel | 'all';
  searchQuery?: string;
  sortBy?: SortOption;
  onlyApproved?: boolean;
  authorId?: string;
  limitCount?: number;
}): Promise<Prompt[]> {
  await seedInitialDataIfNeeded();

  let firestoreResults: Prompt[] = [];

  try {
    const promptsCol = collection(db, PROMPTS_COLLECTION);
    let q = query(promptsCol);

    if (options?.authorId) {
      q = query(q, where('authorId', '==', options.authorId));
    } else if (options?.onlyApproved !== false) {
      q = query(q, where('status', '==', 'approved'));
    }

    if (options?.category && options.category !== 'all') {
      q = query(q, where('category', '==', options.category));
    }

    if (options?.model && options.model !== 'all') {
      q = query(q, where('model', '==', options.model));
    }

    const maxItems = options?.limitCount || 50;
    q = query(q, limit(maxItems));

    const snap = await getDocs(q);
    firestoreResults = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
      } as Prompt;
    });
  } catch (error) {
    console.warn('Firestore fetch query warning, using local dataset fallback:', error);
  }

  // Combine with seed prompts and any locally authored prompts
  const localAuthored = getLocalPrompts();
  const allCombinedMap = new Map<string, Prompt>();

  // 1. Seed prompts as base
  for (const p of SEED_PROMPTS) {
    allCombinedMap.set(p.id, p);
  }

  // 2. Firestore results
  for (const p of firestoreResults) {
    allCombinedMap.set(p.id, p);
  }

  // 3. Local created prompts
  for (const p of localAuthored) {
    allCombinedMap.set(p.id, p);
  }

  let results = Array.from(allCombinedMap.values());

  // Filter by author
  if (options?.authorId) {
    results = results.filter((p) => p.authorId === options.authorId);
  } else if (options?.onlyApproved !== false) {
    results = results.filter((p) => p.status === 'approved');
  }

  // Filter by category
  if (options?.category && options.category !== 'all') {
    results = results.filter((p) => p.category === options.category);
  }

  // Filter by model
  if (options?.model && options.model !== 'all') {
    results = results.filter((p) => p.model === options.model);
  }

  // Search filter
  if (options?.searchQuery?.trim()) {
    const qLower = options.searchQuery.toLowerCase().trim();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(qLower) ||
        p.description.toLowerCase().includes(qLower) ||
        p.promptText.toLowerCase().includes(qLower) ||
        p.tags?.some((t) => t.toLowerCase().includes(qLower)) ||
        p.authorName.toLowerCase().includes(qLower)
    );
  }

  // Sorting
  const sort = options?.sortBy || 'trending';
  results.sort((a, b) => {
    if (sort === 'likes') return (b.likesCount || 0) - (a.likesCount || 0);
    if (sort === 'copies') return (b.copiesCount || 0) - (a.copiesCount || 0);
    if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    const trendA = (a.likesCount || 0) * 2 + (a.copiesCount || 0);
    const trendB = (b.likesCount || 0) * 2 + (b.copiesCount || 0);
    return trendB - trendA;
  });

  return results;
}

// Fetch a single prompt by ID
export async function getPromptById(id: string): Promise<Prompt | null> {
  try {
    const docRef = doc(db, PROMPTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Prompt;
    }
  } catch (err) {
    // fallback
  }

  const localAuthored = getLocalPrompts().find((p) => p.id === id);
  if (localAuthored) return localAuthored;

  const localSeed = SEED_PROMPTS.find((p) => p.id === id);
  return localSeed || null;
}

// Create a new prompt (client & server validation)
export async function createPrompt(
  promptData: Omit<Prompt, 'id' | 'likesCount' | 'bookmarksCount' | 'copiesCount' | 'viewsCount' | 'createdAt' | 'updatedAt'>,
  isAdmin: boolean = false
): Promise<string> {
  if (!promptData.title?.trim()) throw new Error('Title is required.');
  if (!promptData.promptText?.trim()) throw new Error('Prompt text is required.');
  if (!promptData.category) throw new Error('Category is required.');
  if (!promptData.model) throw new Error('AI Model is required.');

  const promptId = 'prompt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const newDoc: Prompt = {
    ...promptData,
    id: promptId,
    status: isAdmin ? 'approved' : 'pending',
    likesCount: 0,
    bookmarksCount: 0,
    copiesCount: 0,
    viewsCount: 1,
    createdAt: now,
    updatedAt: now
  };

  saveLocalPrompt(newDoc);

  try {
    const docRef = doc(db, PROMPTS_COLLECTION, promptId);
    await setDoc(docRef, newDoc);
  } catch (error) {
    console.warn('Firestore prompt write queued locally:', error);
  }

  return promptId;
}

// Update prompt (author or admin)
export async function updatePrompt(id: string, updates: Partial<Prompt>): Promise<void> {
  const localList = getLocalPrompts();
  const target = localList.find((p) => p.id === id) || SEED_PROMPTS.find((p) => p.id === id);
  if (target) {
    saveLocalPrompt({ ...target, ...updates, updatedAt: new Date().toISOString() });
  }

  try {
    const docRef = doc(db, PROMPTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Update stored locally:', error);
  }
}

// Delete prompt
export async function deletePrompt(id: string): Promise<void> {
  try {
    const local = getLocalPrompts().filter((p) => p.id !== id);
    localStorage.setItem('promptnest_local_prompts', JSON.stringify(local));
  } catch {}

  try {
    const docRef = doc(db, PROMPTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Delete processed locally:', error);
  }
}

// Real Likes Persistence
export async function checkUserLiked(promptId: string, userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const localLikes = JSON.parse(localStorage.getItem(`likes_${userId}`) || '[]');
    if (localLikes.includes(promptId)) return true;
  } catch {}

  try {
    const likeDoc = doc(db, `${PROMPTS_COLLECTION}/${promptId}/likes/${userId}`);
    const snap = await getDoc(likeDoc);
    return snap.exists();
  } catch {
    return false;
  }
}

export async function toggleLikePrompt(promptId: string, userId: string): Promise<{ liked: boolean; newCount: number }> {
  if (!userId) throw new Error('Must be signed in to like.');

  let localLikes: string[] = [];
  try {
    localLikes = JSON.parse(localStorage.getItem(`likes_${userId}`) || '[]');
  } catch {}

  const currentlyLikedLocally = localLikes.includes(promptId);
  if (currentlyLikedLocally) {
    localLikes = localLikes.filter((id) => id !== promptId);
  } else {
    localLikes.push(promptId);
  }
  localStorage.setItem(`likes_${userId}`, JSON.stringify(localLikes));

  const likeRef = doc(db, `${PROMPTS_COLLECTION}/${promptId}/likes/${userId}`);
  const promptRef = doc(db, PROMPTS_COLLECTION, promptId);

  try {
    if (currentlyLikedLocally) {
      await deleteDoc(likeRef);
      await updateDoc(promptRef, { likesCount: increment(-1) });
      const promptSnap = await getDoc(promptRef);
      const newCount = promptSnap.exists() ? promptSnap.data()?.likesCount ?? 0 : 0;
      return { liked: false, newCount: Math.max(0, newCount) };
    } else {
      await setDoc(likeRef, {
        userId,
        promptId,
        createdAt: new Date().toISOString()
      });
      await updateDoc(promptRef, { likesCount: increment(1) });
      const promptSnap = await getDoc(promptRef);
      const newCount = promptSnap.exists() ? promptSnap.data()?.likesCount ?? 1 : 1;
      return { liked: true, newCount };
    }
  } catch (error) {
    return {
      liked: !currentlyLikedLocally,
      newCount: !currentlyLikedLocally ? 1 : 0
    };
  }
}

// Real Bookmarks Persistence
export async function checkUserBookmarked(promptId: string, userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const localBookmarks = JSON.parse(localStorage.getItem(`bookmarks_${userId}`) || '[]');
    if (localBookmarks.some((b: any) => b.promptId === promptId)) return true;
  } catch {}

  try {
    const bookmarkDoc = doc(db, `users/${userId}/bookmarks/${promptId}`);
    const snap = await getDoc(bookmarkDoc);
    return snap.exists();
  } catch {
    return false;
  }
}

export async function toggleBookmarkPrompt(prompt: Prompt, userId: string): Promise<{ bookmarked: boolean }> {
  if (!userId) throw new Error('Must be signed in to bookmark.');

  let localBookmarks: Bookmark[] = [];
  try {
    localBookmarks = JSON.parse(localStorage.getItem(`bookmarks_${userId}`) || '[]');
  } catch {}

  const alreadyBookmarked = localBookmarks.some((b) => b.promptId === prompt.id);
  if (alreadyBookmarked) {
    localBookmarks = localBookmarks.filter((b) => b.promptId !== prompt.id);
  } else {
    localBookmarks.push({
      promptId: prompt.id,
      userId,
      title: prompt.title,
      category: prompt.category,
      model: prompt.model,
      previewImageUrl: prompt.previewImageUrl,
      createdAt: new Date().toISOString()
    });
  }
  localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(localBookmarks));

  const bookmarkRef = doc(db, `users/${userId}/bookmarks/${prompt.id}`);
  const promptRef = doc(db, PROMPTS_COLLECTION, prompt.id);

  try {
    if (alreadyBookmarked) {
      await deleteDoc(bookmarkRef);
      await updateDoc(promptRef, { bookmarksCount: increment(-1) });
      return { bookmarked: false };
    } else {
      const bookmarkData: Bookmark = {
        promptId: prompt.id,
        userId,
        title: prompt.title,
        category: prompt.category,
        model: prompt.model,
        previewImageUrl: prompt.previewImageUrl,
        createdAt: new Date().toISOString()
      };
      await setDoc(bookmarkRef, bookmarkData);
      await updateDoc(promptRef, { bookmarksCount: increment(1) });
      return { bookmarked: true };
    }
  } catch {
    return { bookmarked: !alreadyBookmarked };
  }
}

// Fetch all bookmarks for a user
export async function fetchUserBookmarks(userId: string): Promise<Bookmark[]> {
  const localBookmarks = JSON.parse(localStorage.getItem(`bookmarks_${userId}`) || '[]');

  try {
    const colRef = collection(db, `users/${userId}/bookmarks`);
    const snap = await getDocs(colRef);
    const firestoreBookmarks = snap.docs.map((d) => d.data() as Bookmark);
    const map = new Map<string, Bookmark>();
    for (const b of localBookmarks) map.set(b.promptId, b);
    for (const b of firestoreBookmarks) map.set(b.promptId, b);
    return Array.from(map.values());
  } catch {
    return localBookmarks;
  }
}

// Real Copies counter increment
export async function incrementCopyCount(promptId: string): Promise<void> {
  try {
    const promptRef = doc(db, PROMPTS_COLLECTION, promptId);
    await updateDoc(promptRef, { copiesCount: increment(1) });
  } catch {
    // Non-blocking
  }
}

// Content Reporting
export async function submitReport(report: Omit<ReportItem, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const reportId = 'report_' + Date.now();
  const newReport: ReportItem = {
    ...report,
    id: reportId,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    const local = JSON.parse(localStorage.getItem('promptnest_reports') || '[]');
    localStorage.setItem('promptnest_reports', JSON.stringify([newReport, ...local]));
  } catch {}

  try {
    const docRef = doc(db, REPORTS_COLLECTION, reportId);
    await setDoc(docRef, newReport);
  } catch (error) {
    console.warn('Report recorded locally:', error);
  }

  return reportId;
}

// Admin Operations
export async function fetchAllReports(): Promise<ReportItem[]> {
  let localReports: ReportItem[] = [];
  try {
    localReports = JSON.parse(localStorage.getItem('promptnest_reports') || '[]');
  } catch {}

  try {
    const snap = await getDocs(collection(db, REPORTS_COLLECTION));
    const firestoreReports = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReportItem));
    const map = new Map<string, ReportItem>();
    for (const r of localReports) map.set(r.id, r);
    for (const r of firestoreReports) map.set(r.id, r);
    return Array.from(map.values());
  } catch {
    return localReports;
  }
}

export async function updateReportStatus(reportId: string, status: 'reviewed' | 'dismissed'): Promise<void> {
  try {
    const localReports = JSON.parse(localStorage.getItem('promptnest_reports') || '[]');
    const updated = localReports.map((r: any) => (r.id === reportId ? { ...r, status } : r));
    localStorage.setItem('promptnest_reports', JSON.stringify(updated));
  } catch {}

  try {
    const docRef = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.warn('Report updated locally:', error);
  }
}

export async function fetchPendingPrompts(): Promise<Prompt[]> {
  const all = await fetchPrompts({ onlyApproved: false, limitCount: 100 });
  return all.filter((p) => p.status === 'pending');
}

export async function moderatePrompt(promptId: string, action: 'approved' | 'rejected' | 'feature_toggle'): Promise<void> {
  const localList = getLocalPrompts();
  const target = localList.find((p) => p.id === promptId);
  if (target) {
    if (action === 'feature_toggle') {
      saveLocalPrompt({ ...target, isFeatured: !target.isFeatured });
    } else {
      saveLocalPrompt({ ...target, status: action });
    }
  }

  try {
    const docRef = doc(db, PROMPTS_COLLECTION, promptId);
    if (action === 'feature_toggle') {
      const snap = await getDoc(docRef);
      const isFeat = snap.exists() ? !!snap.data()?.isFeatured : false;
      await updateDoc(docRef, { isFeatured: !isFeat });
    } else {
      await updateDoc(docRef, { status: action });
    }
  } catch (error) {
    console.warn('Moderation action performed locally:', error);
  }
}
