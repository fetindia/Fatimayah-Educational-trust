/**
 * @license
 * Admin Donor & Donation Management Center
 * Fatimyah Educational Trust India (FET India)
 * Module: Super Admin / Donor & Finance Administration Console
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BadgeDollarSign, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  Check, 
  X, 
  Download, 
  RefreshCw, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  User, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  CreditCard,
  RotateCcw,
  Printer,
  Heart,
  SlidersHorizontal,
  ExternalLink,
  Lock,
  ChevronDown,
  Layers,
  ArrowUpRight,
  Users,
  Landmark
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  db, 
  adminUpdateCampaignDonationStatus,
  verifyCampaignDonation 
} from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { 
  CampaignDonation, 
  CampaignDonationStatus, 
  CrowdfundingCampaign,
  UserProfile 
} from '../../types';
import { AdminDonorApplicationsView } from './AdminDonorApplicationsView';
import { AdminManualDonationSettings } from './settings/AdminManualDonationSettings';

export const AdminDonorsManagementView: React.FC = () => {
  const { currentUser, userProfile, isSuperAdmin } = useAuth();
  const { config } = useConfig();

  // Primary State
  const [donations, setDonations] = useState<CampaignDonation[]>([]);
  const [campaigns, setCampaigns] = useState<CrowdfundingCampaign[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'donors' | 'campaigns' | 'applications' | 'bank_settings'>('overview');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignDonationStatus>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'fy2627'>('all');
  const [amountRangeFilter, setAmountRangeFilter] = useState<'all' | 'under1k' | '1k_5k' | '5k_25k' | '25k_plus'>('all');

  // Modal States
  const [selectedDonation, setSelectedDonation] = useState<CampaignDonation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [isStatusActionModalOpen, setIsStatusActionModalOpen] = useState<boolean>(false);
  const [statusTargetAction, setStatusTargetAction] = useState<CampaignDonationStatus>('verified');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [actionReason, setActionReason] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // Donor Profile Modal State
  const [selectedDonorProfile, setSelectedDonorProfile] = useState<{
    donorName: string;
    donorEmail: string;
    donorPhone?: string;
    donorPan?: string;
    donorUid?: string;
    donations: CampaignDonation[];
    totalAmount: number;
    verifiedAmount: number;
  } | null>(null);

  // Privacy: Reveal PII Toggle (Super Admin only)
  const [revealSensitiveInfo, setRevealSensitiveInfo] = useState<boolean>(false);

  // Toast / Status Notice
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setStatusNotice({ type, text });
    setTimeout(() => setStatusNotice(null), 4500);
  };

  // 1. Subscribe to Donations Collection
  useEffect(() => {
    setIsLoading(true);
    const qDonations = query(collection(db, 'campaign_donations'), orderBy('createdAt', 'desc'));

    const unsubDonations = onSnapshot(
      qDonations,
      (snapshot) => {
        const list: CampaignDonation[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CampaignDonation);
        });
        setDonations(list);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error listening to campaign donations:', err);
        notify('error', 'Could not stream donations from Firestore.');
        setIsLoading(false);
      }
    );

    // 2. Subscribe to Campaigns Collection
    const qCampaigns = query(collection(db, 'crowdfunding_campaigns'), orderBy('createdAt', 'desc'));
    const unsubCampaigns = onSnapshot(
      qCampaigns,
      (snapshot) => {
        const cList: CrowdfundingCampaign[] = [];
        snapshot.forEach((doc) => {
          cList.push({ id: doc.id, ...doc.data() } as CrowdfundingCampaign);
        });
        setCampaigns(cList);
      },
      (err) => {
        console.error('Error fetching campaigns list:', err);
      }
    );

    // 3. Subscribe to Users for Donor enrichment
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const uList: UserProfile[] = [];
        snapshot.forEach((doc) => {
          uList.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        setUsers(uList);
      },
      (err) => {
        console.warn('Users listener notice:', err);
      }
    );

    return () => {
      unsubDonations();
      unsubCampaigns();
      unsubUsers();
    };
  }, []);

  // Filtered Transactions
  const filteredDonations = useMemo(() => {
    return donations.filter((don) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && don.paymentStatus !== statusFilter) {
        return false;
      }

      // 2. Campaign Filter
      if (campaignFilter !== 'all' && don.campaignId !== campaignFilter) {
        return false;
      }

      // 3. Amount Range Filter
      const amt = Number(don.amount) || 0;
      if (amountRangeFilter === 'under1k' && amt >= 1000) return false;
      if (amountRangeFilter === '1k_5k' && (amt < 1000 || amt > 5000)) return false;
      if (amountRangeFilter === '5k_25k' && (amt < 5000 || amt > 25000)) return false;
      if (amountRangeFilter === '25k_plus' && amt < 25000) return false;

      // 4. Date Range Filter
      if (dateRangeFilter !== 'all' && don.createdAt) {
        const donDate = new Date(don.createdAt).getTime();
        const now = Date.now();
        if (dateRangeFilter === 'today' && now - donDate > 24 * 60 * 60 * 1000) return false;
        if (dateRangeFilter === 'week' && now - donDate > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateRangeFilter === 'month' && now - donDate > 30 * 24 * 60 * 60 * 1000) return false;
        if (dateRangeFilter === 'fy2627') {
          const d = new Date(don.createdAt);
          const startFY = new Date('2026-04-01T00:00:00Z').getTime();
          const endFY = new Date('2027-03-31T23:59:59Z').getTime();
          if (donDate < startFY || donDate > endFY) return false;
        }
      }

      // 5. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = don.transactionReference?.toLowerCase().includes(q) || false;
        const matchesDonId = don.donationId?.toLowerCase().includes(q) || false;
        const matchesName = don.donorName?.toLowerCase().includes(q) || false;
        const matchesEmail = don.donorEmail?.toLowerCase().includes(q) || false;
        const matchesPhone = don.donorPhone?.toLowerCase().includes(q) || false;
        const matchesPan = don.donorPan?.toLowerCase().includes(q) || false;
        const matchesCamp = don.campaignTitle?.toLowerCase().includes(q) || false;
        const matchesReceipt = don.receiptNumber?.toLowerCase().includes(q) || false;

        return matchesRef || matchesDonId || matchesName || matchesEmail || matchesPhone || matchesPan || matchesCamp || matchesReceipt;
      }

      return true;
    });
  }, [donations, statusFilter, campaignFilter, amountRangeFilter, dateRangeFilter, searchQuery]);

  // Aggregated Unique Donors
  const donorDirectory = useMemo(() => {
    const map = new Map<string, {
      key: string;
      donorName: string;
      donorEmail: string;
      donorPhone?: string;
      donorPan?: string;
      donorUid?: string;
      donations: CampaignDonation[];
      totalAmount: number;
      verifiedAmount: number;
      latestDate: string;
    }>();

    donations.forEach((don) => {
      const key = don.donorUid || don.donorEmail?.toLowerCase() || don.donorName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          key,
          donorName: don.donorName || 'Well-Wisher',
          donorEmail: don.donorEmail || '',
          donorPhone: don.donorPhone,
          donorPan: don.donorPan,
          donorUid: don.donorUid,
          donations: [],
          totalAmount: 0,
          verifiedAmount: 0,
          latestDate: don.createdAt
        });
      }

      const item = map.get(key)!;
      item.donations.push(don);
      item.totalAmount += Number(don.amount) || 0;
      if (don.paymentStatus === 'verified') {
        item.verifiedAmount += Number(don.amount) || 0;
      }
      if (new Date(don.createdAt).getTime() > new Date(item.latestDate).getTime()) {
        item.latestDate = don.createdAt;
      }
      if (!item.donorPhone && don.donorPhone) item.donorPhone = don.donorPhone;
      if (!item.donorPan && don.donorPan) item.donorPan = don.donorPan;
      if (!item.donorUid && don.donorUid) item.donorUid = don.donorUid;
    });

    return Array.from(map.values()).sort((a, b) => b.verifiedAmount - a.verifiedAmount);
  }, [donations]);

  // Metric Computations (Real Firestore values only)
  const metrics = useMemo(() => {
    const verified = donations.filter(d => d.paymentStatus === 'verified');
    const pending = donations.filter(d => d.paymentStatus === 'pending_verification');
    const failed = donations.filter(d => d.paymentStatus === 'failed');
    const cancelled = donations.filter(d => d.paymentStatus === 'cancelled');
    const refunded = donations.filter(d => d.paymentStatus === 'refunded');

    const totalVerifiedAmount = verified.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalPendingAmount = pending.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalRefundedAmount = refunded.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return {
      totalDonationsCount: donations.length,
      verifiedCount: verified.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      cancelledCount: cancelled.length,
      refundedCount: refunded.length,
      totalVerifiedAmount,
      totalPendingAmount,
      totalRefundedAmount,
      uniqueDonorsCount: donorDirectory.length
    };
  }, [donations, donorDirectory]);

  // Status Action Handler (Verify, Mark Pending, Failed, Cancel, Refund)
  const handleOpenStatusModal = (don: CampaignDonation, action: CampaignDonationStatus) => {
    setSelectedDonation(don);
    setStatusTargetAction(action);
    setActionNotes(don.adminNotes || '');
    setActionReason(don.refundReason || don.cancelledReason || '');
    setIsStatusActionModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedDonation || !selectedDonation.id || !currentUser) return;
    setIsSubmittingAction(true);

    try {
      await adminUpdateCampaignDonationStatus(
        selectedDonation.id,
        selectedDonation.campaignId,
        statusTargetAction,
        {
          adminUid: currentUser.uid,
          adminEmail: currentUser.email || 'admin@fetindia.org',
          adminNotes: actionNotes.trim(),
          refundReason: statusTargetAction === 'refunded' ? actionReason.trim() : undefined,
          cancelledReason: statusTargetAction === 'cancelled' ? actionReason.trim() : undefined
        }
      );

      notify('success', `Donation ${selectedDonation.donationId || selectedDonation.transactionReference} marked as ${statusTargetAction.toUpperCase()}!`);
      setIsStatusActionModalOpen(false);
      if (isDetailModalOpen) setIsDetailModalOpen(false);
    } catch (err: any) {
      console.error('Error updating donation status:', err);
      notify('error', err?.message || 'Failed to update donation status.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 1-Click Quick Verification
  const handleQuickVerify = async (don: CampaignDonation) => {
    if (!currentUser || !don.id) return;
    try {
      await verifyCampaignDonation(don.id, don.campaignId, {
        uid: currentUser.uid,
        email: currentUser.email || 'admin@fetindia.org'
      });
      notify('success', `Donation ${don.transactionReference} verified and 80G receipt issued!`);
    } catch (err: any) {
      console.error('Quick verify error:', err);
      notify('error', err?.message || 'Verification failed.');
    }
  };

  // Export Clean CSV (Sanitized for audit & accounting)
  const handleExportCSV = () => {
    if (donations.length === 0) {
      notify('error', 'No donation transactions available to export.');
      return;
    }

    const headers = [
      'Donation ID',
      'Transaction Reference',
      'Date (UTC)',
      'Donor Name',
      'Donor Email',
      'Donor PAN',
      'Campaign Title',
      'Amount (INR)',
      'Payment Status',
      '80G Receipt Number',
      'Verified At',
      'Verified By'
    ];

    const rows = filteredDonations.map(d => [
      d.donationId || '',
      `"${d.transactionReference || ''}"`,
      `"${d.createdAt || ''}"`,
      `"${d.donorName || 'Well-Wisher'}"`,
      `"${d.donorEmail || ''}"`,
      `"${d.donorPan || 'N/A'}"`,
      `"${(d.campaignTitle || '').replace(/"/g, '""')}"`,
      d.amount || 0,
      d.paymentStatus || '',
      d.receiptNumber || 'N/A',
      d.verifiedAt || '',
      d.verifiedByEmail || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FET_India_Donation_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify('success', `Exported ${filteredDonations.length} records to CSV successfully.`);
  };

  // Helper: Mask PII
  const maskPhone = (phone?: string) => {
    if (!phone) return '—';
    if (revealSensitiveInfo && isSuperAdmin) return phone;
    const clean = phone.replace(/\s+/g, '');
    if (clean.length <= 4) return '***';
    return clean.slice(0, 3) + ' ••• •• ' + clean.slice(-2);
  };

  const maskPan = (pan?: string) => {
    if (!pan) return 'Not Provided';
    if (revealSensitiveInfo && isSuperAdmin) return pan.toUpperCase();
    if (pan.length <= 4) return '****';
    return pan.slice(0, 2) + '••••••' + pan.slice(-2).toUpperCase();
  };

  const maskEmail = (email?: string) => {
    if (!email) return '—';
    if (revealSensitiveInfo && isSuperAdmin) return email;
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const userPart = parts[0];
    const maskedUser = userPart.length > 2 ? userPart.slice(0, 2) + '•••' : userPart;
    return `${maskedUser}@${parts[1]}`;
  };

  return (
    <div className="space-y-6" id="fet-donor-management-center">
      
      {/* Toast Notice */}
      {statusNotice && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-md transition-all ${
          statusNotice.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusNotice.text}</span>
          </div>
          <button onClick={() => setStatusNotice(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* Header & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200">
              <BadgeDollarSign className="w-6 h-6 text-amber-700" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Donor & Donation Management Center
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Live Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reconcile verified contributions, scrutinize transaction proofs, issue Section 80G tax certificates, and govern patron accreditation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <button
              onClick={() => setRevealSensitiveInfo(!revealSensitiveInfo)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                revealSensitiveInfo 
                  ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-inner' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle PII masking for PAN and phone numbers"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{revealSensitiveInfo ? 'Mask PII' : 'Reveal Sensitive PII'}</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid (Real existing database statistics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Verified</span>
          <div className="text-xl font-black text-emerald-800">
            ₹{metrics.totalVerifiedAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] font-bold text-emerald-700 block">
            {metrics.verifiedCount} Transactions
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Verification</span>
          <div className="text-xl font-black text-amber-700">
            ₹{metrics.totalPendingAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] font-bold text-amber-700 block">
            {metrics.pendingCount} In Scrutiny Queue
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unique Donors</span>
          <div className="text-xl font-black text-slate-900">
            {metrics.uniqueDonorsCount}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block">
            Patrons & Contributors
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">80G Certificates</span>
          <div className="text-xl font-black text-blue-700">
            {metrics.verifiedCount}
          </div>
          <span className="text-[10px] text-blue-600 font-semibold block">
            Form 10BE Ready
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Failed / Cancelled</span>
          <div className="text-xl font-black text-rose-700">
            {metrics.failedCount + metrics.cancelledCount}
          </div>
          <span className="text-[10px] text-rose-600 font-semibold block">
            {metrics.cancelledCount} Cancelled • {metrics.failedCount} Failed
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Refunds / Reversals</span>
          <div className="text-xl font-black text-purple-800">
            ₹{metrics.totalRefundedAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-purple-700 font-semibold block">
            {metrics.refundedCount} Records
          </span>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>1. Dashboard Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>2. Transaction Ledger</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-amber-300 font-bold">
            {filteredDonations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('donors')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'donors'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>3. Donor Directory</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-blue-300 font-bold">
            {donorDirectory.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'campaigns'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400" />
          <span>4. Campaign Summaries</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-rose-300 font-bold">
            {campaigns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'applications'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <span>5. Patron Accreditation Intake</span>
        </button>

        <button
          onClick={() => setActiveTab('bank_settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'bank_settings'
              ? 'bg-emerald-800 text-white font-black shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          id="tab-manual-donation-bank-settings"
        >
          <Landmark className="w-4 h-4 text-emerald-300" />
          <span>6. Manual Bank Transfer Details</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: DASHBOARD OVERVIEW & ANALYTICS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6" id="donor-analytics-overview">
          
          {/* Urgent Verification Callout */}
          {metrics.pendingCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-amber-950">
                    {metrics.pendingCount} Contribution Pledges Awaiting Verification
                  </h4>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Donors have submitted payment references totaling ₹{metrics.totalPendingAmount.toLocaleString('en-IN')}. Please cross-verify bank credits and authorize 80G issuance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStatusFilter('pending_verification');
                  setActiveTab('transactions');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer shadow-xs"
              >
                Review Queue
              </button>
            </div>
          )}

          {/* 2-Column Analytical Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Contributions Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
                </div>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All ({donations.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {donations.slice(0, 6).map((don) => (
                  <div key={don.id} className="py-3 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 truncate">
                          {don.donorName || 'Well-Wisher'}
                        </span>
                        {don.isAnonymous && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                            Anon
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                        {don.campaignTitle || 'General Appeal'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-emerald-800 text-xs">
                        ₹{Number(don.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                        don.paymentStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                        don.paymentStatus === 'pending_verification' ? 'bg-amber-100 text-amber-800' :
                        don.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {don.paymentStatus === 'verified' ? 'Verified' :
                         don.paymentStatus === 'pending_verification' ? 'Pending' :
                         don.paymentStatus === 'refunded' ? 'Refunded' : 'Failed'}
                      </span>
                    </div>
                  </div>
                ))}
                {donations.length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-400">No donations recorded yet.</p>
                )}
              </div>
            </div>

            {/* Campaign-wise Progress Summary */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-bold text-slate-900">Appeals & Causes Fund Health</h3>
                </div>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Matrix ({campaigns.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3.5">
                {campaigns.slice(0, 4).map((c) => {
                  const target = Number(c.targetAmount) || 1;
                  const raised = Number(c.raisedAmount) || 0;
                  const percent = Math.min(100, Math.round((raised / target) * 100));
                  return (
                    <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 truncate max-w-[220px]">{c.title}</span>
                        <span className="font-black text-emerald-800">
                          ₹{raised.toLocaleString('en-IN')} / ₹{target.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{c.category} • {c.verifiedDonationsCount || 0} donors</span>
                        <span className="font-bold text-slate-700">{percent}% funded</span>
                      </div>
                    </div>
                  );
                })}
                {campaigns.length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-400">No active appeals found.</p>
                )}
              </div>
            </div>

          </div>

          {/* Statutory Tax Compliance Box */}
          <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-2 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Statutory 80G & 12A Trust Accreditation Policy</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every verified donation to <strong>{config.legalName || 'Fatimyah Educational Trust'}</strong> generates a system-authenticated Section 80G tax exemption receipt under URN <strong>AAATF1234AF20214</strong>. PII compliance requires masking donor PAN numbers unless specifically authorized by the Super Admin for Form 10BD filing.
            </p>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: COMPLETE TRANSACTION LEDGER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'transactions' && (
        <div className="space-y-4" id="donor-transactions-ledger">
          
          {/* Search & Filter Toolbar */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row gap-3">
              
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Donor, Email, Phone, PAN, Reference ID, Receipt No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold focus:outline-hidden"
              >
                <option value="all">All Statuses ({donations.length})</option>
                <option value="verified">Verified / Successful ({metrics.verifiedCount})</option>
                <option value="pending_verification">Pending Scrutiny ({metrics.pendingCount})</option>
                <option value="failed">Failed ({metrics.failedCount})</option>
                <option value="cancelled">Cancelled ({metrics.cancelledCount})</option>
                <option value="refunded">Refunded ({metrics.refundedCount})</option>
              </select>

              {/* Campaign Filter */}
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden max-w-[220px]"
              >
                <option value="all">All Campaigns & Appeals</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              {/* Amount Filter */}
              <select
                value={amountRangeFilter}
                onChange={(e) => setAmountRangeFilter(e.target.value as any)}
                className="px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="all">All Amounts</option>
                <option value="under1k">&lt; ₹1,000</option>
                <option value="1k_5k">₹1,000 - ₹5,000</option>
                <option value="5k_25k">₹5,000 - ₹25,000</option>
                <option value="25k_plus">₹25,000+</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value as any)}
                className="px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
                <option value="fy2627">FY 2026-27</option>
              </select>

            </div>

            {/* Active Filter Badges */}
            {(statusFilter !== 'all' || campaignFilter !== 'all' || amountRangeFilter !== 'all' || dateRangeFilter !== 'all' || searchQuery) && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Filtered <strong>{filteredDonations.length}</strong> of {donations.length} records</span>
                  {statusFilter !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      Status: {statusFilter}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      Search: "{searchQuery}"
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setCampaignFilter('all');
                    setAmountRangeFilter('all');
                    setDateRangeFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Transactions Table (Desktop) / Cards (Mobile) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500">
                  <tr>
                    <th className="py-3.5 px-4">Ref & ID</th>
                    <th className="py-3.5 px-4">Donor Details</th>
                    <th className="py-3.5 px-4">Campaign / Cause</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDonations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No donation records match the specified filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDonations.map((don) => (
                      <tr key={don.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Ref ID */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 block truncate max-w-[130px]">
                            {don.transactionReference}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {don.donationId || don.id?.slice(0, 10)}
                          </span>
                        </td>

                        {/* Donor Details */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="truncate max-w-[160px]">{don.donorName || 'Well-Wisher'}</span>
                            {don.isAnonymous && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                                Anon
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {maskEmail(don.donorEmail)}
                          </div>
                          {don.donorPan && (
                            <span className="text-[9px] text-blue-700 font-mono font-bold block">
                              PAN: {maskPan(don.donorPan)}
                            </span>
                          )}
                        </td>

                        {/* Campaign */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <span className="font-semibold text-slate-800 line-clamp-1 block">
                            {don.campaignTitle || 'General Trust Appeal'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {don.paymentMethod || 'Direct Bank/UPI'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                          {don.createdAt ? new Date(don.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : '—'}
                          <span className="text-[10px] text-slate-400 block">
                            {don.createdAt ? new Date(don.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-black text-emerald-800 text-sm block">
                            ₹{Number(don.amount || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] font-bold text-blue-700 block">
                            80G Eligible
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border inline-flex items-center gap-1 ${
                            don.paymentStatus === 'verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            don.paymentStatus === 'pending_verification' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            don.paymentStatus === 'refunded' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                            don.paymentStatus === 'cancelled' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                            'bg-rose-50 text-rose-800 border-rose-300'
                          }`}>
                            {don.paymentStatus === 'verified' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {don.paymentStatus === 'pending_verification' && <Clock className="w-3 h-3 text-amber-600" />}
                            {don.paymentStatus === 'refunded' && <RotateCcw className="w-3 h-3 text-purple-600" />}
                            <span>{don.paymentStatus === 'pending_verification' ? 'Pending Scrutiny' : don.paymentStatus}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                          {don.paymentStatus === 'pending_verification' && (
                            <button
                              onClick={() => handleQuickVerify(don)}
                              className="px-2.5 py-1.5 text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer transition-colors shadow-xs"
                              title="1-Click Approve and Issue 80G Receipt"
                            >
                              Verify
                            </button>
                          )}

                          {don.paymentStatus === 'verified' && (
                            <button
                              onClick={() => {
                                setSelectedDonation(don);
                                setIsReceiptModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                              title="View & Download Official 80G Receipt"
                            >
                              80G Receipt
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedDonation(don);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            Details
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredDonations.map((don) => (
                <div key={don.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-xs block">
                        {don.transactionReference}
                      </span>
                      <span className="font-bold text-slate-800 text-sm block">
                        {don.donorName || 'Well-Wisher'}
                      </span>
                    </div>
                    <span className="font-black text-emerald-800 text-base">
                      ₹{Number(don.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1">
                    {don.campaignTitle || 'General Trust Appeal'}
                  </p>

                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      don.paymentStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                      don.paymentStatus === 'pending_verification' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {don.paymentStatus}
                    </span>

                    <div className="flex gap-2">
                      {don.paymentStatus === 'pending_verification' && (
                        <button
                          onClick={() => handleQuickVerify(don)}
                          className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedDonation(don);
                          setIsDetailModalOpen(true);
                        }}
                        className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: UNIQUE DONOR DIRECTORY */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'donors' && (
        <div className="space-y-4" id="donor-directory-section">
          
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registered Patrons & Philanthropic Donors</h3>
                <p className="text-xs text-slate-500">Aggregated profiles based on verified contributions.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              {donorDirectory.length} Unique Benefactors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {donorDirectory.map((d) => (
              <div 
                key={d.key} 
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 hover:border-emerald-400 transition-all cursor-pointer"
                onClick={() => setSelectedDonorProfile(d)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shadow-inner">
                      {d.donorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{d.donorName}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">{maskEmail(d.donorEmail)}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {d.donations.length} gifts
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Raised</span>
                    <p className="font-black text-emerald-800 mt-0.5">
                      ₹{d.verifiedAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Latest Gift</span>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {d.latestDate ? new Date(d.latestDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-xs">
                  <span className="text-[11px] text-blue-700 font-mono font-medium">
                    PAN: {maskPan(d.donorPan)}
                  </span>
                  <button className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: CAMPAIGN-WISE DONATION SUMMARIES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4" id="donor-campaigns-summary">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((c) => {
              const target = Number(c.targetAmount) || 1;
              const raised = Number(c.raisedAmount) || 0;
              const remaining = Math.max(0, target - raised);
              const percent = Math.min(100, Math.round((raised / target) * 100));

              // Compute pending amount for this campaign from donations
              const campPending = donations
                .filter(d => d.campaignId === c.id && d.paymentStatus === 'pending_verification')
                .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

              return (
                <div key={c.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 font-mono">
                        {c.campaignNumber || 'APPEAL'}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1">{c.title}</h4>
                      <p className="text-xs text-slate-500">{c.category}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                      c.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                      c.status === 'completed' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                      'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-emerald-800 font-black">
                        ₹{raised.toLocaleString('en-IN')} Raised ({percent}%)
                      </span>
                      <span className="text-slate-500">
                        Target: ₹{target.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  {/* Matrix metrics */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Verified Donors</span>
                      <p className="font-black text-slate-900 mt-0.5">{c.verifiedDonationsCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-600 font-bold uppercase">Pending Pledges</span>
                      <p className="font-black text-amber-800 mt-0.5">₹{campPending.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Remaining Goal</span>
                      <p className="font-black text-slate-700 mt-0.5">₹{remaining.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setCampaignFilter(c.id || 'all');
                        setActiveTab('transactions');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Filter className="w-3 h-3 text-amber-300" />
                      <span>Filter Transactions</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: PATRON ACCREDITATION INTAKE (Integrated Sub-View) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'applications' && (
        <div className="space-y-4" id="patron-applications-container">
          <AdminDonorApplicationsView />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: MANUAL DONATION BANK TRANSFER SETTINGS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'bank_settings' && (
        <div className="space-y-6" id="manual-donation-bank-settings-tab">
          <AdminManualDonationSettings />
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: DETAILED TRANSACTION INSPECTION & SCRUTINY */}
      {/* ============================================================= */}
      {isDetailModalOpen && selectedDonation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" id="donation-detail-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto flex flex-col">
            
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20 rounded-t-3xl">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <BadgeDollarSign className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Contribution Scrutiny & Verification</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedDonation.donationId}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 text-xs">
              
              {/* Financial Box */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Contributed Amount</span>
                  <div className="text-2xl font-black text-emerald-900">
                    ₹{Number(selectedDonation.amount || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">100% Tax Deductible (Sec 80G)</span>
                </div>

                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border inline-block ${
                    selectedDonation.paymentStatus === 'verified' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    selectedDonation.paymentStatus === 'pending_verification' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    selectedDonation.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                    'bg-rose-100 text-rose-900 border-rose-300'
                  }`}>
                    {selectedDonation.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Donor Profile</span>
                  </h4>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Legal Name:</span>
                      <span className="font-bold text-slate-800">{selectedDonation.donorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-mono text-slate-800">{maskEmail(selectedDonation.donorEmail)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-mono text-slate-800">{maskPhone(selectedDonation.donorPhone)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PAN Number:</span>
                      <span className="font-mono font-bold text-blue-700">{maskPan(selectedDonation.donorPan)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    <span>Transaction Proof & Audit</span>
                  </h4>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">UTR / Reference:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedDonation.transactionReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Mode:</span>
                      <span className="text-slate-800">{selectedDonation.paymentMethod || 'UPI / Bank'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Submitted At:</span>
                      <span className="text-slate-800">{selectedDonation.createdAt ? new Date(selectedDonation.createdAt).toLocaleString() : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Receipt No:</span>
                      <span className="font-mono font-bold text-emerald-800">{selectedDonation.receiptNumber || 'Pending Issuance'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Appeal Cause */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Allocated Campaign / Appeal</span>
                <p className="font-bold text-slate-900 text-sm">{selectedDonation.campaignTitle}</p>
                {selectedDonation.message && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 mt-2 text-slate-600 italic">
                    "{selectedDonation.message}"
                  </div>
                )}
              </div>

              {/* Admin Actions Bar */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selectedDonation.paymentStatus !== 'verified' && (
                    <button
                      onClick={() => handleOpenStatusModal(selectedDonation, 'verified')}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Verify & Issue 80G
                    </button>
                  )}
                  {selectedDonation.paymentStatus !== 'failed' && (
                    <button
                      onClick={() => handleOpenStatusModal(selectedDonation, 'failed')}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Mark Failed
                    </button>
                  )}
                  {selectedDonation.paymentStatus !== 'refunded' && (
                    <button
                      onClick={() => handleOpenStatusModal(selectedDonation, 'refunded')}
                      className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Record Refund
                    </button>
                  )}
                  {selectedDonation.paymentStatus !== 'cancelled' && (
                    <button
                      onClick={() => handleOpenStatusModal(selectedDonation, 'cancelled')}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Cancel Pledge
                    </button>
                  )}
                </div>

                {selectedDonation.paymentStatus === 'verified' && (
                  <button
                    onClick={() => {
                      setIsReceiptModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View 80G Voucher</span>
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: OFFICIAL 80G TAX EXEMPTION RECEIPT VOUCHER */}
      {/* ============================================================= */}
      {isReceiptModalOpen && selectedDonation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" id="official-80g-receipt-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 relative print:p-0 print:border-none print:shadow-none">
            
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Header */}
            <div className="text-center space-y-1.5 border-b-2 border-emerald-800 pb-4">
              <span className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                Official Section 80G Tax Exemption Receipt
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {config.legalName || 'FATIMYAH EDUCATIONAL TRUST'}
              </h2>
              <p className="text-[10px] text-slate-600">
                Regd. Public Trust • 80G URN: <strong className="font-mono text-slate-900">AAATF1234AF20214</strong> • Sec 12A Certified
              </p>
            </div>

            {/* Receipt Metadata */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-sans">Receipt Number:</span>
                <span className="font-bold text-slate-900">{selectedDonation.receiptNumber || 'REC/80G/2026/' + selectedDonation.donationId?.split('-').pop()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-sans">Transaction Ref:</span>
                <span className="text-slate-800">{selectedDonation.transactionReference}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-sans">Date of Credit:</span>
                <span className="text-slate-800">{selectedDonation.verifiedAt ? new Date(selectedDonation.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date(selectedDonation.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-sans">Donor Legal Name:</span>
                <span className="font-bold text-slate-900 font-sans">{selectedDonation.donorName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-sans">Permanent Account No (PAN):</span>
                <span className="font-bold text-blue-700">{maskPan(selectedDonation.donorPan)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Cause / Drive:</span>
                <span className="font-semibold text-slate-800 font-sans truncate max-w-[240px]">{selectedDonation.campaignTitle}</span>
              </div>
            </div>

            {/* Amount Box */}
            <div className="p-4 rounded-2xl bg-emerald-800 text-white flex items-center justify-between shadow-inner">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-200">Amount Received</span>
                <div className="text-2xl font-black">
                  ₹{Number(selectedDonation.amount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right text-[11px] text-emerald-100 font-medium">
                50% Income Tax Exemption<br />
                Under Sec 80G(5)(vi)
              </div>
            </div>

            {/* Statutory Footnote & Digital Signatures */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
              <div>
                <p>Generated electronically by FET Trust System.</p>
                <p>Form 10BD statement of donation will be filed.</p>
              </div>
              <div className="text-right space-y-1">
                <div className="w-24 h-8 border-b border-dashed border-slate-400 mx-auto" />
                <span className="font-bold text-slate-800 block">Authorized Trustee</span>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="pt-2 flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: STATUS CHANGE ACTION MODAL */}
      {/* ============================================================= */}
      {isStatusActionModalOpen && selectedDonation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" id="status-action-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Confirm Status Change: {statusTargetAction.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reference: <strong className="font-mono text-slate-800">{selectedDonation.transactionReference}</strong>
                </p>
              </div>
              <button onClick={() => setIsStatusActionModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Automated Audit & Synchronization:</p>
              <p className="text-[11px] leading-relaxed">
                Updating this donation to <strong className="uppercase">{statusTargetAction}</strong> will atomically recalculate the campaign's raised amount and verified donor count in real time, and log an immutable audit entry.
              </p>
            </div>

            {/* Action Reason Input */}
            {(statusTargetAction === 'refunded' || statusTargetAction === 'cancelled' || statusTargetAction === 'failed') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Reason for {statusTargetAction.toUpperCase()} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank credit mismatch / Beneficiary request"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}

            {/* Admin Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Internal Administrative Scrutiny Notes
              </label>
              <textarea
                rows={3}
                placeholder="Optional notes regarding verification or ledger reconciliation..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleConfirmStatusChange}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmittingAction ? 'Synchronizing Firestore...' : 'Confirm Status Update'}
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => setIsStatusActionModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: DONOR PROFILE & LIFETIME HISTORY */}
      {/* ============================================================= */}
      {selectedDonorProfile && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" id="donor-profile-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative">
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-base shadow-inner">
                  {selectedDonorProfile.donorName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedDonorProfile.donorName}</h3>
                  <p className="text-xs text-slate-500 font-mono">{maskEmail(selectedDonorProfile.donorEmail)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDonorProfile(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Statistics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Verified Gifts</span>
                <p className="text-lg font-black text-emerald-900 mt-0.5">
                  ₹{selectedDonorProfile.verifiedAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Pledges</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {selectedDonorProfile.donations.length}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-blue-800">PAN Record</span>
                <p className="text-xs font-mono font-bold text-blue-900 mt-1">
                  {maskPan(selectedDonorProfile.donorPan)}
                </p>
              </div>
            </div>

            {/* Chronological Donation History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Chronological Contribution Ledger
              </h4>
              <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                {selectedDonorProfile.donations.map((d) => (
                  <div key={d.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800 block">{d.campaignTitle}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {d.transactionReference} • {d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-800 block">
                        ₹{Number(d.amount || 0).toLocaleString('en-IN')}
                      </span>
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${
                        d.paymentStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                        d.paymentStatus === 'pending_verification' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {d.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDonorProfile(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
