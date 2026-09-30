/**
 * @license
 * Super Admin People & Professional Demographics Console
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides database-backed demographics, occupation categorization,
 * people-type separation, multi-attribute filtering, and profile inspection.
 * Strictly enforces Super Admin authorization and uses the existing design system.
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Briefcase, 
  GraduationCap, 
  HeartHandshake, 
  BadgeDollarSign, 
  Crown, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Eye, 
  Download, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  BookOpen, 
  Stethoscope, 
  Compass, 
  Award,
  Layers,
  ChevronDown
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { INDIAN_STATES_AND_UTS } from '../../data/indiaLocations';
import { useAuth } from '../../contexts/AuthContext';

export interface AdminPeopleDemographicsViewProps {
  users: UserProfile[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const PROFESSIONAL_CATEGORIES = [
  'Doctor',
  'Engineer',
  'Teacher',
  'Farmer',
  'Architect',
  'Businessman / Businesswoman',
  'Government Employee',
  'Private Employee',
  'Healthcare Professional',
  'Religious / Madrasa Teacher',
  'Student',
  'Homemaker / Householder',
  'Self-Employed',
  'Skilled Worker',
  'Unskilled Worker',
  'Professional',
  'Other'
] as const;

export type ProfessionalCategory = typeof PROFESSIONAL_CATEGORIES[number];

/**
 * Categorize occupation string into one of the standardized professional categories
 * while strictly preserving the original user-entered occupation text.
 */
export function categorizeOccupation(occupation?: string, qualification?: string, roles?: UserRole[]): ProfessionalCategory {
  if (!occupation && !qualification) {
    if (roles?.includes('student')) return 'Student';
    return 'Other';
  }

  const text = `${occupation || ''} ${qualification || ''}`.toLowerCase().trim();

  if (text.includes('doctor') || text.includes('mbbs') || text.includes('bams') || text.includes('bds') || text.includes('surgeon') || text.includes('physician') || text.includes('dentist')) {
    return 'Doctor';
  }
  if (text.includes('engineer') || text.includes('b.tech') || text.includes('b.e') || text.includes('software') || text.includes('civil') || text.includes('mechanical') || text.includes('developer')) {
    return 'Engineer';
  }
  if (text.includes('madrasa') || text.includes('religious') || text.includes('aalim') || text.includes('hafiz') || text.includes('imam') || text.includes('moulana') || text.includes('qari')) {
    return 'Religious / Madrasa Teacher';
  }
  if (text.includes('teacher') || text.includes('professor') || text.includes('lecturer') || text.includes('faculty') || text.includes('educator') || text.includes('principal') || text.includes('tutor') || text.includes('b.ed')) {
    return 'Teacher';
  }
  if (text.includes('nurse') || text.includes('pharmacist') || text.includes('healthcare') || text.includes('paramedic') || text.includes('hospital') || text.includes('clinic') || text.includes('medical')) {
    return 'Healthcare Professional';
  }
  if (text.includes('architect') || text.includes('interior design') || text.includes('b.arch')) {
    return 'Architect';
  }
  if (text.includes('farmer') || text.includes('agriculture') || text.includes('farming') || text.includes('cultivator')) {
    return 'Farmer';
  }
  if (text.includes('business') || text.includes('merchant') || text.includes('trader') || text.includes('shopkeeper') || text.includes('entrepreneur') || text.includes('retailer')) {
    return 'Businessman / Businesswoman';
  }
  if (text.includes('gov') || text.includes('government') || text.includes('civil servant') || text.includes('ias') || text.includes('ips') || text.includes('jkps') || text.includes('clerk') || text.includes('officer')) {
    return 'Government Employee';
  }
  if (text.includes('private') || text.includes('corporate') || text.includes('mnc') || text.includes('executive') || text.includes('manager')) {
    return 'Private Employee';
  }
  if (text.includes('student') || roles?.includes('student') || text.includes('scholar') || text.includes('pursuing')) {
    return 'Student';
  }
  if (text.includes('homemaker') || text.includes('housewife') || text.includes('home maker') || text.includes('householder')) {
    return 'Homemaker / Householder';
  }
  if (text.includes('self-employed') || text.includes('self employed') || text.includes('freelancer') || text.includes('consultant')) {
    return 'Self-Employed';
  }
  if (text.includes('electrician') || text.includes('plumber') || text.includes('mechanic') || text.includes('carpenter') || text.includes('technician') || text.includes('artisan') || text.includes('driver')) {
    return 'Skilled Worker';
  }
  if (text.includes('labor') || text.includes('labour') || text.includes('helper') || text.includes('worker') || text.includes('unskilled')) {
    return 'Unskilled Worker';
  }
  if (text.includes('advocate') || text.includes('lawyer') || text.includes('ca') || text.includes('chartered') || text.includes('professional') || text.includes('accountant') || text.includes('auditor')) {
    return 'Professional';
  }

  return 'Other';
}

