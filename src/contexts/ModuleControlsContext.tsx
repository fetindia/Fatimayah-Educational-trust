/**
 * @license
 * Centralized Super Admin Feature & Module Controls Context
 * Fatimyah Educational Trust India (FET India)
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db, cleanFirestoreData } from '../lib/firebase';
import { SystemModuleKey, SystemModuleSetting, SystemModuleControlsDoc } from '../types';

export const DEFAULT_SYSTEM_MODULE_CONTROLS: Record<SystemModuleKey, SystemModuleSetting> = {
  examinations: {
    key: 'examinations',
    name: 'Competition, Examination & Certification',
    code: 'MOD_EXAM_CERTIFICATION',
    description: 'National talent search competitions, online proctored examinations, roll numbers, syllabus downloads, and certified result publishing.',
    enabled: true,
    status: 'active',
    isCore: true,
    locked: true,
    category: 'Education & Welfare',
    routePath: '/programs/exams'
  },
  store: {
    key: 'store',
    name: 'FET India Store & Ethical Merchandise',
    code: 'MOD_FET_STORE',
    description: 'Ethical commerce supporting trust welfare missions: modest garments, traditional attars, Islamic books, and stationery.',
    enabled: false,
    status: 'disabled',
    isCore: false,
    locked: false,
    category: 'Enterprise & Commerce',
    routePath: '/store'
  },
  school_erp: {
    key: 'school_erp',
    name: 'School ERP Academic Administration',
    code: 'MOD_SCHOOL_ERP',
    description: 'Comprehensive academic administration for trust schools: student admissions, fee tracking, attendance, and faculty schedules.',
    enabled: false,
    status: 'disabled',
    isCore: false,
    locked: false,
    category: 'Education & Welfare',
    routePath: '/erp/school'
  },
  madarsa_erp: {
    key: 'madarsa_erp',
    name: 'Madarsa ERP & Islamic Curriculum',
    code: 'MOD_MADRASA_ERP',
    description: 'Specialized management for affiliated madrasas: Hifz & Tajweed tracking, Alim course records, boarding attendance, and ethical curricula.',
    enabled: false,
    status: 'disabled',
    isCore: false,
    locked: false,
    category: 'Education & Welfare',
    routePath: '/erp/madrasa'
  },
  education_empowerment: {
    key: 'education_empowerment',
    name: 'Education & Empowerment Initiatives',
    code: 'MOD_EDUCATION_EMPOWERMENT',
    description: 'Student career mentorship, digital LMS curriculum library, and educational welfare aid.',
    enabled: false,
    status: 'disabled',
    isCore: false,
    locked: false,
    category: 'Education & Welfare',
    routePath: '/programs'
  },
  higher_education_grant: {
    key: 'higher_education_grant',
    name: 'Higher Education Grants & Degree Scholarships',
    code: 'MOD_SCHOLARSHIP_MGMT',
    description: 'Merit-cum-means financial aid for college degrees. Formally deferred — scheduled for future release; no mock filings permitted.',
    enabled: false,
    status: 'deferred',
    isCore: false,
    locked: true,
    category: 'Education & Welfare',
    routePath: '/programs/scholarships'
  }
};

interface ModuleControlsContextType {
  moduleControls: Record<SystemModuleKey, SystemModuleSetting>;
  isLoading: boolean;
  isModuleEnabled: (key: SystemModuleKey) => boolean;
  getModuleSetting: (key: SystemModuleKey) => SystemModuleSetting;
  updateModuleControl: (
    key: SystemModuleKey,
    enabled: boolean,
    status?: 'active' | 'disabled' | 'deferred',
    adminUser?: { uid: string; email: string }
  ) => Promise<void>;
}

const ModuleControlsContext = createContext<ModuleControlsContextType | undefined>(undefined);

export const ModuleControlsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [moduleControls, setModuleControls] = useState<Record<SystemModuleKey, SystemModuleSetting>>(DEFAULT_SYSTEM_MODULE_CONTROLS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const settingsDocRef = doc(db, 'system_settings', 'module_controls');

    // Initial fetch and auto-seed if absent
    getDoc(settingsDocRef)
      .then(async (snap) => {
        if (!snap.exists()) {
          const initialDoc: SystemModuleControlsDoc = {
            modules: DEFAULT_SYSTEM_MODULE_CONTROLS,
            updatedAt: new Date().toISOString(),
            updatedBy: 'system_init'
          };
          try {
            await setDoc(settingsDocRef, cleanFirestoreData(initialDoc), { merge: true });
          } catch (e) {
            console.warn('Notice seeding system_settings/module_controls:', e);
          }
        }
      })
      .catch((err) => {
        console.warn('Notice checking module controls doc:', err);
      });

    // Real-time listener
    const unsub = onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists() && isMounted) {
        const data = snap.data() as Partial<SystemModuleControlsDoc>;
        if (data.modules) {
          // Merge with defaults to ensure all keys exist
          setModuleControls({
            ...DEFAULT_SYSTEM_MODULE_CONTROLS,
            ...data.modules,
            // Core examination system is strictly locked active
            examinations: {
              ...DEFAULT_SYSTEM_MODULE_CONTROLS.examinations,
              ...(data.modules.examinations || {}),
              enabled: true,
              status: 'active',
              isCore: true,
              locked: true
            },
            // Higher education grant is strictly deferred
            higher_education_grant: {
              ...DEFAULT_SYSTEM_MODULE_CONTROLS.higher_education_grant,
              ...(data.modules.higher_education_grant || {}),
              enabled: false,
              status: 'deferred',
              locked: true
            }
          });
        }
      }
      if (isMounted) setIsLoading(false);
    }, (err) => {
      console.warn('Realtime module controls listener notice:', err);
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const isModuleEnabled = (key: SystemModuleKey): boolean => {
    if (key === 'examinations') return true; // Core permanently active
    if (key === 'higher_education_grant') return false; // Strictly deferred
    return Boolean(moduleControls[key]?.enabled);
  };

  const getModuleSetting = (key: SystemModuleKey): SystemModuleSetting => {
    return moduleControls[key] || DEFAULT_SYSTEM_MODULE_CONTROLS[key];
  };

  const updateModuleControl = async (
    key: SystemModuleKey,
    enabled: boolean,
    statusOverride?: 'active' | 'disabled' | 'deferred',
    adminUser?: { uid: string; email: string }
  ) => {
    // Guards
    if (key === 'examinations') {
      throw new Error('Action blocked: Examination & Certification is the core operational system and cannot be disabled.');
    }
    if (key === 'higher_education_grant') {
      throw new Error('Action blocked: Higher Education Grants are deferred and scheduled for future release.');
    }

    const determinedStatus = statusOverride || (enabled ? 'active' : 'disabled');
    const existing = moduleControls[key] || DEFAULT_SYSTEM_MODULE_CONTROLS[key];
    const updatedSetting: SystemModuleSetting = {
      ...existing,
      enabled,
      status: determinedStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser?.email || 'admin@fetindia.com'
    };

    const updatedMap = {
      ...moduleControls,
      [key]: updatedSetting
    };

    // Optimistic update
    setModuleControls(updatedMap);

    const docPayload: SystemModuleControlsDoc = {
      modules: updatedMap,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser?.email || 'admin@fetindia.com'
    };

    // 1. Update Firestore system_settings/module_controls
    await setDoc(doc(db, 'system_settings', 'module_controls'), cleanFirestoreData(docPayload), { merge: true });

    // 2. Sync corresponding 27-chapter module doc if applicable
    const codeMap: Record<SystemModuleKey, string> = {
      store: 'mod-14',
      school_erp: 'mod-5',
      madarsa_erp: 'mod-6',
      education_empowerment: 'mod-23',
      higher_education_grant: 'mod-21',
      examinations: 'mod-4'
    };

    const targetDocId = codeMap[key];
    if (targetDocId) {
      try {
        await setDoc(doc(db, 'modules', targetDocId), {
          enabledInApp: enabled,
          lifecycle: enabled ? 'PUBLISHED' : 'DISABLED',
          isPubliclyVisible: enabled,
          updatedAt: new Date().toISOString(),
          updatedBy: adminUser?.email || 'admin@fetindia.com'
        }, { merge: true });
      } catch (modErr) {
        console.warn('Notice syncing module matrix document:', modErr);
      }
    }

    // 3. Inform server-side proxy
    try {
      await fetch('/api/system/module-controls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-uid': adminUser?.uid || 'super_admin'
        },
        body: JSON.stringify({
          key,
          enabled,
          status: determinedStatus,
          adminEmail: adminUser?.email || 'admin@fetindia.com'
        })
      });
    } catch {
      // Backend cache update notice
    }

    // 4. Audit Log
    try {
      await addDoc(collection(db, 'audit_logs'), cleanFirestoreData({
        action: 'MODULE_CONTROL_UPDATED',
        userId: adminUser?.uid || 'super_admin',
        userEmail: adminUser?.email || 'admin@fetindia.com',
        details: `Toggled module "${updatedSetting.name}" (${updatedSetting.code}) -> ${enabled ? 'ACTIVE' : 'DISABLED'}`,
        timestamp: new Date().toISOString()
      }));
    } catch {
      // Non-blocking
    }
  };

  return (
    <ModuleControlsContext.Provider
      value={{
        moduleControls,
        isLoading,
        isModuleEnabled,
        getModuleSetting,
        updateModuleControl
      }}
    >
      {children}
    </ModuleControlsContext.Provider>
  );
};

export const useModuleControls = (): ModuleControlsContextType => {
  const context = useContext(ModuleControlsContext);
  if (!context) {
    throw new Error('useModuleControls must be used within a ModuleControlsProvider');
  }
  return context;
};
