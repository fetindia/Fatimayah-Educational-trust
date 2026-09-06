/**
 * @license
 * Staff & Faculty HRMS Report (Step 52)
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  Briefcase, 
  UserCheck, 
  Clock, 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  Lock,
  Users
} from 'lucide-react';
import { AggregatedReportMetrics } from './types';

interface ReportsStaffSectionProps {
  metrics: AggregatedReportMetrics;
  deptBreakdown: { department: string; count: number }[];
  designationBreakdown: { designation: string; count: number }[];
}

export const ReportsStaffSection: React.FC<ReportsStaffSectionProps> = ({
  metrics,
  deptBreakdown,
  designationBreakdown
}) => {
  return (
    <div className="space-y-6" id="reports-staff-section">
      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span>
            <strong>Data Privacy Enforced:</strong> Private staff compensation, bank identifiers, and unverified personal KYC are strictly redacted from aggregate reports.
          </span>
        </div>
        <span className="font-semibold text-slate-700 font-mono text-[11px]">HRMS Confidential</span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Total Staff Headcount</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {metrics.totalStaff}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Official Trust employees & faculty
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase block">Active on Duty</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 block">
            {metrics.activeStaff}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Currently operational
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase block">On Approved Leave</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-800 mt-1 block">
            {metrics.onLeaveStaff}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Sabbatical or medical leave
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-600 uppercase block">Inactive / Relieved</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-1 block">
            {metrics.inactiveStaff}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Past staff records archived
          </span>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Department */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            Headcount by Department
          </h3>
          {deptBreakdown.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No department breakdown available.</div>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {deptBreakdown.map((dept, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{dept.department}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px]">
                    {dept.count} personnel
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Designation */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-700" />
            Key Designations & Positions
          </h3>
          {designationBreakdown.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No designation data available.</div>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {designationBreakdown.slice(0, 8).map((desig, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{desig.designation}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[11px]">
                    {desig.count}
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
