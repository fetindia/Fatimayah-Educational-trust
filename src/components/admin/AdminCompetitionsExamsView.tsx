/**
 * @license
 * Competition & Examination Administrative Governance Console
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Users, 
  FileText, 
  Sparkles,
  Download,
  Send,
  Printer,
  ChevronRight,
  Layers,
  HelpCircle,
  QrCode,
  GraduationCap,
  XCircle,
  RotateCcw,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Lock,
  AlertTriangle,
  Trophy,
  CreditCard,
  Paperclip,
  Upload,
  Languages
} from 'lucide-react';
import { uploadExamPdfMaterial } from '../../lib/storage';
import { 
  Competition, 
  CompetitionRegistration, 
  CompetitionStatus, 
  CompetitionCategory,
  ParticipantAward,
  CompetitionCertificateRecord,
  ExamQuestion,
  CompetitionPrizeTier,
  MultilingualDocumentReference
} from '../../types';
import { MultilingualReaderModal } from './integration/MultilingualReaderModal';
import { INITIAL_COMPETITIONS } from '../../data/initialCompetitions';
import { useAuth } from '../../contexts/AuthContext';
import { db, cleanFirestoreData, revokeCertificate, reinstateCertificate, syncPublicCertificateRecord } from '../../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { DigitalCertificateModal } from '../competitions/DigitalCertificateModal';
import { CertificateVerificationModal } from '../competitions/CertificateVerificationModal';
import { AdminQuestionBanksManager } from './exam/AdminQuestionBanksManager';
import { AdminPaperBuilderModal } from './exam/AdminPaperBuilderModal';
import { AdminExamIntegrityAuditModal } from './exam/AdminExamIntegrityAuditModal';
import { AdminCompetitionPrizesModal } from './competitions/AdminCompetitionPrizesModal';

export const AdminCompetitionsExamsView: React.FC = () => {
  const { currentUser, userProfile, isSuperAdmin } = useAuth();

  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [certificates, setCertificates] = useState<CompetitionCertificateRecord[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [envFilter, setEnvFilter] = useState<'all' | 'live' | 'test'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeAdminTab, setActiveAdminTab] = useState<'catalog' | 'banks' | 'participants' | 'evaluations' | 'results' | 'certificates'>('catalog');
  const [managingPrizesComp, setManagingPrizesComp] = useState<Competition | null>(null);

  // Certificate Management State
  const [certSearchQuery, setCertSearchQuery] = useState<string>('');
  const [certStatusFilter, setCertStatusFilter] = useState<'all' | 'valid' | 'revoked'>('all');
  const [revokingCert, setRevokingCert] = useState<CompetitionCertificateRecord | null>(null);
  const [revocationReasonInput, setRevocationReasonInput] = useState<string>('');
  const [verifyingCertId, setVerifyingCertId] = useState<string | null>(null);
  const [copiedCertId, setCopiedCertId] = useState<string | null>(null);
  const [isProcessingCertAction, setIsProcessingCertAction] = useState<boolean>(false);

  // Notification state
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [viewingCompDetails, setViewingCompDetails] = useState<Competition | null>(null);
  const [deletingComp, setDeletingComp] = useState<Competition | null>(null);
  const [evaluatingReg, setEvaluatingReg] = useState<CompetitionRegistration | null>(null);
  const [previewCert, setPreviewCert] = useState<CompetitionCertificateRecord | null>(null);
  const [buildingPaperComp, setBuildingPaperComp] = useState<Competition | null>(null);
  const [auditingRegData, setAuditingRegData] = useState<{ reg: CompetitionRegistration; comp: Competition } | null>(null);

  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // 1. Listen to Competitions collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'competitions'), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: Competition[] = [];
        snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() } as Competition));
        setCompetitions(loaded);
      } else {
        // Seed default initial competitions into state if collection is fresh
        setCompetitions(INITIAL_COMPETITIONS);
      }
    }, (err) => {
      console.warn('Competitions sync notice:', err);
      setCompetitions(INITIAL_COMPETITIONS);
    });

    return () => unsub();
  }, []);

  // 2. Listen to Registrations collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'competition_registrations'), (snapshot) => {
      const loaded: CompetitionRegistration[] = [];
      snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() } as CompetitionRegistration));
      setRegistrations(loaded);
    }, (err) => {
      console.warn('Registrations sync notice:', err);
    });

    return () => unsub();
  }, []);

  // 3. Listen to Certificates collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'competition_certificates'), (snapshot) => {
      const loaded: CompetitionCertificateRecord[] = [];
      snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() } as CompetitionCertificateRecord));
      setCertificates(loaded);
    }, (err) => {
      console.warn('Certificates sync notice:', err);
    });

    return () => unsub();
  }, []);

  // Seed sample initial competition to Firestore if needed
  const handleSeedDefaults = async () => {
    try {
      for (const comp of INITIAL_COMPETITIONS) {
        if (comp.id) {
          await setDoc(doc(db, 'competitions', comp.id), comp, { merge: true });
        }
      }
      notify('Initial master competition programs synchronized to live Firestore.');
    } catch (err: any) {
      notify(`Sync error: ${err?.message}`);
    }
  };

  // Filtered Competitions
  const filteredCompetitions = competitions.filter((c) => {
    if (c.isDeleted || c.status === 'archived') return false;
    
    // Environment filter (live vs test separation)
    const isTestComp = Boolean(c.isTestCompetition || c.environment === 'test');
    if (envFilter === 'live' && isTestComp) return false;
    if (envFilter === 'test' && !isTestComp) return false;

    const matchCat = selectedCategory === 'all' || c.category === selectedCategory;
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Filtered Registrations
  const filteredRegistrations = registrations.filter((r) => {
    const matchComp = selectedCompId === 'all' || r.competitionId === selectedCompId;
    
    // Environment filter (live vs test candidates)
    const parentComp = competitions.find(c => c.id === r.competitionId);
    const isTestReg = Boolean(r.isTestRegistration || r.environment === 'test' || parentComp?.isTestCompetition || parentComp?.environment === 'test');
    if (envFilter === 'live' && isTestReg) return false;
    if (envFilter === 'test' && !isTestReg) return false;

    const matchSearch = 
      r.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.participantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.schoolInstitution.toLowerCase().includes(searchQuery.toLowerCase());
    return matchComp && matchSearch;
  });

  // Key Statistics
  const totalCompetitions = competitions.filter(c => !c.isDeleted && c.status !== 'archived').length;
  const liveCompetitionsCount = competitions.filter(c => !c.isDeleted && c.status !== 'archived' && !c.isTestCompetition && c.environment !== 'test').length;
  const testCompetitionsCount = competitions.filter(c => !c.isDeleted && c.status !== 'archived' && (c.isTestCompetition || c.environment === 'test')).length;
  const activeRegistrationsCount = competitions.filter((c) => !c.isDeleted && c.status !== 'archived' && c.status === 'registration_open').length;
  const totalCandidates = registrations.length;
  const pendingEvaluations = registrations.filter((r) => r.status === 'attended' && r.marksObtained === undefined).length;
  const publishedResults = registrations.filter((r) => r.isResultPublished).length;
  const totalCertificates = certificates.length;

  // Status Change Handler
  const handleUpdateCompStatus = async (compId: string, newStatus: CompetitionStatus) => {
    try {
      await updateDoc(doc(db, 'competitions', compId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      notify(`Competition status transitioned to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      notify(`Failed to update status: ${err?.message}`);
    }
  };

  // Publish Results for a Competition
  const handlePublishCompetitionResults = async (comp: Competition) => {
    if (!comp.id) return;
    try {
      const compRegs = registrations.filter((r) => r.competitionId === comp.id);
      
      // Update all registrations for this competition to isResultPublished: true
      for (const reg of compRegs) {
        if (reg.id || reg.registrationId) {
          const regDocId = reg.id || reg.registrationId;
          await updateDoc(doc(db, 'competition_registrations', regDocId), {
            isResultPublished: true,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Update competition document
      await updateDoc(doc(db, 'competitions', comp.id), {
        status: 'published',
        isPublished: true,
        resultsPublishedAt: new Date().toISOString(),
        resultsPublishedByUid: currentUser?.uid || 'admin',
        updatedAt: new Date().toISOString()
      });

      // Log to Audit Trail
      await addDoc(collection(db, 'audit_logs'), {
        action: 'COMPETITION_RESULTS_PUBLISHED',
        userId: currentUser?.uid || 'admin',
        userEmail: currentUser?.email || 'admin@fetindia.com',
        details: `Published results for competition ${comp.title} (${comp.code}) with ${compRegs.length} candidate scorecards.`,
        timestamp: new Date().toISOString()
      });

      notify(`Official scorecards & ranks published for ${comp.title}!`);
    } catch (err: any) {
      notify(`Failed to publish results: ${err?.message}`);
    }
  };

  // Batch Issue Certificates for a Competition
  const handleBatchIssueCertificates = async (comp: Competition) => {
    if (!comp.id) return;
    try {
      const compRegs = registrations.filter((r) => r.competitionId === comp.id);
      let count = 0;

      for (const reg of compRegs) {
        const certId = `FET-CERT-CMP-2026-${reg.participantId.slice(-4)}`;
        const certDocId = `cert-${reg.registrationId}`;

        const certRecord: CompetitionCertificateRecord = {
          certificateId: certId,
          participantId: reg.participantId,
          registrationId: reg.registrationId,
          competitionId: comp.id,
          competitionTitle: comp.title,
          competitionCategory: comp.category,
          participantName: reg.participantName,
          parentName: reg.parentName,
          schoolInstitution: reg.schoolInstitution,
          district: reg.district,
          state: reg.state,
          achievement: reg.awardCategory || (reg.rank && reg.rank <= 3 ? (reg.rank === 1 ? '1st_rank' : reg.rank === 2 ? '2nd_rank' : '3rd_rank') : 'participation'),
          achievementTitle: reg.rank === 1 ? 'National 1st Rank Winner' : (reg.awardCategory === 'merit' ? 'Certificate of Merit' : 'Certificate of Participation'),
          rank: reg.rank,
          score: reg.marksObtained,
          totalMarks: comp.maxMarks,
          grade: reg.grade,
          status: 'valid',
          isVerified: true,
          trustName: 'Fatimyah Educational Trust',
          issueDate: new Date().toISOString(),
          issuedByUid: currentUser?.uid || 'exam_controller',
          issuedByEmail: currentUser?.email || 'controller@fetindia.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Write certificate document
        await setDoc(doc(db, 'competition_certificates', certDocId), certRecord);

        // Write public non-sensitive verification record for QR code lookup
        await syncPublicCertificateRecord({
          certificateId: certId,
          recipientName: reg.participantName,
          competitionTitle: comp.title,
          category: comp.category,
          achievementTitle: certRecord.achievementTitle,
          rank: reg.rank || null,
          score: reg.marksObtained,
          totalMarks: comp.maxMarks,
          grade: reg.grade,
          issueDate: certRecord.issueDate.split('T')[0],
          institution: reg.schoolInstitution,
          district: reg.district,
          state: reg.state,
          status: 'valid',
          isVerified: true,
          trustName: 'Fatimyah Educational Trust',
          verifiedAt: new Date().toISOString()
        });

        // Update registration with certificate flag
        const regDocId = reg.id || reg.registrationId;
        await updateDoc(doc(db, 'competition_registrations', regDocId), {
          certificateIssued: true,
          certificateId: certId,
          certificateIssuedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        count++;
      }

      // Log to Audit Trail
      await addDoc(collection(db, 'audit_logs'), {
        action: 'COMPETITION_CERTIFICATES_BATCH_ISSUED',
        userId: currentUser?.uid || 'admin',
        userEmail: currentUser?.email || 'admin@fetindia.com',
        details: `Batch generated and issued ${count} digital verified certificates for ${comp.title}`,
        timestamp: new Date().toISOString()
      });

      notify(`Successfully generated and dispatched ${count} digital certificates!`);
    } catch (err: any) {
      notify(`Certificate dispatch error: ${err?.message}`);
    }
  };

  // Revoke a Certificate (Admin Action)
  const handleConfirmRevoke = async () => {
    if (!revokingCert || !currentUser) return;
    if (!revocationReasonInput.trim()) {
      notify('Please provide a specific reason for credential revocation.');
      return;
    }

    setIsProcessingCertAction(true);
    try {
      await revokeCertificate(revokingCert.certificateId, revocationReasonInput, {
        uid: currentUser.uid,
        email: currentUser.email || 'controller@fetindia.com',
        role: userProfile?.role || 'administrator'
      });
      notify(`Certificate ${revokingCert.certificateId} has been successfully REVOKED.`);
      setRevokingCert(null);
      setRevocationReasonInput('');
    } catch (err: any) {
      notify(`Failed to revoke certificate: ${err?.message}`);
    } finally {
      setIsProcessingCertAction(false);
    }
  };

  // Reinstate a Revoked Certificate (Admin Action)
  const handleConfirmReinstate = async (cert: CompetitionCertificateRecord) => {
    if (!currentUser) return;
    setIsProcessingCertAction(true);
    try {
      await reinstateCertificate(cert.certificateId, {
        uid: currentUser.uid,
        email: currentUser.email || 'controller@fetindia.com',
        role: userProfile?.role || 'administrator'
      });
      notify(`Certificate ${cert.certificateId} has been REINSTATED as VALID.`);
    } catch (err: any) {
      notify(`Failed to reinstate certificate: ${err?.message}`);
    } finally {
      setIsProcessingCertAction(false);
    }
  };

  const handleCopyCertLink = (certId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fetindia.com';
    const verifyUrl = `${origin}/#verify?id=${encodeURIComponent(certId)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(verifyUrl);
      setCopiedCertId(certId);
      setTimeout(() => setCopiedCertId(null), 2500);
    }
  };

  return (
    <div className="space-y-6" id="fet-admin-competitions-console">
      
      {/* Toast Banner */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-700" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Competition & Examination Directorate
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage national book reading competitions, STEM olympiads, question papers, scholar scoring sheets, results, and digital certificate verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedDefaults}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border border-slate-200 flex items-center gap-1.5"
            title="Sync Sample Competitions into Firestore"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Sync Master Programs</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Competition</span>
          </button>
        </div>
      </div>

      {/* 6 Key Performance Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Total Competitions</span>
          <div className="text-xl font-black text-slate-900">{totalCompetitions}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Registration Open</span>
          <div className="text-xl font-black text-emerald-700">{activeRegistrationsCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Enrolled Candidates</span>
          <div className="text-xl font-black text-blue-700">{totalCandidates}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Pending Evaluation</span>
          <div className="text-xl font-black text-amber-600">{pendingEvaluations}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Published Results</span>
          <div className="text-xl font-black text-purple-700">{publishedResults}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Issued Certificates</span>
          <div className="text-xl font-black text-teal-700">{totalCertificates}</div>
        </div>
      </div>

      {/* Admin Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveAdminTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'catalog'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Competitions Directory ({competitions.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('banks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeAdminTab === 'banks'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Question Banks & Book Mastery</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('participants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeAdminTab === 'participants'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Candidate Registrations</span>
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-600 text-white">
              {registrations.length}
            </span>
          </button>
          <button
            onClick={() => setActiveAdminTab('evaluations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'evaluations'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Evaluation & Scoring Sheet</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('results')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'results'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Result Publishing & Ranks</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('certificates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'certificates'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Certificate Accreditation</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search competitions, rolls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: COMPETITIONS CATALOG & MANAGER */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'catalog' && (
        <div className="space-y-4">
          
          {/* Environment Filter Selector: All vs Live vs Test */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Environment:</span>
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setEnvFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    envFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({competitions.filter(c => !c.isDeleted && c.status !== 'archived').length})
                </button>
                <button
                  type="button"
                  onClick={() => setEnvFilter('live')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    envFilter === 'live'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Live ({liveCompetitionsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setEnvFilter('test')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    envFilter === 'test'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Test & Sandbox ({testCompetitionsCount})
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Live examinations visible to candidate portal. Test examinations quarantined.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompetitions.map((comp) => {
              const compRegistrations = registrations.filter((r) => r.competitionId === comp.id);
              const scoredCount = compRegistrations.filter((r) => r.marksObtained !== undefined).length;
              const isTestComp = Boolean(comp.isTestCompetition || comp.environment === 'test');

              return (
                <div 
                  key={comp.id || comp.code}
                  className={`bg-white rounded-3xl border shadow-xs overflow-hidden flex flex-col justify-between ${
                    isTestComp ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    
                    {/* Top Row: Code & Status Menu */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-black bg-slate-900 text-amber-400">
                          {comp.code}
                        </span>
                        {isTestComp ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white uppercase tracking-wide">
                            TEST MODE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                            LIVE
                          </span>
                        )}
                      </div>
                      
                      <select
                        value={comp.status}
                        onChange={(e) => comp.id && handleUpdateCompStatus(comp.id, e.target.value as CompetitionStatus)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          comp.status === 'registration_open'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : comp.status === 'published'
                            ? 'bg-purple-50 border-purple-300 text-purple-800'
                            : comp.status === 'under_evaluation'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="registration_open">Registration Open</option>
                        <option value="registration_closed">Registration Closed</option>
                        <option value="under_evaluation">Under Evaluation</option>
                        <option value="result_pending">Result Pending</option>
                        <option value="published">Results Published</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                        {comp.categoryLabel || comp.category}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                        {comp.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {comp.description}
                      </p>
                    </div>

                    {/* Book Reading specifics */}
                    {comp.bookDetails && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-amber-900 font-bold">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Prescribed Book:</span>
                        </div>
                        <p className="font-bold text-slate-800">{comp.bookDetails.bookTitle}</p>
                        <p className="text-[11px] text-slate-500">By {comp.bookDetails.author}</p>
                      </div>
                    )}

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Exam Date:</span>
                        <span className="font-bold text-slate-800">{comp.competitionDate}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Enrollment:</span>
                        <span className="font-bold text-slate-800">{compRegistrations.length} / {comp.maxParticipants}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Max Marks:</span>
                        <span className="font-bold text-slate-800">{comp.maxMarks} Marks</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Scored / Graded:</span>
                        <span className="font-bold text-purple-800">{scoredCount} Students</span>
                      </div>
                    </div>

                    {/* Dynamic Prizes Preview Strip */}
                    {comp.prizeRewards && comp.prizeRewards.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                        <div className="flex items-center justify-between text-amber-900 font-bold">
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5 text-amber-600" />
                            <span>Prizes & Awards Matrix:</span>
                          </span>
                          <span className="text-[10px] text-amber-800 font-extrabold">
                            {comp.prizeRewards.filter(p => p.status === 'active').length} Active Tiers
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {comp.prizeRewards.filter(p => p.status === 'active').slice(0, 3).map((p, pIdx) => (
                            <span key={p.id || pIdx} className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-[11px] font-semibold text-slate-800 shadow-2xs">
                              #{p.rankPosition} {p.title.split('-')[0].trim()}: {p.rewardAmount && p.rewardAmount > 0 ? `₹${p.rewardAmount.toLocaleString()}` : (p.rewardDescription.length > 22 ? p.rewardDescription.slice(0, 22) + '...' : p.rewardDescription)}
                            </span>
                          ))}
                          {comp.prizeRewards.filter(p => p.status === 'active').length > 3 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              +{comp.prizeRewards.filter(p => p.status === 'active').length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedCompId(comp.id || 'all');
                          setActiveAdminTab('participants');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Roster ({compRegistrations.length})</span>
                      </button>
                      <button
                        onClick={() => setBuildingPaperComp(comp)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 font-bold text-xs cursor-pointer flex items-center gap-1"
                        title="Open Multilingual Question Paper & Sections Builder"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Paper Builder</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      {/* VIEW ACTION */}
                      <button
                        type="button"
                        onClick={() => setViewingCompDetails(comp)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="View Competition Summary, Material & Architecture"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View</span>
                      </button>

                      {isSuperAdmin && (
                        <button
                          onClick={() => setManagingPrizesComp(comp)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Manage Dynamic Prize Structure & Awards for this Competition"
                          id={`manage-prizes-btn-${comp.id}`}
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-600" />
                          <span>Prizes ({comp.prizeRewards?.filter(p => p.status === 'active').length || comp.prizeRewards?.length || 0})</span>
                        </button>
                      )}

                      {/* EDIT ACTION */}
                      {(isSuperAdmin || (Boolean(currentUser?.uid && (comp.createdByUid === currentUser.uid || (comp as any).examControllerUid === currentUser.uid || !comp.createdByUid)) && (userProfile?.role === 'exam_controller' || userProfile?.role === 'exam_admin'))) && (
                        <button
                          onClick={() => setEditingComp(comp)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer flex items-center gap-1"
                          title={isSuperAdmin ? "Super Admin: Full Schedule & Examination Authority" : "Exam Controller: Manage Competition Configuration"}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>
                      )}

                      {comp.status === 'under_evaluation' || comp.status === 'result_pending' ? (
                        <button
                          onClick={() => handlePublishCompetitionResults(comp)}
                          className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                          title="Publish Results to Public Portal"
                        >
                          Publish Results
                        </button>
                      ) : comp.status === 'published' ? (
                        <button
                          onClick={() => handleBatchIssueCertificates(comp)}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Dispatch Certs</span>
                        </button>
                      ) : null}

                      {/* DELETE ACTION (SUPER ADMIN ONLY) */}
                      {isSuperAdmin && comp.id && (
                        <button
                          type="button"
                          onClick={() => setDeletingComp(comp)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer flex items-center gap-1 shadow-2xs transition"
                          title="Super Admin: Delete Competition"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete Competition</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: QUESTION BANKS & BOOK MASTERY */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'banks' && (
        <AdminQuestionBanksManager />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: CANDIDATE REGISTRATIONS */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'participants' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4 sm:p-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Enrolled Candidate Roster</h3>
              <p className="text-xs text-slate-500">View participant credentials, school information, and hall ticket statuses.</p>
            </div>

            {/* Filter by Competition dropdown */}
            <select
              value={selectedCompId}
              onChange={(e) => setSelectedCompId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 cursor-pointer"
            >
              <option value="all">All Competitions ({registrations.length})</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Participant Roll</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Competition</th>
                  <th className="py-3 px-4">Institution & Class</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Attempt Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No candidate registrations found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => {
                    const regParentComp = competitions.find(c => c.id === reg.competitionId);
                    const isTestCandidate = Boolean(reg.isTestRegistration || reg.environment === 'test' || regParentComp?.isTestCompetition || regParentComp?.environment === 'test');

                    return (
                    <tr key={reg.registrationId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <span>{reg.participantId}</span>
                        {isTestCandidate && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-white uppercase tracking-wider inline-block">
                            TEST
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{reg.participantName}</span>
                          {isTestCandidate && (
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1 rounded">
                              Sandbox Candidate
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{reg.mobileNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 max-w-[200px] truncate">{reg.competitionTitle}</div>
                        <span className="text-[10px] font-mono text-slate-400">{reg.competitionCategory}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 max-w-[180px] truncate">{reg.schoolInstitution}</div>
                        <div className="text-[10px] text-emerald-800 font-bold">{reg.classGrade}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {reg.district}, {reg.state}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          reg.examAttemptStatus === 'submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : reg.status === 'attended'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {reg.examAttemptStatus === 'submitted' ? 'Exam Submitted' : 'Hall Ticket Issued'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setEvaluatingReg(reg)}
                          className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Grade / Score
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: EVALUATION & SCORING SHEET */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'evaluations' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Scholar Assessment & Scoring Sheet</h3>
              <p className="text-xs text-slate-500">Record objective assessment marks, evaluate critical essays, and assign merit awards.</p>
            </div>

            <select
              value={selectedCompId}
              onChange={(e) => setSelectedCompId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 cursor-pointer"
            >
              <option value="all">All Competitions</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {filteredRegistrations.map((reg) => {
              const hasScore = reg.marksObtained !== undefined;

              return (
                <div 
                  key={reg.registrationId}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{reg.participantId}</span>
                      <span className="text-xs font-bold text-slate-900">• {reg.participantName}</span>
                      <span className="text-[10px] text-slate-500">({reg.schoolInstitution})</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Competition: <strong>{reg.competitionTitle}</strong>
                    </p>
                    {reg.evaluatorRemarks && (
                      <p className="text-xs text-amber-900 italic">
                        "{reg.evaluatorRemarks}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {hasScore ? (
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-800">
                          {reg.marksObtained} / {reg.totalMarks || 100} Marks
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">
                          Grade: <strong className="text-slate-800">{reg.grade || 'Passed'}</strong> • Rank: <strong className="text-amber-700">{reg.rank ? `#${reg.rank}` : 'Merit'}</strong>
                        </div>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Score Pending
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const targetComp = competitions.find(c => c.id === reg.competitionId) || {
                            id: reg.competitionId,
                            title: reg.competitionTitle,
                            maxMarks: reg.totalMarks || 100
                          } as Competition;
                          setAuditingRegData({ reg, comp: targetComp });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs cursor-pointer shrink-0 flex items-center space-x-1"
                        title="Audit attempt integrity, AI analysis, and question responses"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Integrity & Audit</span>
                      </button>

                      <button
                        onClick={() => setEvaluatingReg(reg)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shrink-0"
                      >
                        {hasScore ? 'Quick Score' : 'Enter Score'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: RESULT PUBLISHING & RANKS */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'results' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900">Official Result Publishing & Leaderboards</h3>
            <p className="text-xs text-slate-500">Review final candidate standings and officially publish scorecards to the public verification portal.</p>
          </div>

          <div className="space-y-6">
            {competitions.map((comp) => {
              const compRegs = registrations.filter((r) => r.competitionId === comp.id);
              const scoredRegs = compRegs
                .filter((r) => r.marksObtained !== undefined)
                .sort((a, b) => (b.marksObtained || 0) - (a.marksObtained || 0));

              return (
                <div key={comp.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-amber-400">
                          {comp.code}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900">{comp.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Status: <strong className="text-slate-900 uppercase">{comp.status}</strong> • Total Candidates: <strong>{compRegs.length}</strong> • Evaluated: <strong>{scoredRegs.length}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {comp.status === 'published' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Results Live on Public Portal
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePublishCompetitionResults(comp)}
                          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Send className="w-4 h-4" />
                          <span>Publish Official Results</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Leaderboard preview */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Top Performers / Leaderboard</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {scoredRegs.slice(0, 3).map((reg, rankIdx) => (
                        <div 
                          key={reg.registrationId}
                          className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                            rankIdx === 0 
                              ? 'bg-amber-50 border-amber-300 text-amber-950'
                              : rankIdx === 1
                              ? 'bg-slate-100 border-slate-300 text-slate-900'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold">
                            <span>{rankIdx === 0 ? '🥇 1st Rank' : rankIdx === 1 ? '🥈 2nd Rank' : '🥉 3rd Rank'}</span>
                            <span className="font-mono font-black">{reg.marksObtained} Marks</span>
                          </div>
                          <div className="font-extrabold text-slate-900 truncate">{reg.participantName}</div>
                          <div className="text-[10px] text-slate-500 truncate">{reg.schoolInstitution}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: CERTIFICATE MANAGEMENT & VERIFICATION CENTER */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'certificates' && (
        <div className="space-y-6">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Issued Credentials</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{certificates.length}</p>
              <span className="text-[11px] text-emerald-700 font-semibold">Across all competitions</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-2xs">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Valid Certificates</span>
              <p className="text-2xl font-black text-emerald-950 mt-1">
                {certificates.filter((c) => c.status !== 'revoked').length}
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold">Publicly verified & active</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-2xs">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Revoked Credentials</span>
              <p className="text-2xl font-black text-rose-950 mt-1">
                {certificates.filter((c) => c.status === 'revoked').length}
              </p>
              <span className="text-[11px] text-rose-700 font-semibold">Cancelled by Examination Board</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Public Verification Hub</span>
                <p className="text-xs text-slate-300 mt-1">Direct accreditation lookup tool</p>
              </div>
              <button
                type="button"
                onClick={() => setVerifyingCertId('FET-CERT-CMP-2026-0001')}
                className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Verification Center</span>
              </button>
            </div>
          </div>

          {/* Certificate Register & Search Filter Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Official Certificate Ledger & Accreditation Center</h3>
                <p className="text-xs text-slate-500">
                  Inspect issued certificates, audit public verification status, and manage administrative revocations or reinstatements.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyingCertId('')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Public Lookup Tool</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={certSearchQuery}
                  onChange={(e) => setCertSearchQuery(e.target.value)}
                  placeholder="Search by Certificate ID, Student Name, Institution, or District..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setCertStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    certStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Statuses
                </button>
                <button
                  type="button"
                  onClick={() => setCertStatusFilter('valid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    certStatusFilter === 'valid'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Valid Only
                </button>
                <button
                  type="button"
                  onClick={() => setCertStatusFilter('revoked')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    certStatusFilter === 'revoked'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Revoked Only
                </button>
              </div>

              {/* Competition Filter */}
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 cursor-pointer shrink-0"
              >
                <option value="all">All Competitions ({competitions.length})</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Certificates Table */}
            {(() => {
              const filteredCerts = certificates.filter((cert) => {
                const matchComp = selectedCompId === 'all' || cert.competitionId === selectedCompId;
                const matchStatus = 
                  certStatusFilter === 'all' ||
                  (certStatusFilter === 'valid' && cert.status !== 'revoked') ||
                  (certStatusFilter === 'revoked' && cert.status === 'revoked');
                
                const q = certSearchQuery.toLowerCase();
                const matchQuery = 
                  cert.certificateId.toLowerCase().includes(q) ||
                  cert.participantName.toLowerCase().includes(q) ||
                  cert.competitionTitle.toLowerCase().includes(q) ||
                  (cert.schoolInstitution && cert.schoolInstitution.toLowerCase().includes(q)) ||
                  (cert.district && cert.district.toLowerCase().includes(q));

                return matchComp && matchStatus && matchQuery;
              });

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-wider border-y border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Certificate ID</th>
                        <th className="py-3 px-4">Recipient Candidate</th>
                        <th className="py-3 px-4">Competition & Award</th>
                        <th className="py-3 px-4">Merit Details</th>
                        <th className="py-3 px-4">Issue Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCerts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="font-bold text-slate-700">No certificates found matching your query.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Issue batch certificates below or adjust search filters.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredCerts.map((cert) => {
                          const isRevoked = cert.status === 'revoked';

                          return (
                            <tr key={cert.certificateId} className="hover:bg-slate-50 transition-colors">
                              
                              {/* Certificate ID */}
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <span>{cert.certificateId}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCertLink(cert.certificateId)}
                                    className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                                    title="Copy QR Verification URL"
                                  >
                                    {copiedCertId === cert.certificateId ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Recipient */}
                              <td className="py-3.5 px-4">
                                <div className="font-extrabold text-slate-900">{cert.participantName}</div>
                                {cert.schoolInstitution && (
                                  <div className="text-[10px] text-slate-500 max-w-[180px] truncate">
                                    {cert.schoolInstitution}
                                  </div>
                                )}
                                {(cert.district || cert.state) && (
                                  <div className="text-[10px] text-slate-400">
                                    {cert.district}{cert.district && cert.state ? ', ' : ''}{cert.state}
                                  </div>
                                )}
                              </td>

                              {/* Competition */}
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-emerald-950 max-w-[200px] truncate">{cert.competitionTitle}</div>
                                <span className="inline-block text-[10px] font-extrabold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5">
                                  {cert.achievementTitle}
                                </span>
                              </td>

                              {/* Merit */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5">
                                  {cert.score !== undefined && (
                                    <div className="font-bold text-slate-800">
                                      {cert.score} / {cert.totalMarks || 100} Marks
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-[10px]">
                                    {cert.grade && <span className="font-bold text-emerald-700">Grade {cert.grade}</span>}
                                    {cert.rank && <span className="font-bold text-amber-700">Rank #{cert.rank}</span>}
                                  </div>
                                </div>
                              </td>

                              {/* Issue Date */}
                              <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                                {cert.issueDate ? cert.issueDate.split('T')[0] : '2026-02-01'}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4">
                                {isRevoked ? (
                                  <div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                      REVOKED
                                    </span>
                                    {cert.revocationReason && (
                                      <p className="text-[9px] text-rose-700 max-w-[140px] truncate mt-0.5" title={cert.revocationReason}>
                                        {cert.revocationReason}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    VALID
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  
                                  {/* Preview */}
                                  <button
                                    type="button"
                                    onClick={() => setPreviewCert(cert)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                                    title="Preview Digital Certificate"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Public Verify Modal */}
                                  <button
                                    type="button"
                                    onClick={() => setVerifyingCertId(cert.certificateId)}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer"
                                    title="Verify in Public Portal"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Revoke / Reinstate */}
                                  {isRevoked ? (
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmReinstate(cert)}
                                      disabled={isProcessingCertAction}
                                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1"
                                      title="Reinstate Certificate"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Reinstate</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setRevokingCert(cert)}
                                      disabled={isProcessingCertAction}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1"
                                      title="Revoke Credential"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      <span>Revoke</span>
                                    </button>
                                  )}

                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}

          </div>

          {/* Batch Issuance Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Program Batch Issuance Directorate</h3>
              <p className="text-xs text-slate-500">
                Dispatch automated digital tamper-proof certificates to all evaluated participants of published competitions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitions.map((comp) => {
                const compRegs = registrations.filter((r) => r.competitionId === comp.id);
                const issuedCerts = certificates.filter((c) => c.competitionId === comp.id);

                return (
                  <div key={comp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-black text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {comp.code}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900">{comp.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Candidates: <strong>{compRegs.length}</strong> • Certificates Issued: <strong className="text-teal-700">{issuedCerts.length}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBatchIssueCertificates(comp)}
                      className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <Award className="w-4 h-4" />
                      <span>Issue / Update Batch</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: REVOKE CERTIFICATE REASON DIALOG */}
      {/* ------------------------------------------------------------- */}
      {revokingCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Revoke Academic Credential</h3>
                <p className="text-xs text-slate-500">ID: {revokingCert.certificateId}</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
              <p className="font-bold">Caution: This action will invalidate the certificate publicly.</p>
              <p className="text-[11px] text-rose-800">
                Candidate: <strong>{revokingCert.participantName}</strong> • {revokingCert.competitionTitle}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reason for Revocation (Required)
              </label>
              <textarea
                rows={3}
                value={revocationReasonInput}
                onChange={(e) => setRevocationReasonInput(e.target.value)}
                placeholder="e.g. Disqualified following academic scrutiny / disciplinary board decision regarding submission plagiarism."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRevokingCert(null);
                  setRevocationReasonInput('');
                }}
                disabled={isProcessingCertAction}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={isProcessingCertAction || !revocationReasonInput.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <XCircle className="w-4 h-4" />
                <span>{isProcessingCertAction ? 'Processing...' : 'Confirm Revocation'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PUBLIC CERTIFICATE VERIFICATION CENTER */}
      {/* ------------------------------------------------------------- */}
      {verifyingCertId !== null && (
        <CertificateVerificationModal
          isOpen={true}
          initialCertificateId={verifyingCertId}
          onClose={() => setVerifyingCertId(null)}
          onViewCertificateDetails={(pubCert) => {
            const fullMatch = certificates.find((c) => c.certificateId === pubCert.certificateId);
            if (fullMatch) {
              setPreviewCert(fullMatch);
              setVerifyingCertId(null);
            }
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: CREATE / SCHEDULE / EDIT COMPETITION */}
      {/* ------------------------------------------------------------- */}
      {showCreateModal && (
        <CreateCompetitionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(comp) => {
            setShowCreateModal(false);
            notify(`Competition "${comp.title}" created successfully!`);
          }}
        />
      )}

      {editingComp && (
        <CreateCompetitionModal
          initialCompetition={editingComp}
          onClose={() => setEditingComp(null)}
          onSuccess={(comp) => {
            setEditingComp(null);
            notify(`Competition "${comp.title}" and prize rewards updated successfully!`);
          }}
          onDelete={() => {
            const comp = editingComp;
            setEditingComp(null);
            setDeletingComp(comp);
          }}
        />
      )}

      {/* VIEW COMPETITION DETAILS MODAL */}
      {viewingCompDetails && (
        <CompetitionOverviewModal
          competition={viewingCompDetails}
          registrationsCount={registrations.filter(r => r.competitionId === viewingCompDetails.id).length}
          scoredCount={registrations.filter(r => r.competitionId === viewingCompDetails.id && r.marksObtained !== undefined).length}
          onClose={() => setViewingCompDetails(null)}
          onEdit={() => {
            const comp = viewingCompDetails;
            setViewingCompDetails(null);
            setEditingComp(comp);
          }}
          onOpenPaperBuilder={() => {
            const comp = viewingCompDetails;
            setViewingCompDetails(null);
            setBuildingPaperComp(comp);
          }}
          onDelete={() => {
            const comp = viewingCompDetails;
            setViewingCompDetails(null);
            setDeletingComp(comp);
          }}
          isSuperAdmin={isSuperAdmin}
          canEdit={isSuperAdmin || (Boolean(currentUser?.uid && (viewingCompDetails.createdByUid === currentUser.uid || !viewingCompDetails.createdByUid)) && (userProfile?.role === 'exam_controller' || userProfile?.role === 'exam_admin'))}
        />
      )}

      {/* DELETE / ARCHIVE COMPETITION MODAL (SUPER ADMIN ONLY) */}
      {deletingComp && (
        <DeleteCompetitionModal
          competition={deletingComp}
          isSuperAdmin={isSuperAdmin}
          adminUid={currentUser?.uid || ''}
          adminEmail={currentUser?.email || ''}
          registeredCount={registrations.filter(r => r.competitionId === deletingComp.id).length}
          onClose={() => setDeletingComp(null)}
          onSuccess={(mode, compId) => {
            setCompetitions(prev => prev.filter(c => c.id !== compId && c.code !== deletingComp.code));
            setDeletingComp(null);
            notify(`Competition "${deletingComp.title}" ${mode === 'permanent' ? 'permanently removed' : 'archived'} successfully. Historical records preserved.`);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: SUPER ADMIN COMPETITION PRIZES & REWARDS MANAGER */}
      {/* ------------------------------------------------------------- */}
      {managingPrizesComp && (
        <AdminCompetitionPrizesModal
          competition={managingPrizesComp}
          onClose={() => setManagingPrizesComp(null)}
          onSuccess={(updatedComp) => {
            setCompetitions(prev => prev.map(c => c.id === updatedComp.id ? updatedComp : c));
            setManagingPrizesComp(null);
            notify(`Prize configuration for "${updatedComp.title}" saved and updated successfully!`);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: GRADE / SCORE CANDIDATE */}
      {/* ------------------------------------------------------------- */}
      {evaluatingReg && (
        <GradeCandidateModal
          registration={evaluatingReg}
          onClose={() => setEvaluatingReg(null)}
          onSuccess={() => {
            setEvaluatingReg(null);
            notify('Candidate scorecard updated successfully.');
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: PREVIEW CERTIFICATE */}
      {/* ------------------------------------------------------------- */}
      {previewCert && (
        <DigitalCertificateModal
          certificate={previewCert}
          onClose={() => setPreviewCert(null)}
          onOpenVerifyModal={(id) => setVerifyingCertId(id)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: MULTILINGUAL QUESTION PAPER BUILDER */}
      {/* ------------------------------------------------------------- */}
      {buildingPaperComp && (
        <AdminPaperBuilderModal
          competition={buildingPaperComp}
          onClose={() => setBuildingPaperComp(null)}
          onSave={(updated) => {
            setCompetitions(prev => prev.map(c => c.id === updated.id ? updated : c));
            setBuildingPaperComp(null);
            notify(`Question paper and section blueprint for "${buildingPaperComp.title}" updated successfully.`);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 5: EXAM INTEGRITY AUDIT & AI SCORING MODAL */}
      {/* ------------------------------------------------------------- */}
      {auditingRegData && (
        <AdminExamIntegrityAuditModal
          registration={auditingRegData.reg}
          competition={auditingRegData.comp}
          onClose={() => setAuditingRegData(null)}
          onUpdated={() => {
            setAuditingRegData(null);
            notify(`Integrity audit and evaluation updated for ${auditingRegData.reg.participantName}.`);
          }}
        />
      )}

    </div>
  );
};

// -------------------------------------------------------------
// SUB-MODAL: COMPETITION OVERVIEW & DETAILS
// -------------------------------------------------------------
interface CompetitionOverviewModalProps {
  competition: Competition;
  registrationsCount: number;
  scoredCount: number;
  onClose: () => void;
  onEdit: () => void;
  onOpenPaperBuilder: () => void;
  onDelete?: () => void;
  isSuperAdmin: boolean;
  canEdit: boolean;
}

const CompetitionOverviewModal: React.FC<CompetitionOverviewModalProps> = ({
  competition,
  registrationsCount,
  scoredCount,
  onClose,
  onEdit,
  onOpenPaperBuilder,
  onDelete,
  isSuperAdmin,
  canEdit
}) => {
  const { currentUser } = useAuth();
  const exam = competition.examDetails;
  const book = competition.bookDetails;
  const scheduleDate = competition.examScheduleDate || exam?.examScheduleDate || competition.competitionDate;
  const openingTime = competition.openingTime || exam?.openingTime || '09:00';
  const closingTime = competition.closingTime || exam?.closingTime || '10:00';
  const timeZone = competition.timeZone || exam?.timeZone || 'Asia/Kolkata';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-slate-900 text-amber-400">
                {competition.code}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {competition.categoryLabel || competition.category}
              </span>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded capitalize">
                {competition.status.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
              {competition.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {competition.description}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
          {/* Schedule & Examination Window */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Examination Schedule & Strict Window</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Exam Date</span>
                <span className="font-bold text-slate-900 text-xs">{scheduleDate}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Opening Time</span>
                <span className="font-bold text-slate-900 text-xs">{openingTime} ({timeZone})</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Closing Time</span>
                <span className="font-bold text-slate-900 text-xs">{closingTime} ({timeZone})</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Allowed Duration</span>
                <span className="font-bold text-emerald-700 text-xs">{exam?.durationMinutes || 45} Minutes</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-1">
              <span>• Max Marks: <strong className="text-slate-900">{competition.maxMarks}</strong></span>
              <span>• Passing Cutoff: <strong className="text-slate-900">{competition.passingMarks}</strong></span>
              <span>• Multiple Attempts: <strong className="text-slate-900">{competition.allowMultipleAttempts ? 'Permitted' : 'Strictly 1 Attempt'}</strong></span>
            </div>
          </div>

          {/* Book Mastery / Reading Material */}
          {book && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
              <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <span>Prescribed Book & Study Material</span>
              </h4>
              <div className="bg-white p-3 rounded-xl border border-amber-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{book.bookTitle}</span>
                  <span className="text-[11px] text-slate-500">By {book.author}</span>
                </div>
                {book.requiredChapters && (
                  <p className="text-[11px] text-amber-900">Chapters: {book.requiredChapters}</p>
                )}
                {(competition.pdfReadingMaterialUrl || book.pdfReadingMaterialUrl) && (
                  <div className="pt-1.5 flex items-center gap-2">
                    <a
                      href={
                        (competition.pdfReadingMaterialUrl || book.pdfReadingMaterialUrl)?.startsWith('/api/')
                          ? `${competition.pdfReadingMaterialUrl || book.pdfReadingMaterialUrl}?uid=${encodeURIComponent(currentUser?.uid || 'super_admin')}`
                          : (competition.pdfReadingMaterialUrl || book.pdfReadingMaterialUrl)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold hover:bg-amber-700"
                    >
                      <Download className="w-3 h-3" />
                      <span>Access Prescribed PDF</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Examination Paper & Sections Architecture */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 text-sm">
                <FileText className="w-4 h-4 text-indigo-700" />
                <span>Paper Architecture & Series</span>
              </h4>
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold">
                {exam?.paperCode || `PPR-${competition.code}`}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Series Config</span>
                <span className="font-bold text-indigo-900 text-xs">{competition.seriesCount || exam?.seriesCount || 1} Series (1 to 5)</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Sections</span>
                <span className="font-bold text-indigo-900 text-xs">{exam?.sections?.length || 1} Sections</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Questions</span>
                <span className="font-bold text-indigo-900 text-xs">{exam?.questions?.length || 0} Questions</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Anti-Cheat</span>
                <span className="font-bold text-indigo-900 text-xs">Active Proctoring</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 pt-1">
              <span>• Question Shuffle: <strong>{exam?.shuffleQuestions ? 'Enabled' : 'Default'}</strong></span>
              <span>• Option Shuffle: <strong>{exam?.shuffleOptions ? 'Enabled' : 'Default'}</strong></span>
              <span>• Auto-Submit on Expiry: <strong>Strictly Enforced (00:00)</strong></span>
            </div>
          </div>

          {/* Candidate Registration Stats */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm mb-2">
              <Users className="w-4 h-4 text-slate-700" />
              <span>Participant Enrollments & Grading Summary</span>
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                <span className="text-slate-400 text-[10px] block">Total Registered</span>
                <span className="text-base font-bold text-slate-900">{registrationsCount} / {competition.maxParticipants}</span>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-xl text-center">
                <span className="text-purple-600 text-[10px] block">Evaluated / Scored</span>
                <span className="text-base font-bold text-purple-900">{scoredCount}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl text-center">
                <span className="text-emerald-600 text-[10px] block">Enrollment Status</span>
                <span className="text-base font-bold text-emerald-900">{competition.status === 'registration_open' ? 'Open' : 'Closed'}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Prizes Summary */}
          {competition.prizeRewards && competition.prizeRewards.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>Dynamic Prize Structure & Awards</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {competition.prizeRewards.map((p, idx) => (
                  <div key={p.id || idx} className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">Rank #{p.rankPosition}: {p.title}</span>
                      <p className="text-[11px] text-slate-500">{p.rewardDescription}</p>
                    </div>
                    {p.rewardAmount && p.rewardAmount > 0 ? (
                      <span className="font-bold text-amber-700">₹{p.rewardAmount.toLocaleString()}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close Summary
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenPaperBuilder}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Open Paper Builder</span>
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Competition</span>
              </button>
            )}
            {isSuperAdmin && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Super Admin: Delete Competition"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Competition</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SUB-MODAL: DELETE / ARCHIVE COMPETITION (SUPER ADMIN ONLY)
// -------------------------------------------------------------
interface DeleteCompetitionModalProps {
  competition: Competition;
  isSuperAdmin: boolean;
  adminUid: string;
  adminEmail: string;
  registeredCount: number;
  onClose: () => void;
  onSuccess: (mode: 'archive' | 'permanent', competitionId: string) => void;
}

const DeleteCompetitionModal: React.FC<DeleteCompetitionModalProps> = ({
  competition,
  isSuperAdmin,
  adminUid,
  adminEmail,
  registeredCount,
  onClose,
  onSuccess
}) => {
  const [deleteMode, setDeleteMode] = useState<'archive' | 'permanent'>('archive');
  const [confirmInput, setConfirmInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Permission Restricted</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            ONLY Super Admin possesses authority to delete or archive competitions. Exam Controllers are strictly prohibited from deleting competitions, even if created by them.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (deleteMode === 'permanent' && confirmInput.trim() !== competition.code && confirmInput.trim().toUpperCase() !== 'DELETE') {
      setErrorMessage(`Please type "${competition.code}" or "DELETE" to confirm permanent deletion.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Execute through server endpoint with strict Super Admin checks & audit logging
      const res = await fetch('/api/competitions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId: competition.id,
          adminUid,
          adminEmail,
          mode: deleteMode
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Server rejected competition deletion.');
      }

      onSuccess(deleteMode, competition.id!);
    } catch (err: any) {
      console.warn('Backend delete note, executing direct Firestore safeguard:', err);
      // Client-side fallback if server route is unavailable
      try {
        if (deleteMode === 'archive' && competition.id) {
          await updateDoc(doc(db, 'competitions', competition.id), {
            isDeleted: true,
            status: 'archived',
            archivedAt: new Date().toISOString()
          });
          onSuccess('archive', competition.id);
        } else if (deleteMode === 'permanent' && competition.id) {
          await deleteDoc(doc(db, 'competitions', competition.id));
          onSuccess('permanent', competition.id);
        } else if (competition.id || competition.code) {
          onSuccess(deleteMode, competition.id || competition.code);
        }
      } catch (clientErr: any) {
        // If document does not exist in Firestore (e.g. initial fresh seed), proceed with local success
        if (clientErr?.code === 'not-found' || String(clientErr?.message).includes('No document to update') || String(err?.message).includes('not found')) {
          onSuccess(deleteMode, competition.id || competition.code);
        } else {
          setErrorMessage(clientErr.message || err.message || 'Failed to process request.');
          setIsProcessing(false);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-scaleIn">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Super Admin Authority</span>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              Delete or Archive Competition
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Competition Banner */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <div className="text-[11px] font-mono font-bold text-slate-500">{competition.code}</div>
          <div className="text-sm font-bold text-slate-900">{competition.title}</div>
          <div className="text-xs text-slate-600">
            Enrolled Candidates: <strong className="text-slate-900">{registeredCount} Students</strong>
          </div>
        </div>

        {/* Protection Guarantee */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong>Historical Records Protection:</strong> Historical participant registrations, payment records, exam attempts, scores, and issued certificates are permanently preserved in the database for legal and trust compliance.
          </span>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        {/* Mode Selector */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold text-slate-800 block">Select Deletion Action</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeleteMode('archive')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                deleteMode === 'archive'
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs">Soft Delete / Archive (Recommended)</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                Hides competition from candidate portals immediately. Retains full administrative configuration.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDeleteMode('permanent')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                deleteMode === 'permanent'
                  ? 'border-rose-600 bg-rose-50/70 text-rose-950 ring-2 ring-rose-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs text-rose-700">Permanent Removal</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                Removes this competition record from the catalog. Preserves historical student attempts and certs.
              </div>
            </button>
          </div>
        </div>

        {/* Confirmation Input for Permanent Mode */}
        {deleteMode === 'permanent' && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-rose-900 block">
              Explicit Confirmation Required
            </label>
            <p className="text-[11px] text-slate-500">
              Type <strong className="text-slate-900 font-mono">{competition.code}</strong> or <strong className="text-slate-900 font-mono">DELETE</strong> to confirm permanent deletion:
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={`Enter ${competition.code} to confirm...`}
              className="w-full bg-slate-50 border border-rose-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-rose-500"
            />
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`px-5 py-2.5 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md ${
              deleteMode === 'permanent'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            {isProcessing ? 'Processing...' : deleteMode === 'permanent' ? 'Permanently Delete' : 'Confirm Archive'}
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SUB-MODAL: CREATE / EDIT COMPETITION & PRIZES
// -------------------------------------------------------------
interface CreateCompetitionModalProps {
  initialCompetition?: Competition | null;
  onClose: () => void;
  onSuccess: (comp: Competition) => void;
  onDelete?: () => void;
}

const CreateCompetitionModal: React.FC<CreateCompetitionModalProps> = ({ initialCompetition, onClose, onSuccess, onDelete }) => {
  const { currentUser, isSuperAdmin, userProfile } = useAuth();
  const isEditing = Boolean(initialCompetition);

  // Stable draft competition ID so PDF upload and Firestore document record are always locked to the identical ID
  const [draftCompId] = useState<string>(() => initialCompetition?.id || `cmp-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: initialCompetition?.code || `FET-CMP-2026-00${Math.floor(10 + Math.random() * 90)}`,
    title: initialCompetition?.title || '',
    category: (initialCompetition?.category || 'book_reading') as CompetitionCategory,
    categoryLabel: initialCompetition?.categoryLabel || 'Book Reading Competition',
    description: initialCompetition?.description || '',
    eligibilityAgeMin: initialCompetition?.eligibilityAgeMin ?? 12,
    eligibilityAgeMax: initialCompetition?.eligibilityAgeMax ?? 22,
    eligibleClasses: initialCompetition?.eligibleClasses?.join(', ') || 'Class 8th, Class 9th, Class 10th, Class 11th, Class 12th',
    registrationStartDate: initialCompetition?.registrationStartDate || new Date().toISOString().split('T')[0],
    registrationEndDate: initialCompetition?.registrationEndDate || '2026-10-15',
    competitionDate: initialCompetition?.competitionDate || '2026-10-30',
    resultPublicationDate: initialCompetition?.resultPublicationDate || '2026-11-15',
    maxParticipants: initialCompetition?.maxParticipants ?? 2000,
    maxMarks: initialCompetition?.maxMarks ?? 100,
    passingMarks: initialCompetition?.passingMarks ?? 40,
    // Scheduled Examination & Timing Controls
    examScheduleDate: initialCompetition?.examScheduleDate || initialCompetition?.examDetails?.examScheduleDate || initialCompetition?.competitionDate || '2026-10-30',
    openingTime: initialCompetition?.openingTime || initialCompetition?.examDetails?.openingTime || '09:00',
    closingTime: initialCompetition?.closingTime || initialCompetition?.examDetails?.closingTime || '10:00',
    timeZone: initialCompetition?.timeZone || initialCompetition?.examDetails?.timeZone || 'Asia/Kolkata',
    allowMultipleAttempts: initialCompetition?.allowMultipleAttempts ?? initialCompetition?.examDetails?.allowMultipleAttempts ?? false,
    // Book details
    isBookReading: initialCompetition ? Boolean(initialCompetition.bookDetails) : true,
    bookTitle: initialCompetition?.bookDetails?.bookTitle || 'Wings of Fire: An Autobiography',
    author: initialCompetition?.bookDetails?.author || 'Dr. A.P.J. Abdul Kalam',
    requiredChapters: initialCompetition?.bookDetails?.requiredChapters || 'Chapters 1 to 6',
    // Exam details
    isOnlineExam: initialCompetition?.examDetails?.isOnlineExam ?? true,
    durationMinutes: initialCompetition?.examDetails?.durationMinutes ?? 45,
    coverImageUrl: initialCompetition?.coverImageUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    status: (initialCompetition?.status || 'registration_open') as CompetitionStatus,
    prizesSummary: initialCompetition?.prizesSummary?.join(', ') || '1st Prize: ₹25,000 Gold Medal & Trophy, 2nd Prize: ₹15,000 Silver Medal, 3rd Prize: ₹10,000 Bronze Medal, Top 10 Distinction Certificates',
    // Participation Fee & Evaluation Automation
    isPaid: initialCompetition?.isPaid ?? false,
    participationFee: initialCompetition?.participationFee ?? 0,
    autoEvaluateResults: initialCompetition?.autoEvaluateResults ?? true,
    autoPublishResults: initialCompetition?.autoPublishResults ?? false,
    // Examination Book / PDF Reading Material
    pdfReadingMaterialUrl: initialCompetition?.pdfReadingMaterialUrl || initialCompetition?.bookDetails?.pdfReadingMaterialUrl || '',
    pdfFileName: initialCompetition?.pdfFileName || initialCompetition?.bookDetails?.pdfFileName || '',
    pdfFileSizeBytes: initialCompetition?.pdfFileSizeBytes || initialCompetition?.bookDetails?.pdfFileSizeBytes || 0,
    pdfSourceType: (initialCompetition?.pdfSourceType || initialCompetition?.bookDetails?.pdfSourceType || 'upload') as 'upload' | 'external_url',
    pdfExternalUrl: initialCompetition?.bookDetails?.pdfExternalUrl || (initialCompetition?.pdfSourceType === 'external_url' ? initialCompetition?.pdfReadingMaterialUrl : '') || '',
    pdfStoragePath: initialCompetition?.pdfStoragePath || initialCompetition?.bookDetails?.pdfStoragePath || '',
    pdfCloudStorageUrl: (initialCompetition as any)?.pdfCloudStorageUrl || (initialCompetition as any)?.bookDetails?.pdfCloudStorageUrl || '',
    // Test vs Live environment separation
    isTestCompetition: initialCompetition?.isTestCompetition ?? (initialCompetition?.environment === 'test') ?? false,
    environment: (initialCompetition?.environment || (initialCompetition?.isTestCompetition ? 'test' : 'live')) as 'live' | 'test'
  });

  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<'idle' | 'selected' | 'uploading' | 'finalizing' | 'completed' | 'error'>(() => {
    return (initialCompetition?.pdfReadingMaterialUrl || initialCompetition?.bookDetails?.pdfReadingMaterialUrl) ? 'completed' : 'idle';
  });
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const pdfFileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePdfFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setPdfUploadError('Invalid format: Only official PDF files (.pdf) are accepted.');
      setSelectedPdfFile(null);
      setUploadStage('error');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setPdfUploadError(`File exceeds 25 MB limit (Selected file is ${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 25 MB.`);
      setSelectedPdfFile(null);
      setUploadStage('error');
      return;
    }

    setPdfUploadError(null);
    setSelectedPdfFile(file);
    setUploadStage('selected');
  };

  const handleStartPdfUpload = async () => {
    if (!selectedPdfFile) return;

    setIsUploadingPdf(true);
    setUploadStage('uploading');
    setPdfUploadProgress(10);
    setPdfUploadError(null);

    try {
      const res = await uploadExamPdfMaterial(selectedPdfFile, draftCompId, (pct) => {
        setPdfUploadProgress(pct);
        if (pct >= 88) setUploadStage('finalizing');
      });

      if (!res || !res.url) {
        throw new Error('Upload succeeded without valid file reference.');
      }

      const storagePath = res.storagePath || `examination_materials/${draftCompId}/${res.fileName}`;

      const cleanCloudStorageUrl = (res.cloudStorageUrl && res.cloudStorageUrl.startsWith('http') && !res.cloudStorageUrl.includes('/api/competitions/'))
        ? res.cloudStorageUrl
        : undefined;

      setFormData(prev => ({
        ...prev,
        pdfReadingMaterialUrl: res.url,
        pdfFileName: res.fileName,
        pdfFileSizeBytes: res.sizeBytes,
        pdfSourceType: 'upload',
        pdfStoragePath: storagePath,
        pdfCloudStorageUrl: cleanCloudStorageUrl
      }));

      // If editing an existing competition, immediately update the record in Firestore
      if (isEditing && initialCompetition?.id) {
        try {
          const updatePayload: Record<string, any> = {
            pdfReadingMaterialUrl: res.url,
            pdfFileName: res.fileName,
            pdfFileSizeBytes: res.sizeBytes,
            pdfSourceType: 'upload',
            pdfStoragePath: storagePath,
            'bookDetails.pdfReadingMaterialUrl': res.url,
            'bookDetails.pdfFileName': res.fileName,
            'bookDetails.pdfFileSizeBytes': res.sizeBytes,
            'bookDetails.pdfSourceType': 'upload',
            'bookDetails.pdfStoragePath': storagePath,
            updatedAt: new Date().toISOString()
          };
          if (cleanCloudStorageUrl) {
            updatePayload.pdfCloudStorageUrl = cleanCloudStorageUrl;
            updatePayload['bookDetails.pdfCloudStorageUrl'] = cleanCloudStorageUrl;
          }
          await updateDoc(doc(db, 'competitions', initialCompetition.id), updatePayload);
        } catch (dbErr) {
          console.warn('Notice saving immediate PDF reference to Firestore:', dbErr);
        }
      }

      setUploadStage('completed');
      setSelectedPdfFile(null);
      setSubmitError(null);
    } catch (err: any) {
      setPdfUploadError(err?.message || 'Failed to upload PDF.');
      setUploadStage('error');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const [prizeTiers, setPrizeTiers] = useState<CompetitionPrizeTier[]>(
    initialCompetition?.prizeRewards && initialCompetition.prizeRewards.length > 0
      ? initialCompetition.prizeRewards
      : [
          {
            id: 'pz-1',
            rankPosition: 1,
            title: '1st Prize - Gold Distinction',
            rewardAmount: 25000,
            rewardDescription: 'Gold Medal, Certificate of Excellence & ₹25,000 Educational Grant',
            winnerCount: 1,
            status: 'active'
          },
          {
            id: 'pz-2',
            rankPosition: 2,
            title: '2nd Prize - Silver Distinction',
            rewardAmount: 15000,
            rewardDescription: 'Silver Medal, Certificate of Excellence & ₹15,000 Educational Grant',
            winnerCount: 1,
            status: 'active'
          },
          {
            id: 'pz-3',
            rankPosition: 3,
            title: '3rd Prize - Bronze Distinction',
            rewardAmount: 10000,
            rewardDescription: 'Bronze Medal, Certificate of Excellence & ₹10,000 Educational Grant',
            winnerCount: 1,
            status: 'active'
          }
        ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdatePrize = (index: number, field: keyof CompetitionPrizeTier, val: any) => {
    setPrizeTiers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleAddPrizeTier = () => {
    const nextRank = prizeTiers.length + 1;
    setPrizeTiers(prev => [
      ...prev,
      {
        id: `pz-${Date.now()}-${nextRank}`,
        rankPosition: nextRank,
        title: `${nextRank}th Place - Consolation Award`,
        rewardAmount: 2000,
        rewardDescription: 'Merit Trophy & Educational Kit',
        winnerCount: 1,
        status: 'active'
      }
    ]);
  };

  const handleRemovePrizeTier = (index: number) => {
    setPrizeTiers(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isUploadingPdf) return;
    setSubmitError(null);

    if (!formData.title.trim()) {
      setSubmitError('Competition title is required.');
      return;
    }

    if (!formData.description.trim()) {
      setSubmitError('Competition description is required.');
      return;
    }

    if (!formData.examScheduleDate) {
      setSubmitError('Official examination date is required.');
      return;
    }

    // RBAC Security Check: Super Admin and Exam Controllers have management authority
    const isCreator = Boolean(initialCompetition?.createdByUid && currentUser?.uid && initialCompetition.createdByUid === currentUser.uid);
    const hasControllerAuthority = isSuperAdmin || 
      userProfile?.role === 'exam_controller' || 
      userProfile?.role === 'exam_admin' || 
      userProfile?.roles?.includes('exam_controller') || 
      userProfile?.roles?.includes('exam_admin') || 
      userProfile?.primaryRole === 'exam_controller';

    if (isEditing && !isSuperAdmin && !isCreator && !hasControllerAuthority) {
      setSubmitError('RBAC Access Denied: You do not have permission to modify another controller\'s examination schedule.');
      return;
    }

    setIsSubmitting(true);
    try {
      const compId = draftCompId;

      let resolvedPdfUrl = formData.pdfSourceType === 'external_url' ? formData.pdfExternalUrl.trim() : formData.pdfReadingMaterialUrl;
      let resolvedFileName = formData.pdfFileName;
      let resolvedSizeBytes = formData.pdfFileSizeBytes;
      let resolvedStoragePath = formData.pdfStoragePath;

      // Auto-upload selected PDF file if user clicked submit without clicking 'Start Official Upload' separately
      if (selectedPdfFile && formData.pdfSourceType === 'upload' && (!resolvedPdfUrl || uploadStage === 'selected')) {
        setIsUploadingPdf(true);
        setUploadStage('uploading');
        setPdfUploadProgress(15);
        try {
          const res = await uploadExamPdfMaterial(selectedPdfFile, compId, (pct) => {
            setPdfUploadProgress(pct);
            if (pct >= 88) setUploadStage('finalizing');
          });
          resolvedPdfUrl = res.url;
          resolvedFileName = res.fileName;
          resolvedSizeBytes = res.sizeBytes;
          resolvedStoragePath = res.storagePath;
          setFormData(prev => ({
            ...prev,
            pdfReadingMaterialUrl: res.url,
            pdfFileName: res.fileName,
            pdfFileSizeBytes: res.sizeBytes,
            pdfStoragePath: res.storagePath
          }));
          setUploadStage('completed');
          setSelectedPdfFile(null);
        } catch (uploadErr: any) {
          setIsUploadingPdf(false);
          setUploadStage('error');
          setPdfUploadError(uploadErr?.message || 'Failed to upload examination PDF.');
          setSubmitError(uploadErr?.message || 'Failed to upload examination PDF.');
          return;
        } finally {
          setIsUploadingPdf(false);
        }
      }

      const prizesList = formData.prizesSummary.split(',').map(s => s.trim()).filter(Boolean);

      const compData: Competition = {
        ...(initialCompetition || {}),
        id: compId,
        code: formData.code.trim(),
        title: formData.title.trim(),
        category: formData.category,
        categoryLabel: formData.category === 'book_reading' ? 'Book Reading Competition' : formData.category === 'stem_olympiad' ? 'STEM & Science Olympiad' : 'Academic Assessment',
        description: formData.description.trim(),
        eligibilityAgeMin: Number(formData.eligibilityAgeMin),
        eligibilityAgeMax: Number(formData.eligibilityAgeMax),
        eligibleClasses: formData.eligibleClasses.split(',').map((s) => s.trim()).filter(Boolean),
        eligibleStates: initialCompetition?.eligibleStates || ['All India'],
        eligibleDistricts: initialCompetition?.eligibleDistricts || ['All Districts'],
        registrationStartDate: formData.registrationStartDate,
        registrationEndDate: formData.registrationEndDate,
        competitionDate: formData.examScheduleDate || formData.competitionDate,
        examScheduleDate: formData.examScheduleDate,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        timeZone: formData.timeZone,
        allowMultipleAttempts: formData.allowMultipleAttempts,
        resultPublicationDate: formData.resultPublicationDate,
        maxParticipants: Number(formData.maxParticipants),
        registeredCount: initialCompetition?.registeredCount || 0,
        maxMarks: Number(formData.maxMarks),
        passingMarks: Number(formData.passingMarks),
        prizesSummary: prizesList,
        prizeRewards: prizeTiers,
        isPaid: Boolean(formData.isPaid),
        participationFee: formData.isPaid ? Math.max(0, Number(formData.participationFee)) : 0,
        autoEvaluateResults: Boolean(formData.autoEvaluateResults),
        autoPublishResults: Boolean(formData.autoPublishResults),
        rules: initialCompetition?.rules || [
          'Candidate must bring official admit pass or login at the scheduled exam time.',
          'All answers must be the original, independent work of the candidate.'
        ],
        coverImageUrl: formData.coverImageUrl,
        bookDetails: (formData.category === 'book_reading' || Boolean(resolvedPdfUrl || formData.bookTitle)) ? {
          bookTitle: formData.bookTitle.trim(),
          author: formData.author.trim(),
          requiredChapters: formData.requiredChapters.trim(),
          pdfReadingMaterialUrl: resolvedPdfUrl,
          pdfFileName: resolvedFileName || formData.pdfFileName,
          pdfFileSizeBytes: resolvedSizeBytes || formData.pdfFileSizeBytes,
          pdfSourceType: formData.pdfSourceType,
          pdfExternalUrl: formData.pdfExternalUrl.trim(),
          pdfStoragePath: resolvedStoragePath || formData.pdfStoragePath,
          pdfCloudStorageUrl: (formData.pdfCloudStorageUrl && formData.pdfCloudStorageUrl.startsWith('http') && !formData.pdfCloudStorageUrl.includes('/api/competitions/')) ? formData.pdfCloudStorageUrl : undefined
        } : undefined,
        pdfReadingMaterialUrl: resolvedPdfUrl,
        pdfFileName: resolvedFileName || formData.pdfFileName,
        pdfFileSizeBytes: resolvedSizeBytes || formData.pdfFileSizeBytes,
        pdfSourceType: formData.pdfSourceType,
        pdfStoragePath: resolvedStoragePath || formData.pdfStoragePath,
        pdfCloudStorageUrl: (formData.pdfCloudStorageUrl && formData.pdfCloudStorageUrl.startsWith('http') && !formData.pdfCloudStorageUrl.includes('/api/competitions/')) ? formData.pdfCloudStorageUrl : undefined,
        examDetails: {
          ...(initialCompetition?.examDetails || {}),
          isOnlineExam: formData.isOnlineExam,
          durationMinutes: Number(formData.durationMinutes),
          examScheduleDate: formData.examScheduleDate,
          openingTime: formData.openingTime,
          closingTime: formData.closingTime,
          timeZone: formData.timeZone,
          allowMultipleAttempts: formData.allowMultipleAttempts,
          questions: initialCompetition?.examDetails?.questions || [
            {
              id: 'q1',
              questionText: 'Which key insight or thesis was emphasized in the core curriculum?',
              questionType: 'mcq',
              options: ['Ethical service and rigorous analysis', 'Random guessing', 'Market isolation', 'Passive observance'],
              correctOptionIndex: 0,
              marks: 50
            },
            {
              id: 'q2',
              questionText: 'Synthesize your personal reflection on how this topic inspires community transformation.',
              questionType: 'descriptive',
              marks: 50
            }
          ]
        },
        status: formData.status,
        isPublished: true,
        createdByUid: initialCompetition?.createdByUid || currentUser?.uid || 'admin',
        createdByEmail: initialCompetition?.createdByEmail || currentUser?.email || 'admin@fetindia.com',
        createdAt: initialCompetition?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Test vs Live environment separation
        isTestCompetition: Boolean(formData.isTestCompetition),
        environment: formData.isTestCompetition ? 'test' : 'live'
      };

      const cleanedComp = cleanFirestoreData(compData);
      await setDoc(doc(db, 'competitions', compId), cleanedComp, { merge: true });

      // Confirm that the saved competition record can be retrieved
      const verifySnap = await getDoc(doc(db, 'competitions', compId));
      if (!verifySnap.exists()) {
        throw new Error('Verification failed: Saved competition record could not be confirmed in the database.');
      }

      // Non-blocking audit log
      try {
        await addDoc(collection(db, 'audit_logs'), cleanFirestoreData({
          action: isEditing ? 'COMPETITION_UPDATED' : 'COMPETITION_CREATED',
          userId: currentUser?.uid || 'admin',
          userEmail: currentUser?.email || 'admin@fetindia.com',
          details: `${isEditing ? 'Updated' : 'Created'} competition: ${compData.title} (${compData.code})`,
          timestamp: new Date().toISOString()
        }));
      } catch (auditErr) {
        console.warn('Non-blocking audit log notice:', auditErr);
      }

      onSuccess(compData);
    } catch (err: any) {
      console.error('Error saving competition:', err);
      setSubmitError(err?.message || 'Failed to save competition. Please verify inputs and permissions, and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto border border-slate-200">
        
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {isEditing ? 'Edit Competition & Prize Structure' : 'Create New Competition / Examination'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Competition Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as CompetitionCategory })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              >
                <option value="book_reading">Book Reading Competition</option>
                <option value="stem_olympiad">STEM & Science Olympiad</option>
                <option value="islamic_studies">Islamic History & Moral Ethics</option>
                <option value="monthly_test">Monthly Foundation Test</option>
                <option value="essay_writing">Essay / Creative Writing</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Competition Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. All-India National Book Reading & Comprehension Challenge 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Description / Academic Vision *</label>
              <textarea
                rows={2}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>

            {/* Prescribed Curriculum, Book & Attached PDF Material */}
            <div className="sm:col-span-2 p-4 bg-amber-50/70 rounded-2xl border border-amber-200/90 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span>Prescribed Curriculum, Book & Syllabus Material</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Attach an official PDF book, reading curriculum, or syllabus guide accessible to enrolled candidates.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Prescribed Book / Material Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Wings of Fire / Foundation Biology Handbook"
                    value={formData.bookTitle}
                    onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-900 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Author / Academic Source</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. A.P.J. Abdul Kalam / FET Academic Council"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-900 font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Required Chapters / Reading Scope</label>
                <input
                  type="text"
                  placeholder="e.g. Chapters 1 to 6 / Sections A, B & Appendix"
                  value={formData.requiredChapters}
                  onChange={(e) => setFormData({ ...formData, requiredChapters: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-900 text-xs"
                />
              </div>

              {/* PDF Attachment Controls */}
              <div className="pt-2 border-t border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Attach Official Curriculum PDF (Optional)
                  </label>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-amber-300 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pdfSourceType: 'upload' })}
                      className={`px-2.5 py-0.5 rounded-md font-semibold cursor-pointer ${
                        formData.pdfSourceType === 'upload' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pdfSourceType: 'external_url' })}
                      className={`px-2.5 py-0.5 rounded-md font-semibold cursor-pointer ${
                        formData.pdfSourceType === 'external_url' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      External URL / Drive
                    </button>
                  </div>
                </div>

                {formData.pdfSourceType === 'upload' ? (
                  <div className="space-y-2.5">
                    <input
                      ref={pdfFileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfFileSelected}
                      className="hidden"
                    />

                    {/* Stage 1: Selected File Preview prior to upload */}
                    {uploadStage === 'selected' && selectedPdfFile && (
                      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-slate-900 block truncate text-xs">
                                {selectedPdfFile.name}
                              </span>
                              <span className="text-[10px] text-amber-800 font-semibold">
                                Size: {(selectedPdfFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Validated
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 shrink-0">
                            Ready to Upload
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-amber-200/80">
                          <button
                            type="button"
                            onClick={handleStartPdfUpload}
                            disabled={isUploadingPdf}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Start Official Upload</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPdfFile(null);
                              setUploadStage(formData.pdfReadingMaterialUrl ? 'completed' : 'idle');
                              if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Stage 2 & 3: Uploading or Finalizing Progress Bar */}
                    {(uploadStage === 'uploading' || uploadStage === 'finalizing') && (
                      <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-300 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                            <span>{uploadStage === 'finalizing' ? 'Finalizing & Verifying File Reference...' : `Uploading Official Document (${pdfUploadProgress}%)...`}</span>
                          </span>
                          <span>{pdfUploadProgress}%</span>
                        </div>
                        <div className="w-full bg-amber-200/80 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-amber-600 h-2 rounded-full transition-all duration-200 ease-out"
                            style={{ width: `${pdfUploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-amber-800">
                          Streaming directly to secure storage. Do not close this modal.
                        </p>
                      </div>
                    )}

                    {/* Stage 4: Idle State with File Chooser */}
                    {uploadStage === 'idle' && !formData.pdfReadingMaterialUrl && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => pdfFileInputRef.current?.click()}
                          disabled={isUploadingPdf}
                          className="px-3 py-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Select Official PDF / Book</span>
                        </button>
                        <span className="text-[11px] text-slate-500">Official PDF up to 25 MB supported</span>
                      </div>
                    )}

                    {/* Stage 5: Error State with Immediate Retry */}
                    {uploadStage === 'error' && (
                      <div className="p-3 bg-rose-50 rounded-2xl border border-rose-300 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{pdfUploadError || 'Failed to upload official PDF document.'}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-rose-200">
                          {selectedPdfFile && (
                            <button
                              type="button"
                              onClick={handleStartPdfUpload}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <span>Retry Upload</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPdfFile(null);
                              setPdfUploadError(null);
                              setUploadStage(formData.pdfReadingMaterialUrl ? 'completed' : 'idle');
                              pdfFileInputRef.current?.click();
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Choose Different File
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... or https://domain.com/handbook.pdf"
                      value={formData.pdfExternalUrl}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        pdfExternalUrl: e.target.value,
                        pdfReadingMaterialUrl: e.target.value,
                        pdfFileName: formData.pdfFileName || 'Prescribed_Curriculum.pdf'
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-mono"
                    />
                  </div>
                )}

                {/* Attached & Verified PDF Display (Supports Retaining or Replacing during edits) */}
                {(formData.pdfReadingMaterialUrl || formData.pdfExternalUrl) && (
                  <div className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-300 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate">
                          {formData.pdfFileName || 'Attached_Curriculum_Material.pdf'}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-800 font-semibold">
                          <span>✓ Verified Official Document</span>
                          {formData.pdfFileSizeBytes ? (
                            <span>• {(formData.pdfFileSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                          ) : null}
                          <span>• {formData.pdfSourceType === 'external_url' ? 'External URL' : 'Storage Linked'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={
                          formData.pdfSourceType === 'external_url'
                            ? formData.pdfExternalUrl
                            : (formData.pdfReadingMaterialUrl?.startsWith('/api/')
                                ? `${formData.pdfReadingMaterialUrl}?uid=${encodeURIComponent(currentUser?.uid || 'super_admin')}`
                                : formData.pdfReadingMaterialUrl)
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100 rounded-xl font-bold flex items-center gap-1 transition"
                        title="Preview PDF Document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                      </a>
                      {formData.pdfSourceType === 'upload' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (pdfFileInputRef.current) {
                              pdfFileInputRef.current.value = '';
                              pdfFileInputRef.current.click();
                            }
                          }}
                          className="px-2.5 py-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-100 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Replace Document"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Replace</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            pdfReadingMaterialUrl: '',
                            pdfFileName: '',
                            pdfFileSizeBytes: 0,
                            pdfExternalUrl: '',
                            pdfStoragePath: ''
                          });
                          setUploadStage('idle');
                          setSelectedPdfFile(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                        title="Remove Attached PDF"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Prizes & Awards Configuration */}
            <div className="sm:col-span-2 p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Prizes & Recognition Tiers</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddPrizeTier}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Rank Prize</span>
                </button>
              </div>

              <div className="space-y-2">
                {prizeTiers.map((tier, idx) => (
                  <div key={tier.id || idx} className="p-2.5 rounded-xl bg-white border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                      #{tier.rankPosition}
                    </span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                      <input
                        type="text"
                        placeholder="Prize Title"
                        value={tier.title}
                        onChange={(e) => handleUpdatePrize(idx, 'title', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                      />
                      <input
                        type="number"
                        placeholder="Cash Reward (₹)"
                        value={tier.rewardAmount || ''}
                        onChange={(e) => handleUpdatePrize(idx, 'rewardAmount', Number(e.target.value))}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Description (Medal, Trophy, etc.)"
                        value={tier.rewardDescription}
                        onChange={(e) => handleUpdatePrize(idx, 'rewardDescription', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePrizeTier(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                      title="Remove Tier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prizes Summary (Comma separated for portal badges)</label>
                <input
                  type="text"
                  value={formData.prizesSummary}
                  onChange={(e) => setFormData({ ...formData, prizesSummary: e.target.value })}
                  placeholder="1st Prize: ₹25,000 Gold Medal, 2nd Prize: ₹15,000 Silver Medal, ..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Eligible Classes (comma separated)</label>
              <input
                type="text"
                value={formData.eligibleClasses}
                onChange={(e) => setFormData({ ...formData, eligibleClasses: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Seat Capacity</label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Registration Deadline</label>
              <input
                type="date"
                value={formData.registrationEndDate}
                onChange={(e) => setFormData({ ...formData, registrationEndDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            {/* Scheduled Examination Window & Timing Configuration */}
            <div className="sm:col-span-2 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Scheduled Examination Window & Timing Configuration</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Configures the strict opening and closing schedule window (Asia/Kolkata IST) and examination duration limit.
                  </p>
                </div>
                {isSuperAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Super Admin Schedule Authority
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-300 text-xs mb-1">Exam Date (YYYY-MM-DD) *</label>
                  <input
                    type="date"
                    required
                    value={formData.examScheduleDate}
                    onChange={(e) => setFormData({ ...formData, examScheduleDate: e.target.value, competitionDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 text-xs mb-1">Opening Time (IST) *</label>
                  <input
                    type="time"
                    required
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 text-xs mb-1">Closing Time (IST) *</label>
                  <input
                    type="time"
                    required
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-300 text-xs mb-1">Allowed Duration Limit</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold"
                    >
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes (1 Hour)</option>
                      <option value={90}>90 Minutes (1.5 Hours)</option>
                      <option value={120}>120 Minutes (2 Hours)</option>
                    </select>
                    <input
                      type="number"
                      min={5}
                      max={360}
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: Math.max(5, Number(e.target.value)) })}
                      placeholder="Custom Mins"
                      className="w-24 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                    />
                    <span className="text-xs text-slate-400">Minutes</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 text-xs mb-1">Time Zone</label>
                  <input
                    type="text"
                    value={formData.timeZone}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 text-xs font-mono cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Marks</label>
              <input
                type="number"
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CompetitionStatus })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              >
                <option value="registration_open">Registration Open</option>
                <option value="draft">Draft</option>
                <option value="under_evaluation">Under Evaluation</option>
              </select>
            </div>

            {/* Participation Fee & Payment Settings (Part 2) */}
            <div className="sm:col-span-2 p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-4 h-4 text-amber-700" />
                    <span>Participation Fee & Payment Mode</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Configure whether this examination requires an entry fee (collected securely via Razorpay) or is 100% free.
                  </p>
                </div>

                {/* Free vs Paid Toggle */}
                <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-amber-300">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPaid: false, participationFee: 0 })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      !formData.isPaid ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Free
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPaid: true, participationFee: formData.participationFee || 100 })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      formData.isPaid ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Paid
                  </button>
                </div>
              </div>

              {formData.isPaid && (
                <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="block font-bold text-amber-950 mb-1">Participation Fee (₹ INR) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 font-bold text-slate-500 text-xs">₹</span>
                      <input
                        type="number"
                        min="1"
                        required={formData.isPaid}
                        value={formData.participationFee}
                        onChange={(e) => setFormData({ ...formData, participationFee: Math.max(0, Number(e.target.value)) })}
                        placeholder="e.g. 50, 100"
                        className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-amber-300 bg-white font-mono font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-amber-900/90 leading-tight">
                    Candidates will pay via the Razorpay gateway during enrollment and receive an official payment confirmation receipt.
                  </div>
                </div>
              )}
            </div>

            {/* Evaluation & Result Automation Settings (Part 4) */}
            <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Evaluation & Result Automation</span>
              </h4>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={formData.autoEvaluateResults}
                    onChange={(e) => setFormData({ ...formData, autoEvaluateResults: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Automatic Objective Scoring</span>
                    <span className="text-[11px] text-slate-500">Automatically compute scores, percentages, and performance grades upon submission for objective question sections.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={formData.autoPublishResults}
                    onChange={(e) => setFormData({ ...formData, autoPublishResults: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Immediate Auto-Publish to Candidate Portal</span>
                    <span className="text-[11px] text-slate-500">If checked, candidates can immediately view official scorecards without waiting for manual batch publication.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Test vs Live Sandbox Separation */}
            <div className="sm:col-span-2 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={Boolean(formData.isTestCompetition)}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    isTestCompetition: e.target.checked,
                    environment: e.target.checked ? 'test' : 'live'
                  })}
                  className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Mark as Test / Sandbox Examination</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider">
                      Sandbox
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Quarantines this examination from public candidate registration and keeps sample test candidate filings, attempts, and certificates strictly separate from official live examination records.
                  </span>
                </div>
              </label>
            </div>

          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{submitError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="text-rose-600 hover:text-rose-900 font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-200 flex-wrap gap-2">
            <div>
              {isEditing && isSuperAdmin && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 transition shadow-xs"
                  title="Super Admin: Delete Competition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Competition</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingPdf}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold cursor-pointer text-xs shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving Program...</span>
                  </>
                ) : isUploadingPdf ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Uploading PDF...</span>
                  </>
                ) : isEditing ? (
                  'Save Changes & Prizes'
                ) : (
                  'Create Competition'
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SUB-MODAL: GRADE / SCORE CANDIDATE
// -------------------------------------------------------------
interface GradeCandidateModalProps {
  registration: CompetitionRegistration;
  onClose: () => void;
  onSuccess: () => void;
}

const GradeCandidateModal: React.FC<GradeCandidateModalProps> = ({ registration, onClose, onSuccess }) => {
  const { currentUser } = useAuth();

  const [marks, setMarks] = useState<number>(registration.marksObtained || 85);
  const [totalMarks, setTotalMarks] = useState<number>(registration.totalMarks || 100);
  const [rank, setRank] = useState<string>(registration.rank ? registration.rank.toString() : '1');
  const [awardCategory, setAwardCategory] = useState<ParticipantAward>(registration.awardCategory || '1st_rank');
  const [remarks, setRemarks] = useState<string>(registration.evaluatorRemarks || 'Exceptional critical comprehension and scholarly clarity.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const percentage = Math.round((marks / totalMarks) * 100);
      let calculatedGrade = 'A+ (Distinction)';
      if (percentage < 40) calculatedGrade = 'Needs Improvement';
      else if (percentage < 60) calculatedGrade = 'C (Pass)';
      else if (percentage < 75) calculatedGrade = 'B (Good)';
      else if (percentage < 90) calculatedGrade = 'A (Excellent)';

      const regDocId = registration.id || registration.registrationId;
      await updateDoc(doc(db, 'competition_registrations', regDocId), {
        marksObtained: Number(marks),
        totalMarks: Number(totalMarks),
        percentage: percentage,
        grade: calculatedGrade,
        rank: rank ? Number(rank) : undefined,
        awardCategory: awardCategory,
        evaluatorRemarks: remarks.trim(),
        status: 'evaluated',
        evaluatedByUid: currentUser?.uid || 'evaluator',
        evaluatedByEmail: currentUser?.email || 'evaluator@fetindia.com',
        evaluatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        action: 'CANDIDATE_SCORED',
        userId: currentUser?.uid || 'admin',
        userEmail: currentUser?.email || 'admin@fetindia.com',
        details: `Scored candidate ${registration.participantName} (${registration.participantId}) in ${registration.competitionTitle}: ${marks}/${totalMarks} (${calculatedGrade}, Rank #${rank})`,
        timestamp: new Date().toISOString()
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error saving score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Scholar Evaluation & Score Entry</h3>
            <p className="text-[11px] text-slate-500">Participant Roll: <strong className="font-mono">{registration.participantId}</strong></p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
          <div className="font-bold text-slate-900">{registration.participantName}</div>
          <div className="text-slate-500">{registration.schoolInstitution} • {registration.classGrade}</div>
          <div className="text-emerald-800 font-bold">{registration.competitionTitle}</div>
        </div>

        <form onSubmit={handleSaveScore} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Marks Obtained *</label>
              <input
                type="number"
                required
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-emerald-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Max Marks</label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">National Rank / Position</label>
              <input
                type="number"
                placeholder="e.g. 1"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Award Accreditation</label>
              <select
                value={awardCategory}
                onChange={(e) => setAwardCategory(e.target.value as ParticipantAward)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              >
                <option value="1st_rank">1st Rank (Gold Distinction)</option>
                <option value="2nd_rank">2nd Rank (Silver)</option>
                <option value="3rd_rank">3rd Rank (Bronze)</option>
                <option value="merit">Certificate of Merit</option>
                <option value="participation">Participation</option>
                <option value="special_award">Special Award</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Evaluator Remarks / Critique</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-xl font-bold cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold cursor-pointer"
            >
              {isSubmitting ? 'Recording...' : 'Save & Certify Score'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
