/**
 * @license
 * FET India Reports & Analytics System Types (Step 52)
 * Fatimyah Educational Trust India
 */

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
  AdminBroadcastDispatch,
  AppNotification
} from '../../../types';

export type DateFilterOption = 'all' | 'today' | '7days' | '30days' | 'this_month' | 'this_year' | 'custom';

export type ReportModuleTab = 
  | 'overview' 
  | 'membership' 
  | 'volunteer' 
  | 'staff'
  | 'crowdfunding' 
  | 'donations' 
  | 'finance' 
  | 'competitions' 
  | 'certificates' 
  | 'notifications';

export interface ReportRecordRow {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  identifierId: string;
  module: ReportModuleTab;
  category: string;
  subCategory?: string;
  status: string;
  state: string;
  district: string;
  date: string;
  amount?: number;
  amountOrNotes?: string;
  badgeType?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  meta?: Record<string, any>;
}

export interface AggregatedReportMetrics {
  // Users & Members
  totalUsers: number;
  activeUsers: number;
  totalMembers: number;
  coreMembers: number;
  generalMembers: number;
  pendingMembershipApps: number;
  approvedMembershipApps: number;
  rejectedMembershipApps: number;

  // Volunteers
  totalVolunteers: number;
  activeVolunteers: number;
  pendingVolunteerApps: number;
  approvedVolunteerApps: number;
  rejectedVolunteerApps: number;
  volunteerCategoriesCount: Record<string, number>;
  volunteerSkillsCount: Record<string, number>;

  // Staff HRMS
  totalStaff: number;
  activeStaff: number;
  onLeaveStaff: number;
  inactiveStaff: number;
  staffByDepartment: Record<string, number>;
  staffByDesignation: Record<string, number>;

  // Crowdfunding
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  pendingCampaigns: number;
  campaignsTargetTotal: number;
  campaignsRaisedTotal: number;
  campaignsOverallProgressPct: number;

  // Donations
  totalDonationTransactions: number;
  verifiedDonationsCount: number;
  pendingDonationsCount: number;
  failedDonationsCount: number;
  refundedDonationsCount: number;
  totalDonationAmount: number;
  averageDonationAmount: number;
  uniqueDonorsCount: number;
  donations80GCount: number;

  // Finance & Accounting
  totalFinanceIncome: number;
  totalFinanceExpense: number;
  netFinanceBalance: number;
  financeIncomeByCategory: Record<string, number>;
  financeExpenseByCategory: Record<string, number>;
  verifiedIncomeCount: number;
  paidExpenseCount: number;
  pendingExpenseCount: number;

  // Competitions & Exams
  totalCompetitions: number;
  activeCompetitions: number;
  completedCompetitions: number;
  totalParticipants: number;
  completedExamsCount: number;
  resultsPublishedCount: number;
  certificatesIssuedFromCompCount: number;
  competitionsByCategory: Record<string, number>;

  // Certificates
  totalCertificatesIssued: number;
  validCertificatesCount: number;
  revokedCertificatesCount: number;
  certificatesByAward: Record<string, number>;

  // Notifications
  totalBroadcastsCreated: number;
  publishedBroadcastsCount: number;
  scheduledBroadcastsCount: number;
  archivedBroadcastsCount: number;
  broadcastsByCategory: Record<string, number>;
  broadcastsByPriority: Record<string, number>;
}
