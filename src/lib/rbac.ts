/**
 * @license
 * Role-Based Access Control (RBAC) Engine & Permissions Matrix
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Public Brand: FET India
 * Tagline: Education • Service • Empowerment
 */

import { 
  AppPermission, 
  CoreRole, 
  PermissionDefinition, 
  RoleMetadata, 
  UserRole,
  UserProfile,
  DelegatedAdminScope,
  CrowdfundingCampaign,
  CompetitionRegistration,
  Competition
} from '../types';

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
  },
  {
    id: 'finance.view',
    name: 'View Financial Records',
    description: 'Read-only access to view Trust ledgers, income, expenses, accounts, and financial reports.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.income',
    name: 'Record & Manage Income',
    description: 'Create and verify income entries, donations receipts, and miscellaneous incoming funds.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.income.view',
    name: 'View Income Records',
    description: 'Access and review income registers, fee contributions, and linked donor credits.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.income.create',
    name: 'Register Incoming Funds',
    description: 'Create new manual income entries for fees, offline receipts, grants, and contributions.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.income.edit',
    name: 'Modify Income Records',
    description: 'Update draft income records and reference numbers prior to final ledger posting.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.expense',
    name: 'Manage Expenses & Requisitions',
    description: 'Draft and submit expense requisitions, vendor bills, and operational disbursement requests.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.expense.view',
    name: 'View Expense Requisitions',
    description: 'Access department expense vouchers, requisitions, and vendor payment tracking.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.expense.create',
    name: 'Create Expense Requisition',
    description: 'Draft and submit new expense requests with supporting quotation or invoice documents.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.expense.edit',
    name: 'Edit Expense Requisition',
    description: 'Update draft expense requisitions before department or finance submission.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.expense.verify',
    name: 'Finance Verification',
    description: 'Verify expense documentation, tax compliance, budget allocation, and fund availability.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.expense.approve',
    name: 'Approve Expense Requisitions',
    description: 'Departmental and institutional authorization to approve verified expenditure requests.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.payment.process',
    name: 'Process & Execute Payments',
    description: 'Disburse approved funds via bank transfer, cheque, or gateway and record reference details.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.accounting.post',
    name: 'Post Accounting Entries',
    description: 'Post finalized vouchers and executed payments directly into the double-entry General Ledger.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.ledger',
    name: 'General Ledger Operations',
    description: 'Access double-entry chart of accounts, post journal entries, and review accounting trial balances.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.budget',
    name: 'Budget Planning & Control',
    description: 'Define, allocate, and monitor department-wise annual budgets and expenditure variance.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.accounts',
    name: 'Chart of Accounts Management',
    description: 'Manage master chart of accounts, bank accounts, and classification codes.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.reconciliation',
    name: 'Bank & Gateway Reconciliation',
    description: 'Reconcile bank statements, gateway receipts, and ledger closing balances.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.reports',
    name: 'Financial & Statutory Reporting',
    description: 'Generate balance sheets, profit & loss, 80G tax reports, and statutory audit statements.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'finance.approve',
    name: 'Approve Financial Transactions',
    description: 'Executive authority to authorize expense vouchers, fund disbursements, and adjustment entries.',
    category: 'Core Operations',
    targetModule: 'Finance & Accounting'
  },
  {
    id: 'exams.manage',
    name: 'Manage Examination System',
    description: 'Oversee examination setup, schedules, papers, candidate registrations, results computation, and certification.',
    category: 'Core Operations',
    targetModule: 'Examinations'
  },
  {
    id: 'exams.evaluate',
    name: 'Academic Evaluation & Grading',
    description: 'Review candidate answer sheets, evaluate assessments, verify marks, and contribute to question banks.',
    category: 'Core Operations',
    targetModule: 'Examinations'
  },
  // Delegated Scoped Permissions
  {
    id: 'cases.district_review',
    name: 'District Case Review',
    description: 'Review and verify crowdfunding documents and applicant details within assigned district jurisdiction.',
    category: 'Core Operations',
    targetModule: 'Crowdfunding & Appeals'
  },
  {
    id: 'cases.state_review',
    name: 'State/UT Case Review',
    description: 'Review, audit, and verify crowdfunding cases across assigned State or Union Territory jurisdiction.',
    category: 'Core Operations',
    targetModule: 'Crowdfunding & Appeals'
  },
  {
    id: 'cases.national_review',
    name: 'National Case Review',
    description: 'Review and verify crowdfunding cases across permitted nationwide jurisdictions.',
    category: 'Core Operations',
    targetModule: 'Crowdfunding & Appeals'
  },
  {
    id: 'cases.recommend',
    name: 'Recommend Case Approval/Rejection',
    description: 'Submit formal verification recommendations to Super Admin for case decision.',
    category: 'Core Operations',
    targetModule: 'Crowdfunding & Appeals'
  },
  {
    id: 'cases.clarify',
    name: 'Request Applicant Clarification',
    description: 'Return case appeals to applicants for additional documentation or clarification.',
    category: 'Core Operations',
    targetModule: 'Crowdfunding & Appeals'
  },
  {
    id: 'exams.district_manage',
    name: 'District Exam Administration',
    description: 'Administer examination registrations, seating, and participant records in assigned district.',
    category: 'Core Operations',
    targetModule: 'Examinations'
  },
  {
    id: 'exams.state_manage',
    name: 'State/UT Exam Administration',
    description: 'Administer examination operations across permitted districts within assigned State or Union Territory.',
    category: 'Core Operations',
    targetModule: 'Examinations'
  },
  {
    id: 'exams.national_manage',
    name: 'National Exam Administration',
    description: 'Oversee examination operations across permitted national jurisdictions.',
    category: 'Core Operations',
    targetModule: 'Examinations'
  },
  {
    id: 'admin.delegation',
    name: 'Manage Delegated Authorities',
    description: 'Super Admin prerogative to delegate District, State, and National jurisdictional authorities.',
    category: 'User & Role Security',
    targetModule: 'RBAC Security Subsystem'
  },
  // Granular Media & Publishing Permissions
  {
    id: 'blog.create',
    name: 'Create Blog Content',
    description: 'Create draft blog posts, articles, and institutional updates.',
    category: 'Core Operations',
    targetModule: 'Blog, Press & News'
  },
  {
    id: 'blog.edit',
    name: 'Edit Blog Content',
    description: 'Modify and update existing blog dispatches, drafts, and circulars.',
    category: 'Core Operations',
    targetModule: 'Blog, Press & News'
  },
  {
    id: 'blog.publish',
    name: 'Publish Blog & Press Content',
    description: 'Publish, unpublish, and manage public visibility of official blog dispatches and circulars.',
    category: 'Core Operations',
    targetModule: 'Blog, Press & News'
  },
  {
    id: 'press.publish',
    name: 'Publish Press Releases',
    description: 'Publish official institutional press releases and media updates.',
    category: 'Core Operations',
    targetModule: 'Blog, Press & News'
  },
  {
    id: 'news.publish',
    name: 'Publish Trust News',
    description: 'Publish news dispatches, circulars, and announcements live on the official portal.',
    category: 'Core Operations',
    targetModule: 'Blog, Press & News'
  },
  {
    id: 'news.edit',
    name: 'Edit News & Drafts',
    description: 'Draft and edit news dispatches and announcements prior to publication.',
    category: 'Core Operations',
    targetModule: 'Blog, Press & News'
  },
  {
    id: 'trust.publish',
    name: 'Publish Trust Content',
    description: 'Publish institutional Trust content, About pages, leadership updates, and official legal disclosures.',
    category: 'Core Operations',
    targetModule: 'Organization Configuration'
  },
  {
    id: 'trust.edit',
    name: 'Edit Trust Content',
    description: 'Draft and edit Trust overview texts, mission statements, and institutional content.',
    category: 'Core Operations',
    targetModule: 'Organization Configuration'
  },
  {
    id: 'bulletin.publish',
    name: 'Publish Official Bulletins',
    description: 'Publish official institutional bulletins, gazette notices, and formal circulars live.',
    category: 'Core Operations',
    targetModule: 'Blog, Press & News'
  },
  {
    id: 'bulletin.edit',
    name: 'Edit Bulletins & Circulars',
    description: 'Draft and edit official bulletins and circulars.',
    category: 'Core Operations',
    targetModule: 'Blog, Press & News'
  },
  {
    id: 'content.publish',
    name: 'Content Publishing Authority',
    description: 'Full authorization to create, edit, and publish content across media modules.',
    category: 'Core Operations',
    targetModule: 'Blog, Press & News'
  },
  {
    id: 'store.manage',
    name: 'Manage Store Operations',
    description: 'Authority to manage FET Store catalogue, inventory, products, and categories.',
    category: 'Core Operations',
    targetModule: 'FET Store'
  },
  {
    id: 'store.products',
    name: 'Manage Products & Variants',
    description: 'Create, modify, and publish store products, digital attachments, and product options.',
    category: 'Core Operations',
    targetModule: 'FET Store'
  },
  {
    id: 'store.categories',
    name: 'Manage Categories & Subcategories',
    description: 'Configure store departments, categories, subcategories, and catalogue navigation.',
    category: 'Core Operations',
    targetModule: 'FET Store'
  },
  {
    id: 'store.inventory',
    name: 'Manage Stock & Availability',
    description: 'Track stock counts, low stock alerts, backorders, and item availability statuses.',
    category: 'Core Operations',
    targetModule: 'FET Store'
  },
  {
    id: 'store.orders',
    name: 'Review Store Orders & Allocations',
    description: 'Review customer orders, update order fulfillment status, and inspect institutional dispatch records.',
    category: 'Core Operations',
    targetModule: 'FET Store'
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
  'finance.manage',
  'finance.view',
  'finance.income',
  'finance.income.view',
  'finance.income.create',
  'finance.income.edit',
  'finance.expense',
  'finance.expense.view',
  'finance.expense.create',
  'finance.expense.edit',
  'finance.expense.approve',
  'finance.expense.verify',
  'finance.payment.process',
  'finance.accounting.post',
  'finance.ledger',
  'finance.budget',
  'finance.accounts',
  'finance.reconciliation',
  'finance.reports',
  'finance.approve',
  'exams.manage',
  'exams.evaluate',
  'cases.district_review',
  'cases.state_review',
  'cases.national_review',
  'cases.recommend',
  'cases.clarify',
  'exams.district_manage',
  'exams.state_manage',
  'exams.national_manage',
  'admin.delegation',
  'blog.create',
  'blog.edit',
  'blog.publish',
  'press.publish',
  'news.publish',
  'news.edit',
  'trust.publish',
  'trust.edit',
  'bulletin.publish',
  'bulletin.edit',
  'content.publish',
  'store.manage',
  'store.products',
  'store.categories',
  'store.inventory',
  'store.orders'
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
      'finance.manage',
      'exams.manage',
      'exams.evaluate'
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
    defaultPermissions: ['users.view', 'modules.manage', 'exams.manage', 'exams.evaluate'],
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
  },
  exam_controller: {
    id: 'exam_controller',
    label: 'Exam Controller',
    description: 'Comprehensive examination governance authority: schedule, eligibility, fee, question papers, participant reviews, result calculation, publication, ranking, and certificates.',
    hierarchyLevel: 75,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'modules.manage', 'exams.manage', 'exams.evaluate'],
    badgeColor: 'bg-purple-950 text-purple-200 border-purple-700'
  },
  examiner: {
    id: 'examiner',
    label: 'Examiner',
    description: 'Academic examiner: questions management, paper creation, evaluating candidate responses, and grading answer sheets.',
    hierarchyLevel: 55,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'exams.evaluate'],
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800'
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
    defaultPermissions: [
      'users.view', 
      'donors.manage', 
      'settings.manage', 
      'finance.manage',
      'finance.view',
      'finance.income',
      'finance.income.view',
      'finance.income.create',
      'finance.income.edit',
      'finance.expense',
      'finance.expense.view',
      'finance.expense.create',
      'finance.expense.edit',
      'finance.expense.approve',
      'finance.expense.verify',
      'finance.payment.process',
      'finance.accounting.post',
      'finance.ledger',
      'finance.budget',
      'finance.accounts',
      'finance.reconciliation',
      'finance.reports',
      'finance.approve'
    ],
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
    description: 'Full publishing administration across trust news, circulars, leadership announcements, and portal articles.',
    hierarchyLevel: 60,
    isAdministrative: true,
    defaultPermissions: [
      'settings.manage',
      'blog.create',
      'blog.edit',
      'blog.publish',
      'press.publish',
      'news.publish',
      'news.edit',
      'trust.publish',
      'trust.edit',
      'bulletin.publish',
      'bulletin.edit',
      'content.publish'
    ],
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-800'
  },
  blog_admin: {
    id: 'blog_admin',
    label: 'Blog & Media Administrator',
    description: 'Publishes official trust bulletins, press releases, circulars, and editorial dispatches.',
    hierarchyLevel: 60,
    isAdministrative: true,
    defaultPermissions: [
      'settings.manage',
      'blog.create',
      'blog.edit',
      'blog.publish',
      'press.publish',
      'news.publish',
      'news.edit',
      'bulletin.publish',
      'bulletin.edit',
      'content.publish'
    ],
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-800'
  },
  store_admin: {
    id: 'store_admin',
    label: 'Store Administrator',
    description: 'Oversees FET Store merchandise, books, publications, and store operations.',
    hierarchyLevel: 60,
    isAdministrative: true,
    defaultPermissions: ['modules.manage', 'store.manage', 'store.products', 'store.categories', 'store.inventory', 'store.orders'],
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
  },
  store_manager: {
    id: 'store_manager',
    label: 'Store Manager',
    description: 'Dedicated Store Manager: manages products, categories, variants, inventory, and order fulfillment without accessing finance or other modules.',
    hierarchyLevel: 55,
    isAdministrative: true,
    defaultPermissions: ['modules.manage', 'store.manage', 'store.products', 'store.categories', 'store.inventory', 'store.orders'],
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
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
  },

  // -------------------------------------------------------------
  // DELEGATED JURISDICTIONAL ADMINISTRATORS (District / State / National)
  // -------------------------------------------------------------
  district_admin: {
    id: 'district_admin',
    label: 'District Administrator',
    description: 'Delegated district-level administrator managing permitted operations strictly within explicitly assigned districts.',
    hierarchyLevel: 62,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'cases.district_review', 'cases.recommend', 'cases.clarify', 'exams.district_manage'],
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
  },
  district_crowdfunding_admin: {
    id: 'district_crowdfunding_admin',
    label: 'District Case Manager',
    description: 'Delegated district case officer: reviews submitted documents, applicant verification, requests clarification, and submits recommendations for district cases.',
    hierarchyLevel: 62,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'cases.district_review', 'cases.recommend', 'cases.clarify'],
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
  },
  district_exam_admin: {
    id: 'district_exam_admin',
    label: 'District Examination Admin',
    description: 'Delegated district examination coordinator: oversees candidate registrations, seating, and exam administration strictly within assigned district.',
    hierarchyLevel: 62,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'exams.district_manage'],
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
  },
  state_admin: {
    id: 'state_admin',
    label: 'State/UT Administrator',
    description: 'Delegated State or Union Territory administrator managing permitted operations across assigned state jurisdiction.',
    hierarchyLevel: 65,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'cases.state_review', 'cases.recommend', 'cases.clarify', 'exams.state_manage'],
    badgeColor: 'bg-teal-950 text-teal-300 border-teal-800'
  },
  state_crowdfunding_admin: {
    id: 'state_crowdfunding_admin',
    label: 'State/UT Case Manager',
    description: 'Delegated State/UT case officer: conducts state-level case review, cross-district audits, document verification, and recommendations.',
    hierarchyLevel: 65,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'cases.state_review', 'cases.recommend', 'cases.clarify'],
    badgeColor: 'bg-orange-950 text-orange-300 border-orange-800'
  },
  state_exam_admin: {
    id: 'state_exam_admin',
    label: 'State/UT Examination Admin',
    description: 'Delegated State/UT examination administrator: manages competitions and candidate registrations across permitted districts in assigned state.',
    hierarchyLevel: 65,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'exams.state_manage'],
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800'
  },
  national_admin: {
    id: 'national_admin',
    label: 'National Administrator',
    description: 'Delegated National administrator managing permitted operations across India according to permissions granted by Super Admin.',
    hierarchyLevel: 68,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'cases.national_review', 'cases.recommend', 'cases.clarify', 'exams.national_manage'],
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-800'
  },
  national_crowdfunding_admin: {
    id: 'national_crowdfunding_admin',
    label: 'National Case Manager',
    description: 'Delegated National case officer: performs pan-India case reviews, high-value verifications, and recommendations.',
    hierarchyLevel: 68,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'cases.national_review', 'cases.recommend', 'cases.clarify'],
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-800'
  },
  national_exam_admin: {
    id: 'national_exam_admin',
    label: 'National Examination Admin',
    description: 'Delegated National examination officer: coordinates nationwide competitions and candidate rosters.',
    hierarchyLevel: 68,
    isAdministrative: true,
    defaultPermissions: ['users.view', 'exams.national_manage'],
    badgeColor: 'bg-violet-950 text-violet-300 border-violet-800'
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

/**
 * Checks whether a user possesses any delegated jurisdictional role
 */
export function isDelegatedAdmin(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  const delegatedRoles: UserRole[] = [
    'district_admin',
    'district_crowdfunding_admin',
    'district_exam_admin',
    'state_admin',
    'state_crowdfunding_admin',
    'state_exam_admin',
    'national_admin',
    'national_crowdfunding_admin',
    'national_exam_admin'
  ];
  return (
    userProfile.roles?.some(r => delegatedRoles.includes(r)) ||
    delegatedRoles.includes(userProfile.primaryRole) ||
    Boolean(userProfile.delegatedScopes && userProfile.delegatedScopes.length > 0)
  );
}

/**
 * Resolves the active delegated scope for a specific module
 */
export function getDelegatedScope(
  userProfile: UserProfile | null, 
  module: 'crowdfunding' | 'examinations'
): DelegatedAdminScope | undefined {
  if (!userProfile) return undefined;
  
  // Find active scope matching module or 'both'
  const activeScope = userProfile.delegatedScopes?.find(
    s => s.status === 'active' && (s.module === module || s.module === 'both')
  );
  if (activeScope) return activeScope;

  // Infer scope from assigned roles if not in explicit delegatedScopes array
  const roles = userProfile.roles || [userProfile.primaryRole];
  
  if (module === 'crowdfunding') {
    if (
      roles.includes('district_crowdfunding_admin') || 
      roles.includes('district_admin') || 
      userProfile.primaryRole === 'district_crowdfunding_admin' || 
      userProfile.primaryRole === 'district_admin' || 
      userProfile.activeScopeLevel === 'district'
    ) {
      return {
        uid: userProfile.uid,
        email: userProfile.email,
        level: 'district',
        module: 'crowdfunding',
        assignedState: userProfile.assignedState || userProfile.state,
        assignedDistricts: userProfile.assignedDistricts || (userProfile.district ? [userProfile.district] : []),
        canRead: true,
        canReview: true,
        canRecommend: true,
        canApprove: false,
        canEdit: false,
        status: 'active',
        assignedByUid: 'system',
        assignedByEmail: 'superadmin@fetindia.org',
        assignedAt: userProfile.createdAt
      };
    }
    if (
      roles.includes('state_crowdfunding_admin') || 
      roles.includes('state_admin') || 
      userProfile.primaryRole === 'state_crowdfunding_admin' || 
      userProfile.primaryRole === 'state_admin' || 
      userProfile.activeScopeLevel === 'state'
    ) {
      return {
        uid: userProfile.uid,
        email: userProfile.email,
        level: 'state',
        module: 'crowdfunding',
        assignedState: userProfile.assignedState || userProfile.state,
        assignedDistricts: userProfile.assignedDistricts,
        canRead: true,
        canReview: true,
        canRecommend: true,
        canApprove: false,
        canEdit: false,
        status: 'active',
        assignedByUid: 'system',
        assignedByEmail: 'superadmin@fetindia.org',
        assignedAt: userProfile.createdAt
      };
    }
    if (
      roles.includes('national_crowdfunding_admin') || 
      roles.includes('national_admin') || 
      userProfile.primaryRole === 'national_crowdfunding_admin' || 
      userProfile.primaryRole === 'national_admin' || 
      userProfile.activeScopeLevel === 'national'
    ) {
      return {
        uid: userProfile.uid,
        email: userProfile.email,
        level: 'national',
        module: 'crowdfunding',
        assignedState: 'All India',
        canRead: true,
        canReview: true,
        canRecommend: true,
        canApprove: false,
        canEdit: false,
        status: 'active',
        assignedByUid: 'system',
        assignedByEmail: 'superadmin@fetindia.org',
        assignedAt: userProfile.createdAt
      };
    }
  }

  if (module === 'examinations') {
    if (
      roles.includes('district_exam_admin') || 
      roles.includes('district_admin') || 
      userProfile.primaryRole === 'district_exam_admin' || 
      userProfile.primaryRole === 'district_admin' || 
      userProfile.activeScopeLevel === 'district'
    ) {
      return {
        uid: userProfile.uid,
        email: userProfile.email,
        level: 'district',
        module: 'examinations',
        assignedState: userProfile.assignedState || userProfile.state,
        assignedDistricts: userProfile.assignedDistricts || (userProfile.district ? [userProfile.district] : []),
        canRead: true,
        canReview: true,
        canRecommend: true,
        canApprove: false,
        canEdit: true,
        status: 'active',
        assignedByUid: 'system',
        assignedByEmail: 'superadmin@fetindia.org',
        assignedAt: userProfile.createdAt
      };
    }
    if (
      roles.includes('state_exam_admin') || 
      roles.includes('state_admin') || 
      userProfile.primaryRole === 'state_exam_admin' || 
      userProfile.primaryRole === 'state_admin' || 
      userProfile.activeScopeLevel === 'state'
    ) {
      return {
        uid: userProfile.uid,
        email: userProfile.email,
        level: 'state',
        module: 'examinations',
        assignedState: userProfile.assignedState || userProfile.state,
        assignedDistricts: userProfile.assignedDistricts,
        canRead: true,
        canReview: true,
        canRecommend: true,
        canApprove: false,
        canEdit: true,
        status: 'active',
        assignedByUid: 'system',
        assignedByEmail: 'superadmin@fetindia.org',
        assignedAt: userProfile.createdAt
      };
    }
    if (
      roles.includes('national_exam_admin') || 
      roles.includes('national_admin') || 
      userProfile.primaryRole === 'national_exam_admin' || 
      userProfile.primaryRole === 'national_admin' || 
      userProfile.activeScopeLevel === 'national'
    ) {
      return {
        uid: userProfile.uid,
        email: userProfile.email,
        level: 'national',
        module: 'examinations',
        assignedState: 'All India',
        canRead: true,
        canReview: true,
        canRecommend: true,
        canApprove: false,
        canEdit: true,
        status: 'active',
        assignedByUid: 'system',
        assignedByEmail: 'superadmin@fetindia.org',
        assignedAt: userProfile.createdAt
      };
    }
  }

  return undefined;
}

/**
 * Validates if user has authority to access data belonging to a district
 */
export function canAccessDistrict(
  userProfile: UserProfile | null, 
  targetDistrict?: string, 
  targetState?: string
): boolean {
  if (!userProfile) return false;
  if (userProfile.roles?.includes('super_admin') || userProfile.primaryRole === 'super_admin') return true;

  // National scope check
  if (userProfile.roles?.some(r => ['national_admin', 'national_crowdfunding_admin', 'national_exam_admin'].includes(r))) {
    return true;
  }
  const nationalScope = userProfile.delegatedScopes?.some(s => s.status === 'active' && s.level === 'national');
  if (nationalScope) return true;

  // State scope check
  if (targetState) {
    const userAssignedState = userProfile.assignedState || userProfile.state;
    const isStateAdmin = userProfile.roles?.some(r => ['state_admin', 'state_crowdfunding_admin', 'state_exam_admin'].includes(r)) ||
      userProfile.delegatedScopes?.some(s => s.status === 'active' && s.level === 'state');
    if (isStateAdmin && userAssignedState && userAssignedState.toLowerCase() === targetState.toLowerCase()) {
      return true;
    }
  }

  // District scope check
  if (!targetDistrict) return false;
  const normalizedTarget = targetDistrict.toLowerCase().trim();

  // Check explicit assigned districts array
  const assigned = userProfile.assignedDistricts || [];
  if (assigned.some(d => d.toLowerCase().trim() === normalizedTarget)) return true;

  // Check delegatedScopes array
  for (const s of userProfile.delegatedScopes || []) {
    if (s.status === 'active') {
      if (s.level === 'national') return true;
      if (s.level === 'state' && targetState && s.assignedState?.toLowerCase() === targetState.toLowerCase()) {
        return true;
      }
      if (s.assignedDistricts?.some(d => d.toLowerCase().trim() === normalizedTarget)) {
        return true;
      }
    }
  }

  // Check fallback user profile district if user is district_admin
  if (userProfile.roles?.some(r => ['district_admin', 'district_crowdfunding_admin', 'district_exam_admin'].includes(r))) {
    if (userProfile.district?.toLowerCase().trim() === normalizedTarget) return true;
    if (userProfile.city?.toLowerCase().trim() === normalizedTarget) return true;
  }

  return false;
}

/**
 * Filter Crowdfunding Campaigns strictly isolated by caller's delegated scope
 */
export function filterCampaignsByScope(
  campaigns: CrowdfundingCampaign[], 
  userProfile: UserProfile | null
): CrowdfundingCampaign[] {
  if (!userProfile) return [];
  // Super Admin and Global Crowdfunding Admin see all campaigns
  if (
    userProfile.roles?.includes('super_admin') || 
    userProfile.primaryRole === 'super_admin' ||
    userProfile.roles?.includes('crowdfunding_admin') ||
    userProfile.primaryRole === 'crowdfunding_admin' ||
    userProfile.roles?.includes('administrator')
  ) {
    return campaigns;
  }

  const scope = getDelegatedScope(userProfile, 'crowdfunding');
  if (!scope) {
    // If not delegated for crowdfunding, return empty (Zero-Trust)
    return [];
  }

  if (scope.level === 'national') {
    return campaigns;
  }

  if (scope.level === 'state') {
    const assignedState = (scope.assignedState || userProfile.assignedState || userProfile.state || '').toLowerCase().trim();
    if (!assignedState) return [];
    return campaigns.filter(c => {
      const campState = (c.state || c.creatorState || '').toLowerCase().trim();
      return campState === assignedState;
    });
  }

  if (scope.level === 'district') {
    const assignedDistricts = (scope.assignedDistricts || userProfile.assignedDistricts || [userProfile.district || ''])
      .map(d => d.toLowerCase().trim())
      .filter(Boolean);
    if (assignedDistricts.length === 0) return [];

    return campaigns.filter(c => {
      const campDistrict = (c.district || c.creatorDistrict || c.city || '').toLowerCase().trim();
      return assignedDistricts.includes(campDistrict);
    });
  }

  return [];
}

/**
 * Filter Competition Registrations strictly isolated by caller's delegated scope
 */
export function filterRegistrationsByScope(
  registrations: CompetitionRegistration[], 
  userProfile: UserProfile | null
): CompetitionRegistration[] {
  if (!userProfile) return [];
  // Super Admin and Exam Controller see all registrations
  if (
    userProfile.roles?.includes('super_admin') || 
    userProfile.primaryRole === 'super_admin' ||
    userProfile.roles?.includes('exam_controller') ||
    userProfile.primaryRole === 'exam_controller' ||
    userProfile.roles?.includes('exam_admin') ||
    userProfile.primaryRole === 'exam_admin'
  ) {
    return registrations;
  }

  const scope = getDelegatedScope(userProfile, 'examinations');
  if (!scope) {
    // Check if examiner
    if (userProfile.roles?.includes('examiner') || userProfile.primaryRole === 'examiner') {
      return registrations;
    }
    return [];
  }

  if (scope.level === 'national') {
    return registrations;
  }

  if (scope.level === 'state') {
    const assignedState = (scope.assignedState || userProfile.assignedState || userProfile.state || '').toLowerCase().trim();
    if (!assignedState) return [];
    return registrations.filter(r => (r.state || '').toLowerCase().trim() === assignedState);
  }

  if (scope.level === 'district') {
    const assignedDistricts = (scope.assignedDistricts || userProfile.assignedDistricts || [userProfile.district || ''])
      .map(d => d.toLowerCase().trim())
      .filter(Boolean);
    if (assignedDistricts.length === 0) return [];

    return registrations.filter(r => {
      const regDistrict = (r.district || '').toLowerCase().trim();
      return assignedDistricts.includes(regDistrict);
    });
  }

  return [];
}

/**
 * Filter Competitions based on delegated scope eligibility
 */
export function filterCompetitionsByScope(
  competitions: Competition[], 
  userProfile: UserProfile | null
): Competition[] {
  if (!userProfile) return [];
  if (
    userProfile.roles?.includes('super_admin') || 
    userProfile.primaryRole === 'super_admin' ||
    userProfile.roles?.includes('exam_controller') ||
    userProfile.roles?.includes('exam_admin') ||
    userProfile.roles?.includes('examiner')
  ) {
    return competitions;
  }

  const scope = getDelegatedScope(userProfile, 'examinations');
  if (!scope || scope.level === 'national') return competitions;

  if (scope.level === 'state') {
    const assignedState = (scope.assignedState || userProfile.assignedState || userProfile.state || '').toLowerCase().trim();
    return competitions.filter(c => {
      if (!c.eligibleStates || c.eligibleStates.length === 0 || c.eligibleStates.includes('All India')) return true;
      return c.eligibleStates.some(s => s.toLowerCase().trim() === assignedState);
    });
  }

  if (scope.level === 'district') {
    const assignedDistricts = (scope.assignedDistricts || userProfile.assignedDistricts || [userProfile.district || ''])
      .map(d => d.toLowerCase().trim())
      .filter(Boolean);
    return competitions.filter(c => {
      if (!c.eligibleDistricts || c.eligibleDistricts.length === 0) return true;
      return c.eligibleDistricts.some(d => assignedDistricts.includes(d.toLowerCase().trim()));
    });
  }

  return competitions;
}

/**
 * Checks whether user possesses any delegated publishing authority
 */
export function isDelegatedPublisher(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('content_admin') || roles.includes('blog_admin')) return true;

  const perms = [
    ...(userProfile.permissions || []),
    ...(userProfile.customPermissions || [])
  ];

  const publishingPerms: AppPermission[] = [
    'news.publish', 'news.edit',
    'trust.publish', 'trust.edit',
    'bulletin.publish', 'bulletin.edit',
    'blog.create', 'blog.edit', 'blog.publish',
    'press.publish', 'content.publish'
  ];

  return perms.some(p => publishingPerms.includes(p));
}

