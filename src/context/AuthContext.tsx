import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleAuthProvider } from '../lib/firebase.ts';
import { UserProfile } from '../types/index.ts';

// Dedicated bootstrapped admin email provided in runtime metadata
export const BOOTSTRAPPED_ADMIN_EMAIL = 'malikbilal33877@gmail.com';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleFollowCreator: (creatorId: string) => Promise<boolean>;
  followingList: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [followingList, setFollowingList] = useState<string[]>([]);

  // Sync or initialize profile in Firestore
  const syncUserProfile = async (fbUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);

      const isBootstrappedAdmin = fbUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const computedRole = isBootstrappedAdmin ? 'admin' : (data.role || 'user');
        const updated: UserProfile = {
          ...data,
          role: computedRole
        };
        setUserProfile(updated);
        setIsAdmin(computedRole === 'admin');
      } else {
        const newProfile: UserProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Prompt Artisan',
          email: fbUser.email || '',
          avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${fbUser.uid}`,
          bio: 'AI enthusiast & prompt crafter.',
          role: isBootstrappedAdmin ? 'admin' : 'user',
          followersCount: 0,
          followingCount: 0,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        setIsAdmin(newProfile.role === 'admin');
      }

      // If bootstrapped admin, also ensure admin whitelist document exists
      if (isBootstrappedAdmin) {
        try {
          const adminDoc = doc(db, 'admins', fbUser.uid);
          await setDoc(adminDoc, {
            email: fbUser.email,
            role: 'superadmin',
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch {
          // Silent catch for whitelist
        }
      }
    } catch (err) {
      console.warn('Could not sync user profile with Firestore:', err);
      // Fallback local profile
      const isBootstrappedAdmin = fbUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      setUserProfile({
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'AI Creator',
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || '',
        role: isBootstrappedAdmin ? 'admin' : 'user',
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date().toISOString()
      });
      setIsAdmin(isBootstrappedAdmin);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await syncUserProfile(res.user);
      }
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await fbUpdateProfile(res.user, { displayName });
        await syncUserProfile(res.user);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) throw new Error('Not logged in');
    // Prevent client self-escalation to admin
    const sanitized = { ...updates };
    if (sanitized.role && userProfile.role !== 'admin') {
      delete sanitized.role;
    }

    const updatedProfile = { ...userProfile, ...sanitized };
    setUserProfile(updatedProfile);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, sanitized);
      if (sanitized.displayName) {
        await fbUpdateProfile(user, { displayName: sanitized.displayName });
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
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
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
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
