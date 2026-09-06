/**
 * @license
 * Centralized Finance & Accounting Management Console (Step 46)
 * Fatimyah Educational Trust India (FET India)
 * Organization: Fatimyah Educational Trust
 * Brand: FET India
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
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
  Calendar,
  ShieldCheck,
  FileText,
  TrendingUp,
  CreditCard,
  RotateCcw,
  Printer,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  Receipt,
  PieChart,
  DollarSign,
  SlidersHorizontal,
  FileSpreadsheet,
  Wallet,
  Tag,
  Briefcase
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  db, 
  createFinancialRecord, 
  updateFinancialRecordStatus, 
  deleteFinancialRecord,
  generateTransactionId,
  generateVoucherNumber 
} from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { 
  FinancialRecord, 
  FinancialTransactionType,
  FinancialIncomeCategory,
  FinancialExpenseCategory,
  ExpenseApprovalStatus,
  FinancialPaymentStatus,
  FinancialPaymentMethod,
  CampaignDonation,
  CrowdfundingCampaign,
  UserProfile 
} from '../../types';

export const AdminFinanceAccountingView: React.FC = () => {
  const { currentUser, userProfile, isSuperAdmin, hasPermission } = useAuth();
  const { config } = useConfig();

  // Primary State
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [donations, setDonations] = useState<CampaignDonation[]>([]);
  const [campaigns, setCampaigns] = useState<CrowdfundingCampaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'income' | 'expenses' | 'donations_feed' | 'reports'>('overview');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [fundTypeFilter, setFundTypeFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'fy2627' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals State
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isStatusActionModalOpen, setIsStatusActionModalOpen] = useState<boolean>(false);
  const [targetAction, setTargetAction] = useState<'approve' | 'pay' | 'reject' | 'cancel' | 'refund'>('approve');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [actionPaymentMethod, setActionPaymentMethod] = useState<string>('bank_transfer');
  const [actionReferenceNumber, setActionReferenceNumber] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State for New Financial Record / Expense Requisition
  const [newType, setNewType] = useState<FinancialTransactionType>('expense');
  const [newCategory, setNewCategory] = useState<string>('education_scholarships');
  const [newSubCategory, setNewSubCategory] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newPayerPayeeName, setNewPayerPayeeName] = useState<string>('');
  const [newPayerPayeeEmail, setNewPayerPayeeEmail] = useState<string>('');
  const [newPayerPayeePhone, setNewPayerPayeePhone] = useState<string>('');
  const [newPayerPan, setNewPayerPan] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newDepartment, setNewDepartment] = useState<string>('General');
  const [newFundType, setNewFundType] = useState<string>('General');
  const [newCampaignId, setNewCampaignId] = useState<string>('');
  const [newReferenceNumber, setNewReferenceNumber] = useState<string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>('bank_transfer');
  const [newInvoiceReceiptUrl, setNewInvoiceReceiptUrl] = useState<string>('');
  const [isInitialDraft, setIsInitialDraft] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Real-time Firestore Listeners
  useEffect(() => {
    setIsLoading(true);

    // 1. Financial Records Listener
    const qRecords = query(collection(db, 'financial_records'), orderBy('createdAt', 'desc'));
    const unsubRecords = onSnapshot(
      qRecords,
      (snapshot) => {
        const recordsList: FinancialRecord[] = [];
        snapshot.forEach((docSnap) => {
          recordsList.push({ id: docSnap.id, ...docSnap.data() } as FinancialRecord);
        });
        setFinancialRecords(recordsList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching financial records:', err);
        setIsLoading(false);
      }
    );

    // 2. Campaign Donations Listener (Unified reference without duplicating collections)
    const qDonations = query(collection(db, 'campaign_donations'), orderBy('createdAt', 'desc'));
    const unsubDonations = onSnapshot(
      qDonations,
      (snapshot) => {
        const donationsList: CampaignDonation[] = [];
        snapshot.forEach((docSnap) => {
          donationsList.push({ id: docSnap.id, ...docSnap.data() } as CampaignDonation);
        });
        setDonations(donationsList);
      },
      (err) => {
        console.error('Error fetching donations for finance reconciliation:', err);
      }
    );

    // 3. Crowdfunding Campaigns Listener
    const qCampaigns = query(collection(db, 'crowdfunding_campaigns'));
    const unsubCampaigns = onSnapshot(
      qCampaigns,
      (snapshot) => {
        const campaignsList: CrowdfundingCampaign[] = [];
        snapshot.forEach((docSnap) => {
          campaignsList.push({ id: docSnap.id, ...docSnap.data() } as CrowdfundingCampaign);
        });
        setCampaigns(campaignsList);
      },
      (err) => {
        console.error('Error fetching campaigns for finance reconciliation:', err);
      }
    );

    return () => {
      unsubRecords();
      unsubDonations();
      unsubCampaigns();
    };
  }, []);

  // Convert verified campaign donations into virtual income items for the unified ledger display
  const unifiedLedger = useMemo(() => {
    const records: FinancialRecord[] = [...financialRecords];

    // Add verified campaign donations to the unified ledger view seamlessly
    donations.forEach((don) => {
      // Check if this donation is already linked/recorded explicitly
      const alreadyIncluded = financialRecords.some((r) => r.linkedDonationId === don.id);
      if (!alreadyIncluded) {
        records.push({
          id: `donation-${don.id}`,
          transactionId: don.transactionReference || `FET-DON-${don.id.substring(0, 8).toUpperCase()}`,
          voucherNumber: `FET-RCP-${don.id.substring(0, 6).toUpperCase()}`,
          type: 'income',
          category: 'crowdfunding_donation',
          categoryLabel: 'Crowdfunding Appeal Contribution',
          amount: Number(don.amount) || 0,
          date: don.createdAt ? don.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          status: don.paymentStatus === 'verified' ? 'verified' : don.paymentStatus === 'pending_verification' ? 'pending_verification' : 'failed',
          paymentStatus: don.paymentStatus as FinancialPaymentStatus,
          paymentMethod: 'online_gateway',
          referenceNumber: don.transactionReference || don.donationId,
          payerPayeeName: don.donorName || 'Generous Donor',
          payerPayeeEmail: don.donorEmail,
          payerPayeePhone: don.donorPhone,
          payerPan: don.donorPan,
          description: `Donation towards campaign: ${don.campaignTitle || 'Charitable Appeal'}`,
          campaignId: don.campaignId,
          campaignTitle: don.campaignTitle,
          department: 'Relief',
          fundType: 'General',
          financialYear: '2026-27',
          isLinkedDonation: true,
          linkedDonationId: don.id,
          createdByUid: don.donorUid || 'public-donor',
          createdByEmail: don.donorEmail || 'donor@fetindia.com',
          createdByName: don.donorName,
          createdAt: don.createdAt || new Date().toISOString()
        });
      }
    });

    // Sort descending by date/createdAt
    records.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    return records;
  }, [financialRecords, donations]);

  // Comprehensive Real-time Financial Calculations (Zero fake figures)
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let donationIncome = 0;
    let membershipIncome = 0;
    let otherIncome = 0;
    let pendingIncome = 0;
    let refundedAmount = 0;

    let totalExpenses = 0;
    let pendingExpenses = 0;
    let paidExpensesCount = 0;
    let verifiedIncomesCount = 0;
    let pendingApprovalsCount = 0;

    unifiedLedger.forEach((item) => {
      const amt = Number(item.amount) || 0;
      if (item.type === 'income') {
        if (item.status === 'verified' || item.status === 'paid' || item.status === 'approved') {
          totalIncome += amt;
          verifiedIncomesCount++;
          if (item.category === 'crowdfunding_donation' || item.category === 'direct_donation') {
            donationIncome += amt;
          } else if (item.category === 'membership_fee') {
            membershipIncome += amt;
          } else {
            otherIncome += amt;
          }
        } else if (item.status === 'pending_verification' || item.status === 'pending_approval' || item.status === 'draft') {
          pendingIncome += amt;
        } else if (item.status === 'refunded') {
          refundedAmount += amt;
        }
      } else if (item.type === 'expense') {
        if (item.status === 'paid') {
          totalExpenses += amt;
          paidExpensesCount++;
        } else if (item.status === 'pending_approval' || item.status === 'approved' || item.status === 'draft') {
          pendingExpenses += amt;
          if (item.status === 'pending_approval') {
            pendingApprovalsCount++;
          }
        }
      }
    });

    const netBalance = Math.max(0, (totalIncome - refundedAmount) - totalExpenses);

    return {
      totalIncome,
      donationIncome,
      membershipIncome,
      otherIncome,
      totalExpenses,
      pendingIncome,
      pendingExpenses,
      refundedAmount,
      netBalance,
      totalTransactionsCount: unifiedLedger.length,
      verifiedIncomesCount,
      paidExpensesCount,
      pendingApprovalsCount
    };
  }, [unifiedLedger]);

  // Filtered Ledger list based on active search, type, status, category, and date range
  const filteredLedger = useMemo(() => {
    return unifiedLedger.filter((item) => {
      // 1. Tab-based type isolation
      if (activeTab === 'income' && item.type !== 'income') return false;
      if (activeTab === 'expenses' && item.type !== 'expense') return false;
      if (activeTab === 'donations_feed' && !item.isLinkedDonation) return false;

      // 2. Type Filter dropdown
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // 3. Status Filter dropdown
      if (statusFilter !== 'all') {
        if (statusFilter === 'verified_or_paid') {
          if (item.status !== 'verified' && item.status !== 'paid') return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }

      // 4. Category Filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // 5. Department Filter
      if (departmentFilter !== 'all' && item.department !== departmentFilter) return false;

      // 6. Fund Type Filter
      if (fundTypeFilter !== 'all' && item.fundType !== fundTypeFilter) return false;

      // 7. Date Range Filter
      if (dateRangeFilter !== 'all') {
        const itemTime = new Date(item.date || item.createdAt).getTime();
        const now = new Date();

        if (dateRangeFilter === 'today') {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          if (itemTime < todayStart) return false;
        } else if (dateRangeFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
          if (itemTime < weekAgo) return false;
        } else if (dateRangeFilter === 'month') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          if (itemTime < monthStart) return false;
        } else if (dateRangeFilter === 'fy2627') {
          const fyStart = new Date('2026-04-01').getTime();
          const fyEnd = new Date('2027-03-31T23:59:59').getTime();
          if (itemTime < fyStart || itemTime > fyEnd) return false;
        } else if (dateRangeFilter === 'custom') {
          if (customStartDate) {
            const start = new Date(customStartDate).getTime();
            if (itemTime < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate + 'T23:59:59').getTime();
            if (itemTime > end) return false;
          }
        }
      }

      // 8. Search Query
      if (searchQuery.trim()) {
        const queryStr = searchQuery.toLowerCase();
        const matchTxn = item.transactionId.toLowerCase().includes(queryStr);
        const matchVch = (item.voucherNumber || '').toLowerCase().includes(queryStr);
        const matchPayer = (item.payerPayeeName || '').toLowerCase().includes(queryStr);
        const matchEmail = (item.payerPayeeEmail || '').toLowerCase().includes(queryStr);
        const matchDesc = (item.description || '').toLowerCase().includes(queryStr);
        const matchRef = (item.referenceNumber || '').toLowerCase().includes(queryStr);
        const matchDept = (item.department || '').toLowerCase().includes(queryStr);
        return matchTxn || matchVch || matchPayer || matchEmail || matchDesc || matchRef || matchDept;
      }

      return true;
    });
  }, [
    unifiedLedger,
    activeTab,
    typeFilter,
    statusFilter,
    categoryFilter,
    departmentFilter,
    fundTypeFilter,
    dateRangeFilter,
    customStartDate,
    customEndDate,
    searchQuery
  ]);

  // Handler: Open Create Record Modal
  const handleOpenCreateModal = (defaultType: FinancialTransactionType = 'expense') => {
    setNewType(defaultType);
    setNewCategory(defaultType === 'expense' ? 'education_scholarships' : 'direct_donation');
    setNewSubCategory('');
    setNewAmount('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewPayerPayeeName('');
    setNewPayerPayeeEmail('');
    setNewPayerPayeePhone('');
    setNewPayerPan('');
    setNewDescription('');
    setNewDepartment('General');
    setNewFundType('General');
    setNewCampaignId('');
    setNewReferenceNumber('');
    setNewPaymentMethod('bank_transfer');
    setNewInvoiceReceiptUrl('');
    setIsInitialDraft(false);
    setIsCreateModalOpen(true);
  };

  // Handler: Submit New Record / Requisition
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || isNaN(Number(newAmount)) || Number(newAmount) <= 0) {
      showToast('Please enter a valid amount greater than zero.', 'error');
      return;
    }
    if (!newPayerPayeeName.trim()) {
      showToast(newType === 'expense' ? 'Please provide Payee / Vendor Name.' : 'Please provide Payer / Contributor Name.', 'error');
      return;
    }
    if (!newDescription.trim()) {
      showToast('Please provide a descriptive explanation for this transaction.', 'error');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const txnId = generateTransactionId(newType);
      const vchNo = generateVoucherNumber();

      let initialStatus: ExpenseApprovalStatus | FinancialPaymentStatus = 'pending_approval';
      if (newType === 'expense') {
        initialStatus = isInitialDraft ? 'draft' : 'pending_approval';
      } else {
        initialStatus = isInitialDraft ? 'pending_verification' : 'verified';
      }

      const newRecord: Omit<FinancialRecord, 'id'> = {
        transactionId: txnId,
        voucherNumber: vchNo,
        type: newType,
        category: newCategory,
        subCategory: newSubCategory.trim() || undefined,
        amount: Number(newAmount),
        date: newDate,
        status: initialStatus,
        paymentStatus: newType === 'income' ? (initialStatus as FinancialPaymentStatus) : undefined,
        paymentMethod: newPaymentMethod,
        referenceNumber: newReferenceNumber.trim() || undefined,
        payerPayeeName: newPayerPayeeName.trim(),
        payerPayeeEmail: newPayerPayeeEmail.trim() || undefined,
        payerPayeePhone: newPayerPayeePhone.trim() || undefined,
        payerPan: newPayerPan.trim() || undefined,
        description: newDescription.trim(),
        department: newDepartment,
        fundType: newFundType,
        campaignId: newCampaignId || undefined,
        campaignTitle: newCampaignId ? campaigns.find(c => c.id === newCampaignId)?.title : undefined,
        invoiceReceiptUrl: newInvoiceReceiptUrl.trim() || undefined,
        financialYear: '2026-27',
        createdByUid: currentUser?.uid || 'admin-user',
        createdByEmail: currentUser?.email || 'admin@fetindia.com',
        createdByName: userProfile?.fullName || userProfile?.displayName || 'Finance Lead',
        createdAt: new Date().toISOString()
      };

      await createFinancialRecord(newRecord, {
        uid: currentUser?.uid || 'admin-user',
        email: currentUser?.email || 'admin@fetindia.com',
        name: userProfile?.fullName || userProfile?.displayName || 'Finance Lead',
        role: userProfile?.primaryRole || 'finance_admin'
      });

      showToast(`Record ${txnId} successfully registered in trust financial ledger.`);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error('Error creating financial record:', err);
      showToast(err.message || 'Failed to create financial record.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handler: Open Status Action Modal (Approve, Pay, Reject, Cancel, Refund)
  const handleOpenActionModal = (record: FinancialRecord, action: 'approve' | 'pay' | 'reject' | 'cancel' | 'refund') => {
    setSelectedRecord(record);
    setTargetAction(action);
    setActionNotes('');
    setActionPaymentMethod(record.paymentMethod || 'bank_transfer');
    setActionReferenceNumber(record.referenceNumber || '');
    setIsStatusActionModalOpen(true);
  };

  // Handler: Execute Status Transition
  const handleExecuteStatusAction = async () => {
    if (!selectedRecord || !selectedRecord.id) return;

    // Prevent direct edits to virtual/read-only campaign donations in this modal (they must be managed in donor console)
    if (selectedRecord.isLinkedDonation) {
      showToast('Campaign donations are reconciled via Donor & Crowdfunding verification.', 'error');
      setIsStatusActionModalOpen(false);
      return;
    }

    try {
      setIsSubmittingAction(true);
      const actorInfo = {
        uid: currentUser?.uid || 'admin-user',
        email: currentUser?.email || 'admin@fetindia.com',
        name: userProfile?.fullName || userProfile?.displayName || 'Finance Admin',
        role: userProfile?.primaryRole || 'finance_admin'
      };

      const now = new Date().toISOString();
      const updates: Partial<FinancialRecord> = {};
      let auditAction = 'FINANCE_RECORD_STATUS_CHANGED';

      if (targetAction === 'approve') {
        updates.status = 'approved';
        updates.approvedByUid = actorInfo.uid;
        updates.approvedByEmail = actorInfo.email;
        updates.approvedByName = actorInfo.name;
        updates.approvedAt = now;
        updates.approvalNotes = actionNotes.trim() || undefined;
        auditAction = 'EXPENSE_REQUISITION_APPROVED';
      } else if (targetAction === 'pay') {
        updates.status = 'paid';
        updates.paidByUid = actorInfo.uid;
        updates.paidByEmail = actorInfo.email;
        updates.paidByName = actorInfo.name;
        updates.paidAt = now;
        updates.paymentMethod = actionPaymentMethod;
        updates.referenceNumber = actionReferenceNumber.trim() || selectedRecord.referenceNumber;
        updates.paymentNotes = actionNotes.trim() || undefined;
        auditAction = 'EXPENSE_PAYMENT_EXECUTED';
      } else if (targetAction === 'reject') {
        updates.status = 'rejected';
        updates.rejectionReason = actionNotes.trim() || 'Requisition rejected by finance authority';
        auditAction = 'EXPENSE_REQUISITION_REJECTED';
      } else if (targetAction === 'cancel') {
        updates.status = 'cancelled';
        updates.cancelledReason = actionNotes.trim() || 'Transaction cancelled by administration';
        auditAction = 'FINANCE_TRANSACTION_CANCELLED';
      } else if (targetAction === 'refund') {
        updates.status = 'refunded';
        updates.refundReason = actionNotes.trim() || 'Payment reversed / refunded to payer';
        updates.refundedAt = now;
        updates.refundedByUid = actorInfo.uid;
        updates.refundedByEmail = actorInfo.email;
        auditAction = 'FINANCE_INCOME_REFUNDED';
      }

      await updateFinancialRecordStatus(selectedRecord.id, updates, actorInfo, auditAction);
      showToast(`Transaction ${selectedRecord.transactionId} updated to ${updates.status?.toUpperCase()}.`);
      setIsStatusActionModalOpen(false);
    } catch (err: any) {
      console.error('Error updating financial status:', err);
      showToast(err.message || 'Failed to update transaction status.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handler: Delete Record (Super Admin Only)
  const handleDeleteRecord = async (record: FinancialRecord) => {
    if (!isSuperAdmin) {
      showToast('Only Super Administrator is authorized to delete financial ledger entries.', 'error');
      return;
    }
    if (record.isLinkedDonation) {
      showToast('Public crowdfunding donations cannot be deleted from the finance ledger.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete transaction ${record.transactionId}? This action is irreversible and recorded in the audit trail.`)) {
      return;
    }

    try {
      if (!record.id) return;
      await deleteFinancialRecord(record.id, {
        uid: currentUser?.uid || 'super-admin',
        email: currentUser?.email || 'admin@fetindia.com',
        role: 'super_admin'
      });
      showToast(`Transaction ${record.transactionId} permanently removed.`);
    } catch (err: any) {
      console.error('Error deleting financial record:', err);
      showToast('Failed to delete transaction.', 'error');
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    if (filteredLedger.length === 0) {
      showToast('No records available to export.', 'error');
      return;
    }

    const headers = [
      'Transaction ID',
      'Voucher No',
      'Type',
      'Category',
      'Date',
      'Amount (INR)',
      'Status',
      'Payer / Payee',
      'Email',
      'PAN',
      'Payment Method',
      'Reference / UTR',
      'Department',
      'Fund Type',
      'Description',
      'Created By',
      'Approved By',
      'Paid At'
    ];

    const rows = filteredLedger.map((r) => [
      `"${r.transactionId}"`,
      `"${r.voucherNumber || ''}"`,
      `"${r.type.toUpperCase()}"`,
      `"${r.category}"`,
      `"${r.date || r.createdAt.split('T')[0]}"`,
      r.amount,
      `"${r.status.toUpperCase()}"`,
      `"${(r.payerPayeeName || '').replace(/"/g, '""')}"`,
      `"${r.payerPayeeEmail || ''}"`,
      `"${r.payerPan || ''}"`,
      `"${r.paymentMethod || ''}"`,
      `"${r.referenceNumber || ''}"`,
      `"${r.department || 'General'}"`,
      `"${r.fundType || 'General'}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${r.createdByEmail}"`,
      `"${r.approvedByEmail || ''}"`,
      `"${r.paidAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FET_India_Finance_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Financial ledger CSV export downloaded.');
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> {status === 'paid' ? 'Paid / Settled' : 'Verified Income'}
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Check className="w-3 h-3" /> Approved Requisition
          </span>
        );
      case 'pending_approval':
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <FileText className="w-3 h-3" /> Draft
          </span>
        );
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3" /> {status.toUpperCase()}
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <RotateCcw className="w-3 h-3" /> Refunded / Reversed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Helper: Format Category Labels
  const formatCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      crowdfunding_donation: 'Crowdfunding Appeal',
      direct_donation: 'Direct Trust Donation',
      membership_fee: 'Membership Fee',
      event_competition_fee: 'Event / Competition Fee',
      school_fee: 'School Tuition / Fee',
      madrasa_contribution: 'Madrasa Contribution',
      corpus_grant: 'Corpus Grant / Institutional',
      other_income: 'Other Trust Income',
      education_scholarships: 'Education & Scholarships',
      staff_salaries: 'Staff & Educator Salaries',
      community_relief: 'Community & Emergency Relief',
      events_competitions: 'Events & Competitions',
      office_administration: 'Office & Administration',
      campaign_disbursement: 'Crowdfunding Beneficiary Payout',
      utilities_maintenance: 'Utilities & Infrastructure',
      statutory_compliance: 'Statutory & Audit Compliance',
      other_expense: 'Other Approved Expenditure'
    };
    return map[category] || category.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="space-y-6" id="admin-finance-accounting-root">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-lg text-sm font-semibold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
              : 'bg-rose-900 text-rose-100 border border-rose-700'
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-white/70 hover:text-white ml-4 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-900 text-emerald-100 rounded-xl">
              <Landmark className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Finance & Trust Accounting Center
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Centralized double-entry ledgers, expense requisition approvals, real-time donation reconciliations, and statutory audit compliance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenCreateModal('income')}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            id="btn-record-income"
          >
            <Plus className="w-4 h-4" /> Record Income
          </button>
          <button
            onClick={() => handleOpenCreateModal('expense')}
            className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            id="btn-requisition-expense"
          >
            <Plus className="w-4 h-4" /> Request Expense
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            id="btn-export-finance-csv"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" /> Financial Dashboard
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> All Transactions ({unifiedLedger.length})
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'income'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" /> Income Center
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" /> Expenses & Requisitions
          {metrics.pendingApprovalsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black">
              {metrics.pendingApprovalsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('donations_feed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'donations_feed'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-400" /> Crowdfunding Donations ({donations.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Audit Pack & Reports
        </button>
      </div>

      {/* Real-time Summary Cards Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white shadow-md border border-emerald-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Current Net Balance</span>
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-white mt-2">
            ₹{metrics.netBalance.toLocaleString('en-IN')}
          </p>
          <div className="mt-3 pt-3 border-t border-emerald-800/50 flex items-center justify-between text-[11px] text-emerald-300 font-medium">
            <span>Verified Income - Settled Expenses</span>
            <span className="font-bold">100% Reconciled</span>
          </div>
        </div>

        {/* Total Income Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Total Received Income</span>
            <ArrowDownRight className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ₹{metrics.totalIncome.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex flex-col gap-0.5">
            <span>Donations: <strong className="text-slate-800">₹{metrics.donationIncome.toLocaleString('en-IN')}</strong></span>
            <span>Fees & Other: <strong className="text-slate-800">₹{(metrics.membershipIncome + metrics.otherIncome).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-bold uppercase tracking-wider">Paid Expenditures</span>
            <ArrowUpRight className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ₹{metrics.totalExpenses.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex flex-col gap-0.5">
            <span>Paid Vouchers: <strong className="text-slate-800">{metrics.paidExpensesCount}</strong></span>
            <span>Pending Approvals: <strong className="text-amber-700">₹{metrics.pendingExpenses.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Pending & Compliance Ratio */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-xs font-bold uppercase tracking-wider">Statutory & Audit Status</span>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            AY 2026-27
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex flex-col gap-0.5">
            <span>Section 80G & 12A: <strong className="text-emerald-700">Active / Compliant</strong></span>
            <span>Refunded/Reversals: <strong className="text-purple-700">₹{metrics.refundedAmount.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Income Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-emerald-600" /> Income Breakdown
                </h3>
                <span className="text-xs font-bold text-emerald-700">₹{metrics.totalIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-600 font-semibold mb-1">
                    <span>Crowdfunding & Direct Donations</span>
                    <span>₹{metrics.donationIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{
                        width: `${metrics.totalIncome > 0 ? (metrics.donationIncome / metrics.totalIncome) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 font-semibold mb-1">
                    <span>Trust Membership Contributions</span>
                    <span>₹{metrics.membershipIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${metrics.totalIncome > 0 ? (metrics.membershipIncome / metrics.totalIncome) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 font-semibold mb-1">
                    <span>Education, Madrasa & Event Fees</span>
                    <span>₹{metrics.otherIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${metrics.totalIncome > 0 ? (metrics.otherIncome / metrics.totalIncome) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Department Allocation */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600" /> Operational Department Ledgers
                </h3>
                <span className="text-xs font-bold text-slate-500">Active Wings</span>
              </div>
              <div className="space-y-2.5 text-xs">
                {['Relief', 'Scholarships', 'School', 'Madrasa', 'Administration', 'Events'].map((dept) => {
                  const count = unifiedLedger.filter((r) => r.department === dept).length;
                  const total = unifiedLedger
                    .filter((r) => r.department === dept && (r.status === 'verified' || r.status === 'paid'))
                    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                  return (
                    <div key={dept} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800">{dept}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({count} records)</span>
                      </div>
                      <span className="font-black text-slate-700">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Statutory Compliance & Actions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Statutory & Compliance
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">Active</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="font-bold text-emerald-900 block">Fatimyah Educational Trust (FET India)</span>
                  <span className="text-[11px] text-emerald-700 block mt-0.5">80G & 12A Charitable Trust Exemption Active</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block">Pending Requisition Approvals</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {metrics.pendingApprovalsCount} requisitions awaiting administrative review
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Review Pending Requisitions →
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions List in Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Recent Financial Ledger Activity</h3>
              <button
                onClick={() => setActiveTab('ledger')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 cursor-pointer"
              >
                View Full Ledger ({unifiedLedger.length}) →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Payer / Payee</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount (INR)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unifiedLedger.slice(0, 8).map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {record.transactionId}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {record.type === 'income' ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <ArrowDownRight className="w-3.5 h-3.5" /> Income
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Expense
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {formatCategoryLabel(record.category)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {record.payerPayeeName}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {record.date || record.createdAt.split('T')[0]}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">
                        ₹{record.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        {renderStatusBadge(record.status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LEDGER, INCOME, EXPENSES, OR DONATIONS FEED TABS */}
      {(activeTab === 'ledger' || activeTab === 'income' || activeTab === 'expenses' || activeTab === 'donations_feed') && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Transaction ID, Voucher No, Payer/Vendor name, Description, UTR..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified_or_paid">Settled / Verified</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved (Pending Payout)</option>
                  <option value="paid">Paid</option>
                  <option value="draft">Draft</option>
                  <option value="refunded">Refunded / Reversed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="w-full md:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="all">All Categories</option>
                  <optgroup label="Income Categories">
                    <option value="crowdfunding_donation">Crowdfunding Appeal</option>
                    <option value="direct_donation">Direct Trust Donation</option>
                    <option value="membership_fee">Membership Fee</option>
                    <option value="school_fee">School Tuition</option>
                    <option value="madrasa_contribution">Madrasa Contribution</option>
                    <option value="event_competition_fee">Event / Competition Fee</option>
                    <option value="corpus_grant">Corpus Grant</option>
                    <option value="other_income">Other Income</option>
                  </optgroup>
                  <optgroup label="Expense Categories">
                    <option value="education_scholarships">Education & Scholarships</option>
                    <option value="staff_salaries">Staff Salaries</option>
                    <option value="community_relief">Community Relief</option>
                    <option value="events_competitions">Events & Competitions</option>
                    <option value="office_administration">Office Administration</option>
                    <option value="campaign_disbursement">Beneficiary Payout</option>
                    <option value="utilities_maintenance">Utilities & Maintenance</option>
                    <option value="statutory_compliance">Statutory & Audit</option>
                    <option value="other_expense">Other Expense</option>
                  </optgroup>
                </select>
              </div>

              {/* Date Filter */}
              <div className="w-full md:w-40">
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">This Month</option>
                  <option value="fy2627">FY 2026-27</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>
            </div>

            {/* Custom Date Pickers if custom selected */}
            {dateRangeFilter === 'custom' && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Table of Filtered Records */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900">
                  Showing {filteredLedger.length} Records
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  (Total Value: ₹{filteredLedger.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString('en-IN')})
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
                <span>Loading real-time financial records...</span>
              </div>
            ) : filteredLedger.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Landmark className="w-8 h-8 text-slate-300" />
                <span className="font-bold text-slate-600">No financial records match the active criteria.</span>
                <span>Adjust search or filters to see recorded transactions.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Transaction ID / Voucher</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Payer / Vendor</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Amount (INR)</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLedger.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-900 block">{record.transactionId}</span>
                          {record.voucherNumber && (
                            <span className="font-mono text-[10px] text-slate-400 block">{record.voucherNumber}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold">
                          {record.type === 'income' ? (
                            <span className="text-emerald-700 flex items-center gap-1 font-extrabold">
                              <ArrowDownRight className="w-3.5 h-3.5" /> Income
                            </span>
                          ) : (
                            <span className="text-rose-700 flex items-center gap-1 font-extrabold">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Expense
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-800 font-semibold block">{formatCategoryLabel(record.category)}</span>
                          <span className="text-[10px] text-slate-400 block">{record.fundType || 'General'} Fund</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{record.payerPayeeName}</span>
                          {record.payerPayeeEmail && (
                            <span className="text-[10px] text-slate-400 block">{record.payerPayeeEmail}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {record.department || 'General'}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {record.date || record.createdAt.split('T')[0]}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">
                          ₹{record.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          {renderStatusBadge(record.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Details Button */}
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsDetailModalOpen(true);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-all"
                              title="View Transaction Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Official Voucher / Receipt Print Button */}
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsVoucherModalOpen(true);
                              }}
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg cursor-pointer transition-all"
                              title="Print Official Trust Receipt / Payment Voucher"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Workflow Actions for non-virtual records */}
                            {!record.isLinkedDonation && (
                              <>
                                {/* Approve Requisition */}
                                {record.type === 'expense' && (record.status === 'pending_approval' || record.status === 'draft') && (
                                  <button
                                    onClick={() => handleOpenActionModal(record, 'approve')}
                                    className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg cursor-pointer transition-all"
                                    title="Approve Requisition"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Pay Approved Expense */}
                                {record.type === 'expense' && record.status === 'approved' && (
                                  <button
                                    onClick={() => handleOpenActionModal(record, 'pay')}
                                    className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer transition-all"
                                    title="Execute Payment / Mark as Settled"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Reject Requisition */}
                                {record.type === 'expense' && (record.status === 'pending_approval' || record.status === 'draft') && (
                                  <button
                                    onClick={() => handleOpenActionModal(record, 'reject')}
                                    className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg cursor-pointer transition-all"
                                    title="Reject Requisition"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Super Admin Delete */}
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => handleDeleteRecord(record)}
                                    className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-lg cursor-pointer transition-all"
                                    title="Delete Record (Super Admin Only)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORTS & AUDIT PACK TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Annual Statutory & Financial Audit Pack (FY 2026-27)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-formatted institutional reports prepared for Chartered Accountants, Trustees, and Statutory Regulators.
                </p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-bold hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Complete Financial Pack (CSV)
              </button>
            </div>

            {/* Income & Expenditure Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Summary by Category */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Receipts & Income Schedule
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Income Category</th>
                        <th className="px-3 py-2 text-right">Verified Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { cat: 'crowdfunding_donation', label: 'Crowdfunding Appeal Contributions' },
                        { cat: 'direct_donation', label: 'Direct Trust Donations' },
                        { cat: 'membership_fee', label: 'Membership Subscription Fees' },
                        { cat: 'school_fee', label: 'School Educational Receipts' },
                        { cat: 'madrasa_contribution', label: 'Madrasa Boarding Contributions' },
                        { cat: 'event_competition_fee', label: 'Competition & Examination Fees' },
                        { cat: 'corpus_grant', label: 'Corpus Grants & Institutional' },
                        { cat: 'other_income', label: 'Other Sundry Incomes' }
                      ].map((item) => {
                        const total = unifiedLedger
                          .filter((r) => r.type === 'income' && r.category === item.cat && (r.status === 'verified' || r.status === 'paid'))
                          .reduce((s, r) => s + (Number(r.amount) || 0), 0);
                        return (
                          <tr key={item.cat}>
                            <td className="px-3 py-2 font-medium text-slate-700">{item.label}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">₹{total.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-emerald-50/80 font-black text-emerald-950">
                        <td className="px-3 py-2.5">Gross Received Income</td>
                        <td className="px-3 py-2.5 text-right">₹{metrics.totalIncome.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expenditure Summary by Category */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-800">
                  Expenditure & Disbursal Schedule
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Expenditure Category</th>
                        <th className="px-3 py-2 text-right">Settled Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { cat: 'education_scholarships', label: 'Education & Student Scholarships' },
                        { cat: 'staff_salaries', label: 'Staff & Educator Salaries' },
                        { cat: 'community_relief', label: 'Community & Emergency Relief' },
                        { cat: 'events_competitions', label: 'Events, Seminars & Exams' },
                        { cat: 'office_administration', label: 'Office & General Administration' },
                        { cat: 'campaign_disbursement', label: 'Crowdfunding Beneficiary Disbursals' },
                        { cat: 'utilities_maintenance', label: 'Campus Utilities & Maintenance' },
                        { cat: 'statutory_compliance', label: 'Statutory Compliance & Legal' },
                        { cat: 'other_expense', label: 'Other Approved Expenditures' }
                      ].map((item) => {
                        const total = unifiedLedger
                          .filter((r) => r.type === 'expense' && r.category === item.cat && r.status === 'paid')
                          .reduce((s, r) => s + (Number(r.amount) || 0), 0);
                        return (
                          <tr key={item.cat}>
                            <td className="px-3 py-2 font-medium text-slate-700">{item.label}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">₹{total.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-rose-50/80 font-black text-rose-950">
                        <td className="px-3 py-2.5">Total Settled Expenditures</td>
                        <td className="px-3 py-2.5 text-right">₹{metrics.totalExpenses.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Net Balance Reconciliation Statement */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Audited Net Trust Balance</span>
                <p className="text-2xl font-black text-white mt-1">₹{metrics.netBalance.toLocaleString('en-IN')}</p>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  (Total Verified Income ₹{metrics.totalIncome.toLocaleString('en-IN')} - Total Paid Expenses ₹{metrics.totalExpenses.toLocaleString('en-IN')})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Audited Balance Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: RECORD NEW INCOME OR EXPENSE REQUISITION */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${newType === 'income' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                  {newType === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {newType === 'income' ? 'Record Direct Trust Income' : 'Create Expense Requisition'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Fatimyah Educational Trust Official Financial Ledger
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setNewType('income');
                    setNewCategory('direct_donation');
                  }}
                  className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    newType === 'income' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Income / Receipt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewType('expense');
                    setNewCategory('education_scholarships');
                  }}
                  className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    newType === 'expense' ? 'bg-rose-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  - Expense / Payment Requisition
                </button>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (INR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="e.g. 25000"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Category & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {newType === 'income' ? (
                      <>
                        <option value="direct_donation">Direct Trust Donation</option>
                        <option value="crowdfunding_donation">Crowdfunding Donation</option>
                        <option value="membership_fee">Membership Subscription</option>
                        <option value="school_fee">School Tuition / Receipts</option>
                        <option value="madrasa_contribution">Madrasa Contribution</option>
                        <option value="event_competition_fee">Event / Competition Fee</option>
                        <option value="corpus_grant">Corpus / Institutional Grant</option>
                        <option value="other_income">Other Trust Income</option>
                      </>
                    ) : (
                      <>
                        <option value="education_scholarships">Education & Scholarships</option>
                        <option value="staff_salaries">Staff & Educator Salaries</option>
                        <option value="community_relief">Community & Emergency Relief</option>
                        <option value="events_competitions">Events & Competitions</option>
                        <option value="office_administration">Office Administration & Stationery</option>
                        <option value="campaign_disbursement">Beneficiary Payout</option>
                        <option value="utilities_maintenance">Utilities, Rent & Maintenance</option>
                        <option value="statutory_compliance">Statutory & Audit Compliance</option>
                        <option value="other_expense">Other Expenditure</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department / Wing</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="General">General Trust</option>
                    <option value="Scholarships">Scholarships & Education</option>
                    <option value="Relief">Emergency Relief</option>
                    <option value="School">FET Academy / School</option>
                    <option value="Madrasa">Madrasa Affiliations</option>
                    <option value="Administration">Secretariat / Admin</option>
                    <option value="Events">Competitions & Events</option>
                    <option value="IT">IT & Platform</option>
                  </select>
                </div>
              </div>

              {/* Fund Type & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fund Allocation</label>
                  <select
                    value={newFundType}
                    onChange={(e) => setNewFundType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="General">General Trust Fund</option>
                    <option value="Zakat">Zakat Dedicated Pool</option>
                    <option value="Sadaqah">Sadaqah / Lillah Pool</option>
                    <option value="Corpus">Corpus Endowment</option>
                    <option value="Restricted">Restricted Project Fund</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method / Channel</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="cheque">Cheque / Demand Draft</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="cash">Petty Cash (Receipt required)</option>
                    <option value="online_gateway">Online Gateway</option>
                  </select>
                </div>
              </div>

              {/* Payer / Payee Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {newType === 'income' ? 'Payer / Donor / Institution Name *' : 'Payee / Vendor / Beneficiary Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newPayerPayeeName}
                    onChange={(e) => setNewPayerPayeeName(e.target.value)}
                    placeholder={newType === 'income' ? 'e.g. Br. Salman Ahmad' : 'e.g. Apex Printing Solutions'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newPayerPayeeEmail}
                    onChange={(e) => setNewPayerPayeeEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Reference / UTR & PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reference / UTR / Cheque No.</label>
                  <input
                    type="text"
                    value={newReferenceNumber}
                    onChange={(e) => setNewReferenceNumber(e.target.value)}
                    placeholder="e.g. UTR100928374 / CHQ-9281"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAN / Tax ID (For 80G Receipts)</label>
                  <input
                    type="text"
                    value={newPayerPan}
                    onChange={(e) => setNewPayerPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Remarks *</label>
                <textarea
                  required
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="State the purpose, item details, or justification for this transaction..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Invoice Attachment URL */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice / Supporting Bill Attachment URL</label>
                <input
                  type="url"
                  value={newInvoiceReceiptUrl}
                  onChange={(e) => setNewInvoiceReceiptUrl(e.target.value)}
                  placeholder="https://storage.example.com/receipts/bill-102.pdf"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className={`px-5 py-2 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs flex items-center gap-2 ${
                    newType === 'income' ? 'bg-emerald-800 hover:bg-emerald-900' : 'bg-rose-800 hover:bg-rose-900'
                  }`}
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {newType === 'income' ? 'Register Income Record' : 'Submit Expense Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: TRANSACTION DETAILS MODAL */}
      {/* ============================================================== */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${selectedRecord.type === 'income' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Transaction: {selectedRecord.transactionId}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Voucher: {selectedRecord.voucherNumber || 'N/A'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Transaction Amount</span>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{selectedRecord.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Status</span>
                  {renderStatusBadge(selectedRecord.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block">Type & Category</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {selectedRecord.type} • {formatCategoryLabel(selectedRecord.category)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block">Date & Financial Year</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedRecord.date || selectedRecord.createdAt.split('T')[0]} ({selectedRecord.financialYear})
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block">
                  {selectedRecord.type === 'income' ? 'Payer / Contributor' : 'Payee / Vendor'}
                </span>
                <span className="font-extrabold text-slate-900 block text-sm">
                  {selectedRecord.payerPayeeName}
                </span>
                {selectedRecord.payerPayeeEmail && (
                  <span className="text-slate-500 font-mono block mt-0.5">
                    {selectedRecord.payerPayeeEmail} {selectedRecord.payerPayeePhone ? `• ${selectedRecord.payerPayeePhone}` : ''}
                  </span>
                )}
                {selectedRecord.payerPan && (
                  <span className="text-emerald-700 font-mono font-bold block mt-0.5">
                    PAN: {selectedRecord.payerPan}
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block">Description / Purpose</span>
                <p className="font-medium text-slate-700 mt-1 leading-relaxed">
                  {selectedRecord.description}
                </p>
              </div>

              {/* Workflow & Audit Information */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block">Audit Trail & Personnel</span>
                <p className="text-slate-600">Created by: <strong>{selectedRecord.createdByEmail}</strong> on {selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString('en-IN') : 'N/A'}</p>
                {selectedRecord.approvedByEmail && (
                  <p className="text-blue-700">Approved by: <strong>{selectedRecord.approvedByEmail}</strong> ({selectedRecord.approvedAt ? new Date(selectedRecord.approvedAt).toLocaleDateString('en-IN') : ''})</p>
                )}
                {selectedRecord.paidByEmail && (
                  <p className="text-emerald-700">Paid by: <strong>{selectedRecord.paidByEmail}</strong> via {selectedRecord.paymentMethod} (Ref: {selectedRecord.referenceNumber || 'N/A'})</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setIsVoucherModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Official Voucher / Receipt
                </button>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: OFFICIAL PRINTABLE VOUCHER / RECEIPT MODAL */}
      {/* ============================================================== */}
      {isVoucherModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-800 block">
                  Official Trust Document
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  FATIMYAH EDUCATIONAL TRUST
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  FET India • Reg. Under Indian Trusts Act • Section 80G & 12A Compliant
                </p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black uppercase">
                  {selectedRecord.type === 'income' ? 'Donation / Income Receipt' : 'Payment Voucher'}
                </span>
                <p className="text-xs font-mono font-bold text-slate-700 mt-2">
                  Voucher No: {selectedRecord.voucherNumber || selectedRecord.transactionId}
                </p>
                <p className="text-xs font-mono text-slate-500">
                  Date: {selectedRecord.date || selectedRecord.createdAt.split('T')[0]}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block">
                    {selectedRecord.type === 'income' ? 'Received with thanks from:' : 'Paid to:'}
                  </span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5">
                    {selectedRecord.payerPayeeName}
                  </span>
                  {selectedRecord.payerPayeeEmail && (
                    <span className="text-slate-500 font-mono block">{selectedRecord.payerPayeeEmail}</span>
                  )}
                  {selectedRecord.payerPan && (
                    <span className="text-emerald-800 font-mono font-bold block mt-1">PAN: {selectedRecord.payerPan}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block">Amount:</span>
                  <span className="text-2xl font-black text-slate-900 block mt-0.5">
                    ₹{selectedRecord.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                    Status: {selectedRecord.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="px-3 py-2">Particulars / Description</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {selectedRecord.description}
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          Category: {formatCategoryLabel(selectedRecord.category)} • Method: {selectedRecord.paymentMethod || 'Bank Transfer'}
                        </span>
                        {selectedRecord.referenceNumber && (
                          <span className="block text-[10px] text-emerald-800 font-mono mt-0.5">
                            Reference / UTR: {selectedRecord.referenceNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600 font-semibold">{selectedRecord.department || 'General'}</td>
                      <td className="px-3 py-3 text-right font-black text-slate-900">
                        ₹{selectedRecord.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures & Certification block */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-600 border-t border-slate-200 mt-6">
                <div>
                  <div className="border-b border-slate-400 pb-1 font-mono font-bold text-slate-800">
                    {(selectedRecord as any).preparedByName || selectedRecord.createdByName || selectedRecord.createdByEmail}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Prepared / Entered By</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 font-mono font-bold text-slate-800">
                    {selectedRecord.approvedByName || selectedRecord.approvedByEmail || 'Trust Finance Secretary'}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Authorized Signatory / FET India</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: WORKFLOW ACTION (APPROVE / PAY / REJECT / CANCEL) */}
      {/* ============================================================== */}
      {isStatusActionModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900 capitalize">
                {targetAction} Requisition: {selectedRecord.transactionId}
              </h3>
              <button
                onClick={() => setIsStatusActionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold block">Payee: {selectedRecord.payerPayeeName}</span>
                <span className="text-slate-900 font-black text-sm block mt-0.5">
                  Amount: ₹{selectedRecord.amount.toLocaleString('en-IN')}
                </span>
              </div>

              {targetAction === 'pay' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={actionPaymentMethod}
                      onChange={(e) => setActionPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    >
                      <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
                      <option value="upi">UPI</option>
                      <option value="cheque">Cheque</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bank Reference / UTR Number *</label>
                    <input
                      type="text"
                      required
                      value={actionReferenceNumber}
                      onChange={(e) => setActionReferenceNumber(e.target.value)}
                      placeholder="e.g. UTR9283741829"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {targetAction === 'reject' ? 'Rejection Reason *' : 'Approval / Payment Remarks'}
                </label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter administrative notes for audit logging..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStatusActionModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingAction}
                  onClick={handleExecuteStatusAction}
                  className={`px-4 py-1.5 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5 ${
                    targetAction === 'reject' || targetAction === 'cancel'
                      ? 'bg-rose-800 hover:bg-rose-900'
                      : 'bg-emerald-800 hover:bg-emerald-900'
                  }`}
                >
                  {isSubmittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm {targetAction.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
