/**
 * @license
 * Centralized Reports & Analytics Console (Step 52)
 * Fatimyah Educational Trust India (FET India)
 * Organization: Fatimyah Educational Trust
 * Brand: FET India
 *
 * Real-time institutional telemetry, domain reports & audits across:
 * - Super Admin Executive Analytics Overview
 * - Membership Census & Cadre Demographics
 * - Volunteer Force & Wing Operations
 * - Staff & Faculty HRMS Headcounts (Privacy Protected)
 * - Crowdfunding Welfare Appeals Performance
 * - Philanthropy & Donation Transactions (80G Compliance)
 * - Finance & Accounting Ledger (Income vs Expenditure)
 * - Competitions & Academic Examinations
 * - Digital Certificates & Registry Integrity
 * - Notifications & Communications Telemetry
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  HeartHandshake, 
  Briefcase, 
  Target, 
  BadgeDollarSign, 
  Landmark, 
  Award, 
  ShieldCheck, 
  Bell, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Printer, 
  RefreshCw, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Sparkles,
  MapPin,
  Lock,
  Globe
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, logAuditEvent } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { 
  UserProfile, 
  MembershipApplication, 
  VolunteerApplication, 
  DonorApplication, 
  CrowdfundingCampaign, 
  CampaignDonation, 
  FinancialRecord, 
  Competition, 
  CompetitionRegistration, 
  CompetitionCertificateRecord, 
  AdminBroadcastDispatch 
} from '../../types';
import { 
  DateFilterOption, 
  ReportModuleTab, 
  ReportRecordRow, 
  AggregatedReportMetrics 
} from './reports/types';
import { 
  formatCurrencyINR, 
  formatReportDate, 
  isDateWithinFilter, 
  maskSensitiveData, 
  generateReportsCsv, 
  downloadCsvFile 
} from './reports/reportUtils';
import { ReportsExecutiveOverview } from './reports/ReportsExecutiveOverview';
import { ReportsMembershipSection } from './reports/ReportsMembershipSection';
import { ReportsVolunteerSection } from './reports/ReportsVolunteerSection';
import { ReportsStaffSection } from './reports/ReportsStaffSection';
import { ReportsCrowdfundingSection } from './reports/ReportsCrowdfundingSection';
import { ReportsDonationSection } from './reports/ReportsDonationSection';
import { ReportsFinanceSection } from './reports/ReportsFinanceSection';
import { ReportsCompetitionsSection } from './reports/ReportsCompetitionsSection';
import { ReportsCertificatesSection } from './reports/ReportsCertificatesSection';
import { ReportsNotificationsSection } from './reports/ReportsNotificationsSection';
import { ReportsPrintModal } from './reports/ReportsPrintModal';

export const AdminReportsAnalyticsView: React.FC = () => {
  const { currentUser, userProfile, isSuperAdmin, activeRole } = useAuth();
  const { config } = useConfig();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<ReportModuleTab>('overview');

  // Filter States
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Table Pagination & Sorting
  const [sortField, setSortField] = useState<'date' | 'name' | 'amount' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Modals & Notifications
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Raw Database Collections
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [membershipApps, setMembershipApps] = useState<MembershipApplication[]>([]);
  const [volunteerApps, setVolunteerApps] = useState<VolunteerApplication[]>([]);
  const [donorApps, setDonorApps] = useState<DonorApplication[]>([]);
  const [campaigns, setCampaigns] = useState<CrowdfundingCampaign[]>([]);
  const [donations, setDonations] = useState<CampaignDonation[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionRegistrations, setCompetitionRegistrations] = useState<CompetitionRegistration[]>([]);
  const [certificates, setCertificates] = useState<CompetitionCertificateRecord[]>([]);
  const [broadcasts, setBroadcasts] = useState<AdminBroadcastDispatch[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Real-time Firestore Subscriptions
  useEffect(() => {
    setIsLoading(true);

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ uid: d.id, ...d.data() } as UserProfile));
      setUsers(list);
    }, (err) => console.warn('Users listener notice:', err));

    const unsubMemberApps = onSnapshot(collection(db, 'membershipApplications'), (snap) => {
      const list: MembershipApplication[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as MembershipApplication));
      setMembershipApps(list);
    }, (err) => console.warn('Membership apps listener notice:', err));

    const unsubVolApps = onSnapshot(collection(db, 'volunteerApplications'), (snap) => {
      const list: VolunteerApplication[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as VolunteerApplication));
      setVolunteerApps(list);
    }, (err) => console.warn('Volunteer apps listener notice:', err));

    const unsubDonorApps = onSnapshot(collection(db, 'donorApplications'), (snap) => {
      const list: DonorApplication[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DonorApplication));
      setDonorApps(list);
    }, (err) => console.warn('Donor apps listener notice:', err));

    const unsubCampaigns = onSnapshot(collection(db, 'crowdfunding_campaigns'), (snap) => {
      const list: CrowdfundingCampaign[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CrowdfundingCampaign));
      setCampaigns(list);
    }, (err) => console.warn('Campaigns listener notice:', err));

    const unsubDonations = onSnapshot(collection(db, 'campaign_donations'), (snap) => {
      const list: CampaignDonation[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CampaignDonation));
      setDonations(list);
    }, (err) => console.warn('Donations listener notice:', err));

    const unsubFinance = onSnapshot(collection(db, 'financial_records'), (snap) => {
      const list: FinancialRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as FinancialRecord));
      setFinancialRecords(list);
    }, (err) => console.warn('Finance listener notice:', err));

    const unsubCompetitions = onSnapshot(collection(db, 'competitions'), (snap) => {
      const list: Competition[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Competition));
      setCompetitions(list);
    }, (err) => console.warn('Competitions listener notice:', err));

    const unsubRegistrations = onSnapshot(collection(db, 'competition_registrations'), (snap) => {
      const list: CompetitionRegistration[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CompetitionRegistration));
      setCompetitionRegistrations(list);
    }, (err) => console.warn('Registrations listener notice:', err));

    const unsubCerts = onSnapshot(collection(db, 'competition_certificates'), (snap) => {
      const list: CompetitionCertificateRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CompetitionCertificateRecord));
      setCertificates(list);
    }, (err) => console.warn('Certificates listener notice:', err));

    const unsubBroadcasts = onSnapshot(collection(db, 'admin_broadcasts'), (snap) => {
      const list: AdminBroadcastDispatch[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AdminBroadcastDispatch));
      setBroadcasts(list);
      setIsLoading(false);
    }, (err) => {
      console.warn('Broadcasts listener notice:', err);
      setIsLoading(false);
    });

    return () => {
      unsubUsers();
      unsubMemberApps();
      unsubVolApps();
      unsubDonorApps();
      unsubCampaigns();
      unsubDonations();
      unsubFinance();
      unsubCompetitions();
      unsubRegistrations();
      unsubCerts();
      unsubBroadcasts();
    };
  }, []);

  // 2. Extract Unique States & Districts for Filter Dropdowns
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.state && set.add(u.state.trim()));
    campaigns.forEach((c) => c.state && set.add(c.state.trim()));
    competitionRegistrations.forEach((r) => r.state && set.add(r.state.trim()));
    return Array.from(set).sort();
  }, [users, campaigns, competitionRegistrations]);

  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (selectedState === 'all' || u.state === selectedState) {
        if (u.district) set.add(u.district.trim());
      }
    });
    campaigns.forEach((c) => {
      if (selectedState === 'all' || c.state === selectedState) {
        if (c.district) set.add(c.district.trim());
      }
    });
    return Array.from(set).sort();
  }, [users, campaigns, selectedState]);

  // 3. Extract Staff Members from Users
  const staffMembersList = useMemo(() => {
    return users.filter((u) => {
      if ((u as any).isStaff || (u as any).isStaffMember) return true;
      if ((u as any).staffId && String((u as any).staffId).trim().length > 0) return true;
      if ((u as any).employmentStatus) return true;
      if ((u as any).designation && (u as any).department) return true;
      const staffRoles = ['hr_admin', 'school_admin', 'madrasa_admin', 'finance_admin', 'content_admin'];
      if (u.roles?.some((r) => staffRoles.includes(r)) && ((u as any).department || (u as any).designation)) return true;
      return false;
    });
  }, [users]);

  // 4. Compute Comprehensive Metrics
  const metrics: AggregatedReportMetrics = useMemo(() => {
    // Filtered by date window for aggregate metrics where appropriate
    const filteredUsers = users.filter((u) => isDateWithinFilter(u.createdAt, dateFilter, customStartDate, customEndDate));
    const filteredMemberApps = membershipApps.filter((m) => isDateWithinFilter(m.createdAt, dateFilter, customStartDate, customEndDate));
    const filteredVolApps = volunteerApps.filter((v) => isDateWithinFilter(v.createdAt, dateFilter, customStartDate, customEndDate));
    const filteredCampaigns = campaigns.filter((c) => isDateWithinFilter(c.createdAt, dateFilter, customStartDate, customEndDate));
    const filteredDonations = donations.filter((d) => isDateWithinFilter(d.createdAt, dateFilter, customStartDate, customEndDate));
    const filteredFinance = financialRecords.filter((f) => isDateWithinFilter(f.date || f.createdAt, dateFilter, customStartDate, customEndDate));
    const filteredCompetitions = competitions.filter((c) => isDateWithinFilter(c.createdAt || c.registrationStartDate, dateFilter, customStartDate, customEndDate));
    const filteredRegistrations = competitionRegistrations.filter((r) => isDateWithinFilter(r.registeredAt, dateFilter, customStartDate, customEndDate));
    const filteredCerts = certificates.filter((c) => isDateWithinFilter(c.issueDate || c.createdAt, dateFilter, customStartDate, customEndDate));
    const filteredBroadcasts = broadcasts.filter((b) => isDateWithinFilter(b.createdAt || b.publishAt, dateFilter, customStartDate, customEndDate));

    // Membership calculations
    const totalUsers = filteredUsers.length;
    const activeUsers = filteredUsers.filter((u) => u.status === 'active' || u.accountStatus === 'active').length;
    const coreMembers = filteredUsers.filter((u) => u.membershipStatus === 'core_member' || u.membershipType === 'core_member' || u.primaryRole === 'core_member').length;
    const generalMembers = filteredUsers.filter((u) => u.membershipStatus === 'general_member' || u.membershipType === 'general_member' || u.primaryRole === 'member').length;
    const totalMembers = coreMembers + generalMembers;
    const pendingMembershipApps = filteredMemberApps.filter((m) => m.status === 'pending' || m.status === 'under_review').length;
    const approvedMembershipApps = filteredMemberApps.filter((m) => m.status === 'approved').length;
    const rejectedMembershipApps = filteredMemberApps.filter((m) => m.status === 'rejected').length;

    // Volunteers calculations
    const activeVolunteers = filteredUsers.filter((u) => u.volunteerStatus === 'active_volunteer' || u.volunteerStatus === 'approved').length;
    const totalVolunteers = filteredUsers.filter((u) => u.volunteerStatus && u.volunteerStatus !== 'none').length || activeVolunteers;
    const pendingVolunteerApps = filteredVolApps.filter((v) => v.status === 'pending' || v.status === 'under_review').length;
    const approvedVolunteerApps = filteredVolApps.filter((v) => v.status === 'approved').length;
    const rejectedVolunteerApps = filteredVolApps.filter((v) => v.status === 'rejected' || v.status === 'suspended').length;
    const volunteerCategoriesCount: Record<string, number> = {};
    const volunteerSkillsCount: Record<string, number> = {};
    filteredVolApps.forEach((v) => {
      if (v.assignedCategory) {
        volunteerCategoriesCount[v.assignedCategory] = (volunteerCategoriesCount[v.assignedCategory] || 0) + 1;
      }
      if (v.skills && Array.isArray(v.skills)) {
        v.skills.forEach((s) => {
          volunteerSkillsCount[s] = (volunteerSkillsCount[s] || 0) + 1;
        });
      }
    });

    // Staff HRMS calculations
    const filteredStaff = staffMembersList.filter((s) => isDateWithinFilter((s as any).joiningDate || s.createdAt, dateFilter, customStartDate, customEndDate));
    const totalStaff = filteredStaff.length;
    const activeStaff = filteredStaff.filter((s) => !(s as any).employmentStatus || (s as any).employmentStatus === 'active').length;
    const onLeaveStaff = filteredStaff.filter((s) => (s as any).employmentStatus === 'on_leave').length;
    const inactiveStaff = filteredStaff.filter((s) => (s as any).employmentStatus === 'inactive' || (s as any).employmentStatus === 'terminated').length;
    const staffByDepartment: Record<string, number> = {};
    const staffByDesignation: Record<string, number> = {};
    filteredStaff.forEach((s) => {
      const dept = (s as any).department || 'General Administration';
      const desig = (s as any).designation || 'Staff Member';
      staffByDepartment[dept] = (staffByDepartment[dept] || 0) + 1;
      staffByDesignation[desig] = (staffByDesignation[desig] || 0) + 1;
    });

    // Crowdfunding calculations
    const totalCampaigns = filteredCampaigns.length;
    const activeCampaigns = filteredCampaigns.filter((c) => c.status === 'active').length;
    const completedCampaigns = filteredCampaigns.filter((c) => c.status === 'completed' || c.status === 'closed').length;
    const pendingCampaigns = filteredCampaigns.filter((c) => c.status === 'pending_review' || c.status === 'under_review').length;
    const campaignsTargetTotal = filteredCampaigns.reduce((acc, c) => acc + (Number(c.targetAmount) || 0), 0);
    const campaignsRaisedTotal = filteredCampaigns.reduce((acc, c) => acc + (Number(c.raisedAmount) || 0), 0);
    const campaignsOverallProgressPct = campaignsTargetTotal > 0 ? (campaignsRaisedTotal / campaignsTargetTotal) * 100 : 0;

    // Donations calculations
    const totalDonationTransactions = filteredDonations.length;
    const verifiedDonations = filteredDonations.filter((d) => d.paymentStatus === 'verified');
    const verifiedDonationsCount = verifiedDonations.length;
    const pendingDonationsCount = filteredDonations.filter((d) => d.paymentStatus === 'pending_verification').length;
    const failedDonationsCount = filteredDonations.filter((d) => d.paymentStatus === 'failed' || d.paymentStatus === 'cancelled').length;
    const refundedDonationsCount = filteredDonations.filter((d) => d.paymentStatus === 'refunded').length;
    const totalDonationAmount = verifiedDonations.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    const averageDonationAmount = verifiedDonationsCount > 0 ? totalDonationAmount / verifiedDonationsCount : 0;
    const uniqueDonorsSet = new Set(verifiedDonations.map((d) => d.donorEmail || d.donorUid || d.donorName).filter(Boolean));
    const uniqueDonorsCount = uniqueDonorsSet.size;
    const donations80GCount = verifiedDonations.filter((d) => Boolean(d.receiptNumber || d.donorPan)).length;

    // Finance & Accounting calculations
    const incomeRecords = filteredFinance.filter((f) => f.type === 'income');
    const expenseRecords = filteredFinance.filter((f) => f.type === 'expense');
    const totalFinanceIncome = incomeRecords
      .filter((f) => f.status === 'verified' || (f as any).paymentStatus === 'verified')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
    const totalFinanceExpense = expenseRecords
      .filter((f) => f.status === 'paid' || f.status === 'approved')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
    const netFinanceBalance = totalFinanceIncome - totalFinanceExpense;
    const financeIncomeByCategory: Record<string, number> = {};
    const financeExpenseByCategory: Record<string, number> = {};
    incomeRecords.forEach((f) => {
      const cat = f.category || 'other_income';
      financeIncomeByCategory[cat] = (financeIncomeByCategory[cat] || 0) + (Number(f.amount) || 0);
    });
    expenseRecords.forEach((f) => {
      const cat = f.category || 'other_expense';
      financeExpenseByCategory[cat] = (financeExpenseByCategory[cat] || 0) + (Number(f.amount) || 0);
    });
    const verifiedIncomeCount = incomeRecords.filter((f) => f.status === 'verified' || (f as any).paymentStatus === 'verified').length;
    const paidExpenseCount = expenseRecords.filter((f) => f.status === 'paid').length;
    const pendingExpenseCount = expenseRecords.filter((f) => f.status === 'pending_approval' || f.status === 'draft').length;

    // Competitions calculations
    const totalCompetitions = filteredCompetitions.length;
    const activeCompetitions = filteredCompetitions.filter((c) => c.status === 'registration_open' || c.status === 'published').length;
    const completedCompetitions = filteredCompetitions.filter((c) => c.status === 'completed').length;
    const totalParticipants = filteredRegistrations.length;
    const completedExamsCount = filteredRegistrations.filter((r) => r.status === 'evaluated' || r.examAttemptStatus === 'evaluated' || r.status === 'attended').length;
    const resultsPublishedCount = filteredRegistrations.filter((r) => r.isResultPublished).length;
    const certificatesIssuedFromCompCount = filteredRegistrations.filter((r) => r.certificateIssued).length;
    const competitionsByCategory: Record<string, number> = {};
    filteredCompetitions.forEach((c) => {
      competitionsByCategory[c.category] = (competitionsByCategory[c.category] || 0) + 1;
    });

    // Certificates calculations
    const totalCertificatesIssued = filteredCerts.length;
    const validCertificatesCount = filteredCerts.filter((c) => c.status !== 'revoked').length;
    const revokedCertificatesCount = filteredCerts.filter((c) => c.status === 'revoked').length;
    const certificatesByAward: Record<string, number> = {};
    filteredCerts.forEach((c) => {
      const award = c.achievement || 'merit';
      certificatesByAward[award] = (certificatesByAward[award] || 0) + 1;
    });

    // Notifications calculations
    const totalBroadcastsCreated = filteredBroadcasts.length;
    const publishedBroadcastsCount = filteredBroadcasts.filter((b) => b.status === 'published' || !b.status).length;
    const scheduledBroadcastsCount = filteredBroadcasts.filter((b) => b.status === 'scheduled').length;
    const archivedBroadcastsCount = filteredBroadcasts.filter((b) => b.status === 'archived').length;
    const broadcastsByCategory: Record<string, number> = {};
    const broadcastsByPriority: Record<string, number> = {};
    filteredBroadcasts.forEach((b) => {
      const cat = b.category || b.type || 'General';
      const pri = b.priority || 'normal';
      broadcastsByCategory[cat] = (broadcastsByCategory[cat] || 0) + 1;
      broadcastsByPriority[pri] = (broadcastsByPriority[pri] || 0) + 1;
    });

    return {
      totalUsers,
      activeUsers,
      totalMembers,
      coreMembers,
      generalMembers,
      pendingMembershipApps,
      approvedMembershipApps,
      rejectedMembershipApps,
      totalVolunteers,
      activeVolunteers,
      pendingVolunteerApps,
      approvedVolunteerApps,
      rejectedVolunteerApps,
      volunteerCategoriesCount,
      volunteerSkillsCount,
      totalStaff,
      activeStaff,
      onLeaveStaff,
      inactiveStaff,
      staffByDepartment,
      staffByDesignation,
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      pendingCampaigns,
      campaignsTargetTotal,
      campaignsRaisedTotal,
      campaignsOverallProgressPct,
      totalDonationTransactions,
      verifiedDonationsCount,
      pendingDonationsCount,
      failedDonationsCount,
      refundedDonationsCount,
      totalDonationAmount,
      averageDonationAmount,
      uniqueDonorsCount,
      donations80GCount,
      totalFinanceIncome,
      totalFinanceExpense,
      netFinanceBalance,
      financeIncomeByCategory,
      financeExpenseByCategory,
      verifiedIncomeCount,
      paidExpenseCount,
      pendingExpenseCount,
      totalCompetitions,
      activeCompetitions,
      completedCompetitions,
      totalParticipants,
      completedExamsCount,
      resultsPublishedCount,
      certificatesIssuedFromCompCount,
      competitionsByCategory,
      totalCertificatesIssued,
      validCertificatesCount,
      revokedCertificatesCount,
      certificatesByAward,
      totalBroadcastsCreated,
      publishedBroadcastsCount,
      scheduledBroadcastsCount,
      archivedBroadcastsCount,
      broadcastsByCategory,
      broadcastsByPriority
    };
  }, [
    users,
    membershipApps,
    volunteerApps,
    staffMembersList,
    campaigns,
    donations,
    financialRecords,
    competitions,
    competitionRegistrations,
    certificates,
    broadcasts,
    dateFilter,
    customStartDate,
    customEndDate
  ]);

  // 5. Generate Domain-Specific Rows for Tabular View
  const rawTabularRows: ReportRecordRow[] = useMemo(() => {
    const rows: ReportRecordRow[] = [];

    // Helper to check geographic filter
    const matchGeo = (state?: string, district?: string) => {
      if (selectedState !== 'all' && state && state !== selectedState) return false;
      if (selectedDistrict !== 'all' && district && district !== selectedDistrict) return false;
      return true;
    };

    if (activeTab === 'overview' || activeTab === 'membership') {
      users.forEach((u) => {
        if (!isDateWithinFilter(u.createdAt, dateFilter, customStartDate, customEndDate)) return;
        if (!matchGeo(u.state, u.district)) return;
        if (activeTab === 'membership' && (!u.membershipStatus || u.membershipStatus === 'none')) return;

        rows.push({
          id: u.uid,
          name: u.displayName || u.fullName || u.email || 'Registered User',
          email: u.email,
          phone: maskSensitiveData(u.mobileNumber || u.phoneNumber, 'phone'),
          identifierId: u.membershipId || u.memberId || u.uid.slice(0, 8),
          module: 'membership',
          category: u.membershipType || (u.membershipStatus === 'core_member' ? 'Core Member' : 'General Member'),
          subCategory: u.occupation || 'Member',
          status: u.membershipStatus || u.status || 'active',
          state: u.state || 'Pan-India',
          district: u.district || 'N/A',
          date: u.createdAt || '',
          amountOrNotes: `Role: ${u.primaryRole || 'user'}`,
          badgeType: u.membershipStatus === 'core_member' ? 'warning' : 'success'
        });
      });
    }

    if (activeTab === 'volunteer') {
      volunteerApps.forEach((v) => {
        if (!isDateWithinFilter(v.createdAt, dateFilter, customStartDate, customEndDate)) return;
        if (!matchGeo(v.state, v.district)) return;

        rows.push({
          id: v.id || v.applicantUid,
          name: v.fullLegalName || v.applicantEmail,
          email: v.applicantEmail,
          phone: maskSensitiveData(v.mobileNumber, 'phone'),
          identifierId: v.volunteerIdAssigned || 'Pending Assigned',
          module: 'volunteer',
          category: v.assignedCategory || (v.areasOfInterest?.[0]) || 'General Service',
          subCategory: v.skills?.slice(0, 2).join(', ') || 'Volunteering',
          status: v.status,
          state: v.state || 'Pan-India',
          district: v.district || 'N/A',
          date: v.createdAt || '',
          amountOrNotes: `Wings: ${v.assignedWing || 'General Field'}`,
          badgeType: v.status === 'approved' ? 'success' : v.status === 'pending' ? 'warning' : 'neutral'
        });
      });
    }

    if (activeTab === 'staff') {
      staffMembersList.forEach((s) => {
        if (!isDateWithinFilter((s as any).joiningDate || s.createdAt, dateFilter, customStartDate, customEndDate)) return;
        if (!matchGeo(s.state, s.district)) return;

        rows.push({
          id: s.uid,
          name: s.displayName || s.fullName || s.email,
          email: s.email,
          phone: maskSensitiveData(s.mobileNumber || s.phoneNumber, 'phone'),
          identifierId: (s as any).staffId || 'HRMS-STAFF',
          module: 'staff',
          category: (s as any).department || 'General Administration',
          subCategory: (s as any).designation || 'Staff Member',
          status: (s as any).employmentStatus || 'active',
          state: s.state || 'Pan-India',
          district: s.district || 'Central Office',
          date: (s as any).joiningDate || s.createdAt || '',
          amountOrNotes: 'Protected HRMS Profile',
          badgeType: (s as any).employmentStatus === 'active' || !(s as any).employmentStatus ? 'success' : 'neutral'
        });
      });
    }

    if (activeTab === 'crowdfunding') {
      campaigns.forEach((c) => {
        if (!isDateWithinFilter(c.createdAt, dateFilter, customStartDate, customEndDate)) return;
        if (!matchGeo(c.state, c.district)) return;

        rows.push({
          id: c.id || c.campaignId || '',
          name: c.title,
          identifierId: c.campaignNumber || c.campaignId || 'CAMPAIGN',
          module: 'crowdfunding',
          category: c.categoryLabel || c.category,
          subCategory: `Target: ${formatCurrencyINR(c.targetAmount)}`,
          status: c.status,
          state: c.state || 'Pan-India',
          district: c.district || 'N/A',
          date: c.createdAt || '',
          amount: c.raisedAmount,
          amountOrNotes: `${formatCurrencyINR(c.raisedAmount)} / ${formatCurrencyINR(c.targetAmount)}`,
          badgeType: c.status === 'active' ? 'success' : c.status === 'completed' ? 'info' : 'warning'
        });
      });
    }

    if (activeTab === 'donations') {
      donations.forEach((d) => {
        if (!isDateWithinFilter(d.createdAt, dateFilter, customStartDate, customEndDate)) return;

        rows.push({
          id: d.id || d.donationId,
          name: d.isAnonymous ? 'Anonymous Donor' : d.donorName,
          email: maskSensitiveData(d.donorEmail, 'email'),
          phone: maskSensitiveData(d.donorPhone, 'phone'),
          identifierId: d.receiptNumber || d.donationId || 'DONATION',
          module: 'donations',
          category: d.campaignTitle || 'General Education Fund',
          subCategory: d.donorPan ? `80G PAN: ${maskSensitiveData(d.donorPan, 'pan')}` : 'General Contribution',
          status: d.paymentStatus,
          state: 'Verified Banking',
          district: d.paymentMethod || 'UPI/Bank',
          date: d.createdAt || '',
          amount: d.amount,
          amountOrNotes: formatCurrencyINR(d.amount),
          badgeType: d.paymentStatus === 'verified' ? 'success' : d.paymentStatus === 'refunded' ? 'error' : 'warning'
        });
      });
    }

    if (activeTab === 'finance') {
      financialRecords.forEach((f) => {
        if (!isDateWithinFilter(f.date || f.createdAt, dateFilter, customStartDate, customEndDate)) return;

        rows.push({
          id: f.id || f.transactionId,
          name: f.payerPayeeName || f.description || 'Ledger Entry',
          identifierId: f.voucherNumber || f.transactionId || 'FIN-REC',
          module: 'finance',
          category: f.type === 'income' ? 'Income (Receipt)' : 'Expense (Voucher)',
          subCategory: f.category || f.department || 'Finance Head',
          status: String(f.status),
          state: f.fundType || 'General Fund',
          district: f.paymentMethod || 'Bank',
          date: f.date || f.createdAt || '',
          amount: f.amount,
          amountOrNotes: `${f.type === 'income' ? '+' : '-'} ${formatCurrencyINR(f.amount)}`,
          badgeType: f.type === 'income' ? 'success' : 'neutral'
        });
      });
    }

    if (activeTab === 'competitions') {
      competitionRegistrations.forEach((r) => {
        if (!isDateWithinFilter(r.registeredAt, dateFilter, customStartDate, customEndDate)) return;
        if (!matchGeo(r.state, r.district)) return;

        rows.push({
          id: r.id || r.registrationId,
          name: r.participantName,
          email: maskSensitiveData(r.email, 'email'),
          phone: maskSensitiveData(r.mobileNumber, 'phone'),
          identifierId: r.participantId || 'EXAM-PARTICIPANT',
          module: 'competitions',
          category: r.competitionTitle,
          subCategory: r.schoolInstitution || r.classGrade || 'Student',
          status: r.status,
          state: r.state || 'Pan-India',
          district: r.district || 'N/A',
          date: r.registeredAt || '',
          amountOrNotes: r.marksObtained !== undefined ? `Score: ${r.marksObtained} (${r.grade || 'Pass'})` : 'Exam Pending',
          badgeType: r.isResultPublished ? 'success' : 'info'
        });
      });
    }

    if (activeTab === 'certificates') {
      certificates.forEach((c) => {
        if (!isDateWithinFilter(c.issueDate || c.createdAt, dateFilter, customStartDate, customEndDate)) return;
        if (!matchGeo(c.state, c.district)) return;

        rows.push({
          id: c.id || c.certificateId,
          name: c.participantName,
          identifierId: c.certificateId,
          module: 'certificates',
          category: c.competitionTitle,
          subCategory: c.achievementTitle || c.achievement || 'Achievement',
          status: c.status || 'valid',
          state: c.state || 'Pan-India',
          district: c.district || 'N/A',
          date: c.issueDate || c.createdAt || '',
          amountOrNotes: `Verified Registry • ${c.achievementTitle || 'Issued'}`,
          badgeType: c.status === 'revoked' ? 'error' : 'success'
        });
      });
    }

    if (activeTab === 'notifications') {
      broadcasts.forEach((b) => {
        if (!isDateWithinFilter(b.createdAt || b.publishAt, dateFilter, customStartDate, customEndDate)) return;

        rows.push({
          id: b.id || '',
          name: b.title,
          identifierId: b.id ? `BRD-${b.id.slice(-6)}` : 'BROADCAST',
          module: 'notifications',
          category: b.category || b.type || 'Institutional Bulletin',
          subCategory: `Priority: ${b.priority || 'Normal'}`,
          status: b.status || 'published',
          state: 'Digital Dispatch',
          district: b.targetGroups?.join(', ') || 'All Cohorts',
          date: b.publishAt || b.createdAt || '',
          amountOrNotes: `${b.recipientCount || 0} Recipients Target`,
          badgeType: b.status === 'published' ? 'success' : b.status === 'scheduled' ? 'warning' : 'neutral'
        });
      });
    }

    return rows;
  }, [
    activeTab,
    users,
    volunteerApps,
    staffMembersList,
    campaigns,
    donations,
    financialRecords,
    competitionRegistrations,
    certificates,
    broadcasts,
    dateFilter,
    customStartDate,
    customEndDate,
    selectedState,
    selectedDistrict
  ]);

  // 6. Filter & Search Rows
  const filteredAndSortedRows = useMemo(() => {
    let result = rawTabularRows;

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter((r) => r.status.toLowerCase() === selectedStatus.toLowerCase());
    }

    // Search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => 
        r.name.toLowerCase().includes(q) ||
        r.identifierId.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.subCategory && r.subCategory.toLowerCase().includes(q)) ||
        (r.state && r.state.toLowerCase().includes(q)) ||
        (r.district && r.district.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        comparison = timeA - timeB;
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'amount') {
        comparison = (a.amount || 0) - (b.amount || 0);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [rawTabularRows, selectedStatus, searchQuery, sortField, sortDirection]);

  // 7. Paginate Rows
  const totalPages = Math.ceil(filteredAndSortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

  // Reset pagination on tab or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateFilter, selectedState, selectedDistrict, selectedStatus, searchQuery]);

  // 8. Handle CSV Export
  const handleExportCsv = async () => {
    try {
      const csvText = generateReportsCsv(
        activeTab,
        filteredAndSortedRows,
        {
          dateFilter,
          state: selectedState,
          district: selectedDistrict,
          exportedBy: currentUser?.email || 'Administrator'
        },
        metrics
      );

      const fileName = `FET_India_${activeTab.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCsvFile(csvText, fileName);

      // Audit Log
      await logAuditEvent({
        actorUid: currentUser?.uid || 'admin',
        actorEmail: currentUser?.email || 'admin@fetindia.org',
        actorRole: activeRole || 'super_admin',
        action: 'REPORTS_CSV_EXPORTED',
        targetEntity: `report_${activeTab}`,
        details: {
          module: activeTab,
          recordsCount: filteredAndSortedRows.length,
          dateFilter,
          selectedState,
          timestamp: new Date().toISOString()
        }
      });

      showToast(`Exported ${filteredAndSortedRows.length} records to ${fileName}`);
    } catch (err: any) {
      console.error('Export CSV error:', err);
      showToast('Error exporting CSV file.');
    }
  };

  // State distribution data for charts
  const stateDistribution = useMemo(() => {
    const countMap: Record<string, number> = {};
    users.forEach((u) => {
      if (u.state) {
        const s = u.state.trim();
        countMap[s] = (countMap[s] || 0) + 1;
      }
    });
    return Object.entries(countMap)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);
  }, [users]);

  // Specific Breakdowns for Domain Components
  const membershipTierBreakdown = useMemo(() => [
    { tier: 'Core Trust Members', count: metrics.coreMembers },
    { tier: 'General Members', count: metrics.generalMembers },
    { tier: 'Applications in Review', count: metrics.pendingMembershipApps }
  ], [metrics]);

  const volunteerCategoryBreakdown = useMemo(() => 
    Object.entries(metrics.volunteerCategoriesCount).map(([category, count]) => ({ category, count })),
    [metrics.volunteerCategoriesCount]
  );

  const staffDeptBreakdown = useMemo(() => 
    Object.entries(metrics.staffByDepartment).map(([department, count]) => ({ department, count })),
    [metrics.staffByDepartment]
  );

  const staffDesigBreakdown = useMemo(() => 
    Object.entries(metrics.staffByDesignation).map(([designation, count]) => ({ designation, count })),
    [metrics.staffByDesignation]
  );

  const crowdfundingCategoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; raised: number; target: number }> = {};
    campaigns.forEach((c) => {
      const cat = c.categoryLabel || c.category || 'General Welfare';
      if (!map[cat]) map[cat] = { count: 0, raised: 0, target: 0 };
      map[cat].count += 1;
      map[cat].raised += Number(c.raisedAmount) || 0;
      map[cat].target += Number(c.targetAmount) || 0;
    });
    return Object.entries(map).map(([category, d]) => ({ category, ...d }));
  }, [campaigns]);

  const financeIncomeCategories = useMemo(() => 
    Object.entries(metrics.financeIncomeByCategory).map(([category, amount]) => ({ category, amount })),
    [metrics.financeIncomeByCategory]
  );

  const financeExpenseCategories = useMemo(() => 
    Object.entries(metrics.financeExpenseByCategory).map(([category, amount]) => ({ category, amount })),
    [metrics.financeExpenseByCategory]
  );

  const competitionsCategoryBreakdown = useMemo(() => 
    Object.entries(metrics.competitionsByCategory).map(([category, count]) => ({ category, count })),
    [metrics.competitionsByCategory]
  );

  const certsAwardBreakdown = useMemo(() => 
    Object.entries(metrics.certificatesByAward).map(([award, count]) => ({ award, count })),
    [metrics.certificatesByAward]
  );

  const broadcastsCategoryBreakdown = useMemo(() => 
    Object.entries(metrics.broadcastsByCategory).map(([category, count]) => ({ category, count })),
    [metrics.broadcastsByCategory]
  );

  const broadcastsPriorityBreakdown = useMemo(() => 
    Object.entries(metrics.broadcastsByPriority).map(([priority, count]) => ({ priority, count })),
    [metrics.broadcastsByPriority]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8" id="admin-reports-analytics-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="reports-toast-banner"
          className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-fade-in border border-slate-700"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Central Administrative Secretariat
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Reports & Analytics Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time verified database census, financial audits, demographic distributions and operational telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="reports-btn-csv-export"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>

          <button
            id="reports-btn-print-preview"
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-200" />
            Print Letterhead Document
          </button>
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm overflow-x-auto" id="reports-nav-tabs">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'overview' as ReportModuleTab, label: 'Executive Overview', icon: BarChart3 },
            { id: 'membership' as ReportModuleTab, label: 'Membership Census', icon: Users },
            { id: 'volunteer' as ReportModuleTab, label: 'Volunteer Force', icon: HeartHandshake },
            { id: 'staff' as ReportModuleTab, label: 'Staff & HRMS', icon: Briefcase },
            { id: 'crowdfunding' as ReportModuleTab, label: 'Crowdfunding Appeals', icon: Target },
            { id: 'donations' as ReportModuleTab, label: 'Philanthropy & 80G', icon: BadgeDollarSign },
            { id: 'finance' as ReportModuleTab, label: 'Finance & Ledger', icon: Landmark },
            { id: 'competitions' as ReportModuleTab, label: 'Competitions & Exams', icon: Award },
            { id: 'certificates' as ReportModuleTab, label: 'Certificates Registry', icon: ShieldCheck },
            { id: 'notifications' as ReportModuleTab, label: 'Bulletins & Alerts', icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`report-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3" id="reports-filter-bar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Timeframe Scope Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Timeframe Scope
            </label>
            <select
              id="reports-filter-date-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">All Time (Master Census)</option>
              <option value="today">Today (24 Hours)</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="this_month">This Calendar Month</option>
              <option value="this_year">This Calendar Year (2026)</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* State Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              State / Territory
            </label>
            <select
              id="reports-filter-state-select"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('all');
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">Pan-India (All States & UTs)</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              District Scope
            </label>
            <select
              id="reports-filter-district-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">All Districts</option>
              {availableDistricts.map((dst) => (
                <option key={dst} value={dst}>{dst}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Instant Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="reports-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, category..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>
        </div>

        {/* Custom Date Range Row */}
        {dateFilter === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs animate-fade-in">
            <span className="font-bold text-slate-600">Custom Scope:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Module Content View */}
      {activeTab === 'overview' && (
        <ReportsExecutiveOverview
          metrics={metrics}
          onNavigateTab={(tab) => setActiveTab(tab)}
          stateDistribution={stateDistribution}
        />
      )}

      {activeTab === 'membership' && (
        <ReportsMembershipSection
          metrics={metrics}
          stateBreakdown={stateDistribution}
          tierBreakdown={membershipTierBreakdown}
        />
      )}

      {activeTab === 'volunteer' && (
        <ReportsVolunteerSection
          metrics={metrics}
          categoryBreakdown={volunteerCategoryBreakdown}
          stateBreakdown={stateDistribution}
        />
      )}

      {activeTab === 'staff' && (
        <ReportsStaffSection
          metrics={metrics}
          deptBreakdown={staffDeptBreakdown}
          designationBreakdown={staffDesigBreakdown}
        />
      )}

      {activeTab === 'crowdfunding' && (
        <ReportsCrowdfundingSection
          metrics={metrics}
          categoryBreakdown={crowdfundingCategoryBreakdown}
          stateBreakdown={stateDistribution}
        />
      )}

      {activeTab === 'donations' && (
        <ReportsDonationSection
          metrics={metrics}
        />
      )}

      {activeTab === 'finance' && (
        <ReportsFinanceSection
          metrics={metrics}
          incomeCategories={financeIncomeCategories}
          expenseCategories={financeExpenseCategories}
        />
      )}

      {activeTab === 'competitions' && (
        <ReportsCompetitionsSection
          metrics={metrics}
          categoryBreakdown={competitionsCategoryBreakdown}
        />
      )}

      {activeTab === 'certificates' && (
        <ReportsCertificatesSection
          metrics={metrics}
          awardBreakdown={certsAwardBreakdown}
        />
      )}

      {activeTab === 'notifications' && (
        <ReportsNotificationsSection
          metrics={metrics}
          categoryBreakdown={broadcastsCategoryBreakdown}
          priorityBreakdown={broadcastsPriorityBreakdown}
        />
      )}

      {/* Comprehensive Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="reports-tabular-audit-section">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              Detailed {activeTab.toUpperCase()} Records ({filteredAndSortedRows.length} Items Found)
            </h3>
            <p className="text-xs text-slate-500">Live database audit telemetry synchronized with active filters</p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 font-medium">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-700"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th 
                  onClick={() => {
                    setSortField('name');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                  className="p-3.5 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    Record Name / Title
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th className="p-3.5">Identifier / Code</th>
                <th className="p-3.5">Category / Dept</th>
                <th 
                  onClick={() => {
                    setSortField('status');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                  className="p-3.5 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    Status
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th className="p-3.5">State / Territory</th>
                <th 
                  onClick={() => {
                    setSortField('date');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                  className="p-3.5 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th className="p-3.5 text-right">Summary / Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <BarChart3 className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-700">No records found matching current scope.</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your date range, territory, or search filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      {r.email && <div className="text-[11px] text-slate-500">{r.email}</div>}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-600">
                      {r.identifierId || '—'}
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-800 capitalize block">{r.category}</span>
                      {r.subCategory && <span className="text-[11px] text-slate-400 block">{r.subCategory}</span>}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        r.badgeType === 'success' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : r.badgeType === 'warning'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : r.badgeType === 'error'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : r.badgeType === 'info'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700">
                      <div>{r.state}</div>
                      {r.district !== 'N/A' && <div className="text-[11px] text-slate-400">{r.district}</div>}
                    </td>
                    <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                      {formatReportDate(r.date)}
                    </td>
                    <td className="p-3.5 text-right font-semibold text-slate-900">
                      {r.amountOrNotes || (r.amount !== undefined ? formatCurrencyINR(r.amount) : '—')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredAndSortedRows.length)} of {filteredAndSortedRows.length} entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Official Print Letterhead Modal */}
      <ReportsPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        activeTab={activeTab}
        dateFilter={dateFilter}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        exportedBy={currentUser?.email || 'System Administrator'}
        metrics={metrics}
        rows={filteredAndSortedRows}
        orgConfig={{
          legalName: config.legalName,
          registrationNumber: config.registrationNumber,
          registrationJurisdiction: config.registrationJurisdiction,
          registrationAct: config.registrationAct,
          contactEmail: config.contactEmail,
          nitiAayogId: config.nitiAayogId || config.darpanId,
          panNumber: config.panNumber
        }}
      />
    </div>
  );
};
