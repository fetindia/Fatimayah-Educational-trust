/**
 * @license
 * Notifications & Bulletins Telemetry Report (Step 52)
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  Bell, 
  Send, 
  Clock, 
  Archive, 
  AlertTriangle, 
  Users, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';
import { AggregatedReportMetrics } from './types';

interface ReportsNotificationsSectionProps {
  metrics: AggregatedReportMetrics;
  categoryBreakdown: { category: string; count: number }[];
  priorityBreakdown: { priority: string; count: number }[];
}

export const ReportsNotificationsSection: React.FC<ReportsNotificationsSectionProps> = ({
  metrics,
  categoryBreakdown,
  priorityBreakdown
}) => {
  return (
    <div className="space-y-6" id="reports-notifications-section">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase block">Total Dispatches Created</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {metrics.totalBroadcastsCreated}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Administrative bulletins & alerts
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase block">Active / Published</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 block">
            {metrics.publishedBroadcastsCount}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Live on community inboxes
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-blue-700 uppercase block">Scheduled Dispatches</span>
          <span className="text-2xl sm:text-3xl font-black text-blue-900 mt-1 block">
            {metrics.scheduledBroadcastsCount}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Queued for timed broadcast
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-600 uppercase block">Archived / Concluded</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-1 block">
            {metrics.archivedBroadcastsCount}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Historical bulletin records
          </span>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            Bulletins by Announcement Category
          </h3>
          {categoryBreakdown.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No category data recorded.</div>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{cat.category}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px]">
                    {cat.count} dispatches
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            Dispatches by Priority Level
          </h3>
          {priorityBreakdown.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No priority data recorded.</div>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {priorityBreakdown.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800 capitalize">{p.priority}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[11px]">
                    {p.count}
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
