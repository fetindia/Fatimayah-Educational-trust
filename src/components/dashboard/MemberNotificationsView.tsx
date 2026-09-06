/**
 * @license
 * Member Notifications View (Centralized Notification & Communication Center)
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  GraduationCap, 
  HeartHandshake, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2,
  Calendar,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Mail,
  Info,
  Clock,
  Layers,
  UserCheck,
  Award,
  AlertTriangle,
  Flame,
  X,
  Archive,
  Eye,
  EyeOff,
  Settings,
  Filter,
  Check
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { AppNotification, NotificationCategory, NotificationPriority, UserNotificationPreferences } from '../../types';

interface MemberNotificationsViewProps {
  onNotify?: (message: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const MemberNotificationsView: React.FC<MemberNotificationsViewProps> = ({ 
  onNotify,
  onNavigateTab 
}) => {
  const { 
    userNotifications, 
    allUserNotifications,
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAsUnread,
    toggleReadStatus,
    archiveNotification,
    markAllAsRead, 
    deleteNotification,
    userPreferences,
    savePreferences
  } = useNotifications();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [activeModalNotification, setActiveModalNotification] = useState<AppNotification | null>(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);

  // Local preferences state for modal
  const [prefForm, setPrefForm] = useState<UserNotificationPreferences>({
    emailAlerts: userPreferences?.emailAlerts ?? true,
    membershipAlerts: userPreferences?.membershipAlerts ?? true,
    volunteerAlerts: userPreferences?.volunteerAlerts ?? true,
    donationReceipts: userPreferences?.donationReceipts ?? true,
    generalBulletins: userPreferences?.generalBulletins ?? true,
    competitionAlerts: userPreferences?.competitionAlerts ?? true,
    examinationAlerts: userPreferences?.examinationAlerts ?? true,
    systemAlerts: true // Locked on
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState<boolean>(false);

  const baseList = showArchived ? allUserNotifications.filter(n => n.isArchived) : userNotifications;

  const filteredNotifications = baseList.filter(n => {
    // 1. Category / Status Filter
    if (selectedCategory === 'unread' && n.read) return false;
    if (selectedCategory === 'read' && !n.read) return false;
    if (selectedCategory === 'urgent' && n.priority !== 'urgent' && n.severity !== 'critical' && n.type !== 'urgent') return false;
    
    if (selectedCategory !== 'all' && selectedCategory !== 'unread' && selectedCategory !== 'read' && selectedCategory !== 'urgent') {
      const matchType = n.type === selectedCategory;
      const matchModule = n.module === selectedCategory;
      const matchCat = n.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      if (!matchType && !matchModule && !matchCat) return false;
    }

    // 2. Priority Filter
    if (selectedPriority !== 'all') {
      const p = n.priority || (n.severity === 'critical' ? 'urgent' : n.severity === 'warning' ? 'important' : 'normal');
      if (p !== selectedPriority) return false;
    }

    // 3. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchMsg = n.message?.toLowerCase().includes(q);
      const matchModule = n.module?.toLowerCase().includes(q);
      const matchType = n.type?.toLowerCase().includes(q);
      const matchCat = n.category?.toLowerCase().includes(q);
      const matchSender = n.createdBy?.toLowerCase().includes(q);
      return matchTitle || matchMsg || matchModule || matchType || matchCat || matchSender;
    }

    return true;
  });

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      if (onNotify) onNotify('All notifications marked as read.');
    } catch (err) {
      console.warn('Failed marking all read:', err);
    }
  };

  const handleToggleRead = async (e: React.MouseEvent, n: AppNotification) => {
    e.stopPropagation();
    try {
      if (!n.id) return;
      await toggleReadStatus(n.id, n.read);
      if (onNotify) {
        onNotify(n.read ? 'Notification marked as unread.' : 'Notification marked as read.');
      }
    } catch (err) {
      console.warn('Failed toggling read:', err);
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await archiveNotification(id);
      if (onNotify) onNotify('Notification archived.');
    } catch (err) {
      console.warn('Failed archiving notification:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      if (onNotify) onNotify('Notification dismissed.');
    } catch (err) {
      console.warn('Failed deleting notification:', err);
    }
  };

  const handleOpenNotification = (n: AppNotification) => {
    setActiveModalNotification(n);
    if (!n.read && n.id) {
      markAsRead(n.id);
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      await savePreferences(prefForm);
      setShowPreferencesModal(false);
      if (onNotify) onNotify('Communication preferences saved successfully.');
    } catch (err) {
      console.warn('Failed saving preferences:', err);
      if (onNotify) onNotify('Failed to save communication preferences.');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const getCategoryMeta = (type?: NotificationCategory, module?: string) => {
    if (module === 'volunteer' || type === 'volunteer') {
      return {
        label: 'Volunteer',
        icon: <HeartHandshake className="w-4 h-4 text-emerald-700" />,
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      };
    }
    if (module === 'membership' || type === 'membership') {
      return {
        label: 'Membership',
        icon: <ShieldCheck className="w-4 h-4 text-blue-700" />,
        badgeBg: 'bg-blue-50 text-blue-800 border-blue-200'
      };
    }
    if (module === 'donor' || type === 'donor' || type === 'donation') {
      return {
        label: 'Donor & 80G',
        icon: <CreditCard className="w-4 h-4 text-amber-700" />,
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
      };
    }
    if (module === 'competitions' || module === 'exams' || type === 'competition' || type === 'examination') {
      return {
        label: 'Competitions & Exams',
        icon: <Award className="w-4 h-4 text-indigo-700" />,
        badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200'
      };
    }
    if (module === 'certificates' || type === 'certificate') {
      return {
        label: 'Certificates',
        icon: <GraduationCap className="w-4 h-4 text-cyan-700" />,
        badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200'
      };
    }
    if (module === 'account' || type === 'account') {
      return {
        label: 'Account Security',
        icon: <UserCheck className="w-4 h-4 text-purple-700" />,
        badgeBg: 'bg-purple-50 text-purple-800 border-purple-200'
      };
    }
    if (type === 'event') {
      return {
        label: 'Convocation & Event',
        icon: <Calendar className="w-4 h-4 text-teal-700" />,
        badgeBg: 'bg-teal-50 text-teal-800 border-teal-200'
      };
    }
    if (type === 'urgent') {
      return {
        label: 'Urgent Bulletin',
        icon: <Flame className="w-4 h-4 text-rose-700" />,
        badgeBg: 'bg-rose-50 text-rose-800 border-rose-200'
      };
    }
    return {
      label: 'Institutional Notice',
      icon: <Bell className="w-4 h-4 text-slate-700" />,
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-200'
    };
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
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

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  return (
    <div className="space-y-6" id="member-notifications-section">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                <Bell className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Notification Center
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Centralized In-App Communication & Real-time Alerts
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowPreferencesModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              id="notification-prefs-btn"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Preferences</span>
            </button>

            {unreadCount > 0 && !showArchived && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                id="mark-all-read-btn"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All Read ({unreadCount})</span>
              </button>
            )}

            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs ${
                showArchived
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>{showArchived ? 'Back to Inbox' : 'Archived'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notifications by title, keyword, sender, or module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Priority Filter Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Priority:
              </span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent Only</option>
                <option value="important">Important</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
            {[
              { id: 'all', label: 'All Notifications' },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'read', label: 'Read History' },
              { id: 'urgent', label: 'High Priority' },
              { id: 'membership', label: 'Membership' },
              { id: 'volunteer', label: 'Volunteer' },
              { id: 'donor', label: 'Donor & 80G' },
              { id: 'competitions', label: 'Competitions & Exams' },
              { id: 'certificates', label: 'Certificates' },
              { id: 'campaigns', label: 'Appeals' },
              { id: 'account', label: 'Account Security' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer text-xs font-bold flex items-center gap-1.5 ${
                  selectedCategory === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-extrabold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3" id="notifications-stream">
        {isLoading ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Synchronizing notification inbox...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Bell className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                {showArchived ? 'No archived notifications' : 'No notifications found'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== 'all' || selectedPriority !== 'all'
                  ? 'No notifications match the active filter or search query.' 
                  : showArchived
                  ? 'Archived messages will be stored here for future reference.'
                  : 'You are all caught up with official trust announcements and alerts.'}
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const meta = getCategoryMeta(n.type, n.module);
            const expired = isExpired(n.expiresAt);
            const priority = n.priority || (n.severity === 'critical' ? 'urgent' : n.severity === 'warning' ? 'important' : 'normal');

            return (
              <div
                key={n.id}
                onClick={() => handleOpenNotification(n)}
                className={`p-5 rounded-3xl border transition-all shadow-xs space-y-3 cursor-pointer ${
                  n.read 
                    ? 'bg-white border-slate-200 hover:border-slate-300' 
                    : 'bg-emerald-50/30 border-emerald-300 ring-1 ring-emerald-500/10 hover:bg-emerald-50/50'
                }`}
                id={`notification-card-${n.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shrink-0 mt-0.5 shadow-2xs">
                      {meta.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${meta.badgeBg}`}>
                          {n.category || meta.label}
                        </span>
                        {!n.read && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                            UNREAD
                          </span>
                        )}
                        {priority === 'urgent' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 text-rose-600" />
                            URGENT
                          </span>
                        )}
                        {priority === 'important' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            IMPORTANT
                          </span>
                        )}
                        {n.expiresAt && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${
                            expired 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {expired ? 'Expired' : `Expires ${formatDate(n.expiresAt)}`}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {n.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleToggleRead(e, n)}
                      className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                      title={n.read ? 'Mark unread' : 'Mark read'}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${n.read ? 'text-slate-400' : 'text-emerald-700 font-bold'}`} />
                    </button>
                    {!n.isArchived && n.id && (
                      <button
                        onClick={(e) => handleArchive(e, n.id!)}
                        className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    {n.id && (
                      <button
                        onClick={(e) => handleDelete(e, n.id!)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Dismiss"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pl-12 line-clamp-2">
                  {n.message}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 pl-12 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(n.createdAt)}</span>
                    {n.createdBy && (
                      <span className="hidden sm:inline-block text-slate-300">• From {n.createdBy}</span>
                    )}
                  </div>
                  {n.actionUrl && onNavigateTab && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateTab(n.actionUrl!);
                      }}
                      className="font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <span>{n.actionLabel || 'View Details'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full Notification Detail Modal */}
      {activeModalNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200">
                  {getCategoryMeta(activeModalNotification.type, activeModalNotification.module).icon}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {getCategoryMeta(activeModalNotification.type, activeModalNotification.module).label}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {activeModalNotification.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveModalNotification(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-60 overflow-y-auto pr-1">
              <p className="whitespace-pre-wrap">{activeModalNotification.message}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span>Dispatched:</span>
                <span className="font-semibold text-slate-800">{formatDate(activeModalNotification.createdAt)}</span>
              </div>
              {activeModalNotification.priority && (
                <div className="flex items-center justify-between text-slate-500">
                  <span>Priority Level:</span>
                  <span className="font-bold text-slate-800 uppercase text-[10px]">{activeModalNotification.priority}</span>
                </div>
              )}
              {activeModalNotification.expiresAt && (
                <div className="flex items-center justify-between text-slate-500">
                  <span>Valid Until:</span>
                  <span className="font-semibold text-slate-800">{formatDate(activeModalNotification.expiresAt)}</span>
                </div>
              )}
              {activeModalNotification.module && (
                <div className="flex items-center justify-between text-slate-500">
                  <span>Related Module:</span>
                  <span className="font-semibold text-slate-800 uppercase text-[10px]">{activeModalNotification.module}</span>
                </div>
              )}
              {activeModalNotification.createdBy && (
                <div className="flex items-center justify-between text-slate-500">
                  <span>Sender / Authority:</span>
                  <span className="font-semibold text-slate-800">{activeModalNotification.createdBy}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              {activeModalNotification.actionUrl && (
                <button
                  onClick={() => {
                    const url = activeModalNotification.actionUrl!;
                    setActiveModalNotification(null);
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    } else if (onNavigateTab) {
                      onNavigateTab(url);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>{activeModalNotification.actionLabel || 'Proceed to Module'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setActiveModalNotification(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Communication Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Communication Preferences
                  </h3>
                  <p className="text-xs text-slate-500">
                    Customize the categories of institutional alerts and updates you receive.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {/* Email Notifications Toggle */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    Email Communication Channel
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Receive mirror copies of critical notices and receipt summaries via email.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefForm.emailAlerts}
                  onChange={(e) => setPrefForm({ ...prefForm, emailAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Membership Alerts */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Membership & Credential Alerts
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Updates on verification, digital identity card, and renewal reminders.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefForm.membershipAlerts}
                  onChange={(e) => setPrefForm({ ...prefForm, membershipAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Volunteer Alerts */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                    Volunteer Opportunities & Wing Notices
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Ground mobilization, relief drives, and field coordinator requests.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefForm.volunteerAlerts}
                  onChange={(e) => setPrefForm({ ...prefForm, volunteerAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Donation Receipts & 80G */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                    Donation & 80G Tax Exemption Receipts
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Automated confirmation and receipt generation for your contributions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefForm.donationReceipts}
                  onChange={(e) => setPrefForm({ ...prefForm, donationReceipts: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Competition & Examination Alerts */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    Competitions & Online Examinations
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Schedules, book reading challenges, olympiads, and result announcements.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefForm.competitionAlerts}
                  onChange={(e) => setPrefForm({ ...prefForm, competitionAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* General Institutional Bulletins */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-slate-600" />
                    General Trust Bulletins & Annual Reports
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Quarterly impact statements, event broadcasts, and community news.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefForm.generalBulletins}
                  onChange={(e) => setPrefForm({ ...prefForm, generalBulletins: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* System Security Alerts (Locked on) */}
              <div className="flex items-center justify-between py-2.5 opacity-75">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                    Account Security & Verification (Mandatory)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Password resets, login alerts, and official trust compliance notices.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-4 h-4 rounded text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                disabled={isSavingPrefs}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingPrefs ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
