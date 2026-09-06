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
  CheckCircle2
} from 'lucide-react';
import { 
  Competition, 
  ExamSection, 
  ExamQuestion, 
  ExamIntegrityConfig, 
  ExamLanguage, 
  QuestionBank 
} from '../../../types';
import { INITIAL_QUESTION_BANKS } from '../../../data/initialQuestionBanks';

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
  const [activeBuilderTab, setActiveBuilderTab] = useState<'sections' | 'integrity' | 'preview'>('sections');
  const [showQuestionPickerModal, setShowQuestionPickerModal] = useState<boolean>(false);
  const [selectedBankForPick, setSelectedBankForPick] = useState<string>(INITIAL_QUESTION_BANKS[0]?.id || '');

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
        allowReviewBeforeSubmit: true,
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
        <div className="bg-white p-4 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-gray-200 flex items-center space-x-4 bg-white">
          <button
            onClick={() => setActiveBuilderTab('sections')}
            className={`py-3 text-sm font-bold border-b-2 flex items-center space-x-2 transition ${
              activeBuilderTab === 'sections'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Sections & Questions Builder</span>
          </button>
          <button
            onClick={() => setActiveBuilderTab('integrity')}
            className={`py-3 text-sm font-bold border-b-2 flex items-center space-x-2 transition ${
              activeBuilderTab === 'integrity'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Anti-Cheating & Integrity Rules</span>
          </button>
          <button
            onClick={() => setActiveBuilderTab('preview')}
            className={`py-3 text-sm font-bold border-b-2 flex items-center space-x-2 transition ${
              activeBuilderTab === 'preview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Live Paper Preview & Print</span>
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
                    <label className="block text-xs text-gray-600 mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      min={10}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Passing Cutoff Marks</label>
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
                      <span>Supported Languages</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'en', label: 'English' },
                        { id: 'ur', label: 'اردو (Urdu)' },
                        { id: 'hi', label: 'हिंदी (Hindi)' },
                        { id: 'ar', label: 'العربية (Arabic)' },
                        { id: 'fa', label: 'فارسی (Persian)' }
                      ].map(lang => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => toggleLanguage(lang.id as ExamLanguage)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                            supportedLanguages.includes(lang.id as ExamLanguage)
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {lang.label}
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
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                          <span>Questions Assigned ({currentSection.questions.length})</span>
                        </h4>
                        <button
                          onClick={() => setShowQuestionPickerModal(true)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pick from Question Banks</span>
                        </button>
                      </div>

                      {currentSection.questions.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-gray-700">No questions added to this section yet</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Click "Pick from Question Banks" above to import curated questions.
                          </p>
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

      {/* QUESTION PICKER MODAL */}
      {showQuestionPickerModal && (
        <QuestionPickerSubModal
          onClose={() => setShowQuestionPickerModal(false)}
          onAdd={handleAddQuestionsFromBank}
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
