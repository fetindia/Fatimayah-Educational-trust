/**
 * @license
 * Official Membership QR Verification Modal & Public Portal
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Regd. in Jammu & Kashmir through SDM Office (1994) • DARPAN: JK/2026/1153821 • PAN: AABTF0015H
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Search, 
  QrCode, 
  Crown, 
  Award, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  Building, 
  Calendar, 
  UserCheck, 
  ShieldAlert,
  Sparkles,
  Lock
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { useConfig } from '../../contexts/ConfigContext';
import { 
  fetchPublicMembershipVerification, 
  fetchPublicDonorVerification,
  fetchPublicVolunteerVerification,
  fetchPublicCertificateVerification
} from '../../lib/firebase';
import { 
  PublicMembershipVerification, 
  PublicDonorVerification,
  PublicVolunteerVerification,
  PublicCertificateRecord
} from '../../types';

interface MembershipVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId?: string;
}

export const MembershipVerificationModal: React.FC<MembershipVerificationModalProps> = ({
  isOpen,
  onClose,
  initialMemberId
}) => {
  const { config } = useConfig();
  const [searchId, setSearchId] = useState(initialMemberId || '');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PublicMembershipVerification | null>(null);
  const [donorResult, setDonorResult] = useState<PublicDonorVerification | null>(null);
  const [volunteerResult, setVolunteerResult] = useState<PublicVolunteerVerification | null>(null);
  const [certResult, setCertResult] = useState<PublicCertificateRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-search on open if initialMemberId is provided
  useEffect(() => {
    if (isOpen) {
      const idToSearch = initialMemberId || searchId;
      if (idToSearch && idToSearch.trim()) {
        setSearchId(idToSearch);
        handlePerformVerify(idToSearch);
      }
    }
  }, [isOpen, initialMemberId]);

  if (!isOpen) return null;

  const handlePerformVerify = async (id: string) => {
    if (!id || !id.trim()) {
      setErrorMsg('Please enter a valid Trust ID (e.g. FET-MB-2025-XXXX, FET-CERT-CMP-2026-XXXX, or FET-DR-2025-XXXX).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSearched(true);
    setVerificationResult(null);
    setDonorResult(null);
    setVolunteerResult(null);
    setCertResult(null);

    try {
      const cleanId = id.trim().toUpperCase();

      if (cleanId.startsWith('FET-CERT')) {
        const cResult = await fetchPublicCertificateVerification(cleanId);
        if (cResult) {
          setCertResult(cResult);
          return;
        }
      }
      
      if (cleanId.startsWith('FET-DR') || cleanId.startsWith('FET-DNR')) {
        const dResult = await fetchPublicDonorVerification(cleanId);
        if (dResult) {
          setDonorResult(dResult);
          return;
        }
      }

      if (cleanId.startsWith('FET-VOL')) {
        const vResult = await fetchPublicVolunteerVerification(cleanId);
        if (vResult) {
          setVolunteerResult(vResult);
          return;
        }
      }

      const result = await fetchPublicMembershipVerification(cleanId);
      if (result) {
        setVerificationResult(result);
        return;
      }

      // Fallback checks across all categories
      const cResult = await fetchPublicCertificateVerification(cleanId);
      if (cResult) {
        setCertResult(cResult);
        return;
      }

      const vResult = await fetchPublicVolunteerVerification(cleanId);
      if (vResult) {
        setVolunteerResult(vResult);
        return;
      }

      const dResult = await fetchPublicDonorVerification(cleanId);
      if (dResult) {
        setDonorResult(dResult);
        return;
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMsg('An error occurred during verification lookup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.origin;
    const verifyUrl = `${currentUrl}/#verify?id=${searchId.trim().toUpperCase()}`;
    navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isCoreMember = 
    verificationResult?.membershipType === 'core_member' || 
    verificationResult?.membershipStatus === 'core_member' ||
    verificationResult?.membershipType?.toLowerCase().includes('core');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200" id="membership-verification-modal">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white p-5 sm:p-6 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
                <FETLogo size="sm" showTagline={false} />
              </div>
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400 block">
                  Trust Accreditation Portal
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Official Membership Verification
                </h3>
                <p className="text-[10px] text-slate-300">
                  {config.legalName} • Public Registry Verification
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Verification Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Lookup Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handlePerformVerify(searchId);
            }} 
            className="mt-4 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Member ID (e.g. FET-MBR-2026-8492)"
                className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-colors shrink-0 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{loading ? 'Verifying...' : 'Verify'}</span>
            </button>
          </form>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Privacy Protection Banner */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>
              <strong>Privacy Protection:</strong> Public QR verification displays only official accreditation validity without exposing private contact info.
            </span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Verification Result: SUCCESS */}
          {searched && !loading && verificationResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Trust Status Seal Card */}
              <div className={`rounded-2xl p-4 sm:p-5 border text-center relative overflow-hidden ${
                isCoreMember
                  ? 'bg-amber-50/80 border-amber-300'
                  : 'bg-emerald-50/80 border-emerald-300'
              }`}>
                <div className="flex justify-center mb-2">
                  <span className={`p-3 rounded-full shadow-md flex items-center justify-center ${
                    isCoreMember ? 'bg-amber-400 text-slate-950' : 'bg-emerald-600 text-white'
                  }`}>
                    {isCoreMember ? <Crown className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                  </span>
                </div>

                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isCoreMember ? 'bg-amber-200 text-amber-950' : 'bg-emerald-200 text-emerald-950'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  AUTHENTIC & ACTIVE ACCREDITATION
                </span>

                <h4 className="text-lg font-black text-slate-900 mt-2">
                  {verificationResult.fullName}
                </h4>

                <div className="inline-block mt-1 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Accredited Member ID</span>
                  <span className="font-mono font-black text-amber-600 text-sm tracking-tight">
                    {verificationResult.memberId}
                  </span>
                </div>
              </div>

              {/* Verified Record Details Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Accreditation Tier:</span>
                  <span className={`font-black flex items-center gap-1 ${
                    isCoreMember ? 'text-amber-700' : 'text-emerald-800'
                  }`}>
                    {isCoreMember && <Crown className="w-3.5 h-3.5 text-amber-600" />}
                    {isCoreMember ? 'CORE MEMBER (Governance Tier)' : 'GENERAL MEMBER'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Membership Status:</span>
                  <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Active
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Validity Cycle:</span>
                  <span className="font-bold text-slate-800">
                    {verificationResult.validUntil || 'AY 2026-2027'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Issue / Approval Date:</span>
                  <span className="font-bold text-slate-800">
                    {verificationResult.issueDate || (verificationResult.approvedAt ? new Date(verificationResult.approvedAt).toLocaleDateString('en-IN') : 'Jan 2026')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Accredited By:</span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    {config.legalName}
                  </span>
                </div>
              </div>

              {/* Copy Direct Verification Link */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  <span>{copiedLink ? 'Verification URL Copied!' : 'Copy Permanent Verification Link'}</span>
                </button>
              </div>

            </div>
          )}

          {/* Verification Result: DONOR SUCCESS */}
          {searched && !loading && donorResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Trust Status Seal Card */}
              <div className="rounded-2xl p-4 sm:p-5 border text-center relative overflow-hidden bg-amber-50/90 border-amber-300">
                <div className="flex justify-center mb-2">
                  <span className="p-3 rounded-full shadow-md flex items-center justify-center bg-amber-400 text-slate-950">
                    <Award className="w-6 h-6" />
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-200 text-amber-950">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  AUTHENTIC & CERTIFIED PATRON
                </span>

                <h4 className="text-lg font-black text-slate-900 mt-2">
                  {donorResult.fullName}
                </h4>

                <div className="inline-block mt-1 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Accredited Donor ID</span>
                  <span className="font-mono font-black text-amber-700 text-sm tracking-tight">
                    {donorResult.donorId}
                  </span>
                </div>
              </div>

              {/* Verified Record Details Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Patron Classification:</span>
                  <span className="font-black text-amber-900 capitalize">
                    {donorResult.donorType || 'Individual Patron'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Patron Status:</span>
                  <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Official Verified Donor
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Tax Compliance:</span>
                  <span className="font-bold text-slate-800">
                    Section 80G Certified
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Issue Date:</span>
                  <span className="font-bold text-slate-800">
                    {donorResult.issueDate || 'Jan 2026'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Accredited By:</span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    {donorResult.trustName || config.legalName}
                  </span>
                </div>
              </div>

              {/* Copy Direct Verification Link */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  <span>{copiedLink ? 'Verification URL Copied!' : 'Copy Permanent Verification Link'}</span>
                </button>
              </div>

            </div>
          )}

          {/* Verification Result: VOLUNTEER SUCCESS */}
          {searched && !loading && volunteerResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Trust Status Seal Card */}
              <div className="rounded-2xl p-4 sm:p-5 border text-center relative overflow-hidden bg-sky-50/90 border-sky-300">
                <div className="flex justify-center mb-2">
                  <span className="p-3 rounded-full shadow-md flex items-center justify-center bg-sky-600 text-white">
                    <Award className="w-6 h-6" />
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-200 text-sky-950">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  OFFICIAL ACCREDITED VOLUNTEER
                </span>

                <h4 className="text-lg font-black text-slate-900 mt-2">
                  {volunteerResult.fullName}
                </h4>

                <div className="inline-block mt-1 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Volunteer Accreditation ID</span>
                  <span className="font-mono font-black text-sky-700 text-sm tracking-tight">
                    {volunteerResult.volunteerId}
                  </span>
                </div>
              </div>

              {/* Verified Record Details Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Assigned Role:</span>
                  <span className="font-black text-sky-900 uppercase">
                    {volunteerResult.volunteerRole || 'Education Volunteer'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Volunteer Wing:</span>
                  <span className="font-bold text-slate-800">
                    {volunteerResult.volunteerWing || 'Community & Education Wing'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Status:</span>
                  <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Active Volunteer
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">Validity:</span>
                  <span className="font-bold text-slate-800">
                    {volunteerResult.validUntil || 'AY 2026-2027'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Accredited By:</span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    {volunteerResult.trustName || config.legalName}
                  </span>
                </div>
              </div>

              {/* Copy Direct Verification Link */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
                  <span>{copiedLink ? 'Verification URL Copied!' : 'Copy Permanent Verification Link'}</span>
                </button>
              </div>

            </div>
          )}

          {/* Verification Result: COMPETITION / ACADEMIC CERTIFICATE */}
          {searched && !loading && certResult && (
            <div className={`p-6 rounded-3xl border-2 space-y-4 ${
              certResult.status === 'revoked'
                ? 'bg-rose-50 border-rose-300'
                : 'bg-emerald-50 border-emerald-300'
            }`}>
              
              <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                <div className="flex items-center gap-2.5">
                  {certResult.status === 'revoked' ? (
                    <div className="p-2 bg-rose-600 text-white rounded-xl">
                      <XCircle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-600 text-white rounded-xl">
                      <Award className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      FET Academic Certificate
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {certResult.status === 'revoked' ? 'Credential Revoked' : 'Authentic Trust Certificate'}
                    </h4>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  certResult.status === 'revoked'
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {certResult.status === 'revoked' ? 'REVOKED' : 'AUTHENTIC'}
                </span>
              </div>

              <div className="space-y-2 text-xs bg-white/80 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-bold">Certificate ID:</span>
                  <span className="font-mono font-black text-slate-900">{certResult.certificateId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-bold">Recipient:</span>
                  <span className="font-bold text-slate-900">{certResult.recipientName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-bold">Competition:</span>
                  <span className="font-bold text-emerald-950 text-right max-w-[200px] truncate">{certResult.competitionTitle}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-bold">Distinction:</span>
                  <span className="font-bold text-amber-800">{certResult.achievementTitle}</span>
                </div>
                {certResult.score !== undefined && (
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-bold">Score Secured:</span>
                    <span className="font-black text-slate-900">{certResult.score} / {certResult.totalMarks || 100}</span>
                  </div>
                )}
                {certResult.institution && (
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-bold">Institution:</span>
                    <span className="font-bold text-slate-700 text-right max-w-[200px] truncate">{certResult.institution}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Issue Date:</span>
                  <span className="font-bold text-slate-700">{certResult.issueDate}</span>
                </div>

                {certResult.status === 'revoked' && certResult.revocationReason && (
                  <div className="mt-2 p-2 rounded-xl bg-rose-100 text-rose-900 font-medium text-[11px] border border-rose-200">
                    <strong>Revocation Reason:</strong> {certResult.revocationReason}
                  </div>
                )}
              </div>

              {/* Copy Direct Verification Link */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
                  <span>{copiedLink ? 'Verification URL Copied!' : 'Copy Permanent Verification Link'}</span>
                </button>
              </div>

            </div>
          )}

          {/* Verification Result: NOT FOUND */}
          {searched && !loading && !verificationResult && !donorResult && !volunteerResult && !certResult && !errorMsg && (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7" />
              </div>
              <h4 className="font-black text-slate-900 text-sm">
                No Verified Credential Found
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                The ID <strong className="font-mono font-bold text-slate-900">{searchId}</strong> does not match any accredited Member or Donor in the official FET India registry.
              </p>
              <p className="text-[11px] text-slate-500">
                Please verify the ID on the physical or digital card and re-enter.
              </p>
            </div>
          )}

          {/* Initial State / Instructions */}
          {!searched && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <QrCode className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-xs">
                Scan or Enter Member ID to Verify
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Enter any official FET India Member ID above to inspect verified accreditation records, issue validity, and governance tier.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span>{config.legalName || 'FATIMYAH EDUCATIONAL TRUST'} • Reg No: {config.registrationNumber || 'E 9822'} ({config.registrationJurisdiction || 'Jammu & Kashmir'}){config.registrationAct ? ` • ${config.registrationAct}` : ''} • Section 80G Certified</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
