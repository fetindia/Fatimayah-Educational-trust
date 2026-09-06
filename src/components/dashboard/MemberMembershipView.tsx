/**
 * @license
 * Member Membership View & Digital ID Card
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Tagline: Education • Service • Empowerment
 */

import React, { useState } from 'react';
import { 
  CreditCard, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  Sparkles, 
  Calendar, 
  Building, 
  Award, 
  UserCheck, 
  Copy, 
  Check, 
  ExternalLink,
  BookOpen,
  Vote,
  FileCheck,
  AlertCircle,
  Clock,
  ChevronRight,
  User,
  Crown,
  Lock,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { FETLogo } from '../common/FETLogo';
import { ADMIN_ROLE_DEFINITIONS } from '../../data/initialData';
import { MembershipApplicationForm } from './MembershipApplicationForm';
import { DigitalMembershipCard } from '../membership/DigitalMembershipCard';
import { MembershipVerificationModal } from '../membership/MembershipVerificationModal';

interface MemberMembershipViewProps {
  onNotify?: (message: string) => void;
  onOpenProfile?: () => void;
}

export const MemberMembershipView: React.FC<MemberMembershipViewProps> = ({ 
  onNotify,
  onOpenProfile 
}) => {
  const { currentUser, userProfile, activeRole } = useAuth();
  const { config } = useConfig();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const membershipStatus = userProfile?.membershipStatus || 'none';
  const isCoreMember = 
    membershipStatus === 'core_member' || 
    userProfile?.role === 'core_member' || 
    userProfile?.roles?.includes('core_member');

  const isApprovedMember = 
    membershipStatus === 'general_member' || 
    isCoreMember ||
    userProfile?.role === 'super_admin' || 
    userProfile?.role === 'administrator' || 
    userProfile?.roles?.includes('member');

  const fullName = userProfile?.fullLegalName || userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || 'Registered User';
  const memberId = userProfile?.membershipId || `FET-MBR-${new Date().getFullYear()}-${currentUser?.uid ? currentUser.uid.slice(0, 4).toUpperCase() : '8492'}`;
  const isVerified = currentUser?.emailVerified || userProfile?.emailVerified || false;
  const validityPeriod = userProfile?.membershipValidUntil || 'AY 2026-2027';

  // If user is not yet an approved member and has requested application form or is in pending/under_review state
  if (!isApprovedMember && (showApplicationForm || membershipStatus === 'pending' || membershipStatus === 'under_review' || membershipStatus === 'rejected')) {
    return (
      <div className="space-y-6" id="member-membership-application-container">
        <MembershipApplicationForm
          onClose={() => setShowApplicationForm(false)}
          onSuccess={(msg) => {
            if (onNotify) onNotify(msg);
          }}
        />
      </div>
    );
  }

  // If user is a Registered User (no membership application yet)
  if (!isApprovedMember) {
    return (
      <div className="space-y-6" id="registered-user-membership-overview">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  <User className="w-5 h-5" />
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Trust Membership Accreditation
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                You are currently signed in as a <strong className="text-slate-800">Registered User</strong>. Apply for official General Membership to obtain your accredited Digital ID and voting rights.
              </p>
            </div>

            <button
              onClick={() => setShowApplicationForm(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-center"
            >
              <CreditCard className="w-4 h-4 text-amber-300" />
              <span>Apply for General Membership</span>
            </button>
          </div>

          {/* User Status Bar */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Account Tier</span>
              <div className="font-extrabold text-slate-900 mt-0.5">Registered User</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Email Verification</span>
              <div className={`font-bold mt-0.5 flex items-center gap-1 ${isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {isVerified ? 'Verified' : 'Pending Verification'}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Membership Status</span>
              <div className="font-extrabold text-slate-600 mt-0.5">Not Applied Yet</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Governance Rights</span>
              <div className="font-extrabold text-slate-500 mt-0.5">Requires Membership</div>
            </div>
          </div>
        </div>

        {/* Benefits Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registered User Features */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600" />
                Current Registered User Access
              </h3>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Active Tier
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">Digital Portal Access</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Log in, manage personal contact profile, and configure security preferences.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">Volunteer & Donor Pathways</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Submit volunteer service and donor patronage applications independently.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">Public Trust Updates & Bulletins</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Receive announcements on community events, webinars, and public initiatives.</p>
                </div>
              </div>
            </div>
          </div>

          {/* General Member Privileges (Upon Approval) */}
          <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                Accredited General Member Privileges
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Upon Approval
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">Official Digital ID Card & Trust ID</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Verified digital credential with secure QR code and permanent trust serial code.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
                <Vote className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">Trust Assembly Voting Rights</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Participation in annual convocations, governance consultations, and council elections.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
                <FileCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">Priority Scholarship & Grant Access</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Expedited evaluation for higher education grants and financial welfare assistance.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowApplicationForm(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Complete General Membership Application</span>
                <ChevronRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full Approved Member View
  return (
    <div className="space-y-6" id="member-membership-section">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <CreditCard className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                My Trust Membership & Digital ID
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Official membership credentials, trust accreditation, and affiliated member benefits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Verify Credential QR</span>
            </button>
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>View Full Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Member Quick Summary Stats */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Membership Tier</span>
            <div className={`font-black mt-0.5 flex items-center gap-1 ${isCoreMember ? 'text-amber-700' : 'text-slate-900'}`}>
              {isCoreMember && <Crown className="w-3.5 h-3.5 text-amber-600" />}
              {isCoreMember ? 'Core Member' : 'General Member'}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Permanent Member ID</span>
            <div className="font-mono font-bold text-amber-600 truncate mt-0.5" title={memberId}>
              {memberId}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Validity Cycle</span>
            <div className="font-extrabold text-slate-900 mt-0.5">{validityPeriod}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Accreditation Status</span>
            <div className="font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Active
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Digital ID Card Preview & Membership Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Realistic Digital Membership Card (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Accredited Digital Membership Card
            </h3>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              ● Official Credential
            </span>
          </div>

          {/* Dedicated Component */}
          <DigitalMembershipCard
            memberId={memberId}
            fullName={fullName}
            fatherName={userProfile?.fatherName}
            guardianName={userProfile?.guardianName}
            motherName={userProfile?.motherName}
            bloodGroup={userProfile?.bloodGroup}
            email={userProfile?.email || currentUser?.email || ''}
            membershipType={isCoreMember ? 'core_member' : 'general_member'}
            membershipStatus={isCoreMember ? 'core_member' : 'general_member'}
            issueDate={userProfile?.membershipIssueDate || userProfile?.membershipApprovedAt || userProfile?.createdAt || '2026-01-01'}
            validUntil={validityPeriod}
            photoURL={userProfile?.photoURL}
            district={userProfile?.district || userProfile?.city}
            state={userProfile?.state}
            country={userProfile?.country}
            onOpenVerification={() => setIsVerificationModalOpen(true)}
            onNotify={onNotify}
            showActions={true}
          />

          {/* Official Core Appointment Details (If user is a Core Member) */}
          {isCoreMember && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-900">
                <Crown className="w-4 h-4 text-amber-700" />
                <span>Official Core Member Committee Appointment Record</span>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                You have been formally promoted to the Core Member Committee by the Trust Secretariat. This grants high-level governance advisement, strategic leadership participation, and regional chapter coordination.
              </p>
              {userProfile?.promotedAt && (
                <div className="pt-1.5 border-t border-amber-200/80 text-[10px] text-amber-800 grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-bold block">Appointment Date:</span>
                    <span>{new Date(userProfile.promotedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {userProfile.promotedByEmail && (
                    <div>
                      <span className="font-bold block">Authorized By:</span>
                      <span className="truncate block font-mono">{userProfile.promotedByEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Member Privileges & Statutory Rights (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                Accredited Member Entitlements & Privileges
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Active Tier
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <Vote className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">General Assembly Voting & Resolution Rights</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Participate in annual trust convocations, vote on statutory agenda items, and nominate council delegates.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <QrCode className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">Live Cryptographic QR Verification</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Present your digital card at partner schools, hospitals, and convocation centers with instant verification.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">Education Grants & Welfare Sponsorship</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Priority recommendation for community student scholarships, emergency medical funds, and skill development programs.
                  </p>
                </div>
              </div>

              {isCoreMember && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                  <Crown className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-950">Core Committee Leadership Authority</h4>
                    <p className="text-[11px] text-amber-900/90 mt-0.5">
                      Direct consultation with the Board of Trustees, chapter leadership roles, and strategic resource allocation.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Section 80G & 12A Certified Foundation</span>
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer flex items-center gap-1"
                >
                  <span>Edit Profile Coordinates</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Verification Modal */}
      <MembershipVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        initialMemberId={memberId}
      />

    </div>
  );
};
