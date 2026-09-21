/**
 * @license
 * Role & Permission Governance (RBAC) Management Console
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  UserCheck, 
  Shield, 
  Sparkles,
  Info,
  KeyRound,
  Layers,
  Check,
  X,
  Sliders,
  Eye,
  UserCog,
  Award,
  GraduationCap
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, updateUserRoles, adminUpdateUserProfile, updateUserAccountStatus, SYSTEM_SUPER_ADMIN_EMAIL } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ROLE_DEFINITIONS, 
  PERMISSION_DEFINITIONS, 
  ALL_PERMISSIONS, 
  getEffectivePermissions,
  getRoleMetadata 
} from '../../lib/rbac';
import { UserProfile, UserRole, AppPermission, CoreRole } from '../../types';
import { AssignExamRoleModal } from './exam/AssignExamRoleModal';

export const AdminRolesView: React.FC = () => {
  const { currentUser, activeRole, isSuperAdmin, canManageRoles } = useAuth();
  const [selectedUserForExamRole, setSelectedUserForExamRole] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([
    {
      uid: 'sys-super-admin-01',
      email: SYSTEM_SUPER_ADMIN_EMAIL,
      displayName: 'FET India Secretariat Lead',
      roles: ['super_admin', 'member'],
      primaryRole: 'super_admin',
      role: 'super_admin',
      permissions: ALL_PERMISSIONS,
      customPermissions: [],
      status: 'active',
      createdAt: '1994-08-15T00:00:00Z',
      lastLoginAt: new Date().toISOString()
    }
  ]);

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editedRoles, setEditedRoles] = useState<UserRole[]>([]);
  const [editedPrimaryRole, setEditedPrimaryRole] = useState<UserRole>('member');
  const [editedCustomPermissions, setEditedCustomPermissions] = useState<AppPermission[]>([]);
  const [modalTab, setModalTab] = useState<'profile' | 'roles'>('profile');
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editCountry, setEditCountry] = useState('India');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Core foundation roles + examiner role
  const CORE_ROLES_LIST: UserRole[] = [
    'member',
    'volunteer',
    'donor',
    'examiner',
    'core_member',
    'administrator',
    'super_admin'
  ];

  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!snapshot.empty) {
          const list: UserProfile[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as UserProfile;
            const roles = data.roles || (data.role ? [data.role as UserRole] : ['member']);
            const primaryRole = data.primaryRole || roles[0] || 'member';
            const customPerms = data.customPermissions || [];
            list.push({
              ...data,
              roles,
              primaryRole,
              permissions: getEffectivePermissions(roles, customPerms)
            });
          });

          // Guarantee system super admin lead is visible
          if (!list.some(u => u.email.toLowerCase() === SYSTEM_SUPER_ADMIN_EMAIL.toLowerCase())) {
            list.unshift({
              uid: 'sys-super-admin-01',
              email: SYSTEM_SUPER_ADMIN_EMAIL,
              displayName: 'FET Secretariat Super Admin',
              fullLegalName: 'FET Secretariat Lead',
              roles: ['super_admin', 'member'],
              primaryRole: 'super_admin',
              role: 'super_admin',
              membershipStatus: 'core_member',
              volunteerStatus: 'active_volunteer',
              donorStatus: 'active_donor',
              permissions: ALL_PERMISSIONS,
              customPermissions: [],
              status: 'active',
              createdAt: '1994-08-15T00:00:00Z'
            });
          }
          setUsers(list);
        }
      }, (err) => {
        console.warn('Users listener notification:', err);
      });

      return () => unsub();
    } catch (e) {
      console.warn('Users snapshot initialization:', e);
    }
  }, []);

  const handleSelectUser = (u: UserProfile) => {
    setSelectedUser(u);
    const userRoles = u.roles && u.roles.length > 0 ? [...u.roles] : ['member' as UserRole];
    const userPrimary = u.primaryRole || userRoles[0] || 'member';
    setEditedRoles(userRoles);
    setEditedPrimaryRole(userPrimary);
    setEditedCustomPermissions(u.customPermissions || []);
    setEditName(u.fullLegalName || u.fullName || u.displayName || '');
    setEditMobile(u.mobileNumber || u.phoneNumber || '');
    setEditCity(u.city || u.district || '');
    setEditState(u.state || '');
    setEditCountry(u.country || 'India');
    setEditStatus((u.accountStatus || u.status || 'active') === 'suspended' ? 'suspended' : 'active');
    setModalTab('profile');
  };

  const toggleRole = (role: UserRole) => {
    setEditedRoles(prev => {
      if (prev.includes(role)) {
        if (role === editedPrimaryRole) {
          return prev; // Cannot remove active primary role without changing primary first
        }
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const toggleCustomPermission = (perm: AppPermission) => {
    setEditedCustomPermissions(prev => {
      if (prev.includes(perm)) {
        return prev.filter(p => p !== perm);
      } else {
        return [...prev, perm];
      }
    });
  };

  const handleSaveRoles = async () => {
    if (!selectedUser || !currentUser) return;
    setIsSaving(true);
    setStatusMsg(null);

    // Safeguard: Ensure user has at least one role
    const finalRoles = editedRoles.length > 0 ? editedRoles : ['member' as UserRole];
    const finalPrimary = finalRoles.includes(editedPrimaryRole) ? editedPrimaryRole : finalRoles[0];

    try {
      // 1. Update roles and permissions in Firestore
      await updateUserRoles(
        selectedUser.uid,
        selectedUser.email,
        finalRoles,
        finalPrimary,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'superadmin@fetindia.com',
          role: activeRole
        },
        editedCustomPermissions
      );

      // 2. Update demographic profile details safely (secrets and passwords are never touched)
      const updatedProfile = await adminUpdateUserProfile(
        selectedUser.uid,
        {
          fullLegalName: editName.trim(),
          fullName: editName.trim(),
          displayName: editName.trim(),
          mobileNumber: editMobile.trim(),
          phoneNumber: editMobile.trim(),
          city: editCity.trim(),
          state: editState.trim(),
          country: editCountry.trim()
        },
        {
          uid: currentUser.uid,
          email: currentUser.email || 'superadmin@fetindia.com',
          primaryRole: activeRole
        }
      );

      // 3. Update account status if changed
      const currentStatus = (selectedUser.accountStatus || selectedUser.status || 'active') === 'suspended' ? 'suspended' : 'active';
      if (editStatus !== currentStatus) {
        await updateUserAccountStatus(
          selectedUser.uid,
          selectedUser.email,
          editStatus,
          {
            uid: currentUser.uid,
            email: currentUser.email || 'superadmin@fetindia.com',
            role: activeRole
          },
          `Status modified to ${editStatus} by Super Admin via User Profile & Roles editor`
        );
      }

      const effectivePerms = getEffectivePermissions(finalRoles, editedCustomPermissions);

      // Local optimistic update
      setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? {
        ...u,
        ...updatedProfile,
        fullLegalName: editName.trim(),
        displayName: editName.trim(),
        mobileNumber: editMobile.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        country: editCountry.trim(),
        roles: finalRoles,
        primaryRole: finalPrimary,
        role: finalPrimary,
        permissions: effectivePerms,
        customPermissions: editedCustomPermissions,
        status: editStatus,
        accountStatus: editStatus
      } : u));

      setStatusMsg({
        type: 'success',
        text: `Successfully updated profile and RBAC permissions for ${selectedUser.email}. Immutable audit record logged.`
      });
      setSelectedUser(null);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: `Failed to update user: ${err.message || 'Permission denied by security rules'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.fullLegalName && u.fullLegalName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.roles.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8" id="admin-roles-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-900/10 border border-indigo-700/30 flex items-center justify-center text-indigo-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Role-Based Access Control (RBAC)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized authority governing user scopes, administrative clearance, and granular operational permissions.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            User Directory & Roles
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Permission Matrix
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 6 Core Foundation Roles Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">FET India 6 Foundation Roles</h3>
          <span className="text-[11px] text-slate-600 font-medium">New registrations assigned 'member' by default</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {CORE_ROLES_LIST.map((roleKey) => {
            const def = ROLE_DEFINITIONS[roleKey];
            const isRootSuper = roleKey === 'super_admin';
            return (
              <div 
                key={roleKey} 
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{def.label}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${def.badgeColor}`}>
                      {roleKey}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{def.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">
                    Hierarchy Lvl: <strong className="text-slate-700">{def.hierarchyLevel}</strong>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    def.isAdministrative 
                      ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {def.isAdministrative ? 'Administrative Clearance' : 'Public / Portal Access'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeTab === 'users' ? (
        /* User Search & Management List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Profiles & Active Roles</h3>
              <p className="text-xs text-slate-500">Only authorized administrators can modify or elevate role assignments.</p>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by email, name, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Primary Role</th>
                  <th className="py-3 px-4">Assigned Roles</th>
                  <th className="py-3 px-4">Effective Permissions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isSysSuper = u.email.toLowerCase() === SYSTEM_SUPER_ADMIN_EMAIL.toLowerCase();
                  const meta = getRoleMetadata(u.primaryRole);
                  const effectivePerms = u.permissions || getEffectivePermissions(u.roles || [u.primaryRole]);

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {u.fullLegalName ? u.fullLegalName[0].toUpperCase() : (u.displayName ? u.displayName[0].toUpperCase() : 'U')}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">
                              {u.fullLegalName || u.displayName || 'Trust Member'}
                            </div>
                            <div className="text-[10px] text-slate-600 font-mono">UID: {u.uid.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span>{u.email}</span>
                          {isSysSuper && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                              System Root
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${meta.badgeColor}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((r, rIdx) => (
                            <span key={rIdx} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          {effectivePerms.length} granted
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.accountStatus === 'active' || u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.accountStatus || u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUserForExamRole(u)}
                            disabled={!canManageRoles}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border disabled:opacity-40 ${
                              u.roles?.includes('exam_controller')
                                ? 'text-purple-800 bg-purple-100 hover:bg-purple-200 border-purple-300'
                                : u.roles?.includes('examiner')
                                ? 'text-indigo-800 bg-indigo-100 hover:bg-indigo-200 border-indigo-300'
                                : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200'
                            }`}
                            title="Assign or Manage Examination Role (Examiner / Exam Controller)"
                          >
                            <Award className="w-3.5 h-3.5 text-purple-600" />
                            <span>
                              {u.roles?.includes('exam_controller')
                                ? 'Exam Controller'
                                : u.roles?.includes('examiner')
                                ? 'Examiner'
                                : 'Assign Exam Role'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleSelectUser(u)}
                            disabled={!canManageRoles}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            Manage Roles
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Permission Matrix View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Role-to-Permission Mapping Matrix</h3>
            <p className="text-xs text-slate-500">
              Overview of default capabilities allocated to each role within the FET India infrastructure.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4 min-w-[200px]">Permission Key</th>
                  <th className="py-3 px-4 min-w-[140px]">Target Module</th>
                  {CORE_ROLES_LIST.map((rk) => (
                    <th key={rk} className="py-3 px-3 text-center min-w-[110px]">
                      {ROLE_DEFINITIONS[rk].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSION_DEFINITIONS.map((perm) => (
                  <tr key={perm.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{perm.name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{perm.id}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{perm.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {perm.targetModule || perm.category}
                      </span>
                    </td>
                    {CORE_ROLES_LIST.map((rk) => {
                      const hasDefault = rk === 'super_admin' || ROLE_DEFINITIONS[rk].defaultPermissions.includes(perm.id);
                      return (
                        <td key={rk} className="py-3 px-3 text-center">
                          {hasDefault ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Role & Granular Permissions Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Manage User Account & Permissions</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target: <strong className="text-slate-800">{selectedUser.fullLegalName || selectedUser.displayName}</strong> ({selectedUser.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
              <button
                type="button"
                onClick={() => setModalTab('profile')}
                className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  modalTab === 'profile'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Profile & Demographic Info
              </button>
              <button
                type="button"
                onClick={() => setModalTab('roles')}
                className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  modalTab === 'roles'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Roles & Clearance Permissions
              </button>
            </div>

            {/* TAB 1: Profile & Demographic Details */}
            {modalTab === 'profile' && (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Security Isolation Enforced:</strong> Super Admin can update safe contact and profile demographics. Passwords, auth credentials, and secrets remain securely isolated and never exposed.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">Full Legal Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Syed Ali Raza"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Mobile / WhatsApp Number</label>
                    <input
                      type="tel"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">City / District</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="e.g. Hyderabad / Lucknow"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">State / Region</label>
                    <input
                      type="text"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      placeholder="e.g. Telangana / Uttar Pradesh"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Country</label>
                    <input
                      type="text"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      placeholder="India"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">Account Governance Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as 'active' | 'suspended')}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="active">Active (Full system clearance according to role)</option>
                      <option value="suspended">Suspended (Access locked by Super Administrator)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Roles & Permissions */}
            {modalTab === 'roles' && (
              <>
            {/* Primary Role Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">Primary Role (Default Clearance Level)</label>
              <select
                value={editedPrimaryRole}
                onChange={(e) => {
                  const newP = e.target.value as UserRole;
                  setEditedPrimaryRole(newP);
                  if (!editedRoles.includes(newP)) {
                    setEditedRoles([...editedRoles, newP]);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <optgroup label="Foundation Core Roles">
                  {CORE_ROLES_LIST.map((rKey) => (
                    <option key={rKey} value={rKey}>
                      {ROLE_DEFINITIONS[rKey].label} ({rKey})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Specialized Module Roles">
                  {Object.entries(ROLE_DEFINITIONS)
                    .filter(([k]) => !CORE_ROLES_LIST.includes(k as CoreRole))
                    .map(([rKey, rDef]) => (
                      <option key={rKey} value={rKey}>
                        {rDef.label} ({rKey})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Role Assignment Checklist */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800">Assigned Roles</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CORE_ROLES_LIST.map((rKey) => {
                  const rDef = ROLE_DEFINITIONS[rKey];
                  const isChecked = editedRoles.includes(rKey);
                  const isPrimary = editedPrimaryRole === rKey;

                  return (
                    <button
                      key={rKey}
                      type="button"
                      onClick={() => toggleRole(rKey)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                        isChecked 
                          ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 shadow-xs' 
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-indigo-600 pointer-events-none"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{rDef.label}</span>
                          {isPrimary && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-indigo-200 text-indigo-800 rounded font-semibold">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight">{rDef.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Effective Permissions Preview */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">Effective Permissions Preview</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {getEffectivePermissions(editedRoles, editedCustomPermissions).length} of {ALL_PERMISSIONS.length} active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {PERMISSION_DEFINITIONS.map((perm) => {
                  const isGranted = editedRoles.includes('super_admin') || 
                    editedRoles.some(r => ROLE_DEFINITIONS[r]?.defaultPermissions.includes(perm.id)) ||
                    editedCustomPermissions.includes(perm.id);

                  return (
                    <div 
                      key={perm.id} 
                      className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                        isGranted 
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium' 
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <span className="truncate pr-2">{perm.name}</span>
                      {isGranted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            </>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">All updates write to immutable audit log</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoles}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Updating Roles...' : 'Save Changes'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Dedicated Examination Role Assignment Modal */}
      <AssignExamRoleModal
        isOpen={Boolean(selectedUserForExamRole)}
        onClose={() => setSelectedUserForExamRole(null)}
        targetUser={selectedUserForExamRole}
        onSuccess={(updatedUser) => {
          setUsers(prev => prev.map(u => u.uid === updatedUser.uid ? updatedUser : u));
        }}
      />

    </div>
  );
};
