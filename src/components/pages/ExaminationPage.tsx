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
  FileCheck2,
  QrCode,
  ArrowLeft,
  Share2,
  Lock,
  Globe,
  Star
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Competition } from '../../types';
import { INITIAL_COMPETITIONS } from '../../data/initialCompetitions';
import { useConfig } from '../../contexts/ConfigContext';
import { Top100ResultsShowcase } from '../home/Top100ResultsShowcase';
import { getExamScheduleStatus } from '../../utils/examSchedule';

interface ExaminationPageProps {
  targetCompetitionId?: string;
  onApplyExam: (competition: Competition) => void;
  onViewExamInfo: (competition: Competition, tab?: 'instructions' | 'book_mastery' | 'eligibility' | 'prizes') => void;
  onOpenStudentResults: () => void;
  onOpenVerification?: (memberId?: string) => void;
  onReturnToHome: () => void;
  onOpenDonate?: () => void;
}

export const ExaminationPage: React.FC<ExaminationPageProps> = ({
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
    const shareUrl = `${window.location.origin}/examination/${comp.id}`;
    const shareTitle = `${comp.title} - FET India National Examinations`;
    const shareText = `Official Entrance / Competition: ${comp.title} (${comp.categoryLabel || 'Assessment'}). Proctored Duration: ${comp.examDetails?.durationMinutes || 45} mins. Register online: ${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareToast(`Share link copied: ${shareUrl}`);
      setTimeout(() => setShareToast(null), 4000);
    }
  };

  const directCompetition = React.useMemo(() => {
    if (!selectedDirectExamId) return null;
    return (
      competitions.find(
        (c) => c.id === selectedDirectExamId || c.code?.toLowerCase() === selectedDirectExamId.toLowerCase()
      ) || null
    );
  }, [competitions, selectedDirectExamId]);

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
                    <span>Direct Share Link</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400 bg-white/10 px-2.5 py-0.5 rounded">
                    {directCompetition.code}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDirectExamId(undefined)}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"
                >
                  <span>View All Competitions</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 max-w-4xl">
                <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  {directCompetition.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {directCompetition.description}
                </p>
              </div>

              {/* Detailed Presentation Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[11px] uppercase font-bold text-slate-400">Duration Limit</div>
                  <div className="text-sm sm:text-base font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{directCompetition.examDetails?.durationMinutes || 45} Minutes</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[11px] uppercase font-bold text-slate-400">Questions Count</div>
                  <div className="text-sm sm:text-base font-bold text-white mt-0.5 flex items-center gap-1">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>{directCompetition.examDetails?.questions?.length || 25} Questions</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[11px] uppercase font-bold text-slate-400">Entry Status</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
                    {directCompetition.isPaid ? `Fee: ₹${directCompetition.participationFee}` : '100% Free Entry'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[11px] uppercase font-bold text-slate-400">Registration End</div>
                  <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                    {directCompetition.registrationEndDate || 'Open Now'}
                  </div>
                </div>
              </div>

              {/* Prescribed Literature / Study Material */}
              {directCompetition.bookDetails && (
                <div className="p-4 rounded-2xl bg-indigo-900/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

                  {directCompetition.bookDetails.pdfReadingMaterialUrl && (
                    <a
                      href={directCompetition.bookDetails.pdfReadingMaterialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center justify-center gap-1.5 flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Download Study Material</span>
                    </a>
                  )}
                </div>
              )}

              {/* Rewards Summary */}
              {directCompetition.prizesSummary && directCompetition.prizesSummary.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200">
                  <span className="font-bold text-amber-400">Medals & Rewards: </span>
                  {directCompetition.prizesSummary.join(' • ')}
                </div>
              )}

              {/* Action Buttons: Apply & Share */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
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
                  <span>Copy Public Share Link</span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Register for ${directCompetition.title} at Fatimyah Educational Trust India. Link: ${window.location.origin}/examination/${directCompetition.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  <span>Share on WhatsApp</span>
                </a>
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
                      {competition.bookDetails?.pdfReadingMaterialUrl && (
                        <a
                          href={competition.bookDetails.pdfReadingMaterialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>PDF Book</span>
                        </a>
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
    </div>
  );
};
