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
import { ShoppingBag } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ModuleProvider } from './contexts/ModuleContext';
import { ModuleControlsProvider, useModuleControls } from './contexts/ModuleControlsContext';
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
import { AboutTrustFullPage, AboutSectionId } from './components/about/AboutTrustFullPage';
import { DonationModal } from './components/common/DonationModal';
import { PublicSearchModal } from './components/common/PublicSearchModal';
import { GeneralDonationView, DonationTab } from './components/donation/GeneralDonationView';
import { Top100ResultsShowcase } from './components/home/Top100ResultsShowcase';
import { StudentResultPortalModal } from './components/competitions/StudentResultPortalModal';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { OfflineNotice } from './components/common/OfflineNotice';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProgramsPage } from './components/pages/ProgramsPage';
import { AppealsPage } from './components/pages/AppealsPage';
import { MembershipPage } from './components/pages/MembershipPage';
import { VolunteersPage } from './components/pages/VolunteersPage';
import { EventsNewsPage } from './components/pages/EventsNewsPage';
import { ContactUsPage } from './components/pages/ContactUsPage';
import { ExaminationPage } from './components/pages/ExaminationPage';
import { FETStorePage } from './components/store/FETStorePage';
import { CartProvider } from './contexts/CartContext';
import { StoreCartDrawer } from './components/store/StoreCartDrawer';
import { StoreCheckoutModal } from './components/store/StoreCheckoutModal';

export type AppExperience = 
  | 'public' 
  | 'donate' 
  | 'dashboard' 
  | 'admin' 
  | 'about' 
  | 'programs' 
  | 'appeals' 
  | 'membership' 
  | 'volunteers' 
  | 'events_news' 
  | 'contact' 
  | 'examination'
  | 'store';

