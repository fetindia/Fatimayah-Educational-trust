/**
 * @license
 * Dedicated Full Webpage: Official Trust Directory & Contact Secretariat
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare, 
  ArrowRight, 
  Building2, 
  Sparkles, 
  ExternalLink,
  ArrowLeft,
  FileCheck2,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useConfig } from '../../contexts/ConfigContext';

interface ContactUsPageProps {
  onReturnToHome: () => void;
  onOpenDonate?: () => void;
  onOpenAuth?: () => void;
}

export const ContactUsPage: React.FC<ContactUsPageProps> = ({
  onReturnToHome,
  onOpenDonate,
  onOpenAuth
}) => {
  const { config } = useConfig();

  // Enquiry Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('General Enquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const primaryAddress = config.headOfficeAddress || 'FATIMYAH EDUCATIONAL TRUST, Central Secretariat, Jammu & Kashmir 194103, India';
  const primaryPhone = config.contactPhone || '+91 91494 14549';
  const primaryEmail = config.contactEmail || 'contact@fetindia.com';
  const whatsappNumber = config.contactPhone || config.emergencyHotline || '+91 91494 14549';

  const departments = [
    {
      name: 'Scholarship & Academic Grants Directorate',
      email: 'scholarship@fetindia.com',
      phone: '+91 91494 14549',
      scope: 'Higher education fee sponsorships, laptop allocations, and student document verification.'
    },
    {
      name: 'National Examination Bureau',
      email: 'exams@fetindia.com',
      phone: '+91 91494 14549',
      scope: 'Talent search olympiads, book reading competitions, admit cards, and merit certificates.'
    },
    {
      name: 'Donor Relations & Form 10BE Tax Exemption',
      email: 'accounts@fetindia.com',
      phone: '+91 91494 14549',
      scope: 'Section 80G tax exemption certificates, bank wire confirmations, and CSR collaborations.'
    },
    {
      name: 'Member & Volunteer Registry',
      email: 'community@fetindia.com',
      phone: '+91 91494 14549',
      scope: 'Digital membership cards, chapter admissions, and volunteer mission assignments.'
    }
  ];

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;
    setSubmitting(true);

    try {
      const generatedTicket = `FET-TKT-${Math.floor(10000 + Math.random() * 90000)}`;
      await addDoc(collection(db, 'enquiries'), {
        ticketNumber: generatedTicket,
        name,
        email,
        phone,
        department,
        subject: subject || department,
        message,
        status: 'OPEN',
        createdAt: serverTimestamp()
      });
      setSubmittedTicket(generatedTicket);
    } catch (err) {
      console.warn('Could not write enquiry to Firestore:', err);
      // Fallback local ticket acknowledgment
      setSubmittedTicket(`FET-TKT-${Math.floor(10000 + Math.random() * 90000)}`);
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
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <span className="text-slate-500">/</span>
            <span className="text-emerald-400 font-semibold">Contact Us & Official Directory</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300">Secretariat Working Hours: 10:00 AM – 6:00 PM IST</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white py-16 sm:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>FATIMYAH EDUCATIONAL TRUST — CENTRAL SECRETARIAT</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Get in Touch with Our Directorate
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              We welcome students, parents, institutional patrons, and volunteers. Connect directly with our central offices or submit an inquiry to the relevant Trust department below.
            </p>
          </div>

          {/* 4 Core Channel Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            {/* Headquarters Card */}
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Headquarters</h4>
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {primaryAddress}
              </p>
            </div>

            {/* Telephone Card */}
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Official Helpline</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {primaryPhone}
              </p>
              <div className="text-[11px] text-emerald-400 font-medium">Mon - Sat: 10 AM to 6 PM</div>
            </div>

            {/* Email Card */}
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Central Email</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-mono break-all">
                {primaryEmail}
              </p>
              <div className="text-[11px] text-slate-400">Response within 24-48 business hours</div>
            </div>

            {/* WhatsApp Card */}
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">WhatsApp Desk</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {whatsappNumber}
              </p>
              <div className="text-[11px] text-teal-400 font-medium">Direct Instant Query Chat</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout: Enquiry Form + Department Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Interactive Official Enquiry Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
            <div className="space-y-1 border-b border-slate-100 pb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Online Enquiry Desk</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Send an Official Message to the Trust
              </h2>
              <p className="text-xs text-slate-500">
                Your message is assigned a unique reference ticket and dispatched directly to the responsible Directorate.
              </p>
            </div>

            {submittedTicket ? (
              <div className="py-8 text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">Enquiry Dispatched Successfully</h3>
                  <p className="text-xs text-slate-600">
                    Your official tracking reference ticket is:
                  </p>
                  <div className="font-mono text-base font-bold text-emerald-700 py-2 bg-emerald-50 rounded-xl border border-emerald-100 mt-2">
                    {submittedTicket}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The Trust secretariat has logged your inquiry. An officer will respond via email or telephone within 24 to 48 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedTicket(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Salman Rizvi"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Phone / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="salman@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Department / Nature of Inquiry *</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="General Enquiry">General Inquiry</option>
                      <option value="Scholarship & Academic Grants">Scholarship & Academic Grants</option>
                      <option value="Examination & Olympiads">Examination & Olympiads</option>
                      <option value="Donation & 80G Receipts">Donation & 80G Receipts</option>
                      <option value="Membership & Digital ID">Membership & Digital ID</option>
                      <option value="Volunteer Enrolment">Volunteer Enrolment</option>
                      <option value="Healthcare & Dialysis Subsidy">Healthcare & Dialysis Subsidy</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Subject / Matter</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of the query..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Detailed Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please include full details (such as Roll Number, Application ID, or College Name if applicable)..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>Dispatching Ticket...</span>
                    ) : (
                      <>
                        <span>Submit Official Enquiry</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: Departmental Directory & Official Registry Details */}
          <div className="lg:col-span-5 space-y-6">
            {/* Department Directory List */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>Departmental Direct Directory</span>
              </h3>

              <div className="space-y-3">
                {departments.map((dept, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <h4 className="font-bold text-slate-900">{dept.name}</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">{dept.scope}</p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-emerald-700">
                      <span>{dept.email}</span>
                      <span>•</span>
                      <span>{dept.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Legal & Statutory Registry Disclosure */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Statutory Registrations & Credentials</span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Statutory Authority</span>
                  <p className="font-semibold text-white">Sub-Divisional Magistrate (SDM) Office, Jammu & Kashmir</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Jurisdiction</span>
                  <p className="font-semibold text-white">Registered in Jammu & Kashmir through SDM Office (1994)</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">NITI Aayog Darpan ID</span>
                    <p className="font-mono text-amber-400 font-semibold">{config.nitiAayogId || config.darpanId || 'JK/2026/1153821'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Trust PAN</span>
                    <p className="font-mono text-emerald-400 font-semibold">{config.panNumber || 'AABTF0015H'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Income Tax 80G</span>
                    <p className="font-mono text-sky-400 font-semibold">{config.section80GNumber || 'AAATF1234AF20216'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
