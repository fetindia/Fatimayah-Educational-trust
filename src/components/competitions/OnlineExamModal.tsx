/**
 * @license
 * Multilingual Online Examination & Integrity Guard Interface
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Send,
  BookOpen,
  Award,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Languages,
  Maximize2,
  Minimize2,
  AlertTriangle,
  RotateCcw,
  Flag,
  Check,
  Bookmark
} from 'lucide-react';
import { 
  Competition, 
  CompetitionRegistration, 
  ExamQuestion, 
  ExamSection, 
  ExamLanguage, 
  CandidateViolationRecord 
} from '../../types';
import { db } from '../../lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

interface OnlineExamModalProps {
  competition: Competition;
  registration: CompetitionRegistration;
  onClose: () => void;
  onSubmitted: () => void;
}

export const OnlineExamModal: React.FC<OnlineExamModalProps> = ({
  competition,
  registration,
  onClose,
  onSubmitted
}) => {
  const examDetails = competition.examDetails;
  const sections: ExamSection[] = examDetails?.sections && examDetails.sections.length > 0 
    ? examDetails.sections 
    : [{
        id: 'sec-default',
        sectionCode: 'Section A',
        title: 'General Examination Paper',
        totalMarks: competition.maxMarks || 100,
        questions: examDetails?.questions || []
      }];

  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const currentSection = sections[activeSectionIndex] || sections[0];
  const sectionQuestions = currentSection?.questions || [];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const currentQuestion: ExamQuestion | undefined = sectionQuestions[currentQuestionIndex];

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState<ExamLanguage>(
    examDetails?.defaultLanguage || 'en'
  );

  // Candidate Answers & Status State
  const [answers, setAnswers] = useState<Record<string, any>>(
    registration.submittedAnswers || {}
  );
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({});

  // Timing
  const durationMinutes = examDetails?.durationMinutes || 45;
  const totalSeconds = durationMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [examCompleted, setExamCompleted] = useState<boolean>(false);
  const [finalScoreSummary, setFinalScoreSummary] = useState<{
    autoScore: number;
    totalMarks: number;
    percentage: number;
    status: string;
  } | null>(null);

  // Integrity & Anti-Cheating State
  const integrityConfig = examDetails?.integrityConfig || {
    enforceFullscreen: true,
    trackTabSwitch: true,
    maxTabSwitchViolations: 3,
    preventCopyPaste: true,
    preventContextMenu: true,
    autoSubmitOnTimeExpiry: true
  };

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [violations, setViolations] = useState<CandidateViolationRecord[]>([]);
  const [showIntegrityAlert, setShowIntegrityAlert] = useState<string | null>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Mark current question as visited
  useEffect(() => {
    if (currentQuestion?.id) {
      setVisitedQuestions(prev => ({ ...prev, [currentQuestion.id]: true }));
    }
  }, [currentQuestion?.id]);

  // 1. Timer countdown
  useEffect(() => {
    if (examCompleted) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit('Time has expired. Your examination was automatically submitted.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examCompleted]);

  // 2. Tab Blur / Switch & Visibility Detection (Integrity Monitoring)
  useEffect(() => {
    if (examCompleted || !integrityConfig.trackTabSwitch) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation(
          'tab_switch',
          'Candidate navigated away from the active examination window (Tab switch or application minimize detected).'
        );
      }
    };

    const handleWindowBlur = () => {
      logViolation(
        'focus_loss',
        'Window lost focus. Candidate clicked outside active exam viewport.'
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [examCompleted, integrityConfig.trackTabSwitch, violations.length]);

  // Log Violation Helper
  const logViolation = (type: string, details: string) => {
    const newViolation: CandidateViolationRecord = {
      id: `v-${Date.now()}`,
      type: type as any,
      timestamp: new Date().toISOString(),
      details,
      severity: 'medium'
    };

    setViolations(prev => {
      const updated = [...prev, newViolation];
      const maxAllowed = integrityConfig.maxTabSwitchViolations || 3;
      
      if (updated.length >= maxAllowed && integrityConfig.autoSubmitOnTimeExpiry) {
        handleAutoSubmit(`Violation threshold reached (${updated.length}/${maxAllowed}). Exam automatically locked for integrity review.`);
      } else {
        setShowIntegrityAlert(
          `Integrity Alert: Navigation outside exam detected (${updated.length}/${maxAllowed} warnings). Continued violations will result in automatic disqualification.`
        );
      }

      return updated;
    });
  };

  // Fullscreen toggle helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Copy / Paste / Context Menu Prevention Handlers
  const handlePreventAction = (e: React.SyntheticEvent) => {
    if (integrityConfig.preventCopyPaste) {
      e.preventDefault();
      return false;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (integrityConfig.preventContextMenu) {
      e.preventDefault();
      return false;
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Answer handler
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleTextAnswerChange = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleClearResponse = (questionId: string) => {
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Auto score calculation for objective questions
  const calculateObjectiveScore = () => {
    let score = 0;
    let totalMarks = 0;

    sections.forEach(sec => {
      sec.questions.forEach(q => {
        totalMarks += q.marks || 4;
        const candidateAns = answers[q.id];
        if (candidateAns !== undefined && candidateAns !== null && candidateAns !== '') {
          if (q.questionType === 'mcq' || q.questionType === 'true_false') {
            if (candidateAns === q.correctOptionIndex) {
              score += q.marks || 4;
            } else if (q.negativeMarks) {
              score = Math.max(0, score - q.negativeMarks);
            }
          }
        }
      });
    });

    return { score, totalMarks };
  };

  // Submission
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { score, totalMarks } = calculateObjectiveScore();
      const max = competition.maxMarks || totalMarks || 100;
      const percentage = Number(((score / max) * 100).toFixed(1));
      const passed = score >= (competition.passingMarks || 40);

      // Save to Firebase / Local state
      if (db && registration.id) {
        try {
          await updateDoc(doc(db, 'competition_registrations', registration.id), {
            status: passed ? 'completed' : 'evaluated',
            marksObtained: score,
            totalMarks: max,
            percentage,
            submittedAnswers: answers,
            submittedAt: new Date().toISOString(),
            timeTakenMinutes: Math.ceil((totalSeconds - secondsRemaining) / 60),
            violations: violations
          });

          // Also record in exam_attempts collection
          await setDoc(doc(db, 'exam_attempts', `att-${registration.id}`), {
            registrationId: registration.id,
            participantId: registration.participantUid,
            competitionId: competition.id,
            competitionTitle: competition.title,
            participantUid: registration.participantUid,
            participantName: registration.candidateName,
            submittedAt: new Date().toISOString(),
            timeSpentSeconds: totalSeconds - secondsRemaining,
            selectedLanguage,
            answers,
            autoScore: score,
            totalMarks: max,
            percentage,
            status: 'submitted',
            violationsCount: violations.length,
            violations: violations
          });
        } catch (fbErr) {
          console.warn('Firebase attempt save fallback:', fbErr);
        }
      }

      setFinalScoreSummary({
        autoScore: score,
        totalMarks: max,
        percentage,
        status: passed ? 'Passed' : 'Completed'
      });

      setExamCompleted(true);
      setShowSubmitConfirm(false);
      onSubmitted();
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = (reasonMsg?: string) => {
    if (reasonMsg) {
      alert(reasonMsg);
    }
    handleFinalSubmit();
  };

  // Section aggregate question counts
  let totalAllQuestions = 0;
  let totalAnsweredCount = 0;
  let totalMarkedCount = 0;

  sections.forEach(sec => {
    sec.questions.forEach(q => {
      totalAllQuestions++;
      if (answers[q.id] !== undefined && answers[q.id] !== '') {
        totalAnsweredCount++;
      }
      if (markedForReview[q.id]) {
        totalMarkedCount++;
      }
    });
  });

  // Get localized question text & options
  const getLocalizedQuestion = (q: ExamQuestion) => {
    if (selectedLanguage === 'en' || !q.translations || !q.translations[selectedLanguage]) {
      return {
        text: q.questionText,
        options: q.options || [],
        isRtl: false,
        fontFamily: 'inherit'
      };
    }

    const t = q.translations[selectedLanguage];
    const isRtl = selectedLanguage === 'ur' || selectedLanguage === 'ar' || selectedLanguage === 'fa';
    return {
      text: t?.questionText || q.questionText,
      options: t?.options && t.options.length > 0 ? t.options : (q.options || []),
      isRtl,
      fontFamily: selectedLanguage === 'ur' ? 'Noto Nastaliq Urdu, serif' : 'inherit'
    };
  };

  const localizedQ = currentQuestion ? getLocalizedQuestion(currentQuestion) : null;

  return (
    <div 
      ref={modalContainerRef}
      onContextMenu={handleContextMenu}
      onCopy={handlePreventAction}
      onCut={handlePreventAction}
      onPaste={handlePreventAction}
      className="fixed inset-0 z-50 bg-slate-900 flex flex-col select-none overflow-hidden"
    >
      {/* 1. TOP SECURE APP BAR */}
      <header className="bg-slate-950 text-white border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
        {/* Left: Competition Title & Candidate */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                FET India Proctored Assessment
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Roll: {registration.registrationNumber}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
              {competition.title}
            </h1>
          </div>
        </div>

        {/* Center: Live Countdown Timer */}
        <div className="flex items-center space-x-3">
          <div className={`px-4 py-1.5 rounded-xl border flex items-center space-x-2 shadow-inner font-mono font-bold ${
            secondsRemaining < 300 
              ? 'bg-red-950/80 border-red-600 text-red-400 animate-pulse' 
              : secondsRemaining < 600 
                ? 'bg-amber-950/80 border-amber-600 text-amber-400' 
                : 'bg-slate-900 border-slate-700 text-emerald-400'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="text-base sm:text-lg">{formatTime(secondsRemaining)}</span>
          </div>
        </div>

        {/* Right: Language Selector, Fullscreen & Finish Button */}
        <div className="flex items-center space-x-3">
          {/* Language Switcher */}
          {examDetails?.allowLanguageSwitching !== false && (
            <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1">
              <Languages className="w-4 h-4 text-slate-400 mr-1.5" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as ExamLanguage)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-slate-900">English</option>
                <option value="ur" className="bg-slate-900">اردو (Urdu)</option>
                <option value="hi" className="bg-slate-900">हिंदी (Hindi)</option>
                <option value="ar" className="bg-slate-900">العربية (Arabic)</option>
              </select>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition hidden sm:flex"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Submit Exam Button */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/40 transition flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* 2. SECTION NAVIGATOR BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-2 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-2 hidden sm:inline">
            Sections:
          </span>
          {sections.map((sec, idx) => {
            const isSecActive = idx === activeSectionIndex;
            const secAnsweredCount = sec.questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length;
            return (
              <button
                key={sec.id || idx}
                onClick={() => {
                  setActiveSectionIndex(idx);
                  setCurrentQuestionIndex(0);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                  isSecActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{sec.sectionCode || `Section ${idx + 1}`}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  isSecActive ? 'bg-indigo-700 text-white' : 'bg-slate-900 text-slate-400'
                }`}>
                  {secAnsweredCount}/{sec.questions.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 flex items-center space-x-3">
          <span>Overall: <strong className="text-emerald-400">{totalAnsweredCount}</strong> / {totalAllQuestions} Answered</span>
          {violations.length > 0 && (
            <span className="text-amber-400 font-bold flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{violations.length} Flags</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. INTEGRITY FLOATING ALERT */}
      {showIntegrityAlert && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-lg animate-slideDown">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-900 flex-shrink-0" />
            <span>{showIntegrityAlert}</span>
          </div>
          <button onClick={() => setShowIntegrityAlert(null)} className="text-amber-950 hover:text-black">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. MAIN ASSESSMENT WORKSPACE */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-900">
        
        {/* Left / Center: Active Question Display */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between">
          {currentQuestion && localizedQ ? (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              
              {/* Question Meta Badge Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                    Q{currentQuestionIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {currentQuestion.questionType.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 rounded-md">
                    +{currentQuestion.marks || 4} Marks {currentQuestion.negativeMarks ? `(-${currentQuestion.negativeMarks})` : ''}
                  </span>
                </div>

                {currentQuestion.bookMastery && (
                  <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-950/50 border border-amber-800/60 rounded-xl text-xs text-amber-300">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>
                      {currentQuestion.bookMastery.bookTitle} • Ch {currentQuestion.bookMastery.chapterNumber} ({currentQuestion.bookMastery.pageRange || 'Prescribed'})
                    </span>
                  </div>
                )}
              </div>

              {/* Question Text with RTL & Font formatting */}
              <div 
                dir={localizedQ.isRtl ? 'rtl' : 'ltr'}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-sm"
              >
                <p 
                  className={`font-semibold leading-relaxed ${
                    localizedQ.isRtl ? 'text-lg text-amber-100' : 'text-base sm:text-lg text-slate-100'
                  }`}
                  style={{ fontFamily: localizedQ.fontFamily }}
                >
                  {localizedQ.text}
                </p>
              </div>

              {/* Options or Answer Input */}
              <div className="space-y-3">
                {/* MCQ & True/False Single Choice Options */}
                {(currentQuestion.questionType === 'mcq' || currentQuestion.questionType === 'true_false') && localizedQ.options && (
                  <div className="space-y-2.5" dir={localizedQ.isRtl ? 'rtl' : 'ltr'}>
                    {localizedQ.options.map((opt, oIdx) => {
                      const isSelected = answers[currentQuestion.id] === oIdx;
                      return (
                        <div
                          key={oIdx}
                          onClick={() => handleSelectOption(currentQuestion.id, oIdx)}
                          className={`p-4 rounded-2xl border transition cursor-pointer flex items-center space-x-3.5 ${
                            localizedQ.isRtl ? 'space-x-reverse' : ''
                          } ${
                            isSelected
                              ? 'bg-indigo-950/80 border-indigo-500 text-white ring-2 ring-indigo-500/40'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isSelected 
                              ? 'bg-indigo-600 border-indigo-400 text-white' 
                              : 'border-slate-600 bg-slate-900 text-slate-400'
                          }`}>
                            {isSelected ? <Check className="w-3.5 h-3.5" /> : String.fromCharCode(65 + oIdx)}
                          </div>
                          <span 
                            className={`flex-1 text-sm sm:text-base font-medium ${isSelected ? 'text-white font-semibold' : 'text-slate-200'}`}
                            style={{ fontFamily: localizedQ.fontFamily }}
                          >
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fill in the Blank */}
                {currentQuestion.questionType === 'fill_blank' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400">Type Your Answer Below:</label>
                    <input
                      type="text"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleTextAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Enter exact response..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-slate-100 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Descriptive Essay Answer */}
                {currentQuestion.questionType === 'descriptive' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <label className="font-semibold">Candidate Descriptive Answer / Essay:</label>
                      <span>{(answers[currentQuestion.id] || '').length} characters</span>
                    </div>
                    <textarea
                      rows={6}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleTextAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Type your well-reasoned analytical response here in clear prose..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-slate-100 text-sm focus:border-indigo-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons: Clear Response, Mark for Review, Prev, Next */}
              <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleMarkForReview(currentQuestion.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      markedForReview[currentQuestion.id]
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-purple-300 hover:bg-slate-700 border border-purple-800/40'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{markedForReview[currentQuestion.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                  </button>

                  {answers[currentQuestion.id] !== undefined && (
                    <button
                      onClick={() => handleClearResponse(currentQuestion.id)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear Response</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => {
                      if (currentQuestionIndex < sectionQuestions.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                      } else if (activeSectionIndex < sections.length - 1) {
                        setActiveSectionIndex(prev => prev + 1);
                        setCurrentQuestionIndex(0);
                      } else {
                        setShowSubmitConfirm(true);
                      }
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/40 transition flex items-center space-x-1.5"
                  >
                    <span>
                      {currentQuestionIndex < sectionQuestions.length - 1 
                        ? 'Save & Next' 
                        : activeSectionIndex < sections.length - 1 
                          ? 'Next Section' 
                          : 'Review & Submit'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center text-slate-500 py-12">
              No questions found in this section.
            </div>
          )}
        </section>

        {/* Right Sidebar: Question Palette Grid */}
        <aside className="w-full md:w-80 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 p-5 flex flex-col justify-between flex-shrink-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Question Palette
              </h3>
              <span className="text-xs text-indigo-400 font-bold font-mono">
                {currentSection.sectionCode}
              </span>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700"></span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded bg-purple-600"></span>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded bg-purple-600 ring-2 ring-emerald-400"></span>
                <span>Ans & Marked</span>
              </div>
            </div>

            {/* Questions Number Grid */}
            <div className="pt-2">
              <p className="text-xs text-slate-400 mb-2 font-semibold">
                Jump to Question in {currentSection.sectionCode}:
              </p>
              <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                {sectionQuestions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                  const isMarked = markedForReview[q.id];

                  let btnStyle = 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600';
                  if (isAnswered && isMarked) {
                    btnStyle = 'bg-purple-600 text-white ring-2 ring-emerald-400';
                  } else if (isMarked) {
                    btnStyle = 'bg-purple-600 text-white';
                  } else if (isAnswered) {
                    btnStyle = 'bg-emerald-600 text-white font-bold';
                  } else if (visitedQuestions[q.id]) {
                    btnStyle = 'bg-slate-800 border-slate-700 text-slate-300';
                  }

                  if (isCurrent) {
                    btnStyle += ' ring-2 ring-white font-black';
                  }

                  return (
                    <button
                      key={q.id || idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Submit Action */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit & End Test</span>
            </button>
          </div>
        </aside>
      </main>

      {/* 5. SUBMIT CONFIRMATION SUMMARY MODAL */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Confirm Final Exam Submission</span>
              </h3>
              <button onClick={() => setShowSubmitConfirm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Please review your section-wise response breakdown before submitting. Once submitted, your answers will be locked and graded.
            </p>

            {/* Section breakdown table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="p-2.5">Section</th>
                    <th className="p-2.5 text-center">Total</th>
                    <th className="p-2.5 text-center">Answered</th>
                    <th className="p-2.5 text-center">Marked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sections.map(sec => {
                    const ansCount = sec.questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length;
                    const markCount = sec.questions.filter(q => markedForReview[q.id]).length;
                    return (
                      <tr key={sec.id} className="text-slate-200">
                        <td className="p-2.5 font-bold">{sec.sectionCode}</td>
                        <td className="p-2.5 text-center">{sec.questions.length}</td>
                        <td className="p-2.5 text-center text-emerald-400 font-bold">{ansCount}</td>
                        <td className="p-2.5 text-center text-purple-400 font-bold">{markCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Time Remaining: <strong className="text-white">{formatTime(secondsRemaining)}</strong></span>
              <span>Total Answered: <strong className="text-emerald-400">{totalAnsweredCount} / {totalAllQuestions}</strong></span>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Return to Exam
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Recording Submission...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Finish Exam</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. POST-SUBMISSION RESULTS ACKNOWLEDGEMENT */}
      {examCompleted && finalScoreSummary && (
        <div className="fixed inset-0 z-70 bg-slate-950/95 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 text-center text-white space-y-6 shadow-2xl animate-scaleIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">
                Examination Completed Successfully!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Your responses for <strong>{competition.title}</strong> have been securely recorded and verified.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Objective Score</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {finalScoreSummary.autoScore} / {finalScoreSummary.totalMarks}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Percentage</span>
                <span className="text-2xl font-bold text-indigo-400">
                  {finalScoreSummary.percentage}%
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Official merit lists and verified digital e-certificates will be published following final academic review by the FET Examination Board.
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
            >
              Close & Return to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
