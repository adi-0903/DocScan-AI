import React, { useState } from 'react';
import { User, ExtractionRecord } from '../types';
import { SchemaInfo } from './SchemaInfo';
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Calendar,
  Sparkles,
  Crown,
  Database,
  CheckCircle2,
  LogOut,
  Trash2,
  Lock,
  ChevronRight,
  FileSpreadsheet,
  Zap,
  Key,
  Code,
  Users,
  Activity,
  Copy,
  Plus,
  Building2,
  Send,
  Link,
  ExternalLink,
  X,
  Check,
  Shield
} from 'lucide-react';

interface ProfilePageProps {
  currentUser: User | null;
  records: ExtractionRecord[];
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onClearHistory: () => void;
  onNavigateToTab: (tab: 'scan' | 'result' | 'history' | 'premium' | 'profile') => void;
  onUpgradeUserPlan?: (plan: 'pro' | 'enterprise') => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  records,
  onOpenAuth,
  onLogout,
  onClearHistory,
  onNavigateToTab,
  onUpgradeUserPlan
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'api' | 'team' | 'schema'>('profile');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(`docscan_apikey_${currentUser?.id}`) || `docscan_live_sk_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;
  });
  const [copiedKey, setCopiedKey] = useState(false);

  // Team Workspace State
  const [teamMembers, setTeamMembers] = useState<Array<{ email: string; role: string; status: string; inviteLink?: string }>>([
    { email: currentUser?.email || '', role: 'Workspace Head (Owner)', status: 'Active' }
  ]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Accountant' | 'Auditor' | 'Editor' | 'Member'>('Accountant');
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Workspace Document Visibility & Sharing Settings
  const [autoShareScans, setAutoShareScans] = useState(true);
  const [allowAccountantExport, setAllowAccountantExport] = useState(true);
  const [restrictDocumentDeletions, setRestrictDocumentDeletions] = useState(true);
  const [maskSensitiveNotes, setMaskSensitiveNotes] = useState(false);

  // Invite Modal & Dispatch Preview State
  const [activeInviteModal, setActiveInviteModal] = useState<{
    email: string;
    role: string;
    token: string;
    link: string;
  } | null>(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 text-center max-w-md mx-auto space-y-4 my-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-xl mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Sign In to View Profile</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
            Create an account or log in to manage your private document history, view extraction schemas, and manage plan settings.
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => onOpenAuth('register')}
            className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Register
          </button>
        </div>
      </div>
    );
  }

  const highConfidenceCount = records.filter((r) => r.data.confidence === 'high').length;
  const highConfidenceRatio =
    records.length > 0 ? Math.round((highConfidenceCount / records.length) * 100) : 100;

  const totalAmountsParsed = records.reduce((sum, r) => {
    return sum + (r.data.amount || 0);
  }, 0);

  const formattedDate = new Date(currentUser.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const userPlan = currentUser.plan || 'free';

  const handleGenerateNewKey = () => {
    const newKey = `docscan_live_sk_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;
    setApiKey(newKey);
    localStorage.setItem(`docscan_apikey_${currentUser.id}`, newKey);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToInvite = inviteEmail.trim();
    if (!emailToInvite) return;

    const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const link = `${window.location.origin}?invite_workspace=${encodeURIComponent(currentUser.name || 'Enterprise')}&email=${encodeURIComponent(emailToInvite)}&token=${token}`;

    setTeamMembers(prev => [
      ...prev,
      { email: emailToInvite, role: inviteRole, status: 'Pending Invite', inviteLink: link }
    ]);
    setInviteEmail('');

    setInviteSuccess(`Invitation link generated for ${emailToInvite}! Copy and share the direct link below.`);
    setTimeout(() => setInviteSuccess(null), 5000);

