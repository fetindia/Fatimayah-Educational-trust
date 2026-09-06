/**
 * @license
 * Crowdfunding Welfare Appeals Report (Step 52)
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  MapPin, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { AggregatedReportMetrics } from './types';
import { formatCurrencyINR } from './reportUtils';

interface ReportsCrowdfundingSectionProps {
  metrics: AggregatedReportMetrics;
  categoryBreakdown: { category: string; count: number; raised: number; target: number }[];
  stateBreakdown: { state: string; count: number }[];
}

export const ReportsCrowdfundingSection: React.FC<ReportsCrowdfundingSectionProps> = ({
  metrics,
  categoryBreakdown,
  stateBreakdown
}) => {
  return (
    <div className="space-y-6" id="reports-crowdfunding-section">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Total Appeals Registered</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {metrics.totalCampaigns}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {metrics.activeCampaigns} Active • {metrics.completedCampaigns} Completed
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase block">Total Funds Mobilized</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 block truncate">
            {formatCurrencyINR(metrics.campaignsRaisedTotal)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Target: {formatCurrencyINR(metrics.campaignsTargetTotal)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-blue-700 uppercase block">Funding Progress</span>
          <span className="text-2xl sm:text-3xl font-black text-blue-900 mt-1 block">
            {metrics.campaignsOverallProgressPct.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Across all active & archived campaigns
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase block">In Scrutiny / Review</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-800 mt-1 block">
            {metrics.pendingCampaigns}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Pending document verification
          </span>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cause / Category Performance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-700" />
            Performance by Welfare Cause
          </h3>
          {categoryBreakdown.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No campaign cause data recorded.</div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((cat, idx) => {
                const pct = cat.target > 0 ? Math.min(100, Math.round((cat.raised / cat.target) * 100)) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.category} ({cat.count})</span>
                      <span className="text-slate-600 font-mono text-[11px]">
                        {formatCurrencyINR(cat.raised)} / {formatCurrencyINR(cat.target)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* State Geographic Spread */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-700" />
            Appeals by Beneficiary State
          </h3>
          {stateBreakdown.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No regional state data available.</div>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {stateBreakdown.slice(0, 6).map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{s.state}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[11px]">
                    {s.count} appeals
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
