/**
 * @license
 * Dedicated Full Webpage: Educational, Welfare & Community Programs
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState } from 'react';
import { 
  GraduationCap, 
  HeartHandshake, 
  BookOpen, 
  Building2, 
  Users, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  Download, 
  ExternalLink,
  Search,
  Filter,
  ArrowLeft,
  X,
  Send,
  HelpCircle,
  Clock,
  MapPin,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

interface ProgramsPageProps {
  onOpenDonate: (tab?: any) => void;
  onOpenAuth: () => void;
  onOpenExamination: () => void;
  onOpenContact: () => void;
  onReturnToHome: () => void;
}

export interface ProgramItem {
  id: string;
  title: string;
  domain: 'education' | 'welfare' | 'medical' | 'skill' | 'school';
  domainLabel: string;
  grantValue: string;
  stats: string;
  eligibility: string;
  description: string;
  coverage: string;
  deadline: string;
  iconName: string;
  imageUrl: string;
  keyHighlights: string[];
}

export const ProgramsPage: React.FC<ProgramsPageProps> = ({
  onOpenDonate,
  onOpenAuth,
  onOpenExamination,
  onOpenContact,
  onReturnToHome
}) => {
  const { config } = useConfig();
  const [selectedDomain, setSelectedDomain] = useState<'all' | 'education' | 'welfare' | 'medical' | 'skill' | 'school'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Application / Inquiry modal state
  const [selectedProgramForApply, setSelectedProgramForApply] = useState<ProgramItem | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantCity, setApplicantCity] = useState('');
  const [applicantNotes, setApplicantNotes] = useState('');
  const [applySubmitted, setApplySubmitted] = useState(false);

  const programs: ProgramItem[] = [
    {
      id: 'higher-ed-scholarships',
      title: 'Higher Education Degree Merit Scholarships',
      domain: 'education',
      domainLabel: 'Higher Education & Academics',
      grantValue: 'Up to ₹85,000 / Academic Year',
      stats: '42,500+ Scholars Funded to Date',
      eligibility: 'Min. 60% in HSC/Intermediate + Family annual income < ₹3.0 Lakhs',
      description: 'Comprehensive tuition fee grant program for financially deserving students admitted to undergraduate and postgraduate degrees in Engineering (BE/BTech), Medicine (MBBS/BDS/BAMS), Pharmacy, Law, and Chartered Accountancy.',
      coverage: 'All Accredited Universities across India',
      deadline: 'Rolling Applications for AY 2026-27',
      iconName: 'GraduationCap',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
      keyHighlights: [
        'Direct disbursement to college account',
        'Academic renewal support for subsequent years',
        'Merit laptops provided for engineering scholars'
      ]
    },
    {
      id: 'madrasa-stem-labs',
      title: 'Integrated Madrasa STEM & Digital Laboratories',
      domain: 'school',
      domainLabel: 'Seminary & School Modernization',
      grantValue: 'Full Lab Hardware & Teacher Salary Grant',
      stats: '14 Affiliated Institutions Modernized',
      eligibility: 'Registered traditional seminaries and minority community schools',
      description: 'Equipping grassroots madrasas and community schools with modern computer labs, high-speed connectivity, English communication audio-visual modules, and certified science and mathematics teachers.',
      coverage: 'Maharashtra, Madhya Pradesh & UP Chapters',
      deadline: 'Phase 3 Partner Installations Active',
      iconName: 'BookOpen',
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
      keyHighlights: [
        '10-15 PC networked computer lab per campus',
        'Certified computer science syllabus',
        'Vocational IT training for graduating students'
      ]
    },
    {
      id: 'dialysis-medical-aid',
      title: 'Dialysis Subsidy & Critical Healthcare Assistance',
      domain: 'medical',
      domainLabel: 'Healthcare & Emergency Welfare',
      grantValue: '₹1,200 per Dialysis Cycle / Up to ₹50,000 Surgical Aid',
      stats: '18,900+ Medical Treatments Subsidized',
      eligibility: 'Economically vulnerable patients with verified hospital bills and nephrologist recommendation',
      description: 'Zero-delay financial grants directly to empanelled dialysis centers and charitable hospitals to ensure that kidney failure patients and critical surgical patients never discontinue life-saving care.',
      coverage: 'Hospital Tie-ups in Mumbai, Thane & Nagpur',
      deadline: 'Immediate 24-48h Emergency Processing',
      iconName: 'HeartHandshake',
      imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      keyHighlights: [
        'Zero-leakage payment directly to hospital billing',
        'Emergency verification within 24 hours',
        'Free medicines and dialyzer kit subsidies'
      ]
    },
    {
      id: 'orphan-widow-sustenance',
      title: 'Widow & Orphan Family Sustenance Kits',
      domain: 'welfare',
      domainLabel: 'Grassroots Welfare & Zakat',
      grantValue: 'Monthly Nutritional Kit + School Tuition Sponsorship',
      stats: '850+ Dependent Families Adopted',
      eligibility: 'Verified single-mother households, widows, and fatherless children',
      description: 'Providing dignified, monthly nutritional food rations (flour, rice, pulses, cooking oil, spices) alongside full school fee and textbook coverage for orphaned children to guarantee uninterrupted school education.',
      coverage: 'Door-to-door verified delivery in 8 district clusters',
      deadline: 'Monthly Perpetual Distribution Cycle',
      iconName: 'Users',
      imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
      keyHighlights: [
        'Respectful and confidential home delivery',
        'Continuous school attendance monitoring',
        'Healthcare checkups and seasonal winter warm clothing'
      ]
    },
    {
      id: 'women-vocational-centers',
      title: 'Women Vocational Craft & Computer Skill Institutes',
      domain: 'skill',
      domainLabel: 'Women Empowerment & Self-Reliance',
      grantValue: 'Free Training + Subsidized Sewing Machine Grant',
      stats: '3,200+ Women Certified & Self-Employed',
      eligibility: 'Girls and women aged 16-45 from low-income families',
      description: 'Accredited 6-month vocational training programs covering professional garment cutting, tailoring, embroidery, modern fashion design, and office computing skills. Graduating candidates receive toolkits to start home-based enterprises.',
      coverage: 'Dedicated FET Centers in 5 Cities',
      deadline: 'New Batch Enrollment: Every Quarter',
      iconName: 'Building2',
      imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80',
      keyHighlights: [
        'Accredited certification upon completion',
        'Sewing machine micro-grants for top performers',
        'Order placement links with local apparel cooperatives'
      ]
    },
    {
      id: 'civil-services-fellowship',
      title: 'UPSC & State Public Service Academy Fellowship',
      domain: 'education',
      domainLabel: 'Leadership & Civil Services',
      grantValue: '100% Residential Academy Tuition & Stipend',
      stats: '68 Officers in Central/State Cadres',
      eligibility: 'Graduates who qualify in the FET Annual Civil Services Screening Exam',
      description: 'Full residential coaching sponsorships for exceptional youth aiming for IAS, IPS, IFS, State Civil Services, and Judicial Magistrate examinations, connecting them with premier academies and retired senior civil servant mentors.',
      coverage: 'Residential Academies in Delhi, Pune & Hyderabad',
      deadline: 'Annual Entrance Screening: November 2026',
      iconName: 'Award',
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
      keyHighlights: [
        'Complete test series and library access',
        'Personalized mentorship by serving bureaucrats',
        'Interview grooming and personality development'
      ]
    },
    {
      id: 'school-adoption-fees',
      title: 'Grassroots School Adoption & Fee Relief Program',
      domain: 'school',
      domainLabel: 'Primary & Secondary Education',
      grantValue: 'Direct School Fee Clearance & Desk Infrastructure',
      stats: '6,400+ School Children Retained in Class',
      eligibility: 'Students in Class 1st to 10th facing school dropout due to non-payment of school dues',
      description: 'Preventing vulnerable children from dropping out of accredited private and state schools by settling past-due school tuition directly with school administrations and providing uniforms, shoes, and book bags.',
      coverage: 'Urban Slum & Semi-rural Partner Schools',
      deadline: 'Immediate Relief Assistance Year-Round',
      iconName: 'BookOpen',
      imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
      keyHighlights: [
        'Zero dropout guarantee for verified students',
        'Annual school stationery and backpack distribution',
        'Parental financial counseling'
      ]
    },
    {
      id: 'emergency-disaster-relief',
      title: 'Emergency Disaster Relief & Winter Warmth Campaign',
      domain: 'welfare',
      domainLabel: 'Humanitarian Emergency Relief',
      grantValue: 'Family Relief Kits & Direct Housing Aid',
      stats: '25,000+ Blankets & Emergency Kits Distributed',
      eligibility: 'Families affected by severe floods, winter cold waves, or natural calamities',
      description: 'Rapid mobilization of volunteer task forces to supply emergency clean drinking water, high-grade winter blankets, non-perishable food rations, and basic reconstruction materials in crisis-stricken zones.',
      coverage: 'Pan-India Disaster Response Protocol',
      deadline: 'Emergency Standby Deployment',
      iconName: 'HeartHandshake',
      imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=80',
      keyHighlights: [
        'Rapid deployment within 48 hours of crisis',
        'Direct coordination with district disaster management',
        '100% public donor transparency'
      ]
    }
  ];

  const filteredPrograms = programs.filter((prog) => {
    if (selectedDomain !== 'all' && prog.domain !== selectedDomain) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = prog.title.toLowerCase().includes(q);
      const matchDesc = prog.description.toLowerCase().includes(q);
      const matchCoverage = prog.coverage.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCoverage) return false;
    }
    return true;
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !applicantPhone) return;
    setApplySubmitted(true);
    setTimeout(() => {
      setApplySubmitted(false);
      setSelectedProgramForApply(null);
      setApplicantName('');
      setApplicantPhone('');
      setApplicantEmail('');
      setApplicantCity('');
      setApplicantNotes('');
    }, 2500);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-16">
      {/* Top Breadcrumb & Return Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <button 
              type="button" 
              onClick={onReturnToHome} 
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <span className="text-slate-500">/</span>
            <span className="text-emerald-400 font-semibold">Trust Programs & Welfare Initiatives</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenDonate('general')}
              className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Support a Program (80G)
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white py-16 sm:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>FATIMYAH EDUCATIONAL TRUST — INSTITUTIONAL PORTFOLIO</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Educational & Humanitarian Programs
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Targeted, audited, and sustainable initiatives designed to uplift underprivileged scholars, modernize grassroots schools, and provide zero-leakage healthcare and welfare across India.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#all-programs"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2"
              >
                <span>Explore Program Catalogue</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={onOpenContact}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Contact Program Directorate</span>
              </button>
            </div>
          </div>

          {/* Real Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">42,500+</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Scholarships Disbursed</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">18,900+</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Patients Subsidized</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-sky-400">14 Centers</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Modernized Digital Labs</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-purple-400">3,200+</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Women Empowered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Portfolio Listing Section */}
      <section id="all-programs" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Domain Filters & Search */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSelectedDomain('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDomain === 'all'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Programs ({programs.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedDomain('education')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDomain === 'education'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Higher Education</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDomain('medical')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDomain === 'medical'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Healthcare & Dialysis</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDomain('welfare')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDomain === 'welfare'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Grassroots Welfare</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDomain('school')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDomain === 'school'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Schools & STEM</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDomain('skill')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDomain === 'skill'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Skill Institutes</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search initiatives & grants..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPrograms.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Cover Image & Domain Badge */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
                  <img
                    src={program.imageUrl}
                    alt={program.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-900 backdrop-blur-xs shadow-xs">
                      {program.domainLabel}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <span className="font-bold bg-emerald-700/90 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                      {program.grantValue}
                    </span>
                    <span className="bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-xs font-medium">
                      {program.stats}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold text-slate-900 leading-snug">
                      {program.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {program.description}
                    </p>
                  </div>

                  {/* Highlights Bullet List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                      Execution Safeguards & Scope
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {program.keyHighlights.map((hl, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Eligibility & Coverage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Eligibility</span>
                      <p className="font-medium text-slate-800 text-[11px] leading-snug">{program.eligibility}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Coverage & Scope</span>
                      <p className="font-medium text-slate-800 text-[11px] leading-snug">{program.coverage}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProgramForApply(program)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Apply for Assistance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenDonate('general')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Sponsor This Program (80G)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quality & Institutional Safeguards */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Statutory Integrity & Fiduciary Protocol</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How FET India Programs Are Governed
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Rigorous 4-step programmatic verification protecting donor trust and maximizing verified impact.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-emerald-700 uppercase">Pillar 1</div>
              <h4 className="font-bold text-slate-900 text-sm">Direct Institutional Payment</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scholarship funds are transmitted directly to verified college or school bank accounts, never through intermediaries or cash.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-emerald-700 uppercase">Pillar 2</div>
              <h4 className="font-bold text-slate-900 text-sm">Field Volunteer Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Welfare sustenance and medical grants undergo home visits and family assessment by authorized chapter volunteers.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-emerald-700 uppercase">Pillar 3</div>
              <h4 className="font-bold text-slate-900 text-sm">Doctor & Hospital Audit</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Medical cases require original hospital bills, treatment charts, and attending physician documentation before release.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-emerald-700 uppercase">Pillar 4</div>
              <h4 className="font-bold text-slate-900 text-sm">Statutory External Audit</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Annual financial ledgers audited by certified Chartered Accountants with statutory compliance filings submitted punctually.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application / Inquiry Modal */}
      {selectedProgramForApply && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setSelectedProgramForApply(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span>{selectedProgramForApply.domainLabel}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Apply / Inquire: {selectedProgramForApply.title}
              </h3>
              <p className="text-xs text-slate-500">
                Submit candidate or beneficiary details for review by the Trust Welfare Committee.
              </p>
            </div>

            {applySubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-950">Application Received Successfully</h4>
                <p className="text-xs text-emerald-800">
                  Our Welfare & Program Secretariat will review your inquiry and reach out via phone/WhatsApp within 48-72 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Full Name of Applicant / Student *</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Fatima Zehra / Mohammad Raza"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">City / District *</label>
                    <input
                      type="text"
                      required
                      value={applicantCity}
                      onChange={(e) => setApplicantCity(e.target.value)}
                      placeholder="e.g. Mumbai / Lucknow"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="applicant@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Educational / Medical Case Summary</label>
                  <textarea
                    rows={3}
                    value={applicantNotes}
                    onChange={(e) => setApplicantNotes(e.target.value)}
                    placeholder="Briefly state course, college, medical condition, or assistance required..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProgramForApply(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Program Application</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
