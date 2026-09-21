/**
 * @license
 * Admin Competition Prizes & Rewards Configuration Modal
 * Fatimyah Educational Trust India (FET India)
 * Super Admin Management of dynamic per-competition prize tiers.
 */

import React, { useState } from 'react';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Award, 
  Gift, 
  Medal, 
  BookOpen, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Competition, CompetitionPrizeTier } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { updateCompetitionPrizes } from '../../../lib/firebase';

interface AdminCompetitionPrizesModalProps {
  competition: Competition;
  onClose: () => void;
  onSuccess: (updated: Competition) => void;
}

const REWARD_TYPES = [
  { value: 'scholarship', label: 'Academic Scholarship', icon: Award },
  { value: 'cash', label: 'Cash Prize / Grant', icon: DollarSign },
  { value: 'medal_trophy', label: 'Medal & Trophy', icon: Medal },
  { value: 'gadget_book', label: 'Laptop / Tablet / Books', icon: BookOpen },
  { value: 'certificate', label: 'Merit Certificate', icon: Gift },
  { value: 'other', label: 'Special Recognition', icon: Sparkles }
];

export const AdminCompetitionPrizesModal: React.FC<AdminCompetitionPrizesModalProps> = ({
  competition,
  onClose,
  onSuccess
}) => {
  const { currentUser, isSuperAdmin } = useAuth();

  // Initialize prize tiers from existing competition record or default structure
  const [tiers, setTiers] = useState<CompetitionPrizeTier[]>(() => {
    if (competition.prizeRewards && competition.prizeRewards.length > 0) {
      return competition.prizeRewards.map(t => ({
        ...t,
        rewardType: t.rewardType || 'scholarship',
        winnerCount: t.winnerCount ?? 1,
        status: t.status || 'active'
      }));
    }
    // If only prizesSummary exists, create initial editable tiers
    if (competition.prizesSummary && competition.prizesSummary.length > 0) {
      return competition.prizesSummary.map((summaryStr, idx) => ({
        id: `pz-${Date.now()}-${idx + 1}`,
        rankPosition: idx + 1,
        title: `${idx + 1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'} Position Prize`,
        rewardAmount: idx === 0 ? 25000 : idx === 1 ? 15000 : idx === 2 ? 10000 : 2000,
        rewardDescription: summaryStr,
        rewardType: idx === 0 ? 'scholarship' : 'medal_trophy',
        winnerCount: 1,
        eligibilityInfo: 'All Registered Eligible Participants',
        status: 'active'
      }));
    }
    return [
      {
        id: `pz-${Date.now()}-1`,
        rankPosition: 1,
        title: '1st National Prize - Kalam Gold Distinction',
        rewardAmount: 25000,
        rewardDescription: 'Gold Medal, Laptop / Tablet & ₹25,000 Academic Scholarship',
        rewardType: 'scholarship',
        winnerCount: 1,
        eligibilityInfo: 'Top National Score',
        status: 'active'
      },
      {
        id: `pz-${Date.now()}-2`,
        rankPosition: 2,
        title: '2nd National Prize - Silver Distinction',
        rewardAmount: 15000,
        rewardDescription: 'Silver Medal, Tablet & ₹15,000 Educational Study Grant',
        rewardType: 'scholarship',
        winnerCount: 1,
        eligibilityInfo: '2nd Highest Score',
        status: 'active'
      },
      {
        id: `pz-${Date.now()}-3`,
        rankPosition: 3,
        title: '3rd National Prize - Bronze Distinction',
        rewardAmount: 10000,
        rewardDescription: 'Bronze Medal & ₹10,000 Educational Study Grant',
        rewardType: 'scholarship',
        winnerCount: 1,
        eligibilityInfo: '3rd Highest Score',
        status: 'active'
      }
    ];
  });

  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<Partial<CompetitionPrizeTier>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Computed summary metrics
  const activeTiers = tiers.filter(t => t.status === 'active');
  const totalPrizePurse = activeTiers.reduce((sum, t) => sum + (Number(t.rewardAmount) || 0), 0);
  const totalWinners = activeTiers.reduce((sum, t) => sum + (Number(t.winnerCount) || 1), 0);

  // Add new tier
  const handleAddNewTier = () => {
    const nextRank = tiers.length > 0 ? Math.max(...tiers.map(t => t.rankPosition)) + 1 : 1;
    const newTier: CompetitionPrizeTier = {
      id: `pz-${Date.now()}-${nextRank}`,
      rankPosition: nextRank,
      title: `${nextRank}${nextRank === 1 ? 'st' : nextRank === 2 ? 'nd' : nextRank === 3 ? 'rd' : 'th'} Prize - Merit Award`,
      rewardAmount: 5000,
      rewardDescription: 'Merit Trophy, Book Hamper & Certificate of Distinction',
      rewardType: 'medal_trophy',
      winnerCount: 1,
      eligibilityInfo: 'Eligible Candidates with Passing Marks',
      status: 'active'
    };
    setTiers([...tiers, newTier]);
    setEditingTierId(newTier.id);
    setEditingForm(newTier);
  };

  // Toggle active/inactive status
  const handleToggleStatus = (id: string) => {
    setTiers(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'active' ? 'inactive' : 'active' };
      }
      return t;
    }));
  };

  // Reorder tiers
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tiers.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newTiers = [...tiers];
    const temp = newTiers[index];
    newTiers[index] = newTiers[targetIndex];
    newTiers[targetIndex] = temp;

    // Renumber rank positions based on order
    const renumbered = newTiers.map((t, idx) => ({ ...t, rankPosition: idx + 1 }));
    setTiers(renumbered);
  };

  // Delete tier
  const handleDeleteTier = (id: string) => {
    const updated = tiers.filter(t => t.id !== id);
    const renumbered = updated.map((t, idx) => ({ ...t, rankPosition: idx + 1 }));
    setTiers(renumbered);
    if (editingTierId === id) {
      setEditingTierId(null);
      setEditingForm({});
    }
  };

  // Start editing a tier
  const handleStartEdit = (tier: CompetitionPrizeTier) => {
    setEditingTierId(tier.id);
    setEditingForm({ ...tier });
  };

  // Save tier from inline edit form
  const handleSaveEdit = () => {
    if (!editingForm.title?.trim()) {
      setErrorMsg('Prize title cannot be empty.');
      return;
    }
    setTiers(prev => prev.map(t => {
      if (t.id === editingTierId) {
        return {
          ...t,
          ...editingForm,
          title: editingForm.title!.trim(),
          rewardAmount: Number(editingForm.rewardAmount) || 0,
          winnerCount: Number(editingForm.winnerCount) || 1,
          rankPosition: Number(editingForm.rankPosition) || t.rankPosition,
          rewardDescription: editingForm.rewardDescription?.trim() || '',
          eligibilityInfo: editingForm.eligibilityInfo?.trim() || '',
          rewardType: editingForm.rewardType || 'scholarship',
          status: editingForm.status || 'active'
        } as CompetitionPrizeTier;
      }
      return t;
    }));
    setEditingTierId(null);
    setEditingForm({});
    setErrorMsg(null);
  };

  // Persist all prize updates to Firestore
  const handleSaveAllPrizes = async () => {
    if (!isSuperAdmin) {
      setErrorMsg('Access Restricted: Only Super Administrators have permissions to modify prize structures.');
      return;
    }

    if (!competition.id) {
      setErrorMsg('Invalid competition record: Missing ID.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessNotice(null);

    try {
      await updateCompetitionPrizes(
        competition.id,
        tiers,
        {
          uid: currentUser?.uid || 'admin',
          email: currentUser?.email || 'admin@fetindia.com',
          isSuperAdmin: true
        }
      );

      // Generate updated prizesSummary
      const prizesSummary = tiers
        .filter(t => t.status === 'active')
        .map(t => {
          const parts = [`#${t.rankPosition} ${t.title}`];
          if (t.rewardAmount && t.rewardAmount > 0) {
            parts.push(`₹${t.rewardAmount.toLocaleString()}`);
          }
          if (t.rewardDescription) {
            parts.push(t.rewardDescription);
          }
          return parts.join(' - ');
        });

      const updatedCompetition: Competition = {
        ...competition,
        prizeRewards: tiers,
        prizesSummary,
        updatedAt: new Date().toISOString()
      };

      setSuccessNotice('Competition prize rewards published to Firestore! All public views updated.');
      onSuccess(updatedCompetition);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving competition prizes:', err);
      setErrorMsg(err?.message || 'Failed to save prize configuration to Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto" id="admin-prizes-modal">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-400">
                <Trophy className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                Manage Competition Prizes & Rewards
              </h3>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-2 pt-0.5">
              <span className="font-bold text-amber-300">{competition.code}</span>
              <span>•</span>
              <span className="truncate max-w-md">{competition.title}</span>
            </p>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Super Admin Notice & Metric Strip */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Tiers</span>
                <span className="text-base font-extrabold text-slate-900">{activeTiers.length} / {tiers.length}</span>
              </div>
              <Award className="w-6 h-6 text-indigo-600/70" />
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Purse Value</span>
                <span className="text-base font-extrabold text-emerald-700">₹{totalPrizePurse.toLocaleString()}</span>
              </div>
              <DollarSign className="w-6 h-6 text-emerald-600/70" />
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Honorees</span>
                <span className="text-base font-extrabold text-amber-700">{totalWinners} Students</span>
              </div>
              <Sparkles className="w-6 h-6 text-amber-500/70" />
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Status Alert Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{errorMsg}</div>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{successNotice}</div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Configured Prize Positions ({tiers.length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Prizes configured here are unique to this competition and update the public portal instantly.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddNewTier}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Add Prize Tier</span>
            </button>
          </div>

          {/* Prize Tiers List */}
          {tiers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No Prize Tiers Configured Yet</p>
              <p className="text-[11px] text-slate-400">Click "Add Prize Tier" above to define rewards for 1st, 2nd, and 3rd rank holders.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tiers.map((tier, idx) => {
                const isEditing = editingTierId === tier.id;
                const isActive = tier.status === 'active';

                if (isEditing) {
                  return (
                    <div key={tier.id} className="p-4 rounded-2xl bg-indigo-50/60 border-2 border-indigo-400 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-950 uppercase flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Editing Rank #{editingForm.rankPosition || tier.rankPosition} Prize</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingTierId(null); setEditingForm({}); }}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Rank Position</label>
                          <input
                            type="number"
                            min="1"
                            value={editingForm.rankPosition ?? tier.rankPosition}
                            onChange={(e) => setEditingForm({ ...editingForm, rankPosition: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Prize Title *</label>
                          <input
                            type="text"
                            placeholder="e.g. 1st National Distinction - Gold Trophy"
                            value={editingForm.title ?? tier.title}
                            onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Cash / Grant Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="e.g. 25000"
                            value={editingForm.rewardAmount ?? tier.rewardAmount ?? ''}
                            onChange={(e) => setEditingForm({ ...editingForm, rewardAmount: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Reward Category</label>
                          <select
                            value={editingForm.rewardType ?? tier.rewardType ?? 'scholarship'}
                            onChange={(e) => setEditingForm({ ...editingForm, rewardType: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold"
                          >
                            {REWARD_TYPES.map(rt => (
                              <option key={rt.value} value={rt.value}>{rt.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Number of Winners</label>
                          <input
                            type="number"
                            min="1"
                            value={editingForm.winnerCount ?? tier.winnerCount ?? 1}
                            onChange={(e) => setEditingForm({ ...editingForm, winnerCount: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block font-bold text-slate-700 mb-1">Reward Description & Items</label>
                          <input
                            type="text"
                            placeholder="e.g. Gold Medal, Core i7 Laptop, Citation & ₹25,000 Academic Grant"
                            value={editingForm.rewardDescription ?? tier.rewardDescription}
                            onChange={(e) => setEditingForm({ ...editingForm, rewardDescription: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Eligibility Criteria</label>
                          <input
                            type="text"
                            placeholder="e.g. Open to all candidates scoring above 85% in assessment"
                            value={editingForm.eligibilityInfo ?? tier.eligibilityInfo ?? ''}
                            onChange={(e) => setEditingForm({ ...editingForm, eligibilityInfo: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-5">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={editingForm.status === 'active'}
                              onChange={(e) => setEditingForm({ ...editingForm, status: e.target.checked ? 'active' : 'inactive' })}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs font-bold text-slate-800">Publish Tier (Active)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={tier.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive 
                        ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300' 
                        : 'bg-slate-50 border-slate-200/60 opacity-60'
                    }`}
                  >
                    {/* Rank Badge & Details */}
                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                        tier.rankPosition === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        tier.rankPosition === 2 ? 'bg-slate-100 text-slate-800 border border-slate-300' :
                        tier.rankPosition === 3 ? 'bg-amber-900/10 text-amber-900 border border-amber-900/20' :
                        'bg-indigo-50 text-indigo-800 border border-indigo-200'
                      }`}>
                        #{tier.rankPosition}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="font-extrabold text-slate-900 text-sm">
                            {tier.title}
                          </h5>

                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                            {tier.rewardType?.replace('_', ' ') || 'Reward'}
                          </span>

                          {tier.winnerCount > 1 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {tier.winnerCount} Honorees
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(tier.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase transition-colors cursor-pointer ${
                              isActive 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200' 
                                : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'
                            }`}
                            title="Click to toggle Active / Inactive"
                          >
                            {isActive ? 'Active' : 'Disabled'}
                          </button>
                        </div>

                        <p className="text-xs text-slate-600">
                          {tier.rewardDescription}
                        </p>

                        {tier.eligibilityInfo && (
                          <p className="text-[11px] text-slate-400">
                            Eligibility: <span className="text-slate-600 font-medium">{tier.eligibilityInfo}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Reward Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {tier.rewardAmount && tier.rewardAmount > 0 ? (
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Value</span>
                          <span className="text-sm font-extrabold text-emerald-700">₹{tier.rewardAmount.toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Value</span>
                          <span className="text-xs font-bold text-slate-500">Citation</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        {/* Move Up */}
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Move Rank Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === tiers.length - 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Move Rank Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(tier)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          title="Edit Prize Tier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTier(tier.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                          title="Delete Prize Tier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Super Administrator Authorized • Dynamic Firestore Synchronization</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAllPrizes}
              disabled={isSaving || !isSuperAdmin}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
              id="save-competition-prizes-btn"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing Prizes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Prize Structure</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
