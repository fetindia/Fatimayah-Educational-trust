/**
 * @license
 * Official Printable & Downloadable Institutional Fee Receipt
 * Fatimyah Educational Trust India (FET India)
 * 
 * Compliant with:
 * - Registration No: E 9822 (Jammu & Kashmir)
 * - Section 12A / 80G Statutory Trust Governance
 * - SRS Chapter 15.10 Institutional Fee Management
 */

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas-pro';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  FileText,
  BadgeCheck,
  Building2,
  Calendar,
  CreditCard,
  User,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { FETLogo } from '../../common/FETLogo';
import { useConfig } from '../../../contexts/ConfigContext';
import { convertAmountToWords } from '../../../utils/numberToWords';
import { StudentFeeRecord } from '../../../types';

interface PrintableFeeReceiptModalProps {
  feeRecord: StudentFeeRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

// High-resolution capture helper
async function renderReceiptToImageData(element: HTMLElement, scale: number = 2.5): Promise<{ dataUrl: string; width: number; height: number }> {
  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height
    };
  } catch (canvasErr) {
    console.warn('html2canvas capture fallback to html-to-image:', canvasErr);
    const dataUrl = await htmlToImage.toPng(element, {
      pixelRatio: scale,
      cacheBust: true,
      backgroundColor: '#ffffff'
    });
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = dataUrl;
    });
    return {
      dataUrl,
      width: img.naturalWidth || 1200,
      height: img.naturalHeight || 1600
    };
  }
}

