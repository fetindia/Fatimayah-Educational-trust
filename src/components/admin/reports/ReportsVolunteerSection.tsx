/**
 * @license
 * Volunteer Workforce & Field Operations Report (Step 52)
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  HeartHandshake, 
  UserCheck, 
  Clock, 
  MapPin, 
  Briefcase, 
  Award, 
  Sparkles,
  Layers
} from 'lucide-react';
import { AggregatedReportMetrics } from './types';

interface ReportsVolunteerSectionProps {
  metrics: AggregatedReportMetrics;
  categoryBreakdown: { category: string; count: number }[];
  stateBreakdown: { state: string; count: number }[];
}

export const ReportsVolunteerSection: React.FC<ReportsVolunteerSectionProps> = ({
  metrics,
  categoryBreakdown,
  stateBreakdown
}) => {
  return (
    <div className="space-y-6" id="reports-volunteer-section">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Total Volunteers Enrolled</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {metrics.totalVolunteers}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Registered ground mobilizers
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase block">Active Field Force</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 block">
            {metrics.activeVolunteers}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Available for deployments
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase block">Pending Scrutiny</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-800 mt-1 block">
            {metrics.pendingVolunteerApps}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Awaiting background review
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-blue-700 uppercase block">Approved Applications</span>
          <span className="text-2xl sm:text-3xl font-black text-blue-900 mt-1 block">
            {metrics.approvedVolunteerApps}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {metrics.rejectedVolunteerApps} Disqualified
          </span>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories / Specializations */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            Volunteer Wings & Skill Categories
          </h3>
          {categoryBreakdown.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No category breakdown available.</div>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{cat.category}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[11px]">
                    {cat.count} volunteers
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* State Geographic Spread */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-700" />
            Volunteer Force Geographic Spread
          </h3>
          {stateBreakdown.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No regional state data available.</div>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {stateBreakdown.slice(0, 6).map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{s.state}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[11px]">
                    {s.count}
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
