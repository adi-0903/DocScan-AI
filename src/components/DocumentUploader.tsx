import React, { useRef, useState } from 'react';
import { Upload, Camera, Image as ImageIcon, Sparkles, AlertCircle, X, HelpCircle, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { CameraModal } from './CameraModal';
import { User } from '../types';

interface DocumentUploaderProps {
  onExtract: (image: string, hint?: string) => void;
  isLoading: boolean;
  previewImage: string | null;
  setPreviewImage: (image: string | null) => void;
  currentUser?: User | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onExtract,
  isLoading,
  previewImage,
  setPreviewImage,
  currentUser,
  onOpenAuth
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [hint, setHint] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFileError(null);
    if (!file.type.startsWith('image/')) {
      setFileError('Please select a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFileError('Image size exceeds 15MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setPreviewImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setPreviewImage(imageDataUrl);
  };

  const clearImage = () => {
    setPreviewImage(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    if (!currentUser && onOpenAuth) {
      onOpenAuth('login');
      return;
    }
    setIsCameraOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && onOpenAuth) {
      onOpenAuth('login');
      return;
    }
    if (previewImage) {
      onExtract(previewImage, hint);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4 transition-colors">
      {!currentUser && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold text-[11px] sm:text-xs">
              Account required to scan &amp; extract fields
            </span>
          </div>
          {onOpenAuth && (
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0 transition-colors shadow-xs"
            >
              Log In
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Document Photo
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Receipts, utility bills, business cards, handwritten notes
          </p>
        </div>
        <button
          type="button"
          onClick={handleCameraClick}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 active:scale-95 text-xs font-bold transition-all shrink-0 min-h-[40px] border border-transparent dark:border-indigo-800/50"
        >
          <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Snap Camera
        </button>
      </div>

      {fileError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {/* Upload Zone / Image Preview */}
      {previewImage ? (
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-3 min-h-[220px]">
          <button
            type="button"
            onClick={clearImage}
            disabled={isLoading}
            className="absolute top-2.5 right-2.5 p-2 bg-slate-800/90 text-white hover:bg-red-600 rounded-full transition-colors z-20 shadow-md active:scale-90 disabled:opacity-50"
            title="Remove Image"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative max-h-[280px] max-w-full overflow-hidden rounded-lg shadow-md flex items-center justify-center">
            <img
              src={previewImage}
              alt="Document preview"
              className={`max-h-[280px] max-w-full object-contain rounded-lg transition-all duration-300 ${
                isLoading ? 'brightness-90 contrast-105' : ''
              }`}
            />

            {/* Laser Scan Overlay Effect when isLoading */}
            {isLoading && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-10 flex flex-col justify-between">
                {/* Laser beam line */}
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: '96%' }}
                  transition={{
                    repeat: Infinity,
                    repeatType: 'reverse',
                    duration: 1.6,
                    ease: 'easeInOut'
                  }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee,0_0_25px_#818cf8]"
                />

                {/* Vertical sweeping laser gradient fill */}
                <motion.div
                  initial={{ top: '-40%' }}
                  animate={{ top: '100%' }}
                  transition={{
                    repeat: Infinity,
                    repeatType: 'reverse',
                    duration: 1.6,
                    ease: 'easeInOut'
                  }}
                  className="absolute left-0 right-0 h-28 bg-gradient-to-b from-indigo-500/20 via-cyan-400/20 to-transparent pointer-events-none"
                />

                {/* Corner reticle framing guides */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 opacity-80" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 opacity-80" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 opacity-80" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 opacity-80" />
              </div>
            )}
          </div>

          <div className="mt-2.5 text-center">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 bg-slate-900/90 px-3 py-1 rounded-full border border-cyan-500/40 shadow-sm animate-pulse">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                Scanning optical fields &amp; parsing schema...
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-300 bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700/80">
                Document ready for AI extraction
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[170px] active:scale-[0.99] ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 shadow-inner">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Tap to upload photo or choose file
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            PNG, JPG, WEBP, SVG (Max 15MB)
          </p>
        </div>
      )}

      {/* Additional Hint Input & Extract Action */}
      <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
            <span>Optional User Hint / Context</span>
            <span className="text-slate-400 dark:text-slate-500" title="Optional guidance for Gemini Vision, e.g. 'This is an energy bill from June'">
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </label>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g. Receipt from lunch, utility invoice..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={!previewImage || isLoading}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] ${
            !previewImage || isLoading
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none border border-transparent dark:border-slate-700'
              : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-indigo-600/25'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Extracting Document Fields...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run Document Extraction</span>
            </>
          )}
        </button>
      </form>

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
