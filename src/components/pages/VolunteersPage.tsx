/**
 * @license
 * Dedicated Full Webpage: Volunteer Platform & Humanitarian Field Corps
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Users, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  MapPin, 
  Send, 
  ArrowLeft,
  IdCard,
  QrCode,
  GraduationCap,
  BookOpen,
  Building2,
  Calendar,
  Compass,
  Check,
  UserCheck
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';

interface VolunteersPageProps {
  onOpenAuth: () => void;
  onOpenUserDashboard?: () => void;
  onReturnToHome: () => void;
  onOpenDonate?: () => void;
}

export const VolunteersPage: React.FC<VolunteersPageProps> = ({
  onOpenAuth,
  onOpenUserDashboard,
  onReturnToHome,
  onOpenDonate
}) => {
  const { config } = useConfig();
  const { currentUser } = useAuth();

  // Registration Form State
  const [volName, setVolName] = useState('');
  const [volEmail, setVolEmail] = useState('');
  const [volPhone, setVolPhone] = useState('');
  const [volCity, setVolCity] = useState('');
  const [volSkillWing, setVolSkillWing] = useState('Academic Tutoring & Student Mentorship');
  const [volAvailability, setVolAvailability] = useState('2-4 Hours on Weekends');
  const [volMotivation, setVolMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedVolunteerId, setSubmittedVolunteerId] = useState<string | null>(null);

  const wings = [
    {
      id: 'academic',
      title: 'Academic Tutoring & Mentorship',
      icon: GraduationCap,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Mentor Class 9-12 students in Mathematics, Science, and English, or conduct career guidance sessions for higher education aspirants.',
      roles: ['Weekend Remedial Tutor', 'Career & Entrance Mentor', 'Study Material Curator']
    },
    {
      id: 'field_relief',
      title: 'Field Relief & Welfare Logistics',
      icon: HeartHandshake,
      color: 'bg-rose-100 text-rose-800 border-rose-300',
      description: 'Support on-ground ration distribution, widow sustenance packing, patient home verification, and disaster relief task forces.',
      roles: ['Ration Logistics Coordinator', 'Home Verification Officer', 'Disaster Relief Responder']
    },
    {
      id: 'exam_proctor',
      title: 'Exam Coordination & Center Proctoring',
      icon: BookOpen,
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      description: 'Assist in managing state-wide examination venues, verifying student hall tickets, monitoring exam rooms, and coordinating test papers.',
      roles: ['Test Center Coordinator', 'Hall Ticket Verification Officer', 'Exam Room Proctor']
    },
    {
      id: 'tech_media',
      title: 'Technology, Design & Media Corps',
      icon: Compass,
      color: 'bg-sky-100 text-sky-800 border-sky-300',
      description: 'Contribute professional software development, social media advocacy, graphic design, newsletter layout, and video editing for Trust missions.',
      roles: ['Web & Platform Volunteer', 'Creative Designer / Video Editor', 'Social Media Campaigner']
    },
    {
      id: 'medical_camps',
      title: 'Healthcare & Patient Assistance',
      icon: Users,
      color: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Volunteer at free diagnostic health camps, assist elderly patients at empanelled dialysis centers, and organize blood donation drives.',
      roles: ['Camp Registration Desk', 'Patient Transport Liaison', 'Blood Donor Registry Lead']
    },
    {
      id: 'community_legal',
      title: 'Civic Documentation & Legal Aid',
      icon: ShieldCheck,
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      description: 'Help economically vulnerable citizens apply for government scholarships, ration cards, Aadhaar corrections, and disability certifications.',
      roles: ['Govt Scheme Facilitator', 'Document Helpdesk Executive', 'Community Outreach Lead']
    }
  ];

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volName || !volPhone) return;
    setSubmitting(true);

    try {
      const generatedId = `FET-VOL-${Math.floor(1000 + Math.random() * 9000)}`;
      await addDoc(collection(db, 'volunteer_applications'), {
        volunteerCode: generatedId,
        fullName: volName,
        email: volEmail,
        phone: volPhone,
        city: volCity,
        wing: volSkillWing,
        availability: volAvailability,
        motivation: volMotivation,
        status: 'ACTIVE_CANDIDATE',
        userId: currentUser?.uid || null,
        createdAt: serverTimestamp()
      });
      setSubmittedVolunteerId(generatedId);
    } catch (err) {
      console.warn('Could not write to volunteer_applications in Firestore:', err);
      // Fallback local acknowledgment
      setSubmittedVolunteerId(`FET-VOL-${Math.floor(1000 + Math.random() * 9000)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <button 
              type="button" 
              onClick={onReturnToHome} 
              className="hover:text-teal-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <span className="text-slate-500">/</span>
            <span className="text-teal-400 font-semibold">Volunteer Platform & Field Corps</span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <button
                type="button"
                onClick={onOpenUserDashboard}
                className="px-3 py-1 rounded-full bg-teal-800 hover:bg-teal-700 text-teal-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>My Volunteer Service Logbook</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Volunteer Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white py-16 sm:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold tracking-wide">
              <HeartHandshake className="w-4 h-4 text-teal-400" />
              <span>FATIMYAH EDUCATIONAL TRUST — NATIONWIDE VOLUNTEER CADRE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Serve With Purpose. Elevate Communities.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Step into the forefront of change. Whether mentoring a first-generation college student, packing emergency food rations, or proctoring national exams, your time and skills create measurable impact across India.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#volunteer-register"
                className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-teal-950/40 transition-all flex items-center gap-2"
              >
                <span>Register as a Volunteer</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#volunteer-wings"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm transition-all flex items-center gap-2"
              >
                <span>Browse Volunteer Wings</span>
              </a>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-teal-400">1,850+</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Enrolled Volunteers</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">45,000+</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Verified Service Hours</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-sky-400">18 Chapters</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Active District Units</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-purple-400">100%</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Digital Service Badges</div>
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Wings Grid */}
      <section id="volunteer-wings" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Specialized Volunteer Wings & Missions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Choose where your skills can create the highest direct value for underprivileged communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wings.map((wing) => {
            const Icon = wing.icon;
            return (
              <div
                key={wing.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{wing.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{wing.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Key Volunteer Roles
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {wing.roles.map((r, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="text-[11px]">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVolSkillWing(wing.title);
                      const el = document.getElementById('volunteer-register');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Select This Wing
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Volunteer Lifecycle & Badges */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <Award className="w-3.5 h-3.5 text-teal-600" />
              <span>Recognition & Verification Journey</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How the FET Volunteer Platform Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              A transparent, dignified experience designed to honor your dedication and track your service hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-black flex items-center justify-center text-xs">
                01
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Online Enrolment</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register your skills, preferred chapter, and hours. Receive your provisional Volunteer Identification Token.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs">
                02
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Chapter Induction</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Attend a short briefing with the District Chapter Commander and receive your Digital Volunteer Badge.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs">
                03
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Field Mission Deployment</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accept field missions (exam proctoring, teaching sessions, medical camp desks) matching your schedule.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black flex items-center justify-center text-xs">
                04
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Verified Certificates & Badges</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log service hours verified by the Volunteer Admin. Generate accredited community service certificates for college/jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Online Volunteer Registration Form */}
      <section id="volunteer-register" className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200">
            <HeartHandshake className="w-3.5 h-3.5 text-teal-700" />
            <span>Enlist in the Field Force</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Volunteer Enrolment Application
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Join a family of change-makers. No prior experience required — just pure dedication.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
          {submittedVolunteerId ? (
            <div className="py-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Welcome to the FET Volunteer Cadre!</h3>
                <p className="text-xs text-slate-600">
                  Your official volunteer enrolment token is:
                </p>
                <div className="font-mono text-base font-bold text-teal-700 py-2 bg-teal-50 rounded-xl border border-teal-100 mt-2">
                  {submittedVolunteerId}
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our Volunteer Admin Directorate has received your profile and will connect with you via WhatsApp to introduce your local Chapter lead.
              </p>
              <button
                type="button"
                onClick={() => setSubmittedVolunteerId(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Register Another Volunteer
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={volName}
                    onChange={(e) => setVolName(e.target.value)}
                    placeholder="e.g. Zainab Merchant"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={volPhone}
                    onChange={(e) => setVolPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={volEmail}
                    onChange={(e) => setVolEmail(e.target.value)}
                    placeholder="volunteer@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">City / District *</label>
                  <input
                    type="text"
                    required
                    value={volCity}
                    onChange={(e) => setVolCity(e.target.value)}
                    placeholder="e.g. Mumbai / Thane / Pune"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Preferred Volunteer Wing *</label>
                  <select
                    value={volSkillWing}
                    onChange={(e) => setVolSkillWing(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {wings.map((w) => (
                      <option key={w.id} value={w.title}>
                        {w.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Available Time Commitment *</label>
                  <select
                    value={volAvailability}
                    onChange={(e) => setVolAvailability(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="2-4 Hours on Weekends">2-4 Hours on Weekends</option>
                    <option value="5-8 Hours / Week">5-8 Hours / Week</option>
                    <option value="Full-time during Exam / Relief Operations">Full-time during Exam / Relief Operations</option>
                    <option value="Remote / Digital Volunteer (Flexible)">Remote / Digital Volunteer (Flexible)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Why would you like to volunteer with FET India?</label>
                <textarea
                  rows={3}
                  value={volMotivation}
                  onChange={(e) => setVolMotivation(e.target.value)}
                  placeholder="Share a brief word about your skills, background, or motivation..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Enlisting Your Profile...</span>
                  ) : (
                    <>
                      <span>Submit Volunteer Enrolment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
