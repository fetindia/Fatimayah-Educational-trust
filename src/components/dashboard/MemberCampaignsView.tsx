/**
 * @license
 * Member Dashboard - My Fundraising Campaigns View
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PauseCircle, 
  XCircle, 
  FileText, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  ExternalLink,
  ShieldCheck,
  Building2,
  Info
} from 'lucide-react';
import { CrowdfundingCampaign, CampaignStatus } from '../../types';
import { fetchUserCampaigns, CAMPAIGN_CATEGORY_CONFIG } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CreateCampaignModal } from '../campaigns/CreateCampaignModal';
import { CampaignDetailsModal } from '../campaigns/CampaignDetailsModal';
import { SupportCampaignModal } from '../campaigns/SupportCampaignModal';

export const MemberCampaignsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState<CrowdfundingCampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingCampaign, setEditingCampaign] = useState<CrowdfundingCampaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CrowdfundingCampaign | null>(null);
  const [supportCampaign, setSupportCampaign] = useState<CrowdfundingCampaign | null>(null);

  const loadCampaigns = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const list = await fetchUserCampaigns(currentUser.uid);
      setCampaigns(list);
    } catch (err) {
      console.error('Error loading user campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [currentUser?.uid]);

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.campaignNumber && c.campaignNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-300">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Draft (Unsubmitted)
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Active & Accepting Funds
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-teal-100 text-teal-900 border border-teal-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
            Approved
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            Under Trust Review
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-800 border border-slate-300">
            <PauseCircle className="w-3.5 h-3.5 text-slate-600" />
            Temporarily Paused
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
            Goal Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-700" />
            Review Incomplete / Returned
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-300">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="member-campaigns-view">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-emerald-800/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <HeartHandshake className="w-4 h-4" />
              <span>Fatimyah Crowdfunding & Appeals Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">My Fundraising Appeals</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Track the verification status, financial milestones, and disbursements of your submitted appeals. All cases are independently audited by the Trust Secretariat.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-lg hover:shadow-emerald-600/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2 shrink-0"
            id="open-create-appeal-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Appeal</span>
          </button>
        </div>
      </div>

      {/* Role Independence Callout */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Institutional Governance Note:</strong> Submitting or managing a fundraising appeal is an independent case operation. It does not alter your membership accreditation, volunteer service record, or donor tax status.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title, category, or ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Drafts</option>
            <option value="pending_review">Pending Review</option>
            <option value="active">Active</option>
            <option value="approved">Approved</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected / Returned</option>
          </select>

          <button
            onClick={loadCampaigns}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Campaigns Listing */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-emerald-600 animate-spin" />
          <p className="text-xs font-bold text-slate-600">Loading your registered appeals...</p>
        </div>
      ) : filteredCampaigns.length > 0 ? (
        <div className="space-y-4">
          {filteredCampaigns.map((camp) => {
            const target = Number(camp.targetAmount) || 1;
            const raised = Number(camp.raisedAmount) || 0;
            const percentage = Math.min(100, Math.round((raised / target) * 100));

            return (
              <div 
                key={camp.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all space-y-5"
                id={`member-campaign-${camp.id}`}
              >
                {/* Top Row: Meta & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {camp.campaignNumber || camp.id}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      {CAMPAIGN_CATEGORY_CONFIG[camp.category]?.label || camp.category}
                    </span>
                  </div>
                  <div>
                    {getStatusBadge(camp.status)}
                  </div>
                </div>

                {/* Main Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="lg:col-span-2 space-y-2">
                    <h3 className="text-lg font-black text-slate-900 leading-snug">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {camp.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{camp.location || `${camp.district}, ${camp.state}`}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Created: {new Date(camp.createdAt).toLocaleDateString('en-IN')}</span>
                      </span>
                      {camp.beneficiaryName && (
                        <span className="font-medium text-slate-700">
                          Beneficiary: {camp.beneficiaryName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Raised: <strong className="text-emerald-700">{formatINR(raised)}</strong></span>
                      <span className="text-slate-700">Target: {formatINR(target)}</span>
                    </div>

                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(3, percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{percentage}% Funded</span>
                      <span>{camp.verifiedDonationsCount || 0} Verified Donors</span>
                    </div>
                  </div>
                </div>

                {/* Admin Feedback Box if applicable */}
                {camp.reviewNotes && (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span>Secretariat Review Note:</span>
                    </p>
                    <p className="text-[11px] text-blue-900 leading-relaxed">{camp.reviewNotes}</p>
                  </div>
                )}

                {camp.rejectionReason && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1">
                    <p className="font-bold">Review Feedback / Action Needed:</p>
                    <p className="text-[11px] text-rose-900 leading-relaxed">{camp.rejectionReason}</p>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {camp.isVerifiedByFET ? '✓ Officially Verified by FET India' : 'Pending Board Verification'}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* If Draft or Rejected/Returned, allow resume/edit */}
                    {(camp.status === 'draft' || camp.status === 'rejected') && (
                      <button
                        onClick={() => {
                          setEditingCampaign(camp);
                          setIsCreateOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{camp.status === 'draft' ? 'Resume / Edit Draft' : 'Revise & Resubmit'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedCampaign(camp)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      View Appeal Details
                    </button>
                    {camp.status === 'active' && (
                      <button
                        onClick={() => setSupportCampaign(camp)}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Contribute / Share
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-800">No Fundraising Appeals Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You have not submitted any appeals yet. Click below to submit a verified cause for education, medical assistance, or community relief.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCampaign(null);
              setIsCreateOpen(true);
            }}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Create Your First Appeal
          </button>
        </div>
      )}

      {/* Create / Edit Draft Modal */}
      <CreateCampaignModal
        isOpen={isCreateOpen}
        initialCampaign={editingCampaign}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingCampaign(null);
        }}
        onSuccess={() => {
          loadCampaigns();
        }}
      />

      {/* Details Modal */}
      <CampaignDetailsModal
        isOpen={Boolean(selectedCampaign)}
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        onOpenSupport={(camp) => {
          setSelectedCampaign(null);
          setSupportCampaign(camp);
        }}
      />

      {/* Support Modal */}
      <SupportCampaignModal
        isOpen={Boolean(supportCampaign)}
        campaign={supportCampaign}
        onClose={() => setSupportCampaign(null)}
        onDonationSuccess={() => {
          loadCampaigns();
        }}
      />

    </div>
  );
};