/**
 * Determine a primary person / profile type for a user
 */
export function getPersonType(user: UserProfile): string {
  if (user.roles?.includes('super_admin') || user.primaryRole === 'super_admin') return 'Super Admin';
  if (user.membershipStatus === 'core_member' || user.roles?.includes('core_member') || user.primaryRole === 'core_member') return 'Core Member';
  if (user.roles?.includes('student') || user.studentId || (user.occupation && user.occupation.toLowerCase().includes('student'))) return 'Student';
  
  const occ = (user.occupation || '').toLowerCase();
  if ((user.roles as string[])?.includes('teacher') || occ.includes('teacher') || occ.includes('professor') || occ.includes('lecturer')) return 'Teacher';
  
  if (user.membershipType === 'life_member' || (user.membershipStatus as string) === 'life_member') return 'Life Member';
  if (user.volunteerStatus === 'active_volunteer' || user.volunteerStatus === 'approved' || user.roles?.includes('volunteer')) return 'Volunteer';
  if (user.donorStatus === 'active_donor' || user.donorStatus === 'approved' || user.roles?.includes('donor')) return 'Donor';
  if (user.membershipStatus === 'general_member' || user.roles?.includes('member') || user.primaryRole === 'member') return 'General Member';
  if (user.roles?.some(r => r.endsWith('_admin'))) return 'Administrator';
  
  return 'Registered User';
}

