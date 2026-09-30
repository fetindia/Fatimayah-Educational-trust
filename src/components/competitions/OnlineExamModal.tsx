/**
 * @license
 * Multilingual Online Examination & Integrity Guard Interface
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Bookmark,
  Lock
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
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { getLocalizedQuestion, SUPPORTED_EXAM_LANGUAGES } from '../../lib/examTranslation';
import { ExamIntegrityWatermark } from './ExamIntegrityWatermark';
import { parseScheduleDateTimeToMs } from '../../utils/examSchedule';

interface OnlineExamModalProps {
  competition: Competition;
  registration: CompetitionRegistration;
  onClose: () => void;
  onSubmitted: () => void;
  onOpenAuth?: () => void;
}

const PRE_EXAM_INTEGRITY_RULES = [
  {
    id: 'fullscreen',
    title: 'Full-Screen Requirement',
    desc: 'The assessment must be attempted in full-screen mode where supported by your browser and operating system. Exiting full-screen or switching windows is continuously monitored and flagged.'
  },
  {
    id: 'copypaste',
    title: 'Copy / Paste Restrictions',
    desc: 'Clipboard copy, cut, and paste shortcuts (including Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+X) are strictly disabled across the entire examination environment.'
  },
  {
    id: 'textselection',
    title: 'Text-Selection Restrictions',
    desc: 'Text selection, dragging, and cursor highlighting within question prompts and answer choices are restricted to protect question security.'
  },
  {
    id: 'contextmenu',
    title: 'Right-Click Restrictions',
    desc: 'Mouse right-click context menus are disabled across the interface to prevent unauthorized browser commands, external search lookups, or developer actions.'
  },
  {
    id: 'print',
    title: 'Print & Inspection Restrictions',
    desc: 'Printing (Ctrl/Cmd+P), page source viewing (Ctrl+U), and browser developer inspection tools (F12, DevTools) are intercepted, prohibited, and logged.'
  },
  {
    id: 'focus',
    title: 'Focus & Visibility Monitoring',
    desc: 'Navigating to other browser tabs, opening background windows, or minimizing the assessment triggers immediate integrity violation warnings and automated locking upon reaching violation limits.'
  },
  {
    id: 'assistance',
    title: 'Unauthorized Assistance Restrictions',
    desc: 'Use of secondary devices, unapproved textbooks, calculators, notes, or communication with external individuals is strictly prohibited under the FET India Academic Code.'
  },
  {
    id: 'timer',
    title: 'Authoritative Timer Cannot Be Reset',
    desc: 'The countdown timer runs continuously. Refreshing the browser, closing the tab, or reopening the test window will NOT reset or pause your examination timer.'
  },
  {
    id: 'autosubmit',
    title: 'Automatic Submission at 00:00',
    desc: 'When your individual examination timer reaches 00:00, all current valid answers will be automatically submitted and locked under status "Auto-Submitted — Time Expired", triggering immediate evaluation.'
  },
  {
    id: 'watermark',
    title: 'Dynamic Watermarking & Display Protection',
    desc: 'A personalized security watermark with your name and roll number is dynamically rendered across the screen to deter unauthorized copying. Note: Standard web browsers cannot physically prevent external photography or operating-system level screen recording.'
  }
];

export const OnlineExamModal: React.FC<OnlineExamModalProps> = ({
  competition,
  registration,
  onClose,
  onSubmitted,
  onOpenAuth
}) => {
  const { currentUser } = useAuth();
  const examDetails = competition.examDetails;

  // Requirement 1: Full Paper Opening — all questions loaded into unified exam experience
  const sections: ExamSection[] = useMemo(() => {
    let resolvedSections: ExamSection[] = [];
    if (examDetails?.sections && examDetails.sections.length > 0) {
      resolvedSections = examDetails.sections.map(s => ({
        ...s,
        questions: s.questions || []
      }));
    }
    const totalQCount = resolvedSections.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
    if (totalQCount === 0 && examDetails?.questions && examDetails.questions.length > 0) {
      resolvedSections = [{
        id: 'sec-all',
        sectionCode: 'Section A',
        title: examDetails.paperTitle || 'Full Examination Paper',
        totalMarks: competition.maxMarks || 100,
        questions: examDetails.questions
      }];
    } else if (resolvedSections.length === 0) {
      resolvedSections = [{
        id: 'sec-default',
        sectionCode: 'Section A',
        title: 'General Examination Paper',
        totalMarks: competition.maxMarks || 100,
        questions: examDetails?.questions || []
      }];
    }
    return resolvedSections;
  }, [examDetails, competition.maxMarks]);

  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const currentSection = sections[activeSectionIndex] || sections[0];
  const sectionQuestions = currentSection?.questions || [];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const currentQuestion: ExamQuestion | undefined = sectionQuestions[currentQuestionIndex];

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState<ExamLanguage>(
    examDetails?.defaultLanguage || 'en'
  );

  // Super Admin controlled policies
  const allowAnswerChanges = examDetails?.allowAnswerChanges !== false;
  const allowReviewQuestions = examDetails?.allowReviewQuestions !== false;
  const instructionDurationMinutes = examDetails?.instructionDurationMinutes ?? 0;
  const instructionDurationSeconds = instructionDurationMinutes * 60;

  // Timing - Persistent Timer Architecture
  const durationMinutes = examDetails?.durationMinutes || 45;
  const totalSeconds = durationMinutes * 60;

  const regDocId = registration.id || registration.registrationId;
  const storageTimerKey = `fet_exam_started_${regDocId}`;
  const storageAnswersKey = `fet_exam_answers_${regDocId}`;

  // Candidate Answers & Status State (Requirement 4: Auto-saved and restored across refresh)
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    let initial: Record<string, any> = registration.submittedAnswers || {};
    if (typeof window !== 'undefined') {
      try {
        const localSaved = localStorage.getItem(storageAnswersKey);
        if (localSaved) {
          initial = { ...initial, ...JSON.parse(localSaved) };
        }
      } catch {}
    }
    return initial;
  });
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({});

  // Background Auto-Save Function (Requirement 4)
  const autoSaveAnswers = (updatedAnswers: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageAnswersKey, JSON.stringify(updatedAnswers));
      }
      setLastAutoSavedTime(new Date().toLocaleTimeString());

      if (db && regDocId) {
        updateDoc(doc(db, 'competition_registrations', regDocId), {
          submittedAnswers: updatedAnswers,
          updatedAt: new Date().toISOString()
        }).catch(() => {});
      }

      fetch('/api/exam/save-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: regDocId,
          participantUid: currentUser?.uid || registration.participantUid,
          answers: updatedAnswers
        })
      }).catch(() => {});
    } catch (saveErr) {
      console.warn('Auto-save note:', saveErr);
    }
  };

  // Check if candidate is resuming an already-started exam
  const existingStartedAt = registration.examStartedAt || (typeof window !== 'undefined' ? localStorage.getItem(storageTimerKey) : null);
  const isResuming = Boolean(existingStartedAt);

  // Pre-exam rules acceptance state
  const [hasAcceptedRules, setHasAcceptedRules] = useState<boolean>(isResuming);
  const [rulesCheckboxChecked, setRulesCheckboxChecked] = useState<boolean>(false);
  const [showRulesInExam, setShowRulesInExam] = useState<boolean>(false);

  // Requirement 3: Super Admin controlled pre-exam instruction display timer
  const [instructionSecondsRemaining, setInstructionSecondsRemaining] = useState<number>(() => {
    if (isResuming || instructionDurationSeconds <= 0) return 0;
    return instructionDurationSeconds;
  });

  useEffect(() => {
    if (hasAcceptedRules || isResuming || instructionDurationSeconds <= 0) return;
    if (instructionSecondsRemaining <= 0) return;

    const insTimer = setInterval(() => {
      setInstructionSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(insTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(insTimer);
  }, [hasAcceptedRules, isResuming, instructionDurationSeconds]);

  // Establish persistent start time (persists across page reloads / refreshes once started)
  const [examStartedAt, setExamStartedAt] = useState<string>(existingStartedAt || '');

  const getComputedRemainingSeconds = (startTime = examStartedAt) => {
    if (!startTime) return totalSeconds;
    const startMs = new Date(startTime).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    let remaining = Math.max(0, totalSeconds - elapsedSeconds);

    // Enforce scheduled closing time cutoff
    const scheduleDate = competition.examScheduleDate || competition.examDetails?.examScheduleDate || competition.competitionDate;
    const closeTime = competition.closingTime || competition.examDetails?.closingTime || '10:00';
    const timeZone = competition.timeZone || competition.examDetails?.timeZone || 'Asia/Kolkata';
    if (scheduleDate) {
      const closeMs = parseScheduleDateTimeToMs(scheduleDate, closeTime, timeZone);
      if (closeMs > 0) {
        const secsUntilClose = Math.max(0, Math.floor((closeMs - Date.now()) / 1000));
        remaining = Math.min(remaining, secsUntilClose);
      }
    }

    return remaining;
  };

  const [secondsRemaining, setSecondsRemaining] = useState<number>(getComputedRemainingSeconds(existingStartedAt || ''));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [examCompleted, setExamCompleted] = useState<boolean>(false);
  const [examAttemptFinalType, setExamAttemptFinalType] = useState<string | null>(registration.submissionReason || null);
  const [isLockedByExpiry, setIsLockedByExpiry] = useState<boolean>(false);
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

  // Handler to start examination after reviewing and accepting pre-exam rules
  const handleBeginExamination = () => {
    const nowIso = new Date().toISOString();
    setExamStartedAt(nowIso);
    setSecondsRemaining(getComputedRemainingSeconds(nowIso));
    try {
      localStorage.setItem(storageTimerKey, nowIso);
      if (db && regDocId) {
        updateDoc(doc(db, 'competition_registrations', regDocId), {
          examStartedAt: nowIso,
          examAttemptStatus: 'in_progress',
          updatedAt: nowIso
        }).catch(() => {});
      }
    } catch {
      // ignore
    }

    // Request fullscreen where supported
    toggleFullscreen();
    setHasAcceptedRules(true);
  };

  // Mark current question as visited
  useEffect(() => {
    if (currentQuestion?.id) {
      setVisitedQuestions(prev => ({ ...prev, [currentQuestion.id]: true }));
    }
  }, [currentQuestion?.id]);

  // Server-authoritative start & already-submitted check
  useEffect(() => {
    // 1. One-attempt enforcement: If already submitted or evaluated, immediately show results & lock
    if (
      registration.examAttemptStatus === 'submitted' || 
      registration.examAttemptStatus === 'auto_submitted' || 
      registration.status === 'completed' || 
      registration.status === 'evaluated'
    ) {
      setExamCompleted(true);
      setExamAttemptFinalType(registration.submissionReason || (registration.examAttemptStatus === 'auto_submitted' ? 'Auto-Submitted — Time Expired' : 'Completed'));
      setFinalScoreSummary({
        autoScore: registration.marksObtained || 0,
        totalMarks: registration.totalMarks || competition.maxMarks || 100,
        percentage: registration.percentage || 0,
        status: (registration.marksObtained || 0) >= (competition.passingMarks || 40) ? 'Passed' : 'Completed'
      });
      return;
    }

    // 2. Synchronize with server start-attempt endpoint once candidate begins examination
    if (hasAcceptedRules && examStartedAt) {
      fetch('/api/exam/start-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: regDocId,
          competitionId: competition.id,
          participantUid: currentUser?.uid || registration.participantUid
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.expired || (data.remainingSeconds !== undefined && data.remainingSeconds <= 0)) {
            setSecondsRemaining(0);
            setIsLockedByExpiry(true);
            handleAutoSubmit('Auto-Submitted — Time Expired');
          } else if (data.remainingSeconds !== undefined) {
            setSecondsRemaining(data.remainingSeconds);
          }
        })
        .catch(err => {
          console.warn('Server exam start sync note:', err);
        });
    }
  }, [hasAcceptedRules, examStartedAt]);

  // Persistent Timer countdown (Never resets on refresh/reopen)
  useEffect(() => {
    if (examCompleted || !hasAcceptedRules || !examStartedAt) return;

    // Check immediately if already expired
    const initialRemaining = getComputedRemainingSeconds();
    if (initialRemaining <= 0) {
      setSecondsRemaining(0);
      setIsLockedByExpiry(true);
      handleAutoSubmit('Auto-Submitted — Time Expired');
      return;
    }

    const timer = setInterval(() => {
      const remaining = getComputedRemainingSeconds();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        setIsLockedByExpiry(true);
        handleAutoSubmit('Auto-Submitted — Time Expired');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [examCompleted, hasAcceptedRules, examStartedAt]);

  // 2. Keyboard shortcut integrity lock (Ctrl+C, Ctrl+V, Ctrl+P, Ctrl+S, Ctrl+U, F12)
  useEffect(() => {
    if (examCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common extraction shortcuts
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p', 's', 'u', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        logViolation(
          'blocked_shortcut',
          `Prohibited keyboard action detected: Ctrl/Cmd + ${e.key.toUpperCase()} is disabled during the proctored assessment.`
        );
        return false;
      }

      // Prevent developer tools inspection
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        e.stopPropagation();
        logViolation(
          'developer_tools_attempt',
          'Attempted to open browser developer inspection tools. Event logged for academic review.'
        );
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [examCompleted]);

  // 3. Tab Blur / Switch & Visibility Detection (Integrity Monitoring)
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

  // Answer handlers with Answer Locking (Requirement 5) & Instant Auto Saving (Requirement 4)
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isLockedByExpiry || examCompleted || isSubmitting) return;
    // Answer Locking: If answer changes are disallowed and question already answered, block modification
    if (!allowAnswerChanges && answers[questionId] !== undefined && answers[questionId] !== '') {
      return;
    }
    const updated = {
      ...answers,
      [questionId]: optionIndex
    };
    setAnswers(updated);
    autoSaveAnswers(updated);
  };

  const handleTextAnswerChange = (questionId: string, text: string) => {
    if (isLockedByExpiry || examCompleted || isSubmitting) return;
    if (!allowAnswerChanges && answers[questionId] !== undefined && answers[questionId] !== '') {
      return;
    }
    const updated = {
      ...answers,
      [questionId]: text
    };
    setAnswers(updated);
    autoSaveAnswers(updated);
  };

  const handleClearResponse = (questionId: string) => {
    if (isLockedByExpiry || examCompleted || isSubmitting) return;
    if (!allowAnswerChanges && answers[questionId] !== undefined && answers[questionId] !== '') {
      return; // Locked answer cannot be cleared
    }
    const copy = { ...answers };
    delete copy[questionId];
    setAnswers(copy);
    autoSaveAnswers(copy);
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
    let correctAnswersCount = 0;
    let incorrectAnswersCount = 0;
    let unansweredCount = 0;

    sections.forEach(sec => {
      sec.questions.forEach(q => {
        totalMarks += q.marks || 4;
        const candidateAns = answers[q.id];
        if (candidateAns !== undefined && candidateAns !== null && candidateAns !== '') {
          if (q.questionType === 'mcq' || q.questionType === 'true_false') {
            if (candidateAns === q.correctOptionIndex) {
              score += q.marks || 4;
              correctAnswersCount++;
            } else {
              incorrectAnswersCount++;
              if (q.negativeMarks) {
                score = Math.max(0, score - q.negativeMarks);
              }
            }
          }
        } else {
          unansweredCount++;
        }
      });
    });

    return { score, totalMarks, correctAnswersCount, incorrectAnswersCount, unansweredCount };
  };

  // Submission & Automatic Result Generation
  const handleFinalSubmit = async (isAutoExpired = false, reason = 'Candidate Manual Submission') => {
    if (isSubmitting || examCompleted) return;
    setIsSubmitting(true);
    const submissionType = isAutoExpired ? 'Auto-Submitted — Time Expired' : 'Manual Submission';
    const submissionReason = isAutoExpired ? 'Auto-Submitted — Time Expired' : reason;
    const examAttemptStatus = isAutoExpired ? 'auto_submitted' : 'submitted';
    setExamAttemptFinalType(submissionReason);

    try {
      const regDocId = registration.id || registration.registrationId;

      // Check existing submission record to prevent race conditions or duplicate submissions
      if (db && regDocId) {
        try {
          const checkSnap = await getDoc(doc(db, 'competition_registrations', regDocId));
          if (checkSnap.exists()) {
            const data = checkSnap.data();
            if (data.examAttemptStatus === 'submitted' || data.examAttemptStatus === 'auto_submitted' || data.status === 'evaluated' || data.status === 'completed') {
              // Already submitted - show existing result without re-evaluating
              setFinalScoreSummary({
                autoScore: data.marksObtained || 0,
                totalMarks: data.totalMarks || competition.maxMarks || 100,
                percentage: data.percentage || 0,
                status: (data.marksObtained || 0) >= (competition.passingMarks || 40) ? 'Passed' : 'Completed'
              });
              setExamCompleted(true);
              setShowSubmitConfirm(false);
              onSubmitted();
              return;
            }
          }
        } catch (checkErr) {
          console.warn('Idempotency check note:', checkErr);
        }
      }

      // Step 1: Synchronize with server-authoritative submission endpoint
      try {
        await fetch('/api/exam/submit-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationId: regDocId,
            competitionId: competition.id,
            participantUid: currentUser?.uid || registration.participantUid,
            answers,
            violations,
            selectedLanguage,
            isAutoExpired
          })
        });
      } catch (apiErr) {
        console.warn('Server submission sync note:', apiErr);
      }

      // Step 2: System automatically evaluates answers using existing scoring logic
      const { score, totalMarks, correctAnswersCount, incorrectAnswersCount, unansweredCount } = calculateObjectiveScore();
      const max = competition.maxMarks || totalMarks || 100;
      const percentage = Number(((score / max) * 100).toFixed(1));
      const passed = score >= (competition.passingMarks || 40);

      // Step 3: System automatically calculates academic grade and award category
      let calculatedGrade = 'Needs Improvement';
      if (percentage >= 90) calculatedGrade = 'A+ (Distinction)';
      else if (percentage >= 75) calculatedGrade = 'A (Excellent)';
      else if (percentage >= 60) calculatedGrade = 'B (Good)';
      else if (percentage >= 40) calculatedGrade = 'C (Pass)';

      const autoAward: 'merit' | 'participation' = passed ? 'merit' : 'participation';
      const shouldAutoPublish = competition.autoPublishResults === true;

      // Step 4: Result automatically generated and stored in Firestore models
      if (db && regDocId) {
        try {
          await updateDoc(doc(db, 'competition_registrations', regDocId), {
            status: passed ? 'completed' : 'evaluated',
            examAttemptStatus,
            submissionReason,
            submissionType,
            marksObtained: score,
            totalMarks: max,
            percentage,
            grade: calculatedGrade,
            awardCategory: autoAward,
            evaluatorRemarks: `${submissionReason}. Automatic Evaluation System: Scored ${score}/${max} (${percentage}% - ${calculatedGrade}). Correct: ${correctAnswersCount}, Incorrect: ${incorrectAnswersCount}, Unanswered: ${unansweredCount}.`,
            evaluatedAt: new Date().toISOString(),
            submittedAnswers: answers,
            submittedAt: new Date().toISOString(),
            timeTakenMinutes: Math.min(durationMinutes, Math.ceil((totalSeconds - secondsRemaining) / 60)),
            violations: violations,
            correctAnswersCount,
            incorrectAnswersCount,
            unansweredCount,
            isResultPublished: shouldAutoPublish,
            resultsPublishedAt: shouldAutoPublish ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString()
          });

          // Also record in exam_attempts collection
          await setDoc(doc(db, 'exam_attempts', `att-${regDocId}`), {
            registrationId: regDocId,
            participantId: registration.participantId || registration.participantUid,
            competitionId: competition.id,
            competitionTitle: competition.title,
            participantUid: registration.participantUid,
            participantName: registration.candidateName || registration.participantName,
            submittedAt: new Date().toISOString(),
            timeSpentSeconds: totalSeconds - secondsRemaining,
            selectedLanguage,
            answers,
            autoScore: score,
            totalMarks: max,
            percentage,
            grade: calculatedGrade,
            awardCategory: autoAward,
            status: 'evaluated',
            submissionType,
            submissionReason,
            isAutoExpired,
            correctAnswersCount,
            incorrectAnswersCount,
            unansweredCount,
            isResultPublished: shouldAutoPublish,
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

  const handleAutoSubmit = (reasonMsg = 'Auto-Submitted — Time Expired') => {
    // Participant is NOT required to click any alert or submit confirmation.
    // Answers recorded up to expiry are locked and submitted automatically.
    setIsLockedByExpiry(true);
    handleFinalSubmit(true, reasonMsg);
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

  const localizedQ = currentQuestion ? getLocalizedQuestion(currentQuestion, selectedLanguage) : null;
  const isQuestionAnswered = Boolean(currentQuestion && answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== '');
  const isAnswerLocked = !allowAnswerChanges && isQuestionAnswered;
  const prevQuestion = currentQuestionIndex > 0 ? sectionQuestions[currentQuestionIndex - 1] : null;
  const isPrevQuestionAnswered = Boolean(prevQuestion && answers[prevQuestion.id] !== undefined && answers[prevQuestion.id] !== '');
  const isPrevDisabled = currentQuestionIndex === 0 || (!allowReviewQuestions && isPrevQuestionAnswered);

  return (
    <div 
      ref={modalContainerRef}
      onContextMenu={handleContextMenu}
      onCopy={handlePreventAction}
      onCut={handlePreventAction}
      onPaste={handlePreventAction}
      onDragStart={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 bg-slate-900 flex flex-col select-none overflow-hidden"
    >
      {/* Visual Integrity Deterrence Watermark */}
      <ExamIntegrityWatermark
        candidateName={registration.participantName || registration.candidateName || 'Verified Candidate'}
        registrationNumber={registration.registrationNumber || registration.participantId || registration.registrationId}
        participantId={registration.participantId}
        competitionTitle={competition.title}
      />

      {/* ------------------------------------------------------------- */}
      {/* CANDIDATE AUTHENTICATION REQUIRED GUARD */}
      {/* ------------------------------------------------------------- */}
      {!currentUser ? (
        <div className="relative z-50 flex-1 overflow-y-auto bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Candidate Authentication Required</span>
              </div>
              <h2 className="text-xl font-black text-white">
                Sign In to Attempt Examination
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Candidate identity verification is mandatory. You must be signed in with your registered candidate account to start, continue, or submit <strong className="text-white">{competition.title}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-left text-xs space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Assigned Candidate Roll</div>
              <div className="font-mono text-emerald-400 font-bold">{registration.participantId || registration.registrationId}</div>
              <div className="text-[11px] text-slate-400">Candidate: <span className="text-white font-medium">{registration.participantName}</span></div>
            </div>

            <div className="space-y-3 pt-2">
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                >
                  Sign In with Registered Account
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Exit Examination
              </button>
            </div>
          </div>
        </div>
      ) : !hasAcceptedRules && !examCompleted ? (
        <div className="relative z-30 flex-1 overflow-y-auto bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {/* Header / Monogram */}
            <div className="text-center space-y-2 border-b border-slate-800 pb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>FET India Proctored Examination Center</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Official Examination Regulations & Integrity Agreement
              </h1>
              <p className="text-xs text-slate-400 max-w-2xl mx-auto">
                Before commencing the assessment, please read and acknowledge all security protocols and examination rules below.
              </p>
            </div>

            {/* Super Admin Mandatory Reading Period Banner (Requirement 3) */}
            {instructionSecondsRemaining > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-xs">
                      Mandatory Reading Period (Super Admin Configured)
                    </h3>
                    <p className="text-[11px] text-indigo-200 mt-0.5">
                      Please read all instructions and policies carefully. Examination start unlocks when this reading period concludes.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-indigo-900 border border-indigo-400 text-indigo-100 font-mono font-extrabold text-xs shadow-inner">
                  {formatTime(instructionSecondsRemaining)} remaining
                </div>
              </div>
            )}

            {/* Candidate & Paper Verification Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Candidate Name</span>
                <span className="font-extrabold text-white truncate block">{registration.participantName || registration.candidateName || 'Verified Scholar'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Roll / Participant ID</span>
                <span className="font-mono font-bold text-amber-400">{registration.registrationNumber || registration.participantId}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Questions Configured</span>
                <span className="font-extrabold text-cyan-400">{totalAllQuestions} Questions ({sections.length} Sec)</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Duration Allocated</span>
                <span className="font-extrabold text-emerald-400">{durationMinutes} Minutes ({totalSeconds}s)</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Maximum Marks</span>
                <span className="font-extrabold text-indigo-400">{competition.maxMarks || 100} Marks</span>
              </div>
            </div>

            {/* Operational Instructions: How This Examination Operates (Requirement 2) */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>How This Proctored Examination Operates</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>How Answers Are Selected</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    For objective MCQs and True/False questions, click on your selected option card (A, B, C, D). For fill-in-the-blank and descriptive questions, type your response into the provided text box.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Instant Automatic Saving</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Every answer selection is automatically and instantly saved in the cloud background. You are NOT required to press "Save". Switching questions or refreshing the browser will NOT lose your saved answers.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Moving Between Questions</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Use "Previous" and "Next" buttons, Section tabs at the top, or the Question Palette on the right to jump directly to any question in the complete loaded paper.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Answer Locking & Review Policy</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    <strong>Answer Changes:</strong> {allowAnswerChanges ? 'Permitted (you can modify saved answers during active test).' : 'Locked: Once an answer is selected/saved, it cannot be changed.'}<br />
                    <strong>Question Review:</strong> {allowReviewQuestions ? 'Permitted (you can return to view previous questions).' : 'Disabled: Answered questions cannot be reopened.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 md:col-span-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Submission & Automatic Expiry at 00:00</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    You can click "Submit Exam" at any time to review your answered breakdown and confirm final completion. If the countdown reaches <strong>00:00:00</strong>, all valid recorded responses will be <strong>automatically submitted and locked under "Auto-Submitted — Time Expired"</strong> without requiring confirmation.
                  </p>
                </div>
              </div>
            </div>

            {/* 10 Explicit Pre-Exam Rules Checklist */}
            <div className="space-y-3">
              <h2 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>Mandatory Assessment Guidelines & Prohibited Conduct</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRE_EXAM_INTEGRITY_RULES.map((rule, idx) => (
                  <div 
                    key={rule.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-white">{rule.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                      {rule.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Honor Code Declaration Checkbox */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rulesCheckboxChecked}
                  onChange={(e) => setRulesCheckboxChecked(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-900 mt-0.5 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-200 leading-relaxed">
                  <strong className="text-emerald-300">FET India Honor Code Declaration:</strong> I confirm that I have read, understood, and agree to strictly abide by all examination instructions and integrity protocols. I declare that I will attempt this examination independently without unauthorized assistance, external aids, or malpractice.
                </span>
              </label>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs transition border border-slate-800"
              >
                Return to Dashboard
              </button>
              <button
                type="button"
                onClick={handleBeginExamination}
                disabled={!rulesCheckboxChecked || instructionSecondsRemaining > 0}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg shadow-emerald-950 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {instructionSecondsRemaining > 0 
                    ? `Reading Instructions (${formatTime(instructionSecondsRemaining)} remaining)...` 
                    : 'I Understand & Agree — Begin Examination'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 1. TOP SECURE APP BAR */}
          <header className="bg-slate-950 text-white border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 relative z-30">
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
                    Roll: {registration.registrationNumber || registration.participantId}
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                  {competition.title}
                </h1>
              </div>
            </div>

            {/* Center: Live Countdown Timer & Instant Auto-Save Badge */}
            <div className="flex items-center space-x-2 sm:space-x-3">
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

              {/* Requirement 4: Instant Auto-Save Badge */}
              <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Saved</span>
                {lastAutoSavedTime && <span className="text-[10px] text-slate-500 font-mono">({lastAutoSavedTime})</span>}
              </div>
            </div>

            {/* Right: Rules, Language Selector, Fullscreen & Finish Button */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Rules Reference Button */}
              <button
                type="button"
                onClick={() => setShowRulesInExam(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                title="Review Pre-Exam Instructions & Integrity Rules"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Rules</span>
              </button>

              {/* Language Switcher */}
              {examDetails?.allowLanguageSwitching !== false && (
                <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1">
                  <Languages className="w-4 h-4 text-slate-400 mr-1.5" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as ExamLanguage)}
                    className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {SUPPORTED_EXAM_LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code} className="bg-slate-900">
                        {lang.nativeLabel} ({lang.label})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition hidden sm:flex cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Submit Exam Button */}
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/40 transition flex items-center space-x-1.5 cursor-pointer"
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

              {/* Super Admin Answer Policy Status Banner (Requirements 5 & 6) */}
              {isAnswerLocked ? (
                <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-center space-x-2.5 shadow-sm">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-extrabold text-amber-300 block">Answer Locked by Examination Policy</span>
                    <span className="text-[11px] text-amber-200/90 leading-tight block mt-0.5">
                      Your answer has been recorded. Under this examination's configured policy, once an answer is selected it cannot be modified.
                      {allowReviewQuestions && ' (Reviewing is permitted in read-only mode).'}
                    </span>
                  </div>
                </div>
              ) : isQuestionAnswered ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Response recorded and automatically saved. (Modifications allowed).</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">Auto-Saved</span>
                </div>
              ) : null}

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
                          onClick={() => !isAnswerLocked && handleSelectOption(currentQuestion.id, oIdx)}
                          className={`p-4 rounded-2xl border transition flex items-center space-x-3.5 ${
                            localizedQ.isRtl ? 'space-x-reverse' : ''
                          } ${
                            isAnswerLocked 
                              ? isSelected
                                ? 'bg-indigo-950/90 border-indigo-500 text-white cursor-default ring-1 ring-indigo-500/50'
                                : 'bg-slate-950/60 border-slate-800/80 text-slate-500 cursor-not-allowed opacity-60'
                              : isSelected
                                ? 'bg-indigo-950/80 border-indigo-500 text-white ring-2 ring-indigo-500/40 cursor-pointer'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700 cursor-pointer'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isSelected 
                              ? 'bg-indigo-600 border-indigo-400 text-white' 
                              : isAnswerLocked
                                ? 'border-slate-700 bg-slate-900/60 text-slate-600'
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
                          {isAnswerLocked && isSelected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 shrink-0">
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </span>
                          )}
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
                      disabled={isAnswerLocked}
                      readOnly={isAnswerLocked}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleTextAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder={isAnswerLocked ? 'Answer locked as submitted' : 'Enter exact response...'}
                      className="w-full bg-slate-950 border border-slate-700 disabled:bg-slate-950/60 disabled:text-slate-400 rounded-xl p-3.5 text-slate-100 text-sm focus:border-indigo-500 focus:outline-none"
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
                      disabled={isAnswerLocked}
                      readOnly={isAnswerLocked}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleTextAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder={isAnswerLocked ? 'Answer locked as submitted' : 'Type your well-reasoned analytical response here in clear prose...'}
                      className="w-full bg-slate-950 border border-slate-700 disabled:bg-slate-950/60 disabled:text-slate-400 rounded-2xl p-4 text-slate-100 text-sm focus:border-indigo-500 focus:outline-none leading-relaxed"
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

                  {answers[currentQuestion.id] !== undefined && !isAnswerLocked && (
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
                    disabled={isPrevDisabled}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    title={!allowReviewQuestions && isPrevQuestionAnswered ? 'Review disabled for answered questions' : 'Go to previous question'}
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
                        ? 'Next Question' 
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

            {/* Policy Badges in Legend (Requirements 5 & 6) */}
            {(!allowAnswerChanges || !allowReviewQuestions) && (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-[10px]">
                {!allowAnswerChanges && (
                  <div className="text-amber-400 font-medium flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Answer Locking: Responses locked once saved.</span>
                  </div>
                )}
                {!allowReviewQuestions && (
                  <div className="text-amber-400 font-medium flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Review Disabled: Questions cannot be reopened.</span>
                  </div>
                )}
              </div>
            )}

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
                  const isReviewRestricted = !allowReviewQuestions && isAnswered && !isCurrent;

                  let btnStyle = 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600';
                  if (isReviewRestricted) {
                    btnStyle = 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50';
                  } else if (isAnswered && isMarked) {
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
                      disabled={isReviewRestricted}
                      onClick={() => !isReviewRestricted && setCurrentQuestionIndex(idx)}
                      title={isReviewRestricted ? 'Review Disabled: Question cannot be reopened once answered' : `Go to question ${idx + 1}`}
                      className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition ${btnStyle}`}
                    >
                      <span>{idx + 1}</span>
                      {isReviewRestricted && <Lock className="w-2.5 h-2.5 ml-0.5 text-slate-500" />}
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
                onClick={() => handleFinalSubmit(false, 'Candidate Manual Submission')}
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
              {(examAttemptFinalType?.includes('Auto-Submitted') || isLockedByExpiry) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Submitted — Time Expired</span>
                </div>
              )}
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

        </>
      )}

      {/* 7. PRE-EXAM RULES REFERENCE OVERLAY MODAL (ACCESSIBLE DURING EXAM) */}
      {showRulesInExam && (
        <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-white space-y-4 max-h-[85vh] flex flex-col overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Examination Regulations & Integrity Rules</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowRulesInExam(false)} 
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Review the proctored assessment protocols and prohibited conduct. Your assessment timer continues to run in the background.
              </p>
              <div className="space-y-2.5">
                {PRE_EXAM_INTEGRITY_RULES.map((rule, idx) => (
                  <div key={rule.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <strong className="text-white text-xs">{rule.title}</strong>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-6 leading-relaxed">{rule.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRulesInExam(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Return to Assessment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