/**
 * Returns true if the user has ONLY delegated publishing access and is NOT a global administrator or super admin.
 * Used to lock direct routing and present ONLY the dedicated Publishing Dashboard.
 */
export function isPublisherOnly(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return false;
  if (!userProfile) return false;

  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  
  // If user has full administrative or governance roles, they are not publisher-only
  const globalAdminRoles: UserRole[] = [
    'super_admin', 'administrator', 'core_member',
    'finance_admin', 'hr_admin', 'exam_controller', 'exam_admin',
    'donor_admin', 'member_admin', 'volunteer_admin', 'crowdfunding_admin',
    'district_admin', 'state_admin', 'national_admin'
  ];

  if (roles.some(r => globalAdminRoles.includes(r))) return false;

  // Check if they have publishing rights
  return isDelegatedPublisher(userProfile);
}

/**
 * Granular permissions checks for publishing modules
 */
export function canPublishNews(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('content_admin') || roles.includes('blog_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('news.publish') || perms.includes('blog.publish') || perms.includes('content.publish');
}

export function canEditNews(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (canPublishNews(userProfile, isSuperAdmin)) return true;
  if (!userProfile) return false;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('news.edit') || perms.includes('blog.edit') || perms.includes('blog.create');
}

export function canPublishTrustContent(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('content_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('trust.publish') || perms.includes('content.publish') || perms.includes('settings.manage');
}

export function canEditTrustContent(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (canPublishTrustContent(userProfile, isSuperAdmin)) return true;
  if (!userProfile) return false;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('trust.edit');
}

export function canPublishBulletin(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('content_admin') || roles.includes('blog_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('bulletin.publish') || perms.includes('press.publish') || perms.includes('blog.publish') || perms.includes('content.publish');
}

export function canEditBulletin(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (canPublishBulletin(userProfile, isSuperAdmin)) return true;
  if (!userProfile) return false;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('bulletin.edit') || perms.includes('blog.edit') || perms.includes('blog.create');
}

export function canOperateAnyPublishing(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  return canEditNews(userProfile, false) ||
    canPublishNews(userProfile, false) ||
    canEditTrustContent(userProfile, false) ||
    canPublishTrustContent(userProfile, false) ||
    canEditBulletin(userProfile, false) ||
    canPublishBulletin(userProfile, false);
}

/**
 * Granular Finance & Accounting Access Control Helpers (Chapter 15 SRS)
 */
export function canViewFinance(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('finance_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage') || perms.includes('finance.view') || perms.includes('finance.reports') || perms.includes('finance.ledger');
}

export function canManageFinance(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('finance_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage');
}

export function canApproveFinance(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('finance_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage') || perms.includes('finance.approve') || perms.includes('finance.expense.approve');
}

export const canApproveExpense = canApproveFinance;

export function canCreateExpense(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('finance_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage') || perms.includes('finance.expense') || perms.includes('finance.expense.create');
}

export function canVerifyExpense(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('finance_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage') || perms.includes('finance.expense.verify');
}

export function canProcessPayment(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('finance_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage') || perms.includes('finance.payment.process');
}

export function canRecordIncome(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('finance_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage') || perms.includes('finance.income') || perms.includes('finance.income.create');
}

export function canPostAccounting(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('finance_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage') || perms.includes('finance.accounting.post') || perms.includes('finance.ledger');
}

export function canManageBudget(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('finance_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage') || perms.includes('finance.budget');
}

export function canViewBudget(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  if (canManageBudget(userProfile, false)) return true;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('core_member')) return true; // Trustees have audit & budget oversight
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.view') || perms.includes('finance.reports') || perms.includes('finance.ledger') || perms.includes('finance.budget');
}

export function canApproveBudget(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('finance_admin')) return true;
  if (roles.includes('core_member')) {
    const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
    return perms.includes('finance.manage') || perms.includes('finance.approve') || perms.includes('finance.budget');
  }
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage') || perms.includes('finance.approve');
}

export function canManageBankAccounts(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('finance_admin')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage') || perms.includes('finance.bank');
}

export function canPerformBankReconciliation(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('finance_admin') || roles.includes('core_member')) return true;
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.manage') || perms.includes('finance.reconcile') || perms.includes('finance.bank') || perms.includes('finance.accounting.post');
}

