/**
 * @license
 * Firebase Service Initialization for FET India Digital Platform
 * Supports Web Portal, User Dashboard, Administrative System, and future FET India Mobile Application
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  updateProfile, 
  User as FirebaseUser 
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  where,
  runTransaction
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';
import { DEFAULT_ORG_CONFIG, MASTER_27_MODULES } from '../data/initialData';
import { getEffectivePermissions } from './rbac';
import { 
  OrgConfig, 
  ModuleChapter, 
  ModuleLifecycle, 
  UserProfile, 
  UserRole, 
  AppPermission,
  MembershipStatus,
  VolunteerStatus,
  DonorStatus,
  MembershipApplication,
  MembershipApplicationStatus,
  MembershipTierRequested,
  AuditLog, 
  PlatformNotification,
  NotificationType,
  AppNotification,
  AdminBroadcastDispatch,
  NotificationCategory,
  NotificationSeverity,
  NotificationPriority,
  AnnouncementStatus,
  UserNotificationPreferences,
  NotificationTargetGroup,
  VolunteerApplication,
  VolunteerApplicationStatus,
  DonorApplication,
  DonorApplicationStatus,
  DonationRecord,
  PublicMembershipVerification,
  PublicDonorVerification,
  PublicVolunteerVerification,
  ScholarshipApplication,
  VolunteerRecord,
  VolunteerServiceLog,
  VolunteerCategory,
  VolunteerActivity,
  VolunteerServiceRecord,
  VolunteerServiceStatus,
  CommunityGroup,
  CrowdfundingCampaign,
  CampaignCategory,
  CampaignStatus,
  CampaignDonation,
  CampaignDonationStatus,
  CampaignSupportingDocument,
  CampaignSupportingImage,
  CampaignReviewHistoryEntry,
  StoreProduct,
  TravelPackage,
  ExamCompetition,
  FinancialRecord,
  StaffDocumentRecord,
  StaffEmploymentStatus,
  StaffEmploymentType,
  PublicStaffVerification,
  PublicCertificateRecord,
  CompetitionCertificateRecord
} from '../types';

const firebaseConfig = {
  projectId: firebaseConfigData.projectId,
  appId: firebaseConfigData.appId,
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  storageBucket: firebaseConfigData.storageBucket || 'fatimyah-educational-trust.firebasestorage.app',
  messagingSenderId: firebaseConfigData.messagingSenderId
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with specified database ID and auto-detect long polling for reliable container proxy connectivity
export const db = firebaseConfigData.firestoreDatabaseId
  ? initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true
    }, firebaseConfigData.firestoreDatabaseId)
  : initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true
    });

// Initialize Cloud Storage with the designated Firebase Storage bucket
export const storage = getStorage(app, firebaseConfigData.storageBucket || 'fatimyah-educational-trust.firebasestorage.app');

export const googleProvider = new GoogleAuthProvider();

// Password Reset Dispatch
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// System Super Admin constant email as configured
export const SYSTEM_SUPER_ADMIN_EMAIL = 'fetkofficial@gmail.com';

// -------------------------------------------------------------
// FIRESTORE ERROR HANDLING STANDARD
// -------------------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// FIRESTORE PAYLOAD SANITIZER (Deep undefined & non-serializable purifier)
// -------------------------------------------------------------
/**
 * Recursively purifies any payload destined for Firestore:
 * - Strips any key whose value is `undefined`
 * - Converts or omits raw browser File, Blob, Event, React Elements, or DOM objects
 * - Preserves Firebase Timestamp instances, FieldValues (e.g. serverTimestamp), Dates, strings, numbers, booleans
 * - Deeply cleans nested objects and arrays
 */
export function cleanFirestoreData<T = any>(input: T): T {
  if (input === undefined) {
    return undefined as any;
  }
  if (input === null || typeof input !== 'object') {
    return input;
  }

  // Preserve Date instances
  if (input instanceof Date) {
    return input;
  }

  // Preserve Firestore FieldValue and Timestamp instances
  if (
    typeof (input as any).toDate === 'function' ||
    typeof (input as any).isEqual === 'function' ||
    typeof (input as any).toMillis === 'function' ||
    Boolean((input as any)._methodName)
  ) {
    return input;
  }

  // Sanitize browser File / Blob if accidentally passed directly
  if (typeof File !== 'undefined' && input instanceof File) {
    return {
      fileName: input.name,
      sizeBytes: input.size,
      mimeType: input.type
    } as any;
  }
  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    return {
      sizeBytes: input.size,
      mimeType: input.type
    } as any;
  }

  // Reject DOM Nodes, Elements, or Events
  if (typeof Event !== 'undefined' && input instanceof Event) {
    return undefined as any;
  }
  if (typeof Element !== 'undefined' && input instanceof Element) {
    return undefined as any;
  }
  // Reject React Elements ($$typeof)
  if ((input as any).$$typeof) {
    return undefined as any;
  }

  // Arrays: clean each element, discard undefined items
  if (Array.isArray(input)) {
    return input
      .map(item => cleanFirestoreData(item))
      .filter(item => item !== undefined) as any;
  }

  // Plain objects: clean each key, strip undefined keys
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(input)) {
    if (val === undefined) {
      continue;
    }
    if (typeof val === 'function') {
      continue;
    }
    const cleanedVal = cleanFirestoreData(val);
    if (cleanedVal !== undefined) {
      cleaned[key] = cleanedVal;
    }
  }

  return cleaned as T;
}

// -------------------------------------------------------------
// AUDIT LOG HELPER (Immutable Append-only)
// -------------------------------------------------------------
export async function logAuditEvent(params: {
  actorUid: string;
  actorEmail?: string;
  actorRole?: UserRole | string;
  action: string;
  targetEntity: string;
  targetId?: string;
  details: Record<string, any>;
}): Promise<void> {
  try {
    const auditRef = collection(db, 'audit_logs');
    const cleanedPayload = cleanFirestoreData({
      actorUid: params.actorUid || 'system',
      actorEmail: params.actorEmail || '',
      actorRole: params.actorRole || 'visitor',
      action: params.action,
      targetEntity: params.targetEntity,
      targetId: params.targetId || '',
      details: params.details || {},
      timestamp: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
      platform: 'FET India Web Platform v1.0.0'
    });
    await addDoc(auditRef, cleanedPayload);
  } catch (error) {
    console.warn('Audit logging non-blocking fallback:', error);
  }
}

// -------------------------------------------------------------
// ORGANIZATION CONFIGURATION REPOSITORY
// -------------------------------------------------------------
export async function fetchOrgConfig(): Promise<OrgConfig> {
  try {
    const configDocRef = doc(db, 'organization_config', 'main_config');
    const snap = await getDoc(configDocRef);
    if (snap.exists()) {
      const data = snap.data() as OrgConfig;
      // Guarantee legal entity name remains strictly protected
      return {
        ...DEFAULT_ORG_CONFIG,
        ...data,
        legalName: 'Fatimyah Educational Trust'
      };
    } else {
      // Seed default config
      await setDoc(configDocRef, DEFAULT_ORG_CONFIG);
      return DEFAULT_ORG_CONFIG;
    }
  } catch (error) {
    console.warn('Using local fallback for OrgConfig:', error);
    return DEFAULT_ORG_CONFIG;
  }
}

export async function saveOrgConfig(
  newConfig: Partial<OrgConfig>, 
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<OrgConfig> {
  const configDocRef = doc(db, 'organization_config', 'main_config');
  
  // Strip out any attempts to overwrite the protected legalName
  const { legalName, ...safeUpdates } = newConfig;

  const payload: Partial<OrgConfig> = {
    ...safeUpdates,
    legalName: 'Fatimyah Educational Trust', // strictly protected
    updatedAt: new Date().toISOString(),
    updatedBy: adminUser.email
  };

  await setDoc(configDocRef, payload, { merge: true });

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'UPDATE_ORGANIZATION_CMS_CONFIG',
    targetEntity: 'organization_config',
    targetId: 'main_config',
    details: { updatedFields: Object.keys(safeUpdates) }
  });

  return {
    ...DEFAULT_ORG_CONFIG,
    ...payload,
    legalName: 'Fatimyah Educational Trust'
  } as OrgConfig;
}

// -------------------------------------------------------------
// MODULES REPOSITORY (27 Chapters Master Matrix)
// -------------------------------------------------------------
export async function initializeModulesIfEmpty(): Promise<ModuleChapter[]> {
  try {
    const modulesCollection = collection(db, 'modules');
    const snap = await getDoc(doc(modulesCollection, 'mod-1'));
    
    if (!snap.exists()) {
      // Batch seed all 27 modules
      for (const mod of MASTER_27_MODULES) {
        await setDoc(doc(db, 'modules', mod.id), mod);
      }
      return MASTER_27_MODULES;
    }
    return MASTER_27_MODULES;
  } catch (error) {
    console.warn('Module repository initialization note:', error);
    return MASTER_27_MODULES;
  }
}

export async function updateModuleLifecycle(
  moduleId: string, 
  lifecycle: ModuleLifecycle,
  isPubliclyVisible: boolean,
  enabledInApp: boolean,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  const modRef = doc(db, 'modules', moduleId);
  const updateData = {
    lifecycle,
    isPubliclyVisible,
    enabledInApp,
    updatedAt: new Date().toISOString(),
    updatedBy: adminUser.email
  };
  
  await setDoc(modRef, updateData, { merge: true });

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'UPDATE_MODULE_LIFECYCLE',
    targetEntity: 'modules',
    targetId: moduleId,
    details: { newLifecycle: lifecycle, isPubliclyVisible, enabledInApp }
  });
}

