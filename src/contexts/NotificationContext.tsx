/**
 * @license
 * Notification and Communication System Context
 * Fatimyah Educational Trust India
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  db, 
  createUserNotification,
  markUserNotificationAsRead, 
  markUserNotificationAsUnread,
  archiveUserNotification,
  markAllUserNotificationsAsRead, 
  deleteUserNotification,
  updateUserNotificationPreferences,
  updateAdminBroadcastStatus,
  updateAdminAnnouncement,
  dispatchAdminBroadcast,
  sendBroadcastNotification 
} from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  AppNotification, 
  AdminBroadcastDispatch, 
  PlatformNotification, 
  NotificationCategory, 
  NotificationSeverity, 
  NotificationPriority,
  AnnouncementStatus,
  NotificationTargetGroup,
  UserNotificationPreferences,
  UserRole 
} from '../types';

interface NotificationContextType {
  // User In-App Notifications (Private to the authenticated user)
  userNotifications: AppNotification[];
  allUserNotifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  toggleReadStatus: (id: string, currentRead: boolean) => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // User Preferences
  userPreferences: UserNotificationPreferences | undefined;
  savePreferences: (prefs: UserNotificationPreferences) => Promise<void>;

  // Administrative Broadcasts & Campaigns
  adminBroadcasts: AdminBroadcastDispatch[];
  dispatchBroadcast: (
    params: {
      title: string;
      message: string;
      type: NotificationCategory;
      category?: string;
      severity?: NotificationSeverity;
      priority?: NotificationPriority;
      status?: AnnouncementStatus;
      targetGroups: NotificationTargetGroup[];
      targetAudience?: string;
      targetUserIds?: string[];
      publishAt?: string;
      expiresAt?: string;
      actionUrl?: string;
      actionLabel?: string;
      module?: 'membership' | 'volunteer' | 'donor' | 'account' | 'system' | 'donations' | 'applications' | 'campaigns' | 'competitions' | 'exams' | 'certificates' | 'general';
      triggerEmail?: boolean;
    },
    adminUser: { uid: string; email: string; role: UserRole }
  ) => Promise<{ broadcastId: string; recipientCount: number }>;

  updateBroadcastStatus: (
    broadcastId: string, 
    status: AnnouncementStatus, 
    note?: string
  ) => Promise<void>;

  updateBroadcast: (
    broadcastId: string, 
    updates: Partial<AdminBroadcastDispatch>
  ) => Promise<void>;

  // Global Platform Bulletins
  platformAnnouncements: PlatformNotification[];
  // Backwards compatibility
  notifications: PlatformNotification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, isSuperAdmin, hasPermission } = useAuth();
  
  const [allUserNotifications, setAllUserNotifications] = useState<AppNotification[]>([]);
  const [adminBroadcasts, setAdminBroadcasts] = useState<AdminBroadcastDispatch[]>([]);
  const [platformAnnouncements, setPlatformAnnouncements] = useState<PlatformNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Real-time Listener for Authenticated User In-App Notifications
  useEffect(() => {
    if (!currentUser?.uid) {
      setAllUserNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userNotifRef = collection(db, 'user_notifications');
      const q = query(
        userNotifRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          notifs.push({
            id: docSnap.id,
            ...docSnap.data()
          } as AppNotification);
        });

        // Provide standard welcome notification if user inbox is empty
        if (notifs.length === 0) {
          const defaultWelcome: AppNotification = {
            id: 'system-welcome',
            userId: currentUser.uid,
            title: 'Welcome to FET India Digital Platform',
            message: 'Your authenticated account is now active. Explore the institutional services, track applications, and manage your membership or volunteer profile.',
            type: 'system',
            severity: 'info',
            priority: 'normal',
            status: 'published',
            module: 'general',
            read: false,
            createdAt: new Date().toISOString(),
            createdBy: 'FET India Secretariat',
            actionUrl: 'membership',
            actionLabel: 'Explore Membership'
          };
          setAllUserNotifications([defaultWelcome]);
        } else {
          setAllUserNotifications(notifs);
        }
        setIsLoading(false);
      }, (err) => {
        console.warn('User notifications snapshot notice:', err);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Error setting up user notification listener:', e);
      setIsLoading(false);
    }
  }, [currentUser?.uid]);

  // 2. Real-time Listener for Admin Broadcast History (Admins only)
  useEffect(() => {
    const isAdmin = isSuperAdmin || hasPermission('settings.manage') || hasPermission('users.manage');
    if (!currentUser || !isAdmin) {
      setAdminBroadcasts([]);
      return;
    }

    try {
      const broadcastRef = collection(db, 'admin_broadcasts');
      const q = query(broadcastRef, orderBy('createdAt', 'desc'), limit(50));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: AdminBroadcastDispatch[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...docSnap.data()
          } as AdminBroadcastDispatch);
        });
        setAdminBroadcasts(list);
      }, (err) => {
        console.warn('Admin broadcasts snapshot notice:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Error setting up admin broadcast listener:', e);
    }
  }, [currentUser, isSuperAdmin, hasPermission]);

  // 3. Real-time Listener for Platform Global Announcements
  useEffect(() => {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(30));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: PlatformNotification[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as PlatformNotification);
        });
        setPlatformAnnouncements(list);
      }, (err) => {
        console.warn('Global announcements listener notice:', err);
      });

      return () => unsub();
    } catch (e) {
      console.warn('Notification listener setup notice:', e);
    }
  }, []);

  // Filter active notifications (e.g. non-archived by default, and scheduled time reached)
  const nowMs = Date.now();
  const userNotifications = allUserNotifications.filter((n) => {
    if (n.isArchived) return false;
    if (n.publishAt) {
      const pubMs = new Date(n.publishAt).getTime();
      if (pubMs > nowMs + 60000) return false; // Scheduled in the future
    }
    return true;
  });

  // Compute unread count based on active userNotifications
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    setAllUserNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)
    );
    if (id !== 'system-welcome') {
      try {
        await markUserNotificationAsRead(id);
      } catch (err) {
        console.warn('Failed to mark notification as read in Firestore:', err);
      }
    }
  };

  const markAsUnread = async (id: string) => {
    setAllUserNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: false, readAt: null } : n)
    );
    if (id !== 'system-welcome') {
      try {
        await markUserNotificationAsUnread(id);
      } catch (err) {
        console.warn('Failed to mark notification as unread in Firestore:', err);
      }
    }
  };

  const toggleReadStatus = async (id: string, currentRead: boolean) => {
    if (currentRead) {
      await markAsUnread(id);
    } else {
      await markAsRead(id);
    }
  };

  const archiveNotification = async (id: string) => {
    setAllUserNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isArchived: true, archivedAt: new Date().toISOString() } : n)
    );
    if (id !== 'system-welcome') {
      try {
        await archiveUserNotification(id);
      } catch (err) {
        console.warn('Failed to archive notification in Firestore:', err);
      }
    }
  };

  const markAllAsRead = async () => {
    const now = new Date().toISOString();
    setAllUserNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: now })));
    if (currentUser?.uid) {
      try {
        await markAllUserNotificationsAsRead(currentUser.uid);
      } catch (err) {
        console.warn('Failed to mark all notifications as read in Firestore:', err);
      }
    }
  };

  const deleteNotification = async (id: string) => {
    setAllUserNotifications(prev => prev.filter(n => n.id !== id));
    if (id !== 'system-welcome') {
      try {
        await deleteUserNotification(id);
      } catch (err) {
        console.warn('Failed to delete notification in Firestore:', err);
      }
    }
  };

  const savePreferences = async (prefs: UserNotificationPreferences) => {
    if (!currentUser?.uid) return;
    await updateUserNotificationPreferences(currentUser.uid, prefs);
  };

  const dispatchBroadcast = async (
    params: {
      title: string;
      message: string;
      type: NotificationCategory;
      category?: string;
      severity?: NotificationSeverity;
      priority?: NotificationPriority;
      status?: AnnouncementStatus;
      targetGroups: NotificationTargetGroup[];
      targetAudience?: string;
      targetUserIds?: string[];
      publishAt?: string;
      expiresAt?: string;
      actionUrl?: string;
      actionLabel?: string;
      module?: 'membership' | 'volunteer' | 'donor' | 'account' | 'system' | 'donations' | 'applications' | 'campaigns' | 'competitions' | 'exams' | 'certificates' | 'general';
      triggerEmail?: boolean;
    },
    adminUser: { uid: string; email: string; role: UserRole }
  ) => {
    const result = await dispatchAdminBroadcast(params, adminUser);
    return result;
  };

  const updateBroadcastStatus = async (
    broadcastId: string, 
    status: AnnouncementStatus, 
    note?: string
  ) => {
    if (!currentUser) return;
    const adminUser = {
      uid: currentUser.uid,
      email: currentUser.email || 'admin@fetindia.org',
      role: (userProfile?.primaryRole || (isSuperAdmin ? 'super_admin' : 'administrator')) as UserRole
    };
    await updateAdminBroadcastStatus(broadcastId, status, adminUser, note);
  };

  const updateBroadcast = async (
    broadcastId: string, 
    updates: Partial<AdminBroadcastDispatch>
  ) => {
    if (!currentUser) return;
    const adminUser = {
      uid: currentUser.uid,
      email: currentUser.email || 'admin@fetindia.org',
      role: (userProfile?.primaryRole || (isSuperAdmin ? 'super_admin' : 'administrator')) as UserRole
    };
    await updateAdminAnnouncement(broadcastId, updates, adminUser);
  };

  return (
    <NotificationContext.Provider
      value={{
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
        userPreferences: userProfile?.notificationPreferences,
        savePreferences,
        adminBroadcasts,
        dispatchBroadcast,
        updateBroadcastStatus,
        updateBroadcast,
        platformAnnouncements,
        notifications: platformAnnouncements
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

