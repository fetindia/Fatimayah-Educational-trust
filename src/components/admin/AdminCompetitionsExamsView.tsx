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
  Trophy
} from 'lucide-react';
import { 
  Competition, 
  CompetitionRegistration, 
  CompetitionStatus, 
  CompetitionCategory,
  ParticipantAward,
  CompetitionCertificateRecord,
  ExamQuestion,
  CompetitionPrizeTier
} from '../../types';
import { INITIAL_COMPETITIONS } from '../../data/initialCompetitions';
import { useAuth } from '../../contexts/AuthContext';
import { db, revokeCertificate, reinstateCertificate, syncPublicCertificateRecord } from '../../lib/firebase';
import { 
  collection, 
  doc, 
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

export const AdminCompetitionsExamsView: React.FC = () => {
  const { currentUser, userProfile, isSuperAdmin } = useAuth();

  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [certificates, setCertificates] = useState<CompetitionCertificateRecord[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeAdminTab, setActiveAdminTab] = useState<'catalog' | 'banks' | 'participants' | 'evaluations' | 'results' | 'certificates'>('catalog');

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
    const matchCat = selectedCategory === 'all' || c.category === selectedCategory;
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Filtered Registrations
  const filteredRegistrations = registrations.filter((r) => {
    const matchComp = selectedCompId === 'all' || r.competitionId === selectedCompId;
    const matchSearch = 
      r.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.participantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.schoolInstitution.toLowerCase().includes(searchQuery.toLowerCase());
    return matchComp && matchSearch;
  });

  // Key Statistics
  const totalCompetitions = competitions.length;
  const activeRegistrationsCount = competitions.filter((c) => c.status === 'registration_open').length;
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompetitions.map((comp) => {
              const compRegistrations = registrations.filter((r) => r.competitionId === comp.id);
              const scoredCount = compRegistrations.filter((r) => r.marksObtained !== undefined).length;

              return (
                <div 
                  key={comp.id || comp.code}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    
                    {/* Top Row: Code & Status Menu */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-black bg-slate-900 text-amber-400">
                        {comp.code}
                      </span>
                      
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

                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
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

                    <div className="flex items-center gap-1">
                      {isSuperAdmin && (
                        <button
                          onClick={() => setEditingComp(comp)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 font-bold text-xs cursor-pointer flex items-center gap-1"
                          title="Edit Examination & Prizes Structure"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Edit & Prizes</span>
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

                      {isSuperAdmin && comp.id && (
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete competition "${comp.title}"?`)) {
                              await deleteDoc(doc(db, 'competitions', comp.id!));
                              notify('Competition removed.');
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Program"
                        >
                          <Trash2 className="w-4 h-4" />
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
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.registrationId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {reg.participantId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{reg.participantName}</div>
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
                  ))
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
// SUB-MODAL: CREATE / EDIT COMPETITION & PRIZES
// -------------------------------------------------------------
interface CreateCompetitionModalProps {
  initialCompetition?: Competition | null;
  onClose: () => void;
  onSuccess: (comp: Competition) => void;
}

const CreateCompetitionModal: React.FC<CreateCompetitionModalProps> = ({ initialCompetition, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const isEditing = Boolean(initialCompetition);

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
    prizesSummary: initialCompetition?.prizesSummary?.join(', ') || '1st Prize: ₹25,000 Gold Medal & Trophy, 2nd Prize: ₹15,000 Silver Medal, 3rd Prize: ₹10,000 Bronze Medal, Top 10 Distinction Certificates'
  });

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
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const compId = initialCompetition?.id || `cmp-${Date.now()}`;
      const prizesList = formData.prizesSummary.split(',').map(s => s.trim()).filter(Boolean);

      const compData: Competition = {
        ...(initialCompetition || {}),
        id: compId,
        code: formData.code,
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
        competitionDate: formData.competitionDate,
        resultPublicationDate: formData.resultPublicationDate,
        maxParticipants: Number(formData.maxParticipants),
        registeredCount: initialCompetition?.registeredCount || 0,
        maxMarks: Number(formData.maxMarks),
        passingMarks: Number(formData.passingMarks),
        prizesSummary: prizesList,
        prizeRewards: prizeTiers,
        rules: initialCompetition?.rules || [
          'Candidate must bring official admit pass or login at the scheduled exam time.',
          'All answers must be the original, independent work of the candidate.'
        ],
        coverImageUrl: formData.coverImageUrl,
        bookDetails: formData.category === 'book_reading' ? {
          bookTitle: formData.bookTitle,
          author: formData.author,
          requiredChapters: formData.requiredChapters
        } : undefined,
        examDetails: initialCompetition?.examDetails || {
          isOnlineExam: formData.isOnlineExam,
          durationMinutes: Number(formData.durationMinutes),
          questions: [
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
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'competitions', compId), compData, { merge: true });

      // Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        action: isEditing ? 'COMPETITION_UPDATED' : 'COMPETITION_CREATED',
        userId: currentUser?.uid || 'admin',
        userEmail: currentUser?.email || 'admin@fetindia.com',
        details: `${isEditing ? 'Updated' : 'Created'} competition: ${compData.title} (${compData.code})`,
        timestamp: new Date().toISOString()
      });

      onSuccess(compData);
    } catch (err: any) {
      console.error('Error saving competition:', err);
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

            {/* Book Reading specifics */}
            {formData.category === 'book_reading' && (
              <>
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Prescribed Book Title</label>
                  <input
                    type="text"
                    value={formData.bookTitle}
                    onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-slate-900 font-bold"
                  />
                </div>
              </>
            )}

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

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assessment Date</label>
              <input
                type="date"
                value={formData.competitionDate}
                onChange={(e) => setFormData({ ...formData, competitionDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
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

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 rounded-xl font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold cursor-pointer"
            >
              {isSubmitting ? 'Saving Program...' : isEditing ? 'Save Changes & Prizes' : 'Create Competition'}
            </button>
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
