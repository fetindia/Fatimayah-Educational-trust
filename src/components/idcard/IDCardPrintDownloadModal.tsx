/**
 * @license
 * Official FET India ID Card Print, Download & Interactive Viewer Modal
 * Fatimyah Educational Trust India
 * Features:
 * - Real-time Front / Back / Side-by-Side Dual Preview
 * - Direct Browser Print with dedicated print stylesheet and cut guides
 * - High-Resolution PDF Download (Front & Back on single sheet with cut guides)
 * - Crystal Clear 300 DPI PNG Image Download
 * - Seamless QR code verification linkage
 */

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  X, 
  Printer, 
  Download, 
  RotateCw, 
  Copy, 
  Check, 
  ShieldCheck, 
  QrCode, 
  FileText, 
  Layers, 
  Eye, 
  Sparkles,
  Info,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { FETIdentityCard, IDCardCategory } from './FETIdentityCard';
import { useConfig } from '../../contexts/ConfigContext';

// Helper function to capture HTML element to Data URL with multi-engine fallback for full modern CSS (oklch) compatibility
async function renderElementToImageData(element: HTMLElement, scale: number = 2.5): Promise<{ dataUrl: string; width: number; height: number }> {
  // Strategy 1: html2canvas-pro (Fully supports oklch, lab, and CSS color spaces without cross-origin cssRules errors)
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
  } catch (err1) {
    console.warn('html2canvas-pro failed, falling back to html-to-image:', err1);
    
    // Strategy 2: html-to-image with skipFonts to avoid remote CSS rule access errors
    const dataUrl = await htmlToImage.toPng(element, {
      pixelRatio: scale,
      backgroundColor: '#ffffff',
      skipFonts: true,
      cacheBust: true,
      skipAutoScale: true
    });

    return await new Promise<{ dataUrl: string; width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl,
          width: img.naturalWidth || element.offsetWidth * scale,
          height: img.naturalHeight || element.offsetHeight * scale
        });
      };
      img.onerror = () => reject(new Error('Failed to load generated PNG image'));
      img.src = dataUrl;
    });
  }
}

export interface IDCardPrintDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: IDCardCategory;
  cardId: string;
  fullName: string;
  fatherName?: string;
  guardianName?: string;
  motherName?: string;
  photoURL?: string;
  roleTitle?: string;
  designation?: string;
  department?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  issueDate?: string;
  validUntil?: string;
  district?: string;
  state?: string;
  country?: string;
  email?: string;
  mobileNumber?: string;
  donorType?: 'individual' | 'organization';
  organizationName?: string;
  volunteerWing?: string;
  onOpenVerification?: (id: string) => void;
  onNotify?: (message: string) => void;
}

