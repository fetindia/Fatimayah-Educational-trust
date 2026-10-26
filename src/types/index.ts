/**
 * @license
 * Official Architecture Specification Types
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Public Brand: FET India
 * Tagline: Education • Service • Empowerment
 * Website: FETIndia.com
 */

export type MembershipStatus = 
  | 'none' 
  | 'pending' 
  | 'under_review' 
  | 'general_member' 
  | 'core_member' 
  | 'rejected';

export type VolunteerStatus = 
  | 'none' 
  | 'pending' 
  | 'under_review' 
  | 'approved'
  | 'active_volunteer' 
  | 'rejected'
  | 'suspended'
  | 'inactive';

export type DonorStatus = 
  | 'none' 
  | 'pending' 
  | 'under_review' 
  | 'approved'
  | 'active_donor' 
  | 'rejected';

export type CoreRole =
  | 'user'
  | 'member'
  | 'volunteer'
  | 'donor'
  | 'core_member'
  | 'administrator'
  | 'super_admin';

export type UserRole =
  | CoreRole
  | 'volunteer_admin'
  | 'member_admin'
  | 'donor_admin'
  | 'crowdfunding_admin'
  | 'examination_admin'
  | 'exam_admin'
  | 'exam_controller'
  | 'examiner'
  | 'school_admin'
  | 'madrasa_admin'
  | 'finance_admin'
  | 'hr_admin'
  | 'content_admin'
  | 'blog_admin'
  | 'store_admin'
  | 'store_manager'
  | 'travel_admin'
  | 'reports_admin'
  | 'student'
  // Delegated Jurisdictional Roles (District, State/UT, National)
  | 'district_admin'
  | 'district_crowdfunding_admin'
  | 'district_exam_admin'
  | 'state_admin'
  | 'state_crowdfunding_admin'
  | 'state_exam_admin'
  | 'national_admin'
  | 'national_crowdfunding_admin'
  | 'national_exam_admin';

export type AppPermission =
  | 'users.view'
  | 'users.manage'
  | 'roles.manage'
  | 'volunteers.manage'
  | 'donors.manage'
  | 'members.manage'
  | 'modules.manage'
  | 'settings.manage'
  | 'finance.manage'
  // Granular Finance & Accounting Permissions (Chapter 15 SRS)
  | 'finance.view'
  | 'finance.income'
  | 'finance.income.view'
  | 'finance.income.create'
  | 'finance.income.edit'
  | 'finance.expense'
  | 'finance.expense.view'
  | 'finance.expense.create'
  | 'finance.expense.edit'
  | 'finance.expense.approve'
  | 'finance.expense.verify'
  | 'finance.payment.process'
  | 'finance.accounting.post'
  | 'finance.ledger'
  | 'finance.budget'
  | 'finance.accounts'
  | 'finance.bank'
  | 'finance.reconciliation'
  | 'finance.reconcile'
  | 'finance.reports'
  | 'finance.approve'
  | 'finance.fee'
  | 'fee.manage'
  | 'fee.view'
  | 'fee.collect'
  | 'fee.remind'
  | 'exams.manage'
  | 'exams.evaluate'
  // Delegated Scoped Permissions
  | 'cases.district_review'
  | 'cases.state_review'
  | 'cases.national_review'
  | 'cases.recommend'
  | 'cases.clarify'
  | 'exams.district_manage'
  | 'exams.state_manage'
  | 'exams.national_manage'
  | 'admin.delegation'
  // Granular Media & Publishing Permissions
  | 'blog.create'
  | 'blog.edit'
  | 'blog.publish'
  | 'press.publish'
  | 'news.publish'
  | 'news.edit'
  | 'trust.publish'
  | 'trust.edit'
  | 'bulletin.publish'
  | 'bulletin.edit'
  | 'content.publish'
  // Granular FET Store Management Permissions
  | 'store.manage'
  | 'store.products'
  | 'store.categories'
  | 'store.inventory'
  | 'store.orders';

export type AdminScopeLevel = 'district' | 'state' | 'national';
export type AdminModuleScope = 'crowdfunding' | 'examinations' | 'both';

export interface DelegatedAdminScope {
  id?: string;
  uid: string;
  email: string;
  displayName?: string;
  level: AdminScopeLevel; // 'district' | 'state' | 'national'
  module: AdminModuleScope; // 'crowdfunding' | 'examinations' | 'both'
  assignedState?: string; // e.g. "Jammu & Kashmir", "Maharashtra", or "All India"
  assignedDistricts?: string[]; // e.g. ["Jammu", "Kathua"]
  canRead: boolean;
  canReview: boolean;
  canRecommend: boolean;
  canApprove: boolean; // only if Super Admin grants it
  canEdit: boolean;
  status: 'active' | 'suspended' | 'expired';
  expiresAt?: string;
  assignedByUid: string;
  assignedByEmail: string;
  assignedAt: string;
  revokedAt?: string;
  revokedByUid?: string;
  notes?: string;
}

export interface PermissionDefinition {
  id: AppPermission;
  name: string;
  description: string;
  category: 'User & Role Security' | 'Core Operations' | 'System Administration';
  targetModule?: string;
}

export interface RoleMetadata {
  id: UserRole;
  label: string;
  description: string;
  hierarchyLevel: number;
  isAdministrative: boolean;
  defaultPermissions: AppPermission[];
  badgeColor: string;
}

export type ModuleLifecycle = 'DRAFT' | 'TESTING' | 'READY' | 'PUBLISHED' | 'DISABLED';

export type SystemModuleKey = 
  | 'store' 
  | 'school_erp' 
  | 'madarsa_erp' 
  | 'education_empowerment' 
  | 'higher_education_grant' 
  | 'examinations';

export interface SystemModuleSetting {
  key: SystemModuleKey;
  name: string;
  code: string;
  description: string;
  enabled: boolean;
  status: 'active' | 'disabled' | 'deferred';
  isCore?: boolean;
  locked?: boolean;
  category: string;
  routePath?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SystemModuleControlsDoc {
  modules: Record<SystemModuleKey, SystemModuleSetting>;
  updatedAt: string;
  updatedBy: string;
}


export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  fullName?: string;
  fullLegalName?: string;
  fatherName?: string;
  guardianName?: string;
  motherName?: string;
  organizationName?: string;
  mobileNumber?: string;
  phoneNumber?: string;
  country?: string;
  accountType?: 'user' | 'admin';
  role?: string;
  roles: UserRole[];
  primaryRole: UserRole;
  membershipStatus?: MembershipStatus;
  volunteerStatus?: VolunteerStatus;
  donorStatus?: DonorStatus;
  permissions?: AppPermission[];
  customPermissions?: AppPermission[];
  status: 'active' | 'pending' | 'suspended';
  accountStatus?: 'active' | 'pending_verification' | 'pending' | 'suspended';
  emailVerified?: boolean;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  profileCompleted?: boolean;
  membershipId?: string;
  memberId?: string;
  volunteerId?: string;
  donorId?: string;
  studentId?: string;
  department?: string;
  address?: string;
  fullAddress?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  occupation?: string;
  educationalQualification?: string;
  qualification?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | string;
  dateOfBirth?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  bio?: string;
  photoURL?: string;
  membershipType?: 'general_member' | 'core_member' | string;
  membershipApprovedAt?: string;
  membershipValidUntil?: string;
  membershipIssueDate?: string;
  notes?: string;
  promotedAt?: string;
  promotedBy?: string;
  promotedByEmail?: string;
  promotionNote?: string;
  volunteerApprovedAt?: string;
  volunteerApprovedBy?: string;
  volunteerApprovedByEmail?: string;
  volunteerWing?: string;
  volunteerDepartment?: string;
  volunteerAreasOfInterest?: string[];
  volunteerSkills?: string[];
  volunteerAvailability?: string;
  volunteerPreferredLocation?: string;
  donorApprovedAt?: string;
  donorApprovedBy?: string;
  donorApprovedByEmail?: string;
  donorType?: DonorType;
  donorAreasOfSupport?: string[];
  donorPreferredFrequency?: DonationFrequency;
  panNumber?: string;
  pan?: string;
  notificationPreferences?: UserNotificationPreferences;
  // HRMS & Staff Specific Fields
  isStaff?: boolean;
  staffId?: string;
  designation?: string;
  joiningDate?: string;
  employmentStatus?: StaffEmploymentStatus;
  employmentType?: StaffEmploymentType;
  workLocation?: string;
  salaryGrade?: string;
  staffDocuments?: StaffDocumentRecord[];
  // Delegated Jurisdictional Administration (District / State / National)
  delegatedScopes?: DelegatedAdminScope[];
  activeScopeLevel?: AdminScopeLevel;
  assignedState?: string;
  assignedDistricts?: string[];
}

export type StaffEmploymentStatus = 
  | 'active' 
  | 'probation' 
  | 'on_leave' 
  | 'inactive' 
  | 'resigned' 
  | 'terminated';

export type StaffEmploymentType = 
  | 'full_time' 
  | 'part_time' 
  | 'contract' 
  | 'honorary' 
  | 'volunteer';

export type StaffDocumentType = 
  | 'appointment_letter' 
  | 'qualification' 
  | 'identity_proof' 
  | 'police_verification' 
  | 'service_record'
  | 'other';

export interface StaffDocumentRecord {
  id: string;
  title: string;
  documentType: StaffDocumentType;
  fileUrl?: string;
  fileName?: string;
  uploadedAt: string;
  verified: boolean;
  notes?: string;
}

export interface PublicStaffVerification {
  staffId: string;
  fullName: string;
  department: string;
  designation: string;
  employmentStatus: string;
  trustName: string;
  isVerified: boolean;
  verifiedAt?: string;
  joiningDate?: string;
  validUntil?: string;
}

export interface PublicMembershipVerification {
  memberId: string;
  fullName: string;
  membershipType: 'general_member' | 'core_member' | string;
  membershipStatus: 'general_member' | 'core_member' | 'active' | 'suspended' | string;
  approvedAt?: string;
  issueDate?: string;
  validUntil?: string;
  trustName: string;
  isVerified: boolean;
  verifiedAt?: string;
}

