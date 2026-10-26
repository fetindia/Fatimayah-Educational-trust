/**
 * @license
 * Member & Student Competitions / Examinations Dashboard View
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Download, 
  FileText, 
  MapPin, 
  Plus, 
  Search, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Printer,
  AlertCircle,
  QrCode,
  X,
  CreditCard
} from 'lucide-react';
import { Competition, CompetitionRegistration, CompetitionCertificateRecord } from '../../types';
import { INITIAL_COMPETITIONS } from '../../data/initialCompetitions';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { CompetitionRegistrationModal } from '../competitions/CompetitionRegistrationModal';
import { OnlineExamModal } from '../competitions/OnlineExamModal';
import { DigitalCertificateModal } from '../competitions/DigitalCertificateModal';
import { HallTicketModal } from '../competitions/HallTicketModal';
import { getExamScheduleStatus } from '../../utils/examSchedule';

interface MemberCompetitionsViewProps {
  onOpenAuth?: () => void;
}

export const MemberCompetitionsView: React.FC<MemberCompetitionsViewProps> = ({ onOpenAuth }) => {
  const { currentUser, userProfile } = useAuth();

  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [certificates, setCertificates] = useState<CompetitionCertificateRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'my_exams' | 'results'>('browse');

  // Modals
  const [registeringComp, setRegisteringComp] = useState<Competition | null>(null);
  const [takingExamData, setTakingExamData] = useState<{ comp: Competition; reg: CompetitionRegistration } | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<CompetitionCertificateRecord | null>(null);
  const [viewingHallTicket, setViewingHallTicket] = useState<{ comp: Competition; reg: CompetitionRegistration } | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [downloadingCompId, setDownloadingCompId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<{ compId: string; message: string } | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleDownloadPdfMaterial = async (comp: Competition, reg?: CompetitionRegistration) => {
    if (!comp.id) return;

    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const userReg = reg || getRegistrationForComp(comp.id);
    if (!userReg) {
      setDownloadError({
        compId: comp.id,
        message: 'Active enrollment is required to download official study material.'
      });
      return;
    }

    if (comp.isPaid && (!userReg.isPaid || userReg.paymentStatus !== 'paid')) {
      setDownloadError({
        compId: comp.id,
        message: 'Payment verification is required before downloading paid study material.'
      });
      return;
    }

    const rawPdfUrl = comp.pdfReadingMaterialUrl || comp.bookDetails?.pdfReadingMaterialUrl || comp.pdfExternalUrl || comp.bookDetails?.pdfExternalUrl;
    
    if (!rawPdfUrl) {
      setDownloadError({
        compId: comp.id,
        message: 'Official study material will be uploaded soon by the Examination Board.'
      });
      return;
    }

    setDownloadingCompId(comp.id);
    setDownloadError(null);

    try {
      const filename = comp.pdfFileName || comp.bookDetails?.pdfFileName || `${comp.code || 'FET'}_Study_Material.pdf`;
      const safeFileName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const regDocId = userReg?.id || userReg?.registrationId || `reg-${comp.id}-${currentUser.uid}`;
      const prtId = userReg?.participantId || '';
      const payStatus = userReg?.paymentStatus || (userReg?.isPaid ? 'paid' : (comp.isPaid ? 'pending' : 'free'));
      
      // 1. Call authoritative server download endpoint with candidate verification
      const secureEndpoint = `/api/competitions/${comp.id}/material?uid=${encodeURIComponent(currentUser.uid)}&regId=${encodeURIComponent(regDocId)}&prtId=${encodeURIComponent(prtId)}&payStatus=${encodeURIComponent(payStatus)}`;
      let downloadBlob: Blob | null = null;

      try {
        const resp = await fetch(secureEndpoint, {
          headers: {
            'x-user-uid': currentUser.uid,
            'x-registration-id': regDocId,
            'x-participant-id': prtId,
            'x-payment-status': payStatus
          }
        });
        if (resp.ok) {
          const contentType = resp.headers.get('content-type') || '';
          if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
            downloadBlob = await resp.blob();
          } else {
            const errJson = await resp.json().catch(() => null);
            if (errJson?.error) {
              throw new Error(errJson.error);
            }
          }
        } else if (resp.status === 403) {
          const errJson = await resp.json().catch(() => null);
          throw new Error(errJson?.error || 'Candidate registration verification required to download study material.');
        } else if (!resp.ok) {
          const errJson = await resp.json().catch(() => null);
          throw new Error(errJson?.error || 'Official study material is being prepared by the Examination Board.');
        }
      } catch (endpointErr: any) {
        if (endpointErr?.message && endpointErr.message.includes('verification')) {
          throw endpointErr;
        }
        console.warn('Server download endpoint notice, attempting direct stream fallback:', endpointErr);
      }

      // 2. Direct fetch fallback if endpoint not responding with blob and external URL is available
      if (!downloadBlob && rawPdfUrl && (rawPdfUrl.startsWith('http://') || rawPdfUrl.startsWith('https://')) && !rawPdfUrl.includes('/api/competitions/')) {
        try {
          const directResp = await fetch(rawPdfUrl);
          if (directResp.ok) {
            downloadBlob = await directResp.blob();
          }
        } catch (directErr) {
          // Handled below
        }
      }

      // 3. Initiate browser save
      if (downloadBlob) {
        const blobUrl = window.URL.createObjectURL(downloadBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = safeFileName.endsWith('.pdf') ? safeFileName : `${safeFileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
        showNotification(`Official study material downloaded: ${safeFileName}`);
      } else if (rawPdfUrl && rawPdfUrl.startsWith('data:application/pdf;base64,')) {
        const link = document.createElement('a');
        link.href = rawPdfUrl;
        link.download = safeFileName.endsWith('.pdf') ? safeFileName : `${safeFileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`Official study material downloaded: ${safeFileName}`);
      } else {
        throw new Error('Official study material is being finalized by the Examination Board. Please try again shortly or contact your coordinator.');
      }
    } catch (err: any) {
      console.error('Error downloading competition PDF:', err);
      setDownloadError({
        compId: comp.id,
        message: err?.message || 'Failed to download PDF. Please try again or open study material link.'
      });
    } finally {
      setDownloadingCompId(null);
    }
  };

  // 1. Fetch live competitions
  useEffect(() => {
    const q = collection(db, 'competitions');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const loaded: Competition[] = [];
        snapshot.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() } as Competition);
        });
        setCompetitions(loaded);
      } else {
        setCompetitions(INITIAL_COMPETITIONS);
      }
    }, (error) => {
      console.warn('Error fetching competitions, using initial data:', error);
      setCompetitions(INITIAL_COMPETITIONS);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch current user's registrations (backward-compatible with UID aliases & direct docs)
  useEffect(() => {
    if (!currentUser) return;

    // Normalizer to ensure consistent fields regardless of legacy schema variations
    const normalizeRegistration = (data: any, docId: string): CompetitionRegistration => {
      const regId = data.registrationId || data.id || docId;
      const partUid = data.participantUid || data.userId || data.candidateUid || data.uid || currentUser.uid;
      const partId = data.participantId || data.rollNumber || `FET-PRT-${docId.slice(-6)}`;
      const status = data.status || (data.verificationStatus === 'pending' ? 'pending_review' : 'registered');
      return {
        ...data,
        id: docId,
        registrationId: regId,
        participantUid: partUid,
        participantId: partId,
        status: status,
        isPaid: Boolean(data.isPaid || data.paymentStatus === 'paid')
      };
    };

    const regQuery = query(
      collection(db, 'competition_registrations'),
      where('participantUid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(regQuery, async (snapshot) => {
      const loadedMap = new Map<string, CompetitionRegistration>();
      
      snapshot.forEach((docSnap) => {
        const normalized = normalizeRegistration(docSnap.data(), docSnap.id);
        loadedMap.set(normalized.competitionId, normalized);
      });

      // Also check direct document references for all competitions to recover registrations
      // saved under alternative key names (userId, candidateUid) or created before composite query
      for (const comp of competitions) {
        if (!loadedMap.has(comp.id)) {
          try {
            const directDocId = `reg-${comp.id}-${currentUser.uid}`;
            const docSnap = await getDoc(doc(db, 'competition_registrations', directDocId));
            if (docSnap.exists()) {
              const normalized = normalizeRegistration(docSnap.data(), docSnap.id);
              loadedMap.set(comp.id, normalized);
            } else if (comp.code) {
              const codeDocId = `reg-${comp.code}-${currentUser.uid}`;
              const codeSnap = await getDoc(doc(db, 'competition_registrations', codeDocId));
              if (codeSnap.exists()) {
                const normalized = normalizeRegistration(codeSnap.data(), codeSnap.id);
                loadedMap.set(comp.id, normalized);
              }
            }
          } catch (e) {
            // direct get catch
          }
        }
      }

      setRegistrations(Array.from(loadedMap.values()));
    }, (err) => {
      console.warn('Could not query competition_registrations:', err);
    });

    return () => unsubscribe();
  }, [currentUser, competitions]);

  // 3. Fetch certificates
  useEffect(() => {
    if (!currentUser) return;

    const certQuery = query(
      collection(db, 'competition_certificates')
    );

    const unsubscribe = onSnapshot(certQuery, (snapshot) => {
      const loadedCerts: CompetitionCertificateRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as CompetitionCertificateRecord;
        if (data.participantId || data.registrationId) {
          loadedCerts.push({ id: doc.id, ...data });
        }
      });
      setCertificates(loadedCerts);
    }, (err) => {
      console.warn('Could not query competition_certificates:', err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Filter competitions
  const filteredCompetitions = competitions.filter((cmp) => {
    const matchesCategory = selectedCategory === 'all' || cmp.category === selectedCategory;
    const matchesSearch = 
      cmp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmp.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getRegistrationForComp = (compId?: string) => {
    if (!compId) return undefined;
    return registrations.find((r) => r.competitionId === compId);
  };

  const getCertificateForReg = (reg: CompetitionRegistration): CompetitionCertificateRecord => {
    const found = certificates.find((c) => c.registrationId === reg.registrationId || c.participantId === reg.participantId);
    if (found) return found;

    // Construct preview certificate
    return {
      certificateId: reg.certificateId || `FET-CERT-CMP-2026-${reg.participantId.slice(-4)}`,
      participantId: reg.participantId,
      registrationId: reg.registrationId,
      competitionId: reg.competitionId,
      competitionTitle: reg.competitionTitle,
      competitionCategory: reg.competitionCategory,
      participantName: reg.participantName,
      parentName: reg.parentName,
      schoolInstitution: reg.schoolInstitution,
      district: reg.district,
      state: reg.state,
      achievement: reg.awardCategory || (reg.rank && reg.rank <= 3 ? (reg.rank === 1 ? '1st_rank' : reg.rank === 2 ? '2nd_rank' : '3rd_rank') : 'participation'),
      achievementTitle: reg.rank === 1 ? 'National 1st Rank Holder' : (reg.awardCategory === 'merit' ? 'Certificate of Merit' : 'Certificate of Participation'),
      rank: reg.rank,
      score: reg.marksObtained,
      totalMarks: reg.totalMarks,
      grade: reg.grade,
      issueDate: reg.certificateIssuedAt || new Date().toISOString(),
      issuedByUid: 'academic_controller',
      issuedByEmail: 'controller@fetindia.com',
      createdAt: new Date().toISOString()
    };
  };

  // Metrics
  const registeredCount = registrations.length;
  const examsTakenCount = registrations.filter((r) => r.examAttemptStatus === 'submitted' || r.status === 'attended').length;
  const resultsPublishedCount = registrations.filter((r) => r.isResultPublished || r.marksObtained !== undefined).length;
  const certificatesEarnedCount = registrations.filter((r) => r.certificateIssued || r.certificateId).length;

  return (
    <div className="space-y-6" id="member-competitions-view-root">
      
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Top Banner & Metrics Row */}
      <div className="rounded-3xl bg-radial from-slate-900 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
              <Award className="w-3.5 h-3.5" />
              <span>FET Academic Competitions & Examinations</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Student Competitions & Talent Search Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Enroll in prestigious national book reading challenges, science olympiads, and assessment examinations to earn academic recognition, cash scholarships, and verified trust credentials.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('browse')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Explore Competitions</span>
            </button>
          </div>
        </div>

        {/* 4 Statistical Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-slate-400 block text-[11px]">Enrolled Competitions</span>
            <div className="text-2xl font-black text-white">{registeredCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-slate-400 block text-[11px]">Assessments Completed</span>
            <div className="text-2xl font-black text-emerald-400">{examsTakenCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-slate-400 block text-[11px]">Published Scorecards</span>
            <div className="text-2xl font-black text-amber-400">{resultsPublishedCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-slate-400 block text-[11px]">Digital Certificates</span>
            <div className="text-2xl font-black text-purple-400">{certificatesEarnedCount}</div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('browse')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'browse'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Competitions ({competitions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('my_exams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeSubTab === 'my_exams'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>My Registrations & Hall Tickets</span>
            {registeredCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                {registeredCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('results')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'results'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Scorecards & Certificates</span>
            {resultsPublishedCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                {resultsPublishedCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search competitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: BROWSE ALL COMPETITIONS & ENROLL */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'browse' && (
        <div className="space-y-6">
          
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'book_reading', label: 'Book Reading Competition' },
              { id: 'stem_olympiad', label: 'STEM & Science Olympiad' },
              { id: 'islamic_studies', label: 'Islamic History & Moral Ethics' },
              { id: 'monthly_test', label: 'Monthly Foundation Tests' },
              { id: 'essay_writing', label: 'Essay & Creative Writing' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Competitions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompetitions.map((comp) => {
              const userReg = getRegistrationForComp(comp.id);
              const isEnrolled = Boolean(userReg);

              return (
                <div 
                  key={comp.id || comp.code}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  {/* Top Image / Badge */}
                  <div className="relative h-44 bg-slate-900 overflow-hidden">
                    {comp.coverImageUrl ? (
                      <img 
                        src={comp.coverImageUrl} 
                        alt={comp.title}
                        className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-emerald-950 text-emerald-400">
                        <Award className="w-12 h-12 opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-900/90 text-amber-300 border border-slate-700 backdrop-blur-xs">
                        {comp.code}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                        {comp.categoryLabel || comp.category}
                      </span>
                      <h3 className="text-sm font-bold text-white leading-tight drop-shadow-sm line-clamp-2">
                        {comp.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {comp.description}
                      </p>

                      {/* Book Details Box if Book Reading Competition */}
                      {comp.bookDetails && (
                        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                            <span>Prescribed Volume:</span>
                          </div>
                          <p className="font-bold text-slate-900">{comp.bookDetails.bookTitle}</p>
                          <p className="text-[11px] text-slate-500">Author: {comp.bookDetails.author}</p>
                        </div>
                      )}

                      {/* Key Meta Badges */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Assessment Date:</span>
                          <span className="font-bold text-slate-800">{comp.competitionDate}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Reg. Deadline:</span>
                          <span className="font-bold text-slate-800">{comp.registrationEndDate}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Max Marks:</span>
                          <span className="font-bold text-emerald-800">{comp.maxMarks} Marks</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Eligible Classes:</span>
                          <span className="font-bold text-slate-800 truncate block">
                            {comp.eligibleClasses.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-100">
                      {isEnrolled ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Enrolled ({userReg?.participantId})</span>
                            </div>
                            <button
                              onClick={() => {
                                if (userReg) {
                                  setViewingHallTicket({ comp, reg: userReg });
                                } else {
                                  setActiveSubTab('my_exams');
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <QrCode className="w-3.5 h-3.5 text-amber-400" />
                              <span>View Hall Ticket</span>
                            </button>
                          </div>
                          {(comp.pdfReadingMaterialUrl || comp.bookDetails?.pdfReadingMaterialUrl || comp.pdfExternalUrl || comp.bookDetails?.pdfExternalUrl) && (
                            <button
                              type="button"
                              onClick={() => handleDownloadPdfMaterial(comp, userReg)}
                              disabled={downloadingCompId === comp.id}
                              className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {downloadingCompId === comp.id ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  <span>Downloading PDF Book...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download PDF Book</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!currentUser && onOpenAuth) {
                              onOpenAuth();
                            } else {
                              setRegisteringComp(comp);
                            }
                          }}
                          className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Register for Competition</span>
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
      {/* TAB 2: MY REGISTRATIONS & HALL TICKETS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'my_exams' && (
        <div className="space-y-6">
          {registrations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-xl mx-auto">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No Active Competition Registrations</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You have not enrolled in any upcoming assessments yet. Explore our open book reading challenges and science olympiads to register.
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('browse')}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Browse Open Competitions
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => {
                const comp = competitions.find((c) => c.id === reg.competitionId) || {
                  id: reg.competitionId,
                  code: reg.competitionCode || 'FET-CMP',
                  title: reg.competitionTitle,
                  category: reg.competitionCategory,
                  maxMarks: reg.totalMarks || 100,
                  passingMarks: 40,
                  competitionDate: '2026-10-15',
                  examDetails: {
                    isOnlineExam: true,
                    durationMinutes: 45,
                    questions: []
                  }
                } as Competition;

                const hasCompletedExam = 
                  reg.examAttemptStatus === 'submitted' || 
                  reg.examAttemptStatus === 'auto_submitted' || 
                  reg.status === 'attended' || 
                  reg.status === 'completed' || 
                  reg.status === 'evaluated';

                const isAutoSubmitted = reg.examAttemptStatus === 'auto_submitted' || reg.submissionReason?.includes('Auto-Submitted');
                const scheduleStatus = getExamScheduleStatus(comp);

                return (
                  <div 
                    key={reg.id || reg.registrationId}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-amber-400">
                          Participant ID: {reg.participantId}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {reg.competitionCategory}
                        </span>

                        {/* Registration Verification Status Badge */}
                        {reg.status === 'pending_review' || reg.status === 'pending' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-700" />
                            Academic Review Pending
                          </span>
                        ) : comp.isPaid && (!reg.isPaid || reg.paymentStatus === 'pending') ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-rose-600" />
                            Fee Verification Pending
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Registration Verified & Confirmed
                          </span>
                        )}
                        {hasCompletedExam ? (
                          isAutoSubmitted ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-700" />
                              Auto-Submitted — Time Expired
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Assessment Submitted
                            </span>
                          )
                        ) : scheduleStatus.status === 'upcoming' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            Scheduled: Opens {scheduleStatus.formattedOpenTime}
                          </span>
                        ) : scheduleStatus.status === 'closed' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Schedule Window Closed
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            Live Now • Assessment Window Open
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{reg.competitionTitle}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Candidate: <strong>{reg.participantName}</strong> • {reg.schoolInstitution} ({reg.classGrade})
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Enrolled Date:</span>
                          <span className="font-bold text-slate-800">
                            {new Date(reg.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Schedule Window:</span>
                          <span className="font-bold text-slate-800">
                            {scheduleStatus.formattedDate} ({scheduleStatus.formattedOpenTime}–{scheduleStatus.formattedCloseTime})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Registered District:</span>
                          <span className="font-bold text-slate-800">{reg.district}, {reg.state}</span>
                        </div>
                      </div>

                      {/* Academic Review Pending Banner */}
                      {(reg.status === 'pending_review' || reg.status === 'pending') && (
                        <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs font-medium text-amber-900 flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-amber-950">Academic Verification In Progress</p>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              Your candidate registration has been recorded and is currently being verified by the FET Examination Board. Your official Hall Ticket and Admit Card remain fully viewable below.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Payment Verification Pending Banner */}
                      {comp.isPaid && (!reg.isPaid || reg.paymentStatus === 'pending') && (
                        <div className="p-3 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs font-medium text-rose-900 flex items-start gap-2.5">
                          <CreditCard className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-rose-950">Fee Payment Verification Required</p>
                            <p className="text-[11px] text-rose-800 leading-relaxed">
                              Participation fee confirmation is required before accessing the assessment and official study material.
                            </p>
                          </div>
                        </div>
                      )}

                      {!hasCompletedExam && scheduleStatus.status !== 'open' && (
                        <div className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                          scheduleStatus.status === 'upcoming' 
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                            : 'bg-rose-50/80 border-rose-200 text-rose-900'
                        }`}>
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{scheduleStatus.message}</span>
                        </div>
                      )}

                      {/* Prescribed Study Material & Syllabus PDF Download */}
                      <div className="mt-2 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                            <span>Prescribed Curriculum & Study Material</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800">
                            {comp.bookDetails?.bookTitle || comp.title}
                            {comp.bookDetails?.author ? ` • Author: ${comp.bookDetails.author}` : ''}
                          </p>
                          {(comp.pdfFileName || comp.bookDetails?.pdfFileName) && (
                            <p className="text-[11px] text-slate-500 font-mono">
                              File: {comp.pdfFileName || comp.bookDetails?.pdfFileName}
                              {(comp.pdfFileSizeBytes || comp.bookDetails?.pdfFileSizeBytes) ? ` (${((comp.pdfFileSizeBytes || comp.bookDetails?.pdfFileSizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB)` : ''}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {(comp.pdfReadingMaterialUrl || comp.bookDetails?.pdfReadingMaterialUrl || comp.pdfExternalUrl || comp.bookDetails?.pdfExternalUrl) ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadPdfMaterial(comp, reg)}
                              disabled={downloadingCompId === comp.id}
                              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {downloadingCompId === comp.id ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  <span>Downloading PDF Book...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download PDF Book</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-1.5 rounded-lg border border-amber-200">
                              Material uploading soon by Board
                            </span>
                          )}
                        </div>
                      </div>

                      {downloadError && downloadError.compId === comp.id && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{downloadError.message}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDownloadError(null)}
                            className="text-rose-600 hover:text-rose-900 font-bold text-xs"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingHallTicket({ comp, reg })}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-4 h-4 text-amber-400" />
                        <span>View Hall Ticket</span>
                      </button>
                      {!hasCompletedExam ? (
                        scheduleStatus.status === 'open' ? (
                          <button
                            onClick={() => setTakingExamData({ comp, reg })}
                            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>Launch Online Assessment</span>
                          </button>
                        ) : scheduleStatus.status === 'upcoming' ? (
                          <button
                            disabled
                            className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2"
                            title={scheduleStatus.message}
                          >
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>Opens at {scheduleStatus.formattedOpenTime}</span>
                          </button>
                        ) : (
                          <div className="text-center p-3 rounded-xl bg-rose-50 border border-rose-200">
                            <span className="text-[10px] text-rose-500 block font-bold uppercase">Assessment Window Closed</span>
                            <span className="text-xs font-semibold text-rose-800">
                              Late start not permitted
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">Evaluation Status</span>
                          <span className="text-xs font-bold text-slate-800">
                            {reg.isResultPublished ? 'Scorecard Published' : 'Under Scholar Evaluation'}
                          </span>
                        </div>
                      )}

                      {reg.isResultPublished && (
                        <button
                          onClick={() => setViewingCertificate(getCertificateForReg(reg))}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Award className="w-4 h-4" />
                          <span>View Digital Certificate</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: SCORECARDS & VERIFIED CERTIFICATES */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'results' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registrations.filter((r) => r.isResultPublished || r.marksObtained !== undefined).length === 0 ? (
              <div className="col-span-2 bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                <Award className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">No Published Results Yet</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Official scorecards and accredited merit certificates will appear here once the central examination board publishes the results for your registered tests.
                  </p>
                </div>
              </div>
            ) : (
              registrations
                .filter((r) => r.isResultPublished || r.marksObtained !== undefined)
                .map((reg) => {
                  const cert = getCertificateForReg(reg);

                  return (
                    <div 
                      key={reg.registrationId}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Participant Roll</span>
                            <div className="text-xs font-black text-slate-900">{reg.participantId}</div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {reg.grade || 'Passed with Merit'}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                          {reg.competitionTitle}
                        </h3>

                        {/* Scores Box */}
                        <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Marks Obtained</span>
                            <span className="text-sm font-black text-emerald-800">
                              {reg.marksObtained || 0} / {reg.totalMarks || 100}
                            </span>
                          </div>
                          <div className="border-l border-slate-200">
                            <span className="text-[10px] text-slate-400 block">Percentage</span>
                            <span className="text-sm font-black text-slate-900">
                              {reg.percentage || Math.round(((reg.marksObtained || 0) / (reg.totalMarks || 100)) * 100)}%
                            </span>
                          </div>
                          <div className="border-l border-slate-200">
                            <span className="text-[10px] text-slate-400 block">National Rank</span>
                            <span className="text-sm font-black text-amber-700">
                              {reg.rank ? `#${reg.rank}` : 'Merit'}
                            </span>
                          </div>
                        </div>

                        {reg.evaluatorRemarks && (
                          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                            <strong>Scholar Remark:</strong> {reg.evaluatorRemarks}
                          </div>
                        )}
                      </div>

                      {/* Certificate Trigger */}
                      <button
                        onClick={() => setViewingCertificate(cert)}
                        className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Award className="w-4 h-4 text-amber-300" />
                        <span>View / Print Accredited Certificate</span>
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODALS */}
      {/* ------------------------------------------------------------- */}

      {/* Registration Modal */}
      {registeringComp && (
        <CompetitionRegistrationModal
          competition={registeringComp}
          onClose={() => setRegisteringComp(null)}
          onSuccess={(regId) => {
            setRegisteringComp(null);
            showNotification('Registration completed successfully! Participant ID assigned.');
            setActiveSubTab('my_exams');
          }}
        />
      )}

      {/* Online Exam Modal */}
      {takingExamData && (
        <OnlineExamModal
          competition={takingExamData.comp}
          registration={takingExamData.reg}
          onClose={() => setTakingExamData(null)}
          onSubmitted={() => {
            setTakingExamData(null);
            showNotification('Online assessment submitted and recorded!');
            setActiveSubTab('my_exams');
          }}
        />
      )}

      {/* Certificate Modal */}
      {viewingCertificate && (
        <DigitalCertificateModal
          certificate={viewingCertificate}
          onClose={() => setViewingCertificate(null)}
        />
      )}

      {/* Hall Ticket / Admit Card Modal */}
      {viewingHallTicket && (
        <HallTicketModal
          competition={viewingHallTicket.comp}
          registration={viewingHallTicket.reg}
          onClose={() => setViewingHallTicket(null)}
          onDownloadPdfBook={() => handleDownloadPdfMaterial(viewingHallTicket.comp, viewingHallTicket.reg)}
          isDownloadingPdf={downloadingCompId === viewingHallTicket.comp.id}
        />
      )}

    </div>
  );
};
