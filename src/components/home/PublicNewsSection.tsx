/**
 * @license
 * Public News & Official Trust Bulletins
 * Fatimyah Educational Trust India
 */

import React from 'react';
import { 
  Newspaper, 
  Calendar, 
  ArrowRight, 
  Sparkles,
  Download,
  Award
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

export const PublicNewsSection: React.FC = () => {
  const { config } = useConfig();

  const newsItems = [
    {
      id: 'news-1',
      title: 'Fatimyah Educational Trust Opens Merit Scholarship Applications for AY 2026-27',
      date: 'August 15, 2026',
      category: 'Scholarship Alert',
      summary: 'Students enrolled in technical, medical, and professional degree courses can now submit online grant applications with verified fee receipts.',
      tag: 'Admissions Open'
    },
    {
      id: 'news-2',
      title: 'National Islamic & STEM Talent Search 2026: District Hall Tickets Dispatched',
      date: 'July 30, 2026',
      category: 'Examination',
      summary: 'Over 1,400 students across 28 test centers have received examination passes for the upcoming state-wide competitive aptitude exam.',
      tag: 'Exam Update'
    },
    {
      id: 'news-3',
      title: 'Annual Statutory Audit Completed: Section 80G & 12A Compliance 100% Certified',
      date: 'July 10, 2026',
      category: 'Trust Governance',
      summary: 'Independent chartered accountants verify zero-leakage direct fund distribution for educational assistance, confirming compliance with NGO Darpan guidelines.',
      tag: 'Statutory Report'
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-white border-t border-slate-200" id="news">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
              <Newspaper className="w-3.5 h-3.5 text-rose-700" />
              <span>Official Press Releases & Trust Bulletins</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Latest News & Institutional Announcements
            </h2>
          </div>
          <span className="text-xs text-slate-500">Official Secretariat Dispatches</span>
        </div>

        {/* News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map((item) => (
            <div 
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-between hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>{item.date}</span>
                  </div>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="text-emerald-800 text-[11px]">{item.tag}</span>
                <span className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-800">
                  Read Circular <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