export interface PublicDonorVerification {
  donorId: string;
  fullName: string;
  donorType?: string;
  donorStatus: 'approved' | 'active_donor' | string;
  trustName: string;
  isVerified: boolean;
  verifiedAt?: string;
  approvedAt?: string;
  issueDate?: string;
  validUntil?: string;
}

export interface PublicVolunteerVerification {
  volunteerId: string;
  fullName: string;
  volunteerRole?: string;
  volunteerWing?: string;
  volunteerStatus: 'approved' | 'active_volunteer' | string;
  trustName: string;
  isVerified: boolean;
  verifiedAt?: string;
  approvedAt?: string;
  issueDate?: string;
  validUntil?: string;
}

export interface PublicUniversalVerification {
  id: string;
  credentialType: 'member' | 'core_member' | 'volunteer' | 'donor' | 'staff' | 'management';
  fullName: string;
  designation: string;
  status: string;
  issueDate: string;
  validUntil: string;
  trustName: string;
  isVerified: boolean;
  bloodGroup?: string;
  parentName?: string;
  verifiedAt?: string;
}

export interface NavigationSubItem {
  id: string;
  label: string;
  target: string;
  isEnabled: boolean;
  isExternal?: boolean;
  badge?: string;
}

export interface NavigationMenuItem {
  id: string;
  label: string;
  target: string;
  isEnabled: boolean;
  order: number;
  badge?: string;
  isExternal?: boolean;
  subItems?: NavigationSubItem[];
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  badgeText?: string;
  imageUrl?: string;
  bgGradient?: string;
  isActive: boolean;
  status?: 'draft' | 'published';
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  order?: number;
  showTextOverlay?: boolean;
}

export interface OrgConfig {
  // Protected Legal Property (Locked; cannot be changed via dynamic CMS)
  readonly legalName: 'FATIMYAH EDUCATIONAL TRUST' | 'Fatimyah Educational Trust' | string;
  
  // Dynamic Platform Branding
  displayName: string;
  shortBrand: string;
  tagline: string;
  websiteUrl: string;
  
  // Contact & Official Details
  contactEmail: string;
  contactPhone: string;
  emergencyHotline?: string;
  headOfficeAddress: string;
  trustName?: string;
  registrationNumber: string;
  registrationJurisdiction?: string;
  registrationAuthority?: string;
  registrationAct?: string;
  legalStatusDescription?: string;
  nitiAayogId?: string;
  darpanId?: string;
  panNumber?: string;
  fcraNumber?: string;
  section12ANumber?: string;
  section80GNumber?: string;
  
  // Dynamic Navigation & Menus
  navigationMenu?: NavigationMenuItem[];

  // Homepage Sections Customization & Priority
  homepageSectionsOrdering?: string[];
  homepageSectionsVisibility?: Record<string, boolean>;

  // Header & Announcement Bar Settings
  announcementBarText?: string;
  announcementBarLink?: string;
  announcementBarBadge?: string;
  isAnnouncementBarActive: boolean;
  headerSettings?: {
    showLegalName?: boolean;
    showRegNumber?: boolean;
    showPhone?: boolean;
    showEmail?: boolean;
    showTaxExemptionTag?: boolean;
    showNitiAayogTag?: boolean;
    showTagline?: boolean;
  };

  // Footer & Content Settings
  footerSettings?: {
    aboutSummary?: string;
    copyrightText?: string;
    showLegalShield?: boolean;
    showSocialLinks?: boolean;
    showChapterRoadmap?: boolean;
    showGovernanceLinks?: boolean;
  };

  // Brand Colors (3 Core Identity Colors)
  primaryGreen: string;   // Deep Islamic Emerald Green (#0D6E42)
  primaryBlue: string;    // Royal Navy Sapphire (#0B2545)
  accentAmber: string;    // Sun Gold Amber (#D97706)
  
  // Visual Assets
  logoUrl?: string;
  faviconUrl?: string;
  appIconUrl?: string;
  
  // CMS Content
  heroSliders: HeroSlide[];
  featuredCampaignIds?: string[];
  featuredProgramIds?: string[];
  featuredEventIds?: string[];
  volunteerCta?: {
    heading?: string;
    description?: string;
    buttonText?: string;
    destination?: string;
    isVisible?: boolean;
  };
  governanceSettings?: {
    showTrusteesList?: boolean;
    showAuditComplianceBadge?: boolean;
    publicMessage?: string;
  };
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    telegram?: string;
    whatsapp?: string;
    whatsappCommunity?: string;
  };
  
  // Platform Metrics
  establishedYear: number;
  totalInstitutions?: number;
  totalStudentsBenefited?: number;
  activeVolunteersCount?: number;
  activeDonorsCount?: number;

  // Official Trust Bank & UPI Details
  bankDetails?: ManualDonationBankDetails;

  // Dedicated Super Admin Managed About Trust Content
  aboutTrust?: AboutTrustContentConfig;

  // Chairman's Official Message & Profile
  chairmanMessage?: {
    name: string;
    designation: string;
    photoUrl?: string;
    message: string;
    vision?: string;
    leadershipStatement?: string;
  };

  // Role-Specific Verified Quranic Verses (Super Admin Controlled)
  roleQuranicVerses?: Record<string, RoleQuranicVerseSetting>;

  updatedAt: string;
  updatedBy: string;
}

export interface TrusteeProfile {
  id: string;
  name: string;
  designation: string;
  isChairman?: boolean;
  photoUrl?: string;
  overview?: string;
  biography?: string;
  vision?: string;
  message?: string;
  responsibilities?: string[];
  contactEmail?: string;
  contactPhone?: string;
  displayOrder: number;
  isEnabled: boolean;
}

export interface OfficialSignatoryConfig {
  name: string;
  designation: string;
  photoUrl?: string;
  signatureUrl?: string;
  signatureEnabled: boolean;
  authorizationStatement?: string;
  termValidUntil?: string;
  // Official Institutional Seal
  officialSealUrl?: string;
  officialSealEnabled: boolean;
  sealResolution?: string;
  // Document placement toggles
  useOn80GReceipts?: boolean;
  useOnMembershipCards?: boolean;
  useOnCertificates?: boolean;
  useOnOfficialLetters?: boolean;
}

export interface AboutTrustContentConfig {
  // 1. Institutional Overview
  overviewIntroduction?: string;
  purpose?: string;
  educationalWorkSummary?: string;
  welfareWorkSummary?: string;
  communityServiceSummary?: string;
  empowermentObjectives?: string;
  areasOfWork?: string[];
  
  // 2. Mission & Objectives
  missionStatement?: string;
  visionStatement?: string;
  coreObjectives?: string[];
  educationObjectives?: string[];
  welfareObjectives?: string[];
  communityDevelopment?: string;
  serviceEmpowerment?: string;
  longTermGoals?: string[];

  // 3. Governance & Structure
  governanceDescription?: string;
  structureTiers?: {
    tierNumber: number;
    title: string;
    description: string;
    bodyName: string;
  }[];

  // 4. RBAC, Roles & Responsibilities Public Explanation
  rbacDescription?: string;
  rolesOverview?: {
    roleKey: string;
    roleTitle: string;
    responsibility: string;
    scope: string;
  }[];

  // 5. History & Milestones
  historyDescription?: string;
  milestones?: {
    id: string;
    year: string;
    title: string;
    description: string;
    category: 'Foundation' | 'Education' | 'Welfare' | 'Legal' | 'Digital';
    isKeyMilestone?: boolean;
  }[];

  // 6. Legal & Tax Status
  registrationNumber?: string;
  registrationJurisdiction?: string;
  registrationAuthority?: string;
  registrationAct?: string;
  legalStatusDescription?: string;
  registrationDate?: string;
  panNumberPublic?: string;
  darpanNgoId?: string;
  section12ADetails?: string;
  section80GDetails?: string;
  fcraStatus?: string;
  taxDeductionNote?: string;
  complianceStatement?: string;

  // 7. Leadership, Chairman & Trustees
  chairmanProfile?: TrusteeProfile;
  trustees?: TrusteeProfile[];

  // 7b. Core Values & Pillars
  coreValues?: {
    id?: string;
    title: string;
    description: string;
    icon?: string;
  }[];

  // 7c. Advisory Board Members
  advisoryMembers?: TrusteeProfile[];

  // 8. Authorized Signatory & Official Institutional Seal
  signatory?: OfficialSignatoryConfig;

  // 9. Audit & Transparency
  auditStatement?: string;
  financialTransparency?: string;
  auditorFirmName?: string;
  annualReturnStatus?: string;
  publicAccountabilityStatement?: string;
  fundDeploymentRatios?: {
    category: string;
    percentage: number;
    description: string;
  }[];
}

export interface RoleQuranicVerseSetting {
  roleKey: string;
  arabicText: string;
  reference: string;
  arabicReference?: string;
  surahName?: string;
  englishTranslation?: string;
  enabled: boolean;
  isCustom?: boolean;
  customSource?: string;
}

export interface ManualDonationBankDetails {
  accountBeneficiary: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  accountType?: string;
  upiId?: string;
  instructions?: string;
  referenceInstructions?: string;
  isEnabled: boolean;
}

