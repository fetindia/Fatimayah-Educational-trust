/**
 * @license
 * Full-Scale Super Admin Volunteer & Community Management Console
 * Fatimyah Educational Trust India (FET India)
 * Module: Chapter 02 - Volunteer Intake, Directory, Missions & Community Wings
 */

import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Eye, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Award, 
  Send, 
  RefreshCw,
  X,
  MessageSquare,
  Check,
  Plus,
  Users,
  Activity,
  UserCheck,
  UserX,
  Building,
  Tag,
  Briefcase,
  SlidersHorizontal,
  Bookmark,
  ChevronRight,
  ExternalLink,
  QrCode,
  Printer,
  Download,
  Sparkles,
  Share2
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  db, 
  adminReviewVolunteerApplication,
  createVolunteerActivity,
  updateVolunteerActivity,
  createCommunityGroup,
  updateCommunityGroup,
  verifyVolunteerServiceLog,
  DEFAULT_VOLUNTEER_CATEGORIES,
  DEFAULT_COMMUNITY_GROUPS
} from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  VolunteerApplication, 
  VolunteerApplicationStatus,
  VolunteerActivity,
  VolunteerServiceRecord,
  CommunityGroup,
  VolunteerCategory
} from '../../types';
import { DigitalVolunteerCard } from '../volunteer/DigitalVolunteerCard';
import { AdminMembershipApplicationsView } from './AdminMembershipApplicationsView';

