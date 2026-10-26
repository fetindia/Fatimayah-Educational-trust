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
  Briefcase,
  ExternalLink,
  Lock,
  Scale,
  History,
  UserCheck,
  Send,
  FileCheck,
  Target,
  AlertTriangle,
  Edit3,
  Calculator,
  TrendingDown,
  Layers,
  Link2,
  EyeOff,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { FeeManagementView } from './fees/FeeManagementView';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  db, 
  createFinancialRecord, 
  updateFinancialRecordStatus, 
  deleteFinancialRecord,
  generateTransactionId,
  generateVoucherNumber,
  createFinanceBudget,
  updateFinanceBudget,
  deleteFinanceBudget,
  createFinanceBankAccount,
  updateFinanceBankAccount,
  deleteFinanceBankAccount,
  matchFinancialRecordToBank,
  updateFinancialRecordReconciliationStatus
} from '../../lib/firebase';
import { 
  createAccountingAdjustmentEntry,
  generateFinanceBudgetId,
  generateFinanceBankAccountId,
  calculateBudgetUtilization,
  BudgetUtilizationResult,
  calculateBankReconciliationSummary,
  BankReconciliationSummary,
  getCurrentFinancialYear
} from '../../lib/financeFoundation';
import { 
  canCreateExpense,
  canVerifyExpense,
  canApproveExpense,
  canProcessPayment,
  canRecordIncome,
  canPostAccounting,
  canManageBudget,
  canViewBudget,
  canApproveBudget,
  canManageBankAccounts,
  canPerformBankReconciliation,
  canViewBankManagement
} from '../../lib/rbac';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { 
  FinancialRecord, 
  FinancialTransactionType,
  FinancialIncomeCategory,
  FinancialExpenseCategory,
  ExpenseApprovalStatus,
  ExpenseApprovalStep,
  FinancialOrgUnit,
  FinancialPaymentStatus,
  FinancialPaymentMethod,
  CampaignDonation,
  CrowdfundingCampaign,
  FinanceBudget,
  FinanceBankAccount,
  BankAccountType,
  BankReconciliationStatus,
  BankTransactionMatchPayload,
  UserProfile 
} from '../../types';

export type FinanceActionType = 
  | 'submit'
  | 'department_approve'
  | 'finance_verify'
  | 'trust_approve'
  | 'approve' 
  | 'pay' 
  | 'account'
  | 'reject' 
  | 'cancel' 
  | 'refund';

