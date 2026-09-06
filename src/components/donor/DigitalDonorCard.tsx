/**
 * @license
 * Official Digital Donor & Patron Card Component
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Public Brand: FET India
 * Regn. No. E-19842 (BOM) • Section 80G & 12A Certified
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Copy, 
  Check, 
  RotateCw, 
  Heart,
  BadgeDollarSign,
  Printer,
  Download
} from 'lucide-react';
import { FETIdentityCard } from '../idcard/FETIdentityCard';
import { IDCardPrintDownloadModal } from '../idcard/IDCardPrintDownloadModal';

export interface DigitalDonorCardProps {
  donorId: string;
  fullName: string;
  fatherName?: string;
  guardianName?: string;
  motherName?: string;
  donorType?: 'individual' | 'organization' | string;
  organizationName?: string;
  donorStatus?: string;
  issueDate?: string;
  validUntil?: string;
  photoURL?: string;
  bloodGroup?: string;
  district?: string;
  state?: string;
  country?: string;
  onOpenVerification?: (donorId: string) => void;
  onNotify?: (msg: string) => void;
  showActions?: boolean;
}

export const DigitalDonorCard: React.FC<DigitalDonorCardProps> = ({
  donorId,
  fullName,
  fatherName,
  guardianName,
  motherName,
  donorType = 'individual',
  organizationName,
  donorStatus = 'approved',
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

  const isOrganization = donorType === 'organization';

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(donorId);
    setCopiedId(true);
    if (onNotify) onNotify(`Donor ID ${donorId} copied.`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleOpenPrintModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-4" id={`digital-donor-card-${donorId}`}>
      {/* Interactive Controls Bar */}
      {showActions && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
              <Heart className="w-3 h-3 text-amber-700 fill-amber-700" />
              <span>OFFICIAL DONOR & PATRON CARD</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyId}
              className="p-1.5 px-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Copy Donor ID"
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
              onClick={handleOpenPrintModal}
              className="p-1.5 px-2.5 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-[11px] hidden sm:flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Print / Download Card"
            >
              <Printer className="w-3 h-3 text-amber-800" />
              <span>Print / Download</span>
            </button>
          </div>
        </div>
      )}

      {/* The Physical-Style Digital ID Card */}
      <FETIdentityCard
        category="donor"
        cardId={donorId}
        fullName={fullName}
        fatherName={fatherName}
        guardianName={guardianName}
        motherName={motherName}
        donorType={isOrganization ? 'organization' : 'individual'}
        organizationName={organizationName}
        roleTitle={isOrganization ? 'CORPORATE PATRON' : 'DISTINGUISHED DONOR'}
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
        idPrefix="dnr-card"
      />

      {/* Action CTA Bar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenVerification && onOpenVerification(donorId)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Verify Patron Credential</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPrintModal}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleOpenPrintModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Save / PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Print & Download Modal */}
      <IDCardPrintDownloadModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        category="donor"
        cardId={donorId}
        fullName={fullName}
        fatherName={fatherName}
        guardianName={guardianName}
        motherName={motherName}
        donorType={isOrganization ? 'organization' : 'individual'}
        organizationName={organizationName}
        roleTitle={isOrganization ? 'CORPORATE PATRON' : 'DISTINGUISHED DONOR'}
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
