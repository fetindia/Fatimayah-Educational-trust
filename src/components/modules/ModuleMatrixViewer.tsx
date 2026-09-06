/**
 * @license
 * 27-Chapter Module Matrix & 3-Series Roadmap Viewer
 * Fatimyah Educational Trust India
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Ban, 
  Sparkles, 
  ShieldAlert, 
  ShoppingBag, 
  SlidersHorizontal,
  ChevronRight,
  Info,
  Smartphone,
  BookOpen,
  UserCheck,
  Building,
  GraduationCap
} from 'lucide-react';
import { useModules } from '../../contexts/ModuleContext';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_ROLE_DEFINITIONS } from '../../data/initialData';
import { ModuleChapter, ModuleLifecycle } from '../../types';

interface ModuleMatrixViewerProps {
  onOpenAdmin: (view?: string) => void;
}

export const ModuleMatrixViewer: React.FC<ModuleMatrixViewerProps> = ({ onOpenAdmin }) => {
  const { 
    modules, 
    selectedSeries, 
    setSelectedSeries, 
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery, 
    filteredModules,
    seriesStats 
  } = useModules();

  const { isSuperAdmin, hasAdminAccess } = useAuth();
  const [selectedModule, setSelectedModule] = useState<ModuleChapter | null>(null);

  const getStatusBadge = (lifecycle: ModuleLifecycle) => {
    switch (lifecycle) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Published (Live)
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" /> Ready
          </span>
        );
      case 'TESTING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Testing
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3 h-3 text-slate-500" /> Draft
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Ban className="w-3 h-3 text-rose-500" /> Disabled
          </span>
        );
    }
  };

  const getSeriesColor = (series: 1 | 2 | 3) => {
    switch (series) {
      case 1:
        return 'border-emerald-500 bg-emerald-950/10 text-emerald-800';
      case 2:
        return 'border-blue-500 bg-blue-950/10 text-blue-800';
      case 3:
        return 'border-amber-500 bg-amber-950/10 text-amber-800';
    }
  };

  const categories = [
    'all',
    'Governance & Core',
    'Community & Services',
    'Education & Welfare',
    'Enterprise & Future'
  ];

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-slate-200" id="modules-roadmap">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-blue-900 border border-blue-300 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Full-Stack Modular Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              27 Functional Chapters & 3-Series Roadmap
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Designed from day one to allow every module to be built independently, tested privately in sandboxes, activated or deactivated dynamically, and synchronized with the future mobile application.
            </p>
          </div>

          {hasAdminAccess && (
            <button
              onClick={() => onOpenAdmin('modules')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all cursor-pointer shrink-0"
              id="fet-admin-matrix-controller-btn"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>Manage Activation Matrix</span>
            </button>
          )}
        </div>

        {/* 3-Series Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Series 1 */}
          <button
            onClick={() => setSelectedSeries(selectedSeries === 1 ? 'all' : 1)}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedSeries === 1 
                ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20' 
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-emerald-800 text-white">
                Series 1
              </span>
              <span className="text-xs font-bold text-emerald-800">Chapters 1 – 9</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Foundation & Core Community Ops</h3>
            <p className="text-xs text-slate-600 mt-1">Core authentication, RBAC governance, Dynamic CMS, audit logs, members, volunteers, donors.</p>
            <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-emerald-800">
              <span>{seriesStats.series1.active} Live Chapters</span>
              <span>•</span>
              <span className="text-slate-500">{seriesStats.series1.total} Total</span>
            </div>
          </button>

          {/* Series 2 */}
          <button
            onClick={() => setSelectedSeries(selectedSeries === 2 ? 'all' : 2)}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedSeries === 2 
                ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20' 
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-blue-800 text-white">
                Series 2
              </span>
              <span className="text-xs font-bold text-blue-800">Chapters 10 – 18</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Education, Welfare & Programs</h3>
            <p className="text-xs text-slate-600 mt-1">Scholarships, talent exams, learning LMS, career mentorship, medical camps, bulletins.</p>
            <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-blue-800">
              <span>{seriesStats.series2.beta} Beta Modules</span>
              <span>•</span>
              <span className="text-slate-500">{seriesStats.series2.total} Total</span>
            </div>
          </button>

          {/* Series 3 */}
          <button
            onClick={() => setSelectedSeries(selectedSeries === 3 ? 'all' : 3)}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedSeries === 3 
                ? 'border-amber-600 bg-amber-50/70 shadow-md ring-2 ring-amber-500/20' 
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-amber-700 text-white">
                Series 3
              </span>
              <span className="text-xs font-bold text-amber-800">Chapters 19 – 27</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Enterprise, Store & Advanced Services</h3>
            <p className="text-xs text-slate-600 mt-1">FET Store (clothing, perfumes, books), affiliations, alumni, legal aid, verification, mobile sync.</p>
            <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-amber-800">
              <span>Architected & Pre-launch</span>
              <span>•</span>
              <span className="text-slate-500">{seriesStats.series3.total} Total</span>
            </div>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chapters, features, roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              id="module-search-input"
            />
          </div>

          {/* Series & Category Selectors */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 text-xs">
              <button
                onClick={() => setSelectedSeries('all')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  selectedSeries === 'all' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Series
              </button>
              <button
                onClick={() => setSelectedSeries(1)}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  selectedSeries === 1 ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Series 1
              </button>
              <button
                onClick={() => setSelectedSeries(2)}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  selectedSeries === 2 ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Series 2
              </button>
              <button
                onClick={() => setSelectedSeries(3)}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  selectedSeries === 3 ? 'bg-amber-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Series 3
              </button>
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 27-Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map((mod) => {
            const isStore = mod.code === 'MOD_OFFICIAL_STORE';
            return (
              <div
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                  isStore 
                    ? 'border-amber-400 bg-amber-50/40 hover:border-amber-500' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Chapter Number, Series & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase bg-slate-900 text-white font-mono">
                        Ch. {mod.chapterNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeriesColor(mod.series)}`}>
                        Series {mod.series}
                      </span>
                    </div>
                    {getStatusBadge(mod.lifecycle)}
                  </div>

                  {/* Chapter Name & Category */}
                  <div>
                    <h4 className="text-base font-bold text-slate-900 leading-snug">{mod.name}</h4>
                    <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">{mod.category}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {mod.description}
                  </p>

                  {/* Special Store Subcategories Showcase */}
                  {isStore && mod.subCategories && (
                    <div className="p-3 rounded-xl bg-amber-100/60 border border-amber-300/80 space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                        <span>Pre-Architected Product Categories:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {mod.subCategories.map((sub, sIdx) => (
                          <span key={sIdx} className="px-1.5 py-0.5 bg-white rounded text-[10px] font-semibold text-amber-950 border border-amber-200">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features Bullets */}
                  <div className="space-y-1 pt-1">
                    {mod.features.slice(0, 3).map((f, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                    {mod.features.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-semibold pl-3">
                        +{mod.features.length - 3} more technical capabilities
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer of Card: Role Required & Details Trigger */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-[11px]">Role:</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {mod.requiredRole === 'public' ? 'Public' : ADMIN_ROLE_DEFINITIONS[mod.requiredRole]?.label || mod.requiredRole}
                    </span>
                  </div>
                  <span className="text-emerald-700 font-semibold flex items-center gap-0.5 hover:underline">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal for Deep Chapter Inspection */}
        {selectedModule && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-black bg-slate-900 text-white font-mono">
                      Chapter {selectedModule.chapterNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getSeriesColor(selectedModule.series)}`}>
                      Series {selectedModule.series}
                    </span>
                    {getStatusBadge(selectedModule.lifecycle)}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedModule.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Code: {selectedModule.code}</p>
                </div>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Functional Description</h5>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedModule.description}</p>
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Technical Architecture Scope</h5>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed">
                    {selectedModule.technicalScope}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Architected Features & Endpoints</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedModule.features.map((feat, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedModule.subCategories && (
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">Subcategories & Product Lines</h5>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-xs text-amber-900">
                      {selectedModule.subCategories.map((sub, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2">
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{sub}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span>Authorized Role: </span>
                  <strong className="text-slate-800">
                    {selectedModule.requiredRole === 'public' ? 'Public' : ADMIN_ROLE_DEFINITIONS[selectedModule.requiredRole]?.label || selectedModule.requiredRole}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedModule(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    Close
                  </button>
                  {hasAdminAccess && (
                    <button
                      onClick={() => {
                        setSelectedModule(null);
                        onOpenAdmin('modules');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer"
                    >
                      Administer Module
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
