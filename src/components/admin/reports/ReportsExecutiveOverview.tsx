/**
 * @license
 * Executive Super Admin Analytics Overview (Step 52)
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  Users, 
  HeartHandshake, 
  Briefcase, 
  Target, 
  BadgeDollarSign, 
  Landmark, 
  Award, 
  Bell, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  ArrowUpRight, 
  AlertCircle,
  FileSpreadsheet,
  Globe
} from 'lucide-react';
import { AggregatedReportMetrics, ReportModuleTab } from './types';
import { formatCurrencyINR } from './reportUtils';

interface ReportsExecutiveOverviewProps {
  metrics: AggregatedReportMetrics;
  onNavigateTab: (tab: ReportModuleTab) => void;
  stateDistribution: { state: string; count: number }[];
}

export const ReportsExecutiveOverview: React.FC<ReportsExecutiveOverviewProps> = ({
  metrics,
  onNavigateTab,
  stateDistribution
}) => {
  return (
    <div className="space-y-6" id="reports-executive-overview">
      {/* Top Level Institutional KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="overview-kpi-grid">
        {/* Total Users & Members */}
        <div 
          id="kpi-card-membership"
          onClick={() => onNavigateTab('membership')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Membership</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.totalUsers}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-amber-700">{metrics.totalMembers} Enrolled</span>
              <span>•</span>
              <span>{metrics.pendingMembershipApps} Pending</span>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span>{metrics.coreMembers} Core • {metrics.generalMembers} General</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Volunteers & Ground Force */}
        <div 
          id="kpi-card-volunteer"
          onClick={() => onNavigateTab('volunteer')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Volunteers</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.totalVolunteers}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-emerald-700">{metrics.activeVolunteers} Active Field Force</span>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-800 font-semibold">
            <span>{metrics.pendingVolunteerApps} In Scrutiny</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Staff & HRMS Directory */}
        <div 
          id="kpi-card-staff"
          onClick={() => onNavigateTab('staff')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Staff & Faculty</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.totalStaff}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-blue-700">{metrics.activeStaff} Active</span>
              <span>•</span>
              <span>{metrics.onLeaveStaff} On Leave</span>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-blue-800 font-semibold">
            <span>Across 6 Departments</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Donations & Philanthropy */}
        <div 
          id="kpi-card-donations"
          onClick={() => onNavigateTab('donations')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Philanthropy</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
              {formatCurrencyINR(metrics.totalDonationAmount)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-purple-700">{metrics.verifiedDonationsCount} Successful Donations</span>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-purple-800 font-semibold">
            <span>{metrics.uniqueDonorsCount} Unique Donors • {metrics.donations80GCount} 80G</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Secondary Strategic Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="overview-secondary-grid">
        {/* Crowdfunding Appeals */}
        <div 
          id="kpi-card-crowdfunding"
          onClick={() => onNavigateTab('crowdfunding')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Welfare Appeals</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900">{metrics.totalCampaigns}</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-rose-700">{metrics.activeCampaigns} Active</span> • {metrics.completedCampaigns} Completed
            </p>
          </div>
          <div className="mt-2.5 text-xs text-slate-600">
            Raised {formatCurrencyINR(metrics.campaignsRaisedTotal)} of {formatCurrencyINR(metrics.campaignsTargetTotal)}
          </div>
        </div>

        {/* Finance & Net Balance */}
        <div 
          id="kpi-card-finance"
          onClick={() => onNavigateTab('finance')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Ledger Balance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-700 truncate">
              {formatCurrencyINR(metrics.netFinanceBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Income: {formatCurrencyINR(metrics.totalFinanceIncome)}
            </p>
          </div>
          <div className="mt-2.5 text-xs text-slate-600">
            Expenditure: {formatCurrencyINR(metrics.totalFinanceExpense)}
          </div>
        </div>

        {/* Competitions & Exams */}
        <div 
          id="kpi-card-competitions"
          onClick={() => onNavigateTab('competitions')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Competitions & Exams</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900">{metrics.totalCompetitions} Programs</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-indigo-700">{metrics.totalParticipants} Participants</span>
            </p>
          </div>
          <div className="mt-2.5 text-xs text-slate-600">
            {metrics.completedExamsCount} Evaluated • {metrics.resultsPublishedCount} Results Live
          </div>
        </div>

        {/* Certificates & Notifications */}
        <div 
          id="kpi-card-certs"
          onClick={() => onNavigateTab('certificates')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Certificates & Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900">{metrics.totalCertificatesIssued}</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-teal-700">{metrics.validCertificatesCount} Validated</span> • {metrics.revokedCertificatesCount} Revoked
            </p>
          </div>
          <div className="mt-2.5 text-xs text-slate-600">
            {metrics.publishedBroadcastsCount} Bulletins Dispatched
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="overview-charts-section">
        {/* Campaign Funding Progress Visualization */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Crowdfunding Campaign Performance</h3>
              <p className="text-xs text-slate-500">Real-time target vs collected funds telemetry</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {metrics.campaignsOverallProgressPct.toFixed(1)}% Overall
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Total Funds Mobilized</span>
                <span className="text-emerald-700 font-bold">
                  {formatCurrencyINR(metrics.campaignsRaisedTotal)} / {formatCurrencyINR(metrics.campaignsTargetTotal)}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200 p-0.5">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.campaignsOverallProgressPct))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Active Appeals</span>
                <span className="text-lg font-black text-slate-800">{metrics.activeCampaigns}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-600 block uppercase">Fulfilled</span>
                <span className="text-lg font-black text-emerald-800">{metrics.completedCampaigns}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-[11px] font-bold text-amber-600 block uppercase">In Scrutiny</span>
                <span className="text-lg font-black text-amber-800">{metrics.pendingCampaigns}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Finance Cashflow Comparison */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Financial Balance & Cashflow</h3>
              <p className="text-xs text-slate-500">Verified institutional income vs approved expenditures</p>
            </div>
            <button 
              onClick={() => onNavigateTab('finance')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              View Ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800 uppercase block">Total Income (Receipts)</span>
                <span className="text-xl font-black text-emerald-950 mt-1 block">
                  {formatCurrencyINR(metrics.totalFinanceIncome)}
                </span>
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  {metrics.verifiedIncomeCount} verified transactions
                </span>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-xs font-bold text-rose-800 uppercase block">Total Expenditure</span>
                <span className="text-xl font-black text-rose-950 mt-1 block">
                  {formatCurrencyINR(metrics.totalFinanceExpense)}
                </span>
                <span className="text-[11px] text-rose-700 mt-1 block">
                  {metrics.paidExpenseCount} paid vouchers
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Net Surplus / Operating Reserve</span>
              <span className={`font-black text-sm ${metrics.netFinanceBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrencyINR(metrics.netFinanceBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Geographic State & Community Distribution */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm" id="overview-geo-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-700" />
              Pan-India Community Density by State / Territory
            </h3>
            <p className="text-xs text-slate-500">Distribution of registered members, volunteers and donors across states</p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {stateDistribution.length} States / Territories Represented
          </span>
        </div>

        {stateDistribution.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No geographic demographic data logged in current filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stateDistribution.slice(0, 12).map((item, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800 block truncate">{item.state}</span>
                <span className="text-lg font-black text-emerald-800 mt-0.5 block">{item.count}</span>
                <span className="text-[10px] text-slate-400 font-medium">Community Members</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Institutional Audit Summary Footer */}
      <div className="p-4 rounded-xl bg-emerald-950 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>
            Real-time Firestore Database Telemetry active. All metrics derived strictly from verified live institutional collections.
          </span>
        </div>
        <div className="text-emerald-300 font-mono text-[11px]">
          Fatimyah Educational Trust India
        </div>
      </div>
    </div>
  );
};
