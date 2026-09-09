/**
 * @license
 * Institutional Footer Component
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  Shield, 
  Lock, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Smartphone, 
  Layers, 
  ArrowUpRight,
  Heart,
  Download,
  Share2,
  FileText
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { usePWAInstall } from '../common/PWAInstallBanner';
import { useConfig } from '../../contexts/ConfigContext';
import { useModules } from '../../contexts/ModuleContext';

interface FooterProps {
  onOpenSection: (sectionId: string) => void;
  onOpenAdmin: (view?: string) => void;
  onOpenVerification?: (memberId?: string) => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
  onOpenAbout?: (tab?: 'overview' | 'governance' | 'transparency' | 'history') => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onOpenSection, 
  onOpenAdmin, 
  onOpenVerification,
  onOpenLegal,
  onOpenAbout
}) => {
  const { config } = useConfig();
  const { seriesStats } = useModules();
  const { canInstall, installApp } = usePWAInstall();

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  const footerSettings = config.footerSettings || {
    aboutSummary: 'Fatimyah Educational Trust is a registered public charitable and educational trust established in 1994, dedicated to educational empowerment, grassroots welfare, and transparent community stewardship.',
    copyrightText: 'Fatimyah Educational Trust. All rights reserved.',
    showLegalShield: true,
    showSocialLinks: true,
    showChapterRoadmap: true,
    showGovernanceLinks: true
  };

  const socialLinks = config.socialLinks || {};

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800" id="fet-main-footer">
      {/* 3-Color Brand Accent Top Strip */}
      <div className="h-1.5 w-full flex">
        <div className="h-full flex-1" style={{ backgroundColor: primaryGreen }} title="FET Emerald Islamic Green" />
        <div className="h-full flex-1" style={{ backgroundColor: primaryBlue }} title="FET Royal Navy Blue" />
        <div className="h-full flex-1" style={{ backgroundColor: accentAmber }} title="FET Sun Gold Amber" />
      </div>

      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1 & 2: Organization Identity & Legal Transparency */}
          <div className="lg:col-span-2 space-y-4">
            <FETLogo size="lg" variant="light" />

            {footerSettings.showLegalShield !== false && (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Shield className="w-4 h-4" />
                  <span>Official Legal Non-Profit Entity</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  <strong className="text-white">{config.legalName}</strong> is a registered public charitable and educational trust established in 1994, governed under the Public Trusts Registration Act.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <div>Reg: <span className="text-slate-200">{config.registrationNumber}</span></div>
                  <div>NITI Aayog: <span className="text-slate-200">{config.nitiAayogId}</span></div>
                  <div>80G Tax Exemption: <span className="text-slate-200 font-mono">Available</span></div>
                  <div>12A Exemption: <span className="text-slate-200 font-mono">Active</span></div>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              {footerSettings.aboutSummary || 'Official digital headquarters. Designed for high-integrity public welfare, educational excellence, and transparent community stewardship across India.'}
            </p>

            {/* Social Links if enabled */}
            {footerSettings.showSocialLinks !== false && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {socialLinks.whatsapp && (
                  <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 text-[11px] font-bold transition-colors">
                    WhatsApp
                  </a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/50 text-[11px] font-bold transition-colors">
                    YouTube
                  </a>
                )}
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-700/50 text-[11px] font-bold transition-colors">
                    Facebook
                  </a>
                )}
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/50 text-[11px] font-bold transition-colors">
                    Instagram
                  </a>
                )}
                {socialLinks.telegram && (
                  <a href={socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-700/50 text-[11px] font-bold transition-colors">
                    Telegram
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Col 3: 27-Module Series 1-3 Architecture Roadmap */}
          {footerSettings.showChapterRoadmap !== false && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>27-Chapter Matrix</span>
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    onClick={() => onOpenSection('modules-roadmap')}
                    className="hover:text-emerald-300 transition-colors text-left flex items-center justify-between w-full cursor-pointer"
                  >
                    <span>Series 1: Core Foundation (Ch 1-9)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {seriesStats.series1.active} Active
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onOpenSection('modules-roadmap')}
                    className="hover:text-emerald-300 transition-colors text-left flex items-center justify-between w-full cursor-pointer"
                  >
                    <span>Series 2: Education & Welfare (Ch 10-18)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                      {seriesStats.series2.beta} Beta
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onOpenSection('modules-roadmap')}
                    className="hover:text-emerald-300 transition-colors text-left flex items-center justify-between w-full cursor-pointer"
                  >
                    <span>Series 3: Commerce & Future (Ch 19-27)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      Planned
                    </span>
                  </button>
                </li>
                <li className="pt-2 text-slate-400">
                  <span className="text-[11px] block">Specialist Chapters (E-Store, Haj/Ziyarat Travel) published under Super Admin control.</span>
                </li>
              </ul>
            </div>
          )}

          {/* Col 4: Administrator Portals & Governance */}
          {footerSettings.showGovernanceLinks !== false && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Trust Governance</span>
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    onClick={() => onOpenAdmin('cms')}
                    className="hover:text-amber-300 transition-colors text-left flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3 h-3 text-slate-500" /> Super Admin CMS Engine
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onOpenAdmin('modules')}
                    className="hover:text-amber-300 transition-colors text-left flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3 h-3 text-slate-500" /> Module Activation Matrix
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onOpenAdmin('roles')}
                    className="hover:text-amber-300 transition-colors text-left flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3 h-3 text-slate-500" /> Multi-Role RBAC Console
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onOpenAdmin('audit')}
                    className="hover:text-amber-300 transition-colors text-left flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3 h-3 text-slate-500" /> Tamper-Proof Audit Logs
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onOpenAbout ? onOpenAbout('governance') : onOpenSection('mission_cta')}
                    className="hover:text-amber-300 transition-colors text-left flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3 h-3 text-slate-500" /> Public Accountability Charter & Governance
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Col 5: Contact Secretariat & Cross-Platform Mobile Sync */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Head Secretariat</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="leading-relaxed text-slate-300">{config.headOfficeAddress}</p>
              {config.contactPhone && (
                <div className="pt-1 flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{config.contactPhone}</span>
                </div>
              )}
              {config.contactEmail && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{config.contactEmail}</span>
                </div>
              )}
              {config.emergencyHotline && (
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-[11px]">
                  <span>Hotline: {config.emergencyHotline}</span>
                </div>
              )}
            </div>

            {/* Mobile Backend Readiness Pill & PWA Install */}
            <div className="mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-[11px] text-emerald-200 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Mobile & PWA Ready</span>
                  <span className="text-[10px] text-emerald-300/80">Cross-platform Progressive Web App</span>
                </div>
              </div>
              {canInstall && (
                <button
                  type="button"
                  onClick={() => installApp()}
                  className="w-full mt-1 py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Install FET India on Home Screen</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Protected Legal Notice */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 1994 - {new Date().getFullYear()} <span className="text-slate-300 font-semibold">{config.legalName}</span>. {footerSettings.copyrightText || 'All rights reserved.'}
            <span className="hidden sm:inline"> Digital Platform: <span className="text-slate-300 font-semibold">{config.displayName}</span> ({config.shortBrand}).</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            {onOpenVerification && (
              <button
                type="button"
                onClick={() => onOpenVerification()}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Verify Certificate & Credential (QR)</span>
              </button>
            )}
            <span>•</span>
            <button 
              onClick={() => onOpenAbout ? onOpenAbout('overview') : onOpenSection('mission_cta')} 
              className="hover:text-slate-300 cursor-pointer font-bold text-slate-400"
            >
              About FET India
            </button>
            <span>•</span>
            <button 
              onClick={() => onOpenLegal ? onOpenLegal('privacy') : onOpenSection('mission_cta')} 
              className="hover:text-slate-300 cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button 
              onClick={() => onOpenLegal ? onOpenLegal('terms') : onOpenSection('mission_cta')} 
              className="hover:text-slate-300 cursor-pointer"
            >
              Terms of Trust
            </button>
            <span>•</span>
            <button onClick={() => onOpenSection('crowdfunding')} className="text-emerald-400 hover:underline cursor-pointer font-semibold">
              80G Tax Exemption
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
