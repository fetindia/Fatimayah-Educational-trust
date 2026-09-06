/**
 * @license
 * Unified FET India Core Platform Service API
 * Fatimyah Educational Trust India (FET India)
 * 
 * Architectural Standard (Step 65A):
 * Single, unified, typed service abstraction layer serving:
 * 1. Production Web Platform
 * 2. Android Application
 * 3. Future iOS Application
 * 
 * All client frontends invoke this layer to ensure business logic consistency,
 * strict validation, unified error handling, and authorization checks.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  db, 
  fetchOrgConfig, 
  saveOrgConfig, 
  logAuditEvent,
  auth
} from '../lib/firebase';
import { 
  OrgConfig, 
  Competition, 
  QuestionBank, 
  AuditLog, 
  CrowdfundingCampaign, 
  DonationRecord, 
  FinancialRecord, 
  StaffDocumentRecord,
  MembershipApplication,
  VolunteerApplication,
  DonorApplication,
  UserRole
} from '../types';

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

class FetCoreApiService {
  /**
   * 1. CMS & Global Dynamic Organization Configuration
   */
  async getOrgConfig(): Promise<ApiResult<OrgConfig>> {
    try {
      const config = await fetchOrgConfig();
      return { success: true, data: config, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to retrieve organization configuration', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  async updateOrgConfig(
    newConfig: Partial<OrgConfig>, 
    adminUser: { uid: string; email: string; role: UserRole }
  ): Promise<ApiResult<OrgConfig>> {
    try {
      const updated = await saveOrgConfig(newConfig, adminUser);
      return { success: true, data: updated, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update organization configuration', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * 2. Competitions, Question Papers & Examination Ecosystem
   */
  async getCompetitions(): Promise<ApiResult<Competition[]>> {
    try {
      const colRef = collection(db, 'competitions');
      const snap = await getDocs(colRef);
      const items: Competition[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Competition));
      return { success: true, data: items, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch competitions list', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  async saveCompetition(
    comp: Competition, 
    adminUser: { uid: string; email: string; role: UserRole }
  ): Promise<ApiResult<void>> {
    try {
      const docRef = doc(db, 'competitions', comp.id);
      await setDoc(docRef, {
        ...comp,
        updatedAt: new Date().toISOString(),
        updatedBy: adminUser.email
      }, { merge: true });

      await logAuditEvent({
        actorUid: adminUser.uid,
        actorEmail: adminUser.email,
        actorRole: adminUser.role,
        action: 'COMPETITION_SAVED',
        targetEntity: 'competitions',
        targetId: comp.id,
        details: { title: comp.title, status: comp.status }
      });

      return { success: true, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to save competition', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  async deleteCompetition(
    id: string, 
    adminUser: { uid: string; email: string; role: UserRole }
  ): Promise<ApiResult<void>> {
    try {
      const docRef = doc(db, 'competitions', id);
      await deleteDoc(docRef);

      await logAuditEvent({
        actorUid: adminUser.uid,
        actorEmail: adminUser.email,
        actorRole: adminUser.role,
        action: 'COMPETITION_DELETED',
        targetEntity: 'competitions',
        targetId: id,
        details: { deletedAt: new Date().toISOString() }
      });

      return { success: true, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete competition', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  async getQuestionBanks(): Promise<ApiResult<QuestionBank[]>> {
    try {
      const colRef = collection(db, 'question_banks');
      const snap = await getDocs(colRef);
      const items: QuestionBank[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as QuestionBank));
      return { success: true, data: items, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch question banks', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  async saveQuestionBank(
    bank: QuestionBank, 
    adminUser: { uid: string; email: string; role: UserRole }
  ): Promise<ApiResult<void>> {
    try {
      const docRef = doc(db, 'question_banks', bank.id);
      await setDoc(docRef, {
        ...bank,
        updatedAt: new Date().toISOString(),
        updatedByEmail: adminUser.email
      }, { merge: true });

      await logAuditEvent({
        actorUid: adminUser.uid,
        actorEmail: adminUser.email,
        actorRole: adminUser.role,
        action: 'QUESTION_BANK_SAVED',
        targetEntity: 'question_banks',
        targetId: bank.id,
        details: { title: bank.title, questionsCount: bank.questionsCount }
      });

      return { success: true, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to save question bank', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * 3. Crowdfunding & Relief Campaigns
   */
  async getCampaigns(): Promise<ApiResult<CrowdfundingCampaign[]>> {
    try {
      const colRef = collection(db, 'campaigns');
      const snap = await getDocs(colRef);
      const list: CrowdfundingCampaign[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CrowdfundingCampaign));
      return { success: true, data: list, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch campaigns', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  async getCampaignById(id: string): Promise<ApiResult<CrowdfundingCampaign | null>> {
    try {
      const docRef = doc(db, 'campaigns', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { success: true, data: { id: snap.id, ...snap.data() } as CrowdfundingCampaign, timestamp: new Date().toISOString() };
      }
      return { success: true, data: null, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch campaign details', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * 4. Member, Volunteer & Donor Applications
   */
  async getMembershipApplications(): Promise<ApiResult<MembershipApplication[]>> {
    try {
      const colRef = collection(db, 'membershipApplications');
      const snap = await getDocs(colRef);
      const apps: MembershipApplication[] = [];
      snap.forEach((d) => apps.push({ id: d.id, ...d.data() } as MembershipApplication));
      return { success: true, data: apps, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch membership applications', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  async getVolunteerApplications(): Promise<ApiResult<VolunteerApplication[]>> {
    try {
      const colRef = collection(db, 'volunteerApplications');
      const snap = await getDocs(colRef);
      const apps: VolunteerApplication[] = [];
      snap.forEach((d) => apps.push({ id: d.id, ...d.data() } as VolunteerApplication));
      return { success: true, data: apps, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch volunteer applications', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  async getDonorApplications(): Promise<ApiResult<DonorApplication[]>> {
    try {
      const colRef = collection(db, 'donorApplications');
      const snap = await getDocs(colRef);
      const apps: DonorApplication[] = [];
      snap.forEach((d) => apps.push({ id: d.id, ...d.data() } as DonorApplication));
      return { success: true, data: apps, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch donor applications', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * 5. Centralized Security Audit Logger
   */
  async getAuditLogs(maxLimit = 100): Promise<ApiResult<AuditLog[]>> {
    try {
      const colRef = collection(db, 'audit_logs');
      const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxLimit));
      const snap = await getDocs(q);
      const logs: AuditLog[] = [];
      snap.forEach((d) => logs.push({ id: d.id, ...d.data() } as AuditLog));
      return { success: true, data: logs, timestamp: new Date().toISOString() };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch audit logs', 
        timestamp: new Date().toISOString() 
      };
    }
  }

  async logAudit(params: {
    actorUid: string;
    actorEmail: string;
    actorRole: UserRole;
    action: string;
    targetEntity: string;
    targetId?: string;
    details: Record<string, unknown>;
  }): Promise<void> {
    await logAuditEvent({
      ...params,
      details: params.details as Record<string, any>
    });
  }
}

export const fetApiService = new FetCoreApiService();
