import React, { useState } from 'react';
import { X, User as UserIcon, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Sparkles, CheckCircle2, Scan, Crown, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

const USERS_STORAGE_KEY = 'doc_extractor_users_db_v1';
const MASTER_ADMIN_EMAIL = 'singhaladitya611@gmail.com';
const MASTER_ADMIN_PASSWORD = 'aditya@12355';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleFillAdminCredentials = () => {
    setMode('login');
    setEmail(MASTER_ADMIN_EMAIL);
    setPassword(MASTER_ADMIN_PASSWORD);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!trimmedConfirmPassword) {
        setError('Please confirm your password.');
        return;
      }
      if (trimmedPassword !== trimmedConfirmPassword) {
        setError('Passwords do not match. Please make sure both password fields are identical.');
        return;
      }
      if (trimmedPassword.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        // Load existing registered users database
        const existingUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
        const usersMap: Record<string, { user: User; passwordHash: string }> = existingUsersRaw
          ? JSON.parse(existingUsersRaw)
          : {};

        // Always seed/ensure Master Admin account exists
        const adminKey = MASTER_ADMIN_EMAIL.toLowerCase();
        if (!usersMap[adminKey] || usersMap[adminKey].passwordHash !== MASTER_ADMIN_PASSWORD) {
          usersMap[adminKey] = {
            user: {
              id: 'usr_master_admin_001',
              name: 'Aditya Singhal (Master Admin)',
              email: MASTER_ADMIN_EMAIL,
              plan: 'enterprise',
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(MASTER_ADMIN_EMAIL)}`,
              createdAt: new Date().toISOString(),
              workspaceRole: 'Master Admin'
            },
            passwordHash: MASTER_ADMIN_PASSWORD
          };
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersMap));
        }

        if (mode === 'register') {
          if (usersMap[trimmedEmail]) {
            setError('An account with this email address already exists. Please log in.');
            setIsLoading(false);
            return;
          }

          const newUser: User = {
            id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
            name: name.trim(),
            email: trimmedEmail,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedEmail)}`,
            createdAt: new Date().toISOString(),
            plan: 'free'
          };

          usersMap[trimmedEmail] = {
            user: newUser,
            passwordHash: trimmedPassword
          };

          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersMap));
          setIsLoading(false);
          onSuccess(newUser);
          onClose();
        } else {
          // Login mode
          // Special Master Admin shortcut check
          if (trimmedEmail === adminKey && trimmedPassword === MASTER_ADMIN_PASSWORD) {
            setIsLoading(false);
            onSuccess(usersMap[adminKey].user);
            onClose();
            return;
          }

          const foundAccount = usersMap[trimmedEmail];
          if (!foundAccount || foundAccount.passwordHash !== trimmedPassword) {
            setError('Invalid email address or password.');
            setIsLoading(false);
            return;
          }

          setIsLoading(false);
          onSuccess(foundAccount.user);
          onClose();
        }
      } catch (err: any) {
        setError('An unexpected error occurred. Please try again.');
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors"
        >
          {/* Top Banner */}
          <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 sm:p-5 relative border-b border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white shrink-0">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  DocScan AI Account
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Secure
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sign in or register to scan, extract fields, &amp; save document history.
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 mt-4">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* Quick Admin fill button */}
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-[11px] text-amber-900 dark:text-amber-200 font-semibold truncate">
                  Master Admin Credentials Available
                </span>
              </div>
              <button
                type="button"
                onClick={handleFillAdminCredentials}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[10px] rounded-lg shrink-0 transition-colors shadow-2xs"
              >
                Fill Admin Login
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aditya Singhal"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                      required={mode === 'register'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="singhaladitya611@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="aditya@12355"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                      required={mode === 'register'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" /> Sign In to Account
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Create Account
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
