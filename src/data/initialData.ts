/**
 * @license
 * Initial Master Data & 27-Chapter Master SRS Architecture
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Public Brand: FET India
 * Tagline: Education • Service • Empowerment
 * Website: FETIndia.com
 */

import { OrgConfig, ModuleChapter, NavigationMenuItem } from '../types';

export const DEFAULT_NAV_MENU: NavigationMenuItem[] = [
  {
    id: 'nav-home',
    label: 'Home',
    target: 'home',
    isEnabled: true,
    order: 1
  },
  {
    id: 'nav-about',
    label: 'About Trust',
    target: 'mission_cta',
    isEnabled: true,
    order: 2,
    subItems: [
      { id: 'sub-about-trust', label: 'Trust History & Vision', target: 'mission_cta', isEnabled: true },
      { id: 'sub-about-gov', label: 'Leadership & Governance', target: 'mission_cta', isEnabled: true },
      { id: 'sub-about-stats', label: 'Impact & Transparency', target: 'statistics', isEnabled: true }
    ]
  },
  {
    id: 'nav-programs',
    label: 'Programs & Welfare',
    target: 'programs',
    isEnabled: true,
    order: 3,
    subItems: [
      { id: 'sub-prog-flagship', label: 'Flagship Educational Initiatives', target: 'programs', isEnabled: true },
      { id: 'sub-prog-exam', label: 'Talent Search & Exam System', target: 'education', isEnabled: true },
      { id: 'sub-prog-scholarships', label: 'Higher Education Grants', target: 'programs', isEnabled: true }
    ]
  },
  {
    id: 'nav-crowdfunding',
    label: 'Appeals (80G)',
    target: 'crowdfunding',
    isEnabled: true,
    order: 4,
    badge: 'Tax Free'
  },
  {
    id: 'nav-membership',
    label: 'Membership',
    target: 'volunteer_membership',
    isEnabled: true,
    order: 5,
    subItems: [
      { id: 'sub-mem-apply', label: 'Apply for Membership', target: 'volunteer_membership', isEnabled: true },
      { id: 'sub-mem-core', label: 'Core Member Accreditation', target: 'volunteer_membership', isEnabled: true }
    ]
  },
  {
    id: 'nav-volunteer',
    label: 'Volunteer',
    target: 'volunteer_membership',
    isEnabled: true,
    order: 6
  },
  {
    id: 'nav-events',
    label: 'Events & News',
    target: 'events_blog',
    isEnabled: true,
    order: 7
  },
  {
    id: 'nav-contact',
    label: 'Contact',
    target: 'mission_cta',
    isEnabled: true,
    order: 8
  }
];

