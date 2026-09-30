/**
 * @license
 * Dynamic Branding & Super Admin CMS Live Control Hub
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides sovereign Super Admin control over:
 * 1. Brand Identity, 3 Primary Brand Colors & Impact Census Metrics
 * 2. Top Announcement Bar & Legal Transparency Toggles
 * 3. Dynamic Navigation Menus & Sub-Menu Tree
 * 4. Homepage Section Ordering & Visibility
 * 5. Hero Visual Slider (Media, Video/Image, Draft/Published states, In-Tab Preview)
 * 6. Featured Crowdfunding Appeals Curation & Priority Ordering
 * 7. Initiatives, Events & Dynamic Volunteer CTA Banner
 * 8. Institutional Footer & Secretariat Contact Details
 * 9. Real-time Multi-Device Homepage Live Preview Simulator
 */

import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Lock, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sliders, 
  Image as ImageIcon, 
  Globe, 
  AlertCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  Layout,
  Menu,
  ChevronDown,
  ChevronRight,
  Shield,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ExternalLink,
  Layers,
  HeartHandshake,
  Upload,
  RefreshCw,
  SlidersHorizontal,
  Info,
  Maximize2,
  Video,
  Monitor,
  GraduationCap,
  Building,
  Users,
  Award,
  Star,
  DollarSign,
  Search,
  Check,
  UserCheck,
  Radio,
  UploadCloud,
  Loader2,
  FileVideo,
  Building2
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { HeroSlide, NavigationMenuItem, NavigationSubItem, CrowdfundingCampaign, UserRole } from '../../types';
import { DEFAULT_NAV_MENU } from '../../data/initialData';
import { FETLogo } from '../common/FETLogo';
import { fetchPublicCampaigns } from '../../lib/firebase';
import { uploadCampaignMedia } from '../../lib/storage';
import { HomepageLivePreview } from './HomepageLivePreview';
import { AdminAboutTrustCMSView } from './AdminAboutTrustCMSView';

type CMSTab = 
  | 'branding' 
  | 'about_trust'
  | 'announcements' 
  | 'navigation' 
  | 'sections' 
  | 'hero' 
  | 'crowdfunding' 
  | 'programs_events' 
  | 'footer' 
  | 'live_preview';

