import React, { useState } from 'react';
import { ExtractionRecord, DocumentType, User } from '../types';
import { DocumentTypeBadge, ConfidenceBadge } from './FieldBadge';
import { 
  Database, Search, Filter, Trash2, Download, Eye, Calendar, DollarSign, Building2, User as UserIcon, Users, Share2, Lock, CheckCircle2
} from 'lucide-react';

interface DocumentHistoryProps {
  records: ExtractionRecord[];
  onSelectRecord: (record: ExtractionRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  currentUser?: User | null;
  onToggleShareWithTeam?: (id: string) => void;
}

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
  currentUser,
  onToggleShareWithTeam
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [teamShareFilter, setTeamShareFilter] = useState<'all' | 'shared'>('all');

  const isEnterprise = currentUser?.plan === 'enterprise';

  const filteredRecords = records.filter((rec) => {
    const matchesType = typeFilter === 'all' || rec.data.document_type === typeFilter;
    const matchesTeamShare = teamShareFilter === 'all' || (teamShareFilter === 'shared' && rec.isSharedWithTeam);
    const vendorOrName = rec.data.vendor_or_sender || rec.data.contact_name || '';
    const rawText = rec.data.raw_text || '';
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      vendorOrName.toLowerCase().includes(search) ||
      rawText.toLowerCase().includes(search) ||
      rec.data.document_type.toLowerCase().includes(search);
    return matchesType && matchesTeamShare && matchesSearch;
  });

  const exportAsCsv = () => {
    if (records.length === 0) return;

    const headers = [
      'ID',
      'Document Type',
      'Vendor/Sender',
      'Date',
      'Amount',
      'Currency',
      'Due Date',
      'Category',
      'Contact Name',
      'Contact Phone',
      'Contact Email',
      'Confidence',
      'Timestamp'
    ];

    const rows = records.map((r) => [
      r.id,
      r.data.document_type,
      `"${(r.data.vendor_or_sender || '').replace(/"/g, '""')}"`,
      r.data.date || '',
      r.data.amount ?? '',
      r.data.currency || '',
      r.data.due_date || '',
      r.data.category || '',
      `"${(r.data.contact_name || '').replace(/"/g, '""')}"`,
      r.data.contact_phone || '',
      r.data.contact_email || '',
      r.data.confidence,
      r.timestamp
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document_scans_export_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJson = () => {
    if (records.length === 0) return;
    const jsonString = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document_scans_export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Saved Scans &amp; History
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, search, and export previously extracted document records
          </p>
        </div>

        {records.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={exportAsCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors border border-transparent dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              type="button"
              onClick={exportAsJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors border border-transparent dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5" /> JSON
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/80 text-red-600 dark:text-red-300 text-xs font-semibold rounded-xl transition-colors border border-transparent dark:border-red-800/50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by vendor, raw text, or document type..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 transition-colors"
            >
              <option value="all">All Document Types</option>
              <option value="receipt">Receipts</option>
              <option value="bill">Bills &amp; Invoices</option>
              <option value="business_card">Business Cards</option>
              <option value="handwritten_note">Handwritten Notes</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {isEnterprise && (
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/80 w-fit">
            <button
              type="button"
              onClick={() => setTeamShareFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                teamShareFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All My Documents ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setTeamShareFilter('shared')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                teamShareFilter === 'shared'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Shared with Team ({records.filter(r => r.isSharedWithTeam).length})
            </button>
          </div>
        )}
      </div>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
          <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No document records found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {records.length === 0
              ? 'Upload or capture a document above to get started with automatic extraction.'
              : 'No records match your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
          {filteredRecords.map((rec) => {
            const vendor = rec.data.vendor_or_sender || rec.data.contact_name || rec.fileName || 'Document';
            return (
              <div
                key={rec.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800 transition-all flex items-start gap-3 justify-between group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {rec.imageUrl ? (
                    <img
                      src={rec.imageUrl}
                      alt={vendor}
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-900"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      DOC
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <DocumentTypeBadge type={rec.data.document_type} />
                      <ConfidenceBadge confidence={rec.data.confidence} />
                      {rec.isSharedWithTeam && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Team Shared
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {vendor}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      {rec.data.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {rec.data.date}
                        </span>
                      )}
                      {rec.data.amount !== null && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <DollarSign className="w-3 h-3" /> {rec.data.currency || '$'}{rec.data.amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isEnterprise && onToggleShareWithTeam && (
                    <button
                      type="button"
                      onClick={() => onToggleShareWithTeam(rec.id)}
                      className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold ${
                        rec.isSharedWithTeam
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={rec.isSharedWithTeam ? "Shared with Team workspace. Click to unshare." : "Private bill. Click to share with Team workspace."}
                    >
                      {rec.isSharedWithTeam ? <Users className="w-3.5 h-3.5 text-blue-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                      <span className="hidden sm:inline">{rec.isSharedWithTeam ? 'Shared' : 'Share'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectRecord(rec)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRecord(rec.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
