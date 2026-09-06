/**
 * @license
 * Super Admin Management Dashboard & Governance Foundation
 * Fatimyah Educational Trust India (FET India)
 * 
 * Accessible EXCLUSIVELY to authorized users with role "super_admin".
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  HeartHandshake, 
  BadgeDollarSign, 
  ShieldAlert, 
  FileText, 
  Sliders, 
  Settings, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  ChevronRight, 
  ArrowUpRight, 
  RefreshCw, 
  Eye, 
  UserX, 
  Layers, 
  Shield, 
  SlidersHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  KeyRound,
  Inbox,
  Sparkles,
  Award,
  BookOpen,
  GraduationCap,
  Crown,
  LineChart,
  Landmark,
  UserCog,
  HardDrive
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, updateUserAccountStatus, SYSTEM_SUPER_ADMIN_EMAIL } from '../../lib/firebase';
import { FIREBASE_STORAGE_BUCKET } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { AdminRolesView } from './AdminRolesView';
import { AdminAuditView } from './AdminAuditView';
import { AdminVolunteerApplicationsView } from './AdminVolunteerApplicationsView';
import { AdminDonorApplicationsView } from './AdminDonorApplicationsView';
import { AdminMembershipApplicationsView } from './AdminMembershipApplicationsView';
import { AdminCoreMembersView } from './AdminCoreMembersView';
import { AdminCampaignManagementView } from './AdminCampaignManagementView';
import { AdminReportsAnalyticsView } from './AdminReportsAnalyticsView';
import { AdminDonorsManagementView } from './AdminDonorsManagementView';
import { AdminFinanceAccountingView } from './AdminFinanceAccountingView';
import { AdminStaffHRMSView } from './AdminStaffHRMSView';
import { AdminCMSView } from './AdminCMSView';
import { UserProfile, UserRole, AuditLog, AppPermission } from '../../types';
import { ROLE_DEFINITIONS, getRoleMetadata } from '../../lib/rbac';

interface SuperAdminDashboardProps {
  onReturnToPublic?: () => void;
  onOpenUserDashboard?: () => void;
}

type SuperAdminTab = 'overview' | 'reports' | 'users' | 'roles' | 'coremembers' | 'applications' | 'campaigns' | 'donations' | 'finance' | 'hrms' | 'cms' | 'settings' | 'audit';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onReturnToPublic,
  onOpenUserDashboard
}) => {
  const { currentUser, userProfile, isSuperAdmin, signOut } = useAuth();
  const { config } = useConfig();

  const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User Management State
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<UserProfile | null>(null);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<UserProfile | null>(null);
  const [statusActionReason, setStatusActionReason] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Application foundation tab state
  const [selectedAppCategory, setSelectedAppCategory] = useState<'volunteer' | 'membership' | 'donor' | 'education'>('volunteer');

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!currentUser || !isSuperAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 1. Subscribe to Users Collection
    const usersUnsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as UserProfile;
          list.push({
            ...data,
            uid: doc.id,
            roles: data.roles || (data.role ? [data.role as UserRole] : ['member']),
            primaryRole: data.primaryRole || (data.roles ? data.roles[0] : 'member'),
            accountStatus: data.accountStatus || data.status || 'active'
          });
        });

        // Ensure system super admin lead is present
        if (!list.some(u => u.email.toLowerCase() === SYSTEM_SUPER_ADMIN_EMAIL.toLowerCase())) {
          list.unshift({
            uid: 'sys-root-super-admin',
            email: SYSTEM_SUPER_ADMIN_EMAIL,
            displayName: 'FET Secretariat Lead',
            fullLegalName: 'FET Secretariat Super Admin',
            roles: ['super_admin', 'member'],
            primaryRole: 'super_admin',
            role: 'super_admin',
            membershipStatus: 'core_member',
            volunteerStatus: 'active_volunteer',
            donorStatus: 'active_donor',
            status: 'active',
            accountStatus: 'active',
            emailVerified: true,
            profileCompleted: true,
            createdAt: '1994-08-15T00:00:00Z'
          });
        }

        setUsers(list);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Users listener notice:', err);
        setIsLoading(false);
      }
    );

    // 2. Subscribe to System Audit Logs
    const auditQuery = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const auditUnsub = onSnapshot(
      auditQuery,
      (snapshot) => {
        const logs: AuditLog[] = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() } as AuditLog);
        });
        setAuditLogs(logs);
      },
      (err) => {
        console.warn('Audit logs listener notice:', err);
      }
    );

    return () => {
      usersUnsub();
      auditUnsub();
    };
  }, [currentUser, isSuperAdmin]);

  // SECURITY ENFORCEMENT: If user is not authorized super_admin, render 403 Forbidden Gate
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4" id="super-admin-denied-gate">
        <div className="bg-slate-900 border border-rose-800/60 rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800">
              Access Restricted • 403 Unauthorized
            </span>
            <h3 className="text-xl font-bold text-white">Super Admin Clearance Required</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Super Admin Dashboard contains sovereign governance, user management, and security audit logs. Your authenticated account is not assigned the <strong className="text-amber-400 font-mono">super_admin</strong> clearance.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 font-mono text-left">
            <div className="flex justify-between items-center text-slate-400">
              <span>Account:</span>
              <span className="text-slate-200 font-sans font-medium">{currentUser?.email || 'Anonymous'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Assigned Role:</span>
              <span className="text-amber-400 font-sans font-bold">{userProfile?.primaryRole || 'member'}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {onOpenUserDashboard && (
              <button
                onClick={onOpenUserDashboard}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 transition-all shadow-md cursor-pointer"
              >
                Go to Member Portal
              </button>
            )}
            {onReturnToPublic && (
              <button
                onClick={onReturnToPublic}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
              >
                Return to Website
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Aggregate Metrics
  const totalRegisteredUsers = users.length;
  const totalMembers = users.filter(u => u.roles?.includes('member') || u.primaryRole === 'member').length;
  const totalVolunteers = users.filter(u => u.roles?.includes('volunteer') || u.primaryRole === 'volunteer').length;
  const totalDonors = users.filter(u => u.roles?.includes('donor') || u.primaryRole === 'donor').length;
  const totalAdministrators = users.filter(u => 
    u.roles?.includes('super_admin') || 
    u.roles?.includes('administrator') || 
    u.roles?.some(r => r.endsWith('_admin'))
  ).length;
  const pendingApplications = users.filter(u => 
    u.accountStatus === 'pending_verification' || 
    u.accountStatus === 'pending' || 
    !u.profileCompleted
  ).length;

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const queryMatch = 
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.displayName && u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      (u.fullLegalName && u.fullLegalName.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      (u.membershipId && u.membershipId.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      u.uid.toLowerCase().includes(userSearchQuery.toLowerCase());

    const roleMatch = userRoleFilter === 'all' || 
      u.primaryRole === userRoleFilter || 
      u.roles?.includes(userRoleFilter as UserRole);

    const statusMatch = userStatusFilter === 'all' || 
      u.accountStatus === userStatusFilter || 
      u.status === userStatusFilter;

    return queryMatch && roleMatch && statusMatch;
  });

  // Recent Users (last 8)
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 8);

  // Handle Account Status (Suspend / Activate)
  const handleUpdateStatus = async () => {
    if (!selectedUserForStatus || !currentUser) return;
    setIsUpdatingStatus(true);
    setStatusMessage(null);

    const newTargetStatus = selectedUserForStatus.accountStatus === 'suspended' ? 'active' : 'suspended';

    try {
      await updateUserAccountStatus(
        selectedUserForStatus.uid,
        selectedUserForStatus.email,
        newTargetStatus,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'superadmin@fetindia.com',
          role: 'super_admin'
        },
        statusActionReason.trim() || `Administrative ${newTargetStatus} action by Super Admin`
      );

      // Optimistic update
      setUsers(prev => prev.map(u => u.uid === selectedUserForStatus.uid ? {
        ...u,
        status: newTargetStatus,
        accountStatus: newTargetStatus
      } : u));

      setStatusMessage({
        type: 'success',
        text: `Successfully ${newTargetStatus === 'suspended' ? 'suspended' : 'activated'} account ${selectedUserForStatus.email}. Immutable audit record logged.`
      });

      setSelectedUserForStatus(null);
      setStatusActionReason('');
    } catch (err: any) {
      console.error('Status update failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update account status due to security restrictions.'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-amber-200 selection:text-slate-900" id="fet-super-admin-dashboard">
      
      {/* Top Super Admin Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold tracking-tight text-white">
                  FET India Super Admin Console
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Fatimyah Educational Trust • Sovereign Governance Subsystem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">{currentUser?.email}</span>
            </div>

            {onOpenUserDashboard && (
              <button
                onClick={onOpenUserDashboard}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                <span>Member Portal</span>
              </button>
            )}

            {onReturnToPublic && (
              <button
                onClick={onReturnToPublic}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                <span>Public Website</span>
              </button>
            )}

            <button
              onClick={() => {
                signOut();
                if (onReturnToPublic) onReturnToPublic();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Institutional Alert/Status Message */}
        {statusMessage && (
          <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 shadow-xs ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>1. Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <LineChart className="w-4 h-4 text-emerald-400" />
            <span>2. Reports & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. User Management</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-extrabold">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. Role Management (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('coremembers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'coremembers'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-600" />
            <span>4. Core Member Management</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-extrabold">
              {users.filter(u => u.membershipStatus === 'core_member' || u.roles?.includes('core_member')).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>5. Applications (Foundation)</span>
            {pendingApplications > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-extrabold">
                {pendingApplications}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'campaigns'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
            <span>6. Appeals & Crowdfunding</span>
          </button>

          <button
            onClick={() => setActiveTab('donations')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'donations'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BadgeDollarSign className="w-4 h-4 text-amber-400" />
            <span>7. Donors & 80G Center</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'finance'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Landmark className="w-4 h-4 text-emerald-300" />
            <span>8. Finance & Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('hrms')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'hrms'
                ? 'bg-indigo-800 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCog className="w-4 h-4 text-indigo-300" />
            <span>9. HRMS & Staff</span>
          </button>

          <button
            onClick={() => setActiveTab('cms')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'cms'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>10. Homepage CMS</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>11. System Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>12. Audit Logs</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-extrabold">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6" id="super-admin-overview-section">
            
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              
              {/* Total Registered Users */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Users</span>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{totalRegisteredUsers}</div>
                <p className="text-[11px] text-slate-500">Registered Accounts</p>
              </div>

              {/* Total Members */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Members</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-900">{totalMembers}</div>
                <p className="text-[11px] text-emerald-700 font-medium">Standard & Verified</p>
              </div>

              {/* Total Volunteers */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Volunteers</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800">
                    <HeartHandshake className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-900">{totalVolunteers}</div>
                <p className="text-[11px] text-blue-700 font-medium">Field & Community Scope</p>
              </div>

              {/* Total Donors */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-amber-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Donors (80G)</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                    <BadgeDollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-900">{totalDonors}</div>
                <p className="text-[11px] text-amber-700 font-medium">Benefactors & Patrons</p>
              </div>

              {/* Total Administrators */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-indigo-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Administrators</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-indigo-900">{totalAdministrators}</div>
                <p className="text-[11px] text-indigo-700 font-medium">Super & Module Admins</p>
              </div>

              {/* Pending Applications */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-rose-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Pending Review</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-800">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-900">{pendingApplications}</div>
                <p className="text-[11px] text-rose-700 font-medium">KYC & Profiles</p>
              </div>

            </div>

            {/* Quick Actions & Navigation Launchpad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setActiveTab('users')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-800">
                    <Users className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Manage User Accounts</h3>
                <p className="text-xs text-slate-500">
                  Search directory, view detailed user profiles, and manage active or suspended account states.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('roles')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Role & Permission Governance</h3>
                <p className="text-xs text-slate-500">
                  Assign foundation roles (Member, Volunteer, Donor, Administrator, Super Admin) with RBAC precision.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('audit')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                    <FileText className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Review Security Audit Logs</h3>
                <p className="text-xs text-slate-500">
                  Inspect append-only records of all role changes, administrative approvals, and status transitions.
                </p>
              </div>
            </div>

            {/* Recent User Registrations */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent User Registrations</h3>
                  <p className="text-xs text-slate-500">Latest accounts registered on the FET India digital infrastructure.</p>
                </div>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer flex items-center gap-1"
                >
                  <span>View All Users</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Primary Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentUsers.map((u) => {
                      const meta = getRoleMetadata(u.primaryRole);
                      return (
                        <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {u.fullLegalName ? u.fullLegalName[0].toUpperCase() : (u.displayName ? u.displayName[0].toUpperCase() : 'U')}
                              </div>
                              <span className="truncate max-w-[150px]">{u.fullLegalName || u.displayName || 'Trust Member'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${meta.badgeColor}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.accountStatus === 'active' || u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : u.accountStatus === 'suspended' || u.status === 'suspended'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {u.accountStatus || u.status || 'active'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Established'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedUserForProfile(u)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: REPORTS & ANALYTICS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'reports' && (
          <div id="super-admin-reports-section">
            <AdminReportsAnalyticsView />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: USER MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6" id="super-admin-users-section">
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">User Account Management</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Browse registered members, inspect personal KYC & contact records, and manage account statuses.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, email, UID..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">All Roles</option>
                  <option value="member">Member</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="donor">Donor</option>
                  <option value="core_member">Core Member</option>
                  <option value="administrator">Administrator</option>
                  <option value="super_admin">Super Admin</option>
                </select>

                {/* Status Filter */}
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email & UID</th>
                    <th className="py-3 px-4">Roles</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Profile KYC</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSysSuper = u.email.toLowerCase() === SYSTEM_SUPER_ADMIN_EMAIL.toLowerCase();
                      const meta = getRoleMetadata(u.primaryRole);
                      const isSuspended = u.accountStatus === 'suspended' || u.status === 'suspended';

                      return (
                        <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {u.fullLegalName ? u.fullLegalName[0].toUpperCase() : (u.displayName ? u.displayName[0].toUpperCase() : 'U')}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {u.fullLegalName || u.displayName || 'Trust Member'}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {u.membershipId || 'MBR-ID-PENDING'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            <div>{u.email}</div>
                            <div className="text-[10px] text-slate-400">UID: {u.uid.slice(0, 10)}...</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${meta.badgeColor}`}>
                                {meta.label}
                              </span>
                              {u.roles?.filter(r => r !== u.primaryRole).map((r, rIdx) => (
                                <span key={rIdx} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isSuspended
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : u.accountStatus === 'active' || u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {u.accountStatus || u.status || 'active'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              u.profileCompleted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {u.profileCompleted ? 'KYC Complete' : 'Incomplete'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedUserForProfile(u)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                              >
                                View Profile
                              </button>

                              {!isSysSuper && (
                                <button
                                  onClick={() => setSelectedUserForStatus(u)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                    isSuspended
                                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                      : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                                  }`}
                                >
                                  {isSuspended ? 'Activate' : 'Suspend'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: ROLE MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'roles' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6" id="super-admin-roles-section">
            <AdminRolesView />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: CORE MEMBER MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'coremembers' && (
          <AdminCoreMembersView
            users={users}
            onNotify={(msg, type) => {
              setStatusMessage({ type: type || 'success', text: msg });
            }}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: APPLICATION MANAGEMENT (FOUNDATION) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6" id="super-admin-applications-section">
            
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                    <Inbox className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Application Intake & Review Pipeline</h2>
                    <p className="text-xs text-slate-500">
                      Central intake queue for candidate applications across volunteer wings, membership KYC, donor verification, and scholarships.
                    </p>
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 self-start sm:self-auto">
                Foundation Initialized
              </span>
            </div>

            {/* Application Category Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setSelectedAppCategory('volunteer')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedAppCategory === 'volunteer'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Volunteer Applications</span>
              </button>

              <button
                onClick={() => setSelectedAppCategory('membership')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedAppCategory === 'membership'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Membership KYC Submissions</span>
              </button>

              <button
                onClick={() => setSelectedAppCategory('donor')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedAppCategory === 'donor'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BadgeDollarSign className="w-3.5 h-3.5" />
                <span>Donor Applications</span>
              </button>

              <button
                onClick={() => setSelectedAppCategory('education')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedAppCategory === 'education'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Scholarship Grants</span>
              </button>
            </div>

            {/* Application Category Content */}
            {selectedAppCategory === 'volunteer' ? (
              <AdminVolunteerApplicationsView />
            ) : selectedAppCategory === 'donor' ? (
              <AdminDonorApplicationsView />
            ) : selectedAppCategory === 'membership' ? (
              <AdminMembershipApplicationsView />
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-200/80 flex items-center justify-center mx-auto text-slate-500">
                  <Inbox className="w-6 h-6" />
                </div>
                
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-800">
                    Scholarship & Educational Aid Queue
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Application submission pipeline foundation initialized. Once applicant filing workflows are deployed for this module, inbound filings will queue here for Super Admin approval and dispatch.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Intake Schema Ready
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> RBAC Approval Ready
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-600" /> Audit Log Bound
                  </span>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: SYSTEM SETTINGS (FOUNDATION) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6" id="super-admin-settings-section">
            
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">System & Module Configuration Foundation</h2>
                <p className="text-xs text-slate-500">
                  Centralized foundation for platform security policies, maintenance flags, and infrastructure parameters.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
                Architecture Foundation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Security & Multi-Factor Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-700" />
                    <h3 className="text-xs font-bold text-slate-900">Authentication & Security Policy</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enforces email verification, standard member isolation, and cryptographic protection on role elevation.
                </p>
                <div className="pt-2 text-[10px] font-mono text-slate-600">
                  Auth Subsystem: Firebase Auth (Identity Toolkit)
                </div>
              </div>

              {/* Maintenance Mode & Gate */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-700" />
                    <h3 className="text-xs font-bold text-slate-900">Platform Operating State</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Online (Production)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Controls global maintenance bypass, read-only broadcast states, and public initiative gateways.
                </p>
                <div className="pt-2 text-[10px] font-mono text-slate-600">
                  Dispatcher: Normal Ingress Routing
                </div>
              </div>

              {/* Data Persistence & Backup */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-700" />
                    <h3 className="text-xs font-bold text-slate-900">Database & Data Persistence</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Firestore Cloud
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Durable NoSQL document storage with granular RBAC security rules and automatic multi-region synchronization.
                </p>
                <div className="pt-2 text-[10px] font-mono text-slate-600">
                  Rules Mode: Strict Authenticated & Super Admin Gate
                </div>
              </div>

              {/* Cloud Media & Document Storage */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-amber-700" />
                    <h3 className="text-xs font-bold text-slate-900">Cloud Storage & Assets</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                    Storage Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cloud Storage bucket for campaign cover media, cause gallery photos, member avatars, and verification records.
                </p>
                <div className="pt-1 text-[10px] font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200 truncate">
                  gs://{FIREBASE_STORAGE_BUCKET}
                </div>
              </div>

              {/* Communication & Broadcast Gate */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs font-bold text-slate-900">Communications & Dispatch</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Target Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  In-app notifications, broadcast alerts, and transactional email triggers for receipts and certificates.
                </p>
                <div className="pt-2 text-[10px] font-mono text-slate-600">
                  Notification Queue: Live Firestore Feed
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: APPEALS & CROWDFUNDING MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'campaigns' && (
          <div id="super-admin-campaigns-section">
            <AdminCampaignManagementView />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: DONOR & DONATION MANAGEMENT CENTER */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'donations' && (
          <div id="super-admin-donations-section">
            <AdminDonorsManagementView />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 8: FINANCE & ACCOUNTING MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'finance' && (
          <div id="super-admin-finance-section">
            <AdminFinanceAccountingView />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 9: HRMS & STAFF DIRECTORY MANAGEMENT (STEP 47) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'hrms' && (
          <div id="super-admin-hrms-section">
            <AdminStaffHRMSView />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 10: HOMEPAGE CONTENT CMS & LIVE CONTROL (STEP 58) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'cms' && (
          <div id="super-admin-cms-section">
            <AdminCMSView />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 11: AUDIT LOGS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6" id="super-admin-audit-section">
            <AdminAuditView />
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: USER PROFILE DETAIL VIEW */}
      {/* ------------------------------------------------------------- */}
      {selectedUserForProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center">
                  {selectedUserForProfile.fullLegalName ? selectedUserForProfile.fullLegalName[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedUserForProfile.fullLegalName || selectedUserForProfile.displayName || 'Trust Member'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedUserForProfile.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForProfile(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Membership Identifier</span>
                <p className="font-mono font-bold text-slate-900">
                  {selectedUserForProfile.membershipId || 'Pending Assignment'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Firebase UID</span>
                <p className="font-mono text-slate-700 text-[11px] truncate">
                  {selectedUserForProfile.uid}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Mobile Contact</span>
                <p className="font-semibold text-slate-900">
                  {selectedUserForProfile.mobileNumber || 'Not recorded'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Country / Region</span>
                <p className="font-semibold text-slate-900">
                  {selectedUserForProfile.country || 'India'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Blood Group & Emergency</span>
                <p className="font-semibold text-slate-900">
                  {selectedUserForProfile.bloodGroup || 'N/A'} • Emergency: {selectedUserForProfile.emergencyContact || 'None'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Account Status</span>
                <p className="font-semibold text-slate-900 uppercase">
                  {selectedUserForProfile.accountStatus || selectedUserForProfile.status || 'Active'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">Residential Address</span>
                <p className="text-slate-700 leading-relaxed">
                  {selectedUserForProfile.address ? `${selectedUserForProfile.address}, ${selectedUserForProfile.city || ''}, ${selectedUserForProfile.state || ''} - ${selectedUserForProfile.pincode || ''}` : 'Address details not completed'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">Assigned RBAC Roles</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUserForProfile.roles?.map((r, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded text-[11px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedUserForProfile(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: SUSPEND / ACTIVATE ACCOUNT CONFIRMATION */}
      {/* ------------------------------------------------------------- */}
      {selectedUserForStatus && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                selectedUserForStatus.accountStatus === 'suspended'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {selectedUserForStatus.accountStatus === 'suspended' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <UserX className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedUserForStatus.accountStatus === 'suspended' ? 'Activate User Account' : 'Suspend User Account'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedUserForStatus.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedUserForStatus.accountStatus === 'suspended'
                ? 'Re-activating this account will restore member portal access and portal privileges. This action will be recorded in the security audit log.'
                : 'Suspending this account will block portal logins and flag active credentials. This action will be recorded in the security audit log.'}
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Administrative Reason (Required for Audit)</label>
              <textarea
                value={statusActionReason}
                onChange={(e) => setStatusActionReason(e.target.value)}
                placeholder="Enter justification for this status modification..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserForStatus(null);
                  setStatusActionReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer transition-all disabled:opacity-50 ${
                  selectedUserForStatus.accountStatus === 'suspended'
                    ? 'bg-emerald-700 hover:bg-emerald-600'
                    : 'bg-rose-700 hover:bg-rose-600'
                }`}
              >
                {isUpdatingStatus 
                  ? 'Recording...' 
                  : selectedUserForStatus.accountStatus === 'suspended' ? 'Confirm Activation' : 'Confirm Suspension'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
