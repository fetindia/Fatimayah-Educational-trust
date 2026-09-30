/**
 * @license
 * Legal Terms of Trust and Privacy Policy Document Modal
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: FATIMYAH EDUCATIONAL TRUST
 * Established 1994 • Registered in Jammu & Kashmir through SDM Office (1994)
 * Section 80G & 12A Certified • NITI Aayog NGO Darpan
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  X, 
  Download, 
  Printer, 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronRight,
  Search
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

export type LegalTab = 'terms' | 'privacy';

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms'
}) => {
  const { config } = useConfig();
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 print:p-0 print:bg-white animate-in fade-in duration-200"
      id="legal-document-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 border border-white/20"
              style={{ backgroundColor: primaryGreen }}
            >
              <Scale className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="legal-modal-title" className="text-base sm:text-lg font-black tracking-tight text-white">
                  Institutional Governance & Legal Policies
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Official 2026 Edition
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {config.legalName} • Public Trust Reg: {config.registrationNumber || 'E 9822'} ({config.registrationJurisdiction || 'Jammu & Kashmir'}){config.registrationAct ? ` • ${config.registrationAct}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Dialog"
              aria-label="Close legal modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection Bar & Search */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'terms'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Terms of Trust & Regulations</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'privacy'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Lock className="w-4 h-4 text-amber-300" />
              <span>Privacy Policy & Data Charter</span>
            </button>
          </div>

          {/* Institutional Trust Seal Badge */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>80G(5)(vi) • 12A • Rule 18AB Compliant</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          
          {/* ========================================================= */}
          {/* TAB 1: TERMS OF TRUST & REGULATIONS                       */}
          {/* ========================================================= */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Preamble Callout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-900">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>Institutional Constitution & Legal Status</span>
                </div>
                <p className="text-xs text-emerald-900/90 leading-relaxed">
                  These Terms of Trust and Platform Regulations govern access to and use of the official digital ecosystem of <strong>{config.legalName}</strong> (publicly brand marked as <strong>FET India</strong>), accessible via FETIndia.com, official mobile and Android applications, and related subdomains. By accessing this platform, creating a member/student profile, contributing charitable donations, or participating in examinations, you acknowledge and agree to be bound by these statutory regulations.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-emerald-800">
                  <span>Establishment: 1994</span>
                  <span>•</span>
                  <span>Public Trust Reg: {config.registrationNumber || 'E 9822'} ({config.registrationJurisdiction || 'Jammu & Kashmir'}){config.registrationAct ? ` • ${config.registrationAct}` : ''}</span>
                  <span>•</span>
                  <span>Section 80G Order: Unique Reg. Act 80G(5)(vi)</span>
                </div>
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                  <span>Eligibility and Digital Identity</span>
                </h3>
                <p>
                  1.1. The platform is open to students, educational beneficiaries, verified members, institutional volunteers, donors, and administrative personnel who subscribe to the mission of community upliftment through education and ethical social service.
                </p>
                <p>
                  1.2. Users are strictly prohibited from impersonating any person or institution, using disposable credentials, or providing fraudulent academic or identity documents.
                </p>
                <p>
                  1.3. The Trust reserves the discretionary authority to issue, verify, suspend, or revoke digital credentials, digital member identification cards, and examination access tokens at any time for infractions of institutional conduct.
                </p>
              </div>

              {/* Section 2: Financial Contributions, 80G & Crowdfunding */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                  <span>Financial Contributions, Crowdfunding Relief & 80G Tax Exemption</span>
                </h3>
                <p>
                  2.1. <strong>Nature of Contributions:</strong> All monetary payments made to FET India—including General Trust Fund contributions, Higher Education Scholarship donations, Medical Relief disbursements, and Crowdfunding pledges—are voluntary, irrevocable, non-refundable charitable donations made in furtherance of public charitable objectives.
                </p>
                <p>
                  2.2. <strong>Section 80G Tax Exemption:</strong> Donations qualify for 50% deduction under Section 80G(5)(vi) of the Indian Income Tax Act, 1961. In compliance with Central Board of Direct Taxes (CBDT) Rule 18AB, donors must submit their valid Permanent Account Number (PAN) at the time of contribution. FET India files annual statutory returns in Form 10BD with the Income Tax Department and generates official Form 10BE tax credit certificates.
                </p>
                <p>
                  2.3. <strong>Zakat & Sadaqah Integrity:</strong> Contributions designated specifically for Zakat or Sadaqah funds are ring-fenced with 100% direct allocation to verified Shariah-eligible recipients with zero deduction for administrative overheads.
                </p>
                <p>
                  2.4. <strong>Payment Channels & Gateway Architecture:</strong> Donations may be transmitted via the official FET India UPI handle (<span className="font-mono font-bold text-slate-900">{config.bankDetails.upiId}</span>), direct National Electronic Funds Transfer (NEFT/RTGS), or integrated secure payment gateways. The Trust Secretariat does not store debit card CVVs or bank PINs.
                </p>
              </div>

              {/* Section 3: Examinations & Academic Integrity */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</span>
                  <span>Online Examinations, Competitions & Proctoring Code</span>
                </h3>
                <p>
                  3.1. <strong>Academic Honor Code:</strong> Candidates undertaking FET India talent search tests, scholarship aptitude assessments, or competitive quizzes agree to complete all evaluations with uncompromised integrity, without assistance from secondary devices, books, or third parties.
                </p>
                <p>
                  3.2. <strong>Browser Telemetry & Proctoring:</strong> The testing interface incorporates automated telemetry to detect window minimization, tab switching, and fullscreen departures. Accumulated violations trigger automated penalties, flag reports for administrative review, or cause disqualification.
                </p>
                <p>
                  3.3. <strong>Single Attempt Policy:</strong> Each candidate is entitled to exactly one submission per official examination window. The decision of the Examination Board regarding marks, percentiles, scholarship rankings, and merit awards is final.
                </p>
              </div>

              {/* Section 4: Membership Verification & Credentials */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">4</span>
                  <span>Membership Privileges & Digital Credentials</span>
                </h3>
                <p>
                  4.1. Official FET India Membership (Associate, Life, or Patron) is granted upon formal submission and vetting by the Trust Secretariat.
                </p>
                <p>
                  4.2. Each verified member receives a unique Member Identification Code (e.g. <span className="font-mono font-bold text-slate-900">FET-2026-XXXX</span>) and a cryptographically verifiable QR code. This credential is strictly personal and non-transferable.
                </p>
                <p>
                  4.3. Digital credentials may be displayed for institutional representation, voluntary service verification, and general assembly participation, but do not confer legal ownership or voting shares in the Trust's statutory assets.
                </p>
              </div>

              {/* Section 5: Intellectual Property */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">5</span>
                  <span>Intellectual Property & Content Ownership</span>
                </h3>
                <p>
                  5.1. All trademarks, service marks, logo designs (comprising the Islamic Green, Heritage Navy, and Sun Amber palette), question repositories, curricula, and institutional publications are the exclusive intellectual property of Fatimyah Educational Trust.
                </p>
                <p>
                  5.2. Study materials and past papers provided on the platform may be downloaded solely for non-commercial personal study.
                </p>
              </div>

              {/* Section 6: Jurisdiction & Dispute Resolution */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">6</span>
                  <span>Jurisdiction & Governing Law</span>
                </h3>
                <p>
                  6.1. These Terms and any disputes arising out of the use of the FET India platform shall be governed by and construed in accordance with the laws of India.
                </p>
                <p>
                  6.2. The competent courts having jurisdiction over <strong>Jammu & Kashmir, India</strong> shall have exclusive jurisdiction over all claims, suits, or proceedings relating to this Trust and its digital systems.
                </p>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PRIVACY POLICY & DATA CHARTER                      */}
          {/* ========================================================= */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Privacy Preamble Callout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-sky-900">
                  <Lock className="w-4 h-4 text-sky-700" />
                  <span>Commitment to Data Dignity & Transparency</span>
                </div>
                <p className="text-xs text-sky-900/90 leading-relaxed">
                  <strong>{config.legalName}</strong> is dedicated to safeguarding the digital privacy of students, donors, volunteers, and verified members. This Privacy Policy sets forth our rigorous standards for data collection, processing, security, and statutory retention under the Information Technology Act, 2000, the Digital Personal Data Protection (DPDP) Act, 2023, and Income Tax Rule 18AB.
                </p>
              </div>

              {/* Section 1: Categories of Information Collected */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                  <span>Categories of Information We Collect</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block">A. Account & Profile Data</strong>
                    <p className="text-slate-600">
                      Full legal name, email address, contact telephone number, postal city and state, institutional affiliation, and profile photo for digital ID cards.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block">B. Donation & Tax Credit Data</strong>
                    <p className="text-slate-600">
                      Donation amount, fund allocation, transaction reference ID, bank payment mode, and Permanent Account Number (PAN) required for Form 10BE tax exemptions.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block">C. Academic & Examination Telemetry</strong>
                    <p className="text-slate-600">
                      Assessment responses, submission timestamps, marks awarded, merit ranks, and proctoring window-focus metrics during live tests.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block">D. Device & Application Logs</strong>
                    <p className="text-slate-600">
                      Browser type, operating system (Web/Android), Firebase Cloud Messaging (FCM) push notification tokens, and security audit logs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Lawful Basis & Usage */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                  <span>How We Use Your Information</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                  <li>To authenticate access to user dashboards, student examination portals, and administrative consoles.</li>
                  <li>To file statutory returns with the Income Tax Department under Section 80G and generate downloadable Form 10BE tax exemption certificates.</li>
                  <li>To disburse higher education scholarships, evaluate financial hardship criteria, and verify educational enrollment.</li>
                  <li>To dispatch important platform announcements, admit cards, exam schedules, and donation receipts via email or push notifications.</li>
                  <li>To maintain tamper-proof audit trails ensuring accountability and institutional governance.</li>
                </ul>
              </div>

              {/* Section 3: Financial Privacy & Gateway Disclosures */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</span>
                  <span>Financial Data Protection & Gateway Standards</span>
                </h3>
                <p>
                  3.1. <strong>Zero Card Storage:</strong> FET India does NOT collect, capture, or store payment card numbers, CVVs, expiration dates, or net-banking credentials on our servers.
                </p>
                <p>
                  3.2. <strong>Direct Banking & UPI:</strong> All electronic transactions utilize direct UPI deep linking (NPCI standard) or RBI-licensed payment gateways. Only the confirmation transaction ID and bank timestamp are recorded for accounting and reconciliation.
                </p>
              </div>

              {/* Section 4: Third-Party Infrastructure */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">4</span>
                  <span>Third-Party Cloud Infrastructure</span>
                </h3>
                <p>
                  Our digital systems are hosted on enterprise Google Cloud Platform (GCP) infrastructure utilizing Firebase Authentication, Firestore distributed database, and Cloud Storage. All communications are encrypted end-to-end using TLS 1.3 in transit and AES-256 at rest.
                </p>
              </div>

              {/* Section 5: Data Retention & Statutory Timelines */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">5</span>
                  <span>Data Retention & User Rights</span>
                </h3>
                <p>
                  5.1. <strong>Statutory Financial Records:</strong> Donation records, PAN details, and 80G filings are retained for a minimum of 7 years in accordance with Section 139 of the Income Tax Act.
                </p>
                <p>
                  5.2. <strong>Academic Records:</strong> Examination results and digital certificates are retained permanently to facilitate future verification by employers, colleges, and scholarship committees.
                </p>
                <p>
                  5.3. <strong>User Rights:</strong> You possess the right to inspect your stored personal data, correct inaccurate details via your dashboard, download your historical receipts, or request profile deactivation by contacting the Secretariat.
                </p>
              </div>

              {/* Section 6: Grievance Officer */}
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">6</span>
                  <span>Grievance Officer & Secretariat Contact</span>
                </h3>
                <p>
                  For inquiries regarding personal data privacy, correction of PAN records, or revocation of communications:
                </p>
                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs space-y-1">
                  <p><strong>Trust Secretariat Data Protection Cell:</strong> {config.legalName}</p>
                  <p><strong>Official Email:</strong> {config.contactEmail || 'contact@fetindia.com'}</p>
                  <p><strong>Official Telephone:</strong> {config.contactPhone || '+91 91494 14549'}</p>
                  <p><strong>Principal Address:</strong> {config.headOfficeAddress || 'FET House, Seminary Road, Jammu & Kashmir 194103, India'}</p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Document Revision: Version 2026.4 • Enacted by Board of Trustees</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
            >
              I Understand & Agree
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
