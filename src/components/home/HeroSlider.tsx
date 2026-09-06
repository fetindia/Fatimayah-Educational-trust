/**
 * @license
 * Hero Slider & Dynamic CMS Banner Component
 * Fatimyah Educational Trust India
 */

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  GraduationCap, 
  Users, 
  Building, 
  Heart,
  ShieldCheck,
  Play,
  X,
  CheckCircle2,
  HeartHandshake
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { HeroSlide } from '../../types';

interface HeroSliderProps {
  onExplorePrograms: () => void;
  onOpenDonate?: () => void;
  onOpenAuth: () => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ onExplorePrograms, onOpenDonate, onOpenAuth }) => {
  const { config } = useConfig();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Fallback high-impact institutional slides if CMS has none
  const defaultSlides: HeroSlide[] = [
    {
      id: 'slide-1',
      title: 'Empowering India’s Deserving Youth Through Higher Education & Research',
      subtitle: 'Merit-based higher education scholarships, STEM grants, and medical fee subsidies across Maharashtra, MP, Gujarat, and Telangana.',
      badgeText: '30+ Years Institutional Legacy (1994 - 2026)',
      ctaText: 'Explore Educational Programs',
      ctaLink: '#programs',
      secondaryCtaText: 'Avail 80G Tax Deduction',
      secondaryCtaLink: '#donate',
      isActive: true,
      mediaType: 'image',
      videoUrl: '',
      status: 'published',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80'
    },
    {
      id: 'slide-2',
      title: 'Modernizing Madrasa Curricula with STEM & Digital Laboratories',
      subtitle: 'Equipping traditional educational institutions with modern computer laboratories, English language software, and accredited skill certifications.',
      badgeText: 'National Education & Technology Initiative',
      ctaText: 'View Education & Exam Programs',
      ctaLink: '#education',
      secondaryCtaText: 'Join Volunteer Network',
      secondaryCtaLink: '#volunteer_membership',
      isActive: true,
      mediaType: 'image',
      videoUrl: '',
      status: 'published',
      imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1600&q=80'
    },
    {
      id: 'slide-3',
      title: 'Transparent Healthcare & Zakat Relief with Direct Zero-Leakage Delivery',
      subtitle: 'Direct financial assistance for dialysis, cardiac surgeries, and diagnostic screening with 100% statutory audit verification.',
      badgeText: 'Section 80G & 12A Certified Public Trust',
      ctaText: 'Contribute with 80G Exemption',
      ctaLink: '#donate',
      secondaryCtaText: 'Sponsor a Medical Patient',
      secondaryCtaLink: '#crowdfunding',
      isActive: true,
      mediaType: 'image',
      videoUrl: '',
      status: 'published',
      imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1600&q=80'
    }
  ];

  const slides = (config.heroSliders && config.heroSliders.length > 0)
    ? config.heroSliders.filter(s => s.isActive && (s.status === undefined || s.status === 'published'))
    : defaultSlides;

  useEffect(() => {
    if (slides.length <= 1 || !isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [slides.length, isPlaying]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  const handleSlideCta = (link?: string) => {
    if (!link) {
      onExplorePrograms();
      return;
    }
    const cleanTarget = link.replace(/^#/, '');
    const element = document.getElementById(cleanTarget);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (cleanTarget === 'donate' && onOpenDonate) {
      onOpenDonate();
    } else {
      onExplorePrograms();
    }
  };

  const slideBgImage = currentSlide.imageUrl || (currentSlide as any).imageOverlay;

  return (
    <section 
      className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800 select-none" 
      id="home"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) {
            // Swiped left -> next slide
            setCurrentSlideIndex(prev => (prev + 1) % slides.length);
          } else {
            // Swiped right -> prev slide
            setCurrentSlideIndex(prev => (prev - 1 + slides.length) % slides.length);
          }
        }
        setTouchStartX(null);
      }}
    >
      {/* Background Graphic & Photographic / Video Imagery Overlay */}
      {currentSlide.mediaType === 'video' && currentSlide.videoUrl ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={slideBgImage}
            className="w-full h-full object-cover"
            src={currentSlide.videoUrl}
          />
          {/* Subtle Transparent Directional Gradient for Text Readability without Obscuring Media */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/20" />
        </div>
      ) : slideBgImage ? (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 pointer-events-none"
          style={{
            backgroundImage: `url(${slideBgImage})`
          }}
        >
          {/* Subtle Transparent Directional Gradient - Preserves Photographic Brilliance while Framing Text */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/20" />
        </div>
      ) : (
        <div 
          className="absolute inset-0 opacity-25 pointer-events-none transition-all duration-1000"
          style={{
            backgroundImage: `radial-gradient(circle at 15% 30%, ${primaryGreen} 0%, transparent 60%), radial-gradient(circle at 85% 65%, ${primaryBlue} 0%, transparent 60%)`,
            backgroundSize: '100% 100%'
          }}
        />
      )}
      
      {/* Subtle Ambient Grain Overlay */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#d97706 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-10 sm:pt-10 sm:pb-12 lg:pt-14 lg:pb-16 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Main Slide Content (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Tag & Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-400/30 text-xs font-bold text-amber-300 shadow-sm">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentAmber }} />
              <span>{currentSlide.badgeText || config.tagline}</span>
            </div>

            {/* Main Headline with Smooth Fade Key */}
            <h1 
              key={`slide-title-${currentSlideIndex}`}
              className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight animate-in fade-in duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
            >
              {currentSlide.title}
            </h1>

            {/* Subtitle */}
            <p 
              key={`slide-sub-${currentSlideIndex}`}
              className="text-xs sm:text-base lg:text-lg text-slate-200 max-w-2xl leading-relaxed animate-in fade-in duration-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
            >
              {currentSlide.subtitle}
            </p>

            {/* Call to Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-4">
              <button
                onClick={() => handleSlideCta(currentSlide.ctaLink)}
                className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold text-white shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-emerald-400/40"
                style={{ backgroundColor: primaryGreen }}
                id="hero-primary-cta"
              >
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span>{currentSlide.ctaText || 'Explore Educational Programs'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSlideCta(currentSlide.secondaryCtaLink || '#donate')}
                className="px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 border border-amber-400 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                id="hero-donate-cta"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-950" />
                <span>{currentSlide.secondaryCtaText || 'Donate (80G)'}</span>
              </button>

              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                id="hero-video-cta"
              >
                <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="whitespace-nowrap">Watch Tour</span>
              </button>
            </div>

            {/* Slide Navigation Controls & Counter */}
            {slides.length > 1 && (
              <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentSlideIndex(prev => (prev - 1 + slides.length) % slides.length)}
                    className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`h-2 transition-all rounded-full cursor-pointer ${
                          idx === currentSlideIndex 
                            ? 'w-8 bg-amber-400 shadow-sm' 
                            : 'w-2 bg-slate-700 hover:bg-slate-500'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentSlideIndex(prev => (prev + 1) % slides.length)}
                    className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Next Slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="font-mono text-xs font-bold text-slate-400">
                  <span className="text-amber-300">{String(currentSlideIndex + 1).padStart(2, '0')}</span>
                  <span className="mx-1 text-slate-600">/</span>
                  <span>{String(slides.length).padStart(2, '0')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Institutional Trust Bento Card (Right 5 Cols) */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/65 backdrop-blur-md border border-white/15 shadow-2xl space-y-6 relative overflow-hidden">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Statutory Trust Seal</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-700">
                  Registered Public Trust
                </span>
              </div>

              {/* Trust Details */}
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-white tracking-tight">{config.legalName}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Headquartered in Mumbai, Maharashtra with verified NITI Aayog NGO Darpan credentials, Section 12A full exemption, and Section 80G tax benefit orders.
                </p>
              </div>

              {/* Compliance & Quick Numbers */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration No.</span>
                  <span className="text-xs font-mono font-extrabold text-amber-300">{config.registrationNumber}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">NITI Aayog Darpan</span>
                  <span className="text-xs font-mono font-extrabold text-emerald-400">{config.nitiAayogId}</span>
                </div>
              </div>

              {/* 3 Primary Brand Colors Affirmation */}
              <div className="pt-2">
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-2 flex items-center justify-between">
                  <span>Official Brand Palette</span>
                  <span className="text-amber-400 font-mono text-[10px]">Triad Harmony</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="w-full h-3 rounded-md mb-1.5 shadow-xs" style={{ backgroundColor: primaryGreen }} />
                    <span className="text-[10px] font-extrabold text-emerald-300 block">Emerald</span>
                    <span className="text-[9px] text-slate-400">Education</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="w-full h-3 rounded-md mb-1.5 shadow-xs" style={{ backgroundColor: primaryBlue }} />
                    <span className="text-[10px] font-extrabold text-blue-300 block">Sapphire</span>
                    <span className="text-[9px] text-slate-400">Governance</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="w-full h-3 rounded-md mb-1.5 shadow-xs" style={{ backgroundColor: accentAmber }} />
                    <span className="text-[10px] font-extrabold text-amber-300 block">Sun Amber</span>
                    <span className="text-[9px] text-slate-400">Empowerment</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Series 1 Cloud Core</span>
                </span>
                <button 
                  onClick={onOpenAuth}
                  className="text-amber-300 hover:text-amber-200 text-xs font-bold underline cursor-pointer"
                >
                  Member Sign In →
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Video Documentary Tour Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-slate-800 shadow-2xl text-white animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h3 className="text-base font-bold text-white">Trust Documentary & 30-Year Impact Film</h3>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-800/80 border border-amber-400/50 flex items-center justify-center shadow-lg">
                <Play className="w-8 h-8 text-amber-300 fill-amber-300 ml-1" />
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="text-sm font-bold text-white">Fatimyah Educational Trust: 1994 - 2026</h4>
                <p className="text-xs text-slate-400">
                  Official documentary showcasing higher education scholarship disbursements, medical outreach camps, and community empowerment.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                Duration: 7 mins • 4K Documentary Preview
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Producer: FET India Secretariat Media Bureau</span>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

