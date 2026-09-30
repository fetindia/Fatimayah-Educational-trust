/**
 * @license
 * Global Public Website Search Modal
 * Fatimyah Educational Trust India (FET India)
 * 
 * Features:
 * - Real-time keyword indexing and multi-category search across:
 *   * Academic Competitions & Talent Search Examinations
 *   * Core Educational Support & Welfare Programs
 *   * Crowdfunding Campaigns & Urgent Causes
 *   * News, Blogs & Trust Publications
 *   * Statutory, Governance & Section 80G Information
 * - Keyboard shortcut support (Cmd+K / Ctrl+K and Esc to close)
 * - Direct deep-linking / navigation to target views or sections
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  ArrowRight, 
  BookOpen, 
  Award, 
  HeartHandshake, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight,
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

export type SearchCategory = 'all' | 'programs' | 'exams' | 'campaigns' | 'news' | 'governance';

export interface SearchResultItem {
  id: string;
  title: string;
  category: SearchCategory;
  categoryLabel: string;
  snippet: string;
  tags?: string[];
  actionType: 'scroll' | 'modal' | 'dashboard';
  targetId: string;
}

interface PublicSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (actionType: string, targetId: string) => void;
}

const SEARCH_INDEX: SearchResultItem[] = [
  // Competitions & Examinations
  {
    id: 'exam-1',
    title: 'All-India National Book Reading & Comprehension Challenge',
    category: 'exams',
    categoryLabel: 'Competitions & Exams',
    snippet: 'Annual national literary competition open to school and college students with ₹50,000 in cash prizes and merit medals.',
    tags: ['book reading', 'wings of fire', 'comprehension', 'exam', 'competition', 'scholarship', 'prize'],
    actionType: 'scroll',
    targetId: 'examinations'
  },
  {
    id: 'exam-2',
    title: 'STEM Science & Mathematics National Olympiad 2026',
    category: 'exams',
    categoryLabel: 'Competitions & Exams',
    snippet: 'Competitive Olympiad testing analytical mathematics, natural sciences, and problem-solving skills.',
    tags: ['stem', 'science', 'math', 'olympiad', 'exam', 'hall ticket', 'rankings'],
    actionType: 'scroll',
    targetId: 'examinations'
  },
  {
    id: 'exam-3',
    title: 'Islamic History & Moral Ethics Annual Assessment',
    category: 'exams',
    categoryLabel: 'Competitions & Exams',
    snippet: 'Comprehensive assessment of Islamic civilizational history, ethical values, and moral philosophy.',
    tags: ['islamic history', 'ethics', 'moral', 'examination', 'test', 'madrasa'],
    actionType: 'scroll',
    targetId: 'examinations'
  },
  {
    id: 'exam-top100',
    title: 'Top 100 Qualified Students Honor Roll',
    category: 'exams',
    categoryLabel: 'Honor Roll',
    snippet: 'Public showcase of the Top 100 nationally qualified students and merit distinction awardees.',
    tags: ['top 100', 'results', 'rankings', 'merit', 'scorecard', 'winners'],
    actionType: 'scroll',
    targetId: 'top-100-results-section'
  },

  // Programs & Welfare
  {
    id: 'prog-1',
    title: 'Primary & Secondary School Fee Sponsorship Program',
    category: 'programs',
    categoryLabel: 'Educational Programs',
    snippet: 'Direct financial assistance covering tuition fees, uniforms, and textbooks for underprivileged children.',
    tags: ['education', 'school fees', 'scholarship', 'students', 'tuition', 'books'],
    actionType: 'scroll',
    targetId: 'programs'
  },
  {
    id: 'prog-2',
    title: 'Higher Professional & Engineering Education Grants',
    category: 'programs',
    categoryLabel: 'Educational Programs',
    snippet: 'Financial support and educational endowments for university students pursuing engineering, medicine, and law.',
    tags: ['higher education', 'engineering', 'medical', 'degree', 'grant', 'college'],
    actionType: 'scroll',
    targetId: 'programs'
  },
  {
    id: 'prog-3',
    title: 'Vocational Skill & Digital Literacy Center',
    category: 'programs',
    categoryLabel: 'Community Welfare',
    snippet: 'Certified software training, vocational job skills, and livelihood empowerment workshops for youth.',
    tags: ['vocational', 'skills', 'computer', 'digital literacy', 'employment', 'jobs'],
    actionType: 'scroll',
    targetId: 'programs'
  },

  // Crowdfunding & Donations
  {
    id: 'camp-1',
    title: 'Medical Relief & Life-Saving Surgery Emergency Fund',
    category: 'campaigns',
    categoryLabel: 'Crowdfunding',
    snippet: 'Urgent medical aid supporting ICU hospitalizations, cardiac surgeries, and subsidized medicines.',
    tags: ['medical', 'hospital', 'surgery', 'crowdfunding', 'emergency', 'health', 'donate'],
    actionType: 'scroll',
    targetId: 'crowdfunding'
  },
  {
    id: 'camp-2',
    title: 'General Donations, Zakat & Fitrah Portal (Section 80G Tax Deductible)',
    category: 'campaigns',
    categoryLabel: 'Donations & Zakat',
    snippet: 'Fulfill your Zakat, Fitrah, Waqf, in-kind material contributions, or general donations with instant 80G receipts.',
    tags: ['zakat', 'fitrah', 'donation', '80g', 'tax exemption', 'waqf', 'material', 'in-kind'],
    actionType: 'modal',
    targetId: 'general_donation'
  },

  // News & Blogs
  {
    id: 'news-1',
    title: 'Annual Academic Convocation & Merit Award Ceremony 2026',
    category: 'news',
    categoryLabel: 'News & Events',
    snippet: 'Honoring outstanding students and community educators at the FET central auditorium.',
    tags: ['news', 'convocation', 'ceremony', 'awards', 'event', 'blog'],
    actionType: 'scroll',
    targetId: 'news_blogs'
  },
  {
    id: 'news-2',
    title: 'Chairman Message & Vision 2030 for Educational Equality',
    category: 'governance',
    categoryLabel: 'Governance & Vision',
    snippet: 'Official message from the Chairman of Fatimyah Educational Trust outlining strategic goals for the decade.',
    tags: ['chairman', 'message', 'leadership', 'trustee', 'vision', 'governance'],
    actionType: 'modal',
    targetId: 'chairmans_message'
  },

  // Governance & Legal
  {
    id: 'gov-1',
    title: 'Section 80G(5)(vi) Income Tax Exemption Details',
    category: 'governance',
    categoryLabel: 'Statutory Compliance',
    snippet: 'FATIMYAH EDUCATIONAL TRUST statutory registration in Jammu & Kashmir through SDM Office and IT Act 80G verification.',
    tags: ['80g', 'tax', '12a', 'pan', 'trust deed', 'sdm registration', 'jammu kashmir', 'compliance', 'legal'],
    actionType: 'modal',
    targetId: 'legal_terms'
  },
  {
    id: 'gov-2',
    title: 'Member & Volunteer Digital ID Card Verification Portal',
    category: 'governance',
    categoryLabel: 'ID Card Verification',
    snippet: 'Live QR credential verification for official Trust members, donors, volunteers, and examiners.',
    tags: ['id card', 'verification', 'qr code', 'credential', 'member id', 'official'],
    actionType: 'modal',
    targetId: 'verify_id'
  }
];

export const PublicSearchModal: React.FC<PublicSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [queryText, setQueryText] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQueryText('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter search results
  const searchResults = useMemo(() => {
    const trimmed = queryText.trim().toLowerCase();

    return SEARCH_INDEX.filter((item) => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      if (!trimmed) {
        return true; // Return all in category when query is empty
      }

      const matchTitle = item.title.toLowerCase().includes(trimmed);
      const matchSnippet = item.snippet.toLowerCase().includes(trimmed);
      const matchTags = item.tags?.some(tag => tag.toLowerCase().includes(trimmed));

      return matchTitle || matchSnippet || matchTags;
    });
  }, [queryText, activeCategory]);

  const handleSelectItem = (item: SearchResultItem) => {
    onClose();
    onNavigate(item.actionType, item.targetId);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col text-slate-900 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-emerald-700 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search programs, examinations, top 100 results, donations, 80G..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="w-full text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 bg-transparent border-none focus:outline-hidden"
          />
          {queryText && (
            <button
              type="button"
              onClick={() => setQueryText('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200">
            ESC
          </span>
        </div>

        {/* Category Filter Chips */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
              activeCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Results
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('exams')}
            className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
              activeCategory === 'exams' ? 'bg-emerald-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Exams & Results
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('programs')}
            className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
              activeCategory === 'programs' ? 'bg-blue-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Programs
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('campaigns')}
            className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
              activeCategory === 'campaigns' ? 'bg-amber-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Donations & Zakat
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('governance')}
            className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
              activeCategory === 'governance' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            80G & Governance
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 space-y-1">
          {searchResults.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No matching results found</p>
              <p className="text-xs text-slate-400">
                Try searching for keywords like "scholarship", "Olympiad", "Zakat", "80G", or "Top 100".
              </p>
            </div>
          ) : (
            searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectItem(item)}
                className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 group cursor-pointer"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {item.categoryLabel}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.snippet}
                  </p>
                </div>
                <div className="shrink-0 pt-2 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Quick Footer Navigation Hint */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 px-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Fatimyah Educational Trust Official Knowledge Directory</span>
          </div>
          <span className="font-semibold text-slate-600">
            {searchResults.length} {searchResults.length === 1 ? 'item' : 'items'} found
          </span>
        </div>

      </div>
    </div>
  );
};
