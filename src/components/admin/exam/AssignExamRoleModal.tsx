/**
 * @license
 * Examination Role Assignment Modal (Examiner / Exam Controller)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Allows Super Admin to select an existing user/profile from the user/member
 * management area and grant or revoke examination-management access:
 * - Exam Controller: Comprehensive authority across competitions, papers, results, top 100 & certificates.
 * - Examiner: Academic evaluation authority for question banks, grading, evaluations, and answer reviews.
 * - Revoke: Removes examination clearance without affecting standard user/member roles.
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  GraduationCap, 
  ShieldCheck, 
  UserCheck, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  FileCheck2, 
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { UserProfile, UserRole } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { updateUserRoles } from '../../../lib/firebase';
import { getEffectivePermissions } from '../../../lib/rbac';

interface AssignExamRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  onSuccess?: (updatedUser: UserProfile) => void;
}

export const AssignExamRoleModal: React.FC<AssignExamRoleModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccess
}) => {
  const { currentUser, isSuperAdmin, activeRole } = useAuth();
  
  const [selectedExamRole, setSelectedExamRole] = useState<'examiner' | 'exam_controller' | 'none'>('none');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync current state when target user changes
  useEffect(() => {
    if (targetUser) {
      if (targetUser.roles.includes('exam_controller') || targetUser.primaryRole === 'exam_controller') {
        setSelectedExamRole('exam_controller');
      } else if (targetUser.roles.includes('examiner') || targetUser.primaryRole === 'examiner') {
        setSelectedExamRole('examiner');
      } else if (targetUser.roles.includes('exam_admin')) {
        setSelectedExamRole('exam_controller');
      } else {
        setSelectedExamRole('none');
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [targetUser]);

  if (!isOpen || !targetUser) return null;

  const currentHasExamRole = 
    targetUser.roles.includes('exam_controller') || 
    targetUser.roles.includes('examiner') || 
    targetUser.roles.includes('exam_admin');

  const currentRoleName = targetUser.roles.includes('exam_controller')
    ? 'Exam Controller'
    : targetUser.roles.includes('examiner')
    ? 'Examiner'
    : targetUser.roles.includes('exam_admin')
    ? 'Exam Controller (Legacy Admin)'
    : 'Standard Member / Public User';

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Clean existing exam roles
      const examRolesToRemove: UserRole[] = ['examiner', 'exam_controller', 'exam_admin', 'examination_admin'];
      let updatedRoles = targetUser.roles.filter(r => !examRolesToRemove.includes(r));

      let newPrimaryRole = targetUser.primaryRole || 'member';

      if (selectedExamRole === 'exam_controller') {
        updatedRoles = [...updatedRoles, 'exam_controller'];
        // If user was previously only a regular member/user, elevate primary or keep foundation
        if (newPrimaryRole === 'user' || newPrimaryRole === 'member' || examRolesToRemove.includes(newPrimaryRole)) {
          newPrimaryRole = 'exam_controller';
        }
      } else if (selectedExamRole === 'examiner') {
        updatedRoles = [...updatedRoles, 'examiner'];
        if (newPrimaryRole === 'user' || examRolesToRemove.includes(newPrimaryRole)) {
          newPrimaryRole = 'examiner';
        }
      } else {
        // Revoked: ensure at least one role remains
        if (updatedRoles.length === 0) {
          updatedRoles = ['member'];
        }
        if (examRolesToRemove.includes(newPrimaryRole)) {
          newPrimaryRole = updatedRoles[0] || 'member';
        }
      }

      await updateUserRoles(
        targetUser.uid,
        targetUser.email,
        updatedRoles,
        newPrimaryRole,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'superadmin@fetindia.com',
          role: activeRole
        },
        targetUser.customPermissions || [],
        targetUser.membershipStatus
      );

      const effectivePerms = getEffectivePermissions(updatedRoles, targetUser.customPermissions || []);

      const updatedProfile: UserProfile = {
        ...targetUser,
        roles: updatedRoles,
        primaryRole: newPrimaryRole,
        role: newPrimaryRole,
        permissions: effectivePerms
      };

      setSuccessMsg(
        selectedExamRole === 'none'
          ? `Examination access revoked for ${targetUser.email}. User restored to standard profile.`
          : `Successfully designated ${targetUser.email} as ${selectedExamRole === 'exam_controller' ? 'Exam Controller' : 'Examiner'}.`
      );

      if (onSuccess) {
        onSuccess(updatedProfile);
      }

      // Auto close after brief display
      setTimeout(() => {
        onClose();
      }, 1400);

    } catch (err: any) {
      console.error('Failed to update examination role:', err);
      setErrorMsg(err.message || 'Failed to update examination role.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" id="assign-exam-role-modal">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Assign Examination Role
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200">
                  RBAC Governed
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Grant dedicated examination-management authority to an existing user profile.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Selected User Identity Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Target User Profile
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              currentHasExamRole 
                ? 'bg-purple-100 text-purple-900 border border-purple-300' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              Current: {currentRoleName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Full Name:</span>
              <strong className="text-slate-800">
                {targetUser.fullLegalName || targetUser.displayName || 'Unnamed Profile'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Email Address:</span>
              <span className="text-slate-700 font-mono text-[11px] break-all">{targetUser.email}</span>
            </div>
            {targetUser.membershipId && (
              <div>
                <span className="text-slate-400 text-[10px] block">Member ID:</span>
                <span className="font-mono text-slate-700 font-bold">{targetUser.membershipId}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 text-[10px] block">Assigned Roles:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {targetUser.roles?.map(r => (
                  <span key={r} className="px-1.5 py-0.2 bg-white border border-slate-300 rounded text-[10px] font-semibold text-slate-700">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Examination Role Options */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            Select Examination Management Clearance
          </label>

          <div className="space-y-2.5">
            {/* Option 1: Exam Controller */}
            <div
              onClick={() => setSelectedExamRole('exam_controller')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedExamRole === 'exam_controller'
                  ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="examRoleSelection"
                checked={selectedExamRole === 'exam_controller'}
                onChange={() => setSelectedExamRole('exam_controller')}
                className="mt-1 text-purple-700 focus:ring-purple-600 cursor-pointer"
              />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span className="text-sm font-bold text-slate-900">Exam Controller</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-200 text-purple-900">
                    Full Authority
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Comprehensive examination authority. Can create and edit exams, set schedules, eligibility, fees, approve question banks & paper builder, oversee participant admissions, evaluate answers, calculate and publish results, manage Top 100 ranking, and issue digital certificates.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-purple-800 font-medium">
                  <span className="px-2 py-0.5 bg-purple-100 rounded">exams.manage</span>
                  <span className="px-2 py-0.5 bg-purple-100 rounded">exams.evaluate</span>
                  <span className="px-2 py-0.5 bg-purple-100 rounded">results.publish</span>
                  <span className="px-2 py-0.5 bg-purple-100 rounded">certificates.issue</span>
                </div>
              </div>
            </div>

            {/* Option 2: Examiner */}
            <div
              onClick={() => setSelectedExamRole('examiner')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedExamRole === 'examiner'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="examRoleSelection"
                checked={selectedExamRole === 'examiner'}
                onChange={() => setSelectedExamRole('examiner')}
                className="mt-1 text-indigo-700 focus:ring-indigo-600 cursor-pointer"
              />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-700" />
                    <span className="text-sm font-bold text-slate-900">Examiner</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-200 text-indigo-900">
                    Academic Evaluator
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Academic evaluation and grading authority. Can author questions, build draft papers, evaluate candidate response sheets, review submitted answers, grade scores, and inspect marks before publication.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-indigo-800 font-medium">
                  <span className="px-2 py-0.5 bg-indigo-100 rounded">exams.evaluate</span>
                  <span className="px-2 py-0.5 bg-indigo-100 rounded">questions.author</span>
                  <span className="px-2 py-0.5 bg-indigo-100 rounded">papers.build</span>
                </div>
              </div>
            </div>

            {/* Option 3: Revoke / No Access */}
            <div
              onClick={() => setSelectedExamRole('none')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedExamRole === 'none'
                  ? 'border-slate-400 bg-slate-50 shadow-xs ring-1 ring-slate-400'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="examRoleSelection"
                checked={selectedExamRole === 'none'}
                onChange={() => setSelectedExamRole('none')}
                className="mt-1 text-slate-600 focus:ring-slate-500 cursor-pointer"
              />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-bold text-slate-700">No Examination Role / Revoke Access</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    Standard Member
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The user will have no examination administration or evaluation access. They can participate in exams as a standard student/candidate.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Governance Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Strict Scope Separation Notice</span>
            <span>
              Users assigned Examiner or Exam Controller access will ONLY see the Examination Management Dashboard. They will NOT receive Super Admin rights or access to financial ledgers, user management, or platform settings.
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 active:scale-98 shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Writing to RBAC...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Role Assignment</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
