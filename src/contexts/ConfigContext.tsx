/**
 * @license
 * Dynamic Branding and CMS Configuration Context
 * Fatimyah Educational Trust India
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, fetchOrgConfig, saveOrgConfig } from '../lib/firebase';
import { DEFAULT_ORG_CONFIG } from '../data/initialData';
import { OrgConfig, UserRole } from '../types';

interface ConfigContextType {
  config: OrgConfig;
  isLoading: boolean;
  updateConfig: (
    newConfig: Partial<OrgConfig>, 
    adminUser: { uid: string; email: string; role: UserRole }
  ) => Promise<void>;
  resetToDefaults: (adminUser: { uid: string; email: string; role: UserRole }) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Helper to ensure official Trust identifiers are strictly up to date
const normalizeConfig = (raw?: Partial<OrgConfig>): OrgConfig => {
  const merged: OrgConfig = {
    ...DEFAULT_ORG_CONFIG,
    ...(raw || {}),
    legalName: 'FATIMYAH EDUCATIONAL TRUST',
    trustName: 'FATIMYAH EDUCATIONAL TRUST'
  };

  // Ensure verified Trust registration number is E 9822
  if (
    !merged.registrationNumber ||
    merged.registrationNumber === 'Registered in Jammu & Kashmir through SDM Office (1994)' ||
    merged.registrationNumber === 'E-19842' ||
    merged.registrationNumber === 'E-15344' ||
    merged.registrationNumber === 'E19842' ||
    merged.registrationNumber === '48/IV/2012'
  ) {
    merged.registrationNumber = 'E 9822';
  }

  // Ensure Registration Jurisdiction is Jammu & Kashmir
  if (!merged.registrationJurisdiction || merged.registrationJurisdiction.toLowerCase().includes('mumbai') || merged.registrationJurisdiction.toLowerCase().includes('maharashtra') || merged.registrationJurisdiction.toLowerCase().includes('bombay')) {
    merged.registrationJurisdiction = 'Jammu & Kashmir';
  }

  // Ensure Registration Authority is SDM Office
  if (!merged.registrationAuthority || merged.registrationAuthority.toLowerCase().includes('mumbai') || merged.registrationAuthority.toLowerCase().includes('charity commissioner') || merged.registrationAuthority.toLowerCase().includes('bombay') || merged.registrationAuthority.toLowerCase().includes('maharashtra')) {
    merged.registrationAuthority = 'Sub-Divisional Magistrate (SDM) Office, Jammu & Kashmir';
  }

  // Clear any incorrect Bombay/Maharashtra wording or unverified statute/Act (never invent or guess an Act)
  if (merged.registrationAct && (
    merged.registrationAct.toLowerCase().includes('mumbai') || 
    merged.registrationAct.toLowerCase().includes('1950') || 
    merged.registrationAct.toLowerCase().includes('bombay') ||
    merged.registrationAct.toLowerCase().includes('maharashtra') ||
    merged.registrationAct.toLowerCase().includes('charity commissioner')
  )) {
    merged.registrationAct = '';
  }

  // Ensure safe legal description
  if (!merged.legalStatusDescription || merged.legalStatusDescription.toLowerCase().includes('bombay') || merged.legalStatusDescription.toLowerCase().includes('maharashtra') || merged.legalStatusDescription.toLowerCase().includes('mumbai')) {
    merged.legalStatusDescription = 'Registered in Jammu & Kashmir';
  }

  // Automatically modernize outdated placeholder DARPAN and PAN identifiers
  if (!merged.nitiAayogId || merged.nitiAayogId === 'MH/2021/028914') {
    merged.nitiAayogId = 'JK/2026/1153821';
  }
  if (!merged.darpanId || merged.darpanId === 'MH/2021/028914') {
    merged.darpanId = 'JK/2026/1153821';
  }
  if (!merged.panNumber || merged.panNumber === 'AAATF1234A') {
    merged.panNumber = 'AABTF0015H';
  }
  if (merged.aboutTrust) {
    if (!merged.aboutTrust.registrationNumber || merged.aboutTrust.registrationNumber === 'Registered in Jammu & Kashmir through SDM Office (1994)' || merged.aboutTrust.registrationNumber === 'E-19842' || merged.aboutTrust.registrationNumber === 'E-15344') {
      merged.aboutTrust.registrationNumber = 'E 9822';
    }
    if (!merged.aboutTrust.registrationJurisdiction || merged.aboutTrust.registrationJurisdiction.toLowerCase().includes('mumbai') || merged.aboutTrust.registrationJurisdiction.toLowerCase().includes('maharashtra') || merged.aboutTrust.registrationJurisdiction.toLowerCase().includes('bombay')) {
      merged.aboutTrust.registrationJurisdiction = 'Jammu & Kashmir';
    }
    if (!merged.aboutTrust.registrationAuthority || merged.aboutTrust.registrationAuthority.toLowerCase().includes('mumbai') || merged.aboutTrust.registrationAuthority.toLowerCase().includes('charity commissioner') || merged.aboutTrust.registrationAuthority.toLowerCase().includes('bombay') || merged.aboutTrust.registrationAuthority.toLowerCase().includes('maharashtra')) {
      merged.aboutTrust.registrationAuthority = 'Sub-Divisional Magistrate (SDM) Office, Jammu & Kashmir';
    }
    if (merged.aboutTrust.registrationAct && (
      merged.aboutTrust.registrationAct.toLowerCase().includes('mumbai') || 
      merged.aboutTrust.registrationAct.toLowerCase().includes('1950') ||
      merged.aboutTrust.registrationAct.toLowerCase().includes('bombay') ||
      merged.aboutTrust.registrationAct.toLowerCase().includes('maharashtra') ||
      merged.aboutTrust.registrationAct.toLowerCase().includes('charity commissioner')
    )) {
      merged.aboutTrust.registrationAct = '';
    }
    if (merged.aboutTrust.darpanNgoId === 'MH/2021/028914') {
      merged.aboutTrust.darpanNgoId = 'JK/2026/1153821';
    }
    if (merged.aboutTrust.panNumberPublic === 'AAATF1234A') {
      merged.aboutTrust.panNumberPublic = 'AABTF0015H';
    }
  }
  return merged;
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<OrgConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fet_org_config_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          return normalizeConfig(parsed);
        }
      } catch (e) {
        console.warn('Failed to parse cached org config:', e);
      }
    }
    return DEFAULT_ORG_CONFIG;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initial fetch
    fetchOrgConfig().then((cfg) => {
      const merged = normalizeConfig(cfg);
      setConfig(merged);
      setIsLoading(false);
      try {
        localStorage.setItem('fet_org_config_cache', JSON.stringify(merged));
      } catch (e) {}
    });

    // Real-time listener for Firestore CMS updates
    try {
      const unsub = onSnapshot(doc(db, 'organization_config', 'main_config'), (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as OrgConfig;
          const merged = normalizeConfig(remoteData);
          setConfig(merged);
          try {
            localStorage.setItem('fet_org_config_cache', JSON.stringify(merged));
          } catch (e) {}
        }
      }, (err) => {
        console.warn('Realtime config listener notice:', err);
      });

      return () => unsub();
    } catch (e) {
      console.warn('Config snapshot initialization:', e);
    }
  }, []);

  // Update dynamic CSS custom properties for the 3 primary logo colors
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--color-primary-green', config.primaryGreen || '#0D6E42');
      root.style.setProperty('--color-primary-blue', config.primaryBlue || '#0B2545');
      root.style.setProperty('--color-accent-amber', config.accentAmber || '#D97706');
    }
  }, [config.primaryGreen, config.primaryBlue, config.accentAmber]);

  const updateConfig = async (
    newConfig: Partial<OrgConfig>, 
    adminUser: { uid: string; email: string; role: UserRole }
  ) => {
    const updated = await saveOrgConfig(newConfig, adminUser);
    setConfig(updated);
    try {
      localStorage.setItem('fet_org_config_cache', JSON.stringify(updated));
    } catch (e) {}
  };

  const resetToDefaults = async (adminUser: { uid: string; email: string; role: UserRole }) => {
    const updated = await saveOrgConfig(DEFAULT_ORG_CONFIG, adminUser);
    setConfig(updated);
    try {
      localStorage.setItem('fet_org_config_cache', JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <ConfigContext.Provider value={{ config, isLoading, updateConfig, resetToDefaults }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
