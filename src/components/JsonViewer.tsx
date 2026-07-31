import React, { useState } from 'react';
import { Copy, Check, Code, Download } from 'lucide-react';
import { ExtractedDocumentData } from '../types';

interface JsonViewerProps {
  data: ExtractedDocumentData;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_extraction_${data.document_type}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 text-slate-100 overflow-hidden font-mono text-xs">
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <Code className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-xs text-slate-300">Extracted JSON Schema Output</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Download JSON file"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy JSON
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto max-h-[380px] scrollbar-thin">
        <pre className="text-slate-200 leading-relaxed whitespace-pre">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};
