/**
 * @license
 * Member Dashboard (Experience B)
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  User, 
  CreditCard, 
  BadgeDollarSign, 
  FileText, 
  Bell, 
  Settings,
  ArrowLeft, 
  LogOut, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  QrCode, 
  ShieldCheck, 
  Sparkles,
  Calendar,
  Building,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  Award,
  Layers,
  HeartHandshake,
  GraduationCap,
  ShoppingBag
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { ADMIN_ROLE_DEFINITIONS } from '../../data/initialData';
import { SYSTEM_SUPER_ADMIN_EMAIL } from '../../lib/firebase';
import { MemberProfileView } from './MemberProfileView';
import { MemberApplicationsView } from './MemberApplicationsView';
import { MemberMembershipView } from './MemberMembershipView';
import { MemberDonationsView } from './MemberDonationsView';
import { MemberNotificationsView } from './MemberNotificationsView';
import { MemberSettingsView } from './MemberSettingsView';
import { MemberCampaignsView } from './MemberCampaignsView';
import { MemberCompetitionsView } from './MemberCompetitionsView';
import { VolunteerApplicationForm } from './VolunteerApplicationForm';
import { VolunteerDashboard } from './VolunteerDashboard';
import { DonorApplicationForm } from './DonorApplicationForm';
import { DigitalDonorCard } from '../donor/DigitalDonorCard';
import { DigitalVolunteerCard } from '../volunteer/DigitalVolunteerCard';
import { DonorVerificationModal } from '../donor/DonorVerificationModal';
import { MemberImpactView } from './MemberImpactView';
import { StudentFeePortalView } from './StudentFeePortalView';
import { MemberStoreOrdersView } from './MemberStoreOrdersView';

export type MemberDashboardTab = 
  | 'dashboard'
  | 'profile'
  | 'competitions'
  | 'volunteer'
  | 'donor'
  | 'applications'
  | 'impact'
  | 'membership'
  | 'donations'
  | 'fees'
  | 'campaigns'
  | 'orders'
  | 'notifications'
  | 'settings';

interface UserDashboardProps {
  initialTab?: MemberDashboardTab;
  onReturnToPublic: () => void;
  onOpenAdminConsole?: () => void;
  onOpenAuth?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ 
  initialTab = 'dashboard',
  onReturnToPublic, 
  onOpenAdminConsole,
  onOpenAuth
}) => {
  const { 
    currentUser, 
    userProfile, 
    activeRole, 
    hasAdminAccess, 
    isSuperAdmin, 
    signOut, 
    isLoading, 
    sendVerification, 
    checkEmailVerification 
  } = useAuth();
  
  const { config } = useConfig();
  const { unreadCount } = useNotifications();

  const validTabs: MemberDashboardTab[] = [
    'dashboard',
    'profile',
    'competitions',
    'volunteer',
    'donor',
    'applications',
    'impact',
    'membership',
    'donations',
    'fees',
    'campaigns',
    'orders',
    'notifications',
    'settings'
  ];

  const sanitizeTab = (tab?: string): MemberDashboardTab => {
    if (tab && validTabs.includes(tab as MemberDashboardTab)) {
      return tab as MemberDashboardTab;
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<MemberDashboardTab>(() => sanitizeTab(initialTab));
  const [profileSubView, setProfileSubView] = useState<'overview' | 'edit' | 'photo'>('overview');

  useEffect(() => {
    setActiveTab(sanitizeTab(initialTab));
  }, [initialTab]);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [verificationSending, setVerificationSending] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [showDonorVerifyModal, setShowDonorVerifyModal] = useState(false);
  const [verifyingDonorId, setVerifyingDonorId] = useState<string>('');

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" id="fet-portal-loading">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-700">Loading FET India Member Portal...</p>
      </div>
    );
  }

  // Unauthenticated State
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" id="fet-portal-unauth">
        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-xl">
          <div className="flex justify-center">
            <FETLogo size="md" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Member Portal Authentication</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sign in or create a member account to access your digital trust identity card, download 80G tax exemption receipts, and submit scholarship applications.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all shadow-md active:scale-98 cursor-pointer"
              >
                Sign In / Create Account
              </button>
            )}
            <button
              onClick={onReturnToPublic}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Back to FET India Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  const notify = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleResendEmailVerification = async () => {
    setVerificationSending(true);
    try {
      await sendVerification();
      notify('Verification email resent! Please check your inbox and spam folders.');
    } catch (err: any) {
      notify(err?.message || 'Could not send verification email. Please try again.');
    } finally {
      setVerificationSending(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    setIsCheckingVerification(true);
    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        notify('Email verified successfully! All member privileges are active.');
      } else {
        notify('Email is not yet verified. Please click the link sent to your email.');
      }
    } catch (err: any) {
      notify(err?.message || 'Unable to refresh verification status.');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onReturnToPublic();
  };

  // Role & Membership Status Calculations
  const effectiveRole = userProfile?.role || userProfile?.primaryRole || activeRole || 'user';
  const isCoreMember = userProfile?.membershipStatus === 'core_member';
  const isApprovedMember = 
    userProfile?.membershipStatus === 'general_member' || 
    isCoreMember || 
    effectiveRole === 'member' || 
    effectiveRole === 'core_member' || 
    effectiveRole === 'super_admin' || 
    effectiveRole === 'administrator';
  
  const hasPendingMembership = userProfile?.membershipStatus === 'pending' || userProfile?.membershipStatus === 'under_review';

  // Volunteer Status Calculations (completely independent from membership and donor)
  const isApprovedVolunteer = 
    userProfile?.volunteerStatus === 'approved' || 
    userProfile?.volunteerStatus === 'active_volunteer' || 
    userProfile?.roles?.includes('volunteer') || 
    effectiveRole === 'volunteer';
  const hasPendingVolunteer = userProfile?.volunteerStatus === 'pending' || userProfile?.volunteerStatus === 'under_review';

  // Donor Status Calculations (completely independent)
  const isApprovedDonor = 
    userProfile?.donorStatus === 'approved' ||
    userProfile?.donorStatus === 'active_donor' || 
    userProfile?.roles?.includes('donor') || 
    effectiveRole === 'donor';
  const hasPendingDonor = userProfile?.donorStatus === 'pending' || userProfile?.donorStatus === 'under_review';

  // Full Legal Name for display
  const fullLegalName = userProfile?.fullLegalName || userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || (isApprovedMember ? 'Trust Member' : 'Registered User');
  const displayId = isApprovedMember 
    ? (userProfile?.membershipId || `FET-MBR-${new Date().getFullYear()}-${currentUser?.uid ? currentUser.uid.slice(0, 4).toUpperCase() : '8492'}`)
    : (userProfile?.membershipId || `FET-USR-${currentUser?.uid ? currentUser.uid.slice(0, 6).toUpperCase() : '0000'}`);
  const roleLabel = isCoreMember 
    ? 'Core Member' 
    : (userProfile?.membershipStatus === 'general_member' 
        ? 'General Member' 
        : (ADMIN_ROLE_DEFINITIONS[effectiveRole as any]?.label || (isApprovedMember ? 'General Member' : 'Registered User')));
  const isVerified = currentUser.emailVerified || userProfile?.emailVerified || false;

  // Profile Completion Calculation
  const isProfileComplete = Boolean(
    userProfile?.profileCompleted ||
    (
      userProfile?.fullLegalName &&
      userProfile?.mobileNumber &&
      userProfile?.country &&
      userProfile?.address &&
      userProfile?.city &&
      userProfile?.state &&
      userProfile?.pincode
    )
  );

  const calculateCompletionPercent = () => {
    if (!userProfile) return 40;
    const fields = [
      userProfile.fullLegalName || userProfile.fullName,
      userProfile.mobileNumber || userProfile.phoneNumber,
      userProfile.country,
      userProfile.address,
      userProfile.city,
      userProfile.state,
      userProfile.pincode,
      userProfile.occupation,
      userProfile.educationalQualification || userProfile.qualification,
      userProfile.dateOfBirth
    ];
    const filled = fields.filter(f => f && f.toString().trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionPercent = calculateCompletionPercent();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800" id="user-dashboard-root">
      
      {/* Dashboard Top Header Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onReturnToPublic}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              id="return-public-website-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Public Website</span>
            </button>
            <div className="h-5 w-px bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <FETLogo size="sm" showTagline={false} />
              <span className="text-xs font-bold text-amber-400 hidden md:inline">
                {isApprovedMember ? '• Member Dashboard' : '• Registered User Portal'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Super Admin Console Button (Only visible if user actually has administrative access) */}
            {hasAdminAccess && onOpenAdminConsole && (
              <button
                onClick={onOpenAdminConsole}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer shadow-xs"
                id="dashboard-open-admin-btn"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isSuperAdmin ? 'Super Admin Console' : 'Admin Console'}</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-black flex items-center justify-center border border-emerald-500/50 shadow-xs">
                {fullLegalName ? fullLegalName.charAt(0).toUpperCase() : (isApprovedMember ? 'M' : 'U')}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="font-bold text-slate-100 max-w-[160px] truncate">{fullLegalName}</div>
                <div className="text-[10px] text-amber-400 font-mono">{displayId}</div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer transition-colors"
              title="Sign Out"
              id="dashboard-signout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 9-Item Responsive Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-slate-800 text-xs font-bold scrollbar-none py-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-profile"
          >
            <User className="w-3.5 h-3.5" />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('competitions')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'competitions'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-competitions"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Competitions & Exams</span>
          </button>

          <button
            onClick={() => setActiveTab('volunteer')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'volunteer'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-volunteer"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Become a Volunteer</span>
          </button>

          <button
            onClick={() => setActiveTab('donor')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'donor'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-donor"
          >
            <BadgeDollarSign className="w-3.5 h-3.5" />
            <span>Become a Donor</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-applications"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Applications</span>
          </button>

          <button
            onClick={() => setActiveTab('impact')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'impact'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-my-impact"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>My Impact</span>
          </button>

          <button
            onClick={() => setActiveTab('membership')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'membership'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-membership"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Membership</span>
          </button>

          <button
            onClick={() => setActiveTab('donations')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'donations'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-donations"
          >
            <BadgeDollarSign className="w-3.5 h-3.5" />
            <span>Donations</span>
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'fees'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-fees"
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Student Fees</span>
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'campaigns'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-campaigns"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
            <span>My Appeals</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-store-orders"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Store Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer relative ${
              activeTab === 'notifications'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-notifications"
          >
            <div className="relative">
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </div>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'notifications'
                  ? 'bg-slate-950 text-amber-400'
                  : 'bg-rose-600 text-white'
              }`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Email Verification Reminder Banner for unverified accounts */}
        {currentUser && !isVerified && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 block text-xs">
                  Email Verification Pending ({currentUser.email})
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Please verify your email address to unlock full access to scholarship disbursements, voting rights, and official certificates.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCheckEmailVerification}
                disabled={isCheckingVerification}
                className="px-3.5 py-2 rounded-xl bg-white border border-amber-400 text-amber-900 hover:bg-amber-100 font-bold text-xs shrink-0 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isCheckingVerification ? 'Checking...' : 'Refresh Status'}
              </button>
              <button
                onClick={handleResendEmailVerification}
                disabled={verificationSending}
                className="px-3.5 py-2 rounded-xl bg-amber-700 text-white hover:bg-amber-800 font-bold text-xs shrink-0 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {verificationSending ? 'Sending...' : 'Resend Verification'}
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Status Notification Alert */}
        {statusNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: DASHBOARD (OVERVIEW, WELCOME & PROFILE COMPLETION)      */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6" id="dashboard-overview-tab">
            
            {/* 1. Welcome Section & Hero Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {isApprovedMember ? 'FET India Member Portal' : 'FET India Registered User Portal'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {roleLabel}
                    </span>
                    {isApprovedVolunteer && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 border border-emerald-300 flex items-center gap-1 shadow-xs">
                        <HeartHandshake className="w-3 h-3" />
                        Approved Volunteer
                      </span>
                    )}
                    {isApprovedDonor && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 border border-amber-300 flex items-center gap-1 shadow-xs">
                        <BadgeDollarSign className="w-3 h-3" />
                        Active Donor
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Welcome back, {fullLegalName}!
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    {isApprovedMember 
                      ? 'Welcome to the official Fatimyah Educational Trust member portal. Access your digital ID card, review active application pipelines, download 80G tax receipts, and keep your trust records up to date.'
                      : 'Welcome to your Fatimyah Educational Trust user portal. Complete your profile, apply for official General Membership, or enroll as a Volunteer or Donor.'}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-400">{isApprovedMember ? 'Member ID:' : 'User ID:'}</span>
                      <span className="font-bold text-amber-300">{displayId}</span>
                    </div>
                    {userProfile?.volunteerId && (
                      <>
                        <div className="h-3 w-px bg-slate-700" />
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-slate-400">Volunteer ID:</span>
                          <span className="font-bold text-emerald-300">{userProfile.volunteerId}</span>
                        </div>
                      </>
                    )}
                    {userProfile?.donorId && (
                      <>
                        <div className="h-3 w-px bg-slate-700" />
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-slate-400">Donor ID:</span>
                          <span className="font-bold text-amber-300">{userProfile.donorId}</span>
                        </div>
                      </>
                    )}
                    <div className="h-3 w-px bg-slate-700" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Account Status:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-2.5 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>View Full Profile</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('membership')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>{isApprovedMember ? 'Digital ID Card' : 'Membership Status'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Profile Completion Banner / Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl shrink-0 ${
                    isProfileComplete 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Profile Completion Status
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isProfileComplete
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {isProfileComplete ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isProfileComplete
                        ? 'Your KYC profile and residential records are fully complete and verified.'
                        : 'Please complete your address, education, and contact details for seamless grant processing.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                  <span className="text-sm font-black text-slate-900">
                    {completionPercent}%
                  </span>
                  {!isProfileComplete && (
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      id="complete-profile-action-btn"
                    >
                      <span>Complete Profile</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isProfileComplete ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.max(completionPercent, 10)}%` }}
                />
              </div>
            </div>

            {/* 3. Six Core Metric Tiles (Applications, Competitions & Exams, Membership, Volunteer Corps, 80G Receipts, Announcements) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div 
                onClick={() => setActiveTab('applications')}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Applications</span>
                  <FileText className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-slate-900 mt-2">1 Active</div>
                <span className="text-[11px] text-blue-700 font-bold flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5" /> Under Scrutiny
                </span>
              </div>

              <div 
                onClick={() => setActiveTab('competitions')}
                className="p-5 rounded-3xl bg-white border border-amber-200 hover:border-amber-300 transition-all shadow-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Exams & Tests</span>
                  <Award className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-slate-900 mt-2">Active</div>
                <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Portal & Results
                </span>
              </div>

              <div 
                onClick={() => setActiveTab('membership')}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Membership</span>
                  <CreditCard className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-slate-900 mt-2">
                  {isApprovedMember ? 'Active' : (hasPendingMembership ? 'Under Review' : 'Not Enrolled')}
                </div>
                <span className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${isApprovedMember ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isApprovedMember ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {isApprovedMember ? 'Digital ID Issued' : (hasPendingMembership ? 'KYC In Review' : 'Apply to Unlock')}
                </span>
              </div>

              <div 
                onClick={() => setActiveTab('volunteer')}
                className={`p-5 rounded-3xl border transition-all shadow-xs cursor-pointer group ${
                  isApprovedVolunteer 
                    ? 'bg-gradient-to-br from-emerald-500/10 via-white to-white border-emerald-300 hover:border-emerald-400' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Volunteer Corps</span>
                  <HeartHandshake className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-slate-900 mt-2">
                  {isApprovedVolunteer 
                    ? (userProfile?.volunteerId || 'Approved') 
                    : (hasPendingVolunteer ? 'In Review' : 'Not Enrolled')}
                </div>
                <span className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${
                  isApprovedVolunteer ? 'text-emerald-700' : hasPendingVolunteer ? 'text-blue-700' : 'text-slate-600'
                }`}>
                  {isApprovedVolunteer ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <Clock className="w-3.5 h-3.5" />}
                  {isApprovedVolunteer ? 'Approved Volunteer' : (hasPendingVolunteer ? 'Application In Review' : 'Join Volunteer Wing')}
                </span>
              </div>

              <div 
                onClick={() => setActiveTab('donations')}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">80G Receipts</span>
                  <BadgeDollarSign className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-slate-900 mt-2">₹15,000</div>
                <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 2 Tax Certificates
                </span>
              </div>

              <div 
                onClick={() => setActiveTab('notifications')}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notifications</span>
                  <Bell className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-black text-slate-900 mt-2">
                  {unreadCount > 0 ? `${unreadCount} Unread` : 'All Read'}
                </div>
                <span className="text-[11px] text-purple-700 font-bold flex items-center gap-1 mt-1">
                  <Sparkles className="w-3.5 h-3.5" /> Institutional Bulletins
                </span>
              </div>
            </div>

            {/* Approved Volunteer Official Credential Banner (If Approved Volunteer) */}
            {isApprovedVolunteer && (
              <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-emerald-700/60 relative overflow-hidden space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                      <HeartHandshake className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400 text-slate-950">
                          Approved Volunteer
                        </span>
                        <span className="text-xs font-mono text-emerald-300 font-bold">
                          ID: {userProfile?.volunteerId || 'FET-VOL-ASSIGNED'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        FET India Volunteer Corps Credential Record
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('volunteer')}
                    className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors self-start md:self-auto"
                  >
                    <span>Open Volunteer Desk</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-200">
                  <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Volunteer Status</span>
                    <span className="font-bold text-emerald-300 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  </div>

                  <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Approval Date</span>
                    <span className="font-bold text-white mt-0.5 block">
                      {userProfile?.volunteerApprovedAt 
                        ? new Date(userProfile.volunteerApprovedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Accredited'}
                    </span>
                  </div>

                  <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Volunteer ID</span>
                    <span className="font-mono font-bold text-amber-300 mt-0.5 block">
                      {userProfile?.volunteerId || 'FET-VOL'}
                    </span>
                  </div>

                  <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Deployment Area</span>
                    <span className="font-bold text-white truncate mt-0.5 block">
                      {userProfile?.volunteerPreferredLocation || userProfile?.city || 'National Chapter'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Approved Donor Official Credential Banner (If Approved Donor) */}
            {isApprovedDonor && (
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-amber-500/40 relative overflow-hidden space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                      <BadgeDollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                          Approved Donor & Patron
                        </span>
                        <span className="text-xs font-mono text-amber-300 font-bold">
                          ID: {userProfile?.donorId || 'FET-DNR-ASSIGNED'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        FET India Patron Credential & Digital Donor Card
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setVerifyingDonorId(userProfile?.donorId || '');
                        setShowDonorVerifyModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                    >
                      <QrCode className="w-4 h-4 text-amber-600" />
                      <span>Verify Credential</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('donor')}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                    >
                      <span>Patron Profile</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Digital Donor Card Display */}
                <div className="max-w-md mx-auto">
                  <DigitalDonorCard 
                    donorId={userProfile?.donorId || 'FET-DNR-2026-0101'}
                    fullName={fullLegalName}
                    donorType={userProfile?.donorType || 'individual'}
                    donorStatus="approved"
                    issueDate={userProfile?.donorApprovedAt || 'Jan 2026'}
                    photoURL={userProfile?.photoURL}
                    district={userProfile?.city}
                    state={userProfile?.state}
                    onOpenVerification={(id) => {
                      setVerifyingDonorId(id);
                      setShowDonorVerifyModal(true);
                    }}
                    onNotify={notify}
                    showActions={true}
                  />
                </div>
              </div>
            )}

            {/* 4. Quick Navigation Modules & Snapshot Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Applications & Next Steps Preview (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Active Application Snapshot */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      Recent Application Pipelines
                    </h3>
                    <button
                      onClick={() => setActiveTab('applications')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        FET/EDU/2026/0891
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
                        Under Review
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Merit-cum-Need Higher Education Scholarship 2026-27
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Stage 2: Academic Document & Income Scrutiny in progress.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Submitted: August 12, 2026</span>
                      <button
                        onClick={() => setActiveTab('applications')}
                        className="font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Track Status →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Trust Announcements */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-600" />
                      Trust Broadcasts & Bulletins
                    </h3>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inbox</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs space-y-2.5">
                    <div className="pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Higher Education Grant Window AY 2026-27 Open</span>
                        <span className="text-[10px] text-slate-400">Aug 2026</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Students in technical and degree colleges may apply before the September 30 deadline.
                      </p>
                    </div>

                    <div className="pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Section 80G Certificates Generated</span>
                        <span className="text-[10px] text-slate-400">July 2026</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Download your automated 80G receipts directly for Form 10BD income tax compliance.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Digital ID Preview Card & Quick Links (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* ID Card Snapshot */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      {isApprovedMember ? 'Digital Membership ID' : 'General Membership Status'}
                    </h3>
                    <button
                      onClick={() => setActiveTab('membership')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isApprovedMember ? 'Full Card' : 'Manage'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isApprovedMember ? (
                    /* Compact Card Graphic for Approved Members */
                    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-4 border border-slate-800 shadow-md">
                      <div className="border-b border-white/10 pb-2 flex items-center justify-between">
                        <span className="text-[9px] uppercase font-black text-emerald-400 tracking-wider">
                          {config.legalName}
                        </span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">
                          VERIFIED
                        </span>
                      </div>

                      <div className="py-3 flex items-center justify-between">
                        <div>
                          <span className="text-[8px] uppercase text-slate-400 font-bold block">Member Name</span>
                          <span className="text-xs font-black text-white block">{fullLegalName}</span>
                          <span className="text-[9px] font-mono text-amber-300 mt-0.5 block">{displayId}</span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-white">
                          <QrCode className="w-10 h-10 text-slate-950" />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-400">
                        <span>DARPAN: {config.nitiAayogId || 'JK/2026/1153821'} • PAN: {config.panNumber || 'AABTF0015H'}</span>
                        <span>AY 2026-27</span>
                      </div>
                    </div>
                  ) : (
                    /* Membership CTA Box for Registered Users */
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white space-y-3 shadow-md border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-amber-300">
                          {hasPendingMembership ? 'Verification in Progress' : 'Upgrade to General Member'}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {hasPendingMembership ? 'Pending' : 'Registered User'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {hasPendingMembership 
                          ? 'Your membership application is currently under Super Admin review. You will receive an official Digital Membership ID card upon approval.'
                          : 'Obtain official General Membership with Fatimyah Educational Trust to unlock digital trust ID cards, community voting, and prioritized welfare initiatives.'}
                      </p>
                      <button
                        onClick={() => setActiveTab('membership')}
                        className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{hasPendingMembership ? 'Check Review Status' : 'Apply for General Membership →'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Navigation Action Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    onClick={() => {
                      setProfileSubView('edit');
                      setActiveTab('profile');
                    }}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-left shadow-xs cursor-pointer group transition-all"
                  >
                    <User className="w-5 h-5 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-slate-900">My Profile</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Edit personal info</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('volunteer')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-200 hover:border-emerald-300 text-left shadow-xs cursor-pointer group transition-all"
                  >
                    <HeartHandshake className="w-5 h-5 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-slate-900">Volunteer Corps</div>
                    <div className="text-[10px] text-emerald-800 font-medium mt-0.5">Apply / Track status</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('donor')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 text-left shadow-xs cursor-pointer group transition-all"
                  >
                    <BadgeDollarSign className="w-5 h-5 text-amber-700 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-slate-900">Become a Donor</div>
                    <div className="text-[10px] text-amber-800 font-medium mt-0.5">Enroll as Patron</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('applications')}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-left shadow-xs cursor-pointer group transition-all"
                  >
                    <FileText className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-slate-900">Applications</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Track review status</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('donations')}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-left shadow-xs cursor-pointer group transition-all"
                  >
                    <BadgeDollarSign className="w-5 h-5 text-slate-600 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-slate-900">80G Receipts</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Download certificates</div>
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: MY PROFILE (VIEWING & SANITIZED EDITING)               */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div id="dashboard-profile-tab">
            <MemberProfileView 
              onNotify={notify} 
              onOpenMembershipCard={() => setActiveTab('membership')}
              initialSubView={profileSubView}
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2B: VOLUNTEER CORPS & DIGITAL ID CARD                     */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'volunteer' && (
          <div id="dashboard-volunteer-tab" className="space-y-6">
            {isApprovedVolunteer ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                          <HeartHandshake className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                          Volunteer Corps Dashboard
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Accredited member of the FET India Volunteer Corps • Community & Educational Service Wing
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-sky-100 text-sky-950 font-bold text-xs flex items-center gap-1.5 border border-sky-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
                        <span>Accredited Volunteer</span>
                      </span>
                    </div>
                  </div>
                </div>

                <VolunteerDashboard 
                  onOpenApplication={() => {
                    notify('Displaying Volunteer Corps Status & Dossier');
                  }}
                />
              </div>
            ) : (
              <VolunteerApplicationForm 
                onSuccess={(msg) => notify(msg)} 
                onClose={() => setActiveTab('dashboard')} 
              />
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2C: DONOR PATRONAGE & DIGITAL ID CARD                     */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'donor' && (
          <div id="dashboard-donor-tab" className="space-y-6">
            {isApprovedDonor ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                          <BadgeDollarSign className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                          My Patron & Donor Digital Credential
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Official Patronage status • 80G Tax Exemption certification and institutional recognition.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-950 font-bold text-xs flex items-center gap-1.5 border border-amber-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                        <span>Accredited Patron</span>
                      </span>
                    </div>
                  </div>

                  {/* Donor Quick Stats */}
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Donor ID</span>
                      <div className="font-mono font-bold text-amber-700 truncate mt-0.5" title={userProfile?.donorId}>
                        {userProfile?.donorId || 'FET-DNR-ASSIGNED'}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Patron Type</span>
                      <div className="font-extrabold text-slate-900 mt-0.5 capitalize">
                        {userProfile?.donorType || 'Individual Patron'}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Tax Exemption</span>
                      <div className="font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 80G Eligible
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Accreditation</span>
                      <div className="font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified Patron
                      </div>
                    </div>
                  </div>
                </div>

                {/* ID Card Display & 80G Information */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Donor ID Card */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Accredited Donor & Patron ID Card
                      </h3>
                      <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                        ● Warm Bronze Credential
                      </span>
                    </div>

                    <DigitalDonorCard
                      donorId={userProfile?.donorId || 'FET-DNR-2026-0101'}
                      fullName={fullLegalName}
                      fatherName={userProfile?.fatherName || userProfile?.guardianName}
                      donorType={userProfile?.donorType || 'individual'}
                      organizationName={userProfile?.organizationName}
                      donorStatus="approved"
                      issueDate={userProfile?.donorApprovedAt || userProfile?.createdAt || '2026-01-01'}
                      validUntil="AY 2026-2027"
                      photoURL={userProfile?.photoURL}
                      bloodGroup={userProfile?.bloodGroup}
                      district={userProfile?.district || userProfile?.city}
                      state={userProfile?.state}
                      country={userProfile?.country || 'India'}
                      onOpenVerification={(id) => {
                        setVerifyingDonorId(id);
                        setShowDonorVerifyModal(true);
                      }}
                      onNotify={notify}
                      showActions={true}
                    />
                  </div>

                  {/* Right: Tax Benefits & Impact Report */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-600" />
                          Patron Benefits & Statutory 80G Exemptions
                        </h3>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          Certified
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                          <BadgeDollarSign className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-slate-900">50% Income Tax Deduction (Sec. 80G)</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              All voluntary contributions to Fatimyah Educational Trust qualify for 50% tax deductions under Section 80G of the Indian Income Tax Act.
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                          <FileText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-slate-900">Form 10BD & Instant Donation Receipts</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Download verifiable 80G receipts with PAN mapping from the Donations tab for swift tax filing.
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-slate-900">Annual Trust Convocation & Impact Reports</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Receive comprehensive annual audit reports, scholarship distribution ledgers, and VIP invitations to trust convocations.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <DonorApplicationForm 
                onSuccess={(msg) => notify(msg)} 
                onClose={() => setActiveTab('dashboard')} 
              />
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2B: COMPETITIONS & ONLINE EXAMINATIONS (STEP 64)          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'competitions' && (
          <div id="dashboard-competitions-tab">
            <MemberCompetitionsView onOpenAuth={onOpenAuth} />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: MY APPLICATIONS (APPLICATIONS & LIVE STATUSES)         */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'applications' && (
          <div id="dashboard-applications-tab">
            <MemberApplicationsView 
              onNotify={notify} 
              onOpenTab={(t) => setActiveTab(t as MemberDashboardTab)} 
              onOpenVolunteerForm={() => setActiveTab('volunteer')}
              onOpenDonorForm={() => setActiveTab('donor')}
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3B: MY IMPACT (PERSONAL PARTICIPATION & SERVICE LEDGER)  */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'impact' && (
          <div id="dashboard-my-impact-tab">
            <MemberImpactView 
              onOpenTab={(t) => setActiveTab(t as MemberDashboardTab)} 
              onExploreCampaigns={() => setActiveTab('campaigns')}
              onExploreCompetitions={() => setActiveTab('competitions')}
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: MEMBERSHIP (DIGITAL ID & TRUST ACCREDITATION)          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'membership' && (
          <div id="dashboard-membership-tab">
            <MemberMembershipView 
              onNotify={notify} 
              onOpenProfile={() => setActiveTab('profile')} 
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: DONATIONS (80G RECEIPTS & CONTRIBUTION HISTORY)        */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'donations' && (
          <div id="dashboard-donations-tab">
            <MemberDonationsView onNotify={notify} />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5B: STUDENT & INSTITUTION FEES (CHAPTER 15.10 SRS)        */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'fees' && (
          <div id="dashboard-fees-tab">
            <StudentFeePortalView onNotify={notify} />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5C: MY CAMPAIGNS & APPEALS (CROWDFUNDING MODULE)          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'campaigns' && (
          <div id="dashboard-campaigns-tab">
            <MemberCampaignsView />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5D: MY STORE ORDERS (FET STORE MODULE)                    */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'orders' && (
          <div id="dashboard-orders-tab">
            <MemberStoreOrdersView onOpenStore={onReturnToPublic} onOpenAuth={onOpenAuth} />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: NOTIFICATIONS (SYSTEM BROADCASTS & INBOX)              */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'notifications' && (
          <div id="dashboard-notifications-tab">
            <MemberNotificationsView 
              onNotify={notify} 
              onNavigateTab={(t) => setActiveTab(t as MemberDashboardTab)} 
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: SETTINGS (SECURITY, PASSWORD & LOGOUT)                 */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div id="dashboard-settings-tab">
            <MemberSettingsView 
              onNotify={notify} 
              onLogout={handleSignOut} 
            />
          </div>
        )}

      </main>

      {/* Global Donor Accreditation QR Verification Modal */}
      <DonorVerificationModal 
        isOpen={showDonorVerifyModal}
        onClose={() => setShowDonorVerifyModal(false)}
        initialDonorId={verifyingDonorId}
      />

    </div>
  );
};
