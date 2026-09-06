/**
 * @license
 * Core Member Management (Super Admin Subsystem)
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Tagline: Education • Service • Empowerment
 */

import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Crown, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Filter, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  Sparkles, 
  Check, 
  X, 
  Clock,
  Layers,
  HeartHandshake,
  BadgeDollarSign,
  Info,
  Building
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { promoteMemberToCoreMember } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { IDCardPrintDownloadModal } from '../idcard/IDCardPrintDownloadModal';
import { Printer } from 'lucide-react';

interface AdminCoreMembersViewProps {
  users: UserProfile[];
  onNotify?: (message: string, type?: 'success' | 'error') => void;
}

export const AdminCoreMembersView: React.FC<AdminCoreMembersViewProps> = ({
  users,
  onNotify
}) => {
  const { currentUser, userProfile: adminProfile } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTier, setFilterTier] = useState<'all' | 'general' | 'core'>('all');
  const [filterState, setFilterState] = useState<string>('all');

  // Member Inspection Modal State
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [cardModalMember, setCardModalMember] = useState<UserProfile | null>(null);

  // Promotion Confirmation Modal State
  const [memberToPromote, setMemberToPromote] = useState<UserProfile | null>(null);
  const [promotionNote, setPromotionNote] = useState<string>('');
  const [isPromoting, setIsPromoting] = useState<boolean>(false);
  const [promotionSuccess, setPromotionSuccess] = useState<boolean>(false);

  // Eligible pool: Users who are approved General Members OR already Core Members
  const memberPool = useMemo(() => {
    return users.filter(u => {
      const isGeneral = u.membershipStatus === 'general_member' || u.roles?.includes('member') || u.primaryRole === 'member';
      const isCore = u.membershipStatus === 'core_member' || u.roles?.includes('core_member') || u.primaryRole === 'core_member';
      return isGeneral || isCore;
    });
  }, [users]);

  // Unique states for filtering
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    memberPool.forEach(m => {
      if (m.state) states.add(m.state);
    });
    return Array.from(states).sort();
  }, [memberPool]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return memberPool.filter(member => {
      // Search matching
      const query = searchQuery.toLowerCase().trim();
      const name = (member.fullLegalName || member.fullName || member.displayName || '').toLowerCase();
      const email = (member.email || '').toLowerCase();
      const mobile = (member.mobileNumber || member.phoneNumber || '').toLowerCase();
      const memberId = (member.membershipId || '').toLowerCase();
      const district = (member.district || member.city || '').toLowerCase();
      const state = (member.state || '').toLowerCase();
      const occupation = (member.occupation || '').toLowerCase();
      const qualification = (member.educationalQualification || member.qualification || '').toLowerCase();

      const matchesSearch = !query || 
        name.includes(query) || 
        email.includes(query) || 
        mobile.includes(query) || 
        memberId.includes(query) || 
        district.includes(query) || 
        state.includes(query) || 
        occupation.includes(query) || 
        qualification.includes(query);

      if (!matchesSearch) return false;

      // Tier filtering
      const isCore = member.membershipStatus === 'core_member' || member.roles?.includes('core_member') || member.primaryRole === 'core_member';
      if (filterTier === 'general' && isCore) return false;
      if (filterTier === 'core' && !isCore) return false;

      // State filtering
      if (filterState !== 'all' && member.state !== filterState) return false;

      return true;
    });
  }, [memberPool, searchQuery, filterTier, filterState]);

  // Counts
  const totalCoreMembers = memberPool.filter(m => m.membershipStatus === 'core_member' || m.roles?.includes('core_member')).length;
  const totalGeneralMembers = memberPool.length - totalCoreMembers;

  // Handle Promotion Confirmation & Execution
  const handleExecutePromotion = async () => {
    if (!memberToPromote || !currentUser) return;

    setIsPromoting(true);
    try {
      await promoteMemberToCoreMember(
        memberToPromote.uid,
        promotionNote,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'Super Admin',
          role: (adminProfile?.primaryRole || 'super_admin') as UserRole
        }
      );

      setPromotionSuccess(true);
      if (onNotify) {
        onNotify(
          `Successfully promoted ${memberToPromote.fullLegalName || memberToPromote.displayName || memberToPromote.email} to Core Member!`,
          'success'
        );
      }

      setTimeout(() => {
        setIsPromoting(false);
        setMemberToPromote(null);
        setPromotionNote('');
        setPromotionSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error('Error promoting member:', err);
      setIsPromoting(false);
      if (onNotify) {
        onNotify(err.message || 'Failed to promote member to Core Member tier.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6" id="admin-core-members-section">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  Trust Governance • Super Admin Authority
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Core Member Management
                </h2>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Core Membership is an exclusive governance appointment reserved for vetted leaders and active trust contributors. Normal users cannot self-register for this tier. As an authorized Super Administrator, you can review accredited General Members and elevate them to the Core Committee.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700/80 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">General Members</span>
              <span className="text-xl font-black text-emerald-400 mt-0.5 block">{totalGeneralMembers}</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-300 block">Core Members</span>
              <span className="text-xl font-black text-amber-400 mt-0.5 block">{totalCoreMembers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Name, Email, Member ID, District, State, Occupation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tier & State Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter Tabs */}
            <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => setFilterTier('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterTier === 'all' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({memberPool.length})
              </button>
              <button
                onClick={() => setFilterTier('general')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterTier === 'general' 
                    ? 'bg-emerald-800 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                General Members ({totalGeneralMembers})
              </button>
              <button
                onClick={() => setFilterTier('core')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterTier === 'core' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Core Members ({totalCoreMembers})
              </button>
            </div>

            {/* State Filter Dropdown */}
            {availableStates.length > 0 && (
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All States / Regions</option>
                {availableStates.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            )}
          </div>

        </div>
      </div>

      {/* Member Records Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Accredited Members Directory ({filteredMembers.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Showing {filteredMembers.length} of {memberPool.length} accredited members
          </span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No Members Matching Criteria</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || filterTier !== 'all' || filterState !== 'all'
                ? 'Try adjusting your search terms or filter selection.'
                : 'Approved General Members will appear here for Core Committee promotion.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Member Name & ID</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Contact & Location</th>
                  <th className="py-3.5 px-4">Active Wings</th>
                  <th className="py-3.5 px-4">Promotion Metadata</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMembers.map((member) => {
                  const isCore = member.membershipStatus === 'core_member' || member.roles?.includes('core_member') || member.primaryRole === 'core_member';
                  const fullName = member.fullLegalName || member.fullName || member.displayName || 'Unnamed Member';
                  const memberId = member.membershipId || `FET-MBR-${member.uid.slice(0, 4).toUpperCase()}`;
                  
                  return (
                    <tr 
                      key={member.uid} 
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name and Member ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCore 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {isCore ? <Crown className="w-4 h-4 text-amber-700" /> : <User className="w-4 h-4 text-emerald-700" />}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block leading-tight">
                              {fullName}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-amber-600 block mt-0.5">
                              {memberId}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-normal">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Current Status Badge */}
                      <td className="py-3.5 px-4">
                        {isCore ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                            <Crown className="w-3 h-3 text-amber-700" />
                            Core Member
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            General Member
                          </span>
                        )}
                      </td>

                      {/* Contact & Location */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px] text-slate-600">
                          {member.mobileNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{member.mobileNumber}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {[member.district || member.city, member.state].filter(Boolean).join(', ') || 'Location Unspecified'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Status Separation */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          {member.volunteerStatus === 'active_volunteer' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                              Volunteer
                            </span>
                          )}
                          {member.donorStatus === 'active_donor' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Donor
                            </span>
                          )}
                          {member.volunteerStatus !== 'active_volunteer' && member.donorStatus !== 'active_donor' && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              Standard Wing
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Promotion Metadata */}
                      <td className="py-3.5 px-4">
                        {isCore && member.promotedAt ? (
                          <div className="space-y-0.5 text-[10px]">
                            <div className="flex items-center gap-1 text-slate-700 font-bold">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{new Date(member.promotedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            {member.promotedByEmail && (
                              <span className="text-slate-400 block truncate max-w-[140px]" title={member.promotedByEmail}>
                                By: {member.promotedByEmail}
                              </span>
                            )}
                            {member.promotionNote && (
                              <span className="text-amber-800 font-medium block truncate max-w-[140px]" title={member.promotionNote}>
                                "{member.promotionNote}"
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-normal italic">
                            Eligible for promotion
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedMember(member)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                          >
                            Profile
                          </button>

                          {!isCore ? (
                            <button
                              onClick={() => {
                                setMemberToPromote(member);
                                setPromotionNote('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                            >
                              <Crown className="w-3.5 h-3.5" />
                              <span>Promote</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-500 text-[11px] font-bold">
                              Promoted
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: PROMOTION CONFIRMATION MODAL */}
      {memberToPromote && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-600">
                    Governance Elevation Workflow
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    Promote to Core Member
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isPromoting) setMemberToPromote(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Member Summary Card */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Candidate Name:</span>
                <span className="font-extrabold text-slate-900">
                  {memberToPromote.fullLegalName || memberToPromote.fullName || memberToPromote.displayName || 'Member'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Email Address:</span>
                <span className="font-mono text-slate-700">{memberToPromote.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Trust ID:</span>
                <span className="font-mono font-bold text-amber-700">
                  {memberToPromote.membershipId || `FET-MBR-${memberToPromote.uid.slice(0, 4).toUpperCase()}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Current Membership Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                  General Member
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60">
                <span className="text-slate-500 font-medium">New Designated Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-950 border border-amber-300">
                  Core Member (Appointed)
                </span>
              </div>
            </div>

            {/* Governance Confirmation Note */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Internal Promotion Note / Resolution (Optional)
              </label>
              <textarea
                rows={3}
                value={promotionNote}
                onChange={(e) => setPromotionNote(e.target.value)}
                placeholder="e.g., Appointed to Core Committee pursuant to Board of Trustees resolution dated August 2026 for outstanding educational outreach in district."
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500">
                This note will be logged in the immutable system audit trail and attached to the member's permanent governance profile.
              </p>
            </div>

            {/* Administrator Authorization Stamp */}
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span>Authorizing Super Admin:</span>
              <span className="font-mono font-bold text-slate-800">{currentUser?.email}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMemberToPromote(null)}
                disabled={isPromoting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePromotion}
                disabled={isPromoting}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
              >
                {isPromoting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Saving Promotion...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>Confirm Promotion to Core Member</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: FULL MEMBER PROFILE INSPECTION MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 ${
                  selectedMember.membershipStatus === 'core_member'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {selectedMember.membershipStatus === 'core_member' ? <Crown className="w-6 h-6 text-amber-700" /> : <User className="w-6 h-6 text-emerald-700" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {selectedMember.fullLegalName || selectedMember.fullName || selectedMember.displayName || 'Member Profile'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-amber-700">
                      {selectedMember.membershipId || `FET-MBR-${selectedMember.uid.slice(0, 4).toUpperCase()}`}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-mono">{selectedMember.email}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Membership Tier</span>
                <div className="font-extrabold text-slate-900 mt-0.5">
                  {selectedMember.membershipStatus === 'core_member' ? 'Core Member' : 'General Member'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Volunteer Wing</span>
                <div className="font-extrabold text-slate-700 mt-0.5">
                  {selectedMember.volunteerStatus === 'active_volunteer' ? 'Active Volunteer' : 'None'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Donor Wing</span>
                <div className="font-extrabold text-slate-700 mt-0.5">
                  {selectedMember.donorStatus === 'active_donor' ? 'Active Donor' : 'None'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Account Status</span>
                <div className="font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </div>
              </div>
            </div>

            {/* Core Member Elevation History (If already promoted) */}
            {selectedMember.membershipStatus === 'core_member' && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold">
                  <Crown className="w-4 h-4 text-amber-700" />
                  <span>Core Membership Appointment Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Appointment Date</span>
                    <span className="font-bold">
                      {selectedMember.promotedAt ? new Date(selectedMember.promotedAt).toLocaleString() : 'Pre-configured'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Authorizing Admin</span>
                    <span className="font-mono text-[11px]">
                      {selectedMember.promotedByEmail || selectedMember.promotedBy || 'Trust Secretariat'}
                    </span>
                  </div>
                </div>
                {selectedMember.promotionNote && (
                  <div className="pt-2 border-t border-amber-200/60 text-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Appointment Note</span>
                    <p className="text-[11px] italic mt-0.5">"{selectedMember.promotionNote}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Personal & Contact Particulars */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Personal & Contact Particulars
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Mobile Phone</span>
                  <div className="font-medium text-slate-900">{selectedMember.mobileNumber || selectedMember.phoneNumber || 'Not provided'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Country of Residence</span>
                  <div className="font-medium text-slate-900">{selectedMember.country || 'India'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">State / Province</span>
                  <div className="font-medium text-slate-900">{selectedMember.state || 'Not provided'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">District / City</span>
                  <div className="font-medium text-slate-900">{selectedMember.district || selectedMember.city || 'Not provided'}</div>
                </div>
              </div>

              {selectedMember.address && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Full Postal Address</span>
                  <div className="font-medium text-slate-900">{selectedMember.address}</div>
                </div>
              )}
            </div>

            {/* Professional & Academic Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Academic & Professional Profile
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Educational Qualification</span>
                  <div className="font-medium text-slate-900">{selectedMember.educationalQualification || selectedMember.qualification || 'Not specified'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Occupation</span>
                  <div className="font-medium text-slate-900">{selectedMember.occupation || 'Not specified'}</div>
                </div>
              </div>
            </div>

              {/* Modal Footer / Quick Action */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>

                <button
                  onClick={() => setCardModalMember(selectedMember)}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Official ID Card</span>
                </button>
              </div>

              {selectedMember.membershipStatus !== 'core_member' && !selectedMember.roles?.includes('core_member') && (
                <button
                  onClick={() => {
                    const target = selectedMember;
                    setSelectedMember(null);
                    setMemberToPromote(target);
                    setPromotionNote('');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Crown className="w-4 h-4" />
                  <span>Promote to Core Member</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: OFFICIAL IDENTITY CARD PRINT & DOWNLOAD MODAL */}
      {cardModalMember && (
        <IDCardPrintDownloadModal
          isOpen={true}
          onClose={() => setCardModalMember(null)}
          category={
            cardModalMember.membershipStatus === 'core_member' || cardModalMember.roles?.includes('core_member')
              ? 'core_member'
              : 'general_member'
          }
          cardId={cardModalMember.membershipId || `FET-MBR-${cardModalMember.uid.slice(0, 6).toUpperCase()}`}
          fullName={cardModalMember.fullLegalName || cardModalMember.fullName || cardModalMember.displayName || 'Member'}
          fatherName={cardModalMember.fatherName || cardModalMember.guardianName}
          roleTitle={
            cardModalMember.membershipStatus === 'core_member' || cardModalMember.roles?.includes('core_member')
              ? 'CORE COMMITTEE MEMBER'
              : 'GENERAL MEMBER'
          }
          issueDate={cardModalMember.promotedAt || cardModalMember.membershipApprovedAt || cardModalMember.createdAt || '2026-01-01'}
          validUntil="AY 2026-2027"
          photoURL={cardModalMember.photoURL}
          bloodGroup={cardModalMember.bloodGroup}
          district={cardModalMember.district || cardModalMember.city}
          state={cardModalMember.state}
          country={cardModalMember.country || 'India'}
          email={cardModalMember.email}
          onNotify={onNotify}
        />
      )}

    </div>
  );
};