export const AdminCMSView: React.FC = () => {
  const { config, updateConfig, resetToDefaults } = useConfig();
  const { currentUser, activeRole, isSuperAdmin, canPublishTrustContent } = useAuth();

  const [activeTab, setActiveTab] = useState<CMSTab>('branding');
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewDarkLogo, setPreviewDarkLogo] = useState(false);

  // Available campaigns for crowdfunding curation
  const [availableCampaigns, setAvailableCampaigns] = useState<CrowdfundingCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(false);
  const [campaignFilter, setCampaignFilter] = useState<string>('');

  // Hero Preview inside tab
  const [activeSlidePreviewIdx, setActiveSlidePreviewIdx] = useState<number>(0);
  const [uploadingSlideIdx, setUploadingSlideIdx] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const defaultSections = [
    { id: 'hero', name: 'Hero Visual Slider & Trust Seal', desc: 'Main headline, dynamic media slides, and primary CTAs' },
    { id: 'crowdfunding', name: 'Featured Crowdfunding Appeals', desc: 'Verified and board-approved public appeals immediately below hero' },
    { id: 'education_support', name: 'Support Education & Deserving Scholars', desc: 'Educational assistance mission for vulnerable and promising students' },
    { id: 'programs', name: 'Key Initiatives & Programs', desc: 'Higher education scholarships, STEM labs, and welfare missions' },
    { id: 'events_blog', name: 'Upcoming Events & Educational Programs', desc: 'Convocations, talent tests, institutional updates, and announcements' },
    { id: 'statistics', name: 'Impact Statistics & Census', desc: 'Students funded, volunteers, institutions, and statutory impact' },
    { id: 'mission_cta', name: 'Final Call to Action & Secretariat', desc: 'Support, volunteer, membership, and central contact info' },
    { id: 'volunteer_membership', name: 'Volunteer & Membership CTA', desc: 'Dual pathway for grassroots participation and membership' },
    { id: 'education', name: 'Education & Talent Examination', desc: 'FET Talent Search, Madrasa modernization' },
    { id: 'future_services', name: 'Special Services (Store & Travel)', desc: 'E-Commerce store and Haj/Ziyarat travel modules' }
  ];

  const cleanSectionOrder = (raw?: string[]) => {
    const list = raw && raw.length > 0 ? raw : defaultSections.map(s => s.id);
    const result: string[] = [];
    const seen = new Set<string>();
    list.forEach(item => {
      let canonical = item;
      if (item === 'store' || item === 'travel') canonical = 'future_services';
      if (item === 'governance') canonical = 'mission_cta';
      if (!seen.has(canonical)) {
        seen.add(canonical);
        result.push(canonical);
      }
    });
    defaultSections.forEach(def => {
      if (!seen.has(def.id)) {
        seen.add(def.id);
        result.push(def.id);
      }
    });
    return result;
  };

  // Main Form State
  const [formData, setFormData] = useState({
    displayName: config.displayName || 'FATIMYAH EDUCATIONAL TRUST India',
    shortBrand: config.shortBrand || 'FET India',
    tagline: config.tagline || 'Education • Service • Empowerment',
    websiteUrl: config.websiteUrl || 'FETIndia.com',
    contactEmail: config.contactEmail || 'contact@fetindia.com',
    contactPhone: config.contactPhone || '+91 91494 14549',
    emergencyHotline: config.emergencyHotline || '+91 91494 14549',
    headOfficeAddress: config.headOfficeAddress || 'FET House, Seminary Road, Jammu & Kashmir 194103, India',
    registrationNumber: config.registrationNumber || 'E 9822',
    registrationJurisdiction: config.registrationJurisdiction || 'Jammu & Kashmir',
    registrationAuthority: config.registrationAuthority || 'Sub-Divisional Magistrate (SDM) Office, Jammu & Kashmir',
    registrationAct: config.registrationAct || '',
    legalStatusDescription: config.legalStatusDescription || 'Registered in Jammu & Kashmir',
    darpanId: config.darpanId || config.nitiAayogId || 'JK/2026/1153821',
    panNumber: config.panNumber || 'AABTF0015H',
    
    // Census & Impact Metrics (Super Admin Configurable)
    establishedYear: config.establishedYear || 1994,
    totalInstitutions: config.totalInstitutions || 14,
    totalStudentsBenefited: config.totalStudentsBenefited || 42500,
    activeVolunteersCount: config.activeVolunteersCount || 1850,
    activeDonorsCount: config.activeDonorsCount || 3200,

    // 3 Primary Logo Colors
    primaryGreen: config.primaryGreen || '#0D6E42',
    primaryBlue: config.primaryBlue || '#0B2545',
    accentAmber: config.accentAmber || '#D97706',

    // Logo & Visual Assets
    logoUrl: config.logoUrl || '',

    // Announcement Ticker
    announcementBarText: config.announcementBarText || '',
    announcementBarLink: config.announcementBarLink || '#programs',
    announcementBarBadge: config.announcementBarBadge || 'Admissions Open 2026-27',
    isAnnouncementBarActive: config.isAnnouncementBarActive ?? true,

    // Header Settings
    headerSettings: {
      showLegalName: config.headerSettings?.showLegalName ?? true,
      showRegNumber: config.headerSettings?.showRegNumber ?? true,
      showPhone: config.headerSettings?.showPhone ?? true,
      showEmail: config.headerSettings?.showEmail ?? true,
      showTaxExemptionTag: config.headerSettings?.showTaxExemptionTag ?? true,
      showNitiAayogTag: config.headerSettings?.showNitiAayogTag ?? true,
      showTagline: config.headerSettings?.showTagline ?? true
    },

    // Volunteer CTA Customization
    volunteerCta: {
      heading: config.volunteerCta?.heading || 'Be the Change: Volunteer or Become an Official Trust Member',
      description: config.volunteerCta?.description || 'Whether dedicating your professional expertise on the ground or joining the verified membership rolls of Fatimyah Educational Trust, your involvement empowers thousands.',
      buttonText: config.volunteerCta?.buttonText || 'Join the Movement',
      destination: config.volunteerCta?.destination || '#volunteer',
      isVisible: config.volunteerCta?.isVisible ?? true
    },

    // Governance & Trustees Settings
    governanceSettings: {
      showTrusteesList: config.governanceSettings?.showTrusteesList ?? true,
      showAuditComplianceBadge: config.governanceSettings?.showAuditComplianceBadge ?? true,
      publicMessage: config.governanceSettings?.publicMessage || 'Governed by a dedicated Board of Trustees adhering to statutory transparency, audited accounts, and community empowerment since 1994.'
    },

    // Footer Settings
    footerSettings: {
      aboutSummary: config.footerSettings?.aboutSummary || 'Fatimyah Educational Trust is a registered public charitable and educational trust established in 1994, dedicated to educational empowerment, grassroots welfare, and transparent community stewardship.',
      copyrightText: config.footerSettings?.copyrightText || 'Fatimyah Educational Trust. All rights reserved.',
      showLegalShield: config.footerSettings?.showLegalShield ?? true,
      showSocialLinks: config.footerSettings?.showSocialLinks ?? true,
      showChapterRoadmap: config.footerSettings?.showChapterRoadmap ?? true,
      showGovernanceLinks: config.footerSettings?.showGovernanceLinks ?? true
    },

    // Social Links
    socialLinks: {
      whatsapp: config.socialLinks?.whatsapp || 'https://chat.whatsapp.com/FETIndia',
      whatsappCommunity: config.socialLinks?.whatsappCommunity || 'https://chat.whatsapp.com/FETIndia',
      youtube: config.socialLinks?.youtube || 'https://youtube.com/@FETIndia',
      facebook: config.socialLinks?.facebook || 'https://facebook.com/FETIndia',
      instagram: config.socialLinks?.instagram || 'https://instagram.com/FETIndia',
      telegram: config.socialLinks?.telegram || 'https://t.me/FETIndia',
      twitter: config.socialLinks?.twitter || '',
      linkedin: config.socialLinks?.linkedin || ''
    }
  });

  // Navigation Menu State
  const [navMenu, setNavMenu] = useState<NavigationMenuItem[]>(
    (config.navigationMenu && config.navigationMenu.length > 0)
      ? config.navigationMenu
      : DEFAULT_NAV_MENU
  );

  // Hero Slides State
  const [slides, setSlides] = useState<HeroSlide[]>(config.heroSliders || []);

  // Homepage Sections State
  const [sectionOrder, setSectionOrder] = useState<string[]>(cleanSectionOrder(config.homepageSectionsOrdering));
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>(
    config.homepageSectionsVisibility || defaultSections.reduce((acc, s) => ({ ...acc, [s.id]: true }), {})
  );

  // Featured Campaigns State
  const [featuredCampaignIds, setFeaturedCampaignIds] = useState<string[]>(config.featuredCampaignIds || []);

  // Synchronize with live config updates
  useEffect(() => {
    if (config) {
      setFormData({
        displayName: config.displayName || 'Fatimyah Educational Trust India',
        shortBrand: config.shortBrand || 'FET India',
        tagline: config.tagline || 'Education • Service • Empowerment',
        websiteUrl: config.websiteUrl || 'FETIndia.com',
        contactEmail: config.contactEmail || 'contact@fetindia.com',
        contactPhone: config.contactPhone || '+91 91494 14549',
        emergencyHotline: config.emergencyHotline || '+91 91494 14549',
        headOfficeAddress: config.headOfficeAddress || 'FET House, Seminary Road, Jammu & Kashmir 194103, India',
        registrationNumber: config.registrationNumber || 'E 9822',
        registrationJurisdiction: config.registrationJurisdiction || 'Jammu & Kashmir',
        registrationAuthority: config.registrationAuthority || 'Sub-Divisional Magistrate (SDM) Office, Jammu & Kashmir',
        registrationAct: config.registrationAct || '',
        legalStatusDescription: config.legalStatusDescription || 'Registered in Jammu & Kashmir',
        darpanId: config.darpanId || config.nitiAayogId || 'JK/2026/1153821',
        panNumber: config.panNumber || 'AABTF0015H',
        establishedYear: config.establishedYear || 1994,
        totalInstitutions: config.totalInstitutions || 14,
        totalStudentsBenefited: config.totalStudentsBenefited || 42500,
        activeVolunteersCount: config.activeVolunteersCount || 1850,
        activeDonorsCount: config.activeDonorsCount || 3200,
        primaryGreen: config.primaryGreen || '#0D6E42',
        primaryBlue: config.primaryBlue || '#0B2545',
        accentAmber: config.accentAmber || '#D97706',
        logoUrl: config.logoUrl || '',
        announcementBarText: config.announcementBarText || '',
        announcementBarLink: config.announcementBarLink || '#programs',
        announcementBarBadge: config.announcementBarBadge || 'Admissions Open 2026-27',
        isAnnouncementBarActive: config.isAnnouncementBarActive ?? true,
        headerSettings: {
          showLegalName: config.headerSettings?.showLegalName ?? true,
          showRegNumber: config.headerSettings?.showRegNumber ?? true,
          showPhone: config.headerSettings?.showPhone ?? true,
          showEmail: config.headerSettings?.showEmail ?? true,
          showTaxExemptionTag: config.headerSettings?.showTaxExemptionTag ?? true,
          showNitiAayogTag: config.headerSettings?.showNitiAayogTag ?? true,
          showTagline: config.headerSettings?.showTagline ?? true
        },
        volunteerCta: {
          heading: config.volunteerCta?.heading || 'Be the Change: Volunteer or Become an Official Trust Member',
          description: config.volunteerCta?.description || 'Whether dedicating your professional expertise on the ground or joining the verified membership rolls of FATIMYAH EDUCATIONAL TRUST, your involvement empowers thousands.',
          buttonText: config.volunteerCta?.buttonText || 'Join the Movement',
          destination: config.volunteerCta?.destination || '#volunteer',
          isVisible: config.volunteerCta?.isVisible ?? true
        },
        governanceSettings: {
          showTrusteesList: config.governanceSettings?.showTrusteesList ?? true,
          showAuditComplianceBadge: config.governanceSettings?.showAuditComplianceBadge ?? true,
          publicMessage: config.governanceSettings?.publicMessage || 'Governed by a dedicated Board of Trustees adhering to statutory transparency, audited accounts, and community empowerment since 1994.'
        },
        footerSettings: {
          aboutSummary: config.footerSettings?.aboutSummary || 'FATIMYAH EDUCATIONAL TRUST is a registered public charitable and educational trust established in 1994, registered in Jammu & Kashmir through the Sub-Divisional Magistrate (SDM) Office, dedicated to educational empowerment, grassroots welfare, and transparent community stewardship.',
          copyrightText: config.footerSettings?.copyrightText || 'FATIMYAH EDUCATIONAL TRUST. All rights reserved.',
          showLegalShield: config.footerSettings?.showLegalShield ?? true,
          showSocialLinks: config.footerSettings?.showSocialLinks ?? true,
          showChapterRoadmap: config.footerSettings?.showChapterRoadmap ?? true,
          showGovernanceLinks: config.footerSettings?.showGovernanceLinks ?? true
        },
        socialLinks: {
          whatsapp: config.socialLinks?.whatsapp || 'https://chat.whatsapp.com/FETIndia',
          whatsappCommunity: config.socialLinks?.whatsappCommunity || 'https://chat.whatsapp.com/FETIndia',
          youtube: config.socialLinks?.youtube || 'https://youtube.com/@FETIndia',
          facebook: config.socialLinks?.facebook || 'https://facebook.com/FETIndia',
          instagram: config.socialLinks?.instagram || 'https://instagram.com/FETIndia',
          telegram: config.socialLinks?.telegram || 'https://t.me/FETIndia',
          twitter: config.socialLinks?.twitter || '',
          linkedin: config.socialLinks?.linkedin || ''
        }
      });
      if (config.navigationMenu && config.navigationMenu.length > 0) {
        setNavMenu(config.navigationMenu);
      }
      if (config.heroSliders) {
        setSlides(config.heroSliders);
      }
      if (config.homepageSectionsOrdering) {
        setSectionOrder(cleanSectionOrder(config.homepageSectionsOrdering));
      }
      if (config.homepageSectionsVisibility) {
        setSectionVisibility(config.homepageSectionsVisibility);
      }
      if (config.featuredCampaignIds) {
        setFeaturedCampaignIds(config.featuredCampaignIds);
      }
    }
  }, [config]);

  // Load active campaigns for featured curation tab
  useEffect(() => {
    async function loadCampaigns() {
      setLoadingCampaigns(true);
      try {
        const list = await fetchPublicCampaigns();
        setAvailableCampaigns(list);
      } catch (err) {
        console.warn('Notice loading campaigns for CMS curation:', err);
      } finally {
        setLoadingCampaigns(false);
      }
    }
    loadCampaigns();
  }, []);

  // Section movement & visibility
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setSectionOrder(newOrder);
  };

  const toggleSectionVisibility = (id: string) => {
    setSectionVisibility(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false
    }));
  };

  // Slide CRUD Handlers
  const addSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      title: 'Empowering Communities Through Quality Education',
      subtitle: 'Higher education scholarships, modern institutions, and transparent welfare initiatives.',
      ctaText: 'Explore Educational Programs',
      ctaLink: '#programs',
      secondaryCtaText: 'Make an 80G Contribution',
      secondaryCtaLink: '#donate',
      badgeText: 'Fatimyah Educational Trust',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
      isActive: true,
      status: 'published',
      mediaType: 'image',
      showTextOverlay: true
    };
    setSlides([...slides, newSlide]);
  };

  const updateSlide = (index: number, field: keyof HeroSlide, value: any) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], [field]: value };
    setSlides(updated);
  };

  const removeSlide = (index: number) => {
    setSlides(slides.filter((_, i) => i !== index));
    if (activeSlidePreviewIdx >= slides.length - 1) {
      setActiveSlidePreviewIdx(Math.max(0, slides.length - 2));
    }
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= slides.length) return;
    const newSlides = [...slides];
    const [moved] = newSlides.splice(index, 1);
    newSlides.splice(target, 0, moved);
    setSlides(newSlides);
    setActiveSlidePreviewIdx(target);
  };

  // Featured Campaigns Handlers
  const toggleFeatureCampaign = (campaignId: string) => {
    setFeaturedCampaignIds(prev => {
      if (prev.includes(campaignId)) {
        return prev.filter(id => id !== campaignId);
      } else {
        return [...prev, campaignId];
      }
    });
  };

  const moveFeaturedCampaign = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= featuredCampaignIds.length) return;
    const next = [...featuredCampaignIds];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setFeaturedCampaignIds(next);
  };

  // Navigation Menu Handlers
  const addMenuItem = () => {
    const newItem: NavigationMenuItem = {
      id: `menu-${Date.now()}`,
      label: 'New Section',
      target: '#section',
      isEnabled: true,
      order: navMenu.length + 1,
      subItems: []
    };
    setNavMenu([...navMenu, newItem]);
  };

  const updateMenuItem = (index: number, field: keyof NavigationMenuItem, value: any) => {
    const updated = [...navMenu];
    updated[index] = { ...updated[index], [field]: value };
    setNavMenu(updated);
  };

  const removeMenuItem = (index: number) => {
    setNavMenu(navMenu.filter((_, i) => i !== index));
  };

  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= navMenu.length) return;
    const newMenu = [...navMenu];
    const [moved] = newMenu.splice(index, 1);
    newMenu.splice(target, 0, moved);
    setNavMenu(newMenu);
  };

  const addSubItem = (menuIndex: number) => {
    const updated = [...navMenu];
    const subItems = updated[menuIndex].subItems || [];
    subItems.push({
      id: `sub-${Date.now()}`,
      label: 'Sub Item',
      target: '#sub',
      isEnabled: true
    });
    updated[menuIndex].subItems = subItems;
    setNavMenu(updated);
  };

  const updateSubItem = (menuIndex: number, subIndex: number, field: keyof NavigationSubItem, value: any) => {
    const updated = [...navMenu];
    if (updated[menuIndex].subItems) {
      updated[menuIndex].subItems![subIndex] = {
        ...updated[menuIndex].subItems![subIndex],
        [field]: value
      };
      setNavMenu(updated);
    }
  };

  const removeSubItem = (menuIndex: number, subIndex: number) => {
    const updated = [...navMenu];
    if (updated[menuIndex].subItems) {
      updated[menuIndex].subItems = updated[menuIndex].subItems!.filter((_, i) => i !== subIndex);
      setNavMenu(updated);
    }
  };

  // Robust Image & Media Upload Handler using Storage Service
  const handleImageUpload = async (file: File, callback: (url: string) => void) => {
    if (!file) return;
    try {
      setSaveStatus(null);
      const res = await uploadCampaignMedia(file, 'covers', (pct) => {
        setUploadProgress(pct);
      });
      callback(res.url);
      setSaveStatus({ type: 'success', message: `Media "${file.name}" processed and attached successfully.` });
    } catch (err: any) {
      console.error('Media upload error:', err);
      // Resilient fallback to fast data URL
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            callback(e.target.result as string);
            setSaveStatus({ type: 'success', message: 'Media attached successfully (buffered).' });
          }
        };
        reader.readAsDataURL(file);
      } catch (fallbackErr) {
        setSaveStatus({ type: 'error', message: err?.message || 'Failed to upload media. Please try another image.' });
      }
    }
  };

  // Dedicated Slide Media Upload Handler (Images & Videos)
  const handleSlideMediaUpload = async (slideIdx: number, file: File) => {
    if (!file) return;
    setUploadingSlideIdx(slideIdx);
    setUploadProgress(10);
    setSaveStatus(null);

    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);

    try {
      const res = await uploadCampaignMedia(file, 'covers', (pct) => {
        setUploadProgress(pct);
      });

      if (isVideo) {
        updateSlide(slideIdx, 'mediaType', 'video');
        updateSlide(slideIdx, 'videoUrl', res.url);
      } else {
        updateSlide(slideIdx, 'mediaType', 'image');
        updateSlide(slideIdx, 'imageUrl', res.url);
      }

      setSaveStatus({
        type: 'success',
        message: `Slide #${slideIdx + 1} background ${isVideo ? 'video' : 'photo'} uploaded successfully.`
      });
    } catch (err: any) {
      console.warn('Slide upload notice, applying resilient stream buffer:', err);
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const dataUrl = e.target.result as string;
            if (isVideo) {
              updateSlide(slideIdx, 'mediaType', 'video');
              updateSlide(slideIdx, 'videoUrl', dataUrl);
            } else {
              updateSlide(slideIdx, 'mediaType', 'image');
              updateSlide(slideIdx, 'imageUrl', dataUrl);
            }
            setSaveStatus({
              type: 'success',
              message: `Slide #${slideIdx + 1} background attached.`
            });
          }
        };
        reader.readAsDataURL(file);
      } catch (fallbackErr) {
        setSaveStatus({
          type: 'error',
          message: 'Failed to upload media file. Please check file format.'
        });
      }
    } finally {
      setUploadingSlideIdx(null);
      setUploadProgress(0);
    }
  };

  // Save All Changes to Firestore
  const handleSave = async () => {
    if (!isSuperAdmin && !canPublishTrustContent) {
      setSaveStatus({
        type: 'error',
        message: 'Permission Denied: Super Administrator or authorized CMS clearance required.'
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const adminUser = {
        uid: currentUser?.uid || 'super_admin',
        email: currentUser?.email || 'admin@fetindia.org',
        role: (activeRole || 'super_admin') as UserRole
      };

      await updateConfig({
        legalName: 'FATIMYAH EDUCATIONAL TRUST',
        trustName: 'FATIMYAH EDUCATIONAL TRUST',
        registrationNumber: (formData.registrationNumber || 'E 9822').trim(),
        registrationJurisdiction: (formData.registrationJurisdiction || 'Jammu & Kashmir').trim(),
        registrationAuthority: (formData.registrationAuthority || 'Sub-Divisional Magistrate (SDM) Office, Jammu & Kashmir').trim(),
        registrationAct: (formData.registrationAct || '').trim(),
        legalStatusDescription: (formData.legalStatusDescription || 'Registered in Jammu & Kashmir').trim(),
        darpanId: (formData.darpanId || 'JK/2026/1153821').trim(),
        nitiAayogId: (formData.darpanId || 'JK/2026/1153821').trim(),
        panNumber: (formData.panNumber || 'AABTF0015H').trim(),
        displayName: formData.displayName.trim(),
        shortBrand: formData.shortBrand.trim(),
        tagline: formData.tagline.trim(),
        websiteUrl: formData.websiteUrl.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim(),
        emergencyHotline: formData.emergencyHotline.trim(),
        headOfficeAddress: formData.headOfficeAddress.trim(),
        establishedYear: Number(formData.establishedYear) || 1994,
        totalInstitutions: Number(formData.totalInstitutions) || 14,
        totalStudentsBenefited: Number(formData.totalStudentsBenefited) || 42500,
        activeVolunteersCount: Number(formData.activeVolunteersCount) || 1850,
        activeDonorsCount: Number(formData.activeDonorsCount) || 3200,
        primaryGreen: formData.primaryGreen,
        primaryBlue: formData.primaryBlue,
        accentAmber: formData.accentAmber,
        logoUrl: formData.logoUrl,
        announcementBarText: formData.announcementBarText,
        announcementBarLink: formData.announcementBarLink,
        announcementBarBadge: formData.announcementBarBadge,
        isAnnouncementBarActive: formData.isAnnouncementBarActive,
        headerSettings: formData.headerSettings,
        volunteerCta: formData.volunteerCta,
        governanceSettings: formData.governanceSettings,
        footerSettings: formData.footerSettings,
        socialLinks: formData.socialLinks,
        navigationMenu: navMenu,
        heroSliders: slides,
        homepageSectionsOrdering: sectionOrder,
        homepageSectionsVisibility: sectionVisibility,
        featuredCampaignIds: featuredCampaignIds
      }, adminUser);

      setSaveStatus({
        type: 'success',
        message: 'Homepage CMS Configuration & Live Settings successfully published to Firestore.'
      });
    } catch (err: any) {
      console.error('Error saving CMS configuration:', err);
      setSaveStatus({
        type: 'error',
        message: `Failed to save changes: ${err.message || 'Unknown network or Firestore error'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-20" id="super-admin-homepage-cms-hub">
      
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Homepage Content CMS & Super Admin Live Control
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Configure dynamic homepage sections, hero slides, featured crowdfunding appeals, impact census, and brand identity without code modifications.
          </p>
        </div>

        {/* Global Save & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'live_preview' ? 'branding' : 'live_preview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'live_preview'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>{activeTab === 'live_preview' ? 'Exit Simulator' : 'Live Preview'}</span>
          </button>

          <button
            type="button"
            onClick={() => resetToDefaults({
              uid: currentUser?.uid || 'super_admin',
              email: currentUser?.email || 'admin@fetindia.org',
              role: (activeRole || 'super_admin') as UserRole
            })}
            disabled={isSaving}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reset form fields to statutory baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isSuperAdmin}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-900/40 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/30"
            id="cms-save-btn"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Publishing to Firestore...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-amber-300" />
                <span>Publish Changes to Live Site</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Toast Alert */}
      {saveStatus && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all shadow-sm ${
          saveStatus.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200" id="cms-control-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4 text-emerald-400" />
          <span>1. Brand & Impact Census</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('about_trust')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'about_trust'
              ? 'bg-emerald-800 text-white shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>About Trust & Leadership</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>2. Announcements & Header</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('navigation')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'navigation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Menu className="w-4 h-4 text-blue-400" />
          <span>3. Nav Tree & Links</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layout className="w-4 h-4 text-emerald-400" />
          <span>4. Section Priority & Visibility</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'hero'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span>5. Hero Visual Slider ({slides.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('crowdfunding')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'crowdfunding'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-rose-400" />
          <span>6. Featured Crowdfunding ({featuredCampaignIds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('programs_events')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'programs_events'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span>7. Initiatives & Volunteer CTA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'footer'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span>8. Footer & Secretariat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('live_preview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'live_preview'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-4 h-4 text-emerald-600" />
          <span>9. Live Simulator</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 0: About Trust & Leadership CMS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'about_trust' && (
        <div className="animate-in fade-in">
          <AdminAboutTrustCMSView />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: Brand Identity & Colors & Impact Census Metrics */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'branding' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Protected Legal Identity */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Protected Statutory Trust Entity</h3>
                <p className="text-xs text-slate-500">Registered in Jammu & Kashmir • Statutory Legal Entity</p>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Immutable Legal Protection
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Legal Trust Name <span className="text-[10px] text-rose-600 font-bold">(Locked)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={config.legalName}
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Permanent trust registration title for legal tax compliance, 80G receipts, and government reporting.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Public Platform Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Appears in header, browser title, and public receipt banners.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Brand Label
                </label>
                <input
                  type="text"
                  value={formData.shortBrand}
                  onChange={(e) => setFormData({ ...formData, shortBrand: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Organization Motto / Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Statutory Identifiers (Super Admin Configurable) */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3">
                Official Trust Registration & Identifiers
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="E 9822"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Verified registration number (E 9822) issued by SDM Office.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registration Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={formData.registrationJurisdiction}
                    onChange={(e) => setFormData({ ...formData, registrationJurisdiction: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="Jammu & Kashmir"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registration Authority
                  </label>
                  <input
                    type="text"
                    value={formData.registrationAuthority}
                    onChange={(e) => setFormData({ ...formData, registrationAuthority: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="Sub-Divisional Magistrate (SDM) Office, Jammu & Kashmir"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Applicable Registration Act <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.registrationAct}
                    onChange={(e) => setFormData({ ...formData, registrationAct: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="Leave blank unless verified from Trust deed"
                  />
                  <p className="text-[10px] text-amber-700 mt-1">
                    Do not guess or invent a statute. Leave blank unless verified.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Safe Legal Status Wording
                  </label>
                  <input
                    type="text"
                    value={formData.legalStatusDescription}
                    onChange={(e) => setFormData({ ...formData, legalStatusDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="Registered in Jammu & Kashmir"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NITI Aayog NGO DARPAN ID
                  </label>
                  <input
                    type="text"
                    value={formData.darpanId}
                    onChange={(e) => setFormData({ ...formData, darpanId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="JK/2026/1153821"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trust PAN Number
                  </label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="AABTF0015H"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo Management & Live Light/Dark Preview */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Official Brand Logo & Emblem</h3>
              <p className="text-xs text-slate-500">Upload a custom logo image or use the official geometric gold-trimmed emblem</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Logo Image URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: '' })}
                        className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                        title="Reset to Official Emblem"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Or Upload Custom Logo Image</label>
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-slate-50 hover:bg-emerald-50/50 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">Choose Image File (PNG, SVG, JPG - Max 2MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, (dataUrl) => setFormData({ ...formData, logoUrl: dataUrl }));
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Logo Preview Canvas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Live Header & Dark Contrast Preview</label>
                  <button
                    type="button"
                    onClick={() => setPreviewDarkLogo(!previewDarkLogo)}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer underline"
                  >
                    Toggle {previewDarkLogo ? 'Light Canvas' : 'Dark Canvas'}
                  </button>
                </div>

                <div className={`p-6 rounded-xl border flex flex-col items-center justify-center min-h-[140px] transition-all ${
                  previewDarkLogo ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  {formData.logoUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.logoUrl}
                        alt="Brand Logo"
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div>
                        <div className="font-extrabold text-sm leading-tight">{formData.displayName}</div>
                        <div className="text-[10px] opacity-75">{formData.tagline}</div>
                      </div>
                    </div>
                  ) : (
                    <FETLogo size="md" showTagline={true} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3 Core Identity Colors */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">3 Core Brand Identity Colors</h3>
              <p className="text-xs text-slate-500">Defines the primary palette applied across headers, hero sliders, badges, and buttons</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Green */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Primary Green (Emerald)</span>
                  <div className="w-6 h-6 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: formData.primaryGreen }} />
                </div>
                <input
                  type="text"
                  value={formData.primaryGreen}
                  onChange={(e) => setFormData({ ...formData, primaryGreen: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
                <input
                  type="color"
                  value={formData.primaryGreen}
                  onChange={(e) => setFormData({ ...formData, primaryGreen: e.target.value })}
                  className="w-full h-8 rounded-lg cursor-pointer border border-slate-300"
                />
              </div>

              {/* Primary Navy */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Primary Navy (Sapphire)</span>
                  <div className="w-6 h-6 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: formData.primaryBlue }} />
                </div>
                <input
                  type="text"
                  value={formData.primaryBlue}
                  onChange={(e) => setFormData({ ...formData, primaryBlue: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
                <input
                  type="color"
                  value={formData.primaryBlue}
                  onChange={(e) => setFormData({ ...formData, primaryBlue: e.target.value })}
                  className="w-full h-8 rounded-lg cursor-pointer border border-slate-300"
                />
              </div>

              {/* Accent Amber */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Accent Amber (Gold)</span>
                  <div className="w-6 h-6 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: formData.accentAmber }} />
                </div>
                <input
                  type="text"
                  value={formData.accentAmber}
                  onChange={(e) => setFormData({ ...formData, accentAmber: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
                <input
                  type="color"
                  value={formData.accentAmber}
                  onChange={(e) => setFormData({ ...formData, accentAmber: e.target.value })}
                  className="w-full h-8 rounded-lg cursor-pointer border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Platform Impact Census & Baseline Metrics */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Platform Impact Statistics & Census Baseline</h3>
              <p className="text-xs text-slate-500">Configures baseline statutory impact figures shown when live collection tallies are initializing</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Established Year</label>
                <input
                  type="number"
                  value={formData.establishedYear}
                  onChange={(e) => setFormData({ ...formData, establishedYear: parseInt(e.target.value) || 1994 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institutions Supported</label>
                <input
                  type="number"
                  value={formData.totalInstitutions}
                  onChange={(e) => setFormData({ ...formData, totalInstitutions: parseInt(e.target.value) || 14 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scholars Benefited</label>
                <input
                  type="number"
                  value={formData.totalStudentsBenefited}
                  onChange={(e) => setFormData({ ...formData, totalStudentsBenefited: parseInt(e.target.value) || 42500 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Active Field Volunteers</label>
                <input
                  type="number"
                  value={formData.activeVolunteersCount}
                  onChange={(e) => setFormData({ ...formData, activeVolunteersCount: parseInt(e.target.value) || 1850 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Active Donors</label>
                <input
                  type="number"
                  value={formData.activeDonorsCount}
                  onChange={(e) => setFormData({ ...formData, activeDonorsCount: parseInt(e.target.value) || 3200 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: Announcement Bar & Top Header Settings */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Announcement Bar Configuration */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Dynamic Admissions & Announcement Bar</h3>
                <p className="text-xs text-slate-500">Live ticker displayed at the very top of all public pages</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAnnouncementBarActive}
                  onChange={(e) => setFormData({ ...formData, isAnnouncementBarActive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700">Bar Active</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={formData.announcementBarBadge}
                  onChange={(e) => setFormData({ ...formData, announcementBarBadge: e.target.value })}
                  placeholder="Admissions Open 2026-27"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Link Destination</label>
                <input
                  type="text"
                  value={formData.announcementBarLink}
                  onChange={(e) => setFormData({ ...formData, announcementBarLink: e.target.value })}
                  placeholder="#programs or https://..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Message</label>
                <input
                  type="text"
                  value={formData.announcementBarText}
                  onChange={(e) => setFormData({ ...formData, announcementBarText: e.target.value })}
                  placeholder="FET National Talent Search 2026 registration is now open across all 27 chapters."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Top Header Transparency Switches */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Header Transparency & Badge Switches</h3>
              <p className="text-xs text-slate-500">Toggle public statutory accreditation and contact badges in top header</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.headerSettings.showTaxExemptionTag}
                  onChange={(e) => setFormData({
                    ...formData,
                    headerSettings: { ...formData.headerSettings, showTaxExemptionTag: e.target.checked }
                  })}
                  className="rounded text-emerald-600"
                />
                <span>Show Section 80G Certified Badge</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.headerSettings.showNitiAayogTag}
                  onChange={(e) => setFormData({
                    ...formData,
                    headerSettings: { ...formData.headerSettings, showNitiAayogTag: e.target.checked }
                  })}
                  className="rounded text-emerald-600"
                />
                <span>Show NITI Aayog Darpan Badge</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.headerSettings.showPhone}
                  onChange={(e) => setFormData({
                    ...formData,
                    headerSettings: { ...formData.headerSettings, showPhone: e.target.checked }
                  })}
                  className="rounded text-emerald-600"
                />
                <span>Show Official Phone in Header</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.headerSettings.showEmail}
                  onChange={(e) => setFormData({
                    ...formData,
                    headerSettings: { ...formData.headerSettings, showEmail: e.target.checked }
                  })}
                  className="rounded text-emerald-600"
                />
                <span>Show Contact Email in Header</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.headerSettings.showTagline}
                  onChange={(e) => setFormData({
                    ...formData,
                    headerSettings: { ...formData.headerSettings, showTagline: e.target.checked }
                  })}
                  className="rounded text-emerald-600"
                />
                <span>Show Organization Tagline</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: Navigation Menus & Links Tree */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'navigation' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Main Navigation Menu Structure</h3>
              <p className="text-xs text-slate-500">Configure top navigation menu items, targets, badges, and nested sub-items</p>
            </div>
            <button
              type="button"
              onClick={addMenuItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Menu Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {navMenu.map((item, idx) => (
              <div key={item.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">Menu #{idx + 1}: {item.label}</span>

                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        type="button"
                        onClick={() => moveMenuItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-white hover:bg-slate-200 disabled:opacity-30 border border-slate-200 text-slate-700 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMenuItem(idx, 'down')}
                        disabled={idx === navMenu.length - 1}
                        className="p-1 rounded bg-white hover:bg-slate-200 disabled:opacity-30 border border-slate-200 text-slate-700 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addSubItem(idx)}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer"
                    >
                      + Sub-item
                    </button>
                    {navMenu.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMenuItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Menu Label</label>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateMenuItem(idx, 'label', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Target (#anchor or url)</label>
                    <input
                      type="text"
                      value={item.target}
                      onChange={(e) => updateMenuItem(idx, 'target', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Badge Text (Optional)</label>
                    <input
                      type="text"
                      value={item.badge || ''}
                      onChange={(e) => updateMenuItem(idx, 'badge', e.target.value)}
                      placeholder="e.g. 80G, New"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Sub-items Render */}
                {item.subItems && item.subItems.length > 0 && (
                  <div className="pl-6 pt-2 border-l-2 border-blue-200 space-y-2">
                    <span className="text-[10px] font-bold text-blue-900 uppercase">Sub-menu Items</span>
                    {item.subItems.map((sub, subIdx) => (
                      <div key={sub.id || subIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <input
                          type="text"
                          value={sub.label}
                          onChange={(e) => updateSubItem(idx, subIdx, 'label', e.target.value)}
                          placeholder="Label"
                          className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded"
                        />
                        <input
                          type="text"
                          value={sub.target}
                          onChange={(e) => updateSubItem(idx, subIdx, 'target', e.target.value)}
                          placeholder="#link"
                          className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubItem(idx, subIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: Homepage Sections Priority & Ordering */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'sections' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 animate-in fade-in" id="admin-homepage-sections-order-panel">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layout className="w-4 h-4 text-emerald-700" />
                <span>Homepage Section Priority & Visibility</span>
              </h3>
              <p className="text-xs text-slate-500">Reorder modules on mobile & desktop homepage or toggle specific sections</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSectionOrder(defaultSections.map(s => s.id));
                setSectionVisibility(defaultSections.reduce((acc, s) => ({ ...acc, [s.id]: true }), {}));
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
            >
              Reset Default Order
            </button>
          </div>

          <div className="space-y-2">
            {sectionOrder.map((sectionId, idx) => {
              const def = defaultSections.find(s => s.id === sectionId) || {
                id: sectionId,
                name: sectionId.replace('_', ' ').toUpperCase(),
                desc: 'Custom homepage module'
              };
              const isVisible = sectionVisibility[sectionId] !== false;

              return (
                <div 
                  key={`admin-cms-section-${sectionId}-${idx}`}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isVisible ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{def.name}</h4>
                        {!isVisible && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{def.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Toggle Visibility */}
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(sectionId)}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                        isVisible 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                          : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                      }`}
                      title={isVisible ? 'Hide Section' : 'Show Section'}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        idx === 0
                          ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                          : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-100 cursor-pointer'
                      }`}
                      title="Move Section Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={idx === sectionOrder.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        idx === sectionOrder.length - 1
                          ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                          : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-100 cursor-pointer'
                      }`}
                      title="Move Section Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: Hero Visual Slider (Media, Video/Image, CRUD) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'hero' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Add Button */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hero Section Promotional Slides</h3>
                <p className="text-xs text-slate-500">Configure slide headings, badges, media (photo or video), draft states, and call-to-actions</p>
              </div>
              <button
                type="button"
                onClick={addSlide}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Slide</span>
              </button>
            </div>

            {/* In-Tab Live Slider Preview Widget */}
            {slides.length > 0 && (
              <div className="p-4 bg-slate-950 text-white rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Slide #{activeSlidePreviewIdx + 1} of {slides.length} Live Preview
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveSlidePreviewIdx(prev => (prev - 1 + slides.length) % slides.length)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      ← Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSlidePreviewIdx(prev => (prev + 1) % slides.length)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* Simulated Hero Card */}
                {slides[activeSlidePreviewIdx] && (
                  <div className="p-4 sm:p-6 bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden min-h-[160px] flex flex-col justify-end">
                    {slides[activeSlidePreviewIdx].imageUrl && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
                        style={{ backgroundImage: `url(${slides[activeSlidePreviewIdx].imageUrl})` }}
                      />
                    )}
                    {slides[activeSlidePreviewIdx].showTextOverlay !== false ? (
                      <div className="relative space-y-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                          {slides[activeSlidePreviewIdx].badgeText || 'Badge'}
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-white">
                          {slides[activeSlidePreviewIdx].title}
                        </h4>
                        <p className="text-xs text-slate-300 line-clamp-2">
                          {slides[activeSlidePreviewIdx].subtitle}
                        </p>
                        <div className="pt-2 flex flex-wrap gap-2">
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700">
                            {slides[activeSlidePreviewIdx].ctaText || 'Primary CTA'}
                          </span>
                          {slides[activeSlidePreviewIdx].secondaryCtaText && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700">
                              {slides[activeSlidePreviewIdx].secondaryCtaText}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-amber-400/30 text-amber-300 text-xs">
                        <span className="font-bold">Text Overlay: OFF (Pure Media Mode)</span>
                        <span className="text-[10px] text-slate-400">Media shown full-bleed without text or buttons</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Slides List Form */}
            <div className="space-y-4">
              {slides.map((slide, idx) => (
                <div key={slide.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">Slide #{idx + 1}</span>

                      {/* Status Selector: Draft vs Published */}
                      <select
                        value={slide.status || 'published'}
                        onChange={(e) => updateSlide(idx, 'status', e.target.value as 'draft' | 'published')}
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${
                          slide.status === 'draft' 
                            ? 'bg-amber-50 text-amber-900 border-amber-300' 
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        <option value="published">Published (Live)</option>
                        <option value="draft">Draft (Hidden from Public)</option>
                      </select>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => moveSlide(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-white hover:bg-slate-200 disabled:opacity-30 border border-slate-200 text-slate-700 cursor-pointer"
                          title="Move Slide Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSlide(idx, 'down')}
                          disabled={idx === slides.length - 1}
                          className="p-1 rounded bg-white hover:bg-slate-200 disabled:opacity-30 border border-slate-200 text-slate-700 cursor-pointer"
                          title="Move Slide Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Independent Text Overlay Control */}
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer shadow-2xs hover:border-amber-400 transition-colors">
                        <input
                          type="checkbox"
                          checked={slide.showTextOverlay !== false}
                          onChange={(e) => updateSlide(idx, 'showTextOverlay', e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-400"
                        />
                        <span className="text-[11px]">
                          Text Overlay: {slide.showTextOverlay !== false ? (
                            <span className="text-emerald-700 font-extrabold">ON</span>
                          ) : (
                            <span className="text-slate-400 font-extrabold">OFF (Pure Media)</span>
                          )}
                        </span>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slide.isActive}
                          onChange={(e) => updateSlide(idx, 'isActive', e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span>Active</span>
                      </label>
                      {slides.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlide(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Remove Slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notice when Text Overlay is OFF */}
                  {slide.showTextOverlay === false && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
                      <span className="font-semibold">
                        Pure Media Mode: Headline, subtitle, and CTA buttons are hidden for this slide. The image or video will be displayed cleanly without empty space or placeholders.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Headline Title</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => updateSlide(idx, 'title', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Badge Label</label>
                      <input
                        type="text"
                        value={slide.badgeText || ''}
                        onChange={(e) => updateSlide(idx, 'badgeText', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Subtitle / Description</label>
                    <textarea
                      rows={2}
                      value={slide.subtitle}
                      onChange={(e) => updateSlide(idx, 'subtitle', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  {/* Media Configuration: Image vs Video */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Slide Background Media (Upload or URL)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateSlide(idx, 'mediaType', 'image')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            slide.mediaType !== 'video' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSlide(idx, 'mediaType', 'video')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            slide.mediaType === 'video' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Video
                        </button>
                      </div>
                    </div>

                    {/* Direct Upload Zone */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            {uploadingSlideIdx === idx ? (
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                            ) : (
                              <UploadCloud className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {uploadingSlideIdx === idx 
                                ? `Uploading to Cloud (${uploadProgress}%)...` 
                                : `Upload Slide ${slide.mediaType === 'video' ? 'Video' : 'Image'}`}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {slide.mediaType === 'video' 
                                ? 'MP4 or WebM video file (optimized for background loop)' 
                                : 'JPG, PNG, or WebP photo (auto-compressed)'}
                            </p>
                          </div>
                        </div>

                        <label className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Select File</span>
                          <input
                            type="file"
                            accept={slide.mediaType === 'video' ? 'video/mp4,video/webm,video/*' : 'image/jpeg,image/png,image/webp,image/*'}
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleSlideMediaUpload(idx, file);
                              e.target.value = '';
                            }}
                            disabled={uploadingSlideIdx === idx}
                          />
                        </label>
                      </div>

                      {/* Upload Progress Bar */}
                      {uploadingSlideIdx === idx && (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {slide.mediaType === 'video' ? (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-600">Or Direct Video URL</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            placeholder="https://example.com/video.mp4 or uploaded video URL"
                            value={slide.videoUrl || ''}
                            onChange={(e) => updateSlide(idx, 'videoUrl', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                          />
                          {slide.videoUrl && (
                            <button
                              type="button"
                              onClick={() => updateSlide(idx, 'videoUrl', '')}
                              className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded cursor-pointer shrink-0"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        {slide.videoUrl && (
                          <div className="p-2 bg-slate-900 rounded-lg text-white flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-2 truncate text-slate-300">
                              <FileVideo className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{slide.videoUrl}</span>
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold shrink-0 ml-2">Video Active</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-600">Or Direct Photo URL / Presets</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/... or uploaded photo URL"
                            value={slide.imageUrl || ''}
                            onChange={(e) => updateSlide(idx, 'imageUrl', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                          />
                          {slide.imageUrl && (
                            <button
                              type="button"
                              onClick={() => updateSlide(idx, 'imageUrl', '')}
                              className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded cursor-pointer shrink-0"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Thumbnail preview if photo present */}
                        {slide.imageUrl && (
                          <div className="flex items-center gap-3 p-2 bg-slate-100 rounded-lg border border-slate-200">
                            <img 
                              src={slide.imageUrl} 
                              alt={`Slide #${idx + 1} thumbnail`} 
                              className="w-12 h-8 rounded object-cover border border-slate-300 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-slate-800 truncate">Background Image Attached</p>
                              <p className="text-[10px] text-slate-500 truncate">{slide.imageUrl}</p>
                            </div>
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase shrink-0">
                              Ready
                            </span>
                          </div>
                        )}

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 pt-1">
                          <span className="font-semibold">Quick Presets:</span>
                          <button
                            type="button"
                            onClick={() => updateSlide(idx, 'imageUrl', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80')}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                          >
                            Education
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSlide(idx, 'imageUrl', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=80')}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                          >
                            Classroom
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSlide(idx, 'imageUrl', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1600&q=80')}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                          >
                            Scholarships
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSlide(idx, 'imageUrl', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1600&q=80')}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                          >
                            Community
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Primary Button Text</label>
                      <input
                        type="text"
                        value={slide.ctaText}
                        onChange={(e) => updateSlide(idx, 'ctaText', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Primary Link (#target)</label>
                      <input
                        type="text"
                        value={slide.ctaLink || '#donate'}
                        onChange={(e) => updateSlide(idx, 'ctaLink', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Secondary Button Text</label>
                      <input
                        type="text"
                        value={slide.secondaryCtaText || ''}
                        onChange={(e) => updateSlide(idx, 'secondaryCtaText', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Secondary Link (#target)</label>
                      <input
                        type="text"
                        value={slide.secondaryCtaLink || '#programs'}
                        onChange={(e) => updateSlide(idx, 'secondaryCtaLink', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: Featured Crowdfunding Appeals Curation */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'crowdfunding' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6 animate-in fade-in" id="cms-crowdfunding-curation-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-rose-600" />
                <span>Featured Crowdfunding Initiatives Curation</span>
              </h3>
              <p className="text-xs text-slate-500">
                Select and prioritize which verified fundraising appeals appear prominently on the public homepage
              </p>
            </div>

            {featuredCampaignIds.length > 0 && (
              <button
                type="button"
                onClick={() => setFeaturedCampaignIds([])}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
              >
                Clear All Featured
              </button>
            )}
          </div>

          {/* Curated Priority Order List */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Currently Featured on Homepage ({featuredCampaignIds.length} Campaigns)</span>
              </h4>
              <span className="text-[11px] text-emerald-800 font-semibold">Priority 1 = Top Hero Card</span>
            </div>

            {featuredCampaignIds.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center">
                No campaigns currently pinned as featured. Public homepage will fallback to most recent verified appeals.
              </p>
            ) : (
              <div className="space-y-2">
                {featuredCampaignIds.map((cId, idx) => {
                  const camp = availableCampaigns.find(c => c.id === cId) || {
                    id: cId,
                    title: `Campaign ID: ${cId}`,
                    targetAmount: 0,
                    raisedAmount: 0,
                    category: 'education'
                  };

                  return (
                    <div 
                      key={`feat-${cId}-${idx}`} 
                      className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white text-xs font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate">{camp.title}</h5>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="capitalize font-semibold text-emerald-700">{camp.category}</span>
                            <span>•</span>
                            <span>Target: ₹{(camp.targetAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveFeaturedCampaign(idx, 'up')}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 border border-slate-200 cursor-pointer"
                          title="Move Priority Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === featuredCampaignIds.length - 1}
                          onClick={() => moveFeaturedCampaign(idx, 'down')}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 border border-slate-200 cursor-pointer"
                          title="Move Priority Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleFeatureCampaign(cId)}
                          className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 cursor-pointer"
                        >
                          Unfeature
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All Available Campaigns Pool */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-800">
                All Verified Public Appeals Catalog
              </h4>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter campaigns by title..."
                  value={campaignFilter}
                  onChange={(e) => setCampaignFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {loadingCampaigns ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-emerald-600" />
                Loading appeals catalog...
              </div>
            ) : availableCampaigns.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                No active campaigns in database. Use Campaign Management to create appeals.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableCampaigns
                  .filter(c => !campaignFilter || c.title?.toLowerCase().includes(campaignFilter.toLowerCase()))
                  .map(camp => {
                    const isFeatured = featuredCampaignIds.includes(camp.id);
                    return (
                      <div 
                        key={camp.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isFeatured ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-slate-900 truncate">{camp.title}</h5>
                            {isFeatured && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-600 text-white shrink-0">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <span className="capitalize font-semibold text-slate-700">{camp.category}</span>
                            <span>•</span>
                            <span>Target: ₹{(camp.targetAmount || 0).toLocaleString()}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">Raised: ₹{(camp.raisedAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleFeatureCampaign(camp.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                            isFeatured
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                              : 'bg-emerald-700 text-white hover:bg-emerald-600 shadow-xs'
                          }`}
                        >
                          {isFeatured ? 'Remove' : '+ Feature'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 7: Initiatives, Events & Dynamic Volunteer CTA */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'programs_events' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Volunteer CTA Banner Customizer */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Volunteer & Membership CTA Banner Customizer</h3>
                <p className="text-xs text-slate-500">Controls the headline, text, and destination link of the grassroots engagement banner</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.volunteerCta.isVisible}
                  onChange={(e) => setFormData({
                    ...formData,
                    volunteerCta: { ...formData.volunteerCta, isVisible: e.target.checked }
                  })}
                  className="rounded text-emerald-600"
                />
                <span>Show CTA</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner Headline</label>
                <input
                  type="text"
                  value={formData.volunteerCta.heading}
                  onChange={(e) => setFormData({
                    ...formData,
                    volunteerCta: { ...formData.volunteerCta, heading: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner Description</label>
                <textarea
                  rows={2}
                  value={formData.volunteerCta.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    volunteerCta: { ...formData.volunteerCta, description: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Button Text</label>
                <input
                  type="text"
                  value={formData.volunteerCta.buttonText}
                  onChange={(e) => setFormData({
                    ...formData,
                    volunteerCta: { ...formData.volunteerCta, buttonText: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Button Link Destination</label>
                <input
                  type="text"
                  value={formData.volunteerCta.destination}
                  onChange={(e) => setFormData({
                    ...formData,
                    volunteerCta: { ...formData.volunteerCta, destination: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Governance & Trustees Section Controls */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Governance & Trustees Section Controls</h3>
              <p className="text-xs text-slate-500">Configure institutional governance message and transparency badges</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.governanceSettings.showTrusteesList}
                    onChange={(e) => setFormData({
                      ...formData,
                      governanceSettings: { ...formData.governanceSettings, showTrusteesList: e.target.checked }
                    })}
                    className="rounded text-emerald-600"
                  />
                  <span>Show Board of Trustees Section</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.governanceSettings.showAuditComplianceBadge}
                    onChange={(e) => setFormData({
                      ...formData,
                      governanceSettings: { ...formData.governanceSettings, showAuditComplianceBadge: e.target.checked }
                    })}
                    className="rounded text-emerald-600"
                  />
                  <span>Show Statutory Audit & Legal Shield</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Public Governance Message</label>
                <textarea
                  rows={2}
                  value={formData.governanceSettings.publicMessage}
                  onChange={(e) => setFormData({
                    ...formData,
                    governanceSettings: { ...formData.governanceSettings, publicMessage: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 8: Footer & Contact Secretariat */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'footer' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Head Secretariat Contact & Emergency Hotline</h3>
              <p className="text-xs text-slate-500">Official contact information displayed across website footers and verification badges</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Welfare Hotline</label>
                <input
                  type="text"
                  value={formData.emergencyHotline}
                  onChange={(e) => setFormData({ ...formData, emergencyHotline: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-amber-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Head Secretariat Physical Address</label>
              <textarea
                rows={2}
                value={formData.headOfficeAddress}
                onChange={(e) => setFormData({ ...formData, headOfficeAddress: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Text & Social Profile Links */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Footer Text & Social Media Profiles</h3>
              <p className="text-xs text-slate-500">Configure footer summary and active community broadcast channels</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">About Trust Summary</label>
              <textarea
                rows={2}
                value={formData.footerSettings.aboutSummary}
                onChange={(e) => setFormData({
                  ...formData,
                  footerSettings: { ...formData.footerSettings, aboutSummary: e.target.value }
                })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Community</label>
                <input
                  type="url"
                  value={formData.socialLinks.whatsapp}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, whatsapp: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">YouTube Channel</label>
                <input
                  type="url"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, youtube: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facebook Page</label>
                <input
                  type="url"
                  value={formData.socialLinks.facebook}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instagram Handle</label>
                <input
                  type="url"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telegram Community</label>
                <input
                  type="url"
                  value={formData.socialLinks.telegram}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, telegram: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 9: Real-time Multi-Device Homepage Live Simulator */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'live_preview' && (
        <HomepageLivePreview
          formData={formData}
          slides={slides}
          sectionOrder={sectionOrder}
          sectionVisibility={sectionVisibility}
          onClose={() => setActiveTab('branding')}
        />
      )}

      {/* Floating Bottom Save Action Bar for Mobile & Tablet */}
      <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-between gap-2 text-white">
        <div className="text-xs truncate">
          <span className="font-bold text-amber-400">Super Admin CMS</span>
          <span className="text-[10px] text-slate-400 block">Unsaved edits will sync on publish</span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isSuperAdmin}
          className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-600 shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span>{isSaving ? 'Publishing...' : 'Publish Live'}</span>
        </button>
      </div>

    </div>
  );
};
