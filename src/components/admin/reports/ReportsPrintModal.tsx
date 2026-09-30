/**
 * @license
 * Official Trust Letterhead Print & PDF Modal (Step 52)
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Building2, 
  Download, 
  FileText, 
  CheckCircle2 
} from 'lucide-react';
import { AggregatedReportMetrics, ReportRecordRow, ReportModuleTab } from './types';
import { formatCurrencyINR, formatReportDate } from './reportUtils';

interface ReportsPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ReportModuleTab;
  dateFilter: string;
  selectedState: string;
  selectedDistrict: string;
  exportedBy: string;
  metrics: AggregatedReportMetrics;
  rows: ReportRecordRow[];
  orgConfig?: {
    legalName?: string;
    registrationNumber?: string;
    registrationJurisdiction?: string;
    registrationAct?: string;
    contactEmail?: string;
    nitiAayogId?: string;
    panNumber?: string;
  };
}

export const ReportsPrintModal: React.FC<ReportsPrintModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  dateFilter,
  selectedState,
  selectedDistrict,
  exportedBy,
  metrics,
  rows,
  orgConfig
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const reportId = `FET-RPT-${Date.now().toString().slice(-8)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Official Institutional Report Document</h3>
              <p className="text-xs text-slate-400">Print Preview • Authorized FET India Administrative Letterhead</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0 print:overflow-visible">
          {/* Institutional Trust Letterhead */}
          <div className="border-b-2 border-emerald-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-emerald-950 uppercase tracking-tight">
                {orgConfig?.legalName || 'Fatimyah Educational Trust India'}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Official Public Charitable Trust • Registration No: {orgConfig?.registrationNumber || 'E 9822'} ({orgConfig?.registrationJurisdiction || 'Jammu & Kashmir'}){orgConfig?.registrationAct ? ` • ${orgConfig.registrationAct}` : ''} • DARPAN: {orgConfig?.nitiAayogId || 'JK/2026/1153821'} • PAN: {orgConfig?.panNumber || 'AABTF0015H'} • Sec 80G & 12A Certified
              </p>
              <p className="text-[11px] text-slate-500">
                Central Administrative Secretariat • Contact: {orgConfig?.contactEmail || 'fetkofficial@gmail.com'} • Web: FETIndia.com
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-bold font-mono border border-slate-200">
                {reportId}
              </span>
              <div className="text-[11px] text-slate-500 mt-1">
                Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Scope & Audit Metadata */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Report Module</span>
              <span className="font-bold text-slate-900 capitalize">{activeTab}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Timeframe Scope</span>
              <span className="font-bold text-slate-900 capitalize">{dateFilter.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Territory Scope</span>
              <span className="font-bold text-slate-900 truncate block">
                {selectedState === 'all' ? 'Pan-India' : selectedState} {selectedDistrict !== 'all' ? `(${selectedDistrict})` : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Generated By</span>
              <span className="font-bold text-slate-900 truncate block">{exportedBy}</span>
            </div>
          </div>

          {/* KPI Census Summary Grid */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
              Key Performance Indicator Census
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">TOTAL REGISTERED USERS</span>
                <span className="text-lg font-black text-slate-900">{metrics.totalUsers}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-amber-800 block text-[10px]">ENROLLED MEMBERS</span>
                <span className="text-lg font-black text-amber-900">{metrics.totalMembers}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 block text-[10px]">VOLUNTEER FORCE</span>
                <span className="text-lg font-black text-emerald-900">{metrics.activeVolunteers}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-blue-800 block text-[10px]">STAFF & FACULTY</span>
                <span className="text-lg font-black text-blue-900">{metrics.activeStaff}</span>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="text-purple-800 block text-[10px]">DONATIONS COLLECTED</span>
                <span className="text-lg font-black text-purple-900 truncate block">
                  {formatCurrencyINR(metrics.totalDonationAmount)}
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-rose-800 block text-[10px]">ACTIVE WELFARE APPEALS</span>
                <span className="text-lg font-black text-rose-900">{metrics.activeCampaigns} / {metrics.totalCampaigns}</span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                <span className="text-indigo-800 block text-[10px]">EXAM PARTICIPANTS</span>
                <span className="text-lg font-black text-indigo-900">{metrics.totalParticipants}</span>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                <span className="text-teal-800 block text-[10px]">VALID CERTIFICATES</span>
                <span className="text-lg font-black text-teal-900">{metrics.validCertificatesCount}</span>
              </div>
            </div>
          </div>

          {/* Detailed Records Table (First 35 for Clean Printable Layout) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Detailed Audit Log Listing ({rows.length} Total Records Found)
              </h3>
              <span className="text-[11px] text-slate-500">
                Showing top {Math.min(35, rows.length)} entries
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Name / Title</th>
                    <th className="p-2">Identifier</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">State</th>
                    <th className="p-2">Date</th>
                    <th className="p-2 text-right">Amount / Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, 35).map((r, i) => (
                    <tr key={i}>
                      <td className="p-2 font-bold text-slate-800">{r.name}</td>
                      <td className="p-2 font-mono text-[10px] text-slate-600">{r.identifierId || 'N/A'}</td>
                      <td className="p-2 capitalize">{r.category}</td>
                      <td className="p-2 capitalize">{r.status}</td>
                      <td className="p-2">{r.state}</td>
                      <td className="p-2">{formatReportDate(r.date)}</td>
                      <td className="p-2 text-right font-medium text-slate-700">
                        {r.amountOrNotes || (r.amount !== undefined ? formatCurrencyINR(r.amount) : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Verification Sign-off */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-10 border-b border-slate-300 mx-auto w-48 mb-2" />
              <span className="font-bold text-slate-800 block">Trust Secretariat / Reporting Officer</span>
              <span className="text-[10px] text-slate-500">Authorized System Signature</span>
            </div>
            <div>
              <div className="h-10 border-b border-slate-300 mx-auto w-48 mb-2" />
              <span className="font-bold text-slate-800 block">Board of Trustees & Super Administrator</span>
              <span className="text-[10px] text-slate-500">Fatimyah Educational Trust India</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
