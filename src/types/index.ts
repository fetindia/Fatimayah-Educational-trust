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
  | 'school_admin'
  | 'madrasa_admin'
  | 'finance_admin'
  | 'hr_admin'
  | 'content_admin'
  | 'blog_admin'
  | 'store_admin'
  | 'travel_admin'
  | 'reports_admin'
  | 'student';

export type AppPermission =
  | 'users.view'
  | 'users.manage'
  | 'roles.manage'
  | 'volunteers.manage'
  | 'donors.manage'
  | 'members.manage'
  | 'modules.manage'
  | 'settings.manage'
  | 'finance.manage';

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
}

export interface OrgConfig {
  // Protected Legal Property (Locked; cannot be changed via dynamic CMS)
  readonly legalName: 'Fatimyah Educational Trust';
  
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
  registrationNumber: string;
  nitiAayogId?: string;
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
  bankDetails?: {
    accountBeneficiary?: string;
    bankName?: string;
    branch?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };

  updatedAt: string;
  updatedBy: string;
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
  | 'staff';

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
  module?: 'membership' | 'volunteer' | 'donor' | 'account' | 'system' | 'donations' | 'applications' | 'campaigns' | 'competitions' | 'exams' | 'certificates' | 'general';
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

export interface StoreProduct {
  id: string;
  name: string;
  category: 'Garments' | 'Islamic Garments' | 'Perfumes' | 'Books' | 'Merchandise';
  subCategory?: string;
  price: number;
  mrp?: number;
  stockCount: number;
  sku: string;
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'DRAFT';
  description: string;
  imageUrl?: string;
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
  | 'completed';

export type ExamLanguage = 'en' | 'ur' | 'hi' | 'ar' | 'fa';

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
  examDetails?: ExamStructureDetails;
  prizesSummary?: string[];
  prizeRewards?: CompetitionPrizeTier[];

  // Status & Governance
  status: CompetitionStatus;
  isPublished: boolean;
  resultsApprovedAt?: string;
  resultsApprovedByUid?: string;
  resultsApprovedByEmail?: string;
  resultsPublishedAt?: string;
  resultsPublishedByUid?: string;

  // Metadata
  createdByUid: string;
  createdByEmail: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
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
  status: 'registered' | 'attended' | 'absent' | 'disqualified' | 'evaluated' | 'completed';
  
  // Aliases and Extended Fields
  registrationNumber?: string;
  candidateName?: string;
  candidateEmail?: string;
  parentEmail?: string;
  timeTakenMinutes?: number;
  evaluationFeedback?: string;
  violations?: CandidateViolationRecord[];

  // Online Exam Attempt Status
  examAttemptStatus?: 'not_started' | 'in_progress' | 'submitted' | 'evaluated';
  examStartedAt?: string;
  examSubmittedAt?: string;
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

  // Result & Certificate
  isResultPublished?: boolean;
  certificateIssued?: boolean;
  certificateId?: string; // "FET-CERT-CMP-2026-0101"
  certificateIssuedAt?: string;
  updatedAt?: string;
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
  | 'event_competition_fee'
  | 'school_fee'
  | 'madrasa_contribution'
  | 'corpus_grant'
  | 'other_income';

export type FinancialExpenseCategory =
  | 'education_scholarships'
  | 'staff_salaries'
  | 'community_relief'
  | 'events_competitions'
  | 'office_administration'
  | 'campaign_disbursement'
  | 'utilities_maintenance'
  | 'statutory_compliance'
  | 'other_expense';

export type ExpenseApprovalStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'paid'
  | 'rejected'
  | 'cancelled';

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
  
  // Creation metadata
  createdByUid: string;
  createdByEmail: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;

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


