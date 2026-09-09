/**
 * @license
 * Dedicated About Us, Governance & Institutional Transparency Modal
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 * Established 1994 • Registration No: E-15344 (Mumbai)
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Scale, 
  ShieldCheck, 
  History, 
  Users, 
  Sparkles, 
  FileCheck, 
  Award, 
  Lock, 
  X, 
  CheckCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  GraduationCap,
  HeartHandshake
} from 'lucide-react';
import { FETLogo } from './FETLogo';
import { useConfig } from '../../contexts/ConfigContext';

export type AboutTab = 'overview' | 'governance' | 'transparency' | 'history';

interface AboutTrustModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AboutTab;
  onOpenDonate?: () => void;
  onOpenVolunteer?: () => void;
}

export const AboutTrustModal: React.FC<AboutTrustModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'overview',
  onOpenDonate,
  onOpenVolunteer
}) => {
  const { config } = useConfig();
  const [activeTab, setActiveTab] = useState<AboutTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const administrativeRoles = [
    { key: 'super_admin', title: 'Super Admin', scope: 'Sovereign platform control, CMS dynamic settings, module activation, and role assignments.' },
    { key: 'education_admin', title: 'Education Admin', scope: 'Evaluates merit scholarships, curriculum distribution, and academic grants.' },
    { key: 'volunteer_admin', title: 'Volunteer Admin', scope: 'Coordinates field workers, community relief missions, and service logs.' },
    { key: 'member_admin', title: 'Member Admin', scope: 'Governs trust membership registrations, digital ID renewals, and alumni records.' },
    { key: 'donor_admin', title: 'Donor Admin', scope: 'Reconciles financial contributions, Zakat/Sadaqah allocations, and 80G tax receipts.' },
    { key: 'exam_admin', title: 'Examination Admin', scope: 'Conducts talent search competitions, hall ticket generation, and result validation.' },
    { key: 'blog_admin', title: 'Blog & Media Admin', scope: 'Publishes official research papers, bulletins, and trust press releases.' },
    { key: 'store_admin', title: 'Store Admin', scope: 'Inventory controller for FET Store and educational supplies distribution.' }
  ];

  const milestones = [
    {
      year: '1994',
      title: 'Foundation in Mumbai',
      description: 'Established under the Bombay Public Trust Act 1950 (Reg No. E-15344) to provide educational scholarships and medical subsidies to impoverished families.'
    },
    {
      year: '2005',
      title: 'Higher Education Merit Fund',
      description: 'Expanded scholarship portfolio to cover professional degree admissions in Engineering, Medicine, and Law for students from daily-wage households.'
    },
    {
      year: '2014',
      title: 'National Talent Search & STEM Labs',
      description: 'Launched the Annual All-India Talent Search Examination and set up modernized science laboratories across community-supported schools.'
    },
    {
      year: '2021',
      title: 'NITI Aayog & Statutory Certification',
      description: 'Secured official registration on Government of India NITI Aayog NGO Darpan portal and renewed 80G/12A automated compliance.'
    },
    {
      year: '2026',
      title: 'Digital Ecosystem & Pan-India Chapters',
      description: 'Deployed high-integrity verified crowdfunding, automated Form 10BE tax receipts, and nationwide district coordination networks.'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-trust-modal-title"
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <FETLogo size="sm" />
            <div>
              <h2 id="about-trust-modal-title" className="text-base font-black text-slate-900 leading-tight">
                {config.legalName}
              </h2>
              <p className="text-[11px] font-bold text-slate-500">
                Established 1994 • Reg No: {config.registrationNumber} • Mumbai, India
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto text-xs font-bold scrollbar-none shrink-0 pt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>About Trust & Mission</span>
          </button>

          <button
            onClick={() => setActiveTab('governance')}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'governance'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Governance & RBAC</span>
          </button>

          <button
            onClick={() => setActiveTab('transparency')}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'transparency'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Statutory Transparency</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History & Milestones</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-700">
          
          {/* TAB 1: OVERVIEW & MISSION */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Guiding Creed: {config.tagline}</span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Transforming Lives Through Knowledge, Integrity, and Compassion
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">{config.legalName}</strong> (popularly known as FET India) was founded in 1994 as an independent non-profit charitable trust dedicated to holistic educational assistance, healthcare subsidies, and youth empowerment.
                </p>
              </div>

              {/* Mission & Vision Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span>Our Sacred Mission</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    To eliminate financial barriers preventing economically marginalized scholars from achieving excellence, fostering self-reliance, moral integrity, and professional success.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 font-black text-blue-900 text-sm">
                    <HeartHandshake className="w-4 h-4 text-blue-700" />
                    <span>Our Long-Term Vision</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    An equitable society where every deserving child receives quality education, modern STEM training, and dignified community support regardless of economic condition.
                  </p>
                </div>
              </div>

              {/* Core Institutional Objectives */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Core Trust Objectives
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Merit-cum-need sponsorships for school, collegiate, and professional degrees.</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Madrasa modernization through integrated STEM science labs and computer literacy.</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Emergency medical diagnostic camps, dialysis subsidies, and critical surgeries.</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Transparent, audited disbursement with 100% statutory tax relief under Section 80G.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOVERNANCE & RBAC */}
          {activeTab === 'governance' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-950 border border-purple-300">
                  <Scale className="w-3.5 h-3.5 text-purple-800" />
                  <span>Stewardship & Segregation of Duties</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Trust Board Governance & RBAC Matrix
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  FET India enforces strict corporate governance standards. Trustees serve with zero personal remuneration, and platform administration follows strict Role-Based Access Control (RBAC).
                </p>
              </div>

              {/* Roles Matrix Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {administrativeRoles.map((role) => (
                  <div key={role.key} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{role.title}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{role.key}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {role.scope}
                    </p>
                  </div>
                ))}
              </div>

              {/* Board Review & Accountability Policy */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>The 3-Tier Board Review Guarantee</span>
                </div>
                <p className="leading-relaxed">
                  No public appeal or financial relief is disbursed without: (1) Field verification by accredited volunteers, (2) Documentary audit of institutional fee structures and medical bills, and (3) Formal sign-off by the Trust Board.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: STATUTORY TRANSPARENCY */}
          {activeTab === 'transparency' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-950 border border-blue-300">
                  <FileCheck className="w-3.5 h-3.5 text-blue-800" />
                  <span>Public Accreditations & Statutory Filings</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Official Statutory Credentials
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  All donations are fully reconcilable, with automated Form 10BE tax exemption generation under Section 80G of the Indian Income Tax Act.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Trust Registration</span>
                  <div className="text-sm font-bold text-slate-900">{config.registrationNumber}</div>
                  <p className="text-xs text-slate-500">Registered under Bombay Public Trusts Act 1950</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">NITI Aayog NGO Darpan</span>
                  <div className="text-sm font-bold text-slate-900">{config.nitiAayogId}</div>
                  <p className="text-xs text-slate-500">Government of India Verified Portal</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Income Tax 80G Order</span>
                  <div className="text-sm font-bold text-slate-900">{config.section80GNumber}</div>
                  <p className="text-xs text-slate-500">50% Deduction on Donated Sums</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Income Tax 12A Exemption</span>
                  <div className="text-sm font-bold text-slate-900">{config.section12ANumber}</div>
                  <p className="text-xs text-slate-500">Perpetual Charitable Exemption</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  Central Secretariat Head Office
                </span>
                <p className="text-slate-300 leading-relaxed">{config.headOfficeAddress}</p>
                <div className="pt-2 flex flex-wrap gap-4 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{config.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>{config.contactEmail}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY & MILESTONES */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                  <History className="w-3.5 h-3.5 text-emerald-700" />
                  <span>30+ Years of Unbroken Public Service (1994 - 2026)</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  The Journey of Fatimyah Educational Trust
                </h3>
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {milestones.map((m, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-emerald-700 border-2 border-white shadow-2xs" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {m.year}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-semibold hidden sm:block">
            {config.shortBrand} Institutional Transparency Portal
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onOpenDonate && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDonate();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Support Our Cause</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