export const DEFAULT_ORG_CONFIG: OrgConfig = {
  legalName: 'Fatimyah Educational Trust',
  displayName: 'Fatimyah Educational Trust India',
  shortBrand: 'FET India',
  tagline: 'Education • Service • Empowerment',
  websiteUrl: 'FETIndia.com',
  
  contactEmail: 'contact@fetindia.com',
  contactPhone: '+91 22 2876 5432',
  emergencyHotline: '+91 98200 12345',
  headOfficeAddress: 'Fatimyah Educational Complex, Central Secretariat, Mumbai, Maharashtra 400001, India',
  registrationNumber: 'E-19842 / Bombay Public Trust Act 1950',
  nitiAayogId: 'MH/2021/028914',
  fcraNumber: 'FCRA-083780912',
  section12ANumber: 'AAATF1234AE20214',
  section80GNumber: 'AAATF1234AF20216',

  // Navigation Menu
  navigationMenu: DEFAULT_NAV_MENU,

  // 3 Primary Logo Colors
  primaryGreen: '#0D6E42', // Deep Islamic Emerald Green
  primaryBlue: '#0B2545',  // Royal Navy Sapphire
  accentAmber: '#D97706',  // Sun Gold Amber

  homepageSectionsOrdering: [
    'hero',
    'crowdfunding',
    'programs',
    'education',
    'statistics',
    'volunteer_membership',
    'events_blog',
    'future_services',
    'mission_cta'
  ],
  homepageSectionsVisibility: {
    hero: true,
    crowdfunding: true,
    programs: true,
    education: true,
    statistics: true,
    volunteer_membership: true,
    events_blog: true,
    future_services: true,
    mission_cta: true
  },

  headerSettings: {
    showLegalName: true,
    showRegNumber: true,
    showPhone: true,
    showEmail: true,
    showTaxExemptionTag: true,
    showNitiAayogTag: true,
    showTagline: true
  },

  footerSettings: {
    aboutSummary: 'Fatimyah Educational Trust is a registered public charitable and educational trust established in 1994, dedicated to educational empowerment, grassroots welfare, and transparent community stewardship.',
    copyrightText: 'Fatimyah Educational Trust. All rights reserved.',
    showLegalShield: true,
    showSocialLinks: true,
    showChapterRoadmap: true,
    showGovernanceLinks: true
  },

  logoUrl: '',
  faviconUrl: '',
  appIconUrl: '',

  announcementBarText: 'FET India Admissions & Higher Education Scholarships Open for Academic Year 2026-27 • 80G Tax Exemption Available on All Contributions',
  announcementBarLink: '#programs',
  announcementBarBadge: 'Admissions Open 2026-27',
  isAnnouncementBarActive: true,

  socialLinks: {
    facebook: 'https://facebook.com/FETIndiaOfficial',
    twitter: 'https://twitter.com/FETIndia',
    instagram: 'https://instagram.com/FETIndia',
    youtube: 'https://youtube.com/@FETIndia',
    linkedin: 'https://linkedin.com/company/fatimyah-educational-trust',
    telegram: 'https://t.me/FETIndiaUpdates',
    whatsappCommunity: 'https://chat.whatsapp.com/FETIndiaCommunity'
  },

  heroSliders: [
    {
      id: 'slide-1',
      title: 'Empowering Communities Through Quality Education',
      subtitle: 'Building an enlightened and dignified future through sustainable academic institutions, scholarships, and skill development programs across India.',
      ctaText: 'Donate with 80G Tax Benefit',
      ctaLink: '#donate',
      secondaryCtaText: 'Apply for Scholarship',
      secondaryCtaLink: '#scholarships',
      badgeText: 'Official Trust Digital Portal',
      isActive: true
    },
    {
      id: 'slide-2',
      title: 'Dignified Community Service & Transparent Governance',
      subtitle: 'Backed by 30+ years of institutional service, 100% statutory transparency, Section 80G/12A tax exemption, and verified audit reporting.',
      ctaText: 'Explore Trust Governance',
      ctaLink: '#governance',
      secondaryCtaText: 'Volunteer With Us',
      secondaryCtaLink: '#volunteer',
      badgeText: 'Registered Public Charity',
      isActive: true
    },
    {
      id: 'slide-3',
      title: 'Holistic Welfare, Health Camps & Relief Drives',
      subtitle: 'Providing emergency assistance, free medical diagnosis, diagnostic clinics, and ration distribution to underprivileged families nationwide.',
      ctaText: 'Our Initiatives & Programs',
      ctaLink: '#programs',
      secondaryCtaText: 'Join Volunteer Network',
      secondaryCtaLink: '#volunteer',
      badgeText: 'Active Field Operations',
      isActive: true
    }
  ],

  establishedYear: 1994,
  totalInstitutions: 14,
  totalStudentsBenefited: 42500,
  activeVolunteersCount: 1850,
  activeDonorsCount: 3400,

  bankDetails: {
    accountBeneficiary: 'Fatimyah Educational Trust',
    bankName: 'State Bank of India',
    branch: 'Mumbai Main Branch',
    accountNumber: '389402019482',
    ifscCode: 'SBIN0000300',
    upiId: 'fetindia@sbi'
  },

  updatedAt: new Date().toISOString(),
  updatedBy: 'System Bootstrap'
};

