import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  Crown,
  CheckCircle2,
  Users,
  Shield,
  Search,
  Zap,
  Building2,
  RefreshCw,
  Clock,
  UserCheck,
  AlertCircle,
  Sparkles,
  PhoneCall,
  Mail,
  Sliders
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  currentUser: User | null;
  onAdminSetUserPlan: (userEmail: string, plan: 'free' | 'pro' | 'enterprise') => void;
}

const UPGRADE_REQUESTS_KEY = 'docscan_upgrade_requests_v1';
const USERS_STORAGE_KEY = 'doc_extractor_users_db_v1';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onAdminSetUserPlan
}) => {
  const [usersList, setUsersList] = useState<Array<{ user: User; passwordHash: string }>>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{ email: string; name: string; plan: string; timestamp: string }>>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro' | 'enterprise'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
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
      console.warn('Failed to load admin dashboard data:', err);
    }
  };

  const handleActivatePlan = (email: string, plan: 'free' | 'pro' | 'enterprise') => {
    onAdminSetUserPlan(email, plan);

    // Also remove from pending requests if present
    try {
      const reqsRaw = localStorage.getItem(UPGRADE_REQUESTS_KEY);
      if (reqsRaw) {
        const reqs: any[] = JSON.parse(reqsRaw);
        const filtered = reqs.filter((r) => r.email.toLowerCase() !== email.toLowerCase());
        localStorage.setItem(UPGRADE_REQUESTS_KEY, JSON.stringify(filtered));
        setPendingRequests(filtered);
      }
    } catch (err) {
      console.warn('Failed updating pending requests:', err);
    }

    loadData();
    setToastMessage(`Plan for ${email} updated to ${plan.toUpperCase()}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered users list
  const filteredUsers = usersList.filter(({ user }) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || (user.plan || 'free') === planFilter;
    return matchesSearch && matchesPlan;
  });

  // Calculate statistics
  const totalUsers = usersList.length;
  const proUsersCount = usersList.filter(({ user }) => user.plan === 'pro').length;
  const enterpriseUsersCount = usersList.filter(({ user }) => user.plan === 'enterprise').length;
  const freeUsersCount = totalUsers - proUsersCount - enterpriseUsersCount;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6 transition-colors">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Admin Dashboard Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-xl space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/80 text-white flex items-center justify-center border border-indigo-400/40 shrink-0 shadow-md">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Master Admin Portal
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  MASTER ACCESS
                </span>
              </h2>
              <p className="text-xs text-indigo-200">
                Manage user accounts and activate Pro / Enterprise subscriptions with 1-click.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 self-start sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh List
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Registered</span>
            <strong className="text-lg font-black text-white">{totalUsers}</strong>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Pro Active</span>
            <strong className="text-lg font-black text-indigo-300">{proUsersCount}</strong>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Enterprise Active</span>
            <strong className="text-lg font-black text-amber-300">{enterpriseUsersCount}</strong>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Free Tier</span>
            <strong className="text-lg font-black text-slate-300">{freeUsersCount}</strong>
          </div>
        </div>
      </div>

      {/* Pending Upgrade Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Pending Upgrade Contact Requests ({pendingRequests.length})
            </h3>
            <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold px-2 py-0.5 rounded-full">
              ACTION REQUIRED
            </span>
          </div>

          <div className="space-y-2">
            {pendingRequests.map((req, i) => (
              <div
                key={i}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 dark:text-white font-bold">{req.name}</strong>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-bold">
                      Requested: {req.plan}
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] block">{req.email}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleActivatePlan(req.email, 'pro')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" /> Activate PRO
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActivatePlan(req.email, 'enterprise')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                  >
                    <Crown className="w-3.5 h-3.5" /> Activate ENTERPRISE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setPlanFilter('all')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                planFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              All Users
            </button>
            <button
              type="button"
              onClick={() => setPlanFilter('free')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                planFilter === 'free'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Free
            </button>
            <button
              type="button"
              onClick={() => setPlanFilter('pro')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                planFilter === 'pro'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Pro
            </button>
            <button
              type="button"
              onClick={() => setPlanFilter('enterprise')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                planFilter === 'enterprise'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Enterprise
            </button>
          </div>
        </div>

        {/* Users List Cards */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No users found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different keyword or plan filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(({ user }, index) => {
              const uPlan = user.plan || 'free';
              const isMaster = user.email.toLowerCase() === 'singhaladitya611@gmail.com';

              return (
                <div
                  key={index}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`}
                      alt={user.name}
                      className="w-10 h-10 rounded-xl bg-indigo-600 border border-slate-300 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {user.name}
                        </h4>
                        {isMaster && (
                          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full shrink-0">
                            MASTER ADMIN
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                            uPlan === 'enterprise'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : uPlan === 'pro'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {uPlan}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Plan Activation Controls */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1 hidden sm:inline">
                      1-Click Upgrade:
                    </span>

                    <button
                      type="button"
                      onClick={() => handleActivatePlan(user.email, 'free')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        uPlan === 'free'
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-default'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      Free
                    </button>

                    <button
                      type="button"
                      onClick={() => handleActivatePlan(user.email, 'pro')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        uPlan === 'pro'
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-sm'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Activate PRO
                    </button>

                    <button
                      type="button"
                      onClick={() => handleActivatePlan(user.email, 'enterprise')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                        uPlan === 'enterprise'
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-sm'
                          : 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-500 hover:text-slate-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5" /> Activate ENTERPRISE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
