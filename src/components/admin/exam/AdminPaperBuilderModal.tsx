/**
 * @license
 * Professional Examination Paper Builder & Section Architecture
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Layers, 
  Clock, 
  ShieldAlert, 
  Languages, 
  Settings, 
  Eye, 
  Printer, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  ChevronRight,
  MoveUp,
  MoveDown,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Shuffle,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { 
  Competition, 
  ExamSection, 
  ExamQuestion, 
  ExamIntegrityConfig, 
  ExamLanguage, 
  QuestionBank,
  ExamSeries,
  QuestionType,
  QuestionDifficulty
} from '../../../types';
import { INITIAL_QUESTION_BANKS } from '../../../data/initialQuestionBanks';
import { SUPPORTED_EXAM_LANGUAGES } from '../../../lib/examTranslation';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface AdminPaperBuilderModalProps {
  competition: Competition;
  onClose: () => void;
  onSave: (updatedCompetition: Competition) => void;
}

export const AdminPaperBuilderModal: React.FC<AdminPaperBuilderModalProps> = ({
  competition,
  onClose,
  onSave
}) => {
  const existingExam = competition.examDetails;

  // Paper Meta
  const [paperCode, setPaperCode] = useState(existingExam?.paperCode || `PPR-${competition.code}`);
  const [paperTitle, setPaperTitle] = useState(existingExam?.paperTitle || `${competition.title} Assessment Paper`);
  const [durationMinutes, setDurationMinutes] = useState(existingExam?.durationMinutes || 45);
  const [passingMarks, setPassingMarks] = useState(existingExam?.passingMarks || competition.passingMarks || 40);
  const [defaultLanguage, setDefaultLanguage] = useState<ExamLanguage>(existingExam?.defaultLanguage || 'en');
  const [supportedLanguages, setSupportedLanguages] = useState<ExamLanguage[]>(
    existingExam?.supportedLanguages || ['en', 'ur', 'hi']
  );
  const [allowLanguageSwitching, setAllowLanguageSwitching] = useState(
    existingExam?.allowLanguageSwitching ?? true
  );

  // Integrity Config
  const [integrityConfig, setIntegrityConfig] = useState<ExamIntegrityConfig>(
    existingExam?.integrityConfig || {
      enforceFullscreen: true,
      trackTabSwitch: true,
      maxTabSwitchViolations: 3,
      preventCopyPaste: true,
      preventContextMenu: true,
      autoSubmitOnTimeExpiry: true,
      allowResumeOnDisconnect: true,
      heartbeatIntervalSeconds: 15
    }
  );

  // Scheduled Examination State
  const [examScheduleDate, setExamScheduleDate] = useState<string>(
    existingExam?.examScheduleDate || competition.examScheduleDate || competition.competitionDate || new Date().toISOString().split('T')[0]
  );
  const [openingTime, setOpeningTime] = useState<string>(
    existingExam?.openingTime || competition.openingTime || '09:00'
  );
  const [closingTime, setClosingTime] = useState<string>(
    existingExam?.closingTime || competition.closingTime || '10:00'
  );
  const [timeZone, setTimeZone] = useState<string>(
    existingExam?.timeZone || competition.timeZone || 'Asia/Kolkata'
  );
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState<boolean>(
    existingExam?.allowMultipleAttempts ?? competition.allowMultipleAttempts ?? false
  );

  // Series 1 to 5 Management State
  const [seriesCount, setSeriesCount] = useState<number>(
    existingExam?.seriesCount || competition.seriesCount || 1
  );
  const [seriesList, setSeriesList] = useState<ExamSeries[]>(() => {
    if (existingExam?.seriesList && existingExam.seriesList.length > 0) {
      return existingExam.seriesList;
    }
    const initialList: ExamSeries[] = [];
    const count = existingExam?.seriesCount || competition.seriesCount || 1;
    for (let i = 1; i <= Math.max(1, Math.min(5, count)); i++) {
      initialList.push({
        id: `series-${i}`,
        seriesCode: `Series ${i}`,
        seriesTitle: `Paper Series ${i}`,
        orderMode: i === 1 ? 'custom_questions' : 'shuffled_questions'
      });
    }
    return initialList;
  });
  const [activeSeriesTab, setActiveSeriesTab] = useState<string>('series-1');

  const handleSetSeriesCount = (count: number) => {
    const validCount = Math.max(1, Math.min(5, count));
    setSeriesCount(validCount);
    setSeriesList(prev => {
      const nextList: ExamSeries[] = [];
      for (let i = 1; i <= validCount; i++) {
        const existing = prev.find(s => s.seriesCode === `Series ${i}` || s.id === `series-${i}`);
        if (existing) {
          nextList.push(existing);
        } else {
          nextList.push({
            id: `series-${i}`,
            seriesCode: `Series ${i}`,
            seriesTitle: `Paper Series ${i}`,
            orderMode: 'shuffled_questions'
          });
        }
      }
      return nextList;
    });
    setActiveSeriesTab('series-1');
  };

  const handleUpdateSeries = (seriesId: string, updates: Partial<ExamSeries>) => {
    setSeriesList(prev => prev.map(s => s.id === seriesId ? { ...s, ...updates } : s));
  };

  // Sections
  const [sections, setSections] = useState<ExamSection[]>(
    existingExam?.sections || [
      {
        id: 'sec-1',
        sectionCode: 'Section A',
        title: 'Objective & Multiple Choice Section',
        description: 'Comprehensive multiple-choice questions assessing foundational comprehension.',
        totalMarks: 60,
        passingMarks: 24,
        questions: existingExam?.questions?.filter(q => q.questionType === 'mcq') || []
      },
      {
        id: 'sec-2',
        sectionCode: 'Section B',
        title: 'Critical Analytical Synthesis',
        description: 'Descriptive and analytical questions assessing higher-order thinking.',
        totalMarks: 40,
        passingMarks: 16,
        questions: existingExam?.questions?.filter(q => q.questionType === 'descriptive') || []
      }
    ]
  );

  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id || 'sec-1');
  const [activeBuilderTab, setActiveBuilderTab] = useState<'sections' | 'series' | 'schedule' | 'integrity' | 'preview'>('sections');
  const [showQuestionPickerModal, setShowQuestionPickerModal] = useState<boolean>(false);
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState<boolean>(false);
  const [selectedBankForPick, setSelectedBankForPick] = useState<string>(INITIAL_QUESTION_BANKS[0]?.id || '');
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(existingExam?.shuffleQuestions ?? true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(existingExam?.shuffleOptions ?? true);

  // Super Admin controlled pre-exam instruction duration and answer policies
  const [instructionDurationMinutes, setInstructionDurationMinutes] = useState<number>(
    existingExam?.instructionDurationMinutes !== undefined ? existingExam.instructionDurationMinutes : 2
  );
  const [allowAnswerChanges, setAllowAnswerChanges] = useState<boolean>(
    existingExam?.allowAnswerChanges !== undefined ? existingExam.allowAnswerChanges : true
  );
  const [allowReviewQuestions, setAllowReviewQuestions] = useState<boolean>(
    existingExam?.allowReviewQuestions !== undefined ? existingExam.allowReviewQuestions : true
  );

  // Directly created question handler (Method B: Write a Question Directly)
  const handleDirectCreateQuestion = async (newQ: ExamQuestion, alsoSaveToBankId?: string) => {
    if (!currentSection) return;
    const updated = [...currentSection.questions, newQ];
    handleUpdateSection(currentSection.id, { questions: updated });
    setShowCreateQuestionModal(false);

    // Optional reuse: save to selected question bank repository without duplicating bank
    if (alsoSaveToBankId) {
      try {
        const bankRef = doc(db, 'question_banks', alsoSaveToBankId);
        const bankSnap = await getDoc(bankRef);
        if (bankSnap.exists()) {
          const bdata = bankSnap.data();
          const existingQs = bdata.questions || [];
          await updateDoc(bankRef, {
            questions: [...existingQs, newQ],
            questionsCount: existingQs.length + 1,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (saveErr) {
        console.warn('Optional save to question bank note:', saveErr);
      }
    }
  };

  // Calculate total marks across sections
  const totalCalculatedMarks = sections.reduce((sum, sec) => sum + (sec.totalMarks || 0), 0);
  const totalQuestionsCount = sections.reduce((sum, sec) => sum + (sec.questions?.length || 0), 0);

  // Section Manipulation
  const handleAddSection = () => {
    const nextCode = `Section ${String.fromCharCode(65 + sections.length)}`;
    const newSec: ExamSection = {
      id: `sec-${Date.now()}`,
      sectionCode: nextCode,
      title: `New Assessment Section`,
      description: 'Section description and instructions for candidates.',
      totalMarks: 25,
      passingMarks: 10,
      questions: []
    };
    setSections([...sections, newSec]);
    setActiveSectionId(newSec.id);
  };

  const handleUpdateSection = (secId: string, updates: Partial<ExamSection>) => {
    setSections(sections.map(s => s.id === secId ? { ...s, ...updates } : s));
  };

  const handleDeleteSection = (secId: string) => {
    if (sections.length <= 1) {
      alert('Examination paper must contain at least one section.');
      return;
    }
    const updated = sections.filter(s => s.id !== secId);
    setSections(updated);
    setActiveSectionId(updated[0].id);
  };

  const currentSection = sections.find(s => s.id === activeSectionId) || sections[0];

  // Question manipulation in current section
  const handleRemoveQuestionFromSection = (qId: string) => {
    if (!currentSection) return;
    const updatedQ = currentSection.questions.filter(q => q.id !== qId);
    handleUpdateSection(currentSection.id, { questions: updatedQ });
  };

  const handleAddQuestionsFromBank = (pickedQuestions: ExamQuestion[]) => {
    if (!currentSection) return;
    const existingIds = new Set(currentSection.questions.map(q => q.id));
    const toAdd = pickedQuestions.filter(q => !existingIds.has(q.id));
    handleUpdateSection(currentSection.id, {
      questions: [...currentSection.questions, ...toAdd]
    });
    setShowQuestionPickerModal(false);
  };

  // Language toggle
  const toggleLanguage = (lang: ExamLanguage) => {
    if (supportedLanguages.includes(lang)) {
      if (supportedLanguages.length === 1) {
        alert('Paper must support at least one language.');
        return;
      }
      setSupportedLanguages(supportedLanguages.filter(l => l !== lang));
    } else {
      setSupportedLanguages([...supportedLanguages, lang]);
    }
  };

  // Submit and Save
  const handleSavePaper = () => {
    // Gather all questions into flat array as well for backward-compatibility
    const flatQuestions: ExamQuestion[] = [];
    sections.forEach(sec => {
      sec.questions.forEach(q => flatQuestions.push(q));
    });

    const updatedComp: Competition = {
      ...competition,
      competitionDate: examScheduleDate,
      examScheduleDate,
      openingTime,
      closingTime,
      timeZone,
      allowMultipleAttempts,
      seriesCount,
      seriesList,
      maxMarks: totalCalculatedMarks > 0 ? totalCalculatedMarks : competition.maxMarks,
      passingMarks: passingMarks,
      examDetails: {
        isOnlineExam: true,
        paperCode,
        paperTitle,
        durationMinutes: Number(durationMinutes),
        totalMarks: totalCalculatedMarks > 0 ? totalCalculatedMarks : competition.maxMarks,
        passingMarks: Number(passingMarks),
        defaultLanguage,
        supportedLanguages,
        allowLanguageSwitching,
        sections,
        questions: flatQuestions,
        integrityConfig,
        instructionDurationMinutes: Number(instructionDurationMinutes),
        allowAnswerChanges: Boolean(allowAnswerChanges),
        allowReviewQuestions: Boolean(allowReviewQuestions),
        allowReviewBeforeSubmit: true,
        shuffleQuestions: Boolean(shuffleQuestions),
        shuffleOptions: Boolean(shuffleOptions),
        seriesCount,
        seriesList,
        examScheduleDate,
        openingTime,
        closingTime,
        timeZone,
        allowMultipleAttempts,
        instructions: [
          `You have ${durationMinutes} minutes to complete all sections of this paper.`,
          `This examination is monitored by the FET Exam Integrity System.`,
          `Switching browser tabs or exiting fullscreen mode is strictly prohibited.`
        ]
      },
      updatedAt: new Date().toISOString()
    };

    onSave(updatedComp);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Header Bar */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                Examination Architecture & Sections Builder
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {paperCode}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              {paperTitle}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePaper}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Save & Publish Paper</span>
            </button>
          </div>
        </div>

        {/* Paper Overview Cards */}
        <div className="bg-white p-4 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
            <span className="text-gray-500 block">Total Sections</span>
            <span className="text-lg font-bold text-indigo-900">{sections.length} Sections</span>
          </div>
          <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3">
            <span className="text-gray-500 block">Total Questions</span>
            <span className="text-lg font-bold text-purple-900">{totalQuestionsCount} Questions</span>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
            <span className="text-gray-500 block">Aggregated Marks</span>
            <span className="text-lg font-bold text-emerald-900">{totalCalculatedMarks} Marks</span>
          </div>
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
            <span className="text-gray-500 block">Time Duration</span>
            <span className="text-lg font-bold text-amber-900">{durationMinutes} Minutes</span>
          </div>
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 col-span-2 sm:col-span-1">
            <span className="text-gray-500 block">Series & Schedule</span>
            <span className="text-xs font-bold text-blue-900 block truncate mt-1">
              {seriesCount} Series • {openingTime || '09:00'}–{closingTime || '10:00'} IST
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-gray-200 flex items-center space-x-2 sm:space-x-4 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveBuilderTab('sections')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeBuilderTab === 'sections'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Sections & Questions</span>
          </button>
          <button
            onClick={() => setActiveBuilderTab('series')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeBuilderTab === 'series'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>Series 1–5 ({seriesCount})</span>
          </button>
          <button
            onClick={() => setActiveBuilderTab('schedule')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeBuilderTab === 'schedule'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule & Windows</span>
          </button>
          <button
            onClick={() => setActiveBuilderTab('integrity')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeBuilderTab === 'integrity'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Integrity & Anti-Cheat</span>
          </button>
          <button
            onClick={() => setActiveBuilderTab('preview')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeBuilderTab === 'preview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Live Paper Preview</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">

          {/* TAB 1: SECTIONS & QUESTIONS BUILDER */}
          {activeBuilderTab === 'sections' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Sections Master List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Paper Sections
                  </h3>
                  <button
                    onClick={handleAddSection}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Section</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {sections.map((sec, idx) => {
                    const isSelected = sec.id === activeSectionId;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => setActiveSectionId(sec.id)}
                        className={`p-4 rounded-2xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-50'
                            : 'bg-white/80 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-700">
                            {sec.sectionCode}
                          </span>
                          <span className="text-xs font-bold text-indigo-700">
                            {sec.totalMarks} Marks
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-gray-900 mt-2">
                          {sec.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {sec.description}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <span>{sec.questions.length} Questions</span>
                          {sections.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSection(sec.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                              title="Delete Section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Paper Settings Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span>General Paper Settings</span>
                  </h4>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Paper Code</label>
                    <input
                      type="text"
                      value={paperCode}
                      onChange={(e) => setPaperCode(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs font-mono text-gray-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700">Exam Duration Limit</label>
                      <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {durationMinutes} Minutes
                      </span>
                    </div>
                    {/* Practical Duration Presets */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {[10, 15, 30, 45, 60, 90].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDurationMinutes(mins)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                            durationMinutes === mins
                              ? 'bg-amber-600 text-white font-bold'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Math.max(5, Number(e.target.value)))}
                      min={5}
                      placeholder="Custom minutes..."
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs font-semibold text-gray-900"
                    />
                  </div>

                  {/* Super Admin Instruction Reading Period */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700">Pre-Exam Instruction Time</label>
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {instructionDurationMinutes > 0 ? `${instructionDurationMinutes} Minutes` : 'None / Immediate'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {[0, 1, 2, 3, 5].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setInstructionDurationMinutes(mins)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                            instructionDurationMinutes === mins
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                          }`}
                        >
                          {mins === 0 ? '0m' : `${mins}m`}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={instructionDurationMinutes}
                      onChange={(e) => setInstructionDurationMinutes(Math.max(0, Number(e.target.value)))}
                      min={0}
                      placeholder="Instruction minutes (e.g. 2)..."
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs font-semibold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Passing Cutoff Marks</label>
                    <input
                      type="number"
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(Number(e.target.value))}
                      min={1}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900"
                    />
                  </div>

                  {/* Languages Selector */}
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center space-x-1">
                      <Languages className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Supported Languages ({supportedLanguages.length})</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {SUPPORTED_EXAM_LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => toggleLanguage(lang.code)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                            supportedLanguages.includes(lang.code)
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {lang.nativeLabel} ({lang.label})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Active Section Questions Detail */}
              <div className="lg:col-span-2 space-y-4">
                {currentSection && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                    {/* Section Header Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-gray-100">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Section Code</label>
                        <input
                          type="text"
                          value={currentSection.sectionCode}
                          onChange={(e) => handleUpdateSection(currentSection.id, { sectionCode: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Section Title</label>
                        <input
                          type="text"
                          value={currentSection.title}
                          onChange={(e) => handleUpdateSection(currentSection.id, { title: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Section Instructions / Description</label>
                        <textarea
                          rows={2}
                          value={currentSection.description || ''}
                          onChange={(e) => handleUpdateSection(currentSection.id, { description: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-xs"
                          placeholder="Instructions for candidate in this section..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Allocated Marks</label>
                        <input
                          type="number"
                          value={currentSection.totalMarks}
                          onChange={(e) => handleUpdateSection(currentSection.id, { totalMarks: Number(e.target.value) })}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700"
                        />
                      </div>
                    </div>

                    {/* Questions in this Section */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                          <span>Questions Assigned ({currentSection.questions.length})</span>
                        </h4>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowCreateQuestionModal(true)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                            title="Write a new question directly into this paper section (Method B)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Question</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowQuestionPickerModal(true)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                            title="Select existing questions from Question Bank repository (Method A)"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Pick from Question Banks</span>
                          </button>
                        </div>
                      </div>

                      {currentSection.questions.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-gray-700">No questions added to this section yet</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Add questions directly to this paper or import curated questions from the Question Bank repository:
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                            <button
                              type="button"
                              onClick={() => setShowCreateQuestionModal(true)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create Question Directly</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowQuestionPickerModal(true)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Pick from Question Banks</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {currentSection.questions.map((q, idx) => (
                            <div
                              key={q.id || idx}
                              className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start justify-between gap-3 hover:bg-white hover:border-indigo-200 transition"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-gray-700">
                                    {q.questionType.toUpperCase()}
                                  </span>
                                  <span className="text-xs font-medium text-indigo-600">
                                    +{q.marks} Marks
                                  </span>
                                  {q.bookMastery?.chapterNumber && (
                                    <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                                      Ch {q.bookMastery.chapterNumber}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-gray-900 line-clamp-2">
                                  {q.questionText}
                                </p>
                                {q.translations?.ur && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-1" dir="rtl" style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}>
                                    {q.translations.ur.questionText}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => handleRemoveQuestionFromSection(q.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition flex-shrink-0"
                                title="Remove from section"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SERIES 1 TO 5 ARCHITECTURE */}
          {activeBuilderTab === 'series' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start space-x-3">
                <Shuffle className="w-6 h-6 text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-blue-950">
                    Question Paper Series Management (Series 1 to 5)
                  </h3>
                  <p className="text-xs text-blue-900 mt-1 leading-relaxed">
                    Prevent collusive malpractice by configuring up to 5 concurrent question paper series. The system allocates series across test-takers so adjacent participants receive alternating question sequences.
                  </p>
                </div>
              </div>

              {/* Series Count Selector */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Active Question Paper Series Count</h4>
                    <p className="text-xs text-gray-500">Select how many distinct series to generate (1 to 5 series supported).</p>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl">
                    {[1, 2, 3, 4, 5].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleSetSeriesCount(cnt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          seriesCount === cnt
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {cnt} {cnt === 1 ? 'Series' : 'Series'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Series Subtabs */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex border-b border-gray-200 bg-gray-50 px-4 pt-2 gap-2 overflow-x-auto">
                  {seriesList.map((series) => (
                    <button
                      key={series.id}
                      type="button"
                      onClick={() => setActiveSeriesTab(series.id)}
                      className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer border-t border-x ${
                        activeSeriesTab === series.id
                          ? 'bg-white border-gray-200 text-blue-700 shadow-sm'
                          : 'border-transparent text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {series.seriesCode}
                    </button>
                  ))}
                </div>

                {/* Active Series Config */}
                {(() => {
                  const currSeries = seriesList.find(s => s.id === activeSeriesTab) || seriesList[0];
                  if (!currSeries) return null;

                  return (
                    <div className="p-6 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Series Designation</label>
                          <input
                            type="text"
                            value={currSeries.seriesCode}
                            onChange={(e) => handleUpdateSeries(currSeries.id, { seriesCode: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Series Description</label>
                          <input
                            type="text"
                            value={currSeries.seriesTitle || ''}
                            onChange={(e) => handleUpdateSeries(currSeries.id, { seriesTitle: e.target.value })}
                            placeholder="e.g. Standard Shuffled Set"
                            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">Sequence & Randomization Strategy</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            {
                              id: 'shuffled_questions',
                              label: 'Shuffled Questions',
                              desc: 'Questions permuted pseudorandomly; preserves section breakdown'
                            },
                            {
                              id: 'shuffled_options',
                              label: 'Shuffled MCQ Options',
                              desc: 'Options order scrambled differently per question'
                            },
                            {
                              id: 'custom_questions',
                              label: 'Direct Sequence',
                              desc: 'Original paper order as configured in the Section builder'
                            }
                          ].map(mode => (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => handleUpdateSeries(currSeries.id, { orderMode: mode.id as any })}
                              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                (currSeries.orderMode || 'shuffled_questions') === mode.id
                                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                                  : 'border-gray-200 bg-gray-50 hover:bg-white text-gray-700'
                              }`}
                            >
                              <div className="font-bold text-xs">{mode.label}</div>
                              <div className="text-[11px] text-gray-500 mt-1 leading-snug">{mode.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Paper-Wide Shuffling Controls */}
                      <div className="pt-4 border-t border-gray-200 space-y-2">
                        <div className="text-xs font-bold text-gray-800">Series Shuffling & Anti-Malpractice Controls</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-100/70 transition cursor-pointer">
                            <input
                              type="checkbox"
                              checked={shuffleQuestions}
                              onChange={(e) => setShuffleQuestions(e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-gray-900 block">Shuffle Questions Across Series</span>
                              <span className="text-[11px] text-gray-500 leading-tight block mt-0.5">
                                Permute question order per series while preserving mark weightage and section boundaries.
                              </span>
                            </div>
                          </label>
                          <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-100/70 transition cursor-pointer">
                            <input
                              type="checkbox"
                              checked={shuffleOptions}
                              onChange={(e) => setShuffleOptions(e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-gray-900 block">Shuffle Options for MCQ Questions</span>
                              <span className="text-[11px] text-gray-500 leading-tight block mt-0.5">
                                Scramble answer choices (A, B, C, D) per participant while preserving correct answer mapping.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
                        <div className="font-bold text-gray-800">Series Overview for Candidates:</div>
                        <div>• Contains all {totalQuestionsCount} questions across {sections.length} sections ({totalCalculatedMarks} total marks).</div>
                        <div>• Supports questions added from Question Bank and questions written directly in the builder.</div>
                        <div>• Assigned automatically on exam start. Answer keys are strictly preserved and never exposed.</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB: SCHEDULE & STRICT EXAM WINDOW */}
          {activeBuilderTab === 'schedule' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start space-x-3">
                <Calendar className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-emerald-950">
                    Scheduled Examination & Strict Time Window
                  </h3>
                  <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                    Set explicit opening and closing times. The system enforces strict server-synchronized boundaries: no candidate can begin before opening time, and late starts are blocked after closing time.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Exam Date */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Exam Date</span>
                    </label>
                    <input
                      type="date"
                      value={examScheduleDate}
                      onChange={(e) => setExamScheduleDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>

                  {/* Opening Time */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Opening Time (IST)</span>
                    </label>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800"
                    />
                  </div>

                  {/* Closing Time */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-red-600" />
                      <span>Closing Time (IST)</span>
                    </label>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-red-800"
                    />
                  </div>

                  {/* Time Zone */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Time Zone</label>
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC (Universal)</option>
                    </select>
                  </div>
                </div>

                {/* One Attempt Rule */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-indigo-600" />
                      <span>Strict Single Attempt Enforcement</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      1 Registered Candidate = 1 Valid Exam Attempt. Re-registration or restarting an in-progress/submitted test is blocked.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!allowMultipleAttempts}
                      onChange={(e) => setAllowMultipleAttempts(!e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Schedule Lifecycle Timeline Explanation */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 text-xs">
                  <div className="font-bold text-gray-900 uppercase tracking-wide">Automated Schedule Stages:</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="font-bold text-amber-900">1. Before Opening</div>
                      <div className="text-amber-800 text-[11px] mt-1">
                        Opens on {examScheduleDate} at {openingTime} IST. Candidate can view study material & rules, but cannot start.
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="font-bold text-emerald-900">2. Active Window ({openingTime}–{closingTime})</div>
                      <div className="text-emerald-800 text-[11px] mt-1">
                        "Start Examination" unlocks for registered candidates. Timer counts down for {durationMinutes} minutes.
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="font-bold text-red-900">3. Strict Closing (After {closingTime})</div>
                      <div className="text-red-800 text-[11px] mt-1">
                        Window closes strictly. Unattempted or late candidates cannot start.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANTI-CHEATING & INTEGRITY RULES */}
          {activeBuilderTab === 'integrity' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="w-6 h-6 text-indigo-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-indigo-950">
                      FET India High-Stakes Exam Integrity Engine
                    </h3>
                    <p className="text-xs text-indigo-900 mt-1 leading-relaxed">
                      Configure automated proctoring rules, window focus monitoring, and anti-leakage controls for candidate test sessions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 shadow-sm">
                {/* 1. Fullscreen Enforcement */}
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Enforce Fullscreen Mode</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Candidates must enter fullscreen mode to begin and stay in fullscreen throughout the exam.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={integrityConfig.enforceFullscreen}
                    onChange={(e) => setIntegrityConfig({ ...integrityConfig, enforceFullscreen: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>

                {/* 2. Tab Switch Tracking */}
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Window Blur & Tab Switch Detector</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tracks when candidate navigates to other browser tabs or applications and increments violation tally.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={integrityConfig.trackTabSwitch}
                    onChange={(e) => setIntegrityConfig({ ...integrityConfig, trackTabSwitch: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>

                {/* 3. Max Violation Limit */}
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Maximum Violation Warning Threshold</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Number of tab-switch violations permitted before candidate attempt is automatically locked and flagged.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={integrityConfig.maxTabSwitchViolations}
                      onChange={(e) => setIntegrityConfig({ ...integrityConfig, maxTabSwitchViolations: Number(e.target.value) })}
                      min={1}
                      max={10}
                      className="w-16 bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-sm font-bold text-center"
                    />
                    <span className="text-xs text-gray-500 font-medium">Violations</span>
                  </div>
                </div>

                {/* 4. Disable Copy / Paste */}
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Disable Copy, Cut & Paste</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Prevents question text extraction and clipboard pasting into descriptive essay inputs.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={integrityConfig.preventCopyPaste}
                    onChange={(e) => setIntegrityConfig({ ...integrityConfig, preventCopyPaste: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>

                {/* 5. Disable Right-Click Context Menu */}
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Block Right-Click Context Menu</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Disables right-click context menus during examination execution.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={integrityConfig.preventContextMenu}
                    onChange={(e) => setIntegrityConfig({ ...integrityConfig, preventContextMenu: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>

                {/* 6. Auto Submit */}
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Strict Automatic Submission on Time Expiry</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Automatically locks responses and submits exam attempt when countdown reaches 00:00:00.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={integrityConfig.autoSubmitOnTimeExpiry}
                    onChange={(e) => setIntegrityConfig({ ...integrityConfig, autoSubmitOnTimeExpiry: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* SUPER ADMIN EXAMINATION POLICIES CARD */}
              <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center space-x-2 border-b border-indigo-100 pb-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-700" />
                  <div>
                    <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-wider">
                      Pre-Exam Instructions & Answer Review Policy (Super Admin Controlled)
                    </h3>
                    <p className="text-xs text-indigo-800 mt-0.5">
                      Configure authoritative candidate answering constraints and pre-exam instruction screen timing.
                    </p>
                  </div>
                </div>

                {/* 1. Instruction Screen Duration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Instruction Screen Display Duration</h4>
                      <p className="text-[11px] text-gray-500 leading-snug">
                        Mandatory reading time presented to candidate before the examination answering period begins.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold font-mono border border-indigo-200">
                      {instructionDurationMinutes > 0 ? `${instructionDurationMinutes} Minutes` : 'Immediate Start'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { val: 0, label: '0m (Immediate)' },
                      { val: 1, label: '1 Minute' },
                      { val: 2, label: '2 Minutes' },
                      { val: 3, label: '3 Minutes' },
                      { val: 5, label: '5 Minutes' }
                    ].map(preset => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setInstructionDurationMinutes(preset.val)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          instructionDurationMinutes === preset.val
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Allow Answer Changes During Examination (Answer Locking) */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-gray-900">Allow Answer Changes During Examination</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        allowAnswerChanges ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {allowAnswerChanges ? 'ON (Editable)' : 'OFF (Answer Locked)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                      <strong>ON:</strong> Candidate can review and modify already answered questions during the active test.<br />
                      <strong>OFF:</strong> Once an answer is selected and saved, that answer becomes locked and cannot be changed.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={allowAnswerChanges}
                      onChange={(e) => setAllowAnswerChanges(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* 3. Allow Review of Answered Questions During Examination */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-gray-900">Allow Review of Answered Questions During Examination</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        allowReviewQuestions ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {allowReviewQuestions ? 'ON (Reopen Allowed)' : 'OFF (Reopen Disabled)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                      <strong>ON:</strong> Candidate may navigate back to previously answered questions.<br />
                      <strong>OFF:</strong> Once candidate proceeds past/locks an answer, that question cannot be reopened for viewing.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={allowReviewQuestions}
                      onChange={(e) => setAllowReviewQuestions(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE PAPER PREVIEW & PRINT */}
          {activeBuilderTab === 'preview' && (
            <div className="max-w-4xl mx-auto bg-white border border-gray-300 rounded-2xl p-8 shadow-sm space-y-6 font-serif">
              {/* Trust Letterhead */}
              <div className="text-center pb-6 border-b-2 border-gray-900">
                <p className="text-xs font-sans uppercase tracking-widest text-gray-600 font-bold">
                  Fatimyah Educational Trust India
                </p>
                <h2 className="text-2xl font-bold text-gray-900 mt-1 uppercase font-serif">
                  {paperTitle}
                </h2>
                <div className="flex items-center justify-center space-x-4 text-xs font-sans text-gray-600 mt-2">
                  <span>Paper Code: <strong>{paperCode}</strong></span>
                  <span>•</span>
                  <span>Time Allowed: <strong>{durationMinutes} Mins</strong></span>
                  <span>•</span>
                  <span>Maximum Marks: <strong>{totalCalculatedMarks}</strong></span>
                </div>
              </div>

              {/* General Instructions */}
              <div className="p-4 bg-gray-50 rounded-xl text-xs font-sans space-y-1 text-gray-700">
                <p className="font-bold uppercase text-gray-900">General Instructions:</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>This question paper contains {sections.length} sections and {totalQuestionsCount} questions in total.</li>
                  <li>All questions are compulsory unless specified otherwise.</li>
                  <li>Verify all responses before final electronic submission.</li>
                </ol>
              </div>

              {/* Sections Breakdown */}
              {sections.map((sec) => (
                <div key={sec.id} className="space-y-4 pt-4">
                  <div className="border-b border-gray-400 pb-1 flex items-center justify-between">
                    <h3 className="text-base font-bold uppercase text-gray-900 font-sans">
                      {sec.sectionCode}: {sec.title}
                    </h3>
                    <span className="text-xs font-sans font-bold text-gray-700">
                      [{sec.totalMarks} Marks]
                    </span>
                  </div>

                  <div className="space-y-4 font-sans">
                    {sec.questions.map((q, qIdx) => (
                      <div key={q.id || qIdx} className="space-y-1.5 text-sm">
                        <div className="flex items-start justify-between">
                          <p className="font-semibold text-gray-900 flex-1">
                            <span className="mr-1.5 font-bold">Q{qIdx + 1}.</span>
                            {q.questionText}
                          </p>
                          <span className="text-xs font-bold text-gray-500 ml-2">
                            ({q.marks} Marks)
                          </span>
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6 pt-1 text-xs text-gray-800">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx}>
                                <span className="font-bold mr-1.5">({String.fromCharCode(97 + oIdx)})</span>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QUESTION PICKER MODAL (METHOD A) */}
      {showQuestionPickerModal && (
        <QuestionPickerSubModal
          onClose={() => setShowQuestionPickerModal(false)}
          onAdd={handleAddQuestionsFromBank}
        />
      )}

      {/* CREATE QUESTION DIRECTLY MODAL (METHOD B) */}
      {showCreateQuestionModal && (
        <CreateQuestionDirectSubModal
          onClose={() => setShowCreateQuestionModal(false)}
          onAdd={handleDirectCreateQuestion}
          supportedLanguages={supportedLanguages}
          defaultLanguage={defaultLanguage}
          availableBanks={INITIAL_QUESTION_BANKS}
          defaultBookTitle={competition.bookDetails?.bookTitle || competition.title}
        />
      )}
    </div>
  );
};

// ==========================================
// Sub-Modal: Question Picker from Banks
// ==========================================
interface QuestionPickerSubModalProps {
  onClose: () => void;
  onAdd: (questions: ExamQuestion[]) => void;
}

const QuestionPickerSubModal: React.FC<QuestionPickerSubModalProps> = ({
  onClose,
  onAdd
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string>(INITIAL_QUESTION_BANKS[0]?.id || '');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const currentBank = INITIAL_QUESTION_BANKS.find(b => b.id === selectedBankId) || INITIAL_QUESTION_BANKS[0];

  const handleTogglePick = (qId: string) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const handleConfirmAdd = () => {
    const picked = (currentBank.questions || []).filter(q => selectedQuestionIds.includes(q.id));
    onAdd(picked);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh] animate-scaleIn">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900">
            Select Questions from Bank
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-3 border-b border-gray-100">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Select Question Bank Repository</label>
          <select
            value={selectedBankId}
            onChange={(e) => {
              setSelectedBankId(e.target.value);
              setSelectedQuestionIds([]);
            }}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
          >
            {INITIAL_QUESTION_BANKS.map(b => (
              <option key={b.id} value={b.id}>
                {b.title} ({b.questions?.length || 0} Questions)
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {(currentBank.questions || []).map((q, idx) => {
            const isChecked = selectedQuestionIds.includes(q.id);
            return (
              <div
                key={q.id}
                onClick={() => handleTogglePick(q.id)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-start space-x-3 ${
                  isChecked ? 'bg-indigo-50/70 border-indigo-400' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-gray-700">{q.questionType.toUpperCase()}</span>
                    <span>•</span>
                    <span className="text-indigo-600 font-bold">+{q.marks} Marks</span>
                    {q.bookMastery?.chapterNumber && (
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px]">
                        Ch {q.bookMastery.chapterNumber}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">{q.questionText}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-semibold">
            {selectedQuestionIds.length} Selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAdd}
              disabled={selectedQuestionIds.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold transition"
            >
              Add Selected Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Sub-Modal: Write Question Directly (Method B)
// ==========================================
interface CreateQuestionDirectSubModalProps {
  onClose: () => void;
  onAdd: (newQuestion: ExamQuestion, alsoSaveToBankId?: string) => void;
  supportedLanguages: ExamLanguage[];
  defaultLanguage: ExamLanguage;
  availableBanks: QuestionBank[];
  defaultBookTitle?: string;
}

const CreateQuestionDirectSubModal: React.FC<CreateQuestionDirectSubModalProps> = ({
  onClose,
  onAdd,
  defaultLanguage,
  availableBanks,
  defaultBookTitle
}) => {
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [marks, setMarks] = useState<number>(4);
  const [negativeMarks, setNegativeMarks] = useState<number>(0);
  const [difficulty] = useState<QuestionDifficulty>('medium');
  const [explanation, setExplanation] = useState('');
  const [urduTranslationText, setUrduTranslationText] = useState('');
  const [hindiTranslationText, setHindiTranslationText] = useState('');
  const [chapterNumber, setChapterNumber] = useState<string>('');
  const [topicTag, setTopicTag] = useState<string>('');
  const [alsoSaveToBank, setAlsoSaveToBank] = useState<boolean>(false);
  const [selectedBankId, setSelectedBankId] = useState<string>(availableBanks[0]?.id || '');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setErrorNotice('Question text is required.');
      return;
    }

    let finalOptions: string[] | undefined = undefined;
    let finalCorrectIndex: number | undefined = undefined;

    if (questionType === 'mcq') {
      const validOptions = options.map(o => o.trim());
      if (validOptions.filter(o => o.length > 0).length < 2) {
        setErrorNotice('Multiple choice questions require at least 2 non-empty options.');
        return;
      }
      finalOptions = validOptions;
      finalCorrectIndex = correctOptionIndex;
    } else if (questionType === 'true_false') {
      finalOptions = ['True', 'False'];
      finalCorrectIndex = correctOptionIndex === 1 ? 1 : 0;
    }

    const translations: Partial<Record<ExamLanguage, any>> = {};
    if (urduTranslationText.trim()) {
      translations['ur'] = {
        language: 'ur',
        questionText: urduTranslationText.trim(),
        direction: 'rtl'
      };
    }
    if (hindiTranslationText.trim()) {
      translations['hi'] = {
        language: 'hi',
        questionText: hindiTranslationText.trim(),
        direction: 'ltr'
      };
    }

    const newQuestion: ExamQuestion = {
      id: `q-dir-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      questionText: questionText.trim(),
      questionType,
      primaryLanguage: defaultLanguage,
      options: finalOptions,
      correctOptionIndex: finalCorrectIndex,
      marks: Math.max(1, Number(marks) || 4),
      negativeMarks: Math.max(0, Number(negativeMarks) || 0),
      difficulty,
      explanation: explanation.trim() || undefined,
      translations: Object.keys(translations).length > 0 ? translations : undefined,
      bookMastery: chapterNumber ? {
        bookTitle: defaultBookTitle || 'Prescribed Reading Material',
        chapterNumber: Number(chapterNumber),
        chapterTitle: topicTag || `Chapter ${chapterNumber}`,
        topicTag: topicTag || undefined
      } : undefined,
      createdAt: new Date().toISOString()
    };

    onAdd(newQuestion, alsoSaveToBank ? selectedBankId : undefined);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Plus className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Write Question Directly (Method B)
              </h3>
              <p className="text-xs text-gray-500">
                Author and attach directly to current section without needing a Question Bank first.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorNotice && (
          <div className="my-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between">
            <span>{errorNotice}</span>
            <button onClick={() => setErrorNotice(null)} className="text-rose-600 hover:text-rose-900 text-xs">Dismiss</button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Question Type & Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Question Type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
              >
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="true_false">True / False</option>
                <option value="descriptive">Descriptive / Essay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Marks (+)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Negative Marks (-)</label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.25}
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-rose-700"
              />
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Question Text ({defaultLanguage.toUpperCase()}) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter comprehensive question formulation here..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:bg-white"
              required
            />
          </div>

          {/* Answer Options for MCQ */}
          {questionType === 'mcq' && (
            <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800">
                  Multiple Choice Options & Correct Answer
                </label>
                <span className="text-[11px] text-gray-500">Select the correct radio option</span>
              </div>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="direct_correct_option"
                        checked={correctOptionIndex === idx}
                        onChange={() => setCorrectOptionIndex(idx)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="w-5 text-center text-xs font-bold text-gray-600">
                        ({String.fromCharCode(65 + idx)})
                      </span>
                    </label>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)} text...`}
                      className={`flex-1 bg-white border rounded-xl px-3 py-1.5 text-xs text-gray-900 ${
                        correctOptionIndex === idx ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-gray-300'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* True / False Options */}
          {questionType === 'true_false' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-gray-800">Correct Answer Option</label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-gray-800">
                  <input
                    type="radio"
                    name="direct_tf_option"
                    checked={correctOptionIndex === 0}
                    onChange={() => setCorrectOptionIndex(0)}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <span>True</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-gray-800">
                  <input
                    type="radio"
                    name="direct_tf_option"
                    checked={correctOptionIndex === 1}
                    onChange={() => setCorrectOptionIndex(1)}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Explanation / Answer Key Justification (Optional)
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Educational explanation shown after evaluation..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
            />
          </div>

          {/* Multilingual Translations (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Urdu Translation (اردو) - Optional
              </label>
              <textarea
                rows={2}
                dir="rtl"
                value={urduTranslationText}
                onChange={(e) => setUrduTranslationText(e.target.value)}
                placeholder="سوال یہاں درج کریں..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-xs text-gray-900"
                style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Hindi Translation (हिन्दी) - Optional
              </label>
              <textarea
                rows={2}
                value={hindiTranslationText}
                onChange={(e) => setHindiTranslationText(e.target.value)}
                placeholder="प्रश्न यहाँ दर्ज करें..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-xs text-gray-900"
              />
            </div>
          </div>

          {/* Book Mastery Reference (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Book Chapter Number</label>
              <input
                type="number"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(e.target.value)}
                placeholder="e.g. 3"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Topic / Section Tag</label>
              <input
                type="text"
                value={topicTag}
                onChange={(e) => setTopicTag(e.target.value)}
                placeholder="e.g. Rocket Propulsion / Values"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Question Bank Reuse Checkbox */}
          <div className="pt-3 border-t border-gray-100 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={alsoSaveToBank}
                onChange={(e) => setAlsoSaveToBank(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded mt-0.5"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-amber-950 block">
                  Also save this question into the central Question Bank repository for future reuse
                </span>
                <span className="text-[11px] text-amber-800 block mt-0.5">
                  Stores this item in the repository so other papers can reuse it later. Does not create a duplicate question bank.
                </span>
              </div>
            </label>

            {alsoSaveToBank && (
              <div className="mt-3 pt-2 border-t border-amber-200">
                <label className="block text-xs font-semibold text-amber-900 mb-1">Target Question Bank Repository</label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
                >
                  {availableBanks.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.questions?.length || 0} Questions)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Add Question to Paper</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
