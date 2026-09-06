/**
 * @license
 * Official Digital Volunteer Card Component
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Public Brand: FET India
 * Regn. No. E-19842 (BOM) • Section 80G & 12A Certified
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  HeartHandshake, 
  Copy, 
  Check, 
  Printer, 
  Download, 
  RotateCw, 
  Sparkles,
  Award,
  Layers
} from 'lucide-react';
import { FETIdentityCard } from '../idcard/FETIdentityCard';
import { IDCardPrintDownloadModal } from '../idcard/IDCardPrintDownloadModal';

export interface DigitalVolunteerCardProps {
  volunteerId: string;
  fullName: string;
  fatherName?: string;
  guardianName?: string;
  motherName?: string;
  volunteerWing?: string;
  volunteerStatus?: string;
  issueDate?: string;
  validUntil?: string;
  photoURL?: string;
  bloodGroup?: string;
  district?: string;
  state?: string;
  country?: string;
  onOpenVerification?: (volunteerId: string) => void;
  onNotify?: (msg: string) => void;
  showActions?: boolean;
}

export const DigitalVolunteerCard: React.FC<DigitalVolunteerCardProps> = ({
  volunteerId,
  fullName,
  fatherName,
  guardianName,
  motherName,
  volunteerWing = 'Community Service',
  volunteerStatus = 'approved',
  issueDate = '2026-01-01',
  validUntil = 'AY 2026-2027',
  photoURL,
  bloodGroup,
  district,
  state,
  country = 'India',
  onOpenVerification,
  onNotify,
  showActions = true
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(volunteerId);
    setCopiedId(true);
    if (onNotify) onNotify(`Volunteer ID ${volunteerId} copied.`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleOpenPrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-4" id={`digital-volunteer-card-${volunteerId}`}>
      {/* Interactive Controls Bar */}
      {showActions && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 bg-sky-100 text-sky-950 border border-sky-300 shadow-2xs">
              <HeartHandshake className="w-3 h-3 text-sky-700" />
              <span>OFFICIAL VOLUNTEER CORPS CARD</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyId}
              className="p-1.5 px-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Copy Volunteer ID"
            >
              {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-600" />}
              <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-1.5 px-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Flip Card"
            >
              <RotateCw className="w-3 h-3 text-slate-600" />
              <span>{isFlipped ? 'Show Front' : 'Flip Card'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPrint}
              className="p-1.5 px-2.5 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] hidden sm:flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Print / Download PDF"
            >
              <Printer className="w-3 h-3 text-emerald-700" />
              <span>Print / Download</span>
            </button>
          </div>
        </div>
      )}

      {/* The Physical-Style Digital ID Card */}
      <FETIdentityCard
        category="volunteer"
        cardId={volunteerId}
        fullName={fullName}
        fatherName={fatherName}
        guardianName={guardianName}
        motherName={motherName}
        volunteerWing={volunteerWing}
        issueDate={issueDate}
        validUntil={validUntil}
        photoURL={photoURL}
        bloodGroup={bloodGroup}
        district={district}
        state={state}
        country={country}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(!isFlipped)}
        onOpenVerification={onOpenVerification}
        idPrefix="vol-card"
      />

      {/* Action CTA Bar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenVerification && onOpenVerification(volunteerId)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-400" />
            <span>Verify Volunteer QR</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPrint}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleOpenPrint}
              className="px-3.5 py-1.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-sky-300" />
              <span>Save / PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Print & Download Modal */}
      <IDCardPrintDownloadModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        category="volunteer"
        cardId={volunteerId}
        fullName={fullName}
        fatherName={fatherName}
        guardianName={guardianName}
        motherName={motherName}
        volunteerWing={volunteerWing}
        issueDate={issueDate}
        validUntil={validUntil}
        photoURL={photoURL}
        bloodGroup={bloodGroup}
        district={district}
        state={state}
        country={country}
        onOpenVerification={onOpenVerification}
        onNotify={onNotify}
      />
    </div>
  );
};