export const AdminFinanceAccountingView: React.FC = () => {
  const { currentUser, userProfile, isSuperAdmin, hasPermission } = useAuth();
  const { config } = useConfig();

  // Granular Finance RBAC Capabilities
  const canUserCreateExpense = canCreateExpense(userProfile, isSuperAdmin);
  const canUserVerifyExpense = canVerifyExpense(userProfile, isSuperAdmin);
  const canUserApproveExpense = canApproveExpense(userProfile, isSuperAdmin);
  const canUserProcessPayment = canProcessPayment(userProfile, isSuperAdmin);
  const canUserRecordIncome = canRecordIncome(userProfile, isSuperAdmin);
  const canUserPostAccounting = canPostAccounting(userProfile, isSuperAdmin);
  const canUserManageBudget = canManageBudget(userProfile, isSuperAdmin);
  const canUserViewBudget = canViewBudget(userProfile, isSuperAdmin);
  const canUserApproveBudget = canApproveBudget(userProfile, isSuperAdmin);
  const canUserManageBank = canManageBankAccounts(userProfile, isSuperAdmin);
  const canUserReconcile = canPerformBankReconciliation(userProfile, isSuperAdmin);
  const canUserViewBank = canViewBankManagement(userProfile, isSuperAdmin);

  // Primary State
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [donations, setDonations] = useState<CampaignDonation[]>([]);
  const [campaigns, setCampaigns] = useState<CrowdfundingCampaign[]>([]);
  const [budgets, setBudgets] = useState<FinanceBudget[]>([]);
  const [bankAccounts, setBankAccounts] = useState<FinanceBankAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'income' | 'expenses' | 'donations_feed' | 'budgets' | 'banking' | 'fees' | 'reports'>('overview');

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

  // Quick Tab Sub-Filters
  const [expenseWorkflowFilter, setExpenseWorkflowFilter] = useState<'all' | 'pending' | 'department_review' | 'finance_review' | 'trust_approval' | 'approved' | 'paid' | 'accounted' | 'draft'>('all');
  const [incomeCategoryQuickFilter, setIncomeCategoryQuickFilter] = useState<'all' | 'donations' | 'memberships' | 'fees' | 'grants' | 'other'>('all');
  const [budgetYearFilter, setBudgetYearFilter] = useState<string>('all');
  const [budgetDeptFilter, setBudgetDeptFilter] = useState<string>('all');
  const [budgetStatusFilter, setBudgetStatusFilter] = useState<string>('all');

  // Modals State
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isStatusActionModalOpen, setIsStatusActionModalOpen] = useState<boolean>(false);
  const [targetAction, setTargetAction] = useState<FinanceActionType>('approve');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [actionPaymentMethod, setActionPaymentMethod] = useState<string>('bank_transfer');
  const [actionReferenceNumber, setActionReferenceNumber] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Budget Management Modal States (Task 4)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<FinanceBudget | null>(null);
  const [budgetName, setBudgetName] = useState<string>('');
  const [budgetFY, setBudgetFY] = useState<string>(getCurrentFinancialYear());
  const [budgetDept, setBudgetDept] = useState<string>('Scholarships');
  const [budgetCategory, setBudgetCategory] = useState<string>('education_scholarships');
  const [budgetOrgUnit, setBudgetOrgUnit] = useState<FinancialOrgUnit | string>('Trust Head Office');
  const [budgetFundType, setBudgetFundType] = useState<string>('General');
  const [budgetAmount, setBudgetAmount] = useState<string>('');
  const [budgetStatus, setBudgetStatus] = useState<'draft' | 'approved' | 'active'>('active');
  const [budgetNotes, setBudgetNotes] = useState<string>('');
  const [isSubmittingBudget, setIsSubmittingBudget] = useState<boolean>(false);

  // Budget Expense Breakdown Modal State
  const [selectedBudgetResult, setSelectedBudgetResult] = useState<BudgetUtilizationResult | null>(null);
  const [isBudgetBreakdownOpen, setIsBudgetBreakdownOpen] = useState<boolean>(false);

  // Accounting Adjustment Modal State (Immutability Principle - Chapter 15 SRS)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState<boolean>(false);
  const [adjustmentRecord, setAdjustmentRecord] = useState<FinancialRecord | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'reversal' | 'correction' | 'credit_note' | 'debit_note'>('reversal');
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState<boolean>(false);

  // Bank Management State (Task 5)
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('all');
  const [selectedReconStatus, setSelectedReconStatus] = useState<string>('all');
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');
  const [isMaskedAccountNumbers, setIsMaskedAccountNumbers] = useState<boolean>(true);
  
  // Bank Account Modal States (Modal 8)
  const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState<boolean>(false);
  const [editingBankAccount, setEditingBankAccount] = useState<FinanceBankAccount | null>(null);
  const [bankAccName, setBankAccName] = useState<string>('');
  const [bankName, setBankName] = useState<string>('State Bank of India');
  const [bankAccNumber, setBankAccNumber] = useState<string>('');
  const [bankIfsc, setBankIfsc] = useState<string>('');
  const [bankBranch, setBankBranch] = useState<string>('');
  const [bankAccType, setBankAccType] = useState<BankAccountType>('current');
  const [bankOpeningBal, setBankOpeningBal] = useState<string>('0');
  const [bankAccStatus, setBankAccStatus] = useState<'active' | 'inactive'>('active');
  const [bankUpi, setBankUpi] = useState<string>('');
  const [bankIsPrimary, setBankIsPrimary] = useState<boolean>(false);
  const [bankNotes, setBankNotes] = useState<string>('');
  const [isSubmittingBank, setIsSubmittingBank] = useState<boolean>(false);

  // Bank Transaction Matching & Reconciliation Modal States (Modal 9)
  const [isMatchModalOpen, setIsMatchModalOpen] = useState<boolean>(false);
  const [recordToMatch, setRecordToMatch] = useState<FinancialRecord | null>(null);
  const [matchBankAccountId, setMatchBankAccountId] = useState<string>('');
  const [matchStatementRef, setMatchStatementRef] = useState<string>('');
  const [matchReconStatus, setMatchReconStatus] = useState<BankReconciliationStatus>('matched');
  const [matchNotes, setMatchNotes] = useState<string>('');
  const [isSubmittingMatch, setIsSubmittingMatch] = useState<boolean>(false);

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
  const [newOrgUnit, setNewOrgUnit] = useState<FinancialOrgUnit | string>('Trust Head Office');
  const [newFundType, setNewFundType] = useState<string>('General');
  const [newCampaignId, setNewCampaignId] = useState<string>('');
  const [newReferenceNumber, setNewReferenceNumber] = useState<string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>('bank_transfer');
  const [newInvoiceReceiptUrl, setNewInvoiceReceiptUrl] = useState<string>('');
  const [newSupportingDocUrl, setNewSupportingDocUrl] = useState<string>('');
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

    // 4. Finance Budgets Listener (Task 4)
    const qBudgets = query(collection(db, 'finance_budgets'), orderBy('createdAt', 'desc'));
    const unsubBudgets = onSnapshot(
      qBudgets,
      (snapshot) => {
        const budgetsList: FinanceBudget[] = [];
        snapshot.forEach((docSnap) => {
          budgetsList.push({ id: docSnap.id, ...docSnap.data() } as FinanceBudget);
        });
        setBudgets(budgetsList);
      },
      (err) => {
        console.error('Error fetching finance budgets:', err);
      }
    );

    // 5. Finance Bank Accounts Listener (Task 5)
    const qBankAccounts = query(collection(db, 'finance_bank_accounts'), orderBy('createdAt', 'desc'));
    const unsubBankAccounts = onSnapshot(
      qBankAccounts,
      (snapshot) => {
        const accountsList: FinanceBankAccount[] = [];
        snapshot.forEach((docSnap) => {
          accountsList.push({ id: docSnap.id, ...docSnap.data() } as FinanceBankAccount);
        });
        setBankAccounts(accountsList);
      },
      (err) => {
        console.error('Error fetching bank accounts:', err);
      }
    );

    return () => {
      unsubRecords();
      unsubDonations();
      unsubCampaigns();
      unsubBudgets();
      unsubBankAccounts();
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

      // 2b. Expense Workflow Sub-Filter
      if (activeTab === 'expenses' && expenseWorkflowFilter !== 'all') {
        if (expenseWorkflowFilter === 'pending') {
          if (!['pending_approval', 'submitted', 'department_review', 'finance_review', 'trust_approval'].includes(item.status)) return false;
        } else if (expenseWorkflowFilter === 'approved') {
          if (item.status !== 'approved') return false;
        } else if (expenseWorkflowFilter === 'paid') {
          if (item.status !== 'paid') return false;
        } else if (expenseWorkflowFilter === 'accounted') {
          if (item.status !== 'accounted' && !item.isLocked) return false;
        } else if (expenseWorkflowFilter === 'draft') {
          if (item.status !== 'draft') return false;
        } else if (item.status !== expenseWorkflowFilter) {
          return false;
        }
      }

      // 2c. Income Category Sub-Filter
      if (activeTab === 'income' && incomeCategoryQuickFilter !== 'all') {
        if (incomeCategoryQuickFilter === 'donations') {
          if (!['direct_donation', 'crowdfunding_donation'].includes(item.category)) return false;
        } else if (incomeCategoryQuickFilter === 'memberships') {
          if (item.category !== 'membership_fee') return false;
        } else if (incomeCategoryQuickFilter === 'fees') {
          if (!['school_fee', 'madrasa_fee', 'event_competition_fee'].includes(item.category)) return false;
        } else if (incomeCategoryQuickFilter === 'grants') {
          if (!['institutional_grant', 'csr_contribution', 'corpus_grant'].includes(item.category)) return false;
        } else if (incomeCategoryQuickFilter === 'other') {
          if (['direct_donation', 'crowdfunding_donation', 'membership_fee', 'school_fee', 'madrasa_fee', 'event_competition_fee', 'institutional_grant', 'csr_contribution', 'corpus_grant'].includes(item.category)) return false;
        }
      }

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
    searchQuery,
    expenseWorkflowFilter,
    incomeCategoryQuickFilter
  ]);

  // Real Budget vs Actual Utilization and Variance Calculations (Task 4)
  const calculatedBudgets = useMemo(() => {
    return budgets.map((b) => calculateBudgetUtilization(b, financialRecords));
  }, [budgets, financialRecords]);

  // Filtered Calculated Budgets
  const filteredCalculatedBudgets = useMemo(() => {
    return calculatedBudgets.filter(({ budget }) => {
      if (budgetYearFilter !== 'all' && budget.financialYear !== budgetYearFilter) return false;
      if (budgetDeptFilter !== 'all' && budget.department !== budgetDeptFilter) return false;
      if (budgetStatusFilter !== 'all' && budget.status !== budgetStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = budget.name.toLowerCase().includes(q);
        const matchId = (budget.budgetId || '').toLowerCase().includes(q);
        const matchDept = budget.department.toLowerCase().includes(q);
        const matchCat = (budget.category || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDept && !matchCat) return false;
      }
      return true;
    });
  }, [calculatedBudgets, budgetYearFilter, budgetDeptFilter, budgetStatusFilter, searchQuery]);

  // Overall Budget Metrics
  const budgetMetrics = useMemo(() => {
    const activeBudgets = calculatedBudgets.filter(({ budget }) => budget.status === 'active' || budget.status === 'approved');
    const totalAllocated = activeBudgets.reduce((sum, item) => sum + item.allocatedAmount, 0);
    const totalUtilized = activeBudgets.reduce((sum, item) => sum + item.actualSpent, 0);
    const totalRemaining = totalAllocated - totalUtilized;
    const overspentCount = activeBudgets.filter((item) => item.isOverspent).length;
    const overallUtilizationRate = totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0;

    return {
      totalAllocated,
      totalUtilized,
      totalRemaining,
      overspentCount,
      overallUtilizationRate,
      activeCount: activeBudgets.length,
      totalCount: calculatedBudgets.length
    };
  }, [calculatedBudgets]);

  // Overall Bank & Reconciliation Metrics (Task 5)
  const bankMetrics = useMemo(() => {
    const activeAccounts = bankAccounts.filter((a) => a.status === 'active');
    const totalOpeningBalance = activeAccounts.reduce((sum, a) => sum + (Number(a.openingBalance) || 0), 0);
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let reconciledCount = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;
    let pendingReviewCount = 0;
    let reconciledVolume = 0;

    unifiedLedger.forEach((rec) => {
      const amt = Number(rec.amount) || 0;
      const status = rec.reconciliationStatus || 'unmatched';

      if (rec.type === 'income') {
        totalDeposits += amt;
      } else {
        totalWithdrawals += amt;
      }

      if (status === 'reconciled') {
        reconciledCount++;
        reconciledVolume += amt;
      } else if (status === 'matched') {
        matchedCount++;
        reconciledVolume += amt;
      } else if (status === 'pending_review') {
        pendingReviewCount++;
      } else {
        unmatchedCount++;
      }
    });

    const totalCalculatedBalance = totalOpeningBalance + totalDeposits - totalWithdrawals;

    return {
      activeAccountsCount: activeAccounts.length,
      totalAccountsCount: bankAccounts.length,
      totalBankBalance: totalCalculatedBalance,
      reconciledCount,
      matchedCount,
      unmatchedCount,
      pendingReviewCount,
      reconciledVolume,
      totalTransactionsCount: unifiedLedger.length
    };
  }, [bankAccounts, unifiedLedger]);

  // Filtered transactions for the Bank Management & Reconciliation Workbench
  const filteredBankTransactions = useMemo(() => {
    return unifiedLedger.filter((rec) => {
      // 1. Bank Account filter
      if (selectedBankAccountId !== 'all') {
        if (rec.bankAccountId !== selectedBankAccountId) return false;
      }

      // 2. Reconciliation Status filter
      if (selectedReconStatus !== 'all') {
        const currentStatus = rec.reconciliationStatus || 'unmatched';
        if (currentStatus !== selectedReconStatus) return false;
      }

      // 3. Search Query
      if (bankSearchQuery.trim()) {
        const q = bankSearchQuery.toLowerCase();
        const matchesId = rec.transactionId?.toLowerCase().includes(q);
        const matchesPayer = rec.payerPayeeName?.toLowerCase().includes(q);
        const matchesRef = rec.referenceNumber?.toLowerCase().includes(q);
        const matchesStmt = rec.bankStatementReference?.toLowerCase().includes(q);
        const matchesDesc = rec.description?.toLowerCase().includes(q);
        const matchesBank = rec.bankAccountName?.toLowerCase().includes(q);
        if (!matchesId && !matchesPayer && !matchesRef && !matchesStmt && !matchesDesc && !matchesBank) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedLedger, selectedBankAccountId, selectedReconStatus, bankSearchQuery]);

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
    setNewOrgUnit('Trust Head Office');
    setNewFundType('General');
    setNewCampaignId('');
    setNewReferenceNumber('');
    setNewPaymentMethod('bank_transfer');
    setNewInvoiceReceiptUrl('');
    setNewSupportingDocUrl('');
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

      const now = new Date().toISOString();
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
        organizationalUnit: newOrgUnit,
        fundType: newFundType,
        campaignId: newCampaignId || undefined,
        campaignTitle: newCampaignId ? campaigns.find(c => c.id === newCampaignId)?.title : undefined,
        invoiceReceiptUrl: newInvoiceReceiptUrl.trim() || undefined,
        supportingDocumentUrls: newSupportingDocUrl.trim() ? [newSupportingDocUrl.trim()] : undefined,
        sourceModule: 'manual',
        financialYear: '2026-27',
        createdByUid: currentUser?.uid || 'admin-user',
        createdByEmail: currentUser?.email || 'admin@fetindia.com',
        createdByName: userProfile?.fullName || userProfile?.displayName || 'Finance Lead',
        createdAt: now,
        approvalHistory: [
          {
            stage: 'submission',
            action: 'submitted',
            actorUid: currentUser?.uid || 'admin-user',
            actorEmail: currentUser?.email || 'admin@fetindia.com',
            actorName: userProfile?.fullName || userProfile?.displayName || 'Finance Lead',
            actorRole: userProfile?.primaryRole || 'finance_admin',
            timestamp: now,
            notes: isInitialDraft ? 'Draft requisition initiated' : 'Requisition registered and submitted for review'
          }
        ]
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

  // Handler: Open Status Action Modal (Multi-Stage Approval Workflow)
  const handleOpenActionModal = (record: FinancialRecord, action: FinanceActionType) => {
    setSelectedRecord(record);
    setTargetAction(action);
    setActionNotes('');
    setActionPaymentMethod(record.paymentMethod || 'bank_transfer');
    setActionReferenceNumber(record.referenceNumber || '');
    setIsStatusActionModalOpen(true);
  };

  // Handler: Open Adjustment Entry Modal (Immutability Principle - Chapter 15 SRS)
  const handleOpenAdjustmentModal = (record: FinancialRecord) => {
    setAdjustmentRecord(record);
    setAdjustmentType('reversal');
    setAdjustmentAmount(String(record.amount || ''));
    setAdjustmentReason('');
    setIsAdjustmentModalOpen(true);
  };

  // Handler: Execute Accounting Adjustment Entry
  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentRecord) return;
    if (!adjustmentAmount || isNaN(Number(adjustmentAmount)) || Number(adjustmentAmount) <= 0) {
      showToast('Please enter a valid positive adjustment amount.', 'error');
      return;
    }
    if (!adjustmentReason.trim()) {
      showToast('Mandatory: An authorized justification reason is required for accounting adjustments under Chapter 15 SRS.', 'error');
      return;
    }

    try {
      setIsSubmittingAdjustment(true);
      await createAccountingAdjustmentEntry({
        originalTransactionId: adjustmentRecord.transactionId,
        originalAmount: adjustmentRecord.amount,
        originalType: adjustmentRecord.type,
        adjustmentAmount: Number(adjustmentAmount),
        adjustmentReason: adjustmentReason.trim(),
        adjustmentType: adjustmentType,
        financialYear: adjustmentRecord.financialYear || '2026-27',
        authorizedBy: {
          uid: currentUser?.uid || 'admin-user',
          email: currentUser?.email || 'admin@fetindia.com',
          name: userProfile?.fullName || userProfile?.displayName || 'Finance Authority',
          role: userProfile?.primaryRole || 'finance_admin'
        }
      });

      showToast(`Authorized compensating adjustment entry posted for ${adjustmentRecord.transactionId}.`);
      setIsAdjustmentModalOpen(false);
    } catch (err: any) {
      console.error('Error posting accounting adjustment:', err);
      showToast(err.message || 'Failed to post accounting adjustment.', 'error');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Handler: Execute Status Transition with Separation of Duties
  const handleExecuteStatusAction = async () => {
    if (!selectedRecord || !selectedRecord.id) return;

    // Prevent direct edits to virtual/read-only campaign donations in this modal (they must be managed in donor console)
    if (selectedRecord.isLinkedDonation) {
      showToast('Campaign donations are reconciled via Donor & Crowdfunding verification.', 'error');
      setIsStatusActionModalOpen(false);
      return;
    }

    // Separation of Duties: A requester cannot approve their own expense requisition (SRS Requirement 3)
    if (['approve', 'department_approve', 'finance_verify', 'trust_approve'].includes(targetAction)) {
      if (!isSuperAdmin && selectedRecord.createdByUid === currentUser?.uid) {
        showToast('Separation of Duties Enforced: Requesters cannot approve their own expense requisitions.', 'error');
        setIsStatusActionModalOpen(false);
        return;
      }
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

      if (targetAction === 'submit') {
        updates.status = 'department_review';
        auditAction = 'EXPENSE_REQUISITION_SUBMITTED';
      } else if (targetAction === 'department_approve') {
        updates.status = 'finance_review';
        auditAction = 'EXPENSE_DEPARTMENT_APPROVED';
      } else if (targetAction === 'finance_verify') {
        updates.status = selectedRecord.amount > 50000 ? 'trust_approval' : 'approved';
        auditAction = 'EXPENSE_FINANCE_VERIFIED';
      } else if (targetAction === 'trust_approve' || targetAction === 'approve') {
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
      } else if (targetAction === 'account') {
        updates.status = 'accounted';
        updates.isLocked = true;
        auditAction = 'EXPENSE_ACCOUNTING_POSTED';
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

      // Record step in multi-stage audit history
      const approvalStep: ExpenseApprovalStep = {
        stage: targetAction === 'submit' ? 'submission' :
               targetAction === 'department_approve' ? 'department_review' :
               targetAction === 'finance_verify' ? 'finance_review' :
               targetAction === 'trust_approve' ? 'trust_approval' :
               targetAction === 'pay' ? 'payment_execution' :
               targetAction === 'account' ? 'accounting_entry' :
               targetAction === 'reject' ? 'rejection' :
               targetAction === 'cancel' ? 'cancellation' : 'trust_approval',
        action: targetAction === 'submit' ? 'submitted' :
                targetAction === 'department_approve' ? 'department_approved' :
                targetAction === 'finance_verify' ? 'finance_verified' :
                targetAction === 'trust_approve' || targetAction === 'approve' ? 'trust_approved' :
                targetAction === 'pay' ? 'paid' :
                targetAction === 'account' ? 'accounted' :
                targetAction === 'reject' ? 'rejected' : 'cancelled',
        actorUid: actorInfo.uid,
        actorEmail: actorInfo.email,
        actorName: actorInfo.name,
        actorRole: actorInfo.role || 'finance_admin',
        timestamp: now,
        notes: actionNotes.trim() || undefined
      };
      updates.approvalHistory = [...(selectedRecord.approvalHistory || []), approvalStep];

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

  // Handler: Delete Record (Super Admin Only - Drafts/Cancelled Only)
  const handleDeleteRecord = async (record: FinancialRecord) => {
    if (!isSuperAdmin) {
      showToast('Only Super Administrator is authorized to delete draft financial entries.', 'error');
      return;
    }
    if (record.isLinkedDonation) {
      showToast('Public crowdfunding donations cannot be deleted from the finance ledger.', 'error');
      return;
    }
    if (record.status === 'approved' || record.status === 'paid' || record.isLocked) {
      showToast('Approved and paid accounting entries cannot be deleted under Chapter 15 SRS. Please post an authorized adjustment entry instead.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete draft transaction ${record.transactionId}? This action is irreversible and recorded in the audit trail.`)) {
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

  // ==============================================================
  // BUDGET MANAGEMENT ACTION HANDLERS (TASK 4)
  // ==============================================================

  const handleOpenCreateBudget = () => {
    setEditingBudget(null);
    setBudgetName('');
    setBudgetFY(getCurrentFinancialYear());
    setBudgetDept('Scholarships');
    setBudgetCategory('education_scholarships');
    setBudgetOrgUnit('Trust Head Office');
    setBudgetFundType('General');
    setBudgetAmount('');
    setBudgetStatus('active');
    setBudgetNotes('');
    setIsBudgetModalOpen(true);
  };

  const handleOpenEditBudget = (b: FinanceBudget) => {
    setEditingBudget(b);
    setBudgetName(b.name);
    setBudgetFY(b.financialYear || getCurrentFinancialYear());
    setBudgetDept(b.department);
    setBudgetCategory(b.category || 'all');
    setBudgetOrgUnit(b.organizationalUnit || 'Trust Head Office');
    setBudgetFundType(b.fundType || 'General');
    setBudgetAmount(String(b.allocatedAmount || ''));
    setBudgetStatus(b.status === 'closed' ? 'active' : (b.status as any));
    setBudgetNotes(b.notes || '');
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetName.trim()) {
      showToast('Please enter an institutional budget allocation title.', 'error');
      return;
    }
    const amountNum = Number(budgetAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid positive allocated budget amount.', 'error');
      return;
    }

    try {
      setIsSubmittingBudget(true);
      const actorInfo = {
        uid: currentUser?.uid || 'admin-user',
        email: currentUser?.email || 'admin@fetindia.com',
        name: userProfile?.fullName || userProfile?.displayName || 'Finance Lead',
        role: userProfile?.primaryRole || 'finance_admin'
      };

      if (editingBudget && editingBudget.id) {
        await updateFinanceBudget(
          editingBudget.id,
          {
            name: budgetName.trim(),
            financialYear: budgetFY,
            department: budgetDept,
            category: budgetCategory,
            organizationalUnit: budgetOrgUnit,
            fundType: budgetFundType,
            allocatedAmount: amountNum,
            status: budgetStatus,
            notes: budgetNotes.trim() || undefined
          },
          actorInfo,
          'FINANCE_BUDGET_UPDATED'
        );
        showToast(`Budget allocation ${editingBudget.budgetId || budgetName} updated successfully.`);
      } else {
        const generatedId = generateFinanceBudgetId();
        await createFinanceBudget(
          {
            budgetId: generatedId,
            name: budgetName.trim(),
            financialYear: budgetFY,
            department: budgetDept,
            category: budgetCategory,
            organizationalUnit: budgetOrgUnit,
            fundType: budgetFundType,
            allocatedAmount: amountNum,
            status: budgetStatus,
            notes: budgetNotes.trim() || undefined,
            createdByUid: actorInfo.uid,
            createdByEmail: actorInfo.email,
            createdByName: actorInfo.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          actorInfo
        );
        showToast(`Budget allocation ${generatedId} created and registered.`);
      }

      setIsBudgetModalOpen(false);
    } catch (err: any) {
      console.error('Error saving finance budget:', err);
      showToast(err.message || 'Failed to save budget allocation.', 'error');
    } finally {
      setIsSubmittingBudget(false);
    }
  };

  const handleApproveBudget = async (b: FinanceBudget) => {
    if (!b.id) return;
    try {
      const actorInfo = {
        uid: currentUser?.uid || 'admin-user',
        email: currentUser?.email || 'admin@fetindia.com',
        name: userProfile?.fullName || userProfile?.displayName || 'Finance Authority',
        role: userProfile?.primaryRole || 'finance_admin'
      };
      await updateFinanceBudget(
        b.id,
        {
          status: 'active',
          approvedByUid: actorInfo.uid,
          approvedByName: actorInfo.name,
          approvedAt: new Date().toISOString()
        },
        actorInfo,
        'FINANCE_BUDGET_APPROVED'
      );
      showToast(`Budget ${b.budgetId || b.name} has been approved and activated.`);
    } catch (err: any) {
      console.error('Error approving budget:', err);
      showToast('Failed to approve budget allocation.', 'error');
    }
  };

  const handleCloseBudget = async (b: FinanceBudget) => {
    if (!b.id) return;
    if (!window.confirm(`Are you sure you want to conclude / close budget allocation ${b.budgetId || b.name}?`)) return;
    try {
      const actorInfo = {
        uid: currentUser?.uid || 'admin-user',
        email: currentUser?.email || 'admin@fetindia.com',
        name: userProfile?.fullName || userProfile?.displayName || 'Finance Lead',
        role: userProfile?.primaryRole || 'finance_admin'
      };
      await updateFinanceBudget(b.id, { status: 'closed' }, actorInfo, 'FINANCE_BUDGET_CLOSED');
      showToast(`Budget ${b.budgetId || b.name} has been closed.`);
    } catch (err: any) {
      console.error('Error closing budget:', err);
      showToast('Failed to close budget.', 'error');
    }
  };

  const handleDeleteBudget = async (b: FinanceBudget) => {
    if (!isSuperAdmin) {
      showToast('Only Super Administrator is authorized to delete budget records.', 'error');
      return;
    }
    if (!b.id) return;
    if (!window.confirm(`Are you sure you want to delete budget ${b.budgetId || b.name}? This action is permanent and recorded in the audit trail.`)) {
      return;
    }
    try {
      await deleteFinanceBudget(b.id, {
        uid: currentUser?.uid || 'super-admin',
        email: currentUser?.email || 'admin@fetindia.com',
        role: 'super_admin'
      });
      showToast(`Budget ${b.budgetId || b.name} deleted.`);
    } catch (err: any) {
      console.error('Error deleting budget:', err);
      showToast('Failed to delete budget record.', 'error');
    }
  };

  const handleViewBudgetExpenses = (result: BudgetUtilizationResult) => {
    setSelectedBudgetResult(result);
    setIsBudgetBreakdownOpen(true);
  };

  // =========================================================
  // BANK MANAGEMENT & RECONCILIATION HANDLERS (TASK 5)
  // =========================================================

  const handleOpenCreateBankAccount = () => {
    setEditingBankAccount(null);
    setBankAccName('');
    setBankName('State Bank of India');
    setBankAccNumber('');
    setBankIfsc('');
    setBankBranch('');
    setBankAccType('current');
    setBankOpeningBal('0');
    setBankAccStatus('active');
    setBankUpi('');
    setBankIsPrimary(bankAccounts.length === 0);
    setBankNotes('');
    setIsBankAccountModalOpen(true);
  };

  const handleOpenEditBankAccount = (acc: FinanceBankAccount) => {
    setEditingBankAccount(acc);
    setBankAccName(acc.accountName);
    setBankName(acc.bankName);
    setBankAccNumber(acc.accountNumber);
    setBankIfsc(acc.ifscCode);
    setBankBranch(acc.branchName || '');
    setBankAccType(acc.accountType);
    setBankOpeningBal(String(acc.openingBalance || 0));
    setBankAccStatus(acc.status);
    setBankUpi(acc.upiId || '');
    setBankIsPrimary(Boolean(acc.isPrimary));
    setBankNotes(acc.notes || '');
    setIsBankAccountModalOpen(true);
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccName.trim() || !bankName.trim() || !bankAccNumber.trim() || !bankIfsc.trim()) {
      showToast('Please enter Account Name, Bank Name, Account Number, and IFSC Code.', 'error');
      return;
    }

    setIsSubmittingBank(true);
    try {
      const actor = {
        uid: currentUser?.uid || 'admin',
        email: currentUser?.email || 'admin@fetindia.com',
        name: userProfile?.fullName || 'Finance Officer',
        role: userProfile?.primaryRole || 'finance_admin'
      };

      if (editingBankAccount && editingBankAccount.id) {
        await updateFinanceBankAccount(editingBankAccount.id, {
          accountName: bankAccName.trim(),
          bankName: bankName.trim(),
          accountNumber: bankAccNumber.trim(),
          ifscCode: bankIfsc.trim().toUpperCase(),
          branchName: bankBranch.trim(),
          accountType: bankAccType,
          openingBalance: Number(bankOpeningBal) || 0,
          status: bankAccStatus,
          upiId: bankUpi.trim(),
          isPrimary: bankIsPrimary,
          notes: bankNotes.trim()
        }, actor);
        showToast('Trust bank account updated successfully.');
      } else {
        await createFinanceBankAccount({
          accountCode: generateFinanceBankAccountId(),
          accountName: bankAccName.trim(),
          bankName: bankName.trim(),
          accountNumber: bankAccNumber.trim(),
          ifscCode: bankIfsc.trim().toUpperCase(),
          branchName: bankBranch.trim(),
          accountType: bankAccType,
          currency: 'INR',
          openingBalance: Number(bankOpeningBal) || 0,
          currentBalance: Number(bankOpeningBal) || 0,
          status: bankAccStatus,
          upiId: bankUpi.trim(),
          isPrimary: bankIsPrimary,
          notes: bankNotes.trim(),
          createdByUid: actor.uid,
          createdByEmail: actor.email,
          createdByName: actor.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, actor);
        showToast('New Trust bank account configured successfully.');
      }

      setIsBankAccountModalOpen(false);
    } catch (err: any) {
      console.error('Error saving bank account:', err);
      showToast(err.message || 'Failed to save bank account.', 'error');
    } finally {
      setIsSubmittingBank(false);
    }
  };

  const handleToggleBankAccountStatus = async (acc: FinanceBankAccount) => {
    if (!acc.id) return;
    const newStatus = acc.status === 'active' ? 'inactive' : 'active';
    try {
      await updateFinanceBankAccount(acc.id, { status: newStatus }, {
        uid: currentUser?.uid || 'admin',
        email: currentUser?.email || 'admin@fetindia.com',
        role: userProfile?.primaryRole || 'finance_admin'
      });
      showToast(`Account marked as ${newStatus}.`);
    } catch (err: any) {
      console.error('Error toggling account status:', err);
      showToast('Failed to update account status.', 'error');
    }
  };

  const handleDeleteBankAccount = async (acc: FinanceBankAccount) => {
    if (!isSuperAdmin) {
      showToast('Only Super Administrator is authorized to delete bank accounts.', 'error');
      return;
    }
    if (!acc.id) return;
    if (!window.confirm(`Are you sure you want to delete bank account ${acc.accountName} (${acc.bankName})? This action is permanent and recorded in the audit trail.`)) {
      return;
    }

    try {
      await deleteFinanceBankAccount(acc.id, {
        uid: currentUser?.uid || 'super-admin',
        email: currentUser?.email || 'admin@fetindia.com',
        role: 'super_admin'
      });
      showToast(`Bank account ${acc.accountName} deleted.`);
    } catch (err: any) {
      console.error('Error deleting bank account:', err);
      showToast('Failed to delete bank account.', 'error');
    }
  };

  // Transaction Matching Handlers (Task 5)
  const handleOpenMatchModal = (rec: FinancialRecord) => {
    setRecordToMatch(rec);
    setMatchBankAccountId(rec.bankAccountId || (bankAccounts[0]?.id || ''));
    setMatchStatementRef(rec.bankStatementReference || rec.referenceNumber || '');
    setMatchReconStatus(rec.reconciliationStatus || 'matched');
    setMatchNotes(rec.reconciliationNotes || '');
    setIsMatchModalOpen(true);
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordToMatch || !recordToMatch.id) return;
    if (!matchBankAccountId) {
      showToast('Please select a target Trust Bank Account.', 'error');
      return;
    }

    const targetBank = bankAccounts.find((b) => b.id === matchBankAccountId);
    const bankAccountName = targetBank ? `${targetBank.bankName} - ${targetBank.accountName}` : 'Trust Operating Account';

    setIsSubmittingMatch(true);
    try {
      await matchFinancialRecordToBank(recordToMatch.id, {
        bankAccountId: matchBankAccountId,
        bankAccountName,
        bankStatementReference: matchStatementRef.trim(),
        reconciliationStatus: matchReconStatus,
        notes: matchNotes.trim()
      }, {
        uid: currentUser?.uid || 'admin',
        email: currentUser?.email || 'admin@fetindia.com',
        name: userProfile?.fullName || 'Finance Officer',
        role: userProfile?.primaryRole || 'finance_admin'
      });

      showToast(`Transaction ${recordToMatch.transactionId} matched with ${targetBank?.bankName || 'bank account'}.`);
      setIsMatchModalOpen(false);
    } catch (err: any) {
      console.error('Error matching transaction:', err);
      showToast(err.message || 'Failed to match transaction.', 'error');
    } finally {
      setIsSubmittingMatch(false);
    }
  };

  const handleQuickReconcile = async (rec: FinancialRecord) => {
    if (!rec.id) return;
    try {
      await updateFinancialRecordReconciliationStatus(rec.id, 'reconciled', {
        uid: currentUser?.uid || 'admin',
        email: currentUser?.email || 'admin@fetindia.com',
        name: userProfile?.fullName || 'Accountant',
        role: userProfile?.primaryRole || 'accountant'
      }, 'Fast reconciled by authorized officer');
      showToast(`Transaction ${rec.transactionId} marked as Reconciled.`);
    } catch (err: any) {
      console.error('Error reconciling record:', err);
      showToast('Failed to reconcile transaction.', 'error');
    }
  };

  const handleQuickFlagReview = async (rec: FinancialRecord) => {
    if (!rec.id) return;
    try {
      await updateFinancialRecordReconciliationStatus(rec.id, 'pending_review', {
        uid: currentUser?.uid || 'admin',
        email: currentUser?.email || 'admin@fetindia.com',
        name: userProfile?.fullName || 'Finance Officer',
        role: userProfile?.primaryRole || 'finance_admin'
      }, 'Flagged for reconciliation review');
      showToast(`Transaction ${rec.transactionId} flagged for review.`);
    } catch (err: any) {
      console.error('Error flagging record:', err);
      showToast('Failed to flag transaction.', 'error');
    }
  };

  const renderReconStatusBadge = (status?: BankReconciliationStatus) => {
    switch (status) {
      case 'reconciled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Reconciled
          </span>
        );
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
            <Check className="w-3 h-3 text-blue-700" /> Matched
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" /> Pending Review
          </span>
        );
      case 'unmatched':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-400" /> Unmatched
          </span>
        );
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
  const renderStatusBadge = (status: string, isAdjustment?: boolean) => {
    if (isAdjustment) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
          <Scale className="w-3 h-3 text-purple-700" /> Compensating Adjustment
        </span>
      );
    }

    switch (status) {
      case 'verified':
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> {status === 'paid' ? 'Paid / Settled' : 'Verified Income'}
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <Send className="w-3 h-3" /> Submitted
          </span>
        );
      case 'department_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <Building className="w-3 h-3" /> Department Review
          </span>
        );
      case 'finance_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-300">
            <ShieldCheck className="w-3 h-3" /> Finance Verification
          </span>
        );
      case 'trust_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-400">
            <Landmark className="w-3 h-3 text-amber-700" /> Trust Authorization
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Check className="w-3 h-3" /> Approved Requisition
          </span>
        );
      case 'accounted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
            <Lock className="w-3 h-3 text-teal-700" /> Accounted in GL
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
      // Income Categories
      crowdfunding_donation: 'Crowdfunding Appeal',
      direct_donation: 'Direct Trust Donation',
      membership_fee: 'Membership Fee',
      event_competition_fee: 'Event / Competition Fee',
      school_fee: 'School Tuition / Fee',
      madrasa_fee: 'Madrasa Fee / Contribution',
      madrasa_contribution: 'Madrasa Contribution',
      corpus_grant: 'Corpus Grant / Institutional',
      institutional_grant: 'Institutional & Corporate Grant',
      csr_contribution: 'Corporate CSR Contribution',
      investment_income: 'Investment & Bank Yield',
      other_income: 'Other Trust Income',
      // Expense Categories
      office_administration: 'Office & Administration',
      staff_salaries: 'Staff & Educator Salaries',
      utilities_maintenance: 'Utilities & Infrastructure',
      construction_infrastructure: 'Construction & Infrastructure',
      equipment_purchases: 'Equipment Purchases & Hardware',
      educational_materials: 'Educational Materials & Books',
      education_scholarships: 'Education & Scholarships',
      medical_assistance: 'Medical & Healthcare Assistance',
      community_relief: 'Community & Emergency Relief',
      relief_activities: 'Community Relief Activities',
      events_competitions: 'Events & Competitions',
      campaign_disbursement: 'Crowdfunding Beneficiary Payout',
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
          onClick={() => setActiveTab('budgets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'budgets'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-amber-400" /> Budget Management ({budgets.length})
          {budgetMetrics.overspentCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black">
              {budgetMetrics.overspentCount} Alert
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('banking')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'banking'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-blue-400" /> Bank Management ({bankAccounts.length})
          {bankMetrics.unmatchedCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px] font-black">
              {bankMetrics.unmatchedCount} Open
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'fees'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Fee Management
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

          {/* Budget vs Actual Utilization Summary Banner in Dashboard Overview (Task 4) */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 p-5 rounded-2xl text-white shadow-xs border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  FY 2026-27 Approved Budget Allocation & Utilization
                </span>
                {budgetMetrics.overspentCount > 0 ? (
                  <span className="px-2 py-0.5 bg-rose-600/90 text-white rounded-full text-[10px] font-black flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {budgetMetrics.overspentCount} Overspent
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-800/80 text-emerald-200 rounded-full text-[10px] font-extrabold">
                    {budgetMetrics.activeCount} Active Allocations
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-2xl font-black text-white">
                  ₹{budgetMetrics.totalUtilized.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-300">
                  utilized out of <strong className="text-white">₹{budgetMetrics.totalAllocated.toLocaleString('en-IN')}</strong> approved budget ({budgetMetrics.overallUtilizationRate.toFixed(1)}%)
                </span>
                <span className={`text-xs font-bold ${budgetMetrics.totalRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  • {budgetMetrics.totalRemaining >= 0 ? 'Available: +' : 'Deficit: -'}₹{Math.abs(budgetMetrics.totalRemaining).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full sm:w-96 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className={`h-2 rounded-full transition-all ${
                    budgetMetrics.overallUtilizationRate > 100
                      ? 'bg-rose-500'
                      : budgetMetrics.overallUtilizationRate > 85
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(budgetMetrics.overallUtilizationRate, 100)}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => setActiveTab('budgets')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Target className="w-3.5 h-3.5" /> Budget & Department Allocation →
            </button>
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
          {/* Quick Sub-Filter Pills for Expenses & Income */}
          {activeTab === 'expenses' && (
            <div className="flex flex-wrap items-center gap-1.5 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs">
              <span className="font-extrabold text-slate-500 text-[11px] uppercase tracking-wider mr-1">Expense Stage:</span>
              {[
                { id: 'all', label: 'All Expenses' },
                { id: 'draft', label: 'Drafts' },
                { id: 'pending', label: 'Awaiting Review' },
                { id: 'department_review', label: 'Dept Review' },
                { id: 'finance_review', label: 'Finance Review' },
                { id: 'trust_approval', label: 'Trust Approval' },
                { id: 'approved', label: 'Approved (Pending Payment)' },
                { id: 'paid', label: 'Paid / Settled' },
                { id: 'accounted', label: 'Accounted in GL (Locked)' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setExpenseWorkflowFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    expenseWorkflowFilter === f.id
                      ? 'bg-rose-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'income' && (
            <div className="flex flex-wrap items-center gap-1.5 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs">
              <span className="font-extrabold text-slate-500 text-[11px] uppercase tracking-wider mr-1">Income Stream:</span>
              {[
                { id: 'all', label: 'All Incomes' },
                { id: 'donations', label: 'Donations (Direct & Crowdfunding)' },
                { id: 'memberships', label: 'Membership Fees' },
                { id: 'fees', label: 'School & Madrasa Fees' },
                { id: 'grants', label: 'Grants & CSR' },
                { id: 'other', label: 'Other Receipts' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setIncomeCategoryQuickFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    incomeCategoryQuickFilter === f.id
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

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
                    <option value="direct_donation">Direct Philanthropic Donation (80G)</option>
                    <option value="crowdfunding_donation">Crowdfunding Appeal Contribution</option>
                    <option value="membership_fee">Membership Subscription Fee</option>
                    <option value="school_fee">School Tuition / Receipts</option>
                    <option value="madrasa_fee">Madrasa Fees & Contributions</option>
                    <option value="madrasa_contribution">Madrasa Boarding Contribution</option>
                    <option value="institutional_grant">Institutional & Corporate Grant</option>
                    <option value="corpus_grant">Corpus Endowment Grant</option>
                    <option value="csr_contribution">Corporate CSR Contribution</option>
                    <option value="investment_income">Investment & Bank Yield</option>
                    <option value="event_competition_fee">Event / Competition Fee</option>
                    <option value="other_income">Other Miscellaneous Income</option>
                  </optgroup>
                  <optgroup label="Expense Categories">
                    <option value="office_administration">Office Administration & Operations</option>
                    <option value="staff_salaries">Staff & Educator Salaries</option>
                    <option value="utilities_maintenance">Utilities, Rent & Maintenance</option>
                    <option value="construction_infrastructure">Construction & Infrastructure</option>
                    <option value="equipment_purchases">Equipment Purchases & Hardware</option>
                    <option value="educational_materials">Educational Materials & Books</option>
                    <option value="education_scholarships">Educational Scholarships & Grants</option>
                    <option value="medical_assistance">Medical & Healthcare Assistance</option>
                    <option value="community_relief">Community Relief</option>
                    <option value="relief_activities">Emergency Relief Activities</option>
                    <option value="events_competitions">Events & Academic Competitions</option>
                    <option value="campaign_disbursement">Crowdfunding Beneficiary Disbursal</option>
                    <option value="statutory_compliance">Statutory & Audit Compliance</option>
                    <option value="other_expense">Other Approved Expenditure</option>
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
                                {/* 1. Draft -> Submit for Review */}
                                {record.type === 'expense' && record.status === 'draft' && (canUserCreateExpense || isSuperAdmin) && (
                                  <button
                                    onClick={() => handleOpenActionModal(record, 'submit')}
                                    className="p-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg cursor-pointer transition-all"
                                    title="Submit Requisition for Review"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* 2. Department Review -> Department Verify & Forward */}
                                {record.type === 'expense' && (record.status === 'department_review' || record.status === 'submitted') && (canUserVerifyExpense || canUserApproveExpense || isSuperAdmin) && (
                                  <button
                                    onClick={() => handleOpenActionModal(record, 'department_approve')}
                                    className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg cursor-pointer transition-all"
                                    title="Department Verify & Forward to Finance"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* 3. Finance Review -> Finance Verify */}
                                {record.type === 'expense' && record.status === 'finance_review' && (canUserVerifyExpense || canUserApproveExpense || isSuperAdmin) && (
                                  <button
                                    onClick={() => handleOpenActionModal(record, 'finance_verify')}
                                    className="p-1.5 bg-violet-100 hover:bg-violet-200 text-violet-800 rounded-lg cursor-pointer transition-all"
                                    title={record.amount > 50000 ? 'Verify & Forward for Executive Trust Approval (> ₹50,000 threshold)' : 'Verify & Approve for Payment'}
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* 4. Trust Approval -> Executive Trust Approval */}
                                {record.type === 'expense' && record.status === 'trust_approval' && (canUserApproveExpense || isSuperAdmin) && (
                                  <button
                                    onClick={() => handleOpenActionModal(record, 'trust_approve')}
                                    className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer transition-all"
                                    title="Executive Trust Authorization"
                                  >
                                    <Landmark className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* 5. Direct Pending Approval */}
                                {record.type === 'expense' && record.status === 'pending_approval' && (canUserApproveExpense || isSuperAdmin) && (
                                  <button
                                    onClick={() => handleOpenActionModal(record, 'approve')}
                                    className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg cursor-pointer transition-all"
                                    title="Approve Requisition"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Reject button for review stages */}
                                {record.type === 'expense' && ['draft', 'submitted', 'department_review', 'finance_review', 'trust_approval', 'pending_approval'].includes(record.status) && (canUserVerifyExpense || canUserApproveExpense || isSuperAdmin) && (
                                  <button
                                    onClick={() => handleOpenActionModal(record, 'reject')}
                                    className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg cursor-pointer transition-all"
                                    title="Reject Requisition"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* 6. Approved -> Pay */}
                                {record.type === 'expense' && record.status === 'approved' && (canUserProcessPayment || isSuperAdmin) && (
                                  <button
                                    onClick={() => handleOpenActionModal(record, 'pay')}
                                    className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer transition-all"
                                    title="Execute Payment / Disburse with Bank Reference"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* 7. Paid -> Post to General Ledger (Account & Lock) */}
                                {record.type === 'expense' && record.status === 'paid' && (canUserPostAccounting || isSuperAdmin) && (
                                  <button
                                    onClick={() => handleOpenActionModal(record, 'account')}
                                    className="p-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg cursor-pointer transition-all"
                                    title="Post to General Ledger (Account & Lock)"
                                  >
                                    <FileCheck className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* 8. Accounted / Paid / Verified -> Post Adjustment / Reversal Entry (SRS Immutability Principle) */}
                                {(record.status === 'paid' || record.status === 'accounted' || (record.type === 'income' && record.status === 'verified')) && (canUserApproveExpense || isSuperAdmin) && (
                                  <button
                                    onClick={() => handleOpenAdjustmentModal(record)}
                                    className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg cursor-pointer transition-all"
                                    title="Post Authorized Adjustment / Reversal Entry (SRS Immutability)"
                                  >
                                    <Scale className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Lock indicator */}
                                {(record.status === 'accounted' || record.isLocked) && (
                                  <span className="p-1 text-slate-400" title="Locked in General Ledger (Compensating Adjustment only)">
                                    <Lock className="w-3.5 h-3.5" />
                                  </span>
                                )}

                                {/* Super Admin Delete (Drafts / Cancelled Only) */}
                                {isSuperAdmin && (record.status === 'draft' || record.status === 'cancelled') && (
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

      {/* FEE MANAGEMENT TAB (Chapter 15.10 SRS) */}
      {activeTab === 'fees' && (
        <FeeManagementView />
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
                        { cat: 'direct_donation', label: 'Direct Trust Donations (80G)' },
                        { cat: 'crowdfunding_donation', label: 'Crowdfunding Appeal Contributions' },
                        { cat: 'membership_fee', label: 'Membership Subscription Fees' },
                        { cat: 'school_fee', label: 'School Educational Receipts' },
                        { cat: 'madrasa_fee', label: 'Madrasa Fees & Contributions' },
                        { cat: 'madrasa_contribution', label: 'Madrasa Boarding Contributions' },
                        { cat: 'institutional_grant', label: 'Institutional & Corporate Grants' },
                        { cat: 'corpus_grant', label: 'Corpus Grants & Endowments' },
                        { cat: 'csr_contribution', label: 'Corporate CSR Contributions' },
                        { cat: 'investment_income', label: 'Investment & Bank Yield' },
                        { cat: 'event_competition_fee', label: 'Competition & Examination Fees' },
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
                        { cat: 'office_administration', label: 'Office & General Administration' },
                        { cat: 'staff_salaries', label: 'Staff & Educator Salaries' },
                        { cat: 'utilities_maintenance', label: 'Campus Utilities, Rent & Maintenance' },
                        { cat: 'construction_infrastructure', label: 'Construction & Campus Infrastructure' },
                        { cat: 'equipment_purchases', label: 'Equipment Purchases & IT Hardware' },
                        { cat: 'educational_materials', label: 'Educational Materials & Textbooks' },
                        { cat: 'education_scholarships', label: 'Education & Student Scholarships' },
                        { cat: 'medical_assistance', label: 'Medical & Healthcare Assistance' },
                        { cat: 'community_relief', label: 'Community Relief & Aid' },
                        { cat: 'relief_activities', label: 'Emergency Relief Activities' },
                        { cat: 'events_competitions', label: 'Events, Seminars & Exams' },
                        { cat: 'campaign_disbursement', label: 'Crowdfunding Beneficiary Disbursals' },
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
      {/* BUDGET MANAGEMENT TAB (CHAPTER 15 SRS - TASK 4) */}
      {/* ============================================================== */}
      {activeTab === 'budgets' && (
        <div className="space-y-6" id="admin-finance-budgets-section">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-2xl">
                  <Target className="w-6 h-6 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Annual & Departmental Budget Management
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Chapter 15 SRS • Institutional Allocations, Real-Time Utilization, and Budget vs Actual Variance
                  </p>
                </div>
              </div>
              {(canUserManageBudget || isSuperAdmin) && (
                <button
                  onClick={handleOpenCreateBudget}
                  className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Allocate New Budget
                </button>
              )}
            </div>

            {/* 4 Budget KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Approved Budget Ceiling</span>
                  <Target className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  ₹{budgetMetrics.totalAllocated.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Across {budgetMetrics.activeCount} active institutional allocations
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Actual Spent / Utilized</span>
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-2xl font-black text-rose-900 mt-1">
                  ₹{budgetMetrics.totalUtilized.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">
                  Real utilization from approved ledger vouchers
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Available Unspent Balance</span>
                  <Wallet className="w-4 h-4 text-blue-600" />
                </div>
                <p className={`text-2xl font-black mt-1 ${budgetMetrics.totalRemaining >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {budgetMetrics.totalRemaining >= 0 ? '+' : '-'}₹{Math.abs(budgetMetrics.totalRemaining).toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {budgetMetrics.overallUtilizationRate.toFixed(1)}% total allocation utilized
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Variance & Control</span>
                  {budgetMetrics.overspentCount > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className={`text-xl font-black mt-1 ${budgetMetrics.overspentCount > 0 ? 'text-rose-700' : 'text-emerald-800'}`}>
                  {budgetMetrics.overspentCount > 0 ? `${budgetMetrics.overspentCount} Overspent Alert` : 'Within Budget Ceiling'}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {budgetMetrics.overspentCount > 0 ? 'Exceeded allocated ceiling' : '100% compliant with approved allocations'}
                </span>
              </div>
            </div>

            {/* Budget Filters Bar */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col md:flex-row gap-3 text-xs">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search allocations by title, ID, department, or expense category..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div className="w-full md:w-44">
                  <select
                    value={budgetYearFilter}
                    onChange={(e) => setBudgetYearFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="all">All Financial Years</option>
                    <option value="2026-27">FY 2026-27</option>
                    <option value="2025-26">FY 2025-26</option>
                    <option value="2027-28">FY 2027-28</option>
                  </select>
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={budgetDeptFilter}
                    onChange={(e) => setBudgetDeptFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="all">All Departments / Wings</option>
                    <option value="Scholarships">Scholarships & Education</option>
                    <option value="Relief">Emergency Relief</option>
                    <option value="School">FET Academy / School</option>
                    <option value="Madrasa">Madrasa Affiliations</option>
                    <option value="Administration">Secretariat / Admin</option>
                    <option value="Events">Competitions & Events</option>
                    <option value="IT">IT & Digital Systems</option>
                    <option value="General">General Trust Pool</option>
                  </select>
                </div>
                <div className="w-full md:w-36">
                  <select
                    value={budgetStatusFilter}
                    onChange={(e) => setBudgetStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="approved">Approved</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Budget vs Actual Comparison Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Allocation & Code</th>
                      <th className="px-4 py-3">Dept / Wing</th>
                      <th className="px-4 py-3">Expense Category</th>
                      <th className="px-4 py-3">FY</th>
                      <th className="px-4 py-3 text-right">Budgeted (₹)</th>
                      <th className="px-4 py-3 text-right">Actual Spent (₹)</th>
                      <th className="px-4 py-3 text-right">Variance / Balance (₹)</th>
                      <th className="px-4 py-3 text-center">Utilization</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCalculatedBudgets.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                          <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-bold text-slate-600">No Budget Allocations Found</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                            No budget allocations match the current filters. Authorized administrators can allocate departmental or project budgets.
                          </p>
                          {(canUserManageBudget || isSuperAdmin) && (
                            <button
                              onClick={handleOpenCreateBudget}
                              className="mt-3 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Create First Allocation
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredCalculatedBudgets.map((item) => {
                        const { budget, allocatedAmount, actualSpent, remainingAmount, isOverspent, utilizationPercentage } = item;
                        return (
                          <tr key={budget.id || budget.budgetId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-extrabold text-slate-900 block">{budget.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                {budget.budgetId || 'FET-BGT-2026-ALLOC'} • {budget.organizationalUnit || 'Trust Head Office'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md font-bold text-[11px] border border-blue-200">
                                {budget.department}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {budget.category === 'all' ? (
                                <span className="text-slate-500 italic">All Department Expenses</span>
                              ) : (
                                formatCategoryLabel(budget.category)
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono font-semibold text-slate-600">
                              {budget.financialYear}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-slate-900">
                              ₹{allocatedAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleViewBudgetExpenses(item)}
                                className="font-black text-slate-900 hover:text-emerald-700 cursor-pointer underline decoration-dotted"
                                title="Click to view linked expenditure transactions"
                              >
                                ₹{actualSpent.toLocaleString('en-IN')}
                              </button>
                              <span className="block text-[10px] text-slate-400">
                                {item.linkedExpensesCount} vouchers
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isOverspent ? (
                                <span className="font-black text-rose-700 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  -₹{Math.abs(remainingAmount).toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="font-black text-emerald-700">
                                  +₹{remainingAmount.toLocaleString('en-IN')}
                                </span>
                              )}
                              <span className="block text-[10px] text-slate-400">
                                {isOverspent ? 'Overspent' : 'Available'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="w-24 mx-auto space-y-1">
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      utilizationPercentage > 100
                                        ? 'bg-rose-600'
                                        : utilizationPercentage > 85
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-600'
                                    }`}
                                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 block">
                                  {utilizationPercentage.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {budget.status === 'active' ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] border border-emerald-300">
                                  Active
                                </span>
                              ) : budget.status === 'approved' ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px] border border-blue-300">
                                  Approved
                                </span>
                              ) : budget.status === 'draft' ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] border border-amber-300">
                                  Draft
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold text-[10px] border border-slate-200">
                                  Closed
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* View Linked Expenses */}
                                <button
                                  onClick={() => handleViewBudgetExpenses(item)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-all"
                                  title="Audit Linked Expenses"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Approve Budget */}
                                {budget.status === 'draft' && (canUserApproveBudget || isSuperAdmin) && (
                                  <button
                                    onClick={() => handleApproveBudget(budget)}
                                    className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg cursor-pointer transition-all"
                                    title="Approve & Activate Budget"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Edit Budget */}
                                {(canUserManageBudget || isSuperAdmin) && budget.status !== 'closed' && (
                                  <button
                                    onClick={() => handleOpenEditBudget(budget)}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer transition-all"
                                    title="Edit Allocation"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Close Budget */}
                                {(canUserManageBudget || isSuperAdmin) && budget.status === 'active' && (
                                  <button
                                    onClick={() => handleCloseBudget(budget)}
                                    className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded-lg cursor-pointer transition-all"
                                    title="Conclude / Close Allocation"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete (Super Admin only, Draft or Closed) */}
                                {isSuperAdmin && ['draft', 'closed'].includes(budget.status) && (
                                  <button
                                    onClick={() => handleDeleteBudget(budget)}
                                    className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-lg cursor-pointer transition-all"
                                    title="Delete Budget (Super Admin Only)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* BANK MANAGEMENT & RECONCILIATION TAB (CHAPTER 15 SRS - TASK 5) */}
      {/* ============================================================== */}
      {activeTab === 'banking' && (
        <div className="space-y-6" id="admin-finance-banking-section">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            {/* Banking Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl">
                  <Landmark className="w-6 h-6 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Trust Bank Management & Controlled Reconciliation
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Chapter 15 SRS • Multi-Account Treasury Oversight, Deposit & Withdrawal Tracking, Online Settlement Reconciliation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaskedAccountNumbers(!isMaskedAccountNumbers)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title={isMaskedAccountNumbers ? 'Reveal full account numbers' : 'Mask account numbers for privacy'}
                >
                  {isMaskedAccountNumbers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {isMaskedAccountNumbers ? 'Reveal Account Numbers' : 'Mask Account Numbers'}
                </button>
                {(canUserManageBank || isSuperAdmin) && (
                  <button
                    onClick={handleOpenCreateBankAccount}
                    className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Trust Bank Account
                  </button>
                )}
              </div>
            </div>

            {/* 4 Banking KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Treasury Book Balance</span>
                  <Landmark className="w-4 h-4 text-blue-700" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  ₹{bankMetrics.totalBankBalance.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Across {bankMetrics.activeAccountsCount} active Trust bank accounts
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Reconciled Book Volume</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-emerald-800 mt-1">
                  ₹{bankMetrics.reconciledVolume.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">
                  {bankMetrics.reconciledCount} transactions verified & closed
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Unmatched / Open Vouchers</span>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-black text-amber-900 mt-1">
                  {bankMetrics.unmatchedCount} Open
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Awaiting bank statement credit / debit matching
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Pending Review / Timing</span>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-indigo-900 mt-1">
                  {bankMetrics.pendingReviewCount} In-Review
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Flagged discrepancies or transit settlements
                </span>
              </div>
            </div>

            {/* SECTION 1: CONFIGURED TRUST BANK ACCOUNTS DIRECTORY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">
                    Trust Bank Accounts & Institutional Treasury Pools ({bankAccounts.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Official verified banking repositories for donations, grants, institutional expenditures, and online settlements
                  </p>
                </div>
                {(canUserManageBank || isSuperAdmin) && bankAccounts.length > 0 && (
                  <button
                    onClick={handleOpenCreateBankAccount}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Account
                  </button>
                )}
              </div>

              {bankAccounts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                  <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No Trust Bank Accounts Configured</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Authorized finance officers can configure official Trust bank accounts (State Bank of India, HDFC, ICICI, etc.) for institutional tracking.
                  </p>
                  {(canUserManageBank || isSuperAdmin) && (
                    <button
                      onClick={handleOpenCreateBankAccount}
                      className="mt-3 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Configure First Bank Account
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bankAccounts.map((acc) => {
                    const isMasked = isMaskedAccountNumbers;
                    const displayNumber = acc.accountNumber
                      ? isMasked
                        ? `•••• •••• •••• ${acc.accountNumber.slice(-4)}`
                        : acc.accountNumber
                      : 'Not Recorded';

                    return (
                      <div
                        key={acc.id || acc.accountCode}
                        className={`p-4 rounded-2xl border transition-all ${
                          acc.status === 'active'
                            ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                            : 'bg-slate-50/80 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md font-extrabold text-[10px] uppercase tracking-wider border border-blue-200">
                              {acc.accountType}
                            </span>
                            {acc.isPrimary && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md font-bold text-[10px] border border-emerald-200">
                                Primary Treasury
                              </span>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                              acc.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {acc.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <h5 className="font-extrabold text-slate-900 text-sm">{acc.accountName}</h5>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">{acc.bankName}</p>

                        <div className="mt-3 p-2.5 bg-slate-50 rounded-xl space-y-1.5 font-mono text-[11px] border border-slate-100">
                          <div className="flex justify-between items-center text-slate-700">
                            <span className="font-sans text-[10px] text-slate-400 font-bold uppercase">Account No:</span>
                            <span className="font-bold text-slate-900">{displayNumber}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-700">
                            <span className="font-sans text-[10px] text-slate-400 font-bold uppercase">IFSC Code:</span>
                            <span className="font-bold text-slate-900">{acc.ifscCode}</span>
                          </div>
                          {acc.branchName && (
                            <div className="flex justify-between items-center text-slate-700">
                              <span className="font-sans text-[10px] text-slate-400 font-bold uppercase">Branch:</span>
                              <span className="text-slate-800 truncate max-w-[160px]">{acc.branchName}</span>
                            </div>
                          )}
                          {acc.upiId && (
                            <div className="flex justify-between items-center text-slate-700">
                              <span className="font-sans text-[10px] text-slate-400 font-bold uppercase">Trust UPI:</span>
                              <span className="text-emerald-800 font-semibold">{acc.upiId}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Opening Balance</span>
                            <span className="font-black text-slate-900 text-sm">
                              ₹{(Number(acc.openingBalance) || 0).toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedBankAccountId(acc.id || 'all')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              title="Filter transactions by this account"
                            >
                              Filter Txns
                            </button>
                            {(canUserManageBank || isSuperAdmin) && (
                              <>
                                <button
                                  onClick={() => handleOpenEditBankAccount(acc)}
                                  className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-800 rounded-lg transition-all cursor-pointer"
                                  title="Edit Bank Account Particulars"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleBankAccountStatus(acc)}
                                  className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded-lg transition-all cursor-pointer"
                                  title={acc.status === 'active' ? 'Mark Account Inactive' : 'Activate Account'}
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => handleDeleteBankAccount(acc)}
                                    className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-lg transition-all cursor-pointer"
                                    title="Delete Bank Account (Super Admin Only)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: CONTROLLED RECONCILIATION & TRANSACTION MATCHING WORKBENCH */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-700" />
                    Transaction Matching & Bank Reconciliation Workbench
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Reconcile deposits, withdrawals, contra transfers, and Razorpay settlements against official bank credits/debits
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-600">Showing {filteredBankTransactions.length} records</span>
                </div>
              </div>

              {/* Workbench Filter Bar */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 text-xs">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={bankSearchQuery}
                      onChange={(e) => setBankSearchQuery(e.target.value)}
                      placeholder="Search transactions by Payee, ID, UTR, Cheque No, or Razorpay ID..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="w-full md:w-64">
                    <select
                      value={selectedBankAccountId}
                      onChange={(e) => setSelectedBankAccountId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="all">All Bank Accounts</option>
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName} - {acc.accountName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full md:w-48">
                    <select
                      value={selectedReconStatus}
                      onChange={(e) => setSelectedReconStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="all">All Statuses</option>
                      <option value="unmatched">Unmatched Only</option>
                      <option value="matched">Matched Only</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="reconciled">Reconciled Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Transactions Table for Reconciliation */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Txn Code & Voucher</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Payee / Purpose</th>
                        <th className="px-4 py-3">Reference / UTR / Gateway</th>
                        <th className="px-4 py-3">Bank Account</th>
                        <th className="px-4 py-3 text-right">Amount (₹)</th>
                        <th className="px-4 py-3 text-center">Recon Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBankTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-bold text-slate-600">No Transactions Found</p>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                              No financial records match the current bank account or reconciliation filters.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredBankTransactions.map((rec) => {
                          const isDeposit = rec.type === 'income';
                          const status = rec.reconciliationStatus || 'unmatched';

                          return (
                            <tr key={rec.id || rec.transactionId} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3">
                                <span className="font-mono font-bold text-slate-900 block">{rec.transactionId}</span>
                                {rec.voucherNumber && (
                                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                    {rec.voucherNumber}
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                                {rec.date || rec.createdAt.split('T')[0]}
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                    isDeposit
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                                  }`}
                                >
                                  {isDeposit ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                  {isDeposit ? 'Deposit' : 'Withdrawal'}
                                </span>
                              </td>

                              <td className="px-4 py-3 max-w-xs">
                                <span className="font-bold text-slate-900 block truncate">{rec.payerPayeeName}</span>
                                <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                                  {rec.description}
                                </span>
                              </td>

                              <td className="px-4 py-3 font-mono text-[11px]">
                                {rec.referenceNumber ? (
                                  <span className="text-slate-800 font-bold block truncate max-w-[140px]" title={rec.referenceNumber}>
                                    {rec.referenceNumber}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">None Provided</span>
                                )}
                                <span className="text-[10px] text-slate-400 block uppercase">
                                  {rec.paymentMethod || 'gateway'}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-slate-700 font-medium">
                                {rec.bankAccountName ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-blue-900 font-bold">
                                    <Landmark className="w-3 h-3 text-blue-700" />
                                    {rec.bankAccountName}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                                )}
                              </td>

                              <td className="px-4 py-3 text-right font-black text-slate-900">
                                <span className={isDeposit ? 'text-emerald-700' : 'text-slate-900'}>
                                  {isDeposit ? '+' : '-'}₹{(Number(rec.amount) || 0).toLocaleString('en-IN')}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-center">
                                {renderReconStatusBadge(status)}
                              </td>

                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Match / Link with Bank */}
                                  {(canUserReconcile || canUserManageBank || isSuperAdmin) && (
                                    <button
                                      onClick={() => handleOpenMatchModal(rec)}
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer transition-all"
                                      title="Match with Bank Account / Statement"
                                    >
                                      <Link2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Quick Reconcile */}
                                  {(canUserReconcile || isSuperAdmin) && status !== 'reconciled' && (
                                    <button
                                      onClick={() => handleQuickReconcile(rec)}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg cursor-pointer transition-all"
                                      title="Mark Formally Reconciled"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Flag for Review */}
                                  {status !== 'pending_review' && (
                                    <button
                                      onClick={() => handleQuickFlagReview(rec)}
                                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg cursor-pointer transition-all"
                                      title="Flag for Discrepancy / Review"
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Audit Details */}
                                  <button
                                    onClick={() => {
                                      setSelectedRecord(rec);
                                      setIsDetailModalOpen(true);
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-all"
                                    title="View Ledger Voucher & Audit Pipeline"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* INSTITUTIONAL FEE MANAGEMENT TAB (CHAPTER 15.10 SRS - TASK 6) */}
      {/* ============================================================== */}
      {activeTab === 'fees' && (
        <FeeManagementView />
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
                        <option value="direct_donation">Direct Philanthropic Donation (80G)</option>
                        <option value="crowdfunding_donation">Crowdfunding Campaign Donation</option>
                        <option value="membership_fee">Membership Registration / Subscription</option>
                        <option value="school_fee">School Tuition / Receipts</option>
                        <option value="madrasa_fee">Madrasa Fees & Contributions</option>
                        <option value="institutional_grant">Institutional & Corporate Grants</option>
                        <option value="csr_contribution">Corporate CSR Contribution</option>
                        <option value="investment_income">Investment & Bank Yield</option>
                        <option value="event_competition_fee">Academic Competition / Event Fee</option>
                        <option value="corpus_grant">Corpus Endowment Grant</option>
                        <option value="other_income">Other Miscellaneous Income</option>
                      </>
                    ) : (
                      <>
                        <option value="office_administration">Office Administration & Stationery</option>
                        <option value="staff_salaries">Staff & Educator Salaries</option>
                        <option value="utilities_maintenance">Utilities, Rent & Maintenance</option>
                        <option value="construction_infrastructure">Construction & Infrastructure</option>
                        <option value="equipment_purchases">Equipment Purchases & Hardware</option>
                        <option value="educational_materials">Educational Materials & Books</option>
                        <option value="education_scholarships">Educational Scholarships & Grants</option>
                        <option value="medical_assistance">Medical Assistance</option>
                        <option value="relief_activities">Community Relief Activities</option>
                        <option value="campaign_disbursement">Crowdfunding Beneficiary Payout</option>
                        <option value="events_competitions">Events & Competitions</option>
                        <option value="statutory_compliance">Statutory & Audit Compliance</option>
                        <option value="other_expense">Other Configurable Expenditure</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Organizational Unit (SRS Req 9) *</label>
                  <select
                    value={newOrgUnit}
                    onChange={(e) => setNewOrgUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Trust Head Office">Trust Head Office</option>
                    <option value="State Office">State Office</option>
                    <option value="District Office">District Office</option>
                    <option value="School">FET Academy / School</option>
                    <option value="Madrasa">Madrasa Affiliations</option>
                    <option value="Project">Special Project</option>
                    <option value="Campaign">Crowdfunding Campaign</option>
                    <option value="Fund">Dedicated Fund</option>
                  </select>
                </div>
              </div>

              {/* Department & Fund Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              {/* Payment Method & Reference */}
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

              {/* Adjustment Entry Banner (SRS Immutability Principle) */}
              {selectedRecord.isAdjustmentEntry && (
                <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 flex items-start gap-2.5">
                  <Scale className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Authorized Accounting Adjustment Entry</span>
                    <span className="text-[11px] text-purple-700 block mt-0.5">
                      Compensating record for Transaction: <strong className="font-mono">{selectedRecord.originalTransactionId}</strong>
                    </span>
                    {selectedRecord.adjustmentReason && (
                      <span className="text-[11px] text-purple-800 block mt-0.5 font-medium">
                        Justification: {selectedRecord.adjustmentReason}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Supporting Documents & Attachment URLs */}
              {(selectedRecord.invoiceReceiptUrl || (selectedRecord.supportingDocumentUrls && selectedRecord.supportingDocumentUrls.length > 0)) && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1.5">Supporting Documents & Invoices</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.invoiceReceiptUrl && (
                      <a
                        href={selectedRecord.invoiceReceiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-emerald-800 font-bold hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Attached Bill / Invoice <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    )}
                    {selectedRecord.supportingDocumentUrls?.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Document #{idx + 1} <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Stage Visual Approval Pipeline for Expenses */}
              {selectedRecord.type === 'expense' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      Multi-Stage Expense Approval Pipeline (SRS Chapter 15)
                    </span>
                    {selectedRecord.amount > 50000 && (
                      <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                        &gt; ₹50,000 Trust Approval Threshold
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className={`p-2 rounded-lg border ${
                      ['draft', 'submitted', 'department_review', 'finance_review', 'trust_approval', 'approved', 'paid', 'accounted'].includes(selectedRecord.status)
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      <span className="block text-[10px] text-slate-400">1. Requisition</span>
                      <span>✓ Submitted</span>
                    </div>
                    <div className={`p-2 rounded-lg border ${
                      ['finance_review', 'trust_approval', 'approved', 'paid', 'accounted'].includes(selectedRecord.status)
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                        : selectedRecord.status === 'department_review'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-black animate-pulse'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      <span className="block text-[10px] text-slate-400">2. Dept Review</span>
                      <span>{['finance_review', 'trust_approval', 'approved', 'paid', 'accounted'].includes(selectedRecord.status) ? '✓ Verified' : selectedRecord.status === 'department_review' ? 'In Review' : 'Pending'}</span>
                    </div>
                    <div className={`p-2 rounded-lg border ${
                      ['approved', 'paid', 'accounted'].includes(selectedRecord.status)
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                        : selectedRecord.status === 'finance_review' || selectedRecord.status === 'trust_approval'
                        ? 'bg-violet-50 border-violet-300 text-violet-900 font-black'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      <span className="block text-[10px] text-slate-400">3. Finance & Trust</span>
                      <span>{['approved', 'paid', 'accounted'].includes(selectedRecord.status) ? '✓ Authorized' : selectedRecord.status === 'trust_approval' ? 'Trust Pending' : selectedRecord.status === 'finance_review' ? 'Finance Review' : 'Pending'}</span>
                    </div>
                    <div className={`p-2 rounded-lg border ${
                      selectedRecord.status === 'paid' || selectedRecord.status === 'accounted'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                        : selectedRecord.status === 'approved'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      <span className="block text-[10px] text-slate-400">4. Payment & GL</span>
                      <span>{selectedRecord.status === 'accounted' ? '✓ GL Locked' : selectedRecord.status === 'paid' ? '✓ Paid' : selectedRecord.status === 'approved' ? 'Ready to Pay' : 'Pending'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Multi-Stage Audit History Timeline */}
              {selectedRecord.approvalHistory && selectedRecord.approvalHistory.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-slate-400 font-bold block">Approval & Audit Trail Steps</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedRecord.approvalHistory.map((step, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 flex items-start justify-between text-[11px]">
                        <div>
                          <span className="font-extrabold text-slate-800 capitalize">{step.action.replace(/_/g, ' ')}</span>
                          <span className="text-slate-500 block text-[10px]">By {step.actorName || step.actorEmail} ({step.actorRole})</span>
                          {step.notes && <span className="text-slate-600 block mt-0.5 italic text-[10px]">"{step.notes}"</span>}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                          {new Date(step.timestamp).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workflow & Audit Information */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block">Transaction Metadata</span>
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
                  FET India • Registration No. {config.registrationNumber || 'E 9822'} ({config.registrationJurisdiction || 'Jammu & Kashmir'}){config.registrationAct ? ` • ${config.registrationAct}` : ''} • Section 80G & 12A Compliant
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
              <h3 className="text-base font-black text-slate-900">
                {targetAction === 'submit' ? 'Submit Requisition' :
                 targetAction === 'department_approve' ? 'Department Verification' :
                 targetAction === 'finance_verify' ? 'Finance Verification' :
                 targetAction === 'trust_approve' ? 'Executive Trust Authorization' :
                 targetAction === 'approve' ? 'Approve Requisition' :
                 targetAction === 'pay' ? 'Disburse Payment & Record UTR' :
                 targetAction === 'account' ? 'Post to General Ledger' :
                 targetAction === 'reject' ? 'Reject Requisition' :
                 targetAction === 'cancel' ? 'Cancel Transaction' : 'Reverse / Refund Income'}
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
                <span className="text-slate-500 font-bold block">
                  {selectedRecord.type === 'income' ? 'Payer:' : 'Payee:'} {selectedRecord.payerPayeeName}
                </span>
                <span className="text-slate-900 font-black text-sm block mt-0.5">
                  Amount: ₹{selectedRecord.amount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  Transaction: {selectedRecord.transactionId}
                </span>
              </div>

              {targetAction === 'finance_verify' && selectedRecord.amount > 50000 && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-medium">
                  <strong>Threshold Notice:</strong> Requisition amount exceeds ₹50,000 threshold and will proceed to Executive Trust Approval after finance verification.
                </div>
              )}

              {targetAction === 'account' && (
                <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-200 text-teal-900 text-[11px] font-medium">
                  <strong>Immutability Notice:</strong> Once posted to the General Ledger, this record becomes immutable (locked). Any future corrections must use authorized compensating adjustment entries.
                </div>
              )}

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

      {/* ============================================================== */}
      {/* MODAL 5: AUTHORIZED ACCOUNTING ADJUSTMENT ENTRY (IMMUTABILITY) */}
      {/* ============================================================== */}
      {isAdjustmentModalOpen && adjustmentRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-900 rounded-xl">
                  <Scale className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Post Accounting Adjustment
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    SRS Chapter 15 Immutability Principle • Authorized Compensating Entry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="space-y-3.5 text-xs">
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-purple-950">
                <span className="font-bold block text-[11px] text-purple-800 uppercase tracking-wider">Original Transaction Reference</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-black text-sm">{adjustmentRecord.transactionId}</span>
                  <span className="font-black text-sm">₹{adjustmentRecord.amount.toLocaleString('en-IN')} ({adjustmentRecord.type.toUpperCase()})</span>
                </div>
                <span className="text-[11px] text-purple-800 block mt-1">
                  {adjustmentRecord.payerPayeeName} • {formatCategoryLabel(adjustmentRecord.category)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Type *</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-700"
                >
                  <option value="reversal">Full Reversal (Reverses original debit/credit polarity)</option>
                  <option value="correction">Partial Correction (Compensating amount adjustment)</option>
                  <option value="credit_note">Credit Note (Reduces expenditure / vendor credit)</option>
                  <option value="debit_note">Debit Note (Additional charge / correction)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Amount (INR) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mandatory Audit Justification / Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Detail the audit reason, CA advice, cheque cancellation, or mistake requiring this adjustment..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800 block">SRS Immutability Guarantee</span>
                The original record <strong className="font-mono">{adjustmentRecord.transactionId}</strong> will remain untouched in the permanent ledger history. A distinct compensating voucher will be posted and linked.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjustment}
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingAdjustment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
                  Post Compensating Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: CREATE / EDIT BUDGET ALLOCATION (TASK 4) */}
      {/* ============================================================== */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl">
                  <Target className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingBudget ? 'Edit Budget Allocation' : 'Create Budget Allocation'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Chapter 15 SRS • Institutional Allocations & Departmental Ceilings
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Budget Allocation Title *
                </label>
                <input
                  type="text"
                  required
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="e.g. Higher Education Scholarships & Grants 2026-27"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Financial Year *</label>
                  <select
                    value={budgetFY}
                    onChange={(e) => setBudgetFY(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="2026-27">FY 2026-27</option>
                    <option value="2025-26">FY 2025-26</option>
                    <option value="2027-28">FY 2027-28</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department / Wing *</label>
                  <select
                    value={budgetDept}
                    onChange={(e) => setBudgetDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Scholarships">Scholarships & Education</option>
                    <option value="Relief">Emergency Relief</option>
                    <option value="School">FET Academy / School</option>
                    <option value="Madrasa">Madrasa Affiliations</option>
                    <option value="Administration">Secretariat / Admin</option>
                    <option value="Events">Competitions & Events</option>
                    <option value="IT">IT & Digital Systems</option>
                    <option value="General">General Trust Pool</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Category (Chart of Accounts linkage) *</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="all">All Departmental Expenses (General Pool)</option>
                  <option value="education_scholarships">Educational Scholarships & Grants</option>
                  <option value="office_administration">Office Administration & Stationery</option>
                  <option value="staff_salaries">Staff & Educator Salaries</option>
                  <option value="utilities_maintenance">Utilities, Rent & Maintenance</option>
                  <option value="construction_infrastructure">Construction & Infrastructure</option>
                  <option value="equipment_purchases">Equipment Purchases & Hardware</option>
                  <option value="educational_materials">Educational Materials & Books</option>
                  <option value="medical_assistance">Medical Assistance</option>
                  <option value="relief_activities">Community Relief Activities</option>
                  <option value="campaign_disbursement">Crowdfunding Beneficiary Payout</option>
                  <option value="events_competitions">Events & Competitions</option>
                  <option value="statutory_compliance">Statutory & Audit Compliance</option>
                  <option value="other_expense">Other Configurable Expenditure</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Organizational Unit</label>
                  <select
                    value={budgetOrgUnit}
                    onChange={(e) => setBudgetOrgUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Trust Head Office">Trust Head Office</option>
                    <option value="State Office">State Office</option>
                    <option value="District Office">District Office</option>
                    <option value="School">FET Academy / School</option>
                    <option value="Madrasa">Madrasa Affiliations</option>
                    <option value="Project">Special Project</option>
                    <option value="Fund">Dedicated Fund</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fund Allocation</label>
                  <select
                    value={budgetFundType}
                    onChange={(e) => setBudgetFundType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="General">General Trust Fund</option>
                    <option value="Zakat">Zakat Dedicated Pool</option>
                    <option value="Sadaqah">Sadaqah / Lillah Pool</option>
                    <option value="Corpus">Corpus Endowment</option>
                    <option value="Restricted">Restricted Project Fund</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approved Amount (INR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allocation Status *</label>
                  <select
                    value={budgetStatus}
                    onChange={(e) => setBudgetStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="active">Active & Enforced</option>
                    <option value="approved">Approved</option>
                    <option value="draft">Draft (Pending Approval)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Operational Guidelines & Justification
                </label>
                <textarea
                  rows={2}
                  value={budgetNotes}
                  onChange={(e) => setBudgetNotes(e.target.value)}
                  placeholder="Trustee resolution, Board approval note, or purpose of this allocation..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-[11px] text-emerald-900">
                <span className="font-bold block">Dynamic Real-time Utilization</span>
                Actual expenditure is automatically reconciled against approved expense vouchers without creating redundant records or modifying ledger history.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBudget}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingBudget ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {editingBudget ? 'Update Allocation' : 'Create & Allocate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 7: BUDGET LINKED EXPENSES BREAKDOWN MODAL (TASK 4) */}
      {/* ============================================================== */}
      {isBudgetBreakdownOpen && selectedBudgetResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Expenditure Utilization Audit Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedBudgetResult.budget.name} ({selectedBudgetResult.budget.financialYear})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBudgetBreakdownOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Approved Ceiling</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{selectedBudgetResult.allocatedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Actual Utilized</span>
                  <span className="text-base font-black text-rose-900">
                    ₹{selectedBudgetResult.actualSpent.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Available Variance</span>
                  <span className={`text-base font-black ${selectedBudgetResult.isOverspent ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {selectedBudgetResult.isOverspent ? '-' : '+'}₹{Math.abs(selectedBudgetResult.remainingAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Linked Expenses List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-700 text-xs">
                    Linked Approved Vouchers ({selectedBudgetResult.matchingExpenses.length})
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Department: {selectedBudgetResult.budget.department}
                  </span>
                </div>

                {selectedBudgetResult.matchingExpenses.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">Zero Expenditure Charged</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      No approved or paid expense requisitions currently charge against this budget. New requisitions in this department/category will automatically link upon approval.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Transaction ID</th>
                          <th className="px-3 py-2">Payee / Purpose</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedBudgetResult.matchingExpenses.map((exp) => (
                          <tr key={exp.id || exp.transactionId} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono font-bold text-slate-800">
                              {exp.transactionId}
                            </td>
                            <td className="px-3 py-2">
                              <span className="font-bold text-slate-800 block">{exp.payerPayeeName}</span>
                              <span className="text-[10px] text-slate-400 truncate max-w-xs block">
                                {exp.description}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-500 text-[11px]">
                              {exp.date || exp.createdAt.split('T')[0]}
                            </td>
                            <td className="px-3 py-2">
                              {renderStatusBadge(exp.status)}
                            </td>
                            <td className="px-3 py-2 text-right font-black text-slate-900">
                              ₹{exp.amount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBudgetBreakdownOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 8: CREATE / EDIT TRUST BANK ACCOUNT (TASK 5) */}
      {/* ============================================================== */}
      {isBankAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
                  <Landmark className="w-5 h-5 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingBankAccount ? 'Edit Trust Bank Account' : 'Configure Trust Bank Account'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Chapter 15 SRS • Institutional Treasury & Banking Oversight
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBankAccountModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBankAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Account Name / Beneficiary Title *
                </label>
                <input
                  type="text"
                  required
                  value={bankAccName}
                  onChange={(e) => setBankAccName(e.target.value)}
                  placeholder="e.g. FET Main Operations & Treasury Account"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India, HDFC Bank"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Type *</label>
                  <select
                    value={bankAccType}
                    onChange={(e) => setBankAccType(e.target.value as BankAccountType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    <option value="current">Current Account (Operational)</option>
                    <option value="savings">Institutional Savings</option>
                    <option value="fcra">Designated FCRA Account</option>
                    <option value="corpus">Corpus Endowment Account</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bankAccNumber}
                    onChange={(e) => setBankAccNumber(e.target.value)}
                    placeholder="e.g. 38592019482"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="e.g. Srinagar Main Branch"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Balance (INR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={bankOpeningBal}
                      onChange={(e) => setBankOpeningBal(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status *</label>
                  <select
                    value={bankAccStatus}
                    onChange={(e) => setBankAccStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    <option value="active">Active & Operable</option>
                    <option value="inactive">Inactive / Dormant</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trust UPI ID (Optional)</label>
                  <input
                    type="text"
                    value={bankUpi}
                    onChange={(e) => setBankUpi(e.target.value)}
                    placeholder="e.g. fetindia@sbi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-primary-bank"
                  checked={bankIsPrimary}
                  onChange={(e) => setBankIsPrimary(e.target.checked)}
                  className="w-4 h-4 text-emerald-800 rounded-sm focus:ring-emerald-700 cursor-pointer"
                />
                <label htmlFor="chk-primary-bank" className="font-bold text-slate-800 cursor-pointer">
                  Designate as Primary Institutional Treasury Account
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notes & Purpose
                </label>
                <textarea
                  rows={2}
                  value={bankNotes}
                  onChange={(e) => setBankNotes(e.target.value)}
                  placeholder="Board resolution reference, operational mandates, or authorized signatories..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              {/* Zero-Trust Security Guarantee */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-[11px] text-blue-950 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Zero-Trust Banking Policy</span>
                  In accordance with statutory security and FET India charter principles, internet-banking credentials, net-banking passwords, ATM PINs, and OTPs are NEVER handled, requested, or stored.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBankAccountModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBank}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingBank ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {editingBankAccount ? 'Update Account' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 9: BANK TRANSACTION MATCHING & RECONCILIATION (TASK 5) */}
      {/* ============================================================== */}
      {isMatchModalOpen && recordToMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl">
                  <Link2 className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Match Transaction with Bank Record
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Chapter 15 SRS • Reconciliation & Audit Trail
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMatchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMatch} className="space-y-3.5 text-xs">
              {/* Selected Transaction Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-extrabold text-slate-900">{recordToMatch.transactionId}</span>
                  <span className="font-mono text-slate-500">{recordToMatch.date || recordToMatch.createdAt.split('T')[0]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 truncate max-w-[200px]">{recordToMatch.payerPayeeName}</span>
                  <span className={`font-black text-sm ${recordToMatch.type === 'income' ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {recordToMatch.type === 'income' ? '+' : '-'}₹{(Number(recordToMatch.amount) || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">{recordToMatch.description}</p>
                {recordToMatch.referenceNumber && (
                  <p className="text-[10px] font-mono text-slate-600 bg-white p-1 rounded-md border border-slate-100">
                    Existing Ref / Gateway: <strong>{recordToMatch.referenceNumber}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Trust Bank Account *
                </label>
                {bankAccounts.length === 0 ? (
                  <p className="p-2 bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold">
                    No bank accounts configured yet. Please configure a Trust bank account first.
                  </p>
                ) : (
                  <select
                    required
                    value={matchBankAccountId}
                    onChange={(e) => setMatchBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">Select Target Bank Account...</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountName} ({acc.accountType.toUpperCase()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bank Statement Reference / Clearing UTR *
                </label>
                <input
                  type="text"
                  required
                  value={matchStatementRef}
                  onChange={(e) => setMatchStatementRef(e.target.value)}
                  placeholder="e.g. SBI/NEFT/0029481928, Bank Statement Line 54, UTR 20261002"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reconciliation Classification *
                </label>
                <select
                  value={matchReconStatus}
                  onChange={(e) => setMatchReconStatus(e.target.value as BankReconciliationStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="matched">Matched (Bank credit / debit verified)</option>
                  <option value="pending_review">Pending Review (Discrepancy / In-Transit timing)</option>
                  <option value="reconciled">Reconciled (Formally audited & closed)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reconciliation Notes & Remarks
                </label>
                <textarea
                  rows={2}
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  placeholder="Statement date, branch verification note, or clarification..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-[11px] text-emerald-950">
                <span className="font-bold block">Financial Immutability Guarantee</span>
                Matching links bank statement clearing references without modifying the original transaction amount or general ledger voucher history.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMatch || !matchBankAccountId}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingMatch ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Save Match & Reconcile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
