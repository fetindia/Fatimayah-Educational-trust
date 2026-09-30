/**
 * @license
 * Delegated Jurisdictional Administrative Governance Modal
 * Fatimyah Educational Trust India (FET India)
 * 
 * Exclusively enables Super Admin to assign, configure, inspect, or revoke:
 * - District Administrators & Case/Exam Managers
 * - State/UT Administrators & Case/Exam Managers
 * - National Administrators & Case/Exam Managers
 * 
 * Enforces strict principle of least privilege: delegated admins never receive
 * unrestricted Super Admin authority or access to unrelated modules/data.
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  X, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Globe, 
  Building2, 
  Award, 
  HeartHandshake, 
  Calendar, 
  Layers, 
  Plus, 
  Trash2, 
  Sparkles,
  Info
} from 'lucide-react';
import { UserProfile, AdminScopeLevel, AdminModuleScope, DelegatedAdminScope } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { assignDelegatedScope, revokeDelegatedScope } from '../../../lib/firebase';
import { INDIAN_STATES_AND_UTS, ALL_INDIAN_STATES, getDistrictsForState } from '../../../data/indiaLocations';

interface AssignDelegatedAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  onSuccess?: (updatedUser: UserProfile) => void;
}

export const AssignDelegatedAdminModal: React.FC<AssignDelegatedAdminModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccess
}) => {
  const { currentUser, isSuperAdmin, activeRole } = useAuth();

  const [level, setLevel] = useState<AdminScopeLevel>('district');
  const [module, setModule] = useState<AdminModuleScope>('both');
  const [selectedState, setSelectedState] = useState<string>('Jammu & Kashmir');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['Jammu']);
  const [customDistrictInput, setCustomDistrictInput] = useState<string>('');

  // Granular rights
  const [canRead, setCanRead] = useState<boolean>(true);
  const [canReview, setCanReview] = useState<boolean>(true);
  const [canRecommend, setCanRecommend] = useState<boolean>(true);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [canApprove, setCanApprove] = useState<boolean>(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Update available districts when state changes
  useEffect(() => {
    if (selectedState && selectedState !== 'All India') {
      const districts = getDistrictsForState(selectedState);
      setAvailableDistricts(districts);
      if (districts.length > 0 && selectedDistricts.length === 0) {
        setSelectedDistricts([districts[0]]);
      }
    } else {
      setAvailableDistricts([]);
      setSelectedDistricts([]);
    }
  }, [selectedState]);

  // Load existing user scope when modal opens
  useEffect(() => {
    if (targetUser) {
      const existingScope = targetUser.delegatedScopes?.find(s => s.status === 'active');
      if (existingScope) {
        setLevel(existingScope.level);
        setModule(existingScope.module);
        setSelectedState(existingScope.assignedState || 'Jammu & Kashmir');
        setSelectedDistricts(existingScope.assignedDistricts || []);
        setCanRead(existingScope.canRead);
        setCanReview(existingScope.canReview);
        setCanRecommend(existingScope.canRecommend);
        setCanEdit(existingScope.canEdit);
        setCanApprove(existingScope.canApprove);
        setExpiresAt(existingScope.expiresAt || '');
        setNotes(existingScope.notes || '');
      } else {
        // Default clean state
        setLevel('district');
        setModule('both');
        setSelectedState(targetUser.state || 'Jammu & Kashmir');
        const defaultD = targetUser.district ? [targetUser.district] : ['Jammu'];
        setSelectedDistricts(defaultD);
        setCanRead(true);
        setCanReview(true);
        setCanRecommend(true);
        setCanEdit(false);
        setCanApprove(false);
        setExpiresAt('');
        setNotes('');
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [targetUser]);

  if (!isOpen || !targetUser) return null;

  const toggleDistrict = (district: string) => {
    setSelectedDistricts(prev => {
      if (prev.includes(district)) {
        return prev.filter(d => d !== district);
      } else {
        return [...prev, district];
      }
    });
  };

  const handleAddCustomDistrict = () => {
    const trimmed = customDistrictInput.trim();
    if (!trimmed) return;
    if (!selectedDistricts.includes(trimmed)) {
      setSelectedDistricts(prev => [...prev, trimmed]);
    }
    setCustomDistrictInput('');
  };

  const handleSaveDelegation = async () => {
    if (!currentUser || !isSuperAdmin) {
      setErrorMsg('Only the Super Administrator may assign delegated authorities.');
      return;
    }

    if (level === 'district' && selectedDistricts.length === 0) {
      setErrorMsg('Please select at least one assigned district for a District-level administrator.');
      return;
    }

    if ((level === 'district' || level === 'state') && !selectedState) {
      setErrorMsg('Please select an assigned State or Union Territory.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const scopeData: DelegatedAdminScope = {
        uid: targetUser.uid,
        email: targetUser.email,
        displayName: targetUser.displayName || targetUser.fullName || targetUser.fullLegalName || targetUser.email,
        level,
        module,
        assignedState: level === 'national' ? 'All India' : selectedState,
        assignedDistricts: level === 'district' ? selectedDistricts : undefined,
        canRead,
        canReview,
        canRecommend,
        canApprove,
        canEdit,
        status: 'active',
        expiresAt: expiresAt || undefined,
        assignedByUid: currentUser.uid,
        assignedByEmail: currentUser.email || 'superadmin@fetindia.org',
        assignedAt: new Date().toISOString(),
        notes: notes.trim() || undefined
      };

      await assignDelegatedScope(
        targetUser.uid,
        targetUser.email,
        scopeData,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'superadmin@fetindia.org',
          role: activeRole
        }
      );

      setSuccessMsg(`Delegated authority successfully granted to ${targetUser.email}.`);

      if (onSuccess) {
        onSuccess({
          ...targetUser,
          activeScopeLevel: level,
          assignedState: scopeData.assignedState,
          assignedDistricts: scopeData.assignedDistricts,
          delegatedScopes: [scopeData, ...(targetUser.delegatedScopes || []).filter(s => s.status !== 'active')]
        });
      }

      setTimeout(() => {
        onClose();
      }, 1200);

    } catch (err: any) {
      console.error('Delegation error:', err);
      setErrorMsg(err?.message || 'Failed to save delegated authority.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevokeScope = async (scopeId: string) => {
    if (!currentUser || !isSuperAdmin) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await revokeDelegatedScope(
        targetUser.uid,
        targetUser.email,
        scopeId,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'superadmin@fetindia.org',
          role: activeRole
        }
      );

      setSuccessMsg(`Delegated scope revoked for ${targetUser.email}.`);
      if (onSuccess) {
        onSuccess({
          ...targetUser,
          delegatedScopes: (targetUser.delegatedScopes || []).map(s => s.id === scopeId ? { ...s, status: 'suspended' } : s)
        });
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Revoke error:', err);
      setErrorMsg(err?.message || 'Failed to revoke delegated authority.');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeScopes = targetUser.delegatedScopes?.filter(s => s.status === 'active') || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-white my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Super Admin Delegation
                </span>
                <span className="text-xs text-slate-400">District • State • National</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Assign Jurisdictional Administrator</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target User Banner */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-slate-400">Target Officer / Member</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {targetUser.displayName || targetUser.fullName || targetUser.fullLegalName || 'FET Registered User'}
            </p>
            <p className="text-emerald-400 font-mono text-[11px]">{targetUser.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-[11px]">
              Current: {targetUser.primaryRole || 'member'}
            </span>
          </div>
        </div>

        {/* Existing Active Delegations (if any) */}
        {activeScopes.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Active Delegated Authorities on this Account</span>
            </label>
            <div className="space-y-2">
              {activeScopes.map((scope) => (
                <div key={scope.id} className="p-3 rounded-xl bg-slate-950/80 border border-amber-900/40 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                      {scope.level} Level • {scope.module}
                    </span>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Jurisdiction: {scope.assignedState || 'All India'}
                      {scope.assignedDistricts && scope.assignedDistricts.length > 0 ? ` (${scope.assignedDistricts.join(', ')})` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeScope(scope.id || '')}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-300 bg-rose-950/60 border border-rose-800 hover:bg-rose-900 transition-colors cursor-pointer"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="space-y-5 text-xs">
          
          {/* 1. Administrative Level Selection */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>1. Administrative Level</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'district', label: 'District Level', desc: 'Manage explicitly assigned district(s)' },
                { id: 'state', label: 'State/UT Level', desc: 'Manage permitted areas within State/UT' },
                { id: 'national', label: 'National Level', desc: 'Oversee permitted areas nationwide' }
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setLevel(tier.id as AdminScopeLevel)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    level === tier.id 
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg shadow-emerald-950/40' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">{tier.label}</div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">{tier.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Module Assignment */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>2. Module Portfolio Access</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'crowdfunding', label: 'Crowdfunding & Appeals', icon: HeartHandshake },
                { id: 'examinations', label: 'Examinations & Contests', icon: Award },
                { id: 'both', label: 'Both Modules', icon: Layers }
              ].map((mod) => {
                const IconComponent = mod.icon;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setModule(mod.id as AdminModuleScope)}
                    className={`p-3 rounded-2xl border flex items-center gap-2 transition-all cursor-pointer ${
                      module === mod.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-xs">{mod.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Jurisdictional Location Configuration */}
          {level !== 'national' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>3. Assigned State or Union Territory</span>
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {ALL_INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* District multi-select for District Admin */}
              {level === 'district' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="font-bold text-slate-300 flex items-center justify-between">
                    <span>Assigned Districts within {selectedState}:</span>
                    <span className="text-[11px] text-emerald-400 font-semibold">{selectedDistricts.length} selected</span>
                  </label>

                  {/* Standard Districts Chips */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {availableDistricts.map((d) => {
                      const isSelected = selectedDistricts.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDistrict(d)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{d}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom District Add (for future districts / sub-districts anywhere in India) */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add custom district / area name..."
                      value={customDistrictInput}
                      onChange={(e) => setCustomDistrictInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomDistrict();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomDistrict}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {level === 'national' && (
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-xs text-blue-200 leading-relaxed">
                <strong>National Jurisdiction:</strong> This administrator will have pan-India oversight for the assigned module, reviewing appeals or coordinating examinations across all states according to Super Admin guidelines.
              </p>
            </div>
          )}

          {/* 4. Permissions & Approvals Toggles */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300">4. Granular Rights & Authorizations</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canRead}
                  onChange={(e) => setCanRead(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="font-bold text-white text-xs">Read & View Jurisdiction Data</div>
                  <p className="text-[10px] text-slate-500">Access cases, docs & candidates in assigned scope</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canReview}
                  onChange={(e) => setCanReview(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="font-bold text-white text-xs">Document Verification & Clarifications</div>
                  <p className="text-[10px] text-slate-500">Verify proofs, inspect claims & request revisions</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canRecommend}
                  onChange={(e) => setCanRecommend(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="font-bold text-white text-xs">Formal Recommendations</div>
                  <p className="text-[10px] text-slate-500">Submit recommend approve / reject to Super Admin</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canEdit}
                  onChange={(e) => setCanEdit(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="font-bold text-white text-xs">Manage Exam Logistics</div>
                  <p className="text-[10px] text-slate-500">Update exam hall seating & check-in candidates</p>
                </div>
              </label>

              {/* High privilege approval toggle */}
              <label className="col-span-full flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-amber-900/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canApprove}
                  onChange={(e) => setCanApprove(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="font-bold text-amber-300 text-xs">Grant Final Approval Right (Super Admin Prerogative)</div>
                  <p className="text-[10px] text-slate-400">By default delegated admins only review & recommend. Enable only if this officer is empowered to publish appeals directly.</p>
                </div>
              </label>
            </div>
          </div>

          {/* 5. Optional Expiration Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[11px] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Optional Expiry / Term Limit</span>
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[11px]">Appointment Reference / Notes</label>
              <input
                type="text"
                placeholder="e.g. Approved via Board Resolution #2026/04"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDelegation}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 transition-all shadow-md active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Delegation...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm & Grant Delegated Authority</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
