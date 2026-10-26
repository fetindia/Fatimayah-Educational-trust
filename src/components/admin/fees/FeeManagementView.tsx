/**
 * @license
 * Institutional Fee Management Console (Chapter 15.10 SRS - Task 6)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Manages school and madrasa student fee assessments, online Razorpay collections,
 * official receipt issuance, outstanding ledger tracking, and payment reminders.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  DollarSign,
  Search,
  Filter,
  Plus,
  CreditCard,
  Receipt,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Building,
  User,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
  Trash2,
  Edit,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  StudentFeeRecord, 
  FeeCategoryType, 
  FeePaymentStatus, 
  FeePaymentPayload 
} from '../../../types';
import {
  subscribeToStudentFees,
  createStudentFeeRecord,
  updateStudentFeeRecord,
  recordFeePayment,
  sendFeePaymentReminder,
  deleteStudentFeeRecord
} from '../../../lib/firebase';
import { 
  generateFeeCode, 
  calculateFeeSummary, 
  FeeSummaryMetrics 
} from '../../../lib/financeFoundation';
import {
  canManageSchoolFees,
  canManageMadrasaFees,
  canCollectFees,
  canSendFeeReminders,
  canViewFeeManagement
} from '../../../lib/rbac';
import { initiateRazorpayContribution, PaymentVerificationResult } from '../../../lib/razorpay';
import { PrintableFeeReceiptModal } from './PrintableFeeReceiptModal';

export const INSTITUTION_OPTIONS = [
  // School ERP Institutions
  { id: 'SCH-01', name: 'FET Model Academy Srinagar', type: 'school' as const },
  { id: 'SCH-02', name: 'FET Public School Jammu', type: 'school' as const },
  { id: 'SCH-03', name: 'Imamia Model Academy', type: 'school' as const },
  { id: 'SCH-04', name: 'Madina Model Academy', type: 'school' as const },
  // Madrasa ERP Institutions
  { id: 'MAD-01', name: 'Madrasa Fatimyah Al-Zahra', type: 'madrasa' as const },
  { id: 'MAD-02', name: 'Jamia Imam Sadiq Islamic Academy', type: 'madrasa' as const },
  { id: 'MAD-03', name: 'Darul Uloom Fatimyah', type: 'madrasa' as const },
  { id: 'MAD-04', name: 'Markaz-e-Taaleem Al-Qur\'an', type: 'madrasa' as const }
];

export const FEE_CATEGORY_OPTIONS: { id: FeeCategoryType; label: string; desc: string }[] = [
  { id: 'admission', label: 'Admission Fees', desc: 'New admission enrollment & registration charge' },
  { id: 'tuition', label: 'Tuition Fees', desc: 'Academic session syllabus & classroom instruction' },
  { id: 'hostel', label: 'Hostel & Boarding Fees', desc: 'Residential lodging, boarding, and mess charges' },
  { id: 'examination', label: 'Examination Fees', desc: 'Term tests, assessment evaluations, and hall tickets' },
  { id: 'library', label: 'Library Fees', desc: 'Learning resources, textbooks, and journal archives' },
  { id: 'transport', label: 'Transport Fees', desc: 'Student bus transit routes and commuting maintenance' },
  { id: 'other', label: 'Other Configured Fees', desc: 'Laboratory, cultural activities, and institutional services' }
];

interface FeeManagementViewProps {
  forcedInstitutionType?: 'school' | 'madrasa';
  title?: string;
  subtitle?: string;
}

export const FeeManagementView: React.FC<FeeManagementViewProps> = ({
  forcedInstitutionType,
  title,
  subtitle
}) => {
  const { currentUser, userProfile, isSuperAdmin } = useAuth();

  // Data state
  const [fees, setFees] = useState<StudentFeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [institutionTypeFilter, setInstitutionTypeFilter] = useState<'all' | 'school' | 'madrasa'>(forcedInstitutionType || 'all');
  const [institutionIdFilter, setInstitutionIdFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('all');

  // Modals state
  const [isAssessModalOpen, setIsAssessModalOpen] = useState<boolean>(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const [activeFee, setActiveFee] = useState<StudentFeeRecord | null>(null);

  // Assess Form State
  const [studentName, setStudentName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [parentName, setParentName] = useState<string>('');
  const [parentEmail, setParentEmail] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [institutionId, setInstitutionId] = useState<string>(forcedInstitutionType === 'madrasa' ? 'MAD-01' : 'SCH-01');
  const [academicSession, setAcademicSession] = useState<string>('AY 2026-2027');
  const [courseOrGrade, setCourseOrGrade] = useState<string>('Grade 10 - Section A');
  const [feeCategory, setFeeCategory] = useState<FeeCategoryType>('tuition');
  const [feeDescription, setFeeDescription] = useState<string>('');
  const [totalAssessed, setTotalAssessed] = useState<string>('5000');
  const [initialAmountPaid, setInitialAmountPaid] = useState<string>('0');
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<string>('cash');
  const [isSubmittingAssess, setIsSubmittingAssess] = useState<boolean>(false);

  // Collect Payment Form State
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectMode, setCollectMode] = useState<'razorpay' | 'cash' | 'bank_transfer' | 'upi' | 'cheque'>('razorpay');
  const [collectReference, setCollectReference] = useState<string>('');
  const [collectDate, setCollectDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [collectNotes, setCollectNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  // Reminder state
  const [isSendingReminder, setIsSendingReminder] = useState<boolean>(false);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // RBAC checks
  const canManageSchool = canManageSchoolFees(userProfile, isSuperAdmin);
  const canManageMadrasa = canManageMadrasaFees(userProfile, isSuperAdmin);
  const canCollect = canCollectFees(userProfile, isSuperAdmin);
  const canRemind = canSendFeeReminders(userProfile, isSuperAdmin);
  const hasAccess = canViewFeeManagement(userProfile, isSuperAdmin) || canManageSchool || canManageMadrasa;

  // Real-time subscription to student fees
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToStudentFees(
      (feesList) => {
        setFees(feesList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error in student fees listener:', err);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Filtered Records
  const effectiveInstitutionType = forcedInstitutionType || (institutionTypeFilter === 'all' ? undefined : institutionTypeFilter);

  const filteredFees = useMemo(() => {
    return fees.filter((fee) => {
      // 1. Institution Type Filter
      if (effectiveInstitutionType && fee.institutionType !== effectiveInstitutionType) {
        return false;
      }
      // 2. Specific Institution ID Filter
      if (institutionIdFilter !== 'all' && fee.institutionId !== institutionIdFilter) {
        return false;
      }
      // 3. Category Filter
      if (categoryFilter !== 'all' && fee.category !== categoryFilter) {
        return false;
      }
      // 4. Status Filter
      if (statusFilter !== 'all' && fee.paymentStatus !== statusFilter) {
        return false;
      }
      // 5. Session Filter
      if (sessionFilter !== 'all' && fee.academicSession !== sessionFilter) {
        return false;
      }
      // 6. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          fee.studentName?.toLowerCase().includes(q) ||
          fee.studentId?.toLowerCase().includes(q) ||
          fee.feeCode?.toLowerCase().includes(q) ||
          fee.receiptNumber?.toLowerCase().includes(q) ||
          fee.institutionName?.toLowerCase().includes(q) ||
          fee.courseOrGrade?.toLowerCase().includes(q) ||
          fee.parentName?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    fees,
    effectiveInstitutionType,
    institutionIdFilter,
    categoryFilter,
    statusFilter,
    sessionFilter,
    searchQuery
  ]);

  // Dynamic fee metrics calculated strictly from filtered records
  const feeMetrics: FeeSummaryMetrics = useMemo(() => {
    return calculateFeeSummary(filteredFees);
  }, [filteredFees]);

  // Handle Open Assess Modal
  const handleOpenAssessModal = () => {
    setStudentName('');
    setStudentId(`FET-STU-${Math.floor(1000 + Math.random() * 9000)}`);
    setParentName('');
    setParentEmail('');
    setParentPhone('');
    setInstitutionId(forcedInstitutionType === 'madrasa' ? 'MAD-01' : 'SCH-01');
    setAcademicSession('AY 2026-2027');
    setCourseOrGrade(forcedInstitutionType === 'madrasa' ? 'Hifz Course - Year 1' : 'Grade 10 - Section A');
    setFeeCategory('tuition');
    setFeeDescription('Term 1 Academic Tuition Assessment');
    setTotalAssessed('5000');
    setInitialAmountPaid('0');
    setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setIsAssessModalOpen(true);
  };

  // Submit Assess Form
  const handleSubmitAssess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('You must be signed in to assess fees.', 'error');
      return;
    }

    const assessedNum = Number(totalAssessed) || 0;
    const initialPaidNum = Number(initialAmountPaid) || 0;

    if (!studentName.trim() || !studentId.trim()) {
      showToast('Student name and roll number / identifier are required.', 'error');
      return;
    }
    if (assessedNum <= 0) {
      showToast('Total assessed fee must be greater than zero.', 'error');
      return;
    }
    if (initialPaidNum > assessedNum) {
      showToast('Initial amount paid cannot exceed total fee assessed.', 'error');
      return;
    }

    const selectedInst = INSTITUTION_OPTIONS.find((i) => i.id === institutionId) || INSTITUTION_OPTIONS[0];
    const catLabel = FEE_CATEGORY_OPTIONS.find((c) => c.id === feeCategory)?.label || feeCategory;

    setIsSubmittingAssess(true);
    try {
      const feeCode = generateFeeCode();
      const newFeeRecord: Omit<StudentFeeRecord, 'id'> = {
        feeCode,
        studentName: studentName.trim(),
        studentId: studentId.trim(),
        parentName: parentName.trim() || undefined,
        parentEmail: parentEmail.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        institutionType: selectedInst.type,
        institutionId: selectedInst.id,
        institutionName: selectedInst.name,
        academicSession,
        courseOrGrade: courseOrGrade.trim(),
        category: feeCategory,
        categoryLabel: catLabel,
        description: feeDescription.trim() || `${catLabel} - ${academicSession}`,
        totalAssessed: assessedNum,
        amountPaid: initialPaidNum,
        outstandingAmount: Math.max(0, assessedNum - initialPaidNum),
        dueDate,
        paymentStatus: initialPaidNum === assessedNum ? 'paid' : initialPaidNum > 0 ? 'partially_paid' : 'pending',
        paymentMethod: initialPaidNum > 0 ? initialPaymentMethod : undefined,
        remindersSentCount: 0,
        createdByUid: currentUser.uid,
        createdByEmail: currentUser.email || 'unknown@fetindia.org',
        createdByName: userProfile?.displayName || currentUser.email?.split('@')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await createStudentFeeRecord(newFeeRecord, {
        uid: currentUser.uid,
        email: currentUser.email || 'unknown@fetindia.org',
        name: userProfile?.displayName,
        role: userProfile?.primaryRole || 'finance_admin'
      });

      showToast(`Fee assessment record ${feeCode} successfully registered.`);
      setIsAssessModalOpen(false);
    } catch (err: any) {
      console.error('Error creating fee record:', err);
      showToast(err?.message || 'Failed to create fee record.', 'error');
    } finally {
      setIsSubmittingAssess(false);
    }
  };

  // Open Collect Modal
  const handleOpenCollectModal = (fee: StudentFeeRecord) => {
    setActiveFee(fee);
    setCollectAmount(String(fee.outstandingAmount > 0 ? fee.outstandingAmount : 0));
    setCollectMode('razorpay');
    setCollectReference('');
    setCollectDate(new Date().toISOString().split('T')[0]);
    setCollectNotes('');
    setIsCollectModalOpen(true);
  };

  // Handle Online Fee Payment via Razorpay
  const handleRazorpayOnlineFeePayment = async () => {
    if (!activeFee || !currentUser) return;
    const amountNum = Number(collectAmount) || 0;
    if (amountNum <= 0) {
      showToast('Please enter a valid payment amount.', 'error');
      return;
    }
    if (amountNum > activeFee.outstandingAmount) {
      showToast(`Amount cannot exceed the current outstanding balance of ₹${activeFee.outstandingAmount.toLocaleString('en-IN')}`, 'error');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await initiateRazorpayContribution({
        orderParams: {
          amount: amountNum,
          donorName: activeFee.studentName,
          donorEmail: activeFee.parentEmail || currentUser.email || 'fee@fetindia.org',
          donorPhone: activeFee.parentPhone || '',
          campaignId: `FEE-${activeFee.feeCode}`,
          campaignTitle: `Fee Payment: ${activeFee.studentName} (${activeFee.categoryLabel || activeFee.category})`,
          donorUid: currentUser.uid
        },
        preferredMethod: 'all',
        onSuccess: async (result: PaymentVerificationResult) => {
          try {
            const paymentPayload: FeePaymentPayload = {
              paymentAmount: amountNum,
              paymentMethod: 'razorpay',
              transactionReference: result.paymentId || result.internalReference || `RZP-PAY-${Date.now()}`,
              razorpayOrderId: result.internalReference,
              razorpayPaymentId: result.paymentId,
              paymentDate: new Date().toISOString().split('T')[0],
              notes: 'Settled securely via Razorpay Payment Gateway'
            };

            const outcome = await recordFeePayment(
              activeFee.id!,
              paymentPayload,
              {
                uid: currentUser.uid,
                email: currentUser.email || 'unknown@fetindia.org',
                name: userProfile?.displayName,
                role: userProfile?.primaryRole || 'finance_admin'
              }
            );

            showToast(`Payment of ₹${amountNum.toLocaleString('en-IN')} verified. Official Receipt #${outcome.receiptNumber} generated.`);
            setIsCollectModalOpen(false);
          } catch (recErr: any) {
            console.error('Error saving fee payment record:', recErr);
            showToast(recErr?.message || 'Payment verified but ledger synchronization failed.', 'error');
          } finally {
            setIsSubmittingPayment(false);
          }
        },
        onError: (errMsg: string) => {
          setIsSubmittingPayment(false);
          showToast(`Razorpay checkout error: ${errMsg}`, 'error');
        },
        onDismiss: () => {
          setIsSubmittingPayment(false);
        }
      });
    } catch (launchErr: any) {
      setIsSubmittingPayment(false);
      showToast(launchErr?.message || 'Failed to initialize secure Razorpay gateway.', 'error');
    }
  };

  // Handle Offline / Institutional Counter Fee Payment
  const handleOfflineFeePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFee || !currentUser) return;
    const amountNum = Number(collectAmount) || 0;
    if (amountNum <= 0) {
      showToast('Please enter a valid payment amount.', 'error');
      return;
    }
    if (amountNum > activeFee.outstandingAmount) {
      showToast(`Amount cannot exceed the current outstanding balance of ₹${activeFee.outstandingAmount.toLocaleString('en-IN')}`, 'error');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const year = new Date().getFullYear();
      const randRef = Math.floor(100000 + Math.random() * 900000);
      const generatedRef = collectReference.trim() || `FET-${collectMode.toUpperCase()}-${year}-${randRef}`;

      const paymentPayload: FeePaymentPayload = {
        paymentAmount: amountNum,
        paymentMethod: collectMode,
        transactionReference: generatedRef,
        paymentDate: collectDate,
        notes: collectNotes.trim() || `Counter remittance via ${collectMode}`
      };

      const outcome = await recordFeePayment(
        activeFee.id!,
        paymentPayload,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'unknown@fetindia.org',
          name: userProfile?.displayName,
          role: userProfile?.primaryRole || 'school_admin'
        }
      );

      showToast(`Fee payment of ₹${amountNum.toLocaleString('en-IN')} acknowledged. Official Receipt #${outcome.receiptNumber} issued.`);
      setIsCollectModalOpen(false);
    } catch (err: any) {
      console.error('Error recording counter payment:', err);
      showToast(err?.message || 'Failed to record fee payment.', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Open Reminder Confirmation
  const handleOpenReminderModal = (fee: StudentFeeRecord) => {
    setActiveFee(fee);
    setIsReminderModalOpen(true);
  };

  // Send Fee Payment Reminder
  const handleSendReminder = async () => {
    if (!activeFee || !currentUser) return;
    setIsSendingReminder(true);
    try {
      const result = await sendFeePaymentReminder(
        activeFee.id!,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'unknown@fetindia.org',
          name: userProfile?.displayName,
          role: userProfile?.primaryRole || 'school_admin'
        },
        false // respects 12-hour cooldown
      );

      if (result.success) {
        showToast(result.message);
        setIsReminderModalOpen(false);
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      console.error('Error sending reminder:', err);
      showToast(err?.message || 'Failed to send payment reminder.', 'error');
    } finally {
      setIsSendingReminder(false);
    }
  };

  // View Receipt Modal
  const handleViewReceipt = (fee: StudentFeeRecord) => {
    setActiveFee(fee);
    setIsReceiptModalOpen(true);
  };

  // Delete Fee Record (Super Admin Only)
  const handleDeleteFee = async () => {
    if (!activeFee || !currentUser || !isSuperAdmin) return;
    try {
      await deleteStudentFeeRecord(activeFee.id!, {
        uid: currentUser.uid,
        email: currentUser.email || 'unknown@fetindia.org',
        role: 'super_admin'
      });
      showToast(`Fee assessment ${activeFee.feeCode} has been deleted.`);
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      console.error('Error deleting fee record:', err);
      showToast(err?.message || 'Failed to delete fee record.', 'error');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredFees.length === 0) {
      showToast('No records available to export.', 'error');
      return;
    }

    const headers = [
      'Fee Code',
      'Student Name',
      'Student ID / Roll',
      'Institution Type',
      'Institution Name',
      'Academic Session',
      'Class / Course',
      'Fee Category',
      'Description',
      'Total Assessed (INR)',
      'Amount Paid (INR)',
      'Outstanding (INR)',
      'Payment Status',
      'Due Date',
      'Payment Date',
      'Payment Mode',
      'Transaction Ref',
      'Receipt No'
    ];

    const rows = filteredFees.map((f) => [
      `"${f.feeCode}"`,
      `"${f.studentName}"`,
      `"${f.studentId}"`,
      `"${f.institutionType}"`,
      `"${f.institutionName}"`,
      `"${f.academicSession}"`,
      `"${f.courseOrGrade}"`,
      `"${f.categoryLabel || f.category}"`,
      `"${f.description || ''}"`,
      f.totalAssessed,
      f.amountPaid,
      f.outstandingAmount,
      `"${f.paymentStatus}"`,
      `"${f.dueDate || ''}"`,
      `"${f.paymentDate || ''}"`,
      `"${f.paymentMethod || ''}"`,
      `"${f.transactionReference || ''}"`,
      `"${f.receiptNumber || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FET-India-Fee-Records-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Fee records exported successfully.');
  };

  return (
    <div className="space-y-6" id="institutional-fee-management-view">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-lg transition-all animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700/60'
              : 'bg-rose-900/90 text-rose-100 border-rose-700/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-white/60 hover:text-white cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md border border-emerald-800/30">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                {title || 'Institutional Fee Management & Collections'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {subtitle || 'SRS Chapter 15.10 • Real-time fee assessments, Razorpay online payments, official receipts & outstanding dues.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {(canManageSchool || canManageMadrasa || isSuperAdmin) && (
            <button
              onClick={handleOpenAssessModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assess Student Fee</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Dynamic Metrics Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Assessed */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Fees Assessed</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ₹{feeMetrics.totalAssessed.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{feeMetrics.totalRecordsCount} student records</span>
            <span className="text-blue-700 font-semibold">{feeMetrics.fullyPaidCount} fully cleared</span>
          </div>
        </div>

        {/* Metric 2: Total Paid */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Collected / Remitted</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            ₹{feeMetrics.totalPaid.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Collection Rate</span>
            <span className="text-emerald-700 font-bold">
              {feeMetrics.collectionRatePercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Metric 3: Total Outstanding */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Outstanding Balance</span>
            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">
            ₹{feeMetrics.totalOutstanding.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Pending / Dues</span>
            <span className="text-rose-700 font-semibold">
              {feeMetrics.partiallyPaidCount + feeMetrics.pendingCount + feeMetrics.overdueCount} accounts
            </span>
          </div>
        </div>

        {/* Metric 4: Overdue & Reminders */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Overdue & Pending Notice</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">
            {feeMetrics.overdueCount + feeMetrics.pendingCount}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Critical Reminders</span>
            <span className="text-amber-800 font-semibold">
              {feeMetrics.overdueCount} overdue past term
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, roll #, fee code, receipt #..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {!forcedInstitutionType && (
              <select
                value={institutionTypeFilter}
                onChange={(e) => setInstitutionTypeFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Institutions</option>
                <option value="school">School ERP Only</option>
                <option value="madrasa">Madrasa ERP Only</option>
              </select>
            )}

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              {FEE_CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Fully Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Sessions</option>
              <option value="AY 2026-2027">AY 2026-2027</option>
              <option value="AY 2025-2026">AY 2025-2026</option>
            </select>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-[11px]">
          <span className="text-slate-400 font-semibold mr-1">Categories:</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-emerald-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({fees.length})
          </button>
          {FEE_CATEGORY_OPTIONS.map((c) => {
            const count = fees.filter((f) => f.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  categoryFilter === c.id
                    ? 'bg-emerald-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Student Fee Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Student Fee Assessment & Payment Records
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredFees.length} of {fees.length} institutional assessments
            </p>
          </div>

          <div className="text-xs text-slate-500">
            Total Outstanding in Current View:{' '}
            <strong className="text-rose-700 font-bold">
              ₹{feeMetrics.totalOutstanding.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <p className="text-xs">Loading institutional fee records...</p>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Student Fee Records Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No fee records match the selected filters. Click "Assess Student Fee" to register new institutional fees.
            </p>
            {(canManageSchool || canManageMadrasa || isSuperAdmin) && (
              <button
                onClick={handleOpenAssessModal}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assess Student Fee</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student & Roll No</th>
                  <th className="py-3 px-4">Institution & Class</th>
                  <th className="py-3 px-4">Category & Fee Code</th>
                  <th className="py-3 px-4 text-right">Assessed</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFees.map((fee) => {
                  const isPaid = fee.paymentStatus === 'paid';
                  const isPartial = fee.paymentStatus === 'partially_paid';
                  const isOverdue = fee.paymentStatus === 'overdue';

                  return (
                    <tr key={fee.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Student info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          {fee.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Roll: {fee.studentId}
                        </div>
                        {fee.parentName && (
                          <div className="text-[10px] text-slate-400">
                            Parent: {fee.parentName}
                          </div>
                        )}
                      </td>

                      {/* Institution & Class */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          {fee.institutionType === 'school' ? (
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          )}
                          <span className="truncate max-w-[160px]">{fee.institutionName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {fee.courseOrGrade} • <span className="font-medium">{fee.academicSession}</span>
                        </div>
                      </td>

                      {/* Category & Fee Code */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {fee.categoryLabel || fee.category}
                        </span>
                        <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                          {fee.feeCode}
                        </div>
                        {fee.receiptNumber && (
                          <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                            <Receipt className="w-3 h-3" />
                            {fee.receiptNumber}
                          </div>
                        )}
                      </td>

                      {/* Assessed */}
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        ₹{fee.totalAssessed.toLocaleString('en-IN')}
                      </td>

                      {/* Paid */}
                      <td className="py-3 px-4 text-right font-bold text-emerald-800">
                        ₹{fee.amountPaid.toLocaleString('en-IN')}
                      </td>

                      {/* Outstanding */}
                      <td className="py-3 px-4 text-right font-bold">
                        {fee.outstandingAmount > 0 ? (
                          <span className="text-rose-700 font-bold">
                            ₹{fee.outstandingAmount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px]">Cleared</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isPartial
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {isPaid && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {isPartial && <Clock className="w-3 h-3 text-amber-600" />}
                          {isOverdue && <AlertCircle className="w-3 h-3 text-rose-600" />}
                          {fee.paymentStatus.replace('_', ' ').toUpperCase()}
                        </span>
                        {fee.dueDate && !isPaid && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Due: {fee.dueDate}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {/* Collect Payment Button */}
                        {fee.outstandingAmount > 0 && canCollect && (
                          <button
                            onClick={() => handleOpenCollectModal(fee)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Collect Fee / Pay Online via Razorpay"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Pay / Collect</span>
                          </button>
                        )}

                        {/* View Receipt Button (if paid or partially paid) */}
                        {fee.amountPaid > 0 && (
                          <button
                            onClick={() => handleViewReceipt(fee)}
                            className="p-1 rounded-md text-emerald-800 hover:bg-emerald-50 border border-emerald-200 text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Print / View Official Fee Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Send Reminder Button */}
                        {fee.outstandingAmount > 0 && canRemind && (
                          <button
                            onClick={() => handleOpenReminderModal(fee)}
                            className="p-1 rounded-md text-amber-700 hover:bg-amber-50 border border-amber-200 text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title={`Send Payment Reminder (Sent ${fee.remindersSentCount || 0} times)`}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Fee Assessment (Super Admin Only) */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              setActiveFee(fee);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Fee Assessment (Super Admin Only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* ============================================================== */}
      {/* MODAL 1: ASSESS STUDENT FEE (Chapter 15.10 SRS) */}
      {/* ============================================================== */}
      {isAssessModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Assess Student Institutional Fee</h3>
                  <p className="text-xs text-slate-300">
                    Register a new student fee assessment under Chapter 15.10 bylaws.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssessModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAssess} className="p-5 space-y-4 text-xs">
              {/* Institution Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Institution <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    {INSTITUTION_OPTIONS.filter((i) =>
                      forcedInstitutionType ? i.type === forcedInstitutionType : true
                    ).map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Academic Session <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={academicSession}
                    onChange={(e) => setAcademicSession(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="AY 2026-2027">AY 2026-2027</option>
                    <option value="AY 2025-2026">AY 2025-2026</option>
                    <option value="AY 2027-2028">AY 2027-2028</option>
                  </select>
                </div>
              </div>

              {/* Student Particulars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Zainab Merchant"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Student Roll No / Identifier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. FET-STU-1042"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Class / Course</label>
                  <input
                    type="text"
                    required
                    value={courseOrGrade}
                    onChange={(e) => setCourseOrGrade(e.target.value)}
                    placeholder="e.g. Grade 10 - Section A"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Asad Merchant"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Parent Phone</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Fee Category & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Fee Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={feeCategory}
                    onChange={(e) => setFeeCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    {FEE_CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Fee Description</label>
                <input
                  type="text"
                  value={feeDescription}
                  onChange={(e) => setFeeDescription(e.target.value)}
                  placeholder="e.g. Term 1 Tuition Fee (April - June 2026)"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Financial Assessment Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <div>
                  <label className="block text-emerald-950 font-bold mb-1">
                    Total Assessed Fee (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalAssessed}
                    onChange={(e) => setTotalAssessed(e.target.value)}
                    placeholder="5000"
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-emerald-950 font-bold mb-1">
                    Initial Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalAssessed}
                    value={initialAmountPaid}
                    onChange={(e) => setInitialAmountPaid(e.target.value)}
                    placeholder="0"
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {Number(initialAmountPaid) > 0 && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Payment Mode</label>
                  <select
                    value={initialPaymentMethod}
                    onChange={(e) => setInitialPaymentMethod(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="cash">Counter Cash Receipt</option>
                    <option value="bank_transfer">Direct Bank Transfer / NEFT</option>
                    <option value="upi">UPI Remittance</option>
                    <option value="cheque">Bank Cheque / DD</option>
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAssessModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssess}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isSubmittingAssess ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Assessment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Register Fee Assessment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: COLLECT / PAY FEE (Razorpay Online or Counter) */}
      {/* ============================================================== */}
      {isCollectModalOpen && activeFee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Collect Fee Remittance</h3>
                  <p className="text-xs text-slate-300">
                    {activeFee.studentName} ({activeFee.studentId}) • {activeFee.institutionName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Fee Outstanding Summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Fee Assessment Code:</span>
                  <span className="font-mono font-bold text-slate-800">{activeFee.feeCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Total Assessed:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{activeFee.totalAssessed.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Previously Paid:</span>
                  <span className="font-semibold text-emerald-700">
                    ₹{activeFee.amountPaid.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                  <span className="text-rose-700 font-bold uppercase text-[11px]">Outstanding Due:</span>
                  <span className="text-base font-black text-rose-700">
                    ₹{activeFee.outstandingAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Payment Amount to Collect (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={activeFee.outstandingAmount}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCollectMode('razorpay')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      collectMode === 'razorpay'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-xs">Razorpay Online Gateway</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">UPI, Cards, NetBanking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollectMode('cash')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      collectMode === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-xs">Counter Cash Receipt</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Institutional Cash Desk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollectMode('bank_transfer')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      collectMode === 'bank_transfer'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-xs">Bank Transfer / NEFT</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Direct Trust Account UTR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollectMode('upi')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      collectMode === 'upi'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-xs">Direct UPI QR Scan</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Trust VPA settlement</span>
                  </button>
                </div>
              </div>

              {/* Mode-specific Fields */}
              {collectMode === 'razorpay' ? (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Razorpay Instant Checkout</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Launches official Razorpay standard payment modal for parent / student remittance. Acknowledges instantaneously upon payment authorization, generates Official Fee Receipt, and creates automated general financial ledger entry.
                  </p>
                  <button
                    type="button"
                    onClick={handleRazorpayOnlineFeePayment}
                    disabled={isSubmittingPayment}
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Launching Razorpay Checkout...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay ₹{Number(collectAmount || 0).toLocaleString('en-IN')} with Razorpay</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOfflineFeePayment} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Transaction Reference / UTR #
                      </label>
                      <input
                        type="text"
                        value={collectReference}
                        onChange={(e) => setCollectReference(e.target.value)}
                        placeholder="e.g. UTR-98214472"
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Payment Date</label>
                      <input
                        type="date"
                        value={collectDate}
                        onChange={(e) => setCollectDate(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Internal Notes</label>
                    <input
                      type="text"
                      value={collectNotes}
                      onChange={(e) => setCollectNotes(e.target.value)}
                      placeholder="e.g. Received at school front counter"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCollectModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingPayment ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Issuing Receipt...</span>
                        </>
                      ) : (
                        <>
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Record Payment & Issue Receipt</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: PAYMENT REMINDER CONFIRMATION (Chapter 15.10 SRS) */}
      {/* ============================================================== */}
      {isReminderModalOpen && activeFee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-4 bg-amber-500 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-slate-950" />
                <h3 className="text-sm font-black">Issue Fee Payment Reminder</h3>
              </div>
              <button
                onClick={() => setIsReminderModalOpen(false)}
                className="text-slate-900/60 hover:text-slate-950 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                You are about to send an official payment reminder for outstanding institutional dues:
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p>
                  <strong>Student:</strong> {activeFee.studentName} ({activeFee.studentId})
                </p>
                <p>
                  <strong>Institution:</strong> {activeFee.institutionName}
                </p>
                <p>
                  <strong>Outstanding Balance:</strong>{' '}
                  <span className="font-bold text-rose-700">
                    ₹{activeFee.outstandingAmount.toLocaleString('en-IN')}
                  </span>
                </p>
                <p>
                  <strong>Reminders Sent:</strong> {activeFee.remindersSentCount || 0} times
                </p>
                {activeFee.lastReminderSentAt && (
                  <p className="text-[11px] text-slate-400">
                    Last sent: {new Date(activeFee.lastReminderSentAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                <span className="font-bold">Flood Protection Notice:</span> Automatic cooldown enforces a 12-hour gap between automated reminder dispatches to protect parents from notification fatigue.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={isSendingReminder}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSendingReminder ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Notice...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Official Reminder</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION (Super Admin Only) */}
      {/* ============================================================== */}
      {isDeleteModalOpen && activeFee && isSuperAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-white" />
                <h3 className="text-sm font-black">Delete Fee Assessment Record</h3>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Are you sure you want to permanently delete the fee record for{' '}
                <strong>{activeFee.studentName}</strong> (Code: <code>{activeFee.feeCode}</code>)?
              </p>
              <p className="text-[11px] text-rose-700 font-semibold">
                This action is audited and cannot be undone. Historical general ledger records are preserved.
              </p>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteFee}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: PRINTABLE OFFICIAL FEE RECEIPT */}
      {/* ============================================================== */}
      <PrintableFeeReceiptModal
        feeRecord={activeFee}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
};
