import React, { useState } from 'react';
import { ExtractedDocumentData, DynamicField, User } from '../types';
import { DocumentTypeBadge, ConfidenceBadge } from './FieldBadge';
import { JsonViewer } from './JsonViewer';
import { 
  Building2, Calendar, DollarSign, Tag, User as UserIcon, Phone, Mail, FileText, 
  Sparkles, Copy, Check, FileCode, Eye, Send, Edit3, Save, RefreshCw, Download, Plus, Trash2, HelpCircle
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

  // New custom property state for manual editing
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);

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
    setShowAddFieldForm(false);
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim() || !newFieldValue.trim()) return;
    const currentDynamic = editedData.dynamic_fields || [];
    const newField: DynamicField = {
      key: newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      label: newFieldLabel.trim(),
      value: newFieldValue.trim()
    };
    setEditedData({
      ...editedData,
      dynamic_fields: [...currentDynamic, newField]
    });
    setNewFieldLabel('');
    setNewFieldValue('');
    setShowAddFieldForm(false);
  };

  const handleRemoveDynamicField = (index: number) => {
    const currentDynamic = [...(editedData.dynamic_fields || [])];
    currentDynamic.splice(index, 1);
    setEditedData({ ...editedData, dynamic_fields: currentDynamic });
  };

  // Helper to trigger PDF document export
  const handleDownloadPdf = () => {
    const docTitle = data.document_title || data.vendor_or_sender || data.contact_name || 'Document Scan Summary';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to generate PDF report.');
      return;
    }

    // Build fields list for PDF table
    const presentFields: { label: string; value: string }[] = [];
    if (data.vendor_or_sender) presentFields.push({ label: 'Vendor / Sender', value: data.vendor_or_sender });
    if (data.amount !== null && data.amount !== undefined) {
      presentFields.push({ label: 'Amount', value: `${data.currency ? data.currency + ' ' : ''}${data.amount.toFixed(2)}` });
    }
    if (data.date) presentFields.push({ label: 'Document Date', value: data.date });
    if (data.due_date) presentFields.push({ label: 'Due Date', value: data.due_date });
    if (data.category) presentFields.push({ label: 'Category', value: data.category });
    if (data.contact_name) presentFields.push({ label: 'Contact Name', value: data.contact_name });
    if (data.contact_phone) presentFields.push({ label: 'Contact Phone', value: data.contact_phone });
    if (data.contact_email) presentFields.push({ label: 'Contact Email', value: data.contact_email });
    if (data.note_summary) presentFields.push({ label: 'Summary', value: data.note_summary });
    if (data.dynamic_fields && data.dynamic_fields.length > 0) {
      data.dynamic_fields.forEach(df => {
        if (df.value) presentFields.push({ label: df.label, value: df.value });
      });
    }

    const rowsHtml = presentFields
      .map(
        f => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 35%; text-transform: capitalize;">${f.label}</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">${f.value}</td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle} - Scan Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .badge { display: inline-block; padding: 4px 10px; background: #e0e7ff; color: #3730a3; font-weight: 700; font-size: 11px; border-radius: 20px; text-transform: uppercase; }
            .section { margin-top: 28px; }
            .section-title { font-size: 14px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; background: #f8fafc; border-radius: 8px; overflow: hidden; }
            .raw-text { background: #0f172a; color: #f1f5f9; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all; }
            .image-preview { max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid #cbd5e1; object-fit: contain; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">${docTitle}</h1>
              <div class="subtitle">Extracted Document Report &bull; ${new Date().toLocaleDateString()}</div>
            </div>
            <div>
              <span class="badge">${data.document_type.replace('_', ' ')}</span>
            </div>
          </div>

          ${imageUrl ? `<div class="section"><div class="section-title">Document Preview</div><img src="${imageUrl}" class="image-preview" /></div>` : ''}

          <div class="section">
            <div class="section-title">Extracted Properties</div>
            <table>
              <tbody>
                ${rowsHtml || '<tr><td colspan="2" style="padding:12px; text-align:center; color:#64748b;">No structured fields extracted</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Verbatim Text Read (OCR)</div>
            <div class="raw-text">${data.raw_text || 'No text extracted.'}</div>
          </div>

          <div class="footer">
            Generated by DocScan AI &bull; Smart Vision Document Parser
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Determine if there are any core or dynamic fields to render
  const hasVendor = Boolean(data.vendor_or_sender);
  const hasAmount = data.amount !== null && data.amount !== undefined;
  const hasDate = Boolean(data.date);
  const hasDueDate = Boolean(data.due_date);
  const hasCategory = Boolean(data.category);
  const hasContactName = Boolean(data.contact_name);
  const hasContactPhone = Boolean(data.contact_phone);
  const hasContactEmail = Boolean(data.contact_email);
  const hasNoteSummary = Boolean(data.note_summary);
  const hasDynamicFields = Boolean(data.dynamic_fields && data.dynamic_fields.length > 0);

  const hasAnyField =
    hasVendor ||
    hasAmount ||
    hasDate ||
    hasDueDate ||
    hasCategory ||
    hasContactName ||
    hasContactPhone ||
    hasContactEmail ||
    hasNoteSummary ||
    hasDynamicFields;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col space-y-0 transition-colors">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col items-start justify-between gap-3 border-b border-slate-800">
        <div className="w-full flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <DocumentTypeBadge type={data.document_type} />
              <ConfidenceBadge confidence={data.confidence} />
            </div>
            <h2 className="text-base sm:text-lg font-bold mt-1.5 text-white">
              {data.document_title || data.vendor_or_sender || data.contact_name || 'Document Extraction Result'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Classified as <strong className="text-slate-200 uppercase">{data.document_type.replace('_', ' ')}</strong>
            </p>
          </div>

          {/* Download PDF & CSV Quick Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
              title="Download PDF Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const userPlan = currentUser?.plan || 'free';
                if (userPlan === 'free') {
                  setShowCsvLockedModal(true);
                  return;
                }
                const headers = ['Document Title', 'Document Type', 'Vendor/Sender', 'Date', 'Amount', 'Currency', 'Due Date', 'Category', 'Contact Name', 'Contact Phone', 'Contact Email', 'Confidence'];
                const row = [
                  `"${(data.document_title || '').replace(/"/g, '""')}"`,
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
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
              title="Download CSV Table"
            >
              CSV
            </button>
          </div>
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
            <Eye className="w-3.5 h-3.5" /> Extracted Properties
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
            <FileText className="w-3.5 h-3.5" /> Verbatim Text
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
            <FileCode className="w-3.5 h-3.5" /> Raw JSON
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
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Extracted Properties ({hasAnyField ? 'Detected' : 'Custom'})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Only non-null attributes extracted from this specific document are shown below.
                </p>
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFieldForm(!showAddFieldForm)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Property
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit / Add Fields
                </button>
              )}
            </div>

            {/* Add Custom Field Form in Edit Mode */}
            {isEditing && showAddFieldForm && (
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 dark:bg-slate-800/80 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" /> Add Custom Property
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="Field Label (e.g. Invoice #, Expiry Date)"
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="Field Value (e.g. INV-9042)"
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddFieldForm(false)}
                    className="px-3 py-1 text-xs text-slate-500 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Save Property
                  </button>
                </div>
              </div>
            )}

            {/* Empty State if no structured properties detected */}
            {!hasAnyField && !isEditing && (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-500">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  No Specific Structured Fields Detected
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All verbatim text was extracted into the "Verbatim Text" tab. Click <strong>Edit / Add Fields</strong> above to add custom properties manually.
                </p>
              </div>
            )}

            {/* Dynamic Non-Null Field Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Document Title (if present or editing) */}
              {(Boolean(data.document_title) || isEditing) && (
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between">
                  <div className="space-y-1 w-full">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Document Title</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.document_title || ''}
                        onChange={(e) => setEditedData({ ...editedData, document_title: e.target.value || null })}
                        className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        placeholder="Title"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {data.document_title}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Vendor / Sender */}
              {(hasVendor || (isEditing && Boolean(editedData.vendor_or_sender))) && (
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between">
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
                        className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {data.vendor_or_sender}
                      </p>
                    )}
                  </div>
                  {data.vendor_or_sender && !isEditing && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(data.vendor_or_sender!, 'vendor')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {copiedField === 'vendor' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}

              {/* Amount & Currency */}
              {(hasAmount || (isEditing && editedData.amount !== null)) && (
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between">
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
                          className="w-2/3 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          placeholder="Amount"
                        />
                        <input
                          type="text"
                          value={editedData.currency || ''}
                          onChange={(e) => setEditedData({ ...editedData, currency: e.target.value || null })}
                          className="w-1/3 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          placeholder="USD"
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">
                          {data.currency ? `${data.currency} ` : ''}{data.amount?.toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>
                  {data.amount !== null && !isEditing && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(data.amount!.toString(), 'amount')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {copiedField === 'amount' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}

              {/* Date */}
              {(hasDate || (isEditing && Boolean(editedData.date))) && (
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between">
                  <div className="space-y-1 w-full">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Document Date</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.date || ''}
                        onChange={(e) => setEditedData({ ...editedData, date: e.target.value || null })}
                        className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        placeholder="YYYY-MM-DD"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {data.date}
                      </p>
                    )}
                  </div>
                  {data.date && !isEditing && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(data.date!, 'date')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {copiedField === 'date' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}

              {/* Due Date */}
              {(hasDueDate || (isEditing && Boolean(editedData.due_date))) && (
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between">
                  <div className="space-y-1 w-full">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Due Date</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.due_date || ''}
                        onChange={(e) => setEditedData({ ...editedData, due_date: e.target.value || null })}
                        className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        placeholder="YYYY-MM-DD"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {data.due_date}
                      </p>
                    )}
                  </div>
                  {data.due_date && !isEditing && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(data.due_date!, 'due_date')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {copiedField === 'due_date' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}

              {/* Category */}
              {(hasCategory || (isEditing && Boolean(editedData.category))) && (
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between">
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
                        className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
                        {data.category}
                      </p>
                    )}
                  </div>
                  {data.category && !isEditing && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(data.category!, 'category')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {copiedField === 'category' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}

              {/* Contact Name */}
              {(hasContactName || (isEditing && Boolean(editedData.contact_name))) && (
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between">
                  <div className="space-y-1 w-full">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <UserIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Contact Name</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.contact_name || ''}
                        onChange={(e) => setEditedData({ ...editedData, contact_name: e.target.value || null })}
                        className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {data.contact_name}
                      </p>
                    )}
                  </div>
                  {data.contact_name && !isEditing && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(data.contact_name!, 'contact_name')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {copiedField === 'contact_name' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}

              {/* Contact Phone */}
              {(hasContactPhone || (isEditing && Boolean(editedData.contact_phone))) && (
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between">
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
                        className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {data.contact_phone}
                      </p>
                    )}
                  </div>
                  {data.contact_phone && !isEditing && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(data.contact_phone!, 'contact_phone')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {copiedField === 'contact_phone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}

              {/* Contact Email */}
              {(hasContactEmail || (isEditing && Boolean(editedData.contact_email))) && (
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between">
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
                        className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {data.contact_email}
                      </p>
                    )}
                  </div>
                  {data.contact_email && !isEditing && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(data.contact_email!, 'contact_email')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {copiedField === 'contact_email' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}

              {/* Custom Dynamic Fields extracted by Gemini or added by user */}
              {(isEditing ? editedData.dynamic_fields : data.dynamic_fields)?.map((df, idx) => (
                <div
                  key={`dynamic_${df.key}_${idx}`}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between relative group"
                >
                  <div className="space-y-1 w-full">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Tag className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{df.label}</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={df.value}
                        onChange={(e) => {
                          const updated = [...(editedData.dynamic_fields || [])];
                          updated[idx] = { ...updated[idx], value: e.target.value };
                          setEditedData({ ...editedData, dynamic_fields: updated });
                        }}
                        className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {df.value}
                      </p>
                    )}
                  </div>

                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveDynamicField(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(df.value, df.key)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {copiedField === df.key ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Note Summary Card (if present) */}
            {(hasNoteSummary || (isEditing && Boolean(editedData.note_summary))) && (
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Document Summary</span>
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
                    className="w-full mt-1 px-2.5 py-1 text-sm rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {data.note_summary}
                  </p>
                )}
              </div>
            )}
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
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
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
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleFeedbackSubmit} className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Refine with AI Instructions</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                placeholder="e.g. Change total amount to $29.53, or re-verify invoice number..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!feedbackInput.trim() || isRefining}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 shrink-0 ${
                  !feedbackInput.trim() || isRefining
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
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
