/**
 * @license
 * Public Campaign Details View & Case Inspection
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  HeartHandshake, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Copy, 
  Share2, 
  Sparkles, 
  Building, 
  Phone, 
  Mail, 
  Heart,
  Clock,
  ArrowRight,
  Info,
  Shield,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Star,
  Check
} from 'lucide-react';
import { CrowdfundingCampaign, CampaignDonation } from '../../types';
import { fetchCampaignDonations, CAMPAIGN_CATEGORY_CONFIG } from '../../lib/firebase';
import { useConfig } from '../../contexts/ConfigContext';

interface CampaignDetailsModalProps {
  campaign: CrowdfundingCampaign | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSupport: (campaign: CrowdfundingCampaign) => void;
}

export const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onOpenSupport
}) => {
  const { config } = useConfig();
  const [donations, setDonations] = useState<CampaignDonation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && campaign?.id) {
      setActiveImageIndex(0);
      setLoadingDonations(true);
      fetchCampaignDonations(campaign.id, true)
        .then((records) => {
          setDonations(records);
        })
        .catch(() => {
          setDonations([]);
        })
        .finally(() => {
          setLoadingDonations(false);
        });
    }
  }, [isOpen, campaign?.id]);

  if (!isOpen || !campaign) return null;

  const isFeatured = config.featuredCampaignIds && config.featuredCampaignIds.includes(campaign.id);

  const categoryInfo = CAMPAIGN_CATEGORY_CONFIG[campaign.category] || {
    label: campaign.categoryLabel || 'Charitable Case',
    iconName: 'HeartHandshake',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200'
  };

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

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Active';
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: `Support ${campaign.title} on Fatimyah Educational Trust India`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Build images array
  const allImages = [
    ...(campaign.coverImageUrl ? [{ id: 'cover', url: campaign.coverImageUrl, caption: 'Primary Campaign Photo' }] : []),
    ...(campaign.supportingImages || [])
  ];

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" id="campaign-details-modal">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Modal Sticky Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20 rounded-t-3xl">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${categoryInfo.badgeColor}`}>
              {categoryInfo.label}
            </span>
            {isFeatured && (
              <span className="px-3 py-1 rounded-full bg-amber-400 text-amber-950 border border-amber-500 text-xs font-extrabold flex items-center gap-1 shadow-xs">
                <Star className="w-3.5 h-3.5 fill-amber-950" />
                <span>Featured Appeal</span>
              </span>
            )}
            {campaign.isVerifiedByFET && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>FET Board Verified</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer relative"
              title="Share Campaign Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              {copiedLink && (
                <span className="absolute -bottom-7 right-0 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              id="close-campaign-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Title & Metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{campaign.location || `${campaign.district || ''}, ${campaign.state || ''}`}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Campaign Window: {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Ref: {campaign.campaignNumber || campaign.id}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
              {campaign.title}
            </h1>
          </div>

          {/* Gallery / Hero Photo */}
          {allImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 group">
                <img 
                  src={allImages[activeImageIndex]?.url || campaign.coverImageUrl} 
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Carousel Prev/Next Buttons */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                      title="Previous Image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                      title="Next Image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {allImages[activeImageIndex]?.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white p-3 text-xs text-center">
                    {allImages[activeImageIndex].caption}
                  </div>
                )}
              </div>

              {/* Thumbnails if multiple */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-16 w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImageIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Key Financial Progress & CTA Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Funds Raised</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{formatINR(raised)}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Funding Target</span>
                <p className="text-xl sm:text-2xl font-black text-white mt-1">{formatINR(target)}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Remaining Need</span>
                <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{formatINR(remaining)}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Verified Donors</span>
                <p className="text-xl sm:text-2xl font-black text-blue-400 mt-1">{campaign.verifiedDonationsCount || donations.length || 0}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Progress Milestone</span>
                <span className="text-emerald-400">{percentage}% Achieved</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage >= 100 ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(3, percentage)}%` }}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Eligible for Section 80G Tax Exemption (50% Deduction under Form 10BE)</span>
              </div>

              {campaign.status === 'active' ? (
                <button
                  onClick={() => onOpenSupport(campaign)}
                  className="py-3.5 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  id="campaign-support-now-btn"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Support & Contribute Now</span>
                </button>
              ) : (
                <span className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
                  Status: {campaign.status.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Case Narrative & Beneficiary Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: Main Narrative */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Comprehensive Description */}
              <div className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-700" />
                  <span>Appeal Case & Background</span>
                </h2>
                <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  {campaign.description}
                </div>
              </div>

              {/* Beneficiary Profile */}
              {campaign.beneficiaryDescription && (
                <div className="space-y-3">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-700" />
                    <span>Beneficiary & Urgent Requirement</span>
                  </h2>
                  <div className="bg-blue-50/70 border border-blue-200 p-6 rounded-2xl text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {campaign.beneficiaryName && (
                      <p className="font-bold text-blue-950 mb-2">Beneficiary: {campaign.beneficiaryName}</p>
                    )}
                    {campaign.beneficiaryDescription}
                  </div>
                </div>
              )}

              {/* FET India Transparency Declaration */}
              <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Fatimyah Educational Trust Governance Guarantee</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  100% of verified contributions for this appeal are disbursed directly to institutional payees (hospitals, schools, colleges, or authorized relief vendors). All disbursements are audited under the supervision of the FET India Board.
                </p>
              </div>
            </div>

            {/* Right 1 Col: Verified Donors & Case Details */}
            <div className="space-y-6">
              
              {/* Case Summary Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Case Overview
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Category</span>
                    <span className="font-bold text-slate-800">{categoryInfo.label}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Location</span>
                    <span className="font-bold text-slate-800">{campaign.location || `${campaign.district || ''}, ${campaign.state || ''}`}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Verification</span>
                    <span className="font-bold text-emerald-700">Verified by FET</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">80G Tax Benefit</span>
                    <span className="font-bold text-amber-700">50% Deduction</span>
                  </div>
                </div>
              </div>

              {/* Verified Donors Wall */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Recent Contributors
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                    {donations.length} Verified
                  </span>
                </div>

                {loadingDonations ? (
                  <p className="text-xs text-slate-400 text-center py-4">Loading donor ledger...</p>
                ) : donations.length > 0 ? (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {donations.map((d, idx) => (
                      <div key={d.id || idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 truncate">
                            {d.isAnonymous ? 'Anonymous Well-Wisher' : d.donorName}
                          </p>
                          <span className="text-[10px] text-slate-400 block">{formatDate(d.createdAt)}</span>
                        </div>
                        <span className="font-black text-emerald-800 shrink-0">
                          {formatINR(d.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    <HeartHandshake className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <span>Be the first verified contributor for this appeal!</span>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 px-6 flex items-center justify-between rounded-b-3xl">
          <p className="text-xs text-slate-500">
            {config.legalName} • Public Trust Act Registration
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

