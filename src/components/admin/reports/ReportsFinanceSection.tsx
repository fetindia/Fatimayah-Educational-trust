/**
 * @license
 * Finance & Accounting Ledger Report (Step 52)
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  PieChart,
  Tag
} from 'lucide-react';
import { AggregatedReportMetrics } from './types';
import { formatCurrencyINR } from './reportUtils';

interface ReportsFinanceSectionProps {
  metrics: AggregatedReportMetrics;
  incomeCategories: { category: string; amount: number }[];
  expenseCategories: { category: string; amount: number }[];
}

export const ReportsFinanceSection: React.FC<ReportsFinanceSectionProps> = ({
  metrics,
  incomeCategories,
  expenseCategories
}) => {
  return (
    <div className="space-y-6" id="reports-finance-section">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase block">Total Verified Income</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1 block truncate">
            {formatCurrencyINR(metrics.totalFinanceIncome)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {metrics.verifiedIncomeCount} revenue transactions
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-rose-800 uppercase block">Total Expenditure</span>
          <span className="text-2xl sm:text-3xl font-black text-rose-950 mt-1 block truncate">
            {formatCurrencyINR(metrics.totalFinanceExpense)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {metrics.paidExpenseCount} paid vouchers
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-600 uppercase block">Net Ledger Balance</span>
          <span className={`text-2xl sm:text-3xl font-black mt-1 block truncate ${metrics.netFinanceBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrencyINR(metrics.netFinanceBalance)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Operating surplus / reserve
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-amber-700 uppercase block">Pending Expenses</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-900 mt-1 block">
            {metrics.pendingExpenseCount}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Vouchers in scrutiny / approval
          </span>
        </div>
      </div>

      {/* Breakdowns: Income by Category vs Expenses by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            Income Breakdown by Source
          </h3>
          {incomeCategories.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No income entries recorded in this timeframe.</div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {incomeCategories.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800 capitalize">
                    {item.category.replace(/_/g, ' ')}
                  </span>
                  <span className="font-bold text-emerald-800 font-mono">
                    {formatCurrencyINR(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-700" />
            Expenditure Breakdown by Department / Head
          </h3>
          {expenseCategories.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No expense entries recorded in this timeframe.</div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {expenseCategories.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800 capitalize">
                    {item.category.replace(/_/g, ' ')}
                  </span>
                  <span className="font-bold text-rose-800 font-mono">
                    {formatCurrencyINR(item.amount)}
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
