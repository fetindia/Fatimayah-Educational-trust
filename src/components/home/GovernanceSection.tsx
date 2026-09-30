/**
 * @license
 * Governance & Trust Accountability Section
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { Shield, FileCheck, Award, Lock, CheckCircle2, UserCheck, Scale, ArrowUpRight } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { ADMIN_ROLE_DEFINITIONS } from '../../data/initialData';

interface GovernanceSectionProps {
  onOpenAdmin: (view?: string) => void;
}

export const GovernanceSection: React.FC<GovernanceSectionProps> = ({ onOpenAdmin }) => {
  const { config } = useConfig();

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  const administrativeRoles = [
    { key: 'super_admin', title: 'Super Admin', scope: 'Sovereign platform control, CMS dynamic settings, module activation, and role assignments.' },
    { key: 'education_admin', title: 'Education Admin', scope: 'Evaluates merit scholarships, curriculum distribution, and academic grants.' },
    { key: 'volunteer_admin', title: 'Volunteer Admin', scope: 'Coordinates field workers, community relief missions, and service logs.' },
    { key: 'member_admin', title: 'Member Admin', scope: 'Governs trust membership registrations, digital ID renewals, and alumni records.' },
    { key: 'donor_admin', title: 'Donor Admin', scope: 'Reconciles financial contributions, Zakat/Sadaqah allocations, and 80G tax receipts.' },
    { key: 'exam_admin', title: 'Examination Admin', scope: 'Conducts talent search competitions, hall ticket generation, and result validation.' },
    { key: 'blog_admin', title: 'Blog & Media Admin', scope: 'Publishes official research papers, bulletins, and trust press releases.' },
    { key: 'store_admin', title: 'Store Admin', scope: 'Pre-architected inventory controller for FET Store (apparel, perfumes, books).' }
  ];

  return (
    <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200" id="governance">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 border border-amber-300 text-xs font-bold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            <span>Integrity & Stewardship</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Governance, Compliance & RBAC Matrix
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            <strong className="text-slate-900">{config.legalName}</strong> operates under rigorous statutory oversight, statutory tax exemptions, and specialized administrator roles.
          </p>
        </div>

        {/* Legal Credentials Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Trust Registration</span>
              <FileCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base font-bold text-slate-900">{config.registrationNumber}</div>
            <p className="text-xs text-slate-500">Registered in Jammu & Kashmir through SDM Office</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">NITI Aayog NGO Darpan</span>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-base font-bold text-slate-900">{config.nitiAayogId}</div>
            <p className="text-xs text-slate-500">Government of India Verified Entity</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Income Tax 80G</span>
              <Shield className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-base font-bold text-slate-900">50% Tax Deduction</div>
            <p className="text-xs text-slate-500">Order: {config.section80GNumber}</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Income Tax 12A</span>
              <Lock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-base font-bold text-slate-900">Full Charitable Exemption</div>
            <p className="text-xs text-slate-500">Order: {config.section12ANumber}</p>
          </div>
        </div>

        {/* Administrator Roles Matrix (RBAC Showcase) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Role-Based Administrator Ecosystem</h3>
              <p className="text-xs text-slate-500">Strict segregation of duties across specialized administrative portfolios</p>
            </div>
            <button
              onClick={() => onOpenAdmin('roles')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            >
              <span>View RBAC Governance Panel</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {administrativeRoles.map((role) => (
              <div key={role.key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{role.title}</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{role.scope}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
