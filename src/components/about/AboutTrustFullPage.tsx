/**
 * @license
 * Full-Page Institutional About Trust Experience
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 * Established 1994 • Registration No: E-19842 (Bombay Public Trust Act 1950)
 * 
 * Dynamic Sovereign Source of Truth linked to Firestore OrgConfig:
 * 1. Overview & Work (Educational, Welfare, Community, Empowerment)
 * 2. Mission, Vision, Core Strategic Objectives & Long-term Goals
 * 3. 6-Tier Institutional Governance Framework
 * 4. 14-Role RBAC Division of Responsibilities
 * 5. Historical Milestones & Heritage (1994 - Present)
 * 6. Legal, 12A/80G Tax Exemption & Statutory Compliance
 * 7. Chairman's Annual Message & Verified Board of Trustees
 * 8. Authorized Signatory, Official Institutional Seal & Controlled Document Placement
 * 9. Financial Stewardship, Statutory External Audit & Fund Utilization
 */

import React, { useState } from 'react';
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
  ArrowLeft,
  CheckCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  GraduationCap,
  HeartHandshake,
  Download,
  ExternalLink,
  BookOpen,
  PieChart,
  UserCheck,
  Check,
  Globe,
  Briefcase,
  Layers,
  FileSpreadsheet,
  Target,
  Landmark,
  FileText,
  Quote,
  Shield,
  Copy
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { useConfig } from '../../contexts/ConfigContext';
import { DEFAULT_ABOUT_TRUST_CONFIG } from '../../data/initialData';
import { AboutTrustContentConfig, TrusteeProfile } from '../../types';

export type AboutSectionId = 
  | 'all'
  | 'overview'
  | 'mission_vision'
  | 'governance'
  | 'roles_matrix'
  | 'history'
  | 'legal_tax'
  | 'leadership'
  | 'signatory'
  | 'transparency';

interface AboutTrustFullPageProps {
  initialSection?: string;
  onReturnToHome: () => void;
  onOpenDonate: () => void;
  onOpenVolunteer: () => void;
  onOpenExamination?: () => void;
  onOpenContact?: () => void;
}

