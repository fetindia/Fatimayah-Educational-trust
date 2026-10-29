/**
 * @license
 * FET India Examinations — Compact Homepage Showcase & Direct Application Section
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect } from 'react';
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
  Share2
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Competition } from '../../types';
import { INITIAL_COMPETITIONS } from '../../data/initialCompetitions';
import { useConfig } from '../../contexts/ConfigContext';
import { isPublicActiveCompetition } from '../../utils/competitionFilters';
import { ShareCompetitionModal } from '../competitions/ShareCompetitionModal';

interface FETIndiaExaminationsSectionProps {
  onApplyExam: (competition: Competition) => void;
  onViewExamInfo: (competition: Competition, tab?: 'instructions' | 'book_mastery' | 'eligibility' | 'prizes') => void;
  onViewAllExams?: () => void;
}

export const FETIndiaExaminationsSection: React.FC<FETIndiaExaminationsSectionProps> = ({
  onApplyExam,
  onViewExamInfo,
  onViewAllExams
}) => {
  const { config } = useConfig();
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [sharingComp, setSharingComp] = useState<Competition | null>(null);

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
            if (list.length > 0 && !selectedCompId) {
              setSelectedCompId(list[0].id);
            }
          }
        } else {
          if (isMounted) {
            setCompetitions(INITIAL_COMPETITIONS);
            if (INITIAL_COMPETITIONS.length > 0 && !selectedCompId) {
              setSelectedCompId(INITIAL_COMPETITIONS[0].id);
            }
          }
        }
        if (isMounted) setLoading(false);
      }, (err) => {
        console.warn('Could not listen to competitions collection, using initial data:', err);
        if (isMounted) {
          setCompetitions(INITIAL_COMPETITIONS);
          if (INITIAL_COMPETITIONS.length > 0 && !selectedCompId) {
            setSelectedCompId(INITIAL_COMPETITIONS[0].id);
          }
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

  // Filter competitions: strictly only published, active, non-deleted competitions
  const liveCompetitions = competitions.filter(isPublicActiveCompetition);

  // Filter competitions: check which are open for application
  const todayStr = new Date().toISOString().split('T')[0];
  const openCompetitions = liveCompetitions.filter(c => {
    if (!c.registrationEndDate) return true;
    return c.registrationEndDate >= todayStr;
  });

  // Selected or first active competition
  const activeCompetition = liveCompetitions.find(c => c.id === selectedCompId) || openCompetitions[0] || liveCompetitions[0] || null;

  const isRegistrationClosed = activeCompetition?.registrationEndDate 
    ? activeCompetition.registrationEndDate < todayStr 
    : false;

  return (
    <section 
      id="examinations" 
      className="py-14 sm:py-18 bg-white border-t border-slate-200 relative overflow-hidden"
      aria-labelledby="fet-examinations-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
              <span>National Academic Talent Search & Assessment</span>
            </div>
            <h2 id="fet-examinations-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              FET India Examinations
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Standardized state and national examinations, book mastery evaluations, and merit olympiads empowering students with verified academic credentials and educational grants.
            </p>
          </div>

          {/* Quick Pillars */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
            <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Online Examination
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              Book Mastery
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Merit Scholarships
            </span>
          </div>
        </div>

        {/* Main Examination Card Container */}
        {competitions.length === 0 ? (
          /* Empty State */
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Examination Currently Open for Applications</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The next academic assessment cycle is being prepared by the Trust Examination Directorate. Circulars will be posted here as soon as candidate enrollment commences.
              </p>
            </div>
            {onViewAllExams && (
              <button
                onClick={onViewAllExams}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                View Examination Information & Archive
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Active Examination Spotlight Card */}
            {activeCompetition && (
              <div className="lg:col-span-8 rounded-3xl border-2 border-emerald-600/30 bg-gradient-to-b from-emerald-50/40 via-white to-white p-6 sm:p-8 shadow-sm space-y-6">
                
                {/* Examination Badges & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-700 text-white uppercase tracking-wider">
                      {activeCompetition.categoryLabel || activeCompetition.category}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Code: {activeCompetition.code}
                    </span>
                  </div>

                  {isRegistrationClosed ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      Registration Closed
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Applications Open
                    </span>
                  )}
                </div>

                {/* Examination Title & Overview */}
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {activeCompetition.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {activeCompetition.description}
                  </p>
                </div>

                {/* Key Assessment Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Reg Deadline</span>
                    <span className="font-extrabold text-slate-900">{activeCompetition.registrationEndDate || 'Open'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Exam Date</span>
                    <span className="font-extrabold text-slate-900">{activeCompetition.competitionDate || 'Scheduled'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Marks</span>
                    <span className="font-extrabold text-slate-900">{activeCompetition.maxMarks} Marks</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Eligible Classes</span>
                    <span className="font-extrabold text-slate-900 truncate block">
                      {activeCompetition.eligibleClasses?.slice(0, 2).join(', ') || 'All Classes'}
                    </span>
                  </div>
                </div>

                {/* Book Mastery Spotlight (If applicable) */}
                {activeCompetition.bookDetails && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wider">
                      <BookOpen className="w-4 h-4 text-amber-700" />
                      <span>Prescribed Book Mastery Curriculum</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      "{activeCompetition.bookDetails.bookTitle}" — {activeCompetition.bookDetails.author}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Required Chapters: {activeCompetition.bookDetails.requiredChapters}
                    </p>
                  </div>
                )}

                {/* Dynamic Prizes & Rewards Summary */}
                {activeCompetition.prizeRewards && activeCompetition.prizeRewards.filter(p => p.status !== 'inactive').length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-amber-950 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-600" />
                        <span>Honors & Merit Scholarships</span>
                      </div>
                      <span className="text-[10px] text-amber-800 font-extrabold">
                        {activeCompetition.prizeRewards.filter(p => p.status !== 'inactive').length} Prize Tiers
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {activeCompetition.prizeRewards.filter(p => p.status !== 'inactive').slice(0, 3).map((prize, pIdx) => (
                        <div key={prize.id || pIdx} className="p-2.5 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-0.5">
                          <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                            <span>#{prize.rankPosition} {prize.title.split('-')[0].trim()}</span>
                            {prize.rewardAmount && prize.rewardAmount > 0 && (
                              <span className="text-emerald-700 font-mono font-bold">₹{prize.rewardAmount.toLocaleString()}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{prize.rewardDescription}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prominent Action Strip */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  
                  {/* Secondary info buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onViewExamInfo(activeCompetition, 'instructions')}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer border border-slate-300 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>Instructions</span>
                    </button>

                    <button
                      onClick={() => onViewExamInfo(activeCompetition, 'prizes')}
                      className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors cursor-pointer border border-amber-300 flex items-center gap-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-600" />
                      <span>Prizes & Awards</span>
                    </button>

                    {activeCompetition.bookDetails && (
                      <button
                        onClick={() => onViewExamInfo(activeCompetition, 'book_mastery')}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer border border-slate-300 flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                        <span>Book Mastery</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSharingComp(activeCompetition)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-colors cursor-pointer border border-emerald-300 flex items-center gap-1.5 shadow-2xs"
                      title="Share this official examination link on WhatsApp, Facebook, or copy link"
                      id="homepage-share-competition-btn"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Share Competition</span>
                    </button>
                  </div>

                  {/* PROMINENT "APPLY FOR EXAMINATION" BUTTON (Mandated by Prompt) */}
                  <button
                    onClick={() => onApplyExam(activeCompetition)}
                    disabled={isRegistrationClosed}
                    className="px-7 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm tracking-wide transition-all shadow-lg hover:shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer"
                    id="apply-for-examination-cta"
                  >
                    <span>APPLY FOR EXAMINATION</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                </div>

              </div>
            )}

            {/* Right: Available Examinations List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Available Examinations ({liveCompetitions.length})
                </h4>
                <span className="text-[11px] text-slate-500">Session 2026-27</span>
              </div>

              <div className="space-y-2.5">
                {liveCompetitions.map((comp) => {
                  const isSelected = comp.id === selectedCompId;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedCompId(comp.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-600 shadow-sm ring-1 ring-emerald-600/30'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {comp.categoryLabel || comp.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {comp.competitionDate || 'Scheduled'}
                        </span>
                      </div>

                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {comp.title}
                      </h5>

                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 pt-1">
                        <span>{comp.maxMarks} Marks • Passing {comp.passingMarks}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSharingComp(comp);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer"
                            title="Share Competition"
                          >
                            <Share2 className="w-3 h-3 text-emerald-700" />
                            <span>Share</span>
                          </button>
                          <span className="inline-flex items-center gap-0.5 text-slate-600 hover:text-emerald-700">
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Information Footnote */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <span className="font-bold text-slate-900 block">Candidate Support:</span>
                <p>
                  Admit cards, roll numbers, and hall tickets are dispatched automatically to registered candidates 7 days prior to examination.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Share Competition Modal */}
      {sharingComp && (
        <ShareCompetitionModal
          competition={sharingComp}
          onClose={() => setSharingComp(null)}
        />
      )}
    </section>
  );
};
