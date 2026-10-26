/**
 * @license
 * Hall Ticket / Admit Card Modal Component
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  MapPin, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  User, 
  QrCode,
  FileText
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Competition, CompetitionRegistration } from '../../types';
import { FETLogo } from '../common/FETLogo';

interface HallTicketModalProps {
  competition: Competition;
  registration: CompetitionRegistration;
  onClose: () => void;
  onDownloadPdfBook?: () => void;
  isDownloadingPdf?: boolean;
}

export const HallTicketModal: React.FC<HallTicketModalProps> = ({
  competition,
  registration,
  onClose,
  onDownloadPdfBook,
  isDownloadingPdf = false
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isVerified = registration.status === 'registered' || registration.status === 'verified';
  const isPendingReview = registration.status === 'pending_review' || registration.status === 'pending';
  const isPaidPending = Boolean(competition.isPaid && (!registration.isPaid || registration.paymentStatus === 'pending'));

  const examDate = competition.competitionDate || '2026-10-15';
  const duration = competition.examDetails?.durationMinutes || 45;
  const maxMarks = competition.maxMarks || 100;
  const category = competition.category || registration.competitionCategory || 'Open Category';

  const qrPayload = JSON.stringify({
    hallTicketNo: registration.participantId,
    regId: registration.registrationId,
    candidate: registration.participantName,
    competition: competition.title,
    uid: registration.participantUid,
    status: registration.status,
    verified: isVerified
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div 
        ref={printRef}
        className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col print:shadow-none print:border-none print:rounded-none"
      >
        {/* Top Header Bar (Screen Only) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">Official Candidate Hall Ticket</h2>
              <p className="text-[11px] text-slate-400">FET India Central Examination Board</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Admit Card</span>
            </button>

            {onDownloadPdfBook && (
              <button
                type="button"
                onClick={onDownloadPdfBook}
                disabled={isDownloadingPdf}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloadingPdf ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Book</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Close Hall Ticket"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Hall Ticket Canvas */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white">
          
          {/* Institutional Masthead */}
          <div className="border-b-2 border-emerald-800 pb-5 text-center relative">
            <div className="flex items-center justify-center gap-3 mb-2">
              <FETLogo className="h-12 w-auto" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
              Fatimyah Educational Trust India
            </h1>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Central Board of Examinations & Academic Competitions
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Statutory Trust Reg. No. E-32454 (Mumbai) • National Talent Search Division
            </p>

            <div className="mt-3 inline-block px-4 py-1 rounded-full bg-emerald-900 text-amber-400 font-extrabold text-xs tracking-wider uppercase shadow-xs">
              Computerized Examination Hall Ticket / Admit Card — 2026
            </div>
          </div>

          {/* Verification Status Banner */}
          <div>
            {isVerified ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold block">Candidate Enrollment Officially Verified</span>
                    <span className="text-[11px] text-emerald-700">
                      Identity credentials validated. Candidate is eligible to sit for the examination.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold text-[10px] uppercase shrink-0">
                  VERIFIED ADMIT
                </span>
              </div>
            ) : isPendingReview ? (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-extrabold block">Academic Review In Progress</span>
                    <span className="text-[11px] text-amber-800">
                      Registration received. Final roster verification under review by the District Coordinator.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-mono font-bold text-[10px] uppercase shrink-0">
                  PROVISIONAL
                </span>
              </div>
            ) : isPaidPending ? (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-extrabold block">Fee Verification Pending</span>
                    <span className="text-[11px] text-rose-800">
                      Participation fee receipt verification required prior to exam commencement.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono font-bold text-[10px] uppercase shrink-0">
                  FEE PENDING
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold block">Registration Confirmed</span>
                    <span className="text-[11px] text-emerald-700">Official candidate credentials generated.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Two-Column Candidate & Exam Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Candidate Details (2 Columns) */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>Candidate Information</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Candidate Full Name:</span>
                  <span className="font-extrabold text-slate-900 text-sm block">
                    {registration.participantName}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 text-white border border-slate-800">
                  <span className="text-[10px] text-amber-400 block font-semibold">Participant Roll No:</span>
                  <span className="font-mono font-black text-amber-300 text-sm block">
                    {registration.participantId}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Parent / Guardian:</span>
                  <span className="font-bold text-slate-800 block">
                    {registration.parentName || 'N/A'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Class / Grade:</span>
                  <span className="font-bold text-slate-800 block">
                    {registration.classGrade}
                  </span>
                </div>

                <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Institution / School:</span>
                  <span className="font-bold text-slate-800 block truncate">
                    {registration.schoolInstitution}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">District & State:</span>
                  <span className="font-bold text-slate-800 block">
                    {registration.district}, {registration.state}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Registration Doc ID:</span>
                  <span className="font-mono text-[11px] text-slate-600 block truncate">
                    {registration.registrationId || registration.id}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code & Digital Security Seal (1 Column) */}
            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                  Digital Verification Seal
                </span>
                <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 inline-block">
                  <QRCodeSVG 
                    value={qrPayload}
                    size={110}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 block">
                  Scan to Authenticate
                </span>
                <p className="text-[9px] text-slate-400 leading-tight">
                  Cryptographically binds Roll {registration.participantId} to candidate UID.
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 w-full text-[9px] text-slate-500 font-mono">
                Issued by FET Exam Board
              </div>
            </div>
          </div>

          {/* Examination Details Schedule Box */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Assessment Schedule & Examination Window</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Competition Title:</span>
                <span className="font-bold text-slate-900 block truncate" title={competition.title}>
                  {competition.title}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Code & Category:</span>
                <span className="font-bold text-emerald-800 block">
                  {competition.code || 'FET-CMP'} • {category}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Examination Date:</span>
                <span className="font-bold text-slate-900 block">
                  {examDate}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Duration & Marks:</span>
                <span className="font-bold text-slate-900 block">
                  {duration} Mins • {maxMarks} Marks
                </span>
              </div>
            </div>
          </div>

          {/* Curriculum & Prescribed Book Material Information */}
          {(competition.bookDetails?.bookTitle || competition.pdfFileName || competition.pdfReadingMaterialUrl) && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-amber-900 font-extrabold">
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Prescribed Curriculum & Study Material Book</span>
                </div>
                <p className="font-semibold text-slate-800">
                  {competition.bookDetails?.bookTitle || competition.title}
                  {competition.bookDetails?.author ? ` • Author: ${competition.bookDetails.author}` : ''}
                </p>
                {competition.bookDetails?.requiredChapters && (
                  <p className="text-[11px] text-slate-600">
                    Syllabus Chapters: <strong>{competition.bookDetails.requiredChapters}</strong>
                  </p>
                )}
              </div>

              {onDownloadPdfBook && (
                <button
                  type="button"
                  onClick={onDownloadPdfBook}
                  disabled={isDownloadingPdf}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 print:hidden"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official PDF</span>
                </button>
              )}
            </div>
          )}

          {/* Official Candidate Guidelines & Instructions */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-2">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wide text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-700" />
              <span>Mandatory Candidate Examination Guidelines</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 pl-1 leading-relaxed">
              <li>Candidates must keep this official Hall Ticket printed or saved on their device during verification.</li>
              <li>A valid Student Photo Identity Card or Aadhaar Card must be available upon request by invigilators.</li>
              <li>For Computer-Based Online Assessments, tab switching and multi-monitor setups will trigger automated proctoring violation logs.</li>
              <li>Calculators, unauthorized books, and digital assistants are strictly prohibited during the assessment window.</li>
              <li>In case of technical interruptions, candidate progress is auto-saved; re-login immediately using your registered email.</li>
            </ol>
          </div>

          {/* Authorized Signatures & Seal */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block">Candidate Signature:</span>
              <div className="w-36 h-8 border-b border-dashed border-slate-400 flex items-end">
                <span className="text-[10px] text-slate-400 italic">Sign within box</span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="font-serif italic font-bold text-emerald-900 text-sm">
                Dr. A. R. Fatimyah
              </div>
              <p className="text-[10px] font-bold text-slate-700 uppercase">
                Controller of Examinations
              </p>
              <p className="text-[9px] text-slate-400">
                Fatimyah Educational Trust Central Board
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls (Screen Only) */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 print:hidden">
          <div className="text-[11px] text-slate-500 font-medium">
            Hall Ticket Ref: <span className="font-mono font-bold text-slate-800">{registration.participantId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Hall Ticket</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
