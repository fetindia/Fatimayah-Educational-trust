/**
 * @license
 * 27-Chapter Module Lifecycle & Activation Engine
 * Fatimyah Educational Trust India
 */

import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Ban, 
  ShieldCheck, 
  ShoppingBag, 
  Plane, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle2,
  Filter,
  Search,
  HelpCircle,
  Smartphone,
  Tag
} from 'lucide-react';
import { useModules } from '../../contexts/ModuleContext';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_ROLE_DEFINITIONS } from '../../data/initialData';
import { ModuleChapter, ModuleLifecycle } from '../../types';

export const AdminModulesView: React.FC = () => {
  const { 
    modules, 
    setModuleLifecycleState, 
    selectedSeries, 
    setSelectedSeries, 
    selectedLifecycle,
    setSelectedLifecycle,
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery, 
    filteredModules,
    lifecycleStats 
  } = useModules();

  const { currentUser, activeRole, isSuperAdmin } = useAuth();
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLifecycleChange = async (
    mod: ModuleChapter, 
    newLifecycle: ModuleLifecycle,
    newVis: boolean,
    newApp: boolean
  ) => {
    if (!currentUser) return;
    try {
      await setModuleLifecycleState(
        mod.id,
        newLifecycle,
        newVis,
        newApp,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'superadmin@fetindia.com',
          role: activeRole
        }
      );
      setSuccessMsg(`Updated Chapter ${mod.chapterNumber} (${mod.name}) to [${newLifecycle}]. State updated in audit log.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const getLifecycleBadge = (lifecycle: ModuleLifecycle) => {
    switch (lifecycle) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" /> PUBLISHED
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> READY
          </span>
        );
      case 'TESTING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> TESTING
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <AlertTriangle className="w-3.5 h-3.5" /> DRAFT
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
            <Ban className="w-3.5 h-3.5" /> DISABLED
          </span>
        );
    }
  };

  return (
    <div className="space-y-8" id="admin-modules-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-extrabold text-slate-900">27-Chapter Master SRS Architecture & Lifecycle Engine</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin sovereign lifecycle control (DRAFT • TESTING • READY • PUBLISHED • DISABLED). Disabled modules remain safely stored and isolated from public & user dashboard views.
          </p>
        </div>

        {/* Stats Pill Matrix */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            {lifecycleStats.published} Published
          </span>
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
            {lifecycleStats.ready} Ready
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            {lifecycleStats.testing} Testing
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
            {lifecycleStats.disabled} Disabled
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pre-Architected Modules Notice */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-800 text-amber-400 mt-0.5">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100">
              Pre-Architected Modules: FET Store (Ch 14) & FET Travel (Ch 15)
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
              Full enterprise schemas (Garments, Islamic Garments, Perfumes, Books; Umrah, Ziyarat) are architected from the foundation and safely stored in <span className="font-mono text-amber-300">DISABLED</span> lifecycle state until official trust launch.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Safe Isolation Active
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search 27 chapters by name, code, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Lifecycle Selector Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'PUBLISHED', 'READY', 'TESTING', 'DRAFT', 'DISABLED'] as const).map((lf) => (
            <button
              key={lf}
              onClick={() => setSelectedLifecycle(lf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                selectedLifecycle === lf
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              {lf === 'all' ? 'All Lifecycles' : lf}
            </button>
          ))}
        </div>
      </div>

      {/* Chapters Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">Ch.</th>
                <th className="py-3.5 px-4">Module Name & Master Code</th>
                <th className="py-3.5 px-4">Category & Scope</th>
                <th className="py-3.5 px-4">Responsible Admin</th>
                <th className="py-3.5 px-4">Lifecycle State</th>
                <th className="py-3.5 px-4 text-center">Public View</th>
                <th className="py-3.5 px-4 text-center">Mobile API</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModules.map((mod) => {
                const isEditing = activeEditingId === mod.id;
                const isStoreOrTravel = mod.code === 'MOD_FET_STORE' || mod.code === 'MOD_FET_TRAVEL';

                return (
                  <tr 
                    key={mod.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      mod.lifecycle === 'DISABLED' ? 'bg-slate-50/50 opacity-80' : ''
                    } ${isStoreOrTravel ? 'border-l-4 border-l-amber-500' : ''}`}
                  >
                    {/* Chapter Number */}
                    <td className="py-4 px-4 text-center font-extrabold text-slate-900">
                      <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center mx-auto border border-slate-200">
                        {mod.chapterNumber}
                      </span>
                    </td>

                    {/* Name & Code */}
                    <td className="py-4 px-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 text-sm">{mod.name}</span>
                          {isStoreOrTravel && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Pre-Architected
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{mod.code}</span>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-sm line-clamp-1">{mod.description}</p>
                      </div>
                    </td>

                    {/* Category & Features */}
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {mod.category}
                      </span>
                      {mod.subCategories && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {mod.subCategories.slice(0, 3).map((sc, i) => (
                            <span key={i} className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              {sc}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Required Role */}
                    <td className="py-4 px-4">
                      <span className="text-[11px] font-semibold text-slate-700">
                        {ADMIN_ROLE_DEFINITIONS[mod.requiredRole]?.label || mod.requiredRole}
                      </span>
                    </td>

                    {/* Lifecycle State */}
                    <td className="py-4 px-4">
                      {isEditing ? (
                        <select
                          defaultValue={mod.lifecycle}
                          id={`lifecycle-select-${mod.id}`}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="TESTING">TESTING</option>
                          <option value="READY">READY</option>
                          <option value="PUBLISHED">PUBLISHED</option>
                          <option value="DISABLED">DISABLED</option>
                        </select>
                      ) : (
                        getLifecycleBadge(mod.lifecycle)
                      )}
                    </td>

                    {/* Public Visibility */}
                    <td className="py-4 px-4 text-center">
                      {mod.isPubliclyVisible ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <Eye className="w-3.5 h-3.5" /> Visible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-[11px]">
                          <EyeOff className="w-3.5 h-3.5" /> Hidden
                        </span>
                      )}
                    </td>

                    {/* Mobile App API */}
                    <td className="py-4 px-4 text-center">
                      {mod.enabledInApp ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-semibold text-[11px]">
                          <Smartphone className="w-3.5 h-3.5" /> Synced
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const sel = document.getElementById(`lifecycle-select-${mod.id}`) as HTMLSelectElement;
                              if (sel) {
                                const newLife = sel.value as ModuleLifecycle;
                                const isPub = newLife === 'PUBLISHED';
                                handleLifecycleChange(mod, newLife, isPub, mod.enabledInApp);
                              }
                              setActiveEditingId(null);
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setActiveEditingId(null)}
                            className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs hover:bg-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveEditingId(mod.id)}
                          className="px-2.5 py-1 rounded border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
                        >
                          Configure
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