export const AdminVolunteerApplicationsView: React.FC = () => {
  const { currentUser, userProfile, activeRole } = useAuth();

  // Primary Console Sub-Tab
  const [activeTab, setActiveTab] = useState<'applications' | 'member_applications' | 'volunteers' | 'activities' | 'community_groups' | 'service_logs' | 'categories'>('applications');

  // 1. Applications State
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(true);
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | VolunteerApplicationStatus>('all');
  const [appSearchQuery, setAppSearchQuery] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<VolunteerApplication | null>(null);

  // Directory Filters State
  const [dirSearchQuery, setDirSearchQuery] = useState<string>('');
  const [dirWingFilter, setDirWingFilter] = useState<string>('all');
  const [dirStateFilter, setDirStateFilter] = useState<string>('all');
  const [dirStatusFilter, setDirStatusFilter] = useState<'all' | 'approved' | 'suspended' | 'inactive'>('all');

  // Assign Wing / Chapter Modal
  const [assignModalVolunteer, setAssignModalVolunteer] = useState<VolunteerApplication | null>(null);
  const [assignForm, setAssignForm] = useState({
    assignedWing: 'Education & Academic Mentorship',
    assignedCommunityGroupId: '',
    assignedCategory: 'Academic Tutoring & Coaching'
  });
  const [isSavingAssignment, setIsSavingAssignment] = useState<boolean>(false);

  // Digital ID Card Preview Modal
  const [previewIdVolunteer, setPreviewIdVolunteer] = useState<VolunteerApplication | null>(null);

  // Activity Corps Roster & Volunteer Direct Assignment Modal
  const [activityCorpsModal, setActivityCorpsModal] = useState<VolunteerActivity | null>(null);
  const [volunteerToAddToActivity, setVolunteerToAddToActivity] = useState<string>('');
  const [isUpdatingActivityCorps, setIsUpdatingActivityCorps] = useState<boolean>(false);

  // Chapter Corps Roster Modal
  const [chapterCorpsModal, setChapterCorpsModal] = useState<CommunityGroup | null>(null);
  const [volunteerToAddToChapter, setVolunteerToAddToChapter] = useState<string>('');
  const [isUpdatingChapterCorps, setIsUpdatingChapterCorps] = useState<boolean>(false);

  // 2. Activities State
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [isCreatingActivity, setIsCreatingActivity] = useState<boolean>(false);
  const [activityForm, setActivityForm] = useState({
    title: '',
    category: 'Education & Tutoring',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM - 02:00 PM',
    location: '',
    coordinatorName: 'FET Central Coordinator',
    coordinatorContact: '+91 94190 00000',
    maxVolunteers: 15,
    hoursCredit: 4,
    requiredSkills: 'Teaching, Communication',
    status: 'upcoming' as const
  });

  // 3. Community Groups State
  const [communityGroups, setCommunityGroups] = useState<CommunityGroup[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    code: '',
    description: '',
    leaderName: '',
    leaderEmail: '',
    leaderPhone: '',
    region: 'Jammu & Kashmir'
  });

  // 4. Service Logs State
  const [serviceLogs, setServiceLogs] = useState<VolunteerServiceRecord[]>([]);
  const [serviceStatusFilter, setServiceStatusFilter] = useState<'all' | 'pending_verification' | 'approved' | 'rejected'>('all');
  const [serviceSearch, setServiceSearch] = useState<string>('');

  // 5. Review Action Modal State
  const [reviewAction, setReviewAction] = useState<VolunteerApplicationStatus | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isProcessingReview, setIsProcessingReview] = useState<boolean>(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscribe to all volunteer applications in real-time
  useEffect(() => {
    setIsLoadingApps(true);
    const q = query(
      collection(db, 'volunteerApplications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: VolunteerApplication[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as VolunteerApplication);
        });
        setApplications(list);
        setIsLoadingApps(false);
      },
      (err) => {
        console.warn('Volunteer applications query error:', err);
        setIsLoadingApps(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to volunteer activities
  useEffect(() => {
    const q = query(
      collection(db, 'volunteer_activities'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: VolunteerActivity[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as VolunteerActivity);
      });
      setActivities(list);
    }, (err) => {
      console.warn('Activities listener note:', err);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to community groups
  useEffect(() => {
    const q = query(
      collection(db, 'community_groups'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: CommunityGroup[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CommunityGroup);
      });
      setCommunityGroups(list.length > 0 ? list : DEFAULT_COMMUNITY_GROUPS as CommunityGroup[]);
    }, (err) => {
      console.warn('Community groups listener note:', err);
      setCommunityGroups(DEFAULT_COMMUNITY_GROUPS as CommunityGroup[]);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to volunteer service logs
  useEffect(() => {
    const q = query(
      collection(db, 'volunteer_history'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: VolunteerServiceRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as VolunteerServiceRecord);
      });
      setServiceLogs(list);
    }, (err) => {
      console.warn('Service logs listener note:', err);
    });

    return () => unsubscribe();
  }, []);

  const notify = (type: 'success' | 'error', text: string) => {
    setNoticeMessage({ type, text });
    setTimeout(() => setNoticeMessage(null), 6000);
  };

  // Direct 1-Click Quick Approve Handler
  const handleQuickApprove = async (app: VolunteerApplication) => {
    if (!app.id) {
      notify('error', 'Cannot approve: Application document identifier is missing.');
      return;
    }
    if (!currentUser) {
      notify('error', 'Authentication session expired. Please sign in as Super Admin to continue.');
      return;
    }

    setProcessingAppId(app.id);
    try {
      const adminRole = activeRole || userProfile?.primaryRole || 'super_admin';
      const adminUser = {
        uid: currentUser.uid,
        email: currentUser.email || userProfile?.email || 'admin@fetindia.org',
        role: adminRole as any
      };

      const now = new Date().toISOString();

      const { assignedVolunteerId } = await adminReviewVolunteerApplication(
        app.id,
        app.applicantUid,
        'approved',
        app.reviewNotes || 'Approved by Super Admin',
        adminUser
      );

      // Optimistic local state synchronization
      setApplications(prev => prev.map(item => item.id === app.id ? {
        ...item,
        status: 'approved',
        volunteerIdAssigned: assignedVolunteerId,
        reviewedAt: now,
        reviewedBy: adminUser.email,
        reviewNotes: app.reviewNotes || 'Approved by Super Admin'
      } : item));

      notify('success', `✓ Application for ${app.fullLegalName} approved! Volunteer ID ${assignedVolunteerId} generated.`);
    } catch (err: any) {
      notify('error', `Failed to approve application: ${err.message}`);
    } finally {
      setProcessingAppId(null);
    }
  };

  // Submit Detailed Review Decision
  const handleConfirmReview = async () => {
    if (!selectedApp || !selectedApp.id || !reviewAction) return;
    if (!currentUser) {
      notify('error', 'Session expired. Please sign in again.');
      return;
    }

    setIsProcessingReview(true);
    try {
      const adminRole = activeRole || userProfile?.primaryRole || 'super_admin';
      const adminUser = {
        uid: currentUser.uid,
        email: currentUser.email || userProfile?.email || 'admin@fetindia.org',
        role: adminRole as any
      };

      const now = new Date().toISOString();

      const { assignedVolunteerId } = await adminReviewVolunteerApplication(
        selectedApp.id,
        selectedApp.applicantUid,
        reviewAction,
        reviewNotes.trim() || undefined,
        adminUser
      );

      // Update local state
      setApplications(prev => prev.map(item => item.id === selectedApp.id ? {
        ...item,
        status: reviewAction,
        volunteerIdAssigned: assignedVolunteerId || item.volunteerIdAssigned,
        reviewedAt: now,
        reviewedBy: adminUser.email,
        reviewNotes: reviewNotes.trim() || item.reviewNotes
      } : item));

      if (selectedApp) {
        setSelectedApp(prev => prev ? {
          ...prev,
          status: reviewAction,
          volunteerIdAssigned: assignedVolunteerId || prev.volunteerIdAssigned,
          reviewedAt: now,
          reviewedBy: adminUser.email,
          reviewNotes: reviewNotes.trim() || prev.reviewNotes
        } : null);
      }

      notify('success', `✓ Volunteer application status successfully updated to "${reviewAction.toUpperCase()}".`);
      setReviewAction(null);
      setReviewNotes('');
    } catch (err: any) {
      notify('error', `Failed to process review: ${err.message}`);
    } finally {
      setIsProcessingReview(false);
    }
  };

  // Status Change for Directory (e.g. suspend or reactivate)
  const handleDirectoryStatusChange = async (app: VolunteerApplication, newStatus: VolunteerApplicationStatus) => {
    if (!app.id || !currentUser) return;
    try {
      const adminUser = {
        uid: currentUser.uid,
        email: currentUser.email || userProfile?.email || 'admin@fetindia.org',
        role: (activeRole || 'super_admin') as any
      };

      await adminReviewVolunteerApplication(
        app.id,
        app.applicantUid,
        newStatus,
        `Status adjusted to ${newStatus} from Volunteer Corps Directory`,
        adminUser
      );

      notify('success', `✓ Status for ${app.fullLegalName} updated to ${newStatus}.`);
    } catch (err: any) {
      notify('error', `Status change failed: ${err.message}`);
    }
  };

  // Create Activity Handler
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.title.trim()) {
      notify('error', 'Please provide a title for the activity.');
      return;
    }
    if (!currentUser) return;

    try {
      await createVolunteerActivity({
        title: activityForm.title.trim(),
        category: activityForm.category,
        description: activityForm.description.trim(),
        date: activityForm.date,
        time: activityForm.time.trim(),
        location: activityForm.location.trim(),
        coordinatorName: activityForm.coordinatorName.trim(),
        coordinatorContact: activityForm.coordinatorContact.trim(),
        maxVolunteers: Number(activityForm.maxVolunteers) || 15,
        hoursCredit: Number(activityForm.hoursCredit) || 4,
        requiredSkills: activityForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        status: activityForm.status,
        assignedVolunteerIds: [],
        enrolledVolunteerIds: []
      }, {
        uid: currentUser.uid,
        email: currentUser.email || 'admin@fetindia.org',
        role: (activeRole || userProfile?.primaryRole || 'super_admin') as any
      });

      notify('success', `✓ Volunteer Activity "${activityForm.title}" published successfully!`);
      setIsCreatingActivity(false);
      setActivityForm({
        title: '',
        category: 'Education & Tutoring',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM - 02:00 PM',
        location: '',
        coordinatorName: 'FET Central Coordinator',
        coordinatorContact: '+91 94190 00000',
        maxVolunteers: 15,
        hoursCredit: 4,
        requiredSkills: 'Teaching, Communication',
        status: 'upcoming'
      });
    } catch (err: any) {
      notify('error', `Failed to create activity: ${err.message}`);
    }
  };

  // Create Community Group Handler
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim() || !groupForm.code.trim()) {
      notify('error', 'Please provide a chapter name and unique code.');
      return;
    }
    if (!currentUser) return;

    try {
      await createCommunityGroup({
        name: groupForm.name.trim(),
        code: groupForm.code.trim().toUpperCase(),
        description: groupForm.description.trim(),
        leaderName: groupForm.leaderName.trim(),
        leaderEmail: groupForm.leaderEmail.trim(),
        leaderPhone: groupForm.leaderPhone.trim(),
        region: groupForm.region.trim(),
        memberVolunteerIds: [],
        activeMissionIds: []
      }, {
        uid: currentUser.uid,
        email: currentUser.email || 'admin@fetindia.org',
        role: (activeRole || userProfile?.primaryRole || 'super_admin') as any
      });

      notify('success', `✓ Community Chapter "${groupForm.name}" created successfully!`);
      setIsCreatingGroup(false);
      setGroupForm({
        name: '',
        code: '',
        description: '',
        leaderName: '',
        leaderEmail: '',
        leaderPhone: '',
        region: 'Jammu & Kashmir'
      });
    } catch (err: any) {
      notify('error', `Failed to create chapter: ${err.message}`);
    }
  };

  // Verify Service Log Handler
  const handleVerifyServiceLog = async (log: VolunteerServiceRecord, status: 'approved' | 'rejected', notes?: string) => {
    if (!log.id || !currentUser) return;
    try {
      await verifyVolunteerServiceLog(
        log.id,
        status,
        notes || (status === 'approved' ? 'Service hours verified and credited by Trust Secretariat.' : 'Hours verification declined.'),
        {
          uid: currentUser.uid,
          email: currentUser.email || 'admin@fetindia.org',
          role: (activeRole || userProfile?.primaryRole || 'super_admin') as any
        }
      );

      notify('success', `✓ Service record marked as "${status.toUpperCase()}".`);
    } catch (err: any) {
      notify('error', `Service verification failed: ${err.message}`);
    }
  };

  // Save Volunteer Program & Chapter Assignment Handler
  const handleSaveVolunteerAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalVolunteer?.id) return;
    setIsSavingAssignment(true);

    try {
      const targetGroup = communityGroups.find(g => g.id === assignForm.assignedCommunityGroupId || g.code === assignForm.assignedCommunityGroupId);
      const groupName = targetGroup ? targetGroup.name : (assignForm.assignedCommunityGroupId ? 'Regional Chapter' : 'Unassigned Chapter');

      const appRef = doc(db, 'volunteerApplications', assignModalVolunteer.id);
      await updateDoc(appRef, {
        assignedWing: assignForm.assignedWing,
        assignedCategory: assignForm.assignedCategory,
        assignedCommunityGroupId: assignForm.assignedCommunityGroupId || '',
        assignedCommunityGroupName: groupName,
        updatedAt: new Date().toISOString()
      });

      // Also if a chapter was chosen, ensure volunteer ID is in chapter member list
      if (assignForm.assignedCommunityGroupId && targetGroup?.id) {
        const currentMembers = targetGroup.memberVolunteerIds || [];
        const volId = assignModalVolunteer.volunteerIdAssigned || assignModalVolunteer.applicantUid;
        if (!currentMembers.includes(volId)) {
          const grpRef = doc(db, 'community_groups', targetGroup.id);
          await updateDoc(grpRef, {
            memberVolunteerIds: [...currentMembers, volId],
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Update local state
      setApplications(prev => prev.map(item => item.id === assignModalVolunteer.id ? {
        ...item,
        assignedWing: assignForm.assignedWing,
        assignedCategory: assignForm.assignedCategory,
        assignedCommunityGroupId: assignForm.assignedCommunityGroupId,
        assignedCommunityGroupName: groupName
      } : item));

      notify('success', `✓ Assignment updated for ${assignModalVolunteer.fullLegalName}: ${assignForm.assignedWing} • ${groupName}`);
      setAssignModalVolunteer(null);
    } catch (err: any) {
      notify('error', `Failed to update volunteer assignment: ${err.message}`);
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // Assign Volunteer to Activity (Manual Direct Add by Admin)
  const handleAssignVolunteerToActivity = async (volunteerUidOrId: string) => {
    if (!activityCorpsModal?.id || !volunteerUidOrId) return;
    setIsUpdatingActivityCorps(true);

    try {
      const currentList = activityCorpsModal.assignedVolunteerIds || [];
      if (currentList.includes(volunteerUidOrId)) {
        notify('error', 'Volunteer is already assigned to this activity.');
        setIsUpdatingActivityCorps(false);
        return;
      }

      const updatedList = [...currentList, volunteerUidOrId];
      const actRef = doc(db, 'volunteer_activities', activityCorpsModal.id);
      await updateDoc(actRef, {
        assignedVolunteerIds: updatedList,
        updatedAt: new Date().toISOString()
      });

      setActivities(prev => prev.map(act => act.id === activityCorpsModal.id ? {
        ...act,
        assignedVolunteerIds: updatedList
      } : act));

      setActivityCorpsModal(prev => prev ? {
        ...prev,
        assignedVolunteerIds: updatedList
      } : null);

      setVolunteerToAddToActivity('');
      notify('success', '✓ Volunteer assigned to activity roster.');
    } catch (err: any) {
      notify('error', `Failed to assign volunteer: ${err.message}`);
    } finally {
      setIsUpdatingActivityCorps(false);
    }
  };

  // Remove Volunteer from Activity
  const handleRemoveVolunteerFromActivity = async (volunteerUidOrId: string) => {
    if (!activityCorpsModal?.id) return;
    setIsUpdatingActivityCorps(true);

    try {
      const updatedList = (activityCorpsModal.assignedVolunteerIds || []).filter(id => id !== volunteerUidOrId);
      const actRef = doc(db, 'volunteer_activities', activityCorpsModal.id);
      await updateDoc(actRef, {
        assignedVolunteerIds: updatedList,
        updatedAt: new Date().toISOString()
      });

      setActivities(prev => prev.map(act => act.id === activityCorpsModal.id ? {
        ...act,
        assignedVolunteerIds: updatedList
      } : act));

      setActivityCorpsModal(prev => prev ? {
        ...prev,
        assignedVolunteerIds: updatedList
      } : null);

      notify('success', 'Volunteer removed from activity roster.');
    } catch (err: any) {
      notify('error', `Failed to remove volunteer: ${err.message}`);
    } finally {
      setIsUpdatingActivityCorps(false);
    }
  };

  // Update Activity Status (Upcoming, In-Progress, Completed, Cancelled)
  const handleUpdateActivityStatus = async (activityId: string, newStatus: any) => {
    try {
      const actRef = doc(db, 'volunteer_activities', activityId);
      await updateDoc(actRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      setActivities(prev => prev.map(act => act.id === activityId ? {
        ...act,
        status: newStatus
      } : act));

      if (activityCorpsModal?.id === activityId) {
        setActivityCorpsModal(prev => prev ? { ...prev, status: newStatus } : null);
      }

      notify('success', `✓ Activity status changed to ${newStatus.toUpperCase()}.`);
    } catch (err: any) {
      notify('error', `Failed to update status: ${err.message}`);
    }
  };

  // Assign Volunteer to Chapter
  const handleAssignVolunteerToChapter = async (volunteerIdOrUid: string) => {
    if (!chapterCorpsModal?.id || !volunteerIdOrUid) return;
    setIsUpdatingChapterCorps(true);

    try {
      const currentList = chapterCorpsModal.memberVolunteerIds || [];
      if (currentList.includes(volunteerIdOrUid)) {
        notify('error', 'Volunteer is already a member of this chapter.');
        setIsUpdatingChapterCorps(false);
        return;
      }

      const updatedList = [...currentList, volunteerIdOrUid];
      const grpRef = doc(db, 'community_groups', chapterCorpsModal.id);
      await updateDoc(grpRef, {
        memberVolunteerIds: updatedList,
        updatedAt: new Date().toISOString()
      });

      setCommunityGroups(prev => prev.map(grp => grp.id === chapterCorpsModal.id ? {
        ...grp,
        memberVolunteerIds: updatedList
      } : grp));

      setChapterCorpsModal(prev => prev ? {
        ...prev,
        memberVolunteerIds: updatedList
      } : null);

      setVolunteerToAddToChapter('');
      notify('success', '✓ Volunteer assigned to chapter corps roster.');
    } catch (err: any) {
      notify('error', `Failed to assign volunteer: ${err.message}`);
    } finally {
      setIsUpdatingChapterCorps(false);
    }
  };

  // Remove Volunteer from Chapter
  const handleRemoveVolunteerFromChapter = async (volunteerIdOrUid: string) => {
    if (!chapterCorpsModal?.id) return;
    setIsUpdatingChapterCorps(true);

    try {
      const updatedList = (chapterCorpsModal.memberVolunteerIds || []).filter(id => id !== volunteerIdOrUid);
      const grpRef = doc(db, 'community_groups', chapterCorpsModal.id);
      await updateDoc(grpRef, {
        memberVolunteerIds: updatedList,
        updatedAt: new Date().toISOString()
      });

      setCommunityGroups(prev => prev.map(grp => grp.id === chapterCorpsModal.id ? {
        ...grp,
        memberVolunteerIds: updatedList
      } : grp));

      setChapterCorpsModal(prev => prev ? {
        ...prev,
        memberVolunteerIds: updatedList
      } : null);

      notify('success', 'Volunteer removed from chapter roster.');
    } catch (err: any) {
      notify('error', `Failed to remove volunteer: ${err.message}`);
    } finally {
      setIsUpdatingChapterCorps(false);
    }
  };

  // Export Volunteer Directory CSV
  const handleExportDirectoryCSV = () => {
    if (approvedVolunteers.length === 0) {
      notify('error', 'No volunteers available to export.');
      return;
    }

    const headers = [
      'Volunteer ID',
      'Full Legal Name',
      'Email',
      'Mobile Number',
      'State',
      'District',
      'Assigned Wing',
      'Assigned Chapter',
      'Skills',
      'Status',
      'Approved Date'
    ];

    const rows = filteredVolunteers.map(vol => [
      `"${vol.volunteerIdAssigned || 'N/A'}"`,
      `"${vol.fullLegalName || ''}"`,
      `"${vol.applicantEmail || ''}"`,
      `"${vol.mobileNumber || ''}"`,
      `"${vol.state || ''}"`,
      `"${vol.district || ''}"`,
      `"${vol.assignedWing || 'General Corps'}"`,
      `"${vol.assignedCommunityGroupName || 'Main Corps'}"`,
      `"${(vol.skills || []).join(', ')}"`,
      `"${vol.status || ''}"`,
      `"${vol.approvedAt || vol.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FET_India_Volunteer_Corps_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify('success', '✓ Volunteer Corps Directory CSV generated and downloaded!');
  };

  // Filtered Applications
  const filteredApps = applications.filter((app) => {
    const matchesStatus = appStatusFilter === 'all' || app.status === appStatusFilter;
    const matchesSearch =
      appSearchQuery === '' ||
      app.fullLegalName?.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      app.applicantEmail?.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      app.district?.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      app.state?.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      app.skills?.some(s => s.toLowerCase().includes(appSearchQuery.toLowerCase())) ||
      app.areasOfInterest?.some(a => a.toLowerCase().includes(appSearchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  // Approved Volunteers for Directory
  const approvedVolunteers = applications.filter(app => 
    app.status === 'approved' || app.status === 'suspended' || app.status === 'inactive'
  );

  // Multi-Filter for Directory
  const filteredVolunteers = approvedVolunteers.filter((vol) => {
    const matchesSearch =
      dirSearchQuery === '' ||
      vol.fullLegalName?.toLowerCase().includes(dirSearchQuery.toLowerCase()) ||
      vol.applicantEmail?.toLowerCase().includes(dirSearchQuery.toLowerCase()) ||
      vol.volunteerIdAssigned?.toLowerCase().includes(dirSearchQuery.toLowerCase()) ||
      vol.district?.toLowerCase().includes(dirSearchQuery.toLowerCase()) ||
      vol.state?.toLowerCase().includes(dirSearchQuery.toLowerCase()) ||
      vol.skills?.some(s => s.toLowerCase().includes(dirSearchQuery.toLowerCase())) ||
      vol.areasOfInterest?.some(a => a.toLowerCase().includes(dirSearchQuery.toLowerCase()));

    const matchesWing =
      dirWingFilter === 'all' ||
      vol.assignedWing?.toLowerCase().includes(dirWingFilter.toLowerCase()) ||
      vol.areasOfInterest?.some(a => a.toLowerCase().includes(dirWingFilter.toLowerCase()));

    const matchesState = dirStateFilter === 'all' || vol.state?.toLowerCase() === dirStateFilter.toLowerCase();
    const matchesStatus = dirStatusFilter === 'all' || vol.status === dirStatusFilter;

    return matchesSearch && matchesWing && matchesState && matchesStatus;
  });

  // Unique list of states in approved volunteers
  const uniqueStates = Array.from(new Set(approvedVolunteers.map(v => v.state).filter(Boolean)));

  // Metrics
  const totalAppsCount = applications.length;
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const underReviewCount = applications.filter(a => a.status === 'under_review').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const pendingLogsCount = serviceLogs.filter(l => l.status === 'pending_verification').length;

  return (
    <div className="space-y-6" id="admin-volunteer-community-console">
      
      {/* Top Banner Notice */}
      {noticeMessage && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-md animate-in fade-in ${
          noticeMessage.type === 'success'
            ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
            : 'bg-rose-50 border border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {noticeMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{noticeMessage.text}</span>
          </div>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Console Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                Chapter 02
              </span>
              <h1 className="text-xl font-black text-slate-900">
                Volunteer & Community Management Console
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Super Admin pipeline for volunteer intake, corps directory, mission scheduling, regional chapters, and service hours audit.
            </p>
          </div>
        </div>

        {/* Global Pipeline Counters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-20">
            <div className="text-base font-black text-slate-900">{totalAppsCount}</div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-center min-w-20">
            <div className="text-base font-black text-amber-900">{pendingCount}</div>
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">Pending</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-center min-w-20">
            <div className="text-base font-black text-emerald-900">{approvedCount}</div>
            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Corps</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-center min-w-20">
            <div className="text-base font-black text-blue-900">{activities.length}</div>
            <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Missions</span>
          </div>

          {pendingLogsCount > 0 && (
            <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-center min-w-20 animate-pulse">
              <div className="text-base font-black text-rose-900">{pendingLogsCount}</div>
              <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider">Hours Audit</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-white px-4 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('applications')}
          className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'applications'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
          id="tab-volunteer-applications"
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Volunteer Applications</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-black">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('member_applications')}
          className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'member_applications'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
          id="tab-volunteer-member-applications"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Member Application Intake / Member Applications</span>
        </button>

        <button
          onClick={() => setActiveTab('volunteers')}
          className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'volunteers'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Volunteer Corps Directory</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {approvedVolunteers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'activities'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Missions & Activities Scheduler</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {activities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('community_groups')}
          className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'community_groups'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Community Groups & Chapters</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {communityGroups.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('service_logs')}
          className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'service_logs'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Hours Audit & Certifications</span>
          {pendingLogsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-900 font-bold">
              {pendingLogsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Categories & Taxonomies</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 0. MEMBER APPLICATION INTAKE / MEMBER APPLICATIONS TAB */}
      {/* ============================================================ */}
      {activeTab === 'member_applications' && (
        <div className="space-y-4 animate-in fade-in" id="volunteer-member-applications-container">
          <AdminMembershipApplicationsView />
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. VOLUNTEER APPLICATIONS QUEUE TAB */}
      {/* ============================================================ */}
      {activeTab === 'applications' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Controls Bar: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search applicants by name, email, district, skills, or interest..."
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {(['all', 'pending', 'under_review', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setAppStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    appStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'All Applications' : st.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Applications Table */}
          {isLoadingApps ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Loading Volunteer Applications...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No Volunteer Applications Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No submissions match the selected filter criteria. When users register to volunteer, they will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Applicant</th>
                      <th className="p-4">Location / District</th>
                      <th className="p-4">Key Skills & Interests</th>
                      <th className="p-4">Availability</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {app.photoURL ? (
                              <img
                                src={app.photoURL}
                                alt={app.fullLegalName}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                                {app.fullLegalName?.[0]?.toUpperCase() || 'V'}
                              </div>
                            )}
                            <div>
                              <div className="font-black text-slate-900 flex items-center gap-1.5">
                                <span>{app.fullLegalName}</span>
                                {app.volunteerIdAssigned && (
                                  <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    {app.volunteerIdAssigned}
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-slate-500">{app.applicantEmail}</div>
                              {app.fatherName && (
                                <div className="text-[10px] text-slate-400">S/D/O {app.fatherName}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-slate-800">{app.district || 'District N/A'}</div>
                          <div className="text-[11px] text-slate-500">{app.state || 'India'}</div>
                        </td>

                        <td className="p-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {app.skills?.slice(0, 2).map((sk) => (
                              <span key={sk} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {sk}
                              </span>
                            ))}
                            {app.areasOfInterest?.slice(0, 1).map((aoi) => (
                              <span key={aoi} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {aoi}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="text-slate-700 font-semibold">{app.availability || 'Flexible'}</span>
                        </td>

                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            app.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : app.status === 'rejected'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : app.status === 'under_review'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {app.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                            <span>{app.status.replace('_', ' ')}</span>
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>

                            {app.status === 'pending' && (
                              <button
                                onClick={() => handleQuickApprove(app)}
                                disabled={processingAppId === app.id}
                                className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{processingAppId === app.id ? 'Approving...' : 'Approve'}</span>
                              </button>
                            )}
                          </div>
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

      {/* ============================================================ */}
      {/* 2. VOLUNTEER CORPS DIRECTORY TAB */}
      {/* ============================================================ */}
      {activeTab === 'volunteers' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Top Bar with Search, Multi-Filter, and CSV Export */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Active Volunteer Corps Directory</h3>
                <p className="text-xs text-slate-500">Directory of inducted volunteers, wing assignments, and standing status.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-black text-xs rounded-full">
                  {filteredVolunteers.length} of {approvedVolunteers.length} Active Corps
                </span>
                <button
                  onClick={handleExportDirectoryCSV}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Comprehensive Search & Multi-Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, ID, email, skills..."
                  value={dirSearchQuery}
                  onChange={(e) => setDirSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <select
                  value={dirWingFilter}
                  onChange={(e) => setDirWingFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="all">All Service Wings</option>
                  <option value="Education">Education & Academic</option>
                  <option value="Healthcare">Healthcare & Medical</option>
                  <option value="Women">Women Empowerment & Skills</option>
                  <option value="Disaster">Disaster Relief & Food Aid</option>
                  <option value="General">General Operations</option>
                </select>
              </div>

              <div>
                <select
                  value={dirStateFilter}
                  onChange={(e) => setDirStateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="all">All States / UTs</option>
                  {uniqueStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={dirStatusFilter}
                  onChange={(e) => setDirStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Active / Approved</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {filteredVolunteers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">No Matching Volunteers in Directory</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No volunteers match the current search and filter parameters. Try clearing the filters or searching for another term.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVolunteers.map((vol) => (
                <div
                  key={vol.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {vol.photoURL ? (
                          <img
                            src={vol.photoURL}
                            alt={vol.fullLegalName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-600 shadow-2xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white font-black text-lg flex items-center justify-center shadow-2xs">
                            {vol.fullLegalName[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-black text-slate-900 text-sm leading-snug">{vol.fullLegalName}</h4>
                          <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                            {vol.volunteerIdAssigned || 'FET-VOL'}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        vol.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-900'
                          : vol.status === 'suspended'
                          ? 'bg-rose-100 text-rose-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {vol.status === 'approved' ? 'Active' : vol.status}
                      </span>
                    </div>

                    {/* Program & Wing Assignment Badge */}
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Assigned Wing:</span>
                        <span className="font-bold text-emerald-800 truncate max-w-[140px]">{vol.assignedWing || 'General Corps'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Chapter:</span>
                        <span className="font-bold text-slate-700 truncate max-w-[140px]">{vol.assignedCommunityGroupName || 'FET National Chapter'}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{vol.applicantEmail}</span>
                      </div>
                      {vol.mobileNumber && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{vol.mobileNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{vol.district}, {vol.state}</span>
                      </div>
                    </div>

                    {vol.skills && vol.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {vol.skills.slice(0, 3).map((sk) => (
                          <span key={sk} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <button
                        onClick={() => setSelectedApp(vol)}
                        className="text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Dossier</span>
                      </button>

                      <button
                        onClick={() => {
                          setAssignModalVolunteer(vol);
                          setAssignForm({
                            assignedWing: vol.assignedWing || 'Education & Academic Mentorship',
                            assignedCommunityGroupId: vol.assignedCommunityGroupId || '',
                            assignedCategory: vol.assignedCategory || 'Academic Tutoring & Coaching'
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        Assign Wing
                      </button>

                      <button
                        onClick={() => setPreviewIdVolunteer(vol)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <QrCode className="w-3 h-3" />
                        <span>ID Card</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      {vol.status === 'approved' ? (
                        <button
                          onClick={() => handleDirectoryStatusChange(vol, 'suspended')}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                          title="Suspend Volunteer Clearance"
                        >
                          Suspend Volunteer
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDirectoryStatusChange(vol, 'approved')}
                          className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                          title="Reactivate Volunteer"
                        >
                          Reactivate Volunteer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MISSIONS & ACTIVITIES SCHEDULER TAB */}
      {/* ============================================================ */}
      {activeTab === 'activities' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900">Volunteer Mission Board & Deployment</h3>
              <p className="text-xs text-slate-500">Schedule educational drives, medical camps, and community relief initiatives.</p>
            </div>

            <button
              onClick={() => setIsCreatingActivity(true)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Publish New Mission</span>
            </button>
          </div>

          {/* Activity Cards List */}
          {activities.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Activity className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">No Volunteer Missions Created Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create and schedule the first volunteer activity for coaching, relief aid distribution, or medical camps.
              </p>
              <button
                onClick={() => setIsCreatingActivity(true)}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Create First Activity
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {act.category}
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-1">{act.title}</h4>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-900 border border-blue-200 shrink-0">
                        +{act.hoursCredit} Hrs Credit
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{act.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{act.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-slate-500">Enrolled: </span>
                      <strong className="text-emerald-800 font-bold">{act.assignedVolunteerIds?.length || act.enrolledVolunteerIds?.length || 0} / {act.maxVolunteers}</strong>
                    </div>

                    <button
                      onClick={() => setActivityCorpsModal(act)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Manage Corps & Status</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. COMMUNITY GROUPS & CHAPTERS TAB */}
      {/* ============================================================ */}
      {activeTab === 'community_groups' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900">Regional Community Groups & Chapters</h3>
              <p className="text-xs text-slate-500">Decentralized volunteer coordination wings across districts and states.</p>
            </div>

            <button
              onClick={() => setIsCreatingGroup(true)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Chapter</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communityGroups.map((grp) => (
              <div
                key={grp.id || grp.code}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                      {grp.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
                      {grp.region}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900">{grp.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{grp.description}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 space-y-1 text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Lead:</span>
                      <span className="font-bold text-slate-900">{grp.leaderName}</span>
                    </div>
                    {grp.leaderEmail && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-mono text-[11px] truncate max-w-[150px]">{grp.leaderEmail}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1">
                    <span>Corps: <strong>{grp.memberVolunteerIds?.length || 0} volunteers</strong></span>
                    <button
                      onClick={() => setChapterCorpsModal(grp)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer transition-colors"
                    >
                      View Roster
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. SERVICE HOURS AUDIT & CERTIFICATIONS TAB */}
      {/* ============================================================ */}
      {activeTab === 'service_logs' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900">Volunteer Hours Audit & Certificate Issuance</h3>
              <p className="text-xs text-slate-500">Review volunteer service hour submissions and credit official certificates.</p>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['all', 'pending_verification', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setServiceStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    serviceStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'All Logs' : st.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {serviceLogs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">No Volunteer Hours Submitted Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When inducted volunteers submit their completed mission hours from the member dashboard, they will appear here for audit.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Volunteer</th>
                      <th className="p-4">Mission Title & Category</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Hours</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Audit Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceLogs
                      .filter(log => serviceStatusFilter === 'all' || log.status === serviceStatusFilter)
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4">
                            <div className="font-black text-slate-900">{log.volunteerName}</div>
                            <div className="font-mono text-[11px] text-slate-500">{log.volunteerId}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{log.activityTitle}</div>
                            <div className="text-[11px] text-slate-500">{log.category} • {log.location || 'Field'}</div>
                          </td>
                          <td className="p-4 font-semibold text-slate-700">{log.date}</td>
                          <td className="p-4 font-black text-slate-900">{log.hoursServed} hrs</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              log.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : log.status === 'rejected'
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {log.status === 'approved' ? 'Verified' : log.status === 'rejected' ? 'Declined' : 'Pending Audit'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {log.status === 'pending_verification' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleVerifyServiceLog(log, 'approved')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Verify & Credit</span>
                                </button>
                                <button
                                  onClick={() => handleVerifyServiceLog(log, 'rejected')}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[11px] cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">
                                {log.status === 'approved' ? `Cert: ${log.certificateId || 'Issued'}` : 'Archived'}
                              </span>
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

      {/* ============================================================ */}
      {/* 6. CATEGORIES & TAXONOMIES TAB */}
      {/* ============================================================ */}
      {activeTab === 'categories' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900">Volunteer Functional Categories & Skill Taxonomies</h3>
            <p className="text-xs text-slate-500">Official classification framework for FET India volunteer deployments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEFAULT_VOLUNTEER_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">{cat.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{cat.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Core Skills Required:</span>
                  <div className="flex flex-wrap gap-1">
                    {cat.requiredSkills.map((sk) => (
                      <span key={sk} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CREATE VOLUNTEER ACTIVITY */}
      {/* ============================================================ */}
      {isCreatingActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>Publish New Volunteer Mission / Activity</span>
              </h3>
              <button onClick={() => setIsCreatingActivity(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mission Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Science & Math Coaching Camp"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={activityForm.category}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs cursor-pointer"
                  >
                    {DEFAULT_VOLUNTEER_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={activityForm.date}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location / Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anantnag Community Center"
                    value={activityForm.location}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hours Credit *</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={activityForm.hoursCredit}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, hoursCredit: parseInt(e.target.value) || 4 }))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the mission objective, volunteer roles, and schedule..."
                  value={activityForm.description}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingActivity(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 cursor-pointer shadow-md"
                >
                  Publish Mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CREATE COMMUNITY GROUP CHAPTER */}
      {/* ============================================================ */}
      {isCreatingGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-700" />
                <span>Establish Regional Community Chapter / Wing</span>
              </h3>
              <button onClick={() => setIsCreatingGroup(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chapter Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kashmir Valley Volunteer Chapter"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unique Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FET-CHAPTER-KMR"
                    value={groupForm.code}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Region / State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jammu & Kashmir"
                    value={groupForm.region}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chapter Leader Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Abrar H. Mir"
                  value={groupForm.leaderName}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, leaderName: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Leader Email</label>
                  <input
                    type="email"
                    placeholder="lead@fetindia.org"
                    value={groupForm.leaderEmail}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, leaderEmail: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Leader Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 94190 00000"
                    value={groupForm.leaderPhone}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, leaderPhone: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mandate & Description</label>
                <textarea
                  rows={2}
                  placeholder="Focus areas, coverage districts, and chapter objectives..."
                  value={groupForm.description}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingGroup(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 cursor-pointer shadow-md"
                >
                  Establish Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: APPLICATION DOSSIER & REVIEW DRAWER */}
      {/* ============================================================ */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Volunteer Application Dossier</h3>
                  <p className="text-xs text-slate-400 font-mono">UID: {selectedApp.applicantUid}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Profile Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {selectedApp.photoURL ? (
                <img
                  src={selectedApp.photoURL}
                  alt={selectedApp.fullLegalName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-white font-black text-2xl flex items-center justify-center">
                  {selectedApp.fullLegalName[0]?.toUpperCase()}
                </div>
              )}

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-slate-900">{selectedApp.fullLegalName}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedApp.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-900'
                      : selectedApp.status === 'rejected'
                      ? 'bg-rose-100 text-rose-900'
                      : selectedApp.status === 'under_review'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {selectedApp.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                  <span>Email: <strong>{selectedApp.applicantEmail}</strong></span>
                  <span>Mobile: <strong>{selectedApp.mobileNumber || 'N/A'}</strong></span>
                  {selectedApp.fatherName && <span>Parent: <strong>{selectedApp.fatherName}</strong></span>}
                  <span>Location: <strong>{selectedApp.district}, {selectedApp.state}</strong></span>
                </div>
              </div>
            </div>

            {/* Dossier Fields */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Qualification</span>
                  <span className="font-semibold text-slate-900">{selectedApp.educationQualification || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Availability</span>
                  <span className="font-semibold text-slate-900">{selectedApp.availability || 'Flexible'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Address</span>
                  <span className="text-slate-700">{selectedApp.fullAddress || `${selectedApp.district}, ${selectedApp.state}`}</span>
                </div>
              </div>

              {/* Skills & Interests */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Skills & Capabilities</span>
                <div className="flex flex-wrap gap-1">
                  {selectedApp.skills?.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold text-xs">
                      {s}
                    </span>
                  ))}
                </div>

                <span className="text-slate-400 font-bold uppercase text-[10px] block pt-2">Areas of Interest / Trust Programs</span>
                <div className="flex flex-wrap gap-1">
                  {selectedApp.areasOfInterest?.map(a => (
                    <span key={a} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold text-xs">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Statement of Purpose */}
              {selectedApp.statementOfPurpose && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Statement of Purpose</span>
                  <p className="text-slate-800 italic leading-relaxed">"{selectedApp.statementOfPurpose}"</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewAction('under_review')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                >
                  Under Review
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('rejected')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('approved')}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 cursor-pointer shadow-md"
                >
                  Approve Volunteer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CONFIRM REVIEW DECISION */}
      {/* ============================================================ */}
      {reviewAction && selectedApp && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                reviewAction === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : reviewAction === 'rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {reviewAction === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Decision: {reviewAction.replace('_', ' ').toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500 font-mono">Applicant: {selectedApp.fullLegalName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {reviewAction === 'approved' &&
                'Approving this application will generate an official Volunteer ID, assign volunteer clearances in Firestore, and register the volunteer in the active corps directory.'}
              {reviewAction === 'under_review' &&
                'Moving this application to Under Review flags it for committee review and orientation scheduling.'}
              {reviewAction === 'rejected' &&
                'Declining this application will update the status and notify the applicant.'}
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Internal Secretariat Remarks (Optional)</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Remarks, chapter assignment, or feedback..."
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setReviewAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={isProcessingReview}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50 ${
                  reviewAction === 'approved'
                    ? 'bg-emerald-800 hover:bg-emerald-700'
                    : reviewAction === 'rejected'
                    ? 'bg-rose-700 hover:bg-rose-600'
                    : 'bg-blue-800 hover:bg-blue-700'
                }`}
              >
                {isProcessingReview ? 'Saving...' : `Confirm ${reviewAction.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ASSIGN PROGRAM WING & REGIONAL CHAPTER */}
      {/* ============================================================ */}
      {assignModalVolunteer && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Assign Program Wing & Chapter</h3>
                  <p className="text-xs text-slate-500 font-mono">Volunteer: {assignModalVolunteer.fullLegalName}</p>
                </div>
              </div>

              <button
                onClick={() => setAssignModalVolunteer(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVolunteerAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Service Wing</label>
                <select
                  value={assignForm.assignedWing}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, assignedWing: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Education & Academic Mentorship">Education & Academic Mentorship</option>
                  <option value="Healthcare & Medical Camps">Healthcare & Medical Camps</option>
                  <option value="Women Empowerment & Skill Hub">Women Empowerment & Skill Hub</option>
                  <option value="Disaster Relief & Food Drives">Disaster Relief & Food Drives</option>
                  <option value="Community Welfare & Outreach">Community Welfare & Outreach</option>
                  <option value="General Volunteer Corps">General Volunteer Corps</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Community Group / Chapter</label>
                <select
                  value={assignForm.assignedCommunityGroupId}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, assignedCommunityGroupId: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">National Central Corps (Unassigned Chapter)</option>
                  {communityGroups.map(grp => (
                    <option key={grp.id || grp.code} value={grp.id || grp.code}>
                      {grp.name} ({grp.code} - {grp.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Volunteer Functional Role</label>
                <select
                  value={assignForm.assignedCategory}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, assignedCategory: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Academic Tutoring & Coaching">Academic Tutoring & Coaching</option>
                  <option value="Medical Assistance & Health Camps">Medical Assistance & Health Camps</option>
                  <option value="Emergency Food Distribution">Emergency Food Distribution</option>
                  <option value="IT, Media & Digital Outreach">IT, Media & Digital Outreach</option>
                  <option value="Women Vocational Training">Women Vocational Training</option>
                  <option value="Event Coordination & Logistics">Event Coordination & Logistics</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAssignModalVolunteer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAssignment}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSavingAssignment ? 'Saving...' : 'Save Wing & Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: DIGITAL VOLUNTEER ID CARD PREVIEW */}
      {/* ============================================================ */}
      {previewIdVolunteer && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">Digital Volunteer ID Card</h3>
              </div>

              <button
                onClick={() => setPreviewIdVolunteer(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center py-2">
              <DigitalVolunteerCard
                fullName={previewIdVolunteer.fullLegalName}
                volunteerId={previewIdVolunteer.volunteerIdAssigned || 'FET-VOL-ID'}
                photoURL={previewIdVolunteer.photoURL}
                volunteerWing={previewIdVolunteer.assignedWing || previewIdVolunteer.areasOfInterest?.[0] || 'General Volunteer Corps'}
                district={previewIdVolunteer.district}
                state={previewIdVolunteer.state}
                issueDate={previewIdVolunteer.approvedAt?.split('T')[0] || new Date().toISOString().split('T')[0]}
                validUntil="31-DEC-2027"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">Official Card for FET India Corps</span>
              <button
                onClick={() => setPreviewIdVolunteer(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ACTIVITY CORPS MANAGEMENT & STATUS */}
      {/* ============================================================ */}
      {activityCorpsModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{activityCorpsModal.title}</h3>
                  <p className="text-xs text-slate-500 font-mono">{activityCorpsModal.category} • {activityCorpsModal.date}</p>
                </div>
              </div>

              <button
                onClick={() => setActivityCorpsModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mission Status Controller */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700">Mission Status:</span>
              <div className="flex flex-wrap gap-2">
                {(['upcoming', 'in_progress', 'completed', 'cancelled'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => handleUpdateActivityStatus(activityCorpsModal.id!, st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                      activityCorpsModal.status === st
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Volunteer from Directory to this Activity */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-950">Direct Assign Volunteer to Mission:</span>
              <div className="flex gap-2">
                <select
                  value={volunteerToAddToActivity}
                  onChange={(e) => setVolunteerToAddToActivity(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">Select an inducted volunteer...</option>
                  {approvedVolunteers.map(vol => (
                    <option key={vol.id} value={vol.volunteerIdAssigned || vol.applicantUid}>
                      {vol.fullLegalName} ({vol.volunteerIdAssigned || 'FET-VOL'}) - {vol.district}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssignVolunteerToActivity(volunteerToAddToActivity)}
                  disabled={!volunteerToAddToActivity || isUpdatingActivityCorps}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                >
                  Assign
                </button>
              </div>
            </div>

            {/* Enrolled / Assigned Volunteers List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Deployed Volunteer Corps:</span>
                <span>{(activityCorpsModal.assignedVolunteerIds || []).length} Assigned</span>
              </div>

              {(activityCorpsModal.assignedVolunteerIds || []).length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                  No volunteers currently assigned. Select a volunteer above to deploy them to this activity.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {(activityCorpsModal.assignedVolunteerIds || []).map((volId) => {
                    const matchedVol = applications.find(a => a.volunteerIdAssigned === volId || a.applicantUid === volId);
                    return (
                      <div key={volId} className="p-3 flex items-center justify-between gap-2 bg-white hover:bg-slate-50 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-bold flex items-center justify-center text-xs">
                            {matchedVol?.fullLegalName?.[0] || 'V'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{matchedVol?.fullLegalName || volId}</div>
                            <div className="text-[11px] text-slate-500">{matchedVol?.district || 'District Base'} • {matchedVol?.mobileNumber || volId}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveVolunteerFromActivity(volId)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActivityCorpsModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: COMMUNITY CHAPTER CORPS ROSTER */}
      {/* ============================================================ */}
      {chapterCorpsModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{chapterCorpsModal.name} Roster</h3>
                  <p className="text-xs text-slate-500 font-mono">{chapterCorpsModal.code} • {chapterCorpsModal.region}</p>
                </div>
              </div>

              <button
                onClick={() => setChapterCorpsModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Volunteer to this Chapter */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-950">Add Volunteer to Chapter:</span>
              <div className="flex gap-2">
                <select
                  value={volunteerToAddToChapter}
                  onChange={(e) => setVolunteerToAddToChapter(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">Select an inducted volunteer...</option>
                  {approvedVolunteers.map(vol => (
                    <option key={vol.id} value={vol.volunteerIdAssigned || vol.applicantUid}>
                      {vol.fullLegalName} ({vol.volunteerIdAssigned || 'FET-VOL'}) - {vol.district}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssignVolunteerToChapter(volunteerToAddToChapter)}
                  disabled={!volunteerToAddToChapter || isUpdatingChapterCorps}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Chapter Members List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Enrolled Chapter Volunteers:</span>
                <span>{(chapterCorpsModal.memberVolunteerIds || []).length} Volunteers</span>
              </div>

              {(chapterCorpsModal.memberVolunteerIds || []).length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                  No volunteers assigned to this chapter yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {(chapterCorpsModal.memberVolunteerIds || []).map((volId) => {
                    const matchedVol = applications.find(a => a.volunteerIdAssigned === volId || a.applicantUid === volId);
                    return (
                      <div key={volId} className="p-3 flex items-center justify-between gap-2 bg-white hover:bg-slate-50 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-bold flex items-center justify-center text-xs">
                            {matchedVol?.fullLegalName?.[0] || 'V'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{matchedVol?.fullLegalName || volId}</div>
                            <div className="text-[11px] text-slate-500">{matchedVol?.district || 'District Base'} • {matchedVol?.mobileNumber || volId}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveVolunteerFromChapter(volId)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setChapterCorpsModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
