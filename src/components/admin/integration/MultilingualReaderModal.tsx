/**
 * @license
 * FAT Multilingual Platform Reader Handoff Modal (Release 2 - Task 7)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides authenticated deep-link handoff to the independent FAT Multilingual Platform
 * for reading prescribed books, translating chapters, and downloading language editions.
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  Languages, 
  ExternalLink, 
  Download, 
  X, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  Globe2,
  FileText
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  MultilingualDocumentReference,
  ExternalPlatformConfig 
} from '../../../types';
import { 
  initiatePlatformSSOHandoff, 
  getMultilingualDocumentLink,
  DEFAULT_EXTERNAL_PLATFORMS 
} from '../../../lib/externalIntegration';

interface MultilingualReaderModalProps {
  documentRef: MultilingualDocumentReference | null;
  isOpen: boolean;
  onClose: () => void;
  platformConfig?: ExternalPlatformConfig;
}

const LANGUAGE_LABELS: Record<string, { label: string; native: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English', native: 'English', dir: 'ltr' },
  ur: { label: 'Urdu', native: 'اردو', dir: 'rtl' },
  hi: { label: 'Hindi', native: 'हिन्दी', dir: 'ltr' },
  ar: { label: 'Arabic', native: 'العربية', dir: 'rtl' },
  ks: { label: 'Kashmiri', native: 'کٲشُر', dir: 'rtl' },
  bho: { label: 'Bhojpuri', native: 'भोजपुरी', dir: 'ltr' }
};

export const MultilingualReaderModal: React.FC<MultilingualReaderModalProps> = ({
  documentRef,
  isOpen,
  onClose,
  platformConfig = DEFAULT_EXTERNAL_PLATFORMS.multilingual
}) => {
  const { currentUser, userProfile } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(documentRef?.defaultLanguage || 'en');
  const [isHandoffLoading, setIsHandoffLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !documentRef) return null;

  const availableLangs = documentRef.availableLanguages || ['en', 'ur'];

  const handleLaunchReader = async () => {
    setIsHandoffLoading(true);
    setErrorMsg(null);

    try {
      const returnUrl = typeof window !== 'undefined' ? window.location.href : 'https://fetindia.org';

      // If user is authenticated, initiate signed SSO handoff session
      if (currentUser) {
        const result = await initiatePlatformSSOHandoff({
          targetPlatform: 'multilingual',
          targetResourceId: documentRef.resourceId,
          resourceAccessLevel: documentRef.accessLevel === 'exam_candidate' ? 'restricted_exam' : 'public',
          userUid: currentUser.uid,
          userEmail: currentUser.email || 'reader@fetindia.org',
          userName: userProfile?.displayName || userProfile?.fullName || 'FET Scholar',
          userRole: userProfile?.primaryRole || 'member',
          returnUrl
        });

        if (result.success && result.handoffUrl) {
          // Direct to launch URL
          window.location.href = `${result.handoffUrl}&lang=${encodeURIComponent(selectedLanguage)}`;
          return;
        }
      }

      // Fallback to standard public deep link with return parameters
      const directLink = getMultilingualDocumentLink(documentRef.resourceId, selectedLanguage, platformConfig);
      window.location.href = directLink;
    } catch (err: any) {
      console.error('Multilingual handoff error:', err);
      setErrorMsg(err?.message || 'Failed to connect to FAT Multilingual Platform.');
      setIsHandoffLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">FAT Multilingual Platform Reader</h3>
              <p className="text-xs text-slate-300">
                Independent Digital Reader & Language Translation Gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Document Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <div className="w-10 h-12 rounded-lg bg-teal-900 text-teal-200 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                {documentRef.category.replace(/_/g, ' ')}
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-2">
                {documentRef.title}
              </h4>
              {documentRef.author && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Author / Publication: {documentRef.author}
                </p>
              )}
            </div>
          </div>

          {/* Language Edition Selector */}
          <div>
            <label className="block text-slate-700 font-bold mb-2 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-teal-700" />
              <span>Select Reading Language Edition:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableLangs.map((langKey) => {
                const langInfo = LANGUAGE_LABELS[langKey] || { label: langKey.toUpperCase(), native: langKey, dir: 'ltr' };
                const isSelected = selectedLanguage === langKey;
                return (
                  <button
                    key={langKey}
                    type="button"
                    onClick={() => setSelectedLanguage(langKey)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 text-teal-950 font-bold shadow-2xs ring-1 ring-teal-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold">{langInfo.label}</span>
                    <span className="block text-[11px] text-slate-500 font-serif mt-0.5" dir={langInfo.dir}>
                      {langInfo.native}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Access Rules & Return Notice */}
          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1 text-[11px] text-teal-950">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Unified FET Ecosystem Experience</span>
            </div>
            <p className="text-teal-800 leading-relaxed">
              When opened, the external FAT Multilingual Platform loads this edition with your verified FET India identity and language preference. You can return to FET India anytime via the portal header.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLaunchReader}
              disabled={isHandoffLoading}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
            >
              {isHandoffLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to Multilingual...</span>
                </>
              ) : (
                <>
                  <span>Read in {LANGUAGE_LABELS[selectedLanguage]?.label || selectedLanguage}</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