export function canViewBankManagement(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  if (canManageBankAccounts(userProfile, false) || canPerformBankReconciliation(userProfile, false)) return true;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('core_member')) return true; // Trustees have review & oversight access
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('finance.view') || perms.includes('finance.reports') || perms.includes('finance.ledger') || perms.includes('finance.bank');
}

// =========================================================================
// INSTITUTIONAL FEE MANAGEMENT RBAC (CHAPTER 15.10 SRS - TASK 6)
// =========================================================================

export function canManageSchoolFees(userProfile: UserProfile | null, isSuperAdmin: boolean, schoolId?: string): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('finance_admin')) return true;
  if (roles.includes('school_admin')) {
    // If user has specific assigned school, verify strict match to prevent cross-school access
    if (schoolId && (userProfile as any).assignedSchoolId) {
      return (userProfile as any).assignedSchoolId === schoolId;
    }
    return true;
  }
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('fee.manage') || perms.includes('finance.manage') || perms.includes('fee.collect');
}

export function canManageMadrasaFees(userProfile: UserProfile | null, isSuperAdmin: boolean, madrasaId?: string): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('finance_admin')) return true;
  if (roles.includes('madrasa_admin')) {
    // If user has specific assigned madrasa, verify strict match to prevent cross-madrasa access
    if (madrasaId && (userProfile as any).assignedMadrasaId) {
      return (userProfile as any).assignedMadrasaId === madrasaId;
    }
    return true;
  }
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('fee.manage') || perms.includes('finance.manage') || perms.includes('fee.collect');
}

