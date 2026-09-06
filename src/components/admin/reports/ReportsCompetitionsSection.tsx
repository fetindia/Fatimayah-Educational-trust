/**
 * @license
 * Competition & Examination Analytics Report (Step 52)
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  Award, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  Users, 
  Clock, 
  FileText, 
  Layers 
} from 'lucide-react';
import { AggregatedReportMetrics } from './types';

interface ReportsCompetitionsSectionProps {
  metrics: AggregatedReportMetrics;
  categoryBreakdown: { category: string; count: number }[];
}

export const ReportsCompetitionsSection: React.FC<ReportsCompetitionsSectionProps> = ({
  metrics,
  categoryBreakdown
}) => {
  return (
    <div className="space-y-6" id="reports-competitions-section">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-indigo-800 uppercase block">Total Programs Created</span>
          <span className="text-2xl sm:text-3xl font-black text-indigo-950 mt-1 block">
            {metrics.totalCompetitions}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {metrics.activeCompetitions} Active • {metrics.completedCompetitions} Completed
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-700 uppercase block">Total Student Participants</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {metrics.totalParticipants}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Registered examinees
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase block">Exams Evaluated</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 block">
            {metrics.completedExamsCount}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {metrics.resultsPublishedCount} Results Published
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-amber-700 uppercase block">Merit Certs Dispatched</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-900 mt-1 block">
            {metrics.certificatesIssuedFromCompCount}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Official digital certificates
          </span>
        </div>
      </div>

      {/* Program Breakdown */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-700" />
          Competition Programs by Category
        </h3>
        {categoryBreakdown.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs">No competition category data recorded.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-800 capitalize block truncate">
                  {cat.category.replace(/_/g, ' ')}
                </span>
                <span className="text-lg font-black text-indigo-800 mt-1 block">
                  {cat.count} programs
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
