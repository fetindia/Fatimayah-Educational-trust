/**
 * @license
 * Public News & Blog Article Reader Modal
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Clock, 
  Tag, 
  Share2, 
  CheckCircle2, 
  Newspaper,
  ShieldCheck
} from 'lucide-react';

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  content?: string;
  author?: string;
  readTime?: string;
  imageUrl?: string;
  tag?: string;
}

interface NewsBlogReaderModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NewsBlogReaderModal: React.FC<NewsBlogReaderModalProps> = ({
  article,
  isOpen,
  onClose
}) => {
  if (!isOpen || !article) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-reader-title"
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 uppercase tracking-wider">
              {article.category}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {article.date}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-700">
          
          {/* Article Image (if available) */}
          {article.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-72 w-full bg-slate-100">
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-3">
            <h1 id="article-reader-title" className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-y border-slate-100 py-2.5">
              {article.author && (
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {article.author}
                </span>
              )}
              {article.readTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {article.readTime}
                </span>
              )}
              <span className="flex items-center gap-1 text-emerald-700 font-bold ml-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Trust Dispatch
              </span>
            </div>
          </div>

          {/* Article Full Summary & Body */}
          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-800">
              {article.summary}
            </div>

            <p>
              {article.content || 'Fatimyah Educational Trust India continues to ensure rigorous institutional compliance, direct beneficiary support, and transparent public communication across all educational, healthcare, and humanitarian initiatives. All trust circulars are preserved as part of the statutory public record.'}
            </p>

            <p>
              For additional clarifications, district verification, or official representations regarding this release, registered members and the public may contact the Central Secretariat via verified email at contact@fetindia.com.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Fatimyah Educational Trust Official Dispatch
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Close Reader
          </button>
        </div>

      </div>
    </div>
  );
};
