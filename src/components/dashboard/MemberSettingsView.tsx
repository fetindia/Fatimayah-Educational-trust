/**
 * @license
 * Member Account Settings & Security View
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState } from 'react';
import { 
  Settings, 
  KeyRound, 
  Mail, 
  Shield, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  RefreshCw, 
  Copy, 
  Check, 
  Lock, 
  ExternalLink,
  Info,
  Clock,
  UserX
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_ROLE_DEFINITIONS } from '../../data/initialData';

interface MemberSettingsViewProps {
  onNotify?: (message: string) => void;
  onLogout: () => void;
}

export const MemberSettingsView: React.FC<MemberSettingsViewProps> = ({ 
  onNotify,
  onLogout 
}) => {
  const { 
    currentUser, 
    userProfile, 
    activeRole, 
    sendVerification, 
    checkEmailVerification, 
    resetPassword 
  } = useAuth();

  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fullName = userProfile?.fullLegalName || userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || 'Trust Member';
  const isVerified = currentUser?.emailVerified || userProfile?.emailVerified || false;
  const effectiveRole = userProfile?.role || userProfile?.primaryRole || activeRole || 'member';
  const roleLabel = ADMIN_ROLE_DEFINITIONS[effectiveRole as any]?.label || 'Trust Member';
  const createdAt = userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'July 2026';

  const handleCopyUid = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      if (onNotify) onNotify('Firebase UID copied to clipboard.');
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!currentUser?.email) return;
    setIsSendingReset(true);
    setMessage(null);
    try {
      await resetPassword(currentUser.email);
      setMessage({
        type: 'success',
        text: `Password reset instructions sent to ${currentUser.email}. Please check your inbox and spam folders.`
      });
      if (onNotify) onNotify('Password reset email sent.');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Failed to send password reset email. Please try again later.'
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResendEmailVerification = async () => {
    setIsResendingVerification(true);
    setMessage(null);
    try {
      await sendVerification();
      setMessage({
        type: 'success',
        text: `Email verification link resent to ${currentUser?.email}. Please click the link to confirm your account.`
      });
      if (onNotify) onNotify('Verification email resent.');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Could not send verification email.'
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    setIsCheckingVerification(true);
    setMessage(null);
    try {
      const verified = await checkEmailVerification();
      if (verified) {
        setMessage({
          type: 'success',
          text: 'Email verified successfully! All member privileges are active.'
        });
        if (onNotify) onNotify('Email verification confirmed.');
      } else {
        setMessage({
          type: 'error',
          text: 'Email is not yet verified. Please click the link sent to your registered email.'
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Unable to check verification status.'
      });
    } finally {
      setIsCheckingVerification(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl" id="member-settings-section">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                <Settings className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Account Settings & Security
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage your authentication credentials, security verification, and session preferences.
            </p>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-center transition-colors"
            id="settings-signout-btn"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Status Notice if any */}
        {message && (
          <div className={`mt-5 p-4 rounded-2xl text-xs flex items-start gap-2.5 border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
              : 'bg-rose-50 text-rose-950 border-rose-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            )}
            <p className="leading-relaxed font-medium">{message.text}</p>
          </div>
        )}
      </div>

      {/* Account Profile & Credentials Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Account Identity & Security Scope
          </h3>
          <span className="text-[11px] font-bold text-slate-500">
            Protected Record
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Full Legal Name</span>
            <div className="font-bold text-slate-900 text-sm">{fullName}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Registered Email</span>
            <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span className="truncate">{currentUser?.email}</span>
              {isVerified ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 shrink-0 ml-1">
                  Verified
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 shrink-0 ml-1">
                  Unverified
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Firebase UID</span>
              <button
                type="button"
                onClick={handleCopyUid}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                {copiedUid ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUid ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-slate-700 truncate" title={currentUser?.uid}>
              {currentUser?.uid || 'N/A'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Role & Access Matrix</span>
            <div className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>{roleLabel}</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="leading-snug">
            Identity keys, roles, and administrative authorization levels are cryptographically protected and managed exclusively by the Board of Trustees Secretariat.
          </p>
        </div>
      </div>

      {/* Password & Security Actions Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-600" />
            Password & Credential Management
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Reset Account Password</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                We will send a secure password reset link to your registered email address ({currentUser?.email}).
              </p>
            </div>
            <button
              onClick={handleSendPasswordReset}
              disabled={isSendingReset}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 shadow-xs self-start sm:self-center"
            >
              {isSendingReset ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </div>

          {!isVerified && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div>
                <h4 className="text-xs font-bold text-amber-950">Email Verification Pending</h4>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Confirm your email to ensure uninterrupted access to scholarship results and convocation voting.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={handleCheckEmailVerification}
                  disabled={isCheckingVerification}
                  className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isCheckingVerification ? 'Checking...' : 'Refresh Status'}
                </button>
                <button
                  onClick={handleResendEmailVerification}
                  disabled={isResendingVerification}
                  className="px-3 py-2 rounded-xl bg-amber-800 text-white hover:bg-amber-900 font-bold text-xs whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isResendingVerification ? 'Sending...' : 'Resend Email'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Communication & Notification Preferences Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-700" />
            Communication & Alert Preferences
          </h3>
          <span className="text-[11px] font-bold text-slate-500">
            Real-time In-App & Email
          </span>
        </div>

        <p className="text-xs text-slate-600">
          Configure which categories of trust dispatches and official updates you receive. Mandatory security and verification alerts remain active at all times.
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-800">Notification Channel Control</div>
            <div className="text-[11px] text-slate-500">
              Manage email mirrors, membership reminders, volunteer dispatches, and competition alerts.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onNotify) onNotify('Opening communication preferences...');
              // If tab navigation is available or user can click notification center
              const notifBtn = document.getElementById('notification-prefs-btn');
              if (notifBtn) notifBtn.click();
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
          >
            Configure Alerts
          </button>
        </div>
      </div>

      {/* Data Governance & Trust Records */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            Data Privacy & Trust Governance
          </h3>
        </div>

        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            Your member profile and educational grant records are maintained under strict confidentiality pursuant to the Bombay Public Trusts Act, 1950 and Section 80G statutory reporting compliance with the Income Tax Department.
          </p>
          <p className="text-[11px] text-slate-500">
            For account deactivation, data copy requests, or formal address changes on physical trust ledgers, please contact the Central Secretariat at <span className="font-semibold text-slate-700">fetkofficial@gmail.com</span>.
          </p>
        </div>
      </div>

    </div>
  );
};
