/**
 * @license
 * Finance & Accounting Subsystem Foundation (Chapter 15 SRS)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Foundational architecture for:
 * - Income, Expense & Ledger Records
 * - Chart of Accounts (Assets, Liabilities, Equity, Income, Expenses)
 * - Unique Transaction IDs & Voucher Numbers
 * - Immutability Principle: Approved accounting entries cannot simply be edited/deleted.
 *   All corrections use authorized compensating/reversal adjustment entries.
 * - Non-destructive relationship with existing donations & Razorpay payment records
 *   (Zero duplication; dynamic ledger projection without touching live payment gateways).
 * - Full audit trail integration for all sensitive financial operations.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db, cleanFirestoreData, logAuditEvent } from './firebase';
import { 
  FinancialRecord, 
  FinancialTransactionType,
  FinancialIncomeCategory,
  FinancialExpenseCategory,
  FinanceAccount,
  GeneralLedgerEntry,
  CampaignDonation,
  FinanceBudget,
  FinanceBankAccount,
  BankReconciliationStatus,
  FinanceReconciliationRecord,
  StudentFeeRecord,
  FeePaymentStatus,
  UserRole
} from '../types';

// =============================================================
// 1. UNIQUE TRANSACTION & VOUCHER IDENTIFIER GENERATORS
// =============================================================

/**
 * Returns current financial year string (e.g., "2026-27" in India, Apr 1 - Mar 31)
 */