export function canViewFeeManagement(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('finance_admin') || roles.includes('school_admin') || roles.includes('madrasa_admin') || roles.includes('core_member')) {
    return true;
  }
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('fee.view') || perms.includes('fee.manage') || perms.includes('finance.view') || perms.includes('finance.manage') || perms.includes('fee.collect');
}

export function canCollectFees(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('finance_admin') || roles.includes('school_admin') || roles.includes('madrasa_admin')) {
    return true;
  }
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('fee.collect') || perms.includes('fee.manage') || perms.includes('finance.manage');
}

export function canSendFeeReminders(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('finance_admin') || roles.includes('school_admin') || roles.includes('madrasa_admin')) {
    return true;
  }
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('fee.remind') || perms.includes('fee.manage');
}

/**
 * Granular FET Store Management Access Control Helpers
 */
export function canManageStore(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('store_admin') || roles.includes('store_manager')) {
    return true;
  }
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('store.manage') || perms.includes('store.products') || perms.includes('store.categories') || perms.includes('store.inventory');
}

/**
 * Returns true if the user has authorization to review and process Store customer orders.
 */
export function canManageStoreOrders(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;
  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('store_admin') || roles.includes('store_manager')) {
    return true;
  }
  const perms = [...(userProfile.permissions || []), ...(userProfile.customPermissions || [])];
  return perms.includes('store.manage') || perms.includes('store.orders');
}

/**
 * Returns true if the user has ONLY Store management authorization and no global administrative roles.
 * Used for strict dashboard isolation so Store Managers cannot view or access unrelated trust consoles.
 */
export function isStorePersonnelOnly(userProfile: UserProfile | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return false;
  if (!userProfile) return false;

  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);

  // Check if they have store manager/admin access
  const isStore = roles.includes('store_manager') || roles.includes('store_admin') ||
    userProfile.permissions?.some(p => ['store.manage', 'store.products'].includes(p)) ||
    userProfile.customPermissions?.some(p => ['store.manage', 'store.products'].includes(p));

  if (!isStore) return false;

  // If user has other administrative or governance roles, they are not store-only
  const otherAdminRoles: UserRole[] = [
    'super_admin', 'administrator', 'core_member',
    'finance_admin', 'hr_admin', 'exam_controller', 'exam_admin', 'examiner',
    'donor_admin', 'member_admin', 'volunteer_admin', 'crowdfunding_admin',
    'school_admin', 'madrasa_admin', 'travel_admin', 'reports_admin',
    'content_admin', 'blog_admin',
    'district_admin', 'state_admin', 'national_admin'
  ];

  return !roles.some(r => otherAdminRoles.includes(r));
}