export interface ModuleChapter {
  id: string;
  code: string;
  chapterNumber: number;
  series: 1 | 2 | 3;
  name: string;
  category: 'Governance & Core' | 'Community & Services' | 'Education & Welfare' | 'Enterprise & Future';
  description: string;
  technicalScope: string;
  lifecycle: ModuleLifecycle;
  requiredRole: UserRole | 'public';
  isPubliclyVisible: boolean;
  enabledInApp: boolean;
  iconName: string;
  routePath: string;
  features: string[];
  subCategories?: string[];
  updatedAt: string;
  updatedBy?: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetEntity: string;
  targetId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export type NotificationType = 'info' | 'announcement' | 'warning' | 'success' | 'critical';
export type NotificationCategory = 
  | 'system' 
  | 'membership' 
  | 'volunteer' 
  | 'donor' 
  | 'account' 
  | 'general' 
  | 'announcement' 
  | 'scholarship' 
  | 'donation' 
  | 'event' 
  | 'urgent'
  | 'competition'
  | 'examination'
  | 'certificate'
  | 'crowdfunding'
  | 'staff'
  | 'store';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';
export type NotificationPriority = 'normal' | 'important' | 'urgent';
export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived' | 'cancelled';
export type TargetAudience = 'all' | 'admins' | 'members' | 'volunteers' | 'donors' | 'students' | 'staff' | 'management' | 'specific_users';
export type NotificationTargetGroup = 'all' | 'members' | 'general_members' | 'core_members' | 'volunteers' | 'donors' | 'staff' | 'admins' | 'management' | 'specific_users';

export interface UserNotificationPreferences {
  emailAlerts?: boolean;
  membershipAlerts?: boolean;
  volunteerAlerts?: boolean;
  donationReceipts?: boolean;
  generalBulletins?: boolean;
  competitionAlerts?: boolean;
  examinationAlerts?: boolean;
  systemAlerts?: boolean;
  storeAlerts?: boolean;
}

export interface AppNotification {
  id?: string;
  userId: string; // Target recipient UID
  userEmail?: string;
  userName?: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  readAt?: string | null;
  type: NotificationCategory;
  category?: string;
  severity?: NotificationSeverity;
  priority?: NotificationPriority;
  status?: AnnouncementStatus;
  module?: 'membership' | 'volunteer' | 'donor' | 'account' | 'system' | 'donations' | 'applications' | 'campaigns' | 'competitions' | 'exams' | 'certificates' | 'general' | 'store';
  actionUrl?: string;
  actionLabel?: string;
  targetGroup?: NotificationTargetGroup | string;
  targetAudience?: string;
  broadcastId?: string;
  createdBy?: string;
  publishAt?: string;
  expiresAt?: string;
  relatedRecordId?: string;
  idempotencyKey?: string;
  isArchived?: boolean;
  archivedAt?: string;
  emailTriggered?: boolean;
  emailDeliveryStatus?: 'not_configured' | 'queued' | 'sent' | 'failed' | 'delivered';
  emailDeliveryNote?: string;
}

export interface AdminBroadcastDispatch {
  id?: string;
  title: string;
  message: string;
  type: NotificationCategory;
  category?: string;
  severity?: NotificationSeverity;
  priority?: NotificationPriority;
  status?: AnnouncementStatus;
  targetGroups: NotificationTargetGroup[];
  targetAudience?: string;
  targetUserIds?: string[];
  recipientCount: number;
  sentByUid: string;
  sentByEmail: string;
  dispatchedByEmail?: string;
  createdAt: string;
  publishAt?: string;
  expiresAt?: string;
  archivedAt?: string;
  archivedByEmail?: string;
  cancelledAt?: string;
  cancelledByEmail?: string;
  emailTriggerRequested?: boolean;
  triggerEmail?: boolean;
  emailDeliveryStatus?: 'not_configured' | 'queued' | 'sent' | 'failed' | 'delivered';
  emailDeliveryNote?: string;
  module?: string;
  actionUrl?: string;
  actionLabel?: string;
  statusHistory?: {
    status: AnnouncementStatus;
    changedAt: string;
    changedByEmail: string;
    note?: string;
  }[];
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetAudience: TargetAudience;
  targetRoles?: UserRole[];
  targetUserIds?: string[];
  isPublished: boolean;
  actionUrl?: string;
  createdAt: string;
  createdBy: string;
  readBy: string[];
}

// -------------------------------------------------------------
// USER DASHBOARD & FUNCTIONAL ENTITIES
// -------------------------------------------------------------

export interface DonationRecord {
  id: string;
  receiptNumber: string;
  donorUid?: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  donorPan?: string;
  amount: number;
  cause: 'General Education Fund' | 'Higher Education Scholarships' | 'Zakat Allocation' | 'Sadaqah / Welfare' | 'Medical Relief';
  paymentMode: 'UPI' | 'Net Banking' | 'Credit/Debit Card' | 'Cheque / Draft' | 'Direct Bank Transfer';
  transactionId: string;
  date: string;
  is80GEligible: boolean;
  certificate80GNumber?: string;
  status: 'COMPLETED' | 'PENDING_VERIFICATION' | 'REFUNDED';
}

export interface ScholarshipApplication {
  id: string;
  applicationNumber: string;
  applicantUid: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  currentCourse: string;
  institutionName: string;
  previousMarksPercentage: number;
  annualFamilyIncome: number;
  requestedAmount: number;
  category: 'Merit-cum-Means' | 'Higher Education' | 'Orphan Support' | 'Girls Education';
  status: 'SUBMITTED' | 'IN_SCRUTINY' | 'VERIFIED' | 'SANCTIONED' | 'DISBURSED' | 'REJECTED';
  sanctionedAmount?: number;
  appliedDate: string;
  remarks?: string;
}

export type VolunteerApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'inactive' | 'draft';

export interface VolunteerApplication {
  id?: string;
  applicantUid: string;
  applicantEmail: string;
  fullLegalName: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  photoURL?: string;
  profilePhotoUrl?: string;
  mobileNumber: string;
  country: string;
  state: string;
  district: string;
  fullAddress: string;
  dateOfBirth: string;
  educationQualification: string;
  skills: string[];
  areasOfInterest: string[];
  preferredActivities?: string[];
  previousExperience: string;
  availability: string;
  preferredLocation: string;
  statementOfPurpose: string;
  memberId?: string;
  declarationAccepted: boolean;
  status: VolunteerApplicationStatus;
  volunteerIdAssigned?: string;
  assignedCategory?: string;
  assignedWing?: string;
  assignedCommunityGroupId?: string;
  assignedCommunityGroupName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  reviewedByUid?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  statusReason?: string;
}

export interface VolunteerCategory {
  id?: string;
  name: string;
  code?: string;
  description: string;
  requiredSkills?: string[];
  iconName?: string;
  isActive?: boolean;
  volunteerCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type VolunteerActivityStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export interface VolunteerActivity {
  id?: string;
  title: string;
  category: string; // e.g. 'Education & Tutoring', 'Medical Relief', etc.
  description: string;
  date: string; // YYYY-MM-DD
  time?: string;
  location: string;
  district?: string;
  state?: string;
  requiredSkills: string[];
  maxVolunteers?: number;
  targetVolunteersCount?: number;
  assignedVolunteerIds: string[]; // UIDs of assigned volunteers
  assignedVolunteerNames?: string[];
  enrolledVolunteerIds?: string[]; // UIDs of self-enrolled volunteers
  communityGroupId?: string;
  communityGroupName?: string;
  status: VolunteerActivityStatus;
  hoursCredit: number; // e.g. 4
  coordinatorName?: string;
  coordinatorContact?: string;
  coordinatorEmail?: string;
  createdByUid?: string;
  createdByEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type VolunteerServiceStatus = 'pending_verification' | 'approved' | 'rejected';

export interface VolunteerServiceRecord {
  id?: string;
  volunteerUid: string;
  volunteerId?: string; // FET-VOL-2026-0101
  volunteerName: string;
  volunteerEmail: string;
  activityId?: string;
  activityTitle: string;
  category: string;
  date: string;
  hoursServed: number;
  description: string;
  location?: string;
  status: VolunteerServiceStatus;
  verifiedByUid?: string;
  verifiedByEmail?: string;
  verifiedAt?: string;
  adminNotes?: string;
  certificateIssued?: boolean;
  certificateId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityGroup {
  id?: string;
  name: string; // e.g. "Kashmir Educational Volunteers Chapter"
  code: string; // e.g. "FET-GRP-KASHMIR-01"
  description: string;
  category?: string;
  region: string; // State / District / Zone
  leaderName: string;
  leaderEmail?: string;
  leaderPhone?: string;
  leaderUid?: string;
  memberVolunteerIds: string[]; // UIDs or Volunteer IDs
  memberVolunteerNames?: string[];
  activeMissionIds?: string[];
  memberCount?: number;
  activeActivitiesCount?: number;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export type DonorApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type DonorType = 'individual' | 'organization';
export type DonationFrequency = 'one_time' | 'monthly' | 'quarterly' | 'yearly';

export interface DonorApplication {
  id?: string;
  applicantUid: string;
  applicantEmail: string;
  fullLegalName: string;
  mobileNumber: string;
  country: string;
  state: string;
  district: string;
  fullAddress: string;
  donorType: DonorType;
  organizationName?: string;
  areasOfSupport: string[];
  preferredFrequency: DonationFrequency;
  donationInterestAmount?: string;
  additionalNotes?: string;
  declarationAccepted: boolean;
  status: DonorApplicationStatus;
  donorIdAssigned?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  reviewedByUid?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface VolunteerRecord {
  id: string;
  volunteerUid?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  skills: string[];
  availability: 'Weekends' | 'Weekdays' | 'Emergency Call' | 'Full-Time';
  status: 'PENDING_REVIEW' | 'VERIFIED_ACTIVE' | 'INACTIVE';
  totalLoggedHours: number;
  joinedDate: string;
  assignedMissions: string[];
}

export interface VolunteerServiceLog {
  id: string;
  volunteerUid: string;
  volunteerName: string;
  missionName: string;
  date: string;
  hours: number;
  description: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
}

export type CampaignCategory = 
  | 'education' 
  | 'medical_assistance' 
  | 'emergency_assistance' 
  | 'food_basic_needs' 
  | 'community_development' 
  | 'other_charitable';

export type CampaignStatus = 
  | 'draft' 
  | 'pending_review' 
  | 'under_review'
  | 'approved' 
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'rejected' 
  | 'closed';

export type DocumentVerificationStatus = 'pending' | 'valid' | 'invalid' | 'needs_clarification' | 'missing';

export interface CampaignSupportingDocument {
  id: string;
  name: string;
  type: string; // e.g. 'Medical Estimate / Hospital Bill', 'Tuition Fee Structure / Bona Fide', 'Income Certificate / BPL Card', 'Identity / Locality Verification', 'Other Official Proof'
  url: string;
  uploadedAt: string;
  sizeBytes?: number;
  fileName?: string;
  mimeType?: string;
  isPrivate?: boolean;
  verificationStatus?: DocumentVerificationStatus;
  reviewerRemarks?: string;
  verifiedAt?: string;
  verifiedByUid?: string;
}

export interface CampaignSupportingImage {
  id: string;
  url: string;
  caption?: string;
  fileName?: string;
  uploadedAt?: string;
}

export type CaseWorkflowStage = 
  | 'draft' 
  | 'district_review' 
  | 'state_review' 
  | 'national_review' 
  | 'super_admin_approval' 
  | 'approved' 
  | 'rejected' 
  | 'clarification_requested';

export interface CampaignReviewHistoryEntry {
  id: string;
  action: string;
  fromStatus: CampaignStatus;
  toStatus: CampaignStatus;
  reviewerUid: string;
  reviewerEmail: string;
  timestamp: string;
  internalNotes?: string;
  applicantFeedback?: string;
  // Delegated Workflow Review Metadata
  reviewerLevel?: AdminScopeLevel | 'super_admin';
  assignedScope?: string; // e.g. "District: Kathua" or "State: Jammu & Kashmir"
  recommendation?: 'recommend_approve' | 'recommend_reject' | 'request_clarification' | 'verified';
}

export interface CrowdfundingCampaign {
  id?: string;
  campaignId?: string;
  campaignNumber?: string;
  title: string;
  category: CampaignCategory;
  categoryLabel?: string;
  description: string;
  beneficiaryDescription: string;
  beneficiaryName?: string;
  targetInstitution?: string;
  beneficiaryLocation?: string;
  targetAmount: number;
  requiredAmount?: number;
  raisedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  donorsCount?: number;
  verifiedDonationsCount: number;
  location: string;
  state: string;
  district: string;
  city?: string;
  startDate: string;
  endDate: string;
  fundUtilizationNotes?: string;
  coverImageUrl?: string;
  supportingImages?: CampaignSupportingImage[];
  supportingDocuments?: CampaignSupportingDocument[];
  contactPersonName: string;
  contactPhone: string;
  contactEmail: string;

  // Appeal Creator Detailed Information (Step 30)
  creatorFullName?: string;
  creatorParentage?: string;
  creatorContactPhone?: string;
  creatorAlternatePhone?: string;
  creatorEmailAddress?: string;
  creatorResidentialLocation?: string;
  creatorState?: string;
  creatorDistrict?: string;
  creatorCityTownVillage?: string;
  creatorMemberId?: string;
  relationshipToBeneficiary?: string; // 'Self' | 'Family / Guardian' | 'Relative' | 'Volunteer' | 'Community Representative' | 'Other'

  declarationAccepted: boolean;
  termsAccepted: boolean;
  status: CampaignStatus;
  isVerifiedByFET: boolean;
  creatorUid: string;
  creatorEmail: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedByUid?: string;
  approvedByEmail?: string;
  reviewedAt?: string;
  reviewedByUid?: string;
  reviewedByEmail?: string;
  reviewNotes?: string;
  internalReviewNotes?: string;
  rejectionReason?: string;
  correctionReason?: string;
  pausedAt?: string;
  pausedReason?: string;
  completedAt?: string;
  closedAt?: string;
  closureReason?: string;
  reviewHistory?: CampaignReviewHistoryEntry[];

  // Delegated Jurisdictional Workflow (District -> State -> National -> Super Admin)
  workflowStage?: CaseWorkflowStage;
  requiredReviewLevel?: 'district' | 'state' | 'national' | 'super_admin_only' | 'all';
  districtReview?: {
    reviewedByUid: string;
    reviewedByEmail: string;
    reviewerName?: string;
    district: string;
    recommendation: 'recommend_approve' | 'recommend_reject' | 'request_clarification' | 'verified';
    notes: string;
    reviewedAt: string;
  };
  stateReview?: {
    reviewedByUid: string;
    reviewedByEmail: string;
    reviewerName?: string;
    state: string;
    recommendation: 'recommend_approve' | 'recommend_reject' | 'request_clarification' | 'verified';
    notes: string;
    reviewedAt: string;
  };
  nationalReview?: {
    reviewedByUid: string;
    reviewedByEmail: string;
    reviewerName?: string;
    recommendation: 'recommend_approve' | 'recommend_reject' | 'request_clarification' | 'verified';
    notes: string;
    reviewedAt: string;
  };
}

export type CampaignDonationStatus = 'initiated' | 'pending_verification' | 'verified' | 'failed' | 'cancelled' | 'refunded';

export interface CampaignDonation {
  id?: string;
  donationId: string;
  campaignId: string;
  campaignTitle: string;
  donorUid?: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  donorPan?: string;
  amount: number;
  createdAt: string;
  paymentStatus: CampaignDonationStatus;
  transactionReference: string;
  paymentMethod?: string;
  isAnonymous: boolean;
  message?: string;
  // Razorpay Gateway fields
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  gatewayMode?: 'test' | 'live';
  verifiedAt?: string;
  verifiedByUid?: string;
  verifiedByEmail?: string;
  refundedAt?: string;
  refundedByUid?: string;
  refundedByEmail?: string;
  refundReason?: string;
  cancelledAt?: string;
  cancelledByUid?: string;
  cancelledReason?: string;
  adminNotes?: string;
  receiptNumber?: string;
  financialYear?: string;
}

export type StoreProductType = 
  | 'physical' 
  | 'digital' 
  | 'book' 
  | 'clothing'
  | 'fashion'
  | 'perfume'
  | 'fragrance'
  | 'educational_material' 
  | 'publication' 
  | 'educational_resource' 
  | 'merchandise' 
  | 'other';

export type StoreProductAvailability = 
  | 'in_stock' 
  | 'available'
  | 'out_of_stock' 
  | 'unavailable'
  | 'pre_order' 
  | 'discontinued';

export type StoreProductStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'DRAFT';

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  subcategories?: string[];
  isActive: boolean;
  displayOrder?: number;
  isCore?: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUid?: string;
}

export type StoreDigitalAccessType = 
  | 'public_download'      // Free/Publicly accessible (open syllabus, annual reports, free publications)
  | 'sample_preview'       // Free sample excerpt or preview chapter (full copy deferred to future orders)
  | 'restricted';          // Protected institutional/enrolled access (requires entitlement/order)

export interface StoreDigitalAsset {
  fileName: string;
  fileUrl: string;
  fileSize?: number;        // size in bytes
  fileType?: string;        // e.g. "application/pdf"
  accessType: StoreDigitalAccessType;
  previewUrl?: string;      // optional sample preview URL if full file is restricted
  pageCount?: number;       // e.g. 120
  downloadCount?: number;
  uploadedAt?: string;
  description?: string;
}

export type StoreImageViewType = 
  | 'front' 
  | 'back' 
  | 'side' 
  | 'detail' 
  | 'model' 
  | 'bottle' 
  | 'box' 
  | 'packaging' 
  | 'label' 
  | 'ingredients' 
  | 'other';

export interface StoreProductImageItem {
  id?: string;
  url: string;
  label?: string; // e.g. "Front View", "Main Bottle", "Box / Packaging", "Label & Ingredients"
  viewType?: StoreImageViewType;
  isPrimary?: boolean;
}

export interface StoreProductOption {
  name: string; // e.g. "Size", "Color", "Bottle Size", "Format", "Edition"
  values: string[]; // e.g. ["S", "M", "L", "XL"] or ["30 ml", "50 ml", "100 ml"]
}

export interface StoreProductVariant {
  id: string;
  name: string; // e.g. 'Size L / Navy Blue' or 'Bottle: 50 ml'
  sku?: string;
  price?: number; // Optional variant price override
  mrp?: number; // Optional variant MRP
  imageUrl?: string;
  availability: StoreProductAvailability;
  isAvailable?: boolean;
  stockCount?: number;
  trackInventory?: boolean;
  attributes?: Record<string, string>; // e.g. { "Size": "L", "Color": "Navy Blue" } or { "Bottle Size": "50 ml" }
  isDigital?: boolean;
  digitalAsset?: StoreDigitalAsset;
}

export interface StoreProduct {
  id: string;
  name: string;
  slug?: string;
  description: string;
  category: string;
  categoryName?: string;
  productType: StoreProductType;
  price: number;
  mrp?: number;
  availability: StoreProductAvailability;
  isAvailable?: boolean;
  trackInventory?: boolean;
  stockCount?: number;
  lowStockThreshold?: number;
  allowBackorders?: boolean;
  isPublished: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  isDemo?: boolean;
  sku?: string;
  imageUrl?: string;
  productImages?: string[];
  galleryItems?: StoreProductImageItem[];
  subCategory?: string;
  status?: StoreProductStatus | 'OUT_OF_STOCK';
  authorOrPublisher?: string;
  features?: string[];
  hasVariants?: boolean;
  variantOptions?: StoreProductOption[];
  variants?: StoreProductVariant[];
  isDigital?: boolean;
  digitalAsset?: StoreDigitalAsset;
  language?: string;
  edition?: string;
  format?: string;
  pagesCount?: number;
  
  // Fashion & Clothing Attributes (Task 29)
  brand?: string;
  fabric?: string;
  fit?: string;
  style?: string;
  clothingGender?: 'women' | 'men' | 'children' | 'unisex';
  weightGrams?: number;
  shippingInfo?: {
    weightGrams?: number;
    estimatedDays?: string;
    freeShipping?: boolean;
    shippingFee?: number;
    deliveryNotes?: string;
  };

  // Books & Educational Products Attributes (Task 29)
  isbn?: string;
  publisher?: string;
  binding?: string; // Paperback, Hardcover, Spiral, Leatherette, etc.

  // Perfumes & Fragrances Attributes (Task 30)
  fragranceName?: string;
  perfumeAudience?: 'women' | 'men' | 'unisex';
  fragranceConcentration?: 'edp' | 'edt' | 'parfum' | 'attar' | 'body_mist' | 'other' | string;
  bottleSizes?: string[]; // Configurable sizes (e.g. ['10 ml', '30 ml', '50 ml', '100 ml'])
  fragranceNotes?: {
    top?: string;
    middle?: string;
    base?: string;
  };
  fragranceFamily?: string; // Floral, Woody, Fresh, Oriental, Citrus, etc.
  countryOfOrigin?: string;
  manufacturer?: string;
  ingredients?: string;

  // Related & Complementary Products (Task 29)
  relatedProductIds?: string[];

  // Product-Level Payment Eligibility (Task 30)
  paymentMethods?: 'cod' | 'razorpay' | 'both';
  createdAt: string;
  updatedAt: string;
  createdByUid?: string;
  createdByEmail?: string;
}

export interface TravelPackage {
  id: string;
  title: string;
  type: 'Umrah' | 'Ziyarat' | 'Educational Tour' | 'Other';
  durationDays: number;
  departureDate: string;
  returnDate: string;
  pricePerPerson: number;
  totalSeats: number;
  availableSeats: number;
  inclusionHighlights: string[];
  status: 'UPCOMING' | 'BOOKINGS_OPEN' | 'FULL' | 'DRAFT';
  description: string;
}

export type CompetitionCategory = 
  | 'book_reading'
  | 'stem_olympiad'
  | 'islamic_studies'
  | 'monthly_test'
  | 'essay_writing'
  | 'general_academic'
  | 'other';

export type CompetitionStatus = 
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'under_evaluation'
  | 'result_pending'
  | 'published'
  | 'completed'
  | 'archived';

export type ExamLanguage = 
  | 'en' 
  | 'hi' 
  | 'ur' 
  | 'ks' 
  | 'bn' 
  | 'te' 
  | 'ta' 
  | 'mr' 
  | 'gu' 
  | 'kn' 
  | 'ml' 
  | 'pa' 
  | 'or' 
  | 'as' 
  | 'ar' 
  | 'fa' 
  | string;

export interface ExamSeries {
  id: string; // e.g. "series-1"
  seriesCode: string; // e.g. "Series 1", "Series 2", "Series 3", "Series 4", "Series 5"
  seriesTitle?: string;
  orderMode?: 'shuffled_questions' | 'custom_questions' | 'shuffled_options';
  questions?: ExamQuestion[];
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard' | 'advanced';

export type QuestionType = 'mcq' | 'multiple_mcq' | 'true_false' | 'fill_blank' | 'descriptive';

export interface QuestionTranslation {
  language: ExamLanguage;
  questionText: string;
  options?: string[];
  explanation?: string;
  readingReference?: string;
  direction?: 'ltr' | 'rtl';
}

export interface BookMasteryReference {
  bookId?: string;
  bookTitle: string;
  author?: string;
  chapterNumber?: number;
  chapterTitle: string;
  pageRange?: string;
  topicTag?: string;
}

export interface ExamQuestion {
  id: string;
  questionText: string;
  primaryLanguage?: ExamLanguage;
  translations?: Partial<Record<ExamLanguage, QuestionTranslation>>;
  questionType: QuestionType;
  options?: string[]; // 4 options for MCQ
  correctOptionIndex?: number; // 0, 1, 2, 3 (hidden from participant during exam)
  correctOptionIndices?: number[]; // For multiple choice
  expectedAnswerKeywords?: string[];
  marks: number;
  negativeMarks?: number;
  difficulty?: QuestionDifficulty;
  explanation?: string;
  readingReference?: string;
  bookMastery?: BookMasteryReference;
  questionBankId?: string;
  questionBankTitle?: string;
  sectionId?: string;
  status?: 'draft' | 'pending_review' | 'approved' | 'rejected';
  aiGenerated?: boolean;
  reviewedByUid?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookChapterMastery {
  chapterNumber: number;
  chapterTitle: string;
  topicSummary?: string;
  recommendedPages?: string;
}

export interface QuestionBank {
  id?: string;
  code: string;
  title: string;
  subject: string;
  category: CompetitionCategory;
  description?: string;
  bookMastery?: {
    bookTitle: string;
    author: string;
    publisher?: string;
    edition?: string;
    chapters: BookChapterMastery[];
  };
  primaryLanguage: ExamLanguage;
  supportedLanguages: ExamLanguage[];
  questionsCount: number;
  approvedQuestionsCount: number;
  pendingReviewCount: number;
  questions?: ExamQuestion[];
  createdByUid: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSection {
  id: string;
  sectionCode: string; // e.g. "SEC-A"
  title: string;
  description?: string;
  instructions?: string[];
  durationMinutes?: number;
  totalMarks: number;
  passingMarks?: number;
  questionSelectionMode?: 'manual' | 'random_from_pool' | 'all';
  poolQuestionBankId?: string;
  poolQuestionCount?: number;
  questions: ExamQuestion[];
}

export interface ExamIntegrityConfig {
  enforceFullscreen: boolean;
  trackTabSwitch: boolean;
  maxTabSwitchViolations: number;
  preventCopyPaste: boolean;
  preventContextMenu: boolean;
  autoSubmitOnTimeExpiry: boolean;
  allowResumeOnDisconnect: boolean;
  heartbeatIntervalSeconds: number;
}

export interface BookReadingDetails {
  bookTitle: string;
  author: string;
  recommendedPublisher?: string;
  readingDurationWeeks?: number;
  requiredChapters?: string;
  submissionRequirements?: string;
  bookCoverUrl?: string;
  pdfReadingMaterialUrl?: string;
  pdfFileName?: string;
  pdfFileSizeBytes?: number;
  pdfSourceType?: 'upload' | 'external_url';
  pdfExternalUrl?: string;
  pdfStoragePath?: string;
}

export interface ExamStructureDetails {
  isOnlineExam: boolean;
  paperCode?: string;
  paperTitle?: string;
  durationMinutes: number;
  totalMarks?: number;
  passingMarks?: number;
  supportedLanguages?: ExamLanguage[];
  defaultLanguage?: ExamLanguage;
  allowLanguageSwitching?: boolean;
  sections?: ExamSection[];
  questions?: ExamQuestion[];
  instructions?: string[];
  allowReviewBeforeSubmit?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  integrityConfig?: ExamIntegrityConfig;

  // Pre-Exam Instruction & Answer Policy Settings (Super Admin Controlled)
  instructionDurationMinutes?: number; // Pre-exam instruction screen duration in minutes (e.g. 1, 2, 3...)
  allowAnswerChanges?: boolean; // ON/OFF: Allow candidate to change an already answered question (default: true)
  allowReviewQuestions?: boolean; // ON/OFF: Allow candidate to return to previously answered questions (default: true)

  // Series 1 to 5 Architecture
  seriesCount?: number; // 1 to 5
  seriesList?: ExamSeries[];

  // Scheduled Examination Window (IST / Asia/Kolkata default)
  examScheduleDate?: string; // YYYY-MM-DD
  openingTime?: string; // e.g. "09:00"
  closingTime?: string; // e.g. "10:00"
  timeZone?: string; // Default "Asia/Kolkata"
  allowMultipleAttempts?: boolean; // Default false (1 candidate = 1 attempt)
}

export interface CompetitionPrizeTier {
  id: string;
  rankPosition: number; // 1, 2, 3...
  title: string; // e.g. "1st National Prize", "Runner Up"
  rewardAmount?: number; // e.g. 50000
  rewardDescription: string; // e.g. "Cash Scholarship + Laptop + Trophy"
  eligibilityInfo?: string; // e.g. "Open to All Registered Candidates"
  winnerCount: number; // e.g. 1
  status: 'active' | 'inactive';
  rewardType?: 'cash' | 'scholarship' | 'medal_trophy' | 'certificate' | 'gadget_book' | 'other' | string;
}

export interface Competition {
  id?: string;
  code: string; // e.g. "FET-CMP-2026-001"
  title: string;
  category: CompetitionCategory;
  categoryLabel?: string;
  description: string;
  
  // Eligibility Configuration
  eligibilityAgeMin?: number;
  eligibilityAgeMax?: number;
  eligibleClasses: string[]; // e.g. ['Class 5-8', 'Class 9-10', 'Class 11-12', 'Graduation', 'Open']
  eligibleStates?: string[]; // Empty or ['All India']
  eligibleDistricts?: string[];

  // Schedule & Lifecyle
  registrationStartDate: string; // YYYY-MM-DD
  registrationEndDate: string; // YYYY-MM-DD
  competitionDate: string; // YYYY-MM-DD
  resultPublicationDate?: string; // YYYY-MM-DD
  
  // Capacity & Scoring
  maxParticipants: number;
  registeredCount: number;
  maxMarks: number;
  passingMarks: number;
  
  // Rich Configurations
  rules: string[];
  coverImageUrl?: string;
  bookDetails?: BookReadingDetails;
  pdfReadingMaterialUrl?: string;
  pdfFileName?: string;
  pdfFileSizeBytes?: number;
  pdfSourceType?: 'upload' | 'external_url';
  pdfExternalUrl?: string;
  pdfStoragePath?: string;
  examDetails?: ExamStructureDetails;
  prizesSummary?: string[];
  prizeRewards?: CompetitionPrizeTier[];

  // Participation Fee & Evaluation Configuration
  isPaid?: boolean; // Free vs Paid Examination toggle
  participationFee?: number; // Fee in INR (e.g. 50, 100, 250)
  autoEvaluateResults?: boolean; // System evaluates objective MCQs automatically
  autoPublishResults?: boolean; // System automatically publishes scores upon submission
  showInPublicTop100?: boolean; // Eligible for inclusion in Public Top 100 showcase
  assignedExaminerUids?: string[]; // Examiners authorized to grade this examination
  assignedExaminerEmails?: string[];

  // Status & Governance
  status: CompetitionStatus;
  isPublished: boolean;
  resultsApprovedAt?: string;
  resultsApprovedByUid?: string;
  resultsApprovedByEmail?: string;
  resultsPublishedAt?: string;
  resultsPublishedByUid?: string;

  // Scheduled Examination & Series Management
  examScheduleDate?: string; // YYYY-MM-DD
  openingTime?: string; // HH:mm e.g. "09:00"
  closingTime?: string; // HH:mm e.g. "10:00"
  timeZone?: string; // Default "Asia/Kolkata"
  seriesCount?: number; // 1 to 5
  seriesList?: ExamSeries[];
  allowMultipleAttempts?: boolean; // Default false
  isDeleted?: boolean;

  // Metadata
  createdByUid: string;
  createdByEmail: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;

  // Test vs Live Environment Separation
  isTestCompetition?: boolean;
  environment?: 'live' | 'test';
}

export type ParticipantAward = '1st_rank' | '2nd_rank' | '3rd_rank' | 'merit' | 'participation' | 'special_award' | 'none';

export interface CompetitionRegistration {
  id?: string;
  registrationId: string; // Unique doc ID / lookup
  participantId: string; // e.g. "FET-PRT-2026-0101"
  competitionId: string;
  competitionCode?: string;
  competitionTitle: string;
  competitionCategory: CompetitionCategory;
  
  // User Link
  participantUid: string;
  participantName: string;
  parentName?: string;
  dateOfBirth?: string;
  gender?: string;
  mobileNumber: string;
  email: string;
  country: string;
  state: string;
  district: string;
  schoolInstitution: string;
  classGrade: string;

  // Registration Metadata
  registeredAt: string;
  status: 'registered' | 'attended' | 'absent' | 'disqualified' | 'evaluated' | 'completed' | 'pending_review' | 'pending' | 'verified';
  
  // Aliases and Extended Fields
  userId?: string;
  candidateUid?: string;
  uid?: string;
  isVerified?: boolean;
  verificationStatus?: 'verified' | 'pending' | 'rejected' | string;
  registrationNumber?: string;
  candidateName?: string;
  candidateEmail?: string;
  parentEmail?: string;
  timeTakenMinutes?: number;
  evaluationFeedback?: string;
  violations?: CandidateViolationRecord[];

  // Online Exam Attempt Status
  examAttemptStatus?: 'not_started' | 'in_progress' | 'submitted' | 'auto_submitted' | 'evaluated';
  submissionReason?: string;
  submissionType?: string;
  assignedSeries?: string; // e.g. "Series 1", "Series 2", "Series 3", "Series 4", "Series 5"
  examStartedAt?: string;
  examSubmittedAt?: string;
  submittedAt?: string;
  attemptId?: string;
  submittedAnswers?: Record<string, any>;

  // Evaluation & Scoring
  marksObtained?: number;
  totalMarks?: number;
  percentage?: number;
  grade?: string; // 'A+', 'A', 'B', 'C', etc.
  rank?: number; // 1, 2, 3...
  awardCategory?: ParticipantAward;
  evaluatorRemarks?: string;
  evaluatedByUid?: string;
  evaluatedByEmail?: string;
  evaluatedAt?: string;

  // Auto-evaluation counts
  correctAnswersCount?: number;
  incorrectAnswersCount?: number;
  unansweredCount?: number;

  // Payment Status (for Paid Examinations)
  isPaid?: boolean;
  participationFee?: number;
  paymentFeeAmount?: number;
  paymentStatus?: 'not_required' | 'free' | 'pending' | 'paid' | 'refunded';
  paymentId?: string;
  orderId?: string;
  paymentCompletedAt?: string;

  // Result & Certificate
  isResultPublished?: boolean;
  resultsPublishedAt?: string;
  certificateIssued?: boolean;
  certificateId?: string; // "FET-CERT-CMP-2026-0101"
  certificateIssuedAt?: string;
  updatedAt?: string;

  // Test vs Live Environment Separation
  isTestRegistration?: boolean;
  environment?: 'live' | 'test';
}

export interface ExamAttemptViolationLog {
  type: 'tab_blur' | 'fullscreen_exit' | 'paste_attempt' | 'context_menu' | 'dev_tools_attempt';
  timestamp: string;
  details?: string;
}

export interface CandidateViolationRecord {
  id: string;
  type: 'tab_switch' | 'focus_loss' | 'fullscreen_exit' | 'paste_attempt' | 'context_menu' | 'dev_tools_attempt' | 'suspicious_pattern';
  timestamp: string;
  details: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface CandidateAnswerState {
  questionId: string;
  answer: any; // Option index, array of indices, or string text
  sectionId?: string;
  isMarkedForReview?: boolean;
  visited?: boolean;
  timeSpentSeconds?: number;
  languageUsed?: ExamLanguage;
  isCorrect?: boolean;
  awardedMarks?: number;
  evaluatorFeedback?: string;
}

export interface ExamAttemptRecord {
  id?: string;
  registrationId: string;
  participantId: string;
  competitionId: string;
  competitionTitle?: string;
  paperId?: string;
  paperCode?: string;
  participantUid: string;
  participantName: string;
  participantEmail?: string;
  schoolInstitution?: string;
  selectedLanguage?: ExamLanguage;
  assignedSeries?: string; // e.g. "Series 1", "Series 2", "Series 3", "Series 4", "Series 5"
  startedAt: string;
  submittedAt?: string;
  timeSpentSeconds?: number;
  answers: Record<string, CandidateAnswerState | any>; // questionId -> answer state or raw value
  sectionScores?: Record<string, number>;
  autoScore?: number;
  manualScore?: number;
  finalScore?: number;
  totalMarks?: number;
  percentage?: number;
  grade?: string;
  rank?: number;
  violationsCount?: number;
  violations?: ExamAttemptViolationLog[];
  isDisqualified?: boolean;
  disqualificationReason?: string;
  evaluatorRemarks?: string;
  evaluatedByUid?: string;
  evaluatedByEmail?: string;
  evaluatedAt?: string;
  status: 'in_progress' | 'submitted' | 'graded' | 'disqualified';
  createdAt?: any;
  updatedAt?: any;
}

export type CertificateStatus = 'valid' | 'revoked' | 'pending' | 'expired';

export interface CompetitionCertificateRecord {
  id?: string;
  certificateId: string; // e.g. "FET-CERT-CMP-2026-0001"
  participantId: string;
  registrationId: string;
  competitionId: string;
  competitionTitle: string;
  competitionCategory: CompetitionCategory;
  participantName: string;
  parentName?: string;
  schoolInstitution: string;
  district: string;
  state: string;
  achievement: ParticipantAward;
  achievementTitle: string; // "1st Place Winner", "Certificate of Merit", "Certificate of Participation"
  rank?: number;
  score?: number;
  totalMarks?: number;
  grade?: string;
  issueDate: string;
  status?: CertificateStatus;
  isVerified?: boolean;
  trustName?: string;
  revokedAt?: string;
  revokedByUid?: string;
  revokedByEmail?: string;
  revocationReason?: string;
  reinstatedAt?: string;
  reinstatedByEmail?: string;
  verificationUrl?: string;
  issuedByUid: string;
  issuedByEmail: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PublicCertificateRecord {
  certificateId: string;
  recipientName: string;
  competitionTitle: string;
  category: string;
  achievementTitle: string;
  rank?: number;
  score?: number;
  totalMarks?: number;
  grade?: string;
  issueDate: string;
  institution: string;
  district: string;
  state: string;
  status?: CertificateStatus;
  isVerified: boolean;
  trustName?: string;
  revokedAt?: string;
  revokedByEmail?: string;
  revocationReason?: string;
  reinstatedAt?: string;
  verifiedAt?: string;
}

export type PublicCertificateVerification = PublicCertificateRecord;

export interface ExamCompetition {
  id: string;
  title: string;
  gradeLevel: string;
  examDate: string;
  registrationDeadline: string;
  registeredCount: number;
  totalMarks: number;
  status: 'REGISTRATIONS_OPEN' | 'HALL_TICKETS_ISSUED' | 'EXAM_CONCLUDED' | 'RESULTS_PUBLISHED';
}

// -------------------------------------------------------------
// MEMBERSHIP APPLICATION (FOUNDATION & SCHEMA)
// -------------------------------------------------------------

export type MembershipApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type MembershipType = 'general_member' | 'core_member';
export type MembershipTierRequested = MembershipType;

export interface MembershipApplication {
  id?: string;
  applicantUid: string;
  applicantEmail: string;
  fullLegalName: string;
  mobileNumber: string;
  country: string;
  membershipType?: MembershipType;
  requestedTier?: MembershipTierRequested;
  state: string;
  district: string;
  fullAddress: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  educationalQualification?: string;
  qualification?: string;
  areasOfInterest?: string[];
  reasonForJoining?: string;
  motivationStatement?: string;
  statementOfAffiliation?: string;
  commitmentHoursPerMonth?: number;
  declarationAccepted: boolean;
  termsAccepted?: boolean;
  status: MembershipApplicationStatus;
  createdAt: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewedByUid?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  membershipIdAssigned?: string;
}

// -------------------------------------------------------------
// FINANCE, ACCOUNTING & EXPENDITURE TYPES (STEP 46)
// -------------------------------------------------------------

export type FinancialTransactionType = 'income' | 'expense';

export type FinancialIncomeCategory =
  | 'crowdfunding_donation'
  | 'direct_donation'
  | 'membership_fee'
  | 'school_fee'
  | 'madrasa_fee'
  | 'madrasa_contribution'
  | 'corpus_grant'
  | 'institutional_grant'
  | 'csr_contribution'
  | 'investment_income'
  | 'event_competition_fee'
  | 'other_income';

export type FinancialExpenseCategory =
  | 'office_administration'
  | 'staff_salaries'
  | 'utilities_maintenance'
  | 'construction_infrastructure'
  | 'equipment_purchases'
  | 'educational_materials'
  | 'education_scholarships'
  | 'medical_assistance'
  | 'community_relief'
  | 'relief_activities'
  | 'campaign_disbursement'
  | 'events_competitions'
  | 'statutory_compliance'
  | 'other_expense';

export type ExpenseApprovalStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'department_review'
  | 'finance_review'
  | 'trust_approval'
  | 'approved'
  | 'paid'
  | 'accounted'
  | 'rejected'
  | 'cancelled';

export type FinancialOrgUnit = 
  | 'Trust Head Office'
  | 'State Office'
  | 'District Office'
  | 'School'
  | 'Madrasa'
  | 'Project'
  | 'Campaign'
  | 'Fund';

export interface ExpenseApprovalStep {
  stage: 'submission' | 'department_review' | 'finance_review' | 'trust_approval' | 'payment_execution' | 'rejection' | 'cancellation' | 'accounting_entry';
  action: 'submitted' | 'department_approved' | 'finance_verified' | 'trust_approved' | 'paid' | 'accounted' | 'rejected' | 'cancelled';
  actorUid: string;
  actorEmail: string;
  actorName?: string;
  actorRole: string;
  timestamp: string;
  notes?: string;
}

export type FinancialPaymentStatus =
  | 'verified'
  | 'pending_verification'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type FinancialPaymentMethod =
  | 'upi'
  | 'bank_transfer'
  | 'rtgs_neft'
  | 'cheque'
  | 'cash'
  | 'card'
  | 'online_gateway';

export type BankReconciliationStatus =
  | 'unmatched'
  | 'matched'
  | 'pending_review'
  | 'reconciled';

export type BankAccountType = 'current' | 'savings' | 'fcra' | 'corpus';

export interface FinancialRecord {
  id?: string;
  transactionId: string; // e.g. "FET-TXN-2026-0001" or "FET-EXP-2026-0001"
  voucherNumber?: string; // e.g. "FET-VCH-2026-0001"
  type: FinancialTransactionType;
  category: FinancialIncomeCategory | FinancialExpenseCategory | string;
  categoryLabel?: string;
  subCategory?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status: ExpenseApprovalStatus | FinancialPaymentStatus;
  paymentStatus?: FinancialPaymentStatus;
  paymentMethod?: FinancialPaymentMethod | string;
  referenceNumber?: string; // e.g. UTR / UPI Ref / Bank Cheque No
  payerPayeeName: string;
  payerPayeeEmail?: string;
  payerPayeePhone?: string;
  payerPan?: string;
  description: string;
  department?: 'General' | 'Scholarships' | 'Relief' | 'School' | 'Madrasa' | 'Administration' | 'Events' | 'IT' | string;
  fundType?: 'General' | 'Zakat' | 'Sadaqah' | 'Corpus' | 'Restricted' | string;
  campaignId?: string;
  campaignTitle?: string;
  invoiceReceiptUrl?: string;
  receiptNumber?: string;
  financialYear: string; // e.g. "2026-27"
  isLinkedDonation?: boolean;
  linkedDonationId?: string;

  // Bank Management & Reconciliation (Task 5)
  bankAccountId?: string;
  bankAccountName?: string;
  bankTransactionType?: 'deposit' | 'withdrawal' | 'transfer' | 'settlement';
  reconciliationStatus?: BankReconciliationStatus;
  reconciledAt?: string;
  reconciledByUid?: string;
  reconciledByName?: string;
  bankStatementReference?: string;
  reconciliationNotes?: string;
  settlementBatchId?: string;

  // Organizational Scope & Multi-Unit Architecture (SRS Requirement 9)
  organizationalUnit?: FinancialOrgUnit | string;
  sourceModule?: 'crowdfunding' | 'direct_donation' | 'membership' | 'school' | 'madrasa' | 'examinations' | 'manual';
  sourceRecordId?: string;
  supportingDocumentUrls?: string[];

  // General Ledger & Chart of Accounts Integration
  accountId?: string;
  accountCode?: string;
  voucherId?: string;

  // Non-destructive adjustment entry tracking (SRS Immutability Principle)
  isAdjustmentEntry?: boolean;
  originalTransactionId?: string;
  adjustmentReason?: string;
  isLocked?: boolean;
  
  // Creation metadata
  createdByUid: string;
  createdByEmail: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;

  // Multi-Stage Workflow & Approval History (SRS Chapter 15)
  approvalHistory?: ExpenseApprovalStep[];

  // Workflow / Approval metadata
  approvedByUid?: string;
  approvedByEmail?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalNotes?: string;

  // Payment execution metadata
  paidByUid?: string;
  paidByEmail?: string;
  paidByName?: string;
  paidAt?: string;
  paymentNotes?: string;

  // Rejection / Cancellation metadata
  rejectionReason?: string;
  cancelledReason?: string;
  refundReason?: string;
  refundedAt?: string;
  refundedByUid?: string;
  refundedByEmail?: string;
  notes?: string;
}

export interface FinancialSummaryMetrics {
  totalIncome: number;
  donationIncome: number;
  membershipIncome: number;
  otherIncome: number;
  totalExpenses: number;
  pendingIncome: number;
  pendingExpenses: number;
  refundedAmount: number;
  netBalance: number;
  totalTransactionsCount: number;
  verifiedIncomesCount: number;
  paidExpensesCount: number;
  pendingApprovalsCount: number;
}

// -------------------------------------------------------------
// FINANCE & ACCOUNTING FOUNDATION TYPES (CHAPTER 15 SRS)
// -------------------------------------------------------------

export type FinanceAccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export type FinanceAccountClassification = 
  | 'current_asset' 
  | 'fixed_asset' 
  | 'current_liability' 
  | 'long_term_liability' 
  | 'corpus_fund' 
  | 'general_reserve' 
  | 'direct_income' 
  | 'indirect_income' 
  | 'program_expense' 
  | 'operating_expense' 
  | 'compliance_expense';

export interface FinanceAccount {
  id: string;
  code: string; // e.g. "1010", "4010"
  name: string;
  type: FinanceAccountType;
  classification: FinanceAccountClassification;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  status: 'active' | 'archived';
  isBankOrCash: boolean;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  isSystemAccount?: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceBankAccount {
  id?: string;
  accountCode?: string; // e.g. "FET-BNK-01"
  accountName: string; // e.g. "Trust Main Operating Account"
  bankName: string; // e.g. "State Bank of India"
  accountNumber: string; // Stored securely, displayed with masking
  ifscCode: string;
  branchName?: string;
  accountType: BankAccountType;
  currency: string; // Default: "INR"
  openingBalance: number;
  currentBalance: number;
  status: 'active' | 'inactive';
  upiId?: string;
  isPrimary?: boolean;
  notes?: string;
  createdByUid: string;
  createdByEmail: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransactionMatchPayload {
  bankAccountId: string;
  bankAccountName: string;
  bankStatementReference: string;
  reconciliationStatus: BankReconciliationStatus;
  notes?: string;
}

export interface GeneralLedgerEntry {
  id: string;
  transactionId: string; // references FinancialRecord.transactionId
  voucherNumber?: string;
  entryDate: string; // YYYY-MM-DD
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  narration: string;
  financialYear: string;
  isAdjustmentEntry: boolean;
  originalTransactionId?: string;
  adjustmentReason?: string;
  isLocked: boolean; // Immutable once posted
  createdByUid: string;
  createdAt: string;
}

export interface FinanceBudget {
  id?: string;
  budgetId?: string; // e.g. "FET-BGT-2026-0001"
  name: string;
  financialYear: string; // e.g. "2026-27"
  department: string;
  allocatedAmount: number;
  utilizedAmount?: number;
  remainingAmount?: number;
  category: string;
  status: 'draft' | 'approved' | 'active' | 'closed';
  organizationalUnit?: FinancialOrgUnit | string;
  fundType?: 'General' | 'Zakat' | 'Sadaqah' | 'Corpus' | 'Restricted' | string;
  notes?: string;
  createdByUid: string;
  createdByEmail: string;
  createdByName?: string;
  approvedByUid?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceVoucher {
  id: string;
  voucherNumber: string; // e.g. "FET-VCH-PAY-2026-0001"
  voucherType: 'receipt' | 'payment' | 'journal' | 'contra';
  date: string;
  amount: number;
  paidToOrReceivedFrom: string;
  narration: string;
  transactionId?: string;
  supportingDocUrls?: string[];
  preparedByUid: string;
  preparedByName?: string;
  authorizedByUid?: string;
  authorizedByName?: string;
  status: 'draft' | 'authorized' | 'posted' | 'cancelled';
  createdAt: string;
}

export interface FinanceGrant {
  id: string;
  grantName: string;
  grantorAgencyOrDonor: string;
  sanctionedAmount: number;
  receivedAmount: number;
  disbursedAmount: number;
  fundType: 'Corpus' | 'Restricted' | 'General' | string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'pending';
  termsAndConditionsUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface FinanceAsset {
  id: string;
  assetTag: string; // e.g. "FET-AST-2026-001"
  assetName: string;
  category: 'technology' | 'furniture' | 'vehicle' | 'real_estate' | 'educational_equipment' | 'other';
  purchaseDate: string;
  originalCost: number;
  accumulatedDepreciation?: number;
  currentBookValue: number;
  location: string;
  custodianName?: string;
  status: 'in_service' | 'maintenance' | 'disposed' | 'written_off';
  invoiceDocUrl?: string;
  createdAt: string;
}

export interface FinanceReconciliationRecord {
  id: string;
  accountId: string;
  accountName: string;
  periodStartDate: string;
  periodEndDate: string;
  statementClosingBalance: number;
  ledgerClosingBalance: number;
  differenceAmount: number;
  status: 'in_progress' | 'reconciled' | 'discrepancy_flagged';
  notes?: string;
  reconciledByUid?: string;
  reconciledAt?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// INSTITUTIONAL FEE MANAGEMENT (CHAPTER 15.10 SRS - TASK 6)
// -------------------------------------------------------------
export type FeeCategoryType = 
  | 'admission' 
  | 'tuition' 
  | 'hostel' 
  | 'examination' 
  | 'library' 
  | 'transport' 
  | 'other';

export type FeePaymentStatus = 
  | 'pending' 
  | 'partially_paid' 
  | 'paid' 
  | 'overdue' 
  | 'waived';

export interface StudentFeeRecord {
  id?: string;
  feeCode: string; // e.g. "FET-FEE-2026-0001"
  studentName: string;
  studentId: string; // Roll number or student identifier e.g. "FET-STU-1042"
  studentUid?: string; // Optional linked user profile UID
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  
  institutionType: 'school' | 'madrasa';
  institutionId: string; // e.g. "SCH-01" or "MAD-01"
  institutionName: string; // e.g. "FET Model Academy Srinagar", "Madrasa Fatimyah Al-Zahra"
  
  academicSession: string; // e.g. "AY 2026-2027"
  courseOrGrade: string; // e.g. "Grade 10 - Section A", "Hifz Year 2", "Alim Course"
  
  category: FeeCategoryType;
  categoryLabel?: string; // e.g. "Tuition Fees", "Hostel & Mess"
  description: string; // e.g. "Term 1 Tuition Fee (April - June 2026)"
  
  totalAssessed: number;
  amountPaid: number;
  outstandingAmount: number; // totalAssessed - amountPaid
  dueDate?: string; // YYYY-MM-DD
  
  paymentStatus: FeePaymentStatus;
  paymentDate?: string; // YYYY-MM-DD
  paymentMethod?: 'razorpay' | 'upi' | 'bank_transfer' | 'cash' | 'cheque' | string;
  transactionReference?: string; // Razorpay payment ID (pay_...) or UTR or Cash Voucher
  receiptNumber?: string; // e.g. "FET-FEE-REC-2026-0001"
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  
  // Payment reminders tracking
  remindersSentCount: number;
  lastReminderSentAt?: string;
  
  // Finance ledger cross-link
  financialRecordId?: string; // Linked doc in financial_records
  
  // Audit metadata
  createdByUid: string;
  createdByEmail: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeePaymentPayload {
  paymentAmount: number;
  paymentMethod: 'razorpay' | 'upi' | 'bank_transfer' | 'cash' | 'cheque' | string;
  transactionReference?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentDate?: string;
  notes?: string;
}

// -------------------------------------------------------------
// APP FOUNDATION & SHARED PLATFORM ARCHITECTURE (STEP 65A)
// -------------------------------------------------------------
export type ClientPlatformType = 
  | 'web_browser'
  | 'pwa_standalone'
  | 'android_twa'
  | 'android_native'
  | 'ios_app'
  | 'desktop_app';

export interface DeviceEnvironmentInfo {
  platform: ClientPlatformType;
  isMobileDevice: boolean;
  isStandalonePWA: boolean;
  isOnline: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  supportsTouch: boolean;
  supportsWebShare: boolean;
  supportsPushNotifications: boolean;
  supportsBiometrics: boolean;
  networkType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
}

export type DeepLinkTarget = 
  | 'home'
  | 'programs'
  | 'event'
  | 'crowdfunding'
  | 'exam'
  | 'competition'
  | 'certificate_verify'
  | 'member_verify'
  | 'dashboard'
  | 'profile'
  | 'donate'
  | 'volunteer'
  | 'membership'
  | 'notifications';

export interface ParsedDeepLink {
  target: DeepLinkTarget;
  id?: string;
  slug?: string;
  queryParams?: Record<string, string>;
  rawUrl: string;
}

export interface SharedPushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  deepLinkUrl?: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  data?: Record<string, unknown>;
}

export interface MobileAppSettings {
  appName: string;
  version: string;
  buildNumber: number;
  minSupportedVersion: string;
  forceUpdateRequired: boolean;
  enablePushNotifications: boolean;
  enableBiometricLogin: boolean;
  enableOfflineCache: boolean;
  androidPackageName: string;
  iosBundleId: string;
  supportEmail: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
}

// =============================================================
// EXTERNAL PLATFORM INTEGRATION ARCHITECTURE (RELEASE 2 - TASK 7)
// FET School ERP + FET Madrasa ERP + FET Multilingual Platform
// =============================================================

export type ExternalPlatformKey = 'school_erp' | 'madrasa_erp' | 'multilingual';

export type ExternalPlatformStatus = 'active' | 'maintenance' | 'disabled' | 'unconfigured';

export type ExternalPlatformHealthStatus = 
  | 'connected' 
  | 'disconnected' 
  | 'configuration_missing' 
  | 'auth_failed' 
  | 'service_unavailable';

export type ExternalAuthMethod = 
  | 'signed_token_exchange' 
  | 'oidc_handoff' 
  | 'api_key_proxy' 
  | 'secure_session_redirect';

export interface ExternalPlatformConfig {
  id?: string;
  platformKey: ExternalPlatformKey;
  name: string;
  description: string;
  status: ExternalPlatformStatus;
  healthStatus: ExternalPlatformHealthStatus;
  connectionStatus?: 'connected' | 'not_connected';
  baseUrl?: string;
  ssoEndpoint?: string;
  apiEndpoint?: string;
  allowedModules: string[];
  allowedOperations: string[];
  authMethod: ExternalAuthMethod;
  tenantIsolationEnforced: boolean;
  externalAppId?: string;
  lastHealthCheckAt?: string;
  healthMessage?: string;
  updatedAt: string;
  updatedByUid?: string;
}

export interface SSOHandoffSession {
  id?: string;
  sessionId: string;
  userUid: string;
  userEmail: string;
  userName: string;
  userRole: UserRole | string;
  roles?: string[];
  targetPlatform: ExternalPlatformKey;
  targetTenantId?: string; // School tenant e.g. "SCH-01"
  targetResourceId?: string; // Document, exam material, or student ID
  resourceAccessLevel: 'public' | 'student' | 'admin' | 'restricted_exam';
  returnUrl: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  isUsed?: boolean;
  usedAt?: string;
  signature?: string;
}

export interface MultilingualDocumentReference {
  resourceId: string;
  title: string;
  author?: string;
  category: 'exam_study_material' | 'curriculum_text' | 'quranic_study' | 'general_literature';
  sourcePlatform: 'fet_india';
  targetPlatform: 'fat_multilingual';
  availableLanguages: string[];
  defaultLanguage: string;
  accessLevel: 'public' | 'registered' | 'exam_candidate' | 'institution_only';
  competitionId?: string;
  deepLinkUrl?: string;
}

export interface SchoolTenantContext {
  schoolId: string;
  schoolName: string;
  tenantCode: string;
  userRoleInSchool: 'school_admin' | 'teacher' | 'student' | 'parent' | 'super_admin';
  isAuthorized: boolean;
}

/**
 * FET Store Shopping Cart & Purchase Intent Foundation (Store Task 13)
 * Non-destructive cart state, isolated per user with guest fallback.
 * Strictly decoupled from payment processing / checkout.
 */
export interface StoreCartItem {
  cartItemId: string; // Deterministic: `${productId}_${variantId || 'base'}`
  productId: string;
  productName: string;
  productSlug?: string;
  productType: StoreProductType;
  category: string;
  categoryName?: string;
  imageUrl?: string;
  price: number;
  mrp?: number;
  quantity: number;
  maxQuantity?: number;
  hasVariants?: boolean;
  selectedVariant?: {
    id: string;
    name: string;
    sku?: string;
    price?: number;
    mrp?: number;
    attributes?: Record<string, string>;
  };
  sku?: string;
  isDemo?: boolean;
  paymentMethods?: 'cod' | 'razorpay' | 'both';
  addedAt: string;
  updatedAt: string;
}

export interface StoreCart {
  items: StoreCartItem[];
  totalItems: number;
  subtotal: number;
  currency: 'INR';
  lastUpdated: string;
}

export interface CartValidationResult {
  isValid: boolean;
  reason?: string;
  adjustedQuantity?: number;
}

/**
 * ============================================================================
 * FET Store Checkout Preparation & Order Foundation (Store Task 14)
 * ============================================================================
 * Foundation data models for protected order capture, authoritative validation,
 * customer information collection, and Store Manager / Super Admin review.
 * Strictly decoupled from payment capture and courier integrations.
 */

export type StoreOrderStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type StorePaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'waived_scholarship'
  | 'free';

export interface StoreCustomerInfo {
  fullName: string;
  mobileNumber: string;
  email: string;
  userUid?: string;
  membershipId?: string;
  isRegisteredUser?: boolean;
}

export interface StoreAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
}

export interface StoreOrderItem {
  productId: string;
  productName: string;
  productSlug?: string;
  productType: StoreProductType;
  category: string;
  categoryName?: string;
  sku?: string;
  imageUrl?: string;
  hasVariants?: boolean;
  variantId?: string;
  variantName?: string;
  variantAttributes?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  unitMrp?: number;
  itemTotal: number;
  isDigital?: boolean;
  isDemo?: boolean;
  paymentMethods?: 'cod' | 'razorpay' | 'both';
}

export interface StoreOrder {
  id: string; // e.g. "FET-ORD-2026-0001" or Firestore Doc ID
  orderNumber: string;
  userId: string;
  customer: StoreCustomerInfo;
  items: StoreOrderItem[];
  itemCount: number;
  subtotal: number;
  shippingAmount: number; // Placeholder: ₹0 for Task 14
  taxAmount: number; // Placeholder: ₹0 for Task 14
  total: number;
  currency: 'INR';
  orderStatus: StoreOrderStatus;
  paymentStatus: StorePaymentStatus;
  paymentMethod?: 'COD' | 'razorpay' | string;
  paymentMethodLabel?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paidAt?: string;
  billingAddress: StoreAddress;
  shippingAddress: StoreAddress;
  sameAsBilling?: boolean;
  notes?: string;
  deliveryNotes?: string;
  educationalInstitutionalOrder?: boolean;
  institutionName?: string;
  scholarshipRollNumber?: string;
  source: 'web_store' | 'pwa' | 'admin_desk';
  authoritativeValidationCompleted: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  statusHistory?: {
    status: StoreOrderStatus;
    timestamp: string;
    changedByUid?: string;
    note?: string;
  }[];
}

export interface StoreOrderValidationRequest {
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  customer: StoreCustomerInfo;
  billingAddress: StoreAddress;
  shippingAddress: StoreAddress;
  notes?: string;
  deliveryNotes?: string;
  educationalInstitutionalOrder?: boolean;
  institutionName?: string;
  paymentMethod?: 'COD' | 'razorpay' | string;
}

export interface StoreOrderValidationResponse {
  isValid: boolean;
  errors?: string[];
  validatedItems: StoreOrderItem[];
  subtotal: number;
  shippingAmount: number;
  total: number;
  currency: 'INR';
  allowedPaymentMethods?: ('COD' | 'razorpay' | 'free')[];
  isFreeOrder?: boolean;
  hasPaymentMethodConflict?: boolean;
  paymentMethodConflictReason?: string;
}



