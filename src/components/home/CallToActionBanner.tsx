/**
 * @license
 * Institutional Patronage & Call to Action Section
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  HeartHandshake, 
  Sparkles, 
  GraduationCap, 
  ArrowRight, 
  Download, 
  ShieldCheck,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

interface CallToActionBannerProps {
  onOpenDonate: () => void;
  onOpenVolunteer: () => void;
}

export const CallToActionBanner: React.FC<CallToActionBannerProps> = ({
  onOpenDonate,
  onOpenVolunteer
}) => {
  const { config } = useConfig();

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  return (
    <section className="py-16 sm:py-20 bg-slate-900 text-white relative overflow-hidden" id="cta-patronage">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-700/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-amber-600/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-8 sm:p-12 lg:p-16 border border-emerald-500/30 shadow-2xl space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 7 Cols: Narrative */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Empower the Next Generation of Nation Builders</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Transform a Life Through <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-400">
                  Higher Education & Knowledge
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Every rupee disbursed under Fatimyah Educational Trust India reaches students without intermediary loss. Avail <strong>50% Section 80G tax deductions</strong> on all contributions with instant computerized certificates and transparent annual audits.
              </p>

              <div className="flex flex-wrap gap-4 pt-2 text-xs text-emerald-200">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>100% Tax Deductible (80G)</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Zero Admin Fund Leakage</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Zakat & Sadaqah Compliant</span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Actions & Impact Summary */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <button
                onClick={onOpenDonate}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-sm font-extrabold shadow-xl hover:shadow-2xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
              >
                <HeartHandshake className="w-5 h-5 text-emerald-950" />
                <span>Sponsor a Scholar Today (80G)</span>
                <ArrowRight className="w-4 h-4 text-emerald-950" />
              </button>

              <button
                onClick={onOpenVolunteer}
                className="w-full py-3.5 rounded-2xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 text-xs font-bold border border-emerald-600/50 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>Join National Volunteer Network</span>
              </button>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-1 mt-2">
                <span className="text-[11px] text-slate-400">Institutional or Corporate CSR Inquiries:</span>
                <div className="text-xs font-bold text-amber-300">
                  <a href={`mailto:${config.contactEmail}`} className="hover:underline">
                    {config.contactEmail}
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
