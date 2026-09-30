/**
 * @license
 * Admin Membership Applications Review Pipeline
 * Fatimyah Educational Trust India (FET India)
 * Module: Super Admin Membership Intake & Accreditation Pipeline
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Eye, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Award, 
  Send, 
  RefreshCw,
  X,
  MessageSquare,
  Check,
  Briefcase,
  Vote,
  Sparkles,
  Info,
  CheckSquare,
  Plus,
  HeartHandshake,
  BadgeDollarSign
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, adminReviewMembershipApplication } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { MembershipApplication, MembershipApplicationStatus } from '../../types';
import { MembershipApplicationForm } from '../dashboard/MembershipApplicationForm';

export const getApplicationTypeLabel = (app: Partial<MembershipApplication> & Record<string, any>): string => {
  const raw = app.membershipType || app.requestedTier || app.tier || (app as any).applicationType;
  if (!raw) return 'General Member';
  const str = String(raw).toLowerCase().replace(/[\s_-]+/g, '');
  if (str.includes('life')) return 'Life Member';
  if (str.includes('core')) return 'Core Member';
  if (str.includes('volunteer')) return 'Volunteer';
  if (str.includes('donor') || str.includes('patron')) return 'Donor';
  if (str.includes('general')) return 'General Member';
  return String(raw).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const renderApplicationTypeBadge = (app: Partial<MembershipApplication> & Record<string, any>) => {
  const typeLabel = getApplicationTypeLabel(app);
  let colorCls = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let IconComponent = User;
  if (typeLabel === 'Life Member') {
    colorCls = 'bg-amber-100 text-amber-900 border-amber-300';
    IconComponent = Award;
  } else if (typeLabel === 'Core Member') {
    colorCls = 'bg-purple-100 text-purple-900 border-purple-300';
    IconComponent = ShieldCheck;
  } else if (typeLabel === 'Volunteer') {
    colorCls = 'bg-teal-100 text-teal-900 border-teal-300';
    IconComponent = HeartHandshake;
  } else if (typeLabel === 'Donor') {
    colorCls = 'bg-sky-100 text-sky-900 border-sky-300';
    IconComponent = BadgeDollarSign;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${colorCls}`}>
      <IconComponent className="w-3 h-3" />
      <span>{typeLabel}</span>
    </span>
  );
};

export const AdminMembershipApplicationsView: React.FC = () => {
  const { currentUser, userProfile, activeRole } = useAuth();

  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | MembershipApplicationStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'general' | 'life' | 'core' | 'volunteer' | 'donor'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState<boolean>(false);
  
  // Review Action Modal State
  const [reviewAction, setReviewAction] = useState<MembershipApplicationStatus | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isProcessingReview, setIsProcessingReview] = useState<boolean>(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscribe to all membership applications in real-time (both canonical and legacy intake collections)
  useEffect(() => {
    setIsLoading(true);

    let canonicalItems: MembershipApplication[] = [];
    let legacyItems: MembershipApplication[] = [];

    const mergeAndSet = () => {
      const seenIds = new Set<string>();
      const combined: MembershipApplication[] = [];

      canonicalItems.forEach((doc) => {
        if (doc.id && !seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          combined.push(doc);
        }
      });

      legacyItems.forEach((doc) => {
        if (doc.id && !seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          combined.push(doc);
        }
      });

      // Sort by createdAt descending
      combined.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setApplications(combined);
      setIsLoading(false);
    };

    const unsubscribeCanonical = onSnapshot(
      collection(db, 'membershipApplications'),
      (snapshot) => {
        const list: MembershipApplication[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as MembershipApplication);
        });
        canonicalItems = list;
        mergeAndSet();
      },
      (err) => {
        console.warn('Membership applications query notice:', err);
        setIsLoading(false);
      }
    );

    // Also listen to legacy member_applications to ensure zero lost applications
    let unsubscribeLegacy = () => {};
    try {
      unsubscribeLegacy = onSnapshot(
        collection(db, 'member_applications'),
        (snapshot) => {
          const list: MembershipApplication[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const rawStatus = String(data.status || 'pending').toLowerCase();
            const mappedStatus: MembershipApplicationStatus =
              rawStatus.includes('app') ? 'approved' :
              rawStatus.includes('rej') ? 'rejected' :
              rawStatus.includes('review') ? 'under_review' : 'pending';

            list.push({
              id: doc.id,
              applicantUid: data.userId || data.applicantUid || doc.id,
              applicantEmail: data.email || data.applicantEmail || 'applicant@fetindia.org',
              fullLegalName: data.fullName || data.fullLegalName || 'Applicant',
              guardianName: data.guardianName,
              mobileNumber: data.phone || data.mobileNumber || '',
              country: 'India',
              state: data.stateName || data.state || 'Jammu & Kashmir',
              district: data.city || data.district || '',
              fullAddress: data.fullAddress || `${data.city || ''}, ${data.stateName || ''}`.trim() || 'Address on file',
              occupation: data.profession || data.occupation || '',
              membershipType: data.tier === 'Life Member' ? 'life_member' : 'general_member',
              requestedTier: data.tier === 'Life Member' ? 'life_member' : 'general_member',
              tier: data.tier || 'General Member',
              reasonForJoining: data.statement || data.reasonForJoining || '',
              declarationAccepted: true,
              termsAccepted: true,
              status: mappedStatus,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
            } as MembershipApplication);
          });
          legacyItems = list;
          mergeAndSet();
        },
        (err) => {
          console.warn('Legacy member_applications query notice:', err);
        }
      );
    } catch {
      // Ignored if collection not present
    }

    return () => {
      unsubscribeCanonical();
      unsubscribeLegacy();
    };
  }, []);

  const notify = (type: 'success' | 'error', text: string) => {
    setNoticeMessage({ type, text });
    setTimeout(() => setNoticeMessage(null), 6000);
  };

  // Direct 1-Click Quick Approve Handler
  const handleQuickApprove = async (app: MembershipApplication) => {
    if (!app.id) {
      notify('error', 'Cannot approve: Application document identifier is missing.');
      return;
    }
    if (!currentUser) {
      notify('error', 'Authentication session expired. Please sign in as Super Admin to continue.');
      return;
    }

    setProcessingAppId(app.id);
    try {
      const adminRole = activeRole || userProfile?.primaryRole || 'super_admin';
      const adminUser = {
        uid: currentUser.uid,
        email: currentUser.email || userProfile?.email || 'fetkofficial@gmail.com',
        role: adminRole as any
      };

      const now = new Date().toISOString();

      await adminReviewMembershipApplication(
        app.id,
        app.applicantUid,
        'approved',
        app.reviewNotes || 'Approved by Trust Administration',
        adminUser
      );

      // Optimistic local state synchronization
      setApplications(prev => prev.map(item => item.id === app.id ? {
        ...item,
        status: 'approved',
        approvedBy: currentUser.uid,
        reviewedByUid: currentUser.uid,
        reviewedByEmail: adminUser.email,
        reviewedAt: now,
        updatedAt: now
      } : item));

      if (selectedApp && selectedApp.id === app.id) {
        setSelectedApp(prev => prev ? {
          ...prev,
          status: 'approved',
          approvedBy: currentUser.uid,
          reviewedByUid: currentUser.uid,
          reviewedByEmail: adminUser.email,
          reviewedAt: now,
          updatedAt: now
        } : null);
      }

      const typeLabel = getApplicationTypeLabel(app);
      notify('success', `${typeLabel} approved for ${app.fullLegalName}. Membership activated.`);
    } catch (err: any) {
      console.error('Quick approve error:', err);
      notify('error', err?.message || 'Failed to approve application.');
    } finally {
      setProcessingAppId(null);
    }
  };

  // Submit Detailed Modal Review
  const handleSubmitReview = async () => {
    if (!selectedApp || !selectedApp.id || !reviewAction) return;
    if (!currentUser) return;

    setIsProcessingReview(true);
    try {
      const adminRole = activeRole || userProfile?.primaryRole || 'super_admin';
      const adminUser = {
        uid: currentUser.uid,
        email: currentUser.email || userProfile?.email || 'fetkofficial@gmail.com',
        role: adminRole as any
      };

      const now = new Date().toISOString();

      await adminReviewMembershipApplication(
        selectedApp.id,
        selectedApp.applicantUid,
        reviewAction,
        reviewNotes,
        adminUser
      );

      // Synchronize state
      setApplications(prev => prev.map(item => item.id === selectedApp.id ? {
        ...item,
        status: reviewAction,
        reviewNotes,
        rejectionReason: reviewAction === 'rejected' ? (reviewNotes || 'Application rejected') : undefined,
        approvedBy: reviewAction === 'approved' ? currentUser.uid : undefined,
        reviewedByUid: currentUser.uid,
        reviewedByEmail: adminUser.email,
        reviewedAt: now,
        updatedAt: now
      } : item));

      setSelectedApp(prev => prev ? {
        ...prev,
        status: reviewAction,
        reviewNotes,
        rejectionReason: reviewAction === 'rejected' ? (reviewNotes || 'Application rejected') : undefined,
        approvedBy: reviewAction === 'approved' ? currentUser.uid : undefined,
        reviewedByUid: currentUser.uid,
        reviewedByEmail: adminUser.email,
        reviewedAt: now,
        updatedAt: now
      } : null);

      notify('success', `Application status updated to: ${reviewAction.toUpperCase()}`);
      setReviewAction(null);
      setReviewNotes('');
    } catch (err: any) {
      console.error('Review submit error:', err);
      notify('error', err?.message || 'Failed to record determination.');
    } finally {
      setIsProcessingReview(false);
    }
  };

  // Filter & Search Logic
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // 1. Status Filter
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      if (!matchesStatus) return false;

      // 2. Application Type Filter
      const appType = getApplicationTypeLabel(app);
      if (typeFilter !== 'all') {
        if (typeFilter === 'general' && appType !== 'General Member') return false;
        if (typeFilter === 'life' && appType !== 'Life Member') return false;
        if (typeFilter === 'core' && appType !== 'Core Member') return false;
        if (typeFilter === 'volunteer' && appType !== 'Volunteer') return false;
        if (typeFilter === 'donor' && appType !== 'Donor') return false;
      }

      // 3. Search Matching
      const queryStr = searchQuery.toLowerCase().trim();
      if (!queryStr) return true;

      const fullLegalName = (app.fullLegalName || (app as any).fullName || '').toLowerCase();
      const email = (app.applicantEmail || (app as any).email || '').toLowerCase();
      const mobile = (app.mobileNumber || (app as any).phone || '').toLowerCase();
      const district = (app.district || (app as any).city || '').toLowerCase();
      const state = (app.state || (app as any).stateName || '').toLowerCase();
      const occupation = (app.occupation || (app as any).profession || '').toLowerCase();
      const qual = (app.qualification || app.educationalQualification || '').toLowerCase();
      const typeStr = appType.toLowerCase();
      const reason = (app.reasonForJoining || (app as any).statement || '').toLowerCase();
      const appNo = ((app as any).applicationNumber || app.id || '').toLowerCase();

      return (
        fullLegalName.includes(queryStr) ||
        email.includes(queryStr) ||
        mobile.includes(queryStr) ||
        district.includes(queryStr) ||
        state.includes(queryStr) ||
        occupation.includes(queryStr) ||
        qual.includes(queryStr) ||
        typeStr.includes(queryStr) ||
        reason.includes(queryStr) ||
        appNo.includes(queryStr)
      );
    });
  }, [applications, statusFilter, typeFilter, searchQuery]);

  // Metrics Count
  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  const renderStatusBadge = (status: MembershipApplicationStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-300">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="admin-membership-applications-pipeline">
      
      {/* Alert Notification */}
      {noticeMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs ${
          noticeMessage.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {noticeMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{noticeMessage.text}</span>
          </div>
          <button 
            onClick={() => setNoticeMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Metric Cards */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CreditCard className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Member Applications / Pending Applications
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Centralized intake queue and approval pipeline across General Member, Life Member, Core Member, Volunteer, and Donor applications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Total Queue: {applications.length}
            </span>

            <button
              onClick={() => setShowIntakeModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              id="admin-member-intake-btn"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Member Application Intake</span>
            </button>
          </div>
        </div>

        {/* Filter Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block opacity-70">All Inbound</span>
            <div className="text-lg font-black mt-0.5">{counts.all}</div>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                : 'bg-sky-50/60 hover:bg-sky-100 text-sky-900 border-sky-200'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block opacity-70">Pending Review</span>
            <div className="text-lg font-black mt-0.5">{counts.pending}</div>
          </button>

          <button
            onClick={() => setStatusFilter('under_review')}
            className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
              statusFilter === 'under_review'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/60 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block opacity-70">Under Review</span>
            <div className="text-lg font-black mt-0.5">{counts.under_review}</div>
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block opacity-70">Approved Members</span>
            <div className="text-lg font-black mt-0.5">{counts.approved}</div>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                : 'bg-rose-50/60 hover:bg-rose-100 text-rose-900 border-rose-200'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block opacity-70">Rejected</span>
            <div className="text-lg font-black mt-0.5">{counts.rejected}</div>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, mobile, district, state, type, occupation, qualification, remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Application Type Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Type:
            </span>
            {[
              { id: 'all', label: 'All Types' },
              { id: 'general', label: 'General Member' },
              { id: 'life', label: 'Life Member' },
              { id: 'core', label: 'Core Member' },
              { id: 'volunteer', label: 'Volunteer' },
              { id: 'donor', label: 'Donor' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  typeFilter === t.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing <strong className="text-slate-800">{filteredApplications.length}</strong> of <strong className="text-slate-800">{applications.length}</strong> canonical application records</span>
          {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="text-emerald-700 hover:underline font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Applications Table */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading live membership intake stream...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">No applications match your filter criteria</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search terms or filters.'
              : 'No applications submitted yet. Click "Member Application Intake" to submit an application.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Application Type</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Occupation / Education</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{app.fullLegalName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{app.applicantEmail}</span>
                      </div>
                      {app.mobileNumber && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{app.mobileNumber}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {renderApplicationTypeBadge(app)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{app.district || 'National'}</div>
                      <div className="text-[11px] text-slate-400">{app.state || 'India'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium">{app.occupation || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">{app.qualification || app.educationalQualification || 'N/A'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4">
                      {renderStatusBadge(app.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setReviewAction(app.status);
                            setReviewNotes(app.reviewNotes || app.rejectionReason || '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="View & Review Application"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>

                        {app.status !== 'approved' && (
                          <button
                            onClick={() => handleQuickApprove(app)}
                            disabled={processingAppId === app.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                            title="Quick 1-Click Approve"
                          >
                            {processingAppId === app.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-amber-300" />
                            )}
                            <span>Approve</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Member Application Intake Modal */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowIntakeModal(false)}
              className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <MembershipApplicationForm
              onClose={() => setShowIntakeModal(false)}
              onSuccess={(msg) => {
                setShowIntakeModal(false);
                notify('success', msg || 'Application submitted successfully to canonical repository.');
              }}
            />
          </div>
        </div>
      )}

      {/* Scrutiny / Review Detail Modal with all fields */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CreditCard className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{selectedApp.fullLegalName}</h3>
                    <p className="text-xs text-slate-500">
                      Application Scrutiny & Accreditation Pipeline
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-slate-500">Current Intake State:</span>
              <div>{renderStatusBadge(selectedApp.status)}</div>
            </div>

            {/* Complete Fields Particulars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Application Type / Tier</span>
                <div className="mt-1">
                  {renderApplicationTypeBadge(selectedApp)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Applicant Email</span>
                <div className="font-bold text-slate-900 mt-0.5 truncate">{selectedApp.applicantEmail}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Mobile Number</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedApp.mobileNumber || 'N/A'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Location (District & State)</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedApp.district || 'N/A'}, {selectedApp.state || 'India'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Date of Birth & Gender</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {selectedApp.dateOfBirth || 'N/A'} • {selectedApp.gender || 'N/A'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Educational Qualification</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedApp.qualification || selectedApp.educationalQualification || 'N/A'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Occupation / Profession</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedApp.occupation || 'N/A'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Country</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedApp.country || 'India'}</div>
              </div>

              {selectedApp.fullAddress && (
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Full Residential Address</span>
                  <div className="font-medium text-slate-800 mt-0.5">{selectedApp.fullAddress}</div>
                </div>
              )}

              {selectedApp.areasOfInterest && selectedApp.areasOfInterest.length > 0 && (
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Areas of Interest</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.areasOfInterest.map((area, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedApp.reasonForJoining || selectedApp.motivationStatement) && (
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Reason for Joining / Statement</span>
                  <div className="font-medium text-slate-800 mt-0.5 leading-relaxed">
                    {selectedApp.reasonForJoining || selectedApp.motivationStatement}
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>Declaration Accepted</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>Terms & Conditions Agreed</span>
                </div>
              </div>

              {selectedApp.reviewedByEmail && (
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200 text-slate-600">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Prior Administrative Scrutiny Record</span>
                  <div>Reviewed by: <strong className="text-slate-800">{selectedApp.reviewedByEmail}</strong> (UID: {selectedApp.reviewedByUid || selectedApp.approvedBy || 'N/A'})</div>
                  {selectedApp.reviewedAt && (
                    <div className="text-[11px] text-slate-500 mt-0.5">Recorded: {new Date(selectedApp.reviewedAt).toLocaleString('en-IN')}</div>
                  )}
                </div>
              )}
            </div>

            {/* Review Decision Controls */}
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Administrative Determination & Action
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewAction('approved')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    reviewAction === 'approved'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction('under_review')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    reviewAction === 'under_review'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-amber-50/60 hover:bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Under Review</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction('rejected')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    reviewAction === 'rejected'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                      : 'bg-rose-50/60 hover:bg-rose-100 text-rose-900 border-rose-200'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction('pending')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    reviewAction === 'pending'
                      ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                      : 'bg-sky-50/60 hover:bg-sky-100 text-sky-900 border-sky-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Set Pending</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Secretariat Review Notes / Rejection Reason:
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter remarks, scrutiny observations, or reasons for decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={!reviewAction || isProcessingReview}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isProcessingReview ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Recording Decision...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-amber-300" />
                      <span>Save Determination</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

