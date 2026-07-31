import React from 'react';
import { ConfidenceLevel, DocumentType } from '../types';
import { Receipt, FileText, CreditCard, PenTool, FileQuestion, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface TypeBadgeProps {
  type: DocumentType;
}

export const DocumentTypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
  const config = {
    receipt: {
      label: 'Receipt',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <Receipt className="w-3.5 h-3.5 text-emerald-600" />
    },
    bill: {
      label: 'Bill / Invoice',
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <FileText className="w-3.5 h-3.5 text-blue-600" />
    },
    business_card: {
      label: 'Business Card',
      bg: 'bg-purple-50 border-purple-200 text-purple-800',
      icon: <CreditCard className="w-3.5 h-3.5 text-purple-600" />
    },
    handwritten_note: {
      label: 'Handwritten Note',
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <PenTool className="w-3.5 h-3.5 text-amber-600" />
    },
    other: {
      label: 'Other Document',
      bg: 'bg-slate-100 border-slate-200 text-slate-800',
      icon: <FileQuestion className="w-3.5 h-3.5 text-slate-600" />
    }
  };

  const item = config[type] || config.other;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${item.bg}`}>
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  const config = {
    high: {
      label: 'High Confidence',
      bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
    },
    medium: {
      label: 'Medium Confidence',
      bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
    },
    low: {
      label: 'Low Confidence',
      bg: 'bg-red-500/10 text-red-600 border-red-500/20',
      icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" />
    }
  };

  const item = config[confidence] || config.low;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${item.bg}`}>
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};
