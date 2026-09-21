/**
 * @license
 * Full-Stack Administrative Console
 * Fatimyah Educational Trust India
 */

import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Layers, 
  Palette, 
  ShieldCheck, 
  FileText, 
  Bell, 
  ArrowLeft, 
  LogOut, 
  Lock, 
  Sparkles, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Building,
  Smartphone,
  ExternalLink,
  ChevronRight,
  HeartHandshake,
  Users,
  BadgeDollarSign,
  Award,
  GraduationCap,
  BookOpen,
  Landmark,
  UserCog,
  Newspaper,
  ShoppingBag,
  Plane,
  LineChart,
  Building2
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { AdminCMSView } from './AdminCMSView';
import { AdminAboutTrustCMSView } from './AdminAboutTrustCMSView';
import { AdminModulesView } from './AdminModulesView';
import { AdminRolesView } from './AdminRolesView';
import { AdminAuditView } from './AdminAuditView';
import { AdminNotificationsView } from './AdminNotificationsView';
import { AdminSpecializedConsoles } from './AdminSpecializedConsoles';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { useModules } from '../../contexts/ModuleContext';
import { ADMIN_ROLE_DEFINITIONS } from '../../data/initialData';

interface AdminConsoleProps {
  initialView?: string;
  onReturnToPublic: () => void;
  onOpenAuth?: () => void;
  onOpenUserDashboard?: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ 
  initialView = 'dashboard', 
  onReturnToPublic,
  onOpenAuth,
  onOpenUserDashboard
}) => {
  const { config } = useConfig();
  const { currentUser, userProfile, activeRole, setActiveRole, isSuperAdmin, hasAdminAccess, signOut, isLoading } = useAuth();
  const { modules, lifecycleStats } = useModules();

  const isExaminer = activeRole === 'examiner' || userProfile?.roles?.includes('examiner');
  const isExamController = activeRole === 'exam_controller' || userProfile?.roles?.includes('exam_controller');
  const isExamPersonnel = isExaminer || isExamController;
  const isExamPersonnelOnly = !isSuperAdmin && Boolean(isExamPersonnel) && !userProfile?.roles?.some(r => ['super_admin', 'platform_super_admin'].includes(r));
  const effectiveInitialView = (isExamPersonnelOnly && (initialView === 'dashboard' || initialView === 'super_admin')) ? 'exams' : initialView;

  const [currentView, setCurrentView] = useState<string>(effectiveInitialView);

  // Security enforcement: lock Exam Personnel strictly to exams view
  React.useEffect(() => {
    if (isExamPersonnelOnly && currentView !== 'exams') {
      setCurrentView('exams');
    }
  }, [isExamPersonnelOnly, currentView]);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white" id="fet-admin-loading">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">Verifying Administrative Clearance...</p>
        <p className="text-xs text-slate-500 mt-1">Fatimyah Educational Trust Security Subsystem</p>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4" id="fet-admin-unauth-gate">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Administrator Sign-In Required</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The FET India Administrative System contains privileged governance, CMS, and module controls. Please sign in with an authorized administrator account to proceed.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 transition-all shadow-md active:scale-98 cursor-pointer"
              >
                Sign In as Administrator
              </button>
            )}
            <button
              onClick={onReturnToPublic}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
            >
              Return to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unauthorized State (Authenticated user without administrative clearance)
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4" id="fet-admin-denied-gate">
        <div className="bg-slate-900 border border-rose-900/40 rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="text-center space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800">
              Access Restricted • 403 Forbidden
            </span>
            <h3 className="text-xl font-bold text-white">Administrative Clearance Required</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your account is authenticated, but does not possess Super Administrator or Role Administrator privileges. Standard registration accounts cannot access internal administrative modules.
            </p>
          </div>

          {/* Account Details Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 font-mono">
            <div className="flex justify-between items-center text-slate-400">
              <span>Account Email:</span>
              <span className="text-slate-200 font-sans font-medium truncate max-w-[200px]">{currentUser.email}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Firebase UID:</span>
              <span className="text-emerald-400 text-[11px] truncate max-w-[180px]">{currentUser.uid}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Assigned Role(s):</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-sans font-bold text-[11px]">
                {userProfile?.roles?.join(', ') || 'user'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            If you are an official Trust coordinator or department head, please contact the Super Administrator ({config.contactEmail || 'Trust Administration'}) to grant role permissions for your portfolio.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {onOpenUserDashboard && (
              <button
                onClick={onOpenUserDashboard}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 transition-all shadow-md cursor-pointer"
              >
                Go to Member Dashboard
              </button>
            )}
            <button
              onClick={onReturnToPublic}
              className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
            >
              Return to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const coreAdminItems = [
    { id: 'super_admin', label: 'Super Admin Dashboard', icon: ShieldCheck, description: 'Overview, Users, RBAC, Apps, Settings & Audit', requiresSuper: true },
    { id: 'dashboard', label: 'Platform Overview', icon: Activity, description: 'Health, active series & stats' },
    { id: 'about_cms', label: 'About Trust CMS & Leadership', icon: Building2, description: 'Overview, Governance, Trustees, Seal & Tax 12A/80G', requiresSuper: true },
    { id: 'cms', label: 'Branding & Dynamic CMS', icon: Palette, description: 'Display name, 3 colors, hero sliders (Legal name locked)', requiresSuper: true },
    { id: 'modules', label: '27-Chapter Lifecycle Matrix', icon: Layers, description: '5-Stage state machine (Draft, Testing, Ready, Published, Disabled)', requiresSuper: true },
    { id: 'roles', label: 'RBAC Multi-Role Governance', icon: ShieldCheck, description: 'Super & 13 Administrator scopes', requiresSuper: true },
    { id: 'audit', label: 'Audit & Activity Logs', icon: FileText, description: 'Immutable transaction records' },
    { id: 'notifications', label: 'Broadcast Center', icon: Bell, description: 'Global and role announcements' }
  ];

  const specializedAdminItems = [
    { id: 'volunteers', label: 'Volunteer Management', icon: HeartHandshake, role: 'volunteer_admin' },
    { id: 'members', label: 'Membership Management', icon: Users, role: 'member_admin' },
    { id: 'donors', label: 'Donations & 80G Receipts', icon: BadgeDollarSign, role: 'donor_admin' },
    { id: 'crowdfunding', label: 'Crowdfunding & Appeals', icon: HeartHandshake, role: 'crowdfunding_admin' },
    { id: 'exams', label: 'Competitions & Exams', icon: Award, role: 'exam_admin' },
    { id: 'school', label: 'School ERP', icon: GraduationCap, role: 'school_admin' },
    { id: 'madrasa', label: 'Madrasa ERP', icon: BookOpen, role: 'madrasa_admin' },
    { id: 'finance', label: 'Finance & Accounting', icon: Landmark, role: 'finance_admin' },
    { id: 'hrms', label: 'HRMS & Staff', icon: UserCog, role: 'hr_admin' },
    { id: 'blog', label: 'Blog, Press & News', icon: Newspaper, role: 'blog_admin' },
    { id: 'store', label: 'FET Store (Pre-Launch)', icon: ShoppingBag, role: 'store_admin', badge: 'Pre-Architected' },
    { id: 'travel', label: 'FET Travel (Pre-Launch)', icon: Plane, role: 'travel_admin', badge: 'Pre-Architected' },
    { id: 'reports', label: 'Reports & Analytics', icon: LineChart, role: 'reports_admin' }
  ];

  // Filter specialized items based on user's roles
  const allowedSpecializedItems = specializedAdminItems.filter(item => {
    if (isSuperAdmin) return true;
    if (isExamPersonnelOnly) {
      return item.id === 'exams';
    }
    if (item.id === 'exams' && (isExamPersonnel || activeRole === 'exam_admin' || userProfile?.roles?.includes('exam_admin'))) return true;
    return activeRole === item.role || userProfile?.roles?.includes(item.role as any);
  });

  const allAdminItems = [...coreAdminItems, ...specializedAdminItems];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col" id="fet-admin-console-root">
      
      {/* Top Admin Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onReturnToPublic}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              id="admin-return-public-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Public Portal</span>
            </button>

            <div className="h-5 w-px bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <FETLogo size="sm" showTagline={false} />
              <span className="text-xs font-bold text-amber-400 hidden md:inline">
                • Administrative System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-slate-400">Active Scope:</span>
              <span className="font-bold text-emerald-400">
                {ADMIN_ROLE_DEFINITIONS[activeRole]?.label || activeRole}
              </span>
              {isSuperAdmin && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500 text-slate-950">
                  Super Admin
                </span>
              )}
            </div>

            <button
              onClick={() => {
                signOut();
                onReturnToPublic();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Mobile View Switcher (< lg screens) */}
        <div className="lg:hidden col-span-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-3 space-y-2" id="admin-mobile-nav-bar">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Active Console:</span>
            <span className="text-emerald-800 font-extrabold flex items-center gap-1.5">
              {allAdminItems.find(i => i.id === currentView)?.label || currentView}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={currentView}
              onChange={(e) => setCurrentView(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              id="admin-mobile-view-select"
            >
              {!isExamPersonnelOnly && (
                <optgroup label="Super Admin Governance">
                  {coreAdminItems.map((item) => (
                    <option 
                      key={item.id} 
                      value={item.id}
                      disabled={item.requiresSuper && !isSuperAdmin}
                    >
                      {item.label} {item.requiresSuper && !isSuperAdmin ? '(Locked)' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={isExamPersonnelOnly ? "Examination Authority" : "Specialized Consoles"}>
                {allowedSpecializedItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Desktop Sidebar Nav (3 Cols) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          
          {/* Master Super Admin Menu */}
          {!isExamPersonnelOnly && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Super Admin Control
              </div>
              {coreAdminItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const isLocked = item.requiresSuper && !isSuperAdmin;
                return (
                  <button
                    key={item.id}
                    onClick={() => !isLocked && setCurrentView(item.id)}
                    disabled={isLocked}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isActive 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    id={`admin-nav-${item.id}`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span className="truncate">{item.label}</span>
                        {isLocked && <Lock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Specialized Portfolios Menu */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 space-y-1 max-h-[380px] overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Specialized Consoles ({allowedSpecializedItems.length})
            </div>
            {allowedSpecializedItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-800 text-white shadow-md' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  id={`admin-nav-${item.id}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      isActive ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-900'
                    }`}>
                      Pre-Launch
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legal Entity Protection Box */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Protected Legal Entity</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              <strong>{config.legalName}</strong> is registered under the Public Trusts Act. The legal identity cannot be modified via dynamic CMS.
            </p>
          </div>
        </aside>

        {/* Main Content View (9 Cols) */}
        <main className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
          
          {/* Dashboard Overview */}
          {currentView === 'dashboard' && (
            <div className="space-y-8" id="admin-dashboard-view">
              <div className="border-b border-slate-200 pb-5">
                <h2 className="text-xl font-extrabold text-slate-900">FET India Administrative Control Center</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Platform architecture telemetry, 27-chapter lifecycle status, and administrator governance.
                </p>
              </div>

              {/* Status Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Architecture</span>
                  <div className="text-2xl font-black text-slate-900">27 Chapters</div>
                  <span className="text-[11px] text-emerald-700 font-semibold">Master SRS Matrix</span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-800">Published Modules</span>
                  <div className="text-2xl font-black text-emerald-900">
                    {lifecycleStats.published} Live
                  </div>
                  <span className="text-[11px] text-emerald-800 font-semibold">Public & User Visible</span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-blue-800">Ready / Testing</span>
                  <div className="text-2xl font-black text-blue-900">
                    {lifecycleStats.ready + lifecycleStats.testing} Modules
                  </div>
                  <span className="text-[11px] text-blue-800 font-semibold">Controlled Sandbox</span>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-800">Disabled Modules</span>
                  <div className="text-2xl font-black text-amber-900">
                    {lifecycleStats.disabled} Modules
                  </div>
                  <span className="text-[11px] text-amber-800 font-semibold">Store & Travel (Pre-Launch)</span>
                </div>
              </div>

              {/* Quick Launchpad to Sub-consoles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div 
                  onClick={() => setCurrentView('modules')}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                      <Layers className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">27-Chapter Lifecycle Engine</h3>
                  <p className="text-xs text-slate-500">
                    Sovereign Super Admin controls: DRAFT, TESTING, READY, PUBLISHED, and DISABLED states.
                  </p>
                </div>

                <div 
                  onClick={() => setCurrentView('cms')}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800">
                      <Palette className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Dynamic Branding & CMS</h3>
                  <p className="text-xs text-slate-500">
                    Configure brand name, 3 colors, hero sliders, while keeping legal entity strictly locked.
                  </p>
                </div>

                <div 
                  onClick={() => setCurrentView('roles')}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-800">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">RBAC Multi-Role Governance</h3>
                  <p className="text-xs text-slate-500">
                    Assign and revoke 13 specialized administrative portfolios with immutable audit logging.
                  </p>
                </div>

                <div 
                  onClick={() => setCurrentView('audit')}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                      <FileText className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">System Audit Logs</h3>
                  <p className="text-xs text-slate-500">
                    Review tamper-proof records of admin interventions, state changes, and security events.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Sub-Views */}
          {currentView === 'super_admin' && (
            <SuperAdminDashboard 
              onReturnToPublic={onReturnToPublic} 
              onOpenUserDashboard={onOpenUserDashboard} 
            />
          )}
          {currentView === 'about_cms' && <AdminAboutTrustCMSView />}
          {currentView === 'cms' && <AdminCMSView />}
          {currentView === 'modules' && <AdminModulesView />}
          {currentView === 'roles' && <AdminRolesView />}
          {currentView === 'audit' && <AdminAuditView />}
          {currentView === 'notifications' && <AdminNotificationsView />}

          {/* Specialized Sub-Views */}
          {[
            'volunteers', 
            'members', 
            'donors', 
            'crowdfunding', 
            'exams', 
            'school', 
            'madrasa', 
            'finance', 
            'hrms', 
            'blog', 
            'store', 
            'travel', 
            'reports'
          ].includes(currentView) && (
            <AdminSpecializedConsoles currentTab={currentView} />
          )}

        </main>
      </div>

    </div>
  );
};