// -------------------------------------------------------------
// USER REPOSITORY & PROFILE MANAGEMENT
// -------------------------------------------------------------
export async function getOrCreateUserProfile(
  user: FirebaseUser,
  additionalData?: {
    fullName?: string;
    fullLegalName?: string;
    mobileNumber?: string;
    country?: string;
    termsAccepted?: boolean;
  }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const isSuperAdminEmail = user.email?.toLowerCase() === SYSTEM_SUPER_ADMIN_EMAIL.toLowerCase();

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    let needsUpdate = false;
    const updates: Partial<UserProfile> = {
      lastLoginAt: new Date().toISOString(),
      emailVerified: user.emailVerified || false
    };

    // Calculate account status based on verification
    const currentAccountStatus = user.emailVerified ? 'active' : (data.accountStatus || 'pending_verification');
    if (data.accountStatus !== currentAccountStatus) {
      updates.accountStatus = currentAccountStatus;
      data.accountStatus = currentAccountStatus;
      needsUpdate = true;
    }

    // Guarantee super admin role and core_member membership for system administrator
    if (isSuperAdminEmail) {
      if (!data.roles.includes('super_admin')) {
        const updatedRoles = [...new Set([...data.roles, 'super_admin' as UserRole, 'core_member' as UserRole])];
        updates.roles = updatedRoles;
        updates.primaryRole = 'super_admin';
        updates.role = 'super_admin';
        updates.membershipStatus = 'core_member';
        data.roles = updatedRoles;
        data.primaryRole = 'super_admin';
        data.role = 'super_admin';
        data.membershipStatus = 'core_member';
        needsUpdate = true;
      }
    }

    // Backfill standard required fields if missing in legacy records
    if (!data.roles || data.roles.length === 0) {
      const fallbackRole = isSuperAdminEmail ? 'super_admin' : 'user';
      updates.roles = [fallbackRole];
      updates.primaryRole = fallbackRole;
      updates.role = fallbackRole;
      data.roles = [fallbackRole];
      data.primaryRole = fallbackRole;
      data.role = fallbackRole;
      needsUpdate = true;
    }

    if (!data.role) {
      const primary = data.primaryRole || (isSuperAdminEmail ? 'super_admin' : (data.roles[0] || 'user'));
      updates.role = primary;
      data.role = primary;
      needsUpdate = true;
    }

    if (!data.accountType) {
      const accType = isSuperAdminEmail || data.roles?.includes('super_admin') || data.roles?.includes('administrator') ? 'admin' : 'user';
      updates.accountType = accType;
      data.accountType = accType;
      needsUpdate = true;
    }

    // Backfill membershipStatus if absent
    if (!data.membershipStatus) {
      if (isSuperAdminEmail || data.roles?.includes('super_admin') || data.roles?.includes('core_member')) {
        updates.membershipStatus = 'core_member';
        data.membershipStatus = 'core_member';
      } else if (data.roles?.includes('member')) {
        updates.membershipStatus = 'general_member';
        data.membershipStatus = 'general_member';
      } else {
        updates.membershipStatus = 'none';
        data.membershipStatus = 'none';
      }
      needsUpdate = true;
    }

    // Backfill volunteerStatus if absent
    if (!data.volunteerStatus) {
      if (data.roles?.includes('volunteer')) {
        updates.volunteerStatus = 'active_volunteer';
        data.volunteerStatus = 'active_volunteer';
      } else {
        updates.volunteerStatus = 'none';
        data.volunteerStatus = 'none';
      }
      needsUpdate = true;
    }

    // Backfill donorStatus if absent
    if (!data.donorStatus) {
      if (data.roles?.includes('donor')) {
        updates.donorStatus = 'active_donor';
        data.donorStatus = 'active_donor';
      } else {
        updates.donorStatus = 'none';
        data.donorStatus = 'none';
      }
      needsUpdate = true;
    }

    if (!data.fullLegalName) {
      const legalName = additionalData?.fullLegalName || additionalData?.fullName || data.fullName || data.displayName || user.displayName || 'Registered User';
      updates.fullLegalName = legalName;
      data.fullLegalName = legalName;
      needsUpdate = true;
    }

    if (additionalData?.mobileNumber && !data.mobileNumber) {
      updates.mobileNumber = additionalData.mobileNumber;
      updates.phoneNumber = additionalData.mobileNumber;
      data.mobileNumber = additionalData.mobileNumber;
      data.phoneNumber = additionalData.mobileNumber;
      needsUpdate = true;
    }

    if ((additionalData?.fullName || additionalData?.fullLegalName) && !data.fullName) {
      const name = additionalData.fullLegalName || additionalData.fullName!;
      updates.fullName = name;
      data.fullName = name;
      needsUpdate = true;
    }

    if (additionalData?.country && !data.country) {
      updates.country = additionalData.country;
      data.country = additionalData.country;
      needsUpdate = true;
    }

    if (data.profileCompleted === undefined) {
      const isComplete = Boolean(
        (data.fullLegalName || data.fullName) &&
        (data.mobileNumber || data.phoneNumber) &&
        data.country &&
        data.address &&
        data.city &&
        data.state &&
        data.pincode
      );
      updates.profileCompleted = isComplete;
      data.profileCompleted = isComplete;
      needsUpdate = true;
    }

    if (needsUpdate) {
      try {
        updates.updatedAt = new Date().toISOString();
        await updateDoc(userRef, updates);
      } catch (err) {
        console.warn('Non-blocking user profile update sync:', err);
      }
    }

    const mergedProfile = { ...data, ...updates };
    mergedProfile.permissions = getEffectivePermissions(mergedProfile.roles || ['user'], mergedProfile.customPermissions || []);
    return mergedProfile;
  }

  // Strictly assign default 'user' role & 'none' membership status to public registrants (unless it's the system super admin email)
  const initialRoles: UserRole[] = isSuperAdminEmail ? ['super_admin', 'core_member'] : ['user'];
  const primaryRole: UserRole = isSuperAdminEmail ? 'super_admin' : 'user';
  const initialAccountType: 'admin' | 'user' = isSuperAdminEmail ? 'admin' : 'user';
  const initialMembershipStatus: MembershipStatus = isSuperAdminEmail ? 'core_member' : 'none';
  const initialVolunteerStatus: VolunteerStatus = 'none';
  const initialDonorStatus: DonorStatus = 'none';
  const name = additionalData?.fullLegalName || additionalData?.fullName || user.displayName || user.email?.split('@')[0] || (isSuperAdminEmail ? 'FET Secretariat Lead' : 'Registered User');
  const phone = additionalData?.mobileNumber || user.phoneNumber || '';
  const userCountry = additionalData?.country || 'India';
  const isVerified = user.emailVerified || false;
  const initialAccountStatus: 'active' | 'pending_verification' = isVerified ? 'active' : 'pending_verification';

  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    fullLegalName: name,
    fullName: name,
    displayName: name,
    mobileNumber: phone,
    phoneNumber: phone,
    country: userCountry,
    accountType: initialAccountType,
    photoURL: user.photoURL || '',
    role: primaryRole,
    roles: initialRoles,
    primaryRole,
    membershipStatus: initialMembershipStatus,
    volunteerStatus: initialVolunteerStatus,
    donorStatus: initialDonorStatus,
    permissions: getEffectivePermissions(initialRoles, []),
    customPermissions: [],
    status: 'active',
    accountStatus: initialAccountStatus,
    emailVerified: isVerified,
    termsAccepted: additionalData?.termsAccepted ?? true,
    termsAcceptedAt: new Date().toISOString(),
    membershipId: isSuperAdminEmail ? `FET-CORE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
    profileCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  try {
    await setDoc(userRef, newProfile);
    
    await logAuditEvent({
      actorUid: user.uid,
      actorEmail: user.email || '',
      actorRole: primaryRole,
      action: 'USER_FIRST_LOGIN_CREATED',
      targetEntity: 'users',
      targetId: user.uid,
      details: { assignedRoles: initialRoles, role: primaryRole, emailVerified: user.emailVerified }
    });
  } catch (err) {
    console.warn('Firestore profile persist note (using in-memory profile):', err);
  }

  return newProfile;
}

/**
 * Updates a user's own profile fields in Firestore.
 * Automatically excludes role / permission fields to enforce security.
 */
export async function updateUserProfileData(
  uid: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw new Error('User profile record does not exist.');
  }

  const existing = snap.data() as UserProfile;

  // Sanitize updates: Never allow a user to alter their own role, roles, permissions, or system status
  const cleanUpdates: Partial<UserProfile> = {
    updatedAt: new Date().toISOString()
  };

  if (updates.fullLegalName !== undefined) {
    cleanUpdates.fullLegalName = updates.fullLegalName.trim();
    cleanUpdates.fullName = updates.fullLegalName.trim();
    cleanUpdates.displayName = updates.fullLegalName.trim();
  } else if (updates.fullName !== undefined) {
    cleanUpdates.fullLegalName = updates.fullName.trim();
    cleanUpdates.fullName = updates.fullName.trim();
    cleanUpdates.displayName = updates.fullName.trim();
  }

  if (updates.fatherName !== undefined) {
    cleanUpdates.fatherName = updates.fatherName.trim();
    cleanUpdates.guardianName = cleanUpdates.fatherName || updates.guardianName?.trim();
  } else if (updates.guardianName !== undefined) {
    cleanUpdates.guardianName = updates.guardianName.trim();
  }
  if (updates.motherName !== undefined) cleanUpdates.motherName = updates.motherName.trim();

  if (updates.mobileNumber !== undefined) {
    cleanUpdates.mobileNumber = updates.mobileNumber.trim();
    cleanUpdates.phoneNumber = updates.mobileNumber.trim();
  }

  if (updates.country !== undefined) {
    cleanUpdates.country = updates.country.trim();
  }

  if (updates.address !== undefined) {
    cleanUpdates.address = updates.address.trim();
    cleanUpdates.fullAddress = updates.address.trim();
  } else if (updates.fullAddress !== undefined) {
    cleanUpdates.address = updates.fullAddress.trim();
    cleanUpdates.fullAddress = updates.fullAddress.trim();
  }

  if (updates.district !== undefined) {
    cleanUpdates.district = updates.district.trim();
    if (!updates.city) cleanUpdates.city = updates.district.trim();
  }

  if (updates.city !== undefined) {
    cleanUpdates.city = updates.city.trim();
    if (!cleanUpdates.district) cleanUpdates.district = updates.city.trim();
  }

  if (updates.state !== undefined) cleanUpdates.state = updates.state.trim();
  if (updates.pincode !== undefined) cleanUpdates.pincode = updates.pincode.trim();
  if (updates.occupation !== undefined) cleanUpdates.occupation = updates.occupation.trim();
  if (updates.educationalQualification !== undefined) {
    cleanUpdates.educationalQualification = updates.educationalQualification.trim();
    cleanUpdates.qualification = updates.educationalQualification.trim();
  } else if (updates.qualification !== undefined) {
    cleanUpdates.educationalQualification = updates.qualification.trim();
    cleanUpdates.qualification = updates.qualification.trim();
  }
  if (updates.gender !== undefined) cleanUpdates.gender = updates.gender;
  if (updates.dateOfBirth !== undefined) cleanUpdates.dateOfBirth = updates.dateOfBirth;
  if (updates.bloodGroup !== undefined) cleanUpdates.bloodGroup = updates.bloodGroup.trim();
  if (updates.emergencyContact !== undefined) cleanUpdates.emergencyContact = updates.emergencyContact.trim();
  if (updates.bio !== undefined) cleanUpdates.bio = updates.bio.trim();
  if (updates.photoURL !== undefined) cleanUpdates.photoURL = updates.photoURL;

  // Calculate profile completion status
  const merged: UserProfile = { ...existing, ...cleanUpdates };
  const hasEssentialFields = Boolean(
    merged.fullLegalName &&
    merged.mobileNumber &&
    merged.country &&
    merged.address &&
    merged.city &&
    merged.state &&
    merged.pincode
  );

  cleanUpdates.profileCompleted = hasEssentialFields;

  // Persist updates to Firestore
  await updateDoc(userRef, cleanUpdates);

  // Sync displayName in Firebase Auth if available and changed
  if (auth.currentUser && auth.currentUser.uid === uid && cleanUpdates.fullLegalName) {
    try {
      await updateProfile(auth.currentUser, {
        displayName: cleanUpdates.fullLegalName
      });
    } catch (authSyncErr) {
      console.warn('Auth displayName sync note:', authSyncErr);
    }
  }

  const updatedProfile: UserProfile = { ...existing, ...cleanUpdates };

  await logAuditEvent({
    actorUid: uid,
    actorEmail: existing.email || '',
    actorRole: existing.primaryRole || 'member',
    action: 'USER_PROFILE_UPDATED',
    targetEntity: 'users',
    targetId: uid,
    details: { 
      fieldsUpdated: Object.keys(cleanUpdates),
      profileCompleted: hasEssentialFields
    }
  });

  return updatedProfile;
}

export async function resendVerificationEmail(user: FirebaseUser): Promise<void> {
  await sendEmailVerification(user);
}

export async function updateUserRoles(
  targetUid: string,
  targetEmail: string,
  newRoles: UserRole[],
  primaryRole: UserRole,
  adminUser: { uid: string; email: string; role: UserRole },
  customPermissions?: AppPermission[],
  membershipStatus?: MembershipStatus
): Promise<void> {
  const isTargetSystemSuperAdmin = targetEmail.toLowerCase() === SYSTEM_SUPER_ADMIN_EMAIL.toLowerCase();
  
  // Guarantee super_admin role remains for system root super admin
  let finalizedRoles = [...newRoles];
  let finalizedPrimaryRole = primaryRole;
  if (isTargetSystemSuperAdmin && !finalizedRoles.includes('super_admin')) {
    finalizedRoles = ['super_admin', ...finalizedRoles.filter(r => r !== 'super_admin')];
    finalizedPrimaryRole = 'super_admin';
  }

  const effectivePermissions = getEffectivePermissions(finalizedRoles, customPermissions || []);

  const userRef = doc(db, 'users', targetUid);
  const updatePayload: Partial<UserProfile> = {
    roles: finalizedRoles,
    primaryRole: finalizedPrimaryRole,
    role: finalizedPrimaryRole,
    permissions: effectivePermissions,
    customPermissions: customPermissions || [],
    updatedAt: new Date().toISOString()
  };

  if (membershipStatus) {
    updatePayload.membershipStatus = membershipStatus;
  }

  await updateDoc(userRef, updatePayload);

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'UPDATE_USER_ROLES_RBAC',
    targetEntity: 'users',
    targetId: targetUid,
    details: { 
      targetEmail, 
      newRoles: finalizedRoles, 
      primaryRole: finalizedPrimaryRole,
      effectivePermissions,
      customPermissions: customPermissions || [],
      membershipStatus: membershipStatus || 'unchanged'
    }
  });
}

export async function updateUserParticipationStatus(
  targetUid: string,
  targetEmail: string,
  statusUpdates: {
    membershipStatus?: MembershipStatus;
    volunteerStatus?: VolunteerStatus;
    donorStatus?: DonorStatus;
  },
  adminUser: { uid: string; email: string; role: UserRole },
  reason?: string
): Promise<void> {
  const userRef = doc(db, 'users', targetUid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('Target user does not exist.');
  }

  const existing = userSnap.data() as UserProfile;
  const now = new Date().toISOString();
  const updatePayload: Partial<UserProfile> = {
    updatedAt: now
  };

  const currentRoles = existing.roles || [existing.primaryRole || 'user'];
  let updatedRoles = [...currentRoles];

  if (statusUpdates.membershipStatus) {
    updatePayload.membershipStatus = statusUpdates.membershipStatus;
    if (statusUpdates.membershipStatus === 'general_member') {
      if (!updatedRoles.includes('member')) {
        updatedRoles.push('member');
      }
      if (!existing.membershipId) {
        updatePayload.membershipId = `FET-MBR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    } else if (statusUpdates.membershipStatus === 'core_member') {
      // Core Member keeps the exact same Member ID (or assigns one if none existed)
      if (!existing.membershipId) {
        updatePayload.membershipId = `FET-MBR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }
  }

  if (statusUpdates.volunteerStatus) {
    updatePayload.volunteerStatus = statusUpdates.volunteerStatus;
    if (statusUpdates.volunteerStatus === 'active_volunteer') {
      if (!updatedRoles.includes('volunteer')) {
        updatedRoles.push('volunteer');
      }
      if (!existing.volunteerId) {
        updatePayload.volunteerId = `FET-VOL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }
  }

  if (statusUpdates.donorStatus) {
    updatePayload.donorStatus = statusUpdates.donorStatus;
    if (statusUpdates.donorStatus === 'active_donor') {
      if (!updatedRoles.includes('donor')) {
        updatedRoles.push('donor');
      }
      if (!existing.donorId) {
        updatePayload.donorId = `FET-DNR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }
  }

  updatePayload.roles = updatedRoles;
  await updateDoc(userRef, updatePayload);

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'USER_PARTICIPATION_STATUS_UPDATED',
    targetEntity: 'users',
    targetId: targetUid,
    details: {
      targetEmail,
      statusUpdates,
      reason: reason || 'Administrative review',
      adminEmail: adminUser.email
    }
  });
}

export async function updateUserAccountStatus(
  targetUid: string,
  targetEmail: string,
  newStatus: 'active' | 'suspended' | 'pending' | 'pending_verification',
  adminUser: { uid: string; email: string; role: UserRole },
  reason?: string
): Promise<void> {
  const isTargetSystemSuperAdmin = targetEmail.toLowerCase() === SYSTEM_SUPER_ADMIN_EMAIL.toLowerCase();
  if (isTargetSystemSuperAdmin && newStatus === 'suspended') {
    throw new Error('System Root Super Administrator account cannot be suspended.');
  }

  const userRef = doc(db, 'users', targetUid);
  const updatePayload: Partial<UserProfile> = {
    status: newStatus === 'suspended' ? 'suspended' : 'active',
    accountStatus: newStatus,
    updatedAt: new Date().toISOString()
  };

  await updateDoc(userRef, updatePayload);

  // Trigger in-app notification to the affected user
  try {
    await createUserNotification({
      userId: targetUid,
      userEmail: targetEmail,
      title: `Account Status Update: ${newStatus === 'active' ? 'Activated' : newStatus === 'suspended' ? 'Suspended' : 'Status Modified'}`,
      message: newStatus === 'active'
        ? 'Your FET India account has been verified and fully activated. You now have standard access.'
        : newStatus === 'suspended'
        ? `Your account access has been suspended by administration.${reason ? ` Reason: ${reason}` : ''}`
        : `Your account status is currently set to "${newStatus}".${reason ? ` Details: ${reason}` : ''}`,
      type: 'account',
      severity: newStatus === 'suspended' ? 'critical' : newStatus === 'active' ? 'success' : 'warning',
      module: 'account',
      createdBy: adminUser.email
    });
  } catch (notifErr) {
    console.warn('Account status notification trigger notice:', notifErr);
  }

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'USER_ACCOUNT_STATUS_UPDATED',
    targetEntity: 'users',
    targetId: targetUid,
    details: {
      targetEmail,
      newStatus,
      reason: reason || 'Administrative status review',
      adminEmail: adminUser.email
    }
  });
}

// -------------------------------------------------------------
// NOTIFICATIONS & COMMUNICATION REPOSITORY
// -------------------------------------------------------------

/**
 * Creates an in-app user notification for a specific user.
 * Supports idempotency check to prevent duplicate alerts.
 */
export async function createUserNotification(
  notification: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'readAt'> & { createdAt?: string }
): Promise<string> {
  if (!notification.userId) {
    throw new Error('Target User ID is required to create a user notification.');
  }

  const userNotifRef = collection(db, 'user_notifications');

  // Idempotency check if idempotencyKey is supplied
  if (notification.idempotencyKey) {
    try {
      const q = query(
        userNotifRef, 
        where('userId', '==', notification.userId), 
        where('idempotencyKey', '==', notification.idempotencyKey)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].id;
      }
    } catch (e) {
      console.warn('Idempotency query notice:', e);
    }
  }

  const now = notification.createdAt || new Date().toISOString();

  const payload: Omit<AppNotification, 'id'> = {
    userId: notification.userId,
    userEmail: notification.userEmail || '',
    userName: notification.userName || '',
    title: notification.title,
    message: notification.message,
    type: notification.type || 'system',
    category: notification.category || 'General Notification',
    severity: notification.severity || 'info',
    priority: notification.priority || 'normal',
    status: notification.status || 'published',
    module: notification.module || 'system',
    actionUrl: notification.actionUrl || '',
    actionLabel: notification.actionLabel || '',
    targetGroup: notification.targetGroup || 'direct',
    broadcastId: notification.broadcastId || '',
    createdBy: notification.createdBy || 'FET System',
    read: false,
    readAt: null,
    isArchived: false,
    archivedAt: notification.archivedAt || null,
    idempotencyKey: notification.idempotencyKey || null,
    publishAt: notification.publishAt || now,
    expiresAt: notification.expiresAt || null,
    createdAt: now,
    emailTriggered: notification.emailTriggered ?? false,
    emailDeliveryStatus: notification.emailDeliveryStatus || 'not_configured',
    emailDeliveryNote: notification.emailDeliveryNote || 'In-app notification delivered.'
  };

  const cleanedPayload = cleanFirestoreData(payload);
  const docRef = await addDoc(userNotifRef, cleanedPayload);
  return docRef.id;
}

/**
 * Marks an individual notification as read.
 */
export async function markUserNotificationAsRead(notificationId: string): Promise<void> {
  if (!notificationId) return;
  const docRef = doc(db, 'user_notifications', notificationId);
  await updateDoc(docRef, {
    read: true,
    readAt: new Date().toISOString()
  });
}

/**
 * Marks an individual notification as unread.
 */
export async function markUserNotificationAsUnread(notificationId: string): Promise<void> {
  if (!notificationId) return;
  const docRef = doc(db, 'user_notifications', notificationId);
  await updateDoc(docRef, {
    read: false,
    readAt: null
  });
}

/**
 * Archives an individual notification.
 */
export async function archiveUserNotification(notificationId: string): Promise<void> {
  if (!notificationId) return;
  const docRef = doc(db, 'user_notifications', notificationId);
  await updateDoc(docRef, {
    isArchived: true,
    archivedAt: new Date().toISOString()
  });
}

/**
 * Marks all notifications for a specific user as read.
 */
export async function markAllUserNotificationsAsRead(userId: string): Promise<void> {
  if (!userId) return;
  const notifRef = collection(db, 'user_notifications');
  const q = query(notifRef, where('userId', '==', userId), where('read', '==', false));
  const snapshot = await getDocs(q);

  const now = new Date().toISOString();
  const updatePromises = snapshot.docs.map((docSnap) => 
    updateDoc(doc(db, 'user_notifications', docSnap.id), {
      read: true,
      readAt: now
    })
  );

  await Promise.all(updatePromises);
}

/**
 * Deletes a notification belonging to a user.
 */
export async function deleteUserNotification(notificationId: string): Promise<void> {
  if (!notificationId) return;
  const docRef = doc(db, 'user_notifications', notificationId);
  await deleteDoc(docRef);
}

/**
 * Updates a user's notification preferences.
 */
export async function updateUserNotificationPreferences(
  userId: string,
  preferences: UserNotificationPreferences
): Promise<void> {
  if (!userId) return;
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    notificationPreferences: preferences,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Updates status of an administrative broadcast (e.g. archive, cancel, publish).
 */
export async function updateAdminBroadcastStatus(
  broadcastId: string,
  newStatus: AnnouncementStatus,
  adminUser: { uid: string; email: string; role: UserRole },
  note?: string
): Promise<void> {
  if (!broadcastId) return;
  const docRef = doc(db, 'admin_broadcasts', broadcastId);
  const now = new Date().toISOString();

  const updates: Record<string, any> = {
    status: newStatus,
    updatedAt: now
  };

  if (newStatus === 'archived') {
    updates.archivedAt = now;
    updates.archivedByEmail = adminUser.email;
  } else if (newStatus === 'cancelled') {
    updates.cancelledAt = now;
    updates.cancelledByEmail = adminUser.email;
  }

  await updateDoc(docRef, updates);

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'ADMIN_BROADCAST_STATUS_UPDATED',
    targetEntity: 'admin_broadcasts',
    targetId: broadcastId,
    details: {
      newStatus,
      note: note || '',
      updatedAt: now
    }
  });
}

/**
 * Updates an announcement's content or metadata.
 */
export async function updateAdminAnnouncement(
  broadcastId: string,
  updates: Partial<AdminBroadcastDispatch>,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  if (!broadcastId) return;
  const docRef = doc(db, 'admin_broadcasts', broadcastId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...updates,
    updatedAt: now
  });

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'ADMIN_BROADCAST_UPDATED',
    targetEntity: 'admin_broadcasts',
    targetId: broadcastId,
    details: {
      updatedFields: Object.keys(updates),
      updatedAt: now
    }
  });
}

/**
 * Dispatches an administrative broadcast to targeted cohorts with strict UID deduplication.
 * If a recipient belongs to multiple targeted groups (e.g. General Member AND Volunteer),
 * they receive the notification exactly once.
 */
export async function dispatchAdminBroadcast(
  params: {
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
    publishAt?: string;
    expiresAt?: string;
    actionUrl?: string;
    actionLabel?: string;
    module?: 'membership' | 'volunteer' | 'donor' | 'account' | 'system' | 'donations' | 'applications' | 'campaigns' | 'competitions' | 'exams' | 'certificates' | 'general';
    triggerEmail?: boolean;
  },
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<{ broadcastId: string; recipientCount: number; deduplicatedUserIds: string[] }> {
  if (!params.title.trim() || !params.message.trim()) {
    throw new Error('Title and message are required to dispatch a broadcast.');
  }

  const now = new Date().toISOString();
  const publishTime = params.publishAt || now;
  const isScheduledInFuture = new Date(publishTime).getTime() > new Date(now).getTime() + 60000;
  const initialStatus: AnnouncementStatus = params.status || (isScheduledInFuture ? 'scheduled' : 'published');
  const targetGroups = params.targetGroups.length > 0 ? params.targetGroups : ['all' as NotificationTargetGroup];

  // 1. Query all users from Firestore to match against selected groups
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);
  const allUsers: UserProfile[] = [];
  usersSnapshot.forEach((d) => {
    allUsers.push({ ...d.data(), uid: d.id } as UserProfile);
  });

  // 2. Identify and strictly deduplicate recipient UIDs
  const recipientMap = new Map<string, UserProfile>();

  const isAll = targetGroups.includes('all');
  const isMembers = targetGroups.includes('members');
  const isGeneralMembers = targetGroups.includes('general_members');
  const isCoreMembers = targetGroups.includes('core_members');
  const isVolunteers = targetGroups.includes('volunteers');
  const isDonors = targetGroups.includes('donors');
  const isStaff = targetGroups.includes('staff') || targetGroups.includes('admins');
  const isManagement = targetGroups.includes('management');

  for (const user of allUsers) {
    if (!user.uid) continue;

    let isMatch = false;

    if (isAll) {
      isMatch = true;
    } else {
      if (isMembers && (user.membershipStatus === 'general_member' || user.membershipStatus === 'core_member' || user.roles?.includes('member') || user.roles?.includes('core_member'))) {
        isMatch = true;
      }
      if (isGeneralMembers && (user.membershipStatus === 'general_member' || user.roles?.includes('member'))) {
        isMatch = true;
      }
      if (isCoreMembers && (user.membershipStatus === 'core_member' || user.roles?.includes('core_member'))) {
        isMatch = true;
      }
      if (isVolunteers && (user.volunteerStatus === 'approved' || user.volunteerStatus === 'active_volunteer' || user.roles?.includes('volunteer'))) {
        isMatch = true;
      }
      if (isDonors && (user.donorStatus === 'approved' || user.donorStatus === 'active_donor' || user.roles?.includes('donor'))) {
        isMatch = true;
      }
      if (isStaff && (user.primaryRole === 'administrator' || user.primaryRole === 'super_admin' || user.role === 'administrator' || user.role === 'super_admin' || user.roles?.includes('administrator') || user.roles?.includes('super_admin'))) {
        isMatch = true;
      }
      if (isManagement && (user.primaryRole === 'super_admin' || user.role === 'super_admin' || user.roles?.includes('super_admin'))) {
        isMatch = true;
      }
      if (params.targetUserIds && params.targetUserIds.includes(user.uid)) {
        isMatch = true;
      }
    }

    if (isMatch) {
      recipientMap.set(user.uid, user);
    }
  }

  // Include any explicitly specified target user IDs not already caught
  if (params.targetUserIds && params.targetUserIds.length > 0) {
    for (const uid of params.targetUserIds) {
      if (!recipientMap.has(uid)) {
        const found = allUsers.find(u => u.uid === uid);
        recipientMap.set(uid, found || { uid, email: '' } as UserProfile);
      }
    }
  }

  const deduplicatedUsers = Array.from(recipientMap.values());
  const deduplicatedUserIds = Array.from(recipientMap.keys());
  const recipientCount = deduplicatedUserIds.length;

  // 3. Determine Email Configuration Status
  const emailStatus: 'not_configured' | 'queued' | 'sent' | 'failed' = 'not_configured';
  const emailNote = params.triggerEmail 
    ? 'External email provider (SMTP/SendGrid) not configured in environment. In-app notifications dispatched directly to recipient inboxes.'
    : 'In-app notification dispatched.';

  // 4. Create admin broadcast record in admin_broadcasts
  const broadcastCol = collection(db, 'admin_broadcasts');
  const broadcastDocRef = await addDoc(broadcastCol, {
    title: params.title,
    message: params.message,
    type: params.type,
    category: params.category || 'General Announcement',
    severity: params.severity || 'info',
    priority: params.priority || 'normal',
    status: initialStatus,
    targetGroups,
    targetAudience: params.targetAudience || targetGroups.join(', '),
    targetUserIds: deduplicatedUserIds,
    recipientCount,
    sentByUid: adminUser.uid,
    sentByEmail: adminUser.email,
    dispatchedByEmail: adminUser.email,
    createdAt: now,
    publishAt: publishTime,
    expiresAt: params.expiresAt || null,
    emailTriggerRequested: Boolean(params.triggerEmail),
    emailDeliveryStatus: emailStatus,
    emailDeliveryNote: emailNote,
    actionUrl: params.actionUrl || '',
    actionLabel: params.actionLabel || '',
    module: params.module || 'general',
    statusHistory: [
      {
        status: initialStatus,
        changedAt: now,
        changedByEmail: adminUser.email,
        note: 'Broadcast initialized and created.'
      }
    ]
  });

  const broadcastId = broadcastDocRef.id;

  // 5. Create in-app user notifications for each deduplicated recipient
  const userNotifCol = collection(db, 'user_notifications');
  const notificationPromises = deduplicatedUsers.map((user) => {
    const notifPayload: Omit<AppNotification, 'id'> = {
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.fullLegalName || user.fullName || user.displayName || '',
      title: params.title,
      message: params.message,
      type: params.type,
      category: params.category || 'General Announcement',
      severity: params.severity || 'info',
      priority: params.priority || 'normal',
      status: initialStatus,
      module: params.module || 'general',
      actionUrl: params.actionUrl || '',
      actionLabel: params.actionLabel || '',
      targetGroup: targetGroups.join(', '),
      targetAudience: params.targetAudience || targetGroups.join(', '),
      broadcastId,
      createdBy: adminUser.email,
      publishAt: publishTime,
      expiresAt: params.expiresAt || null,
      read: false,
      readAt: null,
      isArchived: false,
      createdAt: now,
      emailTriggered: Boolean(params.triggerEmail),
      emailDeliveryStatus: emailStatus,
      emailDeliveryNote: emailNote
    };

    return addDoc(userNotifCol, cleanFirestoreData(notifPayload));
  });

  await Promise.all(notificationPromises);

  // 6. Also sync with platform global notifications collection (for system bulletin ticker)
  try {
    const notifRef = collection(db, 'notifications');
    const globalType: NotificationType = params.type === 'announcement' 
      ? 'announcement' 
      : (params.severity === 'critical' ? 'critical' : params.severity === 'warning' ? 'warning' : params.severity === 'success' ? 'success' : 'info');

    await addDoc(notifRef, cleanFirestoreData({
      title: params.title,
      message: params.message,
      type: globalType,
      targetAudience: isAll ? 'all' : 'members',
      targetUserIds: deduplicatedUserIds,
      isPublished: initialStatus === 'published',
      createdAt: now,
      createdBy: adminUser.email,
      readBy: []
    }));
  } catch (syncErr) {
    console.warn('Global notification ticker sync non-blocking note:', syncErr);
  }

  // 7. Audit log event
  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'ADMIN_BROADCAST_DISPATCHED',
    targetEntity: 'admin_broadcasts',
    targetId: broadcastId,
    details: {
      title: params.title,
      category: params.category || 'General Announcement',
      priority: params.priority || 'normal',
      status: initialStatus,
      targetGroups,
      publishAt: publishTime,
      expiresAt: params.expiresAt || null,
      distinctRecipientCount: recipientCount,
      emailTriggerRequested: Boolean(params.triggerEmail),
      emailDeliveryStatus: emailStatus
    }
  });

  return { broadcastId, recipientCount, deduplicatedUserIds };
}

export async function sendBroadcastNotification(
  notification: Omit<PlatformNotification, 'id' | 'createdAt' | 'readBy' | 'createdBy'>,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<string> {
  const notifRef = collection(db, 'notifications');
  const docRef = await addDoc(notifRef, {
    ...notification,
    createdAt: new Date().toISOString(),
    createdBy: adminUser.email,
    readBy: []
  });

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'BROADCAST_NOTIFICATION_DISPATCHED',
    targetEntity: 'notifications',
    targetId: docRef.id,
    details: { title: notification.title, audience: notification.targetAudience }
  });

  return docRef.id;
}

// -------------------------------------------------------------
// VOLUNTEER APPLICATIONS REPOSITORY
// -------------------------------------------------------------

// -------------------------------------------------------------
// SEQUENTIAL ID GENERATION HELPERS
// -------------------------------------------------------------

/**
 * Atomic, transaction-safe sequence counter for Volunteer IDs.
 * Sequence begins from 101 at official FET India launch.
 * Produces permanent IDs formatted like: FET-VOL-2026-0101, FET-VOL-2026-0102, etc.
 */
export async function getNextSequentialVolunteerId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, 'counters', 'volunteer_id_sequence');

  try {
    const nextSeq = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let currentVal = 100; // Sequence begins from 101
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        if (typeof data.currentSequence === 'number') {
          currentVal = Math.max(data.currentSequence, 100);
        }
      }
      const nextVal = currentVal + 1;
      transaction.set(counterRef, {
        currentSequence: nextVal,
        lastIssuedAt: new Date().toISOString(),
        prefix: 'FET-VOL',
        year: currentYear
      }, { merge: true });
      return nextVal;
    });

    const formattedSeq = nextSeq < 1000 ? String(nextSeq).padStart(4, '0') : String(nextSeq);
    return `FET-VOL-${currentYear}-${formattedSeq}`;
  } catch (err) {
    console.warn('Transaction failed for volunteer counter, applying fallback timestamp-safe sequential generation:', err);
    return `FET-VOL-${currentYear}-0101`;
  }
}

/**
 * Atomic, transaction-safe sequence counter for Member IDs.
 * Sequence begins from 101 at official FET India launch.
 * Produces permanent IDs formatted like: FET-MBR-2026-0101, FET-MBR-2026-0102, etc.
 */
export async function getNextSequentialMemberId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, 'counters', 'member_id_sequence');

  try {
    const nextSeq = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let currentVal = 100; // Sequence begins from 101
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        if (typeof data.currentSequence === 'number') {
          currentVal = Math.max(data.currentSequence, 100);
        }
      }
      const nextVal = currentVal + 1;
      transaction.set(counterRef, {
        currentSequence: nextVal,
        lastIssuedAt: new Date().toISOString(),
        prefix: 'FET-MBR',
        year: currentYear
      }, { merge: true });
      return nextVal;
    });

    const formattedSeq = nextSeq < 1000 ? String(nextSeq).padStart(4, '0') : String(nextSeq);
    return `FET-MBR-${currentYear}-${formattedSeq}`;
  } catch (err) {
    console.warn('Transaction failed for member counter, applying fallback sequential generation:', err);
    return `FET-MBR-${currentYear}-0101`;
  }
}

/**
 * Atomic, transaction-safe sequence counter for Donor IDs.
 * Sequence begins from 101 at official FET India launch.
 * Produces permanent IDs formatted like: FET-DNR-2026-0101, FET-DNR-2026-0102, etc.
 */
export async function getNextSequentialDonorId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, 'counters', 'donor_id_sequence');

  try {
    const nextSeq = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let currentVal = 100; // Sequence begins from 101
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        if (typeof data.currentSequence === 'number') {
          currentVal = Math.max(data.currentSequence, 100);
        }
      }
      const nextVal = currentVal + 1;
      transaction.set(counterRef, {
        currentSequence: nextVal,
        lastIssuedAt: new Date().toISOString(),
        prefix: 'FET-DNR',
        year: currentYear
      }, { merge: true });
      return nextVal;
    });

    const formattedSeq = nextSeq < 1000 ? String(nextSeq).padStart(4, '0') : String(nextSeq);
    return `FET-DNR-${currentYear}-${formattedSeq}`;
  } catch (err) {
    console.warn('Transaction failed for donor counter, applying fallback sequential generation:', err);
    return `FET-DNR-${currentYear}-0101`;
  }
}

export async function submitVolunteerApplication(
  applicationData: Omit<VolunteerApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  user: { uid: string; email: string }
): Promise<string> {
  const volunteerCol = collection(db, 'volunteerApplications');
  const now = new Date().toISOString();

  // Create document in volunteerApplications collection linked to applicantUid
  const docRef = await addDoc(volunteerCol, cleanFirestoreData({
    ...applicationData,
    applicantUid: user.uid,
    applicantEmail: user.email,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  }));

  // Update user profile volunteerStatus to 'pending'
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      volunteerStatus: 'pending',
      updatedAt: now
    });
  } catch (userErr) {
    console.warn('Volunteer status sync note on user:', userErr);
  }

  // Trigger in-app notification for volunteer submission
  try {
    await createUserNotification({
      userId: user.uid,
      userEmail: user.email,
      title: 'Volunteer Application Submitted',
      message: 'Thank you for your noble commitment. Your volunteer application has been submitted to the community mission committee.',
      type: 'volunteer',
      severity: 'info',
      module: 'volunteer',
      actionUrl: 'volunteer',
      actionLabel: 'Track Status'
    });
  } catch (notifErr) {
    console.warn('Volunteer application notification notice:', notifErr);
  }

  await logAuditEvent({
    actorUid: user.uid,
    actorEmail: user.email,
    actorRole: 'member',
    action: 'VOLUNTEER_APPLICATION_SUBMITTED',
    targetEntity: 'volunteerApplications',
    targetId: docRef.id,
    details: {
      fullLegalName: applicationData.fullLegalName,
      state: applicationData.state,
      district: applicationData.district,
      areasOfInterest: applicationData.areasOfInterest,
      preferredLocation: applicationData.preferredLocation
    }
  });

  return docRef.id;
}

export async function updateVolunteerApplication(
  applicationId: string,
  applicationData: Partial<Omit<VolunteerApplication, 'id' | 'applicantUid' | 'status' | 'reviewedByUid' | 'reviewedByEmail' | 'reviewedAt' | 'reviewNotes'>>,
  user: { uid: string; email: string }
): Promise<void> {
  const docRef = doc(db, 'volunteerApplications', applicationId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...applicationData,
    updatedAt: now
  });

  await logAuditEvent({
    actorUid: user.uid,
    actorEmail: user.email,
    actorRole: 'member',
    action: 'VOLUNTEER_APPLICATION_UPDATED',
    targetEntity: 'volunteerApplications',
    targetId: applicationId,
    details: {
      updatedFields: Object.keys(applicationData)
    }
  });
}

export async function adminReviewVolunteerApplication(
  applicationId: string,
  applicantUid: string | undefined,
  newStatus: VolunteerApplicationStatus,
  reviewNotes: string,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<{ assignedVolunteerId?: string }> {
  if (!applicationId) {
    throw new Error('Application document ID is required for review.');
  }

  const docRef = doc(db, 'volunteerApplications', applicationId);
  const now = new Date().toISOString();
  let assignedVolunteerId: string | undefined = undefined;

  // 1. Fetch current application to retain existing ID if already assigned
  const appSnap = await getDoc(docRef);
  const existingAppData = appSnap.exists() ? (appSnap.data() as VolunteerApplication) : null;

  if (newStatus === 'approved') {
    if (existingAppData?.volunteerIdAssigned) {
      assignedVolunteerId = existingAppData.volunteerIdAssigned;
    } else {
      assignedVolunteerId = await getNextSequentialVolunteerId();
    }
  }

  const updatePayload: Partial<VolunteerApplication> = {
    status: newStatus,
    reviewNotes: reviewNotes || '',
    reviewedByUid: adminUser.uid,
    reviewedByEmail: adminUser.email,
    reviewedAt: now,
    updatedAt: now
  };

  if (newStatus === 'approved') {
    updatePayload.approvedBy = adminUser.uid;
    updatePayload.approvedAt = now;
    if (assignedVolunteerId) {
      updatePayload.volunteerIdAssigned = assignedVolunteerId;
    }
  }

  // Perform document update in volunteerApplications collection
  await updateDoc(docRef, updatePayload);

  // Sync applicant's volunteerStatus and roles in Firestore while strictly preserving other statuses
  if (applicantUid) {
    try {
      const userRef = doc(db, 'users', applicantUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        const currentRoles = userData.roles || (userData.role ? [userData.role as UserRole] : ['user']);
        const userUpdates: Partial<UserProfile> = {
          updatedAt: now
        };

        if (newStatus === 'approved') {
          userUpdates.volunteerStatus = 'approved';
          userUpdates.volunteerId = assignedVolunteerId || userData.volunteerId;
          userUpdates.volunteerApprovedAt = now;
          userUpdates.volunteerApprovedBy = adminUser.uid;
          userUpdates.volunteerApprovedByEmail = adminUser.email;
          if (existingAppData) {
            userUpdates.volunteerAreasOfInterest = existingAppData.areasOfInterest || [];
            userUpdates.volunteerSkills = existingAppData.skills || [];
            userUpdates.volunteerAvailability = existingAppData.availability || '';
            userUpdates.volunteerPreferredLocation = existingAppData.preferredLocation || '';
          }
          if (!currentRoles.includes('volunteer')) {
            userUpdates.roles = [...currentRoles, 'volunteer' as UserRole];
          }
        } else if (newStatus === 'under_review') {
          userUpdates.volunteerStatus = 'under_review';
        } else if (newStatus === 'rejected') {
          userUpdates.volunteerStatus = 'rejected';
        } else if (newStatus === 'suspended') {
          userUpdates.volunteerStatus = 'suspended';
        } else if (newStatus === 'inactive') {
          userUpdates.volunteerStatus = 'inactive';
        }

        await updateDoc(userRef, userUpdates);

        // Also create/update public volunteer verification record for approved volunteers
        if (newStatus === 'approved' && (assignedVolunteerId || userData.volunteerId)) {
          const vId = (assignedVolunteerId || userData.volunteerId)!;
          try {
            await setDoc(doc(db, 'public_volunteers', vId), {
              volunteerId: vId,
              fullName: existingAppData?.fullLegalName || userData.fullLegalName || userData.displayName || 'FET Volunteer',
              fatherName: existingAppData?.fatherName || userData.fatherName || userData.guardianName || '',
              volunteerWing: existingAppData?.assignedWing || existingAppData?.areasOfInterest?.[0] || 'Community Service Wing',
              status: 'approved',
              issueDate: now.split('T')[0],
              validUntil: `AY ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
              district: existingAppData?.district || userData.city || userData.district || 'Regional Chapter',
              state: existingAppData?.state || userData.state || 'India',
              country: existingAppData?.country || userData.country || 'India',
              updatedAt: now
            }, { merge: true });
          } catch (pubErr) {
            console.warn('Public volunteer record sync non-blocking note:', pubErr);
          }
        }
      }
    } catch (roleErr) {
      console.warn('Volunteer status sync non-blocking error:', roleErr);
    }

    // Trigger in-app notification to the applicant
    try {
      if (newStatus === 'approved') {
        await createUserNotification({
          userId: applicantUid,
          title: 'Volunteer Application Approved!',
          message: `Welcome to the FET India Volunteer Force! Your volunteer status is approved and Volunteer ID (${assignedVolunteerId || 'Active'}) is activated.`,
          type: 'volunteer',
          severity: 'success',
          module: 'volunteer',
          actionUrl: 'volunteer',
          actionLabel: 'View Volunteer Desk',
          createdBy: adminUser.email
        });
      } else if (newStatus === 'under_review') {
        await createUserNotification({
          userId: applicantUid,
          title: 'Volunteer Application Under Review',
          message: 'Your volunteer application is undergoing review by the outreach coordinator.',
          type: 'volunteer',
          severity: 'info',
          module: 'volunteer',
          actionUrl: 'applications',
          actionLabel: 'View Applications',
          createdBy: adminUser.email
        });
      } else if (newStatus === 'rejected') {
        await createUserNotification({
          userId: applicantUid,
          title: 'Volunteer Application Status Update',
          message: `Your volunteer application was reviewed and could not be approved at this time.${reviewNotes ? ` Notes: ${reviewNotes}` : ''}`,
          type: 'volunteer',
          severity: 'warning',
          module: 'volunteer',
          actionUrl: 'applications',
          actionLabel: 'View Details',
          createdBy: adminUser.email
        });
      } else if (newStatus === 'suspended') {
        await createUserNotification({
          userId: applicantUid,
          title: 'Volunteer Credential Suspended',
          message: `Your volunteer credential has been suspended.${reviewNotes ? ` Reason: ${reviewNotes}` : ''} Please contact the Secretariat.`,
          type: 'volunteer',
          severity: 'critical',
          module: 'volunteer',
          actionUrl: 'volunteer',
          actionLabel: 'Contact Secretariat',
          createdBy: adminUser.email
        });
      }
    } catch (notifErr) {
      console.warn('Volunteer review notification trigger notice:', notifErr);
    }
  }

  try {
    await logAuditEvent({
      actorUid: adminUser.uid,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VOLUNTEER_APPLICATION_REVIEWED',
      targetEntity: 'volunteerApplications',
      targetId: applicationId,
      details: {
        applicantUid: applicantUid || 'unknown',
        newStatus,
        assignedVolunteerId: assignedVolunteerId || null,
        reviewNotes: reviewNotes || 'No notes provided',
        reviewedByEmail: adminUser.email,
        approvedBy: newStatus === 'approved' ? adminUser.uid : null
      }
    });
  } catch (auditErr) {
    console.warn('Audit log non-blocking error:', auditErr);
  }

  return { assignedVolunteerId };
}