const FETIndiaPlatform: React.FC = () => {
  const { currentUser } = useAuth();
  const { config } = useConfig();
  const { isModuleEnabled } = useModuleControls();
  const [currentExperience, setCurrentExperience] = useState<AppExperience>('public');
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
  const [aboutInitialSection, setAboutInitialSection] = useState<AboutSectionId>('overview');
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
  const [examInfoTab, setExamInfoTab] = useState<'instructions' | 'book_mastery' | 'eligibility' | 'prizes'>('instructions');

  const [isChairmanModalOpen, setIsChairmanModalOpen] = useState<boolean>(false);
  const [selectedArticleForReader, setSelectedArticleForReader] = useState<NewsArticle | null>(null);
  const [isNewsReaderOpen, setIsNewsReaderOpen] = useState<boolean>(false);

  // Search, General Donation & Student Examination Result states
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [generalDonationTab, setGeneralDonationTab] = useState<DonationTab>('general');
  const [isStudentResultModalOpen, setIsStudentResultModalOpen] = useState<boolean>(false);
  const [studentResultPrefill, setStudentResultPrefill] = useState<string>('');
  const [examinationTargetId, setExaminationTargetId] = useState<string>('');
  const [storeTargetProductSlug, setStoreTargetProductSlug] = useState<string>('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);

  // Pending Authenticated Action State (Exam Application, Crowdfunding, and Store Checkout)
  const [pendingAuthAction, setPendingAuthAction] = useState<{
    type: 'apply_exam' | 'create_crowdfunding' | 'start_exam' | 'store_checkout';
    competition?: Competition | null;
    competitionId?: string;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('fet_pending_auth_action');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Automatically return user to original action after successful authentication
  useEffect(() => {
    if (currentUser) {
      let pending = pendingAuthAction;
      if (!pending && typeof window !== 'undefined') {
        try {
          const stored = sessionStorage.getItem('fet_pending_auth_action');
          if (stored) pending = JSON.parse(stored);
        } catch {}
      }

      if (pending) {
        if (pending.type === 'apply_exam') {
          const targetComp = pending.competition || INITIAL_COMPETITIONS.find(c => c.id === pending?.competitionId) || INITIAL_COMPETITIONS[0];
          if (targetComp) {
            setSelectedExamForApply(targetComp);
            setIsExamApplyOpen(true);
          }
        } else if (pending.type === 'create_crowdfunding') {
          setDashboardInitialTab('campaigns');
          setCurrentExperience('dashboard');
        } else if (pending.type === 'start_exam') {
          setDashboardInitialTab('competitions');
          setCurrentExperience('dashboard');
        } else if (pending.type === 'store_checkout') {
          setIsCheckoutModalOpen(true);
        }
        setPendingAuthAction(null);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('fet_pending_auth_action');
          } catch {}
        }
      }
    }
  }, [currentUser]);

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
      } else if (
        path.startsWith('/examination') ||
        path.startsWith('/examinations') ||
        path.startsWith('/competitions/') ||
        path.startsWith('/competition/') ||
        path.startsWith('/exams/') ||
        path.startsWith('/exam/') ||
        hash.startsWith('#examination') ||
        hash.startsWith('#competitions/') ||
        hash.startsWith('#competition/') ||
        searchParams.has('exam') ||
        searchParams.has('competition')
      ) {
        let compId = '';
        if (searchParams.has('exam') || searchParams.has('competition') || searchParams.has('id')) {
          compId = searchParams.get('exam') || searchParams.get('competition') || searchParams.get('id') || '';
        }
        if (!compId) {
          const directMatch = path.match(/^\/(examination|examinations|competitions|competition|exam|exams)\/([^/?#]+)/i);
          if (directMatch && directMatch[2]) {
            compId = decodeURIComponent(directMatch[2]);
          }
        }
        if (!compId) {
          const hashMatch = hash.match(/^#(examination|examinations|competitions|competition|exam|exams)\/([^/?#]+)/i);
          if (hashMatch && hashMatch[2]) {
            compId = decodeURIComponent(hashMatch[2]);
          }
        }
        if (compId) {
          setExaminationTargetId(compId.trim());
        }
        setCurrentExperience('examination');
      } else if (path === '/competitions' || path === '/exams' || hash === '#exams' || hash === '#competitions') {
        if (currentUser) {
          setDashboardInitialTab('competitions');
          setCurrentExperience('dashboard');
        } else {
          setExaminationTargetId('');
          setCurrentExperience('examination');
        }
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
        setAboutInitialSection('overview');
        setCurrentExperience('about');
      } else if (hash === '#governance' || path.startsWith('/governance')) {
        setAboutInitialSection('governance');
        setCurrentExperience('about');
      } else if (hash === '#roles_matrix' || hash === '#roles' || path.startsWith('/roles')) {
        setAboutInitialSection('roles_matrix');
        setCurrentExperience('about');
      } else if (hash === '#history' || path.startsWith('/history')) {
        setAboutInitialSection('history');
        setCurrentExperience('about');
      } else if (hash === '#transparency' || path.startsWith('/transparency')) {
        setAboutInitialSection('transparency');
        setCurrentExperience('about');
      } else if (hash === '#legal_tax' || hash === '#tax' || hash === '#80g' || path.startsWith('/tax')) {
        setAboutInitialSection('legal_tax');
        setCurrentExperience('about');
      } else if (hash === '#signatory' || path.startsWith('/signatory')) {
        setAboutInitialSection('signatory');
        setCurrentExperience('about');
      } else if (hash === '#mission_vision' || hash === '#mission' || hash === '#vision') {
        setAboutInitialSection('mission_vision');
        setCurrentExperience('about');
      } else if (hash === '#programs' || hash === '#programs_welfare' || path.startsWith('/programs')) {
        setCurrentExperience('programs');
      } else if (hash === '#appeals' || hash === '#crowdfunding' || hash === '#crowdfunding_appeals' || path.startsWith('/appeals')) {
        setCurrentExperience('appeals');
      } else if (hash === '#membership' || path.startsWith('/membership')) {
        setCurrentExperience('membership');
      } else if (hash === '#volunteers' || hash === '#volunteer' || path.startsWith('/volunteers') || path.startsWith('/volunteer')) {
        setCurrentExperience('volunteers');
      } else if (hash === '#events-news' || hash === '#events_news' || hash === '#events' || hash === '#news' || path.startsWith('/events') || path.startsWith('/news')) {
        setCurrentExperience('events_news');
      } else if (hash === '#contact' || hash === '#contact-us' || path.startsWith('/contact')) {
        setCurrentExperience('contact');
      } else if (hash.startsWith('#store/') || hash.startsWith('#store?') || path.startsWith('/store/') || path === '/store' || hash === '#store' || hash === '#fet_store' || hash === '#store_catalogue') {
        let slug = '';
        if (searchParams.has('product') || searchParams.has('slug') || searchParams.has('id')) {
          slug = searchParams.get('product') || searchParams.get('slug') || searchParams.get('id') || '';
        }
        if (!slug && path.startsWith('/store/')) {
          slug = decodeURIComponent(path.replace(/^\/store\/?/i, ''));
        }
        if (!slug && hash.startsWith('#store/')) {
          slug = decodeURIComponent(hash.replace(/^#store\/?/i, ''));
        }
        slug = slug.split('?')[0].split('#')[0].trim();
        setStoreTargetProductSlug(slug || '');
        setCurrentExperience('store');
      } else if (hash === '#chairman' || hash === '#chairman_message' || hash === '#chairmans_message') {
        setIsChairmanModalOpen(true);
        setCurrentExperience('public');
      } else if (hash === '#apply_exam' || hash === '#exam_apply') {
        const exam = INITIAL_COMPETITIONS[0] || null;
        if (!currentUser) {
          const pending = { type: 'apply_exam' as const, competition: exam, competitionId: exam?.id };
          setPendingAuthAction(pending);
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('fet_pending_auth_action', JSON.stringify(pending));
            } catch {}
          }
          setIsAuthModalOpen(true);
          setCurrentExperience('public');
        } else {
          setSelectedExamForApply(exam);
          setIsExamApplyOpen(true);
          setCurrentExperience('public');
        }
      } else if (hash === '#featured_cases' || hash === '#cases') {
        setActiveSection('featured_cases');
        setCurrentExperience('public');
        setTimeout(() => {
          document.getElementById('featured_cases')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } else if (hash === '#news_blogs' || hash === '#news' || hash === '#blogs') {
        setCurrentExperience('events_news');
      } else if (hash === '#search' || path.startsWith('/search')) {
        setIsSearchModalOpen(true);
        setCurrentExperience('public');
      } else if (hash === '#results' || hash === '#student_results' || hash === '#scorecard' || path.startsWith('/results')) {
        setIsStudentResultModalOpen(true);
        setCurrentExperience('public');
      } else if (hash === '#donate' || hash === '#donate_now' || hash === '#general_donation' || hash === '#general-donation' || hash.startsWith('#donate_') || path.startsWith('/donate')) {
        let initialTab: DonationTab = 'general';
        if (hash === '#donate_zakat' || hash === '#zakat') initialTab = 'zakat';
        else if (hash === '#donate_fitrah' || hash === '#fitrah') initialTab = 'fitrah';
        else if (hash === '#donate_property' || hash === '#property') initialTab = 'property';
        else if (hash === '#donate_material' || hash === '#material') initialTab = 'material';
        else if (hash === '#donate_other' || hash === '#other') initialTab = 'other';
        setGeneralDonationTab(initialTab);
        setCurrentExperience('donate');
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

  const handleOpenAbout = (tab: AboutTab | AboutSectionId = 'overview') => {
    let section: AboutSectionId = 'overview';
    if (tab === 'governance') section = 'governance';
    else if (tab === 'history') section = 'history';
    else if (tab === 'transparency') section = 'transparency';
    else if (tab === 'roles_matrix') section = 'roles_matrix';
    else if (tab === 'legal_tax') section = 'legal_tax';
    else if (tab === 'signatory') section = 'signatory';
    else if (tab === 'mission_vision') section = 'mission_vision';
    setAboutInitialSection(section);
    setCurrentExperience('about');
    window.history.pushState(null, '', section === 'overview' ? '#about' : `#${section}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDonate = (tab: DonationTab = 'general') => {
    setGeneralDonationTab(tab);
    setCurrentExperience('donate');
    window.history.pushState(null, '', tab === 'general' ? '#donate' : `#donate_${tab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPrograms = () => {
    setCurrentExperience('programs');
    window.history.pushState(null, '', '/programs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAppeals = () => {
    setCurrentExperience('appeals');
    window.history.pushState(null, '', '/appeals');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMembership = () => {
    setCurrentExperience('membership');
    window.history.pushState(null, '', '/membership');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenVolunteers = () => {
    setCurrentExperience('volunteers');
    window.history.pushState(null, '', '/volunteers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEventsNews = () => {
    setCurrentExperience('events_news');
    window.history.pushState(null, '', '/events-news');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenContact = () => {
    setCurrentExperience('contact');
    window.history.pushState(null, '', '/contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenExamination = () => {
    setCurrentExperience('examination');
    window.history.pushState(null, '', '/examination');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenStore = () => {
    if (!isModuleEnabled('store')) {
      return;
    }
    setStoreTargetProductSlug('');
    setCurrentExperience('store');
    window.history.pushState(null, '', '/store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Synchronize document title and description based on current experience
  useEffect(() => {
    const titles: Record<AppExperience, { title: string; desc: string }> = {
      public: {
        title: 'FET India | Fatimyah Educational Trust India — Education • Service • Empowerment',
        desc: 'Official digital platform for Fatimyah Educational Trust India (FET India). Education • Service • Empowerment. Established 1994.'
      },
      donate: {
        title: 'Official 80G Tax-Exempt Donation Gateway | Fatimyah Educational Trust India',
        desc: 'Contribute to educational sponsorships, student support, and medical relief. Eligible for 50% tax exemption under Section 80G.'
      },
      about: {
        title: 'About Trust, Governance & Transparency | Fatimyah Educational Trust India',
        desc: 'Explore the mission, vision, Board of Trustees, legal status, and audited public accountability of Fatimyah Educational Trust India.'
      },
      programs: {
        title: 'Programs & Welfare Initiatives | Fatimyah Educational Trust India',
        desc: 'Comprehensive educational, medical, and community welfare programs empowering underprivileged families across India.'
      },
      appeals: {
        title: 'Emergency Relief & Humanitarian Appeals | Fatimyah Educational Trust India',
        desc: 'Support verified educational scholarships, critical medical emergencies, and urgent humanitarian relief appeals with 100% distribution.'
      },
      membership: {
        title: 'Trust Membership & Digital Identity | Fatimyah Educational Trust India',
        desc: 'Join Fatimyah Educational Trust. Explore membership tiers, secure digital identity cards, and community stewardship.'
      },
      volunteers: {
        title: 'Volunteer Network & Field Corps | Fatimyah Educational Trust India',
        desc: 'Enroll in the FET India volunteer corps. Serve communities through education, disaster response, and field welfare drives.'
      },
      events_news: {
        title: 'Events, Circulars & Official News | Fatimyah Educational Trust India',
        desc: 'Official announcements, academic circulars, press releases, and upcoming community initiatives by Fatimyah Educational Trust India.'
      },
      contact: {
        title: 'Contact Head Secretariat & Directory | Fatimyah Educational Trust India',
        desc: 'Connect with Fatimyah Educational Trust offices, department directorates, emergency hotlines, and official correspondence desks.'
      },
      examination: {
        title: 'National Examination Bureau & Talent Search | Fatimyah Educational Trust India',
        desc: 'National book reading competitions, academic olympiads, syllabus guides, and verified candidate results by FET India.'
      },
      store: {
        title: 'Official FET Store & Educational Publications | Fatimyah Educational Trust India',
        desc: 'Curated textbooks, academic publications, official trust literature, and ethical merchandise by Fatimyah Educational Trust India.'
      },
      dashboard: {
        title: 'Member & Volunteer Portal | Fatimyah Educational Trust India',
        desc: 'Access your official digital member card, service logs, event passes, and donation history.'
      },
      admin: {
        title: 'Institutional Control & CMS Console | Fatimyah Educational Trust India',
        desc: 'Centralized administrative console for verification, CMS management, and governance.'
      }
    };

    const currentMeta = titles[currentExperience] || titles.public;
    document.title = currentMeta.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', currentMeta.desc);
    }
  }, [currentExperience]);

  const handleSearchNavigate = (actionType: string, targetId: string) => {
    setIsSearchModalOpen(false);
    if (targetId === 'student_results' || targetId === 'results' || targetId === 'exam_results') {
      setIsStudentResultModalOpen(true);
      return;
    }
    if (targetId === 'general_donation' || targetId === 'donate') {
      handleOpenDonate('general');
      return;
    }
    if (targetId === 'chairman_message') {
      setIsChairmanModalOpen(true);
      return;
    }
    if (targetId === 'exam_apply') {
      handleOpenApplyExamDirect();
      return;
    }
    if (targetId === 'programs') {
      handleOpenPrograms();
      return;
    }
    if (targetId === 'appeals' || targetId === 'crowdfunding') {
      handleOpenAppeals();
      return;
    }
    if (targetId === 'membership') {
      handleOpenMembership();
      return;
    }
    if (targetId === 'volunteers' || targetId === 'volunteer') {
      handleOpenVolunteers();
      return;
    }
    if (targetId === 'events' || targetId === 'news') {
      handleOpenEventsNews();
      return;
    }
    if (targetId === 'contact') {
      handleOpenContact();
      return;
    }
    if (targetId === 'examinations' || targetId === 'examination') {
      handleOpenExamination();
      return;
    }
    if (targetId === 'store' || targetId === 'fet_store' || targetId === 'shop' || targetId === 'books') {
      handleOpenStore();
      return;
    }
    if (actionType === 'scroll') {
      handleScrollToSection(targetId);
      return;
    }
    if (actionType === 'dashboard') {
      handleOpenUserDashboard(targetId as MemberDashboardTab);
      return;
    }
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
    if (!currentUser) {
      const pending = { type: 'apply_exam' as const, competition, competitionId: competition.id };
      setPendingAuthAction(pending);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('fet_pending_auth_action', JSON.stringify(pending));
        } catch {}
      }
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedExamForApply(competition);
    setIsExamApplyOpen(true);
  };

  const handleOpenApplyExamDirect = () => {
    const exam = INITIAL_COMPETITIONS[0] || null;
    if (!currentUser) {
      const pending = { type: 'apply_exam' as const, competition: exam, competitionId: exam?.id };
      setPendingAuthAction(pending);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('fet_pending_auth_action', JSON.stringify(pending));
        } catch {}
      }
      setIsAuthModalOpen(true);
      return;
    }
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
    if (sectionId === 'programs' || sectionId === 'programs_welfare') {
      handleOpenPrograms();
      return;
    }
    if (sectionId === 'appeals' || sectionId === 'crowdfunding' || sectionId === 'crowdfunding_appeals') {
      handleOpenAppeals();
      return;
    }
    if (sectionId === 'membership') {
      handleOpenMembership();
      return;
    }
    if (sectionId === 'volunteers' || sectionId === 'volunteer' || sectionId === 'volunteer_membership') {
      handleOpenVolunteers();
      return;
    }
    if (sectionId === 'events' || sectionId === 'events_news' || sectionId === 'news' || sectionId === 'events_blog' || sectionId === 'news_blogs') {
      handleOpenEventsNews();
      return;
    }
    if (sectionId === 'contact' || sectionId === 'contact_us') {
      handleOpenContact();
      return;
    }
    if (sectionId === 'examination' || sectionId === 'examinations') {
      handleOpenExamination();
      return;
    }
    if (sectionId === 'store' || sectionId === 'fet_store' || sectionId === 'store_catalogue') {
      handleOpenStore();
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

      {/* EXPERIENCE A: PUBLIC WEBSITE & DONATE NOW FULL PAGE */}
      {(currentExperience === 'public' || currentExperience === 'donate') && (
        <div className="min-h-screen bg-white text-slate-900 flex flex-col pb-16 md:pb-0 selection:bg-emerald-100 selection:text-emerald-900" id="fet-india-app">
          {/* Public Header */}
          <Header
            activeSection={currentExperience === 'donate' ? 'donate' : activeSection}
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
            onOpenPrograms={handleOpenPrograms}
            onOpenAppeals={handleOpenAppeals}
            onOpenMembership={handleOpenMembership}
            onOpenVolunteers={handleOpenVolunteers}
            onOpenEventsNews={handleOpenEventsNews}
            onOpenContact={handleOpenContact}
            onOpenExamination={handleOpenExamination}
            onOpenApplyExam={handleOpenApplyExamDirect}
            onOpenChairmanMessage={() => setIsChairmanModalOpen(true)}
            onOpenNewsBlogs={handleOpenEventsNews}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenStudentResults={() => {
              setStudentResultPrefill('');
              setIsStudentResultModalOpen(true);
            }}
            onOpenGeneralDonation={(tab?: any) => handleOpenDonate(tab || 'general')}
            onOpenStore={handleOpenStore}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          {/* Main Public Website Body */}
          <main className="flex-1">
            {currentExperience === 'donate' ? (
              <GeneralDonationView
                initialTab={generalDonationTab}
                isFullPage={true}
                onClose={() => {
                  setCurrentExperience('public');
                  window.history.pushState(null, '', '/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            ) : (
              (() => {
              const defaultOrder = [
                'hero',
                'crowdfunding',
                'featured_cases',
                'education_support',
                'programs',
                'examinations',
                'top_100_results',
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
                            onOpenAuth={() => {
                              const pending = { type: 'create_crowdfunding' as const };
                              setPendingAuthAction(pending);
                              if (typeof window !== 'undefined') {
                                try {
                                  sessionStorage.setItem('fet_pending_auth_action', JSON.stringify(pending));
                                } catch {}
                              }
                              setIsAuthModalOpen(true);
                            }}
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
                      case 'top_100_results':
                        return (
                          <Top100ResultsShowcase
                            key={itemKey}
                            onOpenExamPortal={() => handleScrollToSection('examinations')}
                            onViewCandidateResult={(rollId) => {
                              setStudentResultPrefill(rollId);
                              setIsStudentResultModalOpen(true);
                            }}
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
            })()
          )}
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

      {/* EXPERIENCE E: ABOUT TRUST DEDICATED FULL PAGE EXPERIENCE */}
      {currentExperience === 'about' && (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-0 selection:bg-emerald-100 selection:text-emerald-900" id="fet-india-about-experience">
          {/* Public Header */}
          <Header
            activeSection="about"
            setActiveSection={(sec) => {
              if (sec === 'donate') {
                handleOpenDonate();
              } else if (sec === 'about') {
                handleOpenAbout('overview');
              } else {
                setCurrentExperience('public');
                handleScrollToSection(sec);
              }
            }}
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
            onOpenPrograms={handleOpenPrograms}
            onOpenAppeals={handleOpenAppeals}
            onOpenMembership={handleOpenMembership}
            onOpenVolunteers={handleOpenVolunteers}
            onOpenEventsNews={handleOpenEventsNews}
            onOpenContact={handleOpenContact}
            onOpenExamination={handleOpenExamination}
            onOpenApplyExam={handleOpenApplyExamDirect}
            onOpenChairmanMessage={() => setIsChairmanModalOpen(true)}
            onOpenNewsBlogs={handleOpenEventsNews}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenStudentResults={() => {
              setStudentResultPrefill('');
              setIsStudentResultModalOpen(true);
            }}
            onOpenGeneralDonation={(tab?: any) => handleOpenDonate(tab || 'general')}
            onOpenStore={handleOpenStore}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          {/* Full Page Body */}
          <AboutTrustFullPage
            initialSection={aboutInitialSection}
            onReturnToHome={handleReturnToPublic}
            onOpenDonate={() => handleOpenDonate('general')}
            onOpenVolunteer={handleOpenVolunteers}
            onOpenExamination={handleOpenExamination}
            onOpenContact={handleOpenContact}
          />

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
            activeSection="about"
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

      {/* EXPERIENCE F: PROGRAMS & WELFARE DEDICATED FULL WEBPAGE */}
      {currentExperience === 'programs' && (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-0 selection:bg-emerald-100 selection:text-emerald-900" id="fet-india-programs-experience">
          <Header
            activeSection="programs"
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
            onOpenPrograms={handleOpenPrograms}
            onOpenAppeals={handleOpenAppeals}
            onOpenMembership={handleOpenMembership}
            onOpenVolunteers={handleOpenVolunteers}
            onOpenEventsNews={handleOpenEventsNews}
            onOpenContact={handleOpenContact}
            onOpenExamination={handleOpenExamination}
            onOpenApplyExam={handleOpenApplyExamDirect}
            onOpenChairmanMessage={() => setIsChairmanModalOpen(true)}
            onOpenNewsBlogs={handleOpenEventsNews}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenStudentResults={() => {
              setStudentResultPrefill('');
              setIsStudentResultModalOpen(true);
            }}
            onOpenGeneralDonation={(tab?: any) => handleOpenDonate(tab || 'general')}
            onOpenStore={handleOpenStore}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          <main className="flex-1">
            <ProgramsPage
              onOpenDonate={(tab) => handleOpenDonate(tab || 'general')}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenExamination={handleOpenExamination}
              onOpenContact={handleOpenContact}
              onReturnToHome={handleReturnToPublic}
            />
          </main>

          <Footer
            onOpenSection={handleScrollToSection}
            onOpenAdmin={handleOpenAdmin}
            onOpenVerification={handleOpenVerification}
            onOpenLegal={handleOpenLegal}
            onOpenAbout={handleOpenAbout}
          />

          <MobileBottomNav
            activeSection="programs"
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

      {/* EXPERIENCE G: APPEALS & RELIEF DEDICATED FULL WEBPAGE */}
      {currentExperience === 'appeals' && (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-0 selection:bg-emerald-100 selection:text-emerald-900" id="fet-india-appeals-experience">
          <Header
            activeSection="appeals"
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
            onOpenPrograms={handleOpenPrograms}
            onOpenAppeals={handleOpenAppeals}
            onOpenMembership={handleOpenMembership}
            onOpenVolunteers={handleOpenVolunteers}
            onOpenEventsNews={handleOpenEventsNews}
            onOpenContact={handleOpenContact}
            onOpenExamination={handleOpenExamination}
            onOpenApplyExam={handleOpenApplyExamDirect}
            onOpenChairmanMessage={() => setIsChairmanModalOpen(true)}
            onOpenNewsBlogs={handleOpenEventsNews}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenStudentResults={() => {
              setStudentResultPrefill('');
              setIsStudentResultModalOpen(true);
            }}
            onOpenGeneralDonation={(tab?: any) => handleOpenDonate(tab || 'general')}
            onOpenStore={handleOpenStore}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          <main className="flex-1">
            <AppealsPage
              onSupportCampaign={handleSupportCase}
              onViewCampaignDetails={handleViewCase}
              onOpenDonate={(tab) => handleOpenDonate(tab || 'general')}
              onReturnToHome={handleReturnToPublic}
            />
          </main>

          <Footer
            onOpenSection={handleScrollToSection}
            onOpenAdmin={handleOpenAdmin}
            onOpenVerification={handleOpenVerification}
            onOpenLegal={handleOpenLegal}
            onOpenAbout={handleOpenAbout}
          />

          <MobileBottomNav
            activeSection="appeals"
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

      {/* EXPERIENCE H: MEMBERSHIP DEDICATED FULL WEBPAGE */}
      {currentExperience === 'membership' && (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-0 selection:bg-emerald-100 selection:text-emerald-900" id="fet-india-membership-experience">
          <Header
            activeSection="membership"
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
            onOpenPrograms={handleOpenPrograms}
            onOpenAppeals={handleOpenAppeals}
            onOpenMembership={handleOpenMembership}
            onOpenVolunteers={handleOpenVolunteers}
            onOpenEventsNews={handleOpenEventsNews}
            onOpenContact={handleOpenContact}
            onOpenExamination={handleOpenExamination}
            onOpenApplyExam={handleOpenApplyExamDirect}
            onOpenChairmanMessage={() => setIsChairmanModalOpen(true)}
            onOpenNewsBlogs={handleOpenEventsNews}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenStudentResults={() => {
              setStudentResultPrefill('');
              setIsStudentResultModalOpen(true);
            }}
            onOpenGeneralDonation={(tab?: any) => handleOpenDonate(tab || 'general')}
            onOpenStore={handleOpenStore}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          <main className="flex-1">
            <MembershipPage
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenMemberVerification={handleOpenVerification}
              onOpenUserDashboard={() => handleOpenUserDashboard('membership')}
              onReturnToHome={handleReturnToPublic}
              onOpenDonate={() => handleOpenDonate('general')}
            />
          </main>

          <Footer
            onOpenSection={handleScrollToSection}
            onOpenAdmin={handleOpenAdmin}
            onOpenVerification={handleOpenVerification}
            onOpenLegal={handleOpenLegal}
            onOpenAbout={handleOpenAbout}
          />

          <MobileBottomNav
            activeSection="membership"
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

      {/* EXPERIENCE I: VOLUNTEERS DEDICATED FULL WEBPAGE */}
      {currentExperience === 'volunteers' && (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-0 selection:bg-emerald-100 selection:text-emerald-900" id="fet-india-volunteers-experience">
          <Header
            activeSection="volunteers"
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
            onOpenPrograms={handleOpenPrograms}
            onOpenAppeals={handleOpenAppeals}
            onOpenMembership={handleOpenMembership}
            onOpenVolunteers={handleOpenVolunteers}
            onOpenEventsNews={handleOpenEventsNews}
            onOpenContact={handleOpenContact}
            onOpenExamination={handleOpenExamination}
            onOpenApplyExam={handleOpenApplyExamDirect}
            onOpenChairmanMessage={() => setIsChairmanModalOpen(true)}
            onOpenNewsBlogs={handleOpenEventsNews}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenStudentResults={() => {
              setStudentResultPrefill('');
              setIsStudentResultModalOpen(true);
            }}
            onOpenGeneralDonation={(tab?: any) => handleOpenDonate(tab || 'general')}
            onOpenStore={handleOpenStore}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          <main className="flex-1">
            <VolunteersPage
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenUserDashboard={() => handleOpenUserDashboard('volunteer')}
              onReturnToHome={handleReturnToPublic}
              onOpenDonate={() => handleOpenDonate('general')}
            />
          </main>

          <Footer
            onOpenSection={handleScrollToSection}
            onOpenAdmin={handleOpenAdmin}
            onOpenVerification={handleOpenVerification}
            onOpenLegal={handleOpenLegal}
            onOpenAbout={handleOpenAbout}
          />

          <MobileBottomNav
            activeSection="volunteers"
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

      {/* EXPERIENCE J: EVENTS & NEWS DEDICATED FULL WEBPAGE */}
      {currentExperience === 'events_news' && (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-0 selection:bg-emerald-100 selection:text-emerald-900" id="fet-india-events-news-experience">
          <Header
            activeSection="events_news"
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
            onOpenPrograms={handleOpenPrograms}
            onOpenAppeals={handleOpenAppeals}
            onOpenMembership={handleOpenMembership}
            onOpenVolunteers={handleOpenVolunteers}
            onOpenEventsNews={handleOpenEventsNews}
            onOpenContact={handleOpenContact}
            onOpenExamination={handleOpenExamination}
            onOpenApplyExam={handleOpenApplyExamDirect}
            onOpenChairmanMessage={() => setIsChairmanModalOpen(true)}
            onOpenNewsBlogs={handleOpenEventsNews}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenStudentResults={() => {
              setStudentResultPrefill('');
              setIsStudentResultModalOpen(true);
            }}
            onOpenGeneralDonation={(tab?: any) => handleOpenDonate(tab || 'general')}
            onOpenStore={handleOpenStore}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          <main className="flex-1">
            <EventsNewsPage
              onReadArticle={handleReadArticle}
              onReturnToHome={handleReturnToPublic}
              onOpenDonate={() => handleOpenDonate('general')}
            />
          </main>

          <Footer
            onOpenSection={handleScrollToSection}
            onOpenAdmin={handleOpenAdmin}
            onOpenVerification={handleOpenVerification}
            onOpenLegal={handleOpenLegal}
            onOpenAbout={handleOpenAbout}
          />

          <MobileBottomNav
            activeSection="events_news"
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

      {/* EXPERIENCE K: CONTACT US DEDICATED FULL WEBPAGE */}
      {currentExperience === 'contact' && (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-0 selection:bg-emerald-100 selection:text-emerald-900" id="fet-india-contact-experience">
          <Header
            activeSection="contact"
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
            onOpenPrograms={handleOpenPrograms}
            onOpenAppeals={handleOpenAppeals}
            onOpenMembership={handleOpenMembership}
            onOpenVolunteers={handleOpenVolunteers}
            onOpenEventsNews={handleOpenEventsNews}
            onOpenContact={handleOpenContact}
            onOpenExamination={handleOpenExamination}
            onOpenApplyExam={handleOpenApplyExamDirect}
            onOpenChairmanMessage={() => setIsChairmanModalOpen(true)}
            onOpenNewsBlogs={handleOpenEventsNews}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenStudentResults={() => {
              setStudentResultPrefill('');
              setIsStudentResultModalOpen(true);
            }}
            onOpenGeneralDonation={(tab?: any) => handleOpenDonate(tab || 'general')}
            onOpenStore={handleOpenStore}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          <main className="flex-1">
            <ContactUsPage
              onReturnToHome={handleReturnToPublic}
              onOpenDonate={() => handleOpenDonate('general')}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          </main>

          <Footer
            onOpenSection={handleScrollToSection}
            onOpenAdmin={handleOpenAdmin}
            onOpenVerification={handleOpenVerification}
            onOpenLegal={handleOpenLegal}
            onOpenAbout={handleOpenAbout}
          />

          <MobileBottomNav
            activeSection="contact"
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

      {/* EXPERIENCE L: EXAMINATION DEDICATED FULL WEBPAGE */}
      {currentExperience === 'examination' && (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-0 selection:bg-emerald-100 selection:text-emerald-900" id="fet-india-examination-experience">
          <Header
            activeSection="examinations"
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
            onOpenPrograms={handleOpenPrograms}
            onOpenAppeals={handleOpenAppeals}
            onOpenMembership={handleOpenMembership}
            onOpenVolunteers={handleOpenVolunteers}
            onOpenEventsNews={handleOpenEventsNews}
            onOpenContact={handleOpenContact}
            onOpenExamination={handleOpenExamination}
            onOpenApplyExam={handleOpenApplyExamDirect}
            onOpenChairmanMessage={() => setIsChairmanModalOpen(true)}
            onOpenNewsBlogs={handleOpenEventsNews}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenStudentResults={() => {
              setStudentResultPrefill('');
              setIsStudentResultModalOpen(true);
            }}
            onOpenGeneralDonation={(tab?: any) => handleOpenDonate(tab || 'general')}
            onOpenStore={handleOpenStore}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          <main className="flex-1">
            <ExaminationPage
              currentUser={currentUser}
              targetCompetitionId={examinationTargetId}
              onApplyExam={handleApplyExam}
              onViewExamInfo={handleViewExamInfo}
              onOpenStudentResults={() => {
                setStudentResultPrefill('');
                setIsStudentResultModalOpen(true);
              }}
              onOpenVerification={handleOpenVerification}
              onReturnToHome={handleReturnToPublic}
              onOpenDonate={() => handleOpenDonate('general')}
            />
          </main>

          <Footer
            onOpenSection={handleScrollToSection}
            onOpenAdmin={handleOpenAdmin}
            onOpenVerification={handleOpenVerification}
            onOpenLegal={handleOpenLegal}
            onOpenAbout={handleOpenAbout}
          />

          <MobileBottomNav
            activeSection="examinations"
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

      {/* EXPERIENCE STORE: FET STORE CATALOGUE & FOUNDATION */}
      {currentExperience === 'store' && (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-0 selection:bg-emerald-100 selection:text-emerald-900" id="fet-india-store-experience">
          <Header
            activeSection="store"
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
            onOpenPrograms={handleOpenPrograms}
            onOpenAppeals={handleOpenAppeals}
            onOpenMembership={handleOpenMembership}
            onOpenVolunteers={handleOpenVolunteers}
            onOpenEventsNews={handleOpenEventsNews}
            onOpenContact={handleOpenContact}
            onOpenExamination={handleOpenExamination}
            onOpenApplyExam={handleOpenApplyExamDirect}
            onOpenChairmanMessage={() => setIsChairmanModalOpen(true)}
            onOpenNewsBlogs={handleOpenEventsNews}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenStudentResults={() => {
              setStudentResultPrefill('');
              setIsStudentResultModalOpen(true);
            }}
            onOpenGeneralDonation={(tab?: any) => handleOpenDonate(tab || 'general')}
            onOpenStore={handleOpenStore}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          <main className="flex-1">
            {!isModuleEnabled('store') ? (
              <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900">FET India Store Paused</h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  The official store and ethical merchandise module is currently disabled by Super Admin configuration. Orders and checkouts are temporarily paused.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleReturnToPublic}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-sm transition"
                  >
                    Return to Homepage
                  </button>
                </div>
              </div>
            ) : (
              <FETStorePage
                initialProductSlug={storeTargetProductSlug || undefined}
                onReturnToHome={handleReturnToPublic}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onOpenDonate={() => handleOpenDonate('general')}
                onOpenContact={handleOpenContact}
                onOpenAdminConsole={() => handleOpenAdmin('store')}
              />
            )}
          </main>

          <Footer
            onOpenSection={handleScrollToSection}
            onOpenAdmin={handleOpenAdmin}
            onOpenVerification={handleOpenVerification}
            onOpenLegal={handleOpenLegal}
            onOpenAbout={handleOpenAbout}
          />

          <MobileBottomNav
            activeSection="store"
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
            if (selectedExamForApply) {
              const pending = { type: 'apply_exam' as const, competition: selectedExamForApply, competitionId: selectedExamForApply.id };
              setPendingAuthAction(pending);
              if (typeof window !== 'undefined') {
                try {
                  sessionStorage.setItem('fet_pending_auth_action', JSON.stringify(pending));
                } catch {}
              }
            }
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

      {/* Global Public Search Modal (Cmd+K / Ctrl+K / Header Search) */}
      <PublicSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigate={handleSearchNavigate}
      />

      {/* Student Result Portal Modal */}
      <StudentResultPortalModal
        isOpen={isStudentResultModalOpen}
        onClose={() => {
          setIsStudentResultModalOpen(false);
          setStudentResultPrefill('');
        }}
        prefillRollNumber={studentResultPrefill}
      />

      {/* Official FET Store Cart Slide-Out Drawer */}
      <StoreCartDrawer
        onOpenStore={() => {
          setCurrentExperience('store');
          window.history.pushState(null, '', '/store');
        }}
        onOpenContact={handleOpenContact}
        onOpenDonate={() => handleOpenDonate('general')}
        onProceedToCheckout={() => setIsCheckoutModalOpen(true)}
      />

      {/* Official FET Store Checkout Preparation Modal (Store Task 14) */}
      <StoreCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onViewOrderHistory={() => handleOpenUserDashboard('orders')}
        onOpenAuth={() => {
          setPendingAuthAction({ type: 'store_checkout' });
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('fet_pending_auth_action', JSON.stringify({ type: 'store_checkout' }));
            } catch {}
          }
          setIsAuthModalOpen(true);
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
            <ModuleControlsProvider>
              <NotificationProvider>
                <CartProvider>
                  <FETIndiaPlatform />
                </CartProvider>
              </NotificationProvider>
            </ModuleControlsProvider>
          </ModuleProvider>
        </ConfigProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
