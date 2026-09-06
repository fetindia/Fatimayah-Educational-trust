/**
 * @license
 * Trust Pillars & Institutional Heritage Component (Education • Service • Empowerment)
 * Fatimyah Educational Trust India
 */

import React, { useState } from 'react';
import { 
  GraduationCap, 
  HeartHandshake, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  History,
  Award,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

interface TrustPillarsProps {
  onOpenSection: (sectionId: string) => void;
}

export const TrustPillars: React.FC<TrustPillarsProps> = ({ onOpenSection }) => {
  const { config } = useConfig();
  const [activeTab, setActiveTab] = useState<'triad' | 'timeline' | 'values'>('triad');

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  const pillars = [
    {
      id: 'education',
      name: 'Education',
      color: primaryGreen,
      colorName: 'Emerald Green',
      lightBg: 'bg-emerald-50/70 border-emerald-200',
      tagline: 'Illuminating Minds & Opening Doors',
      icon: GraduationCap,
      description: 'Building modern educational infrastructure, managing schools and colleges, funding technical and medical degree scholarships, and offering career mentorship to underprivileged scholars across India.',
      points: [
        'Merit-cum-Means Higher Education Scholarships',
        'Model Schools & Community Learning Centers',
        'Talent Search Exams & Assessment Portals',
        'Digital Learning Libraries & STEM Curricula'
      ]
    },
    {
      id: 'service',
      name: 'Service',
      color: primaryBlue,
      colorName: 'Sapphire Blue',
      lightBg: 'bg-blue-50/70 border-blue-200',
      tagline: 'Selfless Community & Humanitarian Stewardship',
      icon: HeartHandshake,
      description: 'Extending prompt disaster relief, medical diagnosis camps, optical checkups, ration sustenance for widows and orphans, and mobilization of an active nationwide volunteer brigade.',
      points: [
        'Disaster & Emergency Relief Coordination',
        'Free Healthcare Diagnosis & Medical Grants',
        'Emergency Blood Donor Registry & Network',
        'Nationwide Field Volunteer Dispatch'
      ]
    },
    {
      id: 'empowerment',
      name: 'Empowerment',
      color: accentAmber,
      colorName: 'Golden Amber',
      lightBg: 'bg-amber-50/70 border-amber-200',
      tagline: 'Fostering Dignity, Self-Reliance & Sustainable Progress',
      icon: Sparkles,
      description: 'Providing vocational training, women self-help empowerment drives, pro-bono legal counsel, civil services coaching, and sustainable non-profit revenue streams such as the FET Store.',
      points: [
        'Vocational Skills & Entrepreneurship Incubation',
        'Civil Services & Competitive Exam Coaching',
        'Official FET Store (Ethical Apparel & Books)',
        'Legal Aid & Educational Rights Assistance'
      ]
    }
  ];

  const milestones = [
    { year: '1994', title: 'Trust Inception', desc: 'Fatimyah Educational Trust registered in Mumbai under Bombay Public Trust Act 1950 by eminent community visionaries.' },
    { year: '2005', title: 'Income Tax 80G Exemption', desc: 'Granted permanent Section 80G 50% tax deduction status and Section 12A tax exemption by Income Tax Department.' },
    { year: '2015', title: '10,000+ Scholars Milestone', desc: 'Crossed over 10,000 scholarship disbursements for Engineering, Medical (MBBS/BAMS), and Postgraduate degrees.' },
    { year: '2026', title: 'Unified Digital Architecture', desc: 'Launch of 27-chapter master digital portal and cross-platform Firebase backend uniting web and mobile apps.' }
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Foundational Trust Creed</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            {config.tagline || 'Education • Service • Empowerment'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Every chapter, program, and administrator console across <strong className="text-slate-900">{config.displayName}</strong> is anchored by three foundational commitments to Indian society.
          </p>

          {/* Toggle View Tabs */}
          <div className="pt-4 flex justify-center gap-2">
            <button
              onClick={() => setActiveTab('triad')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'triad'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              The 3 Pillars of Impact
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              30-Year Heritage Timeline
            </button>
          </div>
        </div>

        {/* View 1: 3 Pillars Cards */}
        {activeTab === 'triad' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div 
                  key={p.id}
                  className={`p-7 rounded-3xl bg-white border ${p.lightBg} shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}
                >
                  <div className="space-y-4">
                    {/* Pillar Icon & Identity Badge */}
                    <div className="flex items-center justify-between">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md"
                        style={{ backgroundColor: p.color }}
                      >
                        <Icon className="w-7 h-7 text-amber-300" />
                      </div>
                      <span 
                        className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border"
                        style={{ 
                          backgroundColor: `${p.color}10`, 
                          color: p.color,
                          borderColor: `${p.color}30`
                        }}
                      >
                        Pillar: {p.name}
                      </span>
                    </div>

                    {/* Title & Tagline */}
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">{p.name}</h3>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">{p.tagline}</p>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {p.description}
                    </p>

                    {/* Points */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      {p.points.map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: p.color }} />
                          <span className="font-medium">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onOpenSection('programs')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold transition-all hover:gap-2 cursor-pointer"
                      style={{ color: p.color }}
                    >
                      <span>Explore Programs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View 2: 30-Year Heritage Timeline */}
        {activeTab === 'timeline' && (
          <div className="rounded-3xl bg-white p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">Institutional Journey & Milestones</h3>
              <p className="text-xs text-slate-500">Three decades of selfless service, transparent stewardship, and nation-building.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {milestones.map((ms, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative">
                  <div className="text-2xl font-black text-emerald-800">{ms.year}</div>
                  <h4 className="text-sm font-extrabold text-slate-900">{ms.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{ms.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

