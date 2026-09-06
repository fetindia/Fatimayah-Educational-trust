/**
 * @license
 * Final Mission & Call-to-Action Section
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React from 'react';
import { 
  HeartHandshake, 
  GraduationCap, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  Phone,
  UserPlus
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { useConfig } from '../../contexts/ConfigContext';

interface MissionCtaSectionProps {
  onOpenDonate: () => void;
  onOpenVolunteer: () => void;
  onOpenContact: () => void;
}

export const MissionCtaSection: React.FC<MissionCtaSectionProps> = ({
  onOpenDonate,
  onOpenVolunteer,
  onOpenContact
}) => {
  const { config } = useConfig();

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white py-20 sm:py-28 border-t border-slate-800" id="contact">
      <div id="mission_cta" className="absolute -mt-24 pointer-events-none" />
      <div id="mission" className="absolute -mt-24 pointer-events-none" />
      {/* Background Graphic Ambient Glow */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 40%, ${primaryGreen} 0%, transparent 60%), radial-gradient(circle at 80% 60%, ${primaryBlue} 0%, transparent 60%)`
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        
        {/* Main Banner Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden space-y-10">
          
          {/* Subtle Top Brand Strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex">
            <div className="h-full flex-1" style={{ backgroundColor: primaryGreen }} />
            <div className="h-full flex-1" style={{ backgroundColor: primaryBlue }} />
            <div className="h-full flex-1" style={{ backgroundColor: accentAmber }} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Col: Mission Statement & Brand Pillar (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <FETLogo size="lg" variant="light" />

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-amber-400/40 text-xs font-black text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Our Guiding Creed: {config.tagline}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Transforming Lives Through Knowledge, Integrity, and Compassion
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                For more than three decades, <strong className="text-white">{config.legalName}</strong> has stood at the vanguard of grassroots educational advancement, healthcare assistance, and community empowerment across India.
              </p>

              {/* 3 Pillars Quick Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-400 text-xs">
                    <GraduationCap className="w-4 h-4" />
                    <span>Education</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Merit scholarships, Olympiads & STEM madrasa labs.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-amber-400 text-xs">
                    <HeartHandshake className="w-4 h-4" />
                    <span>Service</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Free medical diagnostic camps, dialysis aid & food kits.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-blue-400 text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Empowerment</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Civil services fellowships & youth leadership mentoring.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  onClick={onOpenDonate}
                  className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-amber-400"
                >
                  <HeartHandshake className="w-4 h-4 text-emerald-950" />
                  <span>Donate with 80G Tax Relief</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenVolunteer}
                  className="px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Join as Volunteer / Member</span>
                </button>
              </div>
            </div>

            {/* Right Col: Secretariat Contact Card & Regulatory Badges (5 Cols) */}
            <div className="lg:col-span-5 rounded-3xl bg-slate-950/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="space-y-1 border-b border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                  Central Secretariat Office
                </span>
                <h3 className="text-lg font-black text-white">Get in Touch with Trustees</h3>
                <p className="text-xs text-slate-400">Inquiries regarding scholarship applications, institutional partnerships, or donations.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 text-slate-300">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-emerald-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Helpline & WhatsApp</span>
                    <a href={`tel:${config.contactPhone}`} className="text-sm font-bold text-white hover:text-emerald-300">
                      {config.contactPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-300">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-amber-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Official Correspondence</span>
                    <a href={`mailto:${config.contactEmail}`} className="text-sm font-bold text-white hover:text-amber-300">
                      {config.contactEmail}
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-slate-300 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Registered Head Office</span>
                  <p className="leading-relaxed text-slate-200">
                    {config.headOfficeAddress}
                  </p>
                </div>
              </div>

              {/* Legal Badges */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>80G Tax Exemption</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>NITI Aayog Darpan</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>12A Non-Profit Entity</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Annual Public Audits</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
