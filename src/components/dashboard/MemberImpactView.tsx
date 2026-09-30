/**
 * @license
 * Member "My Impact" Contribution & Activity Ledger
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides an aggregated personal record of the authenticated user's participation,
 * contributions, volunteer hours, exams, certificates, donations, and membership standing.
 * Uses ONLY the user's existing data records (strictly zero duplicate collections).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  BadgeDollarSign, 
  HeartHandshake, 
  Award, 
  CreditCard, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  Download, 
  Printer, 
  Eye, 
  ExternalLink, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Activity, 
  MapPin, 
  ChevronRight,
  Flame,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  CampaignDonation, 
  VolunteerServiceRecord, 
  VolunteerApplication, 
  CompetitionRegistration, 
  CompetitionCertificateRecord,
  MembershipApplication,
  DonorApplication,
  Competition
} from '../../types';
import { PrintableDonationReceiptModal, DonationReceiptModalData } from '../donor/PrintableDonationReceiptModal';
import { DigitalCertificateModal } from '../competitions/DigitalCertificateModal';
import { INITIAL_COMPETITIONS } from '../../data/initialCompetitions';

interface MemberImpactViewProps {
  onOpenTab?: (tab: string) => void;
  onExploreCampaigns?: () => void;
  onExploreCompetitions?: () => void;
}

interface TimelineEvent {
  id: string;
  type: 'donation' | 'volunteer' | 'competition' | 'exam' | 'certificate' | 'membership' | 'application';
  title: string;
  subtitle: string;
  date: string;
  timestamp: number;
  badge: string;
  badgeColor: string;
  meta?: any;
}

export const MemberImpactView: React.FC<MemberImpactViewProps> = ({
  onOpenTab,
  onExploreCampaigns,
  onExploreCompetitions
}) => {
  const { currentUser, userProfile } = useAuth();
  const { config } = useConfig();

  const [activeSubSection, setActiveSubSection] = useState<'overview' | 'donations' | 'volunteer' | 'competitions' | 'membership' | 'timeline'>('overview');

  // Real data state aggregated from existing platform collections
  const [donations, setDonations] = useState<CampaignDonation[]>([]);
  const [volunteerLogs, setVolunteerLogs] = useState<VolunteerServiceRecord[]>([]);
  const [volunteerApp, setVolunteerApp] = useState<VolunteerApplication | null>(null);
  const [competitionRegs, setCompetitionRegs] = useState<CompetitionRegistration[]>([]);
  const [certificates, setCertificates] = useState<CompetitionCertificateRecord[]>([]);
  const [membershipApps, setMembershipApps] = useState<MembershipApplication[]>([]);
  const [donorApps, setDonorApps] = useState<DonorApplication[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<DonationReceiptModalData | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<CompetitionCertificateRecord | null>(null);

  // =========================================================================
  // Real-Time Subscriptions to Existing Collections (Zero Duplication)
  // =========================================================================
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const unsubs: (() => void)[] = [];

    try {
      // 1. User's Donations & Crowdfunding Contributions
      const donQuery = query(
        collection(db, 'campaign_donations'),
        where('donorUid', '==', currentUser.uid)
      );
      unsubs.push(
        onSnapshot(donQuery, (snap) => {
          const list: CampaignDonation[] = [];
          snap.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() } as CampaignDonation);
          });
          setDonations(list);
        }, (err) => console.warn('Impact donations listener note:', err))
      );

      // 2. User's Volunteer Service Records & Hours
      const volServiceQuery = query(
        collection(db, 'volunteer_service_records'),
        where('userId', '==', currentUser.uid)
      );
      unsubs.push(
        onSnapshot(volServiceQuery, (snap) => {
          const list: VolunteerServiceRecord[] = [];
          snap.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() } as VolunteerServiceRecord);
          });
          setVolunteerLogs(list);
        }, (err) => console.warn('Impact volunteer logs listener note:', err))
      );

      // 3. User's Volunteer Application
      const volAppQuery = query(
        collection(db, 'volunteerApplications'),
        where('applicantUid', '==', currentUser.uid)
      );
      unsubs.push(
        onSnapshot(volAppQuery, (snap) => {
          if (!snap.empty) {
            setVolunteerApp({ id: snap.docs[0].id, ...snap.docs[0].data() } as VolunteerApplication);
          }
        }, (err) => console.warn('Impact volunteer app listener note:', err))
      );

      // 4. User's Competition Registrations & Exams
      const compRegQuery = query(
        collection(db, 'competition_registrations'),
        where('participantUid', '==', currentUser.uid)
      );
      unsubs.push(
        onSnapshot(compRegQuery, (snap) => {
          const list: CompetitionRegistration[] = [];
          snap.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() } as CompetitionRegistration);
          });
          setCompetitionRegs(list);
        }, (err) => console.warn('Impact comp regs listener note:', err))
      );

      // 5. Competitions List (for titles and details)
      unsubs.push(
        onSnapshot(collection(db, 'competitions'), (snap) => {
          if (!snap.empty) {
            const list: Competition[] = [];
            snap.forEach(doc => {
              list.push({ id: doc.id, ...doc.data() } as Competition);
            });
            setCompetitions(list);
          }
        }, (err) => console.warn('Impact comp catalog listener note:', err))
      );

      // 6. User's Certificates
      const certQuery = query(collection(db, 'competition_certificates'));
      unsubs.push(
        onSnapshot(certQuery, (snap) => {
          const list: CompetitionCertificateRecord[] = [];
          snap.forEach(doc => {
            const data = doc.data() as CompetitionCertificateRecord;
            if (data.participantId === currentUser.uid || data.registrationId) {
              list.push({ id: doc.id, ...data });
            }
          });
          setCertificates(list);
        }, (err) => console.warn('Impact certificates listener note:', err))
      );

      // 7. User's Membership Applications
      const mbrAppQuery = query(
        collection(db, 'membershipApplications'),
        where('applicantUid', '==', currentUser.uid)
      );
      unsubs.push(
        onSnapshot(mbrAppQuery, (snap) => {
          const list: MembershipApplication[] = [];
          snap.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() } as MembershipApplication);
          });
          setMembershipApps(list);
        }, (err) => console.warn('Impact membership apps listener note:', err))
      );

      // 8. User's Donor Applications
      const donorAppQuery = query(
        collection(db, 'donorApplications'),
        where('applicantUid', '==', currentUser.uid)
      );
      unsubs.push(
        onSnapshot(donorAppQuery, (snap) => {
          const list: DonorApplication[] = [];
          snap.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() } as DonorApplication);
          });
          setDonorApps(list);
        }, (err) => console.warn('Impact donor apps listener note:', err))
      );

    } catch (err) {
      console.warn('Error setting up impact subscriptions:', err);
    } finally {
      setIsLoading(false);
    }

    return () => {
      unsubs.forEach(u => u());
    };
  }, [currentUser]);

  // =========================================================================
  // Derived Impact Metrics (All calculated strictly from real data)
  // =========================================================================
  const verifiedDonations = useMemo(() => {
    return donations.filter(d => d.paymentStatus === 'verified');
  }, [donations]);

  const totalDonationAmount = useMemo(() => {
    return verifiedDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [verifiedDonations]);

  const totalVolunteerHours = useMemo(() => {
    return volunteerLogs.reduce((sum, log) => sum + (Number(log.hoursServed) || 0), 0);
  }, [volunteerLogs]);

  const completedExamsCount = useMemo(() => {
    return competitionRegs.filter(r => r.status === 'completed' || r.isResultPublished).length;
  }, [competitionRegs]);

  const totalApplicationsCount = useMemo(() => {
    return membershipApps.length + (volunteerApp ? 1 : 0) + donorApps.length;
  }, [membershipApps, volunteerApp, donorApps]);

  const hasAnyImpact = useMemo(() => {
    return (
      donations.length > 0 ||
      volunteerLogs.length > 0 ||
      competitionRegs.length > 0 ||
      certificates.length > 0 ||
      membershipApps.length > 0 ||
      userProfile?.membershipStatus === 'general_member' ||
      userProfile?.membershipStatus === 'core_member' ||
      userProfile?.volunteerStatus === 'active_volunteer'
    );
  }, [donations, volunteerLogs, competitionRegs, certificates, membershipApps, userProfile]);

  // =========================================================================
  // Chronological Activity Timeline Construction
  // =========================================================================
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // 1. Donations
    donations.forEach(d => {
      const ts = d.createdAt ? new Date(d.createdAt).getTime() : 0;
      events.push({
        id: `don-${d.id}`,
        type: 'donation',
        title: `Contributed ₹${Number(d.amount).toLocaleString('en-IN')}`,
        subtitle: d.campaignTitle || 'General Trust Appeal',
        date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
        timestamp: ts,
        badge: d.paymentStatus === 'verified' ? '80G Tax Exemption Ready' : d.paymentStatus,
        badgeColor: d.paymentStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
        meta: d
      });
    });

    // 2. Volunteer Service Logs
    volunteerLogs.forEach(v => {
      const ts = v.date ? new Date(v.date).getTime() : 0;
      events.push({
        id: `vol-${v.id}`,
        type: 'volunteer',
        title: `Served ${v.hoursServed} Volunteer Hours`,
        subtitle: v.activityTitle || 'Community Service Mission',
        date: v.date ? new Date(v.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
        timestamp: ts,
        badge: v.status === 'approved' ? 'Verified Service' : 'Hours Logged',
        badgeColor: 'bg-purple-100 text-purple-800',
        meta: v
      });
    });

    // 3. Competition Registrations & Exam Completions
    competitionRegs.forEach(c => {
      const ts = c.registeredAt ? new Date(c.registeredAt).getTime() : 0;
      const comp = competitions.find(x => x.id === c.competitionId);
      events.push({
        id: `comp-${c.id}`,
        type: c.status === 'completed' ? 'exam' : 'competition',
        title: c.status === 'completed' ? 'Completed Examination' : 'Enrolled in Competition',
        subtitle: comp?.title || c.competitionId || 'FET India Academic Contest',
        date: c.registeredAt ? new Date(c.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
        timestamp: ts,
        badge: c.status === 'completed' ? (c.marksObtained !== undefined ? `Score: ${c.marksObtained}/${c.totalMarks || 100}` : 'Exam Submitted') : 'Registered Candidate',
        badgeColor: c.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800',
        meta: c
      });
    });

    // 4. Certificates Earned
    certificates.forEach(cert => {
      const ts = cert.issueDate ? new Date(cert.issueDate).getTime() : 0;
      events.push({
        id: `cert-${cert.id || cert.certificateId}`,
        type: 'certificate',
        title: `Earned ${cert.achievementTitle || 'Certificate of Merit'}`,
        subtitle: cert.competitionTitle || 'FET India Academic Achievement',
        date: cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
        timestamp: ts,
        badge: `Certificate #${cert.certificateId || (cert.id ? cert.id.slice(0, 8) : 'VERIFIED')}`,
        badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
        meta: cert
      });
    });

    // 5. Membership Milestones
    if (userProfile?.membershipStatus === 'general_member' || userProfile?.membershipStatus === 'core_member') {
      const ts = userProfile.membershipApprovedAt ? new Date(userProfile.membershipApprovedAt).getTime() : 0;
      events.push({
        id: 'mbr-approved',
        type: 'membership',
        title: `Membership Approved (${userProfile.membershipStatus === 'core_member' ? 'Core Member' : 'General Member'})`,
        subtitle: `Membership ID: ${userProfile.membershipId || 'FET-MBR-VERIFIED'}`,
        date: userProfile.membershipApprovedAt ? new Date(userProfile.membershipApprovedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Trust Active',
        timestamp: ts,
        badge: 'Official Member',
        badgeColor: 'bg-emerald-100 text-emerald-800',
        meta: userProfile
      });
    }

    // 6. Applications Submitted
    membershipApps.forEach(app => {
      const ts = app.createdAt ? new Date(app.createdAt).getTime() : 0;
      events.push({
        id: `app-mbr-${app.id}`,
        type: 'application',
        title: 'Submitted Membership Application',
        subtitle: `Stage: ${app.status || 'Under Review'}`,
        date: app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
        timestamp: ts,
        badge: app.status === 'approved' ? 'Approved' : 'In Review',
        badgeColor: app.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700',
        meta: app
      });
    });

    // Sort descending by timestamp
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [donations, volunteerLogs, competitionRegs, competitions, certificates, userProfile, membershipApps]);

  // Open 80G Receipt Modal
  const handleOpenReceipt = (d: CampaignDonation) => {
    const modalData: DonationReceiptModalData = {
      receiptNumber: (d as any).receiptNumber || `REC/80G/${d.id ? d.id.slice(0, 8).toUpperCase() : 'DONATION'}`,
      donationDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recent',
      donorName: d.donorName || userProfile?.fullLegalName || userProfile?.fullName || currentUser?.displayName || 'Donor',
      donorPan: d.donorPan || userProfile?.panNumber,
      donorEmail: d.donorEmail || currentUser?.email || undefined,
      donorPhone: d.donorPhone || userProfile?.mobileNumber,
      donorAddress: userProfile?.fullAddress || userProfile?.address,
      amount: d.amount,
      currency: 'INR',
      paymentMode: d.paymentMethod || 'Online Razorpay / UPI',
      transactionReference: d.transactionReference || d.razorpayPaymentId || `TXN-${d.id ? d.id.slice(0, 10) : 'REF'}`,
      paymentGateway: 'Razorpay PG',
      causeTitle: d.campaignTitle || 'General Educational Trust Relief Fund',
      paymentStatus: d.paymentStatus,
      is80GClaimed: true
    };
    setSelectedReceipt(modalData);
  };

  return (
    <div className="space-y-6" id="member-my-impact-root">
      
      {/* Top Welcome / Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Personal Social Impact Ledger</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Impact at Fatimyah Educational Trust
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your comprehensive record of service, donations, examinations, certificates, and institutional contributions supporting education and empowerment across India.
            </p>
          </div>

          {/* Quick Member Standing Badge */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-3.5 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-md">
              {(userProfile?.fullLegalName || userProfile?.fullName || currentUser?.displayName || 'M').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">
                {userProfile?.fullLegalName || userProfile?.fullName || currentUser?.displayName || 'Valued Member'}
              </div>
              <div className="text-[11px] text-amber-300 font-mono">
                {userProfile?.membershipId || (currentUser?.uid ? `UID: ${currentUser.uid.slice(0, 8)}` : 'FET Member')}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
                {userProfile?.membershipStatus === 'core_member' ? 'Core Member' : (userProfile?.membershipStatus === 'general_member' ? 'General Member' : 'Registered Supporter')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Real Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Donations */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Donated</span>
            <BadgeDollarSign className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            ₹{totalDonationAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">
            {verifiedDonations.length} Contributions
          </span>
        </div>

        {/* Volunteer Service Hours */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Service Hours</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {totalVolunteerHours} <span className="text-xs font-bold text-slate-400">hrs</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">
            {volunteerLogs.length} Missions Logged
          </span>
        </div>

        {/* Competitions Participated */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Competitions</span>
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {competitionRegs.length}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">
            Enrolled Contests
          </span>
        </div>

        {/* Exams Completed */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Exams Taken</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {completedExamsCount}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">
            Completed Papers
          </span>
        </div>

        {/* Certificates Earned */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Certificates</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {certificates.length}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">
            Merit & Service
          </span>
        </div>

        {/* Applications */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Applications</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {totalApplicationsCount}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">
            KYC & Registrations
          </span>
        </div>

      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        
        <button
          onClick={() => setActiveSubSection('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubSection === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Impact Overview</span>
        </button>

        <button
          onClick={() => setActiveSubSection('donations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubSection === 'donations'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <BadgeDollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span>Donations & Crowdfunding</span>
          {donations.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-300">
              {donations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubSection('volunteer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubSection === 'volunteer'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5 text-purple-400" />
          <span>Volunteer & Service</span>
          {totalVolunteerHours > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
              {totalVolunteerHours}h
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubSection('competitions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubSection === 'competitions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-blue-400" />
          <span>Competitions & Exams</span>
          {competitionRegs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
              {competitionRegs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubSection('membership')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubSection === 'membership'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>Membership & Standing</span>
        </button>

        <button
          onClick={() => setActiveSubSection('timeline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubSection === 'timeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Chronological Timeline</span>
          {timelineEvents.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-800">
              {timelineEvents.length}
            </span>
          )}
        </button>

      </div>

      {/* ===================================================================== */}
      {/* SUB-SECTION 1: OVERVIEW & HIGHLIGHTS */}
      {/* ===================================================================== */}
      {activeSubSection === 'overview' && (
        <div className="space-y-6">
          
          {/* If No Activity At All */}
          {!hasAnyImpact && (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900">Your Impact Activity Ledger</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your impact activity will appear here as you participate in FET India programs, donate to verified appeals, log volunteer hours, or enroll in examinations.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {onExploreCampaigns && (
                  <button
                    onClick={onExploreCampaigns}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <BadgeDollarSign className="w-4 h-4" />
                    <span>Support a Cause</span>
                  </button>
                )}
                {onOpenTab && (
                  <button
                    onClick={() => onOpenTab('volunteer')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>Join Volunteer Corps</span>
                  </button>
                )}
                {onExploreCompetitions && (
                  <button
                    onClick={onExploreCompetitions}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    <span>Explore Competitions</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Highlights Grid */}
          {hasAnyImpact && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Recent Impact Contributions */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Recent Activity Highlights
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveSubSection('timeline')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All ({timelineEvents.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {timelineEvents.slice(0, 4).map(evt => (
                    <div key={evt.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900">{evt.title}</div>
                        <div className="text-[11px] text-slate-500">{evt.subtitle}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{evt.date}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${evt.badgeColor}`}>
                        {evt.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Impact Breakdown */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Contribution Portfolio Summary
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  
                  {/* Donations */}
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        ₹
                      </div>
                      <div>
                        <div className="font-bold text-emerald-950">Philanthropic Contributions</div>
                        <div className="text-[11px] text-emerald-700">{verifiedDonations.length} Verified Donations</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-950 text-sm">₹{totalDonationAmount.toLocaleString('en-IN')}</div>
                      <button 
                        onClick={() => setActiveSubSection('donations')}
                        className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        View Receipts
                      </button>
                    </div>
                  </div>

                  {/* Volunteer Service */}
                  <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-purple-950">Community & Volunteer Hours</div>
                        <div className="text-[11px] text-purple-700">{volunteerLogs.length} Activities Completed</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-purple-950 text-sm">{totalVolunteerHours} Hours</div>
                      <button 
                        onClick={() => setActiveSubSection('volunteer')}
                        className="text-[10px] font-bold text-purple-700 hover:underline cursor-pointer"
                      >
                        View Log
                      </button>
                    </div>
                  </div>

                  {/* Competitions & Exams */}
                  <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-blue-950">Academic Excellence & Exams</div>
                        <div className="text-[11px] text-blue-700">{completedExamsCount} Completed of {competitionRegs.length} Enrolled</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-blue-950 text-sm">{certificates.length} Certs</div>
                      <button 
                        onClick={() => setActiveSubSection('competitions')}
                        className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer"
                      >
                        View Scores
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-SECTION 2: DONATION IMPACT & 80G RECEIPTS */}
      {/* ===================================================================== */}
      {activeSubSection === 'donations' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
                <span>Donation Impact & Statutory 80G Receipts</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Eligible under Section 80G(5)(vi) and Section 12A of the Income Tax Act, 1961. Download verified receipts instantly.
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Philanthropy</span>
              <div className="text-lg font-black text-emerald-700">₹{totalDonationAmount.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {donations.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <BadgeDollarSign className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-xs text-slate-600">No donation records found on your account.</p>
              <p className="text-[11px]">When you contribute to FATIMYAH EDUCATIONAL TRUST appeals, your 80G tax certificates appear here.</p>
              {onExploreCampaigns && (
                <button
                  onClick={onExploreCampaigns}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <BadgeDollarSign className="w-4 h-4" />
                  <span>Explore Verified Causes</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Cause / Appeal</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Mode / Ref</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt / 80G</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donations.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-[200px] truncate" title={d.campaignTitle}>
                        {d.campaignTitle || 'General Trust Appeal'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        ₹{Number(d.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {d.paymentMethod || 'Online'} • {d.transactionReference ? d.transactionReference.slice(0, 12) : (d.id ? d.id.slice(0, 8) : 'TXN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.paymentStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{d.paymentStatus === 'verified' ? '80G Ready' : d.paymentStatus}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenReceipt(d)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>80G Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-SECTION 3: VOLUNTEER IMPACT & SERVICE RECORDS */}
      {/* ===================================================================== */}
      {activeSubSection === 'volunteer' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-purple-600" />
                <span>Volunteer Impact & Community Missions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official log of service hours, community welfare drives, assignments, and leadership certificates.
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Hours Served</span>
              <div className="text-lg font-black text-purple-700">{totalVolunteerHours} Hours</div>
            </div>
          </div>

          {volunteerLogs.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <HeartHandshake className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-xs text-slate-600">No volunteer service hours logged yet.</p>
              <p className="text-[11px]">Log your service hours through the Volunteer Dashboard to earn official recognition certificates.</p>
              {onOpenTab && (
                <button
                  onClick={() => onOpenTab('volunteer')}
                  className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Open Volunteer Portal</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {volunteerLogs.map(log => (
                <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{log.activityTitle || 'Community Mission'}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {log.hoursServed} Hours
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{log.description || 'Community assistance service'}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{log.date}</span>
                      </span>
                      {log.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{log.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 shrink-0">
                    {log.status === 'approved' ? 'Verified' : 'Submitted'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-SECTION 4: COMPETITIONS, EXAMS & CERTIFICATES */}
      {/* ===================================================================== */}
      {activeSubSection === 'competitions' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Academic Competitions, Examinations & Certificates</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official record of your enrollments, question paper attempts, scores, and issued certificates.
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Certificates</span>
              <div className="text-lg font-black text-blue-700">{certificates.length} Issued</div>
            </div>
          </div>

          {/* Certificates Showcase */}
          {certificates.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Issued Certificates of Excellence & Merit
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {certificates.map(cert => (
                  <div key={cert.id} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-amber-950">{cert.competitionTitle || 'Academic Excellence'}</div>
                      <div className="text-[11px] text-amber-800 font-medium">{cert.achievementTitle || 'Certificate of Merit'}</div>
                      <div className="text-[10px] text-amber-700 font-mono">ID: {cert.certificateId || (cert.id ? cert.id.slice(0, 8) : 'CERT')}</div>
                    </div>
                    <button
                      onClick={() => setSelectedCertificate(cert)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registrations & Exam Attempts Table */}
          {competitionRegs.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <Award className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-xs text-slate-600">No competition or exam registrations found.</p>
              <p className="text-[11px]">Enroll in state-wide and national academic tests to test your mastery.</p>
              {onExploreCompetitions && (
                <button
                  onClick={onExploreCompetitions}
                  className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>Browse Competitions</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Exam / Competition</th>
                    <th className="py-3 px-4">Roll / Candidate ID</th>
                    <th className="py-3 px-4">Date Enrolled</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Score / Merit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {competitionRegs.map(reg => {
                    const comp = competitions.find(c => c.id === reg.competitionId);
                    return (
                      <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 max-w-[200px] truncate" title={comp?.title}>
                          {comp?.title || reg.competitionId}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {(reg as any).rollNumber || reg.participantId || (reg.id ? reg.id.slice(0, 10).toUpperCase() : 'CANDIDATE')}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Enrolled'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            reg.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {reg.status === 'completed' ? 'Exam Completed' : 'Admit Card Ready'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {reg.isResultPublished && reg.marksObtained !== undefined ? (
                            <span className="font-mono text-emerald-700 font-bold">
                              {reg.marksObtained} / {reg.totalMarks || 100}
                              {reg.rank ? ` • Rank #${reg.rank}` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Evaluation Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-SECTION 5: MEMBERSHIP IMPACT & TRUST STANDING */}
      {/* ===================================================================== */}
      {activeSubSection === 'membership' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Trust Membership & Standing Record</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official credentialing under Fatimyah Educational Trust governance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Membership Details Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Primary Identity & Standing
              </span>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Official Membership ID:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {userProfile?.membershipId || 'Not yet issued'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Membership Tier:</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {userProfile?.membershipStatus === 'core_member' ? 'Core Member' : (userProfile?.membershipStatus === 'general_member' ? 'General Member' : 'Supporter')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700 capitalize">
                    {userProfile?.accountStatus || userProfile?.status || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Account Verified:</span>
                  <span className="font-bold text-slate-900">
                    {currentUser?.emailVerified ? 'Yes (Email Verified)' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Applications History */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Formal Applications Intake
              </span>

              {membershipApps.length === 0 && !volunteerApp && donorApps.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No formal intake applications submitted yet.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {membershipApps.map(m => (
                    <div key={m.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">Membership KYC Application</div>
                        <div className="text-[10px] text-slate-500 font-mono">Ref: {m.id.slice(0, 8)}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {m.status || 'Approved'}
                      </span>
                    </div>
                  ))}
                  {volunteerApp && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">Volunteer Corps Application</div>
                        <div className="text-[10px] text-slate-500 font-mono">Ref: {volunteerApp.id.slice(0, 8)}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {volunteerApp.status || 'Active'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-SECTION 6: CHRONOLOGICAL ACTIVITY TIMELINE */}
      {/* ===================================================================== */}
      {activeSubSection === 'timeline' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Personal Chronological Impact Timeline</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every verified interaction, donation, volunteer hour, exam result, and credential timestamped in sequence.
            </p>
          </div>

          {timelineEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-xs text-slate-600">No chronological timeline entries yet.</p>
              <p className="text-[11px]">As you interact with FET India initiatives, events will automatically be recorded here.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineEvents.map((evt, idx) => (
                <div key={evt.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-indigo-600 group-hover:scale-125 transition-transform" />

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-slate-900">
                        {evt.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${evt.badgeColor}`}>
                        {evt.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{evt.subtitle}</p>

                    <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{evt.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 80G Receipt Modal */}
      {selectedReceipt && (
        <PrintableDonationReceiptModal
          receipt={selectedReceipt}
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Certificate Modal */}
      {selectedCertificate && (
        <DigitalCertificateModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

    </div>
  );
};
