/**
 * @license
 * Public Examination Information, Syllabus & Instructions Modal
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRight,
  Download,
  AlertCircle,
  Trophy,
  Gift
} from 'lucide-react';
import { Competition } from '../../types';

interface ExaminationInfoModalProps {
  competition: Competition | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (comp: Competition) => void;
  initialTab?: 'instructions' | 'book_mastery' | 'eligibility' | 'prizes';
}

export const ExaminationInfoModal: React.FC<ExaminationInfoModalProps> = ({
  competition,
  isOpen,
  onClose,
  onApply,
  initialTab = 'instructions'
}) => {
  const [activeTab, setActiveTab] = useState<'instructions' | 'book_mastery' | 'eligibility' | 'prizes'>(initialTab);

  if (!isOpen || !competition) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-info-modal-title"
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                {competition.categoryLabel || competition.category}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Code: {competition.code}
              </span>
            </div>
            <h2 id="exam-info-modal-title" className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {competition.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto text-xs font-bold scrollbar-none shrink-0 pt-2">
          <button
            onClick={() => setActiveTab('instructions')}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'instructions'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Examination Instructions</span>
          </button>

          {competition.bookDetails && (
            <button
              onClick={() => setActiveTab('book_mastery')}
              className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'book_mastery'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Book Mastery Syllabus</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('eligibility')}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'eligibility'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Eligibility & Dates</span>
          </button>

          <button
            onClick={() => setActiveTab('prizes')}
            className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'prizes'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Prizes & Rewards</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs sm:text-sm">
          
          {/* TAB 1: INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Official Assessment Guidelines
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {competition.description}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-sm">Key Instructions & Rules:</h4>
                <div className="space-y-2">
                  {competition.rules && competition.rules.length > 0 ? (
                    competition.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-slate-700 leading-relaxed">{rule}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Standard objective questions, 45 minutes duration. Follow honor code guidelines.</p>
                  )}
                </div>
              </div>

              {competition.examDetails && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Duration</span>
                    <span className="text-sm font-extrabold text-slate-900">{competition.examDetails.durationMinutes} Minutes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Marks</span>
                    <span className="text-sm font-extrabold text-slate-900">{competition.maxMarks}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Passing Marks</span>
                    <span className="text-sm font-extrabold text-slate-900">{competition.passingMarks}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Languages</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {competition.examDetails.supportedLanguages?.join(', ').toUpperCase() || 'EN'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BOOK MASTERY */}
          {activeTab === 'book_mastery' && competition.bookDetails && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Prescribed Reading Volume
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {competition.bookDetails.bookTitle}
                </h3>
                <p className="text-xs text-slate-600">
                  <strong>Author:</strong> {competition.bookDetails.author}
                </p>
                {competition.bookDetails.recommendedPublisher && (
                  <p className="text-xs text-slate-600">
                    <strong>Edition/Publisher:</strong> {competition.bookDetails.recommendedPublisher}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Required Chapters</span>
                  <p className="text-xs font-semibold text-slate-800">{competition.bookDetails.requiredChapters}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Recommended Reading Pace</span>
                  <p className="text-xs font-semibold text-slate-800">{competition.bookDetails.readingDurationWeeks} Weeks</p>
                </div>
              </div>

              {competition.bookDetails.submissionRequirements && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assessment & Evaluation Format</span>
                  <p className="text-xs text-slate-700">{competition.bookDetails.submissionRequirements}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ELIGIBILITY & DATES */}
          {activeTab === 'eligibility' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate Eligibility</span>
                  <div className="text-xs space-y-1.5 text-slate-700">
                    <p><strong>Age Limits:</strong> {competition.eligibilityAgeMin} to {competition.eligibilityAgeMax} Years</p>
                    <p><strong>Eligible Grades:</strong> {competition.eligibleClasses?.join(', ') || 'All students'}</p>
                    <p><strong>Eligible Regions:</strong> {competition.eligibleStates?.join(', ') || 'All India'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official Schedule</span>
                  <div className="text-xs space-y-1.5 text-slate-700">
                    <p><strong>Registration Opens:</strong> {competition.registrationStartDate}</p>
                    <p><strong>Registration Closes:</strong> {competition.registrationEndDate}</p>
                    <p><strong>Examination Date:</strong> {competition.competitionDate}</p>
                    <p><strong>Results Declaration:</strong> {competition.resultPublicationDate}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRIZES & REWARDS */}
          {activeTab === 'prizes' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
                <Trophy className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950 mb-0.5">Recognition & National Scholarships</h4>
                  <p className="text-amber-800/90 leading-relaxed">
                    All participants who qualify will receive an authenticated, cryptographically signed FET India Digital Certificate. Top-ranking candidates qualify for awards and scholarship grants.
                  </p>
                </div>
              </div>

              {competition.prizeRewards && competition.prizeRewards.length > 0 ? (
                <div className="space-y-3">
                  {competition.prizeRewards.map((prize, idx) => (
                    <div 
                      key={prize.id || idx}
                      className="p-4 rounded-2xl border bg-white border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                          prize.rankPosition === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          prize.rankPosition === 2 ? 'bg-slate-100 text-slate-800 border border-slate-300' :
                          prize.rankPosition === 3 ? 'bg-amber-900/10 text-amber-900 border border-amber-900/20' :
                          'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}>
                          #{prize.rankPosition}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">{prize.title}</h5>
                          <p className="text-xs text-slate-600">{prize.rewardDescription}</p>
                          {prize.eligibilityInfo && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">Eligibility: {prize.eligibilityInfo}</span>
                          )}
                        </div>
                      </div>
                      {prize.rewardAmount && prize.rewardAmount > 0 && (
                        <div className="sm:text-right shrink-0">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Reward Value</span>
                          <span className="text-sm font-extrabold text-emerald-700">₹{prize.rewardAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : competition.prizesSummary && competition.prizesSummary.length > 0 ? (
                <div className="space-y-2">
                  {competition.prizesSummary.map((prizeStr, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                      <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">{prizeStr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
                  <Award className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Digital Merit & Participation Certificates</p>
                  <p className="text-[11px] text-slate-400">Official certificates and performance distinctions will be awarded post-evaluation.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer with prominent APPLY button */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onApply(competition);
            }}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition-colors cursor-pointer shadow-md flex items-center gap-2"
          >
            <span>APPLY FOR EXAMINATION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
