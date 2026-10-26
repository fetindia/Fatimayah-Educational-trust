/**
 * @license
 * External ERP Connection Control (Super Admin Foundation)
 * Fatimyah Educational Trust India (FET India)
 * 
 * FET India does NOT contain embedded School ERP or Madrasa ERP dashboards.
 * The separate FET School ERP and FET Madrasa ERP platforms will be developed
 * and deployed separately around March/April 2027.
 * 
 * This component provides ONLY the connection/status controls:
 * - Status: Connected / Not Connected
 * - Not Connected: Show Connect
 * - Connected: Show Open ERP & Disconnect
 * 
 * Disconnect NEVER deletes external ERP data, student, teacher, or academic records.
 * Connect / Disconnect is strictly restricted to authorized Super Admin users.
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Unlink,
  Link,
  Calendar,
  Lock,
  Info,
  Server,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export type ERPType = 'school' | 'madrasa';

interface ExternalERPConnectionControlProps {
  erpType: ERPType;
  onNavigateTab?: (tab: string) => void;
}

interface ERPConnectionConfig {
  isConnected: boolean;
  connectedAt?: string;
  connectedByEmail?: string;
  externalUrl?: string;
  notes?: string;
}

const STORAGE_KEYS: Record<ERPType, string> = {
  school: 'fet_school_erp_connection_status',
  madrasa: 'fet_madrasa_erp_connection_status'
};

const FIRESTORE_DOC_IDS: Record<ERPType, string> = {
  school: 'fet_school_erp',
  madrasa: 'fet_madrasa_erp'
};

export const ExternalERPConnectionControl: React.FC<ExternalERPConnectionControlProps> = ({ erpType }) => {
  const { currentUser, isSuperAdmin, userProfile } = useAuth();

  const isSchool = erpType === 'school';
  const erpTitle = isSchool ? 'School ERP' : 'Madrasa ERP';
  const erpFullTitle = isSchool ? 'FET School ERP' : 'FET Madrasa ERP';
  const erpIcon = isSchool ? GraduationCap : BookOpen;
  const erpColor = isSchool ? 'blue' : 'emerald';

  const [connectionConfig, setConnectionConfig] = useState<ERPConnectionConfig>({
    isConnected: false,
    externalUrl: ''
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState<boolean>(false);
  const [showOpenInfoModal, setShowOpenInfoModal] = useState<boolean>(false);

  // Connect Form State
  const [inputUrl, setInputUrl] = useState<string>('');
  const [inputNotes, setInputNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load connection state from Firestore with localStorage fallback
  useEffect(() => {
    let isMounted = true;
    const loadConnection = async () => {
      setIsLoading(true);
      try {
        // 1. Try Firestore
        const docRef = doc(db, 'integration_platforms', FIRESTORE_DOC_IDS[erpType]);
        const snap = await getDoc(docRef).catch(() => null);

        if (snap && snap.exists()) {
          const data = snap.data();
          if (isMounted) {
            setConnectionConfig({
              isConnected: data.status === 'connected' || data.connectionStatus === 'connected',
              connectedAt: data.connectedAt,
              connectedByEmail: data.connectedByEmail,
              externalUrl: data.baseUrl || data.externalUrl || '',
              notes: data.notes || ''
            });
            setInputUrl(data.baseUrl || data.externalUrl || '');
          }
        } else {
          // 2. Check localStorage fallback
          const localVal = localStorage.getItem(STORAGE_KEYS[erpType]);
          if (localVal) {
            try {
              const parsed = JSON.parse(localVal);
              if (isMounted) {
                setConnectionConfig(parsed);
                setInputUrl(parsed.externalUrl || '');
              }
            } catch {
              // Ignore parse error
            }
          }
        }
      } catch (err) {
        console.warn(`Could not load connection for ${erpTitle}:`, err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadConnection();
    return () => {
      isMounted = false;
    };
  }, [erpType, erpTitle]);

  // Handle Connect
  const handleConfirmConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMessage('Access Denied: Only authorized Super Admins may configure external ERP connections.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const newConfig: ERPConnectionConfig = {
      isConnected: true,
      connectedAt: new Date().toISOString(),
      connectedByEmail: currentUser?.email || 'super_admin@fetindia.org',
      externalUrl: inputUrl.trim(),
      notes: inputNotes.trim()
    };

    try {
      // 1. Persist to Firestore
      const docRef = doc(db, 'integration_platforms', FIRESTORE_DOC_IDS[erpType]);
      await setDoc(docRef, {
        platformKey: isSchool ? 'school_erp' : 'madrasa_erp',
        name: erpFullTitle,
        status: 'connected',
        connectionStatus: 'connected',
        baseUrl: inputUrl.trim(),
        connectedAt: newConfig.connectedAt,
        connectedByEmail: newConfig.connectedByEmail,
        notes: inputNotes.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((firestoreErr) => {
        console.warn('Firestore write warning:', firestoreErr);
      });

      // 2. Persist to localStorage
      localStorage.setItem(STORAGE_KEYS[erpType], JSON.stringify(newConfig));

      setConnectionConfig(newConfig);
      setShowConnectModal(false);
      showToast(`${erpFullTitle} successfully connected! Connection configuration established.`);
    } catch (err: any) {
      console.error('Failed to establish connection:', err);
      setErrorMessage(err?.message || 'Failed to save connection configuration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Disconnect
  // MUST NEVER delete School ERP data, Madrasa ERP data, student, teacher, attendance, fee, or academic data!
  const handleConfirmDisconnect = async () => {
    if (!isSuperAdmin) {
      showToast('Access Denied: Only authorized Super Admins may disconnect external ERPs.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newConfig: ERPConnectionConfig = {
        isConnected: false,
        connectedAt: undefined,
        connectedByEmail: undefined,
        externalUrl: '',
        notes: ''
      };

      // 1. Update Firestore (update status to not_connected, NO data deletion!)
      const docRef = doc(db, 'integration_platforms', FIRESTORE_DOC_IDS[erpType]);
      await setDoc(docRef, {
        platformKey: isSchool ? 'school_erp' : 'madrasa_erp',
        name: erpFullTitle,
        status: 'not_connected',
        connectionStatus: 'not_connected',
        baseUrl: '',
        disconnectedAt: new Date().toISOString(),
        disconnectedByEmail: currentUser?.email || 'super_admin@fetindia.org',
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((firestoreErr) => {
        console.warn('Firestore disconnect warning:', firestoreErr);
      });

      // 2. Update localStorage
      localStorage.removeItem(STORAGE_KEYS[erpType]);

      setConnectionConfig(newConfig);
      setInputUrl('');
      setInputNotes('');
      setShowDisconnectModal(false);
      showToast(`${erpFullTitle} disconnected. FET India connection removed. All external data remains safe and preserved.`);
    } catch (err: any) {
      console.error('Failed to disconnect:', err);
      showToast(err?.message || 'Failed to update disconnect status.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Open ERP
  const handleOpenERP = () => {
    const targetUrl = connectionConfig.externalUrl?.trim();
    if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
      // Open the separately deployed FET School ERP / Madrasa ERP
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      // No live production URL configured yet (separate platforms deploy March/April 2027)
      setShowOpenInfoModal(true);
    }
  };

  const Icon = erpIcon;

  return (
    <div className="space-y-6" id={`fet-${erpType}-erp-connection-control`}>
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-lg transition-all animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700/60'
              : notification.type === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-700/60'
              : 'bg-slate-900/90 text-slate-100 border-slate-700/60'
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

      {/* Main Connection Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isSchool
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {erpTitle}
                </h2>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold">
                  External Standalone Platform
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                {isSchool
                  ? 'The independent FET School ERP product will be developed and launched separately around March/April 2027. FET India contains only the external connection control.'
                  : 'The independent FET Madrasa ERP product will be developed and launched separately around March/April 2027. FET India contains only the external connection control.'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Connection Status
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border shadow-2xs ${
                connectionConfig.isConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {connectionConfig.isConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Connected
                </>
              ) : (
                <>
                  <Unlink className="w-3.5 h-3.5 text-slate-400" />
                  Not Connected
                </>
              )}
            </span>
          </div>
        </div>

        {/* State Summary & Connection Details */}
        {isLoading ? (
          <div className="py-8 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />
            <span className="text-xs font-medium">Checking connection state...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {connectionConfig.isConnected ? (
              // CONNECTED STATE
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{erpFullTitle} is Connected to FET India</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-400 block font-medium text-[11px]">External Target URL</span>
                    <span className="font-mono font-bold text-slate-900 truncate block mt-0.5">
                      {connectionConfig.externalUrl || '(Production URL pending deployment)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium text-[11px]">Connected By (Super Admin)</span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {connectionConfig.connectedByEmail || 'Super Admin'}
                    </span>
                  </div>
                  {connectionConfig.connectedAt && (
                    <div>
                      <span className="text-slate-400 block font-medium text-[11px]">Connection Established</span>
                      <span className="font-medium text-slate-800 block mt-0.5">
                        {new Date(connectionConfig.connectedAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block font-medium text-[11px]">Target Launch Window</span>
                    <span className="font-bold text-indigo-700 block mt-0.5">
                      March / April 2027 (Series 2 Release)
                    </span>
                  </div>
                </div>

                {connectionConfig.notes && (
                  <div className="pt-2 border-t border-emerald-200/60 text-emerald-950 text-[11px]">
                    <span className="font-bold">Configuration Notes:</span> {connectionConfig.notes}
                  </div>
                )}
              </div>
            ) : (
              // NOT CONNECTED STATE
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Info className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Platform Not Connected</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  The {erpFullTitle} external platform connection is not currently established. Authorized Super Admins can establish the connection foundation below without affecting existing FET India systems.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Separate product scheduled for standalone deployment in March/April 2027.</span>
                </div>
              </div>
            )}

            {/* Super Admin Security Notice */}
            {!isSuperAdmin && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Super Admin Governance Only:</strong> Connecting, disconnecting, and configuring external ERP platforms is strictly restricted to authorized Super Admin users.
                </span>
              </div>
            )}

            {/* Action Buttons Section */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>No embedded dashboards • Clean external connection architecture</span>
              </div>

              <div className="flex items-center gap-3">
                {connectionConfig.isConnected ? (
                  // WHEN CONNECTED: Show "Open ERP" and "Disconnect"
                  <>
                    <button
                      onClick={handleOpenERP}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
                        isSchool
                          ? 'bg-blue-700 hover:bg-blue-600'
                          : 'bg-emerald-700 hover:bg-emerald-600'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open {erpTitle}</span>
                    </button>

                    {isSuperAdmin && (
                      <button
                        onClick={() => setShowDisconnectModal(true)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Disconnect</span>
                      </button>
                    )}
                  </>
                ) : (
                  // WHEN NOT CONNECTED: Show "Connect"
                  <>
                    {isSuperAdmin ? (
                      <button
                        onClick={() => {
                          setErrorMessage(null);
                          setShowConnectModal(true);
                        }}
                        className={`px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
                          isSchool
                            ? 'bg-blue-700 hover:bg-blue-600'
                            : 'bg-emerald-700 hover:bg-emerald-600'
                        }`}
                      >
                        <Link className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic">
                        Connection requires Super Admin authorization
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONNECT MODAL (Super Admin Only) */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fadeIn">
            {/* Modal Header */}
            <div className={`p-6 text-white ${isSchool ? 'bg-blue-900' : 'bg-emerald-900'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-6 h-6" />
                  <h3 className="text-lg font-black tracking-tight">Connect {erpTitle}</h3>
                </div>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-white/80 mt-1">
                Establish the FET India connection configuration for the external {erpFullTitle} platform.
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmConnect} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Platform:</span>
                  <strong className="text-slate-900">{erpFullTitle}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Status Transition:</span>
                  <span className="text-emerald-700 font-bold">Not Connected → Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Target Rollout:</span>
                  <span className="text-slate-700 font-medium">March / April 2027</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Production ERP Base URL (Optional)
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder={isSchool ? 'https://school.fetindia.org (leave blank if not yet deployed)' : 'https://madrasa.fetindia.org (leave blank if not yet deployed)'}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-400 block">
                  Leave blank if the production platform is not yet live. You can configure this URL at any time.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Connection Notes / References (Optional)
                </label>
                <textarea
                  value={inputNotes}
                  onChange={(e) => setInputNotes(e.target.value)}
                  placeholder="e.g. Prepared for Series 2 external deployment handoff."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Safety notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] space-y-1">
                <span className="font-bold block">Safe Connection Protocol</span>
                <p className="leading-relaxed">
                  Connecting establishes the FET India-side integration foundation only. No external ERP data is modified, and no fake live credentials are created.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md flex items-center gap-2 cursor-pointer transition-all ${
                    isSchool
                      ? 'bg-blue-700 hover:bg-blue-600'
                      : 'bg-emerald-700 hover:bg-emerald-600'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Link className="w-3.5 h-3.5" /> Confirm Connect
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCONNECT CONFIRMATION MODAL (Super Admin Only) */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="p-6 bg-rose-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-rose-200">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Disconnect {erpTitle}?</h3>
                  <p className="text-xs text-rose-200 mt-0.5">FET India Connection Removal</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                Are you sure you want to disconnect <strong className="text-slate-900">{erpFullTitle}</strong> from FET India?
              </p>

              {/* Crucial Data Safety Guarantee (Item 5 in Prompt) */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs space-y-1.5">
                <span className="font-extrabold flex items-center gap-1.5 text-rose-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Data Safety Guarantee
                </span>
                <p className="text-[11px] text-rose-900 leading-relaxed">
                  Disconnecting removes the FET India connection relationship <strong>only</strong>. Disconnect will <strong>NEVER delete</strong> any {erpTitle} data, student data, teacher data, attendance records, fee data, or academic records.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisconnectModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDisconnect}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Disconnecting...
                    </>
                  ) : (
                    <>
                      <Unlink className="w-3.5 h-3.5" /> Confirm Disconnect
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPEN ERP INFORMATION MODAL (When production URL not yet live) */}
      {showOpenInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center border border-slate-200 space-y-4 animate-fadeIn">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
                isSchool
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <Icon className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {erpFullTitle} Launch Notice
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                The separate {erpFullTitle} product will be developed and launched separately around <strong>March/April 2027</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>Production URL Configuration</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                As per system design, no fake production domains or credentials are created in FET India. Once the external platform is deployed to production, an authorized Super Admin can configure its live URL to enable direct launching.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowOpenInfoModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