export const AdminPeopleDemographicsView: React.FC<AdminPeopleDemographicsViewProps> = ({
  users,
  isLoading = false,
  onRefresh
}) => {
  const { isSuperAdmin } = useAuth();

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfCategory, setSelectedProfCategory] = useState<string>('all');
  const [selectedPeopleType, setSelectedPeopleType] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedMembershipCategory, setSelectedMembershipCategory] = useState<string>('all');
  const [selectedMembershipStatus, setSelectedMembershipStatus] = useState<string>('all');
  const [selectedVolunteerStatus, setSelectedVolunteerStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Selected User for Detailed Profile Modal
  const [inspectUser, setInspectUser] = useState<(UserProfile & { calculatedProfCategory?: string; calculatedPersonType?: string }) | null>(null);

  // Available districts for chosen state
  const availableDistricts = useMemo(() => {
    if (selectedState === 'all') return [];
    const stateObj = INDIAN_STATES_AND_UTS.find(s => s.state === selectedState);
    return stateObj ? stateObj.districts : [];
  }, [selectedState]);

  // Compute live demographics and categorization for each user
  const userEnrichedList = useMemo(() => {
    return users.map(user => {
      const profCategory = categorizeOccupation(user.occupation, user.educationalQualification || user.qualification, user.roles);
      const personType = getPersonType(user);
      return {
        ...user,
        calculatedProfCategory: profCategory,
        calculatedPersonType: personType
      };
    });
  }, [users]);

  // Filtered List
  const filteredUsers = useMemo(() => {
    return userEnrichedList.filter(user => {
      // 1. General Search Query (Name, Email, Mobile, Membership ID, Exact Occupation)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (user.fullLegalName || user.fullName || user.displayName || '').toLowerCase().includes(q);
        const matchesEmail = (user.email || '').toLowerCase().includes(q);
        const matchesMobile = (user.mobileNumber || user.phoneNumber || '').toLowerCase().includes(q);
        const matchesMemberId = (user.membershipId || user.memberId || '').toLowerCase().includes(q);
        const matchesOccupation = (user.occupation || '').toLowerCase().includes(q);
        const matchesDistrict = (user.district || '').toLowerCase().includes(q);
        const matchesState = (user.state || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesMobile && !matchesMemberId && !matchesOccupation && !matchesDistrict && !matchesState) {
          return false;
        }
      }

      // 2. Professional Category Filter
      if (selectedProfCategory !== 'all' && user.calculatedProfCategory !== selectedProfCategory) {
        return false;
      }

      // 3. Person / Profile Type Filter
      if (selectedPeopleType !== 'all') {
        if (selectedPeopleType === 'Student') {
          const isStudent = user.calculatedPersonType === 'Student' || user.roles?.includes('student') || user.studentId || (user.occupation || '').toLowerCase().includes('student');
          if (!isStudent) return false;
        } else if (selectedPeopleType === 'Teacher') {
          const isTeacher = user.calculatedPersonType === 'Teacher' || (user.roles as string[])?.includes('teacher') || (user.occupation || '').toLowerCase().includes('teacher');
          if (!isTeacher) return false;
        } else if (selectedPeopleType === 'General Member') {
          const isGenMember = user.membershipStatus === 'general_member' || user.membershipType === 'general_member' || user.calculatedPersonType === 'General Member';
          if (!isGenMember) return false;
        } else if (selectedPeopleType === 'Life Member') {
          const isLifeMember = user.membershipType === 'life_member' || (user.membershipStatus as string) === 'life_member';
          if (!isLifeMember) return false;
        } else if (selectedPeopleType === 'Volunteer') {
          const isVol = user.volunteerStatus === 'active_volunteer' || user.volunteerStatus === 'approved' || user.roles?.includes('volunteer');
          if (!isVol) return false;
        } else if (selectedPeopleType === 'Donor') {
          const isDon = user.donorStatus === 'active_donor' || user.donorStatus === 'approved' || user.roles?.includes('donor');
          if (!isDon) return false;
        } else if (selectedPeopleType === 'Core Member') {
          const isCore = user.membershipStatus === 'core_member' || user.roles?.includes('core_member');
          if (!isCore) return false;
        } else if (user.calculatedPersonType !== selectedPeopleType) {
          return false;
        }
      }

      // 4. Gender Filter
      if (selectedGender !== 'all') {
        const g = (user.gender || '').toLowerCase();
        if (selectedGender === 'male' && g !== 'male') return false;
        if (selectedGender === 'female' && g !== 'female') return false;
        if (selectedGender === 'other' && (g === 'male' || g === 'female' || !g)) return false;
      }

      // 5. State Filter
      if (selectedState !== 'all' && (user.state || '').toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }

      // 6. District Filter
      if (selectedDistrict !== 'all' && (user.district || '').toLowerCase() !== selectedDistrict.toLowerCase()) {
        return false;
      }

      // 7. Membership Category
      if (selectedMembershipCategory !== 'all') {
        if (selectedMembershipCategory === 'core_member' && user.membershipStatus !== 'core_member' && user.membershipType !== 'core_member') return false;
        if (selectedMembershipCategory === 'general_member' && user.membershipStatus !== 'general_member' && user.membershipType !== 'general_member') return false;
        if (selectedMembershipCategory === 'life_member' && user.membershipType !== 'life_member') return false;
        if (selectedMembershipCategory === 'non_member' && user.membershipStatus && user.membershipStatus !== 'none') return false;
      }

      // 8. Membership Status
      if (selectedMembershipStatus !== 'all') {
        const ms = (user.membershipStatus || 'none') as string;
        if (selectedMembershipStatus === 'active' && ms !== 'general_member' && ms !== 'core_member' && ms !== 'life_member') return false;
        if (selectedMembershipStatus === 'pending' && ms !== 'pending' && ms !== 'under_review') return false;
        if (selectedMembershipStatus === 'suspended' && ms !== 'rejected') return false;
        if (selectedMembershipStatus === 'none' && ms !== 'none') return false;
      }

      // 9. Volunteer Status
      if (selectedVolunteerStatus !== 'all') {
        const vs = user.volunteerStatus || 'none';
        if (selectedVolunteerStatus === 'active' && vs !== 'active_volunteer' && vs !== 'approved') return false;
        if (selectedVolunteerStatus === 'pending' && vs !== 'pending' && vs !== 'under_review') return false;
        if (selectedVolunteerStatus === 'none' && vs !== 'none') return false;
      }

      return true;
    });
  }, [
    userEnrichedList,
    searchQuery,
    selectedProfCategory,
    selectedPeopleType,
    selectedGender,
    selectedState,
    selectedDistrict,
    selectedMembershipCategory,
    selectedMembershipStatus,
    selectedVolunteerStatus
  ]);

  // Aggregate Metrics (Computed Real-Time from Database records)
  const totalCount = users.length;
  const filteredCount = filteredUsers.length;
  const totalMembers = users.filter(u => u.membershipStatus === 'general_member' || u.membershipStatus === 'core_member' || u.membershipType === 'general_member' || u.membershipType === 'core_member' || u.roles?.includes('member')).length;
  const totalStudents = users.filter(u => u.roles?.includes('student') || u.studentId || (u.occupation || '').toLowerCase().includes('student')).length;
  const totalTeachers = users.filter(u => (u.roles as string[])?.includes('teacher') || (u.occupation || '').toLowerCase().includes('teacher') || (u.occupation || '').toLowerCase().includes('professor') || (u.occupation || '').toLowerCase().includes('lecturer')).length;
  const totalVolunteers = users.filter(u => u.volunteerStatus === 'active_volunteer' || u.volunteerStatus === 'approved' || u.roles?.includes('volunteer')).length;
  const totalDonors = users.filter(u => u.donorStatus === 'active_donor' || u.donorStatus === 'approved' || u.roles?.includes('donor')).length;
  const totalMales = users.filter(u => (u.gender || '').toLowerCase() === 'male').length;
  const totalFemales = users.filter(u => (u.gender || '').toLowerCase() === 'female').length;
  const totalProfessionals = users.filter(u => {
    const cat = categorizeOccupation(u.occupation, u.educationalQualification || u.qualification, u.roles);
    return ['Doctor', 'Engineer', 'Architect', 'Healthcare Professional', 'Teacher', 'Professional', 'Religious / Madrasa Teacher'].includes(cat);
  }).length;

  // Category counts breakdown
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PROFESSIONAL_CATEGORIES.forEach(cat => { counts[cat] = 0; });
    userEnrichedList.forEach(u => {
      counts[u.calculatedProfCategory] = (counts[u.calculatedProfCategory] || 0) + 1;
    });
    return counts;
  }, [userEnrichedList]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedProfCategory('all');
    setSelectedPeopleType('all');
    setSelectedGender('all');
    setSelectedState('all');
    setSelectedDistrict('all');
    setSelectedMembershipCategory('all');
    setSelectedMembershipStatus('all');
    setSelectedVolunteerStatus('all');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = [
      'Membership ID',
      'Name',
      'Email',
      'Mobile',
      'Gender',
      'Profile Type',
      'Exact Occupation',
      'Professional Category',
      'Educational Qualification',
      'State',
      'District',
      'City',
      'Membership Status',
      'Volunteer Status',
      'Donor Status'
    ];

    const rows = filteredUsers.map(u => [
      `"${u.membershipId || u.memberId || 'N/A'}"`,
      `"${u.fullLegalName || u.fullName || u.displayName || 'N/A'}"`,
      `"${u.email || 'N/A'}"`,
      `"${u.mobileNumber || u.phoneNumber || 'N/A'}"`,
      `"${u.gender || 'Not specified'}"`,
      `"${u.calculatedPersonType}"`,
      `"${(u.occupation || 'Not specified').replace(/"/g, '""')}"`,
      `"${u.calculatedProfCategory}"`,
      `"${(u.educationalQualification || u.qualification || 'N/A').replace(/"/g, '""')}"`,
      `"${u.state || 'N/A'}"`,
      `"${u.district || 'N/A'}"`,
      `"${u.city || 'N/A'}"`,
      `"${u.membershipStatus || 'none'}"`,
      `"${u.volunteerStatus || 'none'}"`,
      `"${u.donorStatus || 'none'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FET_India_Demographics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="fet-people-demographics-root">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  People & Professional Demographics
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Super Admin Governance
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Unified census, professional taxonomy, geographical clustering & demographic intelligence across India
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-xs font-bold inline-flex items-center gap-1.5"
                title="Refresh Demographics"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Filtered Census ({filteredUsers.length})</span>
            </button>
          </div>
        </div>

        {/* Real Database Summary Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total People</span>
            <div className="text-2xl font-black text-slate-900">{totalCount}</div>
            <span className="text-[10px] font-semibold text-slate-500">Live Registered Profiles</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Members</span>
            <div className="text-2xl font-black text-emerald-950">{totalMembers}</div>
            <span className="text-[10px] font-semibold text-emerald-700">General & Core Members</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800">Students</span>
            <div className="text-2xl font-black text-blue-950">{totalStudents}</div>
            <span className="text-[10px] font-semibold text-blue-700">Exam / School / College</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800">Teachers</span>
            <div className="text-2xl font-black text-purple-950">{totalTeachers}</div>
            <span className="text-[10px] font-semibold text-purple-700">School / Madrasa / Univ</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Volunteers & Donors</span>
            <div className="text-2xl font-black text-amber-950">{totalVolunteers} <span className="text-sm font-semibold text-slate-500">/</span> {totalDonors}</div>
            <span className="text-[10px] font-semibold text-amber-700">{totalVolunteers} Vol • {totalDonors} Donors</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800">Professionals</span>
            <div className="text-2xl font-black text-indigo-950">{totalProfessionals}</div>
            <span className="text-[10px] font-semibold text-indigo-700">{totalMales} M • {totalFemales} F</span>
          </div>

        </div>

        {/* Professional Category Breakdown Quick Filter Chips */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              <span>Professional Categories (Quick Select)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Click category to filter people</span>
          </div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => { setSelectedProfCategory('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedProfCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>All Professions</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${selectedProfCategory === 'all' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'}`}>
                {totalCount}
              </span>
            </button>

            {PROFESSIONAL_CATEGORIES.map(category => {
              const count = categoryCounts[category] || 0;
              const isSelected = selectedProfCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => { setSelectedProfCategory(isSelected ? 'all' : category); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : count > 0 
                        ? 'bg-slate-100 text-slate-800 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200/60' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span>{category}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200/80 text-slate-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Advanced Filter Matrix Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Multi-Attribute Search & Demographic Filters
            </h3>
          </div>
          {(searchQuery || selectedProfCategory !== 'all' || selectedPeopleType !== 'all' || selectedGender !== 'all' || selectedState !== 'all' || selectedDistrict !== 'all' || selectedMembershipCategory !== 'all' || selectedMembershipStatus !== 'all' || selectedVolunteerStatus !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by Name, Authorized Email, Mobile, Membership ID, or Entered Profession..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 6 Combined Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          
          {/* 1. People / Profile Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Person / Profile Type
            </label>
            <select
              value={selectedPeopleType}
              onChange={(e) => { setSelectedPeopleType(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="all">All Profile Types</option>
              <option value="Student">Students</option>
              <option value="Teacher">Teachers / Faculty</option>
              <option value="General Member">General Members</option>
              <option value="Life Member">Life Members</option>
              <option value="Volunteer">Volunteers</option>
              <option value="Donor">Donors / Patrons</option>
              <option value="Core Member">Core Members</option>
              <option value="Administrator">Administrators</option>
            </select>
          </div>

          {/* 2. Professional Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Professional Category
            </label>
            <select
              value={selectedProfCategory}
              onChange={(e) => { setSelectedProfCategory(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="all">All Professions ({totalCount})</option>
              {PROFESSIONAL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat} ({categoryCounts[cat] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Gender */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Gender
            </label>
            <select
              value={selectedGender}
              onChange={(e) => { setSelectedGender(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="all">All Genders</option>
              <option value="male">Male ({totalMales})</option>
              <option value="female">Female ({totalFemales})</option>
              <option value="other">Other / Unspecified</option>
            </select>
          </div>

          {/* 4. State / UT */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              State / UT
            </label>
            <select
              value={selectedState}
              onChange={(e) => { 
                setSelectedState(e.target.value); 
                setSelectedDistrict('all'); 
                setCurrentPage(1); 
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="all">All India States / UTs</option>
              {INDIAN_STATES_AND_UTS.map(st => (
                <option key={st.state} value={st.state}>
                  {st.state} {st.isUT ? '(UT)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 5. District */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              District
            </label>
            <select
              value={selectedDistrict}
              disabled={selectedState === 'all' || availableDistricts.length === 0}
              onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">
                {selectedState === 'all' ? 'Select State First' : 'All Districts'}
              </option>
              {availableDistricts.map(dist => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Membership Category & Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Membership Category
            </label>
            <select
              value={selectedMembershipCategory}
              onChange={(e) => { setSelectedMembershipCategory(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="all">All Membership Categories</option>
              <option value="general_member">General Member</option>
              <option value="core_member">Core Member</option>
              <option value="life_member">Life Member</option>
              <option value="non_member">Non-Member</option>
            </select>
          </div>

        </div>

      </div>

      {/* People Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Top Stats & Pagination Info */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-900">
              Matching People Records:
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800">
              {filteredUsers.length} of {totalCount}
            </span>
            {selectedState !== 'all' && (
              <span className="text-[11px] text-slate-500">
                in <strong className="text-slate-800">{selectedState}</strong>
                {selectedDistrict !== 'all' ? ` (${selectedDistrict})` : ''}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Person & Contact</th>
                <th className="py-3 px-4">Profile Type</th>
                <th className="py-3 px-4">Membership Tier</th>
                <th className="py-3 px-4">Original Profession</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Jurisdiction / Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-xs text-slate-600">No people found matching the selected filter criteria.</p>
                    <p className="text-[11px]">Try adjusting your search terms, state, or professional category.</p>
                    <button
                      onClick={resetFilters}
                      className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const displayName = user.fullLegalName || user.fullName || user.displayName || 'Unnamed User';
                  const initial = displayName.charAt(0).toUpperCase();
                  const memId = user.membershipId || user.memberId;
                  const isCore = user.membershipStatus === 'core_member' || user.roles?.includes('core_member');
                  const isVol = user.volunteerStatus === 'active_volunteer' || user.volunteerStatus === 'approved';
                  const isDon = user.donorStatus === 'active_donor' || user.donorStatus === 'approved';
                  const isStu = user.calculatedPersonType === 'Student';
                  const isTeacher = user.calculatedPersonType === 'Teacher';

                  return (
                    <tr key={user.uid} className="hover:bg-indigo-50/30 transition-colors">
                      
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            isCore 
                              ? 'bg-amber-400 text-slate-950 font-black' 
                              : isTeacher
                                ? 'bg-purple-100 text-purple-800'
                                : isStu
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate max-w-[170px]" title={displayName}>
                              {displayName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate max-w-[170px]">
                              {user.email}
                            </div>
                            {(user.mobileNumber || user.phoneNumber) && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                {user.mobileNumber || user.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Profile Type */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          user.calculatedPersonType === 'Super Admin'
                            ? 'bg-amber-400 text-slate-950'
                            : user.calculatedPersonType === 'Core Member'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : user.calculatedPersonType === 'Teacher'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : user.calculatedPersonType === 'Student'
                                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                  : user.calculatedPersonType === 'Volunteer'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : user.calculatedPersonType === 'Donor'
                                      ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                      : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.calculatedPersonType}
                        </span>
                        {isVol && user.calculatedPersonType !== 'Volunteer' && (
                          <div className="text-[9px] font-bold text-emerald-700 mt-0.5">
                            • Also Volunteer
                          </div>
                        )}
                        {isDon && user.calculatedPersonType !== 'Donor' && (
                          <div className="text-[9px] font-bold text-amber-700 mt-0.5">
                            • Also Donor
                          </div>
                        )}
                      </td>

                      {/* Membership Tier & ID */}
                      <td className="py-3 px-4">
                        {memId ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {memId}
                            </span>
                            <div className="text-[10px] text-slate-500 capitalize">
                              {user.membershipType || (isCore ? 'Core Member' : 'General Member')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Non-Member</span>
                        )}
                      </td>

                      {/* Original Profession Entered by User */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {user.occupation || <span className="text-slate-400 italic font-normal">Not specified</span>}
                        </div>
                        {(user.educationalQualification || user.qualification) && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={user.educationalQualification || user.qualification}>
                            {user.educationalQualification || user.qualification}
                          </div>
                        )}
                      </td>

                      {/* Standardized Professional Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {user.calculatedProfCategory}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-4 capitalize">
                        {user.gender ? (
                          <span className={`font-semibold ${user.gender.toLowerCase() === 'female' ? 'text-rose-700' : 'text-slate-700'}`}>
                            {user.gender}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unspecified</span>
                        )}
                      </td>

                      {/* Location: District, State */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-800 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {user.district || user.city || 'District N/A'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 pl-4 truncate max-w-[130px]">
                          {user.state || 'India'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          user.status === 'active' || user.accountStatus === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : user.status === 'suspended' || user.accountStatus === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'active' || user.accountStatus === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          {user.accountStatus || user.status || 'active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectUser(user)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = Math.min(currentPage - 2 + i, totalPages - 4 + i);
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        )}

      </div>

      {/* Inspect User Profile Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-xl flex items-center justify-center border border-indigo-400/30 shadow-md">
                  {(inspectUser.fullLegalName || inspectUser.fullName || inspectUser.displayName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">
                      {inspectUser.fullLegalName || inspectUser.fullName || inspectUser.displayName || 'Unnamed User'}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-500 text-white">
                      {inspectUser.calculatedPersonType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{inspectUser.email}</p>
                  {inspectUser.membershipId && (
                    <p className="text-[11px] text-amber-400 font-mono font-bold mt-0.5">
                      ID: {inspectUser.membershipId}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setInspectUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Professional & Demographic Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Demographic & Professional Attributes</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Exact Entered Profession</span>
                    <div className="font-black text-slate-900">{inspectUser.occupation || 'Not specified'}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">Taxonomy Category</span>
                    <div className="font-black text-indigo-950">{inspectUser.calculatedProfCategory}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Educational Qualification</span>
                    <div className="font-semibold text-slate-900">{inspectUser.educationalQualification || inspectUser.qualification || 'Not specified'}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Gender</span>
                    <div className="font-semibold text-slate-900 capitalize">{inspectUser.gender || 'Not specified'}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile / Phone</span>
                    <div className="font-mono font-semibold text-slate-900">{inspectUser.mobileNumber || inspectUser.phoneNumber || 'Not provided'}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Group</span>
                    <div className="font-semibold text-slate-900">{inspectUser.bloodGroup || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Geographic Jurisdiction */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Geographic Jurisdiction</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">State / UT</span>
                    <div className="font-bold text-slate-900">{inspectUser.state || 'Not specified'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">District</span>
                    <div className="font-bold text-slate-900">{inspectUser.district || 'Not specified'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">City / Pincode</span>
                    <div className="font-bold text-slate-900">{inspectUser.city || 'N/A'} {inspectUser.pincode ? `• ${inspectUser.pincode}` : ''}</div>
                  </div>
                </div>

                {inspectUser.address && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Address</span>
                    <p className="text-slate-700">{inspectUser.address}</p>
                  </div>
                )}
              </div>

              {/* Trust Affiliations & Portfolios */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Trust Roles & Institutional Standing</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Membership Status</span>
                    <div className="font-black text-emerald-950 capitalize">{inspectUser.membershipStatus || 'none'}</div>
                    {inspectUser.membershipId && <div className="text-[10px] font-mono text-emerald-700">{inspectUser.membershipId}</div>}
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                    <span className="text-[10px] font-bold text-purple-800 uppercase">Volunteer Standing</span>
                    <div className="font-black text-purple-950 capitalize">{inspectUser.volunteerStatus || 'none'}</div>
                    {inspectUser.volunteerWing && <div className="text-[10px] text-purple-700">{inspectUser.volunteerWing}</div>}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase">Donor Standing</span>
                    <div className="font-black text-amber-950 capitalize">{inspectUser.donorStatus || 'none'}</div>
                    {inspectUser.donorType && <div className="text-[10px] text-amber-700 capitalize">{inspectUser.donorType}</div>}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-white text-xs space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned RBAC Roles</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectUser.roles && inspectUser.roles.length > 0 ? (
                      inspectUser.roles.map(r => (
                        <span key={r} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                          {r}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs">No special roles assigned</span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectUser(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
