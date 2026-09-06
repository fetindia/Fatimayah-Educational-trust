/**
 * @license
 * Role-Based Access Control (RBAC) Engine & Permissions Matrix
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Public Brand: FET India
 * Tagline: Education • Service • Empowerment
 */

import { AppPermission, CoreRole, PermissionDefinition, RoleMetadata, UserRole } from '../types';

/**
 * Granular Permission Definitions for FET India Platform
 */
export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    id: 'users.view',
    name: 'View User Directory',
    description: 'Read-only access to browse registered trust members, profiles, and basic verification statuses.',
    category: 'User & Role Security',
    targetModule: 'User Management'
  },
  {
    id: 'users.manage',
    name: 'Manage User Profiles',
    description: 'Update user account information, profile completion flags, and user account status.',
    category: 'User & Role Security',
    targetModule: 'User Management'
  },
  {
    id: 'roles.manage',
    name: 'Assign & Manage Roles',
    description: 'Exclusive administrative right to assign, change, elevate, or revoke user roles and custom permissions.',
    category: 'User & Role Security',
    targetModule: 'RBAC Security Subsystem'
  },
  {
    id: 'volunteers.manage',
    name: 'Manage Volunteer Subsystem',
    description: 'Review volunteer applications, approve service hours, assign field missions, and issue volunteer IDs.',
    category: 'Core Operations',
    targetModule: 'Volunteer Network'
  },
  {
    id: 'donors.manage',
    name: 'Manage Donor & 80G Subsystem',
    description: 'Reconcile contributions, manage donor accounts, and issue statutory Section 80G tax exemption certificates.',
    category: 'Core Operations',
    targetModule: 'Donations & Crowdfunding'
  },
  {
    id: 'members.manage',
    name: 'Manage Membership & KYC',
    description: 'Approve digital trust memberships, verify KYC submissions, issue Member ID cards, and manage tiers.',
    category: 'Core Operations',
    targetModule: 'Membership Management'
  },
  {
    id: 'modules.manage',
    name: 'Manage Platform Modules',
    description: 'Activate, configure, enable, or disable platform chapters and module lifecycles.',
    category: 'System Administration',
    targetModule: 'Module Matrix'
  },
  {
    id: 'settings.manage',
    name: 'Manage Global Trust Settings',
    description: 'Update organization contact details, dynamic CMS sliders, announcements, social links, and public branding.',
    category: 'System Administration',
    targetModule: 'Organization Configuration'
  },
  {
    id: 'finance.manage',
    name: 'Manage Trust Finances & Ledgers',
    description: 'Oversee income ledgers, expense requisitions, payment vouchers, approvals, and statutory audit compliance.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  }
];

export const ALL_PERMISSIONS: AppPermission[] = [
  'users.view',
  'users.manage',
  'roles.manage',
  'volunteers.manage',
  'donors.manage',
  'members.manage',
  'modules.manage',
  'settings.manage',
  'finance.manage'
];

/**
 * Standard Role Definitions with Default Permission Sets & Hierarchies
 */
