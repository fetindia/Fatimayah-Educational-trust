import React, { useEffect } from 'react';
import { X, HeartHandshake } from 'lucide-react';
import { PublicDonationSection } from '../home/PublicDonationSection';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  onOpenLegal
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-modal-title"
    >
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 id="donation-modal-title" className="text-sm font-bold text-white tracking-wide">
                FET India Central Contribution Portal
              </h2>
              <p className="text-[11px] text-slate-400">80G Tax-Exempt Contribution & Instant Receipt Generator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="max-h-[85vh] overflow-y-auto">
          <PublicDonationSection onOpenLegal={onOpenLegal} />
        </div>
      </div>
    </div>
  );
};
