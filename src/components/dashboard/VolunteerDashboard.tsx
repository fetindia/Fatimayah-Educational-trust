/**
 * @license
 * Volunteer Member Dashboard & Corps Service Center
 * Fatimyah Educational Trust India (FET India)
 * Module: Chapter 02 - Volunteer Operations, Activities & Community Management
 */

import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Award,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  ShieldCheck,
  QrCode,
  FileText,
  Send,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  GraduationCap,
  Download,
  Printer,
  X,
  Phone,
  Mail,
  UserCheck,
  Check,
  Activity,
  Bookmark
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  VolunteerApplication, 
  VolunteerActivity, 
  VolunteerServiceRecord, 
  CommunityGroup 
} from '../../types';
import { 
  db, 
  logVolunteerHours, 
  enrollInVolunteerActivity, 
  unenrollFromVolunteerActivity,
  DEFAULT_COMMUNITY_GROUPS
} from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs 
} from 'firebase/firestore';

interface VolunteerDashboardProps {
  onOpenApplication?: () => void;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
  onOpenApplication
}) => {
  const { currentUser, userProfile } = useAuth();

  const [volunteerApp, setVolunteerApp] = useState<VolunteerApplication | null>(null);
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [serviceLogs, setServiceLogs] = useState<VolunteerServiceRecord[]>([]);
  const [myCommunityGroup, setMyCommunityGroup] = useState<CommunityGroup | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'log_hours' | 'history' | 'my_chapter'>('overview');

  // Log Hours Form State
  const [logForm, setLogForm] = useState({
    activityTitle: '',
    category: 'Education & Tutoring',
    date: new Date().toISOString().split('T')[0],
    hoursServed: 4,
    location: '',
    description: ''
  });
  const [isSubmittingLog, setIsSubmittingLog] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Certificate Modal State
  const [selectedCertRecord, setSelectedCertRecord] = useState<VolunteerServiceRecord | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setFeedbackNotice({ type, text });
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  // 1. Fetch user's approved volunteer application and record
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'volunteerApplications'),
      where('applicantUid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const app = { id: snap.docs[0].id, ...snap.docs[0].data() } as VolunteerApplication;
        setVolunteerApp(app);
      } else {
        setVolunteerApp(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 2. Fetch available and assigned activities
  useEffect(() => {
    const q = query(
      collection(db, 'volunteer_activities'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: VolunteerActivity[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as VolunteerActivity);
      });
      setActivities(list);
    }, (err) => {
      console.warn('Activities fetch note:', err);
    });

    return () => unsubscribe();
  }, []);

  // 3. Fetch user's volunteer service logs
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'volunteer_history'),
      where('volunteerUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: VolunteerServiceRecord[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as VolunteerServiceRecord);
      });
      setServiceLogs(list);
    }, (err) => {
      console.warn('Service logs fetch note:', err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 4. Fetch community chapter info
  useEffect(() => {
    if (!currentUser) return;

    const fetchGroup = async () => {
      try {
        const q = query(
          collection(db, 'community_groups'),
          where('memberVolunteerIds', 'array-contains', currentUser.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setMyCommunityGroup({ id: snap.docs[0].id, ...snap.docs[0].data() } as CommunityGroup);
        } else {
          // Check default groups based on user state or first default
          const matchedDefault = DEFAULT_COMMUNITY_GROUPS.find(
            g => g.region.toLowerCase().includes((userProfile?.state || '').toLowerCase())
          ) || DEFAULT_COMMUNITY_GROUPS[0];
          setMyCommunityGroup(matchedDefault as CommunityGroup);
        }
      } catch (err) {
        console.warn('Community group fetch note:', err);
      }
    };

    fetchGroup();
  }, [currentUser, userProfile?.state]);

  // Calculations
  const verifiedHours = serviceLogs
    .filter(log => log.status === 'approved')
    .reduce((sum, log) => sum + (Number(log.hoursServed) || 0), 0);

  const pendingHours = serviceLogs
    .filter(log => log.status === 'pending_verification')
    .reduce((sum, log) => sum + (Number(log.hoursServed) || 0), 0);

  const assignedOrEnrolledActivities = activities.filter(act => 
    (currentUser && act.assignedVolunteerIds?.includes(currentUser.uid)) ||
    (currentUser && act.enrolledVolunteerIds?.includes(currentUser.uid))
  );

  const volunteerIdDisplay = volunteerApp?.volunteerIdAssigned || userProfile?.volunteerId || 'FET-VOL-ACTIVE';
  const volunteerName = volunteerApp?.fullLegalName || userProfile?.fullLegalName || currentUser?.displayName || 'Volunteer Member';

  // Activity enrollment handler
  const handleEnroll = async (act: VolunteerActivity) => {
    if (!act.id || !currentUser) return;
    try {
      await enrollInVolunteerActivity(act.id, {
        uid: currentUser.uid,
        email: currentUser.email || '',
        name: volunteerName
      });
      notify('success', `✓ Successfully enrolled in "${act.title}"!`);
    } catch (err: any) {
      notify('error', `Enrollment failed: ${err.message}`);
    }
  };

  const handleUnenroll = async (act: VolunteerActivity) => {
    if (!act.id || !currentUser) return;
    try {
      await unenrollFromVolunteerActivity(act.id, currentUser.uid);
      notify('success', `✓ Withdrew enrollment from "${act.title}".`);
    } catch (err: any) {
      notify('error', `Withdrawal failed: ${err.message}`);
    }
  };

  // Submit hours handler
  const handleLogHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.activityTitle.trim()) {
      notify('error', 'Please enter the mission or activity title.');
      return;
    }
    if (logForm.hoursServed <= 0) {
      notify('error', 'Please enter valid service hours.');
      return;
    }
    if (!currentUser) return;

    setIsSubmittingLog(true);
    try {
      await logVolunteerHours({
        volunteerUid: currentUser.uid,
        volunteerId: volunteerIdDisplay,
        volunteerName,
        volunteerEmail: currentUser.email || userProfile?.email || '',
        activityTitle: logForm.activityTitle.trim(),
        category: logForm.category,
        date: logForm.date,
        hoursServed: Number(logForm.hoursServed),
        location: logForm.location.trim() || volunteerApp?.district || 'Field Activity',
        description: logForm.description.trim()
      }, {
        uid: currentUser.uid,
        email: currentUser.email || ''
      });

      notify('success', '✓ Service hours logged successfully! Awaiting Secretariat verification.');
      setLogForm({
        activityTitle: '',
        category: 'Education & Tutoring',
        date: new Date().toISOString().split('T')[0],
        hoursServed: 4,
        location: '',
        description: ''
      });
      setActiveTab('history');
    } catch (err: any) {
      notify('error', `Failed to log service hours: ${err.message}`);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">Loading Volunteer Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="volunteer-member-dashboard">
      
      {/* Top Banner Notice */}
      {feedbackNotice && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
          feedbackNotice.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          {feedbackNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackNotice.text}</span>
        </div>
      )}

      {/* Volunteer Digital ID & Header Card */}
      <div className="relative overflow-hidden bg-radial from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-lg">
        {/* Subtle decorative background watermark */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-5 pointer-events-none text-white">
          <HeartHandshake className="w-96 h-96" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              {volunteerApp?.photoURL || userProfile?.photoURL ? (
                <img
                  src={volunteerApp?.photoURL || userProfile?.photoURL}
                  alt={volunteerName}
                  referrerPolicy="no-referrer"
                  className="w-18 h-18 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                />
              ) : (
                <div className="w-18 h-18 rounded-2xl bg-emerald-800 text-white font-black text-2xl flex items-center justify-center border-2 border-emerald-400">
                  {volunteerName[0]?.toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Official FET Volunteer
                </span>
                <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  ID: {volunteerIdDisplay}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {volunteerName}
              </h1>
              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {volunteerApp?.district || userProfile?.city || 'Regional Chapter'}, {volunteerApp?.state || userProfile?.state || 'India'}
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Wing: {volunteerApp?.assignedWing || volunteerApp?.areasOfInterest?.[0] || 'Community Service'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-28">
              <div className="text-2xl font-black text-emerald-400">{verifiedHours}</div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Verified Hours</span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-28">
              <div className="text-2xl font-black text-amber-300">{pendingHours}</div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Pending Hours</span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-28">
              <div className="text-2xl font-black text-blue-300">{assignedOrEnrolledActivities.length}</div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Active Missions</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Inducted Volunteer • Governed by Fatimyah Educational Trust Secretariat</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenApplication && (
              <button
                onClick={onOpenApplication}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer transition-colors"
              >
                View / Edit Application
              </button>
            )}
            <button
              onClick={() => setActiveTab('log_hours')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Service Hours</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors ${
            activeTab === 'overview'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Overview & Quick Actions
        </button>

        <button
          onClick={() => setActiveTab('missions')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'missions'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Available & Assigned Missions</span>
          {activities.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {activities.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('log_hours')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors ${
            activeTab === 'log_hours'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          + Log Service Hours
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Service History & Certificates</span>
          {serviceLogs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-900 font-bold">
              {serviceLogs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_chapter')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors ${
            activeTab === 'my_chapter'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          My Chapter & Wing
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Main Grid: Upcoming Missions + Community Wing */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Assigned & Upcoming Missions */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  <span>My Active & Upcoming Missions</span>
                </h3>
                <button
                  onClick={() => setActiveTab('missions')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {assignedOrEnrolledActivities.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">No Missions Assigned Yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Explore the upcoming field activities or self-enroll in educational coaching and healthcare camps.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('missions')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Browse Available Missions
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedOrEnrolledActivities.slice(0, 3).map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {act.category}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 mt-1">{act.title}</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-900 border border-blue-200">
                          {act.hoursCredit} Hours Credit
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{act.description}</p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                            {act.date} {act.time ? `• ${act.time}` : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {act.location}
                          </span>
                        </div>

                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          Enrolled Volunteer
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 1 Col: Assigned Chapter & Quick Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>My Regional Chapter</span>
              </h3>

              {myCommunityGroup ? (
                <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      {myCommunityGroup.code}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 mt-0.5">
                      {myCommunityGroup.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {myCommunityGroup.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Chapter Lead:</span>
                      <span className="font-bold text-slate-900">{myCommunityGroup.leaderName}</span>
                    </div>
                    {myCommunityGroup.leaderEmail && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Lead Email:</span>
                        <span className="font-mono text-slate-800 text-[11px]">{myCommunityGroup.leaderEmail}</span>
                      </div>
                    )}
                    {myCommunityGroup.leaderPhone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Contact:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">{myCommunityGroup.leaderPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Region:</span>
                      <span className="font-semibold text-emerald-800">{myCommunityGroup.region}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('my_chapter')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    View Chapter Details
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-500">No chapter assigned yet.</p>
                </div>
              )}
            </div>

          </div>

          {/* Recent Service Logs Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>Recent Volunteer Service Logs</span>
              </h3>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Record</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {serviceLogs.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                You haven't logged any volunteer hours yet. Complete your first mission and log your hours for verification!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {serviceLogs.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-slate-900 text-xs line-clamp-1">{log.activityTitle}</h5>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        log.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-900'
                          : log.status === 'rejected'
                          ? 'bg-rose-100 text-rose-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {log.status === 'approved' ? 'Verified' : log.status === 'rejected' ? 'Declined' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{log.description || 'Service rendered in local chapter.'}</p>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-1 border-t border-slate-100">
                      <span>{log.date}</span>
                      <span className="text-emerald-700 font-bold">{log.hoursServed} hrs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 2. MISSIONS TAB */}
      {activeTab === 'missions' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Volunteer Mission Board</h3>
              <p className="text-xs text-slate-500">Participate in verified educational drives, relief camps, and community initiatives.</p>
            </div>

            <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
              {activities.length} Total Missions
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">No Active Missions at This Moment</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Trust coordinators are scheduling upcoming educational and healthcare relief camps. Check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((act) => {
                const isEnrolled = (currentUser && act.enrolledVolunteerIds?.includes(currentUser.uid)) ||
                                   (currentUser && act.assignedVolunteerIds?.includes(currentUser.uid));
                return (
                  <div
                    key={act.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {act.category}
                        </span>

                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-900 border border-blue-200">
                          +{act.hoursCredit} Hours Credit
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900">{act.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>

                      {/* Required Skills */}
                      {act.requiredSkills && act.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {act.requiredSkills.map((sk, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{act.date} {act.time ? `(${act.time})` : ''}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{act.location}</span>
                        </div>
                      </div>

                      {act.coordinatorName && (
                        <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-700 flex items-center justify-between">
                          <span>Coordinator: <strong>{act.coordinatorName}</strong></span>
                          {act.coordinatorContact && <span className="font-mono text-slate-500">{act.coordinatorContact}</span>}
                        </div>
                      )}

                      {/* Enrollment Button */}
                      {isEnrolled ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-700" />
                            <span>Enrolled in Mission</span>
                          </div>
                          <button
                            onClick={() => handleUnenroll(act)}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                          >
                            Withdraw
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEnroll(act)}
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Enroll for Mission</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. LOG HOURS TAB */}
      {activeTab === 'log_hours' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 max-w-3xl mx-auto animate-in fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-700" />
              <span>Log Volunteer Service Hours</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Submit your completed volunteer mission hours for official Secretariat review and certificate issuance.
            </p>
          </div>

          <form onSubmit={handleLogHoursSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mission / Activity Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Free Remedial Coaching Camp - Batch 04"
                value={logForm.activityTitle}
                onChange={(e) => setLogForm(prev => ({ ...prev, activityTitle: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Volunteer Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={logForm.category}
                  onChange={(e) => setLogForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="Education & Tutoring">Education & Tutoring</option>
                  <option value="Healthcare & Medical Relief">Healthcare & Medical Relief</option>
                  <option value="Emergency & Disaster Response">Emergency & Disaster Response</option>
                  <option value="Food & Ration Distribution">Food & Ration Distribution</option>
                  <option value="Community Welfare & Social Work">Community Welfare & Social Work</option>
                  <option value="Legal & Rights Awareness">Legal & Rights Awareness</option>
                  <option value="Digital & Media Support">Digital & Media Support</option>
                  <option value="Events & Logistics Coordination">Events & Logistics Coordination</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={logForm.date}
                  onChange={(e) => setLogForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hours Served <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  required
                  value={logForm.hoursServed}
                  onChange={(e) => setLogForm(prev => ({ ...prev, hoursServed: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Location / Venue / District
              </label>
              <input
                type="text"
                placeholder="e.g. Anantnag Chapter Coaching Hall"
                value={logForm.location}
                onChange={(e) => setLogForm(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Summary of Tasks Performed & Impact
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe the students coached, medical patients assisted, or ration boxes packed..."
                value={logForm.description}
                onChange={(e) => setLogForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmittingLog}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingLog ? 'Submitting Service Log...' : 'Submit Service Hours for Verification'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. SERVICE HISTORY & CERTIFICATES TAB */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Volunteer Service Record & Certifications</h3>
              <p className="text-xs text-slate-500">Official log of verified volunteer missions and certificates of appreciation.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                {verifiedHours} Total Verified Hours
              </span>
            </div>
          </div>

          {serviceLogs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">No Volunteer Service Logs Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Once you complete volunteer missions and log your hours, your verified history and certificates will appear here.
              </p>
              <button
                onClick={() => setActiveTab('log_hours')}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Log Your First Mission
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Mission Title & Category</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Hours Served</th>
                      <th className="p-4">Verification Status</th>
                      <th className="p-4">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <div className="font-black text-slate-900">{log.activityTitle}</div>
                          <div className="text-[11px] text-slate-500">{log.category} • {log.location || 'Field'}</div>
                          {log.adminNotes && (
                            <div className="text-[10px] text-emerald-800 italic mt-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                              Secretariat note: "{log.adminNotes}"
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-700">{log.date}</td>
                        <td className="p-4 font-black text-slate-900">{log.hoursServed} hrs</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            log.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : log.status === 'rejected'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {log.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                            <span>{log.status === 'approved' ? 'Verified' : log.status === 'rejected' ? 'Rejected' : 'Pending Audit'}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          {log.status === 'approved' ? (
                            <button
                              onClick={() => setSelectedCertRecord(log)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Award className="w-3.5 h-3.5 text-emerald-700" />
                              <span>View Certificate</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Available after audit</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MY CHAPTER TAB */}
      {activeTab === 'my_chapter' && (
        <div className="space-y-6 animate-in fade-in">
          {myCommunityGroup ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Active FET India Wing / Chapter
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {myCommunityGroup.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Regional Chapter ID: <span className="font-mono text-slate-700">{myCommunityGroup.code}</span>
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200 self-start sm:self-auto">
                  Active Volunteer Chapter
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Chapter Mandate & Mission
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {myCommunityGroup.description}
                  </p>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs">
                    <h5 className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Chapter Guidelines</span>
                    </h5>
                    <p className="text-emerald-900 text-[11px] leading-relaxed">
                      All field and educational sessions organized under this chapter adhere to the central Trust safety and transparency charter. Coordinate with your Chapter Lead for resource requests.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Leadership & Secretariat Contact
                  </h4>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                        {myCommunityGroup.leaderName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{myCommunityGroup.leaderName}</div>
                        <div className="text-[11px] text-slate-500">Official Chapter Lead / Coordinator</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 space-y-2 text-[11px]">
                      {myCommunityGroup.leaderEmail && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{myCommunityGroup.leaderEmail}</span>
                        </div>
                      )}
                      {myCommunityGroup.leaderPhone && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{myCommunityGroup.leaderPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Coverage Zone: <strong>{myCommunityGroup.region}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
              No chapter record found.
            </div>
          )}
        </div>
      )}

      {/* OFFICIAL CERTIFICATE MODAL */}
      {selectedCertRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>Official Commendation Credential</span>
              </span>
              <button
                onClick={() => setSelectedCertRecord(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Canvas Frame */}
            <div className="relative p-6 sm:p-8 border-4 border-double border-emerald-800/30 rounded-2xl bg-amber-50/20 text-center space-y-4">
              
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900">
                  Fatimyah Educational Trust India
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900">
                  Certificate of Volunteer Service
                </h3>
                <p className="text-[10px] font-mono text-slate-500 uppercase">
                  {selectedCertRecord.certificateId || `FET-CERT-VOL-${new Date().getFullYear()}`}
                </p>
              </div>

              <div className="py-2 space-y-2">
                <p className="text-xs text-slate-600 italic">This is proudly presented to</p>
                <div className="text-xl font-bold font-serif text-emerald-950 border-b border-emerald-800/20 pb-1 max-w-md mx-auto">
                  {selectedCertRecord.volunteerName || volunteerName}
                </div>
                <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed pt-1">
                  In sincere recognition of exemplary dedication and <strong>{selectedCertRecord.hoursServed} hours</strong> of verified community service rendered for:
                </p>
                <p className="text-sm font-bold text-slate-900">
                  "{selectedCertRecord.activityTitle}"
                </p>
                <p className="text-xs text-slate-500">
                  Category: {selectedCertRecord.category} • Date: {selectedCertRecord.date}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <div className="text-left">
                  <span className="block font-bold text-slate-800">Trust Secretariat</span>
                  <span>Fatimyah Educational Trust</span>
                </div>

                <div className="w-12 h-12 rounded-full border-2 border-emerald-800/40 flex items-center justify-center text-emerald-900 font-serif font-bold text-[9px] uppercase tracking-tighter">
                  Seal
                </div>

                <div className="text-right">
                  <span className="block font-bold text-slate-800">Verified & Authenticated</span>
                  <span>ID: {selectedCertRecord.volunteerId || volunteerIdDisplay}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setSelectedCertRecord(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
