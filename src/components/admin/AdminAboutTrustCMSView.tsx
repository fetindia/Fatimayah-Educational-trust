/**
 * @license
 * Dedicated Super Admin About Trust CMS Component
 * Fatimyah Educational Trust India (FET India)
 * Sovereign Content Management for Institutional Overview, Mission, Governance,
 * RBAC, Milestones, Legal/Tax, Chairman & Trustees, Signatory, Seal, and Transparency
 */

import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Target, 
  ShieldCheck, 
  Users, 
  History, 
  Scale, 
  Award, 
  FileCheck, 
  Landmark, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  ExternalLink,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { DEFAULT_ABOUT_TRUST_CONFIG } from '../../data/initialData';
import { 
  AboutTrustContentConfig, 
  TrusteeProfile, 
  OfficialSignatoryConfig,
  UserRole 
} from '../../types';
import { fileToDataUrl, validateImageFile } from '../../lib/storage';

type AboutCMSTab = 
  | 'overview' 
  | 'mission' 
  | 'milestones' 
  | 'core_values'
  | 'chairman'
  | 'trustees'
  | 'advisory'
  | 'signatory_seal' 
  | 'transparency'
  | 'legal' 
  | 'governance' 
  | 'rbac'
  | 'leadership';

export const AdminAboutTrustCMSView: React.FC = () => {
  const { config, updateConfig } = useConfig();
  const { currentUser, activeRole, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<AboutCMSTab>('overview');
  const [formData, setFormData] = useState<AboutTrustContentConfig>(() => {
    return {
      ...DEFAULT_ABOUT_TRUST_CONFIG,
      ...(config.aboutTrust || {})
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // File upload refs
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const sealInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const chairPhotoRef = useRef<HTMLInputElement>(null);
  const trusteePhotoRef = useRef<HTMLInputElement>(null);
  const advisoryPhotoRef = useRef<HTMLInputElement>(null);
  const [selectedTrusteeIndex, setSelectedTrusteeIndex] = useState<number | null>(null);
  const [selectedAdvisoryIndex, setSelectedAdvisoryIndex] = useState<number | null>(null);

  const authUser = currentUser ? {
    uid: currentUser.uid,
    email: currentUser.email || 'superadmin@fetindia.com',
    role: (activeRole || 'super_admin') as UserRole
  } : {
    uid: 'local-super-admin',
    email: 'superadmin@fetindia.com',
    role: 'super_admin' as UserRole
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      // Synchronize Chairman Message with root config for cross-page compatibility
      const chairmanMsg = {
        name: formData.chairmanProfile?.name || 'Janab Syed Ali Raza Zaidi',
        designation: formData.chairmanProfile?.designation || 'Chairman & Managing Trustee',
        photoUrl: formData.chairmanProfile?.photoUrl || '',
        message: formData.chairmanProfile?.message || '',
        vision: formData.chairmanProfile?.vision || '',
        leadershipStatement: formData.chairmanProfile?.overview || ''
      };

      await updateConfig({
        aboutTrust: formData,
        chairmanMessage: chairmanMsg,
        // Ensure statutory registrations stay in sync
        registrationNumber: formData.registrationNumber || config.registrationNumber || 'E 9822',
        registrationJurisdiction: formData.registrationJurisdiction || config.registrationJurisdiction || 'Jammu & Kashmir',
        registrationAuthority: formData.registrationAuthority || config.registrationAuthority || 'Sub-Divisional Magistrate (SDM) Office, Jammu & Kashmir',
        registrationAct: formData.registrationAct || '',
        legalStatusDescription: formData.legalStatusDescription || 'Registered in Jammu & Kashmir',
        nitiAayogId: formData.darpanNgoId || config.nitiAayogId || 'JK/2026/1153821',
        darpanId: formData.darpanNgoId || 'JK/2026/1153821',
        panNumber: formData.panNumberPublic || 'AABTF0015H'
      }, authUser);

      setSaveStatus({
        type: 'success',
        message: 'All About Trust content and leadership configuration saved successfully to Firestore.'
      });
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (err: any) {
      console.error('Failed to save About Trust content:', err);
      setSaveStatus({
        type: 'error',
        message: err.message || 'Failed to save configuration. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all About Trust content to official standard institutional defaults? Any unsaved edits will be discarded.')) {
      setFormData(DEFAULT_ABOUT_TRUST_CONFIG);
      setSaveStatus({
        type: 'success',
        message: 'Content reset to official defaults. Click "Save Changes" to commit to Firestore.'
      });
    }
  };

  // -------------------------------------------------------------
  // File Upload Handlers (Seal, Signature, Chairman, Trustee)
  // -------------------------------------------------------------
  const handleSealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = validateImageFile(file, 5);
    if (!val.valid) {
      alert(val.error);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setFormData(prev => ({
        ...prev,
        signatory: {
          ...prev.signatory,
          name: prev.signatory?.name || '',
          designation: prev.signatory?.designation || '',
          signatureEnabled: prev.signatory?.signatureEnabled ?? true,
          officialSealUrl: dataUrl,
          officialSealEnabled: true
        }
      }));
    } catch (err) {
      alert('Failed to read seal image. Please choose another file.');
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = validateImageFile(file, 5);
    if (!val.valid) {
      alert(val.error);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setFormData(prev => ({
        ...prev,
        signatory: {
          ...prev.signatory,
          name: prev.signatory?.name || '',
          designation: prev.signatory?.designation || '',
          signatureEnabled: true,
          signatureUrl: dataUrl,
          officialSealEnabled: prev.signatory?.officialSealEnabled ?? true
        }
      }));
    } catch (err) {
      alert('Failed to read signature image. Please choose another file.');
    }
  };

  const handleChairmanPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = validateImageFile(file, 5);
    if (!val.valid) {
      alert(val.error);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setFormData(prev => ({
        ...prev,
        chairmanProfile: {
          ...prev.chairmanProfile!,
          photoUrl: dataUrl
        }
      }));
    } catch (err) {
      alert('Failed to read photograph.');
    }
  };

  const handleTrusteePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = validateImageFile(file, 5);
    if (!val.valid) {
      alert(val.error);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      const list = [...(formData.trustees || [])];
      if (list[index]) {
        list[index] = { ...list[index], photoUrl: dataUrl };
        setFormData(prev => ({ ...prev, trustees: list }));
      }
    } catch (err) {
      alert('Failed to read photograph.');
    }
  };

  // -------------------------------------------------------------
  // Trustee Management Helpers
  // -------------------------------------------------------------
  const handleAddTrustee = () => {
    const newTrustee: TrusteeProfile = {
      id: `tr-${Date.now()}`,
      name: 'New Trustee Member',
      designation: 'Trustee',
      isChairman: false,
      photoUrl: '',
      overview: 'Distinguished trustee contributing to institutional oversight and welfare mission.',
      biography: '',
      vision: '',
      message: '',
      responsibilities: ['Trust Governance & Committee Oversight'],
      contactEmail: '',
      contactPhone: '',
      displayOrder: (formData.trustees?.length || 0) + 2,
      isEnabled: true
    };
    setFormData(prev => ({
      ...prev,
      trustees: [...(prev.trustees || []), newTrustee]
    }));
  };

  const handleRemoveTrustee = (index: number) => {
    if (window.confirm('Are you sure you want to remove this trustee profile?')) {
      const list = [...(formData.trustees || [])];
      list.splice(index, 1);
      setFormData(prev => ({ ...prev, trustees: list }));
    }
  };

  const handleMoveTrustee = (index: number, direction: 'up' | 'down') => {
    const list = [...(formData.trustees || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    // update displayOrder
    list.forEach((t, i) => { t.displayOrder = i + 2; });
    setFormData(prev => ({ ...prev, trustees: list }));
  };

  // -------------------------------------------------------------
  // Advisory Board & Council Helpers
  // -------------------------------------------------------------
  const handleAdvisoryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = validateImageFile(file, 5);
    if (!val.valid) {
      alert(val.error);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      const list = [...(formData.advisoryMembers || [])];
      if (list[index]) {
        list[index] = { ...list[index], photoUrl: dataUrl };
        setFormData(prev => ({ ...prev, advisoryMembers: list }));
      }
    } catch (err) {
      alert('Failed to read photograph.');
    }
  };

  const handleAddAdvisoryMember = () => {
    const newMember: TrusteeProfile = {
      id: `adv-${Date.now()}`,
      name: 'New Advisory Member',
      designation: 'Honorary Academic Advisor',
      isChairman: false,
      photoUrl: '',
      overview: 'Distinguished scholar/advisor providing strategic guidance to the Trust.',
      biography: '',
      responsibilities: ['Scholastic Quality & Strategic Guidance'],
      displayOrder: (formData.advisoryMembers?.length || 0) + 1,
      isEnabled: true
    };
    setFormData(prev => ({
      ...prev,
      advisoryMembers: [...(prev.advisoryMembers || []), newMember]
    }));
  };

  const handleRemoveAdvisoryMember = (index: number) => {
    if (window.confirm('Are you sure you want to remove this advisory board member?')) {
      const list = [...(formData.advisoryMembers || [])];
      list.splice(index, 1);
      setFormData(prev => ({ ...prev, advisoryMembers: list }));
    }
  };

  const handleMoveAdvisoryMember = (index: number, direction: 'up' | 'down') => {
    const list = [...(formData.advisoryMembers || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    list.forEach((t, i) => { t.displayOrder = i + 1; });
    setFormData(prev => ({ ...prev, advisoryMembers: list }));
  };

  // -------------------------------------------------------------
  // Core Values Management Helpers
  // -------------------------------------------------------------
  const handleAddCoreValue = () => {
    const newValue = {
      id: `cv-${Date.now()}`,
      title: 'Institutional Integrity',
      description: 'Transparent administration, strict fiduciary discipline, and community accountability.',
      icon: 'ShieldCheck'
    };
    setFormData(prev => ({
      ...prev,
      coreValues: [...(prev.coreValues || []), newValue]
    }));
  };

  const handleRemoveCoreValue = (index: number) => {
    const list = [...(formData.coreValues || [])];
    list.splice(index, 1);
    setFormData(prev => ({ ...prev, coreValues: list }));
  };
  // -------------------------------------------------------------
  const handleAddMilestone = () => {
    const newM = {
      id: `m-${Date.now()}`,
      year: new Date().getFullYear().toString(),
      title: 'New Institutional Milestone',
      description: 'Description of key milestone achievement, expansion, or regulatory accreditation.',
      category: 'Education' as const,
      isKeyMilestone: true
    };
    setFormData(prev => ({
      ...prev,
      milestones: [...(prev.milestones || []), newM]
    }));
  };

  const handleRemoveMilestone = (index: number) => {
    const list = [...(formData.milestones || [])];
    list.splice(index, 1);
    setFormData(prev => ({ ...prev, milestones: list }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16" id="super-admin-about-cms-view">
      
      {/* Header Banner with Primary Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Super Admin Content Authority</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            About Trust CMS & Institutional Leadership
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Manage public institutional profile, Chairman's message, verified trustees, statutory 12A/80G status, official seal, authorized signatory, and audit transparency without modifying code.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleResetToDefaults}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            title="Reset form fields to standard trust defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            id="save-about-trust-cms-btn"
          >
            <Save className="w-4 h-4 text-emerald-200" />
            <span>{isSaving ? 'Saving to Firestore...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Save Notification */}
      {saveStatus && (
        <div 
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 shadow-xs animate-in fade-in ${
            saveStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Single-Row Horizontally Scrollable Section Selector with Left & Right Scroll Buttons */}
      <div className="relative flex items-center bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => {
            if (tabsContainerRef.current) {
              tabsContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
            }
          }}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer shrink-0 z-10"
          title="Scroll Left"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div 
          ref={tabsContainerRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth px-1"
        >
          {[
            { id: 'overview', label: 'Overview / Hero', icon: Building2 },
            { id: 'mission', label: 'Vision & Mission', icon: Target },
            { id: 'milestones', label: 'History & Milestones', icon: History },
            { id: 'core_values', label: 'Core Values / Pillars', icon: ShieldCheck },
            { id: 'chairman', label: 'Chairman & Leadership', icon: Award },
            { id: 'trustees', label: 'Board of Trustees', icon: Users },
            { id: 'advisory', label: 'Advisory Board', icon: Sparkles },
            { id: 'signatory_seal', label: 'Official Signatory & Seal', icon: FileCheck },
            { id: 'transparency', label: 'Financial Transparency & Audit', icon: Landmark },
            { id: 'legal', label: 'Legal & Registration', icon: Scale },
            { id: 'governance', label: 'Governance Tiers', icon: ShieldCheck },
            { id: 'rbac', label: 'RBAC Public Roles', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || (tab.id === 'chairman' && activeTab === 'leadership');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AboutCMSTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            if (tabsContainerRef.current) {
              tabsContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
            }
          }}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer shrink-0 z-10"
          title="Scroll Right"
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & AREAS OF WORK                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900">Institutional Overview & Work Summaries</h3>
            <p className="text-xs text-slate-500 mt-1">
              Public introduction and thematic breakdowns for educational, healthcare, and community empowerment work.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Executive Institutional Introduction
              </label>
              <textarea
                value={formData.overviewIntroduction || ''}
                onChange={e => setFormData(prev => ({ ...prev, overviewIntroduction: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Detailed executive overview of Fatimyah Educational Trust..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Foundational Purpose
              </label>
              <textarea
                value={formData.purpose || ''}
                onChange={e => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Foundational institutional purpose..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Educational Work Summary
                </label>
                <textarea
                  value={formData.educationalWorkSummary || ''}
                  onChange={e => setFormData(prev => ({ ...prev, educationalWorkSummary: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Scholarships, madrasa modernization, STEM labs..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Welfare & Healthcare Summary
                </label>
                <textarea
                  value={formData.welfareWorkSummary || ''}
                  onChange={e => setFormData(prev => ({ ...prev, welfareWorkSummary: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Dialysis funds, medical relief, emergency aid..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Community Service Summary
                </label>
                <textarea
                  value={formData.communityServiceSummary || ''}
                  onChange={e => setFormData(prev => ({ ...prev, communityServiceSummary: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Skill centers, legal literacy clinics, youth mentorship..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Empowerment Objectives
                </label>
                <textarea
                  value={formData.empowermentObjectives || ''}
                  onChange={e => setFormData(prev => ({ ...prev, empowermentObjectives: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Women's vocational independence, enterprise mentorship..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Key Areas of Work (One per line)
              </label>
              <textarea
                value={(formData.areasOfWork || []).join('\n')}
                onChange={e => {
                  const list = e.target.value.split('\n').filter(s => s.trim().length > 0);
                  setFormData(prev => ({ ...prev, areasOfWork: list }));
                }}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Higher Education & Research Grants&#10;Madrasa STEM & Digital Laboratories&#10;..."
              />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: MISSION & OBJECTIVES                                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'mission' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900">Mission, Vision & Core Strategic Objectives</h3>
            <p className="text-xs text-slate-500 mt-1">
              Public declarations of organizational purpose, visionary targets, and milestone objectives.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mission Statement
              </label>
              <textarea
                value={formData.missionStatement || ''}
                onChange={e => setFormData(prev => ({ ...prev, missionStatement: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Vision Statement
              </label>
              <textarea
                value={formData.visionStatement || ''}
                onChange={e => setFormData(prev => ({ ...prev, visionStatement: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Core Objectives (One per line)
                </label>
                <textarea
                  value={(formData.coreObjectives || []).join('\n')}
                  onChange={e => {
                    const list = e.target.value.split('\n').filter(s => s.trim().length > 0);
                    setFormData(prev => ({ ...prev, coreObjectives: list }));
                  }}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Long-Term Goals (One per line)
                </label>
                <textarea
                  value={(formData.longTermGoals || []).join('\n')}
                  onChange={e => {
                    const list = e.target.value.split('\n').filter(s => s.trim().length > 0);
                    setFormData(prev => ({ ...prev, longTermGoals: list }));
                  }}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Education Objectives (One per line)
                </label>
                <textarea
                  value={(formData.educationObjectives || []).join('\n')}
                  onChange={e => {
                    const list = e.target.value.split('\n').filter(s => s.trim().length > 0);
                    setFormData(prev => ({ ...prev, educationObjectives: list }));
                  }}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Welfare Objectives (One per line)
                </label>
                <textarea
                  value={(formData.welfareObjectives || []).join('\n')}
                  onChange={e => {
                    const list = e.target.value.split('\n').filter(s => s.trim().length > 0);
                    setFormData(prev => ({ ...prev, welfareObjectives: list }));
                  }}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: GOVERNANCE & 6 TIERS                                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'governance' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900">Governance Framework & Structural Tiers</h3>
            <p className="text-xs text-slate-500 mt-1">
              Public representation of the sovereign 6-tier institutional governance architecture.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Governance Description Narrative
            </label>
            <textarea
              value={formData.governanceDescription || ''}
              onChange={e => setFormData(prev => ({ ...prev, governanceDescription: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Configured Institutional Tiers ({formData.structureTiers?.length || 0})
            </h4>
            
            <div className="space-y-3">
              {(formData.structureTiers || []).map((tier, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-black">
                      Tier {tier.tierNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{tier.bodyName}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tier Title</label>
                      <input
                        type="text"
                        value={tier.title}
                        onChange={e => {
                          const list = [...(formData.structureTiers || [])];
                          list[idx].title = e.target.value;
                          setFormData(prev => ({ ...prev, structureTiers: list }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Governing Body Name</label>
                      <input
                        type="text"
                        value={tier.bodyName}
                        onChange={e => {
                          const list = [...(formData.structureTiers || [])];
                          list[idx].bodyName = e.target.value;
                          setFormData(prev => ({ ...prev, structureTiers: list }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Jurisdiction & Responsibilities</label>
                    <textarea
                      value={tier.description}
                      onChange={e => {
                        const list = [...(formData.structureTiers || [])];
                        list[idx].description = e.target.value;
                        setFormData(prev => ({ ...prev, structureTiers: list }));
                      }}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: RBAC & PUBLIC ROLES                                    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900">RBAC / Roles & Responsibilities Public Overview</h3>
            <p className="text-xs text-slate-500 mt-1">
              Explain the operational roles and separation of duties to public visitors and auditors.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              RBAC Operational Philosophy
            </label>
            <textarea
              value={formData.rbacDescription || ''}
              onChange={e => setFormData(prev => ({ ...prev, rbacDescription: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              14 Standard Roles Public Description
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(formData.rolesOverview || []).map((role, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{role.roleTitle}</span>
                    <span className="font-mono text-[10px] text-slate-500">{role.roleKey}</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Designation / Responsibility</label>
                    <input
                      type="text"
                      value={role.responsibility}
                      onChange={e => {
                        const list = [...(formData.rolesOverview || [])];
                        list[idx].responsibility = e.target.value;
                        setFormData(prev => ({ ...prev, rolesOverview: list }));
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Scope of Authority</label>
                    <textarea
                      value={role.scope}
                      onChange={e => {
                        const list = [...(formData.rolesOverview || [])];
                        list[idx].scope = e.target.value;
                        setFormData(prev => ({ ...prev, rolesOverview: list }));
                      }}
                      rows={2}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: HISTORY & MILESTONES                                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'milestones' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">History & Institutional Milestones</h3>
              <p className="text-xs text-slate-500 mt-1">
                Chronological timeline of institutional establishment, tax approvals, educational pilots, and digital milestones.
              </p>
            </div>
            <button
              onClick={handleAddMilestone}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Historical Retrospective Narrative
            </label>
            <textarea
              value={formData.historyDescription || ''}
              onChange={e => setFormData(prev => ({ ...prev, historyDescription: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            {(formData.milestones || []).map((m, idx) => (
              <div key={m.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={m.year}
                      onChange={e => {
                        const list = [...(formData.milestones || [])];
                        list[idx].year = e.target.value;
                        setFormData(prev => ({ ...prev, milestones: list }));
                      }}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold bg-white"
                      placeholder="Year"
                    />
                    <select
                      value={m.category}
                      onChange={e => {
                        const list = [...(formData.milestones || [])];
                        list[idx].category = e.target.value as any;
                        setFormData(prev => ({ ...prev, milestones: list }));
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    >
                      <option value="Foundation">Foundation</option>
                      <option value="Education">Education</option>
                      <option value="Welfare">Welfare</option>
                      <option value="Legal">Legal</option>
                      <option value="Digital">Digital</option>
                    </select>
                    <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-bold ml-2">
                      <input
                        type="checkbox"
                        checked={m.isKeyMilestone}
                        onChange={e => {
                          const list = [...(formData.milestones || [])];
                          list[idx].isKeyMilestone = e.target.checked;
                          setFormData(prev => ({ ...prev, milestones: list }));
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Key Milestone</span>
                    </label>
                  </div>

                  <button
                    onClick={() => handleRemoveMilestone(idx)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Delete milestone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={m.title}
                  onChange={e => {
                    const list = [...(formData.milestones || [])];
                    list[idx].title = e.target.value;
                    setFormData(prev => ({ ...prev, milestones: list }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  placeholder="Milestone Title"
                />

                <textarea
                  value={m.description}
                  onChange={e => {
                    const list = [...(formData.milestones || [])];
                    list[idx].description = e.target.value;
                    setFormData(prev => ({ ...prev, milestones: list }));
                  }}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  placeholder="Milestone Description"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CORE VALUES & PILLARS TAB                                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'core_values' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Core Institutional Values & Pillars</h3>
              <p className="text-xs text-slate-500 mt-1">
                Foundational values, ethical commitments, and educational standards guiding Fatimyah Educational Trust.
              </p>
            </div>
            <button
              onClick={handleAddCoreValue}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Core Value</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(formData.coreValues || []).map((cv, idx) => (
              <div key={cv.id || idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveCoreValue(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove Core Value"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Value Title</label>
                  <input
                    type="text"
                    value={cv.title}
                    onChange={e => {
                      const list = [...(formData.coreValues || [])];
                      list[idx].title = e.target.value;
                      setFormData(prev => ({ ...prev, coreValues: list }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    placeholder="e.g. Fiduciary Integrity"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description / Core Tenet</label>
                  <textarea
                    value={cv.description}
                    onChange={e => {
                      const list = [...(formData.coreValues || [])];
                      list[idx].description = e.target.value;
                      setFormData(prev => ({ ...prev, coreValues: list }));
                    }}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    placeholder="Explain this core pillar..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: LEGAL & 12A / 80G / TAX STATUS                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'legal' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900">Legal, 12A/80G & Statutory Tax Exemption Profile</h3>
            <p className="text-xs text-slate-500 mt-1">
              Public statutory registrations, SDM Office Jammu & Kashmir jurisdiction, PAN details, and 12A/80G orders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trust Registration Number
              </label>
              <input
                type="text"
                value={formData.registrationNumber || 'E 9822'}
                onChange={e => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900"
                placeholder="E 9822"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Official Trust registration number: E 9822.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration Jurisdiction
              </label>
              <input
                type="text"
                value={formData.registrationJurisdiction || 'Jammu & Kashmir'}
                onChange={e => setFormData(prev => ({ ...prev, registrationJurisdiction: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                placeholder="Jammu & Kashmir"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration Authority
              </label>
              <input
                type="text"
                value={formData.registrationAuthority || ''}
                onChange={e => setFormData(prev => ({ ...prev, registrationAuthority: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Applicable Registration Act <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.registrationAct || ''}
                onChange={e => setFormData(prev => ({ ...prev, registrationAct: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                placeholder="Leave blank unless verified in original deed"
              />
              <p className="text-[10px] text-amber-700 mt-1">
                Do not invent or guess an Act name. Leave blank unless verified from Trust deed.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Safe Legal Status Wording
              </label>
              <input
                type="text"
                value={formData.legalStatusDescription || 'Registered in Jammu & Kashmir'}
                onChange={e => setFormData(prev => ({ ...prev, legalStatusDescription: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                placeholder="Registered in Jammu & Kashmir"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Formal Registration Date
              </label>
              <input
                type="text"
                value={formData.registrationDate || ''}
                onChange={e => setFormData(prev => ({ ...prev, registrationDate: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Public PAN Number
              </label>
              <input
                type="text"
                value={formData.panNumberPublic || ''}
                onChange={e => setFormData(prev => ({ ...prev, panNumberPublic: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NITI Aayog NGO Darpan ID
              </label>
              <input
                type="text"
                value={formData.darpanNgoId || ''}
                onChange={e => setFormData(prev => ({ ...prev, darpanNgoId: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Section 12A Order & Details
            </label>
            <textarea
              value={formData.section12ADetails || ''}
              onChange={e => setFormData(prev => ({ ...prev, section12ADetails: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Section 80G Order & Tax Benefit Details
            </label>
            <textarea
              value={formData.section80GDetails || ''}
              onChange={e => setFormData(prev => ({ ...prev, section80GDetails: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              FCRA Registration Status
            </label>
            <input
              type="text"
              value={formData.fcraStatus || ''}
              onChange={e => setFormData(prev => ({ ...prev, fcraStatus: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Form 10BE Tax Deduction & Verification Note
            </label>
            <textarea
              value={formData.taxDeductionNote || ''}
              onChange={e => setFormData(prev => ({ ...prev, taxDeductionNote: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Statutory Compliance Statement
            </label>
            <textarea
              value={formData.complianceStatement || ''}
              onChange={e => setFormData(prev => ({ ...prev, complianceStatement: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CHAIRMAN'S OFFICIAL PROFILE & VISION TAB                      */}
      {/* ------------------------------------------------------------- */}
      {(activeTab === 'chairman' || activeTab === 'leadership') && (
        <div className="space-y-6">
          
          {/* SECTION A: CHAIRMAN'S PROFILE & ANNUAL MESSAGE */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Apex Leadership
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Chairman's Official Profile & Message</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  The official address and institutional vision from the Chairman of the Board of Trustees.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Photo Upload & Preview */}
              <div className="md:col-span-4 flex flex-col items-center p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="relative w-36 h-36 rounded-2xl overflow-hidden bg-slate-200 border-2 border-emerald-600 shadow-md">
                  {formData.chairmanProfile?.photoUrl ? (
                    <img
                      src={formData.chairmanProfile.photoUrl}
                      alt={formData.chairmanProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2">
                      <Award className="w-10 h-10 mb-1 text-slate-300" />
                      <span className="text-[10px] font-bold">No Photo Uploaded</span>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={chairPhotoRef}
                  onChange={handleChairmanPhotoUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => chairPhotoRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Photo</span>
                  </button>
                  {formData.chairmanProfile?.photoUrl && (
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, chairmanProfile: { ...prev.chairmanProfile!, photoUrl: '' } }))}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-400">
                  Recommended size: 600x600px square, JPG or PNG.
                </p>
              </div>

              {/* Chairman Fields */}
              <div className="md:col-span-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Chairman Full Name</label>
                    <input
                      type="text"
                      value={formData.chairmanProfile?.name || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        chairmanProfile: { ...prev.chairmanProfile!, name: e.target.value }
                      }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Designation</label>
                    <input
                      type="text"
                      value={formData.chairmanProfile?.designation || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        chairmanProfile: { ...prev.chairmanProfile!, designation: e.target.value }
                      }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chairman's Official Annual Address / Message
                  </label>
                  <textarea
                    value={formData.chairmanProfile?.message || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      chairmanProfile: { ...prev.chairmanProfile!, message: e.target.value }
                    }))}
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs leading-relaxed"
                    placeholder="Enter the full institutional address of the Chairman..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chairman's Vision Statement</label>
                  <textarea
                    value={formData.chairmanProfile?.vision || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      chairmanProfile: { ...prev.chairmanProfile!, vision: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Biography & Background</label>
                  <textarea
                    value={formData.chairmanProfile?.biography || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      chairmanProfile: { ...prev.chairmanProfile!, biography: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Contact Email</label>
                    <input
                      type="email"
                      value={formData.chairmanProfile?.contactEmail || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        chairmanProfile: { ...prev.chairmanProfile!, contactEmail: e.target.value }
                      }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Office Telephone / Secretariat</label>
                    <input
                      type="text"
                      value={formData.chairmanProfile?.contactPhone || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        chairmanProfile: { ...prev.chairmanProfile!, contactPhone: e.target.value }
                      }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BOARD OF TRUSTEES TAB                                         */}
      {/* ------------------------------------------------------------- */}
      {(activeTab === 'trustees' || activeTab === 'leadership') && (
        <div className="space-y-6">
          {/* SECTION B: MULTIPLE TRUSTEE PROFILES */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Board of Trustees ({formData.trustees?.length || 0})</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage profiles, designations, biographies, responsibilities, and visibility for each board trustee.
                </p>
              </div>
              <button
                onClick={handleAddTrustee}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Trustee Member</span>
              </button>
            </div>

            {/* Hidden Input for Trustee Photos */}
            <input
              type="file"
              ref={trusteePhotoRef}
              onChange={e => {
                if (selectedTrusteeIndex !== null) {
                  handleTrusteePhotoUpload(e, selectedTrusteeIndex);
                }
              }}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <div className="space-y-4">
              {(formData.trustees || []).map((t, idx) => (
                <div 
                  key={t.id || idx} 
                  className={`p-5 rounded-2xl border transition-all ${
                    t.isEnabled ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-black">
                        {idx + 2}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{t.name || 'Unnamed Trustee'}</h4>
                        <span className="text-xs text-slate-500">{t.designation || 'Trustee'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMoveTrustee(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveTrustee(idx, 'down')}
                        disabled={idx === (formData.trustees?.length || 1) - 1}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          const list = [...(formData.trustees || [])];
                          list[idx].isEnabled = !list[idx].isEnabled;
                          setFormData(prev => ({ ...prev, trustees: list }));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                          t.isEnabled 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        {t.isEnabled ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{t.isEnabled ? 'Visible' : 'Hidden'}</span>
                      </button>

                      <button
                        onClick={() => handleRemoveTrustee(idx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Delete trustee profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 items-start">
                    
                    {/* Trustee Photo */}
                    <div className="md:col-span-3 flex flex-col items-center p-3 rounded-xl bg-white border border-slate-200 text-center space-y-2">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-300">
                        {t.photoUrl ? (
                          <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Users className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedTrusteeIndex(idx);
                          trusteePhotoRef.current?.click();
                        }}
                        className="w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Photo</span>
                      </button>
                    </div>

                    {/* Trustee Fields */}
                    <div className="md:col-span-9 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Trustee Full Name</label>
                          <input
                            type="text"
                            value={t.name}
                            onChange={e => {
                              const list = [...(formData.trustees || [])];
                              list[idx].name = e.target.value;
                              setFormData(prev => ({ ...prev, trustees: list }));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Designation / Role</label>
                          <input
                            type="text"
                            value={t.designation}
                            onChange={e => {
                              const list = [...(formData.trustees || [])];
                              list[idx].designation = e.target.value;
                              setFormData(prev => ({ ...prev, trustees: list }));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Short Profile Overview</label>
                        <input
                          type="text"
                          value={t.overview || ''}
                          onChange={e => {
                            const list = [...(formData.trustees || [])];
                            list[idx].overview = e.target.value;
                            setFormData(prev => ({ ...prev, trustees: list }));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          placeholder="Brief 1-sentence credential or background..."
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Detailed Biography</label>
                        <textarea
                          value={t.biography || ''}
                          onChange={e => {
                            const list = [...(formData.trustees || [])];
                            list[idx].biography = e.target.value;
                            setFormData(prev => ({ ...prev, trustees: list }));
                          }}
                          rows={2}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          placeholder="Institutional contributions, experience..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Approved Public Email (Optional)</label>
                          <input
                            type="email"
                            value={t.contactEmail || ''}
                            onChange={e => {
                              const list = [...(formData.trustees || [])];
                              list[idx].contactEmail = e.target.value;
                              setFormData(prev => ({ ...prev, trustees: list }));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Responsibilities (Comma-separated)</label>
                          <input
                            type="text"
                            value={(t.responsibilities || []).join(', ')}
                            onChange={e => {
                              const list = [...(formData.trustees || [])];
                              list[idx].responsibilities = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              setFormData(prev => ({ ...prev, trustees: list }));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADVISORY BOARD & COUNCIL TAB                                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'advisory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Academic & Strategic Advisory Board ({formData.advisoryMembers?.length || 0})</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage profiles, designations, biographies, and guidance portfolios of senior scholars, academicians, and advisors.
                </p>
              </div>
              <button
                onClick={handleAddAdvisoryMember}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Advisory Member</span>
              </button>
            </div>

            {/* Hidden Input for Advisory Photos */}
            <input
              type="file"
              ref={advisoryPhotoRef}
              onChange={e => {
                if (selectedAdvisoryIndex !== null) {
                  handleAdvisoryPhotoUpload(e, selectedAdvisoryIndex);
                }
              }}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <div className="space-y-4">
              {(formData.advisoryMembers || []).map((adv, idx) => (
                <div 
                  key={adv.id || idx} 
                  className={`p-5 rounded-2xl border transition-all ${
                    adv.isEnabled !== false ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-mono text-xs font-black">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{adv.name || 'Unnamed Advisor'}</h4>
                        <span className="text-xs text-slate-500">{adv.designation || 'Academic Advisor'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMoveAdvisoryMember(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveAdvisoryMember(idx, 'down')}
                        disabled={idx === (formData.advisoryMembers?.length || 1) - 1}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          const list = [...(formData.advisoryMembers || [])];
                          list[idx].isEnabled = !(list[idx].isEnabled !== false);
                          setFormData(prev => ({ ...prev, advisoryMembers: list }));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                          adv.isEnabled !== false 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        {adv.isEnabled !== false ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{adv.isEnabled !== false ? 'Visible' : 'Hidden'}</span>
                      </button>

                      <button
                        onClick={() => handleRemoveAdvisoryMember(idx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Delete advisory member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 items-start">
                    
                    {/* Advisor Photo */}
                    <div className="md:col-span-3 flex flex-col items-center p-3 rounded-xl bg-white border border-slate-200 text-center space-y-2">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-300">
                        {adv.photoUrl ? (
                          <img src={adv.photoUrl} alt={adv.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Sparkles className="w-8 h-8 text-amber-500/50" />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedAdvisoryIndex(idx);
                          advisoryPhotoRef.current?.click();
                        }}
                        className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{adv.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      </button>
                    </div>

                    {/* Advisor Info Inputs */}
                    <div className="md:col-span-9 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Advisor Full Name</label>
                          <input
                            type="text"
                            value={adv.name}
                            onChange={e => {
                              const list = [...(formData.advisoryMembers || [])];
                              list[idx].name = e.target.value;
                              setFormData(prev => ({ ...prev, advisoryMembers: list }));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Designation / Institutional Affiliation</label>
                          <input
                            type="text"
                            value={adv.designation}
                            onChange={e => {
                              const list = [...(formData.advisoryMembers || [])];
                              list[idx].designation = e.target.value;
                              setFormData(prev => ({ ...prev, advisoryMembers: list }));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Overview & Advisory Focus</label>
                        <textarea
                          value={adv.overview || ''}
                          onChange={e => {
                            const list = [...(formData.advisoryMembers || [])];
                            list[idx].overview = e.target.value;
                            setFormData(prev => ({ ...prev, advisoryMembers: list }));
                          }}
                          rows={2}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Key Advisory Portfolios (Comma-separated)</label>
                        <input
                          type="text"
                          value={(adv.responsibilities || []).join(', ')}
                          onChange={e => {
                            const list = [...(formData.advisoryMembers || [])];
                            list[idx].responsibilities = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setFormData(prev => ({ ...prev, advisoryMembers: list }));
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 8: AUTHORIZED SIGNATORY & OFFICIAL INSTITUTIONAL SEAL      */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'signatory_seal' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900">Authorized Signatory & Official Institutional Seal</h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure the legal signatory and verified institutional seal used on official receipts, certificates, and letters.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* PART 1: OFFICIAL INSTITUTIONAL SEAL */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <h4 className="text-sm font-bold text-slate-900">Official Institutional Seal</h4>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.signatory?.officialSealEnabled !== false}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      signatory: {
                        ...prev.signatory!,
                        name: prev.signatory?.name || '',
                        designation: prev.signatory?.designation || '',
                        signatureEnabled: prev.signatory?.signatureEnabled ?? true,
                        officialSealEnabled: e.target.checked
                      }
                    }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Seal Active</span>
                </label>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Upload the official embossed round seal of Fatimyah Educational Trust. This seal is stamped onto generated 80G tax certificates and digital membership documents.
              </p>

              {/* Seal Preview Frame */}
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-2 border-dashed border-slate-300">
                {formData.signatory?.officialSealUrl ? (
                  <div className="relative">
                    <img
                      src={formData.signatory.officialSealUrl}
                      alt="Official Trust Seal"
                      className="w-36 h-36 object-contain"
                    />
                    <div className="absolute -top-2 -right-2 p-1 rounded-full bg-emerald-600 text-white shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="w-36 h-36 rounded-full border-4 border-slate-200 flex flex-col items-center justify-center text-center p-3 text-slate-400">
                    <Building2 className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-bold">No Custom Seal Uploaded</span>
                    <span className="text-[8px] text-slate-400 mt-1">Default Seal Active</span>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={sealInputRef}
                onChange={handleSealUpload}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => sealInputRef.current?.click()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload / Replace Seal</span>
                </button>
                {formData.signatory?.officialSealUrl && (
                  <button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      signatory: { ...prev.signatory!, officialSealUrl: '' }
                    }))}
                    className="p-2.5 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors cursor-pointer"
                    title="Remove custom seal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Board Authorization Resolution
                </label>
                <input
                  type="text"
                  value={formData.signatory?.sealResolution || ''}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    signatory: { ...prev.signatory!, sealResolution: e.target.value }
                  }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  placeholder="e.g., Board Resolution dated 12/04/1994"
                />
              </div>
            </div>

            {/* PART 2: AUTHORIZED SIGNATORY & SIGNATURE */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-700" />
                  <h4 className="text-sm font-bold text-slate-900">Authorized Signatory & Signature</h4>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.signatory?.signatureEnabled !== false}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      signatory: {
                        ...prev.signatory!,
                        name: prev.signatory?.name || '',
                        designation: prev.signatory?.designation || '',
                        officialSealEnabled: prev.signatory?.officialSealEnabled ?? true,
                        signatureEnabled: e.target.checked
                      }
                    }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Signature Active</span>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Signatory Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.signatory?.name || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      signatory: { ...prev.signatory!, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Official Signatory Title
                  </label>
                  <input
                    type="text"
                    value={formData.signatory?.designation || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      signatory: { ...prev.signatory!, designation: e.target.value }
                    }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>

                {/* Signature Preview Frame */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Approved Signature Representation
                  </label>
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-slate-300 h-28">
                    {formData.signatory?.signatureUrl ? (
                      <img
                        src={formData.signatory.signatureUrl}
                        alt="Authorized Signature"
                        className="max-h-20 object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <span className="font-serif italic text-base text-slate-500 block">Janab S. A. R. Zaidi</span>
                        <span className="text-[9px] text-slate-400">(Digital cryptographic stamp representation active)</span>
                      </div>
                    )}
                  </div>
                </div>

                <input
                  type="file"
                  ref={sigInputRef}
                  onChange={handleSignatureUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => sigInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Signature</span>
                  </button>
                  {formData.signatory?.signatureUrl && (
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        signatory: { ...prev.signatory!, signatureUrl: '' }
                      }))}
                      className="p-2 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors cursor-pointer"
                      title="Remove custom signature"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Fiduciary Authority Statement
                  </label>
                  <textarea
                    value={formData.signatory?.authorizationStatement || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      signatory: { ...prev.signatory!, authorizationStatement: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* PART 3: CONTROLLED DOCUMENT PLACEMENT TOGGLES */}
          <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-800" />
              <h4 className="text-xs font-black uppercase text-emerald-950 tracking-wider">
                Controlled Document Placement of Official Seal & Signature
              </h4>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Select which official trust documents may render the verified seal and authorized signature:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'useOn80GReceipts', label: '80G Tax Receipts (Form 10BE)' },
                { key: 'useOnMembershipCards', label: 'Digital Membership ID Cards' },
                { key: 'useOnCertificates', label: 'Merit & Volunteer Certificates' },
                { key: 'useOnOfficialLetters', label: 'Official Trust Letters & Notices' }
              ].map(item => (
                <label key={item.key} className="p-3.5 rounded-xl bg-white border border-emerald-200 flex items-center gap-3 cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    checked={(formData.signatory as any)?.[item.key] !== false}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      signatory: {
                        ...prev.signatory!,
                        [item.key]: e.target.checked
                      }
                    }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800 leading-snug">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 9: AUDIT & TRANSPARENCY                                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'transparency' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900">Statutory Audit, Accounting & Public Transparency</h3>
            <p className="text-xs text-slate-500 mt-1">
              External audit firm, annual returns status, public accountability declarations, and fund deployment ratios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Auditor Firm Name & Registration
              </label>
              <input
                type="text"
                value={formData.auditorFirmName || ''}
                onChange={e => setFormData(prev => ({ ...prev, auditorFirmName: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Annual Statutory Return Status
              </label>
              <input
                type="text"
                value={formData.annualReturnStatus || ''}
                onChange={e => setFormData(prev => ({ ...prev, annualReturnStatus: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Statutory Audit Statement
            </label>
            <textarea
              value={formData.auditStatement || ''}
              onChange={e => setFormData(prev => ({ ...prev, auditStatement: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Financial Transparency & Allocation Policy
            </label>
            <textarea
              value={formData.financialTransparency || ''}
              onChange={e => setFormData(prev => ({ ...prev, financialTransparency: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Public Accountability Declaration
            </label>
            <textarea
              value={formData.publicAccountabilityStatement || ''}
              onChange={e => setFormData(prev => ({ ...prev, publicAccountabilityStatement: e.target.value }))}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          {/* Fund Deployment Ratios */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Statutory Fund Deployment Ratios Breakdown
            </h4>

            <div className="space-y-3">
              {(formData.fundDeploymentRatios || []).map((ratio, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Beneficiary Category</label>
                    <input
                      type="text"
                      value={ratio.category}
                      onChange={e => {
                        const list = [...(formData.fundDeploymentRatios || [])];
                        list[idx].category = e.target.value;
                        setFormData(prev => ({ ...prev, fundDeploymentRatios: list }));
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Ratio (%)</label>
                    <input
                      type="number"
                      value={ratio.percentage}
                      onChange={e => {
                        const list = [...(formData.fundDeploymentRatios || [])];
                        list[idx].percentage = Number(e.target.value);
                        setFormData(prev => ({ ...prev, fundDeploymentRatios: list }));
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold bg-white"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Utilization Details</label>
                    <input
                      type="text"
                      value={ratio.description}
                      onChange={e => {
                        const list = [...(formData.fundDeploymentRatios || [])];
                        list[idx].description = e.target.value;
                        setFormData(prev => ({ ...prev, fundDeploymentRatios: list }));
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar with Save Button */}
      <div className="sticky bottom-4 z-20 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border border-slate-800 text-white shadow-2xl flex items-center justify-between gap-4">
        <div className="text-xs text-slate-300 hidden sm:block">
          <span>Editing active section: </span>
          <strong className="text-emerald-400 capitalize">{activeTab.replace('_', ' ')}</strong>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={handleResetToDefaults}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-emerald-200" />
            <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
