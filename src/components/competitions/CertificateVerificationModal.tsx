/**
 * @license
 * Official FET India Digital Certificate & Document Public Verification Center
 * Fatimyah Educational Trust India
 * Regd. Public Trust • Bombay Public Trust Act 1950 (E-19842)
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Search, 
  QrCode, 
  Award, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  Building, 
  Calendar, 
  AlertTriangle,
  Sparkles,
  Lock,
  Download,
  Printer,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { useConfig } from '../../contexts/ConfigContext';
import { fetchPublicCertificateVerification } from '../../lib/firebase';
import { PublicCertificateRecord } from '../../types';

interface CertificateVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCertificateId?: string;
  onViewCertificateDetails?: (cert: PublicCertificateRecord) => void;
}

export const CertificateVerificationModal: React.FC<CertificateVerificationModalProps> = ({
  isOpen,
  onClose,
  initialCertificateId,
  onViewCertificateDetails
}) => {
  const { config } = useConfig();
  const [searchId, setSearchId] = useState(initialCertificateId || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicCertificateRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-search on open if initialCertificateId is provided
  useEffect(() => {
    if (isOpen) {
      const idToSearch = initialCertificateId || searchId;
      if (idToSearch && idToSearch.trim()) {
        setSearchId(idToSearch);
        handlePerformVerify(idToSearch);
      }
    }
  }, [isOpen, initialCertificateId]);

  if (!isOpen) return null;

  const handlePerformVerify = async (id: string) => {
    if (!id || !id.trim()) {
      setErrorMsg('Please enter a valid Certificate ID (e.g., FET-CERT-CMP-2026-0001 or FET-CERT-BK-2026-0101).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSearched(true);
    setResult(null);

    try {
      const cleanId = id.trim().toUpperCase();
      const certData = await fetchPublicCertificateVerification(cleanId);
      if (certData) {
        setResult(certData);
      } else {
        setResult(null);
      }
    } catch (err: any) {
      console.error('Certificate verification error:', err);
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

  const isRevoked = result?.status === 'revoked';
  const isExpired = result?.status === 'expired';
  const isValid = result && result.status === 'valid' && result.isVerified;

  const sampleIds = [
    'FET-CERT-CMP-2026-0001',
    'FET-CERT-BK-2026-0101',
    'FET-CERT-STEM-2026-0042',
    'FET-CERT-REVOKED-0099'
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      id="fet-cert-verification-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-verification-title"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-emerald-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="cert-verification-title" className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Public Certificate Verification Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ISO 9001:2015
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Official Credential Authentication • Fatimyah Educational Trust
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Search Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enter Certificate ID or Scan QR Code
            </label>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handlePerformVerify(searchId);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                  placeholder="e.g. FET-CERT-CMP-2026-0001"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-3 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 shrink-0"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Verify</span>
              </button>
            </form>

            {/* Quick Sample IDs */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Sample Test IDs:</span>
              {sampleIds.map((sid) => (
                <button
                  key={sid}
                  type="button"
                  onClick={() => {
                    setSearchId(sid);
                    handlePerformVerify(sid);
                  }}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                    sid.includes('REVOKED') 
                      ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200'
                  }`}
                >
                  {sid}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Result: VALID CERTIFICATE */}
          {searched && !loading && isValid && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-300 shadow-md space-y-5">
              
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-2xl shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                      Official Verification Status
                    </span>
                    <h4 className="text-base font-extrabold text-emerald-950">
                      Valid & Authenticated Academic Credential
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black rounded-full uppercase tracking-wider">
                    AUTHENTIC
                  </span>
                </div>
              </div>

              {/* Verified Certificate Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="p-3.5 bg-white/90 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recipient Candidate</span>
                  <p className="text-sm font-extrabold text-slate-900">{result.recipientName}</p>
                  {result.institution && (
                    <p className="text-[11px] text-slate-600 truncate">{result.institution}</p>
                  )}
                  {(result.district || result.state) && (
                    <p className="text-[10px] text-slate-400">{result.district}{result.district && result.state ? ', ' : ''}{result.state}</p>
                  )}
                </div>

                <div className="p-3.5 bg-white/90 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Competition / Program</span>
                  <p className="text-xs font-extrabold text-emerald-950 line-clamp-2">{result.competitionTitle}</p>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 uppercase">
                    {result.achievementTitle}
                  </span>
                </div>

                <div className="p-3.5 bg-white/90 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Merit Performance</span>
                  <div className="flex items-center gap-3">
                    {result.rank && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-black text-[11px]">
                        Rank #{result.rank}
                      </span>
                    )}
                    {result.score !== undefined && result.totalMarks !== undefined && (
                      <span className="font-bold text-slate-800">
                        {result.score} / {result.totalMarks} Marks
                      </span>
                    )}
                    {result.grade && (
                      <span className="font-bold text-emerald-700">
                        Grade {result.grade}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-white/90 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Issuing Authority</span>
                  <p className="font-bold text-slate-900">{result.trustName || 'Fatimyah Educational Trust'}</p>
                  <p className="text-[10px] text-slate-500">Issued On: {result.issueDate}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/60">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied' : 'Copy Verification Link'}</span>
                </button>

                {onViewCertificateDetails && (
                  <button
                    type="button"
                    onClick={() => onViewCertificateDetails(result)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>View Digital Certificate</span>
                  </button>
                )}
              </div>

            </div>
          )}

          {/* Search Result: REVOKED CERTIFICATE */}
          {searched && !loading && isRevoked && result && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-50 via-rose-100/50 to-white border-2 border-rose-400 shadow-md space-y-5">
              
              <div className="flex items-center gap-3 border-b border-rose-200 pb-4">
                <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-xs">
                  <XCircle className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-800">
                    Official Verification Warning
                  </span>
                  <h4 className="text-base font-extrabold text-rose-950">
                    Certificate Revoked / Cancelled by Examination Authority
                  </h4>
                </div>
              </div>

              <div className="p-4 bg-rose-500/10 border border-rose-300 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-rose-950">
                  Credential ID <code>{result.certificateId}</code> is no longer valid.
                </p>
                {result.revocationReason && (
                  <p className="text-rose-900">
                    <strong>Official Notice:</strong> {result.revocationReason}
                  </p>
                )}
                {result.revokedAt && (
                  <p className="text-[10px] text-rose-700">
                    Revocation Logged: {new Date(result.revokedAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              <div className="text-xs text-slate-600">
                <p><strong>Candidate:</strong> {result.recipientName}</p>
                <p><strong>Competition:</strong> {result.competitionTitle}</p>
              </div>

            </div>
          )}

          {/* Search Result: NOT FOUND */}
          {searched && !loading && !result && (
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                Certificate Record Not Found
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                No active or historical certificate was found for ID <strong className="font-mono text-slate-900 font-bold">{searchId}</strong>.
                Please ensure the Certificate ID is typed accurately, or contact the Central Examination Directorate.
              </p>
            </div>
          )}

          {/* Privacy & Trust Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-3">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Privacy-Guaranteed Public Verification:</strong>
              <p className="mt-0.5">
                This verification portal is designed to securely validate authentic Fatimyah Educational Trust credentials without exposing sensitive personal identifiable information (PII) such as personal phone numbers, emails, or government identification.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Fatimyah Educational Trust Central Directorate</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
