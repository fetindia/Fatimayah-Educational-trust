/**
 * @license
 * Dedicated Chairman's Message & Trustee Address Modal
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React from 'react';
import { 
  X, 
  Award, 
  Quote, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { useConfig } from '../../contexts/ConfigContext';

interface ChairmanMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGovernance?: () => void;
}

export const ChairmanMessageModal: React.FC<ChairmanMessageModalProps> = ({
  isOpen,
  onClose,
  onOpenGovernance
}) => {
  const { config } = useConfig();

  if (!isOpen) return null;

  const chairman = (config as any)?.chairmanMessage || null;
  const isConfigured = Boolean(chairman?.name && chairman?.message);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chairman-modal-title"
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <FETLogo size="sm" />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                Office of the Board of Trustees
              </span>
              <h2 id="chairman-modal-title" className="text-base font-black text-slate-900 leading-tight">
                Chairman's Official Address
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-700">
          
          {isConfigured ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
                {chairman.photoUrl && (
                  <img
                    src={chairman.photoUrl}
                    alt={chairman.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm shrink-0"
                  />
                )}
                <div className="space-y-1 text-center sm:text-left">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    {chairman.designation || 'Chairman, Board of Trustees'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900">{chairman.name}</h3>
                  <p className="text-xs text-slate-500">{config.legalName} • Mumbai, India</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <Quote className="w-8 h-8 text-emerald-300" />
                <p className="text-sm sm:text-base font-medium text-slate-900 italic leading-relaxed">
                  "{chairman.message}"
                </p>
                {chairman.fullMessage && (
                  <div className="space-y-3 pt-4 border-t border-slate-100 whitespace-pre-line text-slate-700">
                    {chairman.fullMessage}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* High-Integrity Configuration / Official Dispatch Notice (Prompt Mandate) */
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto border border-amber-300">
                <Award className="w-8 h-8 text-amber-700" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 inline-block">
                  Trust Secretariat Gazette • Session 2026-27
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Chairman's Address — Awaiting Annual Gazetted Publication
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  The formal institutional address and annual policy statement from the Chairman of the Board of Trustees is currently undergoing formal compilation by the Trust Secretariat. The complete gazetted message will be released here upon ratification by the Governing Council.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-3">
                {onOpenGovernance && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenGovernance();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    View Board of Trustees & Governance
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Fatimyah Educational Trust Central Secretariat • Reg No: {config.registrationNumber}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
