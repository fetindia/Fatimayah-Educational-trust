/**
 * @license
 * Official Donor QR Verification Modal & Public Portal
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
  Heart,
  Award, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  Building, 
  Calendar, 
  BadgeDollarSign,
  ShieldAlert,
  Sparkles,
  Lock
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { useConfig } from '../../contexts/ConfigContext';
import { fetchPublicDonorVerification } from '../../lib/firebase';
import { PublicDonorVerification } from '../../types';

interface DonorVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDonorId?: string;
}

export const DonorVerificationModal: React.FC<DonorVerificationModalProps> = ({
  isOpen,
  onClose,
  initialDonorId
}) => {
  const { config } = useConfig();
  const [searchId, setSearchId] = useState(initialDonorId || '');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PublicDonorVerification | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-search on open if initialDonorId is provided
  useEffect(() => {
    if (isOpen) {
      const idToSearch = initialDonorId || searchId;
      if (idToSearch && idToSearch.trim()) {
        setSearchId(idToSearch);
        handlePerformVerify(idToSearch);
      }
    }
  }, [isOpen, initialDonorId]);

  if (!isOpen) return null;

  const handlePerformVerify = async (id: string) => {
    if (!id || !id.trim()) {
      setErrorMsg('Please enter a valid Trust Donor ID (e.g. FET-DNR-2026-XXXX).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSearched(true);

    try {
      const cleanId = id.trim().toUpperCase();
      const result = await fetchPublicDonorVerification(cleanId);
      setVerificationResult(result);
    } catch (err: any) {
      console.error('Donor verification error:', err);
      setErrorMsg('An error occurred during donor verification lookup. Please try again.');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.origin;
    const verifyUrl = `${currentUrl}/#verify-donor?id=${searchId.trim().toUpperCase()}`;
    navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        id="donor-verification-modal"
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-7 relative border-b border-amber-500/20">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md">
              <FETLogo size="sm" showTagline={false} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  Trust Accreditation Portal
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Sec. 80G Certified</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1 leading-snug">
                Donor & Patron Credential Verification
              </h3>
              <p className="text-xs text-slate-300">
                Fatimyah Educational Trust • Official Non-Sensitive Public Ledger
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body & Search Field */}
        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto">
          {/* Search Box */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handlePerformVerify(searchId);
            }}
            className="space-y-2"
          >
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enter Trust Donor ID
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. FET-DNR-2026-0101"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchId.trim()}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Verify</span>
                  </>
                )}
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium mt-1">{errorMsg}</p>
            )}
          </form>

          {/* Verification Results Panel */}
          {searched && !loading && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {verificationResult && verificationResult.isVerified ? (
                /* VERIFIED DONOR CARD */
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4">
                  {/* Status Banner */}
                  <div className="flex items-start justify-between gap-3 border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          Official Verified Donor
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-0.5">
                          Accreditation Confirmed & Active
                        </h4>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border bg-amber-100 text-amber-950 border-amber-300 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-amber-700 fill-amber-700" />
                      <span>80G PATRON</span>
                    </span>
                  </div>

                  {/* Public Data Grid (STRICTLY NON-SENSITIVE) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Patron Legal Name
                      </span>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {verificationResult.fullName}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Trust Donor ID
                      </span>
                      <div className="text-sm font-mono font-black text-amber-700 mt-0.5">
                        {verificationResult.donorId}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Patron Classification
                      </span>
                      <div className="font-bold text-slate-800 capitalize mt-0.5">
                        {verificationResult.donorType || 'Individual Patron'}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Issuing Legal Entity
                      </span>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {verificationResult.trustName || 'Fatimyah Educational Trust'}
                      </div>
                    </div>
                  </div>

                  {/* Privacy & Safe Public Guarantee Notice */}
                  <div className="p-3 rounded-xl bg-white border border-slate-100 text-[11px] text-slate-600 flex items-start gap-2">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Protected Verification Record:</strong> In compliance with trust privacy statutes, confidential donation amounts, bank instruments, addresses, and internal notes are strictly encrypted and withheld from public verification scans.
                    </div>
                  </div>

                  {/* Shareable Verification Link */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <span className="text-slate-500 font-mono text-[10px] truncate max-w-[260px]">
                      Ledger Hash: {verificationResult.donorId}-VERIFIED-OK
                    </span>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedLink ? 'Link Copied' : 'Copy Verification URL'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* NOT FOUND / UNVERIFIED */
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-950">
                      Donor ID Not Recognized or Not Yet Approved
                    </h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                      No active accredited patron was found for the identifier <strong className="font-mono text-slate-900">{searchId}</strong>. If your application is currently under scrutiny, accreditation will activate immediately upon trustee approval.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Need assistance? Contact our secretariat at <a href="mailto:info@fetindia.com" className="text-amber-700 underline font-bold">info@fetindia.com</a>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[10px]">
            Reg No: {config.registrationNumber || 'E 9822'} ({config.registrationJurisdiction || 'Jammu & Kashmir'}){config.registrationAct ? ` • ${config.registrationAct}` : ''} • DARPAN: {config.nitiAayogId || 'JK/2026/1153821'} • PAN: {config.panNumber || 'AABTF0015H'} • Section 80G Certified
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
