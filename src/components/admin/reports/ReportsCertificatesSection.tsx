/**
 * @license
 * Certificates & Verification Telemetry Report (Step 52)
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Award, 
  QrCode, 
  Lock, 
  FileCheck, 
  Layers 
} from 'lucide-react';
import { AggregatedReportMetrics } from './types';

interface ReportsCertificatesSectionProps {
  metrics: AggregatedReportMetrics;
  awardBreakdown: { award: string; count: number }[];
}

export const ReportsCertificatesSection: React.FC<ReportsCertificatesSectionProps> = ({
  metrics,
  awardBreakdown
}) => {
  return (
    <div className="space-y-6" id="reports-certificates-section">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Total Certificates Issued</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {metrics.totalCertificatesIssued}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Official cryptographic records
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase block">Valid & Verified</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 block">
            {metrics.validCertificatesCount}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            QR verification enabled
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-rose-700 uppercase block">Revoked Records</span>
          <span className="text-2xl sm:text-3xl font-black text-rose-800 mt-1 block">
            {metrics.revokedCertificatesCount}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Flagged / Cancelled credentials
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-teal-700 uppercase block">Public Integrity Rate</span>
          <span className="text-2xl sm:text-3xl font-black text-teal-900 mt-1 block">
            {metrics.totalCertificatesIssued > 0 
              ? `${Math.round((metrics.validCertificatesCount / metrics.totalCertificatesIssued) * 100)}%` 
              : '100%'}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Trust Registry Telemetry
          </span>
        </div>
      </div>

      {/* Breakdown by Award Category */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-teal-700" />
          Certificates Dispatched by Achievement Tier
        </h3>
        {awardBreakdown.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs">No certificate award records found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {awardBreakdown.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-800 capitalize block truncate">
                  {item.award.replace(/_/g, ' ')}
                </span>
                <span className="text-lg font-black text-teal-800 mt-1 block">
                  {item.count} issued
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
