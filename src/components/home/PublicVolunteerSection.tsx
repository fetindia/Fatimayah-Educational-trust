/**
 * @license
 * Public Volunteer Inquiry & Registration Portal
 * Fatimyah Educational Trust India
 */

import React, { useState } from 'react';
import { 
  HeartHandshake, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  Calendar, 
  Users, 
  ArrowRight,
  ShieldCheck,
  Award,
  Clock,
  Send
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

export const PublicVolunteerSection: React.FC = () => {
  const { config } = useConfig();

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Mumbai',
    chapter: 'Mumbai Central Chapter',
    primarySkill: 'Academic Tutoring & Mentorship',
    availability: 'Weekends (Saturday / Sunday)'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200" id="volunteer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-950 border border-blue-300">
            <HeartHandshake className="w-4 h-4 text-blue-700" />
            <span>Join 1,850+ Active Trust Volunteers Across India</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Serve the Nation with Your Time, Professional Skills & Empathy
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Whether you are a medical doctor, educator, engineer, accountant, or passionate university student, your volunteer hours transform lives directly on the ground.
          </p>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Volunteer Opportunities & Benefits (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-4">
              
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-start gap-4 hover:border-slate-300 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black shrink-0 border border-emerald-200 shadow-xs">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Academic Tutoring & Career Guidance</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Mentor high school and polytechnic scholars in STEM, Computer Science, English communication, and competitive entrance coaching.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-start gap-4 hover:border-slate-300 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-black shrink-0 border border-blue-200 shadow-xs">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Free Medical & Health Camp Logistics</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Doctors, nurses, pharmacists, and field coordinators managing patient queues, vital signs diagnostics, and prescription dispensing.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-start gap-4 hover:border-slate-300 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black shrink-0 border border-amber-200 shadow-xs">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Talent Search Examination Proctoring</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Invigilate examination halls across 28 district centers, verify student hall tickets, and ensure strict academic integrity.
                  </p>
                </div>
              </div>

            </div>

            <div className="p-5 rounded-3xl bg-blue-900 text-white border border-blue-800 text-xs shadow-md space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Verified Certificate of Community Service</span>
              </div>
              <p className="text-blue-100 leading-relaxed text-xs">
                All registered FET India volunteers receive an official digital ID badge and a verified Certificate of Service recording logged hours for university credit and career portfolios.
              </p>
            </div>
          </div>

          {/* Right Column: Registration Form (6 Cols) */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-700" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-900">Volunteer Enlistment Registered!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Thank you <strong>{form.name}</strong>. Your profile has been assigned to the <strong>{form.chapter}</strong>. A Chapter Coordinator will contact you via WhatsApp for onboarding.
                  </p>
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  Submit Another Registration
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                    National Volunteer Onboarding
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">Volunteer Registration Form</h3>
                  <p className="text-slate-500 text-xs">Fill in your information to join the FET India field network.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Zainab Merchant"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="zainab@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">WhatsApp Mobile</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98200 XXXXX"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Primary Skill / Discipline</label>
                    <select
                      value={form.primarySkill}
                      onChange={(e) => setForm({ ...form, primarySkill: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="Academic Tutoring & Mentorship">Academic Tutoring & Mentorship</option>
                      <option value="Medical & Healthcare Logistics">Medical & Healthcare Logistics</option>
                      <option value="IT, Web & Digital Media">IT, Web & Digital Media</option>
                      <option value="Accounting & Audit Verification">Accounting & Audit Verification</option>
                      <option value="Event & Examination Proctoring">Event & Examination Proctoring</option>
                      <option value="Community Welfare & Food Drives">Community Welfare & Food Drives</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Nearest Trust Chapter</label>
                    <select
                      value={form.chapter}
                      onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="Mumbai Central Chapter">Mumbai Central Chapter</option>
                      <option value="Pune & Western MH Chapter">Pune & Western MH Chapter</option>
                      <option value="Nagpur & Vidarbha Chapter">Nagpur & Vidarbha Chapter</option>
                      <option value="Aurangabad & Marathwada">Aurangabad & Marathwada</option>
                      <option value="Bhopal / Indore MP Chapter">Bhopal / Indore MP Chapter</option>
                      <option value="Delhi NCR Chapter">Delhi NCR Chapter</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">General Availability</label>
                  <select
                    value={form.availability}
                    onChange={(e) => setForm({ ...form, availability: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Weekends (Saturday / Sunday)">Weekends (Saturday / Sunday)</option>
                    <option value="Weekdays (Evening)">Weekdays (Evening)</option>
                    <option value="Full Time During Drives & Camps">Full Time During Drives & Camps</option>
                    <option value="On-Call Emergency Support">On-Call Emergency Support</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>Register as FET India Volunteer</span>
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};