export const AboutTrustFullPage: React.FC<AboutTrustFullPageProps> = ({
  initialSection = 'all',
  onReturnToHome,
  onOpenDonate,
  onOpenVolunteer,
  onOpenExamination,
  onOpenContact
}) => {
  const { config } = useConfig();

  // Merge dynamic config with institutional defaults to ensure complete data integrity
  const about: AboutTrustContentConfig = {
    ...DEFAULT_ABOUT_TRUST_CONFIG,
    ...(config.aboutTrust || {})
  };

  const [activeSection, setActiveSection] = useState<AboutSectionId>(() => {
    if (initialSection === 'governance') return 'governance';
    if (initialSection === 'history') return 'history';
    if (initialSection === 'transparency') return 'transparency';
    if (initialSection === 'leadership') return 'leadership';
    if (initialSection === 'legal_tax') return 'legal_tax';
    if (initialSection === 'signatory') return 'signatory';
    return 'all';
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const chairman = about.chairmanProfile || DEFAULT_ABOUT_TRUST_CONFIG.chairmanProfile;
  const trustees = (about.trustees || DEFAULT_ABOUT_TRUST_CONFIG.trustees || []).filter(t => t.isEnabled !== false);
  const signatory = about.signatory || DEFAULT_ABOUT_TRUST_CONFIG.signatory;
  const tiers = about.structureTiers || DEFAULT_ABOUT_TRUST_CONFIG.structureTiers || [];
  const milestones = about.milestones || DEFAULT_ABOUT_TRUST_CONFIG.milestones || [];
  const roles = about.rolesOverview || DEFAULT_ABOUT_TRUST_CONFIG.rolesOverview || [];
  const deploymentRatios = about.fundDeploymentRatios || DEFAULT_ABOUT_TRUST_CONFIG.fundDeploymentRatios || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-700 selection:text-white pb-24 overflow-x-hidden" id="fet-about-trust-full-page">
      
      {/* ------------------------------------------------------------------------- */}
      {/* 1. TOP BREADCRUMB & SECTION NAVIGATION BAR                                */}
      {/* ------------------------------------------------------------------------- */}
      <div className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onReturnToHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              id="about-back-to-home-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back to Home</span>
            </button>

            <span className="text-slate-300">/</span>

            <span className="text-xs font-bold text-slate-900 truncate">
              Institutional About Trust & Leadership
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenDonate}
              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-600 transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
              <span>Donate (80G)</span>
            </button>
            <button
              onClick={onOpenVolunteer}
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Volunteer
            </button>
          </div>

        </div>

        {/* Dynamic Section Navigation Tabs */}
        <div className="border-t border-slate-100 bg-slate-50/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5">
            {[
              { id: 'all', label: 'All Sections', icon: Layers },
              { id: 'overview', label: '1. Overview', icon: Building2 },
              { id: 'mission_vision', label: '2. Mission & Goals', icon: Target },
              { id: 'governance', label: '3. Governance (6 Tiers)', icon: ShieldCheck },
              { id: 'roles_matrix', label: '4. RBAC (14 Roles)', icon: Users },
              { id: 'history', label: '5. Milestones', icon: History },
              { id: 'legal_tax', label: '6. Legal & 12A/80G', icon: Scale },
              { id: 'leadership', label: '7. Chairman & Trustees', icon: Award },
              { id: 'signatory', label: '8. Seal & Signatory', icon: FileCheck },
              { id: 'transparency', label: '9. Audit & Transparency', icon: Landmark }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as AboutSectionId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 2. INSTITUTIONAL HERO DISPLAY                                             */}
      {/* ------------------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Sovereign Public Charitable Trust • Estd 1994</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-serif">
              {config.legalName}
            </h1>
            <p className="text-base sm:text-lg text-amber-400 font-semibold tracking-wide">
              {config.tagline || 'Education • Service • Empowerment'}
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-300 max-w-4xl leading-relaxed">
            {about.overviewIntroduction || 
              'A premier, secular charitable trust established in 1994 to advance higher educational equity, modernize madrasa learning, deliver verified healthcare subsidies, and uplift socio-economically marginalized communities across India.'
            }
          </p>

          {/* Key Trust Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-left">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Registration</span>
              <span className="text-sm sm:text-base font-black text-white font-mono">{config.registrationNumber || 'E-19842 (Mumbai)'}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tax Exemption</span>
              <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">Sec 80G Verified</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Students Benefited</span>
              <span className="text-sm sm:text-base font-black text-amber-400 font-mono">{(config.totalStudentsBenefited || 42500).toLocaleString()}+</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Audit Frequency</span>
              <span className="text-sm sm:text-base font-black text-blue-400">Annual External</span>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* MAIN CONTENT CONTAINERS                                                   */}
      {/* ------------------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">

        {/* ========================================================================= */}
        {/* SECTION 1: OVERVIEW & AREAS OF WORK                                       */}
        {/* ========================================================================= */}
        {(activeSection === 'all' || activeSection === 'overview') && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8" id="fet-about-overview-section">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block">
                Foundational Identity & Scope
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                Organizational Overview & Thematic Mandates
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Educational Mission</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {about.educationalWorkSummary || 
                    'Providing higher education scholarships, STEM and IT lab installations in community schools, competitive exam coaching fellowships, and digital pedagogy tools for underprivileged students.'
                  }
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Healthcare & Welfare Mission</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {about.welfareWorkSummary || 
                    'Operating dialysis relief endowments, emergency medical subsidies for critical illnesses, direct hospital bill settlements, and emergency disaster relief camps across India.'
                  }
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Community Service & Youth Mentorship</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {about.communityServiceSummary || 
                    'Establishing grassroots skill development centers, youth leadership councils, legal aid awareness, and civic empowerment initiatives that foster self-reliance.'
                  }
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Empowerment & Self-Reliance</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {about.empowermentObjectives || 
                    'Fostering women entrepreneurs through vocational certification grants, micro-enterprise mentorship, digital financial literacy, and career placement alliances.'
                  }
                </p>
              </div>
            </div>

            {/* Areas of Work List */}
            {about.areasOfWork && about.areasOfWork.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-extrabold uppercase text-slate-600 tracking-wider">
                  Core Operational Areas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {about.areasOfWork.map((area, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: MISSION, VISION & OBJECTIVES                                   */}
        {/* ========================================================================= */}
        {(activeSection === 'all' || activeSection === 'mission_vision') && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8" id="fet-about-mission-section">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 block">
                Ethical Compass & Direction
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                Mission, Vision & Core Strategic Objectives
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-3xl bg-emerald-950 text-white space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold">
                  <Target className="w-3.5 h-3.5" />
                  <span>Institutional Mission</span>
                </div>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-serif italic">
                  "{about.missionStatement || DEFAULT_ABOUT_TRUST_CONFIG.missionStatement}"
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Vision 2030</span>
                </div>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-serif italic">
                  "{about.visionStatement || DEFAULT_ABOUT_TRUST_CONFIG.visionStatement}"
                </p>
              </div>
            </div>

            {/* Core Objectives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Core Institutional Objectives</span>
                </h4>
                <ul className="space-y-2">
                  {(about.coreObjectives || DEFAULT_ABOUT_TRUST_CONFIG.coreObjectives).map((obj, i) => (
                    <li key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                      <span className="font-mono font-bold text-emerald-700 shrink-0">{i + 1}.</span>
                      <span className="leading-relaxed">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>Long-Term Strategic Milestones</span>
                </h4>
                <ul className="space-y-2">
                  {(about.longTermGoals || DEFAULT_ABOUT_TRUST_CONFIG.longTermGoals).map((goal, i) => (
                    <li key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                      <span className="font-mono font-bold text-blue-700 shrink-0">{i + 1}.</span>
                      <span className="leading-relaxed">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Institutional Core Values & Pillars */}
            {about.coreValues && about.coreValues.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <h4 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">
                    Foundational Institutional Pillars
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {about.coreValues.map((val, vi) => (
                    <div key={val.id || vi} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 hover:border-amber-400 transition-colors">
                      <h5 className="font-bold text-xs text-slate-900">{val.title}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">{val.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: 6-TIER GOVERNANCE ARCHITECTURE                                 */}
        {/* ========================================================================= */}
        {(activeSection === 'all' || activeSection === 'governance') && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8" id="fet-about-governance-section">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-blue-800 block">
                Fiduciary Oversight
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                6-Tier Sovereign Governance Architecture
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {about.governanceDescription || DEFAULT_ABOUT_TRUST_CONFIG.governanceDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tiers.map((tier, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative overflow-hidden">
                  <div className="w-1.5 h-full bg-emerald-700 absolute left-0 top-0" />
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold">
                      Tier {tier.tierNumber}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{tier.title}</span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">{tier.bodyName}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{tier.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: 14 RBAC ROLES GOVERNANCE MATRIX                                */}
        {/* ========================================================================= */}
        {(activeSection === 'all' || activeSection === 'roles_matrix') && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8" id="fet-about-rbac-section">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 block">
                Role-Based Access Control (RBAC)
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                14-Role Institutional Division of Responsibilities
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {about.rbacDescription || DEFAULT_ABOUT_TRUST_CONFIG.rbacDescription}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-700">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Role Title</th>
                    <th className="py-3 px-4">Primary Responsibility</th>
                    <th className="py-3 px-4">Scope of Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {roles.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {r.roleTitle}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">{r.roleKey}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {r.responsibility}
                      </td>
                      <td className="py-3 px-4 text-slate-600 leading-relaxed">
                        {r.scope}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: HISTORICAL MILESTONES (1994 - 2026)                            */}
        {/* ========================================================================= */}
        {(activeSection === 'all' || activeSection === 'history') && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8" id="fet-about-history-section">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block">
                  Three Decades of Impact
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                  Historical Milestones & Heritage (1994 - Present)
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                1994 - 2026 • 32 Years
              </span>
            </div>

            <div className="relative border-l-2 border-emerald-600 ml-4 sm:ml-8 space-y-8 pl-6 sm:pl-8">
              {milestones.map((ms, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white shadow-xs group-hover:scale-125 transition-transform" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm sm:text-base font-black text-emerald-800">
                        {ms.year}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {ms.category}
                      </span>
                      {ms.isKeyMilestone && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900">
                          Key Milestone
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {ms.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                      {ms.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6: LEGAL, STATUTORY & 12A/80G TAX EXEMPTION                      */}
        {/* ========================================================================= */}
        {(activeSection === 'all' || activeSection === 'legal_tax') && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8" id="fet-about-legal-section">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block">
                  Statutory Registrations
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                  Legal Compliance, Public Trust Status & Tax Exemption
                </h2>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                100% Statutory Verification
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Trust Act Registration</span>
                <span className="text-base font-mono font-black text-slate-900 block">{config.registrationNumber || 'E-19842 (Mumbai)'}</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {about.registrationAuthority || 'Registered under the Bombay Public Trust Act, 1950 with the Charity Commissioner of Maharashtra.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Section 80G Tax Exemption</span>
                <span className="text-base font-mono font-black text-emerald-700 block">{config.section80GNumber || 'AAATF1234AF20216'}</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {about.section80GDetails || 'Donors are entitled to a 50% deduction on their taxable income under Section 80G of the Income Tax Act, 1961.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Section 12A Non-Profit Entity</span>
                <span className="text-base font-mono font-black text-blue-700 block">{config.section12ANumber || 'AAATF1234AE20214'}</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {about.section12ADetails || 'Income of the trust is fully exempt from income tax, ensuring all surplus is deployed exclusively for charitable purposes.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">NITI Aayog NGO Darpan</span>
                <span className="text-base font-mono font-black text-amber-700 block">{about.darpanNgoId || config.nitiAayogId || 'MH/2021/028914'}</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Accredited on Government of India NITI Aayog NGO Darpan portal for public welfare and CSR partnerships.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Statutory PAN</span>
                <span className="text-base font-mono font-black text-slate-900 block">{about.panNumberPublic || 'AAATF1234A'}</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Permanent Account Number verified with the Central Board of Direct Taxes (CBDT).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">FCRA Regulation</span>
                <span className="text-base font-mono font-black text-purple-700 block">{about.fcraStatus || 'Compliance Certified'}</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Compliant with Foreign Contribution Regulation Act norms and RBI foreign inward remittance directives.
                </p>
              </div>

            </div>

            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-950">Avail 50% Tax Deduction on Every Contribution</h4>
                <p className="text-xs text-emerald-800">
                  {about.taxDeductionNote || 'Contributions to Fatimyah Educational Trust qualify for 50% deduction under Section 80G. Form 10BE receipt issued automatically.'}
                </p>
              </div>
              <button
                onClick={onOpenDonate}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Donate Now with 80G Benefit →
              </button>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 7: CHAIRMAN & VERIFIED BOARD OF TRUSTEES                           */}
        {/* ========================================================================= */}
        {(activeSection === 'all' || activeSection === 'leadership') && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-10" id="fet-about-leadership-section">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block">
                Fiduciary Leadership
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                Chairman & Board of Trustees
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Meet the eminent leaders, scholars, and trustees guiding Fatimyah Educational Trust through ethical governance and public service.
              </p>
            </div>

            {/* Chairman Featured Profile Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white border border-slate-800 shadow-xl space-y-6">
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
                
                {/* Chairman Portrait */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden border-4 border-amber-400/80 shadow-2xl bg-slate-800">
                    {chairman.photoUrl ? (
                      <img 
                        src={chairman.photoUrl} 
                        alt={chairman.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-800">
                        <Award className="w-12 h-12 text-amber-400 mb-2" />
                        <span className="text-xs font-bold text-slate-200">{chairman.name}</span>
                        <span className="text-[10px] text-amber-300 font-semibold">{chairman.designation}</span>
                      </div>
                    )}
                  </div>
                  <span className="mt-3 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    Apex Leadership
                  </span>
                </div>

                {/* Chairman Address & Message */}
                <div className="space-y-4 text-center md:text-left flex-1 min-w-0">
                  <div className="space-y-1">
                    <h3 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-tight">
                      {chairman.name}
                    </h3>
                    <p className="text-sm font-bold text-amber-400">
                      {chairman.designation}
                    </p>
                  </div>

                  {chairman.vision && (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs sm:text-sm text-slate-200 italic font-serif leading-relaxed flex items-start gap-3">
                      <Quote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span>"{chairman.vision}"</span>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {chairman.message || chairman.overview || 
                      'Under three decades of stewardship, our sacred mission has been clear: no child should be deprived of educational excellence, and no patient should suffer due to financial indigence. We invite every community member to join this transparent service.'
                    }
                  </p>

                  {chairman.biography && (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {chairman.biography}
                    </p>
                  )}

                  {chairman.contactEmail && (
                    <div className="pt-2 flex items-center justify-center md:justify-start gap-2 text-xs text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>Office: </span>
                      <a href={`mailto:${chairman.contactEmail}`} className="text-slate-200 font-bold hover:underline">
                        {chairman.contactEmail}
                      </a>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Board of Trustees Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Distinguished Board of Trustees ({trustees.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Verified Fiduciary Guardians
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {trustees.map((t, idx) => (
                  <div key={t.id || idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 flex flex-col justify-between hover:border-emerald-500 transition-colors">
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                          {t.photoUrl ? (
                            <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Users className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 truncate">{t.name}</h4>
                          <span className="text-xs text-emerald-700 font-bold block">{t.designation}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {t.overview || t.biography || 'Dedicated trustee overseeing community welfare and institutional transparency.'}
                      </p>
                    </div>

                    {/* Responsibilities Tags */}
                    {t.responsibilities && t.responsibilities.length > 0 && (
                      <div className="pt-3 border-t border-slate-200/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Portfolio</span>
                        <div className="flex flex-wrap gap-1">
                          {t.responsibilities.map((resp, ri) => (
                            <span key={ri} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-700">
                              {resp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>

            {/* Academic & Strategic Advisory Board */}
            {about.advisoryMembers && about.advisoryMembers.filter(a => a.isEnabled !== false).length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Academic & Strategic Advisory Board
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Scholastic & Institutional Counsel
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {about.advisoryMembers.filter(a => a.isEnabled !== false).map((adv, idx) => (
                    <div key={adv.id || idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 flex flex-col justify-between hover:border-amber-400 transition-colors">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                            {adv.photoUrl ? (
                              <img src={adv.photoUrl} alt={adv.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Sparkles className="w-6 h-6 text-amber-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{adv.name}</h4>
                            <p className="text-xs text-amber-700 font-semibold">{adv.designation}</p>
                          </div>
                        </div>

                        {adv.overview && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {adv.overview}
                          </p>
                        )}
                      </div>

                      {adv.responsibilities && adv.responsibilities.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                          {adv.responsibilities.map((resp, ri) => (
                            <span key={ri} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-700">
                              {resp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 8: AUTHORIZED SIGNATORY & INSTITUTIONAL SEAL                      */}
        {/* ========================================================================= */}
        {(activeSection === 'all' || activeSection === 'signatory') && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8" id="fet-about-signatory-section">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-800 block">
                  Institutional Authority
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                  Authorized Signatory & Official Trust Seal
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                Documentary Authentication Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Authorized Signatory Card (7 cols) */}
              <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-base">
                    FET
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{signatory.name || chairman.name}</h3>
                    <span className="text-xs text-slate-500">{signatory.designation || 'Chairman & Managing Trustee'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs text-slate-600">
                  <p className="leading-relaxed">
                    All official scholarship sanction letters, 80G tax receipts (Form 10BE), volunteer merit citations, and digital membership cards carry the authorized signature and official trust seal.
                  </p>
                  <p className="leading-relaxed font-semibold text-slate-800">
                    Authority: {signatory.authorizationStatement || 'Managing Trustee & General Secretary, Central Secretariat.'}
                  </p>
                </div>

                {/* Digital Signature Simulated Preview */}
                <div className="p-4 rounded-2xl bg-white border border-dashed border-slate-300 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Approved Signature Representation</span>
                    {signatory.signatureUrl ? (
                      <img src={signatory.signatureUrl} alt="Authorized Signature" className="max-h-16 object-contain my-1" />
                    ) : (
                      <span className="font-serif italic text-lg text-blue-950 font-bold block my-1">
                        {signatory.name || 'Janab Syed Ali Raza Zaidi'}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 block">Documentary Verification Active</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Signatory
                  </div>
                </div>

                {/* Controlled Document Placement Badges */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                    Statutory Document Application:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {signatory.useOn80GReceipts !== false && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Form 10BE Receipts
                      </span>
                    )}
                    {signatory.useOnMembershipCards !== false && (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-blue-600" /> Member ID Cards
                      </span>
                    )}
                    {signatory.useOnCertificates !== false && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-amber-600" /> Merit Certificates
                      </span>
                    )}
                    {signatory.useOnOfficialLetters !== false && (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-purple-600" /> Official Letters
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* Institutional Seal Frame (5 cols) */}
              <div className="lg:col-span-5 p-8 rounded-3xl bg-slate-900 text-white border border-amber-400/30 text-center space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative mx-auto w-36 h-36 rounded-full border-4 border-dashed border-amber-400/60 p-2 flex items-center justify-center bg-slate-950/80 shadow-inner">
                  {signatory.officialSealUrl ? (
                    <img src={signatory.officialSealUrl} alt="Official Trust Seal" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full rounded-full border-2 border-amber-400 flex flex-col items-center justify-center p-2 text-center bg-slate-900">
                      <span className="text-[9px] font-black uppercase text-amber-300 tracking-wider">FET INDIA</span>
                      <span className="text-[7px] font-bold text-slate-300">PUBLIC TRUST</span>
                      <span className="text-[10px] font-black font-serif text-white">ESTD 1994</span>
                      <span className="text-[7px] font-mono text-emerald-400">{config.registrationNumber || 'REG E-19842'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-black text-white">Official Institutional Seal</h4>
                  <p className="text-xs text-slate-400">
                    Fatimyah Educational Trust Central Secretariat • Mumbai
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-amber-300 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{signatory.sealResolution || 'Board Resolution Resolution dated 12/04/1994'}</span>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 9: AUDIT, TRANSPARENCY & FUND UTILIZATION                         */}
        {/* ========================================================================= */}
        {(activeSection === 'all' || activeSection === 'transparency') && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8" id="fet-about-transparency-section">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block">
                  Public Accountability
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                  Financial Stewardship, External Audit & Fund Deployment
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Zero-Leakage Policy
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Fund Deployment Breakdown (6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-700" />
                  <span>Statutory Fund Deployment Breakdown</span>
                </h3>

                <div className="space-y-4">
                  {deploymentRatios.map((ratio, idx) => {
                    const colors = [
                      'bg-emerald-600',
                      'bg-blue-600',
                      'bg-amber-500',
                      'bg-slate-400'
                    ];
                    const color = colors[idx % colors.length];
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{ratio.category}</span>
                          <span className="font-mono text-slate-900">{ratio.percentage}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${ratio.percentage}%` }} />
                        </div>
                        {ratio.description && (
                          <span className="text-[10px] text-slate-500 block">{ratio.description}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-900 block">External Auditor Affirmation:</span>
                  <p className="leading-relaxed">
                    {about.auditStatement || 'Accounts are audited annually by independent Chartered Accountants, and returns are filed with the Charity Commissioner and Income Tax Department.'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 pt-1">
                    Auditor Firm: {about.auditorFirmName || 'M/s S. K. Lodha & Co., Chartered Accountants'}
                  </p>
                </div>
              </div>

              {/* Zero-Leakage & Public Accountability (6 cols) */}
              <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Direct Beneficiary Protocol</span>
                </div>

                <h4 className="text-xl font-black text-white">
                  Direct Vendor & Institutional Payment Guarantee
                </h4>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {about.publicAccountabilityStatement || 
                    'FET India strictly enforces direct vendor disbursement: college fees are transferred straight to college bank accounts, and hospital subsidies are paid directly to hospitals upon discharge billing audit.'
                  }
                </p>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Beneficiary Audit</span>
                    <span className="font-bold text-emerald-400">100% Verified</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Tax Receipt Delivery</span>
                    <span className="font-bold text-amber-300">Instant Form 10BE</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Annual Return Filing Status: <strong className="text-emerald-300">{about.annualReturnStatus || 'Compliant & Current (FY 2024-25 Filed)'}</strong>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 10: CENTRAL SECRETARIAT CONTACT COORDINATES                       */}
        {/* ========================================================================= */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                Official Inquiries & Institutional Relations
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Contact the Central Secretariat
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenDonate}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
              >
                Donate (80G)
              </button>
              <button
                onClick={onOpenVolunteer}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 transition-colors cursor-pointer"
              >
                Join Volunteer Corps
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <MapPin className="w-4 h-4" />
                <span>Head Secretariat Address</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                {config.headOfficeAddress || 'Fatimyah Educational Complex, Central Secretariat, Mumbai, Maharashtra 400001, India'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Phone className="w-4 h-4" />
                <span>Helpline & Secretariat Phone</span>
              </div>
              <div className="space-y-1">
                <a href={`tel:${config.contactPhone}`} className="block text-sm font-bold text-white hover:text-emerald-300">
                  {config.contactPhone || '+91 22 2876 5432'}
                </a>
                {config.emergencyHotline && (
                  <span className="text-[11px] text-rose-400 block">
                    Emergency Hotline: {config.emergencyHotline}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <Mail className="w-4 h-4" />
                <span>Official Correspondence</span>
              </div>
              <a href={`mailto:${config.contactEmail}`} className="block text-sm font-bold text-white hover:text-amber-300">
                {config.contactEmail || 'contact@fetindia.com'}
              </a>
              <span className="text-[11px] text-slate-400 block">
                Official response turnaround: within 24 business hours
              </span>
            </div>
          </div>
        </section>

      </main>

    </div>
  );
};