// -------------------------------------------------------------
// VOLUNTEER CATEGORIES & SKILLS REPOSITORY
// -------------------------------------------------------------

export const DEFAULT_VOLUNTEER_CATEGORIES: Omit<VolunteerCategory, 'id' | 'createdAt'>[] = [
  {
    name: 'Education & Tutoring',
    code: 'EDU_TUTOR',
    description: 'Academic coaching, student mentorship, syllabus support, and remedial learning camps.',
    iconName: 'GraduationCap',
    isActive: true
  },
  {
    name: 'Healthcare & Medical Relief',
    code: 'MED_RELIEF',
    description: 'Medical camps, doctor coordination, prescription distribution, and emergency health support.',
    iconName: 'HeartHandshake',
    isActive: true
  },
  {
    name: 'Emergency & Disaster Response',
    code: 'DISASTER_RESP',
    description: 'Immediate relief deployment, ration logistics, flood/winter shelter, and rescue support.',
    iconName: 'ShieldCheck',
    isActive: true
  },
  {
    name: 'Food & Ration Distribution',
    code: 'FOOD_RATION',
    description: 'Ramadan food baskets, monthly ration distribution to underprivileged families and widows.',
    iconName: 'ShoppingBag',
    isActive: true
  },
  {
    name: 'Community Welfare & Social Work',
    code: 'COMM_WELFARE',
    description: 'Elderly assistance, orphan care, family guidance, and community surveys.',
    iconName: 'Users',
    isActive: true
  },
  {
    name: 'Legal & Rights Awareness',
    code: 'LEGAL_AID',
    description: 'Legal literacy clinics, government scheme enrollment, documentation assistance.',
    iconName: 'Landmark',
    isActive: true
  },
  {
    name: 'Digital & Media Support',
    code: 'DIGITAL_MEDIA',
    description: 'Graphic design, photography, website maintenance, livestreaming, and social media.',
    iconName: 'Smartphone',
    isActive: true
  },
  {
    name: 'Events & Logistics Coordination',
    code: 'EVENT_LOGISTICS',
    description: 'Annual conventions, prize distributions, seating, transportation, and venue setup.',
    iconName: 'Calendar',
    isActive: true
  }
];

export async function createVolunteerCategory(
  categoryData: Omit<VolunteerCategory, 'id' | 'createdAt'>,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<string> {
  const col = collection(db, 'volunteer_categories');
  const now = new Date().toISOString();
  const docRef = await addDoc(col, cleanFirestoreData({
    ...categoryData,
    createdAt: now,
    updatedAt: now
  }));

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'VOLUNTEER_CATEGORY_CREATED',
    targetEntity: 'volunteer_categories',
    targetId: docRef.id,
    details: { name: categoryData.name, code: categoryData.code }
  });

  return docRef.id;
}

export async function updateVolunteerCategory(
  categoryId: string,
  updates: Partial<VolunteerCategory>,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  const docRef = doc(db, 'volunteer_categories', categoryId);
  const now = new Date().toISOString();
  await updateDoc(docRef, {
    ...updates,
    updatedAt: now
  });

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'VOLUNTEER_CATEGORY_UPDATED',
    targetEntity: 'volunteer_categories',
    targetId: categoryId,
    details: updates
  });
}

export async function deleteVolunteerCategory(
  categoryId: string,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  const docRef = doc(db, 'volunteer_categories', categoryId);
  await deleteDoc(docRef);

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'VOLUNTEER_CATEGORY_DELETED',
    targetEntity: 'volunteer_categories',
    targetId: categoryId,
    details: { deletedAt: new Date().toISOString() }
  });
}

// -------------------------------------------------------------
// VOLUNTEER ACTIVITIES & MISSIONS REPOSITORY
// -------------------------------------------------------------

export async function createVolunteerActivity(
  activityData: Omit<VolunteerActivity, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'createdByEmail'>,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<string> {
  const col = collection(db, 'volunteer_activities');
  const now = new Date().toISOString();

  const payload: Omit<VolunteerActivity, 'id'> = {
    ...activityData,
    assignedVolunteerIds: activityData.assignedVolunteerIds || [],
    assignedVolunteerNames: activityData.assignedVolunteerNames || [],
    enrolledVolunteerIds: activityData.enrolledVolunteerIds || [],
    status: activityData.status || 'upcoming',
    hoursCredit: activityData.hoursCredit || 4,
    createdByUid: adminUser.uid,
    createdByEmail: adminUser.email,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(col, cleanFirestoreData(payload));

  // Notify assigned volunteers if any
  if (activityData.assignedVolunteerIds && activityData.assignedVolunteerIds.length > 0) {
    for (const vUid of activityData.assignedVolunteerIds) {
      try {
        await createUserNotification({
          userId: vUid,
          title: `New Mission Assignment: ${activityData.title}`,
          message: `You have been assigned to volunteer activity "${activityData.title}" on ${activityData.date} at ${activityData.location}.`,
          type: 'volunteer',
          severity: 'info',
          module: 'volunteer',
          actionUrl: 'volunteer',
          actionLabel: 'View Mission',
          createdBy: adminUser.email
        });
      } catch (notifErr) {
        console.warn('Volunteer assignment notification note:', notifErr);
      }
    }
  }

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'VOLUNTEER_ACTIVITY_CREATED',
    targetEntity: 'volunteer_activities',
    targetId: docRef.id,
    details: { title: activityData.title, date: activityData.date, category: activityData.category }
  });

  return docRef.id;
}

export async function updateVolunteerActivity(
  activityId: string,
  updates: Partial<VolunteerActivity>,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  const docRef = doc(db, 'volunteer_activities', activityId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...updates,
    updatedAt: now
  });

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'VOLUNTEER_ACTIVITY_UPDATED',
    targetEntity: 'volunteer_activities',
    targetId: activityId,
    details: { updatedFields: Object.keys(updates) }
  });
}

export async function deleteVolunteerActivity(
  activityId: string,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  const docRef = doc(db, 'volunteer_activities', activityId);
  await deleteDoc(docRef);

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'VOLUNTEER_ACTIVITY_DELETED',
    targetEntity: 'volunteer_activities',
    targetId: activityId,
    details: { deletedAt: new Date().toISOString() }
  });
}

export async function enrollInVolunteerActivity(
  activityId: string,
  volunteer: { uid: string; email: string; name: string }
): Promise<void> {
  const docRef = doc(db, 'volunteer_activities', activityId);
  const actSnap = await getDoc(docRef);
  if (!actSnap.exists()) throw new Error('Activity not found');

  const actData = actSnap.data() as VolunteerActivity;
  const currentEnrolled = actData.enrolledVolunteerIds || [];

  if (!currentEnrolled.includes(volunteer.uid)) {
    const updated = [...currentEnrolled, volunteer.uid];
    await updateDoc(docRef, {
      enrolledVolunteerIds: updated,
      updatedAt: new Date().toISOString()
    });

    await createUserNotification({
      userId: volunteer.uid,
      title: 'Enrolled in Mission',
      message: `You have successfully enrolled in "${actData.title}" on ${actData.date}. Please arrive at ${actData.location} on time.`,
      type: 'volunteer',
      severity: 'success',
      module: 'volunteer',
      actionUrl: 'volunteer',
      actionLabel: 'View Details'
    });
  }
}

