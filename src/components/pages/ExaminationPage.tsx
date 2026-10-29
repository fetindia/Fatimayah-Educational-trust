/**
 * @license
 * Dedicated Full Webpage: Examination & Academic Talent Competitions
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Trophy,
  Download,
  Users,
  Search,
  ExternalLink,
  Medal,
  Check,
  Copy,
  MessageCircle,
  Share2,
  FileCheck2,
  QrCode,
  ArrowLeft,
  Lock,
  Globe,
  Star
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Competition, User } from '../../types';
import { INITIAL_COMPETITIONS } from '../../data/initialCompetitions';
import { useConfig } from '../../contexts/ConfigContext';
import { Top100ResultsShowcase } from '../home/Top100ResultsShowcase';
import { getExamScheduleStatus } from '../../utils/examSchedule';
import { downloadCompetitionBook, CandidateAuthUser } from '../../utils/downloadBookMaterial';
import { isPublicActiveCompetition } from '../../utils/competitionFilters';
import { ShareCompetitionModal } from '../competitions/ShareCompetitionModal';

interface ExaminationPageProps {
  currentUser?: CandidateAuthUser | null;
  targetCompetitionId?: string;
  onApplyExam: (competition: Competition) => void;
  onViewExamInfo: (competition: Competition, tab?: 'instructions' | 'book_mastery' | 'eligibility' | 'prizes') => void;
  onOpenStudentResults: () => void;
  onOpenVerification?: (memberId?: string) => void;
  onReturnToHome: () => void;
  onOpenDonate?: () => void;
}

export const ExaminationPage: React.FC<ExaminationPageProps> = ({
  currentUser,
  targetCompetitionId,
  onApplyExam,
  onViewExamInfo,
  onOpenStudentResults,
  onOpenVerification,
  onReturnToHome,
  onOpenDonate
}) => {
  const { config } = useConfig();
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'book_reading' | 'competitive_exam' | 'free'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDirectExamId, setSelectedDirectExamId] = useState<string | undefined>(targetCompetitionId);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [sharingComp, setSharingComp] = useState<Competition | null>(null);
  const [downloadingCompId, setDownloadingCompId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadNotice, setDownloadNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (targetCompetitionId) {
      setSelectedDirectExamId(targetCompetitionId);
      // Scroll to assessment view
      setTimeout(() => {
        document.getElementById('active-examinations')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [targetCompetitionId]);

  const handleShareExam = (comp: Competition) => {
    setSharingComp(comp);
  };

  const handleDownloadBook = async (comp: Competition) => {
    setDownloadingCompId(comp.id);
    setDownloadProgress(10);
    setDownloadNotice(null);

    await downloadCompetitionBook({
      competition: comp,
      currentUser,
      onStart: () => {
        setDownloadingCompId(comp.id);
        setDownloadProgress(20);
      },
      onProgress: (pct) => {
        setDownloadProgress(pct);
      },
      onSuccess: (fileName) => {
        setDownloadingCompId(null);
        setDownloadNotice({
          message: `Official study material downloaded: ${fileName}`,
          type: 'success'
        });
        setTimeout(() => setDownloadNotice(null), 5000);
      },
      onError: (err) => {
        setDownloadingCompId(null);
        setDownloadNotice({
          message: err.message || 'Failed to download study material.',
          type: 'error'
        });
        setTimeout(() => setDownloadNotice(null), 6000);
      },
      onAuthRequired: (reason) => {
        setDownloadingCompId(null);
        setDownloadNotice({
          message: `${reason} Opening registration form...`,
          type: 'info'
        });
        setTimeout(() => {
          setDownloadNotice(null);
          onApplyExam(comp);
        }, 1500);
      }
    });
  };

  const requestedCompRecord = React.useMemo(() => {
    if (!selectedDirectExamId) return null;
    return (
      competitions.find(
        (c) => c.id === selectedDirectExamId || c.code?.toLowerCase() === selectedDirectExamId.toLowerCase()
      ) || null
    );
  }, [competitions, selectedDirectExamId]);

  const isRequestedCompArchived = Boolean(
    requestedCompRecord && !isPublicActiveCompetition(requestedCompRecord)
  );

  const directCompetition = React.useMemo(() => {
    if (!requestedCompRecord) return null;
    return isPublicActiveCompetition(requestedCompRecord) ? requestedCompRecord : null;
  }, [requestedCompRecord]);

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  useEffect(() => {
    let isMounted = true;
    try {
      const unsubscribe = onSnapshot(collection(db, 'competitions'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Competition[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as Competition);
          });
          if (isMounted) {
            setCompetitions(list);
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setCompetitions(INITIAL_COMPETITIONS);
            setLoading(false);
          }
        }
      }, (err) => {
        console.warn('Could not listen to competitions collection, using initial data:', err);
        if (isMounted) {
          setCompetitions(INITIAL_COMPETITIONS);
          setLoading(false);
        }
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      if (isMounted) {
        setCompetitions(INITIAL_COMPETITIONS);
        setLoading(false);
      }
    }
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered competitions
  const filteredCompetitions = useMemo(() => {
    return competitions.filter((comp) => {
      // Strictly require active, published, non-deleted, non-archived competitions
      if (!isPublicActiveCompetition(comp)) return false;

      // Category filter
      if (activeCategory === 'book_reading' && comp.category !== 'book_reading') return false;
      if (activeCategory === 'competitive_exam' && comp.category === 'book_reading') return false;
      if (activeCategory === 'free' && comp.isPaid) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = comp.title?.toLowerCase().includes(q);
        const matchDesc = comp.description?.toLowerCase().includes(q);
        const matchBook = comp.bookDetails?.bookTitle?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchBook) return false;
      }
      return true;
    });
  }, [competitions, activeCategory, searchQuery]);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-16">
      {/* Top Breadcrumb & Page Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <button 
              type="button" 
              onClick={onReturnToHome} 
              className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <span className="text-slate-500">/</span>
            <span className="text-amber-400 font-semibold">Examinations & Competitions</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenStudentResults}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 border border-indigo-600 font-bold text-xs transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Check Student Result & Scorecard</span>
            </button>
            {onOpenVerification && (
              <button
                type="button"
                onClick={() => onOpenVerification()}
                className="hidden sm:inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verify Certificate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white py-16 sm:py-20 overflow-hidden">
        {/* Subtle Decorative Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>FATIMYAH EDUCATIONAL TRUST — NATIONAL TALENT BUREAU</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Academic Examinations & Book Competitions
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Fostering intellectual excellence, deep literary comprehension, and ethical leadership across India through standardized competitive evaluations, merit fellowships, and national medals.
            </p>

            {/* Key Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#active-examinations"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2"
              >
                <span>View Open Examinations</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={onOpenStudentResults}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Student Scorecard & Ranks</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">42,500+</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Candidates Evaluated</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">₹15 Lakh+</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Prizes & Scholarships</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="text-2xl sm:text-3xl font-black text-sky-400">28 Centers</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Pan-India Test Locations</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="text-2xl sm:text-3xl font-black text-purple-400">100%</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Verified Digital Certificates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Examination Listing Section */}
      <section id="active-examinations" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Competitions ({competitions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('book_reading')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'book_reading'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Book Reading</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('competitive_exam')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'competitive_exam'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Aptitude & Olympiads</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('free')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'free'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>100% Free Entry</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, book, class..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Download Notice / Eligibility Banner */}
        {downloadNotice && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold border flex items-center justify-between gap-3 shadow-lg transition-all ${
            downloadNotice.type === 'success' 
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50' 
              : downloadNotice.type === 'error'
              ? 'bg-rose-950/80 text-rose-200 border-rose-500/50'
              : 'bg-indigo-950/80 text-indigo-200 border-indigo-500/50'
          }`}>
            <div className="flex items-center gap-2">
              {downloadNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {downloadNotice.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {downloadNotice.type === 'info' && <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />}
              <span>{downloadNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setDownloadNotice(null)}
              className="text-white/60 hover:text-white px-2 py-1 rounded text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Notice for archived or removed competition requested via old URL */}
        {isRequestedCompArchived && (
          <div className="mb-8 p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 text-slate-800 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-950">
                Examination Concluded or Archived
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The requested examination <strong className="text-slate-900 font-mono">{requestedCompRecord?.title || selectedDirectExamId}</strong> has concluded or has been retired from active candidate enrollment by the Academic Directorate. Historical participant registrations, scores, and verified certificates remain fully preserved in student dashboards.
              </p>
              <p className="text-xs text-emerald-800 font-bold pt-1">
                Please explore currently active competitions and talent examinations below.
              </p>
            </div>
          </div>
        )}

        {/* Direct Competition Presentation Showcase (When opened via public link) */}
        {directCompetition && (
          <div className="mb-10 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl border-2 border-amber-500/40 p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Public Competition Showcase</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400 bg-white/10 px-2.5 py-0.5 rounded">
                    {directCompetition.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                    FATIMYAH Educational Trust
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDirectExamId(undefined)}
                  className="text-xs text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl border border-white/20"
                >
                  <span>View All Competitions</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Poster + Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Poster / Cover Image */}
                {(directCompetition.coverImageUrl || directCompetition.bookDetails?.coverImageUrl || directCompetition.imageUrl) && (
                  <div className="md:col-span-4 shrink-0">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-2xl group bg-slate-950">
                      <img
                        src={directCompetition.coverImageUrl || directCompetition.bookDetails?.coverImageUrl || directCompetition.imageUrl}
                        alt={directCompetition.title}
                        className="w-full h-64 md:h-80 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-3 left-3 right-3 text-center">
                        <span className="px-3 py-1 rounded-full bg-slate-900/90 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                          Official Curriculum Poster
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Title, Vision & Description */}
                <div className={`${(directCompetition.coverImageUrl || directCompetition.bookDetails?.coverImageUrl || directCompetition.imageUrl) ? 'md:col-span-8' : 'md:col-span-12'} space-y-4`}>
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                      {directCompetition.categoryLabel || 'Academic Talent Examination'}
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                      {directCompetition.title}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                      {directCompetition.description}
                    </p>
                  </div>

                  {/* Presentation Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Exam Duration</div>
                      <div className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{directCompetition.examDetails?.durationMinutes || 45} Mins</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Questions</div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-0.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{directCompetition.examDetails?.questions?.length || 25} MCQs</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Participation</div>
                      <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
                        {directCompetition.isPaid ? `Fee: ₹${directCompetition.participationFee}` : '100% Free Entry'}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Registration End</div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                        {directCompetition.registrationEndDate || 'Open Now'}
                      </div>
                    </div>
                  </div>

                  {/* Prescribed Literature / Study Material */}
                  {directCompetition.bookDetails && (
                    <div className="p-4 rounded-2xl bg-indigo-900/50 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                          <BookOpen className="w-4 h-4" />
                          <span>Prescribed Book / Study Literature</span>
                        </div>
                        <div className="text-sm font-bold text-white">
                          &ldquo;{directCompetition.bookDetails.bookTitle}&rdquo;
                        </div>
                        <div className="text-xs text-slate-300">
                          Author: {directCompetition.bookDetails.author || 'FET Academic Bureau'} • Scope: {directCompetition.bookDetails.requiredChapters || 'Entire Syllabus'}
                        </div>
                      </div>

                      {(directCompetition.pdfReadingMaterialUrl || directCompetition.bookDetails?.pdfReadingMaterialUrl || (directCompetition as any).pdfCloudStorageUrl) && (
                        <button
                          type="button"
                          onClick={() => handleDownloadBook(directCompetition)}
                          disabled={downloadingCompId === directCompetition.id}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg transition flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer disabled:opacity-75"
                        >
                          {downloadingCompId === directCompetition.id ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                              <span>Downloading ({downloadProgress}%)...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Official Book</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Rewards Summary */}
                  {directCompetition.prizesSummary && directCompetition.prizesSummary.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
                      <span className="font-bold text-amber-400">Medals & Scholarship Awards: </span>
                      {directCompetition.prizesSummary.join(' • ')}
                    </div>
                  )}

                  {/* Action Buttons: Apply, Download & Social Sharing */}
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onApplyExam(directCompetition)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>Apply / Register for this Exam</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareExam(directCompetition)}
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-indigo-300" />
                      <span>Share / Copy Link</span>
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `*${directCompetition.title}*\nOrganized by FATIMYAH Educational Trust India\n\nPrescribed syllabus, merit awards, and educational scholarship grants.\n\nDirect Details & Registration: ${window.location.origin}/examination/${directCompetition.id}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Share on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Competitions Cards Grid */}
        {filteredCompetitions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Examinations Match Your Filter</h3>
            <p className="text-xs text-slate-500">
              Try changing your search term or switching to &ldquo;All Competitions&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCompetitions.map((competition) => {
              const isClosed = competition.registrationEndDate 
                ? competition.registrationEndDate < todayStr 
                : false;
              const isPaid = competition.isPaid || false;
              const feeAmount = competition.participationFee || 0;
              const scheduleStatus = getExamScheduleStatus(competition);

              return (
                <div
                  key={competition.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-6 sm:p-7 space-y-5">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                          {competition.category === 'book_reading' ? (
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <Award className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          <span>{competition.categoryLabel || 'Academic Competition'}</span>
                        </span>

                        <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {competition.code}
                        </span>

                        {scheduleStatus.status === 'open' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                            Exam Live Now
                          </span>
                        ) : scheduleStatus.status === 'upcoming' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            Opens {scheduleStatus.formattedOpenTime}
                          </span>
                        ) : null}
                      </div>

                      {/* Fee Badge */}
                      {isPaid ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                          Fee: ₹{feeAmount}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>100% Free Registration</span>
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">
                        {competition.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {competition.description}
                      </p>
                    </div>

                    {/* Book / Reading Highlights if available */}
                    {competition.bookDetails && (
                      <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Prescribed Curriculum Book:</span>
                        </div>
                        <p className="font-semibold text-slate-800">
                          &ldquo;{competition.bookDetails.bookTitle}&rdquo;
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Author: {competition.bookDetails.author || 'Designated Scholar'} • Duration: {competition.bookDetails.readingDurationWeeks || 4} Weeks
                        </p>
                      </div>
                    )}

                    {/* Essential Dates & Criteria Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration End</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {competition.registrationEndDate || 'Open'}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Exam Schedule</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {scheduleStatus.formattedDate}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {scheduleStatus.formattedOpenTime}–{scheduleStatus.formattedCloseTime}
                        </span>
                      </div>

                      <div className="space-y-0.5 col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Eligibility</span>
                        <span className="font-semibold text-slate-800">
                          Age {competition.eligibilityAgeMin || 12} - {competition.eligibilityAgeMax || 25} Yrs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onViewExamInfo(competition, 'instructions')}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Syllabus & Info</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareExam(competition)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Share public exam link"
                      >
                        <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Share</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {(competition.pdfReadingMaterialUrl || competition.bookDetails?.pdfReadingMaterialUrl || (competition as any).pdfCloudStorageUrl) && (
                        <button
                          type="button"
                          onClick={() => handleDownloadBook(competition)}
                          disabled={downloadingCompId === competition.id}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {downloadingCompId === competition.id ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              <span>{downloadProgress}%</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                              <span>PDF Book</span>
                            </>
                          )}
                        </button>
                      )}

                      {isClosed ? (
                        <span className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold">
                          Registration Closed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onApplyExam(competition)}
                          className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Register / Apply</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Structured Examination Process (6-Step Lifecycle) */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Examination Process & Candidate Journey
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Transparent, standardized, and audited candidate journey from enrollment to national honor roll publication.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 font-black flex items-center justify-center text-sm">
                01
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Online Application</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Candidate fills out verified demographic profile, school/college details, and receives unique Registration Roll Number immediately.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-sm">
                02
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Syllabus & Prescribed Literature</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Registered candidates gain direct download access to designated curriculum books, sample practice MCQs, and question patterns.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 font-black flex items-center justify-center text-sm">
                03
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Assessment Administration</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Conducted either securely online via the FET portal with fullscreen lockdown or physically across authorized institutional centers.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 font-black flex items-center justify-center text-sm">
                04
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Audited Double Grading</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Objective sections are scored automatically while analytical essays undergo blind academic evaluation by verified senior scholars.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm">
                05
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Top 100 Ranks & Public Honor Roll</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nationwide merit ranks are declared officially with percentile scoring, institutional citations, and district leaderboards.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
                06
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Medals, Awards & Certificates</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                All passing candidates receive tamper-proof QR-verifiable certificates, while national rank holders are conferred cash awards and medals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top 100 Merit Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <Trophy className="w-3.5 h-3.5 text-amber-700" />
              <span>National Merit Leaderboard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Top 100 Examination Honor Roll
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Celebrating exceptional academic scholars who achieved distinction in recent Trust examinations.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenStudentResults}
            className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Search Your Individual Result</span>
          </button>
        </div>

        {/* Embedded Top 100 Component */}
        <Top100ResultsShowcase 
          onOpenExamPortal={onOpenStudentResults}
          onViewCandidateResult={(roll) => onOpenStudentResults()}
        />
      </section>

      {/* Trust Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-indigo-800/40">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-bold">Support an Aspiring Scholar&apos;s Examination</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your charitable contribution directly funds examination registration fees, printed study volumes, and merit laptop scholarships for economically vulnerable students across India.
            </p>
          </div>

          {onOpenDonate && (
            <button
              type="button"
              onClick={onOpenDonate}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-900/40 transition-colors shrink-0 cursor-pointer"
            >
              Sponsor an Examination Desk (80G)
            </button>
          )}
        </div>
      </section>

      {/* Floating Share Link Copied Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-2.5 animate-bounce text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Social Media Sharing Modal */}
      {sharingComp && (
        <ShareCompetitionModal
          competition={sharingComp}
          onClose={() => setSharingComp(null)}
        />
      )}
    </div>
  );
};
