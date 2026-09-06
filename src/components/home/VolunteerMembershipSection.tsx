/**
 * @license
 * Volunteer & Membership Section (Strong Combined Calls-to-Action)
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Users, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  IdCard, 
  Clock, 
  MapPin, 
  Send,
  X,
  CreditCard,
  UserPlus
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';

interface VolunteerMembershipSectionProps {
  onOpenAuth: () => void;
  onOpenUserDashboard?: () => void;
}

export const VolunteerMembershipSection: React.FC<VolunteerMembershipSectionProps> = ({
  onOpenAuth,
  onOpenUserDashboard
}) => {
  const { config } = useConfig();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'volunteer' | 'membership'>('volunteer');
  
  // Volunteer Form State
  const [volForm, setVolForm] = useState({
    name: '',
    email: '',
    phone: '',
    skill: 'Academic Tutoring & Mentorship',
    chapter: 'Mumbai Central Chapter'
  });
  const [volSuccess, setVolSuccess] = useState(false);

  // Membership Form State
  const [memberTier, setMemberTier] = useState<'student' | 'associate' | 'life' | 'patron'>('life');
  const [memberSuccess, setMemberSuccess] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    profession: '',
    city: 'Mumbai'
  });

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  const handleVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volForm.name || !volForm.phone) return;
    setVolSuccess(true);
    setTimeout(() => {
      setVolSuccess(false);
      setVolForm({
        name: '',
        email: '',
        phone: '',
        skill: 'Academic Tutoring & Mentorship',
        chapter: 'Mumbai Central Chapter'
      });
    }, 4000);
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.phone) return;
    setMemberSuccess(true);
    setTimeout(() => {
      setMemberSuccess(false);
      setMemberForm({
        name: '',
        email: '',
        phone: '',
        profession: '',
        city: 'Mumbai'
      });
    }, 4000);
  };

  const membershipTiers = [
    {
      id: 'student',
      name: 'Student Member',
      fee: 'Free Registration',
      period: 'Annual Renewal',
      color: 'border-slate-300',
      badge: 'Youth Wing',
      perks: [
        'Priority access to Higher Education Scholarships',
        'Invitation to Career Guidance Seminars',
        'Verified Community Service Hours'
      ]
    },
    {
      id: 'associate',
      name: 'Associate Member',
      fee: '₹1,000 / Year',
      period: 'Annual Trust Support',
      color: 'border-emerald-300',
      badge: 'Active Contributor',
      perks: [
        'Official FET Digital Member ID Card',
        'Quarterly Institutional Impact Bulletins',
        'Nomination rights for local scholarship candidates'
      ]
    },
    {
      id: 'life',
      name: 'Life Member',
      fee: '₹15,000 One-Time',
      period: 'Lifetime Membership',
      color: 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-50/40',
      badge: 'Most Popular',
      perks: [
        'Permanent Gold Digital & Physical ID Card',
        'Voting privileges in Trust Assembly',
        'VIP Reserved Seating at Annual Convocation',
        'Section 80G Tax Exemption Certificate'
      ]
    },
    {
      id: 'patron',
      name: 'Patron Trustee',
      fee: '₹1,00,000+ Endowment',
      period: 'Foundational Patronage',
      color: 'border-blue-300',
      badge: 'Institutional Pillar',
      perks: [
        'Named Memorial Scholarship Endowments',
        'Executive Advisory Board Invitations',
        'Direct oversight of modern madrasa lab projects'
      ]
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200" id="volunteer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-950 border border-blue-300">
            <UserPlus className="w-4 h-4 text-blue-800" />
            <span>Join the National Movement • 1994 - 2026</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {config.volunteerCta?.heading || 'Be the Change: Volunteer or Become an Official Trust Member'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {config.volunteerCta?.description || 'Whether dedicating your professional expertise on the ground or joining the verified membership rolls of Fatimyah Educational Trust, your involvement empowers thousands.'}
          </p>

          {/* Action Tabs */}
          <div className="pt-4 flex justify-center gap-2">
            <button
              onClick={() => setActiveTab('volunteer')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'volunteer'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              <span>1. Join as Field Volunteer</span>
            </button>

            <button
              onClick={() => setActiveTab('membership')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'membership'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>2. Trust Membership Tiers</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: VOLUNTEER CORPS */}
        {activeTab === 'volunteer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Card: Volunteer Opportunities & Value (6 Cols) */}
            <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black shadow-xs">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200">
                    Grassroots Field Corps
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Serve the Nation with Your Professional Skills
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Join over 1,850 active volunteers across Maharashtra, MP, Gujarat, and Telangana who coordinate free medical diagnostic camps, mentor higher education scholars, and invigilate talent search examinations.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { title: 'Academic Mentoring & Tutoring', desc: 'Coach high school students in STEM, English, and competitive exams.' },
                    { title: 'Medical Camp & Dialysis Support', desc: 'Doctors, nurses, and coordinators managing patient screening and triage.' },
                    { title: 'Olympiad & Exam Proctoring', desc: 'Invigilate hall-ticket verified centers during state-wide talent tests.' },
                    { title: 'Ration & Emergency Food Drives', desc: 'Deliver nutritional sustenance kits to widow and orphan households.' }
                  ].map((opp, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">{opp.title}</span>
                        <span className="text-slate-600">{opp.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-900 text-white text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Official Verified Service Certificate</span>
                </div>
                <p className="text-blue-100 text-[11px] leading-relaxed">
                  All hours logged by registered volunteers earn an authenticated digital Certificate of Service for university credit and career portfolios.
                </p>
              </div>
            </div>

            {/* Right Card: Instant Volunteer Registration Form (6 Cols) */}
            <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl flex flex-col justify-between">
              {volSuccess ? (
                <div className="my-auto text-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-10 h-10 text-emerald-700" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900">Volunteer Enlistment Confirmed!</h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                      Thank you for offering your time. A Chapter Coordinator from <strong>{volForm.chapter}</strong> will reach out via WhatsApp for orientation.
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                    Registration ID: FET-VOL-2026
                  </span>
                </div>
              ) : (
                <form onSubmit={handleVolunteerSubmit} className="space-y-4 text-xs">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      Fast 2-Minute Enlistment
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">Register as an FET Volunteer</h3>
                    <p className="text-slate-500 text-xs">No prior experience required — training and field supplies provided.</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Altaf Sayed"
                      value={volForm.name}
                      onChange={(e) => setVolForm({ ...volForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="altaf@example.com"
                        value={volForm.email}
                        onChange={(e) => setVolForm({ ...volForm, email: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">WhatsApp Mobile</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98200 XXXXX"
                        value={volForm.phone}
                        onChange={(e) => setVolForm({ ...volForm, phone: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Area of Expertise</label>
                      <select
                        value={volForm.skill}
                        onChange={(e) => setVolForm({ ...volForm, skill: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="Academic Tutoring & Mentorship">Academic Tutoring & Mentorship</option>
                        <option value="Medical & Healthcare Logistics">Medical & Healthcare Logistics</option>
                        <option value="IT, Web & Digital Media">IT, Web & Digital Media</option>
                        <option value="Examination Proctoring">Examination Proctoring</option>
                        <option value="Food & Ration Drives">Food & Ration Drives</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Preferred District Chapter</label>
                      <select
                        value={volForm.chapter}
                        onChange={(e) => setVolForm({ ...volForm, chapter: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="Mumbai Central Chapter">Mumbai Central Chapter</option>
                        <option value="Pune & Western MH Chapter">Pune & Western MH Chapter</option>
                        <option value="Nagpur & Vidarbha Chapter">Nagpur & Vidarbha Chapter</option>
                        <option value="Aurangabad (CSN) Chapter">Aurangabad (CSN) Chapter</option>
                        <option value="Bhopal / Indore MP Chapter">Bhopal / Indore MP Chapter</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4 text-amber-300" />
                      <span>Submit Volunteer Application</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        )}

        {/* VIEW 2: TRUST MEMBERSHIP */}
        {activeTab === 'membership' && (
          <div className="space-y-8">
            
            {/* Membership Tiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {membershipTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-3xl border ${tier.color} bg-white p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800">
                        {tier.badge}
                      </span>
                      <IdCard className="w-5 h-5 text-slate-400" />
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-slate-900">{tier.name}</h4>
                      <div className="text-xl font-black text-emerald-800 mt-1">{tier.fee}</div>
                      <span className="text-[11px] text-slate-500 block">{tier.period}</span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {tier.perks.map((p, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMemberTier(tier.id as any);
                      if (currentUser && onOpenUserDashboard) {
                        onOpenUserDashboard();
                      } else {
                        onOpenAuth();
                      }
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                      tier.id === 'life'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Enroll as {tier.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Verified Digital Member ID Preview */}
            <div className="p-6 sm:p-8 rounded-3xl bg-radial from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Instant Digital Credentials</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Get Your Official FET India Digital Membership Card
                </h3>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Upon member verification, access your secure QR-coded Digital ID Card in your dashboard, valid across all district chapter assemblies and partner institutions.
                </p>
              </div>

              <button
                onClick={currentUser ? onOpenUserDashboard : onOpenAuth}
                className="px-6 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm shadow-md cursor-pointer flex items-center gap-2 shrink-0 border border-emerald-500/40"
              >
                <IdCard className="w-4 h-4 text-amber-300" />
                <span>{currentUser ? 'View My Member ID Card' : 'Sign In to Access Member ID'}</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
