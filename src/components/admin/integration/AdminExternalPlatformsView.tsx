/**
 * @license
 * External Platform Integration Admin Console (Release 2 - Task 7)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Allows Super Administrators to govern external platform connections
 * (FAT School ERP and FAT Multilingual Platform), inspect connectivity health,
 * and manage tenant isolation protocols.
 */

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  GraduationCap, 
  BookOpen,
  Languages, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  Settings, 
  Server, 
  Activity, 
  Lock, 
  Check, 
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  ExternalPlatformConfig, 
  ExternalPlatformKey 
} from '../../../types';
import { 
  DEFAULT_EXTERNAL_PLATFORMS, 
  fetchExternalPlatformConfigs, 
  checkExternalPlatformHealth 
} from '../../../lib/externalIntegration';
import { ExternalERPConnectionControl } from './ExternalERPConnectionControl';

export const AdminExternalPlatformsView: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'school' | 'madrasa' | 'overview'>('school');
  const [platforms, setPlatforms] = useState<Record<ExternalPlatformKey, ExternalPlatformConfig>>(DEFAULT_EXTERNAL_PLATFORMS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [testingKey, setTestingKey] = useState<ExternalPlatformKey | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingPlatform, setEditingPlatform] = useState<ExternalPlatformConfig | null>(null);
  const [editBaseUrl, setEditBaseUrl] = useState<string>('');
  const [editStatus, setEditStatus] = useState<ExternalPlatformConfig['status']>('active');
  const [editAllowedModules, setEditAllowedModules] = useState<string>('');
  const [editTenantIsolation, setEditTenantIsolation] = useState<boolean>(true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadPlatforms = async () => {
    setIsLoading(true);
    try {
      const data = await fetchExternalPlatformConfigs();
      setPlatforms(data);
    } catch (err: any) {
      console.error('Failed to load platforms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlatforms();
  }, []);

  const handleTestHealth = async (key: ExternalPlatformKey) => {
    setTestingKey(key);
    try {
      const result = await checkExternalPlatformHealth(key);
      setPlatforms((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          healthStatus: result.healthStatus,
          healthMessage: result.message,
          lastHealthCheckAt: result.timestamp
        }
      }));
      showToast(`${prevPlatformName(key)}: ${result.message}`, result.healthStatus === 'connected' ? 'success' : 'error');
    } catch (err: any) {
      showToast(err?.message || 'Health check error', 'error');
    } finally {
      setTestingKey(null);
    }
  };

  const prevPlatformName = (key: ExternalPlatformKey) => {
    if (key === 'school_erp') return 'FET School ERP';
    if (key === 'madrasa_erp') return 'FET Madrasa ERP';
    return 'FET Multilingual Platform';
  };

  const handleOpenEdit = (platform: ExternalPlatformConfig) => {
    setEditingPlatform(platform);
    setEditBaseUrl(platform.baseUrl || '');
    setEditStatus(platform.status);
    setEditAllowedModules(platform.allowedModules.join(', '));
    setEditTenantIsolation(platform.tenantIsolationEnforced);
    setIsEditModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlatform || !currentUser || !isSuperAdmin) return;

    setIsSavingConfig(true);
    try {
      const modulesArray = editAllowedModules
        .split(',')
        .map((m) => m.trim().toLowerCase())
        .filter(Boolean);

      const updates: Partial<ExternalPlatformConfig> = {
        baseUrl: editBaseUrl.trim(),
        status: editStatus,
        allowedModules: modulesArray,
        tenantIsolationEnforced: editTenantIsolation
      };

      const res = await fetch(`/api/integration/platforms/${editingPlatform.platformKey}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          adminEmail: currentUser.email,
          updates
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server error updating platform configuration.');
      }

      setPlatforms((prev) => ({
        ...prev,
        [editingPlatform.platformKey]: {
          ...prev[editingPlatform.platformKey],
          ...updates,
          updatedAt: new Date().toISOString()
        }
      }));

      showToast(`Settings for ${editingPlatform.name} saved successfully.`);
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Error saving config:', err);
      showToast(err?.message || 'Failed to save platform settings.', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const platformKeys: ExternalPlatformKey[] = ['school_erp', 'madrasa_erp', 'multilingual'];

  return (
    <div className="space-y-6" id="admin-external-platforms-view">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-lg transition-all animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700/60'
              : 'bg-rose-900/90 text-rose-100 border-rose-700/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-white/60 hover:text-white cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-md border border-indigo-900/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">
                External Platform Integration Architecture
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Release 2 • Task 7
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Super Admin gateway for governing external trust platforms (FET School ERP, FET Madrasa ERP & FET Multilingual Platform). 
              Enforces multi-tenant school boundaries, connection status, and cryptographic Single Sign-On (SSO).
            </p>
          </div>
        </div>

        <button
          onClick={loadPlatforms}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          <span>Reload Configs</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('school')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'school'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-blue-400" />
          <span>School ERP Connection</span>
        </button>

        <button
          onClick={() => setActiveTab('madrasa')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'madrasa'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Madrasa ERP Connection</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4 text-indigo-400" />
          <span>All Platforms Matrix</span>
        </button>
      </div>

      {/* Section 1: School ERP Connection Control */}
      {activeTab === 'school' && (
        <ExternalERPConnectionControl erpType="school" />
      )}

      {/* Section 2: Madrasa ERP Connection Control */}
      {activeTab === 'madrasa' && (
        <ExternalERPConnectionControl erpType="madrasa" />
      )}

      {/* Section 3: Overview Matrix */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {platformKeys.map((key) => {
              const platform = platforms[key] || DEFAULT_EXTERNAL_PLATFORMS[key];
              const isSchool = key === 'school_erp';
              const isMadrasa = key === 'madrasa_erp';
              const Icon = isSchool ? GraduationCap : isMadrasa ? BookOpen : Languages;
              const isTesting = testingKey === key;

          return (
            <div
              key={key}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Platform Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        isSchool
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {platform.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Key: {platform.platformKey}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        platform.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : platform.status === 'maintenance'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {platform.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {platform.description}
                </p>

                {/* Details Table */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Gateway Base URL:</span>
                    <span className="font-mono text-slate-800 font-bold truncate max-w-[240px]">
                      {platform.baseUrl || 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Authentication Protocol:</span>
                    <span className="font-semibold text-indigo-700">
                      HMAC-SHA256 Signed Token Exchange
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Tenant Isolation:</span>
                    <span className="font-bold flex items-center gap-1 text-slate-800">
                      {platform.tenantIsolationEnforced ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Strictly Enforced
                        </>
                      ) : (
                        'Global / Shared Catalog'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Connectivity Health:</span>
                    <span className="font-bold flex items-center gap-1">
                      {platform.healthStatus === 'connected' && (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
                        </span>
                      )}
                      {platform.healthStatus === 'service_unavailable' && (
                        <span className="text-amber-700 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Degraded
                        </span>
                      )}
                      {platform.healthStatus === 'disconnected' && (
                        <span className="text-rose-700 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Disconnected
                        </span>
                      )}
                      {platform.healthStatus === 'configuration_missing' && (
                        <span className="text-slate-500">Unconfigured</span>
                      )}
                    </span>
                  </div>
                  {platform.healthMessage && (
                    <div className="text-[11px] text-slate-500 font-sans italic pt-1">
                      Status note: {platform.healthMessage}
                    </div>
                  )}
                </div>

                {/* Allowed Modules Tags */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Authorized Integration Modules
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {platform.allowedModules.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-medium border border-slate-200"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTestHealth(key)}
                  disabled={isTesting}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Pinging Gateway...' : 'Test Connection'}</span>
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => handleOpenEdit(platform)}
                    className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Configure Platform</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration Architectural Principles Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          FET India External Platform Integration Constitution
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li><strong>Zero Platform Duplication:</strong> Specialized student, attendance, and translation modules remain owned by the existing external platforms. FET India acts solely as the secure entry point.</li>
          <li><strong>HMAC-SHA256 Token Expiry:</strong> SSO handoff tokens expire after 300 seconds and are verifiable using server-held cryptographic keys. No private credentials or database secrets are ever passed to client browsers.</li>
          <li><strong>Strict Tenant Isolation:</strong> School administrators can only initiate handoff to their authorized school tenant. Cross-tenant escalation is blocked server-side.</li>
          <li><strong>Graceful Degradation:</strong> If an external platform experiences downtime, FET India continues running smoothly and displays clear user-friendly maintenance status.</li>
        </ul>
      </div>
      </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIGURE EXTERNAL PLATFORM (Super Admin Only) */}
      {/* ============================================================== */}
      {isEditModalOpen && editingPlatform && isSuperAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold">Configure {editingPlatform.name}</h3>
                  <p className="text-xs text-slate-300">
                    Platform settings and authorization parameters.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Platform Base URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={editBaseUrl}
                  onChange={(e) => setEditBaseUrl(e.target.value)}
                  placeholder="https://school.fetindia.org"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Root domain or gateway endpoint where SSO handoffs are routed.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Platform Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active (Available for Users & Admins)</option>
                  <option value="maintenance">Maintenance (Displays Notice)</option>
                  <option value="disabled">Disabled (Offline)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Allowed Modules (Comma Separated)
                </label>
                <input
                  type="text"
                  value={editAllowedModules}
                  onChange={(e) => setEditAllowedModules(e.target.value)}
                  placeholder="admissions, attendance, timetables, teachers, library"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {editingPlatform.platformKey === 'school_erp' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-900 block">Enforce Tenant Isolation</span>
                    <span className="text-[11px] text-blue-700 block mt-0.5">
                      Restrict School Admins strictly to their assigned school code.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editTenantIsolation}
                    onChange={(e) => setEditTenantIsolation(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSavingConfig ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Settings...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Platform Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
