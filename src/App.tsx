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
import { FeaturedCrowdfundingSection } from './components/home/FeaturedCrowdfundingSection';
import { EducationSupportSection } from './components/home/EducationSupportSection';
import { PublicDonationSection } from './components/home/PublicDonationSection';
import { EventsBlogSection } from './components/home/EventsBlogSection';
import { FutureServicesSection } from './components/home/FutureServicesSection';
import { MissionCtaSection } from './components/home/MissionCtaSection';
import { FeaturedCasesSection } from './components/home/FeaturedCasesSection';
import { FETIndiaExaminationsSection } from './components/home/FETIndiaExaminationsSection';
import { LatestNewsBlogSection } from './components/home/LatestNewsBlogSection';
import { ChairmanMessageSection } from './components/home/ChairmanMessageSection';
import { ChairmanMessageModal } from './components/home/ChairmanMessageModal';
import { NewsBlogReaderModal, NewsArticle } from './components/home/NewsBlogReaderModal';
import { ExaminationInfoModal } from './components/competitions/ExaminationInfoModal';
import { CompetitionRegistrationModal } from './components/competitions/CompetitionRegistrationModal';
import { CampaignDetailsModal } from './components/campaigns/CampaignDetailsModal';
import { SupportCampaignModal } from './components/campaigns/SupportCampaignModal';
import { Competition, CrowdfundingCampaign } from './types';
import { INITIAL_COMPETITIONS } from './data/initialCompetitions';
import { AdminConsole } from './components/admin/AdminConsole';
import { UserDashboard, MemberDashboardTab } from './components/dashboard/UserDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { MembershipVerificationModal } from './components/membership/MembershipVerificationModal';
import { LegalDocumentModal } from './components/legal/LegalDocumentModal';
import { AboutTrustModal, AboutTab } from './components/common/AboutTrustModal';
import { DonationModal } from './components/common/DonationModal';
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
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [aboutModalTab, setAboutModalTab] = useState<AboutTab>('overview');
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Modals for new homepage additions
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<CrowdfundingCampaign | null>(null);
  const [isCaseDetailsOpen, setIsCaseDetailsOpen] = useState<boolean>(false);
  const [selectedCaseForSupport, setSelectedCaseForSupport] = useState<CrowdfundingCampaign | null>(null);
  const [isCaseSupportOpen, setIsCaseSupportOpen] = useState<boolean>(false);

  const [selectedExamForApply, setSelectedExamForApply] = useState<Competition | null>(null);
  const [isExamApplyOpen, setIsExamApplyOpen] = useState<boolean>(false);
  const [selectedExamForInfo, setSelectedExamForInfo] = useState<Competition | null>(null);
  const [isExamInfoOpen, setIsExamInfoOpen] = useState<boolean>(false);
  const [examInfoTab, setExamInfoTab] = useState<'instructions' | 'book_mastery' | 'eligibility'>('instructions');

  const [isChairmanModalOpen, setIsChairmanModalOpen] = useState<boolean>(false);
  const [selectedArticleForReader, setSelectedArticleForReader] = useState<NewsArticle | null>(null);
  const [isNewsReaderOpen, setIsNewsReaderOpen] = useState<boolean>(false);

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
      } else if (hash === '#about' || hash === '#about_trust' || hash === '#about-trust' || path.startsWith('/about')) {
        setAboutModalTab('overview');
        setIsAboutModalOpen(true);
        setCurrentExperience('public');
      } else if (hash === '#governance' || path.startsWith('/governance')) {
        setAboutModalTab('governance');
        setIsAboutModalOpen(true);
        setCurrentExperience('public');
      } else if (hash === '#history' || path.startsWith('/history')) {
        setAboutModalTab('history');
        setIsAboutModalOpen(true);
        setCurrentExperience('public');
      } else if (hash === '#transparency' || path.startsWith('/transparency')) {
        setAboutModalTab('transparency');
        setIsAboutModalOpen(true);
        setCurrentExperience('public');
      } else if (hash === '#chairman' || hash === '#chairman_message' || hash === '#chairmans_message') {
        setIsChairmanModalOpen(true);
        setCurrentExperience('public');
      } else if (hash === '#examinations' || hash === '#examination' || path.startsWith('/examinations')) {
        setActiveSection('examinations');
        setCurrentExperience('public');
        setTimeout(() => {
          document.getElementById('examinations')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } else if (hash === '#apply_exam' || hash === '#exam_apply') {
        const exam = INITIAL_COMPETITIONS[0] || null;
        setSelectedExamForApply(exam);
        setIsExamApplyOpen(true);
        setCurrentExperience('public');
      } else if (hash === '#featured_cases' || hash === '#cases') {
        setActiveSection('featured_cases');
        setCurrentExperience('public');
        setTimeout(() => {
          document.getElementById('featured_cases')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } else if (hash === '#news_blogs' || hash === '#news' || hash === '#blogs') {
        setActiveSection('news_blogs');
        setCurrentExperience('public');
        setTimeout(() => {
          document.getElementById('news_blogs')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } else if (hash === '#donate' || path.startsWith('/donate')) {
        setIsDonationModalOpen(true);
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

  const handleOpenAbout = (tab: AboutTab = 'overview') => {
    setAboutModalTab(tab);
    setIsAboutModalOpen(true);
  };

  const handleOpenDonate = () => {
    setIsDonationModalOpen(true);
  };

  const handleViewCase = (campaign: CrowdfundingCampaign) => {
    setSelectedCaseForDetails(campaign);
    setIsCaseDetailsOpen(true);
  };

  const handleSupportCase = (campaign: CrowdfundingCampaign) => {
    setSelectedCaseForSupport(campaign);
    setIsCaseSupportOpen(true);
  };

  const handleApplyExam = (competition: Competition) => {
    setSelectedExamForApply(competition);
    setIsExamApplyOpen(true);
  };

  const handleOpenApplyExamDirect = () => {
    const exam = INITIAL_COMPETITIONS[0] || null;
    setSelectedExamForApply(exam);
    setIsExamApplyOpen(true);
  };

  const handleViewExamInfo = (competition: Competition, tab: 'instructions' | 'book_mastery' | 'eligibility' = 'instructions') => {
    setSelectedExamForInfo(competition);
    setExamInfoTab(tab);
    setIsExamInfoOpen(true);
  };

  const handleReadArticle = (article: NewsArticle) => {
    setSelectedArticleForReader(article);
    setIsNewsReaderOpen(true);
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
    
    // Intercept separate destinations for About & Governance as per prompt
    if (sectionId === 'about' || sectionId === 'about_trust') {
      handleOpenAbout('overview');
      return;
    }
    if (sectionId === 'governance') {
      handleOpenAbout('governance');
      return;
    }
    if (sectionId === 'history') {
      handleOpenAbout('history');
      return;
    }
    if (sectionId === 'transparency') {
      handleOpenAbout('transparency');
      return;
    }
    if (sectionId === 'donate') {
      handleOpenDonate();
      return;
    }

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
      const element = document.getElementById(sectionId) || 
        (sectionId === 'education_support' ? document.getElementById('education-support') : null);
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
            onOpenAbout={handleOpenAbout}
            onOpenExamination={() => handleScrollToSection('examinations')}
            onOpenApplyExam={handleOpenApplyExamDirect}
            onOpenChairmanMessage={() => setIsChairmanModalOpen(true)}
            onOpenNewsBlogs={() => handleScrollToSection('news_blogs')}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          {/* Main Public Website Body */}
          <main className="flex-1">
            {(() => {
              const defaultOrder = [
                'hero',
                'crowdfunding',
                'featured_cases',
                'education_support',
                'programs',
                'examinations',
                'events_blog',
                'news_blogs',
                'chairmans_message',
                'statistics',
                'mission_cta'
              ];
              
              // Normalize and deduplicate section keys if legacy keys exist
              const baseOrder = (config.homepageSectionsOrdering && config.homepageSectionsOrdering.length > 0)
                ? config.homepageSectionsOrdering
                : defaultOrder;

              // Ensure all newly added sections are safely included if not already present
              const fullOrder = [...baseOrder];
              defaultOrder.forEach((key) => {
                if (!fullOrder.includes(key)) {
                  fullOrder.push(key);
                }
              });

              const normalizedOrder: string[] = [];
              const seen = new Set<string>();

              fullOrder.forEach((item) => {
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
                            onOpenDonate={handleOpenDonate}
                            onOpenAuth={() => setIsAuthModalOpen(true)}
                          />
                        );
                      case 'crowdfunding':
                        return (
                          <FeaturedCrowdfundingSection 
                            key={itemKey} 
                            onOpenDonate={handleOpenDonate}
                            onOpenLegal={handleOpenLegal} 
                          />
                        );
                      case 'featured_cases':
                        return (
                          <FeaturedCasesSection
                            key={itemKey}
                            onViewCase={handleViewCase}
                            onSupportCase={handleSupportCase}
                            onViewAllCases={() => handleScrollToSection('crowdfunding')}
                          />
                        );
                      case 'education_support':
                        return (
                          <EducationSupportSection 
                            key={itemKey} 
                            onOpenDonate={handleOpenDonate}
                            onExplorePrograms={() => handleScrollToSection('programs')}
                          />
                        );
                      case 'programs':
                        return (
                          <PublicInitiatives
                            key={itemKey}
                            onOpenAuth={() => setIsAuthModalOpen(true)}
                            onSelectInitiative={handleScrollToSection}
                          />
                        );
                      case 'examinations':
                        return (
                          <FETIndiaExaminationsSection
                            key={itemKey}
                            onApplyExam={handleApplyExam}
                            onViewExamInfo={handleViewExamInfo}
                            onViewAllExams={() => handleScrollToSection('examinations')}
                          />
                        );
                      case 'events_blog':
                        return <EventsBlogSection key={itemKey} />;
                      case 'news_blogs':
                        return (
                          <LatestNewsBlogSection
                            key={itemKey}
                            onReadArticle={handleReadArticle}
                            onViewAllNewsBlogs={() => handleScrollToSection('events_blog')}
                          />
                        );
                      case 'chairmans_message':
                        return (
                          <ChairmanMessageSection
                            key={itemKey}
                            onReadMoreChairman={() => setIsChairmanModalOpen(true)}
                            onOpenGovernance={() => handleOpenAbout('governance')}
                          />
                        );
                      case 'statistics':
                        return <ImpactStatisticsSection key={itemKey} />;
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
                      case 'future_services':
                        return <FutureServicesSection key={itemKey} />;
                      case 'donate':
                        return (
                          <PublicDonationSection 
                            key={itemKey} 
                            onOpenLegal={handleOpenLegal} 
                          />
                        );
                      case 'mission_cta':
                        return (
                          <MissionCtaSection
                            key={itemKey}
                            onOpenDonate={handleOpenDonate}
                            onOpenVolunteer={() => handleScrollToSection('volunteer')}
                            onOpenContact={() => handleScrollToSection('contact')}
                            onOpenAbout={() => handleOpenAbout('governance')}
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
            onOpenAbout={handleOpenAbout}
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

      {/* Dedicated About Us, Governance & Institutional Transparency Modal */}
      <AboutTrustModal
        isOpen={isAboutModalOpen}
        onClose={() => {
          setIsAboutModalOpen(false);
          if (
            window.location.hash.startsWith('#about') || 
            window.location.hash.startsWith('#governance') || 
            window.location.hash.startsWith('#history') || 
            window.location.hash.startsWith('#transparency')
          ) {
            window.history.pushState(null, '', window.location.pathname);
          }
        }}
        initialTab={aboutModalTab}
        onOpenDonate={handleOpenDonate}
        onOpenVolunteer={() => {
          setIsAboutModalOpen(false);
          handleScrollToSection('volunteer');
        }}
      />

      {/* Central 80G Tax-Exempt Contribution Modal */}
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => {
          setIsDonationModalOpen(false);
          if (window.location.hash.startsWith('#donate')) {
            window.history.pushState(null, '', window.location.pathname);
          }
        }}
        onOpenLegal={handleOpenLegal}
      />

      {/* Public Examination Application Modal */}
      {selectedExamForApply && (
        <CompetitionRegistrationModal
          competition={selectedExamForApply}
          isOpen={isExamApplyOpen}
          onClose={() => {
            setIsExamApplyOpen(false);
            setSelectedExamForApply(null);
          }}
          onOpenAuth={() => {
            setIsExamApplyOpen(false);
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* Public Examination Information & Book Mastery Modal */}
      <ExaminationInfoModal
        competition={selectedExamForInfo}
        isOpen={isExamInfoOpen}
        onClose={() => {
          setIsExamInfoOpen(false);
          setSelectedExamForInfo(null);
        }}
        onApply={(comp) => {
          setIsExamInfoOpen(false);
          handleApplyExam(comp);
        }}
        initialTab={examInfoTab}
      />

      {/* Featured Case Details Modal */}
      <CampaignDetailsModal
        campaign={selectedCaseForDetails}
        isOpen={isCaseDetailsOpen}
        onClose={() => {
          setIsCaseDetailsOpen(false);
          setSelectedCaseForDetails(null);
        }}
        onOpenSupport={(c) => {
          setIsCaseDetailsOpen(false);
          handleSupportCase(c);
        }}
      />

      {/* Featured Case Support & Contribution Modal */}
      <SupportCampaignModal
        campaign={selectedCaseForSupport}
        isOpen={isCaseSupportOpen}
        onClose={() => {
          setIsCaseSupportOpen(false);
          setSelectedCaseForSupport(null);
        }}
      />

      {/* Chairman's Message Dedicated Address Modal */}
      <ChairmanMessageModal
        isOpen={isChairmanModalOpen}
        onClose={() => setIsChairmanModalOpen(false)}
        onOpenGovernance={() => {
          setIsChairmanModalOpen(false);
          handleOpenAbout('governance');
        }}
      />

      {/* News & Blog Circular Reader Modal */}
      <NewsBlogReaderModal
        article={selectedArticleForReader}
        isOpen={isNewsReaderOpen}
        onClose={() => {
          setIsNewsReaderOpen(false);
          setSelectedArticleForReader(null);
        }}
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
