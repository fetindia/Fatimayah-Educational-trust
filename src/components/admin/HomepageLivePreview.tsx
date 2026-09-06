/**
 * @license
 * Interactive Homepage Live Preview Simulator
 * Fatimyah Educational Trust India
 * 
 * Allows Super Admin to preview draft homepage sections, ordering, 
 * hero slides, brand colors, and statistics across Desktop, Tablet, and Mobile.
 */

import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  CheckCircle2, 
  GraduationCap, 
  HeartHandshake, 
  Users, 
  Building, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  Heart
} from 'lucide-react';
import { HeroSlide, OrgConfig } from '../../types';
import { FETLogo } from '../common/FETLogo';

interface HomepageLivePreviewProps {
  formData: any;
  slides: HeroSlide[];
  sectionOrder: string[];
  sectionVisibility: Record<string, boolean>;
  onClose?: () => void;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const HomepageLivePreview: React.FC<HomepageLivePreviewProps> = ({
  formData,
  slides,
  sectionOrder,
  sectionVisibility,
  onClose
}) => {
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [previewSlideIdx, setPreviewSlideIdx] = useState<number>(0);

  const activeSlides = slides.filter(s => s.isActive);
  const currentSlide = activeSlides[previewSlideIdx] || activeSlides[0] || {
    title: formData.displayName || 'Fatimyah Educational Trust India',
    subtitle: formData.tagline || 'Education • Service • Empowerment',
    badgeText: 'National Educational Trust',
    ctaText: 'Explore Educational Programs',
    ctaLink: '#programs',
    secondaryCtaText: 'Make a Contribution',
    secondaryCtaLink: '#donate',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80'
  };

  const primaryGreen = formData.primaryGreen || '#0D6E42';
  const primaryBlue = formData.primaryBlue || '#0B2545';
  const accentAmber = formData.accentAmber || '#D97706';

  const containerWidthClass = {
    desktop: 'w-full max-w-5xl',
    tablet: 'w-[768px] max-w-full',
    mobile: 'w-[375px] max-w-full'
  }[viewport];

  return (
    <div className="space-y-4 animate-in fade-in" id="homepage-live-preview-simulator">
      {/* Top Simulator Control Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <span>Homepage Real-Time Preview Simulator</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Live Draft Render
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Test how layout, colors, hero slides, and section ordering appear before saving to live database
            </p>
          </div>
        </div>

        {/* Viewport Selectors */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewport === 'desktop'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewport === 'tablet'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet (768px)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile (375px)</span>
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Simulator Viewport Canvas Frame */}
      <div className="bg-slate-950 p-4 sm:p-8 rounded-3xl border border-slate-800 flex justify-center overflow-x-auto min-h-[600px]">
        <div className={`${containerWidthClass} bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300 transition-all duration-300 flex flex-col`}>
          
          {/* Simulated Announcement Bar */}
          {formData.isAnnouncementBarActive && formData.announcementBarText && (
            <div 
              className="px-4 py-2 text-white text-[11px] font-bold flex items-center justify-between text-center"
              style={{ backgroundColor: primaryBlue }}
            >
              <div className="mx-auto flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase" style={{ backgroundColor: accentAmber, color: '#1e293b' }}>
                  {formData.announcementBarBadge || 'Notice'}
                </span>
                <span>{formData.announcementBarText}</span>
              </div>
            </div>
          )}

          {/* Simulated Header */}
          <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: primaryGreen }}>
                  FET
                </div>
              )}
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                  {formData.displayName}
                </h4>
                {formData.headerSettings?.showTagline && (
                  <p className="text-[9px] text-slate-500">{formData.tagline}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-lg text-white font-bold cursor-pointer" style={{ backgroundColor: primaryGreen }}>
                Donate 80G
              </span>
            </div>
          </header>

          {/* Simulated Body Content by Section Order */}
          <div className="flex-1 overflow-y-auto space-y-6">
            {sectionOrder.map((sectionKey) => {
              if (sectionVisibility[sectionKey] === false) return null;

              if (sectionKey === 'hero') {
                return (
                  <div key="sim-hero" className="relative bg-slate-950 text-white p-6 sm:p-10 overflow-hidden">
                    {/* Background */}
                    {currentSlide.imageUrl && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
                        style={{ backgroundImage: `url(${currentSlide.imageUrl})` }}
                      />
                    )}
                    <div className="relative space-y-4 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-900 border border-amber-400/40 text-amber-300">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{currentSlide.badgeText || formData.tagline}</span>
                      </div>

                      <h2 className="text-xl sm:text-3xl font-black leading-tight">
                        {currentSlide.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {currentSlide.subtitle}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <button 
                          type="button"
                          className="px-4 py-2 rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5 shadow-md"
                          style={{ backgroundColor: primaryGreen }}
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                          <span>{currentSlide.ctaText || 'Explore Programs'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        {currentSlide.secondaryCtaText && (
                          <button 
                            type="button"
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800/80 border border-slate-700 hover:bg-slate-700"
                          >
                            {currentSlide.secondaryCtaText}
                          </button>
                        )}
                      </div>

                      {/* Slider Navigation Dots */}
                      {activeSlides.length > 1 && (
                        <div className="pt-3 flex items-center gap-1.5">
                          {activeSlides.map((_, dotIdx) => (
                            <button
                              key={`dot-${dotIdx}`}
                              type="button"
                              onClick={() => setPreviewSlideIdx(dotIdx)}
                              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                dotIdx === previewSlideIdx ? 'w-5 bg-amber-400' : 'w-1.5 bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (sectionKey === 'statistics') {
                return (
                  <div key="sim-stats" className="px-6 py-4 bg-slate-50 border-y border-slate-200">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <div className="text-base font-black text-slate-900">
                          {formData.establishedYear || 1994}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">Established Year</div>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <div className="text-base font-black text-emerald-800">
                          {formData.totalInstitutions || 14}+
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">Institutions</div>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <div className="text-base font-black text-blue-900">
                          {(formData.totalStudentsBenefited || 42500).toLocaleString()}+
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">Scholars Benefited</div>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <div className="text-base font-black text-amber-700">
                          {(formData.activeVolunteersCount || 1850).toLocaleString()}+
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">Field Volunteers</div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (sectionKey === 'crowdfunding') {
                return (
                  <div key="sim-crowdfund" className="px-6 py-6 border-b border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Public Appeals & 80G
                        </span>
                        <h3 className="text-sm font-black text-slate-900 mt-1">
                          Featured Crowdfunding Initiatives
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-emerald-800">50% Tax Relief</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">Engineering & STEM Scholars 2026</span>
                          <span className="text-emerald-700 font-bold">₹3,40,000</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-emerald-600 h-1.5 rounded-full w-3/4" />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>75% Funded</span>
                          <span>Target: ₹4,50,000</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">Rural Girl Child High School Lab</span>
                          <span className="text-emerald-700 font-bold">₹1,80,000</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-emerald-600 h-1.5 rounded-full w-1/2" />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>50% Funded</span>
                          <span>Target: ₹3,60,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (sectionKey === 'volunteer_membership') {
                return (
                  <div key="sim-vol" className="px-6 py-6 bg-slate-50 border-b border-slate-200 text-center space-y-2">
                    <span className="text-[10px] font-black uppercase text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                      Community Movement
                    </span>
                    <h3 className="text-sm font-black text-slate-900">
                      {formData.volunteerCta?.heading || 'Be the Change: Volunteer or Become an Official Trust Member'}
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      {formData.volunteerCta?.description || 'Join thousands across India dedicating skill and support to educational upliftment.'}
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: primaryGreen }}>
                        Volunteer with Us
                      </span>
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300">
                        Join as Member
                      </span>
                    </div>
                  </div>
                );
              }

              if (sectionKey === 'programs') {
                return (
                  <div key="sim-prog" className="px-6 py-6 border-b border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900">
                        Flagship Educational Initiatives
                      </h3>
                      <span className="text-xs font-bold text-emerald-800">27 Chapters Matrix</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-700" />
                        <span>Higher Education Scholarships</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 flex items-center gap-2">
                        <Building className="w-4 h-4 text-blue-700" />
                        <span>Modern Madrasa Digital Labs</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span>Women Skill Incubation</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={`sim-${sectionKey}`} className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 capitalize">
                    {sectionKey.replace(/_/g, ' ')} Module
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Active Module</span>
                </div>
              );
            })}
          </div>

          {/* Simulated Footer */}
          <footer className="bg-slate-900 text-slate-400 p-6 text-xs space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{formData.displayName}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-lg">
                {formData.footerSettings?.aboutSummary || 'Fatimyah Educational Trust is a registered public charitable trust dedicated to national educational upliftment.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <div>© {new Date().getFullYear()} {formData.footerSettings?.copyrightText || 'Fatimyah Educational Trust. All rights reserved.'}</div>
              <div className="text-slate-500 font-mono">Official Reg: 1994 / 80G Certified</div>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
};