export const MASTER_27_MODULES: ModuleChapter[] = [
  // 1. Membership Management
  {
    id: 'mod-1',
    code: 'MOD_MEMBERSHIP_MGMT',
    chapterNumber: 1,
    series: 1,
    name: 'Membership Management',
    category: 'Community & Services',
    description: 'Digital trust membership enrollment, KYC verification, digital ID card issuance, and membership directory.',
    technicalScope: 'Unique Member ID generation, membership lifecycle transitions, Member Admin approval desk.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'member_admin',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'Users',
    routePath: '/portal/membership',
    features: ['Digital Membership Card', 'Application & Renewal Portal', 'Member Admin Approval Queue', 'Membership Tiers (Patron, Life, Associate, Student)'],
    updatedAt: new Date().toISOString()
  },
  // 2. Crowdfunding & Donations
  {
    id: 'mod-2',
    code: 'MOD_CROWDFUNDING_DONATIONS',
    chapterNumber: 2,
    series: 1,
    name: 'Crowdfunding & Donations',
    category: 'Community & Services',
    description: 'Online donation gateway, 80G tax exemption receipts, Zakat & Sadaqah allocation, and emergency welfare campaigns.',
    technicalScope: 'Payment gateway integration, Section 80G certificate auto-generator, Crowdfunding Admin campaigns ledger.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'donor_admin',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'BadgeDollarSign',
    routePath: '/portal/donations',
    features: ['Instant 80G Tax Exemption Receipts', 'Zakat & Sadaqah Specific Allocation', 'Crowdfunding Campaigns Engine', 'Donor Admin Reconciliation'],
    updatedAt: new Date().toISOString()
  },
  // 3. Volunteer & Community Management
  {
    id: 'mod-3',
    code: 'MOD_VOLUNTEER_COMMUNITY',
    chapterNumber: 3,
    series: 1,
    name: 'Volunteer & Community Management',
    category: 'Community & Services',
    description: 'Volunteer onboarding, skill indexing, field mission assignments, service hour logbook, and verification.',
    technicalScope: 'Volunteer skill registry, service hours logger, Volunteer Admin mission dispatcher.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'volunteer_admin',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'HeartHandshake',
    routePath: '/portal/volunteers',
    features: ['Volunteer Registration & Badges', 'Field Mission Assignment', 'Service Hours Logbook & Approval', 'Volunteer Certificate Generator'],
    updatedAt: new Date().toISOString()
  },
  // 4. Competition, Examination & Certification
  {
    id: 'mod-4',
    code: 'MOD_EXAM_CERTIFICATION',
    chapterNumber: 4,
    series: 2,
    name: 'Competition, Examination & Certification',
    category: 'Education & Welfare',
    description: 'Talent search competitions, online examinations, automated hall ticket issuance, evaluation, and certified result publishing.',
    technicalScope: 'Online assessment engine, roll number allocation, Exam Admin evaluation desk, digital certificate issuing.',
    lifecycle: 'READY',
    requiredRole: 'exam_admin',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'Award',
    routePath: '/programs/exams',
    features: ['Talent Search Competitions', 'Hall Ticket Generation', 'Examination Admin Grading', 'Digital Certificate Verification'],
    updatedAt: new Date().toISOString()
  },
  // 5. School ERP
  {
    id: 'mod-5',
    code: 'MOD_SCHOOL_ERP',
    chapterNumber: 5,
    series: 2,
    name: 'School ERP',
    category: 'Education & Welfare',
    description: 'Comprehensive academic administration for trust schools: student admissions, fee tracking, attendance, and faculty schedules.',
    technicalScope: 'School ERP data model, student enrollment pipeline, School Admin management console.',
    lifecycle: 'READY',
    requiredRole: 'school_admin',
    isPubliclyVisible: false,
    enabledInApp: true,
    iconName: 'GraduationCap',
    routePath: '/erp/school',
    features: ['Student Admissions & Rosters', 'Academic Calendar & Timetable', 'Fee Concession & Tracking', 'School Admin Dashboard'],
    updatedAt: new Date().toISOString()
  },
  // 6. Madrasa ERP
  {
    id: 'mod-6',
    code: 'MOD_MADRASA_ERP',
    chapterNumber: 6,
    series: 2,
    name: 'Madrasa ERP',
    category: 'Education & Welfare',
    description: 'Specialized management for affiliated madrasas: Hifz & Tajweed tracking, Alim course records, boarding attendance, and ethical curricula.',
    technicalScope: 'Madrasa curriculum tracker, student progress ledger, Madrasa Admin oversight portal.',
    lifecycle: 'READY',
    requiredRole: 'madrasa_admin',
    isPubliclyVisible: false,
    enabledInApp: true,
    iconName: 'BookOpen',
    routePath: '/erp/madrasa',
    features: ['Hifz & Tajweed Progress Logs', 'Boarding & Attendance Tracking', 'Islamic Ethics Curriculum', 'Madrasa Admin Console'],
    updatedAt: new Date().toISOString()
  },
  // 7. Finance & Accounting
  {
    id: 'mod-7',
    code: 'MOD_FINANCE_ACCOUNTING',
    chapterNumber: 7,
    series: 2,
    name: 'Finance & Accounting',
    category: 'Governance & Core',
    description: 'Double-entry trust ledger, expense authorizations, bank reconciliations, and statutory audit readiness.',
    technicalScope: 'Financial ledger collections, expense voucher workflow, Finance Admin reporting tools.',
    lifecycle: 'READY',
    requiredRole: 'finance_admin',
    isPubliclyVisible: false,
    enabledInApp: false,
    iconName: 'Landmark',
    routePath: '/admin/finance',
    features: ['Trust Income/Expense Ledgers', '80G & 12A Compliance Audits', 'Budget Allocation by Department', 'Finance Admin Reconciliation'],
    updatedAt: new Date().toISOString()
  },
  // 8. HRMS
  {
    id: 'mod-8',
    code: 'MOD_HRMS',
    chapterNumber: 8,
    series: 2,
    name: 'HRMS (Human Resource Management)',
    category: 'Governance & Core',
    description: 'Trust employee directory, educator payroll, biometric/digital attendance, leave management, and staff recruitment.',
    technicalScope: 'Staff profiles, payroll computation engine, HR Admin management portal.',
    lifecycle: 'READY',
    requiredRole: 'hr_admin',
    isPubliclyVisible: false,
    enabledInApp: false,
    iconName: 'UserCog',
    routePath: '/admin/hrms',
    features: ['Trust Staff & Teacher Directory', 'Payroll & Honorarium Disbursals', 'Leave Application Workflow', 'HR Administrator Management'],
    updatedAt: new Date().toISOString()
  },
  // 9. Notifications & Communication
  {
    id: 'mod-9',
    code: 'MOD_NOTIFICATIONS_COMM',
    chapterNumber: 9,
    series: 1,
    name: 'Notifications & Communication',
    category: 'Governance & Core',
    description: 'Multi-channel broadcast alerts, role-targeted announcements, SMS/Email dispatches, and in-app notification trays.',
    technicalScope: 'Real-time Firestore listeners, notification queue, targeted role dispatchers.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'public',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'BellRing',
    routePath: '/notifications',
    features: ['Global & Targeted Broadcasts', 'Priority Alert Banners', 'In-App Notification Tray', 'SMS/WhatsApp Dispatch Gateway'],
    updatedAt: new Date().toISOString()
  },
  // 10. Reports & Analytics
  {
    id: 'mod-10',
    code: 'MOD_REPORTS_ANALYTICS',
    chapterNumber: 10,
    series: 2,
    name: 'Reports & Analytics',
    category: 'Governance & Core',
    description: 'Interactive analytics, district-wise scholarship distribution charts, expenditure transparency, and statutory filing exports.',
    technicalScope: 'Aggregated analytics pipeline, visual chart components, Reports Admin export tools.',
    lifecycle: 'READY',
    requiredRole: 'reports_admin',
    isPubliclyVisible: false,
    enabledInApp: true,
    iconName: 'LineChart',
    routePath: '/admin/reports',
    features: ['District-wise Impact Metrics', 'Scholarship Disbursement Analytics', 'Donor Contribution Breakdown', 'Audit & Compliance Reports'],
    updatedAt: new Date().toISOString()
  },
  // 11. Mobile Application
  {
    id: 'mod-11',
    code: 'MOD_MOBILE_APP_FOUNDATION',
    chapterNumber: 11,
    series: 3,
    name: 'Mobile Application Unified Architecture',
    category: 'Enterprise & Future',
    description: 'Unified cross-platform client architecture allowing future iOS and Android mobile apps to use the exact same Firebase backend.',
    technicalScope: 'Firebase SDK shared schema, FCM push notification integration, offline sync contract.',
    lifecycle: 'TESTING',
    requiredRole: 'super_admin',
    isPubliclyVisible: false,
    enabledInApp: true,
    iconName: 'Smartphone',
    routePath: '/admin/mobile-api',
    features: ['Single Firebase Backend Sync', 'FCM Push Notifications Engine', 'Offline Cache Protocol', 'Mobile Version Controller'],
    updatedAt: new Date().toISOString()
  },
  // 12. API & Integrations
  {
    id: 'mod-12',
    code: 'MOD_API_INTEGRATIONS',
    chapterNumber: 12,
    series: 3,
    name: 'API & Integrations Gateway',
    category: 'Enterprise & Future',
    description: 'Secure REST and Cloud Function endpoints for third-party payment gateways, SMS gateways, and government portal verifications.',
    technicalScope: 'API token manager, rate limiting, webhook receiver endpoints.',
    lifecycle: 'TESTING',
    requiredRole: 'super_admin',
    isPubliclyVisible: false,
    enabledInApp: false,
    iconName: 'Boxes',
    routePath: '/admin/api',
    features: ['Payment Gateway Webhooks', 'SMS / WhatsApp API Connector', 'DigiLocker / Aadhaar Verification Stubs', 'API Key Management'],
    updatedAt: new Date().toISOString()
  },
  // 13. Firebase Backend
  {
    id: 'mod-13',
    code: 'MOD_FIREBASE_BACKEND',
    chapterNumber: 13,
    series: 1,
    name: 'Firebase Backend Core Infrastructure',
    category: 'Governance & Core',
    description: 'Cloud Firestore database, Firebase Authentication, Cloud Storage rules, and tamper-proof audit trails.',
    technicalScope: 'Firestore collections, granular security rules, atomic transactions, automatic timestamping.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'super_admin',
    isPubliclyVisible: false,
    enabledInApp: true,
    iconName: 'Database',
    routePath: '/admin/database',
    features: ['Cloud Firestore Multi-collection DB', 'Firebase Authentication Engine', 'Granular Security Rules', 'Tamper-Proof Audit Logging'],
    updatedAt: new Date().toISOString()
  },
  // 14. FET Store (Architected now, DISABLED until launch)
  {
    id: 'mod-14',
    code: 'MOD_FET_STORE',
    chapterNumber: 14,
    series: 3,
    name: 'Official FET Store & Merchandise',
    category: 'Enterprise & Future',
    description: 'Ethical commerce supporting trust welfare missions: Garments, Islamic Garments, Perfumes (Attars), Books, and Merchandise.',
    technicalScope: 'Product catalog schema, category taxonomy, inventory ledger, Store Admin order fulfillment.',
    lifecycle: 'DISABLED', // Safely stored, disabled until official launch
    requiredRole: 'store_admin',
    isPubliclyVisible: false,
    enabledInApp: false,
    iconName: 'ShoppingBag',
    routePath: '/store',
    subCategories: ['Garments', 'Islamic Garments', 'Perfumes', 'Books', 'Merchandise'],
    features: [
      'Garments (Modest wear & daily essentials)',
      'Islamic Garments (Abayas, Thobes, Hijabs, Kurtas, Prayer caps)',
      'Non-alcoholic Perfumes & Traditional Attars',
      'Islamic & Academic Books Library',
      'Store Admin Inventory & Order Management',
      '100% Proceeds Donated to Educational Endowment'
    ],
    updatedAt: new Date().toISOString()
  },
  // 15. FET Travel (Architected now, DISABLED until launch)
  {
    id: 'mod-15',
    code: 'MOD_FET_TRAVEL',
    chapterNumber: 15,
    series: 3,
    name: 'FET Travel & Pilgrimage Services',
    category: 'Enterprise & Future',
    description: 'Facilitating organized, dignified pilgrimage journeys: initially focusing on Umrah and Ziyarat, extensible to future destinations.',
    technicalScope: 'Travel package schema, pilgrim booking registry, Travel Admin manifest and visa workflow.',
    lifecycle: 'DISABLED', // Safely stored, disabled until official launch
    requiredRole: 'travel_admin',
    isPubliclyVisible: false,
    enabledInApp: false,
    iconName: 'Plane',
    routePath: '/travel',
    subCategories: ['Umrah Packages', 'Ziyarat Packages', 'Educational Tours'],
    features: [
      'Umrah Group Packages & Guided Itineraries',
      'Ziyarat Holy Site Tours (Iraq, Iran, Saudi Arabia)',
      'Pilgrim Passenger Registry & Visa Assistance',
      'Travel Administrator Booking Console',
      'Extensible Destination Architecture'
    ],
    updatedAt: new Date().toISOString()
  },
  // 16. Core Platform & User Profiles (Auth & KYC)
  {
    id: 'mod-16',
    code: 'MOD_CORE_USERS_KYC',
    chapterNumber: 16,
    series: 1,
    name: 'Core Platform & User Profiles',
    category: 'Governance & Core',
    description: 'Centralized authentication, secure token persistence, profile identity cards, KYC state, and multi-device sync.',
    technicalScope: 'Firebase Auth integration, user document binding, session state management.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'public',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'UserCheck',
    routePath: '/portal/profile',
    features: ['Email/Password & Google Authentication', 'Digital Profile & Identity Card', 'KYC & Verification State', 'Account Security'],
    updatedAt: new Date().toISOString()
  },
  // 17. Role & Permission Governance (RBAC)
  {
    id: 'mod-17',
    code: 'MOD_RBAC_GOVERNANCE',
    chapterNumber: 17,
    series: 1,
    name: 'Role & Permission Governance (RBAC)',
    category: 'Governance & Core',
    description: 'Hierarchical role assignment for Super Admin and 13 specialized role administrators with granular permissions.',
    technicalScope: 'Permission verification matrix, security rules sync, dynamic role delegation.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'super_admin',
    isPubliclyVisible: false,
    enabledInApp: true,
    iconName: 'ShieldAlert',
    routePath: '/admin/roles',
    features: ['Super Admin Sovereign Controls', '13 Specialized Role Admin Scopes', 'Multi-role Stacking', 'Privilege Elevation Guards'],
    updatedAt: new Date().toISOString()
  },
  // 18. Dynamic Branding & CMS Engine
  {
    id: 'mod-18',
    code: 'MOD_DYNAMIC_CMS',
    chapterNumber: 18,
    series: 1,
    name: 'Dynamic Branding & CMS Engine',
    category: 'Governance & Core',
    description: 'Customizable public brand name, tagline, 3-color theme palette, hero sliders, while strictly protecting legal trust entity name.',
    technicalScope: 'Dynamic theme injection, Firestore config binding, protected schema validator.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'super_admin',
    isPubliclyVisible: false,
    enabledInApp: true,
    iconName: 'Palette',
    routePath: '/admin/cms',
    features: ['Public Brand & Tagline Editor', 'Hero Slide Content Manager', '3 Primary Logo Color Customizer', 'Protected Legal Name Lock'],
    updatedAt: new Date().toISOString()
  },
  // 19. System Audit & Activity Logs
  {
    id: 'mod-19',
    code: 'MOD_AUDIT_LOGS',
    chapterNumber: 19,
    series: 1,
    name: 'System Audit & Activity Logs',
    category: 'Governance & Core',
    description: 'Immutable, tamper-proof tracking of all administrative modifications, logins, and module status changes.',
    technicalScope: 'Append-only Firestore collections, actor metadata logging, JSON diff tracking.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'super_admin',
    isPubliclyVisible: false,
    enabledInApp: true,
    iconName: 'FileText',
    routePath: '/admin/audit',
    features: ['Immutable Security Log', 'Actor/Action/Target Filtering', 'Payload Inspector', 'Export Audit Trail'],
    updatedAt: new Date().toISOString()
  },
  // 20. Public Portal & Institutional Showcase
  {
    id: 'mod-20',
    code: 'MOD_PUBLIC_PORTAL',
    chapterNumber: 20,
    series: 1,
    name: 'Public Portal & Institutional Showcase',
    category: 'Governance & Core',
    description: 'High-performance responsive public interface presenting the mission, pillars, and impact of Fatimyah Educational Trust.',
    technicalScope: 'Tailwind CSS styling, dynamic theme binding, responsive mobile-first presentation.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'public',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'Globe',
    routePath: '/',
    features: ['Trust Mission & 3 Pillars', 'Real-time Impact Counters', 'Dynamic Hero Sliders', 'Official Secretariat Directory'],
    updatedAt: new Date().toISOString()
  },
  // 21. Scholarship & Educational Grant Management
  {
    id: 'mod-21',
    code: 'MOD_SCHOLARSHIP_MGMT',
    chapterNumber: 21,
    series: 2,
    name: 'Scholarship & Educational Grant Management',
    category: 'Education & Welfare',
    description: 'Online merit-cum-means scholarship applications, document scrutiny, income verification, and grant disbursement tracking.',
    technicalScope: 'Multi-stage approval pipeline, financial assistance matrix, review desk.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'public',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'GraduationCap',
    routePath: '/programs/scholarships',
    features: ['Online Scholarship Application', 'Income & Marksheet Verification', 'Scrutiny & Sanction Pipeline', 'Disbursement Ledger'],
    updatedAt: new Date().toISOString()
  },
  // 22. Learning Resources & Curriculum LMS
  {
    id: 'mod-22',
    code: 'MOD_CURRICULUM_LMS',
    chapterNumber: 22,
    series: 2,
    name: 'Learning Resources & Curriculum LMS',
    category: 'Education & Welfare',
    description: 'Digital repository of Islamic ethics, STEM curricula, teacher training guides, and open educational resources.',
    technicalScope: 'Cloud storage asset linking, indexed PDF viewer, subject syllabus distribution.',
    lifecycle: 'READY',
    requiredRole: 'public',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'BookOpenCheck',
    routePath: '/programs/resources',
    features: ['Digital Syllabus Library', 'Teacher Training Manuals', 'Video Lecture Index', 'Free PDF Downloads'],
    updatedAt: new Date().toISOString()
  },
  // 23. Career Mentorship & Skill Development
  {
    id: 'mod-23',
    code: 'MOD_CAREER_MENTORSHIP',
    chapterNumber: 23,
    series: 2,
    name: 'Career Mentorship & Skill Development',
    category: 'Education & Welfare',
    description: 'Connecting underprivileged students with professional mentors in civil services, medicine, engineering, and IT.',
    technicalScope: 'Mentor-mentee matching schema, booking calendar, session tracking.',
    lifecycle: 'READY',
    requiredRole: 'public',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'Compass',
    routePath: '/programs/mentorship',
    features: ['Mentor Directory', '1-on-1 Guidance Sessions', 'Civil Services Coaching Portal', 'Skill Workshops'],
    updatedAt: new Date().toISOString()
  },
  // 24. Community Welfare & Relief Programs
  {
    id: 'mod-24',
    code: 'MOD_WELFARE_RELIEF',
    chapterNumber: 24,
    series: 2,
    name: 'Community Welfare & Relief Programs',
    category: 'Education & Welfare',
    description: 'Emergency disaster response, ration kit distribution, and widow & orphan financial sustenance programs.',
    technicalScope: 'Relief request intake form, beneficiary identity registry, inventory tracking.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'public',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'ShieldPlus',
    routePath: '/programs/welfare',
    features: ['Disaster Relief Coordination', 'Ration Kit Distribution', 'Orphan Care Sponsorship', 'Emergency Aid Intake'],
    updatedAt: new Date().toISOString()
  },
  // 25. Healthcare Camps & Medical Assistance
  {
    id: 'mod-25',
    code: 'MOD_HEALTH_CAMPS',
    chapterNumber: 25,
    series: 2,
    name: 'Healthcare Camps & Medical Assistance',
    category: 'Education & Welfare',
    description: 'Free medical diagnosis camps, optical checkups, dialysis subsidies, and emergency blood donor network.',
    technicalScope: 'Camp scheduling, blood donor registry with blood group query filter, hospital subsidy approvals.',
    lifecycle: 'PUBLISHED',
    requiredRole: 'public',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'Stethoscope',
    routePath: '/programs/health',
    features: ['Medical Camp Schedules', 'Blood Donor Directory', 'Medical Aid Grants', 'Diagnostic Checkups'],
    updatedAt: new Date().toISOString()
  },
  // 26. Grievance & Feedback Redressal
  {
    id: 'mod-26',
    code: 'MOD_GRIEVANCE_REDRESSAL',
    chapterNumber: 26,
    series: 1,
    name: 'Grievance & Feedback Redressal',
    category: 'Governance & Core',
    description: 'Confidential complaint submission, tracking ticket number, and ombudsman review workflow.',
    technicalScope: 'Encrypted grievance ticket queue, SLA resolution timer, ombudsman response panel.',
    lifecycle: 'READY',
    requiredRole: 'super_admin',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'MessageSquareWarning',
    routePath: '/governance/grievances',
    features: ['Anonymous Grievance Filing', 'Ticket Tracking Number', 'Super Admin Oversight', 'SLA Escalation'],
    updatedAt: new Date().toISOString()
  },
  // 27. Document Verification & Certificate Validator
  {
    id: 'mod-27',
    code: 'MOD_CERTIFICATE_VERIFIER',
    chapterNumber: 27,
    series: 3,
    name: 'Document Verification & Certificate Validator',
    category: 'Enterprise & Future',
    description: 'Cryptographic public validation for FET issued course certificates, diplomas, and scholarship sanction letters.',
    technicalScope: 'SHA-256 certificate hashing, instant QR camera scanning, public verification endpoint.',
    lifecycle: 'READY',
    requiredRole: 'public',
    isPubliclyVisible: true,
    enabledInApp: true,
    iconName: 'FileCheck2',
    routePath: '/verify',
    features: ['Instant QR Certificate Lookup', 'Cryptographic Verification', 'Sanction Letter Validator', 'Fraud Prevention Registry'],
    updatedAt: new Date().toISOString()
  }
];

