/**
 * @license
 * Campaign Card Component
 * Fatimyah Educational Trust India (FET India)
 */

import React from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  HeartHandshake, 
  Clock, 
  TrendingUp,
  CheckCircle2,
  Users,
  ArrowRight,
  Sparkles,
  Share2,
  Star
} from 'lucide-react';
import { CrowdfundingCampaign } from '../../types';
import { CAMPAIGN_CATEGORY_CONFIG } from '../../lib/firebase';
import { useConfig } from '../../contexts/ConfigContext';

interface CampaignCardProps {
  campaign: CrowdfundingCampaign;
  onOpenDetails: (campaign: CrowdfundingCampaign) => void;
  onOpenSupport: (campaign: CrowdfundingCampaign) => void;
  isFeatured?: boolean;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onOpenDetails,
  onOpenSupport,
  isFeatured = false
}) => {
  const { config } = useConfig();
  const categoryInfo = CAMPAIGN_CATEGORY_CONFIG[campaign.category] || {
    label: campaign.categoryLabel || 'Charitable Appeal',
    iconName: 'HeartHandshake',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200'
  };

  const isActuallyFeatured = isFeatured || (config.featuredCampaignIds && config.featuredCampaignIds.includes(campaign.id));

  const target = Number(campaign.targetAmount) || 1;
  const raised = Number(campaign.raisedAmount) || 0;
  const remaining = Math.max(0, target - raised);
  const percentage = Math.min(100, Math.round((raised / target) * 100));

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Status Badge Logic
  const getStatusBadge = () => {
    switch (campaign.status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">Active Appeal</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">Goal Reached</span>;
      case 'paused':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300">Temporarily Paused</span>;
      case 'closed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">Closed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">{campaign.status}</span>;
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: `Support this verified appeal on FET India: ${campaign.title}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/#donate`);
    }
  };

  return (
    <div 
      className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer ${
        isActuallyFeatured 
          ? 'border-amber-400 shadow-md hover:shadow-xl ring-1 ring-amber-300' 
          : 'border-slate-200 shadow-xs hover:shadow-xl'
      }`}
      onClick={() => onOpenDetails(campaign)}
      id={`campaign-card-${campaign.id || campaign.campaignNumber}`}
    >
      {/* Cover Image Header */}
      <div className="relative h-48 sm:h-52 bg-slate-900 overflow-hidden">
        {campaign.coverImageUrl ? (
          <img 
            src={campaign.coverImageUrl} 
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-950 to-slate-950 text-white text-center">
            <HeartHandshake className="w-12 h-12 text-amber-400/80 mb-2" />
            <p className="text-xs font-bold text-slate-200">Fatimyah Educational Trust Appeal</p>
            <span className="text-[10px] text-emerald-300">{categoryInfo.label}</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-md ${categoryInfo.badgeColor}`}>
              {categoryInfo.label}
            </span>
            {isActuallyFeatured && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-400 text-amber-950 border border-amber-500 shadow-xs flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-950" />
                <span>Featured</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {getStatusBadge()}
          </div>
        </div>

        {/* FET Verification Badge Bottom Left */}
        {campaign.isVerifiedByFET && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>FET India Verified</span>
          </div>
        )}

        {/* Share Button Top Right */}
        <button
          onClick={handleShare}
          className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
          title="Share Appeal"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Location & Case ID */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[150px]">{campaign.location || `${campaign.district || ''}, ${campaign.state || ''}`}</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">{campaign.campaignNumber || 'FET Appeal'}</span>
          </div>

          {/* Title */}
          <h3 className="text-base font-black text-slate-900 line-clamp-2 group-hover:text-emerald-800 transition-colors leading-snug">
            {campaign.title}
          </h3>

          {/* Beneficiary Summary */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {campaign.description || campaign.beneficiaryDescription}
          </p>
        </div>

        {/* Financial Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Raised</span>
              <span className="font-black text-emerald-800 text-sm">{formatINR(raised)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Target Goal</span>
              <span className="font-bold text-slate-800 text-sm">{formatINR(target)}</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentage >= 100 
                  ? 'bg-blue-600' 
                  : percentage >= 50 
                  ? 'bg-emerald-600' 
                  : 'bg-amber-600'
              }`}
              style={{ width: `${Math.max(4, percentage)}%` }}
            />
          </div>

          {/* Stats Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <strong className="text-slate-800">{percentage}%</strong> funded
            </span>
            <span className="text-slate-500">
              {remaining > 0 ? `${formatINR(remaining)} needed` : 'Goal Completed'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(campaign);
            }}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-center cursor-pointer"
          >
            View Case Details
          </button>

          {campaign.status === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSupport(campaign);
              }}
              className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1"
            >
              <span>Contribute</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