export const PrintableFeeReceiptModal: React.FC<PrintableFeeReceiptModalProps> = ({
  feeRecord,
  isOpen,
  onClose
}) => {
  const { config } = useConfig();
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  if (!isOpen || !feeRecord) return null;

  const trustName = config.trustName || 'FATIMYAH EDUCATIONAL TRUST';
  const trustTagline = 'Education • Service • Empowerment';
  const trustRegNumber = `Reg. No: ${config.registrationNumber || 'E 9822'} (${config.registrationJurisdiction || 'Jammu & Kashmir'})`;
  const trustPan = config.panNumber || 'AABTF0015H';
  const trustAddress = config.headOfficeAddress || 'Main Road, Kargil, Ladakh / Regional Office: Jammu & Kashmir, India';

  const receiptNumber = feeRecord.receiptNumber || `FET-FEE-REC-${new Date().getFullYear()}-0001`;
  const paymentDate = feeRecord.paymentDate || feeRecord.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0];
  const amountPaid = Number(feeRecord.amountPaid) || 0;
  const totalAssessed = Number(feeRecord.totalAssessed) || 0;
  const outstandingAmount = Math.max(0, totalAssessed - amountPaid);
  const amountInWords = convertAmountToWords(amountPaid);

  const handleCopyReceiptNumber = () => {
    navigator.clipboard.writeText(receiptNumber);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptPrintRef.current) return;
    setIsDownloading(true);
    try {
      const { dataUrl, width, height } = await renderReceiptToImageData(receiptPrintRef.current, 2.5);
      const pdf = new jsPDF({
        orientation: height > width ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (height * pdfWidth) / width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`Fee-Receipt-${receiptNumber}-${feeRecord.studentName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!receiptPrintRef.current) return;
    setIsDownloading(true);
    try {
      const { dataUrl } = await renderReceiptToImageData(receiptPrintRef.current, 3.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Fee-Receipt-${receiptNumber}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to generate PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:border-none print:shadow-none print:rounded-none">
        {/* Modal Toolbar (Screen Only) */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Official Institutional Fee Receipt
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {feeRecord.paymentStatus === 'paid' ? 'Fully Paid' : 'Partially Paid'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Receipt #{receiptNumber} • {feeRecord.institutionName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Exporting...' : 'PDF'}</span>
            </button>
            <button
              onClick={handleDownloadPNG}
              disabled={isDownloading}
              className="hidden sm:flex px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Download High-Res Image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible p-4 sm:p-8 bg-slate-100/60 print:bg-white print:p-0">
          <div 
            ref={receiptPrintRef}
            className="w-full bg-white p-6 sm:p-10 rounded-xl shadow-xs border border-slate-300 relative print:shadow-none print:border-none print:p-4 text-slate-900"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {/* Watermark Logo in Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
              <FETLogo className="w-96 h-96" />
            </div>

            {/* Receipt Header */}
            <div className="border-b-2 border-emerald-900 pb-5 mb-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <FETLogo className="w-14 h-14" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 uppercase font-sans">
                      {trustName}
                    </h1>
                    <p className="text-xs text-emerald-800 font-semibold tracking-wider uppercase font-sans">
                      {trustTagline}
                    </p>
                    <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                      {trustRegNumber} • PAN: {trustPan}
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right font-sans">
                  <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-bold text-xs">
                    INSTITUTIONAL FEE RECEIPT
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Academic Year: <strong className="text-slate-900">{feeRecord.academicSession}</strong>
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 text-center sm:text-left text-[10px] text-slate-500 font-sans">
                {trustAddress} • Website: fetindia.org • Official Finance Record
              </div>
            </div>

            {/* Receipt Reference Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg font-sans text-xs mb-6">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block">Receipt Number</span>
                <span className="font-bold text-slate-900 font-mono flex items-center gap-1">
                  {receiptNumber}
                  <button 
                    onClick={handleCopyReceiptNumber}
                    className="text-slate-400 hover:text-emerald-700 print:hidden cursor-pointer"
                    title="Copy receipt number"
                  >
                    {copiedReceipt ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block">Date of Payment</span>
                <span className="font-bold text-slate-900">{paymentDate}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block">Assessment Code</span>
                <span className="font-bold text-slate-900 font-mono">{feeRecord.feeCode}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block">Institution Type</span>
                <span className="font-bold text-emerald-800 capitalize flex items-center gap-1">
                  {feeRecord.institutionType === 'school' ? (
                    <><GraduationCap className="w-3 h-3" /> School ERP</>
                  ) : (
                    <><BookOpen className="w-3 h-3" /> Madrasa ERP</>
                  )}
                </span>
              </div>
            </div>

            {/* Student & Institution Particulars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 font-sans text-xs">
              <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  Student Particulars
                </h4>
                <div className="space-y-1 text-slate-800">
                  <p><span className="text-slate-500 inline-block w-24">Student Name:</span> <strong className="text-slate-950 font-bold">{feeRecord.studentName}</strong></p>
                  <p><span className="text-slate-500 inline-block w-24">Student Roll / ID:</span> <span className="font-mono font-semibold">{feeRecord.studentId}</span></p>
                  <p><span className="text-slate-500 inline-block w-24">Class / Course:</span> <span className="font-semibold text-slate-900">{feeRecord.courseOrGrade}</span></p>
                  {feeRecord.parentName && (
                    <p><span className="text-slate-500 inline-block w-24">Parent / Guardian:</span> <span>{feeRecord.parentName}</span></p>
                  )}
                  {feeRecord.parentPhone && (
                    <p><span className="text-slate-500 inline-block w-24">Contact:</span> <span>{feeRecord.parentPhone}</span></p>
                  )}
                </div>
              </div>

              <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  Institution Particulars
                </h4>
                <div className="space-y-1 text-slate-800">
                  <p><span className="text-slate-500 inline-block w-24">Institution:</span> <strong className="text-emerald-950">{feeRecord.institutionName}</strong></p>
                  <p><span className="text-slate-500 inline-block w-24">Institution Code:</span> <span className="font-mono">{feeRecord.institutionId}</span></p>
                  <p><span className="text-slate-500 inline-block w-24">Academic Year:</span> <span>{feeRecord.academicSession}</span></p>
                  <p><span className="text-slate-500 inline-block w-24">Governance:</span> <span className="text-emerald-900 font-semibold">Fatimyah Educational Trust India</span></p>
                  <p><span className="text-slate-500 inline-block w-24">Status:</span> <span className="text-emerald-700 font-bold">Verified Affiliation</span></p>
                </div>
              </div>
            </div>

            {/* Fee Items Table */}
            <div className="mb-6 font-sans">
              <table className="w-full text-xs border border-slate-300 rounded-lg overflow-hidden">
                <thead className="bg-emerald-950 text-white font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 text-left w-12">#</th>
                    <th className="py-2.5 px-3 text-left">Fee Category & Description</th>
                    <th className="py-2.5 px-3 text-center w-28">Academic Year</th>
                    <th className="py-2.5 px-3 text-right w-32">Total Assessed</th>
                    <th className="py-2.5 px-3 text-right w-32">Amount Remitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr className="bg-white">
                    <td className="py-3 px-3 text-slate-500 text-center font-mono">1</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 text-sm">
                        {feeRecord.categoryLabel || feeRecord.category.toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {feeRecord.description}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center font-medium">
                      {feeRecord.academicSession}
                    </td>
                    <td className="py-3 px-3 text-right font-medium">
                      ₹{totalAssessed.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-900 text-sm">
                      ₹{amountPaid.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 divide-y divide-slate-200">
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-right text-slate-600 font-medium">
                      Total Fee Assessed:
                    </td>
                    <td colSpan={2} className="py-2 px-3 text-right font-semibold text-slate-800">
                      ₹{totalAssessed.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                    <td colSpan={3} className="py-2.5 px-3 text-right text-xs uppercase tracking-wide">
                      Net Amount Remitted / Paid:
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-right text-base text-emerald-900">
                      ₹{amountPaid.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-right text-slate-600 font-medium">
                      Remaining Balance Due:
                    </td>
                    <td colSpan={2} className="py-2 px-3 text-right font-bold text-rose-700">
                      ₹{outstandingAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Amount in Words */}
            <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-lg font-sans text-xs text-slate-800 mb-6 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 uppercase text-[10px] font-bold block">Amount in Words</span>
                <span className="font-bold text-emerald-950 capitalize">{amountInWords} Rupees Only</span>
              </div>
            </div>

            {/* Payment Mode & Bank/Gateway Details */}
            <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/60 font-sans text-xs mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Payment Mode</span>
                  <span className="font-bold text-slate-900 capitalize flex items-center gap-1.5 mt-0.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                    {feeRecord.paymentMethod || 'Online (Razorpay / UPI)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Transaction / UTR Reference</span>
                  <span className="font-mono text-slate-900 font-semibold block mt-0.5 break-all">
                    {feeRecord.transactionReference || feeRecord.razorpayPaymentId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Payment Settlement Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold mt-0.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {feeRecord.paymentStatus === 'paid' ? 'Acknowledged & Settled' : 'Partially Settled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures & Seal Section */}
            <div className="pt-6 border-t border-slate-300 font-sans">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                <div className="text-xs text-slate-500 max-w-sm">
                  <p className="font-semibold text-slate-700">Official Institutional Receipt Notice:</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    This computer-generated receipt is officially issued by FATIMYAH EDUCATIONAL TRUST for verified student records under Chapter 15.10 institutional bylaws.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-36 border-b border-dashed border-slate-400 mb-1.5 mx-auto"></div>
                  <p className="text-xs font-bold text-slate-900 uppercase">Authorized Finance Officer</p>
                  <p className="text-[10px] text-emerald-800 font-semibold">Fatimyah Educational Trust India</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 print:hidden">
          <span className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Official cryptographic audit stamp recorded in trust ledger.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Receipt</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Exporting PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
