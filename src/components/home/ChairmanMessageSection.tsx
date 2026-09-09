/**
 * @license
 * Chairman's Message — Compact & Elegant Homepage Section
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React from 'react';
import { 
  Award, 
  Quote, 
  ArrowRight, 
  Building2, 
  ShieldCheck, 
  ChevronRight,
  Scale
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

interface ChairmanMessageSectionProps {
  onReadMoreChairman: () => void;
  onOpenGovernance?: () => void;
}

export const ChairmanMessageSection: React.FC<ChairmanMessageSectionProps> = ({
  onReadMoreChairman,
  onOpenGovernance
}) => {
  const { config } = useConfig();

  const chairman = (config as any)?.chairmanMessage || null;
  const isConfigured = Boolean(chairman?.name && chairman?.message);

  return (
    <section 
      id="chairmans_message" 
      className="py-12 sm:py-16 bg-white border-t border-slate-200 relative"
      aria-labelledby="chairmans-message-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-6 sm:p-10 shadow-xs">
          
          {isConfigured ? (
            /* Configured State: Display Real Chairman Details */
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
              
              {/* Photograph */}
              {chairman.photoUrl && (
                <div className="shrink-0 relative">
                  <img
                    src={chairman.photoUrl}
                    alt={chairman.name}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-emerald-600 shadow-md"
                  />
                  <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-emerald-700 text-white shadow-xs">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Message Details */}
              <div className="space-y-3 flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  <span>Chairman's Official Address</span>
                </div>

                <div className="space-y-1">
                  <h3 id="chairmans-message-heading" className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {chairman.name}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-emerald-800">
                    {chairman.designation || 'Chairman, Board of Trustees'} • {config.legalName}
                  </p>
                </div>

                <div className="relative">
                  <Quote className="w-6 h-6 text-emerald-300 -top-2 -left-3 absolute opacity-40 hidden sm:block" />
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic line-clamp-3 sm:line-clamp-4 pl-0 sm:pl-4">
                    "{chairman.shortMessage || chairman.message}"
                  </p>
                </div>

                {/* Read More Button */}
                <div className="pt-2">
                  <button
                    onClick={onReadMoreChairman}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-sm"
                    id="read-more-chairman-btn"
                  >
                    <span>Read Full Address</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* Appropriate Empty / Configuration State (Prompt Mandate) */
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="w-16 h-16 rounded-2xl bg-amber-100/90 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0">
                  <Scale className="w-8 h-8 text-amber-700" />
                </div>
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                    <span>Office of the Board of Trustees</span>
                  </div>
                  <h3 id="chairmans-message-heading" className="text-lg sm:text-xl font-black text-slate-900">
                    Chairman's Message & Annual Address
                  </h3>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                    The official address from the Chairman of the Board of Trustees for the current session is being finalized by the Secretariat. Click below to inspect our Board Governance, statutory charter, and verified trustees.
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={onReadMoreChairman}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                  id="read-chairmans-dispatch-btn"
                >
                  <span>Chairman's Dispatch Notice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};
