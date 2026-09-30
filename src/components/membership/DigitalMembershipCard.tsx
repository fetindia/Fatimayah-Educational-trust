/**
 * @license
 * Official Digital Membership Card Component
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Public Brand: FET India
 * Regd. in Jammu & Kashmir through SDM Office (1994) • DARPAN: JK/2026/1153821 • PAN: AABTF0015H
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Crown, 
  Award, 
  Copy, 
  Check, 
  Printer, 
  Download, 
  RotateCw, 
  FileText
} from 'lucide-react';
import { FETIdentityCard } from '../idcard/FETIdentityCard';
import { IDCardPrintDownloadModal } from '../idcard/IDCardPrintDownloadModal';

export interface DigitalMembershipCardProps {
  memberId: string;
  fullName: string;
  fatherName?: string;
  guardianName?: string;
  motherName?: string;
  membershipType: 'general_member' | 'core_member' | string;
  membershipStatus?: 'general_member' | 'core_member' | 'active' | string;
  issueDate?: string;
  validUntil?: string;
  photoURL?: string;
  bloodGroup?: string;
  email?: string;
  district?: string;
  state?: string;
  country?: string;
  promotedAt?: string;
  promotedByEmail?: string;
  onOpenVerification?: (memberId: string) => void;
  onNotify?: (msg: string) => void;
  showActions?: boolean;
}

export const DigitalMembershipCard: React.FC<DigitalMembershipCardProps> = ({
  memberId,
  fullName,
  fatherName,
  guardianName,
  motherName,
  membershipType,
  membershipStatus,
  issueDate = '2026-01-01',
  validUntil = 'AY 2026-2027',
  photoURL,
  bloodGroup,
  email,
  district,
  state,
  country = 'India',
  promotedAt,
  promotedByEmail,
  onOpenVerification,
  onNotify,
  showActions = true
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const isCoreMember = 
    membershipType === 'core_member' || 
    membershipStatus === 'core_member' || 
    membershipType?.toLowerCase().includes('core');

  const category = isCoreMember ? 'core_member' : 'general_member';

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(memberId);
    setCopiedId(true);
    if (onNotify) onNotify(`Member ID ${memberId} copied.`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleOpenPrintModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-4" id={`digital-membership-card-${memberId}`}>
      {/* Interactive Controls Bar */}
      {showActions && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs ${
              isCoreMember 
                ? 'bg-rose-100 text-rose-950 border border-rose-300' 
                : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
            }`}>
              {isCoreMember ? <Crown className="w-3 h-3 text-rose-700" /> : <Award className="w-3 h-3 text-emerald-700" />}
              <span>{isCoreMember ? 'CORE MEMBER CARD' : 'GENERAL MEMBER CARD'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyId}
              className="p-1.5 px-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Copy Member ID"
            >
              {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-600" />}
              <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-1.5 px-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Flip Card to Back"
            >
              <RotateCw className="w-3 h-3 text-slate-600" />
              <span>{isFlipped ? 'Show Front' : 'Flip Card'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPrintModal}
              className="p-1.5 px-2.5 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] hidden sm:flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Print / Download Card"
            >
              <Printer className="w-3 h-3 text-emerald-700" />
              <span>Print / Download</span>
            </button>
          </div>
        </div>
      )}

      {/* The Physical-Style Digital ID Card */}
      <FETIdentityCard
        category={category}
        cardId={memberId}
        fullName={fullName}
        fatherName={fatherName}
        guardianName={guardianName}
        roleTitle={isCoreMember ? 'CORE COMMITTEE MEMBER' : 'GENERAL MEMBER'}
        issueDate={issueDate}
        validUntil={validUntil}
        photoURL={photoURL}
        bloodGroup={bloodGroup}
        district={district}
        state={state}
        country={country}
        email={email}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(!isFlipped)}
        onOpenVerification={onOpenVerification}
        idPrefix="mbr-card"
      />

      {/* Action CTA Bar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenVerification && onOpenVerification(memberId)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Launch QR Verification</span>
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
              className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
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
        category={category}
        cardId={memberId}
        fullName={fullName}
        fatherName={fatherName}
        guardianName={guardianName}
        roleTitle={isCoreMember ? 'CORE COMMITTEE MEMBER' : 'GENERAL MEMBER'}
        issueDate={issueDate}
        validUntil={validUntil}
        photoURL={photoURL}
        bloodGroup={bloodGroup}
        district={district}
        state={state}
        country={country}
        email={email}
        onOpenVerification={onOpenVerification}
        onNotify={onNotify}
      />
    </div>
  );
};
