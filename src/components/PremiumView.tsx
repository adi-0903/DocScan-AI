import React, { useState } from 'react';
import { User } from '../types';
import {
  Crown,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Cpu,
  Infinity,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface PremiumViewProps {
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onUpgradeUserPlan: (plan: 'pro' | 'enterprise') => void;
}

export const PremiumView: React.FC<PremiumViewProps> = ({
  currentUser,
  onOpenAuth,
  onUpgradeUserPlan
}) => {
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [activatedPlanToast, setActivatedPlanToast] = useState<string | null>(null);

  const currentPlan = currentUser?.plan || 'free';

  const handleSelectPlan = (plan: 'pro' | 'enterprise') => {
    if (!currentUser) {
      onOpenAuth('register');
      return;
    }

    onUpgradeUserPlan(plan);
    setActivatedPlanToast(`Successfully upgraded to ${plan.toUpperCase()} Plan!`);
    setTimeout(() => setActivatedPlanToast(null), 3500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {activatedPlanToast && (
        <div className="p-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{activatedPlanToast}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="text-center space-y-2 max-w-lg mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 text-amber-800 text-xs font-bold">
          <Crown className="w-3.5 h-3.5 text-amber-600" /> Premium Upgrades
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          Unlock Unlimited AI Document Extraction
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Upgrade your account to remove scan limits, accelerate OCR response speed, and export structured JSON &amp; CSV tables.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 mt-2">
          <button
            type="button"
            onClick={() => setSelectedBilling('monthly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedBilling === 'monthly'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setSelectedBilling('yearly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              selectedBilling === 'yearly'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Yearly Billing
            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
              SAVE 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Free Plan */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Starter
              </span>
              {currentPlan === 'free' && (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  CURRENT
                </span>
              )}
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">$0</div>
              <p className="text-[11px] text-slate-500">Free forever for basic use</p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>25 Document Scans / Month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Gemini 3.6 Flash Vision</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Standard JSON Export</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Camera &amp; Photo Upload</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={currentPlan === 'free'}
            className="w-full py-2 px-3 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl disabled:opacity-60"
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
            onClick={() => handleSelectPlan('pro')}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 relative z-10"
          >
            {currentPlan === 'pro' ? (
              'Current Pro Plan'
            ) : (
              <>
                <Crown className="w-4 h-4 text-amber-300" /> Upgrade to Pro
              </>
            )}
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Enterprise
              </span>
              {currentPlan === 'enterprise' && (
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {selectedBilling === 'monthly' ? '$29.99' : '$23.99'}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </div>
              <p className="text-[11px] text-slate-500">For teams, accounting &amp; API access</p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Everything in Pro Plan</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Team Workspace Sharing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Custom Schema API Key Access</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Dedicated Support &amp; Audit Logs</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan('enterprise')}
            className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
          >
            {currentPlan === 'enterprise' ? 'Active Enterprise Plan' : 'Get Enterprise'}
          </button>
        </div>
      </div>
    </div>
  );
};