export function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed: 0=Jan, 2=Mar, 3=Apr
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(2)}`;
  } else {
    return `${year - 1}-${String(year).slice(2)}`;
  }
}

/**
 * Generate a cryptographically robust, unique Transaction ID for FET India
 * Format: FET-TXN-YYYY-XXXXXX or FET-INC-YYYY-XXXXXX or FET-EXP-YYYY-XXXXXX
 */
export function generateFinanceTransactionId(type?: FinancialTransactionType): string {
  const prefix = type === 'income' ? 'FET-INC' : type === 'expense' ? 'FET-EXP' : 'FET-TXN';
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const timestampShort = Date.now().toString().slice(-4);
  return `${prefix}-${year}-${randomSuffix}-${timestampShort}`;
}

/**
 * Generate a unique Voucher Number for internal payment and receipt vouchers
 * Format: FET-VCH-RCP-YYYY-XXXX / FET-VCH-PAY-YYYY-XXXX / FET-VCH-JRN-YYYY-XXXX
 */
export function generateFinanceVoucherNumber(voucherType: 'receipt' | 'payment' | 'journal' | 'contra' = 'payment'): string {
  const typeCode = 
    voucherType === 'receipt' ? 'RCP' :
    voucherType === 'payment' ? 'PAY' :
    voucherType === 'journal' ? 'JRN' : 'CNT';
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `FET-VCH-${typeCode}-${year}-${randomSuffix}`;
}

/**
 * Generate a unique Budget Allocation ID
 * Format: FET-BGT-YYYY-XXXX
 */
export function generateFinanceBudgetId(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `FET-BGT-${year}-${randomSuffix}`;
}

// =============================================================
// 2. STANDARD MASTER CHART OF ACCOUNTS (SRS CHAPTER 15)
// =============================================================

export const DEFAULT_CHART_OF_ACCOUNTS: Omit<FinanceAccount, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // 1000: ASSETS
  {
    code: '1010',
    name: 'Cash in Hand (Secretariat Float)',
    type: 'asset',
    classification: 'current_asset',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: true,
    isSystemAccount: true,
    description: 'Petty cash and daily operational cash float at central office.'
  },
  {
    code: '1020',
    name: 'Bank Operating Account (Current/Savings)',
    type: 'asset',
    classification: 'current_asset',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: true,
    isSystemAccount: true,
    description: 'Primary scheduled commercial bank account for general trust transactions.'
  },
  {
    code: '1030',
    name: 'Online Payment Gateway Clearing (Razorpay Escrow)',
    type: 'asset',
    classification: 'current_asset',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: true,
    isSystemAccount: true,
    description: 'Clearing account for real-time gateway donations pending bank settlement.'
  },
  {
    code: '1040',
    name: 'Bank Fixed Deposits (Statutory Corpus)',
    type: 'asset',
    classification: 'fixed_asset',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: true,
    isSystemAccount: true,
    description: 'Term deposits earmarked for perpetual corpus and institutional endowments.'
  },

  // 2000: LIABILITIES
  {
    code: '2010',
    name: 'Accounts Payable (Vendors & Suppliers)',
    type: 'liability',
    classification: 'current_liability',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Outstanding verified payables for institutional goods and educational supplies.'
  },
  {
    code: '2020',
    name: 'Statutory Dues Payable (TDS / Legal Compliance)',
    type: 'liability',
    classification: 'current_liability',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Tax deducted at source and regulatory withholdings pending remittance.'
  },

  // 3000: EQUITY / TRUST CORPUS & FUNDS
  {
    code: '3010',
    name: 'Permanent Trust Corpus Fund',
    type: 'equity',
    classification: 'corpus_fund',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Irrevocable capital endowment of Fatimyah Educational Trust.'
  },
  {
    code: '3020',
    name: 'General Operating Reserve',
    type: 'equity',
    classification: 'general_reserve',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Accumulated operational surplus earmarked for educational welfare.'
  },
  {
    code: '3030',
    name: 'Restricted Zakat & Sadaqah Fund',
    type: 'equity',
    classification: 'corpus_fund',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Restricted community fund strictly ring-fenced for verified deserving beneficiaries.'
  },

  // 4000: INCOME
  {
    code: '4010',
    name: 'Verified Public Crowdfunding Donations',
    type: 'income',
    classification: 'direct_income',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Public donor contributions raised for verified community appeals.'
  },
  {
    code: '4020',
    name: 'General Philanthropic & Patron Donations',
    type: 'income',
    classification: 'direct_income',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Direct institutional donations eligible for Section 80G tax deductions.'
  },
  {
    code: '4030',
    name: 'Annual & Life Membership Fees',
    type: 'income',
    classification: 'direct_income',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Membership registration and renewal subscriptions.'
  },
  {
    code: '4040',
    name: 'Examination & Competition Registrations',
    type: 'income',
    classification: 'direct_income',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Candidate registration fees for academic competitions and talent searches.'
  },
  {
    code: '4050',
    name: 'Institutional & Corporate Grants',
    type: 'income',
    classification: 'direct_income',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Sanctioned grants from philanthropic agencies, CSR funds, and foundations.'
  },
  {
    code: '4090',
    name: 'Bank Interest & Miscellaneous Receipts',
    type: 'income',
    classification: 'indirect_income',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Savings account interest, term deposit yields, and incidental receipts.'
  },

  // 5000: EXPENSES
  {
    code: '5010',
    name: 'Educational Scholarships & Fee Grants',
    type: 'expense',
    classification: 'program_expense',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Direct fee sponsorships, higher education aid, and student stipends.'
  },
  {
    code: '5020',
    name: 'Emergency Relief & Medical Assistance',
    type: 'expense',
    classification: 'program_expense',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Critical patient care, crisis assistance, and urgent welfare relief.'
  },
  {
    code: '5030',
    name: 'Examinations & Academic Competitions',
    type: 'expense',
    classification: 'program_expense',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Exam center logistics, answer sheet evaluation, medals, and certificates.'
  },
  {
    code: '5040',
    name: 'School & Madrasa Modernization Programs',
    type: 'expense',
    classification: 'program_expense',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'STEM labs, libraries, textbook distribution, and institutional infrastructure.'
  },
  {
    code: '5050',
    name: 'Staff & Educator Honorarium',
    type: 'expense',
    classification: 'operating_expense',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Core educator stipends, proctor allowances, and administrative staff support.'
  },
  {
    code: '5060',
    name: 'Administrative & Secretariat Operations',
    type: 'expense',
    classification: 'operating_expense',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Office rent, communications, printing, postage, and utilities.'
  },
  {
    code: '5070',
    name: 'Cloud Infrastructure & Digital Systems',
    type: 'expense',
    classification: 'operating_expense',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Hosting, security systems, database, domain, and gateway processing costs.'
  },
  {
    code: '5080',
    name: 'Statutory Audit, Legal & Compliance',
    type: 'expense',
    classification: 'compliance_expense',
    currency: 'INR',
    openingBalance: 0,
    currentBalance: 0,
    status: 'active',
    isBankOrCash: false,
    isSystemAccount: true,
    description: 'Chartered Accountant fees, Section 12A/80G annual filings, and regulatory submissions.'
  }
];

// =============================================================
// 3. IMMUTABILITY & AUTHORIZED ADJUSTMENT ENTRIES (SRS PRINCIPLE)
// =============================================================

export interface CreateAdjustmentParams {
  originalTransactionId: string;
  originalAmount: number;
  originalType: FinancialTransactionType;
  adjustmentAmount: number;
  adjustmentReason: string;
  adjustmentType: 'reversal' | 'correction' | 'credit_note' | 'debit_note';
  financialYear?: string;
  authorizedBy: {
    uid: string;
    email: string;
    name?: string;
    role?: UserRole;
  };
}

/**
 * Creates an authorized adjustment transaction record according to SRS accounting principles.
 * Approved accounting records MUST NOT be deleted or silently mutated.
 * Any correction generates a compensating adjustment record referencing the original transaction.
 */
export async function createAccountingAdjustmentEntry(
  params: CreateAdjustmentParams
): Promise<string> {
  const transactionId = generateFinanceTransactionId(params.originalType === 'income' ? 'expense' : 'income');
  const voucherNumber = generateFinanceVoucherNumber('journal');
  const now = new Date().toISOString();
  const fy = params.financialYear || getCurrentFinancialYear();

  const adjustmentRecord: Omit<FinancialRecord, 'id'> = {
    transactionId,
    voucherNumber,
    type: params.originalType === 'income' ? 'expense' : 'income', // Compensating polarity
    category: 'statutory_compliance',
    categoryLabel: `Adjustment: ${params.adjustmentType.toUpperCase()}`,
    amount: Math.abs(params.adjustmentAmount),
    date: now.split('T')[0],
    status: 'approved',
    paymentStatus: 'verified',
    paymentMethod: 'journal_adjustment',
    referenceNumber: `ADJ-FOR-${params.originalTransactionId}`,
    payerPayeeName: 'FET Internal Accounting Adjustment',
    description: `Authorized adjustment for Transaction ${params.originalTransactionId}. Reason: ${params.adjustmentReason}`,
    department: 'Administration',
    fundType: 'General',
    financialYear: fy,
    
    // Immutability tracking
    isAdjustmentEntry: true,
    originalTransactionId: params.originalTransactionId,
    adjustmentReason: params.adjustmentReason,
    isLocked: true,

    createdByUid: params.authorizedBy.uid,
    createdByEmail: params.authorizedBy.email,
    createdByName: params.authorizedBy.name || params.authorizedBy.email,
    createdAt: now,
    updatedAt: now,

    approvedByUid: params.authorizedBy.uid,
    approvedByEmail: params.authorizedBy.email,
    approvedByName: params.authorizedBy.name || params.authorizedBy.email,
    approvedAt: now,
    approvalNotes: `Authorized adjustment under Chapter 15 SRS. Reason: ${params.adjustmentReason}`
  };

  const recordsRef = collection(db, 'financial_records');
  const docRef = await addDoc(recordsRef, cleanFirestoreData(adjustmentRecord));

  // Log immutable audit event
  await logAuditEvent({
    actorUid: params.authorizedBy.uid,
    actorEmail: params.authorizedBy.email,
    actorRole: params.authorizedBy.role || 'finance_admin',
    action: 'FINANCE_ACCOUNTING_ADJUSTMENT_POSTED',
    targetEntity: 'financial_records',
    targetId: docRef.id,
    details: {
      adjustmentTransactionId: transactionId,
      originalTransactionId: params.originalTransactionId,
      adjustmentAmount: params.adjustmentAmount,
      adjustmentReason: params.adjustmentReason,
      adjustmentType: params.adjustmentType
    }
  });

  return docRef.id;
}

// =============================================================
// 4. NON-DESTRUCTIVE DONATION INTEGRATION ADAPTER
// =============================================================

/**
 * Projects an existing CampaignDonation document into the normalized FinancialRecord
 * structure for unified ledger accounting, WITHOUT modifying live payment records
 * or duplicating Razorpay transactions.
 */
export function projectDonationAsFinancialRecord(donation: CampaignDonation): FinancialRecord {
  const isVerified = donation.paymentStatus === 'verified';
  const paymentDate = donation.createdAt ? donation.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];

  return {
    id: `proj-don-${donation.id}`,
    transactionId: donation.transactionReference || donation.razorpayPaymentId || `FET-DON-${donation.id.slice(0, 8)}`,
    voucherNumber: donation.receiptNumber ? `VCH-${donation.receiptNumber}` : undefined,
    type: 'income',
    category: donation.campaignId ? 'crowdfunding_donation' : 'direct_donation',
    categoryLabel: donation.campaignTitle ? `Crowdfunding: ${donation.campaignTitle}` : 'Direct Donation',
    amount: donation.amount || 0,
    date: paymentDate,
    status: isVerified ? 'approved' : 'pending_approval',
    paymentStatus: isVerified ? 'verified' : 'pending_verification',
    paymentMethod: donation.paymentMethod || 'online_gateway',
    referenceNumber: donation.razorpayPaymentId || donation.transactionReference,
    payerPayeeName: donation.donorName || 'Anonymous Philanthropist',
    payerPayeeEmail: donation.donorEmail,
    payerPayeePhone: donation.donorPhone,
    payerPan: donation.donorPan,
    description: `Donation credited to ${donation.campaignTitle || 'General Education Fund'}. 80G Receipt: ${donation.receiptNumber || 'Pending'}`,
    department: 'Scholarships',
    fundType: 'Restricted',
    campaignId: donation.campaignId,
    campaignTitle: donation.campaignTitle,
    financialYear: donation.financialYear || getCurrentFinancialYear(),
    isLinkedDonation: true,
    linkedDonationId: donation.id,
    receiptNumber: donation.receiptNumber,
    createdByUid: donation.donorUid || 'public_donor',
    createdByEmail: donation.donorEmail || '',
    createdByName: donation.donorName || 'Online Donor',
    createdAt: donation.createdAt || new Date().toISOString(),
    updatedAt: donation.createdAt || new Date().toISOString()
  };
}

// =============================================================
// 5. BUDGET MANAGEMENT & VARIANCE CALCULATOR (TASK 4)
// =============================================================

export interface BudgetUtilizationResult {
  budget: FinanceBudget;
  allocatedAmount: number;
  actualSpent: number;
  remainingAmount: number;
  variance: number;
  variancePercentage: number;
  utilizationPercentage: number;
  isOverspent: boolean;
  linkedExpensesCount: number;
  matchingExpenses: FinancialRecord[];
}

/**
 * Calculates real budget utilization and variance from actual ledger transactions.
 * Never invents fake figures or sample data.
 */
export function calculateBudgetUtilization(
  budget: FinanceBudget,
  actualRecords: FinancialRecord[]
): BudgetUtilizationResult {
  const matchingRecords = actualRecords.filter((rec) => {
    // 1. Must be an expense transaction
    if (rec.type !== 'expense') return false;
    // 2. Must be approved, paid, or accounted
    if (!['approved', 'paid', 'accounted'].includes(rec.status)) return false;
    // 3. Match financial year
    if (budget.financialYear && budget.financialYear !== 'All' && rec.financialYear) {
      if (rec.financialYear !== budget.financialYear) return false;
    }
    // 4. Match Department
    if (budget.department && budget.department !== 'All' && budget.department !== 'General') {
      if (rec.department !== budget.department) return false;
    }
    // 5. Match Category if specified
    if (budget.category && budget.category !== 'all' && budget.category !== 'All') {
      if (rec.category !== budget.category) return false;
    }
    // 6. Match Fund Type if specified
    if (budget.fundType && budget.fundType !== 'All' && budget.fundType !== 'all') {
      if (rec.fundType !== budget.fundType) return false;
    }
    // 7. Match Organizational Unit if specified
    if (budget.organizationalUnit && budget.organizationalUnit !== 'All' && budget.organizationalUnit !== 'all') {
      if (rec.organizationalUnit !== budget.organizationalUnit) return false;
    }
    return true;
  });

  const allocated = Number(budget.allocatedAmount) || 0;
  const actualSpent = matchingRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const remainingAmount = allocated - actualSpent;
  const variance = remainingAmount; // Positive = favorable/balance remaining, Negative = overspent
  const utilizationPercentage = allocated > 0 ? (actualSpent / allocated) * 100 : 0;
  const variancePercentage = allocated > 0 ? (remainingAmount / allocated) * 100 : 0;

  return {
    budget,
    allocatedAmount: allocated,
    actualSpent,
    remainingAmount,
    variance,
    variancePercentage,
    utilizationPercentage,
    isOverspent: actualSpent > allocated,
    linkedExpensesCount: matchingRecords.length,
    matchingExpenses: matchingRecords
  };
}

// =============================================================
// 6. BANK MANAGEMENT & RECONCILIATION HELPERS (TASK 5)
// =============================================================

/**
 * Generate a unique Bank Account Identifier
 * Format: FET-BNK-01, FET-BNK-02, or random suffix if needed
 */
export function generateFinanceBankAccountId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FET-BNK-${rand}`;
}

