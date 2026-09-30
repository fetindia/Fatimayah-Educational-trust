/**
 * @license
 * Crowdfunding Admin Review & Verification Center
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  HeartHandshake, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  PauseCircle, 
  PlayCircle, 
  Clock, 
  Eye, 
  FileText, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  IndianRupee, 
  FileCheck, 
  ExternalLink,
  MessageSquare,
  Shield,
  Building,
  Check,
  Ban,
  Plus,
  ArrowUpDown,
  FileQuestion,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  User,
  Phone,
  Mail,
  Home,
  CheckSquare,
  History,
  Lock,
  Layers,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { 
  CrowdfundingCampaign, 
  CampaignStatus, 
  CampaignDonation, 
  CampaignSupportingDocument,
  DocumentVerificationStatus,
  CampaignReviewHistoryEntry
} from '../../types';
import { 
  fetchAllCampaignsAdmin, 
  adminReviewCampaign, 
  fetchCampaignDonations, 
  verifyCampaignDonation,
  CAMPAIGN_CATEGORY_CONFIG 
} from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CreateCampaignModal } from '../campaigns/CreateCampaignModal';

export const AdminCampaignManagementView: React.FC = () => {
  const { currentUser, userProfile, isSuperAdmin } = useAuth();
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const delegatedScope = userProfile?.delegatedScopes?.find(s => s.status === 'active' && (s.module === 'crowdfunding' || s.module === 'both'));
  const isDistrictAdmin = userProfile?.roles?.some(r => ['district_admin', 'district_crowdfunding_admin'].includes(r)) || delegatedScope?.level === 'district';
  const isStateAdmin = userProfile?.roles?.some(r => ['state_admin', 'state_crowdfunding_admin'].includes(r)) || delegatedScope?.level === 'state';
  const isNationalAdmin = userProfile?.roles?.some(r => ['national_admin', 'national_crowdfunding_admin'].includes(r)) || delegatedScope?.level === 'national';
  const isDelegatedAdminUser = !isSuperAdmin && (isDistrictAdmin || isStateAdmin || isNationalAdmin);
  const canApproveCases = isSuperAdmin || delegatedScope?.canApprove === true;

  const showSuccess = (text: string) => {
    setToastMessage({ type: 'success', text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const showError = (text: string) => {
    setToastMessage({ type: 'error', text });
    setTimeout(() => setToastMessage(null), 5500);
  };

  const [campaigns, setCampaigns] = useState<CrowdfundingCampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_target' | 'lowest_target' | 'most_funded'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Review & Verification Modal State
  const [reviewCampaign, setReviewCampaign] = useState<CrowdfundingCampaign | null>(null);
  const [activeReviewTab, setActiveReviewTab] = useState<'details' | 'applicant' | 'documents' | 'media' | 'history' | 'decision'>('details');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [applicantFeedback, setApplicantFeedback] = useState<string>('');
  const [editableDocs, setEditableDocs] = useState<CampaignSupportingDocument[]>([]);
  const [actionProcessing, setActionProcessing] = useState<boolean>(false);

  // Donations Modal State
  const [donationsCampaign, setDonationsCampaign] = useState<CrowdfundingCampaign | null>(null);
  const [campaignDonations, setCampaignDonations] = useState<CampaignDonation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState<boolean>(false);

  // Create Campaign Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // Load All Admin Campaigns with Jurisdictional Isolation
  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const list = await fetchAllCampaignsAdmin(userProfile);
      setCampaigns(list);
    } catch (err) {
      console.error('Error fetching admin campaigns:', err);
      showError('Failed to load appeals database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [userProfile]);

  // Open Review Inspector Workspace
  const openReviewModal = (camp: CrowdfundingCampaign) => {
    setReviewCampaign(camp);
    setActiveReviewTab(camp.status === 'pending_review' || camp.status === 'under_review' ? 'documents' : 'details');
    setInternalNotes(camp.internalReviewNotes || camp.reviewNotes || '');
    setApplicantFeedback(camp.correctionReason || camp.rejectionReason || '');
    
    // Initialize editable document verification statuses
    const initialDocs: CampaignSupportingDocument[] = (camp.supportingDocuments || []).map(doc => ({
      ...doc,
      verificationStatus: doc.verificationStatus || 'pending',
      reviewerRemarks: doc.reviewerRemarks || ''
    }));
    setEditableDocs(initialDocs);
  };

  // Update Document Status in Inspector
  const handleDocStatusChange = (docId: string, newStatus: DocumentVerificationStatus) => {
    setEditableDocs(prev => prev.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          verificationStatus: newStatus,
          verifiedAt: new Date().toISOString(),
          verifiedByUid: currentUser?.uid || ''
        };
      }
      return d;
    }));
  };

  // Update Document Remark in Inspector
  const handleDocRemarkChange = (docId: string, remark: string) => {
    setEditableDocs(prev => prev.map(d => {
      if (d.id === docId) {
        return { ...d, reviewerRemarks: remark };
      }
      return d;
    }));
  };

  // Save Document Verification Notes without changing status
  const handleSaveDocVerificationOnly = async () => {
    if (!reviewCampaign || !currentUser) return;
    setActionProcessing(true);
    try {
      await adminReviewCampaign(reviewCampaign.id || '', 'under_review', {
        adminUid: currentUser.uid,
        adminEmail: currentUser.email || 'admin@fetindia.org',
        internalNotes: internalNotes.trim(),
        applicantFeedback: applicantFeedback.trim(),
        supportingDocuments: editableDocs
      });

      showSuccess('Document verification findings and internal notes recorded.');
      await loadCampaigns();
      
      // Update local review campaign
      setReviewCampaign(prev => prev ? {
        ...prev,
        internalReviewNotes: internalNotes.trim(),
        supportingDocuments: editableDocs,
        status: prev.status === 'pending_review' ? 'under_review' : prev.status
      } : null);
    } catch (err: any) {
      console.error('Error saving document verification:', err);
      showError(err?.message || 'Failed to save verification updates.');
    } finally {
      setActionProcessing(false);
    }
  };

  // Process Full Administrative Lifecycle or Delegated Recommendation Action
  const handleAdminAction = async (action: 
    | 'approve' 
    | 'activate' 
    | 'pause' 
    | 'resume' 
    | 'complete' 
    | 'reject' 
    | 'request_correction' 
    | 'request_clarification'
    | 'start_review' 
    | 'under_review' 
    | 'close'
    | 'recommend_approve'
    | 'recommend_reject'
    | 'verify_docs'
    | 'forward_to_state'
    | 'forward_to_super_admin'
  ) => {
    if (!reviewCampaign || !currentUser) return;

    if ((action === 'reject' || action === 'request_correction' || action === 'request_clarification') && !applicantFeedback.trim()) {
      showError('Please provide applicant-facing feedback explaining what is required or why the appeal cannot be approved.');
      setActiveReviewTab('decision');
      return;
    }

    setActionProcessing(true);

    try {
      const reviewerLevel = isDistrictAdmin ? 'district' : isStateAdmin ? 'state' : isNationalAdmin ? 'national' : 'super_admin';
      const assignedScope = isDistrictAdmin 
        ? `District: ${(userProfile?.assignedDistricts || [userProfile?.district || 'Assigned District']).join(', ')}`
        : isStateAdmin 
        ? `State: ${userProfile?.assignedState || userProfile?.state || 'Assigned State'}`
        : 'National Office';

      await adminReviewCampaign(reviewCampaign.id || '', action, {
        adminUid: currentUser.uid,
        adminEmail: currentUser.email || 'admin@fetindia.org',
        reviewerName: userProfile?.displayName || userProfile?.fullName || userProfile?.fullLegalName || 'FET Officer',
        reviewerLevel,
        assignedScope,
        recommendation: action === 'recommend_approve' ? 'recommend_approve' : action === 'recommend_reject' ? 'recommend_reject' : undefined,
        internalNotes: internalNotes.trim(),
        applicantFeedback: applicantFeedback.trim(),
        supportingDocuments: editableDocs
      });

      const actionLabels: Record<string, string> = {
        approve: 'APPROVED & PUBLISHED LIVE',
        under_review: 'MARKED UNDER REVIEW',
        start_review: 'MARKED UNDER REVIEW',
        request_correction: 'RETURNED TO APPLICANT FOR REVISION',
        request_clarification: 'RETURNED FOR CLARIFICATION',
        reject: 'REJECTED WITH FEEDBACK',
        recommend_approve: 'APPROVAL RECOMMENDATION SUBMITTED',
        recommend_reject: 'REJECTION RECOMMENDATION SUBMITTED',
        verify_docs: 'DOCUMENT VERIFICATION FINDINGS RECORDED',
        forward_to_state: 'FORWARDED TO STATE REVIEW',
        forward_to_super_admin: 'FORWARDED FOR SUPER ADMIN FINAL APPROVAL',
        pause: 'PAUSED',
        resume: 'RESUMED LIVE',
        complete: 'MARKED COMPLETED',
        close: 'CLOSED & ARCHIVED'
      };

      showSuccess(`Appeal ${actionLabels[action] || action.toUpperCase()}`);
      setReviewCampaign(null);
      await loadCampaigns();
    } catch (err: any) {
      console.error('Admin campaign review error:', err);
      showError(err?.message || 'Failed to update campaign state.');
    } finally {
      setActionProcessing(false);
    }
  };

  // Open Donations Ledger
  const openDonationsModal = async (camp: CrowdfundingCampaign) => {
    setDonationsCampaign(camp);
    setLoadingDonations(true);
    try {
      const dons = await fetchCampaignDonations(camp.id || '', false);
      setCampaignDonations(dons);
    } catch (err) {
      console.error('Error loading donations:', err);
      showError('Failed to load contributions ledger.');
    } finally {
      setLoadingDonations(false);
    }
  };

  // Verify a Donation Pledge / Bank Transfer
  const handleVerifyDonation = async (donationDocId: string) => {
    if (!donationsCampaign || !currentUser) return;
    try {
      await verifyCampaignDonation(donationDocId, donationsCampaign.id || '', {
        uid: currentUser.uid,
        email: currentUser.email || 'admin@fetindia.org'
      });
      showSuccess('Donation verified and campaign balance updated.');
      const updated = await fetchCampaignDonations(donationsCampaign.id || '', false);
      setCampaignDonations(updated);
      await loadCampaigns();
    } catch (err: any) {
      showError(err?.message || 'Failed to verify donation.');
    }
  };

  // Summary Metrics
  const totalCount = campaigns.length;
  const pendingCount = campaigns.filter(c => c.status === 'pending_review').length;
  const underReviewCount = campaigns.filter(c => c.status === 'under_review').length;
  const revisionCount = campaigns.filter(c => c.status === 'draft' && (c.correctionReason || c.rejectionReason)).length;
  const draftCount = campaigns.filter(c => c.status === 'draft').length;
  const activeCount = campaigns.filter(c => c.status === 'active' || c.status === 'approved').length;
  const pausedCount = campaigns.filter(c => c.status === 'paused').length;
  const completedCount = campaigns.filter(c => c.status === 'completed').length;
  const rejectedCount = campaigns.filter(c => c.status === 'rejected').length;
  const closedCount = campaigns.filter(c => c.status === 'closed').length;
  const totalRaisedSum = campaigns.reduce((acc, c) => acc + (Number(c.raisedAmount) || 0), 0);
  const totalDonationsCount = campaigns.reduce((acc, c) => acc + (Number(c.verifiedDonationsCount) || 0), 0);

  // Extract unique States and Districts for smart filtering
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    campaigns.forEach(c => {
      if (c.state) set.add(c.state.trim());
      if (c.creatorState) set.add(c.creatorState.trim());
    });
    return Array.from(set).sort();
  }, [campaigns]);

  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    campaigns.forEach(c => {
      if (stateFilter === 'all' || c.state === stateFilter || c.creatorState === stateFilter) {
        if (c.district) set.add(c.district.trim());
        if (c.creatorDistrict) set.add(c.creatorDistrict.trim());
      }
    });
    return Array.from(set).sort();
  }, [campaigns, stateFilter]);

  // Filter and Sort Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      // Search matching across all relevant identifiers and strings
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.campaignNumber && c.campaignNumber.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.creatorName && c.creatorName.toLowerCase().includes(q)) ||
        (c.creatorFullName && c.creatorFullName.toLowerCase().includes(q)) ||
        (c.creatorEmail && c.creatorEmail.toLowerCase().includes(q)) ||
        (c.creatorContactPhone && c.creatorContactPhone.includes(q)) ||
        (c.creatorMemberId && c.creatorMemberId.toLowerCase().includes(q)) ||
        (c.beneficiaryName && c.beneficiaryName.toLowerCase().includes(q)) ||
        (c.targetInstitution && c.targetInstitution.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q))
      );

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'pending_review') {
        matchesStatus = c.status === 'pending_review';
      } else if (statusFilter === 'under_review') {
        matchesStatus = c.status === 'under_review';
      } else if (statusFilter === 'revision_requested') {
        matchesStatus = c.status === 'draft' && Boolean(c.correctionReason || c.rejectionReason);
      } else if (statusFilter === 'active_approved') {
        matchesStatus = c.status === 'active' || c.status === 'approved';
      } else if (statusFilter !== 'all') {
        matchesStatus = c.status === statusFilter;
      }

      // Category filter
      const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;

      // State filter
      const matchesState = stateFilter === 'all' || c.state === stateFilter || c.creatorState === stateFilter;

      // District filter
      const matchesDistrict = districtFilter === 'all' || c.district === districtFilter || c.creatorDistrict === districtFilter;

      return matchesSearch && matchesStatus && matchesCat && matchesState && matchesDistrict;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
      }
      if (sortBy === 'highest_target') {
        return (Number(b.targetAmount) || 0) - (Number(a.targetAmount) || 0);
      }
      if (sortBy === 'lowest_target') {
        return (Number(a.targetAmount) || 0) - (Number(b.targetAmount) || 0);
      }
      if (sortBy === 'most_funded') {
        return (Number(b.raisedAmount) || 0) - (Number(a.raisedAmount) || 0);
      }
      return 0;
    });
  }, [campaigns, searchQuery, statusFilter, categoryFilter, stateFilter, districtFilter, sortBy]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6" id="admin-campaign-review-center">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-emerald-800/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Administrative Verification Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Crowdfunding Appeal Verification & Review Center</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Institutional document scrutiny, beneficiary validation, background check enforcement, and audited public appeal publication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-lg hover:shadow-emerald-600/20 active:scale-98 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Appeal Case</span>
          </button>
          <button
            onClick={loadCampaigns}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh All Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Delegated Jurisdiction Scope Alert Banner */}
      {isDelegatedAdminUser && (
        <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-white shadow-lg">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-300 text-sm">
                  Active Jurisdiction: {isDistrictAdmin ? `District Administrator (${userProfile?.assignedDistricts?.join(', ') || userProfile?.district || 'Assigned District'})` : isStateAdmin ? `State/UT Administrator (${userProfile?.assignedState || userProfile?.state || 'Assigned State'})` : 'National Administrator'}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                Appeals and applicant records are strictly isolated to your assigned regional jurisdiction. You may review submitted proofs, request clarification, and submit formal recommendations to Super Admin.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-900 text-emerald-200 border border-emerald-600 self-start sm:self-auto shrink-0">
            {canApproveCases ? 'Approval Clearance Granted' : 'Recommendation Scope'}
          </span>
        </div>
      )}

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-sm animate-in fade-in ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-950 border-emerald-200' 
            : 'bg-rose-50 text-rose-950 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <Ban className="w-4 h-4 text-rose-600" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
        </div>
      )}

      {/* Summary Metrics & Quick Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>All Cases</span>
          <p className="text-lg font-black mt-0.5">{totalCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('pending_review')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'pending_review' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-amber-50/60 text-amber-950 border-amber-200 hover:bg-amber-100/60 shadow-xs'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider block">Pending Review</span>
          <p className="text-lg font-black mt-0.5">{pendingCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('under_review')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'under_review' ? 'bg-indigo-700 text-white border-indigo-700 shadow-md' : 'bg-indigo-50/60 text-indigo-950 border-indigo-200 hover:bg-indigo-100/60 shadow-xs'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider block">Under Scrutiny</span>
          <p className="text-lg font-black mt-0.5">{underReviewCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('revision_requested')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'revision_requested' ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-orange-50/60 text-orange-950 border-orange-200 hover:bg-orange-100/60 shadow-xs'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider block">Revision Needed</span>
          <p className="text-lg font-black mt-0.5">{revisionCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('active_approved')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'active_approved' ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' : 'bg-emerald-50/60 text-emerald-950 border-emerald-200 hover:bg-emerald-100/60 shadow-xs'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider block">Live & Active</span>
          <p className="text-lg font-black mt-0.5">{activeCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('paused')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'paused' ? 'bg-slate-700 text-white border-slate-700 shadow-md' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70 shadow-xs'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider block">Paused</span>
          <p className="text-lg font-black mt-0.5">{pausedCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'completed' ? 'bg-blue-700 text-white border-blue-700 shadow-md' : 'bg-blue-50/60 text-blue-950 border-blue-200 hover:bg-blue-100/60 shadow-xs'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider block">Completed</span>
          <p className="text-lg font-black mt-0.5">{completedCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'rejected' ? 'bg-rose-700 text-white border-rose-700 shadow-md' : 'bg-rose-50/60 text-rose-950 border-rose-200 hover:bg-rose-100/60 shadow-xs'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider block">Rejected</span>
          <p className="text-lg font-black mt-0.5">{rejectedCount}</p>
        </button>
      </div>

      {/* Filter & Advanced Search Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by appeal title, case ID, applicant name, phone, email, beneficiary, destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-medium"
            >
              <option value="all">All Statuses ({totalCount})</option>
              <option value="pending_review">Pending Review ({pendingCount})</option>
              <option value="under_review">Under Scrutiny ({underReviewCount})</option>
              <option value="revision_requested">Revision Requested ({revisionCount})</option>
              <option value="active_approved">Active / Approved ({activeCount})</option>
              <option value="paused">Paused ({pausedCount})</option>
              <option value="completed">Completed ({completedCount})</option>
              <option value="rejected">Rejected ({rejectedCount})</option>
              <option value="draft">Drafts ({draftCount})</option>
              <option value="closed">Closed ({closedCount})</option>
            </select>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-medium"
            >
              <option value="all">All Categories</option>
              <option value="education">Education</option>
              <option value="medical_assistance">Medical Assistance</option>
              <option value="emergency_assistance">Emergency Relief</option>
              <option value="food_basic_needs">Food & Basic Needs</option>
              <option value="community_development">Community Development</option>
              <option value="other_charitable">Other Charitable</option>
            </select>

            {/* State Filter */}
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setDistrictFilter('all');
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-medium"
            >
              <option value="all">All States</option>
              {availableStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* District Filter */}
            {availableDistricts.length > 0 && (
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-medium"
              >
                <option value="all">All Districts</option>
                {availableDistricts.map(dt => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </select>
            )}

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest_target">Highest Target Goal</option>
              <option value="lowest_target">Lowest Target Goal</option>
              <option value="most_funded">Highest Raised Amount</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table Layout"
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card Grid Layout"
              >
                Cards
              </button>
            </div>

          </div>

        </div>

        {/* Active Filters Bar */}
        {(statusFilter !== 'all' || categoryFilter !== 'all' || stateFilter !== 'all' || districtFilter !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Filters:</span>
            {searchQuery && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium flex items-center gap-1">
                Query: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-700 ml-1">✕</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium flex items-center gap-1">
                Status: {statusFilter.replace('_', ' ')}
                <button onClick={() => setStatusFilter('all')} className="text-slate-400 hover:text-slate-700 ml-1">✕</button>
              </span>
            )}
            {categoryFilter !== 'all' && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium flex items-center gap-1">
                Category: {categoryFilter.replace('_', ' ')}
                <button onClick={() => setCategoryFilter('all')} className="text-slate-400 hover:text-slate-700 ml-1">✕</button>
              </span>
            )}
            {stateFilter !== 'all' && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium flex items-center gap-1">
                State: {stateFilter}
                <button onClick={() => setStateFilter('all')} className="text-slate-400 hover:text-slate-700 ml-1">✕</button>
              </span>
            )}
            {districtFilter !== 'all' && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium flex items-center gap-1">
                District: {districtFilter}
                <button onClick={() => setDistrictFilter('all')} className="text-slate-400 hover:text-slate-700 ml-1">✕</button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setStateFilter('all');
                setDistrictFilter('all');
              }}
              className="text-xs text-rose-600 font-bold hover:underline ml-auto cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Appeals Registry List / Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
          <RefreshCw className="w-8 h-8 mx-auto text-emerald-600 animate-spin" />
          <p className="text-xs font-bold text-slate-600">Loading appeal cases and verification records...</p>
        </div>
      ) : filteredCampaigns.length > 0 ? (
        viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Appeal & Case Number</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Applicant Profile</th>
                    <th className="py-3.5 px-4">Beneficiary & Destination</th>
                    <th className="py-3.5 px-4">Funding Target</th>
                    <th className="py-3.5 px-4">Status & Scrutiny</th>
                    <th className="py-3.5 px-4">Verification</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCampaigns.map((camp) => {
                    const target = Number(camp.targetAmount) || 1;
                    const raised = Number(camp.raisedAmount) || 0;
                    const pct = Math.min(100, Math.round((raised / target) * 100));
                    const docsCount = camp.supportingDocuments?.length || 0;
                    const verifiedDocsCount = (camp.supportingDocuments || []).filter(d => d.verificationStatus === 'valid').length;

                    return (
                      <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Appeal & Case Number */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {camp.coverImageUrl ? (
                              <img 
                                src={camp.coverImageUrl} 
                                alt={camp.title} 
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100" 
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <HeartHandshake className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0 max-w-xs">
                              <p className="font-bold text-slate-900 truncate" title={camp.title}>{camp.title}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px] text-slate-400">
                                <span>{camp.campaignNumber || camp.id}</span>
                                <span>•</span>
                                <span>{new Date(camp.createdAt).toLocaleDateString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 inline-block">
                            {CAMPAIGN_CATEGORY_CONFIG[camp.category]?.label || camp.category}
                          </span>
                        </td>

                        {/* Applicant */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 max-w-[160px]">
                            <p className="font-bold text-slate-900 truncate">{camp.creatorFullName || camp.creatorName}</p>
                            {camp.creatorParentage && (
                              <p className="text-[10px] text-slate-500 truncate">S/O: {camp.creatorParentage}</p>
                            )}
                            <p className="text-[10px] text-slate-400 truncate">{camp.creatorContactPhone || camp.contactPhone || camp.creatorEmail}</p>
                          </div>
                        </td>

                        {/* Beneficiary & Institution */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 max-w-[150px]">
                            <p className="font-bold text-slate-800 truncate">{camp.beneficiaryName || 'Direct'}</p>
                            <p className="text-[10px] text-slate-500 truncate">{camp.targetInstitution || camp.district || 'General Welfare'}</p>
                            <span className="text-[9px] text-slate-400 block">{camp.district ? `${camp.district}, ${camp.state}` : camp.location}</span>
                          </div>
                        </td>

                        {/* Funding Progress */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 w-28">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-emerald-700">{formatINR(raised)}</span>
                              <span className="text-slate-400">{formatINR(target)}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-600 h-full rounded-full" 
                                style={{ width: `${Math.max(4, pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {camp.status === 'pending_review' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300">
                              Pending Review
                            </span>
                          )}
                          {camp.status === 'under_review' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-950 border border-indigo-300 animate-pulse">
                              Under Scrutiny
                            </span>
                          )}
                          {camp.status === 'draft' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-100 text-orange-950 border border-orange-300">
                              {camp.correctionReason || camp.rejectionReason ? 'Revision Needed' : 'Draft'}
                            </span>
                          )}
                          {camp.status === 'active' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              Live & Active
                            </span>
                          )}
                          {camp.status === 'approved' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              Approved
                            </span>
                          )}
                          {camp.status === 'paused' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-200 text-slate-800">
                              Paused
                            </span>
                          )}
                          {camp.status === 'completed' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                              Completed
                            </span>
                          )}
                          {camp.status === 'rejected' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                              Rejected
                            </span>
                          )}
                          {camp.status === 'closed' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600">
                              Closed
                            </span>
                          )}
                        </td>

                        {/* Verification & Documents Badge */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {camp.isVerifiedByFET ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>FET Verified</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Unverified</span>
                            )}
                            {docsCount > 0 ? (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded block w-fit">
                                {verifiedDocsCount}/{docsCount} Docs Validated
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic block">No private docs</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right space-x-2 shrink-0">
                          <button
                            onClick={() => openDonationsModal(camp)}
                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="View Verified Donations Ledger"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openReviewModal(camp)}
                            className="py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            Review & Verify
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* RESPONSIVE CARD GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((camp) => {
              const target = Number(camp.targetAmount) || 1;
              const raised = Number(camp.raisedAmount) || 0;
              const pct = Math.min(100, Math.round((raised / target) * 100));

              return (
                <div key={camp.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    {/* Card Header & Thumbnail */}
                    <div className="relative h-36 bg-slate-900">
                      {camp.coverImageUrl ? (
                        <img src={camp.coverImageUrl} alt={camp.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <HeartHandshake className="w-10 h-10 text-slate-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-white/90 text-slate-900 shadow-xs">
                          {CAMPAIGN_CATEGORY_CONFIG[camp.category]?.label || camp.category}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded">
                          {camp.campaignNumber || camp.id}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-sm font-black text-white truncate drop-shadow">{camp.title}</h3>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] font-bold">Applicant: {camp.creatorFullName || camp.creatorName}</span>
                        <span className="text-[10px] text-slate-400">{camp.district || camp.state}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-emerald-700 font-black">{formatINR(raised)} raised</span>
                          <span className="text-slate-400">Target {formatINR(target)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.max(4, pct)}%` }} />
                        </div>
                      </div>

                      {/* Status & Verification Badges */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                          {camp.status.replace('_', ' ')}
                        </span>
                        {camp.isVerifiedByFET && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
                    <button
                      onClick={() => openDonationsModal(camp)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      title="View Donations Ledger"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openReviewModal(camp)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer text-center"
                    >
                      Review & Verify Appeal
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
          <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No appeals match the selected filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, status selection, or clearing district and category filters.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPEAL REVIEW & VERIFICATION WORKSPACE (INSPECTOR MODAL)                  */}
      {/* ========================================================================= */}
      {reviewCampaign && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" id="admin-appeal-verification-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[94vh] overflow-hidden flex flex-col">
            
            {/* Modal Top Bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                    {reviewCampaign.campaignNumber || reviewCampaign.id}
                  </span>
                  <span className="text-xs font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded">
                    {CAMPAIGN_CATEGORY_CONFIG[reviewCampaign.category]?.label || reviewCampaign.category}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Status: {reviewCampaign.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white truncate max-w-2xl">{reviewCampaign.title}</h2>
              </div>

              <button
                onClick={() => setReviewCampaign(null)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Close Reviewer"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs inside Inspector */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveReviewTab('details')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeReviewTab === 'details' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Case Narrative</span>
              </button>

              <button
                onClick={() => setActiveReviewTab('applicant')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeReviewTab === 'applicant' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Applicant Identity</span>
              </button>

              <button
                onClick={() => setActiveReviewTab('documents')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeReviewTab === 'documents' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Private Documents ({editableDocs.length})</span>
              </button>

              <button
                onClick={() => setActiveReviewTab('media')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeReviewTab === 'media' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photos & Gallery</span>
              </button>

              <button
                onClick={() => setActiveReviewTab('history')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeReviewTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Logs</span>
              </button>

              <button
                onClick={() => setActiveReviewTab('decision')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeReviewTab === 'decision' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Decision & Notes</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto max-h-[65vh]">

              {/* TAB 1: CASE DETAILS & BENEFICIARY */}
              {activeReviewTab === 'details' && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Financial & Location Summary Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Goal</span>
                      <p className="font-black text-slate-900 text-base mt-0.5">{formatINR(reviewCampaign.targetAmount)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Raised</span>
                      <p className="font-black text-emerald-700 text-base mt-0.5">{formatINR(reviewCampaign.raisedAmount || 0)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Timeline</span>
                      <p className="font-bold text-slate-800 mt-0.5">{reviewCampaign.startDate} to {reviewCampaign.endDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Location</span>
                      <p className="font-bold text-slate-800 mt-0.5">{reviewCampaign.district ? `${reviewCampaign.district}, ${reviewCampaign.state}` : reviewCampaign.location}</p>
                    </div>
                  </div>

                  {/* Case Narrative */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span>Full Case Narrative & Urgent Need</span>
                    </h3>
                    <div className="p-5 rounded-2xl bg-slate-50 text-xs text-slate-800 whitespace-pre-line leading-relaxed border border-slate-200 max-h-56 overflow-y-auto">
                      {reviewCampaign.description}
                    </div>
                  </div>

                  {/* Beneficiary & Institution */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-blue-700" />
                      <span>Beneficiary & Target Disbursal Destination</span>
                    </h3>
                    <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs space-y-2 text-slate-800">
                      {reviewCampaign.beneficiaryName && (
                        <p className="font-black text-blue-950 text-sm">Beneficiary Name: {reviewCampaign.beneficiaryName}</p>
                      )}
                      {reviewCampaign.targetInstitution && (
                        <p className="font-bold text-slate-900">Target Institution / Hospital / College: {reviewCampaign.targetInstitution}</p>
                      )}
                      <p className="leading-relaxed">{reviewCampaign.beneficiaryDescription}</p>
                      {reviewCampaign.fundUtilizationNotes && (
                        <div className="pt-2 border-t border-blue-200/60">
                          <span className="font-bold text-blue-900 block">Fund Utilization Plan:</span>
                          <p className="text-slate-700 mt-0.5">{reviewCampaign.fundUtilizationNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: APPLICANT PROFILE & ACCREDITATION */}
              {activeReviewTab === 'applicant' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <h3 className="text-sm font-black text-slate-900">Applicant Legal Identity & Background</h3>
                      {reviewCampaign.creatorMemberId ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Registered FET Member #{reviewCampaign.creatorMemberId}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          Non-Member Accredited Applicant
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Full Legal Name</span>
                        <p className="font-black text-slate-900 text-sm mt-0.5">{reviewCampaign.creatorFullName || reviewCampaign.creatorName}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Father's / Husband's Name</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{reviewCampaign.creatorParentage || 'Not Provided'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Relationship to Beneficiary</span>
                        <p className="font-bold text-emerald-800 text-sm mt-0.5">{reviewCampaign.relationshipToBeneficiary || 'Direct Applicant'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Primary Contact Phone</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{reviewCampaign.creatorContactPhone || reviewCampaign.contactPhone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">WhatsApp / Alternate Phone</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{reviewCampaign.creatorAlternatePhone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{reviewCampaign.creatorEmailAddress || reviewCampaign.creatorEmail}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Residential Location & Address</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{reviewCampaign.creatorResidentialLocation || reviewCampaign.location || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">State & District</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{reviewCampaign.creatorDistrict ? `${reviewCampaign.creatorDistrict}, ${reviewCampaign.creatorState}` : reviewCampaign.state}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200">
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold">Truthfulness Declaration Signed</p>
                          <p className="text-[10px] text-emerald-800">Applicant declared all facts under penalty of forfeiture</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-950 border border-blue-200">
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-bold">Direct Institutional Disbursal Agreed</p>
                          <p className="text-[10px] text-blue-800">Direct transfer to hospital/college accounts authorized</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: PRIVATE VERIFICATION DOCUMENTS SCRUTINY */}
              {activeReviewTab === 'documents' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
                    <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black">🔒 Confidential Document Verification Scrutiny</p>
                      <p className="text-amber-900 mt-0.5 leading-relaxed">
                        These private documents are protected by FET India's data isolation architecture and are inaccessible to public viewers. For each document, mark whether it is Valid, Invalid, Needs Clarification, or Missing, and add verification remarks.
                      </p>
                    </div>
                  </div>

                  {editableDocs.length > 0 ? (
                    <div className="space-y-4">
                      {editableDocs.map((doc, idx) => (
                        <div
                          key={doc.id || idx}
                          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                  {doc.type}
                                </span>
                                {doc.sizeBytes && (
                                  <span className="text-slate-400">
                                    {(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                                  </span>
                                )}
                                <span className="text-slate-400">• Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</span>
                              </div>
                            </div>

                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer w-fit"
                            >
                              <span>Inspect Document</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {/* Verification Status Selector */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                            <div>
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                                Document Verification Status
                              </label>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDocStatusChange(doc.id, 'valid')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    doc.verificationStatus === 'valid'
                                      ? 'bg-emerald-700 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Valid / Verified</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDocStatusChange(doc.id, 'needs_clarification')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    doc.verificationStatus === 'needs_clarification'
                                      ? 'bg-amber-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-700 hover:bg-amber-50'
                                  }`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Needs Clarification</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDocStatusChange(doc.id, 'invalid')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    doc.verificationStatus === 'invalid'
                                      ? 'bg-rose-700 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-700 hover:bg-rose-50'
                                  }`}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Invalid</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDocStatusChange(doc.id, 'missing')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    doc.verificationStatus === 'missing'
                                      ? 'bg-slate-700 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  <FileQuestion className="w-3.5 h-3.5" />
                                  <span>Missing / Incomplete</span>
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                                Reviewer Remarks for this Document
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Verified with College Accounts / Missing seal on bill..."
                                value={doc.reviewerRemarks || ''}
                                onChange={(e) => handleDocRemarkChange(doc.id, e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>

                        </div>
                      ))}

                      <div className="pt-2 flex justify-end">
                        <button
                          disabled={actionProcessing}
                          onClick={handleSaveDocVerificationOnly}
                          className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Save Document Scrutiny Findings</span>
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400 space-y-2">
                      <FileQuestion className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-600">No private verification documents were uploaded with this appeal.</p>
                      <p className="text-[11px]">You may request document submission by using the "Request Revision" workflow.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PHOTOS & MEDIA */}
              {activeReviewTab === 'media' && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Cover Photo Review */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Primary Public Cover Photo
                    </h3>
                    {reviewCampaign.coverImageUrl ? (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-72 bg-slate-950 flex items-center justify-center">
                        <img 
                          src={reviewCampaign.coverImageUrl} 
                          alt="Cover Banner" 
                          className="max-h-72 object-contain" 
                        />
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                        No cover photo uploaded.
                      </div>
                    )}
                  </div>

                  {/* Supporting Gallery Images */}
                  {reviewCampaign.supportingImages && reviewCampaign.supportingImages.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        Cause Photos ({reviewCampaign.supportingImages.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {reviewCampaign.supportingImages.map((img, idx) => (
                          <a 
                            key={img.id || idx} 
                            href={img.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="block rounded-2xl overflow-hidden border border-slate-200 h-28 bg-slate-900 group relative"
                          >
                            <img src={img.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            {img.caption && (
                              <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-[10px] text-white truncate text-center">
                                {img.caption}
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 5: AUDIT LOGS & REVIEW HISTORY */}
              {activeReviewTab === 'history' && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-600" />
                    <span>Appeal Audit Trail & Historical Review Actions</span>
                  </h3>

                  {reviewCampaign.reviewHistory && reviewCampaign.reviewHistory.length > 0 ? (
                    <div className="space-y-3">
                      {reviewCampaign.reviewHistory.map((item, idx) => (
                        <div key={item.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-900 uppercase">{item.action}</span>
                            <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">
                            <span>Status Transition: <strong className="text-slate-800">{item.fromStatus}</strong> → <strong className="text-emerald-700">{item.toStatus}</strong></span>
                            <span>•</span>
                            <span>Reviewer: <strong>{item.reviewerEmail}</strong></span>
                          </div>
                          {item.applicantFeedback && (
                            <p className="text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-xl border border-amber-200/60 mt-1">
                              <strong>Applicant Feedback:</strong> {item.applicantFeedback}
                            </p>
                          )}
                          {item.internalNotes && (
                            <p className="text-[11px] text-slate-700 bg-slate-100 p-2 rounded-xl border border-slate-200 mt-1">
                              <strong>Internal Notes:</strong> {item.internalNotes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                      No prior review actions recorded for this appeal.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: ADMINISTRATIVE DECISION & NOTES WORKSPACE */}
              {activeReviewTab === 'decision' && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Internal Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Confidential Internal Admin Notes (Private to Trustees & Secretariat)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Record verified hospital contacts, board approval resolution numbers, committee notes..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400">These notes are NEVER shown to the applicant or public viewers.</p>
                  </div>

                  {/* Applicant Feedback */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>Applicant-Facing Feedback / Reason (Required if Requesting Revision or Rejecting)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Explain required document updates, missing bona fide letters, or reason for decision..."
                      value={applicantFeedback}
                      onChange={(e) => setApplicantFeedback(e.target.value)}
                      className="w-full px-4 py-3 bg-amber-50/50 rounded-2xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-slate-400">This explanation will be delivered to the applicant's in-app notification and appeal revision dashboard.</p>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Action Bar (Bottom Footer) */}
            <div className="border-t border-slate-200 p-4 sm:p-5 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                Audited Reviewer: <strong className="text-slate-800">{currentUser?.email}</strong>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                
                {/* Mark Under Review */}
                {reviewCampaign.status === 'pending_review' && (
                  <button
                    disabled={actionProcessing}
                    onClick={() => handleAdminAction('under_review')}
                    className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Mark appeal as currently under administrative scrutiny"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Start Scrutiny / Mark Under Review</span>
                  </button>
                )}

                {/* Approve & Make Live */}
                {reviewCampaign.status !== 'active' && (
                  <button
                    disabled={actionProcessing}
                    onClick={() => handleAdminAction('approve')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Make Active</span>
                  </button>
                )}

                {/* Request Correction / Return to Applicant */}
                {(reviewCampaign.status === 'pending_review' || reviewCampaign.status === 'under_review') && (
                  <button
                    disabled={actionProcessing}
                    onClick={() => handleAdminAction('request_correction')}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Return appeal to applicant to correct details or re-upload documents"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Request Revision</span>
                  </button>
                )}

                {/* Reject Appeal */}
                {(reviewCampaign.status === 'pending_review' || reviewCampaign.status === 'under_review') && (
                  <button
                    disabled={actionProcessing}
                    onClick={() => handleAdminAction('reject')}
                    className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Reject Appeal</span>
                  </button>
                )}

                {/* Pause */}
                {reviewCampaign.status === 'active' && (
                  <button
                    disabled={actionProcessing}
                    onClick={() => handleAdminAction('pause')}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Pause Appeal</span>
                  </button>
                )}

                {/* Resume */}
                {reviewCampaign.status === 'paused' && (
                  <button
                    disabled={actionProcessing}
                    onClick={() => handleAdminAction('resume')}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Resume Appeal</span>
                  </button>
                )}

                {/* Mark Completed */}
                {reviewCampaign.status !== 'completed' && (
                  <button
                    disabled={actionProcessing}
                    onClick={() => handleAdminAction('complete')}
                    className="px-3.5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                )}

                {/* Close */}
                {reviewCampaign.status !== 'closed' && (
                  <button
                    disabled={actionProcessing}
                    onClick={() => handleAdminAction('close')}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Close Case
                  </button>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAMPAIGN DONATIONS & FINANCIAL LEDGER MODAL                               */}
      {/* ========================================================================= */}
      {donationsCampaign && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" id="admin-campaign-donations-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20 rounded-t-3xl">
              <div>
                <h2 className="text-base font-black text-slate-900">Donations Ledger & Verification</h2>
                <p className="text-xs text-slate-500 truncate max-w-md">{donationsCampaign.title}</p>
              </div>
              <button onClick={() => setDonationsCampaign(null)} className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4 flex-1">
              {loadingDonations ? (
                <p className="text-xs text-slate-400 text-center py-6">Loading contribution records...</p>
              ) : campaignDonations.length > 0 ? (
                <div className="space-y-3">
                  {campaignDonations.map((d) => (
                    <div key={d.id} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs bg-slate-50">
                      <div className="space-y-1 min-w-0 pr-3">
                        <p className="font-bold text-slate-900">{d.donorName} {d.isAnonymous && <span className="text-[10px] text-slate-400">(Anonymous on Public Wall)</span>}</p>
                        <p className="text-[11px] text-slate-500 font-mono">Ref: {d.transactionReference || d.donationId}</p>
                        <p className="text-[10px] text-slate-400">{d.donorEmail} • {new Date(d.createdAt).toLocaleString('en-IN')}</p>
                      </div>

                      <div className="text-right space-y-1.5 shrink-0">
                        <p className="text-sm font-black text-emerald-800">{formatINR(d.amount)}</p>
                        {d.paymentStatus === 'verified' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                            ✓ Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerifyDonation(d.id || '')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Verify Transfer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No donations registered for this campaign yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Case Modal */}
      <CreateCampaignModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          loadCampaigns();
        }}
      />

    </div>
  );
};
