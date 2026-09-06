/**
 * @license
 * Official Trust Events & Community Gatherings Section
 * Fatimyah Educational Trust India
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  HeartHandshake, 
  Sparkles,
  Share2,
  BellRing,
  X
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

interface EventItem {
  id: string;
  title: string;
  category: 'Convocation' | 'Medical Camp' | 'Scholarship Ceremony' | 'Community Forum';
  date: string;
  day: string;
  month: string;
  time: string;
  venue: string;
  city: string;
  description: string;
  expectedAttendees: string;
  status: 'Upcoming' | 'Registration Open' | 'Live Today';
  featured?: boolean;
}

export const EventsSection: React.FC = () => {
  const { config } = useConfig();
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [rsvpSuccess, setRsvpSuccess] = useState<boolean>(false);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [attendeeCount, setAttendeeCount] = useState('1');

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  const upcomingEvents: EventItem[] = [
    {
      id: 'event-1',
      title: '32nd Annual National Merit Scholarship Convocation 2026',
      category: 'Scholarship Ceremony',
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
      id: 'event-2',
      title: 'Mega Free Multispecialty Health & Diagnostic Camp',
      category: 'Medical Camp',
      date: 'Saturday, November 14, 2026',
      day: '14',
      month: 'NOV',
      time: '9:00 AM - 5:00 PM IST',
      venue: 'FET Community Relief Center, Mominpura',
      city: 'Nagpur',
      description: 'Free consultations by eminent cardiologists, pediatricians, oncologists, along with free blood work, ECGs, and complimentary medicine dispensing.',
      expectedAttendees: '800+ Patients',
      status: 'Upcoming'
    },
    {
      id: 'event-3',
      title: 'Zonal Educational Trust Summit & Madrasa Modernization Forum',
      category: 'Community Forum',
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

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeName.trim() || !attendeePhone.trim()) return;
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
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              <span>Trust Gatherings & Field Missions</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Upcoming Institutional Events & Convocations
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md">
            Join community summits, scholarship distributions, and medical outreaches across Maharashtra and Madhya Pradesh.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {upcomingEvents.map((ev) => (
            <div
              key={ev.id}
              className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md bg-white ${
                ev.featured ? 'border-amber-300 ring-2 ring-amber-400/30' : 'border-slate-200'
              }`}
            >
              {/* Event Card Header */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    ev.category === 'Scholarship Ceremony' ? 'bg-amber-100 text-amber-900' :
                    ev.category === 'Medical Camp' ? 'bg-rose-100 text-rose-900' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {ev.category}
                  </span>

                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {ev.status}
                  </span>
                </div>

                {/* Date & Time Highlight */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-16 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">{ev.month}</span>
                    <span className="text-xl font-black">{ev.day}</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {ev.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ev.time}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {ev.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-semibold text-slate-900">{ev.venue}, {ev.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{ev.expectedAttendees}</span>
                  </div>
                </div>
              </div>

              {/* Event Card Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => alert(`Event "${ev.title}" details link copied to clipboard!`)}
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>

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
                    An SMS confirmation and entry pass QR have been generated for <strong>{attendeeName}</strong>. Please present your pass at the reception desk.
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98200 XXXXX"
                        value={attendeePhone}
                        onChange={(e) => setAttendeePhone(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Number of Attendees</label>
                      <select
                        value={attendeeCount}
                        onChange={(e) => setAttendeeCount(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="1">1 Person</option>
                        <option value="2">2 Persons</option>
                        <option value="3">3 Persons</option>
                        <option value="4">4+ Delegation</option>
                      </select>
                    </div>
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

      </div>
    </section>
  );
};
