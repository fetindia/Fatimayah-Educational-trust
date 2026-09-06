/**
 * @license
 * Public Initiatives & Programs Showcase
 * Fatimyah Educational Trust India
 */

import React, { useState } from 'react';
import { 
  GraduationCap, 
  Award, 
  HeartHandshake, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  ShieldCheck,
  Calendar,
  X,
  Send
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

interface PublicInitiativesProps {
  onOpenAuth: () => void;
  onSelectInitiative?: (key: string) => void;
}

export const PublicInitiatives: React.FC<PublicInitiativesProps> = ({ onOpenAuth }) => {
  const { config } = useConfig();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'education' | 'madrasa' | 'medical' | 'welfare'>('all');
  const [selectedProgramModal, setSelectedProgramModal] = useState<any | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantCourse, setApplicantCourse] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applySubmitted, setApplySubmitted] = useState(false);

  const initiatives = [
    {
      id: 'scholarships',
      title: 'Higher Education Degree Merit Scholarships',
      categoryType: 'education',
      category: 'Higher Education & Academics',
      icon: GraduationCap,
      color: 'emerald',
      grantValue: 'Up to ₹85,000 / Year',
      description: 'Tuition support for undergraduate and postgraduate scholars pursuing Engineering (BE/BTech), Medicine (MBBS/BDS/BAMS), Pharmacy, Law, and Chartered Accountancy.',
      stats: '42,500+ Scholars Funded',
      eligibility: 'Minimum 60% in HSC + Family income < ₹3.0 Lakhs/annum',
      deadline: 'Rolling Applications Open AY 2026-27',
      ctaText: 'Apply for Higher Ed Grant'
    },
    {
      id: 'talent-exam',
      title: 'National STEM & Islamic Olympiad 2026',
      categoryType: 'education',
      category: 'Talent Search & Examination',
      icon: Award,
      color: 'blue',
      grantValue: '₹1 Lakh Cash + Laptop Awards',
      description: 'State-wide aptitude test proctored in 28 district centers covering general science, mathematics, Islamic history, critical logic, and English comprehension.',
      stats: '1,420 Registered Students (2026)',
      eligibility: 'Class 8th to 12th & Degree College Students',
      deadline: 'Exam Date: October 18, 2026',
      ctaText: 'Register for Talent Exam'
    },
    {
      id: 'madrasa-modern',
      title: 'Integrated Madrasa STEM Laboratories',
      categoryType: 'madrasa',
      category: 'Institutional Modernization',
      icon: BookOpen,
      color: 'teal',
      grantValue: 'Hardware & Teacher Sponsorship',
      description: 'Empowering traditional Islamic madrasas with high-speed computer labs, English communication modules, and vocational IT certification for students.',
      stats: '14 Affiliated Institutions',
      eligibility: 'Registered Madrasas in Maharashtra & MP',
      deadline: 'Phase 2 Installations Active',
      ctaText: 'Request Modernization Grant'
    },
    {
      id: 'medical-camps',
      title: 'Dialysis Subsidy & Multi-Specialty Health Outreaches',
      categoryType: 'medical',
      category: 'Healthcare & Emergency Welfare',
      icon: HeartHandshake,
      color: 'amber',
      grantValue: '100% Free Consultation & Diagnostics',
      description: 'Zero-cost doctor consultations, blood tests, ECG, optical screening with free corrective eyeglasses, and monthly financial support for ongoing kidney dialysis.',
      stats: '18,900+ Patients Treated',
      eligibility: 'All economically vulnerable patients with verified doctor prescription',
      deadline: 'Next Mega Camp: Nov 14, 2026 (Nagpur)',
      ctaText: 'Request Medical Assistance'
    },
    {
      id: 'orphan-welfare',
      title: 'Widow & Orphan Family Sustenance Kits',
      categoryType: 'welfare',
      category: 'Social Upliftment & Zakat',
      icon: Users,
      color: 'purple',
      grantValue: 'Monthly Ration & School Fee Care',
      description: 'Dignified monthly nutritional food baskets and complete school tuition coverage for fatherless children to prevent dropout and exploitation.',
      stats: '850+ Families Adopted',
      eligibility: 'Verified single-mother households and orphans',
      deadline: 'Year-Round Sustenance Distribution',
      ctaText: 'Refer a Family in Need'
    },
    {
      id: 'civil-services',
      title: 'UPSC & MPSC Civil Services Coaching Fellowship',
      categoryType: 'education',
      category: 'Leadership & Public Administration',
      icon: Building2,
      color: 'indigo',
      grantValue: 'Full Residential Academy Fees',
      description: 'Specialized residential coaching sponsorship for promising aspirants preparing for Central and State Civil Services, Judicial Services, and Banking examinations.',
      stats: '68 Officers Qualified to date',
      eligibility: 'Graduates with qualifying score in FET Entrance Screening',
      deadline: 'Batch 2026-27 Screening: Nov 2026',
      ctaText: 'Apply for IAS Coaching'
    }
  ];

  const filteredInitiatives = selectedFilter === 'all'
    ? initiatives
    : initiatives.filter(i => i.categoryType === selectedFilter);

  const handleApplyForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !applicantPhone) return;
    setApplySubmitted(true);
    setTimeout(() => {
      setApplySubmitted(false);
      setSelectedProgramModal(null);
      setApplicantName('');
      setApplicantPhone('');
      setApplicantCourse('');
    }, 2800);
  };

  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200" id="programs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>Direct Impact Portfolios</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Flagship Trust Initiatives & Educational Programs
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Established in 1994, Fatimyah Educational Trust operates transparent, audited programs that remove financial barriers to higher education and deliver essential healthcare.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { id: 'all', label: 'All Programs' },
              { id: 'education', label: 'Higher Education & Olympiads' },
              { id: 'madrasa', label: 'Madrasa STEM Labs' },
              { id: 'medical', label: 'Healthcare & Dialysis' },
              { id: 'welfare', label: 'Orphans & Widows' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === f.id
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Initiatives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInitiatives.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <div className="mt-1 text-xs font-bold text-amber-800">
                      Grant: {item.grantValue}
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.stats}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <strong>Eligibility:</strong> {item.eligibility}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] text-slate-400 font-medium">
                    {item.deadline}
                  </div>
                  <button
                    onClick={() => setSelectedProgramModal(item)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>{item.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Application Modal */}
        {selectedProgramModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Institutional Grant Application
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                    {selectedProgramModal.title}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedProgramModal.grantValue}</p>
                </div>
                <button
                  onClick={() => setSelectedProgramModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {applySubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-extrabold text-emerald-950">Application Registered!</h4>
                  <p className="text-xs text-emerald-800">
                    Application acknowledgment has been sent to <strong>{applicantPhone}</strong>. The Education Secretariat will review documents and contact you within 5 working days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApplyForm} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Applicant Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fatima Zehra Sayed"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile (WhatsApp)</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98200 XXXXX"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Current Course / Class</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BE Computer Engg"
                        value={applicantCourse}
                        onChange={(e) => setApplicantCourse(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-bold block">Document Verification Notice:</span>
                    <span className="text-[11px] leading-relaxed block">
                      Keep Marks Sheets, College Fee Demand Bill, and Income Certificate ready for portal upload.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Application to Trust Board</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