export const ROLE_DEFINITIONS: Record<UserRole, RoleMetadata> = {
  // -------------------------------------------------------------
  // CORE INITIAL ROLES
  // -------------------------------------------------------------
  super_admin: {
    id: 'super_admin',
    label: 'Super Administrator',
    description: 'Highest administrative authority with full sovereign control over all modules, security policies, role assignments, and platform configurations.',
    hierarchyLevel: 100,
    isAdministrative: true,
    defaultPermissions: [
      'users.view',
      'users.manage',
      'roles.manage',
      'volunteers.manage',
      'donors.manage',
      'members.manage',
      'modules.manage',
      'settings.manage',
      'finance.manage'
    ],
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
  },
  administrator: {
    id: 'administrator',
    label: 'Platform Administrator',
    description: 'General system administrator authorized to manage operations, users, modules, and platform configuration.',
    hierarchyLevel: 80,
    isAdministrative: true,
    defaultPermissions: [
      'users.view',
      'users.manage',
      'volunteers.manage',
      'donors.manage',
      'members.manage',
      'modules.manage',
      'settings.manage'
    ],
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800'
  },
  core_member: {
    id: 'core_member',
    label: 'Core Member',
    description: 'Elected or appointed governance core member approved by the Trust Administration.',
    hierarchyLevel: 50,
    isAdministrative: false,
    defaultPermissions: [
      'users.view',
      'members.manage',
      'volunteers.manage'
    ],
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
  },
  donor: {
    id: 'donor',
    label: 'Benefactor / Donor',
    description: 'Valued patron contributing to educational scholarships, relief drives, and corpus funds with access to donor receipts.',
    hierarchyLevel: 10,
    isAdministrative: false,
    defaultPermissions: [],
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
  },
  volunteer: {
    id: 'volunteer',
    label: 'Registered Volunteer',
    description: 'Dedicated field volunteer participating in educational camps, distribution drives, and community welfare programs.',
    hierarchyLevel: 10,
    isAdministrative: false,
    defaultPermissions: [],
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
  },
  member: {
    id: 'member',
    label: 'General Member',
    description: 'Official approved General Member of Fatimyah Educational Trust with community and voting entitlements.',
    hierarchyLevel: 5,
    isAdministrative: false,
    defaultPermissions: [],
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
  },

  // -------------------------------------------------------------
  // SPECIALIZED MODULE ADMINISTRATORS (Legacy/Compatibility)
  // -------------------------------------------------------------
  volunteer_admin: {
    id: 'volunteer_admin',
    label: 'Volunteer Administrator',
    description: 'Oversees volunteer registration, verification, field missions, and service hours.',
    hierarchyLevel: 70,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'volunteers.manage'],
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
  },
  member_admin: {
    id: 'member_admin',
    label: 'Member Administrator',
    description: 'Manages trust memberships, KYC verifications, card renewals, and member directory.',
    hierarchyLevel: 70,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'members.manage'],
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800'
  },
  donor_admin: {
    id: 'donor_admin',
    label: 'Donor Administrator',
    description: 'Reconciles contributions, verifies transactions, and issues Section 80G tax certificates.',
    hierarchyLevel: 70,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'donors.manage'],
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
  },
  crowdfunding_admin: {
    id: 'crowdfunding_admin',
    label: 'Crowdfunding Administrator',
    description: 'Manages public crowdfunding campaigns, emergency relief appeals, and causes.',
    hierarchyLevel: 70,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'donors.manage', 'modules.manage'],
    badgeColor: 'bg-orange-950 text-orange-300 border-orange-800'
  },
  examination_admin: {
    id: 'examination_admin',
    label: 'Examination Administrator',
    description: 'Oversees talent search examinations, student hall tickets, and evaluations.',
    hierarchyLevel: 70,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'modules.manage'],
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
  },
  exam_admin: {
    id: 'exam_admin',
    label: 'Examination Administrator',
    description: 'Oversees talent search examinations, student hall tickets, and evaluations.',
    hierarchyLevel: 70,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'modules.manage'],
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
  },
  school_admin: {
    id: 'school_admin',
    label: 'School Administrator',
    description: 'Manages school academic rosters, admissions, and educator rosters.',
    hierarchyLevel: 70,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'modules.manage'],
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-800'
  },
  madrasa_admin: {
    id: 'madrasa_admin',
    label: 'Madrasa Administrator',
    description: 'Oversees affiliated madrasas, Hifz curricula, and boarding logs.',
    hierarchyLevel: 70,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'modules.manage'],
    badgeColor: 'bg-teal-950 text-teal-300 border-teal-800'
  },
  finance_admin: {
    id: 'finance_admin',
    label: 'Finance Administrator',
    description: 'Oversees double-entry ledgers, expense authorizations, and audits.',
    hierarchyLevel: 75,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'donors.manage', 'settings.manage', 'finance.manage'],
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
  },
  hr_admin: {
    id: 'hr_admin',
    label: 'HR Administrator',
    description: 'Manages staff directory, educator payroll, and leave approvals.',
    hierarchyLevel: 70,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'users.manage'],
    badgeColor: 'bg-violet-950 text-violet-300 border-violet-800'
  },
  content_admin: {
    id: 'content_admin',
    label: 'Content Administrator',
    description: 'Publishes official trust bulletins, press releases, and articles.',
    hierarchyLevel: 60,
    isAdministrative: true,
    defaultPermissions: ['settings.manage'],
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-800'
  },
  blog_admin: {
    id: 'blog_admin',
    label: 'Blog Administrator',
    description: 'Publishes official trust bulletins, press releases, and articles.',
    hierarchyLevel: 60,
    isAdministrative: true,
    defaultPermissions: ['settings.manage'],
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-800'
  },
  store_admin: {
    id: 'store_admin',
    label: 'Store Administrator',
    description: 'Oversees FET Store merchandise, books, and orders.',
    hierarchyLevel: 60,
    isAdministrative: true,
    defaultPermissions: ['modules.manage'],
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
  },
  travel_admin: {
    id: 'travel_admin',
    label: 'Travel Administrator',
    description: 'Manages pilgrimage packages, Umrah, Ziyarat, and pilgrim manifests.',
    hierarchyLevel: 60,
    isAdministrative: true,
    defaultPermissions: ['modules.manage'],
    badgeColor: 'bg-sky-950 text-sky-300 border-sky-800'
  },
  reports_admin: {
    id: 'reports_admin',
    label: 'Reports Administrator',
    description: 'Generates analytical impact summaries and statutory audit packs.',
    hierarchyLevel: 65,
    isAdministrative: true,
    defaultPermissions: ['users.view'],
    badgeColor: 'bg-slate-900 text-slate-300 border-slate-800'
  },
  student: {
    id: 'student',
    label: 'Student / Scholar',
    description: 'Student enrolled in trust institutions or scholarship recipient.',
    hierarchyLevel: 1,
    isAdministrative: false,
    defaultPermissions: [],
    badgeColor: 'bg-sky-950 text-sky-300 border-sky-800'
  },
  user: {
    id: 'user',
    label: 'Registered User',
    description: 'Standard registered user of the FET India digital portal with basic user features.',
    hierarchyLevel: 1,
    isAdministrative: false,
    defaultPermissions: [],
    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700'
  }
};