export async function unenrollFromVolunteerActivity(
  activityId: string,
  volunteerUid: string
): Promise<void> {
  const docRef = doc(db, 'volunteer_activities', activityId);
  const actSnap = await getDoc(docRef);
  if (!actSnap.exists()) throw new Error('Activity not found');

  const actData = actSnap.data() as VolunteerActivity;
  const currentEnrolled = actData.enrolledVolunteerIds || [];
  const updated = currentEnrolled.filter(id => id !== volunteerUid);

  await updateDoc(docRef, {
    enrolledVolunteerIds: updated,
    updatedAt: new Date().toISOString()
  });
}

// -------------------------------------------------------------
// VOLUNTEER SERVICE LOGS & HOURS REPOSITORY
// -------------------------------------------------------------

export async function logVolunteerHours(
  recordData: Omit<VolunteerServiceRecord, 'id' | 'createdAt' | 'status'>,
  volunteerUser: { uid: string; email: string }
): Promise<string> {
  const col = collection(db, 'volunteer_history');
  const now = new Date().toISOString();

  const payload: Omit<VolunteerServiceRecord, 'id'> = {
    ...recordData,
    volunteerUid: volunteerUser.uid,
    volunteerEmail: volunteerUser.email,
    status: 'pending_verification',
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(col, cleanFirestoreData(payload));

  await logAuditEvent({
    actorUid: volunteerUser.uid,
    actorEmail: volunteerUser.email,
    actorRole: 'volunteer',
    action: 'VOLUNTEER_HOURS_LOGGED',
    targetEntity: 'volunteer_history',
    targetId: docRef.id,
    details: {
      activityTitle: recordData.activityTitle,
      hoursServed: recordData.hoursServed,
      date: recordData.date
    }
  });

  return docRef.id;
}

export async function verifyVolunteerServiceHours(
  recordId: string,
  newStatus: VolunteerServiceStatus,
  adminNotes: string,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  const docRef = doc(db, 'volunteer_history', recordId);
  const now = new Date().toISOString();

  const recSnap = await getDoc(docRef);
  const recData = recSnap.exists() ? (recSnap.data() as VolunteerServiceRecord) : null;

  const updates: Partial<VolunteerServiceRecord> = {
    status: newStatus,
    adminNotes,
    verifiedByUid: adminUser.uid,
    verifiedByEmail: adminUser.email,
    verifiedAt: now,
    updatedAt: now
  };

  if (newStatus === 'approved') {
    updates.certificateIssued = true;
    updates.certificateId = `FET-CERT-VOL-${new Date().getFullYear()}-${recordId.slice(0, 6).toUpperCase()}`;
  }

  await updateDoc(docRef, updates);

  // Notify volunteer
  if (recData?.volunteerUid) {
    try {
      await createUserNotification({
        userId: recData.volunteerUid,
        title: newStatus === 'approved' ? 'Volunteer Service Hours Approved!' : 'Volunteer Log Update',
        message: newStatus === 'approved'
          ? `Your logged ${recData.hoursServed} hours for "${recData.activityTitle}" have been verified and credited to your service record.`
          : `Your service log for "${recData.activityTitle}" was marked as ${newStatus}.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
        type: 'volunteer',
        severity: newStatus === 'approved' ? 'success' : 'warning',
        module: 'volunteer',
        actionUrl: 'volunteer',
        actionLabel: 'View Service Record',
        createdBy: adminUser.email
      });
    } catch (notifErr) {
      console.warn('Volunteer log notification notice:', notifErr);
    }
  }

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'VOLUNTEER_HOURS_VERIFIED',
    targetEntity: 'volunteer_history',
    targetId: recordId,
    details: { newStatus, adminNotes, recordId }
  });
}

export { verifyVolunteerServiceHours as verifyVolunteerServiceLog };

export async function deleteVolunteerServiceRecord(
  recordId: string,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  const docRef = doc(db, 'volunteer_history', recordId);
  await deleteDoc(docRef);

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'VOLUNTEER_RECORD_DELETED',
    targetEntity: 'volunteer_history',
    targetId: recordId,
    details: { deletedAt: new Date().toISOString() }
  });
}

// -------------------------------------------------------------
// COMMUNITY GROUPS & CHAPTERS REPOSITORY
// -------------------------------------------------------------

export const DEFAULT_COMMUNITY_GROUPS: Omit<CommunityGroup, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Kashmir Educational & Youth Volunteer Chapter',
    code: 'FET-GRP-KMR-01',
    description: 'Regional volunteer collective for Srinagar, Anantnag, and Baramulla educational coaching and winter relief.',
    category: 'Education & Tutoring',
    region: 'Jammu & Kashmir',
    leaderName: 'Er. Tariq Ahmad Khan',
    leaderEmail: 'tariq.kashmir@fetindia.org',
    leaderPhone: '+91 94190 12345',
    memberVolunteerIds: [],
    status: 'active'
  },
  {
    name: 'Delhi NCR Medical Relief & Aid Circle',
    code: 'FET-GRP-DEL-01',
    description: 'Volunteer corps coordinating hospital navigation, emergency blood donation, and slum health camps in Delhi NCR.',
    category: 'Healthcare & Medical Relief',
    region: 'Delhi NCR',
    leaderName: 'Dr. Farah Naqvi',
    leaderEmail: 'farah.delhi@fetindia.org',
    leaderPhone: '+91 98110 56789',
    memberVolunteerIds: [],
    status: 'active'
  },
  {
    name: 'Mumbai & Konkan Student Welfare Corps',
    code: 'FET-GRP-MUM-01',
    description: 'Mentorship, higher education guidance, and career counseling wing for Maharashtra youth.',
    category: 'Education & Tutoring',
    region: 'Maharashtra',
    leaderName: 'Syed Ali Reza',
    leaderEmail: 'mumbai.wing@fetindia.org',
    leaderPhone: '+91 98200 45678',
    memberVolunteerIds: [],
    status: 'active'
  },
  {
    name: 'Bangalore Tech & Digital Support Team',
    code: 'FET-GRP-BLR-01',
    description: 'IT professionals supporting online classes, trust portal development, and student coding workshops.',
    category: 'Digital & Media Support',
    region: 'Karnataka',
    leaderName: 'Zehra Fatima',
    leaderEmail: 'tech.blr@fetindia.org',
    leaderPhone: '+91 99000 87654',
    memberVolunteerIds: [],
    status: 'active'
  }
];

export async function createCommunityGroup(
  groupData: Omit<CommunityGroup, 'id' | 'createdAt' | 'updatedAt'>,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<string> {
  const col = collection(db, 'community_groups');
  const now = new Date().toISOString();

  const payload: Omit<CommunityGroup, 'id'> = {
    ...groupData,
    memberVolunteerIds: groupData.memberVolunteerIds || [],
    memberVolunteerNames: groupData.memberVolunteerNames || [],
    status: groupData.status || 'active',
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(col, cleanFirestoreData(payload));

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'COMMUNITY_GROUP_CREATED',
    targetEntity: 'community_groups',
    targetId: docRef.id,
    details: { name: groupData.name, code: groupData.code, region: groupData.region }
  });

  return docRef.id;
}

export async function updateCommunityGroup(
  groupId: string,
  updates: Partial<CommunityGroup>,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  const docRef = doc(db, 'community_groups', groupId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...updates,
    updatedAt: now
  });

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'COMMUNITY_GROUP_UPDATED',
    targetEntity: 'community_groups',
    targetId: groupId,
    details: { updatedFields: Object.keys(updates) }
  });
}

export async function deleteCommunityGroup(
  groupId: string,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  const docRef = doc(db, 'community_groups', groupId);
  await deleteDoc(docRef);

  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: 'COMMUNITY_GROUP_DELETED',
    targetEntity: 'community_groups',
    targetId: groupId,
    details: { deletedAt: new Date().toISOString() }
  });
}

export async function assignVolunteerToCommunityGroup(
  groupId: string,
  volunteerUid: string,
  volunteerName: string,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  const docRef = doc(db, 'community_groups', groupId);
  const groupSnap = await getDoc(docRef);
  if (!groupSnap.exists()) throw new Error('Community Group not found');

  const groupData = groupSnap.data() as CommunityGroup;
  const currentMembers = groupData.memberVolunteerIds || [];
  const currentNames = groupData.memberVolunteerNames || [];

  if (!currentMembers.includes(volunteerUid)) {
    const updatedMembers = [...currentMembers, volunteerUid];
    const updatedNames = [...currentNames, volunteerName];

    await updateDoc(docRef, {
      memberVolunteerIds: updatedMembers,
      memberVolunteerNames: updatedNames,
      updatedAt: new Date().toISOString()
    });

    // Also update volunteer's profile
    try {
      const userRef = doc(db, 'users', volunteerUid);
      await updateDoc(userRef, {
        communityGroupId: groupId,
        communityGroupName: groupData.name,
        updatedAt: new Date().toISOString()
      });
    } catch (uErr) {
      console.warn('User group sync note:', uErr);
    }

    // Send notification
    try {
      await createUserNotification({
        userId: volunteerUid,
        title: `Inducted into ${groupData.name}`,
        message: `You have been assigned to the "${groupData.name}" community chapter led by ${groupData.leaderName}.`,
        type: 'volunteer',
        severity: 'info',
        module: 'volunteer',
        actionUrl: 'volunteer',
        actionLabel: 'View Chapter',
        createdBy: adminUser.email
      });
    } catch (notifErr) {
      console.warn('Group induction notification note:', notifErr);
    }

    await logAuditEvent({
      actorUid: adminUser.uid,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'VOLUNTEER_ASSIGNED_TO_GROUP',
      targetEntity: 'community_groups',
      targetId: groupId,
      details: { volunteerUid, volunteerName, groupName: groupData.name }
    });
  }
}

// -------------------------------------------------------------
// MEMBERSHIP APPLICATIONS REPOSITORY
// -------------------------------------------------------------

export async function submitMembershipApplication(
  applicationData: Omit<MembershipApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  user: { uid: string; email: string }
): Promise<string> {
  const memberCol = collection(db, 'membershipApplications');
  const now = new Date().toISOString();

  // Create document in membershipApplications collection linked to applicantUid
  const docRef = await addDoc(memberCol, cleanFirestoreData({
    ...applicationData,
    applicantUid: user.uid,
    applicantEmail: user.email,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  }));

  // Update user's membershipStatus to 'pending'
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      membershipStatus: 'pending',
      updatedAt: now
    });
  } catch (syncErr) {
    console.warn('Membership status sync note:', syncErr);
  }

  // Trigger in-app notification to applicant
  try {
    await createUserNotification({
      userId: user.uid,
      userEmail: user.email,
      title: 'Membership Application Submitted',
      message: 'Your General Membership application has been received and queued for central secretariat verification. You will be notified once reviewed.',
      type: 'membership',
      severity: 'info',
      module: 'membership',
      actionUrl: 'membership',
      actionLabel: 'Track Membership'
    });
  } catch (notifErr) {
    console.warn('Membership submission notification notice:', notifErr);
  }

  try {
    await logAuditEvent({
      actorUid: user.uid,
      actorEmail: user.email,
      actorRole: 'user',
      action: 'MEMBERSHIP_APPLICATION_SUBMITTED',
      targetEntity: 'membershipApplications',
      targetId: docRef.id,
      details: {
        fullLegalName: applicationData.fullLegalName,
        membershipType: applicationData.membershipType,
        state: applicationData.state,
        district: applicationData.district
      }
    });
  } catch (auditErr) {
    console.warn('Audit log non-blocking notice:', auditErr);
  }

  return docRef.id;
}

export async function updateMembershipApplication(
  applicationId: string,
  applicationData: Partial<Omit<MembershipApplication, 'id' | 'applicantUid' | 'status' | 'reviewedByUid' | 'reviewedByEmail' | 'reviewedAt' | 'reviewNotes'>>,
  user: { uid: string; email: string }
): Promise<void> {
  const docRef = doc(db, 'membershipApplications', applicationId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...applicationData,
    updatedAt: now
  });

  try {
    await logAuditEvent({
      actorUid: user.uid,
      actorEmail: user.email,
      actorRole: 'user',
      action: 'MEMBERSHIP_APPLICATION_UPDATED',
      targetEntity: 'membershipApplications',
      targetId: applicationId,
      details: {
        updatedFields: Object.keys(applicationData)
      }
    });
  } catch (auditErr) {
    console.warn('Audit log non-blocking notice:', auditErr);
  }
}

export async function adminReviewMembershipApplication(
  applicationId: string,
  applicantUid: string | undefined,
  newStatus: MembershipApplicationStatus,
  reviewNotes: string,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  if (!applicationId) {
    throw new Error('Application document ID is required for review.');
  }

  const docRef = doc(db, 'membershipApplications', applicationId);
  const now = new Date().toISOString();

  let assignedMembershipId: string | undefined = undefined;
  if (newStatus === 'approved') {
    const existingMbrSnap = await getDoc(docRef);
    const existingMbrData = existingMbrSnap.exists() ? (existingMbrSnap.data() as MembershipApplication) : null;
    if (existingMbrData?.membershipIdAssigned) {
      assignedMembershipId = existingMbrData.membershipIdAssigned;
    } else {
      assignedMembershipId = await getNextSequentialMemberId();
    }
  }

  const updatePayload: Partial<MembershipApplication> = {
    status: newStatus,
    reviewNotes: reviewNotes || '',
    reviewedByUid: adminUser.uid,
    reviewedByEmail: adminUser.email,
    approvedBy: newStatus === 'approved' ? adminUser.uid : undefined,
    membershipIdAssigned: assignedMembershipId,
    reviewedAt: now,
    updatedAt: now
  };

  // Perform document update in Firestore
  await updateDoc(docRef, updatePayload);

  // Sync applicant's membershipStatus and roles in Firestore
  if (applicantUid) {
    try {
      const userRef = doc(db, 'users', applicantUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        const currentRoles = userData.roles || (userData.role ? [userData.role as UserRole] : ['user']);
        const userUpdates: Partial<UserProfile> = {
          updatedAt: now
        };

        if (newStatus === 'approved') {
          userUpdates.membershipStatus = 'general_member';
          userUpdates.membershipApprovedAt = now;
          userUpdates.membershipIssueDate = now.split('T')[0];
          userUpdates.membershipValidUntil = 'AY 2026-2027';
          if (!currentRoles.includes('member')) {
            userUpdates.roles = [...currentRoles, 'member' as UserRole];
          }
          const finalMemberId = userData.membershipId || assignedMembershipId;
          if (!userData.membershipId) {
            userUpdates.membershipId = assignedMembershipId;
          }

          // Sync public verification record for QR verification
          if (finalMemberId) {
            try {
              await setDoc(doc(db, 'public_memberships', finalMemberId), {
                memberId: finalMemberId,
                fullName: userData.fullLegalName || userData.fullName || userData.displayName || 'FET India Member',
                membershipType: 'general_member',
                membershipStatus: 'general_member',
                approvedAt: now,
                issueDate: now.split('T')[0],
                validUntil: 'AY 2026-2027',
                trustName: 'Fatimyah Educational Trust',
                isVerified: true,
                verifiedAt: now
              }, { merge: true });
            } catch (qrSyncErr) {
              console.warn('Public membership QR sync notice:', qrSyncErr);
            }
          }
        } else if (newStatus === 'under_review') {
          userUpdates.membershipStatus = 'under_review';
        } else if (newStatus === 'rejected') {
          userUpdates.membershipStatus = 'rejected';
        }

        await updateDoc(userRef, userUpdates);
      }
    } catch (roleErr) {
      console.warn('Membership status sync non-blocking error:', roleErr);
    }

    // Trigger in-app notification to applicant regarding membership review
    try {
      if (newStatus === 'approved') {
        await createUserNotification({
          userId: applicantUid,
          title: 'Membership Application Approved!',
          message: `Congratulations! Your FET India General Membership application has been approved. Your official Membership ID (${assignedMembershipId || 'Assigned'}) and Digital Card are now active.`,
          type: 'membership',
          severity: 'success',
          module: 'membership',
          actionUrl: 'membership',
          actionLabel: 'View Digital Member ID',
          createdBy: adminUser.email
        });
      } else if (newStatus === 'under_review') {
        await createUserNotification({
          userId: applicantUid,
          title: 'Membership Application Under Review',
          message: 'Your General Membership application is currently under formal verification by the FET India central secretariat committee.',
          type: 'membership',
          severity: 'info',
          module: 'membership',
          actionUrl: 'applications',
          actionLabel: 'View Applications',
          createdBy: adminUser.email
        });
      } else if (newStatus === 'rejected') {
        await createUserNotification({
          userId: applicantUid,
          title: 'Membership Application Status Update',
          message: `Your membership application was reviewed and could not be approved at this time.${reviewNotes ? ` Notes: ${reviewNotes}` : ''}`,
          type: 'membership',
          severity: 'warning',
          module: 'membership',
          actionUrl: 'applications',
          actionLabel: 'View Applications',
          createdBy: adminUser.email
        });
      }
    } catch (notifErr) {
      console.warn('Membership review notification trigger notice:', notifErr);
    }
  }

  try {
    await logAuditEvent({
      actorUid: adminUser.uid,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'MEMBERSHIP_APPLICATION_REVIEWED',
      targetEntity: 'membershipApplications',
      targetId: applicationId,
      details: {
        applicantUid: applicantUid || 'unknown',
        newStatus,
        reviewNotes: reviewNotes || 'No notes provided',
        reviewedByEmail: adminUser.email,
        approvedBy: newStatus === 'approved' ? adminUser.uid : null,
        membershipIdAssigned: assignedMembershipId || null
      }
    });
  } catch (auditErr) {
    console.warn('Audit log non-blocking error:', auditErr);
  }
}


export async function submitDonorApplication(
  applicationData: Omit<DonorApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  user: { uid: string; email: string }
): Promise<string> {
  const donorCol = collection(db, 'donorApplications');
  const now = new Date().toISOString();

  // Create document in donorApplications collection linked to applicantUid
  const docRef = await addDoc(donorCol, cleanFirestoreData({
    ...applicationData,
    applicantUid: user.uid,
    applicantEmail: user.email,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  }));

  // Sync user profile donorStatus to 'pending' without touching other statuses
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      donorStatus: 'pending',
      updatedAt: now
    });
  } catch (userErr) {
    console.warn('Donor status user sync notice:', userErr);
  }

  // Trigger in-app notification to applicant
  try {
    await createUserNotification({
      userId: user.uid,
      userEmail: user.email,
      title: 'Donor Profile Application Submitted',
      message: 'Thank you for your charitable commitment. Your donor profile application has been received by the accounts secretariat.',
      type: 'donor',
      severity: 'info',
      module: 'donor',
      actionUrl: 'donor',
      actionLabel: 'Track Status'
    });
  } catch (notifErr) {
    console.warn('Donor application notification notice:', notifErr);
  }

  try {
    await logAuditEvent({
      actorUid: user.uid,
      actorEmail: user.email,
      actorRole: 'member',
      action: 'DONOR_APPLICATION_SUBMITTED',
      targetEntity: 'donorApplications',
      targetId: docRef.id,
      details: {
        fullLegalName: applicationData.fullLegalName,
        donorType: applicationData.donorType,
        state: applicationData.state,
        district: applicationData.district,
        areasOfSupport: applicationData.areasOfSupport,
        preferredFrequency: applicationData.preferredFrequency
      }
    });
  } catch (auditErr) {
    console.warn('Audit log non-blocking notice:', auditErr);
  }

  return docRef.id;
}

export async function updateDonorApplication(
  applicationId: string,
  applicationData: Partial<Omit<DonorApplication, 'id' | 'applicantUid' | 'status' | 'reviewedByUid' | 'reviewedByEmail' | 'reviewedAt' | 'reviewNotes'>>,
  user: { uid: string; email: string }
): Promise<void> {
  const docRef = doc(db, 'donorApplications', applicationId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...applicationData,
    updatedAt: now
  });

  try {
    await logAuditEvent({
      actorUid: user.uid,
      actorEmail: user.email,
      actorRole: 'member',
      action: 'DONOR_APPLICATION_UPDATED',
      targetEntity: 'donorApplications',
      targetId: applicationId,
      details: {
        updatedFields: Object.keys(applicationData)
      }
    });
  } catch (auditErr) {
    console.warn('Audit log non-blocking notice:', auditErr);
  }
}

export async function adminReviewDonorApplication(
  applicationId: string,
  applicantUid: string | undefined,
  newStatus: DonorApplicationStatus,
  reviewNotes: string,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<{ assignedDonorId?: string }> {
  if (!applicationId) {
    throw new Error('Application document ID is required for review.');
  }

  const docRef = doc(db, 'donorApplications', applicationId);
  const now = new Date().toISOString();
  let assignedDonorId: string | undefined = undefined;

  // 1. Fetch current application document to retain existing ID if already assigned
  const appSnap = await getDoc(docRef);
  const existingAppData = appSnap.exists() ? (appSnap.data() as DonorApplication) : null;

  if (newStatus === 'approved') {
    if (existingAppData?.donorIdAssigned) {
      assignedDonorId = existingAppData.donorIdAssigned;
    } else {
      assignedDonorId = await getNextSequentialDonorId();
    }
  }

  const updatePayload: Partial<DonorApplication> = {
    status: newStatus,
    reviewNotes: reviewNotes || '',
    reviewedByUid: adminUser.uid,
    reviewedByEmail: adminUser.email,
    reviewedAt: now,
    updatedAt: now
  };

  if (newStatus === 'approved') {
    updatePayload.approvedBy = adminUser.uid;
    updatePayload.approvedAt = now;
    if (assignedDonorId) {
      updatePayload.donorIdAssigned = assignedDonorId;
    }
  }

  // Perform document update in Firestore
  await updateDoc(docRef, updatePayload);

  // Sync applicant's donorStatus and roles in Firestore while strictly preserving independent statuses
  if (applicantUid) {
    try {
      const userRef = doc(db, 'users', applicantUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        const currentRoles = userData.roles || (userData.role ? [userData.role as UserRole] : ['user']);
        const userUpdates: Partial<UserProfile> = {
          updatedAt: now
        };

        if (newStatus === 'approved') {
          userUpdates.donorStatus = 'approved';
          userUpdates.donorId = assignedDonorId || userData.donorId;
          userUpdates.donorApprovedAt = now;
          userUpdates.donorApprovedBy = adminUser.uid;
          userUpdates.donorApprovedByEmail = adminUser.email;
          if (existingAppData) {
            userUpdates.donorType = existingAppData.donorType;
            userUpdates.donorAreasOfSupport = existingAppData.areasOfSupport || [];
            userUpdates.donorPreferredFrequency = existingAppData.preferredFrequency;
          }
          if (!currentRoles.includes('donor')) {
            userUpdates.roles = [...currentRoles, 'donor' as UserRole];
          }
        } else if (newStatus === 'under_review') {
          userUpdates.donorStatus = 'under_review';
        } else if (newStatus === 'rejected') {
          userUpdates.donorStatus = 'rejected';
        }

        // Strictly preserve membershipStatus, volunteerStatus, accountStatus
        await updateDoc(userRef, userUpdates);
      }
    } catch (roleErr) {
      console.warn('Donor status sync non-blocking error:', roleErr);
    }
    // Trigger in-app notification to applicant regarding donor application review
    try {
      if (newStatus === 'approved') {
        await createUserNotification({
          userId: applicantUid,
          title: 'Donor Status Approved & Patron ID Issued',
          message: `Your donor enrollment has been approved. Your 80G Patron ID (${assignedDonorId || 'Issued'}) and official Digital Donor Card are now active.`,
          type: 'donor',
          severity: 'success',
          module: 'donor',
          actionUrl: 'donor',
          actionLabel: 'View Donor Card',
          createdBy: adminUser.email
        });
      } else if (newStatus === 'under_review') {
        await createUserNotification({
          userId: applicantUid,
          title: 'Donor Application Under Review',
          message: 'Your donor profile application is under verification by the finance and treasury desk.',
          type: 'donor',
          severity: 'info',
          module: 'donor',
          actionUrl: 'applications',
          actionLabel: 'View Applications',
          createdBy: adminUser.email
        });
      } else if (newStatus === 'rejected') {
        await createUserNotification({
          userId: applicantUid,
          title: 'Donor Application Status Update',
          message: `Your donor application was reviewed and could not be approved at this time.${reviewNotes ? ` Notes: ${reviewNotes}` : ''}`,
          type: 'donor',
          severity: 'warning',
          module: 'donor',
          actionUrl: 'applications',
          actionLabel: 'View Details',
          createdBy: adminUser.email
        });
      }
    } catch (notifErr) {
      console.warn('Donor review notification trigger notice:', notifErr);
    }
  }

  // Sync public donor verification record for safe accreditation verification
  if (newStatus === 'approved' && assignedDonorId) {
    try {
      const donorName = existingAppData?.fullLegalName || 'FET India Patron';
      await setDoc(doc(db, 'public_donors', assignedDonorId), {
        donorId: assignedDonorId,
        fullName: donorName,
        donorType: existingAppData?.donorType === 'organization' ? (existingAppData.organizationName || 'Organization') : 'Individual',
        donorStatus: 'approved',
        trustName: 'Fatimyah Educational Trust',
        isVerified: true,
        verifiedAt: now,
        approvedAt: now,
        issueDate: now.split('T')[0],
        validUntil: 'AY 2026-2027'
      }, { merge: true });
    } catch (qrErr) {
      console.warn('Public donor QR sync non-blocking notice:', qrErr);
    }
  }

  try {
    await logAuditEvent({
      actorUid: adminUser.uid,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'DONOR_APPLICATION_REVIEWED',
      targetEntity: 'donorApplications',
      targetId: applicationId,
      details: {
        applicantUid: applicantUid || 'unknown',
        newStatus,
        reviewNotes: reviewNotes || 'No notes provided',
        reviewedByEmail: adminUser.email,
        approvedBy: newStatus === 'approved' ? adminUser.uid : null,
        donorIdAssigned: assignedDonorId || null
      }
    });
  } catch (auditErr) {
    console.warn('Audit log non-blocking error:', auditErr);
  }

  return { assignedDonorId };
}

/**
 * Promote an approved General Member to Core Member (Super Admin Clearance Only)
 */
export async function promoteMemberToCoreMember(
  memberUid: string,
  promotionNote: string,
  adminUser: { uid: string; email: string; role: UserRole }
): Promise<void> {
  if (!memberUid) {
    throw new Error('Member UID is required for Core Member promotion.');
  }

  const userRef = doc(db, 'users', memberUid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('Target user account not found in database.');
  }

  const userData = userSnap.data() as UserProfile;
  const now = new Date().toISOString();

  // Preserve all independent statuses: volunteerStatus, donorStatus, accountStatus
  // Do NOT modify technical RBAC roles (Technical roles and organizational membership status must remain separate)
  const userUpdates: Partial<UserProfile> = {
    membershipStatus: 'core_member',
    promotedAt: now,
    promotedBy: adminUser.uid,
    promotedByEmail: adminUser.email,
    promotionNote: promotionNote ? promotionNote.trim() : '',
    updatedAt: now
  };

  await updateDoc(userRef, userUpdates);

  // Trigger in-app notification to the promoted member
  try {
    await createUserNotification({
      userId: memberUid,
      userEmail: userData.email,
      title: 'Promoted to Core Member!',
      message: `Congratulations! You have been elevated to Core Member of Fatimyah Educational Trust India with full institutional voting and trust convocation delegation privileges.${promotionNote ? ` Note: ${promotionNote}` : ''}`,
      type: 'membership',
      severity: 'success',
      module: 'membership',
      actionUrl: 'membership',
      actionLabel: 'View Core Status',
      createdBy: adminUser.email
    });
  } catch (notifErr) {
    console.warn('Core member promotion notification trigger notice:', notifErr);
  }

  // Sync public verification record (preserves same member ID, updates status to Core Member)
  const existingMemberId = userData.membershipId || `FET-MBR-${new Date().getFullYear()}-${memberUid.slice(0, 4).toUpperCase()}`;
  try {
    await setDoc(doc(db, 'public_memberships', existingMemberId), {
      memberId: existingMemberId,
      fullName: userData.fullLegalName || userData.fullName || userData.displayName || 'FET India Member',
      membershipType: 'core_member',
      membershipStatus: 'core_member',
      approvedAt: userData.membershipApprovedAt || userData.createdAt || now,
      issueDate: userData.membershipIssueDate || now.split('T')[0],
      validUntil: userData.membershipValidUntil || 'AY 2026-2027',
      trustName: 'Fatimyah Educational Trust',
      isVerified: true,
      verifiedAt: now
    }, { merge: true });
  } catch (qrSyncErr) {
    console.warn('Public core membership QR sync notice:', qrSyncErr);
  }

  try {
    await logAuditEvent({
      actorUid: adminUser.uid,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'CORE_MEMBER_PROMOTED',
      targetEntity: 'users',
      targetId: memberUid,
      details: {
        memberUid,
        memberEmail: userData.email,
        memberName: userData.fullLegalName || userData.displayName || 'Unknown',
        memberId: existingMemberId,
        previousMembershipStatus: userData.membershipStatus || 'general_member',
        newMembershipStatus: 'core_member',
        promotedAt: now,
        promotedByUid: adminUser.uid,
        promotedByEmail: adminUser.email,
        promotionNote: promotionNote ? promotionNote.trim() : 'No internal note provided'
      }
    });
  } catch (auditErr) {
    console.warn('Audit log non-blocking error:', auditErr);
  }
}

/**
 * Public Membership Verification Record Sync
 */
export async function syncPublicMembershipRecord(data: PublicMembershipVerification): Promise<void> {
  if (!data.memberId) return;
  const docRef = doc(db, 'public_memberships', data.memberId);
  await setDoc(docRef, {
    ...data,
    verifiedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Reference Demo Registry for Sample Cards & Instant Accreditation Verification
 */
const REFERENCE_VERIFICATION_RECORDS: Record<string, PublicMembershipVerification | PublicDonorVerification | PublicVolunteerVerification | PublicCertificateRecord> = {
  'FET-CERT-CMP-2026-0001': {
    certificateId: 'FET-CERT-CMP-2026-0001',
    recipientName: 'Ayaan Ahmed',
    competitionTitle: 'All India Book Reading & Comprehension Challenge 2026',
    category: 'book_reading',
    achievementTitle: 'National 1st Rank Holder',
    rank: 1,
    score: 98,
    totalMarks: 100,
    grade: 'A+',
    issueDate: '2026-02-15',
    institution: 'Al-Hadi International School',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    status: 'valid',
    isVerified: true,
    trustName: 'Fatimyah Educational Trust',
    verifiedAt: new Date().toISOString()
  } as PublicCertificateRecord,
  'FET-CERT-BK-2026-0101': {
    certificateId: 'FET-CERT-BK-2026-0101',
    recipientName: 'Fatima Zehra',
    competitionTitle: 'National Islamic Heritage & Book Reading Competition',
    category: 'book_reading',
    achievementTitle: 'Certificate of Merit',
    rank: 4,
    score: 91,
    totalMarks: 100,
    grade: 'A',
    issueDate: '2026-02-18',
    institution: 'Imamia Model Academy',
    district: 'Hyderabad',
    state: 'Telangana',
    status: 'valid',
    isVerified: true,
    trustName: 'Fatimyah Educational Trust',
    verifiedAt: new Date().toISOString()
  } as PublicCertificateRecord,
  'FET-CERT-STEM-2026-0042': {
    certificateId: 'FET-CERT-STEM-2026-0042',
    recipientName: 'Syed Rayan Rizvi',
    competitionTitle: 'All India STEM & Mathematics Olympiad 2026',
    category: 'stem_olympiad',
    achievementTitle: 'National 2nd Rank Holder',
    rank: 2,
    score: 95,
    totalMarks: 100,
    grade: 'A+',
    issueDate: '2026-02-20',
    institution: 'St. Mary High School',
    district: 'Mumbai',
    state: 'Maharashtra',
    status: 'valid',
    isVerified: true,
    trustName: 'Fatimyah Educational Trust',
    verifiedAt: new Date().toISOString()
  } as PublicCertificateRecord,
  'FET-CERT-REVOKED-0099': {
    certificateId: 'FET-CERT-REVOKED-0099',
    recipientName: 'Zubair Qureshi (Sample Audit)',
    competitionTitle: 'National Essay Writing Competition 2026',
    category: 'essay_writing',
    achievementTitle: 'Certificate of Participation',
    issueDate: '2026-01-10',
    institution: 'Public Higher Secondary School',
    district: 'Patna',
    state: 'Bihar',
    status: 'revoked',
    isVerified: false,
    trustName: 'Fatimyah Educational Trust',
    revokedAt: '2026-02-01T10:00:00.000Z',
    revokedByEmail: 'controller@fetindia.com',
    revocationReason: 'Credential cancelled following disciplinary scrutiny for plagiarism in submitted essay.',
    verifiedAt: new Date().toISOString()
  } as PublicCertificateRecord,
  'FET-MB-2025-0158': {
    memberId: 'FET-MB-2025-0158',
    fullName: 'MOHAMMAD AHSAN',
    membershipType: 'general_member',
    membershipStatus: 'general_member',
    issueDate: '15 JAN 2025',
    validUntil: '14 JAN 2026',
    trustName: 'Fatimyah Educational Trust',
    isVerified: true,
    verifiedAt: new Date().toISOString()
  } as PublicMembershipVerification,
  'FET-VOL-2025-0067': {
    volunteerId: 'FET-VOL-2025-0067',
    fullName: 'SANA FATIMA',
    volunteerRole: 'EDUCATION VOLUNTEER',
    volunteerWing: 'Education Wing',
    volunteerStatus: 'approved',
    issueDate: '10 FEB 2025',
    validUntil: '09 FEB 2026',
    trustName: 'Fatimyah Educational Trust',
    isVerified: true,
    verifiedAt: new Date().toISOString()
  } as PublicVolunteerVerification,
  'FET-DR-2025-0093': {
    donorId: 'FET-DR-2025-0093',
    fullName: 'SYED IMRAN ALI',
    donorType: 'REGULAR DONOR',
    donorStatus: 'approved',
    issueDate: '20 MAR 2025',
    validUntil: '19 MAR 2026',
    trustName: 'Fatimyah Educational Trust',
    isVerified: true,
    verifiedAt: new Date().toISOString()
  } as PublicDonorVerification,
  'FET-AM-2025-0122': {
    memberId: 'FET-AM-2025-0122',
    fullName: 'DR. FAIZAN HUSSAIN',
    membershipType: 'associate_member',
    membershipStatus: 'associate_member',
    issueDate: '01 APR 2025',
    validUntil: '31 MAR 2026',
    trustName: 'Fatimyah Educational Trust',
    isVerified: true,
    verifiedAt: new Date().toISOString()
  } as PublicMembershipVerification,
  'FET-ST-2025-0211': {
    memberId: 'FET-ST-2025-0211',
    fullName: 'ALI RAZA',
    membershipType: 'student_member',
    membershipStatus: 'student_member',
    issueDate: '01 JAN 2025',
    validUntil: '31 MAR 2026',
    trustName: 'Fatimyah Educational Trust',
    isVerified: true,
    verifiedAt: new Date().toISOString()
  } as PublicMembershipVerification,
  'FET-LM-2025-0007': {
    memberId: 'FET-LM-2025-0007',
    fullName: 'HAJI ABDUL MAJID',
    membershipType: 'core_member',
    membershipStatus: 'core_member',
    issueDate: '05 JAN 2025',
    validUntil: 'LIFETIME',
    trustName: 'Fatimyah Educational Trust',
    isVerified: true,
    verifiedAt: new Date().toISOString()
  } as PublicMembershipVerification,
  'FET-SP-2025-0146': {
    memberId: 'FET-SP-2025-0146',
    fullName: 'NIDA PARVEEN',
    membershipType: 'supporter',
    membershipStatus: 'supporter',
    issueDate: '12 APR 2025',
    validUntil: '11 APR 2026',
    trustName: 'Fatimyah Educational Trust',
    isVerified: true,
    verifiedAt: new Date().toISOString()
  } as PublicMembershipVerification,
  'FET-SA-0001': {
    memberId: 'FET-SA-0001',
    fullName: 'M. FAIZ ALI KHAN',
    membershipType: 'core_member',
    membershipStatus: 'core_member',
    issueDate: '01 JAN 2025',
    validUntil: 'LIFETIME',
    trustName: 'Fatimyah Educational Trust',
    isVerified: true,
    verifiedAt: new Date().toISOString()
  } as PublicMembershipVerification,
  'FET-NM-0002': {
    memberId: 'FET-NM-0002',
    fullName: 'DR. SANA FATIMA',
    membershipType: 'core_member',
    membershipStatus: 'core_member',
    issueDate: '01 JAN 2025',
    validUntil: 'AY 2026-2027',
    trustName: 'Fatimyah Educational Trust',
    isVerified: true,
    verifiedAt: new Date().toISOString()
  } as PublicMembershipVerification
};

/**
 * Fetch Public Membership Verification (Non-sensitive accreditation data only)
 */
export async function fetchPublicMembershipVerification(
  memberId: string
): Promise<PublicMembershipVerification | null> {
  if (!memberId || !memberId.trim()) return null;
  const cleanId = memberId.trim().toUpperCase();

  try {
    // 1. Check reference seed catalog
    if (REFERENCE_VERIFICATION_RECORDS[cleanId] && ('memberId' in REFERENCE_VERIFICATION_RECORDS[cleanId])) {
      return REFERENCE_VERIFICATION_RECORDS[cleanId] as PublicMembershipVerification;
    }

    // 2. Direct lookup from public_memberships collection
    const publicRef = doc(db, 'public_memberships', cleanId);
    const publicSnap = await getDoc(publicRef);

    if (publicSnap.exists()) {
      return publicSnap.data() as PublicMembershipVerification;
    }

    // 3. Fallback lookup in users collection if authenticated
    if (auth.currentUser) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('membershipId', '==', cleanId), limit(1));
        const userDocs = await getDocs(q);

        if (!userDocs.empty) {
          const u = userDocs.docs[0].data() as UserProfile;
          const isApproved = u.membershipStatus === 'general_member' || u.membershipStatus === 'core_member';

          if (isApproved) {
            const publicRecord: PublicMembershipVerification = {
              memberId: cleanId,
              fullName: u.fullLegalName || u.fullName || u.displayName || 'FET India Accredited Member',
              membershipType: u.membershipStatus === 'core_member' ? 'core_member' : 'general_member',
              membershipStatus: u.membershipStatus === 'core_member' ? 'core_member' : 'general_member',
              approvedAt: u.membershipApprovedAt || u.promotedAt || u.createdAt,
              issueDate: u.membershipIssueDate || (u.createdAt ? u.createdAt.split('T')[0] : '2026-01-01'),
              validUntil: u.membershipValidUntil || 'AY 2026-2027',
              trustName: 'Fatimyah Educational Trust',
              isVerified: true,
              verifiedAt: new Date().toISOString()
            };

            try {
              await setDoc(doc(db, 'public_memberships', cleanId), publicRecord, { merge: true });
            } catch {
              // Non-blocking
            }

            return publicRecord;
          }
        }
      } catch {
        // Fallback user query ignored if permission not available
      }
    }

    return null;
  } catch (err) {
    console.warn('Notice in public membership verification lookup:', err);
    return null;
  }
}

/**
 * Public Volunteer Verification Record Sync
 */
export async function syncPublicVolunteerRecord(data: PublicVolunteerVerification): Promise<void> {
  if (!data.volunteerId) return;
  const docRef = doc(db, 'public_volunteers', data.volunteerId);
  await setDoc(docRef, {
    ...data,
    verifiedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Fetch Public Volunteer Verification
 */
export async function fetchPublicVolunteerVerification(
  volunteerId: string
): Promise<PublicVolunteerVerification | null> {
  if (!volunteerId || !volunteerId.trim()) return null;
  const cleanId = volunteerId.trim().toUpperCase();

  try {
    if (REFERENCE_VERIFICATION_RECORDS[cleanId] && ('volunteerId' in REFERENCE_VERIFICATION_RECORDS[cleanId])) {
      return REFERENCE_VERIFICATION_RECORDS[cleanId] as PublicVolunteerVerification;
    }

    const publicRef = doc(db, 'public_volunteers', cleanId);
    const publicSnap = await getDoc(publicRef);

    if (publicSnap.exists()) {
      return publicSnap.data() as PublicVolunteerVerification;
    }

    if (auth.currentUser) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('volunteerId', '==', cleanId), limit(1));
        const userDocs = await getDocs(q);

        if (!userDocs.empty) {
          const u = userDocs.docs[0].data() as UserProfile;
          const isApproved = u.volunteerStatus === 'approved' || u.volunteerStatus === 'active_volunteer' || u.roles?.includes('volunteer');

          if (isApproved) {
            const publicRecord: PublicVolunteerVerification = {
              volunteerId: cleanId,
              fullName: u.fullLegalName || u.fullName || u.displayName || 'FET India Official Volunteer',
              volunteerRole: (u as any).volunteerRole || 'Official Volunteer',
              volunteerWing: (u as any).volunteerDepartment || (u as any).volunteerPreferredDepartment || 'Community Wing',
              volunteerStatus: 'approved',
              trustName: 'Fatimyah Educational Trust',
              isVerified: true,
              verifiedAt: new Date().toISOString(),
              approvedAt: u.volunteerApprovedAt || u.createdAt,
              issueDate: u.volunteerApprovedAt ? u.volunteerApprovedAt.split('T')[0] : '2026-01-01',
              validUntil: 'AY 2026-2027'
            };

            try {
              await setDoc(doc(db, 'public_volunteers', cleanId), publicRecord, { merge: true });
            } catch {
              // Non-blocking
            }

            return publicRecord;
          }
        }
      } catch {
        // Non-blocking
      }
    }

    return null;
  } catch (err) {
    console.warn('Notice in public volunteer verification lookup:', err);
    return null;
  }
}

/**
 * Public Donor Verification Record Sync
 */
export async function syncPublicDonorRecord(data: PublicDonorVerification): Promise<void> {
  if (!data.donorId) return;
  const docRef = doc(db, 'public_donors', data.donorId);
  await setDoc(docRef, {
    ...data,
    verifiedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Fetch Public Donor Verification (Safe non-sensitive accreditation data only)
 */
export async function fetchPublicDonorVerification(
  donorId: string
): Promise<PublicDonorVerification | null> {
  if (!donorId || !donorId.trim()) return null;
  const cleanId = donorId.trim().toUpperCase();

  try {
    if (REFERENCE_VERIFICATION_RECORDS[cleanId] && ('donorId' in REFERENCE_VERIFICATION_RECORDS[cleanId])) {
      return REFERENCE_VERIFICATION_RECORDS[cleanId] as PublicDonorVerification;
    }

    // 1. Direct lookup from public_donors collection
    const publicRef = doc(db, 'public_donors', cleanId);
    const publicSnap = await getDoc(publicRef);

    if (publicSnap.exists()) {
      return publicSnap.data() as PublicDonorVerification;
    }

    // 2. Fallback lookup in users collection if authenticated
    if (auth.currentUser) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('donorId', '==', cleanId), limit(1));
        const userDocs = await getDocs(q);

        if (!userDocs.empty) {
          const u = userDocs.docs[0].data() as UserProfile;
          const isApproved = u.donorStatus === 'approved' || u.donorStatus === 'active_donor' || u.roles?.includes('donor');

          if (isApproved) {
            const publicRecord: PublicDonorVerification = {
              donorId: cleanId,
              fullName: u.fullLegalName || u.fullName || u.displayName || 'FET India Accredited Patron',
              donorType: u.donorType || 'Individual Patron',
              donorStatus: 'approved',
              trustName: 'Fatimyah Educational Trust',
              isVerified: true,
              verifiedAt: new Date().toISOString(),
              approvedAt: u.donorApprovedAt || u.createdAt,
              issueDate: u.donorApprovedAt ? u.donorApprovedAt.split('T')[0] : '2026-01-01',
              validUntil: 'AY 2026-2027'
            };

            try {
              await setDoc(doc(db, 'public_donors', cleanId), publicRecord, { merge: true });
            } catch {
              // Non-blocking
            }

            return publicRecord;
          }
        }
      } catch {
        // Fallback user query ignored if permission not available
      }
    }

    return null;
  } catch (err) {
    console.warn('Notice in public donor verification lookup:', err);
    return null;
  }
}

// -------------------------------------------------------------
// STEP 50 — CERTIFICATE & DOCUMENT PUBLIC VERIFICATION SYSTEM
// -------------------------------------------------------------

/**
 * Public Certificate Verification Record Sync
 */
export async function syncPublicCertificateRecord(data: PublicCertificateRecord): Promise<void> {
  if (!data.certificateId) return;
  const docRef = doc(db, 'public_certificates', data.certificateId);
  await setDoc(docRef, {
    ...data,
    status: data.status || (data.isVerified ? 'valid' : 'revoked'),
    trustName: data.trustName || 'Fatimyah Educational Trust',
    verifiedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Fetch Public Certificate Verification (Non-sensitive public credentials lookup)
 */
export async function fetchPublicCertificateVerification(
  certificateId: string
): Promise<PublicCertificateRecord | null> {
  if (!certificateId || !certificateId.trim()) return null;
  const cleanId = certificateId.trim().toUpperCase();

  try {
    // 1. Direct lookup in Reference Seed Registry
    if (REFERENCE_VERIFICATION_RECORDS[cleanId] && ('recipientName' in REFERENCE_VERIFICATION_RECORDS[cleanId])) {
      return REFERENCE_VERIFICATION_RECORDS[cleanId] as PublicCertificateRecord;
    }

    // 2. Direct lookup from public_certificates collection (unrestricted read)
    const publicRef = doc(db, 'public_certificates', cleanId);
    const publicSnap = await getDoc(publicRef);

    if (publicSnap.exists()) {
      const data = publicSnap.data() as PublicCertificateRecord;
      return {
        ...data,
        status: data.status || (data.isVerified ? 'valid' : 'revoked'),
        trustName: data.trustName || 'Fatimyah Educational Trust',
        verifiedAt: new Date().toISOString()
      };
    }

    // 3. Fallback lookup in competition_certificates collection
    try {
      const certsRef = collection(db, 'competition_certificates');
      const q = query(certsRef, where('certificateId', '==', cleanId), limit(1));
      const certSnap = await getDocs(q);

      if (!certSnap.empty) {
        const cert = certSnap.docs[0].data() as CompetitionCertificateRecord;
        const isRevoked = cert.status === 'revoked';
        const isExpired = cert.status === 'expired';
        const status = isRevoked ? 'revoked' : isExpired ? 'expired' : 'valid';

        const publicRecord: PublicCertificateRecord = {
          certificateId: cleanId,
          recipientName: cert.participantName || 'Academic Participant',
          competitionTitle: cert.competitionTitle || 'Academic Competition',
          category: cert.competitionCategory || 'academics',
          achievementTitle: cert.achievementTitle || 'Certificate of Excellence',
          rank: cert.rank,
          score: cert.score,
          totalMarks: cert.totalMarks,
          grade: cert.grade,
          issueDate: cert.issueDate ? cert.issueDate.split('T')[0] : '2026-02-01',
          institution: cert.schoolInstitution || 'Educational Institution',
          district: cert.district || '',
          state: cert.state || '',
          status,
          isVerified: !isRevoked,
          trustName: 'Fatimyah Educational Trust',
          revokedAt: cert.revokedAt,
          revokedByEmail: cert.revokedByEmail,
          revocationReason: cert.revocationReason,
          reinstatedAt: cert.reinstatedAt,
          verifiedAt: new Date().toISOString()
        };

        // Cache into public_certificates
        try {
          await setDoc(doc(db, 'public_certificates', cleanId), publicRecord, { merge: true });
        } catch {
          // Non-blocking
        }

        return publicRecord;
      }
    } catch {
      // Non-blocking
    }

    return null;
  } catch (err) {
    console.warn('Notice in public certificate verification lookup:', err);
    return null;
  }
}

/**
 * Revoke an Issued Certificate (Admin Clearance Action)
 */
export async function revokeCertificate(
  certificateId: string,
  reason: string,
  adminUser: { uid: string; email: string; role?: string }
): Promise<void> {
  if (!certificateId || !certificateId.trim()) throw new Error('Certificate ID required');
  const cleanId = certificateId.trim().toUpperCase();
  const cleanReason = reason?.trim() || 'Disciplinary / administrative cancellation by Examination Directorate.';
  const now = new Date().toISOString();

  // 1. Update public_certificates
  const publicRef = doc(db, 'public_certificates', cleanId);
  await setDoc(publicRef, {
    certificateId: cleanId,
    status: 'revoked',
    isVerified: false,
    revocationReason: cleanReason,
    revokedAt: now,
    revokedByEmail: adminUser.email,
    verifiedAt: now
  }, { merge: true });

  // 2. Update competition_certificates matching this ID
  try {
    const certsRef = collection(db, 'competition_certificates');
    const q = query(certsRef, where('certificateId', '==', cleanId), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docId = snap.docs[0].id;
      await updateDoc(doc(db, 'competition_certificates', docId), {
        status: 'revoked',
        isVerified: false,
        revocationReason: cleanReason,
        revokedAt: now,
        revokedByUid: adminUser.uid,
        revokedByEmail: adminUser.email,
        updatedAt: now
      });
    }
  } catch (err) {
    console.warn('Notice updating competition_certificates document on revoke:', err);
  }

  // 3. Log to Immutable Audit Trail
  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: (adminUser.role as UserRole) || 'exam_admin',
    action: 'CERTIFICATE_REVOKED',
    targetEntity: 'competition_certificates',
    targetId: cleanId,
    details: {
      certificateId: cleanId,
      revocationReason: cleanReason,
      revokedAt: now
    }
  });
}

/**
 * Reinstate a Revoked Certificate (Admin Clearance Action)
 */
export async function reinstateCertificate(
  certificateId: string,
  adminUser: { uid: string; email: string; role?: string }
): Promise<void> {
  if (!certificateId || !certificateId.trim()) throw new Error('Certificate ID required');
  const cleanId = certificateId.trim().toUpperCase();
  const now = new Date().toISOString();

  // 1. Update public_certificates
  const publicRef = doc(db, 'public_certificates', cleanId);
  await setDoc(publicRef, {
    certificateId: cleanId,
    status: 'valid',
    isVerified: true,
    revocationReason: null,
    revokedAt: null,
    revokedByEmail: null,
    reinstatedAt: now,
    reinstatedByEmail: adminUser.email,
    verifiedAt: now
  }, { merge: true });

  // 2. Update competition_certificates
  try {
    const certsRef = collection(db, 'competition_certificates');
    const q = query(certsRef, where('certificateId', '==', cleanId), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docId = snap.docs[0].id;
      await updateDoc(doc(db, 'competition_certificates', docId), {
        status: 'valid',
        isVerified: true,
        revocationReason: null,
        revokedAt: null,
        revokedByEmail: null,
        reinstatedAt: now,
        reinstatedByEmail: adminUser.email,
        updatedAt: now
      });
    }
  } catch (err) {
    console.warn('Notice updating competition_certificates document on reinstate:', err);
  }

  // 3. Log to Immutable Audit Trail
  await logAuditEvent({
    actorUid: adminUser.uid,
    actorEmail: adminUser.email,
    actorRole: (adminUser.role as UserRole) || 'exam_admin',
    action: 'CERTIFICATE_REINSTATED',
    targetEntity: 'competition_certificates',
    targetId: cleanId,
    details: {
      certificateId: cleanId,
      reinstatedAt: now
    }
  });
}

// -------------------------------------------------------------
// CROWDFUNDING & DONATION CAMPAIGN MANAGEMENT SUB-SYSTEM
// (Strictly separated from Donor Management & User Statuses)
// -------------------------------------------------------------

export const CAMPAIGN_CATEGORY_CONFIG: Record<CampaignCategory, { label: string; iconName: string; badgeColor: string }> = {
  education: { label: 'Education & Scholarships', iconName: 'GraduationCap', badgeColor: 'bg-blue-100 text-blue-900 border-blue-200' },
  medical_assistance: { label: 'Medical & Healthcare Assistance', iconName: 'HeartPulse', badgeColor: 'bg-rose-100 text-rose-900 border-rose-200' },
  emergency_assistance: { label: 'Emergency & Disaster Relief', iconName: 'AlertTriangle', badgeColor: 'bg-amber-100 text-amber-950 border-amber-300' },
  food_basic_needs: { label: 'Food Security & Basic Needs', iconName: 'Utensils', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  community_development: { label: 'Community & Madrasa Development', iconName: 'Building2', badgeColor: 'bg-purple-100 text-purple-900 border-purple-200' },
  other_charitable: { label: 'Other Approved Charitable Causes', iconName: 'HandHeart', badgeColor: 'bg-slate-100 text-slate-900 border-slate-200' }
};

/**
 * Generate Next Campaign Identifier (e.g. FET-CMP-2026-0042)
 */
async function generateCampaignNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  try {
    const counterRef = doc(db, 'counters', `campaigns_${currentYear}`);
    let seq = 1;
    await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      if (counterSnap.exists()) {
        seq = (counterSnap.data().lastSequence || 0) + 1;
      }
      transaction.set(counterRef, { lastSequence: seq, year: currentYear }, { merge: true });
    });
    return `FET-CMP-${currentYear}-${String(seq).padStart(4, '0')}`;
  } catch (err) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `FET-CMP-${currentYear}-${randomSuffix}`;
  }
}

/**
 * Create a New Campaign
 * Initial status: 'pending_review'
 * Does NOT alter accountStatus, membershipStatus, volunteerStatus, or donorStatus!
 */
export async function createCampaign(
  campaignData: Omit<CrowdfundingCampaign, 'id' | 'campaignNumber' | 'raisedAmount' | 'remainingAmount' | 'progressPercentage' | 'verifiedDonationsCount' | 'status' | 'isVerifiedByFET' | 'createdAt' | 'updatedAt'>,
  creatorProfile: { uid: string; email: string; displayName: string }
): Promise<string> {
  const campaignNumber = await generateCampaignNumber();
  const now = new Date().toISOString();
  const target = Number(campaignData.targetAmount) || 0;

  // Build clean, well-defined Firestore-safe payload with normalized primitives
  const rawCampaign: Record<string, any> = {
    campaignId: campaignNumber,
    campaignNumber,
    title: String(campaignData.title || '').trim(),
    category: campaignData.category || 'education',
    categoryLabel: campaignData.categoryLabel || CAMPAIGN_CATEGORY_CONFIG[campaignData.category || 'education']?.label || 'Charitable Appeal',
    description: String(campaignData.description || '').trim(),
    beneficiaryName: String(campaignData.beneficiaryName || '').trim(),
    beneficiaryDescription: String(campaignData.beneficiaryDescription || '').trim(),
    targetInstitution: String(campaignData.targetInstitution || '').trim(),
    beneficiaryLocation: String(campaignData.beneficiaryLocation || '').trim(),
    targetAmount: target,
    requiredAmount: target,
    raisedAmount: 0,
    remainingAmount: target,
    progressPercentage: 0,
    verifiedDonationsCount: 0,
    location: String(campaignData.location || '').trim(),
    state: String(campaignData.state || 'Telangana').trim(),
    district: String(campaignData.district || 'Hyderabad').trim(),
    city: String(campaignData.city || '').trim(),
    startDate: campaignData.startDate || now.split('T')[0],
    endDate: campaignData.endDate || now.split('T')[0],
    fundUtilizationNotes: String(campaignData.fundUtilizationNotes || '').trim(),
    coverImageUrl: String(campaignData.coverImageUrl || '').trim(),
    supportingImages: Array.isArray(campaignData.supportingImages) 
      ? campaignData.supportingImages.map((img: any) => ({
          id: String(img.id || `img_${Date.now()}`),
          url: String(img.url || ''),
          caption: String(img.caption || '').trim(),
          fileName: String(img.fileName || ''),
          uploadedAt: String(img.uploadedAt || now)
        }))
      : [],
    supportingDocuments: Array.isArray(campaignData.supportingDocuments)
      ? campaignData.supportingDocuments.map((doc: any) => ({
          id: String(doc.id || `doc_${Date.now()}`),
          name: String(doc.name || 'Verification Document'),
          type: String(doc.type || 'Other'),
          url: String(doc.url || ''),
          uploadedAt: String(doc.uploadedAt || now),
          sizeBytes: Number(doc.sizeBytes) || 0,
          fileName: String(doc.fileName || ''),
          mimeType: String(doc.mimeType || 'application/octet-stream'),
          isPrivate: Boolean(doc.isPrivate !== false)
        }))
      : [],
    contactPersonName: String(campaignData.contactPersonName || creatorProfile.displayName || '').trim(),
    contactPhone: String(campaignData.contactPhone || '').trim(),
    contactEmail: String(campaignData.contactEmail || creatorProfile.email || '').trim(),
    creatorFullName: String(campaignData.creatorFullName || creatorProfile.displayName || '').trim(),
    creatorParentage: String(campaignData.creatorParentage || '').trim(),
    creatorContactPhone: String(campaignData.creatorContactPhone || '').trim(),
    creatorAlternatePhone: String(campaignData.creatorAlternatePhone || '').trim(),
    creatorEmailAddress: String(campaignData.creatorEmailAddress || creatorProfile.email || '').trim(),
    creatorResidentialLocation: String(campaignData.creatorResidentialLocation || '').trim(),
    creatorState: String(campaignData.creatorState || 'Telangana').trim(),
    creatorDistrict: String(campaignData.creatorDistrict || 'Hyderabad').trim(),
    creatorCityTownVillage: String(campaignData.creatorCityTownVillage || '').trim(),
    creatorMemberId: String(campaignData.creatorMemberId || '').trim(),
    relationshipToBeneficiary: String(campaignData.relationshipToBeneficiary || 'Self'),
    declarationAccepted: Boolean(campaignData.declarationAccepted),
    termsAccepted: Boolean(campaignData.termsAccepted),
    status: 'pending_review',
    isVerifiedByFET: false,
    creatorUid: creatorProfile.uid,
    creatorEmail: creatorProfile.email || 'trust@fetindia.org',
    creatorName: creatorProfile.displayName || 'Authorized Member',
    createdAt: now,
    updatedAt: now,
    submittedAt: now
  };

  const cleanedCampaign = cleanFirestoreData(rawCampaign);
  const campaignsRef = collection(db, 'crowdfunding_campaigns');
  const docRef = await addDoc(campaignsRef, cleanedCampaign);

  // 1. Immutable Audit Log
  await logAuditEvent({
    actorUid: creatorProfile.uid,
    actorEmail: creatorProfile.email,
    actorRole: 'member',
    action: 'CAMPAIGN_SUBMITTED',
    targetEntity: 'crowdfunding_campaigns',
    targetId: docRef.id,
    details: {
      campaignNumber,
      title: campaignData.title,
      targetAmount: target,
      category: campaignData.category,
      status: 'pending_review'
    }
  });

  // 2. User Notification (Confirmation of submission)
  try {
    await createUserNotification({
      userId: creatorProfile.uid,
      userEmail: creatorProfile.email,
      title: `Campaign Submitted: ${campaignData.title}`,
      message: `Your fundraising appeal "${campaignData.title}" (${campaignNumber}) has been submitted for official verification. It is currently under Pending Review by the Trust Secretariat.`,
      type: 'announcement',
      severity: 'info',
      module: 'general',
      actionUrl: 'campaigns',
      actionLabel: 'View My Campaigns',
      createdBy: 'System Secretariat'
    });
  } catch (err) {
    console.warn('Failed to dispatch user notification on campaign submission:', err);
  }

  return docRef.id;
}

/**
 * Save or Update a Campaign Draft
 * A draft is never visible publicly or on active drives.
 */
export async function saveCampaignDraft(
  campaignData: Partial<CrowdfundingCampaign>,
  creatorProfile: { uid: string; email: string; displayName: string },
  existingCampaignId?: string
): Promise<string> {
  const now = new Date().toISOString();
  const target = Number(campaignData.targetAmount) || 0;

  if (existingCampaignId) {
    const docRef = doc(db, 'crowdfunding_campaigns', existingCampaignId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('Draft campaign not found');
    }
    const existing = snap.data() as CrowdfundingCampaign;
    if (existing.creatorUid !== creatorProfile.uid) {
      throw new Error('Permission denied: You can only edit your own campaigns');
    }

    const updatePayload: Partial<CrowdfundingCampaign> = cleanFirestoreData({
      ...campaignData,
      targetAmount: target,
      requiredAmount: target,
      status: 'draft',
      updatedAt: now
    });
    // Ensure audit fields and funds are not tampered
    delete (updatePayload as any).raisedAmount;
    delete (updatePayload as any).verifiedDonationsCount;
    delete (updatePayload as any).approvedByUid;

    await updateDoc(docRef, updatePayload);
    return existingCampaignId;
  } else {
    const campaignNumber = await generateCampaignNumber();
    const newDraft: Omit<CrowdfundingCampaign, 'id'> = {
      campaignId: campaignNumber,
      campaignNumber,
      title: String(campaignData.title || 'Untitled Appeal Draft').trim(),
      category: campaignData.category || 'education',
      categoryLabel: campaignData.categoryLabel || CAMPAIGN_CATEGORY_CONFIG[campaignData.category || 'education']?.label || 'Charitable Appeal',
      description: String(campaignData.description || '').trim(),
      beneficiaryName: String(campaignData.beneficiaryName || '').trim(),
      beneficiaryDescription: String(campaignData.beneficiaryDescription || '').trim(),
      targetInstitution: String(campaignData.targetInstitution || '').trim(),
      beneficiaryLocation: String(campaignData.beneficiaryLocation || '').trim(),
      targetAmount: target,
      requiredAmount: target,
      raisedAmount: 0,
      remainingAmount: target,
      progressPercentage: 0,
      verifiedDonationsCount: 0,
      location: String(campaignData.location || '').trim(),
      state: String(campaignData.state || 'Telangana').trim(),
      district: String(campaignData.district || 'Hyderabad').trim(),
      city: String(campaignData.city || '').trim(),
      startDate: campaignData.startDate || now.split('T')[0],
      endDate: campaignData.endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fundUtilizationNotes: String(campaignData.fundUtilizationNotes || '').trim(),
      coverImageUrl: String(campaignData.coverImageUrl || '').trim(),
      supportingImages: Array.isArray(campaignData.supportingImages)
        ? campaignData.supportingImages.map((img: any) => ({
            id: String(img.id || `img_${Date.now()}`),
            url: String(img.url || ''),
            caption: String(img.caption || '').trim(),
            fileName: String(img.fileName || ''),
            uploadedAt: String(img.uploadedAt || now)
          }))
        : [],
      supportingDocuments: Array.isArray(campaignData.supportingDocuments)
        ? campaignData.supportingDocuments.map((doc: any) => ({
            id: String(doc.id || `doc_${Date.now()}`),
            name: String(doc.name || 'Verification Document'),
            type: String(doc.type || 'Other'),
            url: String(doc.url || ''),
            uploadedAt: String(doc.uploadedAt || now),
            sizeBytes: Number(doc.sizeBytes) || 0,
            fileName: String(doc.fileName || ''),
            mimeType: String(doc.mimeType || 'application/octet-stream'),
            isPrivate: Boolean(doc.isPrivate !== false)
          }))
        : [],
      contactPersonName: String(campaignData.contactPersonName || creatorProfile.displayName || '').trim(),
      contactPhone: String(campaignData.contactPhone || '').trim(),
      contactEmail: String(campaignData.contactEmail || creatorProfile.email || '').trim(),
      creatorFullName: String(campaignData.creatorFullName || creatorProfile.displayName || '').trim(),
      creatorParentage: String(campaignData.creatorParentage || '').trim(),
      creatorContactPhone: String(campaignData.creatorContactPhone || '').trim(),
      creatorAlternatePhone: String(campaignData.creatorAlternatePhone || '').trim(),
      creatorEmailAddress: String(campaignData.creatorEmailAddress || creatorProfile.email || '').trim(),
      creatorResidentialLocation: String(campaignData.creatorResidentialLocation || '').trim(),
      creatorState: String(campaignData.creatorState || 'Telangana').trim(),
      creatorDistrict: String(campaignData.creatorDistrict || 'Hyderabad').trim(),
      creatorCityTownVillage: String(campaignData.creatorCityTownVillage || '').trim(),
      creatorMemberId: String(campaignData.creatorMemberId || '').trim(),
      relationshipToBeneficiary: String(campaignData.relationshipToBeneficiary || 'Self'),
      declarationAccepted: Boolean(campaignData.declarationAccepted),
      termsAccepted: Boolean(campaignData.termsAccepted),
      status: 'draft',
      isVerifiedByFET: false,
      creatorUid: creatorProfile.uid,
      creatorEmail: creatorProfile.email,
      creatorName: creatorProfile.displayName || 'Authorized Member',
      createdAt: now,
      updatedAt: now
    };

    const cleanedDraft = cleanFirestoreData(newDraft);
    const campaignsRef = collection(db, 'crowdfunding_campaigns');
    const docRef = await addDoc(campaignsRef, cleanedDraft);
    return docRef.id;
  }
}

/**
 * Submit or Resubmit a Campaign Appeal (transitions draft / revision into 'pending_review')
 */
export async function submitCampaignAppeal(
  campaignData: Omit<CrowdfundingCampaign, 'id' | 'campaignNumber' | 'raisedAmount' | 'remainingAmount' | 'progressPercentage' | 'verifiedDonationsCount' | 'status' | 'isVerifiedByFET' | 'createdAt' | 'updatedAt'>,
  creatorProfile: { uid: string; email: string; displayName: string },
  existingCampaignId?: string
): Promise<string> {
  const now = new Date().toISOString();
  const target = Number(campaignData.targetAmount) || 0;

  if (existingCampaignId) {
    const docRef = doc(db, 'crowdfunding_campaigns', existingCampaignId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('Campaign appeal record not found');
    }
    const existing = snap.data() as CrowdfundingCampaign;
    if (existing.creatorUid !== creatorProfile.uid) {
      throw new Error('Permission denied: You can only resubmit your own campaigns');
    }

    const updatePayload: Partial<CrowdfundingCampaign> = cleanFirestoreData({
      ...campaignData,
      targetAmount: target,
      requiredAmount: target,
      remainingAmount: Math.max(0, target - (existing.raisedAmount || 0)),
      status: 'pending_review',
      isVerifiedByFET: false,
      submittedAt: now,
      updatedAt: now
    });
    delete (updatePayload as any).raisedAmount;
    delete (updatePayload as any).verifiedDonationsCount;

    await updateDoc(docRef, updatePayload);

    await logAuditEvent({
      actorUid: creatorProfile.uid,
      actorEmail: creatorProfile.email,
      actorRole: 'member',
      action: 'CAMPAIGN_RESUBMITTED',
      targetEntity: 'crowdfunding_campaigns',
      targetId: existingCampaignId,
      details: {
        title: campaignData.title,
        targetAmount: target,
        category: campaignData.category,
        status: 'pending_review'
      }
    });

    try {
      await createUserNotification({
        userId: creatorProfile.uid,
        userEmail: creatorProfile.email,
        title: `Appeal Resubmitted: ${campaignData.title}`,
        message: `Your updated fundraising appeal "${campaignData.title}" has been resubmitted for Board review.`,
        type: 'announcement',
        severity: 'info',
        module: 'general',
        actionUrl: 'campaigns',
        actionLabel: 'View My Campaigns',
        createdBy: 'Trust Secretariat'
      });
    } catch (err) {
      console.warn('Failed to dispatch user notification on resubmission:', err);
    }

    return existingCampaignId;
  } else {
    return createCampaign(campaignData, creatorProfile);
  }
}

/**
 * Fetch Public Active/Approved/Completed Campaigns
 * Strips private verification documents and sensitive creator PII before returning public records
 */
export async function fetchPublicCampaigns(): Promise<CrowdfundingCampaign[]> {
  try {
    const campaignsRef = collection(db, 'crowdfunding_campaigns');
    const snapshot = await getDocs(campaignsRef);
    const list: CrowdfundingCampaign[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as CrowdfundingCampaign;
      // Filter publicly presentable statuses
      if (['active', 'approved', 'paused', 'completed', 'closed'].includes(data.status)) {
        const target = Number(data.targetAmount) || 1;
        const raised = Number(data.raisedAmount) || 0;

        // Privacy Isolation: Exclude private verification documents and creator confidential PII
        const publicRecord: CrowdfundingCampaign = {
          id: d.id,
          campaignId: data.campaignId || d.id,
          campaignNumber: data.campaignNumber,
          title: data.title,
          category: data.category,
          categoryLabel: data.categoryLabel,
          description: data.description,
          beneficiaryName: data.beneficiaryName,
          beneficiaryDescription: data.beneficiaryDescription,
          targetAmount: target,
          requiredAmount: Number(data.requiredAmount) || target,
          raisedAmount: raised,
          remainingAmount: Math.max(0, target - raised),
          progressPercentage: Math.min(100, Math.round((raised / target) * 100)),
          verifiedDonationsCount: Number(data.verifiedDonationsCount) || 0,
          location: data.location || `${data.district || ''}, ${data.state || ''}`,
          state: data.state,
          district: data.district,
          city: data.city,
          startDate: data.startDate,
          endDate: data.endDate,
          coverImageUrl: data.coverImageUrl,
          supportingImages: data.supportingImages || [],
          // PRIVACY REQUIREMENT: verification documents are private & not exposed to public viewers
          supportingDocuments: undefined,
          contactPersonName: data.contactPersonName || 'FET Campaign Desk',
          contactPhone: data.contactPhone ? `${data.contactPhone.slice(0, 3)}****${data.contactPhone.slice(-3)}` : 'Secretariat Desk',
          contactEmail: data.contactEmail || 'desk@fetindia.org',
          declarationAccepted: data.declarationAccepted,
          termsAccepted: data.termsAccepted,
          status: data.status,
          isVerifiedByFET: Boolean(data.isVerifiedByFET),
          creatorUid: data.creatorUid,
          creatorEmail: '', // Obfuscated on public card
          creatorName: data.creatorFullName || data.creatorName || 'Accredited Member',
          relationshipToBeneficiary: data.relationshipToBeneficiary,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };

        list.push(publicRecord);
      }
    });

    // Sort by creation date descending
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.error('Error fetching public campaigns:', err);
    return [];
  }
}

export const fetchPublicActiveCampaigns = fetchPublicCampaigns;

/**
 * Fetch Campaigns Created by a Specific User ("My Campaigns")
 */
export async function fetchUserCampaigns(userId: string): Promise<CrowdfundingCampaign[]> {
  if (!userId) return [];
  try {
    const campaignsRef = collection(db, 'crowdfunding_campaigns');
    const q = query(campaignsRef, where('creatorUid', '==', userId));
    const snapshot = await getDocs(q);
    const list: CrowdfundingCampaign[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as CrowdfundingCampaign;
      const target = Number(data.targetAmount) || 1;
      const raised = Number(data.raisedAmount) || 0;
      list.push({
        id: d.id,
        ...data,
        targetAmount: target,
        raisedAmount: raised,
        remainingAmount: Math.max(0, target - raised),
        progressPercentage: Math.min(100, Math.round((raised / target) * 100))
      });
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.error('Error fetching user campaigns:', err);
    return [];
  }
}

/**
 * Fetch All Campaigns for Super Admin / Campaign Management
 */
export async function fetchAllCampaignsAdmin(): Promise<CrowdfundingCampaign[]> {
  try {
    const campaignsRef = collection(db, 'crowdfunding_campaigns');
    const snapshot = await getDocs(campaignsRef);
    const list: CrowdfundingCampaign[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as CrowdfundingCampaign;
      const target = Number(data.targetAmount) || 1;
      const raised = Number(data.raisedAmount) || 0;
      list.push({
        id: d.id,
        ...data,
        targetAmount: target,
        raisedAmount: raised,
        remainingAmount: Math.max(0, target - raised),
        progressPercentage: Math.min(100, Math.round((raised / target) * 100))
      });
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.error('Error fetching all admin campaigns:', err);
    return [];
  }
}

/**
 * Fetch a Single Campaign by ID
 */
export async function fetchCampaignById(campaignId: string): Promise<CrowdfundingCampaign | null> {
  if (!campaignId) return null;
  try {
    const docRef = doc(db, 'crowdfunding_campaigns', campaignId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data() as CrowdfundingCampaign;
    const target = Number(data.targetAmount) || 1;
    const raised = Number(data.raisedAmount) || 0;

    return {
      id: snap.id,
      ...data,
      targetAmount: target,
      raisedAmount: raised,
      remainingAmount: Math.max(0, target - raised),
      progressPercentage: Math.min(100, Math.round((raised / target) * 100))
    };
  } catch (err) {
    console.error('Error fetching campaign by id:', err);
    return null;
  }
}

/**
 * Administrator Campaign Review & Lifecycle Action
 * Allows: 'approve' | 'activate' | 'pause' | 'resume' | 'complete' | 'reject' | 'close'
 * Records Admin UID, Email, Notes, Timestamp
 * Triggers targeted In-App Notification using existing notification engine
 */
export async function adminReviewCampaign(
  campaignId: string,
  action: 'approve' | 'activate' | 'pause' | 'resume' | 'complete' | 'reject' | 'request_correction' | 'start_review' | 'under_review' | 'close',
  options: {
    adminUid: string;
    adminEmail: string;
    reviewNotes?: string;
    internalNotes?: string;
    reason?: string;
    applicantFeedback?: string;
    supportingDocuments?: CampaignSupportingDocument[];
  }
): Promise<void> {
  const docRef = doc(db, 'crowdfunding_campaigns', campaignId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Campaign document not found in registry');
  }

  const campaign = snap.data() as CrowdfundingCampaign;
  const now = new Date().toISOString();

  let nextStatus: CampaignStatus = campaign.status;
  const internalNotes = options.internalNotes || options.reviewNotes || campaign.internalReviewNotes || campaign.reviewNotes || '';
  const feedback = options.applicantFeedback || options.reason || '';

  const updatePayload: Partial<CrowdfundingCampaign> = {
    updatedAt: now,
    reviewedAt: now,
    reviewedByUid: options.adminUid,
    reviewedByEmail: options.adminEmail,
    reviewNotes: internalNotes,
    internalReviewNotes: internalNotes
  };

  if (options.supportingDocuments) {
    updatePayload.supportingDocuments = options.supportingDocuments;
  }

  let notifTitle = '';
  let notifMessage = '';
  let notifSeverity: NotificationSeverity = 'info';

  switch (action) {
    case 'start_review':
    case 'under_review':
      nextStatus = 'under_review';
      updatePayload.status = 'under_review';
      notifTitle = `Appeal Under Review: ${campaign.title}`;
      notifMessage = `Your fundraising appeal "${campaign.title}" is currently undergoing official verification by the FET India Administrative Secretariat.`;
      notifSeverity = 'info';
      break;

    case 'approve':
      nextStatus = 'active'; // Approved becomes active for immediate public support
      updatePayload.status = 'active';
      updatePayload.isVerifiedByFET = true;
      updatePayload.approvedAt = now;
      updatePayload.approvedByUid = options.adminUid;
      updatePayload.approvedByEmail = options.adminEmail;
      notifTitle = `Appeal Approved & Live: ${campaign.title}`;
      notifMessage = `Your fundraising campaign "${campaign.title}" has been verified and approved by the FET India Board. It is now live and accepting public contributions.`;
      notifSeverity = 'success';
      break;

    case 'activate':
    case 'resume':
      nextStatus = 'active';
      updatePayload.status = 'active';
      notifTitle = `Appeal Resumed: ${campaign.title}`;
      notifMessage = `Your fundraising campaign "${campaign.title}" is active and accepting contributions.`;
      notifSeverity = 'info';
      break;

    case 'pause':
      nextStatus = 'paused';
      updatePayload.status = 'paused';
      updatePayload.pausedAt = now;
      updatePayload.pausedReason = feedback || 'Paused by Administration';
      notifTitle = `Appeal Paused: ${campaign.title}`;
      notifMessage = `Your campaign "${campaign.title}" has been temporarily paused. Reason: ${feedback || 'Administrative review'}`;
      notifSeverity = 'warning';
      break;

    case 'complete':
      nextStatus = 'completed';
      updatePayload.status = 'completed';
      updatePayload.completedAt = now;
      notifTitle = `Appeal Completed: ${campaign.title}`;
      notifMessage = `Your campaign "${campaign.title}" has successfully completed its target and concluded. Thank you for your service.`;
      notifSeverity = 'success';
      break;

    case 'reject':
      nextStatus = 'rejected';
      updatePayload.status = 'rejected';
      updatePayload.rejectionReason = feedback || 'Documents could not be verified.';
      notifTitle = `Appeal Review Notice: ${campaign.title}`;
      notifMessage = `Your appeal "${campaign.title}" could not be approved at this time. Feedback: ${feedback || 'Documentation did not meet verification criteria.'}`;
      notifSeverity = 'critical';
      break;

    case 'request_correction':
      nextStatus = 'draft';
      updatePayload.status = 'draft';
      updatePayload.correctionReason = feedback || 'Additional verification details or updated documents requested.';
      updatePayload.rejectionReason = feedback || 'Additional verification details or updated documents requested.';
      notifTitle = `Appeal Revision Requested: ${campaign.title}`;
      notifMessage = `Your campaign appeal "${campaign.title}" has been returned for applicant correction/clarification. Feedback: ${feedback || 'Please provide updated documentation or details.'}`;
      notifSeverity = 'warning';
      break;

    case 'close':
      nextStatus = 'closed';
      updatePayload.status = 'closed';
      updatePayload.closedAt = now;
      updatePayload.closureReason = feedback || 'Closed by Administration';
      notifTitle = `Appeal Closed: ${campaign.title}`;
      notifMessage = `Campaign appeal "${campaign.title}" has been closed by the Trust Administration.`;
      notifSeverity = 'info';
      break;
  }

  // Create Review History Entry
  const historyEntry: CampaignReviewHistoryEntry = {
    id: `rev-${Date.now()}`,
    action: action.toUpperCase(),
    fromStatus: campaign.status,
    toStatus: nextStatus,
    reviewerUid: options.adminUid,
    reviewerEmail: options.adminEmail,
    timestamp: now,
    internalNotes: internalNotes || '',
    applicantFeedback: feedback || ''
  };

  const existingHistory = campaign.reviewHistory || [];
  updatePayload.reviewHistory = [historyEntry, ...existingHistory];

  // Update Firestore Document with cleaned payload
  const cleanedPayload = cleanFirestoreData(updatePayload);
  await updateDoc(docRef, cleanedPayload);

  // Record Immutable Audit Log
  await logAuditEvent({
    actorUid: options.adminUid,
    actorEmail: options.adminEmail,
    actorRole: 'administrator',
    action: `CAMPAIGN_${action.toUpperCase()}`,
    targetEntity: 'crowdfunding_campaigns',
    targetId: campaignId,
    details: {
      campaignNumber: campaign.campaignNumber,
      title: campaign.title,
      previousStatus: campaign.status,
      newStatus: nextStatus,
      internalNotes,
      applicantFeedback: feedback
    }
  });

  // Dispatch In-App Notification to Campaign Creator
  if (campaign.creatorUid && notifTitle) {
    try {
      await createUserNotification({
        userId: campaign.creatorUid,
        userEmail: campaign.creatorEmail,
        title: notifTitle,
        message: notifMessage,
        type: 'announcement',
        severity: notifSeverity,
        module: 'general',
        actionUrl: 'campaigns',
        actionLabel: 'View Appeal Status',
        createdBy: 'FET Secretariat'
      });
    } catch (notifErr) {
      console.warn('Failed to send notification on campaign review:', notifErr);
    }
  }
}

/**
 * Record a Campaign Donation (Pledge or Verified Contribution)
 * Keeps progress calculation strictly from verified records.
 */
export async function recordCampaignDonation(donationData: {
  campaignId: string;
  campaignTitle: string;
  donorUid?: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  donorPan?: string;
  amount: number;
  transactionReference: string;
  paymentMethod?: string;
  isAnonymous?: boolean;
  message?: string;
  isPreVerifiedByAdmin?: boolean;
  adminUid?: string;
  adminEmail?: string;
}): Promise<string> {
  const now = new Date().toISOString();
  const currentYear = new Date().getFullYear();
  const cleanAmount = Math.max(1, Number(donationData.amount) || 0);

  const donationId = `FET-DON-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`;
  const isVerified = donationData.isPreVerifiedByAdmin === true;

  const newDonation: Omit<CampaignDonation, 'id'> = {
    donationId,
    campaignId: donationData.campaignId,
    campaignTitle: donationData.campaignTitle,
    donorUid: donationData.donorUid || null,
    donorName: donationData.donorName || 'Well-Wisher',
    donorEmail: donationData.donorEmail || '',
    donorPhone: donationData.donorPhone || null,
    donorPan: donationData.donorPan || null,
    amount: cleanAmount,
    createdAt: now,
    paymentStatus: isVerified ? 'verified' : 'pending_verification',
    transactionReference: donationData.transactionReference || 'REF-OFFLINE',
    paymentMethod: donationData.paymentMethod || 'Direct Bank Transfer / UPI',
    isAnonymous: Boolean(donationData.isAnonymous),
    message: donationData.message || '',
    verifiedAt: isVerified ? now : null,
    verifiedByUid: isVerified ? (donationData.adminUid || null) : null,
    verifiedByEmail: isVerified ? (donationData.adminEmail || null) : null
  };

  const donationsRef = collection(db, 'campaign_donations');
  const cleanedDonation = cleanFirestoreData(newDonation);
  const docRef = await addDoc(donationsRef, cleanedDonation);

  // If verified, atomically update the Campaign's raisedAmount and verifiedDonationsCount
  if (isVerified) {
    await recalculateCampaignProgress(donationData.campaignId);
  }

  // Immutable Audit
  await logAuditEvent({
    actorUid: donationData.donorUid || donationData.adminUid || 'donor_public',
    actorEmail: donationData.donorEmail || donationData.adminEmail || 'donor@fetindia.com',
    actorRole: donationData.adminUid ? 'administrator' : 'user',
    action: isVerified ? 'CAMPAIGN_DONATION_VERIFIED' : 'CAMPAIGN_DONATION_PLEDGED',
    targetEntity: 'campaign_donations',
    targetId: docRef.id,
    details: {
      donationId,
      campaignId: donationData.campaignId,
      amount: cleanAmount,
      isVerified
    }
  });

  return docRef.id;
}

/**
 * Verify a Pending Campaign Donation (Admin Action)
 */
export async function verifyCampaignDonation(
  donationDocId: string,
  campaignId: string,
  adminInfo: { uid: string; email: string }
): Promise<void> {
  return adminUpdateCampaignDonationStatus(donationDocId, campaignId, 'verified', {
    adminUid: adminInfo.uid,
    adminEmail: adminInfo.email,
    adminNotes: 'Direct administrative payment verification and 80G tax receipt issuance.'
  });
}

/**
 * Update Campaign Donation Status (Admin Action with full lifecycle & audit)
 * Handles verified, pending_verification, failed, cancelled, refunded.
 */
export async function adminUpdateCampaignDonationStatus(
  donationDocId: string,
  campaignId: string,
  newStatus: CampaignDonationStatus,
  options: {
    adminUid: string;
    adminEmail: string;
    adminNotes?: string;
    refundReason?: string;
    cancelledReason?: string;
  }
): Promise<void> {
  const donationRef = doc(db, 'campaign_donations', donationDocId);
  const snap = await getDoc(donationRef);
  if (!snap.exists()) {
    throw new Error('Donation record not found');
  }

  const prevData = snap.data() as CampaignDonation;
  const now = new Date().toISOString();
  const updatePayload: Partial<CampaignDonation> = {
    paymentStatus: newStatus,
    adminNotes: options.adminNotes || prevData.adminNotes
  };

  if (newStatus === 'verified') {
    updatePayload.verifiedAt = now;
    updatePayload.verifiedByUid = options.adminUid;
    updatePayload.verifiedByEmail = options.adminEmail;
    if (!prevData.receiptNumber) {
      const suffix = prevData.donationId?.split('-').pop() || Math.floor(10000 + Math.random() * 90000).toString();
      updatePayload.receiptNumber = `REC/80G/2026/${suffix}`;
      updatePayload.financialYear = '2026-27';
    }
  } else if (newStatus === 'refunded') {
    updatePayload.refundedAt = now;
    updatePayload.refundedByUid = options.adminUid;
    updatePayload.refundedByEmail = options.adminEmail;
    updatePayload.refundReason = options.refundReason || 'Administrative refund processed.';
  } else if (newStatus === 'cancelled') {
    updatePayload.cancelledAt = now;
    updatePayload.cancelledByUid = options.adminUid;
    updatePayload.cancelledReason = options.cancelledReason || 'Donation pledge cancelled by administration.';
  }

  await updateDoc(donationRef, updatePayload);

  // Recalculate campaign progress strictly from all verified donations
  if (campaignId) {
    await recalculateCampaignProgress(campaignId);
  }

  // Trigger In-App Notification to Donor if authenticated
  if (prevData?.donorUid) {
    let notifTitle = 'Donation Status Updated';
    let notifMessage = `Your donation reference ${prevData.transactionReference} for campaign "${prevData.campaignTitle}" is now marked as ${newStatus}.`;
    let notifSeverity: 'info' | 'success' | 'warning' | 'critical' = 'info';

    if (newStatus === 'verified') {
      notifTitle = 'Donation Verified: 80G Receipt Ready';
      notifMessage = `Your contribution of ₹${Number(prevData.amount || 0).toLocaleString('en-IN')} for campaign "${prevData.campaignTitle}" has been verified. 80G Tax Exemption receipt is ready.`;
      notifSeverity = 'success';
    } else if (newStatus === 'refunded') {
      notifTitle = 'Donation Refund Status Updated';
      notifMessage = `Your contribution of ₹${Number(prevData.amount || 0).toLocaleString('en-IN')} has been recorded as refunded: ${options.refundReason || 'Settled'}.`;
      notifSeverity = 'warning';
    } else if (newStatus === 'cancelled') {
      notifTitle = 'Donation Pledge Cancelled';
      notifMessage = `Your contribution pledge for "${prevData.campaignTitle}" has been closed.`;
      notifSeverity = 'info';
    }

    try {
      await createUserNotification({
        userId: prevData.donorUid,
        userEmail: prevData.donorEmail || '',
        title: notifTitle,
        message: notifMessage,
        type: 'donation',
        severity: notifSeverity,
        module: 'donations',
        actionUrl: 'donations',
        actionLabel: 'View Donation History',
        createdBy: options.adminEmail
      });
    } catch (notifErr) {
      console.warn('Donation status notification note:', notifErr);
    }
  }

  // Immutable Audit
  await logAuditEvent({
    actorUid: options.adminUid,
    actorEmail: options.adminEmail,
    actorRole: 'administrator',
    action: `DONATION_STATUS_${newStatus.toUpperCase()}`,
    targetEntity: 'campaign_donations',
    targetId: donationDocId,
    details: {
      campaignId,
      previousStatus: prevData.paymentStatus,
      newStatus,
      amount: prevData.amount,
      adminNotes: options.adminNotes,
      refundReason: options.refundReason,
      cancelledReason: options.cancelledReason
    }
  });
}

/**
 * Fetch Donations for a Specific User (User-facing Dashboard Isolation)
 */
export async function fetchUserCampaignDonations(
  userUid: string,
  userEmail?: string
): Promise<CampaignDonation[]> {
  if (!userUid && !userEmail) return [];

  try {
    const donationsRef = collection(db, 'campaign_donations');
    const list: CampaignDonation[] = [];
    const seenIds = new Set<string>();

    if (userUid) {
      const qUid = query(donationsRef, where('donorUid', '==', userUid));
      const snapUid = await getDocs(qUid);
      snapUid.forEach((d) => {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          list.push({ id: d.id, ...d.data() } as CampaignDonation);
        }
      });
    }

    if (userEmail && userEmail.trim()) {
      const qEmail = query(donationsRef, where('donorEmail', '==', userEmail.trim().toLowerCase()));
      const snapEmail = await getDocs(qEmail);
      snapEmail.forEach((d) => {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          list.push({ id: d.id, ...d.data() } as CampaignDonation);
        }
      });
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.error('Error fetching user campaign donations:', err);
    return [];
  }
}

/**
 * Helper: Recalculate Campaign Progress from Verified Donations
 */
export async function recalculateCampaignProgress(campaignId: string): Promise<void> {
  try {
    const campaignRef = doc(db, 'crowdfunding_campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);
    if (!campaignSnap.exists()) return;

    const campaign = campaignSnap.data() as CrowdfundingCampaign;
    const target = Number(campaign.targetAmount) || 1;

    // Query all verified donations for this campaign
    const donationsRef = collection(db, 'campaign_donations');
    const q = query(
      donationsRef,
      where('campaignId', '==', campaignId),
      where('paymentStatus', '==', 'verified')
    );
    const donationsSnap = await getDocs(q);

    let totalRaised = 0;
    let verifiedCount = 0;

    donationsSnap.forEach((d) => {
      const don = d.data() as CampaignDonation;
      totalRaised += Number(don.amount) || 0;
      verifiedCount++;
    });

    const remaining = Math.max(0, target - totalRaised);
    const progress = Math.min(100, Math.round((totalRaised / target) * 100));

    await updateDoc(campaignRef, {
      raisedAmount: totalRaised,
      remainingAmount: remaining,
      progressPercentage: progress,
      verifiedDonationsCount: verifiedCount,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error recalculating campaign progress:', err);
  }
}

/**
 * Fetch Campaign Donations (For public donor wall or admin review)
 */
export async function fetchCampaignDonations(
  campaignId: string,
  onlyVerified: boolean = true
): Promise<CampaignDonation[]> {
  if (!campaignId) return [];
  try {
    const donationsRef = collection(db, 'campaign_donations');
    let q = query(donationsRef, where('campaignId', '==', campaignId));
    if (onlyVerified) {
      q = query(donationsRef, where('campaignId', '==', campaignId), where('paymentStatus', '==', 'verified'));
    }
    const snap = await getDocs(q);
    const list: CampaignDonation[] = [];

    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as CampaignDonation);
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.error('Error fetching campaign donations:', err);
    return [];
  }
}

// -------------------------------------------------------------
// FINANCE & ACCOUNTING SUBSYSTEM (STEP 46)
// -------------------------------------------------------------

/**
 * Generate a unique, professional transaction ID for Trust records
 */
export function generateTransactionId(type: 'income' | 'expense'): string {
  const prefix = type === 'income' ? 'FET-INC' : 'FET-EXP';
  const year = '2026';
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${randomSuffix}`;
}

/**
 * Generate a unique voucher number for payment vouchers
 */
export function generateVoucherNumber(): string {
  const year = '2026';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `FET-VCH-${year}-${randomSuffix}`;
}

/**
 * Create a new Financial Record (Income or Expense Requisition)
 */
export async function createFinancialRecord(
  recordData: Omit<FinancialRecord, 'id'>,
  actorInfo: { uid: string; email: string; name?: string; role?: string }
): Promise<string> {
  const recordsRef = collection(db, 'financial_records');
  const now = new Date().toISOString();

  const docData: Omit<FinancialRecord, 'id'> = {
    ...recordData,
    createdAt: recordData.createdAt || now,
    updatedAt: now,
    createdByUid: actorInfo.uid,
    createdByEmail: actorInfo.email,
    createdByName: actorInfo.name || actorInfo.email.split('@')[0],
    financialYear: recordData.financialYear || '2026-27'
  };

  const docRef = await addDoc(recordsRef, cleanFirestoreData(docData));

  // Record Audit Trail
  await logAuditEvent({
    actorUid: actorInfo.uid,
    actorEmail: actorInfo.email,
    actorRole: (actorInfo.role as UserRole) || 'finance_admin',
    action: `FINANCE_RECORD_CREATED_${recordData.type.toUpperCase()}`,
    targetEntity: 'financial_records',
    targetId: docRef.id,
    details: {
      transactionId: recordData.transactionId,
      type: recordData.type,
      category: recordData.category,
      amount: recordData.amount,
      payerPayeeName: recordData.payerPayeeName,
      status: recordData.status
    }
  });

  return docRef.id;
}

/**
 * Update an existing Financial Record status / payment / approval workflow
 */
export async function updateFinancialRecordStatus(
  recordId: string,
  updates: Partial<FinancialRecord>,
  actorInfo: { uid: string; email: string; name?: string; role?: string },
  auditActionName: string = 'FINANCE_RECORD_UPDATED'
): Promise<void> {
  const docRef = doc(db, 'financial_records', recordId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Financial record not found.');
  }

  const prevData = snap.data() as FinancialRecord;
  const now = new Date().toISOString();

  const finalUpdates: Record<string, any> = {
    ...updates,
    updatedAt: now
  };

  await updateDoc(docRef, finalUpdates);

  // Record Audit Trail
  await logAuditEvent({
    actorUid: actorInfo.uid,
    actorEmail: actorInfo.email,
    actorRole: (actorInfo.role as UserRole) || 'finance_admin',
    action: auditActionName,
    targetEntity: 'financial_records',
    targetId: recordId,
    details: {
      transactionId: prevData.transactionId,
      previousStatus: prevData.status,
      newStatus: updates.status || prevData.status,
      amount: prevData.amount,
      updatedFields: Object.keys(updates)
    }
  });
}

/**
 * Delete a Financial Record (Super Admin Only)
 */
export async function deleteFinancialRecord(
  recordId: string,
  actorInfo: { uid: string; email: string; role?: string }
): Promise<void> {
  const docRef = doc(db, 'financial_records', recordId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const data = snap.data() as FinancialRecord;
  await deleteDoc(docRef);

  // Record Audit Trail
  await logAuditEvent({
    actorUid: actorInfo.uid,
    actorEmail: actorInfo.email,
    actorRole: (actorInfo.role as UserRole) || 'super_admin',
    action: 'FINANCE_RECORD_DELETED',
    targetEntity: 'financial_records',
    targetId: recordId,
    details: {
      transactionId: data.transactionId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      payerPayeeName: data.payerPayeeName
    }
  });
}

// =========================================================================
// STEP 47 — FET INDIA HRMS & STAFF MANAGEMENT FUNCTIONS
// =========================================================================

/**
 * Synchronize Public Staff Verification Record (safe non-sensitive QR lookup)
 */
export async function syncPublicStaffVerification(
  staffId: string,
  userProfile: Partial<UserProfile>
): Promise<void> {
  if (!staffId) return;
  try {
    const publicRef = doc(db, 'public_staff', staffId);
    const verificationData: PublicStaffVerification = {
      staffId,
      fullName: userProfile.fullName || userProfile.fullLegalName || userProfile.displayName || 'Staff Member',
      department: userProfile.department || 'Academics & Operations',
      designation: userProfile.designation || 'Staff Member',
      employmentStatus: userProfile.employmentStatus || 'active',
      trustName: 'Fatimyah Educational Trust India',
      isVerified: userProfile.employmentStatus === 'active' || userProfile.employmentStatus === 'probation',
      joiningDate: userProfile.joiningDate || new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      validUntil: 'AY 2026-2027'
    };
    await setDoc(publicRef, verificationData, { merge: true });
  } catch (err) {
    console.warn('Could not sync public staff verification (non-blocking):', err);
  }
}

/**
 * Updates a staff member's administrative profile particulars
 */
export async function updateStaffMemberProfile(
  targetUid: string,
  staffUpdates: {
    fullName?: string;
    fullLegalName?: string;
    fatherName?: string;
    motherName?: string;
    guardianName?: string;
    mobileNumber?: string;
    email?: string;
    country?: string;
    state?: string;
    district?: string;
    address?: string;
    pincode?: string;
    emergencyContact?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
    educationalQualification?: string;
    staffId?: string;
    department?: string;
    designation?: string;
    joiningDate?: string;
    employmentStatus?: StaffEmploymentStatus;
    employmentType?: StaffEmploymentType;
    workLocation?: string;
    salaryGrade?: string;
    photoURL?: string;
    notes?: string;
    roles?: UserRole[];
    primaryRole?: UserRole;
  },
  actorInfo: { uid: string; email: string; role?: string }
): Promise<void> {
  const userRef = doc(db, 'users', targetUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    throw new Error('Target user profile not found.');
  }

  const existing = snap.data() as UserProfile;
  const updatePayload: Partial<UserProfile> = {
    updatedAt: new Date().toISOString(),
    isStaff: true
  };

  if (staffUpdates.fullName !== undefined) {
    updatePayload.fullName = staffUpdates.fullName.trim();
    updatePayload.fullLegalName = staffUpdates.fullName.trim();
    updatePayload.displayName = staffUpdates.fullName.trim();
  }
  if (staffUpdates.fatherName !== undefined) updatePayload.fatherName = staffUpdates.fatherName.trim();
  if (staffUpdates.motherName !== undefined) updatePayload.motherName = staffUpdates.motherName.trim();
  if (staffUpdates.guardianName !== undefined) updatePayload.guardianName = staffUpdates.guardianName.trim();
  if (staffUpdates.mobileNumber !== undefined) {
    updatePayload.mobileNumber = staffUpdates.mobileNumber.trim();
    updatePayload.phoneNumber = staffUpdates.mobileNumber.trim();
  }
  if (staffUpdates.country !== undefined) updatePayload.country = staffUpdates.country.trim();
  if (staffUpdates.state !== undefined) updatePayload.state = staffUpdates.state.trim();
  if (staffUpdates.district !== undefined) updatePayload.district = staffUpdates.district.trim();
  if (staffUpdates.address !== undefined) {
    updatePayload.address = staffUpdates.address.trim();
    updatePayload.fullAddress = staffUpdates.address.trim();
  }
  if (staffUpdates.pincode !== undefined) updatePayload.pincode = staffUpdates.pincode.trim();
  if (staffUpdates.emergencyContact !== undefined) updatePayload.emergencyContact = staffUpdates.emergencyContact.trim();
  if (staffUpdates.bloodGroup !== undefined) updatePayload.bloodGroup = staffUpdates.bloodGroup.trim();
  if (staffUpdates.dateOfBirth !== undefined) updatePayload.dateOfBirth = staffUpdates.dateOfBirth;
  if (staffUpdates.educationalQualification !== undefined) {
    updatePayload.educationalQualification = staffUpdates.educationalQualification.trim();
    updatePayload.qualification = staffUpdates.educationalQualification.trim();
  }

  if (staffUpdates.staffId !== undefined) updatePayload.staffId = staffUpdates.staffId.trim();
  if (staffUpdates.department !== undefined) updatePayload.department = staffUpdates.department.trim();
  if (staffUpdates.designation !== undefined) updatePayload.designation = staffUpdates.designation.trim();
  if (staffUpdates.joiningDate !== undefined) updatePayload.joiningDate = staffUpdates.joiningDate;
  if (staffUpdates.employmentStatus !== undefined) updatePayload.employmentStatus = staffUpdates.employmentStatus;
  if (staffUpdates.employmentType !== undefined) updatePayload.employmentType = staffUpdates.employmentType;
  if (staffUpdates.workLocation !== undefined) updatePayload.workLocation = staffUpdates.workLocation.trim();
  if (staffUpdates.salaryGrade !== undefined) updatePayload.salaryGrade = staffUpdates.salaryGrade.trim();
  if (staffUpdates.photoURL !== undefined) updatePayload.photoURL = staffUpdates.photoURL.trim();
  if (staffUpdates.notes !== undefined) updatePayload.notes = staffUpdates.notes.trim();

  // If system roles are also adjusted
  if (staffUpdates.roles !== undefined) {
    updatePayload.roles = staffUpdates.roles;
  }
  if (staffUpdates.primaryRole !== undefined) {
    updatePayload.primaryRole = staffUpdates.primaryRole;
  }

  await updateDoc(userRef, updatePayload);

  // Sync public verification record
  const effectiveStaffId = staffUpdates.staffId || existing.staffId;
  if (effectiveStaffId) {
    await syncPublicStaffVerification(effectiveStaffId, {
      ...existing,
      ...updatePayload
    });
  }

  // Audit Trail
  await logAuditEvent({
    actorUid: actorInfo.uid,
    actorEmail: actorInfo.email,
    actorRole: (actorInfo.role as UserRole) || 'hr_admin',
    action: 'STAFF_PROFILE_UPDATED',
    targetEntity: 'users',
    targetId: targetUid,
    details: {
      targetEmail: existing.email,
      staffId: effectiveStaffId,
      department: staffUpdates.department || existing.department,
      designation: staffUpdates.designation || existing.designation,
      employmentStatus: staffUpdates.employmentStatus || existing.employmentStatus
    }
  });
}

/**
 * Enrolls a staff member from an existing registered user profile or creates initial staff identity
 */
export async function enrollStaffMember(
  targetUid: string,
  enrollmentDetails: {
    staffId?: string;
    department: string;
    designation: string;
    joiningDate: string;
    employmentStatus: StaffEmploymentStatus;
    employmentType: StaffEmploymentType;
    workLocation?: string;
    notes?: string;
  },
  actorInfo: { uid: string; email: string; role?: string }
): Promise<string> {
  const userRef = doc(db, 'users', targetUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    throw new Error('User record not found to enroll as staff.');
  }

  const existing = snap.data() as UserProfile;
  const staffId = enrollmentDetails.staffId || existing.staffId || `FET-STF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const updatePayload: Partial<UserProfile> = {
    isStaff: true,
    staffId,
    department: enrollmentDetails.department,
    designation: enrollmentDetails.designation,
    joiningDate: enrollmentDetails.joiningDate,
    employmentStatus: enrollmentDetails.employmentStatus,
    employmentType: enrollmentDetails.employmentType,
    workLocation: enrollmentDetails.workLocation || 'Central Secretariat, Mumbai',
    notes: enrollmentDetails.notes || existing.notes || '',
    updatedAt: new Date().toISOString()
  };

  await updateDoc(userRef, updatePayload);

  // Sync public verification record
  await syncPublicStaffVerification(staffId, {
    ...existing,
    ...updatePayload
  });

  // Audit trail
  await logAuditEvent({
    actorUid: actorInfo.uid,
    actorEmail: actorInfo.email,
    actorRole: (actorInfo.role as UserRole) || 'hr_admin',
    action: 'STAFF_MEMBER_ENROLLED',
    targetEntity: 'users',
    targetId: targetUid,
    details: {
      staffId,
      targetEmail: existing.email,
      department: enrollmentDetails.department,
      designation: enrollmentDetails.designation,
      employmentStatus: enrollmentDetails.employmentStatus
    }
  });

  return staffId;
}

/**
 * Attaches a private document record to a staff profile
 */
export async function addStaffDocumentRecord(
  targetUid: string,
  documentData: Omit<StaffDocumentRecord, 'id' | 'uploadedAt'>,
  actorInfo: { uid: string; email: string; role?: string }
): Promise<void> {
  const userRef = doc(db, 'users', targetUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    throw new Error('Staff record not found.');
  }

  const existing = snap.data() as UserProfile;
  const existingDocs = existing.staffDocuments || [];

  const newDocRecord: StaffDocumentRecord = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: documentData.title.trim(),
    documentType: documentData.documentType,
    fileUrl: documentData.fileUrl?.trim() || '',
    fileName: documentData.fileName?.trim() || documentData.title.trim(),
    uploadedAt: new Date().toISOString(),
    verified: documentData.verified ?? true,
    notes: documentData.notes?.trim() || ''
  };

  const updatedDocs = [...existingDocs, newDocRecord];

  await updateDoc(userRef, {
    staffDocuments: updatedDocs,
    updatedAt: new Date().toISOString()
  });

  await logAuditEvent({
    actorUid: actorInfo.uid,
    actorEmail: actorInfo.email,
    actorRole: (actorInfo.role as UserRole) || 'hr_admin',
    action: 'STAFF_DOCUMENT_ATTACHED',
    targetEntity: 'users',
    targetId: targetUid,
    details: {
      documentId: newDocRecord.id,
      title: newDocRecord.title,
      documentType: newDocRecord.documentType,
      targetEmail: existing.email
    }
  });
}

/**
 * Deletes a private document record from a staff profile
 */
export async function deleteStaffDocumentRecord(
  targetUid: string,
  docId: string,
  actorInfo: { uid: string; email: string; role?: string }
): Promise<void> {
  const userRef = doc(db, 'users', targetUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const existing = snap.data() as UserProfile;
  const existingDocs = existing.staffDocuments || [];
  const filteredDocs = existingDocs.filter(d => d.id !== docId);

  await updateDoc(userRef, {
    staffDocuments: filteredDocs,
    updatedAt: new Date().toISOString()
  });

  await logAuditEvent({
    actorUid: actorInfo.uid,
    actorEmail: actorInfo.email,
    actorRole: (actorInfo.role as UserRole) || 'hr_admin',
    action: 'STAFF_DOCUMENT_REMOVED',
    targetEntity: 'users',
    targetId: targetUid,
    details: {
      documentId: docId,
      targetEmail: existing.email
    }
  });
}





