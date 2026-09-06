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

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<OrgConfig>(DEFAULT_ORG_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initial fetch
    fetchOrgConfig().then((cfg) => {
      setConfig(cfg);
      setIsLoading(false);
    });

    // Real-time listener for Firestore CMS updates
    try {
      const unsub = onSnapshot(doc(db, 'organization_config', 'main_config'), (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as OrgConfig;
          setConfig({
            ...DEFAULT_ORG_CONFIG,
            ...remoteData,
            legalName: 'Fatimyah Educational Trust' // Strictly enforce legal protection
          });
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
  };

  const resetToDefaults = async (adminUser: { uid: string; email: string; role: UserRole }) => {
    const updated = await saveOrgConfig(DEFAULT_ORG_CONFIG, adminUser);
    setConfig(updated);
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
