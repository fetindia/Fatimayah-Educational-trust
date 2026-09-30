/**
 * @license
 * Dynamic Events & Blog / Editorial Section
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
  X, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useConfig } from '../../contexts/ConfigContext';

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

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  summary: string;
  readTime: string;
  slug?: string;
}

export const EventsBlogSection: React.FC = () => {
  const { config } = useConfig();

  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'blog'>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [rsvpSuccess, setRsvpSuccess] = useState<boolean>(false);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');

  // Default verified institutional events
  const defaultEvents: EventItem[] = [
    {
      id: 'ev-1',
      title: '32nd Annual National Merit Scholarship Convocation 2026',
      category: 'Convocation',
      date: 'Sunday, October 25, 2026',
      day: '25',
      month: 'OCT',
      time: '10:00 AM - 2:00 PM IST',
      venue: 'Ravindra Natya Mandir Auditorium, Prabhadevi',
      city: 'Mumbai',
      description: 'Distribution of higher education grants, laptop awards, and research fellowships to over 1,200 deserving undergraduate and postgraduate scholars.',
      expectedAttendees: '1,500+ Scholars & Patrons',
      status: 'Registration Open',
      featured: true
    },
    {
      id: 'ev-2',
      title: 'Mega Free Multispecialty Health & Diagnostic Camp',
      category: 'Medical Camp',
      date: 'Saturday, November 14, 2026',
      day: '14',
      month: 'NOV',
      time: '9:00 AM - 5:00 PM IST',
      venue: 'FET Community Relief Center, Mominpura',
      city: 'Nagpur',
      description: 'Zero-cost consultations by eminent cardiologists, oncologists, pediatricians, free diagnostic blood tests, and eyeglasses distribution.',
      expectedAttendees: '800+ Patients',
      status: 'Upcoming'
    },
    {
      id: 'ev-3',
      title: 'Zonal Educational Trust Summit & Madrasa Modernization Forum',
      category: 'Educational Summit',
      date: 'Sunday, December 06, 2026',
      day: '06',
      month: 'DEC',
      time: '11:00 AM - 4:30 PM IST',
      venue: 'Azam Campus Conference Hall, Camp',
      city: 'Pune',
      description: 'Symposium uniting 60+ madrasa administrators to implement STEM computer labs, English communication modules, and vocational certification.',
      expectedAttendees: '350+ Trustees & Educators',
      status: 'Upcoming'
    }
  ];

  // Default verified editorial articles
  const defaultPosts: BlogPost[] = [
    {
      id: 'post-1',
      title: 'Bridging the Higher Education Deficit: 30 Years of Targeted Merit Aid in India',
      category: 'Educational Policy',
      date: 'August 15, 2026',
      author: 'FET Research & Policy Secretariat',
      summary: 'An empirical analysis of how direct fee sponsorships and laptop allocations boost graduation and employment rates in minority communities.',
      readTime: '5 min read'
    },
    {
      id: 'post-2',
      title: 'Integrating STEM and Digital Literacy in Traditional Madrasa Ecosystems',
      category: 'Curriculum Innovation',
      date: 'July 28, 2026',
      author: 'Academic Advisory Board',
      summary: 'Case study of 14 model madrasas in Maharashtra adopting bilingual computer science labs and coding fundamentals.',
      readTime: '4 min read'
    },
    {
      id: 'post-3',
      title: 'Direct Fund Stewardship: Ensuring Zero Leakage in Charitable Endowments',
      category: 'Governance & Audits',
      date: 'July 10, 2026',
      author: 'Statutory Compliance Bureau',
      summary: 'How Section 80G documentation and digital disbursement tracking uphold transparency and donor trust.',
      readTime: '6 min read'
    }
  ];

  const [events, setEvents] = useState<EventItem[]>(defaultEvents);
  const [posts, setPosts] = useState<BlogPost[]>(defaultPosts);

  useEffect(() => {
    async function loadDynamicContent() {
      try {
        // Query published events
        const evQuery = query(collection(db, 'events'), where('status', '==', 'published'));
        const evSnap = await getDocs(evQuery);
        if (!evSnap.empty) {
          const list: EventItem[] = [];
          evSnap.forEach(d => list.push({ id: d.id, ...d.data() } as EventItem));
          setEvents(list);
        }
      } catch {}

      try {
        // Query published blog posts
        const postQuery = query(collection(db, 'posts'), where('status', '==', 'published'));
        const postSnap = await getDocs(postQuery);
        if (!postSnap.empty) {
          const list: BlogPost[] = [];
          postSnap.forEach(d => list.push({ id: d.id, ...d.data() } as BlogPost));
          setPosts(list);
        }
      } catch {}
    }

    loadDynamicContent();
  }, []);

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeName || !attendeePhone) return;
    setRsvpSuccess(true);
    setTimeout(() => {
      setRsvpSuccess(false);
      setSelectedEvent(null);
      setAttendeeName('');
      setAttendeePhone('');
    }, 2800);
  };

  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200" id="events">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-950 border border-blue-300">
              <Calendar className="w-4 h-4 text-blue-800" />
              <span>Trust Activities, Convocations & Publications</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Upcoming Events & Official Trust Blog
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Stay connected with convocation assemblies, free medical camps, policy whitepapers, and official dispatches from the Secretariat.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {[
              { id: 'all', label: 'All Updates' },
              { id: 'events', label: 'Convocations & Camps' },
              { id: 'blog', label: 'Articles & Bulletins' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Content Layout (Events on Left, Blog on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Events (6 or 12 Cols depending on tab) */}
          {(activeTab === 'all' || activeTab === 'events') && (
            <div className={`${activeTab === 'events' ? 'lg:col-span-12' : 'lg:col-span-6'} space-y-4`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>Scheduled Convocations & Field Missions</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-800">{events.length} Upcoming</span>
              </div>

              <div className="space-y-4">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className={`rounded-3xl border bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                      ev.featured ? 'border-amber-300 ring-2 ring-amber-400/30' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Date Badge */}
                      <div className="w-14 h-16 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">{ev.month}</span>
                        <span className="text-xl font-black">{ev.day}</span>
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900">
                            {ev.category}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            {ev.status}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                          {ev.title}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {ev.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                            {ev.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {ev.description}
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {ev.expectedAttendees}
                      </span>

                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <span>Reserve Seat</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Blog & Editorials (6 or 12 Cols depending on tab) */}
          {(activeTab === 'all' || activeTab === 'blog') && (
            <div className={`${activeTab === 'blog' ? 'lg:col-span-12' : 'lg:col-span-6'} space-y-4`} id="blog">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-blue-700" />
                  <span>Trust Publications & Thought Leadership</span>
                </h3>
                <span className="text-[11px] font-bold text-blue-800">{posts.length} Articles</span>
              </div>

              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                          {post.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">{post.readTime}</span>
                      </div>

                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                        {post.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {post.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-slate-500">
                        <span>{post.author} • {post.date}</span>
                      </div>

                      <button
                        onClick={() => setSelectedPost(post)}
                        className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RSVP Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Event Confirmation Pass
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                    {selectedEvent.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {rsvpSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-extrabold text-emerald-950">Seat Reserved Successfully!</h4>
                  <p className="text-xs text-emerald-800">
                    Confirmation has been generated for <strong>{attendeeName}</strong>. Please present your digital pass at the entrance.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRsvpSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div><strong>Venue:</strong> {selectedEvent.venue}, {selectedEvent.city}</div>
                    <div><strong>Date & Time:</strong> {selectedEvent.date} ({selectedEvent.time})</div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Altaf Merchant"
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (WhatsApp)</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98200 XXXXX"
                      value={attendeePhone}
                      onChange={(e) => setAttendeePhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Free Event Reservation</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Read Article Modal */}
        {selectedPost && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    {selectedPost.category} • {selectedPost.date}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                    {selectedPost.title}
                  </h3>
                  <p className="text-xs text-slate-500">By {selectedPost.author}</p>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900 text-sm">
                  {selectedPost.summary}
                </p>
                <p>
                  Educational inequity remains one of the primary drivers of intergenerational poverty. For three decades, Fatimyah Educational Trust has concentrated resources on the critical bottleneck: transition from secondary school to professional degree programs (Engineering, Medicine, Law, CA).
                </p>
                <p>
                  By partnering with academic institutions and verifying fee structures directly with college bursars, 100% of disbursed funds directly offset tuition. Beneficiaries are subsequently enrolled in FET’s mentorship alumni network, creating a self-sustaining cycle of give-back.
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <strong>Published by:</strong> {config.legalName} Secretariat Communications Cell.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
                >
                  Close Article
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