export const IDCardPrintDownloadModal: React.FC<IDCardPrintDownloadModalProps> = ({
  isOpen,
  onClose,
  category,
  cardId,
  fullName,
  fatherName,
  guardianName,
  motherName,
  photoURL,
  roleTitle,
  designation,
  department,
  bloodGroup,
  dateOfBirth,
  issueDate,
  validUntil,
  district,
  state,
  country,
  email,
  mobileNumber,
  donorType,
  organizationName,
  volunteerWing,
  onOpenVerification,
  onNotify
}) => {
  const { config } = useConfig();
  const [viewMode, setViewMode] = useState<'front' | 'back' | 'both'>('front');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const printContainerRef = useRef<HTMLDivElement>(null);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const combinedCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(cardId);
    setCopiedId(true);
    if (onNotify) onNotify(`Identity ID ${cardId} copied to clipboard.`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
    setViewMode(isFlipped ? 'front' : 'back');
  };

  // Direct Standard Print Trigger
  const handlePrint = () => {
    window.print();
  };

  // High-Resolution PDF Download Generator
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    if (onNotify) onNotify('Generating high-resolution official PDF Identity Card...');

    try {
      // Create offscreen container or target combined reference
      const elementToCapture = combinedCardRef.current || printContainerRef.current;
      if (!elementToCapture) {
        throw new Error('ID Card elements could not be prepared for rendering.');
      }

      // Render at high resolution with oklch-safe multi-engine capture
      const { dataUrl: imgData, width: imgWidth, height: imgHeight } = await renderElementToImageData(elementToCapture, 2.5);

      // Standard A4 PDF in portrait
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // PDF Page dimensions: 210mm x 297mm
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Official Header on PDF Document
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(13, 110, 66); // Trust Emerald Green
      pdf.text('FATIMYAH EDUCATIONAL TRUST INDIA', pageWidth / 2, 22, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Regn. No. E-19842 (BOM) • Section 80G & 12A Certified • Official Accreditation Card', pageWidth / 2, 28, { align: 'center' });

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text(`OFFICIAL IDENTITY CREDENTIAL — ${fullName.toUpperCase()}`, pageWidth / 2, 36, { align: 'center' });

      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(20, 40, pageWidth - 20, 40);

      // Card Dimensions in PDF (Standard ISO CR80 size: 85.6mm x 54mm, or proportional display)
      // Capture width and height scaled to fit nicely
      const cardWidthMM = 170;
      const cardHeightMM = (imgHeight * cardWidthMM) / imgWidth;
      const posX = (pageWidth - cardWidthMM) / 2;
      const posY = 46;

      pdf.addImage(imgData, 'PNG', posX, posY, cardWidthMM, cardHeightMM);

      // Cutting & Lamination Instructions at bottom of PDF
      const instructionsY = posY + cardHeightMM + 14;
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text('PRINTING & LAMINATION INSTRUCTIONS:', 20, instructionsY);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('1. Print on heavy cardstock (250-300 GSM) or dedicated PVC ID card media for optimal durability.', 20, instructionsY + 5);
      pdf.text('2. Cut precisely along the outer border and fold along the center dividing line if dual-side lamination is required.', 20, instructionsY + 10);
      pdf.text('3. Scan the cryptographic QR code with any smartphone camera to verify live credential authenticity.', 20, instructionsY + 15);
      pdf.text('4. This document is electronically generated and verified by the Central Secretariat of Fatimyah Educational Trust.', 20, instructionsY + 20);

      // Verification Footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(13, 110, 66);
      pdf.text(`Document Reference: ${cardId} • Issued: ${issueDate || 'AY 2026-27'} • Verification URL: ${config.websiteUrl || 'fetindia.com'}/#verify`, pageWidth / 2, pageHeight - 12, { align: 'center' });

      // Save PDF file
      const sanitizedName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`FET_ID_Card_${sanitizedName}_${cardId}.pdf`);

      if (onNotify) onNotify('Official PDF Identity Card downloaded successfully!');
    } catch (err: any) {
      console.error('PDF Generation error:', err);
      if (onNotify) onNotify('Could not generate PDF. Please try printing directly.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // High-Resolution PNG Image Download Generator
  const handleDownloadPNG = async () => {
    setIsGeneratingPng(true);
    if (onNotify) onNotify('Generating high-definition PNG image of Identity Card...');

    try {
      const elementToCapture = combinedCardRef.current || printContainerRef.current;
      if (!elementToCapture) {
        throw new Error('ID Card element not ready.');
      }

      const { dataUrl } = await renderElementToImageData(elementToCapture, 3);

      const link = document.createElement('a');
      const sanitizedName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `FET_ID_Card_${sanitizedName}_${cardId}.png`;
      link.href = dataUrl;
      link.click();

      if (onNotify) onNotify('High-resolution Identity Card image downloaded!');
    } catch (err: any) {
      console.error('PNG download error:', err);
      if (onNotify) onNotify('Could not download image. Please try again.');
    } finally {
      setIsGeneratingPng(false);
    }
  };

  const commonCardProps = {
    category,
    cardId,
    fullName,
    fatherName,
    guardianName,
    motherName,
    photoURL,
    roleTitle,
    designation,
    department,
    bloodGroup,
    dateOfBirth,
    issueDate,
    validUntil,
    district,
    state,
    country,
    email,
    mobileNumber,
    donorType,
    organizationName,
    volunteerWing,
    onOpenVerification
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      id="fet-idcard-modal-root"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col max-h-[92vh]">
        
        {/* Modal Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider">
                  Official Digital Credential
                </span>
                <span className="font-mono text-[10px] text-slate-400 font-bold">
                  {cardId}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                {fullName} — Official Identity Card
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyId}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
              title="Copy ID Code"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              <span className="hidden sm:inline">{copiedId ? 'Copied' : 'Copy ID'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive View Controls */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => { setViewMode('front'); setIsFlipped(false); }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'front'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Front Side
            </button>

            <button
              type="button"
              onClick={() => { setViewMode('back'); setIsFlipped(true); }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'back'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Back Side
            </button>

            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'both'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Front & Back (Dual)</span>
            </button>
          </div>

          {/* Quick Flip Toggle Button */}
          {viewMode !== 'both' && (
            <button
              type="button"
              onClick={handleFlipCard}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFlipped ? 'Show Front' : 'Flip to Back'}</span>
            </button>
          )}

          {/* Verification trigger */}
          {onOpenVerification && (
            <button
              type="button"
              onClick={() => onOpenVerification(cardId)}
              className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-amber-300"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-700" />
              <span>Verify Online</span>
            </button>
          )}
        </div>

        {/* Modal Body: Interactive Card Display & Render Canvas */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100/70 flex flex-col items-center justify-center min-h-[320px]">
          
          {/* 1. Single View (Front or Back) */}
          {viewMode !== 'both' ? (
            <div className="w-full max-w-md my-auto py-2">
              <FETIdentityCard 
                {...commonCardProps}
                isFlipped={isFlipped}
                onFlip={handleFlipCard}
                idPrefix="modal-single"
              />
            </div>
          ) : (
            /* 2. Dual Side-by-Side View (Front & Back Together) */
            <div 
              ref={combinedCardRef}
              className="w-full max-w-3xl bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4"
              id="combined-idcard-canvas"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs font-bold text-slate-500">
                <span>Official Two-Sided PVC ID Card Layout (85.6mm x 54mm equivalent)</span>
                <span className="font-mono text-emerald-700">ISO/IEC 7810 ID-1 Standard</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                {/* Front Side */}
                <div className="space-y-1.5" ref={frontCardRef}>
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block text-center">
                    Front Side
                  </span>
                  <FETIdentityCard 
                    {...commonCardProps}
                    isFlipped={false}
                    idPrefix="dual-front"
                    showPrintWatermark={true}
                  />
                </div>

                {/* Back Side */}
                <div className="space-y-1.5" ref={backCardRef}>
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block text-center">
                    Back Side
                  </span>
                  <FETIdentityCard 
                    {...commonCardProps}
                    isFlipped={true}
                    idPrefix="dual-back"
                    showPrintWatermark={true}
                  />
                </div>
              </div>

              {/* Center Cut Line Guide */}
              <div className="pt-2 text-center text-[10px] text-slate-400 font-mono flex items-center justify-center gap-2">
                <span className="w-12 h-px bg-slate-300" />
                <span>✂ FOLD / CUT GUIDE ✂</span>
                <span className="w-12 h-px bg-slate-300" />
              </div>
            </div>
          )}

          {/* Offscreen Render Container for High-Res PDF/PNG Generation when in Single View */}
          {viewMode !== 'both' && (
            <div 
              style={{ position: 'fixed', left: '-9999px', top: '0', width: '820px', pointerEvents: 'none', zIndex: -100 }} 
              aria-hidden="true"
            >
              <div ref={combinedCardRef} className="w-[820px] p-6 bg-white space-y-4 rounded-3xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs font-bold text-slate-500">
                  <span>Official Two-Sided PVC ID Card Layout (85.6mm x 54mm equivalent)</span>
                  <span className="font-mono text-emerald-700">ISO/IEC 7810 ID-1 Standard</span>
                </div>
                <div className="grid grid-cols-2 gap-5 items-center">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block text-center">
                      Front Side
                    </span>
                    <FETIdentityCard {...commonCardProps} isFlipped={false} idPrefix="offscreen-front" showPrintWatermark={true} />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block text-center">
                      Back Side
                    </span>
                    <FETIdentityCard {...commonCardProps} isFlipped={true} idPrefix="offscreen-back" showPrintWatermark={true} />
                  </div>
                </div>
                <div className="pt-2 text-center text-[10px] text-slate-400 font-mono flex items-center justify-center gap-2">
                  <span className="w-12 h-px bg-slate-300" />
                  <span>✂ FOLD / CUT GUIDE ✂</span>
                  <span className="w-12 h-px bg-slate-300" />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer: Action Bar (Print, Download PDF, Download PNG) */}
        <div className="bg-white border-t border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="text-xs text-slate-500 hidden sm:block">
            <span className="font-bold text-slate-800">Official Authenticated Credential</span> • Security Watermarked for Print & PDF
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            
            {/* Direct Browser Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
              id="idcard-modal-print-btn"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Card</span>
            </button>

            {/* High-Res PNG Download Button */}
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isGeneratingPng}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
              id="idcard-modal-png-btn"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>{isGeneratingPng ? 'Generating PNG...' : 'Save Image (PNG)'}</span>
            </button>

            {/* High-Res PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-colors"
              id="idcard-modal-pdf-btn"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>{isGeneratingPdf ? 'Rendering PDF...' : 'Download Official PDF'}</span>
            </button>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* PURE PRINT MEDIA CONTAINER (FOR BROWSER WINDOW.PRINT)                     */}
      {/* ========================================================================= */}
      <div 
        ref={printContainerRef}
        id="fet-idcard-print-target" 
        className="print-only hidden"
      >
        <div className="print-page-layout">
          <div className="print-header">
            <h2>FATIMYAH EDUCATIONAL TRUST INDIA</h2>
            <p>Regn. No. E-19842 (BOM) • Section 80G & 12A Certified • Official Accreditation Card</p>
          </div>

          <div className="print-cards-grid">
            <div className="print-card-wrapper">
              <FETIdentityCard {...commonCardProps} isFlipped={false} idPrefix="print-front" showPrintWatermark={true} />
            </div>

            <div className="print-card-wrapper">
              <FETIdentityCard {...commonCardProps} isFlipped={true} idPrefix="print-back" showPrintWatermark={true} />
            </div>
          </div>

          <div className="print-footer">
            <p>✂ CUT AND FOLD ALONG GUIDES FOR PVC CARD LAMINATION ✂</p>
            <p>Verification URL: {config.websiteUrl || 'fetindia.com'}/#verify?id={cardId} • Document ID: {cardId}</p>
          </div>
        </div>
      </div>

    </div>
  );
};
