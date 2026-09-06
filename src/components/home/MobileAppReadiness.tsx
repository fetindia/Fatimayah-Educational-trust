/**
 * @license
 * Mobile App Unified Backend Readiness Blueprint
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { Smartphone, Database, ShieldCheck, Zap, RefreshCw, Layers, CheckCircle2, Lock } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

export const MobileAppReadiness: React.FC = () => {
  const { config } = useConfig();

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  const capabilities = [
    {
      title: 'Single Firebase Data Core',
      desc: 'Both the FET India Web Portal and Mobile App share identical Firestore collections, RBAC profiles, and security rules without redundant APIs.',
      icon: Database
    },
    {
      title: 'Native Push Notifications (FCM)',
      desc: 'Broadcasts dispatched from the Admin Console immediately trigger real-time alerts across both web trays and mobile device locks.',
      icon: Zap
    },
    {
      title: 'Offline Field Resilience',
      desc: 'Engineered for field volunteers and exam coordinators in remote areas with local SQLite/Firestore caching and automatic cloud reconciliations.',
      icon: RefreshCw
    },
    {
      title: 'Zero-Trust RBAC & Biometrics',
      desc: 'Mobile biometric sign-in (Touch/Face ID) mapped directly to role-gated Super Admin, Volunteer, and Member administrative scopes.',
      icon: ShieldCheck
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-slate-900 text-white border-b border-slate-800" id="mobile-readiness">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left 6 Cols: Architecture Narrative */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-bold uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cross-Platform Ready Architecture</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              One Unified Backend. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                Web Portal & Future Mobile App.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              To ensure long-term stability and zero data fragmentation, all 27 chapters are built on a shared Firebase architecture. When the FET India mobile application launches in Series 3, every user account, volunteer dispatch, and donor receipt will sync seamlessly in real time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {capabilities.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <div key={i} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-emerald-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-xs text-white">{cap.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{cap.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 6 Cols: Interactive Backend Blueprint Schema */}
          <div className="lg:col-span-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
              
              {/* Architecture Diagram Visualization */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>FET_INDIA_BACKEND_SCHEMA_v1.0</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Cloud Firestore + Auth</span>
                </div>

                {/* Clients Layer */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-600/50 text-center">
                    <span className="text-xs font-bold text-white block">FET India Web Portal</span>
                    <span className="text-[10px] text-emerald-400">Active Series 1 Core</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-600/50 text-center">
                    <span className="text-xs font-bold text-white block">FET India Mobile App</span>
                    <span className="text-[10px] text-amber-400">Series 3 Release Ready</span>
                  </div>
                </div>

                {/* Cloud Firebase Gateway */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 text-center relative">
                  <div className="text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
                    Unified Firebase Infrastructure
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300 mt-2 font-mono">
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">Auth / RBAC</div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">Cloud Firestore</div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">Cloud Storage</div>
                  </div>
                </div>

                {/* Core Schemas */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="text-slate-300 font-semibold mb-1">Synchronized Collections:</div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>organization_config & dynamic CMS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>users & multi-role permission claims</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>modules (27 chapters activation matrix)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>audit_logs & platform broadcasts</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
