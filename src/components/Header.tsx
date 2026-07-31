import React, { useState } from 'react';
import { Sparkles, Scan, Database, CheckCircle2, User as UserIcon, LogIn, LogOut, ChevronDown, Crown, Sun, Moon } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  processedCount: number;
  highConfidenceRatio: number;
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onNavigateToTab?: (tab: 'scan' | 'result' | 'history' | 'premium' | 'profile') => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  processedCount,
  highConfidenceRatio,
  currentUser,
  onOpenAuth,
  onLogout,
  onNavigateToTab,
  theme = 'light',
  onToggleTheme
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-slate-900 dark:bg-slate-950 border-b border-slate-800/80 text-white sticky top-0 z-30 px-3 py-2.5 sm:px-6 transition-colors duration-200">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white shrink-0">
            <Scan className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
                DocScan AI
              </h1>
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
                <Sparkles className="w-2.5 h-2.5" /> 3.6 Vision
              </span>
            </div>
            <p className="text-slate-400 text-[10px] sm:text-[11px] truncate">
              Field Extraction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700/80 text-[10px] text-slate-300">
            <Database className="w-3 h-3 text-indigo-400" />
            <strong className="text-white">{processedCount}</strong>
          </div>

          {/* Global Theme Switcher Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 active:scale-95 border border-slate-700/80 text-slate-200 transition-all flex items-center justify-center shrink-0 min-w-[32px] min-h-[32px]"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-300 transition-transform duration-200 hover:-rotate-12" />
              )}
            </button>
          )}

          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-800 px-2 py-1 rounded-xl border border-slate-700/80 text-xs text-slate-200 transition-all active:scale-95"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full bg-indigo-600"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-[11px] max-w-[80px] truncate hidden xs:inline">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-20 p-2 space-y-1">
                    <div className="px-2 py-1.5 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                    {onNavigateToTab && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDropdown(false);
                            onNavigateToTab('profile');
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-indigo-400" /> View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDropdown(false);
                            onNavigateToTab('premium');
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-amber-300 hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-400" /> Premium Plans
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-slate-800 hover:text-red-300 flex items-center gap-1.5 transition-colors border-t border-slate-800/80 pt-1.5 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" /> Log In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="hidden xs:inline-flex px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 active:scale-95 transition-all"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

