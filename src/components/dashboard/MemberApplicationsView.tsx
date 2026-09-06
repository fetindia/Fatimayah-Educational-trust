/**
 * @license
 * Member Applications View (Live Pipelines & Future Intake Applications)
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter, 
  Search, 
  Calendar, 
  ChevronRight, 
  Info,
  Layers,
  GraduationCap,
  HeartHandshake,
  UserCheck,
  Building,
  ArrowUpRight,
  PlusCircle,
  Eye,
  Edit3,
  Sparkles,
  BadgeDollarSign
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { VolunteerApplication, DonorApplication, MembershipApplication } from '../../types';
import { VolunteerApplicationForm } from './VolunteerApplicationForm';
import { DonorApplicationForm } from './DonorApplicationForm';
import { MembershipApplicationForm } from './MembershipApplicationForm';

export type ApplicationStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

export interface MemberApplication {
  id: string;
  category: 'Educational Grant' | 'Volunteer Service' | 'Donor Patronage' | 'Trust Membership KYC' | 'Welfare Assistance';
  title: string;
  submissionDate: string;
  lastUpdated: string;
  status: ApplicationStatus;
  reviewStage: string;
  remarks?: string;
  academicYear?: string;
  referenceNo: string;
  isLiveVolunteer?: boolean;
  isLiveDonor?: boolean;
  isLiveMembership?: boolean;
}

interface MemberApplicationsViewProps {
  onNotify?: (message: string) => void;
  onOpenTab?: (tab: string) => void;
  onOpenVolunteerForm?: () => void;
  onOpenDonorForm?: () => void;
}

const INITIAL_STATIC_APPLICATIONS: MemberApplication[] = [
  {
    id: 'APP-SCH-2026-0891',
    referenceNo: 'FET/EDU/2026/0891',
    category: 'Educational Grant',
    title: 'Merit-cum-Need Higher Education Scholarship 2026-27',
    submissionDate: 'August 12, 2026',
    lastUpdated: 'August 20, 2026',
    status: 'Under Review',
    reviewStage: 'Stage 2: Academic Document & Income Scrutiny',
    academicYear: '2026-2027',
    remarks: 'Application under active evaluation by the Central Academic Review Committee. Scrutiny of marks memo and college fees structure is in progress.'
  },
  {
    id: 'APP-KYC-2026-0104',
    referenceNo: 'FET/MBR/2026/0104',
    category: 'Trust Membership KYC',
    title: 'General Member Digital Identity & Address Verification',
    submissionDate: 'July 15, 2026',
    lastUpdated: 'July 18, 2026',
    status: 'Approved',
    reviewStage: 'Verified & Certified',
    remarks: 'Digital identity and address proof verified by Secretariat. Digital Membership Card issued.'
  }
];

export const MemberApplicationsView: React.FC<MemberApplicationsViewProps> = ({ 
  onNotify,
  onOpenTab,
  onOpenVolunteerForm,
  onOpenDonorForm
}) => {
  const { currentUser } = useAuth();
  const [liveVolunteerApp, setLiveVolunteerApp] = useState<VolunteerApplication | null>(null);
  const [liveDonorApp, setLiveDonorApp] = useState<DonorApplication | null>(null);
  const [liveMembershipApp, setLiveMembershipApp] = useState<MembershipApplication | null>(null);
  const [showVolunteerModal, setShowVolunteerModal] = useState<boolean>(false);
  const [showDonorModal, setShowDonorModal] = useState<boolean>(false);
  const [showMembershipModal, setShowMembershipModal] = useState<boolean>(false);
  
  const [statusFilter, setStatusFilter] = useState<'All' | ApplicationStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Subscribe to live volunteer applications
  useEffect(() => {
    if (!currentUser) return;

    const qVol = query(
      collection(db, 'volunteerApplications'),
      where('applicantUid', '==', currentUser.uid)
    );

    const unsubVol = onSnapshot(
      qVol,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setLiveVolunteerApp({ id: docSnap.id, ...docSnap.data() } as VolunteerApplication);
        } else {
          setLiveVolunteerApp(null);
        }
      },
      (err) => console.warn('Volunteer listener error:', err)
    );

    return () => unsubVol();
  }, [currentUser]);

  // 2. Subscribe to live donor applications
  useEffect(() => {
    if (!currentUser) return;

    const qDonor = query(
      collection(db, 'donorApplications'),
      where('applicantUid', '==', currentUser.uid)
    );

    const unsubDonor = onSnapshot(
      qDonor,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setLiveDonorApp({ id: docSnap.id, ...docSnap.data() } as DonorApplication);
        } else {
          setLiveDonorApp(null);
        }
      },
      (err) => console.warn('Donor listener error:', err)
    );

    return () => unsubDonor();
  }, [currentUser]);

  // 3. Subscribe to live membership applications
  useEffect(() => {
    if (!currentUser) return;

    const qMbr = query(
      collection(db, 'membershipApplications'),
      where('applicantUid', '==', currentUser.uid)
    );

    const unsubMbr = onSnapshot(
      qMbr,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setLiveMembershipApp({ id: docSnap.id, ...docSnap.data() } as MembershipApplication);
        } else {
          setLiveMembershipApp(null);
        }
      },
      (err) => console.warn('Membership listener error:', err)
    );

    return () => unsubMbr();
  }, [currentUser]);

  // Build full combined list
  const combinedApplications: MemberApplication[] = [];

  if (liveMembershipApp) {
    let mappedStatus: ApplicationStatus = 'Pending';
    let reviewStage = 'Stage 1: Awaiting Secretariat KYC Verification';
    if (liveMembershipApp.status === 'under_review') {
      mappedStatus = 'Under Review';
      reviewStage = 'Stage 2: Trustee Scrutiny & ID Generation';
    } else if (liveMembershipApp.status === 'approved') {
      mappedStatus = 'Approved';
      reviewStage = 'Stage 3: General Membership Accredited';
    } else if (liveMembershipApp.status === 'rejected') {
      mappedStatus = 'Rejected';
      reviewStage = 'Decision: Re-application Requested';
    }

    combinedApplications.push({
      id: liveMembershipApp.id || 'MBR-LIVE',
      referenceNo: `FET/MBR/${(liveMembershipApp.id || 'NEW').slice(0, 6).toUpperCase()}`,
      category: 'Trust Membership KYC',
      title: `General Membership Accreditation (${liveMembershipApp.district || 'National'})`,
      submissionDate: new Date(liveMembershipApp.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      lastUpdated: new Date(liveMembershipApp.updatedAt || liveMembershipApp.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: mappedStatus,
      reviewStage,
      remarks: liveMembershipApp.reviewNotes || (mappedStatus === 'Pending' ? 'Your General Membership application is queued for Super Admin review and Digital ID issuance.' : undefined),
      isLiveMembership: true
    });
  }

  if (liveVolunteerApp) {
    let mappedStatus: ApplicationStatus = 'Pending';
    let reviewStage = 'Stage 1: Awaiting Secretariat Scrutiny';
    if (liveVolunteerApp.status === 'under_review') {
      mappedStatus = 'Under Review';
      reviewStage = 'Stage 2: Chapter Coordinator Evaluation';
    } else if (liveVolunteerApp.status === 'approved') {
      mappedStatus = 'Approved';
      reviewStage = 'Stage 3: Certified Active Volunteer';
    } else if (liveVolunteerApp.status === 'rejected') {
      mappedStatus = 'Rejected';
      reviewStage = 'Decision: Application Unsuccessful';
    }

    combinedApplications.push({
      id: liveVolunteerApp.id || 'VOL-LIVE',
      referenceNo: liveVolunteerApp.volunteerIdAssigned || `FET/VOL/${(liveVolunteerApp.id || 'NEW').slice(0, 6).toUpperCase()}`,
      category: 'Volunteer Service',
      title: `Volunteer Corps Service (${liveVolunteerApp.preferredLocation || liveVolunteerApp.district || 'National Chapter'})`,
      submissionDate: new Date(liveVolunteerApp.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      lastUpdated: new Date(liveVolunteerApp.updatedAt || liveVolunteerApp.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: mappedStatus,
      reviewStage,
      remarks: liveVolunteerApp.reviewNotes || (mappedStatus === 'Pending' ? 'Your volunteer application has been submitted to the Super Admin review queue.' : undefined),
      isLiveVolunteer: true
    });
  }

  if (liveDonorApp) {
    let mappedStatus: ApplicationStatus = 'Pending';
    let reviewStage = 'Stage 1: Inbound Patron Verification';
    if (liveDonorApp.status === 'under_review') {
      mappedStatus = 'Under Review';
      reviewStage = 'Stage 2: Central Finance & Trustee Review';
    } else if (liveDonorApp.status === 'approved') {
      mappedStatus = 'Approved';
      reviewStage = 'Stage 3: Certified Active Patron & 80G Verified';
    } else if (liveDonorApp.status === 'rejected') {
      mappedStatus = 'Rejected';
      reviewStage = 'Decision: Filing Revisions Requested';
    }

    combinedApplications.push({
      id: liveDonorApp.id || 'DNR-LIVE',
      referenceNo: `FET/DNR/${(liveDonorApp.id || 'NEW').slice(0, 6).toUpperCase()}`,
      category: 'Donor Patronage',
      title: `Patron & Donor Enrollment (${liveDonorApp.donorType === 'organization' ? (liveDonorApp.organizationName || 'Corporate') : 'Individual'})`,
      submissionDate: new Date(liveDonorApp.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      lastUpdated: new Date(liveDonorApp.updatedAt || liveDonorApp.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: mappedStatus,
      reviewStage,
      remarks: liveDonorApp.reviewNotes || (mappedStatus === 'Pending' ? 'Your donor application is queued for Super Admin review and role accreditation.' : undefined),
      isLiveDonor: true
    });
  }

  // Append initial static applications
  combinedApplications.push(...INITIAL_STATIC_APPLICATIONS);

  const filteredApps = combinedApplications.filter((app) => {
    const matchesFilter = statusFilter === 'All' || app.status === statusFilter;
    const matchesSearch = 
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Pending</span>
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            <span>Under Review</span>
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Approved</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>Rejected</span>
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Educational Grant':
        return <GraduationCap className="w-5 h-5 text-emerald-700" />;
      case 'Volunteer Service':
        return <HeartHandshake className="w-5 h-5 text-blue-700" />;
      case 'Donor Patronage':
        return <BadgeDollarSign className="w-5 h-5 text-amber-600" />;
      case 'Trust Membership KYC':
        return <UserCheck className="w-5 h-5 text-purple-700" />;
      default:
        return <FileText className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <div className="space-y-6" id="member-applications-section">
      
      {/* Header & Application Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                My Applications & Submissions
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Track real-time status, committee remarks, and verification decisions across all trust intake programs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Total Applications:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-900 text-white">
              {combinedApplications.length}
            </span>
          </div>
        </div>

        {/* Action Banners Grid: Volunteer & Donor Enrollment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Volunteer Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white flex flex-col justify-between gap-4 shadow-sm border border-emerald-900">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Volunteer Corps
                </span>
                {liveVolunteerApp && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300">
                    Application on File
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-white">
                Community Volunteer Corps
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {liveVolunteerApp 
                  ? `Status: ${liveVolunteerApp.status.toUpperCase()} (${liveVolunteerApp.preferredLocation || 'National Chapter'})`
                  : 'Serve the community in education camps, medical relief, and youth mentorship.'}
              </p>
            </div>

            <button
              onClick={() => {
                if (onOpenVolunteerForm) {
                  onOpenVolunteerForm();
                } else {
                  setShowVolunteerModal(true);
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 self-start"
              id="btn-open-volunteer-modal"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>{liveVolunteerApp ? 'Track Volunteer Application' : 'Become a Volunteer →'}</span>
            </button>
          </div>

          {/* Donor Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-amber-950 text-white flex flex-col justify-between gap-4 shadow-sm border border-amber-900/50">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Patron & Donor Network
                </span>
                {liveDonorApp && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400/20 text-emerald-300">
                    Registered Patron
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-white">
                Become a FET India Donor
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {liveDonorApp 
                  ? `Status: ${liveDonorApp.status.toUpperCase()} (${liveDonorApp.donorType === 'organization' ? 'Corporate / Trust' : 'Individual'})`
                  : 'Support higher education scholarships and 80G tax-exempt charitable welfare programs.'}
              </p>
            </div>

            <button
              onClick={() => {
                if (onOpenDonorForm) {
                  onOpenDonorForm();
                } else {
                  setShowDonorModal(true);
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 self-start"
              id="btn-open-donor-modal"
            >
              <BadgeDollarSign className="w-4 h-4" />
              <span>{liveDonorApp ? 'Track Donor Application' : 'Become a Donor →'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Volunteer Modal Fallback */}
      {showVolunteerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full my-8">
            <VolunteerApplicationForm 
              onClose={() => setShowVolunteerModal(false)}
              onSuccess={(msg) => {
                if (onNotify) onNotify(msg);
                setShowVolunteerModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Donor Modal Fallback */}
      {showDonorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full my-8">
            <DonorApplicationForm 
              onClose={() => setShowDonorModal(false)}
              onSuccess={(msg) => {
                if (onNotify) onNotify(msg);
                setShowDonorModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Status Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
          {(['All', 'Pending', 'Under Review', 'Approved', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
              {st !== 'All' && (
                <span className="ml-1.5 opacity-80 text-[10px]">
                  ({combinedApplications.filter(a => a.status === st).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, ref no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-3.5">
        {filteredApps.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-700">No applications match your filter</h4>
              <p className="text-xs text-slate-400">Try changing your search query or selecting a different status filter.</p>
            </div>
            <button
              onClick={() => { setStatusFilter('All'); setSearchQuery(''); }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              className={`p-5 sm:p-6 bg-white border rounded-3xl transition-all shadow-xs space-y-4 ${
                app.isLiveVolunteer ? 'border-emerald-300 ring-1 ring-emerald-500/20' : 
                app.isLiveDonor ? 'border-amber-300 ring-1 ring-amber-500/20' :
                'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
                    {getCategoryIcon(app.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {app.category}
                      </span>
                      {(app.isLiveVolunteer || app.isLiveDonor) && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          app.isLiveVolunteer ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                        }`}>
                          Live Record
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      {app.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {getStatusBadge(app.status)}
                </div>
              </div>

              {/* Details & Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Reference No:</span>
                  <div className="font-mono font-bold text-slate-800">{app.referenceNo}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Submission Date:</span>
                  <div className="font-semibold text-slate-700">{app.submissionDate}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Current Stage:</span>
                  <div className="font-bold text-slate-900">{app.reviewStage}</div>
                </div>
              </div>

              {/* Official Reviewer Remarks */}
              {app.remarks && (
                <div className="text-xs p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[11px] text-amber-900">Review Notes:</span>
                    <p className="text-[11px] text-amber-900/90 mt-0.5 leading-relaxed">
                      {app.remarks}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions & Lifecycle Pipeline */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold text-center flex-1 max-w-lg">
                  <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200">
                    1. Submitted
                  </div>
                  <div className={`p-1.5 rounded-xl border ${
                    app.status === 'Under Review' 
                      ? 'bg-blue-100 text-blue-900 border-blue-300 ring-2 ring-blue-500/20' 
                      : app.status === 'Approved' || app.status === 'Rejected'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}>
                    2. Scrutiny
                  </div>
                  <div className={`p-1.5 rounded-xl border ${
                    app.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                      : app.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-900 border-rose-200'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}>
                    3. Committee
                  </div>
                  <div className={`p-1.5 rounded-xl border ${
                    app.status === 'Approved'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : app.status === 'Rejected'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}>
                    4. Decision
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {app.isLiveVolunteer && (
                    <button
                      onClick={() => {
                        if (onOpenVolunteerForm) {
                          onOpenVolunteerForm();
                        } else {
                          setShowVolunteerModal(true);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Volunteer Filing</span>
                    </button>
                  )}

                  {app.isLiveDonor && (
                    <button
                      onClick={() => {
                        if (onOpenDonorForm) {
                          onOpenDonorForm();
                        } else {
                          setShowDonorModal(true);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Donor Filing</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
