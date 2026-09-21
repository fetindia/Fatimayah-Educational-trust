/**
 * @license
 * Authentication and RBAC Context
 * Fatimyah Educational Trust India
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut as firebaseSignOut,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  auth, 
  googleProvider, 
  getOrCreateUserProfile, 
  updateUserProfileData,
  SYSTEM_SUPER_ADMIN_EMAIL, 
  logAuditEvent 
} from '../lib/firebase';
import { 
  getEffectivePermissions, 
  checkUserPermission, 
  checkUserAnyPermission, 
  checkUserAllPermissions, 
  isAdministrativeRole 
} from '../lib/rbac';
import { AppPermission, UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  permissions: AppPermission[];
  isSuperAdmin: boolean;
  hasAdminAccess: boolean;
  canManageRoles: boolean;
  canManageModules: boolean;
  canManageSettings: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: AppPermission) => boolean;
  hasAnyPermission: (permissions: AppPermission[]) => boolean;
  hasAllPermissions: (permissions: AppPermission[]) => boolean;
  signInEmail: (email: string, pass: string) => Promise<FirebaseUser>;
  signUpEmail: (
    email: string, 
    pass: string, 
    fullName: string, 
    mobileNumber?: string, 
    country?: string,
    termsAccepted?: boolean
  ) => Promise<{ email: string; user: FirebaseUser }>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<UserProfile>;
  sendVerification: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await getOrCreateUserProfile(user);
          setUserProfile(profile);
          const initialActiveRole = profile.primaryRole || (profile.roles.includes('super_admin') ? 'super_admin' : profile.roles[0]) || 'user';
          setActiveRole(initialActiveRole);
        } catch (err) {
          console.warn('Profile resolution fallback:', err);
          const isSystemSuper = user.email?.toLowerCase() === SYSTEM_SUPER_ADMIN_EMAIL.toLowerCase();
          const fallbackProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            fullLegalName: user.displayName || user.email?.split('@')[0] || (isSystemSuper ? 'FET Secretariat Lead' : 'Registered User'),
            displayName: user.displayName || user.email?.split('@')[0] || (isSystemSuper ? 'FET Secretariat Lead' : 'Registered User'),
            roles: isSystemSuper ? ['super_admin', 'core_member'] : ['user'],
            primaryRole: isSystemSuper ? 'super_admin' : 'user',
            role: isSystemSuper ? 'super_admin' : 'user',
            accountType: isSystemSuper ? 'admin' : 'user',
            membershipStatus: isSystemSuper ? 'core_member' : 'none',
            volunteerStatus: 'none',
            donorStatus: 'none',
            permissions: isSystemSuper ? getEffectivePermissions(['super_admin']) : [],
            status: 'active',
            accountStatus: user.emailVerified ? 'active' : 'pending_verification',
            membershipId: isSystemSuper ? `FET-CORE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
            createdAt: new Date().toISOString()
          };
          setUserProfile(fallbackProfile);
          setActiveRole(fallbackProfile.primaryRole);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setActiveRole('user');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      try {
        const p = await getOrCreateUserProfile(currentUser);
        setUserProfile(p);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const isSuperAdmin = 
    activeRole === 'super_admin' || 
    userProfile?.roles?.includes('super_admin') || 
    currentUser?.email?.toLowerCase() === SYSTEM_SUPER_ADMIN_EMAIL.toLowerCase() ||
    false;

  const currentRoles: UserRole[] = userProfile?.roles || (currentUser ? [activeRole] : ['user']);
  const customPermissions: AppPermission[] = userProfile?.customPermissions || [];

  const permissions: AppPermission[] = isSuperAdmin
    ? getEffectivePermissions(['super_admin'])
    : getEffectivePermissions(currentRoles, customPermissions);

  const hasPermission = (permission: AppPermission): boolean => {
    if (isSuperAdmin) return true;
    return checkUserPermission(currentRoles, permission, customPermissions);
  };

  const hasAnyPermission = (targetPermissions: AppPermission[]): boolean => {
    if (isSuperAdmin) return true;
    return checkUserAnyPermission(currentRoles, targetPermissions, customPermissions);
  };

  const hasAllPermissions = (targetPermissions: AppPermission[]): boolean => {
    if (isSuperAdmin) return true;
    return checkUserAllPermissions(currentRoles, targetPermissions, customPermissions);
  };

  const canManageRoles = isSuperAdmin || hasPermission('roles.manage');
  const canManageModules = isSuperAdmin || hasPermission('modules.manage');
  const canManageSettings = isSuperAdmin || hasPermission('settings.manage');

  const adminRolesList: UserRole[] = [
    'super_admin',
    'administrator',
    'volunteer_admin',
    'member_admin',
    'donor_admin',
    'crowdfunding_admin',
    'examination_admin',
    'exam_admin',
    'exam_controller',
    'examiner',
    'school_admin',
    'madrasa_admin',
    'finance_admin',
    'hr_admin',
    'content_admin',
    'blog_admin',
    'store_admin',
    'travel_admin',
    'reports_admin'
  ];

  const hasAdminAccess = 
    isSuperAdmin || 
    adminRolesList.includes(activeRole) || 
    (userProfile?.roles?.some(r => adminRolesList.includes(r) || isAdministrativeRole(r)) ?? false) ||
    hasAnyPermission(['roles.manage', 'modules.manage', 'settings.manage']);

  const hasRole = (role: UserRole): boolean => {
    if (isSuperAdmin) return true;
    if (activeRole === role) return true;
    return userProfile?.roles?.includes(role) || false;
  };

  const signInEmail = async (email: string, pass: string): Promise<FirebaseUser> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const profile = await getOrCreateUserProfile(cred.user);
    setUserProfile(profile);
    setActiveRole(profile.primaryRole || 'user');
    return cred.user;
  };

  const signUpEmail = async (
    email: string, 
    pass: string, 
    fullName: string, 
    mobileNumber?: string, 
    country?: string,
    termsAccepted?: boolean
  ): Promise<{ email: string; user: FirebaseUser }> => {
    const cleanEmail = email.trim();
    const cleanName = fullName.trim();
    const cleanMobile = mobileNumber ? mobileNumber.trim() : '';
    const cleanCountry = country ? country.trim() : 'India';

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    
    // Update Firebase Auth profile display name
    if (cleanName) {
      try {
        await updateProfile(cred.user, { displayName: cleanName });
      } catch (err) {
        console.warn('Profile name update note:', err);
      }
    }

    // Send official Firebase email verification
    try {
      await sendEmailVerification(cred.user);
    } catch (verErr) {
      console.warn('Firebase email verification dispatch notice:', verErr);
    }

    // Create user profile in Firestore under users/{uid} with default 'user' role
    let profile: UserProfile;
    try {
      profile = await getOrCreateUserProfile(cred.user, {
        fullName: cleanName,
        fullLegalName: cleanName,
        mobileNumber: cleanMobile,
        country: cleanCountry,
        termsAccepted: termsAccepted ?? true
      });
    } catch (profErr) {
      console.warn('Profile creation fallback:', profErr);
      profile = {
        uid: cred.user.uid,
        email: cleanEmail,
        fullName: cleanName || cleanEmail.split('@')[0],
        fullLegalName: cleanName || cleanEmail.split('@')[0],
        displayName: cleanName || cleanEmail.split('@')[0],
        mobileNumber: cleanMobile,
        phoneNumber: cleanMobile,
        country: cleanCountry,
        photoURL: '',
        roles: ['user'],
        primaryRole: 'user',
        role: 'user',
        accountType: 'user',
        membershipStatus: 'none',
        volunteerStatus: 'none',
        donorStatus: 'none',
        status: 'active',
        emailVerified: cred.user.emailVerified,
        termsAccepted: termsAccepted ?? true,
        termsAcceptedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
    }

    setCurrentUser(cred.user);
    setUserProfile(profile);
    setActiveRole(profile.primaryRole || 'user');

    return { email: cred.user.email || cleanEmail, user: cred.user };
  };

  const sendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error('No authenticated user session found to send verification email.');
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setCurrentUser(updatedUser);
      if (updatedUser.emailVerified) {
        await refreshProfile();
      }
      return updatedUser.emailVerified;
    }
    return false;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signInGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const profile = await getOrCreateUserProfile(cred.user);
    setUserProfile(profile);
    setActiveRole(profile.primaryRole || (profile.roles?.[0] as UserRole) || 'user');
  };

  const updateProfileData = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    if (!currentUser) {
      throw new Error('No authenticated user session found.');
    }
    const updated = await updateUserProfileData(currentUser.uid, data);
    setUserProfile(updated);
    return updated;
  };

  const signOut = async () => {
    if (currentUser && userProfile) {
      await logAuditEvent({
        actorUid: currentUser.uid,
        actorEmail: currentUser.email || '',
        actorRole: activeRole,
        action: 'USER_LOGOUT',
        targetEntity: 'users',
        targetId: currentUser.uid,
        details: { email: currentUser.email }
      });
    }
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setActiveRole('user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoading,
        activeRole,
        setActiveRole,
        permissions,
        isSuperAdmin,
        hasAdminAccess,
        canManageRoles,
        canManageModules,
        canManageSettings,
        hasRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        signInEmail,
        signUpEmail,
        updateProfileData,
        sendVerification,
        checkEmailVerification,
        resetPassword,
        signInGoogle,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
