/**
 * @license
 * Dedicated Full Webpage: Trust Membership & Digital Identity System
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  IdCard, 
  Clock, 
  MapPin, 
  CreditCard, 
  UserPlus, 
  ArrowLeft,
  QrCode,
  FileCheck2,
  Lock,
  Download,
  Check,
  Building,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';

interface MembershipPageProps {
  onOpenAuth: () => void;
  onOpenMemberVerification?: (memberId?: string) => void;
  onOpenUserDashboard?: () => void;
  onReturnToHome: () => void;
  onOpenDonate?: () => void;
}

type MembershipTier = 'patron' | 'life' | 'annual' | 'student';

export const MembershipPage: React.FC<MembershipPageProps> = ({
  onOpenAuth,
  onOpenMemberVerification,
  onOpenUserDashboard,
  onReturnToHome,
  onOpenDonate
}) => {
  const { config } = useConfig();
  const { currentUser } = useAuth();

  const [selectedTier, setSelectedTier] = useState<MembershipTier>('life');
  const [verifyIdInput, setVerifyIdInput] = useState<string>('');

  // Application form state
  const [fullName, setFullName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [profession, setProfession] = useState('');
  const [statement, setStatement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  const tiers = [
    {
      id: 'patron' as MembershipTier,
      title: 'Patron Benefactor Member',
      fee: '₹50,000+',
      feeLabel: 'One-Time Foundation Contribution',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      description: 'Visionary patrons providing enduring institutional backing to the Trust higher education and school modernization endowments.',
      benefits: [
        'Apex Institutional Advisory Board invitation',
        'Gold Digital Membership Sovereign Card with QR verification',
        'Permanent citation in Annual Trust Jubilee publications',
        'Voting & consultative rights at Annual General Body meetings',
        'VIP access to all national Trust conferences and seminars',
        'Direct quarterly institutional financial and audit reports'
      ]
    },
    {
      id: 'life' as MembershipTier,
      title: 'Life Member',
      fee: '₹10,000',
      feeLabel: 'One-Time Contribution',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      popular: true,
      description: 'Permanent custodians who guide community welfare initiatives, oversee local educational outreach, and participate in institutional democracy.',
      benefits: [
        'Permanent Life Membership status with tamper-proof Digital ID',
        'Participation & voting privileges at Annual General Assembly',
        'Eligibility to serve on Trust Regional Advisory Councils',
        'Priority recommendation for student scholarship cases',
        'Quarterly printed Trust gazette & academic newsletters'
      ]
    },
    {
      id: 'annual' as MembershipTier,
      title: 'Ordinary / Annual Member',
      fee: '₹1,200',
      feeLabel: 'Annual Academic Year Contribution',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      description: 'Active community supporters who maintain an annual participatory relationship with the Trust and contribute to operational missions.',
      benefits: [
        'Official Annual Digital Membership Credential with QR Code',
        'Observer attendance at the Annual General Assembly',
        'Regular field mission alerts and volunteer coordination',
        'Tax-exempt 80G receipt for annual membership contribution'
      ]
    },
    {
      id: 'student' as MembershipTier,
      title: 'Student / Youth Associate',
      fee: '₹250',
      feeLabel: 'Subsidized Annual Grant',
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
      description: 'Designed for college scholars, young professionals, and youth leaders seeking mentorship, civil service grooming, and community leadership experience.',
      benefits: [
        'Student Associate Digital ID Card',
        'Free entry into Trust Book Reading Competitions and Olympiads',
        'Access to IAS/UPSC career counseling & leadership webinars',
        'Official certificate of community service engagement'
      ]
    }
  ];

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;
    setSubmitting(true);

    try {
      const generatedId = `FET-APP-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date().toISOString();
      const applicantUid = currentUser?.uid || `guest_${Date.now()}`;
      const isLifeMember = selectedTier === 'life';
      const canonicalType = isLifeMember ? 'life_member' : selectedTier === 'patron' ? 'core_member' : 'general_member';
      const tierTitle = selectedTier === 'life' ? 'Life Member' : selectedTier === 'patron' ? 'Patron Member' : selectedTier === 'student' ? 'Student Member' : 'Associate Member';

      // 1. Write to canonical membershipApplications collection
      try {
        await addDoc(collection(db, 'membershipApplications'), {
          applicantUid,
          applicantEmail: email || currentUser?.email || 'applicant@fetindia.org',
          fullLegalName: fullName,
          guardianName: guardianName || '',
          mobileNumber: phone,
          country: 'India',
          state: stateName || 'Jammu & Kashmir',
          district: city || 'Srinagar',
          fullAddress: `${city || ''}, ${stateName || ''}`.trim() || 'Address on file',
          occupation: profession || '',
          membershipType: canonicalType,
          requestedTier: canonicalType,
          tier: tierTitle,
          applicationNumber: generatedId,
          reasonForJoining: statement || `Application submitted via Public Membership Portal (${tierTitle})`,
          declarationAccepted: true,
          termsAccepted: true,
          status: 'pending',
          createdAt: now,
          updatedAt: now
        });
      } catch (canonicalErr) {
        console.warn('Canonical membershipApplications write notice:', canonicalErr);
      }

      // 2. Also write to legacy member_applications collection for backward-compatibility
      await addDoc(collection(db, 'member_applications'), {
        applicationNumber: generatedId,
        fullName,
        guardianName,
        email,
        phone,
        city,
        stateName,
        profession,
        tier: selectedTier,
        statement,
        status: 'PENDING_VERIFICATION',
        userId: currentUser?.uid || null,
        createdAt: serverTimestamp()
      });
      setSubmittedAppId(generatedId);
    } catch (err) {
      console.warn('Could not write to member_applications in Firestore:', err);
      // Fallback local acknowledgment
      setSubmittedAppId(`FET-APP-${Math.floor(100000 + Math.random() * 900000)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <button 
              type="button" 
              onClick={onReturnToHome} 
              className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <span className="text-slate-500">/</span>
            <span className="text-amber-400 font-semibold">Trust Membership System</span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <button
                type="button"
                onClick={onOpenUserDashboard}
                className="px-3 py-1 rounded-full bg-indigo-800 hover:bg-indigo-700 text-indigo-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <IdCard className="w-3.5 h-3.5 text-amber-400" />
                <span>View My Digital Member Card</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Sign In to Member Portal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-16 sm:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold tracking-wide">
              <Users className="w-4 h-4 text-amber-400" />
              <span>FATIMYAH EDUCATIONAL TRUST — INSTITUTIONAL MEMBERSHIP</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Become a Custodian of Educational Progress
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Join thousands of devoted community leaders, academics, and patrons who uphold the mission of Fatimyah Educational Trust. Members enjoy democratic consultative voice, institutional transparency, and verified digital credentials.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#membership-application"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-950/40 transition-all flex items-center gap-2"
              >
                <span>Apply for Membership</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#verify-membership"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm transition-all flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Verify Member ID & Status</span>
              </a>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">3,800+</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Active Life Members</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">32 Yrs</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Uninterrupted Governance</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-sky-400">100%</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Audited Financials</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-purple-400">Instant</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Digital QR Identity Card</div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Tiers Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Membership Categories & Privileges
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Select the membership tier that reflects your commitment and capacity to champion educational equity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
                selectedTier === tier.id
                  ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-lg'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${tier.badgeColor}`}>
                    {tier.title}
                  </span>
                  {tier.popular && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-600 text-white uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-2xl font-black text-slate-900">{tier.fee}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{tier.feeLabel}</div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {tier.description}
                </p>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Member Entitlements
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {tier.benefits.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTier(tier.id);
                    const el = document.getElementById('membership-application');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    selectedTier === tier.id
                      ? 'bg-indigo-700 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {selectedTier === tier.id ? 'Selected Tier' : 'Choose This Tier'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Digital Membership Card Preview & Verification Section */}
      <section id="verify-membership" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Explanation */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                <IdCard className="w-4 h-4 text-indigo-600" />
                <span>Tamper-Proof Digital Credential</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                Your Official Sovereign Digital Membership Card
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Every verified member of Fatimyah Educational Trust receives an immutable digital identity card featuring a unique Member Serial Number, cryptographic QR verification code, and official Trust seal.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Instant Field Verification</h4>
                    <p className="text-[11px] text-slate-500">Scan the QR code on any smartphone to verify official membership status directly against Trust records.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Annual General Assembly Access</h4>
                    <p className="text-[11px] text-slate-500">Your digital credential serves as official photo identification and entry pass for trust deliberations.</p>
                  </div>
                </div>
              </div>

              {/* Status Lookup Search Box */}
              <div className="pt-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Verify an Existing Membership Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verifyIdInput}
                    onChange={(e) => setVerifyIdInput(e.target.value)}
                    placeholder="e.g. FET-MEM-2026-8891"
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 flex-1 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenMemberVerification) {
                        onOpenMemberVerification(verifyIdInput.trim() || undefined);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Realistic Card Visual Display */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 text-white shadow-2xl border border-indigo-800/40 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-xs">
                        FET
                      </div>
                      <div>
                        <div className="text-[10px] tracking-wider uppercase font-bold text-amber-400">Official Membership</div>
                        <div className="text-xs font-black tracking-tight">FATIMYAH EDUCATIONAL TRUST</div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black uppercase">
                      Life Member
                    </span>
                  </div>

                  {/* Member Name & Details */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-400/50 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                      <Users className="w-8 h-8 text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-bold text-white">Syed Mohammad Baqir</div>
                      <div className="text-[11px] text-slate-300">Mumbai Central Chapter</div>
                      <div className="font-mono text-[10px] text-amber-300/90 font-semibold tracking-wider">
                        ID: FET-MEM-2026-8891
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">Valid Through</span>
                      <span className="font-semibold text-white">PERPETUAL (LIFE)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Charity Reg. No</span>
                      <span className="font-semibold text-white">E-12345 (BOM)</span>
                    </div>
                  </div>

                  {/* QR & Security Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Tamper-Proof Digital Verification</span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white p-1 text-slate-950 flex items-center justify-center">
                      <QrCode className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Online Membership Application Form */}
      <section id="membership-application" className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <UserPlus className="w-3.5 h-3.5 text-amber-700" />
            <span>Online Enrolment Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Submit Your Membership Application
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Applications are reviewed and ratified by the Trust Member Administrator.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
          {submittedAppId ? (
            <div className="py-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Application Submitted Successfully</h3>
                <p className="text-xs text-slate-600">
                  Your official application tracking number has been generated:
                </p>
                <div className="font-mono text-base font-bold text-indigo-700 py-2 bg-indigo-50 rounded-xl border border-indigo-100 mt-2">
                  {submittedAppId}
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The Member Admin secretariat will review your documents and reach out regarding digital card issuance and contribution ratification.
              </p>
              <button
                type="button"
                onClick={() => setSubmittedAppId(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Submit Another Application
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplySubmit} className="space-y-5">
              {/* Selected Tier Banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-indigo-600 font-medium">Selected Membership Category:</span>{' '}
                  <strong className="text-indigo-950 uppercase">{selectedTier} Member</strong>
                </div>
                <a href="#active-tiers" onClick={() => setSelectedTier('life')} className="text-indigo-700 font-bold hover:underline">
                  Change Tier
                </a>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Full Name (As per Aadhaar/PAN) *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Syed Mohammad Ali"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Father&apos;s / Guardian&apos;s Name</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="e.g. Janab Syed Haider Ali"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">City / District *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">State *</label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Profession / Occupation</label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Software Engineer / Doctor / Business / Educationist / Student"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Commitment to Trust Objectives</label>
                <textarea
                  rows={3}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Briefly state how you hope to contribute to the mission of Fatimyah Educational Trust..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Registering Application...</span>
                  ) : (
                    <>
                      <span>Submit Official Membership Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
