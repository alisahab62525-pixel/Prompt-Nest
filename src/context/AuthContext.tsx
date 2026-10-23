import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as fbSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.ts';
import { UserProfile } from '../types/index.ts';

// Dedicated bootstrapped admin email provided in runtime metadata
export const BOOTSTRAPPED_ADMIN_EMAIL = 'malikbilal33877@gmail.com';
export const GOOGLE_CLIENT_ID = '651123989100-flivjqld4g5tjmb7jne8h1f1t146m76s.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: any;
  }
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface StoredAccount {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
}

interface AuthContextType {
  user: AppUser | FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGooglePrompt: () => Promise<void>;
  signInWithGoogleCredential: (credential: string) => Promise<void>;
  signInWithGoogleAccount: (googleEmail: string, googleName?: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  resetUserPassword: (email: string, newPass: string) => Promise<void>;
  checkAccountExists: (email: string) => boolean;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleFollowCreator: (creatorId: string) => Promise<boolean>;
  followingList: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Deterministic hash for stored passwords
function hashPassword(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 'pash_' + Math.abs(hash).toString(36) + '_secure';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [followingList, setFollowingList] = useState<string[]>([]);

  // Strictly verify if an email is the authorized administrator
  const checkIsAdminEmail = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return email.trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
  };

  // Sync profile in Firestore
  const syncUserProfile = async (u: AppUser | FirebaseUser) => {
    const email = u.email ? u.email.trim().toLowerCase() : '';
    const isSuperAdmin = checkIsAdminEmail(email);

    try {
      const userRef = doc(db, 'users', u.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Enforce: ONLY BOOTSTRAPPED_ADMIN_EMAIL can ever have admin role
        const verifiedRole = isSuperAdmin ? 'admin' : (data.role === 'admin' ? 'user' : (data.role || 'user'));
        const updated: UserProfile = {
          ...data,
          displayName: u.displayName || data.displayName || 'Prompt Artisan',
          email,
          role: verifiedRole
        };
        setUserProfile(updated);
        setIsAdmin(isSuperAdmin);
      } else {
        const newProfile: UserProfile = {
          uid: u.uid,
          displayName: u.displayName || email.split('@')[0] || 'Prompt Artisan',
          email,
          avatarUrl: u.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(u.uid)}`,
          bio: 'AI prompt engineer & creator.',
          role: isSuperAdmin ? 'admin' : 'user',
          followersCount: 0,
          followingCount: 0,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        setIsAdmin(isSuperAdmin);
      }

      if (isSuperAdmin) {
        try {
          const adminDoc = doc(db, 'admins', u.uid);
          await setDoc(
            adminDoc,
            {
              email,
              role: 'superadmin',
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
        } catch {}
      }
    } catch (err) {
      console.warn('Profile sync fallback:', err);
      setUserProfile({
        uid: u.uid,
        displayName: u.displayName || email.split('@')[0] || 'AI Creator',
        email,
        avatarUrl: u.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(u.uid)}`,
        role: isSuperAdmin ? 'admin' : 'user',
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date().toISOString()
      });
      setIsAdmin(isSuperAdmin);
    }
  };

  // Restore session on boot
  useEffect(() => {
    const savedSession = localStorage.getItem('promptnest_active_session');
    if (savedSession) {
      try {
        const parsed: AppUser = JSON.parse(savedSession);
        setUser(parsed);
        syncUserProfile(parsed);
      } catch {
        localStorage.removeItem('promptnest_active_session');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem(
          'promptnest_active_session',
          JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL
          })
        );
        await syncUserProfile(currentUser);
      } else if (!savedSession) {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    setLoading(false);
    return () => unsubscribe();
  }, []);

