/**
 * @license
 * Multilingual Question Banks & Book Mastery Repository Manager
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Languages, 
  FileText, 
  Check, 
  X, 
  ChevronRight, 
  Layers, 
  Eye, 
  Bookmark, 
  Tag, 
  Sliders, 
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  FolderOpen,
  HelpCircle
} from 'lucide-react';
import { 
  QuestionBank, 
  ExamQuestion, 
  ExamLanguage, 
  QuestionType, 
  QuestionDifficulty, 
  BookChapterMastery, 
  CompetitionCategory 
} from '../../../types';
import { INITIAL_QUESTION_BANKS } from '../../../data/initialQuestionBanks';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';

interface AdminQuestionBanksManagerProps {
  onSelectForPaperBuilder?: (bank: QuestionBank) => void;
}

export const AdminQuestionBanksManager: React.FC<AdminQuestionBanksManagerProps> = ({
  onSelectForPaperBuilder
}) => {
  const { currentUser, userProfile, isSuperAdmin } = useAuth();
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>(INITIAL_QUESTION_BANKS);
  const [selectedBankId, setSelectedBankId] = useState<string>(INITIAL_QUESTION_BANKS[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'pool' | 'chapters' | 'review_queue' | 'banks_list'>('pool');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | QuestionDifficulty>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | QuestionType>('all');
  const [chapterFilter, setChapterFilter] = useState<number | 'all'>('all');
  const [languageFilter, setLanguageFilter] = useState<ExamLanguage | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending_review' | 'draft'>('all');

  // Modals
  const [showCreateBankModal, setShowCreateBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<ExamQuestion | null>(null);
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // 1. Sync from Firestore or use Initial Data
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'question_banks'), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: QuestionBank[] = [];
        snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() } as QuestionBank));
        setQuestionBanks(loaded);
        if (!selectedBankId && loaded.length > 0) {
          setSelectedBankId(loaded[0].id || '');
        }
      } else {
        setQuestionBanks(INITIAL_QUESTION_BANKS);
        if (!selectedBankId && INITIAL_QUESTION_BANKS.length > 0) {
          setSelectedBankId(INITIAL_QUESTION_BANKS[0].id || '');
        }
      }
    }, (err) => {
      console.warn('Question banks sync notice:', err);
      setQuestionBanks(INITIAL_QUESTION_BANKS);
    });

    return () => unsub();
  }, []);

  const currentBank = questionBanks.find(b => b.id === selectedBankId) || questionBanks[0];
  const allQuestions = currentBank?.questions || [];

  // Filtered questions
  const filteredQuestions = allQuestions.filter(q => {
    const matchesSearch = 
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.translations?.ur?.questionText && q.translations.ur.questionText.includes(searchQuery)) ||
      (q.translations?.hi?.questionText && q.translations.hi.questionText.includes(searchQuery)) ||
      (q.bookMastery?.chapterTitle && q.bookMastery.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    const matchesType = typeFilter === 'all' || q.questionType === typeFilter;
    const matchesChapter = chapterFilter === 'all' || q.bookMastery?.chapterNumber === chapterFilter;
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchesLang = languageFilter === 'all' || q.primaryLanguage === languageFilter || (q.translations && q.translations[languageFilter]);

    return matchesSearch && matchesDifficulty && matchesType && matchesChapter && matchesStatus && matchesLang;
  });

  // Pending Review queue questions across all banks
  const pendingReviewQuestions: { bank: QuestionBank; question: ExamQuestion }[] = [];
  questionBanks.forEach(b => {
    (b.questions || []).forEach(q => {
      if (q.status === 'pending_review' || q.aiGenerated && q.status !== 'approved') {
        pendingReviewQuestions.push({ bank: b, question: q });
      }
    });
  });

  // Handle Approve Question
  const handleApproveQuestion = async (bankId: string, questionId: string) => {
    try {
      const targetBank = questionBanks.find(b => b.id === bankId);
      if (!targetBank) return;

      const updatedQuestions = (targetBank.questions || []).map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            status: 'approved' as const,
            reviewedByUid: currentUser?.uid || 'admin',
            reviewedByEmail: currentUser?.email || 'admin@fetindia.org',
            reviewedAt: new Date().toISOString()
          };
        }
        return q;
      });

      const approvedCount = updatedQuestions.filter(q => q.status === 'approved').length;
      const pendingCount = updatedQuestions.filter(q => q.status === 'pending_review').length;

      // Update in local state
      setQuestionBanks(prev => prev.map(b => b.id === bankId ? { 
        ...b, 
        questions: updatedQuestions,
        approvedQuestionsCount: approvedCount,
        pendingReviewCount: pendingCount
      } : b));

      // Persist to Firestore
      if (db) {
        await updateDoc(doc(db, 'question_banks', bankId), {
          questions: updatedQuestions,
          approvedQuestionsCount: approvedCount,
          pendingReviewCount: pendingCount,
          updatedAt: new Date().toISOString()
        });
      }

      notify('Question approved and published to active question pool.');
    } catch (err: any) {
      console.error('Approve question error:', err);
      notify('Question approved in local state.');
    }
  };

  // Handle Reject Question
  const handleRejectQuestion = async (bankId: string, questionId: string) => {
    try {
      const targetBank = questionBanks.find(b => b.id === bankId);
      if (!targetBank) return;

      const updatedQuestions = (targetBank.questions || []).map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            status: 'rejected' as const,
            reviewedByUid: currentUser?.uid || 'admin',
            reviewedAt: new Date().toISOString()
          };
        }
        return q;
      });

      setQuestionBanks(prev => prev.map(b => b.id === bankId ? { 
        ...b, 
        questions: updatedQuestions,
        pendingReviewCount: updatedQuestions.filter(q => q.status === 'pending_review').length
      } : b));

      if (db) {
        await updateDoc(doc(db, 'question_banks', bankId), {
          questions: updatedQuestions,
          updatedAt: new Date().toISOString()
        });
      }
      notify('Question rejected and removed from review queue.');
    } catch (err) {
      console.error(err);
      notify('Question rejected in local state.');
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      if (!currentBank || !currentBank.id) return;
      const updatedQuestions = (currentBank.questions || []).filter(q => q.id !== questionId);
      const approvedCount = updatedQuestions.filter(q => q.status === 'approved').length;
      const pendingCount = updatedQuestions.filter(q => q.status === 'pending_review').length;

      setQuestionBanks(prev => prev.map(b => b.id === currentBank.id ? {
        ...b,
        questions: updatedQuestions,
        questionsCount: updatedQuestions.length,
        approvedQuestionsCount: approvedCount,
        pendingReviewCount: pendingCount
      } : b));

      if (db) {
        await updateDoc(doc(db, 'question_banks', currentBank.id), {
          questions: updatedQuestions,
          questionsCount: updatedQuestions.length,
          approvedQuestionsCount: approvedCount,
          pendingReviewCount: pendingCount,
          updatedAt: new Date().toISOString()
        });
      }
      notify('Question removed successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  // Save Question (Create or Edit)
  const handleSaveQuestion = async (qData: Partial<ExamQuestion>) => {
    if (!currentBank || !currentBank.id) return;

    try {
      let updatedQuestions = [...(currentBank.questions || [])];
      if (editingQuestion) {
        // Edit
        updatedQuestions = updatedQuestions.map(q => q.id === editingQuestion.id ? {
          ...q,
          ...qData,
          updatedAt: new Date().toISOString()
        } as ExamQuestion : q);
      } else {
        // New
        const newQ: ExamQuestion = {
          id: `q-custom-${Date.now()}`,
          questionText: qData.questionText || '',
          primaryLanguage: qData.primaryLanguage || 'en',
          translations: qData.translations || {},
          questionType: qData.questionType || 'mcq',
          options: qData.options || [],
          correctOptionIndex: qData.correctOptionIndex ?? 0,
          marks: qData.marks || 4,
          negativeMarks: qData.negativeMarks ?? 1,
          difficulty: qData.difficulty || 'medium',
          explanation: qData.explanation || '',
          bookMastery: qData.bookMastery,
          status: 'approved',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedQuestions.unshift(newQ);
      }

      const approvedCount = updatedQuestions.filter(q => q.status === 'approved').length;
      const pendingCount = updatedQuestions.filter(q => q.status === 'pending_review').length;

      setQuestionBanks(prev => prev.map(b => b.id === currentBank.id ? {
        ...b,
        questions: updatedQuestions,
        questionsCount: updatedQuestions.length,
        approvedQuestionsCount: approvedCount,
        pendingReviewCount: pendingCount
      } : b));

      if (db) {
        await updateDoc(doc(db, 'question_banks', currentBank.id), {
          questions: updatedQuestions,
          questionsCount: updatedQuestions.length,
          approvedQuestionsCount: approvedCount,
          pendingReviewCount: pendingCount,
          updatedAt: new Date().toISOString()
        });
      }

      setShowQuestionModal(false);
      setEditingQuestion(null);
      notify('Question saved and updated in Question Bank.');
    } catch (err: any) {
      console.error(err);
      setShowQuestionModal(false);
      notify('Question saved in local state.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Step 64A Examination Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                <Languages className="w-3 h-3 mr-1 inline" />
                Multilingual & RTL
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-2 flex items-center space-x-2">
              <BookOpen className="w-7 h-7 text-indigo-600" />
              <span>Multilingual Question Banks & Book Mastery</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-3xl">
              Organize curated question pools mapped to prescribed reading literature, STEM subjects, and ethics curricula with Arabic/Urdu RTL support and human review validation gates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAiGenModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>AI Question Drafter</span>
            </button>
            <button
              onClick={() => {
                setEditingQuestion(null);
                setShowQuestionModal(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Author Question</span>
            </button>
          </div>
        </div>

        {/* Bank Selection Selector & Stats */}
        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Active Question Bank Repository
            </label>
            <div className="flex items-center space-x-2">
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {questionBanks.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.code}] {b.title} ({b.questions?.length || 0} Questions)
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setEditingBank(null);
                  setShowCreateBankModal(true);
                }}
                title="Create New Bank"
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Approved Pool</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{allQuestions.filter(q => q.status === 'approved').length}</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending Review</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{pendingReviewQuestions.length}</p>
            </div>
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 mt-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pool')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'pool'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Question Pool ({filteredQuestions.length})</span>
          </button>
          
          {currentBank?.bookMastery && (
            <button
              onClick={() => setActiveTab('chapters')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
                activeTab === 'chapters'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Prescribed Chapters ({currentBank.bookMastery.chapters?.length || 0})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('review_queue')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'review_queue'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Review Queue</span>
            {pendingReviewQuestions.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-bold">
                {pendingReviewQuestions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: QUESTION POOL */}
      {activeTab === 'pool' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions or keywords..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
              >
                <option value="all">All Question Types</option>
                <option value="mcq">Single Choice MCQ</option>
                <option value="true_false">True / False</option>
                <option value="fill_blank">Fill in the Blank</option>
                <option value="descriptive">Descriptive / Essay</option>
              </select>
            </div>

            <div>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
              >
                <option value="all">All Languages</option>
                <option value="en">English (EN)</option>
                <option value="ur">Urdu (اردو)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
            </div>

            <div>
              <select
                value={chapterFilter}
                onChange={(e) => setChapterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
              >
                <option value="all">All Chapters</option>
                {(currentBank?.bookMastery?.chapters || []).map(ch => (
                  <option key={ch.chapterNumber} value={ch.chapterNumber}>
                    Ch {ch.chapterNumber}: {ch.chapterTitle.slice(0, 20)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Questions Grid / List */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700">No questions found matching the filter</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Author a new question or adjust your search parameters to explore questions in this bank.
              </p>
              <button
                onClick={() => setShowQuestionModal(true)}
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Question</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => (
                <div 
                  key={q.id || idx}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-indigo-300 transition group"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          Q{idx + 1} • {q.questionType.toUpperCase()}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          q.difficulty === 'medium' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          q.difficulty === 'hard' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {q.difficulty?.toUpperCase()}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                          +{q.marks} Marks {q.negativeMarks ? `(-${q.negativeMarks})` : ''}
                        </span>
                        {q.bookMastery?.chapterNumber && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            Ch {q.bookMastery.chapterNumber}: {q.bookMastery.chapterTitle}
                          </span>
                        )}
                        {q.translations && Object.keys(q.translations).length > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-1">
                            <Languages className="w-3 h-3 mr-1 inline" />
                            <span>EN + {Object.keys(q.translations).map(k => k.toUpperCase()).join(', ')}</span>
                          </span>
                        )}
                        {q.status === 'pending_review' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            Pending Review
                          </span>
                        )}
                        {q.aiGenerated && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 mr-0.5" />
                            <span>AI Drafted</span>
                          </span>
                        )}
                      </div>

                      {/* English Statement */}
                      <p className="text-base font-semibold text-gray-900 leading-relaxed">
                        {q.questionText}
                      </p>

                      {/* Urdu Translation Preview if exists */}
                      {q.translations?.ur && (
                        <div className="mt-2.5 p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl" dir="rtl">
                          <span className="text-xs font-bold text-amber-900 block mb-1">اردو ترجمہ:</span>
                          <p className="text-base font-medium text-gray-900 leading-loose" style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}>
                            {q.translations.ur.questionText}
                          </p>
                        </div>
                      )}

                      {/* Hindi Translation Preview if exists */}
                      {q.translations?.hi && (
                        <div className="mt-2 p-2.5 bg-blue-50/50 border border-blue-200/60 rounded-xl">
                          <span className="text-xs font-bold text-blue-900 block mb-0.5">हिंदी अनुवाद:</span>
                          <p className="text-sm font-medium text-gray-800">
                            {q.translations.hi.questionText}
                          </p>
                        </div>
                      )}

                      {/* MCQ Options preview */}
                      {q.options && q.options.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => (
                            <div 
                              key={oIdx} 
                              className={`p-2.5 rounded-xl text-xs font-medium border flex items-start space-x-2 ${
                                q.correctOptionIndex === oIdx 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                q.correctOptionIndex === oIdx ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {q.correctOptionIndex === oIdx && (
                                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <p className="mt-2.5 text-xs text-gray-500 italic">
                          <span className="font-semibold text-gray-700">Explanation:</span> {q.explanation}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 flex-shrink-0 pt-1">
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setShowQuestionModal(true);
                        }}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Question & Translations"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRESCRIBED CHAPTERS (BOOK MASTERY) */}
      {activeTab === 'chapters' && currentBank?.bookMastery && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{currentBank.bookMastery.bookTitle}</h3>
                <p className="text-sm text-gray-500 mt-0.5">Author: {currentBank.bookMastery.author} • {currentBank.bookMastery.edition}</p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                Prescribed Reading Curriculum
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {currentBank.bookMastery.chapters.map((ch) => {
                const chapterQuestions = allQuestions.filter(q => q.bookMastery?.chapterNumber === ch.chapterNumber);
                return (
                  <div key={ch.chapterNumber} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-white hover:border-indigo-300 transition">
                    <div className="flex items-start justify-between">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {ch.chapterNumber}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 bg-white px-2.5 py-0.5 rounded-md border border-gray-200">
                        {ch.recommendedPages || 'Prescribed'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-gray-900 mt-3">{ch.chapterTitle}</h4>
                    {ch.topicSummary && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{ch.topicSummary}</p>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo-700">
                        {chapterQuestions.length} Questions Mapped
                      </span>
                      <button
                        onClick={() => {
                          setChapterFilter(ch.chapterNumber);
                          setActiveTab('pool');
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1"
                      >
                        <span>View Pool</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEW QUEUE (HUMAN APPROVAL GATE) */}
      {activeTab === 'review_queue' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Mandatory Human Academic Review Guard</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  In compliance with FET India examination standards, AI-generated and draft questions require explicit human review and approval by an authorized Exam Controller before being admitted to live exam papers.
                </p>
              </div>
            </div>
          </div>

          {pendingReviewQuestions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">Review Queue is Clear</h3>
              <p className="text-sm text-gray-500 mt-1">
                All authored and AI-drafted questions have been evaluated and approved.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReviewQuestions.map(({ bank, question: q }, idx) => (
                <div key={q.id || idx} className="bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-xs font-bold">
                          AI Generated Draft
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-md text-xs font-medium">
                          Bank: {bank.title}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                          {q.difficulty?.toUpperCase()} • {q.marks} Marks
                        </span>
                      </div>

                      <p className="text-base font-bold text-gray-900 leading-relaxed">{q.questionText}</p>

                      {q.translations?.ur && (
                        <div className="mt-2 p-2.5 bg-amber-50 rounded-xl" dir="rtl">
                          <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}>
                            {q.translations.ur.questionText}
                          </p>
                        </div>
                      )}

                      {q.options && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`p-2 rounded-lg text-xs font-medium border ${
                              q.correctOptionIndex === oIdx ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-gray-50 border-gray-200'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApproveQuestion(bank.id || '', q.id)}
                        className="w-full inline-flex items-center justify-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Question</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setShowQuestionModal(true);
                        }}
                        className="w-full inline-flex items-center justify-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit & Refine</span>
                      </button>
                      <button
                        onClick={() => handleRejectQuestion(bank.id || '', q.id)}
                        className="w-full inline-flex items-center justify-center space-x-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: QUESTION AUTHORING & MULTILINGUAL TRANSLATIONS */}
      {showQuestionModal && (
        <QuestionEditorModal
          initialData={editingQuestion}
          currentBank={currentBank}
          onClose={() => {
            setShowQuestionModal(false);
            setEditingQuestion(null);
          }}
          onSave={handleSaveQuestion}
        />
      )}

      {/* MODAL 2: AI QUESTION DRAFIER WITH SAFETY GATES */}
      {showAiGenModal && (
        <AiQuestionDrafterModal
          currentBank={currentBank}
          onClose={() => setShowAiGenModal(false)}
          onGenerated={(newQuestions) => {
            const updated = [...(currentBank.questions || []), ...newQuestions];
            setQuestionBanks(prev => prev.map(b => b.id === currentBank.id ? {
              ...b,
              questions: updated,
              pendingReviewCount: updated.filter(q => q.status === 'pending_review').length
            } : b));
            setShowAiGenModal(false);
            setActiveTab('review_queue');
            notify(`${newQuestions.length} questions generated and placed in Review Queue for human approval.`);
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// Sub-Component: Question Authoring Modal
// ==========================================
interface QuestionEditorModalProps {
  initialData: ExamQuestion | null;
  currentBank: QuestionBank;
  onClose: () => void;
  onSave: (q: Partial<ExamQuestion>) => void;
}

const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  initialData,
  currentBank,
  onClose,
  onSave
}) => {
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'ur' | 'hi' | 'ar'>('en');
  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [questionType, setQuestionType] = useState<QuestionType>(initialData?.questionType || 'mcq');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(initialData?.difficulty || 'medium');
  const [marks, setMarks] = useState<number>(initialData?.marks || 4);
  const [negativeMarks, setNegativeMarks] = useState<number>(initialData?.negativeMarks ?? 1);
  const [explanation, setExplanation] = useState(initialData?.explanation || '');
  const [selectedChapter, setSelectedChapter] = useState<number>(initialData?.bookMastery?.chapterNumber || 1);
  const [pageRange, setPageRange] = useState(initialData?.bookMastery?.pageRange || '');
  const [topicTag, setTopicTag] = useState(initialData?.bookMastery?.topicTag || '');

  // Options
  const [options, setOptions] = useState<string[]>(initialData?.options || ['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(initialData?.correctOptionIndex ?? 0);

  // Translations
  const [urText, setUrText] = useState(initialData?.translations?.ur?.questionText || '');
  const [urOptions, setUrOptions] = useState<string[]>(initialData?.translations?.ur?.options || ['', '', '', '']);
  const [hiText, setHiText] = useState(initialData?.translations?.hi?.questionText || '');
  const [hiOptions, setHiOptions] = useState<string[]>(initialData?.translations?.hi?.options || ['', '', '', '']);

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleUrOptionChange = (idx: number, val: string) => {
    const updated = [...urOptions];
    updated[idx] = val;
    setUrOptions(updated);
  };

  const handleHiOptionChange = (idx: number, val: string) => {
    const updated = [...hiOptions];
    updated[idx] = val;
    setHiOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert('Please enter the question text.');
      return;
    }

    const chapterObj = currentBank?.bookMastery?.chapters?.find(c => c.chapterNumber === selectedChapter);

    const translations: any = {};
    if (urText.trim()) {
      translations.ur = {
        language: 'ur',
        questionText: urText,
        options: urOptions.filter(o => o.trim()),
        direction: 'rtl'
      };
    }
    if (hiText.trim()) {
      translations.hi = {
        language: 'hi',
        questionText: hiText,
        options: hiOptions.filter(o => o.trim()),
        direction: 'ltr'
      };
    }

    onSave({
      questionText,
      primaryLanguage: 'en',
      translations,
      questionType,
      difficulty,
      marks: Number(marks),
      negativeMarks: Number(negativeMarks),
      explanation,
      options: questionType === 'mcq' || questionType === 'true_false' ? options : undefined,
      correctOptionIndex: questionType === 'mcq' || questionType === 'true_false' ? correctOptionIndex : undefined,
      bookMastery: currentBank?.bookMastery ? {
        bookTitle: currentBank.bookMastery.bookTitle,
        chapterNumber: selectedChapter,
        chapterTitle: chapterObj?.chapterTitle || `Chapter ${selectedChapter}`,
        pageRange,
        topicTag
      } : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {initialData ? 'Edit Multilingual Question' : 'Author New Exam Question'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Repository: {currentBank.title} [{currentBank.code}]
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Question Type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800"
              >
                <option value="mcq">Single Choice (MCQ)</option>
                <option value="true_false">True / False</option>
                <option value="fill_blank">Fill in the Blank</option>
                <option value="descriptive">Descriptive / Essay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">+ Marks</label>
                <input
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  min={1}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">- Negative</label>
                <input
                  type="number"
                  value={negativeMarks}
                  onChange={(e) => setNegativeMarks(Number(e.target.value))}
                  min={0}
                  step={0.25}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Book Mastery Chapter Mapping if available */}
          {currentBank?.bookMastery && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center space-x-1">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Prescribed Reading Mapping</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Chapter</label>
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(Number(e.target.value))}
                    className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
                  >
                    {currentBank.bookMastery.chapters.map(c => (
                      <option key={c.chapterNumber} value={c.chapterNumber}>
                        Ch {c.chapterNumber}: {c.chapterTitle}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Page Reference</label>
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="e.g. pp. 45-52"
                    className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Topic / Competency Tag</label>
                  <input
                    type="text"
                    value={topicTag}
                    onChange={(e) => setTopicTag(e.target.value)}
                    placeholder="e.g. Scientific Ethics"
                    className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Language Tabs */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-100 p-2 flex items-center space-x-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveLangTab('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeLangTab === 'en' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                English (Primary)
              </button>
              <button
                type="button"
                onClick={() => setActiveLangTab('ur')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                  activeLangTab === 'ur' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>اردو (Urdu RTL)</span>
                {urText && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
              </button>
              <button
                type="button"
                onClick={() => setActiveLangTab('hi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                  activeLangTab === 'hi' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>हिंदी (Hindi)</span>
                {hiText && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
              </button>
            </div>

            <div className="p-4 space-y-4">
              {activeLangTab === 'en' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Question Statement (English)</label>
                  <textarea
                    rows={3}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Type the question text clearly in English..."
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />

                  {/* Options Editor for MCQ */}
                  {(questionType === 'mcq' || questionType === 'true_false') && (
                    <div className="mt-4 space-y-2.5">
                      <label className="block text-xs font-semibold text-gray-700">Options & Correct Answer Choice</label>
                      {options.map((opt, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={correctOptionIndex === idx}
                            onChange={() => setCorrectOptionIndex(idx)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-bold text-gray-600 w-5">{String.fromCharCode(65 + idx)}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                            className={`flex-1 rounded-xl px-3 py-2 text-sm border ${
                              correctOptionIndex === idx ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-medium' : 'border-gray-300 bg-gray-50'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeLangTab === 'ur' && (
                <div dir="rtl" className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 text-right">سوال کی عبارت (اردو Nastaliq):</label>
                    <textarea
                      rows={3}
                      value={urText}
                      onChange={(e) => setUrText(e.target.value)}
                      placeholder="اردو میں سوال تحریر کریں..."
                      className="w-full bg-amber-50/40 border border-amber-300 rounded-xl p-3 text-base text-gray-900 focus:bg-white text-right"
                      style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}
                    />
                  </div>

                  {(questionType === 'mcq' || questionType === 'true_false') && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-700 text-right">اردو میں اختیارات (Options):</label>
                      {urOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center space-x-2 space-x-reverse">
                          <span className="text-xs font-bold text-gray-600 w-5">{String.fromCharCode(65 + idx)}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUrOptionChange(idx, e.target.value)}
                            placeholder={`اختیار ${String.fromCharCode(65 + idx)}`}
                            className="flex-1 rounded-xl px-3 py-2 text-sm border border-gray-300 bg-gray-50 text-right font-medium"
                            style={{ fontFamily: 'Noto Nastaliq Urdu, serif' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeLangTab === 'hi' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">प्रश्न विवरण (हिंदी Devanagari):</label>
                    <textarea
                      rows={3}
                      value={hiText}
                      onChange={(e) => setHiText(e.target.value)}
                      placeholder="हिंदी में प्रश्न दर्ज करें..."
                      className="w-full bg-blue-50/40 border border-blue-300 rounded-xl p-3 text-sm text-gray-900 focus:bg-white"
                    />
                  </div>

                  {(questionType === 'mcq' || questionType === 'true_false') && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-700">हिंदी में विकल्प (Options):</label>
                      {hiOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-600 w-5">{String.fromCharCode(65 + idx)}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleHiOptionChange(idx, e.target.value)}
                            placeholder={`विकल्प ${String.fromCharCode(65 + idx)}`}
                            className="flex-1 rounded-xl px-3 py-2 text-sm border border-gray-300 bg-gray-50 font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Answer Explanation & Academic Rationale</label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide a scholarly explanation of why the answer is correct for the evaluation report..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-800 focus:bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
            >
              Save Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// Sub-Component: AI Question Drafter Modal
// ==========================================
interface AiQuestionDrafterModalProps {
  currentBank: QuestionBank;
  onClose: () => void;
  onGenerated: (questions: ExamQuestion[]) => void;
}

const AiQuestionDrafterModal: React.FC<AiQuestionDrafterModalProps> = ({
  currentBank,
  onClose,
  onGenerated
}) => {
  const [topicPrompt, setTopicPrompt] = useState(
    currentBank.bookMastery 
      ? `Prescribed book: ${currentBank.bookMastery.bookTitle}. Formulate questions testing critical comprehension, ethical dilemmas, and historical leadership.`
      : `Generate analytical and conceptual multiple-choice questions for ${currentBank.title}.`
  );
  const [numQuestions, setNumQuestions] = useState(3);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [includeUrdu, setIncludeUrdu] = useState(true);
  const [includeHindi, setIncludeHindi] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      // Simulate rich structured generation with Mandatory Review status
      const generatedList: ExamQuestion[] = [];
      for (let i = 1; i <= numQuestions; i++) {
        const id = `q-ai-${Date.now()}-${i}`;
        generatedList.push({
          id,
          questionText: `[AI Draft] According to the curricular study of "${currentBank.title}", how is ethical accountability established during critical milestone execution (Scenario ${i})?`,
          primaryLanguage: 'en',
          translations: {
            ...(includeUrdu ? {
              ur: {
                language: 'ur',
                questionText: `[مصنوعی ذہانت ڈرافٹ] نصاب کے مطابق، اہم منصوبوں کی تکمیل کے دوران اخلاقی احتساب اور دیانت داری کو کس طرح نافذ کیا جاتا ہے؟ (منظر نامہ ${i})`,
                options: [
                  'شفاف دستاویزی طریقہ کار اور اجتماعی مشاورت کے ذریعے',
                  'تنظیمی اصولوں کو بالائے طاق رکھ کر',
                  'صرف بیرونی رپورٹنگ پر انحصار کر کے',
                  'تحقیقی جانچ پڑتال کو نظر انداز کر کے'
                ],
                direction: 'rtl'
              }
            } : {}),
            ...(includeHindi ? {
              hi: {
                language: 'hi',
                questionText: `[AI ड्राफ्ट] पाठ्यक्रम के अनुसार, महत्वपूर्ण परियोजनाओं के क्रियान्वयन के दौरान नैतिक जवाबदेही और सत्यनिष्ठा को कैसे सुनिश्चित किया जाता है? (परिदृश्य ${i})`,
                options: [
                  'पारदर्शी प्रलेखन और सामूहिक परामर्श द्वारा',
                  'संगठनात्मक नियमों की अनदेखी करके',
                  'केवल बाहरी रिपोर्टिंग पर निर्भर होकर',
                  'समीक्षा जांच को छोड़ कर'
                ],
                direction: 'ltr'
              }
            } : {})
          },
          questionType: 'mcq',
          options: [
            'Through transparent institutional protocols and collective ethical responsibility',
            'By bypassing core governance principles for speed',
            'Through isolated unilateral decision-making without peer review',
            'By concealing minor technical anomalies'
          ],
          correctOptionIndex: 0,
          marks: 4,
          negativeMarks: 1,
          difficulty: difficulty,
          status: 'pending_review',
          aiGenerated: true,
          explanation: 'Standard academic guideline emphasizing rigorous peer review and adherence to institutional ethics.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      setIsGenerating(false);
      onGenerated(generatedList);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-scaleIn space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">AI Question Drafter Assistant</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
          <p className="font-bold">Human-in-the-Loop Governance Guard:</p>
          Generated questions are marked as <strong>Pending Review</strong> and will NOT be added to any active examination until you review and click "Approve Question".
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Curriculum / Topic Prompt</label>
            <textarea
              rows={3}
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Number of Questions</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs"
              >
                <option value={2}>2 Questions</option>
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-1 text-xs text-gray-700 font-medium">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUrdu}
                onChange={(e) => setIncludeUrdu(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span>Generate Urdu (اردو) Translation</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeHindi}
                onChange={(e) => setIncludeHindi(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span>Generate Hindi Translation</span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Drafts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Questions</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
