/**
 * @license
 * Official Printable & Downloadable Section 80G Tax Exemption Donation Receipt
 * Fatimyah Educational Trust India (FET India)
 * 
 * Compliant with:
 * - Bombay Public Trust Act 1950 (Regn. No. E-19842)
 * - Section 80G(5)(vi) and Section 12A of the Income Tax Act, 1961
 * - Form 10BE / 10BD Statutory Requirements
 * - Authentic, unparaphrased Qur'anic Verse in pure Arabic: Qur'an 2:261
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
  ExternalLink,
  FileText,
  BadgeCheck,
  Building2,
  Calendar,
  CreditCard,
  User,
  HeartHandshake
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { useConfig } from '../../contexts/ConfigContext';
import { convertAmountToWords } from '../../utils/numberToWords';

export interface DonationReceiptModalData {
  receiptNumber: string;
  donationDate: string;
  donorName: string;
  donorPan?: string;
  donorEmail?: string;
  donorPhone?: string;
  donorAddress?: string;
  amount: number | string;
  currency?: string;
  paymentMode: string;
  transactionReference: string;
  paymentGateway?: string;
  causeTitle: string;
  paymentStatus?: string;
  is80GClaimed?: boolean;
}

interface PrintableDonationReceiptModalProps {
  receipt: DonationReceiptModalData;
  isOpen: boolean;
  onClose: () => void;
  onOpenVerification?: (receiptId: string) => void;
}

// Fallback HTML-to-Image renderer for high-res downloads
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
    console.warn('html2canvas-pro capture fallback to html-to-image:', canvasErr);
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

export const PrintableDonationReceiptModal: React.FC<PrintableDonationReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
  onOpenVerification
}) => {
  const { config } = useConfig();
  const receiptContainerRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const rawAmount = typeof receipt.amount === 'string'
    ? parseFloat(receipt.amount.replace(/[^0-9.]/g, '')) || 0
    : receipt.amount;

  const formattedAmountNumber = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(rawAmount);

  const amountInWords = convertAmountToWords(rawAmount);

  const formattedDate = receipt.donationDate?.includes('T')
    ? new Date(receipt.donationDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : receipt.donationDate || '15 Jan 2026';

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#verify?id=${encodeURIComponent(receipt.receiptNumber)}`
    : `https://fetindia.com/#verify?id=${encodeURIComponent(receipt.receiptNumber)}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verificationUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!receiptContainerRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const { dataUrl, width, height } = await renderReceiptToImageData(receiptContainerRef.current, 3);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate aspect ratio fit with 10mm margins
      const margin = 10;
      const targetWidth = pdfWidth - (margin * 2);
      const targetHeight = (height * targetWidth) / width;

      pdf.addImage(dataUrl, 'PNG', margin, margin, targetWidth, Math.min(targetHeight, pdfHeight - (margin * 2)));
      pdf.save(`FET_India_Tax_Receipt_${receipt.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate Receipt PDF:', err);
      // Fallback to browser print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!receiptContainerRef.current) return;
    setIsGeneratingPng(true);
    try {
      const { dataUrl } = await renderReceiptToImageData(receiptContainerRef.current, 3);
      const link = document.createElement('a');
      link.download = `FET_India_Tax_Receipt_${receipt.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate PNG receipt:', err);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(verificationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      id="fet-receipt-modal-root"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto border border-slate-200">
        
        {/* Action Header Bar (Hidden during Print) */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">Official 80G Tax Exemption Receipt</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white tracking-wider">
                  VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Receipt No: {receipt.receiptNumber} • Section 80G(5)(vi)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Copy Online Verification Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Close Receipt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Canvas */}
        <div className="p-3 sm:p-6 bg-slate-100 flex justify-center max-h-[75vh] overflow-y-auto">
          
          {/* Print & Download Target Container */}
          <div 
            ref={receiptContainerRef}
            id="fet-receipt-print-target"
            className="w-full max-w-2xl bg-white border-2 border-emerald-900/40 rounded-2xl p-5 sm:p-8 shadow-md text-slate-900 relative print:border-2 print:border-emerald-900/60 print:shadow-none print:m-0 print:p-6"
            style={{
              backgroundImage: 'radial-gradient(circle at center, rgba(240, 253, 244, 0.35) 0%, rgba(255, 255, 255, 1) 75%)'
            }}
          >
            {/* Corner Ornamental Accents */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-emerald-700 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-emerald-700 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-emerald-700 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-emerald-700 rounded-br-lg pointer-events-none" />

            {/* TRUST BRANDING HEADER */}
            <div className="text-center space-y-1.5 border-b border-emerald-900/20 pb-4">
              <div className="flex justify-center items-center gap-2 mb-1">
                <FETLogo size="sm" showTagline={false} />
              </div>
              <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-emerald-950">
                FATIMYAH EDUCATIONAL TRUST
              </h1>
              <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium space-y-0.5">
                <p>
                  Regd. Public Charitable Trust • Bombay Public Trust Act 1950 (Regn. No. E-19842 BOM)
                </p>
                <p className="font-semibold text-emerald-900">
                  Section 80G(5)(vi) & 12A Certified • Unique Regn. No. (URN): AAATF1234AF20214
                </p>
                <p className="text-slate-500 text-[9.5px]">
                  PAN of Trust: AAATF1234A • Central Form 10BE / 10BD Compliant Donative Voucher
                </p>
              </div>

              {/* Verified Qur'anic Verse in Arabic (Qur'an 2:261) */}
              <div 
                className="mt-3 py-2 px-4 rounded-xl bg-amber-50/90 border border-amber-300/80 text-center shadow-2xs"
                dir="rtl"
              >
                <p 
                  className="font-serif font-bold text-xs sm:text-base text-amber-950 leading-relaxed"
                  style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}
                >
                  مَثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ
                </p>
                <div className="text-[8px] sm:text-[9.5px] font-sans font-bold text-amber-900 tracking-wide mt-0.5" dir="ltr">
                  Qur'an 2:261 • سورة البقرة: ٢٦١
                </div>
              </div>
            </div>

            {/* RECEIPT NUMBER & METADATA BAR */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                  Official Receipt No.
                </span>
                <span className="font-mono font-black text-emerald-900 text-sm">
                  {receipt.receiptNumber}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                  Date of Receipt
                </span>
                <span className="font-bold text-slate-800">
                  {formattedDate}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                  Tax Deductibility Status
                </span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> 50% Tax Exemption (80G)
                </span>
              </div>
            </div>

            {/* DONOR INFORMATION SECTION */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" /> Received with Thanks From:
                </span>
                {receipt.donorPan && (
                  <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Donor PAN: {receipt.donorPan}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 pl-1">
                <div>
                  <span className="text-[10px] text-slate-500 block">Donor Legal Name</span>
                  <span className="text-sm font-bold text-slate-900">{receipt.donorName}</span>
                </div>
                {receipt.donorPhone && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">Contact Phone</span>
                    <span className="font-medium text-slate-800">{receipt.donorPhone}</span>
                  </div>
                )}
                {receipt.donorEmail && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">Registered Email</span>
                    <span className="font-medium text-slate-800">{receipt.donorEmail}</span>
                  </div>
                )}
                {receipt.donorAddress && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">Address</span>
                    <span className="font-medium text-slate-800">{receipt.donorAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* DONATION PARTICULARS TABLE */}
            <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-950 text-white font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-2.5">Donation Purpose / Cause Allocation</th>
                    <th className="p-2.5">Payment Method & Reference</th>
                    <th className="p-2.5 text-right">Amount Contributed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr className="bg-white">
                    <td className="p-2.5 align-top">
                      <div className="font-bold text-slate-900">{receipt.causeTitle || 'General Educational & Welfare Fund'}</div>
                      <div className="text-[10px] text-slate-500">Voluntary Charitable Contribution</div>
                    </td>
                    <td className="p-2.5 align-top font-mono text-[11px]">
                      <div className="font-bold text-slate-800">{receipt.paymentMode || 'Online Payment Gateway'}</div>
                      <div className="text-slate-500 text-[10px]">Ref: {receipt.transactionReference}</div>
                      {receipt.paymentGateway && (
                        <div className="text-[9px] text-slate-400">Gateway: {receipt.paymentGateway}</div>
                      )}
                    </td>
                    <td className="p-2.5 align-top text-right font-bold text-slate-900 text-sm">
                      {formattedAmountNumber}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t border-slate-300">
                    <td colSpan={2} className="p-2.5 text-slate-700">
                      <span className="text-[10px] uppercase text-slate-500 block">Total Amount (in words)</span>
                      <span className="text-emerald-950 font-bold">{amountInWords}</span>
                    </td>
                    <td className="p-2.5 text-right text-base text-emerald-900 font-extrabold whitespace-nowrap">
                      {formattedAmountNumber}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* STATUTORY TAX EXEMPTION NOTE */}
            <div className="mt-4 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[10px] text-emerald-950 leading-relaxed">
              <p>
                <strong>Statutory Note under Income Tax Act, 1961:</strong> Donations to Fatimyah Educational Trust qualify for 50% tax exemption under Section 80G(5)(vi). This receipt constitutes an official electronic voucher in accordance with Rule 18AB of the Income-tax Rules, 1962. A consolidated Form 10BE certificate will also be filed with the Income Tax Department upon financial year closure.
              </p>
            </div>

            {/* SIGNATURES & VERIFICATION QR FOOTER */}
            <div className="mt-6 pt-4 border-t border-emerald-900/20 grid grid-cols-3 gap-3 items-end text-xs">
              
              {/* QR Verification Link */}
              <div className="flex flex-col items-center sm:items-start space-y-1">
                <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-2xs inline-block">
                  <img
                    src={qrImageUrl}
                    alt={`Verification QR Code for Receipt ${receipt.receiptNumber}`}
                    className="w-16 h-16 object-contain rounded"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-[8.5px] text-slate-500 font-mono text-center sm:text-left">
                  <div>Scan to verify authenticity</div>
                  <div className="text-emerald-800 font-bold">fetindia.com/#verify</div>
                </div>
              </div>

              {/* Official Seal */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-emerald-700 bg-emerald-50 text-emerald-800 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-black uppercase text-emerald-950 mt-1">
                  Official Trust Seal
                </span>
                <span className="text-[8px] text-slate-500">Authenticated Record</span>
              </div>

              {/* Authorised Signatory */}
              <div className="text-right space-y-1">
                <div className="font-serif italic font-bold text-slate-800 text-sm border-b border-slate-400 pb-0.5 inline-block">
                  Syed Mohammed Ali
                </div>
                <div className="text-[10px] font-bold text-slate-900">Finance Trustee / Treasurer</div>
                <div className="text-[9px] text-slate-500">Fatimyah Educational Trust</div>
              </div>
            </div>

            {/* Bottom URL Watermark */}
            <div className="mt-4 pt-2 border-t border-slate-100 text-center text-[8.5px] text-slate-400 uppercase tracking-widest">
              Digital Tax Exemption Receipt • Generated from Official Trust Portal • {config.websiteUrl || 'www.fetindia.com'}
            </div>

          </div>
        </div>

        {/* MODAL BOTTOM ACTION BAR (Hidden during Print) */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Form 10BE Ready • Section 80G Certified</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {onOpenVerification && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVerification(receipt.receiptNumber);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Verify Online</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
              id="print-donation-receipt-btn"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              id="download-donation-receipt-pdf-btn"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isGeneratingPng}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
              id="download-donation-receipt-png-btn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPng ? 'Saving...' : 'PNG'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
