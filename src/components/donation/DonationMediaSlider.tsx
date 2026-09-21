/**
 * @license
 * Dedicated Media Slider for Donate Now / General Giving Portal
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Building2, 
  HeartHandshake, 
  ShieldCheck, 
  Sparkles,
  Package,
  Layers
} from 'lucide-react';

export interface DonationSlideItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  impactMetric: string;
}

const TRUST_DONATION_SLIDES: DonationSlideItem[] = [
  {
    id: 'don-slide-1',
    title: 'Merit-Based Higher Education & STEM Grants',
    subtitle: 'Sponsoring tuition fees for deserving engineering, medical, and polytechnic candidates across Maharashtra, MP, Gujarat, and Telangana.',
    badge: 'Education & Scholarship Fund',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80',
    impactMetric: '42,500+ Students Benefited'
  },
  {
    id: 'don-slide-2',
    title: 'School Infrastructure, Classrooms & Digital Labs',
    subtitle: 'Building modern computer laboratories, science rooms, and safe learning centers with direct community involvement.',
    badge: 'Infrastructure & Material Endowments',
    imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1400&q=80',
    impactMetric: '14 Associated Institutions'
  },
  {
    id: 'don-slide-3',
    title: 'Emergency Medical Relief, Dialysis & Diagnostics',
    subtitle: 'Direct financial assistance for dialysis sessions, cardiac interventions, and essential life-saving pharmaceuticals.',
    badge: 'Healthcare & Emergency Welfare',
    imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1400&q=80',
    impactMetric: '100% Zero-Leakage Delivery'
  },
  {
    id: 'don-slide-4',
    title: 'Food Ration Kits & Community Sustenance',
    subtitle: 'Regular provision of dry rations, grain packages, and essential sustenance to widows, elderly, and vulnerable households.',
    badge: 'Sadaqah & Fitrah Allocation',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=80',
    impactMetric: 'Direct Grassroots Verification'
  }
];

export const DonationMediaSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % TRUST_DONATION_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const current = TRUST_DONATION_SLIDES[currentIndex];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + TRUST_DONATION_SLIDES.length) % TRUST_DONATION_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % TRUST_DONATION_SLIDES.length);
  };

  return (
    <div 
      className="relative rounded-3xl overflow-hidden shadow-xl bg-slate-950 border border-slate-800 text-white min-h-[300px] sm:min-h-[360px] md:min-h-[400px] flex flex-col justify-end"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      id="donation-media-slider"
    >
      {/* Background Image with Crossfade */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none"
        style={{ backgroundImage: `url(${current.imageUrl})` }}
      />

      {/* Directional Vignette Gradient to Guarantee Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/30 pointer-events-none" />

      {/* Content Overlay */}
      <div className="relative z-10 p-5 sm:p-8 space-y-3 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-950" />
            {current.badge}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-emerald-300 border border-emerald-500/30">
            {current.impactMetric}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight font-serif drop-shadow-md">
          {current.title}
        </h3>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed drop-shadow-sm max-w-xl">
          {current.subtitle}
        </p>

        {/* Navigation Dots and Slide Selector */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {TRUST_DONATION_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 transition-all rounded-full cursor-pointer ${
                  idx === currentIndex 
                    ? 'w-7 bg-amber-400 shadow-xs' 
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 transition-all cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-300">
              {currentIndex + 1} / {TRUST_DONATION_SLIDES.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 transition-all cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
