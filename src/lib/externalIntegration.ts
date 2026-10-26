/**
 * @license
 * External Platform Integration Client Library (Release 2 - Task 7)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides secure API communication, Single Sign-On (SSO) handoff,
 * health monitoring, and deep linking for:
 * 1. FAT School ERP Platform (Multi-Tenant School Operations)
 * 2. FAT Multilingual Platform (Document Translation & Digital Reader)
 */

import { 
  ExternalPlatformConfig, 
  ExternalPlatformKey, 
  SSOHandoffSession,
  MultilingualDocumentReference,
  SchoolTenantContext,
  UserProfile,
  UserRole
} from '../types';

// Default safe platform configurations (without inventing production credentials)
export const DEFAULT_EXTERNAL_PLATFORMS: Record<ExternalPlatformKey, ExternalPlatformConfig> = {
  school_erp: {
    id: 'fet_school_erp',
    platformKey: 'school_erp',
    name: 'FET School ERP',
    description: 'External academic administration platform for affiliated trust schools (Admissions, Attendance, Timetables, Staff, Operations). Separate product launching March/April 2027.',
    status: 'active',
    healthStatus: 'disconnected',
    connectionStatus: 'not_connected',
    baseUrl: '',
    ssoEndpoint: '/api/v1/auth/sso/consume',
    apiEndpoint: '/api/v1',
    allowedModules: ['admissions', 'attendance', 'timetables', 'teachers', 'students', 'library', 'transport', 'operations'],
    allowedOperations: ['view_dashboard', 'manage_roster', 'deep_link_student', 'export_reports'],
    authMethod: 'signed_token_exchange',
    tenantIsolationEnforced: true,
    externalAppId: 'fet-school-erp-prod',
    healthMessage: 'Platform connection unconfigured (Deployment scheduled March/April 2027)',
    updatedAt: new Date().toISOString()
  },
  madrasa_erp: {
    id: 'fet_madrasa_erp',
    platformKey: 'madrasa_erp',
    name: 'FET Madrasa ERP',
    description: 'External Islamic seminary and madrasa administration platform (Hifz, Tajweed, Alim courses, Boarding, and Student Records). Separate product launching March/April 2027.',
    status: 'active',
    healthStatus: 'disconnected',
    connectionStatus: 'not_connected',
    baseUrl: '',
    ssoEndpoint: '/api/v1/auth/sso/consume',
    apiEndpoint: '/api/v1',
    allowedModules: ['admissions', 'hifz_roster', 'attendance', 'hostel', 'curriculum', 'operations'],
    allowedOperations: ['view_dashboard', 'manage_roster', 'deep_link_student', 'export_reports'],
    authMethod: 'signed_token_exchange',
    tenantIsolationEnforced: true,
    externalAppId: 'fet-madrasa-erp-prod',
    healthMessage: 'Platform connection unconfigured (Deployment scheduled March/April 2027)',
    updatedAt: new Date().toISOString()
  },
  multilingual: {
    id: 'fet_multilingual',
    platformKey: 'multilingual',
    name: 'FET Multilingual Platform',
    description: 'Independent multilingual digital library, text translation engine, and prescribed book reader platform.',
    status: 'active',
    healthStatus: 'connected',
    connectionStatus: 'connected',
    baseUrl: (typeof window !== 'undefined' && (window as any).ENV_FAT_MULTILINGUAL_URL) || 'https://books.fetindia.org',
    ssoEndpoint: '/auth/sso/token',
    apiEndpoint: '/api/v1/books',
    allowedModules: ['document_reader', 'translation_matrix', 'language_editions', 'downloads', 'reviewer_workflow'],
    allowedOperations: ['read_document', 'switch_language', 'download_pdf', 'verify_candidate_access'],
    authMethod: 'signed_token_exchange',
    tenantIsolationEnforced: false,
    externalAppId: 'fet-multilingual-reader',
    healthMessage: 'Platform content delivery network operational',
    updatedAt: new Date().toISOString()
  }
};

/**
 * Curated reference catalog of Examination & Competition Study Materials
 * linked directly to the FAT Multilingual Platform
 */
export const PRESCRIBED_MULTILINGUAL_STUDY_MATERIALS: MultilingualDocumentReference[] = [
  {
    resourceId: 'book-charter-medina',
    title: 'The Charter of Medina & Universal Ethics of Justice',
    author: 'FET Academic Research Board',
    category: 'exam_study_material',
    sourcePlatform: 'fet_india',
    targetPlatform: 'fat_multilingual',
    availableLanguages: ['en', 'ur', 'hi', 'ar'],
    defaultLanguage: 'en',
    accessLevel: 'public',
    deepLinkUrl: '/reader/charter-of-medina'
  },
  {
    resourceId: 'book-freedom-struggle',
    title: 'Indian Muslim Scholars in the National Freedom Struggle',
    author: 'FET Historical Studies Wing',
    category: 'exam_study_material',
    sourcePlatform: 'fet_india',
    targetPlatform: 'fat_multilingual',
    availableLanguages: ['en', 'ur', 'hi'],
    defaultLanguage: 'ur',
    accessLevel: 'public',
    deepLinkUrl: '/reader/freedom-struggle-scholars'
  },
  {
    resourceId: 'book-quran-stem-ethics',
    title: 'Scientific Reasoning, STEM Inquiry and Islamic Pedagogical Ethics',
    author: 'Dr. Asadullah Merchant & Advisory Board',
    category: 'curriculum_text',
    sourcePlatform: 'fet_india',
    targetPlatform: 'fat_multilingual',
    availableLanguages: ['en', 'ur', 'ar'],
    defaultLanguage: 'en',
    accessLevel: 'registered',
    deepLinkUrl: '/reader/stem-inquiry-ethics'
  },
  {
    resourceId: 'book-nehjul-balagha-governance',
    title: 'Governance Principles of Nahj al-Balagha (Statutory Ethics & Public Service)',
    author: 'FET Jurisprudence Board',
    category: 'quranic_study',
    sourcePlatform: 'fet_india',
    targetPlatform: 'fat_multilingual',
    availableLanguages: ['en', 'ur', 'ar', 'ks'],
    defaultLanguage: 'ur',
    accessLevel: 'public',
    deepLinkUrl: '/reader/nahjul-balagha-governance'
  }
];