/**
 * Computes the complete set of effective permissions from a list of user roles and optional custom permissions
 */
export function getEffectivePermissions(
  roles: UserRole[] = ['user'],
  customPermissions: AppPermission[] = []
): AppPermission[] {
  // Super admin always receives ALL permissions implicitly
  if (roles.includes('super_admin')) {
    return [...ALL_PERMISSIONS];
  }

  const permissionSet = new Set<AppPermission>(customPermissions);

  for (const role of roles) {
    const roleMeta = ROLE_DEFINITIONS[role];
    if (roleMeta?.defaultPermissions) {
      for (const perm of roleMeta.defaultPermissions) {
        permissionSet.add(perm);
      }
    }
  }

  return Array.from(permissionSet);
}

/**
 * Checks if a user with specific roles & custom permissions has a required permission
 */
export function checkUserPermission(
  roles: UserRole[] = ['member'],
  requiredPermission: AppPermission,
  customPermissions: AppPermission[] = []
): boolean {
  if (roles.includes('super_admin')) return true;
  const effective = getEffectivePermissions(roles, customPermissions);
  return effective.includes(requiredPermission);
}

/**
 * Checks if a user has ANY of the required permissions
 */
export function checkUserAnyPermission(
  roles: UserRole[] = ['member'],
  requiredPermissions: AppPermission[],
  customPermissions: AppPermission[] = []
): boolean {
  if (roles.includes('super_admin')) return true;
  const effective = getEffectivePermissions(roles, customPermissions);
  return requiredPermissions.some(perm => effective.includes(perm));
}

/**
 * Checks if a user has ALL of the required permissions
 */
export function checkUserAllPermissions(
  roles: UserRole[] = ['member'],
  requiredPermissions: AppPermission[],
  customPermissions: AppPermission[] = []
): boolean {
  if (roles.includes('super_admin')) return true;
  const effective = getEffectivePermissions(roles, customPermissions);
  return requiredPermissions.every(perm => effective.includes(perm));
}

/**
 * Returns true if any of the given roles possesses administrative clearance
 */
export function isAdministrativeRole(role: UserRole): boolean {
  const meta = ROLE_DEFINITIONS[role];
  return Boolean(meta?.isAdministrative);
}

/**
 * Retrieves role metadata with safe fallback
 */
export function getRoleMetadata(role: UserRole): RoleMetadata {
  return (
    ROLE_DEFINITIONS[role] || {
      id: role,
      label: role,
      description: 'Standard role profile.',
      hierarchyLevel: 1,
      isAdministrative: false,
      defaultPermissions: [],
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  );
}
