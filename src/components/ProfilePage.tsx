import React, { useState, useEffect } from 'react';
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
  Eye,
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
  onSwitchUser?: (user: User) => void;
  onUpdateUser?: (user: User) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  records,
  onOpenAuth,
  onLogout,
  onClearHistory,
  onNavigateToTab,
  onUpgradeUserPlan,
  onSwitchUser,
  onUpdateUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'team' | 'schema'>('profile');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Helper to load workspace team members from both dedicated storage and global users DB
  const getOwnerEmail = (user: User | null): string => {
    if (!user) return '';
    return (user.workspaceOwnerEmail || user.email || '').toLowerCase().trim();
  };

  const loadWorkspaceTeamMembers = (user: User | null) => {
    if (!user) return [];
    const ownerEmail = getOwnerEmail(user);
    if (!ownerEmail) return [];

    const membersMap: Record<string, { email: string; role: string; status: string; password?: string; inviteLink?: string }> = {};

    membersMap[ownerEmail] = {
      email: ownerEmail,
      role: 'Workspace Head (Owner)',
      status: 'Active (Owner)',
      password: '••••••••'
    };

    try {
      const saved = localStorage.getItem(`docscan_team_members_${ownerEmail}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((m) => {
            if (m && m.email) {
              const em = m.email.toLowerCase();
              membersMap[em] = {
                email: m.email,
                role: m.role || 'Accountant',
                status: m.status || 'Active (Account Created)',
                password: m.password || 'DocScan#8492',
                inviteLink: m.inviteLink
              };
            }
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load team members:', err);
    }

    try {
      const USERS_STORAGE_KEY = 'doc_extractor_users_db_v1';
      const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (usersRaw) {
        const usersDb: Record<string, { user: User; passwordHash: string }> = JSON.parse(usersRaw);
        Object.values(usersDb).forEach(({ user, passwordHash }) => {
          if (!user || !user.email) return;
          const uEmail = user.email.toLowerCase();
          const uOwner = (user.workspaceOwnerEmail || '').toLowerCase();

          if (uEmail === ownerEmail || uOwner === ownerEmail) {
            if (!membersMap[uEmail]) {
              const isOwner = uEmail === ownerEmail;
              membersMap[uEmail] = {
                email: user.email,
                role: isOwner ? 'Workspace Head (Owner)' : (user.workspaceRole || 'Accountant'),
                status: isOwner ? 'Active (Owner)' : 'Active (Account Created)',
                password: user.tempPassword || passwordHash || 'DocScan#8492'
              };
            } else {
              if (user.tempPassword || passwordHash) {
                membersMap[uEmail].password = user.tempPassword || passwordHash;
              }
              if (user.workspaceRole) {
                membersMap[uEmail].role = user.workspaceRole;
              }
            }
          }
        });
      }
    } catch (err) {
      console.warn('Failed to scan users DB for workspace members:', err);
    }

    return Object.values(membersMap);
  };

  // Team Workspace State with LocalStorage & DB persistence
  const [teamMembers, setTeamMembers] = useState<Array<{
    email: string;
    role: string;
    status: string;
    password?: string;
    inviteLink?: string;
  }>>(() => loadWorkspaceTeamMembers(currentUser));

  useEffect(() => {
    if (currentUser) {
      setTeamMembers(loadWorkspaceTeamMembers(currentUser));
    }
  }, [currentUser?.email, currentUser?.workspaceOwnerEmail]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Accountant' | 'Auditor' | 'Editor' | 'Member'>('Accountant');
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Password Change State
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // Workspace Document Visibility & Sharing Settings
  const [autoShareScans, setAutoShareScans] = useState(true);
  const [allowAccountantExport, setAllowAccountantExport] = useState(true);
  const [restrictDocumentDeletions, setRestrictDocumentDeletions] = useState(true);
  const [maskSensitiveNotes, setMaskSensitiveNotes] = useState(false);

  // Check if current logged-in user is the Workspace Head (Owner)
  const isWorkspaceOwner = !currentUser?.isWorkspaceMember && (!currentUser?.workspaceOwnerEmail || currentUser?.workspaceOwnerEmail.toLowerCase() === currentUser?.email.toLowerCase());

  // Invite Modal & Dispatch Preview State
  const [activeInviteModal, setActiveInviteModal] = useState<{
    email: string;
    role: string;
    password: string;
    token: string;
    link: string;
    teammateUser?: User;
  } | null>(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

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

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWorkspaceOwner) {
      alert('Only the Workspace Head (Owner) has permission to invite new team members.');
      return;
    }
    const emailToInvite = inviteEmail.trim().toLowerCase();
    if (!emailToInvite) return;

    const ownerEmail = getOwnerEmail(currentUser);

    // Auto upgrade owner plan to Enterprise if not already upgraded
    if (currentUser.plan !== 'enterprise' && onUpgradeUserPlan) {
      onUpgradeUserPlan('enterprise');
    }

    // Generate auto password
    const random4 = Math.floor(1000 + Math.random() * 9000);
    const tempPassword = `DocScan#${random4}`;

    const roleTitle = inviteRole;
    const fullRoleDescription = `${roleTitle} (${roleTitle === 'Accountant' ? 'Full View' : roleTitle === 'Auditor' ? 'Read-Only' : roleTitle === 'Editor' ? 'Scan & Edit' : 'Member'})`;

    // Auto-Register Teammate in USERS_STORAGE_KEY
    const USERS_STORAGE_KEY = 'doc_extractor_users_db_v1';
    let usersMap: Record<string, { user: User; passwordHash: string }> = {};
    try {
      const existing = localStorage.getItem(USERS_STORAGE_KEY);
      if (existing) {
        usersMap = JSON.parse(existing);
      }
    } catch (err) {
      console.warn('Error reading user db:', err);
    }

    const nameFromEmail = emailToInvite
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const newTeammateUser: User = {
      id: 'usr_team_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: nameFromEmail || 'Workspace Teammate',
      email: emailToInvite,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emailToInvite)}`,
      createdAt: new Date().toISOString(),
      plan: 'enterprise',
      workspaceOwnerEmail: ownerEmail,
      workspaceRole: fullRoleDescription,
      isWorkspaceMember: true,
      tempPassword: tempPassword
    };

    usersMap[emailToInvite] = {
      user: newTeammateUser,
      passwordHash: tempPassword
    };

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersMap));

    const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const link = `${window.location.origin}?invite_workspace=${encodeURIComponent(currentUser.name || 'Enterprise')}&email=${encodeURIComponent(emailToInvite)}&token=${token}`;

    const newMemberEntry = {
      email: emailToInvite,
      role: fullRoleDescription,
      status: 'Active (Account Created)',
      password: tempPassword,
      inviteLink: link
    };

    const updatedList = [...teamMembers.filter((m) => m.email.toLowerCase() !== emailToInvite), newMemberEntry];
    setTeamMembers(updatedList);
    try {
      localStorage.setItem(`docscan_team_members_${ownerEmail}`, JSON.stringify(updatedList));
    } catch (err) {
      console.warn('Error saving team members:', err);
    }

    // Trigger backend email dispatch notification
    try {
      fetch('/api/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: emailToInvite,
          tempPassword: tempPassword,
          role: fullRoleDescription,
          workspaceName: currentUser.name || 'Enterprise',
          workspaceOwnerEmail: currentUser.email,
          inviteLink: link
        })
      }).catch(err => console.warn('Email dispatch notice:', err));
    } catch (err) {
      console.warn('Email API call error:', err);
    }

    setInviteEmail('');
    setInviteSuccess(`Account generated for ${emailToInvite}! Password (${tempPassword}) sent & dispatched.`);
    setTimeout(() => setInviteSuccess(null), 8000);

    setActiveInviteModal({
      email: emailToInvite,
      role: fullRoleDescription,
      password: tempPassword,
      token,
      link,
      teammateUser: newTeammateUser
    });
  };

  const handleCopyInviteLink = (linkToCopy: string) => {
    navigator.clipboard.writeText(linkToCopy);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2500);
  };

  const handleCopyCredentials = (email: string, pass: string, role: string) => {
    const text = `DocScan Enterprise Workspace Credentials:\nEmail: ${email}\nPassword: ${pass}\nRole: ${role}\nSupervisor: ${currentUser.email}\nPlan: Enterprise Plan`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const handleSwitchToTeammate = (emailToSwitch: string) => {
    const USERS_STORAGE_KEY = 'doc_extractor_users_db_v1';
    try {
      const existing = localStorage.getItem(USERS_STORAGE_KEY);
      if (existing) {
        const usersMap = JSON.parse(existing);
        const record = usersMap[emailToSwitch.toLowerCase()];
        if (record && record.user && onSwitchUser) {
          onSwitchUser(record.user);
          if (activeInviteModal) setActiveInviteModal(null);
          return;
        }
      }
    } catch (err) {
      console.warn('Error switching user', err);
    }
  };

  const handleSimulateJoin = (emailToActivate: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.email === emailToActivate ? { ...m, status: 'Active (Joined)' } : m))
    );
    if (activeInviteModal?.email === emailToActivate) {
      setActiveInviteModal(null);
    }
    setInviteSuccess(`Teammate ${emailToActivate} has accepted the invitation and joined the workspace!`);
    setTimeout(() => setInviteSuccess(null), 4000);
  };

  const handleRemoveMember = (emailToRemove: string) => {
    if (!isWorkspaceOwner) {
      alert('Only the Workspace Head (Owner) can revoke teammate access.');
      return;
    }
    if (!confirm(`Are you sure you want to remove ${emailToRemove} from this Enterprise Workspace?`)) {
      return;
    }

    const ownerEmail = getOwnerEmail(currentUser);
    const updatedList = teamMembers.filter((m) => m.email.toLowerCase() !== emailToRemove.toLowerCase());
    setTeamMembers(updatedList);
    try {
      localStorage.setItem(`docscan_team_members_${ownerEmail}`, JSON.stringify(updatedList));
    } catch (err) {
      console.warn('Error saving team members list:', err);
    }

    // Remove from USERS_STORAGE_KEY
    const USERS_STORAGE_KEY = 'doc_extractor_users_db_v1';
    try {
      const existing = localStorage.getItem(USERS_STORAGE_KEY);
      if (existing) {
        const usersMap = JSON.parse(existing);
        delete usersMap[emailToRemove.toLowerCase()];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersMap));
      }
    } catch (err) {
      console.warn('Error removing user from DB:', err);
    }

    setInviteSuccess(`Access revoked for ${emailToRemove}. User can no longer access this workspace.`);
    setTimeout(() => setInviteSuccess(null), 5000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setPasswordChangeError('Password must be at least 6 characters long.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('Passwords do not match.');
      return;
    }

    const USERS_STORAGE_KEY = 'doc_extractor_users_db_v1';
    try {
      const existing = localStorage.getItem(USERS_STORAGE_KEY);
      if (existing) {
        const usersMap = JSON.parse(existing);
        const emailKey = currentUser.email.toLowerCase();
        if (usersMap[emailKey]) {
          usersMap[emailKey].passwordHash = newPasswordInput;
          usersMap[emailKey].user.tempPassword = newPasswordInput;
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersMap));
        }
      }
    } catch (err) {
      console.warn('Failed updating password in users DB:', err);
    }

    // Update currentUser
    const updated = { ...currentUser, tempPassword: newPasswordInput };
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    localStorage.setItem('doc_extractor_current_user_v1', JSON.stringify(updated));

    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordChangeError(null);
    setPasswordChangeSuccess('Password updated successfully!');
    setTimeout(() => setPasswordChangeSuccess(null), 4000);
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

            {/* Enterprise Managed Workspace Teammate Card */}
            {(currentUser.isWorkspaceMember || currentUser.workspaceOwnerEmail || currentUser.plan === 'enterprise') && (
              <div className="p-4 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-500/30 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-bold text-white">
                      Enterprise Team Member Workspace
                    </span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ENTERPRISE PLAN
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Working Under (Workspace Head)
                    </span>
                    <strong className="text-white text-xs block mt-0.5 truncate">
                      {currentUser.workspaceOwnerEmail || currentUser.email}
                    </strong>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Assigned Workspace Role
                    </span>
                    <strong className="text-amber-300 text-xs block mt-0.5 truncate">
                      {currentUser.workspaceRole || 'Workspace Owner (Head)'}
                    </strong>
                  </div>
                </div>

                {currentUser.tempPassword && (
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Assigned Password
                      </span>
                      <strong className="text-indigo-200 text-xs font-mono">
                        {currentUser.tempPassword}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(currentUser.tempPassword || '');
                        setCopiedCreds(true);
                        setTimeout(() => setCopiedCreds(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg border border-white/15 transition-colors flex items-center gap-1"
                    >
                      {copiedCreds ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      {copiedCreds ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            )}

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

              {/* Password Change Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Update Account Password</span>
                </div>

                {passwordChangeSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{passwordChangeSuccess}</span>
                  </div>
                )}

                {passwordChangeError && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs font-medium flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{passwordChangeError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="password"
                      required
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="New password (min 6 chars)..."
                      className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input
                      type="password"
                      required
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Confirm new password..."
                      className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Lock className="w-3.5 h-3.5" /> Save New Password
                  </button>
                </form>
              </div>

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

              {!isWorkspaceOwner ? (
                <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl text-amber-900 text-xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                    <Shield className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <span className="font-bold block text-amber-950">Workspace Invite Permission Restricted</span>
                    <p className="text-[11px] text-amber-800">
                      Only the <strong>Workspace Head (Owner)</strong> ({currentUser.workspaceOwnerEmail || 'Workspace Head'}) has permission to invite new team members or issue credentials to this Enterprise workspace.
                    </p>
                  </div>
                </div>
              ) : (
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
              )}

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
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Current Workspace Members &amp; Auto-Provisioned Accounts</h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {teamMembers.map((m, idx) => {
                    const isOwner = m.email === currentUser.email;
                    const pass = m.password || 'DocScan#8492';
                    const isVisible = showPasswordMap[m.email];

                    return (
                      <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-white dark:bg-slate-900 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {m.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800 dark:text-slate-100">{m.email}</p>
                              {isOwner && (
                                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded font-bold">
                                  YOU (HEAD)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                              <span className={m.status.includes('Active') ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                                ● {m.status}
                              </span>
                              {!isOwner && isWorkspaceOwner && (
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">
                                  <span>Pass: {isVisible ? pass : '••••••••'}</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswordMap(prev => ({ ...prev, [m.email]: !prev[m.email] }))}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                            {m.role}
                          </span>

                          {!isOwner && isWorkspaceOwner && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(m.email, pass, m.role)}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors border border-slate-200/80 dark:border-slate-700"
                                title="Copy email and password credentials"
                              >
                                <Copy className="w-3 h-3 text-slate-500" /> Copy Pass
                              </button>

                              {onSwitchUser && (
                                <button
                                  type="button"
                                  onClick={() => handleSwitchToTeammate(m.email)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                                  title="Sign in directly as this team member"
                                >
                                  <UserIcon className="w-3 h-3 text-indigo-200" /> Log In
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.email)}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors border border-red-200 dark:border-red-900/50"
                                title="Revoke workspace access for this member"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" /> Revoke
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invite Modal & Account Auto-Generation Dialog */}
              {activeInviteModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden text-slate-900 dark:text-white">
                    <button
                      type="button"
                      onClick={() => setActiveInviteModal(null)}
                      className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-sm">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          Account Provisioned &amp; Password Created!
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                            ENTERPRISE
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Teammate <strong>{activeInviteModal.email}</strong> can now log in immediately with the auto-generated password below.
                        </p>
                      </div>
                    </div>

                    {/* Auto Credentials Card Box */}
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-xl p-4 space-y-3 text-white text-xs shadow-md">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px]">
                        <span className="font-bold text-amber-300 uppercase tracking-wider">
                          GENERATED USER CREDENTIALS
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          READY FOR LOG IN
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">
                            Account Email
                          </span>
                          <strong className="text-white text-xs block mt-0.5 font-mono truncate">
                            {activeInviteModal.email}
                          </strong>
                        </div>

                        <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">
                            Auto-Generated Password
                          </span>
                          <strong className="text-amber-300 text-xs block mt-0.5 font-mono">
                            {activeInviteModal.password}
                          </strong>
                        </div>

                        <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">
                            Assigned Enterprise Role
                          </span>
                          <strong className="text-indigo-200 text-xs block mt-0.5">
                            {activeInviteModal.role}
                          </strong>
                        </div>

                        <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">
                            Workspace Head (Owner)
                          </span>
                          <strong className="text-white text-xs block mt-0.5 truncate">
                            {currentUser.email}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Direct Copyable Link & Credentials Launcher */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Direct Workspace Invitation URL
                        </label>
                        <a
                          href={`mailto:${activeInviteModal.email}?subject=${encodeURIComponent(`Enterprise Workspace Access Credentials - ${currentUser.name}`)}&body=${encodeURIComponent(`Hello,\n\nYour account has been automatically provisioned for ${currentUser.name}'s DocScan Enterprise Workspace!\n\nEmail: ${activeInviteModal.email}\nPassword: ${activeInviteModal.password}\nRole: ${activeInviteModal.role}\nSupervisor: ${currentUser.email}\nPlan: Enterprise Plan\n\nDirect Link:\n${activeInviteModal.link}\n\nBest regards,\nDocScan Team`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Send Credentials via Email
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={activeInviteModal.link}
                          className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyInviteLink(activeInviteModal.link)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition-colors"
                        >
                          {copiedInviteLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedInviteLink ? 'Copied!' : 'Copy Link'}
                        </button>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(activeInviteModal.email, activeInviteModal.password, activeInviteModal.role)}
                        className="w-full sm:flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-4 h-4 text-amber-300" />
                        {copiedCreds ? 'Credentials Copied!' : 'Copy Full Credentials'}
                      </button>

                      {onSwitchUser && (
                        <button
                          type="button"
                          onClick={() => handleSwitchToTeammate(activeInviteModal.email)}
                          className="w-full sm:flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <UserIcon className="w-4 h-4 text-indigo-200" /> Sign In as Teammate Now
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveInviteModal(null)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
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

