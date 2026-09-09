/**
 * @license
 * Featured Crowdfunding Appeals Section
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Search, 
  SlidersHorizontal, 
  RefreshCw, 
  Heart, 
  Info, 
  Sparkles,
  ArrowRight,
  PlusCircle,
  FileCheck2
} from 'lucide-react';
import { fetchPublicActiveCampaigns, CAMPAIGN_CATEGORY_CONFIG } from '../../lib/firebase';
import { CrowdfundingCampaign } from '../../types';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { CampaignCard } from '../campaigns/CampaignCard';
import { CampaignDetailsModal } from '../campaigns/CampaignDetailsModal';
import { SupportCampaignModal } from '../campaigns/SupportCampaignModal';
import { CreateCampaignModal } from '../campaigns/CreateCampaignModal';

type SortOption = 'featured' | 'urgent' | 'recent' | 'target';

interface FeaturedCrowdfundingSectionProps {
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
  onOpenDonate?: () => void;
  onOpenAuth?: () => void;
}

export const FeaturedCrowdfundingSection: React.FC<FeaturedCrowdfundingSectionProps> = ({ 
  onOpenLegal,
  onOpenDonate,
  onOpenAuth
}) => {
  const { config } = useConfig();
  const { currentUser } = useAuth();

  const [campaigns, setCampaigns] = useState<CrowdfundingCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  // Interactive Modals
  const [selectedCampaign, setSelectedCampaign] = useState<CrowdfundingCampaign | null>(null);
  const [supportCampaign, setSupportCampaign] = useState<CrowdfundingCampaign | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  const loadApprovedCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const list = await fetchPublicActiveCampaigns();
      // Strict Public Security Filter:
      // Only approved/active appeals are eligible for public homepage presentation
      // Explicitly excludes: drafts, pending_review, under_review, rejected, or deleted appeals
      const strictlyApproved = list.filter(c => 
        c.status === 'active' || c.status === 'approved'
      );
      setCampaigns(strictlyApproved);
    } catch (err) {
      console.error('Error fetching approved crowdfunding campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    loadApprovedCampaigns();
  }, []);

  // Category counts based on approved campaigns
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: campaigns.length };
    campaigns.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [campaigns]);

  // Filtered and Sorted Approved Campaigns
  const filteredAndSortedCampaigns = useMemo(() => {
    return campaigns
      .filter(c => {
        // Category filter
        if (selectedCategory !== 'all' && c.category !== selectedCategory) {
          return false;
        }
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = c.title?.toLowerCase().includes(q);
          const matchDesc = c.description?.toLowerCase().includes(q);
          const matchBeneficiary = c.beneficiaryName?.toLowerCase().includes(q);
          const matchLocation = c.location?.toLowerCase().includes(q) || c.district?.toLowerCase().includes(q) || c.state?.toLowerCase().includes(q);
          const matchNumber = c.campaignNumber?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchBeneficiary && !matchLocation && !matchNumber) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const isAFeatured = config.featuredCampaignIds?.includes(a.id);
        const isBFeatured = config.featuredCampaignIds?.includes(b.id);

        if (sortBy === 'featured') {
          const indexA = config.featuredCampaignIds?.indexOf(a.id) ?? -1;
          const indexB = config.featuredCampaignIds?.indexOf(b.id) ?? -1;
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        }
        if (sortBy === 'urgent') {
          const remainingA = (a.targetAmount || 0) - (a.raisedAmount || 0);
          const remainingB = (b.targetAmount || 0) - (b.raisedAmount || 0);
          return remainingB - remainingA;
        }
        if (sortBy === 'target') {
          return (b.targetAmount || 0) - (a.targetAmount || 0);
        }
        // Default recent
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [campaigns, selectedCategory, searchQuery, sortBy, config.featuredCampaignIds]);

  const handleOpenCreateAppeal = () => {
    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      return;
    }
    setIsCreateOpen(true);
  };

  return (
    <section 
      className="py-14 sm:py-20 bg-slate-50/80 border-b border-slate-200" 
      id="crowdfunding"
    >
      <div id="crowdfunding-campaigns-section" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Verified & Board-Approved Emergency Appeals</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Featured Crowdfunding Appeals
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Every appeal undergoes strict documentary due diligence by the FET India Board of Trustees. Contributions disburse transparently to audited educational and healthcare institutions.
            </p>
          </div>

          {/* Action CTAs: Refresh & Start Appeal */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={loadApprovedCampaigns}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shadow-2xs"
              title="Refresh Verified Appeals"
              aria-label="Refresh appeals"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCampaigns ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreateAppeal}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
              id="start-fund-appeal-btn"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Start a Fund Appeal</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Sort & Categories (Only shown or styled cleanly) */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search appeals by title, beneficiary, location..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
              >
                <option value="featured">Featured Appeals First</option>
                <option value="recent">Recently Approved</option>
                <option value="urgent">Highest Remaining Need</option>
                <option value="target">Target Goal</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>All Causes</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {categoryCounts['all'] || 0}
              </span>
            </button>

            {Object.entries(CAMPAIGN_CATEGORY_CONFIG).map(([catKey, catConfig]) => (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3.5 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                  selectedCategory === catKey
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{catConfig.label}</span>
                {Boolean(categoryCounts[catKey]) && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold">
                    {categoryCounts[catKey]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign Cards Grid or Elegant Empty State */}
        {loadingCampaigns ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Retrieving verified crowdfunding registry...</p>
          </div>
        ) : filteredAndSortedCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCampaigns.map((camp) => (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                onOpenDetails={(c) => setSelectedCampaign(c)}
                onOpenSupport={(c) => setSupportCampaign(c)}
              />
            ))}
          </div>
        ) : (
          /* User-Specified Tasteful Empty State */
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-xs max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
              <HeartHandshake className="w-7 h-7 text-emerald-700" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">
                {searchQuery || selectedCategory !== 'all' ? 'No matching appeals found' : 'New campaigns are coming soon'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {searchQuery || selectedCategory !== 'all'
                  ? 'No approved appeals match your current filter keywords. Try resetting your search.'
                  : 'Check back to discover opportunities to make an impact. All emergency appeals undergo multi-tier Trustee verification before public publication.'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {searchQuery || selectedCategory !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <>
                  <button
                    onClick={handleOpenCreateAppeal}
                    className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Submit an Appeal for Board Review</span>
                  </button>

                  {onOpenDonate && (
                    <button
                      onClick={onOpenDonate}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>General 80G Tax-Exempt Fund</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          isOpen={Boolean(selectedCampaign)}
          onClose={() => setSelectedCampaign(null)}
          onOpenSupport={(camp) => {
            setSelectedCampaign(null);
            setSupportCampaign(camp);
          }}
        />
      )}

      {/* Support / Contribution Modal */}
      {supportCampaign && (
        <SupportCampaignModal
          campaign={supportCampaign}
          isOpen={Boolean(supportCampaign)}
          onClose={() => {
            setSupportCampaign(null);
            loadApprovedCampaigns(); // Refresh progress counters
          }}
          onDonationSuccess={() => {
            loadApprovedCampaigns();
          }}
        />
      )}

      {/* Submit Appeal Modal */}
      {isCreateOpen && (
        <CreateCampaignModal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            loadApprovedCampaigns();
          }}
        />
      )}
    </section>
  );
};
