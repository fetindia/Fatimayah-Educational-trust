/**
 * @license
 * Reports & Analytics Utilities & Formatters
 * Fatimyah Educational Trust India
 */

import { DateFilterOption, ReportRecordRow, AggregatedReportMetrics } from './types';

/**
 * Formats a number as Indian Currency (INR)
 */
export function formatCurrencyINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Standard date formatter
 */
export function formatReportDate(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Checks if a given timestamp/date falls within the selected filter window
 */
export function isDateWithinFilter(
  dateString?: string | null,
  filterOption: DateFilterOption = 'all',
  customStart?: string,
  customEnd?: string
): boolean {
  if (filterOption === 'all' || !dateString) return true;

  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return true; // Fallback if date is irregular

    const now = new Date();
    const itemTime = dateObj.getTime();

    switch (filterOption) {
      case 'today': {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
        return itemTime >= startOfDay && itemTime <= endOfDay;
      }
      case '7days': {
        const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        return itemTime >= sevenDaysAgo && itemTime <= now.getTime();
      }
      case '30days': {
        const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        return itemTime >= thirtyDaysAgo && itemTime <= now.getTime();
      }
      case 'this_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return itemTime >= startOfMonth && itemTime <= now.getTime();
      }
      case 'this_year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        return itemTime >= startOfYear && itemTime <= now.getTime();
      }
      case 'custom': {
        if (!customStart && !customEnd) return true;
        let pass = true;
        if (customStart) {
          const startTime = new Date(customStart).getTime();
          if (!isNaN(startTime)) {
            pass = pass && itemTime >= startTime;
          }
        }
        if (customEnd) {
          // Include the end day fully
          const endTime = new Date(customEnd).getTime() + (24 * 60 * 60 * 1000 - 1);
          if (!isNaN(endTime)) {
            pass = pass && itemTime <= endTime;
          }
        }
        return pass;
      }
      default:
        return true;
    }
  } catch {
    return true;
  }
}

/**
 * Mask sensitive data like PAN or Bank Account
 */
export function maskSensitiveData(val?: string, maskType: 'pan' | 'phone' | 'email' = 'pan'): string {
  if (!val) return 'N/A';
  if (maskType === 'pan') {
    if (val.length < 5) return '***';
    return `${val.slice(0, 3)}****${val.slice(-2)}`;
  }
  if (maskType === 'phone') {
    if (val.length < 6) return '***';
    return `${val.slice(0, 3)}****${val.slice(-3)}`;
  }
  if (maskType === 'email') {
    const parts = val.split('@');
    if (parts.length === 2 && parts[0].length > 2) {
      return `${parts[0].slice(0, 2)}***@${parts[1]}`;
    }
    return val;
  }
  return val;
}

/**
 * Escape string for CSV format
 */
export function escapeCsvCell(cell: string | number | undefined | null): string {
  if (cell === undefined || cell === null) return '""';
  const str = String(cell).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generate CSV text from report rows with institutional metadata
 */
export function generateReportsCsv(
  moduleName: string,
  rows: ReportRecordRow[],
  filterSummary: {
    dateFilter: string;
    state: string;
    district: string;
    exportedBy: string;
  },
  metrics?: Partial<AggregatedReportMetrics>
): string {
  const lines: string[] = [];

  // Header metadata
  lines.push('FATIMYAH EDUCATIONAL TRUST INDIA (FET INDIA)');
  lines.push('Official Central Administrative Reporting & Audit Telemetry');
  lines.push(`Report Module: ${moduleName.toUpperCase()}`);
  lines.push(`Generated On: ${new Date().toISOString()}`);
  lines.push(`Exported By: ${filterSummary.exportedBy}`);
  lines.push(`Timeframe Scope: ${filterSummary.dateFilter}`);
  lines.push(`Territory Scope: State: ${filterSummary.state}, District: ${filterSummary.district}`);
  lines.push(`Total Records Filtered: ${rows.length}`);
  lines.push('');

  // Column headers
  lines.push([
    'Record ID',
    'Name / Title',
    'Identifier ID',
    'Module',
    'Category',
    'Sub-Category / Dept',
    'Status',
    'State',
    'District',
    'Date',
    'Amount (INR) / Summary'
  ].map(escapeCsvCell).join(','));

  // Data rows
  rows.forEach(r => {
    lines.push([
      r.id,
      r.name,
      r.identifierId || 'N/A',
      r.module,
      r.category,
      r.subCategory || 'N/A',
      r.status,
      r.state || 'Pan-India',
      r.district || 'All Districts',
      formatReportDate(r.date),
      r.amountOrNotes || (r.amount !== undefined ? formatCurrencyINR(r.amount) : 'N/A')
    ].map(escapeCsvCell).join(','));
  });

  return lines.join('\n');
}

/**
 * Trigger file download in browser
 */
export function downloadCsvFile(csvContent: string, fileName: string): void {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
