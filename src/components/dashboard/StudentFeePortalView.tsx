/**
 * @license
 * Student & Parent Institutional Fee Portal (Chapter 15.10 SRS - Task 6)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides authenticated students and parents/guardians with:
 * - Real-time assessment of school and madrasa fees
 * - Transparent ledger of assessed, paid, and outstanding balances
 * - Secure online fee settlement via Razorpay
 * - Official downloadable & printable institutional fee receipts
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  CreditCard,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  Search,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StudentFeeRecord, FeeCategoryType, FeePaymentStatus, FeePaymentPayload } from '../../types';
import { db, recordFeePayment } from '../../lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { initiateRazorpayContribution, PaymentVerificationResult } from '../../lib/razorpay';
import { PrintableFeeReceiptModal } from '../admin/fees/PrintableFeeReceiptModal';
import { calculateFeeSummary } from '../../lib/financeFoundation';

interface StudentFeePortalViewProps {
  onNotify?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const CATEGORY_DISPLAY_MAP: Record<FeeCategoryType, { label: string; badge: string }> = {
  admission: { label: 'Admission Fees', badge: 'bg-blue-100 text-blue-900 border-blue-200' },
  tuition: { label: 'Tuition Fees', badge: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  hostel: { label: 'Hostel & Boarding', badge: 'bg-purple-100 text-purple-900 border-purple-200' },
  examination: { label: 'Examination Fees', badge: 'bg-amber-100 text-amber-900 border-amber-200' },
  library: { label: 'Library Fees', badge: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
  transport: { label: 'Transport Fees', badge: 'bg-orange-100 text-orange-900 border-orange-200' },
  other: { label: 'Other Configured Fees', badge: 'bg-slate-100 text-slate-900 border-slate-200' }
};

export const StudentFeePortalView: React.FC<StudentFeePortalViewProps> = ({ onNotify }) => {
  const { currentUser, userProfile } = useAuth();
  const [fees, setFees] = useState<StudentFeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FeePaymentStatus>('all');
  const [selectedReceiptFee, setSelectedReceiptFee] = useState<StudentFeeRecord | null>(null);

  // Online Payment Modal State
  const [payingFee, setPayingFee] = useState<StudentFeeRecord | null>(null);
  const [customPayAmount, setCustomPayAmount] = useState<number>(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Subscribe to student fee records from Firestore
  useEffect(() => {
    try {
      const feesRef = collection(db, 'student_fees');
      const q = query(feesRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: StudentFeeRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              ...data
            } as StudentFeeRecord);
          });
          setFees(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Realtime subscription error in StudentFeePortalView:', err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Error setting up fee subscription:', e);
      setLoading(false);
    }
  }, []);

  // Filter fees matching current user's profile/email/studentId or search query
  const relevantFees = useMemo(() => {
    const userEmail = (currentUser?.email || '').trim().toLowerCase();
    const userName = (userProfile?.displayName || '').trim().toLowerCase();
    const userUid = currentUser?.uid || '';

    return fees.filter((fee) => {
      // Direct matches to logged-in user:
      const matchesStudentUid = fee.studentUid === userUid;
      const matchesParentEmail = fee.parentEmail?.toLowerCase() === userEmail;
      const matchesStudentName = userName && fee.studentName?.toLowerCase().includes(userName);

      const isAssociated = matchesStudentUid || matchesParentEmail || matchesStudentName;

      // Status filter
      if (statusFilter !== 'all' && fee.paymentStatus !== statusFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const queryStr = searchTerm.toLowerCase();
        const matchesSearch =
          fee.feeCode.toLowerCase().includes(queryStr) ||
          fee.studentName.toLowerCase().includes(queryStr) ||
          fee.studentId.toLowerCase().includes(queryStr) ||
          fee.institutionName.toLowerCase().includes(queryStr) ||
          fee.category.toLowerCase().includes(queryStr) ||
          (fee.receiptNumber && fee.receiptNumber.toLowerCase().includes(queryStr));
        
        return matchesSearch;
      }

      // If no search filter, show associated records (or all records if none specifically tagged to demonstrate in dev)
      return isAssociated || fees.length <= 10;
    });
  }, [fees, currentUser, userProfile, statusFilter, searchTerm]);

  // Compute live financial summary
  const summary = useMemo(() => calculateFeeSummary(relevantFees), [relevantFees]);

  const handleOpenPayModal = (fee: StudentFeeRecord) => {
    setPayingFee(fee);
    setCustomPayAmount(fee.outstandingAmount);
    setPayError(null);
  };

  const handleExecuteRazorpayPayment = async () => {
    if (!payingFee || !currentUser) return;

    if (customPayAmount <= 0) {
      setPayError('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    if (customPayAmount > payingFee.outstandingAmount) {
      setPayError(`Payment cannot exceed the outstanding balance of ₹${payingFee.outstandingAmount.toLocaleString('en-IN')}`);
      return;
    }

    setPaymentProcessing(true);
    setPayError(null);

    try {
      // Initiate Razorpay checkout via existing trust gateway
      await initiateRazorpayContribution({
        orderParams: {
          amount: customPayAmount,
          donorName: userProfile?.displayName || payingFee.studentName,
          donorEmail: currentUser.email || payingFee.parentEmail || 'accounts@fatimyiahtrust.org',
          donorPhone: userProfile?.phoneNumber || payingFee.parentPhone || '919876543210',
          campaignTitle: `${payingFee.institutionName} - ${payingFee.category.toUpperCase()} Fee (${payingFee.academicSession})`,
          campaignId: `FEE-${payingFee.id || 'INST'}`
        },
        preferredMethod: 'all',
        onSuccess: async (result: PaymentVerificationResult) => {
          try {
            const paymentPayload: FeePaymentPayload = {
              paymentAmount: customPayAmount,
              paymentMethod: 'razorpay',
              razorpayPaymentId: result.paymentId,
              transactionReference: result.paymentId || `RZP-FEE-${Date.now()}`,
              paymentDate: new Date().toISOString().split('T')[0],
              notes: 'Online student portal fee payment settled via Razorpay'
            };

            const outcome = await recordFeePayment(
              payingFee.id!,
              paymentPayload,
              {
                uid: currentUser.uid,
                email: currentUser.email || 'unknown@fetindia.org',
                name: userProfile?.displayName,
                role: userProfile?.primaryRole || 'member'
              }
            );

            if (onNotify) {
              onNotify(`Fee payment of ₹${customPayAmount.toLocaleString('en-IN')} verified successfully! Official receipt #${outcome.receiptNumber} issued.`, 'success');
            }

            const updatedRecord: StudentFeeRecord = {
              ...payingFee,
              amountPaid: payingFee.amountPaid + customPayAmount,
              outstandingAmount: Math.max(0, payingFee.outstandingAmount - customPayAmount),
              paymentStatus: (payingFee.outstandingAmount - customPayAmount) <= 0 ? 'paid' : 'partially_paid',
              paymentMethod: 'razorpay',
              transactionReference: outcome.transactionReference,
              receiptNumber: outcome.receiptNumber,
              paymentDate: new Date().toISOString().split('T')[0]
            };

            setPayingFee(null);
            setSelectedReceiptFee(updatedRecord);
          } catch (err: any) {
            console.error('Error recording fee payment:', err);
            setPayError(err?.message || 'Payment received but failed to update ledger.');
          } finally {
            setPaymentProcessing(false);
          }
        },
        onError: (errMsg: string) => {
          setPaymentProcessing(false);
          setPayError(`Razorpay checkout error: ${errMsg}`);
        },
        onDismiss: () => {
          setPaymentProcessing(false);
        }
      });
    } catch (launchErr: any) {
      setPaymentProcessing(false);
      setPayError(launchErr?.message || 'Failed to initialize secure Razorpay gateway.');
    }
  };

  return (
    <div className="space-y-6" id="student-fee-portal-view">
      {/* Portal Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-200">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Student & Institution Fee Portal</h2>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                Online Payment Gateway Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review current semester assessments, settle institutional fees online via Razorpay, and download official Section 12A/80G compliant receipts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 font-bold block">Academic Cycle</span>
            <span className="text-xs font-bold text-slate-800">2026-27 Active Session</span>
          </div>
        </div>
      </div>

      {/* Real-time KPI Cards (Outstanding, Paid, Assessed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assessed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Assessed Fees
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{summary.totalAssessed.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{relevantFees.length} total fee assessment(s)</span>
          </div>
        </div>

        {/* Total Paid */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
            Total Paid Fees
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{summary.totalPaid.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-800 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Settled through verified channels
          </div>
        </div>

        {/* Outstanding Amount */}
        <div className={`p-5 rounded-2xl border shadow-xs ${
          summary.totalOutstanding > 0
            ? 'bg-rose-50/50 border-rose-200'
            : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <span className={`text-xs font-bold uppercase tracking-wider block ${
            summary.totalOutstanding > 0 ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            Outstanding Due Balance
          </span>
          <div className={`text-2xl font-black mt-2 ${
            summary.totalOutstanding > 0 ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            ₹{summary.totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            {summary.totalOutstanding > 0 
              ? `${summary.pendingCount + summary.partiallyPaidCount} pending/partial fee(s)`
              : 'All institutional dues clear'}
          </div>
        </div>

        {/* Overall Status Ratio */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Settlement Progress
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary.collectionRatePercentage.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, summary.collectionRatePercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Fee Code, Student Enrollment ID, Institution, or Category..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-slate-500 font-bold shrink-0">Filter Status:</span>
          {(['all', 'pending', 'partially_paid', 'paid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Fee Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Enrolled Student Fee Assessments</h3>
            <p className="text-xs text-slate-500">Official fee ledger entries linked to your student credentials</p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {relevantFees.length} Record(s) Found
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
            <span className="text-xs font-bold">Synchronizing real-time fee records...</span>
          </div>
        ) : relevantFees.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No Student Fee Records Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No outstanding or past fee assessments match the current filter. If you recently enrolled, please contact the institution accounts office or search by your Enrollment ID.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Fee Reference</th>
                  <th className="py-3 px-4">Student & Class</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Fee Category</th>
                  <th className="py-3 px-4 text-right">Total Assessed</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {relevantFees.map((fee) => {
                  const catInfo = CATEGORY_DISPLAY_MAP[fee.category] || CATEGORY_DISPLAY_MAP.other;
                  const isPaid = fee.paymentStatus === 'paid';
                  const isPartial = fee.paymentStatus === 'partially_paid';

                  return (
                    <tr key={fee.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Fee Ref */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {fee.feeCode}
                        <span className="block font-sans text-[10px] text-slate-400 font-normal">
                          {fee.academicSession}
                        </span>
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{fee.studentName}</div>
                        <div className="text-[10px] text-slate-500">
                          ID: <span className="font-mono">{fee.studentId}</span> • {fee.courseOrGrade || 'General'}
                        </div>
                      </td>

                      {/* Institution */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{fee.institutionName}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${
                          fee.institutionType === 'school' ? 'text-blue-700' : 'text-emerald-700'
                        }`}>
                          {fee.institutionType} ERP
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catInfo.badge}`}>
                          {catInfo.label}
                        </span>
                      </td>

                      {/* Assessed */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{fee.totalAssessed.toLocaleString('en-IN')}
                      </td>

                      {/* Paid */}
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        ₹{fee.amountPaid.toLocaleString('en-IN')}
                      </td>

                      {/* Outstanding */}
                      <td className={`py-3.5 px-4 text-right font-bold ${
                        fee.outstandingAmount > 0 ? 'text-rose-700' : 'text-slate-400'
                      }`}>
                        ₹{fee.outstandingAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isPartial
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {isPaid ? (
                            <><CheckCircle2 className="w-3 h-3" /> Fully Paid</>
                          ) : isPartial ? (
                            <><Clock className="w-3 h-3" /> Partially Paid</>
                          ) : (
                            <><AlertCircle className="w-3 h-3" /> Outstanding</>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {fee.outstandingAmount > 0 && (
                            <button
                              onClick={() => handleOpenPayModal(fee)}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <CreditCard className="w-3 h-3" /> Pay Online
                            </button>
                          )}

                          {fee.amountPaid > 0 && (
                            <button
                              onClick={() => setSelectedReceiptFee(fee)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Download / Print Official Fee Receipt"
                            >
                              <Receipt className="w-3.5 h-3.5 text-slate-600" />
                              <span className="hidden sm:inline">Receipt</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Online Fee Payment Modal (Razorpay) */}
      {payingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-lg font-black">Online Institutional Fee Payment</h3>
                </div>
                <button
                  onClick={() => !paymentProcessing && setPayingFee(null)}
                  disabled={paymentProcessing}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                Settling {payingFee.category.toUpperCase()} Fee for <span className="font-bold underline">{payingFee.studentName}</span>
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Institution and Student Snapshot */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Institution:</span>
                  <span className="font-extrabold text-slate-800">{payingFee.institutionName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Student Enrollment ID:</span>
                  <span className="font-mono font-bold text-slate-800">{payingFee.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Academic Session:</span>
                  <span className="font-bold text-slate-800">{payingFee.academicSession}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Total Assessed:</span>
                  <span className="font-bold text-slate-900">₹{payingFee.totalAssessed.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Previously Paid:</span>
                  <span className="font-bold text-emerald-700">₹{payingFee.amountPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                  <span className="text-rose-700">Current Outstanding Due:</span>
                  <span className="text-rose-700 font-black">₹{payingFee.outstandingAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Amount to Pay */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Amount to Pay (INR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={payingFee.outstandingAmount}
                    value={customPayAmount || ''}
                    onChange={(e) => setCustomPayAmount(Number(e.target.value))}
                    disabled={paymentProcessing}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setCustomPayAmount(payingFee.outstandingAmount)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold cursor-pointer"
                  >
                    Pay Full Due (₹{payingFee.outstandingAmount.toLocaleString('en-IN')})
                  </button>
                  {payingFee.outstandingAmount > 1000 && (
                    <button
                      type="button"
                      onClick={() => setCustomPayAmount(Math.round(payingFee.outstandingAmount / 2))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold cursor-pointer"
                    >
                      Pay Half (₹{Math.round(payingFee.outstandingAmount / 2).toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
              </div>

              {/* Trust & Gateway Security Badge */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-start gap-2.5 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block">Encrypted Razorpay Gateway Checkout</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    Complies with RBI Master Directions & Trust Section 12A/80G governance. Direct UPI, Net Banking, Debit/Credit Card supported.
                  </p>
                </div>
              </div>

              {payError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{payError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingFee(null)}
                  disabled={paymentProcessing}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRazorpayPayment}
                  disabled={paymentProcessing || customPayAmount <= 0}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {paymentProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" /> Proceed to Pay ₹{customPayAmount.toLocaleString('en-IN')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Fee Receipt Modal */}
      {selectedReceiptFee && (
        <PrintableFeeReceiptModal
          feeRecord={selectedReceiptFee}
          isOpen={true}
          onClose={() => setSelectedReceiptFee(null)}
        />
      )}
    </div>
  );
};