export const ADMIN_ROLE_DEFINITIONS: Record<string, { label: string; description: string; badgeColor: string }> = {
  super_admin: {
    label: 'Super Administrator',
    description: 'Full sovereign access across all modules, CMS, branding, module activation, security rules, and user role management.',
    badgeColor: 'bg-emerald-900 text-emerald-100 border-emerald-700'
  },
  administrator: {
    label: 'Platform Administrator',
    description: 'Authorized administrator managing operations, users, module parameters, and platform communications.',
    badgeColor: 'bg-indigo-900 text-indigo-100 border-indigo-700'
  },
  core_member: {
    label: 'Core Member',
    description: 'Elected or appointed governance core member approved by the Trust Administration.',
    badgeColor: 'bg-purple-900 text-purple-100 border-purple-700'
  },
  volunteer_admin: {
    label: 'Volunteer Administrator',
    description: 'Oversees volunteer registration, verification, field mission dispatch, and service hour approvals.',
    badgeColor: 'bg-cyan-900 text-cyan-100 border-cyan-700'
  },
  member_admin: {
    label: 'Member Administrator',
    description: 'Manages official trust memberships, KYC verification, card renewals, and member directory.',
    badgeColor: 'bg-indigo-900 text-indigo-100 border-indigo-700'
  },
  donor_admin: {
    label: 'Donor Administrator',
    description: 'Reconciles contributions, verifies transactions, issues Section 80G tax exemption certificates, and manages fund allocations.',
    badgeColor: 'bg-amber-900 text-amber-100 border-amber-700'
  },
  crowdfunding_admin: {
    label: 'Crowdfunding Administrator',
    description: 'Manages public crowdfunding campaigns, relief drives, emergency appeals, and funding milestones.',
    badgeColor: 'bg-orange-900 text-orange-100 border-orange-700'
  },
  examination_admin: {
    label: 'Examination Administrator',
    description: 'Conducts talent search examinations, oversees hall ticket dispatch, results evaluation, and digital certifications.',
    badgeColor: 'bg-purple-900 text-purple-100 border-purple-700'
  },
  exam_admin: {
    label: 'Examination Administrator',
    description: 'Conducts talent search examinations, oversees hall ticket dispatch, results evaluation, and digital certifications.',
    badgeColor: 'bg-purple-900 text-purple-100 border-purple-700'
  },
  school_admin: {
    label: 'School Administrator',
    description: 'Manages school academic rosters, student admissions, fee tracking, and teacher scheduling.',
    badgeColor: 'bg-blue-900 text-blue-100 border-blue-700'
  },
  madrasa_admin: {
    label: 'Madrasa Administrator',
    description: 'Oversees affiliated madrasas, Hifz & Tajweed progress logs, student boarding, and ethical curricula.',
    badgeColor: 'bg-teal-900 text-teal-100 border-teal-700'
  },
  finance_admin: {
    label: 'Finance Administrator',
    description: 'Oversees double-entry ledgers, expense authorizations, bank reconciliations, and statutory audits.',
    badgeColor: 'bg-emerald-950 text-emerald-200 border-emerald-800'
  },
  hr_admin: {
    label: 'HR Administrator',
    description: 'Manages staff directory, educator payroll, attendance, leave approvals, and hiring.',
    badgeColor: 'bg-violet-900 text-violet-100 border-violet-700'
  },
  content_admin: {
    label: 'Content / Blog Administrator',
    description: 'Publishes official trust bulletins, press releases, newsletters, event galleries, and editorial articles.',
    badgeColor: 'bg-rose-900 text-rose-100 border-rose-700'
  },
  blog_admin: {
    label: 'Blog / Content Administrator',
    description: 'Publishes official trust bulletins, press releases, newsletters, event galleries, and editorial articles.',
    badgeColor: 'bg-rose-900 text-rose-100 border-rose-700'
  },
  store_admin: {
    label: 'Store Administrator',
    description: 'Oversees the pre-architected FET Store merchandise, garments, islamic garments, perfumes, and books.',
    badgeColor: 'bg-amber-950 text-amber-200 border-amber-800'
  },
  travel_admin: {
    label: 'Travel Administrator',
    description: 'Manages the pre-architected FET Travel pilgrimage packages, Umrah, Ziyarat, pilgrim manifests, and bookings.',
    badgeColor: 'bg-sky-900 text-sky-100 border-sky-700'
  },
  reports_admin: {
    label: 'Reports Administrator',
    description: 'Generates analytical impact summaries, district-wise scholarship heatmaps, and regulatory filings.',
    badgeColor: 'bg-slate-900 text-slate-100 border-slate-700'
  },
  member: {
    label: 'General Member',
    description: 'Official approved General Member of Fatimyah Educational Trust with community and voting entitlements.',
    badgeColor: 'bg-emerald-900 text-emerald-100 border-emerald-700'
  },
  volunteer: {
    label: 'Registered Volunteer',
    description: 'Active field worker contributing time and skills to community welfare and education drives.',
    badgeColor: 'bg-cyan-950 text-cyan-200 border-cyan-700'
  },
  donor: {
    label: 'Benefactor / Donor',
    description: 'Valued patron contributing to educational scholarships, Zakat, and welfare programs.',
    badgeColor: 'bg-amber-950 text-amber-200 border-amber-700'
  },
  student: {
    label: 'Student / Scholar',
    description: 'Student enrolled in trust educational institutions or recipient of educational scholarships.',
    badgeColor: 'bg-sky-950 text-sky-200 border-sky-700'
  },
  user: {
    label: 'Registered User',
    description: 'Standard authenticated portal user. Basic access to profile and public submissions.',
    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700'
  }
};
