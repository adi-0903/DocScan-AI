import React, { useState } from 'react';
import { ExtractedDocumentData, User } from '../types';
import { DocumentTypeBadge, ConfidenceBadge } from './FieldBadge';
import { JsonViewer } from './JsonViewer';
import { 
  Building2, Calendar, DollarSign, Tag, User as UserIcon, Phone, Mail, FileText, 
  Sparkles, Copy, Check, FileCode, Eye, Send, Edit3, Save, RefreshCw
} from 'lucide-react';

interface ResultDisplayProps {
  data: ExtractedDocumentData;
  imageUrl: string;
  onRefine: (feedback: string) => void;
  isRefining: boolean;
  onUpdateData?: (newData: ExtractedDocumentData) => void;
  currentUser?: User | null;
  onNavigateToTab?: (tab: 'scan' | 'result' | 'history' | 'premium' | 'profile') => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  data,
  imageUrl,
  onRefine,
  isRefining,
  onUpdateData,
  currentUser,
  onNavigateToTab
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'json' | 'raw_text'>('fields');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedData, setEditedData] = useState<ExtractedDocumentData>(data);
  const [showCsvLockedModal, setShowCsvLockedModal] = useState<boolean>(false);

  // Sync edits if data changes from parent
  React.useEffect(() => {
    setEditedData(data);
  }, [data]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackInput.trim()) {
      onRefine(feedbackInput.trim());
      setFeedbackInput('');
    }
  };

  const handleSaveEdits = () => {
    if (onUpdateData) {
      onUpdateData(editedData);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col space-y-0 transition-colors">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col items-start justify-between gap-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <DocumentTypeBadge type={data.document_type} />
            <ConfidenceBadge confidence={data.confidence} />
          </div>
          <h2 className="text-base sm:text-lg font-bold mt-1.5 text-white">
            {data.vendor_or_sender || data.contact_name || 'Document Extraction Result'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Classified as <strong className="text-slate-200 uppercase">{data.document_type.replace('_', ' ')}</strong>
          </p>
        </div>

        {/* Tab switcher */}
        <div className="w-full flex items-center justify-between gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveTab('fields')}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 min-h-[38px] active:scale-95 ${
              activeTab === 'fields'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Fields
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw_text')}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 min-h-[38px] active:scale-95 ${
              activeTab === 'raw_text'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 min-h-[38px] active:scale-95 ${
              activeTab === 'json'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> JSON
          </button>
          <button
            type="button"
            onClick={() => {
              const userPlan = currentUser?.plan || 'free';
              if (userPlan === 'free') {
                setShowCsvLockedModal(true);
                return;
              }
              const headers = ['Document Type', 'Vendor/Sender', 'Date', 'Amount', 'Currency', 'Due Date', 'Category', 'Contact Name', 'Contact Phone', 'Contact Email', 'Confidence'];
              const row = [
                data.document_type,
                `"${(data.vendor_or_sender || '').replace(/"/g, '""')}"`,
                data.date || '',
                data.amount ?? '',
                data.currency || '',
                data.due_date || '',
                data.category || '',
                `"${(data.contact_name || '').replace(/"/g, '""')}"`,
                data.contact_phone || '',
                data.contact_email || '',
                data.confidence
              ];
              const csvContent = [headers.join(','), row.join(',')].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `extracted_doc_${Date.now()}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="px-2.5 py-2 rounded-lg text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-slate-700/60 transition-all flex items-center justify-center gap-1 min-h-[38px]"
            title="Download CSV Table"
          >
            CSV
          </button>
        </div>
      </div>

      {/* CSV Locked Modal for Free Users */}
      {showCsvLockedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                CSV Table Export is a Pro Feature
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                You are currently on the <strong>Free Plan</strong> (25 scans/mo). Upgrade to <strong>Pro Plan</strong> to download structured CSV spreadsheet exports &amp; run unlimited document scans.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCsvLockedModal(false);
                  if (onNavigateToTab) onNavigateToTab('premium');
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Upgrade to Pro Plan
              </button>
              <button
                type="button"
                onClick={() => setShowCsvLockedModal(false)}
                className="w-full py-2 text-slate-500 hover:text-slate-800 font-semibold text-xs transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="p-5 sm:p-6 space-y-6">
        {activeTab === 'fields' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Extracted Schema Properties
              </h3>
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Manual Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vendor / Sender */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Vendor / Sender</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.vendor_or_sender || ''}
                      onChange={(e) => setEditedData({ ...editedData, vendor_or_sender: e.target.value || null })}
                      className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">
                      {data.vendor_or_sender ?? <span className="text-slate-400 font-normal italic">null</span>}
                    </p>
                  )}
                </div>
                {data.vendor_or_sender && !isEditing && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data.vendor_or_sender!, 'vendor')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'vendor' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Amount & Currency */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Total Amount &amp; Currency</span>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        step="0.01"
                        value={editedData.amount ?? ''}
                        onChange={(e) => setEditedData({ ...editedData, amount: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-2/3 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white"
                        placeholder="Amount"
                      />
                      <input
                        type="text"
                        value={editedData.currency || ''}
                        onChange={(e) => setEditedData({ ...editedData, currency: e.target.value || null })}
                        className="w-1/3 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white"
                        placeholder="USD"
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">
                      {data.amount !== null ? (
                        <span className="text-emerald-600 font-extrabold text-base">
                          {data.currency ? `${data.currency} ` : ''}${data.amount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">null</span>
                      )}
                    </p>
                  )}
                </div>
                {data.amount !== null && !isEditing && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data.amount!.toString(), 'amount')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'amount' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Date */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Document Date (YYYY-MM-DD)</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.date || ''}
                      onChange={(e) => setEditedData({ ...editedData, date: e.target.value || null })}
                      className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white"
                      placeholder="YYYY-MM-DD"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">
                      {data.date ?? <span className="text-slate-400 font-normal italic">null</span>}
                    </p>
                  )}
                </div>
                {data.date && !isEditing && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data.date!, 'date')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'date' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Due Date (only for bills) */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Calendar className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Due Date (Bills)</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.due_date || ''}
                      onChange={(e) => setEditedData({ ...editedData, due_date: e.target.value || null })}
                      className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white"
                      placeholder="YYYY-MM-DD"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">
                      {data.due_date ?? <span className="text-slate-400 font-normal italic">null</span>}
                    </p>
                  )}
                </div>
                {data.due_date && !isEditing && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data.due_date!, 'due_date')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'due_date' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Tag className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Category</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.category || ''}
                      onChange={(e) => setEditedData({ ...editedData, category: e.target.value || null })}
                      className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white"
                      placeholder="groceries, utilities, dining, travel..."
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900 capitalize">
                      {data.category ?? <span className="text-slate-400 font-normal italic">null</span>}
                    </p>
                  )}
                </div>
                {data.category && !isEditing && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data.category!, 'category')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'category' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Contact Name (Business Cards) */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <UserIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Contact Name (Business Cards)</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.contact_name || ''}
                      onChange={(e) => setEditedData({ ...editedData, contact_name: e.target.value || null })}
                      className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">
                      {data.contact_name ?? <span className="text-slate-400 font-normal italic">null</span>}
                    </p>
                  )}
                </div>
                {data.contact_name && !isEditing && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data.contact_name!, 'contact_name')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'contact_name' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Contact Phone (Business Cards) */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>Contact Phone</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.contact_phone || ''}
                      onChange={(e) => setEditedData({ ...editedData, contact_phone: e.target.value || null })}
                      className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">
                      {data.contact_phone ?? <span className="text-slate-400 font-normal italic">null</span>}
                    </p>
                  )}
                </div>
                {data.contact_phone && !isEditing && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data.contact_phone!, 'contact_phone')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'contact_phone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Contact Email (Business Cards) */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Mail className="w-4 h-4 text-pink-500 shrink-0" />
                    <span>Contact Email</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.contact_email || ''}
                      onChange={(e) => setEditedData({ ...editedData, contact_email: e.target.value || null })}
                      className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">
                      {data.contact_email ?? <span className="text-slate-400 font-normal italic">null</span>}
                    </p>
                  )}
                </div>
                {data.contact_email && !isEditing && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data.contact_email!, 'contact_email')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'contact_email' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Note Summary (Handwritten Notes) */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Note Summary (Handwritten Notes)</span>
                </div>
                {data.note_summary && !isEditing && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data.note_summary!, 'note_summary')}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                  >
                    {copiedField === 'note_summary' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={editedData.note_summary || ''}
                  onChange={(e) => setEditedData({ ...editedData, note_summary: e.target.value || null })}
                  rows={2}
                  className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                  {data.note_summary ?? <span className="text-slate-400 font-normal italic">null</span>}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Verbatim Text View */}
        {activeTab === 'raw_text' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Verbatim OCR Raw Text Read
              </h3>
              <button
                type="button"
                onClick={() => copyToClipboard(data.raw_text, 'raw_text')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                {copiedField === 'raw_text' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Verbatim Text</span>
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 text-slate-200 font-mono text-xs leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-wrap border border-slate-800">
              {data.raw_text || <span className="text-slate-500 italic">No text detected</span>}
            </div>
          </div>
        )}

        {/* Raw JSON View */}
        {activeTab === 'json' && (
          <JsonViewer data={data} />
        )}

        {/* AI Correction & Refinement Bar */}
        <div className="pt-4 border-t border-slate-100">
          <form onSubmit={handleFeedbackSubmit} className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Refine with AI Instructions</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                placeholder="e.g. Change total amount to $29.53, or re-verify due date..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
              />
              <button
                type="submit"
                disabled={!feedbackInput.trim() || isRefining}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 shrink-0 ${
                  !feedbackInput.trim() || isRefining
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
                }`}
              >
                {isRefining ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Refining...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Apply Correction</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
