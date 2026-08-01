import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  Crown,
  Check,
  Zap,
  Sparkles,
  Building2,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  Mail,
  ShieldCheck,
  X,
  UserCheck,
  User as UserIcon,
  Shield,
  Send,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PremiumViewProps {
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onUpgradeUserPlan: (plan: 'pro' | 'enterprise') => void;
  onAdminSetUserPlan?: (userEmail: string, plan: 'free' | 'pro' | 'enterprise') => void;
}

const UPGRADE_REQUESTS_KEY = 'docscan_upgrade_requests_v1';
const USERS_STORAGE_KEY = 'doc_extractor_users_db_v1';
const ADMIN_PHONE_NUMBER = '+91 7009812679';
const ADMIN_EMAIL = singhaladitya611@gmail.com';

export const PremiumView: React.FC<PremiumViewProps> = ({
  currentUser,
  onOpenAuth,
  onUpgradeUserPlan,
  onAdminSetUserPlan
}) => {
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Contact Modal State
  const [contactModalPlan, setContactModalPlan] = useState<'pro' | 'enterprise' | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);

  // Admin Mode State
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<Array<{ user: User; passwordHash: string }>>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{ email: string; name: string; plan: string; timestamp: string }>>([]);

  const currentPlan = currentUser?.plan || 'free';

  // Load all registered users & pending upgrade requests for Admin Panel
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = () => {
    try {
      const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (usersRaw) {
        const usersDb = JSON.parse(usersRaw);
        setUsersList(Object.values(usersDb));
      }
      const reqsRaw = localStorage.getItem(UPGRADE_REQUESTS_KEY);
      if (reqsRaw) {
        setPendingRequests(JSON.parse(reqsRaw));
      }
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    }
  };

  const handleSelectPlanClick = (plan: 'pro' | 'enterprise') => {
    if (!currentUser) {
      onOpenAuth('register');
      return;
    }
    setContactModalPlan(plan);
    setRequestSubmitted(false);
  };

  const handleSubmitUpgradeRequest = () => {
    if (!currentUser || !contactModalPlan) return;

    try {
      const newReq = {
        email: currentUser.email,
        name: currentUser.name,
        plan: contactModalPlan.toUpperCase(),
        timestamp: new Date().toISOString()
      };

      const existingRaw = localStorage.getItem(UPGRADE_REQUESTS_KEY);
      const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];

      // Avoid duplicates
      const updated = [newReq, ...existing.filter((r) => r.email !== currentUser.email)];
      localStorage.setItem(UPGRADE_REQUESTS_KEY, JSON.stringify(updated));

      setPendingRequests(updated);
      setRequestSubmitted(true);
      setToastMessage(`Upgrade request for ${contactModalPlan.toUpperCase()} plan sent to Admin!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Failed to save upgrade request:', err);
    }
  };

  const handleAdminUpdatePlan = (email: string, newPlan: 'free' | 'pro' | 'enterprise') => {
    try {
      // 1. Update in local state/App handler if provided
      if (onAdminSetUserPlan) {
        onAdminSetUserPlan(email, newPlan);
      }

      // 2. Update users DB
      const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (usersRaw) {
        const usersDb: Record<string, { user: User; passwordHash: string }> = JSON.parse(usersRaw);
        const emailKey = email.toLowerCase();
        if (usersDb[emailKey]) {
          usersDb[emailKey].user.plan = newPlan;
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersDb));
        }
      }

      // 3. Clear pending request for this user
      const reqsRaw = localStorage.getItem(UPGRADE_REQUESTS_KEY);
      if (reqsRaw) {
        const reqs: any[] = JSON.parse(reqsRaw);
        const filtered = reqs.filter((r) => r.email.toLowerCase() !== email.toLowerCase());
        localStorage.setItem(UPGRADE_REQUESTS_KEY, JSON.stringify(filtered));
        setPendingRequests(filtered);
      }

      // 4. If current user is being updated, apply immediately
      if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
        onUpgradeUserPlan(newPlan === 'free' ? 'pro' : (newPlan as any));
      }

      loadAdminData();
      setToastMessage(`Plan for ${email} updated to ${newPlan.toUpperCase()}!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('Failed to update user plan as admin:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-6 space-y-6 transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Admin Panel Toggle Header Bar */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Admin Plan Management Portal</span>
        </div>
        <button
          type="button"
          onClick={() => setIsAdminMode(!isAdminMode)}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${isAdminMode
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50'
            }`}
        >
          {isAdminMode ? 'Hide Admin Portal' : 'Open Admin Portal (Activate Users)'}
        </button>
      </div>

      {/* Admin Management Drawer / Portal */}
      {isAdminMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-slate-900 text-white rounded-2xl border border-indigo-500/50 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Administrator Workspace Controls
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Directly activate Pro or Enterprise plans for registered users after verification.
              </p>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold">
              ADMIN MODE
            </span>
          </div>

          {/* Pending Upgrade Requests */}
          {pendingRequests.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Pending Upgrade Contact Requests ({pendingRequests.length})
              </span>
              <div className="space-y-2">
                {pendingRequests.map((req, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-800/80 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <strong className="text-white block">{req.name}</strong>
                      <span className="text-slate-400 font-mono text-[11px]">{req.email}</span>
                      <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-semibold">
                        Requested: {req.plan}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAdminUpdatePlan(req.email, 'pro')}
                        className="px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold rounded-lg text-[11px] hover:opacity-90 transition-opacity"
                      >
                        Activate PRO
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdminUpdatePlan(req.email, 'enterprise')}
                        className="px-2.5 py-1 bg-amber-500 text-slate-950 font-extrabold rounded-lg text-[11px] hover:bg-amber-400 transition-colors"
                      >
                        Activate ENTERPRISE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registered Users List & Plan Switcher */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-indigo-400" /> Registered Users ({usersList.length || (currentUser ? 1 : 0)})
            </span>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(usersList.length > 0 ? usersList : currentUser ? [{ user: currentUser, passwordHash: '' }] : []).map(
                ({ user }, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white">{user.name}</strong>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${user.plan === 'enterprise'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : user.plan === 'pro'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                        >
                          {user.plan || 'free'}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">{user.email}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAdminUpdatePlan(user.email, 'free')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${(user.plan || 'free') === 'free'
                            ? 'bg-slate-700 text-slate-400 opacity-60'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdminUpdatePlan(user.email, 'pro')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${user.plan === 'pro'
                            ? 'bg-indigo-600 text-white font-black ring-2 ring-indigo-400'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-700 hover:bg-indigo-900'
                          }`}
                      >
                        ⚡ PRO
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdminUpdatePlan(user.email, 'enterprise')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${user.plan === 'enterprise'
                            ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300'
                            : 'bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900'
                          }`}
                      >
                        👑 ENTERPRISE
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Header Banner */}
      <div className="text-center space-y-2 max-w-lg mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold">
          <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Premium Upgrades
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Unlock Unlimited AI Document Extraction
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Upgrade your workspace to remove scan limits, accelerate OCR response speed, and export structured JSON &amp; CSV tables.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
          <button
            type="button"
            onClick={() => setSelectedBilling('monthly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedBilling === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setSelectedBilling('yearly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${selectedBilling === 'yearly'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            Yearly Billing
            <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-bold">
              SAVE 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Free Plan */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Starter
              </span>
              {currentPlan === 'free' && (
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full font-bold">
                  CURRENT
                </span>
              )}
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">$0</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Free forever for basic use</p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>25 Document Scans / Month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Gemini 3.6 Flash Vision</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Standard JSON Export</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Camera &amp; Photo Upload</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={currentPlan === 'free'}
            className="w-full py-2 px-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl disabled:opacity-60"
          >
            {currentPlan === 'free' ? 'Active Plan' : 'Free Tier'}
          </button>
        </div>

        {/* Pro Ultra Plan (Featured) */}
        <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-2xl border-2 border-indigo-500 p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Most Popular
              </span>
              {currentPlan === 'pro' && (
                <span className="text-[10px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <div>
              <div className="text-2xl font-black text-white">
                {selectedBilling === 'monthly' ? '$9.99' : '$7.99'}
                <span className="text-xs font-normal text-slate-300">/mo</span>
              </div>
              <p className="text-[11px] text-slate-300">For power users &amp; business owners</p>
            </div>

            <ul className="space-y-2 text-xs text-slate-200 pt-2 border-t border-indigo-800/80">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <strong className="text-white">Unlimited Document Scans</strong>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>3x Faster Extraction Speed</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>JSON &amp; CSV Table Export</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Multi-Page Receipt Batching</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Priority Field Verification</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlanClick('pro')}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 relative z-10"
          >
            {currentPlan === 'pro' ? (
              'Current Pro Plan'
            ) : (
              <>
                <PhoneCall className="w-4 h-4 text-amber-300" /> Contact Admin to Upgrade
              </>
            )}
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Enterprise
              </span>
              {currentPlan === 'enterprise' && (
                <span className="text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {selectedBilling === 'monthly' ? '$29.99' : '$23.99'}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/mo</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">For teams &amp; enterprise accounting</p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Everything in Pro Plan</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Team Workspace Sharing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Custom Schema Management</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Dedicated Support &amp; Audit Logs</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlanClick('enterprise')}
            className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            {currentPlan === 'enterprise' ? (
              'Active Enterprise Plan'
            ) : (
              <>
                <PhoneCall className="w-4 h-4 text-indigo-300" /> Contact Admin for Enterprise
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pop-Up Contact Team Modal */}
      <AnimatePresence>
        {contactModalPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 sm:p-5 relative border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setContactModalPlan(null)}
                  className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shrink-0">
                    <PhoneCall className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      Activate {contactModalPlan.toUpperCase()} Plan
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                        CONTACT TEAM
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Call or message our administrator team for instant plan activation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <strong className="block font-bold">How Activation Works:</strong>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    To enable <strong>{contactModalPlan.toUpperCase()}</strong> plan features for your account, please call or message our team. Once verified, your Administrator will instantly activate your plan.
                  </p>
                </div>

                {/* Call & Contact Actions Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Direct Admin Helpline
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      AVAILABLE NOW
                    </span>
                  </div>

                  <div className="text-base font-black text-slate-900 dark:text-white tracking-wide font-mono flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {ADMIN_PHONE_NUMBER}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${ADMIN_PHONE_NUMBER.replace(/[^0-9+]/g, '')}`}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Call Admin
                    </a>
                    <a
                      href={`https://wa.me/${ADMIN_PHONE_NUMBER.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>

                {/* Submit Upgrade Request Notification */}
                {requestSubmitted ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Your request has been logged! Admin will activate your features upon call.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitUpgradeRequest}
                    className="w-full py-2.5 px-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-400" /> Send Digital Upgrade Request to Admin
                  </button>
                )}

                <p className="text-[10px] text-center text-slate-400">
                  Email support: <a href={`mailto:${ADMIN_EMAIL}`} className="underline text-indigo-500">{ADMIN_EMAIL}</a>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