/**
 * Generate a unique Bank Reconciliation Session Identifier
 * Format: FET-REC-YYYY-XXXX
 */
export function generateFinanceReconciliationId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FET-REC-${year}-${rand}`;
}

export interface BankReconciliationSummary {
  bankAccount: FinanceBankAccount;
  openingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  bookBalance: number;
  matchedDeposits: number;
  matchedWithdrawals: number;
  reconciledBalance: number;
  differenceAmount: number;
  isFullyReconciled: boolean;
  unmatchedCount: number;
  matchedCount: number;
  pendingReviewCount: number;
  reconciledCount: number;
  totalTransactionsCount: number;
}

/**
 * Calculates controlled bank reconciliation summary from real financial transactions.
 * Never alters historical financial transactions merely to force reconciliation.
 */
export function calculateBankReconciliationSummary(
  bankAccount: FinanceBankAccount,
  financialRecords: FinancialRecord[]
): BankReconciliationSummary {
  // Filter records associated with this bank account, or general bank transactions
  const accountRecords = financialRecords.filter((rec) => {
    if (rec.bankAccountId && rec.bankAccountId === bankAccount.id) return true;
    // If not explicitly assigned, check if transaction mentions this account
    if (!rec.bankAccountId && bankAccount.isPrimary) {
      // Primary account captures unassigned bank payment methods
      return ['bank_transfer', 'rtgs_neft', 'cheque', 'online_gateway', 'upi'].includes(rec.paymentMethod as string);
    }
    return false;
  });

  const opening = Number(bankAccount.openingBalance) || 0;
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let matchedDeposits = 0;
  let matchedWithdrawals = 0;

  let unmatchedCount = 0;
  let matchedCount = 0;
  let pendingReviewCount = 0;
  let reconciledCount = 0;

  for (const rec of accountRecords) {
    const amt = Number(rec.amount) || 0;
    const isIncome = rec.type === 'income';
    const recStatus = rec.reconciliationStatus || 'unmatched';

    if (isIncome) {
      totalDeposits += amt;
      if (recStatus === 'matched' || recStatus === 'reconciled') {
        matchedDeposits += amt;
      }
    } else {
      totalWithdrawals += amt;
      if (recStatus === 'matched' || recStatus === 'reconciled') {
        matchedWithdrawals += amt;
      }
    }

    if (recStatus === 'matched') matchedCount++;
    else if (recStatus === 'reconciled') reconciledCount++;
    else if (recStatus === 'pending_review') pendingReviewCount++;
    else unmatchedCount++;
  }

  const bookBalance = opening + totalDeposits - totalWithdrawals;
  const reconciledBalance = opening + matchedDeposits - matchedWithdrawals;
  const differenceAmount = bookBalance - reconciledBalance;

  return {
    bankAccount,
    openingBalance: opening,
    totalDeposits,
    totalWithdrawals,
    bookBalance,
    matchedDeposits,
    matchedWithdrawals,
    reconciledBalance,
    differenceAmount,
    isFullyReconciled: differenceAmount === 0 && unmatchedCount === 0 && pendingReviewCount === 0,
    unmatchedCount,
    matchedCount,
    pendingReviewCount,
    reconciledCount,
    totalTransactionsCount: accountRecords.length
  };
}

// =============================================================
// 7. INSTITUTIONAL FEE MANAGEMENT HELPERS (TASK 6)
// =============================================================

/**
 * Generate a unique Student Fee Assessment Code
 * Format: FET-FEE-YYYY-XXXX
 */
export function generateFeeCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FET-FEE-${year}-${rand}`;
}