    // Open direct invite link modal
    setActiveInviteModal({
      email: emailToInvite,
      role: inviteRole,
      token,
      link
    });
  };

  const handleCopyInviteLink = (linkToCopy: string) => {
    navigator.clipboard.writeText(linkToCopy);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2500);
  };

  const handleSimulateJoin = (emailToActivate: string) => {
    setTeamMembers(prev =>
      prev.map(m => m.email === emailToActivate ? { ...m, status: 'Active (Joined)' } : m)
    );
    if (activeInviteModal?.email === emailToActivate) {
      setActiveInviteModal(null);
    }
    setInviteSuccess(`Teammate ${emailToActivate} has accepted the invitation and joined the workspace!`);
    setTimeout(() => setInviteSuccess(null), 4000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* View Sub-navigation Toggle */}
      <div className="flex bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto gap-1 border border-transparent dark:border-slate-700/60 transition-colors">
        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 min-w-[110px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'profile'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Account
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('api')}
          className={`flex-1 min-w-[110px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'api'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-amber-500" /> API Access
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('team')}
          className={`flex-1 min-w-[110px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'team'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Team
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('schema')}
          className={`flex-1 min-w-[110px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'schema'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Code className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Schema
        </button>
      </div>

      {activeSubTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          {/* Header Cover Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-indigo-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Account Verified
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                  userPlan === 'pro' || userPlan === 'enterprise'
                    ? 'bg-amber-400/20 border border-amber-400/40 text-amber-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-400" />
                {userPlan.toUpperCase()} PLAN
              </span>
            </div>

            <div className="flex items-center gap-4 mt-5">
              <div className="relative">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-indigo-500/50 object-cover shadow-lg bg-slate-800"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center border-2 border-white/20 shadow-lg">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white text-[10px] shadow-xs">
                  ✓
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {currentUser.name}
                </h2>
                <p className="text-xs text-slate-300 truncate flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  {currentUser.email}
                </p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3 text-slate-500" /> Joined {formattedDate}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="block text-base sm:text-lg font-black text-slate-900">
                {records.length}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Scans
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="block text-base sm:text-lg font-black text-emerald-600">
                {highConfidenceRatio}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                High Accuracy
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="block text-base sm:text-lg font-black text-indigo-600">
                ${totalAmountsParsed.toFixed(0)}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Parsed Sum
              </span>
            </div>
          </div>

          {/* Plan Upgrade Banner if Free */}
          {userPlan === 'free' && (
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">
                    Upgrade to DocScan Pro
                  </h4>
                  <p className="text-[10px] text-indigo-700">
                    Get unlimited scans, batch OCR &amp; CSV export.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('premium')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm shrink-0 transition-colors flex items-center gap-1"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" /> Upgrade
              </button>
            </div>
          )}

          {/* Account Settings List */}
          <div className="p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Account Management
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('premium')}
                className="w-full p-3 rounded-xl border border-slate-200/80 hover:border-indigo-200 bg-white hover:bg-indigo-50/50 flex items-center justify-between transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                      Subscription &amp; Plans
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Current Plan: <strong className="capitalize">{userPlan}</strong>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('api')}
                className="w-full p-3 rounded-xl border border-slate-200/80 hover:border-indigo-200 bg-white hover:bg-indigo-50/50 flex items-center justify-between transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600">
                      API &amp; Developer Secret Key
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Generate keys for REST extraction API
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('team')}
                className="w-full p-3 rounded-xl border border-slate-200/80 hover:border-indigo-200 bg-white hover:bg-indigo-50/50 flex items-center justify-between transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                      Team Workspace &amp; Invites
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Manage team members and shared scans
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </button>

              {showClearConfirm ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-red-900">
                    Are you sure you want to delete all {records.length} saved document scans?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearHistory();
                        setShowClearConfirm(false);
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg shadow-xs"
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 bg-white border border-slate-300 font-semibold text-xs text-slate-700 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={records.length === 0}
                  className="w-full p-3 rounded-xl border border-slate-200/80 hover:border-red-200 bg-white hover:bg-red-50/50 flex items-center justify-between transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50 text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-red-600">
                        Clear My Scan History
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Permanently delete {records.length} saved scans
                      </div>
                    </div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="w-full p-3 rounded-xl border border-slate-200/80 hover:border-red-300 bg-white hover:bg-red-50 flex items-center justify-between transition-all group text-left mt-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-red-100 group-hover:text-red-600">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-red-600">
                      Sign Out
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Log out of {currentUser.email}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Developer Access SubTab */}
      {activeSubTab === 'api' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-500" /> Developer API Key Access
              </h3>
              <p className="text-xs text-slate-500">
                Programmatically extract structured JSON from receipts &amp; invoices via cURL or SDKs.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
              {userPlan.toUpperCase()} API
            </span>
          </div>

          {userPlan === 'free' ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center mx-auto">
                <Key className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Developer API Access Requires Pro or Enterprise
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                You are currently on the <strong>Free Plan</strong> (25 web scans/mo). Upgrade to Pro or Enterprise to issue live secret API keys and integrate automatic receipt parsing into your custom backend systems.
              </p>
              <button
                type="button"
                onClick={() => onNavigateToTab('premium')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 mt-2"
              >
                <Crown className="w-4 h-4 text-amber-300" /> Upgrade Plan to Unlock API
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Live Secret API Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-900 text-amber-300 rounded-xl border border-slate-800"
                />
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                >
                  {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey ? 'Copied' : 'Copy Key'}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateNewKey}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Roll Key
                </button>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl text-slate-200 text-[11px] font-mono space-y-1.5 overflow-x-auto">
                <div className="text-slate-500">// cURL API Request Example</div>
                <div className="text-cyan-300">
                  curl -X POST https://api.docscan.io/v1/extract \
                </div>
                <div className="text-slate-300 pl-4">
                  -H "Authorization: Bearer {apiKey}" \
                </div>
                <div className="text-slate-300 pl-4">
                  -F "file=@/path/to/invoice.jpg"
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team Workspace SubTab */}
      {activeSubTab === 'team' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" /> Team Workspace Members
              </h3>
              <p className="text-xs text-slate-500">
                Share document scan history and collaborate on extracted fields with teammates.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              {userPlan.toUpperCase()} WORKSPACE
            </span>
          </div>

          {userPlan !== 'enterprise' ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-700 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Team Workspace Requires Enterprise Plan
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                You are currently on the <strong>{userPlan.toUpperCase()} Plan</strong>. Upgrade to <strong>Enterprise</strong> to invite accounting team members, assign editor roles, and sync shared document repositories.
              </p>
              <button
                type="button"
                onClick={() => {
                  onUpgradeUserPlan('enterprise');
                  onNavigateToTab('premium');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 mt-2"
              >
                <Crown className="w-4 h-4 text-amber-300" /> Upgrade to Enterprise Workspace
              </button>
            </div>
          ) : (
            <>
              {/* How Team Sharing Works Banner */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl space-y-1.5 text-xs text-blue-900">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Users className="w-4 h-4 text-blue-600" /> Enterprise Workspace Visibility:
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  1. Invite accountants, finance managers, or team members below and set their roles.<br />
                  2. In the <strong>Saved Scans &amp; History</strong> tab, click <strong>"Share"</strong> on any bill or receipt to make it visible to your team.<br />
                  3. Invited team members can filter by <strong>"Shared with Team"</strong> to review extracted line items &amp; download CSV reports.
                </p>
              </div>

              {inviteSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{inviteSuccess}</span>
                </div>
              )}

              <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter teammate email address..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 bg-white font-medium"
                >
                  <option value="Accountant">Accountant (Full View)</option>
                  <option value="Auditor">Auditor (Read-Only)</option>
                  <option value="Editor">Editor (Scan &amp; Edit)</option>
                  <option value="Member">Team Member</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors shrink-0 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Invite Teammate
                </button>
              </form>

              {/* Shared Document Visibility & Permission Policies */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" /> Document Record Sharing Policies
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Live Workspace Permissions
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Toggle 1: Auto Share Scans */}
                  <div className="flex items-start justify-between gap-3 p-2.5 bg-white rounded-lg border border-slate-200/80">
                    <div>
                      <span className="font-bold text-slate-800 block">Auto-Share New Scans</span>
                      <span className="text-[11px] text-slate-500">Automatically make newly extracted receipts visible to invited team members.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoShareScans(!autoShareScans)}
                      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${autoShareScans ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${autoShareScans ? 'left-4.5' : 'left-0.75'}`} />
                    </button>
                  </div>

                  {/* Toggle 2: Accountant Export */}
                  <div className="flex items-start justify-between gap-3 p-2.5 bg-white rounded-lg border border-slate-200/80">
                    <div>
                      <span className="font-bold text-slate-800 block">Allow Financial Data Exports</span>
                      <span className="text-[11px] text-slate-500">Grant Accountants &amp; Auditors rights to export shared document CSVs.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAllowAccountantExport(!allowAccountantExport)}
                      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${allowAccountantExport ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${allowAccountantExport ? 'left-4.5' : 'left-0.75'}`} />
                    </button>
                  </div>

                  {/* Toggle 3: Restrict Deletions */}
                  <div className="flex items-start justify-between gap-3 p-2.5 bg-white rounded-lg border border-slate-200/80">
                    <div>
                      <span className="font-bold text-slate-800 block">Restrict Record Deletion</span>
                      <span className="text-[11px] text-slate-500">Only the Workspace Head can permanently delete shared receipt scans.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRestrictDocumentDeletions(!restrictDocumentDeletions)}
                      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${restrictDocumentDeletions ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${restrictDocumentDeletions ? 'left-4.5' : 'left-0.75'}`} />
                    </button>
                  </div>

                  {/* Toggle 4: Mask Confidential Notes */}
                  <div className="flex items-start justify-between gap-3 p-2.5 bg-white rounded-lg border border-slate-200/80">
                    <div>
                      <span className="font-bold text-slate-800 block">Mask Internal Payment Notes</span>
                      <span className="text-[11px] text-slate-500">Hide internal vendor payment notes from Read-Only Auditor accounts.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMaskSensitiveNotes(!maskSensitiveNotes)}
                      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${maskSensitiveNotes ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${maskSensitiveNotes ? 'left-4.5' : 'left-0.75'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Current Workspace Members &amp; Roles</h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {teamMembers.map((m, idx) => (
                    <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-white gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-bold flex items-center justify-center text-xs shrink-0">
                          {m.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{m.email}</p>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className={m.status.includes('Active') ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                              ● {m.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                          {m.role}
                        </span>

                        {m.status.includes('Pending') && (
                          <div className="flex items-center gap-1">
                            {m.inviteLink && (
                              <button
                                type="button"
                                onClick={() => handleCopyInviteLink(m.inviteLink!)}
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                                title="Copy invitation URL to send via email/chat"
                              >
                                <Link className="w-3 h-3 text-indigo-600" /> Copy Link
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSimulateJoin(m.email)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Test accepting invitation as this team member"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirm Join
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite Modal & Email Dispatch Preview Dialog */}
              {activeInviteModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 relative overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveInviteModal(null)}
                      className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Workspace Invitation Link Ready!
                        </h3>
                        <p className="text-xs text-slate-500">
                          Copy and send this direct invitation link to <strong>{activeInviteModal.email}</strong> via email, Slack, or chat.
                        </p>
                      </div>
                    </div>

                    {/* Invitation Card Preview */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-700 font-sans">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-[11px] text-slate-500">
                        <div>
                          <strong>Invitee:</strong> {activeInviteModal.email}<br />
                          <strong>Assigned Role:</strong> <span className="font-semibold text-slate-800">{activeInviteModal.role}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          LINK CREATED
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 text-[11px] text-slate-600 leading-relaxed">
                        <p>Hello,</p>
                        <p>
                          <strong>{currentUser.name}</strong> ({currentUser.email}) has invited you to join their DocScan Enterprise Workspace as <strong>{activeInviteModal.role}</strong>.
                        </p>
                        <p>
                          You will be able to review all shared receipt &amp; invoice scans, export CSV line items, and collaborate on accounting data.
                        </p>
                      </div>
                    </div>

                    {/* Direct Copyable Link & Mailto Launcher */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Direct Invite Link
                        </label>
                        <a
                          href={`mailto:${activeInviteModal.email}?subject=${encodeURIComponent(`Invitation to join ${currentUser.name}'s DocScan Workspace`)}&body=${encodeURIComponent(`Hello,\n\nYou have been invited to join ${currentUser.name}'s DocScan Enterprise Workspace as ${activeInviteModal.role}.\n\nClick the link below to accept your invitation:\n${activeInviteModal.link}\n\nBest regards,\nDocScan Team`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Open in Email App (Gmail/Outlook)
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={activeInviteModal.link}
                          className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyInviteLink(activeInviteModal.link)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition-colors"
                        >
                          {copiedInviteLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedInviteLink ? 'Copied Link!' : 'Copy Link'}
                        </button>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleSimulateJoin(activeInviteModal.email)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Simulate Teammate Acceptance
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveInviteModal(null)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeSubTab === 'schema' && <SchemaInfo />}
    </div>
  );
};

