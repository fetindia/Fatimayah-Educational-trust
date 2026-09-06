/**
 * @license
 * Responsive Public Header & User Account Access Component
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Menu, 
  X, 
  Bell, 
  User, 
  LogOut, 
  ChevronDown, 
  ChevronRight,
  Phone, 
  Mail, 
  SlidersHorizontal,
  LayoutDashboard,
  HeartHandshake,
  ShoppingBag,
  Compass,
  CreditCard,
  Calendar,
  BookOpen,
  Award,
  Download,
  Smartphone,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  QrCode,
  FileText,
  BadgeDollarSign,
  Settings,
  Users,
  CheckCircle2,
  Layers,
  Lock,
  MoreHorizontal,
  Palette,
  LineChart,
  Landmark,
  UserCog,
  Home,
  Info
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { usePWAInstall } from '../common/PWAInstallBanner';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useModules } from '../../contexts/ModuleContext';
import { NavigationMenuItem, NavigationSubItem } from '../../types';
import { DEFAULT_NAV_MENU } from '../../data/initialData';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenUserDashboard: (tab?: any) => void;
  onOpenAdminConsole: (view?: string) => void;
  onOpenVerification?: (memberId?: string) => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onCloseMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenUserDashboard,
  onOpenAdminConsole,
  onOpenVerification,
  onOpenLegal,
  activeSection,
  setActiveSection,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu
}) => {
  const { config } = useConfig();
  const { currentUser, userProfile, hasAdminAccess, isSuperAdmin, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const { getModuleByCode } = useModules();
  const { canInstall, installApp } = usePWAInstall();

  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);
  const isMenuOpen = isMobileMenuOpen !== undefined ? isMobileMenuOpen : internalMobileMenuOpen;

  const handleToggleMobileMenu = () => {
    if (onToggleMobileMenu) {
      onToggleMobileMenu();
    } else {
      setInternalMobileMenuOpen(prev => !prev);
    }
  };

  const handleCloseMobileMenu = () => {
    if (onCloseMobileMenu) {
      onCloseMobileMenu();
    } else if (onToggleMobileMenu && isMobileMenuOpen) {
      onToggleMobileMenu();
    } else {
      setInternalMobileMenuOpen(false);
    }
  };

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [mobileExpandedMenuId, setMobileExpandedMenuId] = useState<string | null>(null);
  const [mobileAdminSuiteExpanded, setMobileAdminSuiteExpanded] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  // Handle click outside & Escape key for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setMoreMenuOpen(false);
      }
      if (!headerRef.current?.contains(target)) {
        setActiveDropdownId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setMoreMenuOpen(false);
        setActiveDropdownId(null);
        handleCloseMobileMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (!isMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMenuOpen]);

  // Check if dynamically surfaced modules are published by Super Admin
  const storeModule = getModuleByCode('m-ecommerce');
  const isStorePublished = storeModule?.lifecycle === 'PUBLISHED';

  const travelModule = getModuleByCode('m-travel');
  const isTravelPublished = travelModule?.lifecycle === 'PUBLISHED';

  // Resolve dynamic navigation menu
  const rawNavMenu = (config.navigationMenu && config.navigationMenu.length > 0)
    ? config.navigationMenu.filter(m => m.isEnabled)
    : DEFAULT_NAV_MENU.filter(m => m.isEnabled);

  const navMenuItems: NavigationMenuItem[] = [...rawNavMenu].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Dynamically insert published Store or Travel if not already in menu
  if (isStorePublished && !navMenuItems.some(m => m.target === 'store' || m.id === 'nav-store')) {
    navMenuItems.push({
      id: 'nav-store',
      label: 'Store',
      target: 'store',
      isEnabled: true,
      order: 99
    });
  }

  if (isTravelPublished && !navMenuItems.some(m => m.target === 'travel' || m.id === 'nav-travel')) {
    navMenuItems.push({
      id: 'nav-travel',
      label: 'Travel',
      target: 'travel',
      isEnabled: true,
      order: 100
    });
  }

  // Priority-based navigation splitting for responsive desktop:
  // On 2xl: show top 5 items, rest in More
  // On xl: show top 4 items, rest in More
  // On lg: show top 3 items, rest in More
  const primaryNavItems2xl = navMenuItems.slice(0, 5);
  const moreNavItems2xl = navMenuItems.slice(5);

  const primaryNavItemsXl = navMenuItems.slice(0, 4);
  const moreNavItemsXl = navMenuItems.slice(4);

  const primaryNavItemsLg = navMenuItems.slice(0, 3);
  const moreNavItemsLg = navMenuItems.slice(3);

  const handleNavClick = (target: string, isExternal?: boolean) => {
    setActiveDropdownId(null);
    setMoreMenuOpen(false);
    setUserMenuOpen(false);
    handleCloseMobileMenu();

    if (isExternal && target.startsWith('http')) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }

    const cleanTarget = target.replace(/^#/, '');

    if (cleanTarget === 'home') {
      setActiveSection('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (cleanTarget === 'privacy' || cleanTarget === 'privacy-policy') {
      if (onOpenLegal) {
        onOpenLegal('privacy');
      } else {
        setActiveSection('mission_cta');
      }
      return;
    }

    if (cleanTarget === 'terms' || cleanTarget === 'terms-of-trust' || cleanTarget === 'terms-and-conditions') {
      if (onOpenLegal) {
        onOpenLegal('terms');
      } else {
        setActiveSection('mission_cta');
      }
      return;
    }

    if (cleanTarget === 'membership' || cleanTarget === 'volunteer_membership' || cleanTarget === 'volunteer') {
      setActiveSection('volunteer_membership');
      const element = document.getElementById('volunteer') || document.getElementById('volunteer_membership');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (cleanTarget === 'donate' || cleanTarget === 'crowdfunding' || cleanTarget === 'appeals') {
      setActiveSection('crowdfunding');
      const element = document.getElementById('crowdfunding') || document.getElementById('donate');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (cleanTarget === 'statistics' || cleanTarget === 'stats' || cleanTarget === 'census') {
      setActiveSection('statistics');
      const element = document.getElementById('statistics') || document.getElementById('about');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (cleanTarget === 'about' || cleanTarget === 'about_trust' || cleanTarget === 'history' || cleanTarget === 'mission_cta' || cleanTarget === 'mission' || cleanTarget === 'governance') {
      setActiveSection('mission_cta');
      const element = document.getElementById('mission_cta') || document.getElementById('about') || document.getElementById('governance');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (cleanTarget === 'contact') {
      setActiveSection('mission_cta');
      const element = document.getElementById('contact') || document.getElementById('mission_cta');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (cleanTarget === 'events' || cleanTarget === 'events_blog' || cleanTarget === 'blog') {
      setActiveSection('events_blog');
      const element = document.getElementById('events_blog') || document.getElementById('events');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (cleanTarget === 'programs' || cleanTarget === 'initiatives') {
      setActiveSection('programs');
      const element = document.getElementById('programs') || document.getElementById('initiatives');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (cleanTarget === 'education' || cleanTarget === 'exams' || cleanTarget === 'talent') {
      setActiveSection('education');
      const element = document.getElementById('education') || document.getElementById('exams');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (cleanTarget === 'store' || cleanTarget === 'travel' || cleanTarget === 'future_services') {
      setActiveSection('future_services');
      const element = document.getElementById('future_services') || document.getElementById('store');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (cleanTarget === 'verify') {
      if (onOpenVerification) onOpenVerification();
      return;
    }

    setActiveSection(cleanTarget);
    const element = document.getElementById(cleanTarget);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const headerSettings = config.headerSettings || {
    showLegalName: true,
    showRegNumber: true,
    showPhone: true,
    showEmail: true,
    showTaxExemptionTag: true,
    showNitiAayogTag: true,
    showTagline: true
  };

  // Helper for user display role
  const getRoleDisplayName = () => {
    if (isSuperAdmin) return 'Super Administrator';
    if (userProfile?.primaryRole) {
      return userProfile.primaryRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (hasAdminAccess) return 'Trust Administrator';
    return 'Registered Member';
  };

  return (
    <header 
      ref={headerRef}
      className="sticky top-0 z-40 w-full bg-white shadow-xs border-b border-slate-200 selection:bg-emerald-100" 
      id="fet-main-header"
    >
      {/* Top Utility Announcement & Institutional Transparency Bar */}
      <div 
        className="w-full text-white text-xs font-medium py-1.5 px-3 sm:px-6 transition-colors duration-300 border-b border-white/10"
        style={{ backgroundColor: primaryBlue }}
        id="fet-top-announcement-bar"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-1.5 sm:gap-2">
          {/* Legal Identity Note */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 text-slate-200 text-[11px] sm:text-xs">
            {headerSettings.showLegalName !== false && (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                  <Shield className="w-3.5 h-3.5 shrink-0" /> Legal Entity:
                </span>
                <span className="text-white font-semibold">{config.legalName}</span>
              </>
            )}
            {headerSettings.showRegNumber !== false && config.registrationNumber && (
              <>
                <span className="hidden sm:inline text-slate-400">|</span>
                <span className="hidden sm:inline text-slate-300">Reg No: {config.registrationNumber}</span>
              </>
            )}
            {headerSettings.showTaxExemptionTag !== false && (
              <span className="hidden md:inline text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30">
                80G & 12A Certified
              </span>
            )}
            {headerSettings.showNitiAayogTag !== false && config.nitiAayogId && (
              <span className="hidden xl:inline text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30">
                NITI: {config.nitiAayogId}
              </span>
            )}
          </div>

          {/* Contact and Secretariat Info */}
          <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
            {headerSettings.showPhone !== false && config.contactPhone && (
              <a href={`tel:${config.contactPhone}`} className="flex items-center gap-1 text-slate-200 hover:text-white transition-colors">
                <Phone className="w-3 h-3 text-emerald-400 shrink-0" /> {config.contactPhone}
              </a>
            )}
            {headerSettings.showEmail !== false && config.contactEmail && (
              <a href={`mailto:${config.contactEmail}`} className="hidden lg:flex items-center gap-1 text-slate-200 hover:text-white transition-colors">
                <Mail className="w-3 h-3 text-amber-400 shrink-0" /> {config.contactEmail}
              </a>
            )}
            {headerSettings.showTagline !== false && config.tagline && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-800/90 text-emerald-100 font-bold border border-emerald-500/40 text-[10px] tracking-wider uppercase">
                {config.tagline}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Admission / Important Announcement Ticker (Controlled by Super Admin CMS) */}
      {config.isAnnouncementBarActive && config.announcementBarText && (
        <div 
          className="w-full text-xs py-1.5 sm:py-2 px-3 sm:px-4 text-center font-bold border-b border-amber-300/50 flex flex-wrap items-center justify-center gap-2 shadow-xs transition-all"
          style={{ backgroundColor: '#FFFBEB', color: '#92400E' }}
          id="fet-cms-announcement-ticker"
        >
          {config.announcementBarBadge && (
            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-amber-500 text-slate-950 shadow-2xs">
              {config.announcementBarBadge}
            </span>
          )}
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping mr-0.5" />
          <span className="text-slate-900 line-clamp-1">{config.announcementBarText}</span>
          {config.announcementBarLink && (
            <button
              onClick={() => handleNavClick(config.announcementBarLink || 'programs')}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
            >
              <span>Explore</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <button 
          onClick={() => handleNavClick('home')}
          className="cursor-pointer text-left focus:outline-hidden group shrink-0"
          id="fet-header-logo-btn"
          aria-label="FET India Home"
        >
          <div className="hidden sm:block">
            <FETLogo size="md" />
          </div>
          <div className="sm:hidden">
            <FETLogo size="sm" />
          </div>
        </button>

        {/* 1. Large Screen Navigation (2xl - >= 1536px) */}
        <nav className="hidden 2xl:flex items-center gap-1 text-xs font-bold text-slate-700" aria-label="Primary Navigation">
          {primaryNavItems2xl.map((item) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isDropdownOpen = activeDropdownId === item.id;

            return (
              <div 
                key={item.id} 
                className="relative"
                onMouseEnter={() => hasSub && setActiveDropdownId(item.id)}
                onMouseLeave={() => hasSub && setActiveDropdownId(null)}
              >
                <button
                  onClick={() => {
                    if (hasSub) {
                      setActiveDropdownId(isDropdownOpen ? null : item.id);
                    } else {
                      handleNavClick(item.target, item.isExternal);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSection === item.target.replace(/^#/, '')
                      ? 'text-emerald-900 bg-emerald-50 font-extrabold shadow-2xs border border-emerald-200/60'
                      : 'hover:text-emerald-800 hover:bg-slate-50'
                  }`}
                  id={`fet-nav-${item.id}`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300/60">
                      {item.badge}
                    </span>
                  )}
                  {hasSub && (
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {hasSub && isDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    {item.subItems?.filter(s => s.isEnabled).map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleNavClick(sub.target, sub.isExternal)}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ChevronRight className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{sub.label}</span>
                        </span>
                        {sub.isExternal && <ExternalLink className="w-3 h-3 text-slate-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* More Menu Dropdown for 2xl */}
          {moreNavItems2xl.length > 0 && (
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 text-slate-700 hover:text-emerald-800 hover:bg-slate-50 cursor-pointer ${
                  moreMenuOpen ? 'bg-slate-100 text-slate-900' : ''
                }`}
                id="header-nav-more-2xl-btn"
                aria-expanded={moreMenuOpen}
                aria-haspopup="menu"
              >
                <span>More</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  {moreNavItems2xl.map((item) => (
                    <div key={item.id}>
                      <button
                        onClick={() => handleNavClick(item.target, item.isExternal)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer transition-colors ${
                          activeSection === item.target.replace(/^#/, '') ? 'text-emerald-900 font-bold bg-emerald-50/60' : 'text-slate-700'
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900">
                            {item.badge}
                          </span>
                        )}
                      </button>
                      {item.subItems && item.subItems.length > 0 && (
                        <div className="pl-6 pr-3 py-1 space-y-1 bg-slate-50/60 border-y border-slate-100">
                          {item.subItems.filter(s => s.isEnabled).map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => handleNavClick(sub.target, sub.isExternal)}
                              className="w-full text-left px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                            >
                              <ChevronRight className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{sub.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {onOpenVerification && (
                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setMoreMenuOpen(false);
                          onOpenVerification();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verify Member Credential</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* 2. Standard Desktop Navigation (xl - 1280px to 1535px) */}
        <nav className="hidden xl:flex 2xl:hidden items-center gap-1 text-xs font-bold text-slate-700" aria-label="Primary Navigation">
          {primaryNavItemsXl.map((item) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isDropdownOpen = activeDropdownId === item.id;

            return (
              <div 
                key={item.id} 
                className="relative"
                onMouseEnter={() => hasSub && setActiveDropdownId(item.id)}
                onMouseLeave={() => hasSub && setActiveDropdownId(null)}
              >
                <button
                  onClick={() => {
                    if (hasSub) {
                      setActiveDropdownId(isDropdownOpen ? null : item.id);
                    } else {
                      handleNavClick(item.target, item.isExternal);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSection === item.target.replace(/^#/, '')
                      ? 'text-emerald-900 bg-emerald-50 font-extrabold shadow-2xs border border-emerald-200/60'
                      : 'hover:text-emerald-800 hover:bg-slate-50'
                  }`}
                  id={`fet-nav-xl-${item.id}`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300/60">
                      {item.badge}
                    </span>
                  )}
                  {hasSub && (
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {hasSub && isDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    {item.subItems?.filter(s => s.isEnabled).map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleNavClick(sub.target, sub.isExternal)}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ChevronRight className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{sub.label}</span>
                        </span>
                        {sub.isExternal && <ExternalLink className="w-3 h-3 text-slate-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* More Menu Dropdown for XL */}
          {moreNavItemsXl.length > 0 && (
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 text-slate-700 hover:text-emerald-800 hover:bg-slate-50 cursor-pointer ${
                  moreMenuOpen ? 'bg-slate-100 text-slate-900' : ''
                }`}
                id="header-nav-more-xl-btn"
                aria-expanded={moreMenuOpen}
                aria-haspopup="menu"
              >
                <span>More</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  {moreNavItemsXl.map((item) => (
                    <div key={item.id}>
                      <button
                        onClick={() => handleNavClick(item.target, item.isExternal)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer transition-colors ${
                          activeSection === item.target.replace(/^#/, '') ? 'text-emerald-900 font-bold bg-emerald-50/60' : 'text-slate-700'
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900">
                            {item.badge}
                          </span>
                        )}
                      </button>
                      {item.subItems && item.subItems.length > 0 && (
                        <div className="pl-6 pr-3 py-1 space-y-1 bg-slate-50/60 border-y border-slate-100">
                          {item.subItems.filter(s => s.isEnabled).map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => handleNavClick(sub.target, sub.isExternal)}
                              className="w-full text-left px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                            >
                              <ChevronRight className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{sub.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {onOpenVerification && (
                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setMoreMenuOpen(false);
                          onOpenVerification();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verify Member Credential</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* 3. Compact Desktop Navigation (lg - 1024px to 1279px) */}
        <nav className="hidden lg:flex xl:hidden items-center gap-1 text-xs font-bold text-slate-700" aria-label="Primary Navigation">
          {primaryNavItemsLg.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.target, item.isExternal)}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSection === item.target.replace(/^#/, '')
                  ? 'text-emerald-900 bg-emerald-50 font-extrabold'
                  : 'hover:text-emerald-800 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* More Menu Dropdown for LG */}
          {moreNavItemsLg.length > 0 && (
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 text-slate-700 hover:text-emerald-800 hover:bg-slate-50 cursor-pointer ${
                  moreMenuOpen ? 'bg-slate-100 text-slate-900' : ''
                }`}
                id="header-nav-more-lg-btn"
                aria-expanded={moreMenuOpen}
                aria-haspopup="menu"
              >
                <span>More</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  {moreNavItemsLg.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.target, item.isExternal)}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer transition-colors ${
                        activeSection === item.target.replace(/^#/, '') ? 'text-emerald-900 font-bold bg-emerald-50/60' : 'text-slate-700'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                  {onOpenVerification && (
                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setMoreMenuOpen(false);
                          onOpenVerification();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verify Member Credential</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right-Side Header Actions & Account Area */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Quick Donate CTA with 80G Gold Highlight */}
          <button
            onClick={() => handleNavClick('donate')}
            className="hidden lg:inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 transition-all shadow-xs border border-amber-400 hover:shadow-md active:scale-95 cursor-pointer"
            id="header-quick-donate-btn"
            title="Donate to FET India with 50% 80G Tax Exemption"
          >
            <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-950 shrink-0" />
            <span className="whitespace-nowrap">Donate <span className="hidden xs:inline">(80G)</span></span>
          </button>

          {/* Quick Notification Bell (Authenticated Users) */}
          {currentUser && (
            <button
              onClick={() => onOpenUserDashboard('notifications')}
              className="hidden lg:flex relative p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              id="header-notifications-bell-btn"
              title="Open Notification Center"
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Authenticated User: Direct Dashboard Button & Account Menu */}
          {currentUser ? (
            <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
              {/* Direct Dashboard Button (Role-Aware) */}
              {isSuperAdmin ? (
                <button
                  onClick={() => onOpenAdminConsole('super_admin')}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 shadow-xs transition-all hover:shadow-md active:scale-95 cursor-pointer border border-amber-400"
                  id="header-superadmin-dashboard-btn"
                  title="Open Super Admin Control Center"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                  <span className="font-extrabold">Super Admin</span>
                </button>
              ) : hasAdminAccess ? (
                <button
                  onClick={() => onOpenAdminConsole('dashboard')}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 active:scale-95 cursor-pointer"
                  style={{ backgroundColor: primaryBlue }}
                  id="header-admin-console-btn"
                  title="Open Administrative Console"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Console</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenUserDashboard('dashboard')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 active:scale-95 cursor-pointer"
                  style={{ backgroundColor: primaryGreen }}
                  id="header-my-dashboard-btn"
                  title="Open Member Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
              )}

              {/* Dedicated User Account Dropdown Trigger */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer ${
                    userMenuOpen ? 'ring-2 ring-emerald-500/20 bg-slate-50 border-emerald-300' : ''
                  }`}
                  id="header-user-menu-btn"
                  aria-label="User Account Menu"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <div 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0"
                    style={{ backgroundColor: isSuperAdmin ? '#B45309' : primaryGreen }}
                  >
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden xl:block text-left text-xs leading-tight pr-0.5">
                    <p className="font-bold text-slate-800 truncate max-w-[100px]">
                      {currentUser.displayName?.split(' ')[0] || 'Member'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[100px]">
                      {isSuperAdmin ? 'Super Admin' : (userProfile?.primaryRole || 'Member')}
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Structured User Account Menu Dropdown */}
                {userMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95"
                    id="header-user-menu-dropdown"
                    role="menu"
                  >
                    {/* User Profile Header Card */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0"
                          style={{ backgroundColor: isSuperAdmin ? '#B45309' : primaryGreen }}
                        >
                          {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {currentUser.displayName || 'Trust Member'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {currentUser.email}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              isSuperAdmin
                                ? 'bg-amber-100 text-amber-900 border border-amber-300/60'
                                : hasAdminAccess
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}>
                              {isSuperAdmin && <Shield className="w-2.5 h-2.5 text-amber-700" />}
                              <span>{getRoleDisplayName()}</span>
                            </span>
                            {userProfile?.membershipId && (
                              <span className="text-[9px] font-mono font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded">
                                {userProfile.membershipId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 1: Dashboard & Profile Access */}
                    <div className="p-1.5 space-y-0.5">
                      {/* 1. Super Admin Dashboard (if Super Admin) */}
                      {isSuperAdmin && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenAdminConsole('super_admin');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100/80 flex items-center justify-between cursor-pointer border border-amber-200/70 transition-colors"
                          id="account-menu-superadmin-dashboard-btn"
                          role="menuitem"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>Super Admin Control Center</span>
                          </div>
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">
                            Super
                          </span>
                        </button>
                      )}

                      {/* 2. Admin Console (if Role Admin and not Super Admin) */}
                      {hasAdminAccess && !isSuperAdmin && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenAdminConsole('dashboard');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100/80 flex items-center justify-between cursor-pointer border border-blue-200 transition-colors"
                          id="account-menu-admin-console-btn"
                          role="menuitem"
                        >
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-blue-700 shrink-0" />
                            <span>Administrative Console</span>
                          </div>
                          <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-200/60 px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        </button>
                      )}

                      {/* 3. Member Dashboard & ID Card */}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenUserDashboard('dashboard');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between cursor-pointer transition-colors"
                        id="account-menu-dashboard-btn"
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2.5">
                          <LayoutDashboard className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800">Member Dashboard</p>
                            <p className="text-[10px] text-slate-500 font-normal">Digital ID card & portal home</p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {/* 4. My Profile */}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenUserDashboard('profile');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between cursor-pointer transition-colors"
                        id="account-menu-profile-btn"
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800">My Profile</p>
                            <p className="text-[10px] text-slate-500 font-normal">Personal details & documents</p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>

                    {/* Section 2: Member Activities & Records */}
                    <div className="border-t border-slate-100 p-1.5 space-y-0.5">
                      <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        My Activities & Records
                      </p>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenUserDashboard('membership');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                        role="menuitem"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>My Membership</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenUserDashboard('applications');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                        role="menuitem"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>My Applications & Grants</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenUserDashboard('donations');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                        role="menuitem"
                      >
                        <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>My Donations & 80G Receipts</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenUserDashboard('volunteer');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                        role="menuitem"
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>My Volunteer Information</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenUserDashboard('notifications');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Notification Center</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {onOpenVerification && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenVerification(userProfile?.membershipId);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          role="menuitem"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>Verify Digital Credential (QR)</span>
                        </button>
                      )}
                    </div>

                    {/* Section 3: Super Admin Governance Suite (Strictly Protected) */}
                    {isSuperAdmin && (
                      <div className="border-t border-amber-200/80 bg-amber-50/40 p-1.5 space-y-0.5">
                        <div className="px-3 py-1 flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 text-amber-700" /> Super Admin Governance
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenAdminConsole('cms');
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-800 hover:bg-amber-100/70 flex items-center gap-2 cursor-pointer transition-colors"
                          role="menuitem"
                        >
                          <Palette className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Website Management & CMS</span>
                        </button>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenAdminConsole('roles');
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-800 hover:bg-amber-100/70 flex items-center gap-2 cursor-pointer transition-colors"
                          role="menuitem"
                        >
                          <Users className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Users & Role Governance</span>
                        </button>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenAdminConsole('modules');
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-800 hover:bg-amber-100/70 flex items-center gap-2 cursor-pointer transition-colors"
                          role="menuitem"
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>27-Chapter Module Matrix</span>
                        </button>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenAdminConsole('audit');
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-800 hover:bg-amber-100/70 flex items-center gap-2 cursor-pointer transition-colors"
                          role="menuitem"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Tamper-Proof Audit Logs</span>
                        </button>
                      </div>
                    )}

                    {/* Section 4: Sign Out */}
                    <div className="border-t border-slate-100 pt-1 mt-1 px-1.5">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                        id="account-menu-signout-btn"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Sign Out of Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Unauthenticated State: Sign In Button */
            <button
              onClick={onOpenAuth}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 active:scale-95 cursor-pointer shrink-0"
              style={{ backgroundColor: primaryGreen }}
              id="header-signin-btn"
              title="Sign in to FET India Portal"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button (< 1024px) - Clean, Uncluttered, min 44x44px touch target */}
          <button
            onClick={handleToggleMobileMenu}
            className={`lg:hidden flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl transition-all cursor-pointer shrink-0 font-extrabold text-xs shadow-xs border ${
              isMenuOpen 
                ? 'bg-slate-900 text-white border-slate-800 ring-2 ring-slate-900/20' 
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300 hover:border-emerald-400 active:scale-95'
            }`}
            id="header-mobile-menu-toggle"
            aria-label={isMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMenuOpen}
            title="Main Menu"
          >
            {isMenuOpen ? (
              <>
                <X className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Close</span>
              </>
            ) : (
              <>
                <Menu className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>Menu</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* Synchronized Full Mobile Navigation Drawer (Overlay & Slide Panel) */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col" id="header-mobile-drawer-overlay">
          {/* Dark Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={handleCloseMobileMenu}
            aria-hidden="true"
          />

          {/* Drawer Panel: Slide-in with Native Safe Area Support */}
          <div 
            className="relative z-10 w-full max-w-md ml-auto bg-white h-full flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden"
            id="header-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="FET India Mobile Website Menu"
          >
            {/* Drawer Top Bar with Brand & Close Button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <FETLogo size="sm" variant="emblem" />
                <div>
                  <h2 className="text-xs font-black tracking-tight text-slate-900 uppercase">
                    FET India
                  </h2>
                  <p className="text-[10px] font-bold text-emerald-700">Public Navigation</p>
                </div>
              </div>

              {/* Close Button (Touch Friendly 44x44px) */}
              <button
                onClick={handleCloseMobileMenu}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                id="header-mobile-drawer-close-btn"
                aria-label="Close Mobile Navigation"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-6 space-y-4">
              {/* Quick 80G Tax-Exempt Donation Card */}
              <button
                onClick={() => handleNavClick('donate')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-extrabold shadow-sm hover:shadow-md transition-all active:scale-[0.98] border border-amber-400 cursor-pointer"
                id="mobile-drawer-donate-btn"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center shrink-0">
                    <HeartHandshake className="w-5 h-5 text-emerald-950" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black tracking-tight leading-tight">Support FET India</p>
                    <p className="text-[10px] font-bold text-emerald-950/80">50% 80G Tax Exemption Benefit</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-950 shrink-0" />
              </button>

          {/* User Profile Card (if Authenticated) */}
          {currentUser ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0"
                  style={{ backgroundColor: isSuperAdmin ? '#B45309' : primaryGreen }}
                >
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.displayName || 'Trust Member'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                    isSuperAdmin ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {getRoleDisplayName()}
                  </span>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    handleCloseMobileMenu();
                    onOpenUserDashboard('profile');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-2xs cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => {
                    handleCloseMobileMenu();
                    onOpenUserDashboard('dashboard');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-2xs cursor-pointer"
                  style={{ backgroundColor: primaryGreen }}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                {isSuperAdmin && (
                  <>
                    <button
                      onClick={() => {
                        handleCloseMobileMenu();
                        onOpenAdminConsole('super_admin');
                      }}
                      className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs cursor-pointer border border-amber-500/50"
                      id="mobile-nav-superadmin-btn"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      <span>Super Admin Control Center</span>
                    </button>

                    <button
                      onClick={() => setMobileAdminSuiteExpanded(!mobileAdminSuiteExpanded)}
                      className="col-span-2 flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 text-amber-300 hover:bg-slate-800 border border-slate-800 shadow-2xs cursor-pointer"
                      id="mobile-nav-admin-suite-toggle"
                    >
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                        <span>Super Admin Governance Portfolios</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${mobileAdminSuiteExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {mobileAdminSuiteExpanded && (
                      <div className="col-span-2 grid grid-cols-2 gap-1.5 p-2 bg-slate-900 rounded-xl border border-slate-800 text-[11px]">
                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('cms');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <Palette className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">CMS & Branding</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('crowdfunding');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <HeartHandshake className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">Crowdfunding</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('donors');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <BadgeDollarSign className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">Donations & 80G</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('finance');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <Landmark className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">Finance & Ledger</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('hrms');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <UserCog className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">Staff & HRMS</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('volunteers');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <Users className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">Volunteers</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('exams');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <Award className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">Competitions</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('reports');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <LineChart className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">Reports & Analytics</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('roles');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <ShieldCheck className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate">Role Governance</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('modules');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <Layers className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">27 Modules Matrix</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('audit');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">Audit Trail Logs</span>
                        </button>

                        <button
                          onClick={() => {
                            handleCloseMobileMenu();
                            onOpenAdminConsole('dashboard');
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-left font-bold cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">Platform Console</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {hasAdminAccess && !isSuperAdmin && (
                  <button
                    onClick={() => {
                      handleCloseMobileMenu();
                      onOpenAdminConsole('dashboard');
                    }}
                    className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-2xs cursor-pointer"
                    style={{ backgroundColor: primaryBlue }}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Administrative Console</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                handleCloseMobileMenu();
                onOpenAuth();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white shadow-sm cursor-pointer"
              style={{ backgroundColor: primaryGreen }}
            >
              <User className="w-4 h-4" />
              <span>Sign In or Register</span>
            </button>
          )}

          {/* Categorized Public Navigation Sections */}
          {/* Section 1: Main */}
          <div className="space-y-1">
            <p className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Main
            </p>
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-1 divide-y divide-slate-100">
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] ${
                  activeSection === 'home' || activeSection === ''
                    ? 'bg-emerald-100/70 text-emerald-950'
                    : 'text-slate-800 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Home</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavClick('about')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-white transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>About Trust</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavClick('programs')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] ${
                  activeSection === 'programs'
                    ? 'bg-emerald-100/70 text-emerald-950'
                    : 'text-slate-800 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Programs & Initiatives</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavClick('events')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] ${
                  activeSection === 'events_blog' || activeSection === 'events'
                    ? 'bg-emerald-100/70 text-emerald-950'
                    : 'text-slate-800 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Events & News</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Section 2: Community & Education */}
          <div className="space-y-1">
            <p className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Community & Education
            </p>
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-1 divide-y divide-slate-100">
              <button
                onClick={() => handleNavClick('membership')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-white transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Membership Registration</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavClick('volunteer')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-white transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Volunteer Corps</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavClick('education')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] ${
                  activeSection === 'education' || activeSection === 'exams'
                    ? 'bg-emerald-100/70 text-emerald-950'
                    : 'text-slate-800 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Competitions & Examinations</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Section 3: Impact & Stewardship */}
          <div className="space-y-1">
            <p className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Impact & Stewardship
            </p>
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-1 divide-y divide-slate-100">
              <button
                onClick={() => handleNavClick('crowdfunding')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] ${
                  activeSection === 'crowdfunding'
                    ? 'bg-emerald-100/70 text-emerald-950'
                    : 'text-slate-800 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Crowdfunding & Relief Appeals</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavClick('donate')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-white transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <BadgeDollarSign className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Donations & 80G Receipts</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavClick('governance')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-white transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Landmark className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Governance & Trustees</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavClick('statistics')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-white transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <LineChart className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Reports & Transparency</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Section 4: Explore & Services */}
          <div className="space-y-1">
            <p className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Explore & Services
            </p>
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-1 divide-y divide-slate-100">
              <button
                onClick={() => handleNavClick('store')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-white transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Publications & Store</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavClick('contact')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-white transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Contact Secretariat</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {onOpenVerification && (
                <button
                  onClick={() => {
                    handleCloseMobileMenu();
                    onOpenVerification();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-white transition-colors cursor-pointer min-h-[44px]"
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Verify Member Credential (QR)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              <button
                onClick={() => handleNavClick('privacy')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-white transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Privacy Policy</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavClick('terms')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-white transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Terms of Trust</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Quick Action Buttons & Additional Mobile Controls */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {/* PWA Install Button */}
            {canInstall && (
              <button
                onClick={() => {
                  handleCloseMobileMenu();
                  installApp();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs border border-slate-700 cursor-pointer transition-colors min-h-[44px]"
                id="header-mobile-install-pwa-btn"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Install FET India App</span>
              </button>
            )}

            {/* Mobile Sign Out (if logged in) */}
            {currentUser && (
              <button
                onClick={() => {
                  handleCloseMobileMenu();
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-xl cursor-pointer transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>

          {/* Drawer Compliance & Registration Footer */}
          <div className="pt-2 pb-6 text-center text-[10px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-500">
              {config.legalName || 'Fatimyah Educational Trust India'}
            </p>
            <p>Reg. No: 153/2014 • 80G & 12A Certified • NITI Aayog</p>
            <p className="text-emerald-700 font-bold">Helpline: +91 97793 42786</p>
          </div>
        </div>
      </div>
    </div>
  )}
    </header>
  );
};


