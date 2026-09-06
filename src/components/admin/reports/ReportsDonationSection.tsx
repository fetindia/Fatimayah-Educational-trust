/**
 * @license
 * Philanthropy & Donation Transactions Report (Step 52)
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  BadgeDollarSign, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RotateCcw, 
  Receipt, 
  Users, 
  ShieldCheck,
  Lock
} from 'lucide-react';
import { AggregatedReportMetrics } from './types';
import { formatCurrencyINR } from './reportUtils';

interface ReportsDonationSectionProps {
  metrics: AggregatedReportMetrics;
}

export const ReportsDonationSection: React.FC<ReportsDonationSectionProps> = ({
  metrics
}) => {
  return (
    <div className="space-y-6" id="reports-donation-section">
      {/* Donor Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-700 flex-shrink-0" />
          <span>
            <strong>Donor Privacy Enforced:</strong> Donor PAN details and private banking reference keys are masked to protect confidential patron data.
          </span>
        </div>
        <span className="font-semibold text-purple-900 font-mono text-[11px]">80G Tax Compliant</span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-purple-800 uppercase block">Total Donations Collected</span>
          <span className="text-2xl sm:text-3xl font-black text-purple-950 mt-1 block truncate">
            {formatCurrencyINR(metrics.totalDonationAmount)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Avg: {formatCurrencyINR(metrics.averageDonationAmount)} per gift
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase block">Verified Transactions</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 block">
            {metrics.verifiedDonationsCount}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            From {metrics.uniqueDonorsCount} unique patrons
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase block">Pending Verification</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-800 mt-1 block">
            {metrics.pendingDonationsCount}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Awaiting bank reconciliation
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-blue-700 uppercase block">80G Tax Exemption Receipts</span>
          <span className="text-2xl sm:text-3xl font-black text-blue-900 mt-1 block">
            {metrics.donations80GCount}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {metrics.refundedDonationsCount} Refunded • {metrics.failedDonationsCount} Failed
          </span>
        </div>
      </div>

      {/* Transaction Status Summary Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase block">Verified & Realized</span>
            <span className="text-lg font-black text-emerald-950">
              {metrics.verifiedDonationsCount} transactions
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase block">Offline / Pending Verification</span>
            <span className="text-lg font-black text-amber-950">
              {metrics.pendingDonationsCount} transactions
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-800 uppercase block">Refunded / Reversal</span>
            <span className="text-lg font-black text-rose-950">
              {metrics.refundedDonationsCount} transactions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
