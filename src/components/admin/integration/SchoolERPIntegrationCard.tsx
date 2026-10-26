/**
 * @license
 * FAT School ERP Integration Portal Card (Release 2 - Task 7)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides secure Single Sign-On (SSO) handoff, school tenant isolation,
 * deep linking to independent FAT School ERP modules, and return navigation.
 */

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  ArrowRight, 
  Building2, 
  Users, 
  Calendar, 
  BookOpen, 
  Bus, 
  Sparkles,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  checkExternalPlatformHealth, 
  initiatePlatformSSOHandoff, 
  DEFAULT_EXTERNAL_PLATFORMS,
  verifySchoolTenantAccess
} from '../../../lib/externalIntegration';
import { ExternalPlatformConfig } from '../../../types';
import { INSTITUTION_OPTIONS } from '../fees/FeeManagementView';

interface SchoolERPIntegrationCardProps {
  onReturnToFETIndia?: () => void;
}

export const SchoolERPIntegrationCard: React.FC<SchoolERPIntegrationCardProps> = () => {
  const { currentUser, userProfile, isSuperAdmin } = useAuth();

  const [platformConfig, setPlatformConfig] = useState<ExternalPlatformConfig>(DEFAULT_EXTERNAL_PLATFORMS.school_erp);
  const [healthStatus, setHealthStatus] = useState<ExternalPlatformConfig['healthStatus']>('connected');
  const [healthMessage, setHealthMessage] = useState<string>('Platform API gateway operational');
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  // Tenant / School selection
  const schoolOptions = INSTITUTION_OPTIONS.filter((i) => i.type === 'school');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schoolOptions[0]?.id || 'SCH-01');

  // Launch state
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [showHandoffModal, setShowHandoffModal] = useState<boolean>(false);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);

  // Tenant access verification
  const isTenantAuthorized = verifySchoolTenantAccess(userProfile, isSuperAdmin, selectedSchoolId);
  const selectedSchool = schoolOptions.find((s) => s.id === selectedSchoolId) || schoolOptions[0];

  // Refresh health
  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    setLaunchError(null);
    try {
      const res = await checkExternalPlatformHealth('school_erp');
      setHealthStatus(res.healthStatus);
      setHealthMessage(res.message);
    } catch (err: any) {
      setHealthStatus('disconnected');
      setHealthMessage(err?.message || 'Connection test failed');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    handleCheckHealth();
  }, []);

  // Launch FAT School ERP with SSO handoff
  const handleLaunchERP = async (moduleTarget?: string) => {
    if (!currentUser) return;
    if (!isTenantAuthorized) {
      setLaunchError(`Tenant Isolation Notice: You are not authorized to manage ${selectedSchool.name}. Only verified school administrators and super admins may access this tenant.`);
      return;
    }

    setIsLaunching(true);
    setLaunchError(null);

    try {
      const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://fetindia.org';
      const result = await initiatePlatformSSOHandoff({
        targetPlatform: 'school_erp',
        targetTenantId: selectedSchoolId,
        targetResourceId: moduleTarget,
        resourceAccessLevel: isSuperAdmin ? 'admin' : 'student',
        userUid: currentUser.uid,
        userEmail: currentUser.email || 'unknown@fetindia.org',
        userName: userProfile?.displayName || userProfile?.fullName || 'FET Administrator',
        userRole: userProfile?.primaryRole || 'school_admin',
        returnUrl: currentUrl
      });

      if (result.success && result.handoffUrl) {
        setHandoffUrl(result.handoffUrl);
        setShowHandoffModal(true);
      } else {
        throw new Error(result.error || 'Failed to generate secure SSO handoff token.');
      }
    } catch (err: any) {
      console.error('School ERP launch error:', err);
      setLaunchError(err?.message || 'Could not launch FAT School ERP. Please check network connectivity.');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleProceedToExternal = () => {
    if (handoffUrl) {
      window.location.href = handoffUrl;
    }
  };

  const erpModules = [
    { id: 'admissions', label: 'Admissions & Enrollment', icon: Users, desc: 'Student intake, KYC verification & cohorts' },
    { id: 'attendance', label: 'Student & Staff Attendance', icon: CheckCircle2, desc: 'Daily attendance logs & biometric sync' },
    { id: 'timetables', label: 'Class Timetables & Calendar', icon: Calendar, desc: 'Academic terms, periods & teacher schedules' },
    { id: 'teachers', label: 'Faculty & Teacher Directory', icon: GraduationCap, desc: 'Staff qualifications & lesson planning' },
    { id: 'library', label: 'School Library Records', icon: BookOpen, desc: 'Book cataloging & student lending ledger' },
    { id: 'transport', label: 'Bus Transit & Commuting', icon: Bus, desc: 'Bus routes, GPS tracking & driver rosters' }
  ];

  return (
    <div className="space-y-6" id="fat-school-erp-integration-card">
      {/* Platform Status Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md border border-blue-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  FAT School ERP Platform Integration
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  External Independent System
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Seamless single-sign-on (SSO) gateway connecting FET India to the independent FAT School ERP. 
                Preserves multi-tenant school isolation and returns seamlessly to FET India.
              </p>
            </div>
          </div>

          {/* Health Badge & Refresh */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold">
              {healthStatus === 'connected' && (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ERP Connected
                </span>
              )}
              {healthStatus === 'service_unavailable' && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Service Degraded
                </span>
              )}
              {healthStatus === 'disconnected' && (
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  Disconnected
                </span>
              )}
              {healthStatus === 'configuration_missing' && (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Config Pending
                </span>
              )}
            </div>

            <button
              onClick={handleCheckHealth}
              disabled={isCheckingHealth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              title="Ping ERP Gateway"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {launchError && (
          <div className="mt-4 p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>{launchError}</p>
          </div>
        )}
      </div>

      {/* Tenant Selector & Launch Control Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              School Tenant Access & Authentication Handoff
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the affiliated trust school tenant you are authorized to govern.
            </p>
          </div>

          {/* School Tenant Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Target Tenant:</span>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {schoolOptions.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.name} ({sch.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tenant Isolation Status Indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl gap-3">
          <div className="flex items-center gap-2 text-xs">
            {isTenantAuthorized ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Tenant Access Authorized
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-rose-800 font-bold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                <Lock className="w-4 h-4 text-rose-600" />
                Tenant Isolated (Restricted Scope)
              </span>
            )}
            <span className="text-slate-600 text-[11px]">
              Logged in as <strong className="text-slate-900">{userProfile?.displayName || currentUser?.email}</strong>
            </span>
          </div>

          <button
            onClick={() => handleLaunchERP()}
            disabled={isLaunching || !isTenantAuthorized}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isLaunching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating SSO...</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                <span>Launch {selectedSchool.name} ERP</span>
              </>
            )}
          </button>
        </div>

        {/* Module Deep Links Grid */}
        <div>
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            FAT School ERP Specialized Operations
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {erpModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  onClick={() => handleLaunchERP(mod.id)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/40 transition-all cursor-pointer group flex items-start gap-3 shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h6 className="text-xs font-bold text-slate-900 group-hover:text-blue-900 truncate">
                        {mod.label}
                      </h6>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {mod.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Single Sign-On Architecture: The external FAT School ERP maintains its own database, faculty records, student registers, and class operations.
        </div>
      </div>

      {/* Transition Modal */}
      {showHandoffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-slate-200 space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <GraduationCap className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Opening FAT School ERP
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You are transitioning to the independent FAT School ERP portal for{' '}
                <strong className="text-slate-800">{selectedSchool.name}</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1">
              <p><span className="text-slate-500">Authenticated Identity:</span> <strong className="text-slate-800">{currentUser?.email}</strong></p>
              <p><span className="text-slate-500">Authorized Tenant:</span> <strong className="font-mono text-blue-700">{selectedSchoolId}</strong></p>
              <p><span className="text-slate-500">Return URL:</span> <span className="text-slate-600 truncate block text-[11px]">FET India Primary Portal</span></p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowHandoffModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToExternal}
                className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <span>Proceed to ERP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
