/**
 * @license
 * Centralized Super Admin Feature Controls & Module Activation Console
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Award, 
  ShoppingBag, 
  GraduationCap, 
  BookOpen, 
  Compass, 
  Clock, 
  Check, 
  RefreshCw,
  Info
} from 'lucide-react';
import { useModuleControls } from '../../../contexts/ModuleControlsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { SystemModuleKey } from '../../../types';

export const AdminModuleControlsSettings: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { moduleControls, isModuleEnabled, updateModuleControl, isLoading } = useModuleControls();

  const [savingKey, setSavingKey] = useState<SystemModuleKey | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showNotice = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleToggle = async (key: SystemModuleKey, currentVal: boolean) => {
    if (!isSuperAdmin) {
      showNotice('RBAC Permission Denied: Only Super Admin can modify system module activation.', true);
      return;
    }

    if (key === 'examinations') {
      showNotice('Action Blocked: Core Examination & Competition System is permanently active and cannot be toggled.', true);
      return;
    }

    if (key === 'higher_education_grant') {
      showNotice('Notice: Higher Education Grant applications are formally deferred and scheduled for future release.', true);
      return;
    }

    setSavingKey(key);
    try {
      await updateModuleControl(key, !currentVal, !currentVal ? 'active' : 'disabled', {
        uid: currentUser?.uid || 'super_admin',
        email: currentUser?.email || 'fetkofficial@gmail.com'
      });
      showNotice(`Module "${moduleControls[key]?.name || key}" ${!currentVal ? 'ACTIVATED' : 'SAFELY DISABLED'} in Firestore & backend.`);
    } catch (err: any) {
      showNotice(err?.message || 'Failed to update module state.', true);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6" id="super-admin-feature-controls">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Centralized Feature Controls & Module Activation
              </h2>
              <p className="text-xs text-slate-500">
                Super Admin sovereign controls for optional trust modules. Stored authoritatively in Firestore (<code className="text-indigo-600 font-mono">system_settings/module_controls</code>).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Super Admin Gate Active
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. PERMANENT CORE ENGINE: Examination & Certification */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white shadow-sm border border-emerald-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">
                  Competition, Examination & Certification (Core Engine)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-400 text-slate-950 uppercase tracking-wide flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Core Locked Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                Code: MOD_EXAM_CERTIFICATION • Scheduled Exam: 8 Nov 2026 National Competition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              100% Operational
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed border-t border-white/10 pt-3">
          The national examination engine, candidate registration portal, hall tickets, and original uploaded PDF book delivery pipeline are permanently protected from deactivation.
        </p>
      </div>

      {/* 2. OPTIONAL ENTERPRISE MODULES GRID */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Optional Trust Modules & Future Services (Independently Toggleable)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Module: FET Store */}
          {(() => {
            const isStoreOn = isModuleEnabled('store');
            const isSaving = savingKey === 'store';
            return (
              <div className={`p-5 rounded-2xl border transition-all ${
                isStoreOn ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-200'
              } space-y-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isStoreOn ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">FET India Store & Merchandise</h4>
                      <span className="text-[10px] font-mono text-slate-400">MOD_FET_STORE</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isStoreOn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isStoreOn ? 'Active (Ready)' : 'Disabled'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Ethical commerce: garments, perfumes (attars), and academic publications. When disabled, checkout and order placement routes return HTTP 403 server-side.
                </p>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600">Module Access:</span>
                  <button
                    type="button"
                    disabled={isSaving || !isSuperAdmin}
                    onClick={() => handleToggle('store', isStoreOn)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                      isStoreOn
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                    }`}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isStoreOn ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Disable Module
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enable Module
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Module: School ERP */}
          {(() => {
            const isSchoolOn = isModuleEnabled('school_erp');
            const isSaving = savingKey === 'school_erp';
            return (
              <div className={`p-5 rounded-2xl border transition-all ${
                isSchoolOn ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200'
              } space-y-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSchoolOn ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">School ERP Administration</h4>
                      <span className="text-[10px] font-mono text-slate-400">MOD_SCHOOL_ERP</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isSchoolOn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isSchoolOn ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Academic administration for trust schools: student admissions, fee tracking, attendance, and faculty schedules.
                </p>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600">Module Access:</span>
                  <button
                    type="button"
                    disabled={isSaving || !isSuperAdmin}
                    onClick={() => handleToggle('school_erp', isSchoolOn)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                      isSchoolOn
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                    }`}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isSchoolOn ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Disable Module
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enable Module
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Module: Madarsa ERP */}
          {(() => {
            const isMadarsaOn = isModuleEnabled('madarsa_erp');
            const isSaving = savingKey === 'madarsa_erp';
            return (
              <div className={`p-5 rounded-2xl border transition-all ${
                isMadarsaOn ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'
              } space-y-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isMadarsaOn ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Madarsa ERP & Islamic Curriculum</h4>
                      <span className="text-[10px] font-mono text-slate-400">MOD_MADRASA_ERP</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isMadarsaOn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isMadarsaOn ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Management for affiliated madrasas: Hifz & Tajweed logs, Alim course records, boarding attendance, and ethical curricula.
                </p>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600">Module Access:</span>
                  <button
                    type="button"
                    disabled={isSaving || !isSuperAdmin}
                    onClick={() => handleToggle('madarsa_erp', isMadarsaOn)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                      isMadarsaOn
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                    }`}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isMadarsaOn ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Disable Module
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enable Module
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Module: Education & Empowerment */}
          {(() => {
            const isEmpowerOn = isModuleEnabled('education_empowerment');
            const isSaving = savingKey === 'education_empowerment';
            return (
              <div className={`p-5 rounded-2xl border transition-all ${
                isEmpowerOn ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
              } space-y-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isEmpowerOn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Education & Empowerment</h4>
                      <span className="text-[10px] font-mono text-slate-400">MOD_EDUCATION_EMPOWERMENT</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isEmpowerOn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isEmpowerOn ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Career mentorship matching, open digital syllabus LMS, teacher training manuals, and community welfare aid intake.
                </p>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600">Module Access:</span>
                  <button
                    type="button"
                    disabled={isSaving || !isSuperAdmin}
                    onClick={() => handleToggle('education_empowerment', isEmpowerOn)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                      isEmpowerOn
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                    }`}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isEmpowerOn ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Disable Module
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enable Module
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* 3. STRICTLY DEFERRED MODULE: Higher Education Grants (Phase 4) */}
      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Higher Education Grants & Degree Scholarships (MOD_SCHOLARSHIP_MGMT)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase">
                  Deferred — Future Release
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Strict Trust Policy: No synthetic / placeholder applications or mock submissions permitted.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-700" /> Intake Deferred
          </span>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed border-t border-amber-200 pt-2.5">
          Online scholarship intake and degree sanction pipelines will formally launch in accordance with academic year cycles. The intake form is closed and deferred to prevent confusion with candidate examination records.
        </p>
      </div>

    </div>
  );
};
