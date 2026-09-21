/**
 * @license
 * Dedicated Full Webpage: Events, News & Official Editorial Dispatches
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Newspaper, 
  MapPin, 
  Clock, 
  Users, 
  ArrowRight, 
  Share2, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  ArrowLeft,
  ExternalLink,
  Tag,
  Radio
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useConfig } from '../../contexts/ConfigContext';
import { NewsArticle } from '../home/NewsBlogReaderModal';

interface EventsNewsPageProps {
  onReadArticle: (article: NewsArticle) => void;
  onReturnToHome: () => void;
  onOpenDonate?: () => void;
}

interface EventItem {
  id: string;
  title: string;
  category: string;
  date: string;
  day: string;
  month: string;
  time: string;
  venue: string;
  city: string;
  description: string;
  expectedAttendees: string;
  status: string;
  featured?: boolean;
}

export const EventsNewsPage: React.FC<EventsNewsPageProps> = ({
  onReadArticle,
  onReturnToHome,
  onOpenDonate
}) => {
  const { config } = useConfig();
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'news' | 'circulars'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const defaultArticles: NewsArticle[] = [
    {
      id: 'news-1',
      title: 'Fatimyah Educational Trust Opens Merit Scholarship Applications for AY 2026-27',
      category: 'Scholarship Alert',
      date: 'August 15, 2026',
      summary: 'Students enrolled in technical, medical, and professional degree courses can now submit online grant applications with verified fee receipts.',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
      author: 'FET Education Directorate',
      readTime: '4 min read',
      tag: 'Admissions Open',
      content: `The Higher Education Directorate of Fatimyah Educational Trust (FET India) is pleased to announce the formal opening of the centralized scholarship portal for Academic Year 2026-27.

Eligible candidates pursuing undergraduate and postgraduate degrees in Engineering (B.E./B.Tech), Medicine (MBBS, BDS, BAMS, BHMS), Pharmacy (B.Pharm), Law (LL.B), and Professional Chartered Accountancy are invited to submit verified applications.

Key Highlights of the 2026-27 Grant Allocation:
- Direct institutional bank transfers covering tuition fees up to ₹85,000 per student per academic year.
- Special laptop grants earmarked for 3rd and 4th year computer science and engineering scholars.
- Zero intermediary involvement: grants are ratified through field volunteer home visits and college fee structure validation.

Students are advised to prepare their certified marksheets, income declarations, and admission fee receipts prior to initiating the digital application.`
    },
    {
      id: 'news-2',
      title: 'National Islamic & STEM Talent Search 2026: District Hall Tickets Dispatched',
      category: 'Examination',
      date: 'July 30, 2026',
      summary: 'Over 1,400 students across 28 test centers have received examination passes for the upcoming state-wide competitive aptitude exam.',
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
      author: 'Examination Bureau',
      readTime: '3 min read',
      tag: 'Exam Update',
      content: `The Examination Directorate has concluded the preliminary validation of student roll numbers for the National STEM & Islamic Aptitude Search 2026.

All registered candidates can now download their digital admit cards and hall tickets directly through the online examination portal using their registered mobile numbers.

Center Allocation & Verification Guidelines:
- 28 authorized test centers have been established across Maharashtra, Gujarat, and Madhya Pradesh.
- Each hall ticket features a tamper-proof QR code to be scanned at the entry gate.
- Prescribed reading material and book review guidelines remain accessible on the examination page.`
    },
    {
      id: 'news-3',
      title: 'Bridging the Higher Education Deficit: 30 Years of Targeted Merit Aid in India',
      category: 'Research & Policy',
      date: 'July 15, 2026',
      summary: 'An empirical analysis of how direct fee sponsorships and laptop allocations boost graduation and employment rates in minority communities.',
      imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
      author: 'FET Research Secretariat',
      readTime: '5 min read',
      tag: 'Policy Whitepaper',
      content: `A retrospective survey published by the Trust Research Secretariat tracks over three decades of educational interventions across urban slums and rural hinterlands.

The empirical findings demonstrate that targeted fee subsidies reduce tertiary education dropout rates by over 74% among first-generation scholars. The report further outlines the Trust's future roadmap for establishing 50 additional smart STEM learning labs in traditional community seminaries.`
    },
    {
      id: 'news-4',
      title: 'Mega Health Camp & Dialysis Subsidy Drive Concludes in Nagpur: 1,200+ Beneficiaries',
      category: 'Healthcare & Welfare',
      date: 'June 28, 2026',
      summary: 'Free specialty consultations, cataract screenings, and 6-month dialysis grant sanctions conducted in collaboration with leading charitable hospitals.',
      imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      author: 'FET Medical Outreach Board',
      readTime: '3 min read',
      tag: 'Healthcare Outreach',
      content: `Over 1,200 economically vulnerable citizens received free specialist medical checkups, cardiac ECG evaluations, and eye diagnostics during the two-day outreach in Nagpur. The Trust sanctioned perpetual monthly dialysis subsidies for 42 chronic renal failure patients.`
    }
  ];

  const defaultEvents: EventItem[] = [
    {
      id: 'evt-1',
      title: 'National Talent Search Olympiad 2026 — Assessment Day',
      category: 'Examination',
      date: 'October 18, 2026',
      day: '18',
      month: 'OCT',
      time: '10:00 AM - 1:00 PM IST',
      venue: '28 Designated Centers & FET Online Portal',
      city: 'Pan-India',
      description: 'Nationwide simultaneous examination for enrolled candidates covering General Science, Mathematics, Ethical History, and Logic.',
      expectedAttendees: '1,400+ Candidates',
      status: 'Admit Cards Active',
      featured: true
    },
    {
      id: 'evt-2',
      title: '32nd Annual General Assembly & Trust Jubilee Conclave',
      category: 'Governance & Members',
      date: 'November 22, 2026',
      day: '22',
      month: 'NOV',
      time: '11:00 AM - 4:00 PM IST',
      venue: 'Auditorium, FET Central Secretariat, Mumbai',
      city: 'Mumbai',
      description: 'Annual gathering of all Life Members, Trustees, and Chapter Leads to ratify annual statutory audit reports and scholarship quotas.',
      expectedAttendees: '450 Delegates',
      status: 'Member Registration Open'
    },
    {
      id: 'evt-3',
      title: 'Civil Services & UPSC Aspirants Induction Seminar',
      category: 'Career & Academics',
      date: 'December 06, 2026',
      day: '06',
      month: 'DEC',
      time: '3:00 PM - 6:30 PM IST',
      venue: 'FET Virtual Learning Hub & Live Broadcast',
      city: 'Online Broadcast',
      description: 'Interactive career guidance and scholarship screening briefing led by serving civil servants and judicial officers.',
      expectedAttendees: '800+ Students',
      status: 'Open for Public RSVP'
    }
  ];

  const [articles, setArticles] = useState<NewsArticle[]>(defaultArticles);
  const [events, setEvents] = useState<EventItem[]>(defaultEvents);

  // Firestore sync for dynamic news
  useEffect(() => {
    let isMounted = true;
    try {
      const unsub = onSnapshot(collection(db, 'news'), (snapshot) => {
        if (!snapshot.empty) {
          const list: NewsArticle[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as NewsArticle);
          });
          if (isMounted) setArticles(list);
        }
      }, (err) => {
        console.warn('Could not fetch news from Firestore, using default articles:', err);
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      // ignore
    }
  }, []);

  const filteredArticles = articles.filter((art) => {
    if (activeTab === 'events') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchSummary = art.summary.toLowerCase().includes(q);
      const matchCat = art.category.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchCat) return false;
    }
    return true;
  });

  const filteredEvents = events.filter((evt) => {
    if (activeTab === 'news' || activeTab === 'circulars') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = evt.title.toLowerCase().includes(q);
      const matchDesc = evt.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <button 
              type="button" 
              onClick={onReturnToHome} 
              className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <span className="text-slate-500">/</span>
            <span className="text-amber-400 font-semibold">Events, News & Editorial Gazette</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
              <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
              <span>Official Press Bureau</span>
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white py-16 sm:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold tracking-wide">
              <Newspaper className="w-4 h-4 text-amber-400" />
              <span>FATIMYAH EDUCATIONAL TRUST — MEDIA & EDITORIAL BUREAU</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Events, Circulars & Official Gazette
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Stay informed with official Trust communiqués, scholarship deadlines, competitive examination dates, academic research whitepapers, and public community dispatches.
            </p>
          </div>

          {/* Featured Breaking News Card */}
          {articles[0] && (
            <div className="p-6 sm:p-7 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 max-w-4xl space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white uppercase tracking-wider">
                  Featured Circular
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {articles[0].date} • {articles[0].readTime}
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                  {articles[0].title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                  {articles[0].summary}
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => onReadArticle(articles[0])}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Read Official Dispatch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Tabbed Listing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Navigation & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Dispatches
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'events'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Events ({events.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('news')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'news'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>News & Articles ({articles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('circulars')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'circulars'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Circulars & Whitepapers</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars, events..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Events Schedule Section (if activeTab !== 'news' && !== 'circulars') */}
        {filteredEvents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-700" />
                <span>Upcoming Events & Conclaves</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Official Trust Calendar 2026</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {event.category}
                      </span>

                      <div className="text-right">
                        <span className="text-lg font-black text-indigo-900 leading-none block">{event.day}</span>
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">{event.month}</span>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">{event.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Expected: {event.expectedAttendees}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="w-full block py-2 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold">
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News & Editorial Articles Section */}
        {filteredArticles.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-emerald-700" />
                <span>Editorial Gazette & News Dispatches</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Official Releases & Circulars</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-slate-900 backdrop-blur-xs shadow-xs">
                          {article.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>{article.date}</span>
                        <span>{article.readTime}</span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                        {article.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">{article.author}</span>
                    <button
                      type="button"
                      onClick={() => onReadArticle(article)}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Full Story</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Press & Media Relations Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-xl font-bold text-slate-900">Official Media & Press Enquiries</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Accredited journalists, community publications, and academic researchers seeking press releases, high-resolution logos, or interview requests with Trust spokespersons can reach our Public Relations Secretariat.
            </p>
            <div className="text-xs font-mono text-slate-500">
              Direct Press Desk: press@fetindia.com • +91 22 2876 5432
            </div>
          </div>

          {onOpenDonate && (
            <button
              type="button"
              onClick={onOpenDonate}
              className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Support Trust Educational Journalism (80G)
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