/**
 * Fetch list of external platform configurations from FET India integration proxy
 */
export async function fetchExternalPlatformConfigs(): Promise<Record<ExternalPlatformKey, ExternalPlatformConfig>> {
  try {
    const res = await fetch('/api/integration/platforms');
    if (!res.ok) {
      throw new Error(`Integration API returned ${res.status}`);
    }
    const data = await res.json();
    if (data.platforms && typeof data.platforms === 'object') {
      return {
        ...DEFAULT_EXTERNAL_PLATFORMS,
        ...data.platforms
      };
    }
    return DEFAULT_EXTERNAL_PLATFORMS;
  } catch (err) {
    console.warn('Could not fetch remote integration platforms, using defaults:', err);
    return DEFAULT_EXTERNAL_PLATFORMS;
  }
}

/**
 * Perform a non-blocking health check on a specific external platform
 */
export async function checkExternalPlatformHealth(
  platformKey: ExternalPlatformKey
): Promise<{ healthStatus: ExternalPlatformConfig['healthStatus']; message: string; timestamp: string }> {
  try {
    const res = await fetch(`/api/integration/platforms/${platformKey}/health`);
    if (!res.ok) {
      return {
        healthStatus: 'service_unavailable',
        message: `HTTP response ${res.status} from platform gateway.`,
        timestamp: new Date().toISOString()
      };
    }
    const result = await res.json();
    return {
      healthStatus: result.healthStatus || 'connected',
      message: result.message || 'Service responsive',
      timestamp: result.timestamp || new Date().toISOString()
    };
  } catch (err: any) {
    return {
      healthStatus: 'disconnected',
      message: err?.message || 'Unable to establish network handshake with external platform.',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Verify tenant isolation: check if user is authorized for specific school
 */
export function verifySchoolTenantAccess(
  userProfile: UserProfile | null,
  isSuperAdmin: boolean,
  schoolId: string
): boolean {
  if (isSuperAdmin) return true;
  if (!userProfile) return false;

  const roles = userProfile.roles || (userProfile.primaryRole ? [userProfile.primaryRole] : []);
  if (roles.includes('super_admin') || roles.includes('administrator')) return true;

  // School Admin is checked against their authorized school affiliation
  if (roles.includes('school_admin')) {
    // If schoolId is not provided or user has universal school oversight
    if (!schoolId) return true;
    
    // Check user's assigned institution ID or school metadata
    const userInstId = (userProfile as any).institutionId || (userProfile as any).assignedSchoolId;
    if (!userInstId || userInstId === schoolId) return true;
  }

  return false;
}

export interface InitiateHandoffParams {
  targetPlatform: ExternalPlatformKey;
  targetTenantId?: string;
  targetResourceId?: string;
  resourceAccessLevel?: 'public' | 'student' | 'admin' | 'restricted_exam';
  userUid: string;
  userEmail: string;
  userName: string;
  userRole?: UserRole | string;
  returnUrl?: string;
}

export interface HandoffResult {
  success: boolean;
  handoffUrl?: string;
  sessionId?: string;
  token?: string;
  expiresInSeconds?: number;
  message?: string;
  error?: string;
}

/**
 * Initiate an authenticated SSO handoff to an external platform.
 * Communicates with the FET India backend integration layer, which generates
 * a cryptographically signed, short-lived handoff token.
 */
export async function initiatePlatformSSOHandoff(
  params: InitiateHandoffParams
): Promise<HandoffResult> {
  const currentReturnUrl = params.returnUrl || (typeof window !== 'undefined' ? window.location.href : 'https://fetindia.org');

  try {
    const res = await fetch('/api/integration/sso/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...params,
        returnUrl: currentReturnUrl
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `SSO handoff initialization failed with code ${res.status}`);
    }

    const data: HandoffResult = await res.json();
    return data;
  } catch (err: any) {
    console.error('SSO handoff failure:', err);
    return {
      success: false,
      error: err?.message || 'Could not initiate secure Single Sign-On handoff.'
    };
  }
}

/**
 * Helper to generate a direct deep-link launch URL for FAT Multilingual reader
 */
export function getMultilingualDocumentLink(
  resourceId: string,
  language: string = 'en',
  config?: ExternalPlatformConfig
): string {
  const baseUrl = config?.baseUrl || DEFAULT_EXTERNAL_PLATFORMS.multilingual.baseUrl || 'https://books.fetindia.org';
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const returnParam = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
  return `${cleanBase}/reader/${encodeURIComponent(resourceId)}?lang=${encodeURIComponent(language)}&ref=fet_india&return_url=${returnParam}`;
}
