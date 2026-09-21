/**
 * @license
 * Dedicated Full Webpage: Crowdfunding Appeals & Emergency Humanitarian Cases
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  HeartHandshake, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Heart, 
  Search, 
  SlidersHorizontal, 
  AlertCircle, 
  CreditCard, 
  Users, 
  Building2, 
  ArrowLeft,
  FileCheck2,
  Lock,
  Share2,
  TrendingUp,
  Percent,
  Check
} from 'lucide-react';
import { fetchPublicActiveCampaigns, CAMPAIGN_CATEGORY_CONFIG } from '../../lib/firebase';
import { CrowdfundingCampaign, CampaignCategory } from '../../types';
import { useConfig } from '../../contexts/ConfigContext';
import { CampaignCard } from '../campaigns/CampaignCard';

interface AppealsPageProps {
  onSupportCampaign: (campaign: CrowdfundingCampaign) => void;
  onViewCampaignDetails: (campaign: CrowdfundingCampaign) => void;
  onOpenDonate: (tab?: any) => void;
  onReturnToHome: () => void;
}

export const AppealsPage: React.FC<AppealsPageProps> = ({
  onSupportCampaign,
  onViewCampaignDetails,
  onOpenDonate,
  onReturnToHome
}) => {
  const { config } = useConfig();
  const [campaigns, setCampaigns] = useState<CrowdfundingCampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [urgentOnly, setUrgentOnly] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadCampaigns = async () => {
      try {
        const data = await fetchPublicActiveCampaigns();
        if (isMounted) {
          setCampaigns(data);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Error fetching active campaigns:', e);
        if (isMounted) setLoading(false);
      }
    };
    loadCampaigns();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered & Searched campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const isUrgentCase = c.category === 'emergency_assistance' || c.category === 'medical_assistance' || Boolean((c as any).isUrgent);
      if (urgentOnly && !isUrgentCase) return false;
      if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title?.toLowerCase().includes(q);
        const matchSummary = (c.description || c.beneficiaryDescription)?.toLowerCase().includes(q);
        const matchBeneficiary = c.beneficiaryName?.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchBeneficiary) return false;
      }
      return true;
    });
  }, [campaigns, selectedCategory, searchQuery, urgentOnly]);

  // Aggregate stats
  const totalTarget = campaigns.reduce((acc, c) => acc + (c.targetAmount || 0), 0);
  const totalRaised = campaigns.reduce((acc, c) => acc + (c.raisedAmount || 0), 0);
  const totalDonors = campaigns.reduce((acc, c) => acc + (c.donorsCount || c.verifiedDonationsCount || 0), 0);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <button 
              type="button" 
              onClick={onReturnToHome} 
              className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <span className="text-slate-500">/</span>
            <span className="text-amber-400 font-semibold">Humanitarian Appeals & Crowdfunding</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Section 80G Tax Deductible</span>
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white py-16 sm:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold tracking-wide">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>FATIMYAH EDUCATIONAL TRUST — 100% VERIFIED APPEALS</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Humanitarian Crowdfunding & Medical Appeals
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Transparent, verified appeals for critical surgeries, pediatric care, and urgent higher education grants. Every rupee is monitored with audited hospital invoices and direct bank transfers.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#appeals-grid"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-950/40 transition-all flex items-center gap-2"
              >
                <span>Support an Urgent Case</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => onOpenDonate('general')}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>General Trust Donation (80G)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-rose-400">
                ₹{totalRaised.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-300 font-medium mt-1">Crowdfunded Relief Disbursed</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">
                {totalDonors.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-300 font-medium mt-1">Direct Verified Contributors</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Hospital Direct Transfers</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-sky-400">50%</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Tax Exemption (Sec 80G)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Appeals Listing */}
      <section id="appeals-grid" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Category Selector & Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Appeals ({campaigns.length})
            </button>

            {Object.entries(CAMPAIGN_CATEGORY_CONFIG).map(([catKey, catInfo]) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === catKey
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {catInfo.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                urgentOnly
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Urgent Only</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, hospital, appeal..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>
        </div>

        {/* Campaign Cards Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading verified trust appeals...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Appeals Match Current Filters</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search criteria or toggling off the &ldquo;Urgent Only&rdquo; filter.
            </p>
            <button
              type="button"
              onClick={() => { setSelectedCategory('all'); setUrgentOnly(false); setSearchQuery(''); }}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onOpenSupport={onSupportCampaign}
                onOpenDetails={onViewCampaignDetails}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust Guarantee & Verification Transparency */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Leakage Crowdfunding Assurance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Why Donors Trust FET India Appeals
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Unlike unregulated platforms, Fatimyah Educational Trust operates as a registered public charitable trust with institutional custodianship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Direct Payment to Hospitals</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Relief checks and RTGS transfers are disbursed straight to the billing accounts of accredited hospitals, dialysis centers, and colleges.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Instant 80G Tax Exemption Receipts</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive certified 80G tax exemption receipts for income tax deduction immediately upon successful payment verification.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Case Audits & Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Each appeal undergoes physical field verification, income certification checks, and medical board document review before being published.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Referral Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-rose-900/40 shadow-xl">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-bold">Know a Genuine Case Requiring Emergency Aid?</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              If a student or critical patient in your community requires verified assistance, reach out to our Crowdfunding & Relief Inspectorate with medical estimates or college fee structures.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenDonate('general')}
            className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-950/40 transition-colors shrink-0 cursor-pointer"
          >
            Contribute to General Relief (80G)
          </button>
        </div>
      </section>
    </div>
  );
};
