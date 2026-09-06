/**
 * @license
 * Digital Certificate of Excellence / Merit / Participation Modal
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  Sparkles,
  BookOpen,
  Calendar,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { CompetitionCertificateRecord } from '../../types';
import { FETLogo } from '../common/FETLogo';

interface DigitalCertificateModalProps {
  certificate: CompetitionCertificateRecord;
  onClose: () => void;
  onOpenVerifyModal?: (id: string) => void;
}

export const DigitalCertificateModal: React.FC<DigitalCertificateModalProps> = ({
  certificate,
  onClose,
  onOpenVerifyModal
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const isRevoked = certificate.status === 'revoked';
  const isExpired = certificate.status === 'expired';

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#verify?id=${encodeURIComponent(certificate.certificateId)}`
    : `https://fetindia.com/#verify?id=${encodeURIComponent(certificate.certificateId)}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getAchievementBadge = () => {
    switch (certificate.achievement) {
      case '1st_rank':
        return {
          title: 'NATIONAL FIRST RANK HOLDER',
          subtitle: 'Gold Medal & Academic Distinction',
          accent: 'from-amber-500 to-yellow-600',
          textColor: 'text-amber-900',
          border: 'border-amber-400'
        };
      case '2nd_rank':
        return {
          title: 'NATIONAL SECOND RANK HOLDER',
          subtitle: 'Silver Medal & Academic Excellence',
          accent: 'from-slate-400 to-slate-600',
          textColor: 'text-slate-900',
          border: 'border-slate-400'
        };
      case '3rd_rank':
        return {
          title: 'NATIONAL THIRD RANK HOLDER',
          subtitle: 'Bronze Medal & Outstanding Performance',
          accent: 'from-amber-700 to-amber-900',
          textColor: 'text-amber-900',
          border: 'border-amber-700'
        };
      case 'merit':
        return {
          title: 'CERTIFICATE OF MERIT',
          subtitle: 'For High Scholarly Achievement & Distinction',
          accent: 'from-emerald-600 to-teal-700',
          textColor: 'text-emerald-900',
          border: 'border-emerald-500'
        };
      case 'special_award':
        return {
          title: 'SPECIAL DISTINCTION AWARD',
          subtitle: 'Honoring Exceptional Academic Creativity',
          accent: 'from-purple-600 to-indigo-700',
          textColor: 'text-purple-900',
          border: 'border-purple-500'
        };
      default:
        return {
          title: 'CERTIFICATE OF PARTICIPATION',
          subtitle: 'For Active Engagement & Academic Commitment',
          accent: 'from-emerald-700 to-emerald-900',
          textColor: 'text-emerald-900',
          border: 'border-emerald-600'
        };
    }
  };

  const badge = getAchievementBadge();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto" id="fet-cert-modal-root">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto border border-slate-200">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">FET India Digital Academic Credential</h3>
                {isRevoked ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white tracking-wider animate-pulse">
                    REVOKED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white tracking-wider">
                    VALID & VERIFIED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Official ISO 9001:2015 Accredited Trust Certificate • ID: {certificate.certificateId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
              title="Copy Direct Public Verification Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Link Copied' : 'Copy QR Link'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Warning Banner if Revoked */}
        {isRevoked && (
          <div className="bg-rose-500 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>NOTICE:</strong> This certificate was <strong>REVOKED</strong> by the Examination Directorate.
                {certificate.revocationReason ? ` Reason: ${certificate.revocationReason}` : ''}
              </span>
            </div>
            {certificate.revokedAt && (
              <span className="text-[10px] opacity-90 shrink-0">
                Date: {new Date(certificate.revokedAt).toLocaleDateString('en-IN')}
              </span>
            )}
          </div>
        )}

        {/* Certificate Display Area */}
        <div className="p-4 sm:p-8 bg-slate-100 flex justify-center">
          <div 
            ref={printRef}
            className={`w-full max-w-3xl bg-white border-8 border-double ${isRevoked ? 'border-rose-900/80 opacity-90' : 'border-emerald-900/80'} rounded-2xl p-6 sm:p-10 shadow-lg relative overflow-hidden text-slate-900 print:shadow-none print:border-8 print:m-0`}
            style={{
              backgroundImage: isRevoked
                ? 'radial-gradient(circle at center, rgba(255, 241, 242, 0.6) 0%, rgba(255, 255, 255, 1) 70%)'
                : 'radial-gradient(circle at center, rgba(240, 253, 244, 0.4) 0%, rgba(255, 255, 255, 1) 70%)'
            }}
          >
            {/* Revoked Diagonal Watermark Stamp */}
            {isRevoked && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-20">
                <div className="border-8 border-rose-600 text-rose-600/30 font-black text-4xl sm:text-6xl tracking-widest uppercase rotate-[-30deg] px-8 py-4 rounded-3xl border-dashed">
                  REVOKED / CANCELLED
                </div>
              </div>
            )}

            {/* Corner Decorative Accents */}
            <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 border-amber-600 rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 border-amber-600 rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 border-amber-600 rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 border-amber-600 rounded-br-lg" />

            {/* Header / Seal */}
            <div className="text-center space-y-2 border-b border-emerald-900/20 pb-4">
              <div className="flex justify-center items-center gap-2 mb-1">
                <FETLogo size="sm" showTagline={false} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-emerald-950">
                Fatimyah Educational Trust
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-600 uppercase tracking-widest">
                Regd. Public Trust • Bombay Public Trust Act 1950 (E-19842) • NITI Aayog Verified
              </p>
              <p className="text-[10px] text-emerald-800 font-bold tracking-wider">
                EDUCATION • SERVICE • EMPOWERMENT
              </p>
            </div>

            {/* Title / Badge */}
            <div className="text-center my-6 space-y-1">
              <div className={`inline-block px-4 py-1.5 rounded-full ${isRevoked ? 'bg-rose-50 border border-rose-300' : 'bg-amber-50 border border-amber-300'} shadow-2xs`}>
                <span className={`text-xs sm:text-sm font-black tracking-wider ${isRevoked ? 'text-rose-900' : 'text-amber-900'} uppercase`}>
                  {badge.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 italic">{badge.subtitle}</p>
            </div>

            {/* Recipient Details */}
            <div className="text-center space-y-4 my-6">
              <p className="text-xs sm:text-sm text-slate-600">This prestigious credential is proudly presented to</p>
              
              <div className="border-b-2 border-slate-300 pb-2 inline-block min-w-[280px] max-w-full">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-serif tracking-wide px-4">
                  {certificate.participantName}
                </h2>
              </div>

              {certificate.schoolInstitution && (
                <p className="text-xs font-medium text-slate-700">
                  of <span className="font-bold text-slate-900">{certificate.schoolInstitution}</span>, {certificate.district}, {certificate.state}
                </p>
              )}

              <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed pt-2">
                for distinguished academic merit, exceptional performance, and scholarly dedication in the{' '}
                <strong className="text-emerald-950 font-extrabold">{certificate.competitionTitle}</strong>.
              </p>

              {certificate.score !== undefined && certificate.totalMarks !== undefined && (
                <div className="inline-flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Score Secured</span>
                    <span className="font-bold text-slate-900">{certificate.score} / {certificate.totalMarks}</span>
                  </div>
                  {certificate.grade && (
                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-slate-400 block text-[10px]">Merit Grade</span>
                      <span className="font-bold text-emerald-800">{certificate.grade}</span>
                    </div>
                  )}
                  {certificate.rank && (
                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-slate-400 block text-[10px]">National Rank</span>
                      <span className="font-bold text-amber-700">Rank #{certificate.rank}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer / QR / Signatures */}
            <div className="pt-6 border-t border-emerald-900/20 grid grid-cols-3 gap-4 items-end mt-8 text-center text-xs">
              
              {/* QR Verification */}
              <div className="flex flex-col items-center sm:items-start text-left space-y-1">
                <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-2xs inline-block">
                  <img
                    src={qrImageUrl}
                    alt={`Verification QR Code for Certificate ${certificate.certificateId}`}
                    className="w-14 h-14 object-contain rounded"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback if image proxy unavailable
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  <div>ID: {certificate.certificateId}</div>
                  <div>Issued: {new Date(certificate.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Trust Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className={`w-14 h-14 rounded-full border-2 border-dashed ${isRevoked ? 'border-rose-600 bg-rose-500/10 text-rose-800' : 'border-amber-600 bg-amber-500/10 text-amber-800'} flex items-center justify-center shadow-inner`}>
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-black uppercase text-amber-900 mt-1">Official Trust Seal</span>
              </div>

              {/* Signatures */}
              <div className="text-right space-y-1">
                <div className="font-serif italic font-bold text-slate-800 text-sm border-b border-slate-400 pb-0.5 inline-block">
                  Dr. Syed Abbas Rizvi
                </div>
                <div className="text-[10px] font-bold text-slate-900">Academic Controller</div>
                <div className="text-[9px] text-slate-500">Fatimyah Educational Trust</div>
              </div>
            </div>

            {/* Watermark Verification Notice */}
            <div className="mt-4 text-center">
              <p className="text-[9px] text-slate-400 uppercase tracking-widest">
                Verify this credential online at FETIndia.com/#verify?id={certificate.certificateId}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Authenticated by Fatimyah Educational Trust Central Examination Directorate</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenVerifyModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVerifyModal(certificate.certificateId);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Verification Center</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF Certificate</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
