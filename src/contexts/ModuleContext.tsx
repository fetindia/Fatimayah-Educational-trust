/**
 * @license
 * 27-Chapter Master Module Lifecycle Matrix Context
 * Fatimyah Educational Trust India
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, initializeModulesIfEmpty, updateModuleLifecycle } from '../lib/firebase';
import { MASTER_27_MODULES } from '../data/initialData';
import { ModuleChapter, ModuleLifecycle, UserRole } from '../types';

interface ModuleContextType {
  modules: ModuleChapter[];
  isLoading: boolean;
  selectedSeries: 1 | 2 | 3 | 'all';
  setSelectedSeries: (series: 1 | 2 | 3 | 'all') => void;
  selectedCategory: string | 'all';
  setSelectedCategory: (cat: string | 'all') => void;
  selectedLifecycle: ModuleLifecycle | 'all';
  setSelectedLifecycle: (lf: ModuleLifecycle | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredModules: ModuleChapter[];
  publicActiveModules: ModuleChapter[];
  userVisibleModules: ModuleChapter[];
  getModuleByCode: (code: string) => ModuleChapter | undefined;
  getModuleByNumber: (num: number) => ModuleChapter | undefined;
  setModuleLifecycleState: (
    moduleId: string,
    lifecycle: ModuleLifecycle,
    isPubliclyVisible: boolean,
    enabledInApp: boolean,
    adminUser: { uid: string; email: string; role: UserRole }
  ) => Promise<void>;
  lifecycleStats: {
    total: number;
    draft: number;
    testing: number;
    ready: number;
    published: number;
    disabled: number;
  };
  seriesStats: {
    series1: { total: number; active: number; beta: number; ready: number };
    series2: { total: number; active: number; beta: number; ready: number };
    series3: { total: number; active: number; beta: number; ready: number };
  };
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const ModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<ModuleChapter[]>(MASTER_27_MODULES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSeries, setSelectedSeries] = useState<1 | 2 | 3 | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [selectedLifecycle, setSelectedLifecycle] = useState<ModuleLifecycle | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    initializeModulesIfEmpty().then((initial) => {
      setModules(initial);
      setIsLoading(false);
    });

    try {
      const unsub = onSnapshot(collection(db, 'modules'), (snapshot) => {
        if (!snapshot.empty) {
          const remoteList: ModuleChapter[] = [];
          snapshot.forEach((doc) => {
            remoteList.push(doc.data() as ModuleChapter);
          });
          // Sort by chapter number
          remoteList.sort((a, b) => a.chapterNumber - b.chapterNumber);
          if (remoteList.length > 0) {
            setModules(remoteList);
          }
        }
      }, (err) => {
        console.warn('Module listener note:', err);
      });

      return () => unsub();
    } catch (e) {
      console.warn('Module listener setup:', e);
    }
  }, []);

  const getModuleByCode = (code: string) => modules.find(m => m.code === code);
  const getModuleByNumber = (num: number) => modules.find(m => m.chapterNumber === num);

  const setModuleLifecycleState = async (
    moduleId: string,
    lifecycle: ModuleLifecycle,
    isPubliclyVisible: boolean,
    enabledInApp: boolean,
    adminUser: { uid: string; email: string; role: UserRole }
  ) => {
    // Optimistic update
    setModules(prev => prev.map(m => m.id === moduleId ? {
      ...m,
      lifecycle,
      isPubliclyVisible,
      enabledInApp,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser.email
    } : m));

    await updateModuleLifecycle(moduleId, lifecycle, isPubliclyVisible, enabledInApp, adminUser);
  };

  // Modules that are safe and active for public display (PUBLISHED + isPubliclyVisible)
  const publicActiveModules = modules.filter(
    m => m.lifecycle === 'PUBLISHED' && m.isPubliclyVisible
  );

  // Modules that are visible to logged-in user dashboard (PUBLISHED or READY, and not DISABLED)
  const userVisibleModules = modules.filter(
    m => m.lifecycle !== 'DISABLED' && (m.lifecycle === 'PUBLISHED' || m.lifecycle === 'READY')
  );

  const filteredModules = modules.filter(m => {
    const matchesSeries = selectedSeries === 'all' || m.series === selectedSeries;
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesLife = selectedLifecycle === 'all' || m.lifecycle === selectedLifecycle;
    const matchesQuery = 
      searchQuery.trim() === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.chapterNumber.toString() === searchQuery.trim();

    return matchesSeries && matchesCat && matchesLife && matchesQuery;
  });

  const lifecycleStats = {
    total: modules.length,
    draft: modules.filter(m => m.lifecycle === 'DRAFT').length,
    testing: modules.filter(m => m.lifecycle === 'TESTING').length,
    ready: modules.filter(m => m.lifecycle === 'READY').length,
    published: modules.filter(m => m.lifecycle === 'PUBLISHED').length,
    disabled: modules.filter(m => m.lifecycle === 'DISABLED').length,
  };

  const seriesStats = {
    series1: {
      total: modules.filter(m => m.series === 1).length,
      active: modules.filter(m => m.series === 1 && m.lifecycle === 'PUBLISHED').length,
      beta: modules.filter(m => m.series === 1 && (m.lifecycle === 'TESTING' || m.lifecycle === 'READY')).length,
      ready: modules.filter(m => m.series === 1 && m.lifecycle === 'READY').length,
    },
    series2: {
      total: modules.filter(m => m.series === 2).length,
      active: modules.filter(m => m.series === 2 && m.lifecycle === 'PUBLISHED').length,
      beta: modules.filter(m => m.series === 2 && (m.lifecycle === 'TESTING' || m.lifecycle === 'READY')).length,
      ready: modules.filter(m => m.series === 2 && m.lifecycle === 'READY').length,
    },
    series3: {
      total: modules.filter(m => m.series === 3).length,
      active: modules.filter(m => m.series === 3 && m.lifecycle === 'PUBLISHED').length,
      beta: modules.filter(m => m.series === 3 && (m.lifecycle === 'TESTING' || m.lifecycle === 'READY')).length,
      ready: modules.filter(m => m.series === 3 && m.lifecycle === 'READY').length,
    },
  };

  return (
    <ModuleContext.Provider
      value={{
        modules,
        isLoading,
        selectedSeries,
        setSelectedSeries,
        selectedCategory,
        setSelectedCategory,
        selectedLifecycle,
        setSelectedLifecycle,
        searchQuery,
        setSearchQuery,
        filteredModules,
        publicActiveModules,
        userVisibleModules,
        getModuleByCode,
        getModuleByNumber,
        setModuleLifecycleState,
        lifecycleStats,
        seriesStats
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
};

export const useModules = (): ModuleContextType => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
};
