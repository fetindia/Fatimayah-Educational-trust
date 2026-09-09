/**
 * @license
 * Featured Charity Cases / Stories That Need Your Support
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartHandshake, 
  ShieldCheck, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Sparkles,
  ExternalLink,
  MapPin,
  Clock
} from 'lucide-react';
import { fetchPublicActiveCampaigns, CAMPAIGN_CATEGORY_CONFIG } from '../../lib/firebase';
import { CrowdfundingCampaign } from '../../types';
import { useConfig } from '../../contexts/ConfigContext';

interface FeaturedCasesSectionProps {
  onViewCase: (campaign: CrowdfundingCampaign) => void;
  onSupportCase: (campaign: CrowdfundingCampaign) => void;
  onViewAllCases?: () => void;
}

export const FeaturedCasesSection: React.FC<FeaturedCasesSectionProps> = ({
  onViewCase,
  onSupportCase,
  onViewAllCases
}) => {
  const { config } = useConfig();
  const [cases, setCases] = useState<CrowdfundingCampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCases() {
      try {
        setLoading(true);
        const allActive = await fetchPublicActiveCampaigns();
        // Strict verification: only approved/active public cases
        const approvedOnly = allActive.filter(
          c => c.status === 'active' || c.status === 'approved'
        );
        if (isMounted) {
          setCases(approvedOnly);
          setActiveIndex(0);
        }
      } catch (err) {
        console.warn('Could not load featured cases:', err);
        if (isMounted) setCases([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCases();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrev = () => {
    if (cases.length <= 1) return;
    setActiveIndex(prev => (prev === 0 ? cases.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (cases.length <= 1) return;
    setActiveIndex(prev => (prev === cases.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  const activeCase = cases[activeIndex] || null;

  return (
    <section 
      id="featured_cases" 
      className="py-14 sm:py-18 bg-slate-900 text-white relative overflow-hidden border-y border-slate-800"
      aria-labelledby="featured-cases-heading"
    >
      {/* Background subtle radial ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Stories That Need Your Support</span>
            </div>
            <h2 id="featured-cases-heading" className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Featured Cases
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Verified individual and community appeals currently undergoing critical emergency assistance. 100% of public contributions are tracked with zero administrative deduction.
            </p>
          </div>

          {/* Top Controls */}
          {cases.length > 1 && (
            <div className="flex items-center gap-2 self-start md:self-end">
              <span className="text-xs font-bold text-slate-400 mr-2">
                Case {activeIndex + 1} of {cases.length}
              </span>
              <button
                onClick={handlePrev}
                className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
                aria-label="Previous case"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
                aria-label="Next case"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading verified cases...</p>
          </div>
        ) : cases.length === 0 ? (
          /* High-Integrity Empty State (Prompt Mandate) */
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-800/40 border border-slate-700/60 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No Public Cases Currently Pending Urgent Funding</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                All currently active verified cases have attained required support or are presently undergoing stage-wise committee disbursement. New appeals will be published here upon trust verification.
              </p>
            </div>
            {onViewAllCases && (
              <button
                onClick={onViewAllCases}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Browse All Appeals
              </button>
            )}
          </div>
        ) : (
          /* Multi-Card Layered Carousel */
          <div 
            className="space-y-6"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Horizontal 3D Layered Carousel presentation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Main Featured Center Card */}
              {activeCase && (
                <div className="lg:col-span-8 bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col md:flex-row">
                  
                  {/* Photo Column */}
                  <div className="md:w-1/2 relative min-h-[260px] md:min-h-[360px] bg-slate-900">
                    <img
                      src={activeCase.coverImageUrl || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80'}
                      alt={activeCase.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent md:bg-gradient-to-r md:from-transparent md:to-slate-900/90" />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-900/90 text-emerald-200 border border-emerald-700/80 backdrop-blur-xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified Case</span>
                      </span>
                      {activeCase.isVerifiedByFET && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-900/90 text-blue-200 border border-blue-700/80 backdrop-blur-xs flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                          <span>FET Endorsed</span>
                        </span>
                      )}
                    </div>

                    {/* Location / Target Beneficiary */}
                    {(activeCase.location || activeCase.state) && (
                      <div className="absolute bottom-3 left-4 flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-950/70 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{activeCase.location || activeCase.state || 'India'}</span>
                      </div>
                    )}
                  </div>

                  {/* Information Details Column */}
                  <div className="md:w-1/2 p-6 sm:p-7 flex flex-col justify-between space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span className="uppercase tracking-wider text-amber-400">
                          {activeCase.categoryLabel || activeCase.category}
                        </span>
                        <span>Case Ref: #{activeCase.campaignNumber || (activeCase.id ? activeCase.id.slice(0, 8) : 'FET-CASE')}</span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                        {activeCase.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                        {activeCase.beneficiaryDescription || activeCase.description}
                      </p>

                      {/* Situation / Need Highlights */}
                      {activeCase.beneficiaryLocation && (
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Support Requirement:
                          </span>
                          <p className="text-slate-200 font-semibold text-xs">
                            Direct allocation for relief and expenses in {activeCase.beneficiaryLocation}.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Financial Progress Metric */}
                    <div className="space-y-2 pt-2 border-t border-slate-700/60">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-300">
                          Raised: <strong className="text-emerald-400">₹{(activeCase.raisedAmount || 0).toLocaleString('en-IN')}</strong>
                        </span>
                        <span className="text-slate-400">
                          Goal: ₹{(activeCase.targetAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round(((activeCase.raisedAmount || 0) / Math.max(1, activeCase.targetAmount || 1)) * 100))}%`
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{Math.min(100, Math.round(((activeCase.raisedAmount || 0) / Math.max(1, activeCase.targetAmount || 1)) * 100))}% Funded</span>
                        <span>{activeCase.donorsCount || activeCase.verifiedDonationsCount || 0} generous donors</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => onViewCase(activeCase)}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer border border-slate-600 flex items-center justify-center gap-1.5"
                      >
                        <span>View Case</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                      </button>

                      <button
                        onClick={() => onSupportCase(activeCase)}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5 fill-white" />
                        <span>Support This Case</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Side Peek / Preview of Next Cases (Layered Visual Depth) */}
              <div className="lg:col-span-4 hidden lg:flex flex-col gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Upcoming Appeals
                </span>
                
                {cases.slice(0, 3).map((c, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <div
                      key={c.id || idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                        isCurrent
                          ? 'bg-slate-800 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={c.coverImageUrl || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=200&q=80'}
                        alt={c.title}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-amber-400 truncate">
                            {c.categoryLabel || c.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {Math.round(((c.raisedAmount || 0) / Math.max(1, c.targetAmount || 1)) * 100)}%
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {c.title}
                        </h4>
                        <div className="text-[11px] text-emerald-400 font-bold">
                          Goal: ₹{(c.targetAmount || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Pagination Dots */}
            {cases.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {cases.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === activeIndex 
                        ? 'w-7 bg-emerald-400' 
                        : 'w-2 bg-slate-700 hover:bg-slate-600'
                    }`}
                    aria-label={`Go to case ${i + 1}`}
                  />
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
};
