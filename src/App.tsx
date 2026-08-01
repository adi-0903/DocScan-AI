import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DocumentUploader } from './components/DocumentUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { DocumentHistory } from './components/DocumentHistory';
import { SchemaInfo } from './components/SchemaInfo';
import { ProfilePage } from './components/ProfilePage';
import { PremiumView } from './components/PremiumView';
import { AuthModal } from './components/AuthModal';
import { ExtractedDocumentData, ExtractionRecord, User } from './types';
import { Sparkles, AlertCircle, Camera, Eye, Database, ShieldCheck, UserCheck, Lock, LogIn, UserPlus, Crown, User as UserIcon, Scan, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_KEY = 'doc_extractor_history_v1';
const CURRENT_USER_KEY = 'doc_extractor_current_user_v1';

type MainTab = 'scan' | 'result' | 'history' | 'premium' | 'profile';

export default function App() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData | null>(null);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<ExtractionRecord[]>([]);
  const [activeTab, setActiveTab] = useState<MainTab>('scan');

  // DB Connection status
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; provider?: string }>({ connected: false });

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authToast, setAuthToast] = useState<string | null>(null);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  // Load theme preference on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('docscan_theme_v1');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch (err) {
      console.warn('Failed to load theme preference:', err);
    }
  }, []);

  // Sync theme with document class list & localStorage
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('docscan_theme_v1', theme);
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Check DB Status
  useEffect(() => {
    fetch('/api/db/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.connected) {
          setDbStatus({ connected: true, provider: data.provider || 'Neon PostgreSQL' });
        }
      })
      .catch(() => setDbStatus({ connected: false }));
  }, []);

  // Load user & history on startup or user change
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        loadUserDocuments(u.id);
      } else {
        setIsAuthOpen(true);
      }
    } catch (err) {
      console.error('Failed to load initial storage state:', err);
    }
  }, []);

  const loadUserDocuments = async (userId: string) => {
    try {
      // First check backend DB if connected
      const res = await fetch(`/api/db/documents?userId=${encodeURIComponent(userId)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.documents) && json.documents.length > 0) {
        setRecords(json.documents);
        setDbStatus((prev) => ({ ...prev, connected: true }));
        return;
      }
    } catch (err) {
      console.warn('Backend DB sync fetch fallback:', err);
    }

    // LocalStorage fallback
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecords(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load local history:', err);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Failed to save user session:', err);
    }
    loadUserDocuments(user.id);
    setAuthToast(`Welcome, ${user.name}!`);
    setTimeout(() => setAuthToast(null), 3000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setExtractedData(null);
    setPreviewImage(null);
    setCurrentRecordId(null);
    setRecords([]);
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch (err) {
      console.error('Failed to clear user session:', err);
    }
    setAuthToast('Signed out successfully.');
    setTimeout(() => setAuthToast(null), 2500);
    setIsAuthOpen(true);
  };

  const handleUpgradeUserPlan = (plan: 'pro' | 'enterprise') => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      plan
    };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

      // Also update in registered users DB so re-login retains the upgraded plan
      const USERS_STORAGE_KEY = 'doc_extractor_users_db_v1';
      const existing = localStorage.getItem(USERS_STORAGE_KEY);
      if (existing) {
        const usersMap = JSON.parse(existing);
        const emailKey = currentUser.email.toLowerCase();
        if (usersMap[emailKey]) {
          usersMap[emailKey].user = updatedUser;
        } else {
          usersMap[emailKey] = {
            user: updatedUser,
            passwordHash: 'DocScan#8492'
          };
        }
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersMap));
      }
    } catch (err) {
      console.error('Failed to save upgraded plan:', err);
    }
  };

  const handleToggleShareWithTeam = (id: string) => {
    const updated = records.map((r) => {
      if (r.id === id) {
        const newSharedState = !r.isSharedWithTeam;
        fetch(`/api/db/documents/${encodeURIComponent(id)}/share`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isSharedWithTeam: newSharedState })
        }).catch((err) => console.warn('Failed to update share in DB:', err));
        return { ...r, isSharedWithTeam: newSharedState };
      }
      return r;
    });
    saveRecordsToStorage(updated);
  };

  // Save history to localStorage & DB sync
  const saveRecordsToStorage = (updatedRecords: ExtractionRecord[]) => {
    setRecords(updatedRecords);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRecords));
    } catch (err) {
      console.error('Failed to save history to localStorage:', err);
    }
  };

  const saveRecordToDb = async (record: ExtractionRecord) => {
    try {
      await fetch('/api/db/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (err) {
      console.warn('Backend DB sync save failed:', err);
    }
  };

  // Filter records strictly by current user ID for complete data isolation
  const userRecords = currentUser
    ? records.filter((r) => r.userId === currentUser.id)
    : [];

  const handleExtract = async (image: string, hint?: string) => {
    if (!currentUser) {
      setError('Account required. Please log in or create an account to scan documents.');
      handleOpenAuth('login');
      return;
    }

    const plan = currentUser.plan || 'free';
    if (plan === 'free' && userRecords.length >= 25) {
      setError('Monthly scan limit reached (25/25) on Free Plan. Upgrade to Pro Plan for unlimited document scans!');
      setActiveTab('premium');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image, hint })
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to extract document.');
      }

      const data: ExtractedDocumentData = json.data;
      setExtractedData(data);

      // Create new record bound strictly to current user's ID
      const newRecord: ExtractionRecord = {
        id: `rec_${Date.now()}`,
        userId: currentUser.id,
        fileName: data.vendor_or_sender || data.contact_name || 'Document',
        imageUrl: image,
        timestamp: new Date().toISOString(),
        data
      };

      setCurrentRecordId(newRecord.id);
      const updated = [newRecord, ...records];
      saveRecordsToStorage(updated);
      saveRecordToDb(newRecord);
      
      // Auto switch to result view on mobile
      setActiveTab('result');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'An error occurred during document extraction.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (feedback: string) => {
    if (!previewImage || !extractedData) return;

    setIsRefining(true);
    setError(null);

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: previewImage,
          currentData: extractedData,
          feedback
        })
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to refine document data.');
      }

      const updatedData: ExtractedDocumentData = json.data;
      setExtractedData(updatedData);

      // Update current record in history if available
      if (currentRecordId) {
        const updatedRecords = records.map((r) =>
          r.id === currentRecordId ? { ...r, data: updatedData } : r
        );
        saveRecordsToStorage(updatedRecords);
        const targetRec = updatedRecords.find((r) => r.id === currentRecordId);
        if (targetRec) saveRecordToDb(targetRec);
      }
    } catch (err: any) {
      console.error('Refine error:', err);
      setError(err.message || 'An error occurred while refining the document data.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSelectRecord = (record: ExtractionRecord) => {
    setPreviewImage(record.imageUrl);
    setExtractedData(record.data);
    setCurrentRecordId(record.id);
    setError(null);
    setActiveTab('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = (id: string) => {
    if (!currentUser) return;
    const updated = records.filter((r) => r.id !== id);
    saveRecordsToStorage(updated);
    fetch(`/api/db/documents/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch((err) =>
      console.warn('Failed to delete in DB:', err)
    );
    if (currentRecordId === id) {
      setCurrentRecordId(null);
      setExtractedData(null);
      setPreviewImage(null);
    }
  };

  const handleClearAllRecords = () => {
    if (!currentUser) return;
    // Delete ONLY current user's records, preserving other users' saved data
    const updated = records.filter((r) => r.userId !== currentUser.id);
    saveRecordsToStorage(updated);
    fetch(`/api/db/documents?userId=${encodeURIComponent(currentUser.id)}`, { method: 'DELETE' }).catch((err) =>
      console.warn('Failed to clear in DB:', err)
    );
    setCurrentRecordId(null);
    setExtractedData(null);
    setPreviewImage(null);
  };

  const handleUpdateDataManual = (newData: ExtractedDocumentData) => {
    setExtractedData(newData);
    if (currentRecordId) {
      const updated = records.map((r) =>
        r.id === currentRecordId ? { ...r, data: newData } : r
      );
      saveRecordsToStorage(updated);
      const targetRec = updated.find((r) => r.id === currentRecordId);
      if (targetRec) saveRecordToDb(targetRec);
    }
  };

  // Calculate statistics for header strictly for current user
  const highConfidenceCount = userRecords.filter((r) => r.data.confidence === 'high').length;
  const highConfidenceRatio =
    userRecords.length > 0 ? Math.round((highConfidenceCount / userRecords.length) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col antialiased pb-20 sm:pb-8 transition-colors duration-200">
      {/* Top Mobile Header */}
      <Header
        processedCount={userRecords.length}
        highConfidenceRatio={highConfidenceRatio}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* PWA Mobile App Install Banner */}
      {showInstallBanner && deferredPrompt && (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-md z-30">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 shrink-0" />
            <span>Install DocScan AI app on your phone!</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallApp}
              className="bg-white text-indigo-700 px-3 py-1 rounded-lg font-bold shadow-xs text-[11px] hover:bg-slate-100 transition-colors"
            >
              Install App
            </button>
            <button
              type="button"
              onClick={() => setShowInstallBanner(false)}
              className="text-white/80 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Auth Notification Toast */}
      <AnimatePresence>
        {authToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl border border-slate-700/80 flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>{authToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md md:max-w-4xl mx-auto p-3 sm:p-5 space-y-4">
        {/* Global Error Notice */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs shadow-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <strong className="font-bold block text-red-800">Extraction Error</strong>
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mandatory Account Gate Card */}
        {!currentUser && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md p-6 sm:p-8 text-center flex flex-col items-center justify-center my-4 max-w-md mx-auto space-y-4 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 flex items-center justify-center text-indigo-400 shadow-lg shrink-0">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Account Required to Access DocScan AI
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                Having an account is mandatory to scan documents, extract structured data, and keep your personal scan history private and isolated.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 w-full">
              <button
                type="button"
                onClick={() => handleOpenAuth('login')}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Log In
              </button>
              <button
                type="button"
                onClick={() => handleOpenAuth('register')}
                className="flex-1 py-3 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-transparent dark:border-slate-700"
              >
                <UserPlus className="w-4 h-4" /> Register
              </button>
            </div>
          </div>
        )}

        {/* Desktop Header Navigation Tabs (Hidden on mobile) */}
        {currentUser && (
          <div className="hidden md:flex bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl max-w-xl mx-auto shadow-inner border border-transparent dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'scan' || activeTab === 'result' || activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scan className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Extractor Workspace
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('premium')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'premium'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" /> Premium Upgrades
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> My Profile &amp; Schema
            </button>
          </div>
        )}

        {/* Dynamic View Sections */}
        <AnimatePresence mode="wait">
          {activeTab === 'premium' && (
            <motion.div
              key="view-premium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <PremiumView
                currentUser={currentUser}
                onOpenAuth={handleOpenAuth}
                onUpgradeUserPlan={handleUpgradeUserPlan}
              />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="view-profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ProfilePage
                currentUser={currentUser}
                records={userRecords}
                onOpenAuth={handleOpenAuth}
                onLogout={handleLogout}
                onClearHistory={handleClearAllRecords}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onUpgradeUserPlan={handleUpgradeUserPlan}
                onSwitchUser={handleAuthSuccess}
                onUpdateUser={(updated) => {
                  setCurrentUser(updated);
                  try {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
                  } catch (e) {
                    console.warn(e);
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extractor Workspace Views (Scan / Result / History) */}
        {(activeTab === 'scan' || activeTab === 'result' || activeTab === 'history') && (
          <>
            {/* Mobile View Switcher (Visible on mobile screens) */}
            <div className="md:hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'scan' && (
                  <motion.div
                    key="tab-scan"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <DocumentUploader
                      onExtract={handleExtract}
                      isLoading={isLoading}
                      previewImage={previewImage}
                      setPreviewImage={setPreviewImage}
                      currentUser={currentUser}
                      onOpenAuth={handleOpenAuth}
                    />
                  </motion.div>
                )}

                {activeTab === 'result' && (
                  <motion.div
                    key="tab-result"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {extractedData ? (
                      <ResultDisplay
                        data={extractedData}
                        imageUrl={previewImage || ''}
                        onRefine={handleRefine}
                        isRefining={isRefining}
                        onUpdateData={handleUpdateDataManual}
                        currentUser={currentUser}
                        onNavigateToTab={(tab) => setActiveTab(tab)}
                      />
                    ) : (
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-inner">
                          <Sparkles className="w-6 h-6 animate-pulse" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">
                          No Active Scan Result
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                          Upload a photo or snap a document with your camera in the <strong>Scan</strong> tab to run Gemini field extraction.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('scan')}
                          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
                        >
                          Go to Scan Tab
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="tab-history"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <DocumentHistory
                      records={userRecords}
                      onSelectRecord={handleSelectRecord}
                      onDeleteRecord={handleDeleteRecord}
                      onClearAll={handleClearAllRecords}
                      currentUser={currentUser}
                      onToggleShareWithTeam={handleToggleShareWithTeam}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Responsive Tablet/Desktop View (Visible on larger screens md+) */}
            <div className="hidden md:grid md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-5 space-y-6">
                <DocumentUploader
                  onExtract={handleExtract}
                  isLoading={isLoading}
                  previewImage={previewImage}
                  setPreviewImage={setPreviewImage}
                  currentUser={currentUser}
                  onOpenAuth={handleOpenAuth}
                />
                <SchemaInfo />
              </div>

              <div className="md:col-span-7 space-y-6">
                {extractedData ? (
                  <ResultDisplay
                    data={extractedData}
                    imageUrl={previewImage || ''}
                    onRefine={handleRefine}
                    isRefining={isRefining}
                    onUpdateData={handleUpdateDataManual}
                    currentUser={currentUser}
                    onNavigateToTab={(tab) => setActiveTab(tab)}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-inner">
                      <Sparkles className="w-7 h-7 animate-pulse" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      Ready for Document Field Extraction
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                      Upload or snap a document photo on the left, then click <strong>Run Document Extraction</strong> to parse standard fields into JSON.
                    </p>
                  </div>
                )}

                <DocumentHistory
                  records={userRecords}
                  onSelectRecord={handleSelectRecord}
                  onDeleteRecord={handleDeleteRecord}
                  onClearAll={handleClearAllRecords}
                  currentUser={currentUser}
                  onToggleShareWithTeam={handleToggleShareWithTeam}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1.5 flex items-center justify-around transition-colors">
        <button
          type="button"
          onClick={() => setActiveTab('scan')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'scan'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/80'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Scan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('result')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl relative transition-all ${
            activeTab === 'result'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/80'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {extractedData && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          )}
          <Eye className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Result</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl relative transition-all ${
            activeTab === 'history'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/80'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {userRecords.length > 0 && (
            <span className="absolute top-0.5 right-1 bg-indigo-600 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px]">
              {userRecords.length}
            </span>
          )}
          <Database className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Saved</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('premium')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'premium'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/80'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Crown className="w-4 h-4 mb-0.5 text-amber-500" />
          <span className="text-[10px]">Premium</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'profile'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/80'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserIcon className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

      {/* Auth Modal Dialog */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
    </div>
  );
}