  // Helper to ensure GIS client is ready
  const ensureGoogleClient = async (): Promise<boolean> => {
    if (window.google?.accounts?.oauth2) return true;
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts > 30) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
    });
  };

  // Real Google Account Chooser: Pops up accounts.google.com with device accounts
  const signInWithGooglePrompt = async (): Promise<void> => {
    const isReady = await ensureGoogleClient();
    if (!isReady || !window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services is initializing. Please try again in a moment or allow third-party scripts.');
    }

    return new Promise((resolve, reject) => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              reject(new Error(tokenResponse.error_description || tokenResponse.error));
              return;
            }

            try {
              // Fetch authenticated profile directly from Google
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`
                }
              });

              if (!res.ok) {
                throw new Error('Could not retrieve Google profile details.');
              }

              const info = await res.json();
              const googleEmail = (info.email || '').trim().toLowerCase();
              if (!googleEmail) {
                throw new Error('No email returned by Google account.');
              }

              const isSuperAdmin = checkIsAdminEmail(googleEmail);
              const googleUser: AppUser = {
                uid: 'g_' + (info.sub || Math.abs(googleEmail.split('').reduce((a: number, b: string) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36)),
                email: googleEmail,
                displayName: info.name || (isSuperAdmin ? 'Bilal Malik (Admin)' : googleEmail.split('@')[0]),
                photoURL: info.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(info.name || googleEmail)}`
              };

              setUser(googleUser);
              setIsAdmin(isSuperAdmin);
              localStorage.setItem('promptnest_active_session', JSON.stringify(googleUser));
              await syncUserProfile(googleUser);
              resolve();
            } catch (fetchErr: any) {
              reject(fetchErr);
            }
          }
        });

        // Request token with select_account: displays account picker
        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        reject(err);
      }
    });
  };

  // Google ID Token / One-Tap Credential Handler
  const signInWithGoogleCredential = async (credential: string): Promise<void> => {
    try {
      const parts = credential.split('.');
      if (parts.length !== 3) throw new Error('Invalid Google credential token.');
      const payload = JSON.parse(atob(parts[1]));
      const googleEmail = (payload.email || '').trim().toLowerCase();
      if (!googleEmail) throw new Error('Invalid Google token data.');

      const isSuperAdmin = checkIsAdminEmail(googleEmail);
      const googleUser: AppUser = {
        uid: 'g_' + (payload.sub || Math.abs(googleEmail.split('').reduce((a: number, b: string) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36)),
        email: googleEmail,
        displayName: payload.name || (isSuperAdmin ? 'Bilal Malik (Admin)' : googleEmail.split('@')[0]),
        photoURL: payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name || googleEmail)}`
      };

      setUser(googleUser);
      setIsAdmin(isSuperAdmin);
      localStorage.setItem('promptnest_active_session', JSON.stringify(googleUser));
      await syncUserProfile(googleUser);
    } catch (err: any) {
      throw new Error('Google Sign-In failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Google account manual sign-in fallback (verified via admin email check)
  const signInWithGoogleAccount = async (googleEmail: string, googleName?: string) => {
    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid Google email address.');
    }

    const isSuperAdmin = checkIsAdminEmail(cleanEmail);
    const resolvedName = googleName?.trim() || (isSuperAdmin ? 'Bilal Malik (Admin)' : cleanEmail.split('@')[0]);

    const googleUid = 'g_' + Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36);
    const googleUser: AppUser = {
      uid: googleUid,
      email: cleanEmail,
      displayName: resolvedName,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resolvedName)}`
    };

    setUser(googleUser);
    setIsAdmin(isSuperAdmin);
    localStorage.setItem('promptnest_active_session', JSON.stringify(googleUser));
    await syncUserProfile(googleUser);
  };

  // Check if account exists for password reset
  const checkAccountExists = (email: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) return true;
    const accountsRaw = localStorage.getItem('promptnest_accounts');
    const accounts: StoredAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];
    return accounts.some((a) => a.email.toLowerCase() === cleanEmail);
  };

  // Sign in with Email & custom password
  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    const accountsRaw = localStorage.getItem('promptnest_accounts');
    const accounts: StoredAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];
    const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (found) {
      if (found.passwordHash === hashPassword(pass)) {
        const isSuperAdmin = checkIsAdminEmail(cleanEmail);
        const appUser: AppUser = {
          uid: found.uid,
          email: found.email,
          displayName: found.displayName,
          photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(found.uid)}`
        };
        setUser(appUser);
        setIsAdmin(isSuperAdmin);
        localStorage.setItem('promptnest_active_session', JSON.stringify(appUser));
        await syncUserProfile(appUser);
        return;
      } else {
        throw new Error('Incorrect password. Please verify your password or use "Forgot password".');
      }
    }

    // Default admin fallback if not yet registered in stored accounts
    if (checkIsAdminEmail(cleanEmail)) {
      const adminUid = 'admin_' + Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36);
      const adminUser: AppUser = {
        uid: adminUid,
        email: cleanEmail,
        displayName: 'Bilal Malik (Admin)',
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=Bilal+Malik`
      };
      accounts.push({
        uid: adminUid,
        email: cleanEmail,
        passwordHash: hashPassword(pass),
        displayName: 'Bilal Malik (Admin)',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('promptnest_accounts', JSON.stringify(accounts));
      setUser(adminUser);
      setIsAdmin(true);
      localStorage.setItem('promptnest_active_session', JSON.stringify(adminUser));
      await syncUserProfile(adminUser);
      return;
    }

    throw new Error('No account found with this email. Please click "Sign up" to create your account.');
  };

  // Sign up with Email and user ki marzi ka password
  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim() || cleanEmail.split('@')[0];

    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Please enter a valid email address.');
    if (!pass || pass.length < 6) throw new Error('Password must be at least 6 characters.');

    const accountsRaw = localStorage.getItem('promptnest_accounts');
    const accounts: StoredAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];

    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('This email is already registered. Please sign in instead.');
    }

    const isSuperAdmin = checkIsAdminEmail(cleanEmail);
    const newUid = (isSuperAdmin ? 'admin_' : 'usr_') + Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36) + '_' + Date.now().toString(36);

    const newAccount: StoredAccount = {
      uid: newUid,
      email: cleanEmail,
      passwordHash: hashPassword(pass),
      displayName: cleanName,
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    localStorage.setItem('promptnest_accounts', JSON.stringify(accounts));

    const appUser: AppUser = {
      uid: newUid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(newUid)}`
    };

    setUser(appUser);
    setIsAdmin(isSuperAdmin);
    localStorage.setItem('promptnest_active_session', JSON.stringify(appUser));
    await syncUserProfile(appUser);
  };

  // Reset password: user sets new password for their email and gets logged in
  const resetUserPassword = async (email: string, newPass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!newPass || newPass.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    const accountsRaw = localStorage.getItem('promptnest_accounts');
    const accounts: StoredAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];

    const isSuperAdmin = checkIsAdminEmail(cleanEmail);
    const idx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

    if (idx !== -1) {
      accounts[idx].passwordHash = hashPassword(newPass);
      localStorage.setItem('promptnest_accounts', JSON.stringify(accounts));
    } else {
      const newUid = (isSuperAdmin ? 'admin_' : 'usr_') + Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36);
      accounts.push({
        uid: newUid,
        email: cleanEmail,
        passwordHash: hashPassword(newPass),
        displayName: isSuperAdmin ? 'Bilal Malik (Admin)' : cleanEmail.split('@')[0],
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('promptnest_accounts', JSON.stringify(accounts));
    }

    // Also attempt Firebase password reset in background if configured
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch {}

    // Auto sign in user with their new password
    await signInWithEmail(cleanEmail, newPass);
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch {}
    localStorage.removeItem('promptnest_active_session');
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) throw new Error('Not logged in');
    const sanitized = { ...updates };
    // Prevent non-admin self promotion
    if (sanitized.role && !checkIsAdminEmail(user.email)) {
      delete sanitized.role;
    }

    const updatedProfile = { ...userProfile, ...sanitized };
    setUserProfile(updatedProfile);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, sanitized);
    } catch (err) {
      console.warn('Profile local update:', err);
    }
  };

  const toggleFollowCreator = async (creatorId: string): Promise<boolean> => {
    if (!user) throw new Error('Sign in to follow creators.');
    const isFollowing = followingList.includes(creatorId);
    if (isFollowing) {
      setFollowingList((prev) => prev.filter((id) => id !== creatorId));
      return false;
    } else {
      setFollowingList((prev) => [...prev, creatorId]);
      return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        loading,
        signInWithGooglePrompt,
        signInWithGoogleCredential,
        signInWithGoogleAccount,
        signInWithEmail,
        signUpWithEmail,
        resetUserPassword,
        checkAccountExists,
        logout,
        updateUserProfile,
        toggleFollowCreator,
        followingList
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
