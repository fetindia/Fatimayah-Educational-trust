/**
 * @license
 * National Islamic & STEM Talent Search Examination Portal Section
 * Fatimyah Educational Trust India
 */

import React, { useState } from 'react';
import { 
  Award, 
  BookOpen, 
  Download, 
  Search, 
  Calendar, 
  CheckCircle2, 
  HelpCircle, 
  MapPin, 
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

interface EducationExamSectionProps {
  onOpenAuth?: () => void;
}

export const EducationExamSection: React.FC<EducationExamSectionProps> = ({ onOpenAuth }) => {
  const { config } = useConfig();
  const [hallTicketInput, setHallTicketInput] = useState('');
  const [searchedTicket, setSearchedTicket] = useState<{
    found: boolean;
    name?: string;
    roll?: string;
    center?: string;
    date?: string;
    time?: string;
    status?: string;
  } | null>(null);

  const [activeExamTab, setActiveExamTab] = useState<'overview' | 'syllabus' | 'centers' | 'hallticket'>('overview');

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  const testCenters = [
    { city: 'Mumbai Central', state: 'Maharashtra', venue: 'Anjuman-I-Islam Campus, CST', capacity: '450 Seats' },
    { city: 'Pune', state: 'Maharashtra', venue: 'Azam Campus Technical Hall, Camp', capacity: '300 Seats' },
    { city: 'Nagpur', state: 'Maharashtra', venue: 'FET Community Model Center, Mominpura', capacity: '250 Seats' },
    { city: 'Aurangabad (CSN)', state: 'Maharashtra', venue: 'Maulana Azad College Auditorium', capacity: '350 Seats' },
    { city: 'Bhopal', state: 'Madhya Pradesh', venue: 'Crescent Public Hall, Jahangirabad', capacity: '300 Seats' },
    { city: 'Indore', state: 'Madhya Pradesh', venue: 'Madina Model Academy Center', capacity: '200 Seats' }
  ];

  const syllabusUnits = [
    {
      unit: 'Section A: STEM & Logical Reasoning',
      marks: '40 Marks',
      topics: 'General Science, High-School Mathematics, Pattern Recognition, Algorithmic Thinking, Data Interpretation'
    },
    {
      unit: 'Section B: Islamic History & Moral Ethics',
      marks: '30 Marks',
      topics: 'Seerah of Prophet Muhammad (PBUH), History of Indian Scholars, Constitutional Values & Communal Harmony'
    },
    {
      unit: 'Section C: English Language & Comprehension',
      marks: '20 Marks',
      topics: 'Reading Passages, Grammar, Vocabulary, Critical Reading, Formal Composition'
    },
    {
      unit: 'Section D: General Knowledge & Current Affairs',
      marks: '10 Marks',
      topics: 'National Geography, Scientific Breakthroughs 2025-26, Social Welfare Schemes in India'
    }
  ];

  const handleSearchHallTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallTicketInput.trim()) return;

    if (hallTicketInput.toUpperCase().includes('FET') || hallTicketInput.length >= 4) {
      setSearchedTicket({
        found: true,
        name: 'Mohammed Zeeshan Ansari',
        roll: hallTicketInput.toUpperCase().startsWith('FET') ? hallTicketInput.toUpperCase() : `FET-2026-${hallTicketInput}`,
        center: 'Anjuman-I-Islam Campus, CST, Mumbai (Center Code: MH-01)',
        date: 'Sunday, October 18, 2026',
        time: '10:00 AM - 1:00 PM IST',
        status: 'Verified & Pass Generated'
      });
    } else {
      setSearchedTicket({
        found: false
      });
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-slate-200" id="education">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-300">
            <Award className="w-4 h-4 text-emerald-700" />
            <span>National Talent Search & Competitive Assessment</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            FET National STEM & Islamic Olympiad 2026
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Discovering and funding exceptional academic talent across India through merit-driven competitions, laptop grants, and 100% higher education sponsorship.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 pb-4">
          {[
            { id: 'overview', label: 'Exam Overview & Awards', icon: Award },
            { id: 'syllabus', label: 'Curriculum & Syllabi', icon: BookOpen },
            { id: 'centers', label: 'Test Center Directory', icon: MapPin },
            { id: 'hallticket', label: 'Hall Ticket Status', icon: Search }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveExamTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeExamTab === tab.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview & Awards */}
        {activeExamTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Rewarding Excellence Across 28 Districts
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  The FET National Talent Search Examination is conducted simultaneously in over 28 district centers. Top-ranking candidates receive laptop computers, scientific calculators, high school scholarships, and full tuition coverage for professional degree programs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <div className="text-2xl font-black text-amber-900">1st Rank</div>
                  <div className="text-xs font-bold text-amber-800">₹1,00,000 Cash Grant</div>
                  <p className="text-[11px] text-amber-700">+ Core i7 Laptop & Gold Medal</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-1">
                  <div className="text-2xl font-black text-slate-900">2nd-5th Rank</div>
                  <div className="text-xs font-bold text-slate-800">₹50,000 Grant Each</div>
                  <p className="text-[11px] text-slate-600">+ Tablet Device & Silver Medal</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="text-2xl font-black text-emerald-900">Top 100</div>
                  <div className="text-xs font-bold text-emerald-800">Annual Tuition Grant</div>
                  <p className="text-[11px] text-emerald-700">+ Academic Mentorship</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-900">Exam Date: October 18, 2026</span>
                  <p className="text-[11px] text-slate-500">Registration deadline closes on September 30, 2026</p>
                </div>
                <button
                  onClick={onOpenAuth}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <span>Register for 2026 Exam</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-radial from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Exam Snapshot</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                    OMR & Digital Mode
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Total Duration:</span>
                    <span className="font-bold text-white">3 Hours (180 Minutes)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Question Format:</span>
                    <span className="font-bold text-white">100 Multiple Choice Questions</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Negative Marking:</span>
                    <span className="font-bold text-amber-300">None (Pure Merit Scored)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Eligible Classes:</span>
                    <span className="font-bold text-white">Class 8th to 12th & Degree</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Exam Mediums:</span>
                    <span className="font-bold text-white">English, Urdu, Hindi & Marathi</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveExamTab('syllabus')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Download Detailed Subject Syllabi</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Syllabus */}
        {activeExamTab === 'syllabus' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {syllabusUnits.map((unit, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{unit.unit}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {unit.marks}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Topics:</strong> {unit.topics}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-700 shrink-0" />
                <span>Download Sample Question Paper & Official OMR Answer Sheet format (PDF, 2.4 MB)</span>
              </div>
              <button 
                onClick={() => alert('Official 2026 Sample Question Paper download initiated.')}
                className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Test Centers */}
        {activeExamTab === 'centers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testCenters.map((center, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">{center.state}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                      {center.capacity}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">{center.city}</h4>
                  <p className="text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{center.venue}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Hall Ticket Status */}
        {activeExamTab === 'hallticket' && (
          <div className="max-w-xl mx-auto rounded-3xl bg-slate-50 border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Hall Ticket & Test Center Lookup</h3>
              <p className="text-xs text-slate-500">Enter your Registration Number or Application ID to view venue details.</p>
            </div>

            <form onSubmit={handleSearchHallTicket} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. FET-2026-8941 or Mobile No"
                value={hallTicketInput}
                onChange={(e) => setHallTicketInput(e.target.value)}
                className="flex-1 p-3 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            {searchedTicket && (
              searchedTicket.found ? (
                <div className="p-5 rounded-2xl bg-white border border-emerald-300 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Candidate Name</span>
                      <h4 className="text-sm font-extrabold text-slate-900">{searchedTicket.name}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {searchedTicket.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Roll Number:</span>
                      <span className="font-mono font-bold text-slate-900">{searchedTicket.roll}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Exam Date & Time:</span>
                      <span className="font-bold text-slate-900">{searchedTicket.date}</span>
                    </div>
                  </div>

                  <div className="text-xs pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Allotted Examination Center:</span>
                    <span className="font-bold text-slate-900">{searchedTicket.center}</span>
                  </div>

                  <button 
                    onClick={() => alert(`Official Hall Ticket PDF for Roll ${searchedTicket.roll} downloaded.`)}
                    className="w-full mt-2 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official Admit Pass (PDF)</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center text-xs text-rose-800">
                  No registration record found for "{hallTicketInput}". Please verify your registered mobile number or application ID.
                </div>
              )
            )}
          </div>
        )}

      </div>
    </section>
  );
};
