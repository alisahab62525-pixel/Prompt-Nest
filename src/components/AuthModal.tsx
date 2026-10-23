import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'reset';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialMode = 'login' }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        onClose();
      } else if (mode === 'signup') {
        if (!displayName.trim()) {
          setErrorMsg('Display name is required.');
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
        onClose();
      } else if (mode === 'reset') {
        await resetPassword(email);
        setResetSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="mb-6 text-center">
          <div className="inline-flex w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 items-center justify-center text-white dark:text-zinc-900 font-black text-lg mb-2">
            P
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {mode === 'login' && 'Welcome to PromptNest'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'reset' && 'Reset Your Password'}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {mode === 'login' && 'Discover, save, and publish verified AI prompts'}
            {mode === 'signup' && 'Join thousands of AI creators and prompt engineers'}
            {mode === 'reset' && "Enter your email and we'll send a password recovery link"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {resetSuccess ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Check your inbox! A password reset email has been sent to {email}.
            </p>
            <button
              onClick={() => {
                setResetSuccess(false);
                setMode('login');
              }}
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            {/* Google OAuth Button */}
            {mode !== 'reset' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-zinc-200 dark:border-zinc-800 w-full"></div>
                  <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] text-zinc-400 uppercase tracking-wider absolute">
                    or
                  </span>
                </div>
              </>
            )}

            {/* Email form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3.5 text-xs">
              {mode === 'signup' && (
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Thorne"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-700 dark:text-zinc-300 font-medium">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('reset')}
                        className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span>Please wait...</span>
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'Sign In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'reset' && 'Send Reset Link'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Mode switch */}
            <div className="mt-5 text-center text-xs text-zinc-500">
              {mode === 'login' && (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                    }}
                    className="font-semibold text-zinc-900 dark:text-white hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              )}
              {mode === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="font-semibold text-zinc-900 dark:text-white hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
              {mode === 'reset' && (
                <p>
                  Remembered your password?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="font-semibold text-zinc-900 dark:text-white hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
