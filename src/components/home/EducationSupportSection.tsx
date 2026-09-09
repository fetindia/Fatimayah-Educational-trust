/**
 * @license
 * Education Support Section
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  HeartHandshake, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Building2,
  Heart
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

interface EducationSupportSectionProps {
  onSupportEducation?: () => void;
  onOpenDonate?: () => void;
  onExplorePrograms?: () => void;
}

export const EducationSupportSection: React.FC<EducationSupportSectionProps> = ({
  onSupportEducation,
  onOpenDonate,
  onExplorePrograms
}) => {
  const { config } = useConfig();
  const handleSupportAction = onOpenDonate || onSupportEducation;

  const educationalStreams = [
    {
      id: 'stream-school',
      icon: BookOpen,
      title: 'School Education & Foundational Literacy',
      badge: 'Primary & High School',
      description: 'Covering essential tuition fees, textbooks, digital kits, and school uniforms for deserving students to prevent early academic dropouts.',
      stats: 'Class 1 to 10 Support',
      tagColor: 'text-emerald-800 bg-emerald-100 border-emerald-300'
    },
    {
      id: 'stream-higher-ed',
      icon: GraduationCap,
      title: 'Higher Education & Professional Degrees',
      badge: 'Undergraduate & PG',
      description: 'Merit-cum-need tuition grants for promising youth admitted to Engineering (B.E./B.Tech), Medicine (MBBS/BAMS), Pharmacy, Law, and Sciences.',
      stats: 'Degree & Diploma Sponsorships',
      tagColor: 'text-blue-800 bg-blue-100 border-blue-300'
    },
    {
      id: 'stream-vocational',
      icon: Award,
      title: 'Professional Skilling & Vocational Training',
      badge: 'Career Readiness',
      description: 'Hands-on IT certifications, coding bootcamps, polytechnic diplomas, and competitive exam coaching to unlock sustainable livelihoods.',
      stats: 'Accredited Skill Certifications',
      tagColor: 'text-amber-900 bg-amber-100 border-amber-300'
    }
  ];

  const focusDemographics = [
    {
      title: 'Economically Disadvantaged Students',
      description: 'Supporting bright minds from low-income, daily-wage, or single-earner households unable to afford escalating academic fees.',
      icon: Users
    },
    {
      title: 'Orphaned & Vulnerable Scholars',
      description: 'Comprehensive 100% educational care and fee sponsorship so children who have lost parental support continue uninterrupted studies.',
      icon: Heart
    },
    {
      title: 'Academic Potential & Financial Need',
      description: 'Clear merit-cum-need criteria ensuring financial destitution never halts a promising student with exceptional talent.',
      icon: Sparkles
    }
  ];

  return (
    <section 
      className="py-16 sm:py-24 bg-white border-b border-slate-200" 
      id="education-support"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-950 border border-blue-300">
            <GraduationCap className="w-4 h-4 text-blue-800" />
            <span>FET India Educational Assistance Mission</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Support Education. Empower Deserving Scholars.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Education is the cornerstone of community upliftment. For over 30 years, <strong className="text-slate-900">{config.legalName}</strong> has ensured that financial hardship never stands between a deserving student and their academic aspirations.
          </p>
        </div>

        {/* 3 Major Educational Support Streams */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {educationalStreams.map((stream) => {
            const Icon = stream.icon;
            return (
              <div 
                key={stream.id}
                className="bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-lg transition-all"
                id={stream.id}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-900">
                      <Icon className="w-6 h-6 text-emerald-700" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${stream.tagColor}`}>
                      {stream.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {stream.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {stream.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{stream.stats}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Focus Demographic Pillars */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 border border-slate-800 space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 block">
              Equitable Educational Access
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Targeted Support for Economically Fragile & Vulnerable Youth
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Our Trust applies multi-tier verification to identify students who possess academic grit and genuine financial distress, ensuring 100% of educational funds reach rightful beneficiaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {focusDemographics.map((pillar, idx) => {
              const PillarIcon = pillar.icon;
              return (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <PillarIcon className="w-4 h-4 shrink-0" />
                    <span>{pillar.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Primary Calls to Action */}
          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 border-t border-slate-800">
            <button
              onClick={handleSupportAction}
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 shadow-md transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
              id="cta-support-education-btn"
            >
              <HeartHandshake className="w-4 h-4 text-emerald-950" />
              <span>Support Education</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onExplorePrograms && (
              <button
                onClick={onExplorePrograms}
                className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
                id="cta-explore-programs-btn"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Explore Educational Initiatives</span>
              </button>
            )}

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pl-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Eligible for Section 80G Tax Deductions (Form 10BE)</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
