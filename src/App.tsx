/**
 * @license
 * Official Digital Platform for Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Platform Display Name: Fatimyah Educational Trust India
 * Public Short Brand: FET India
 * Website: FETIndia.com
 * Tagline: Education • Service • Empowerment
 * 
 * Implements 3 strictly separated experiences:
 * - EXPERIENCE A: Public Website
 * - EXPERIENCE B: User Dashboard
 * - EXPERIENCE C: Administration System
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ModuleProvider } from './contexts/ModuleContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useConfig } from './contexts/ConfigContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HeroSlider } from './components/home/HeroSlider';
import { ImpactStatisticsSection } from './components/home/ImpactStatisticsSection';
import { PublicInitiatives } from './components/home/PublicInitiatives';
import { EducationExamSection } from './components/home/EducationExamSection';
import { VolunteerMembershipSection } from './components/home/VolunteerMembershipSection';
import { CrowdfundingDonationSection } from './components/home/CrowdfundingDonationSection';
import { EventsBlogSection } from './components/home/EventsBlogSection';
import { FutureServicesSection } from './components/home/FutureServicesSection';
import { MissionCtaSection } from './components/home/MissionCtaSection';
import { AdminConsole } from './components/admin/AdminConsole';
import { UserDashboard, MemberDashboardTab } from './components/dashboard/UserDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { MembershipVerificationModal } from './components/membership/MembershipVerificationModal';
import { LegalDocumentModal } from './components/legal/LegalDocumentModal';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { OfflineNotice } from './components/common/OfflineNotice';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const FETIndiaPlatform: React.FC = () => {
  const { currentUser } = useAuth();
  const { config } = useConfig();
  const [currentExperience, setCurrentExperience] = useState<'public' | 'dashboard' | 'admin'>('public');
  const [dashboardInitialTab, setDashboardInitialTab] = useState<MemberDashboardTab>('dashboard');
  const [activeSection, setActiveSection] = useState<string>('home');
  const [adminInitialView, setAdminInitialView] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [verificationMemberId, setVerificationMemberId] = useState<string>('');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Sync route from URL / hash on mount & popstate
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);

      // Check if URL has verification trigger
      if (hash.startsWith('#verify') || path.startsWith('/verify') || searchParams.has('verify') || searchParams.has('id')) {
        let queryId = searchParams.get('id') || searchParams.get('verify') || '';
        
        if (!queryId && hash.includes('id=')) {
          const hashMatch = window.location.hash.match(/id=([^&]+)/i);
          if (hashMatch && hashMatch[1]) {
            queryId = decodeURIComponent(hashMatch[1]);
          }
        }
        
        if (!queryId && hash.startsWith('#verify/')) {
          queryId = decodeURIComponent(hash.replace('#verify/', ''));
        }

        if (!queryId && path.startsWith('/verify/')) {
          queryId = decodeURIComponent(window.location.pathname.replace(/^\/verify\//i, ''));
        }

        if (queryId) {
          setVerificationMemberId(queryId.trim().toUpperCase());
        }
        setIsVerificationModalOpen(true);
      } else if (path.startsWith('/superadmin') || hash === '#superadmin') {
        setAdminInitialView('super_admin');
        setCurrentExperience('admin');
      } else if (path.startsWith('/admin') || hash === '#admin') {
        setCurrentExperience('admin');
      } else if (path.startsWith('/notifications') || hash === '#notifications') {
        setDashboardInitialTab('notifications');
        setCurrentExperience('dashboard');
      } else if (path.startsWith('/exams') || path.startsWith('/competitions') || hash === '#exams' || hash === '#competitions') {
        setDashboardInitialTab('competitions');
        setCurrentExperience('dashboard');
      } else if (path.startsWith('/portal') || path.startsWith('/dashboard') || hash === '#portal' || hash === '#dashboard') {
        setCurrentExperience('dashboard');
      } else if (hash === '#privacy' || hash === '#privacy-policy' || path.startsWith('/privacy')) {
        setLegalModalTab('privacy');
        setIsLegalModalOpen(true);
        setCurrentExperience('public');
      } else if (hash === '#terms' || hash === '#terms-of-trust' || hash === '#terms-and-conditions' || path.startsWith('/terms')) {
        setLegalModalTab('terms');
        setIsLegalModalOpen(true);
        setCurrentExperience('public');
      } else {
        setCurrentExperience('public');
      }
    };

    handleRouteChange();
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const handleOpenLegal = (tab: 'terms' | 'privacy' = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  const handleOpenVerification = (memberId?: string) => {
    setVerificationMemberId(memberId || '');
    setIsVerificationModalOpen(true);
  };

  const handleOpenAdmin = (view?: string) => {
    setIsAuthModalOpen(false);
    if (view) setAdminInitialView(view);
    setCurrentExperience('admin');
    window.history.pushState(null, '', '#admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenUserDashboard = (tab?: MemberDashboardTab) => {
    setIsAuthModalOpen(false);
    if (tab) {
      setDashboardInitialTab(tab);
    }
    setCurrentExperience('dashboard');
    window.history.pushState(null, '', tab === 'notifications' ? '#notifications' : '#portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToPublic = () => {
    setIsAuthModalOpen(false);
    setCurrentExperience('public');
    window.history.pushState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    setActiveSection(sectionId);
    if (currentExperience !== 'public') {
      setCurrentExperience('public');
      window.history.pushState(null, '', '/');
    }
    setTimeout(() => {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <>
      {/* Offline Connectivity Notice Banner */}
      <OfflineNotice />

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* EXPERIENCE C: ADMINISTRATION SYSTEM */}
      {currentExperience === 'admin' && (
        <AdminConsole
          initialView={adminInitialView}
          onReturnToPublic={handleReturnToPublic}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenUserDashboard={handleOpenUserDashboard}
        />
      )}

      {/* EXPERIENCE B: USER & MEMBER DASHBOARD */}
      {currentExperience === 'dashboard' && (
        <UserDashboard
          initialTab={dashboardInitialTab}
          onReturnToPublic={handleReturnToPublic}
          onOpenAdminConsole={() => handleOpenAdmin('dashboard')}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* EXPERIENCE A: PUBLIC WEBSITE */}
      {currentExperience === 'public' && (
        <div className="min-h-screen bg-white text-slate-900 flex flex-col pb-16 md:pb-0 selection:bg-emerald-100 selection:text-emerald-900" id="fet-india-app">
          {/* Public Header */}
          <Header
            activeSection={activeSection}
            setActiveSection={handleScrollToSection}
            onOpenAuth={() => {
              setIsMobileMenuOpen(false);
              setIsAuthModalOpen(true);
            }}
            onOpenUserDashboard={(tab) => {
              setIsMobileMenuOpen(false);
              handleOpenUserDashboard(tab);
            }}
            onOpenAdminConsole={(view) => {
              setIsMobileMenuOpen(false);
              handleOpenAdmin(view);
            }}
            onOpenVerification={(memberId) => {
              setIsMobileMenuOpen(false);
              handleOpenVerification(memberId);
            }}
            onOpenLegal={(tab) => {
              setIsMobileMenuOpen(false);
              handleOpenLegal(tab);
            }}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          {/* Main Public Website Body */}
          <main className="flex-1">
            {(() => {
              const defaultOrder = [
                'hero',
                'statistics',
                'programs',
                'education',
                'volunteer_membership',
                'crowdfunding',
                'events_blog',
                'future_services',
                'mission_cta'
              ];
              
              // Normalize and deduplicate section keys if legacy keys (like store/travel/governance) exist
              const rawOrder = config.homepageSectionsOrdering && config.homepageSectionsOrdering.length > 0
                ? config.homepageSectionsOrdering
                : defaultOrder;

              const normalizedOrder: string[] = [];
              const seen = new Set<string>();

              rawOrder.forEach((item) => {
                let canonical = item;
                if (item === 'store' || item === 'travel') {
                  canonical = 'future_services';
                } else if (item === 'governance') {
                  canonical = 'mission_cta';
                }

                if (!seen.has(canonical)) {
                  seen.add(canonical);
                  normalizedOrder.push(canonical);
                }
              });

              const visibility = config.homepageSectionsVisibility || {};

              return (
                <>
                  {normalizedOrder.map((sectionId, index) => {
                    // Check if explicit false, otherwise default true
                    if (visibility[sectionId] === false) return null;
                    const itemKey = `section-${sectionId}-${index}`;

                    switch (sectionId) {
                      case 'hero':
                        return (
                          <HeroSlider
                            key={itemKey}
                            onExplorePrograms={() => handleScrollToSection('programs')}
                            onOpenDonate={() => handleScrollToSection('donate')}
                            onOpenAuth={() => setIsAuthModalOpen(true)}
                          />
                        );
                      case 'statistics':
                        return <ImpactStatisticsSection key={itemKey} />;
                      case 'programs':
                        return (
                          <PublicInitiatives
                            key={itemKey}
                            onOpenAuth={() => setIsAuthModalOpen(true)}
                            onSelectInitiative={handleScrollToSection}
                          />
                        );
                      case 'education':
                        return (
                          <EducationExamSection
                            key={itemKey}
                            onOpenAuth={() => setIsAuthModalOpen(true)}
                          />
                        );
                      case 'volunteer_membership':
                        return (
                          <VolunteerMembershipSection
                            key={itemKey}
                            onOpenAuth={() => setIsAuthModalOpen(true)}
                            onOpenUserDashboard={handleOpenUserDashboard}
                          />
                        );
                      case 'crowdfunding':
                        return <CrowdfundingDonationSection key={itemKey} onOpenLegal={handleOpenLegal} />;
                      case 'events_blog':
                        return <EventsBlogSection key={itemKey} />;
                      case 'future_services':
                        return <FutureServicesSection key={itemKey} />;
                      case 'mission_cta':
                        return (
                          <MissionCtaSection
                            key={itemKey}
                            onOpenDonate={() => handleScrollToSection('donate')}
                            onOpenVolunteer={() => handleScrollToSection('volunteer')}
                            onOpenContact={() => handleScrollToSection('contact')}
                          />
                        );
                      default:
                        return null;
                    }
                  })}
                </>
              );
            })()}
          </main>

          {/* Institutional Footer */}
          <Footer
            onOpenSection={handleScrollToSection}
            onOpenAdmin={handleOpenAdmin}
            onOpenVerification={handleOpenVerification}
            onOpenLegal={handleOpenLegal}
          />

          {/* Native Mobile Bottom Navigation Bar */}
          <MobileBottomNav
            activeSection={activeSection}
            setActiveSection={handleScrollToSection}
            onOpenAuth={() => {
              setIsMobileMenuOpen(false);
              setIsAuthModalOpen(true);
            }}
            onOpenUserDashboard={(tab) => {
              setIsMobileMenuOpen(false);
              handleOpenUserDashboard(tab);
            }}
            onOpenMoreMenu={() => setIsMobileMenuOpen(true)}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          />
        </div>
      )}

      {/* Authentication & Access Portal Modal - Centralized and cleanly unmounted when closed */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleOpenUserDashboard}
      />

      {/* Public QR Membership Verification Modal */}
      <MembershipVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => {
          setIsVerificationModalOpen(false);
          setVerificationMemberId('');
          if (window.location.hash.startsWith('#verify')) {
            window.history.pushState(null, '', window.location.pathname);
          }
        }}
        initialMemberId={verificationMemberId}
      />

      {/* Legal & Regulatory Modal (Terms of Trust & Privacy Policy) */}
      <LegalDocumentModal
        isOpen={isLegalModalOpen}
        onClose={() => {
          setIsLegalModalOpen(false);
          if (window.location.hash.startsWith('#privacy') || window.location.hash.startsWith('#terms')) {
            window.history.pushState(null, '', window.location.pathname);
          }
        }}
        initialTab={legalModalTab}
      />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ConfigProvider>
          <ModuleProvider>
            <NotificationProvider>
              <FETIndiaPlatform />
            </NotificationProvider>
          </ModuleProvider>
        </ConfigProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
