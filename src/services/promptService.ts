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
  orderBy,
  limit,
  increment,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase.ts';
import { Prompt, Bookmark, ReportItem, PromptCategory, AIModel, SortOption } from '../types/index.ts';
import { SEED_PROMPTS } from '../data/seedData.ts';

const PROMPTS_COLLECTION = 'prompts';
const REPORTS_COLLECTION = 'reports';

// Error handler helper matching Firebase skill guidelines
function handleFirestoreError(error: unknown, operation: string, path: string): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errorPayload = {
    error: errMessage,
    operationType: operation,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    }
  };
  console.error('Firestore Error:', JSON.stringify(errorPayload));
  throw new Error(errMessage);
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
      console.log('Seeding initial prompts to Firestore...');
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
      console.log('Initial prompts seeded successfully.');
    }
  } catch (err) {
    console.warn('Initial seed skipped or failed (will use client fallback):', err);
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

    // Limit to safe quantity
    const maxItems = options?.limitCount || 50;
    q = query(q, limit(maxItems));

    const snap = await getDocs(q);
    let results: Prompt[] = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
      } as Prompt;
    });

    // If Firestore has no documents yet or fails due to network, fall back to seed data
    if (results.length === 0 && (!options?.authorId)) {
      results = [...SEED_PROMPTS];
      if (options?.category && options.category !== 'all') {
        results = results.filter((p) => p.category === options.category);
      }
      if (options?.model && options.model !== 'all') {
        results = results.filter((p) => p.model === options.model);
      }
    }

    // Client-side text search (Firestore does not have native substring search)
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
      // 'trending' combines likes + copies
      const trendA = (a.likesCount || 0) * 2 + (a.copiesCount || 0);
      const trendB = (b.likesCount || 0) * 2 + (b.copiesCount || 0);
      return trendB - trendA;
    });

    return results;
  } catch (error) {
    console.warn('Error fetching prompts from Firestore, falling back to local dataset:', error);
    let fallback = [...SEED_PROMPTS];
    if (options?.category && options.category !== 'all') {
      fallback = fallback.filter((p) => p.category === options.category);
    }
    if (options?.model && options.model !== 'all') {
      fallback = fallback.filter((p) => p.model === options.model);
    }
    if (options?.searchQuery?.trim()) {
      const qLower = options.searchQuery.toLowerCase().trim();
      fallback = fallback.filter((p) => p.title.toLowerCase().includes(qLower) || p.promptText.toLowerCase().includes(qLower));
    }
    return fallback;
  }
}

// Fetch a single prompt by ID
export async function getPromptById(id: string): Promise<Prompt | null> {
  try {
    const docRef = doc(db, PROMPTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Prompt;
    }
    // Check seed prompts
    const local = SEED_PROMPTS.find((p) => p.id === id);
    return local || null;
  } catch (err) {
    const local = SEED_PROMPTS.find((p) => p.id === id);
    return local || null;
  }
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
    // If published by admin, automatically approved; otherwise 'pending'
    status: isAdmin ? 'approved' : 'pending',
    likesCount: 0,
    bookmarksCount: 0,
    copiesCount: 0,
    viewsCount: 1,
    createdAt: now,
    updatedAt: now
  };

  try {
    const docRef = doc(db, PROMPTS_COLLECTION, promptId);
    await setDoc(docRef, newDoc);
    return promptId;
  } catch (error) {
    handleFirestoreError(error, 'create', `${PROMPTS_COLLECTION}/${promptId}`);
  }
}

// Update prompt (author or admin)
export async function updatePrompt(id: string, updates: Partial<Prompt>): Promise<void> {
  try {
    const docRef = doc(db, PROMPTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, 'update', `${PROMPTS_COLLECTION}/${id}`);
  }
}

// Delete prompt
export async function deletePrompt(id: string): Promise<void> {
  try {
    const docRef = doc(db, PROMPTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, 'delete', `${PROMPTS_COLLECTION}/${id}`);
  }
}

// Real Likes Persistence
export async function checkUserLiked(promptId: string, userId: string): Promise<boolean> {
  if (!userId) return false;
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

  const likeRef = doc(db, `${PROMPTS_COLLECTION}/${promptId}/likes/${userId}`);
  const promptRef = doc(db, PROMPTS_COLLECTION, promptId);

  try {
    const likeSnap = await getDoc(likeRef);
    const currentlyLiked = likeSnap.exists();

    if (currentlyLiked) {
      // Remove like
      await deleteDoc(likeRef);
      await updateDoc(promptRef, { likesCount: increment(-1) });
      const promptSnap = await getDoc(promptRef);
      const newCount = promptSnap.exists() ? promptSnap.data()?.likesCount ?? 0 : 0;
      return { liked: false, newCount: Math.max(0, newCount) };
    } else {
      // Add like
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
    handleFirestoreError(error, 'write', `${PROMPTS_COLLECTION}/${promptId}/likes/${userId}`);
  }
}

// Real Bookmarks Persistence
export async function checkUserBookmarked(promptId: string, userId: string): Promise<boolean> {
  if (!userId) return false;
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

  const bookmarkRef = doc(db, `users/${userId}/bookmarks/${prompt.id}`);
  const promptRef = doc(db, PROMPTS_COLLECTION, prompt.id);

  try {
    const snap = await getDoc(bookmarkRef);
    const currentlyBookmarked = snap.exists();

    if (currentlyBookmarked) {
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
  } catch (error) {
    handleFirestoreError(error, 'write', `users/${userId}/bookmarks/${prompt.id}`);
  }
}

// Fetch all bookmarks for a user
export async function fetchUserBookmarks(userId: string): Promise<Bookmark[]> {
  try {
    const colRef = collection(db, `users/${userId}/bookmarks`);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as Bookmark);
  } catch {
    return [];
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
  try {
    const docRef = doc(db, REPORTS_COLLECTION, reportId);
    await setDoc(docRef, {
      ...report,
      id: reportId,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return reportId;
  } catch (error) {
    handleFirestoreError(error, 'create', `${REPORTS_COLLECTION}/${reportId}`);
  }
}

// Admin Operations
export async function fetchAllReports(): Promise<ReportItem[]> {
  try {
    const snap = await getDocs(collection(db, REPORTS_COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReportItem));
  } catch {
    return [];
  }
}

export async function updateReportStatus(reportId: string, status: 'reviewed' | 'dismissed'): Promise<void> {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, 'update', `${REPORTS_COLLECTION}/${reportId}`);
  }
}

export async function fetchPendingPrompts(): Promise<Prompt[]> {
  try {
    const q = query(collection(db, PROMPTS_COLLECTION), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prompt));
  } catch {
    return [];
  }
}

export async function moderatePrompt(promptId: string, action: 'approved' | 'rejected' | 'feature_toggle'): Promise<void> {
  const docRef = doc(db, PROMPTS_COLLECTION, promptId);
  try {
    if (action === 'feature_toggle') {
      const snap = await getDoc(docRef);
      const isFeat = snap.exists() ? !!snap.data()?.isFeatured : false;
      await updateDoc(docRef, { isFeatured: !isFeat });
    } else {
      await updateDoc(docRef, { status: action });
    }
  } catch (error) {
    handleFirestoreError(error, 'update', `${PROMPTS_COLLECTION}/${promptId}`);
  }
}
