/**
 * @license
 * Notification & Broadcast Dispatcher Console (STEP 51 Management)
 * Fatimyah Educational Trust India
 */

import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Megaphone, 
  Users, 
  Radio,
  Layers,
  ShieldCheck, 
  HeartHandshake, 
  CreditCard, 
  UserCheck, 
  Clock, 
  ExternalLink, 
  Flame, 
  Search, 
  CheckSquare, 
  Square, 
  Mail, 
  AlertCircle,
  Calendar,
  Eye,
  X,
  Briefcase,
  Shield,
  Award,
  GraduationCap,
  Archive,
  RefreshCw,
  Edit3,
  Filter,
  Check
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  NotificationCategory, 
  NotificationSeverity, 
  NotificationPriority,
  AnnouncementStatus,
  NotificationTargetGroup, 
  AdminBroadcastDispatch 
} from '../../types';

export const AdminNotificationsView: React.FC = () => {
  const { 
    adminBroadcasts, 
    dispatchBroadcast, 
    updateBroadcastStatus,
    updateBroadcast
  } = useNotifications();
  const { currentUser, activeRole } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationCategory>('announcement');
  const [category, setCategory] = useState<string>('Institutional Bulletin');
  const [severity, setSeverity] = useState<NotificationSeverity>('info');
  const [priority, setPriority] = useState<NotificationPriority>('normal');
  const [initialStatus, setInitialStatus] = useState<AnnouncementStatus>('published');
  const [module, setModule] = useState<'membership' | 'volunteer' | 'donor' | 'account' | 'system' | 'donations' | 'applications' | 'campaigns' | 'competitions' | 'exams' | 'certificates' | 'general'>('general');
  const [targetGroups, setTargetGroups] = useState<NotificationTargetGroup[]>(['all']);
  const [publishAt, setPublishAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [actionPreset, setActionPreset] = useState<string>('none');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [triggerEmail, setTriggerEmail] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // History & Filter State
  const [searchHistory, setSearchHistory] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [historyPriorityFilter, setHistoryPriorityFilter] = useState<string>('all');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AdminBroadcastDispatch | null>(null);

  // Status Change / Management Modal
  const [statusModalItem, setStatusModalItem] = useState<AdminBroadcastDispatch | null>(null);
  const [newStatus, setNewStatus] = useState<AnnouncementStatus>('archived');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const TARGET_GROUP_OPTIONS: { id: NotificationTargetGroup; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'all', label: 'All Registered Users', icon: <Users className="w-4 h-4 text-slate-700" />, desc: 'Entire registered user base across India' },
    { id: 'members', label: 'All Members', icon: <ShieldCheck className="w-4 h-4 text-blue-700" />, desc: 'All registered and approved members' },
    { id: 'general_members', label: 'General Members', icon: <ShieldCheck className="w-4 h-4 text-sky-700" />, desc: 'Approved General Members' },
    { id: 'core_members', label: 'Core Members', icon: <Shield className="w-4 h-4 text-amber-700" />, desc: 'Institutional trust core delegation' },
    { id: 'volunteers', label: 'Volunteers', icon: <HeartHandshake className="w-4 h-4 text-emerald-700" />, desc: 'Registered and active volunteer workforce' },
    { id: 'donors', label: 'Donors & Benefactors', icon: <CreditCard className="w-4 h-4 text-purple-700" />, desc: 'Approved 80G donors & patrons' },
    { id: 'staff', label: 'Staff & Secretariat', icon: <Briefcase className="w-4 h-4 text-teal-700" />, desc: 'Administrative staff and officers' },
    { id: 'management', label: 'Management & Trustees', icon: <UserCheck className="w-4 h-4 text-rose-700" />, desc: 'Trustees & Board Leadership' }
  ];

  const ACTION_PRESETS = [
    { id: 'none', label: 'None (Informational only)', url: '', actionLabel: '' },
    { id: 'membership', label: 'Membership Status & ID Card', url: 'membership', actionLabel: 'View Membership' },
    { id: 'volunteer', label: 'Volunteer Missions & Hours', url: 'volunteer', actionLabel: 'Open Volunteer Desk' },
    { id: 'campaigns', label: 'Crowdfunding & Welfare Appeals', url: 'campaigns', actionLabel: 'View Appeal' },
    { id: 'donations', label: 'Donations & 80G Tax Receipts', url: 'donations', actionLabel: 'Download 80G Receipt' },
    { id: 'applications', label: 'Educational & Welfare Applications', url: 'applications', actionLabel: 'Track Application' },
    { id: 'competitions', label: 'Examinations & Competitions', url: 'competitions', actionLabel: 'View Competitions' },
    { id: 'certificates', label: 'Certificate Verification Desk', url: 'certificates', actionLabel: 'Verify Certificate' },
    { id: 'profile', label: 'Account Profile & Verification', url: 'profile', actionLabel: 'Update Profile' },
    { id: 'custom', label: 'Custom URL or Section ID', url: '', actionLabel: 'View Details' }
  ];

  const handleActionPresetChange = (presetId: string) => {
    setActionPreset(presetId);
    const preset = ACTION_PRESETS.find(p => p.id === presetId);
    if (preset && presetId !== 'custom') {
      setActionUrl(preset.url);
      setActionLabel(preset.actionLabel);
    }
  };

  const handleToggleGroup = (groupId: NotificationTargetGroup) => {
    if (groupId === 'all') {
      setTargetGroups(['all']);
      return;
    }

    setTargetGroups(prev => {
      const withoutAll = prev.filter(g => g !== 'all');
      if (withoutAll.includes(groupId)) {
        const remaining = withoutAll.filter(g => g !== groupId);
        return remaining.length === 0 ? ['all'] : remaining;
      } else {
        return [...withoutAll, groupId];
      }
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !message.trim()) return;

    setIsSending(true);
    setSuccessMsg(null);

    try {
      const targetAudienceString = targetGroups.includes('all') 
        ? 'All Users' 
        : targetGroups.map(g => g.replace('_', ' ')).join(', ');

      const result = await dispatchBroadcast({
        title: title.trim(),
        message: message.trim(),
        type,
        category: category.trim() || undefined,
        severity,
        priority,
        status: publishAt && new Date(publishAt).getTime() > Date.now() ? 'scheduled' : initialStatus,
        module,
        targetGroups,
        targetAudience: targetAudienceString,
        publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        actionUrl: actionUrl.trim() || undefined,
        actionLabel: actionLabel.trim() || undefined,
        triggerEmail
      }, {
        uid: currentUser.uid,
        email: currentUser.email || 'superadmin@fetindia.org',
        role: activeRole
      });

      setSuccessMsg(`Official broadcast successfully processed! Target status: ${publishAt && new Date(publishAt).getTime() > Date.now() ? 'Scheduled' : 'Published'}. Delivered to ${result.recipientCount} deduplicated recipient(s).`);
      setTitle('');
      setMessage('');
      setActionUrl('');
      setActionLabel('');
      setActionPreset('none');
      setPublishAt('');
      setExpiresAt('');
      setTargetGroups(['all']);
      setPriority('normal');
      setInitialStatus('published');
      setTriggerEmail(false);
    } catch (err: any) {
      console.error('Broadcast dispatch error:', err);
      alert(`Error dispatching broadcast: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusUpdateSubmit = async () => {
    if (!statusModalItem) return;
    setIsUpdatingStatus(true);
    try {
      await updateBroadcastStatus(statusModalItem.id, newStatus, statusNote);
      setStatusModalItem(null);
      setStatusNote('');
      setSuccessMsg(`Broadcast status updated to ${newStatus}.`);
    } catch (err: any) {
      console.error('Failed to update broadcast status:', err);
      alert(`Failed to update status: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredHistory = adminBroadcasts.filter(b => {
    // Status filter
    if (historyStatusFilter !== 'all') {
      const s = b.status || 'published';
      if (s !== historyStatusFilter) return false;
    }

    // Priority filter
    if (historyPriorityFilter !== 'all') {
      const p = b.priority || 'normal';
      if (p !== historyPriorityFilter) return false;
    }

    // Search filter
    if (searchHistory.trim()) {
      const q = searchHistory.toLowerCase();
      const authorEmail = b.sentByEmail || b.dispatchedByEmail || '';
      const cat = b.category?.toLowerCase() || '';
      return b.title.toLowerCase().includes(q) || b.message.toLowerCase().includes(q) || authorEmail.toLowerCase().includes(q) || cat.includes(q);
    }

    return true;
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8" id="admin-notifications-view">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
              <Megaphone className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Institutional Notification & Communication Engine
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dispatch targeted announcements, time-bound bulletins, and emergency alerts to specific beneficiary and member cohorts with automatic deduplication.
              </p>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Composer & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Broadcast Composer (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-700" />
                <span>Create & Dispatch Broadcast</span>
              </h3>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                Multi-Cohort Deduplicated Dispatch
              </span>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              
              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notification Title / Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Convocation & Merit Scholarship Applications Window Open"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* Classification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as NotificationCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
                  >
                    <option value="announcement">Announcement / Bulletin</option>
                    <option value="membership">Membership Alert</option>
                    <option value="volunteer">Volunteer Dispatch</option>
                    <option value="donor">Donor & 80G Notice</option>
                    <option value="competition">Competition / Olympiad</option>
                    <option value="examination">Online Examination</option>
                    <option value="certificate">Certificate Desk</option>
                    <option value="account">Account Security</option>
                    <option value="event">Convocation / Event</option>
                    <option value="urgent">Urgent Notice</option>
                    <option value="system">System Notification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="important">Important (Highlighted)</option>
                    <option value="urgent">Urgent (Immediate Attention)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Education & Scholarships"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Module & Severity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Related Functional Module</label>
                  <select
                    value={module}
                    onChange={(e) => setModule(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
                  >
                    <option value="general">General Institution</option>
                    <option value="membership">Membership Operations</option>
                    <option value="volunteer">Volunteer Network</option>
                    <option value="donor">Donations & 80G Tax Exemption</option>
                    <option value="competitions">Competitions & Olympiads</option>
                    <option value="exams">Online Examination Center</option>
                    <option value="certificates">Certificate Verification</option>
                    <option value="campaigns">Crowdfunding & Appeals</option>
                    <option value="applications">Welfare Applications</option>
                    <option value="account">Account & Security</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity Indicator</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as NotificationSeverity)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
                  >
                    <option value="info">Info (Informational)</option>
                    <option value="success">Success (Positive Confirmation)</option>
                    <option value="warning">Warning (Requires Action)</option>
                    <option value="critical">Critical (Urgent / Deadline)</option>
                  </select>
                </div>
              </div>

              {/* Target Audience Multi-Selector */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Target Recipient Cohorts <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {targetGroups.includes('all') ? 'Selected: All Registered Users' : `${targetGroups.length} Cohort(s) Selected`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TARGET_GROUP_OPTIONS.map((g) => {
                    const isSelected = targetGroups.includes(g.id);
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => handleToggleGroup(g.id)}
                        className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-500/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-700" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                            {g.icon}
                            <span>{g.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">{g.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Deduplication Guarantee Note */}
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-[11px] text-blue-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>
                    <strong>Deduplication Active:</strong> Users matching multiple selected cohorts will receive only one notification record in their inbox.
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write clear, formal notification text explaining the event, instruction, or deadline..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden leading-relaxed font-normal"
                />
              </div>

              {/* Scheduling: Publish Date/Time and Expiry Date/Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Publish Date & Time (Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={publishAt}
                    onChange={(e) => setPublishAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Will be marked as 'scheduled' until this timestamp</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expiry Date & Time (Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Notification will display expiration tag after this date</p>
                </div>
              </div>

              {/* Action Link Preset & Customization */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Call-to-Action Link (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <select
                      value={actionPreset}
                      onChange={(e) => handleActionPresetChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
                    >
                      {ACTION_PRESETS.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Action tab/URL (e.g. membership)"
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Button text (e.g. View Details)"
                      value={actionLabel}
                      onChange={(e) => setActionLabel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Email Trigger Option & Disclaimer */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triggerEmail}
                    onChange={(e) => setTriggerEmail(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    Attempt Email Notification Trigger
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 leading-normal pl-6">
                  Note: Email dispatch will execute only where an external mail provider (e.g. SendGrid/SES) has been configured. In-app notifications will always be reliably delivered and stored in Firestore.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                id="dispatch-broadcast-btn"
              >
                {isSending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching across recipient cohorts...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Official Broadcast</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Dispatches & Campaign History (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Broadcast Audit Log</h3>
                <p className="text-[11px] text-slate-500">History, scheduled queues, and lifecycle status</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {adminBroadcasts.length} Recorded
              </span>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search history by title, admin, category..."
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={historyPriorityFilter}
                  onChange={(e) => setHistoryPriorityFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 text-xs"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="important">Important</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </div>

            {/* History List */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl space-y-2 border border-slate-200">
                  <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No broadcast campaigns match filter criteria.</p>
                </div>
              ) : (
                filteredHistory.map((b) => {
                  const bStatus = b.status || 'published';
                  const bPriority = b.priority || 'normal';

                  return (
                    <div 
                      key={b.id} 
                      onClick={() => setSelectedHistoryItem(b)}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-2xs hover:border-amber-300 hover:bg-amber-50/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                              bStatus === 'published' ? 'bg-emerald-100 text-emerald-800' :
                              bStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              bStatus === 'archived' ? 'bg-slate-200 text-slate-700' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {bStatus}
                            </span>
                            {bPriority === 'urgent' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500 text-white">
                                URGENT
                              </span>
                            )}
                            {bPriority === 'important' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                                IMPORTANT
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">{b.title}</h4>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          {formatDate(b.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {b.message}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] flex-wrap gap-1 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 font-semibold text-slate-700 uppercase">
                            {b.targetGroups.join(', ')}
                          </span>
                          <span className="font-bold text-emerald-800">
                            {b.recipientCount} Recipients
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusModalItem(b);
                              setNewStatus(b.status === 'published' ? 'archived' : 'published');
                            }}
                            className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                          >
                            Manage Status
                          </button>
                        </div>
                      </div>

                      {b.publishAt && (
                        <div className="pt-0.5 text-[10px] text-blue-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Publish: {formatDate(b.publishAt)}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Broadcast History Detail Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                  Broadcast Audit Record
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {selectedHistoryItem.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {selectedHistoryItem.message}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">STATUS</span>
                <span className="font-bold text-slate-800 uppercase">{selectedHistoryItem.status || 'published'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">PRIORITY</span>
                <span className="font-bold text-slate-800 uppercase">{selectedHistoryItem.priority || 'normal'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">TARGET AUDIENCE</span>
                <span className="font-bold text-slate-800 capitalize">{selectedHistoryItem.targetGroups.join(', ').replace(/_/g, ' ')}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">RECIPIENTS DELIVERED</span>
                <span className="font-bold text-emerald-800">{selectedHistoryItem.recipientCount} User(s)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">DISPATCHED BY</span>
                <span className="font-semibold text-slate-800 truncate block">{selectedHistoryItem.sentByEmail || selectedHistoryItem.dispatchedByEmail || 'Admin'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">DISPATCH TIMESTAMP</span>
                <span className="font-semibold text-slate-800">{formatDate(selectedHistoryItem.createdAt)}</span>
              </div>
            </div>

            {/* Audit Status History Trail */}
            {selectedHistoryItem.statusHistory && selectedHistoryItem.statusHistory.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Status Lifecycle Audit Log</span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px] max-h-32 overflow-y-auto">
                  {selectedHistoryItem.statusHistory.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-600">
                      <span>Status changed to <strong className="uppercase">{h.status}</strong> by {h.changedByEmail.split('@')[0]}</span>
                      <span className="text-slate-400">{formatDate((h as any).timestamp || h.changedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setStatusModalItem(selectedHistoryItem);
                  setSelectedHistoryItem(null);
                }}
                className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs cursor-pointer"
              >
                Change Status
              </button>

              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Transition Modal */}
      {statusModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Manage Broadcast Lifecycle</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{statusModalItem.title}</p>
              </div>
              <button onClick={() => setStatusModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AnnouncementStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="published">Published (Active)</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Note / Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Campaign completed or retracted by secretariat"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setStatusModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdateSubmit}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {isUpdatingStatus ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