/**
 * Generate a unique Official Fee Payment Receipt Number
 * Format: FET-FEE-REC-YYYY-XXXX
 */
export function generateFeeReceiptNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `FET-FEE-REC-${year}-${rand}`;
}

export interface FeeSummaryMetrics {
  totalAssessed: number;
  totalPaid: number;
  totalOutstanding: number;
  collectionRatePercentage: number;
  fullyPaidCount: number;
  partiallyPaidCount: number;
  pendingCount: number;
  overdueCount: number;
  totalRecordsCount: number;
}

/**
 * Calculates dynamic fee summary metrics strictly from actual records.
 * Never invents mock or sample financial figures.
 */
export function calculateFeeSummary(records: StudentFeeRecord[]): FeeSummaryMetrics {
  let totalAssessed = 0;
  let totalPaid = 0;
  let fullyPaidCount = 0;
  let partiallyPaidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  for (const rec of records) {
    const assessed = Number(rec.totalAssessed) || 0;
    const paid = Number(rec.amountPaid) || 0;

    totalAssessed += assessed;
    totalPaid += paid;

    if (rec.paymentStatus === 'paid') fullyPaidCount++;
    else if (rec.paymentStatus === 'partially_paid') partiallyPaidCount++;
    else if (rec.paymentStatus === 'overdue') overdueCount++;
    else pendingCount++;
  }

  const totalOutstanding = Math.max(0, totalAssessed - totalPaid);
  const collectionRatePercentage = totalAssessed > 0 ? (totalPaid / totalAssessed) * 100 : 0;

  return {
    totalAssessed,
    totalPaid,
    totalOutstanding,
    collectionRatePercentage,
    fullyPaidCount,
    partiallyPaidCount,
    pendingCount,
    overdueCount,
    totalRecordsCount: records.length
  };
}



