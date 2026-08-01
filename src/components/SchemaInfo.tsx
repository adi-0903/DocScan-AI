import React from 'react';
import { ShieldCheck, Zap, FileSpreadsheet, Sparkles, CheckCircle2, FileText, Receipt, CreditCard, PenTool, HelpCircle } from 'lucide-react';

export const SchemaInfo: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Dynamic AI Vision Parsing
        </div>
        <h2 className="text-base font-bold text-slate-900">
          Smart Adaptive Field Extraction Standard
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Powered by Gemini Vision AI with adaptive schema extraction. Only fields actually detected on your scanned document are displayed (no empty or null noise). Custom document attributes (e.g. Invoice #, ID Number, Policy #) are automatically extracted as dynamic properties.
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">5 Document Categories</h4>
            <p className="text-[11px] text-slate-500">Auto-classified on upload</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Guaranteed Parsing</h4>
            <p className="text-[11px] text-slate-500">YYYY-MM-DD &amp; numeric values</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Instant Export</h4>
            <p className="text-[11px] text-slate-500">JSON &amp; CSV ready for apps</p>
          </div>
        </div>
      </div>

      {/* Document Types breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Supported Document Schema Types
        </h3>

        <div className="space-y-2.5">
          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">Receipt</h4>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  type: "receipt"
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Extracts store name, total payment amount, transaction currency, purchase date, category, and line-item OCR text.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">Utility / Service Bill</h4>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  type: "bill"
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Extracts biller name, total balance due, due date, invoice/statement date, service category, and breakdown text.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0 mt-0.5">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">Business Card</h4>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  type: "business_card"
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Extracts contact person name, company, job title, mobile phone number, work email address, and website details.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0 mt-0.5">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">Handwritten Note</h4>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  type: "handwritten_note"
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Transcribes handwritten handwriting verbatim into OCR text and generates a concise structured summary.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">Other Documents</h4>
                <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  type: "other"
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Handles contracts, tickets, forms, and uncategorized documents with verbatim text extraction and flexible key metadata detection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
