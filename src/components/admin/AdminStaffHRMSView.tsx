/**
 * @license
 * FET India HRMS & Staff Management Console (Step 47)
 * Fatimyah Educational Trust India
 * Organization Legal Name: Fatimyah Educational Trust
 * Regd. in Jammu & Kashmir through SDM Office (1994) • DARPAN: JK/2026/1153821 • PAN: AABTF0015H
 *
 * Capabilities:
 * - Real-time Trust Staff & Faculty Directory
 * - Granular Summaries: Total, Active, On Leave, Inactive, by Department & Designation
 * - Integrated Staff Profile Management using existing UserProfile schema & Firestore
 * - Official Staff Digital Identity Card Generation, Print & 300 DPI PDF/PNG Export
 * - Non-sensitive, secure Public QR code credential verification
 * - Private Staff Documents Storage & Verification (Appointment, Qualifications, KYC, Police Verification)
 * - Clear distinction between Organizational Designations and System RBAC Roles
 * - Departmental Hierarchy & Headcount Tracking without duplicate collections
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserCog, 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  FileText, 
  CreditCard, 
  Building2, 
  GraduationCap, 
  BookOpen, 
  Landmark, 
  ShieldCheck, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Layers, 
  Eye, 
  Printer, 
  ChevronRight, 
  Sparkles, 
  Award,
  HeartHandshake,
  Activity,
  FileCheck,
  Paperclip,
  Check,
  RefreshCw
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { 
  db, 
  updateStaffMemberProfile, 
  enrollStaffMember, 
  addStaffDocumentRecord, 
  deleteStaffDocumentRecord 
} from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { 
  UserProfile, 
  UserRole, 
  StaffEmploymentStatus, 
  StaffEmploymentType, 
  StaffDocumentRecord, 
  StaffDocumentType 
} from '../../types';
import { ROLE_DEFINITIONS, getRoleMetadata } from '../../lib/rbac';
import { IDCardPrintDownloadModal } from '../idcard/IDCardPrintDownloadModal';
import { FETIdentityCard } from '../idcard/FETIdentityCard';

// Standard Trust Departments
export const TRUST_DEPARTMENTS = [
  'Academics & Schools',
  'Madrasa & Religious Studies',
  'Finance, Trust Accounts & Audit',
  'Executive Secretariat & Admin',
  'Social Welfare & Relief',
  'Technology & Media',
  'Healthcare & Medical',
  'Operations & Logistics'
] as const;

// Common Organizational Designations
export const COMMON_DESIGNATIONS = [
  'Senior Educator / Teacher',
  'Assistant Teacher / Faculty',
  'Headmaster / Principal',
  'Hifz & Tajweed Ustadh',
  'Alim / Islamic Scholar',
  'Accounts & Finance Officer',
  'Trust Coordinator',
  'Administrative Officer',
  'Welfare & Field Officer',
  'IT & Systems Engineer',
  'Medical Consultant',
  'Executive Secretary',
  'Operations Supervisor',
  'Support & Maintenance Staff'
] as const;

export const AdminStaffHRMSView: React.FC = () => {
  const { currentUser, userProfile, activeRole, isSuperAdmin } = useAuth();
  const { config } = useConfig();

  // Real-time Firestore users state
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | StaffEmploymentStatus>('all');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('table');

  // Selected staff for Profile Drawer / Edit
  const [selectedStaff, setSelectedStaff] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'personal' | 'employment' | 'documents' | 'idcard'>('personal');

  // Form State for Editing Staff
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ID Card Modal State
  const [idCardTargetStaff, setIdCardTargetStaff] = useState<UserProfile | null>(null);

  // New Staff Enrollment Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [enrollSearchTerm, setEnrollSearchTerm] = useState<string>('');
  const [selectedUserToEnroll, setSelectedUserToEnroll] = useState<UserProfile | null>(null);
  const [enrollForm, setEnrollForm] = useState({
    staffId: '',
    department: 'Academics & Schools',
    designation: 'Senior Educator / Teacher',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentStatus: 'active' as StaffEmploymentStatus,
    employmentType: 'full_time' as StaffEmploymentType,
    workLocation: 'Central Secretariat, Mumbai',
    notes: ''
  });

  // Add Document Modal State
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState<boolean>(false);
  const [docForm, setDocForm] = useState<{
    title: string;
    documentType: StaffDocumentType;
    fileUrl: string;
    fileName: string;
    verified: boolean;
    notes: string;
  }>({
    title: '',
    documentType: 'appointment_letter',
    fileUrl: '',
    fileName: '',
    verified: true,
    notes: ''
  });

  // Notification helper
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  // 1. Subscribe to Firestore users collection
  useEffect(() => {
    setIsLoading(true);
    const usersQuery = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        usersList.push(docSnap.data() as UserProfile);
      });
      setAllUsers(usersList);
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to users for HRMS:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Identify Staff members from user profiles
  // A user is staff if: isStaff === true OR staffId is present OR employmentStatus is present OR roles contain staff-relevant admin roles
  const staffList = useMemo(() => {
    return allUsers.filter(u => {
      if (u.isStaff) return true;
      if (u.staffId && u.staffId.trim().length > 0) return true;
      if (u.employmentStatus) return true;
      if (u.designation && u.designation.trim().length > 0 && u.department) return true;
      // Also include users with operational admin roles if they have a department
      const staffRoles = ['hr_admin', 'school_admin', 'madrasa_admin', 'finance_admin', 'content_admin'];
      if (u.roles?.some(r => staffRoles.includes(r)) && (u.department || u.designation)) return true;
      return false;
    });
  }, [allUsers]);

  // Sync selectedStaff if updated in Firestore
  useEffect(() => {
    if (selectedStaff) {
      const updated = allUsers.find(u => u.uid === selectedStaff.uid);
      if (updated) {
        setSelectedStaff(updated);
      }
    }
  }, [allUsers, selectedStaff?.uid]);

  // 3. Real Staff Statistics
  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter(s => s.employmentStatus === 'active' || !s.employmentStatus).length;
    const probation = staffList.filter(s => s.employmentStatus === 'probation').length;
    const onLeave = staffList.filter(s => s.employmentStatus === 'on_leave').length;
    const inactive = staffList.filter(s => s.employmentStatus === 'inactive' || s.employmentStatus === 'resigned' || s.employmentStatus === 'terminated').length;
    
    // Department breakdown
    const deptCount: Record<string, number> = {};
    staffList.forEach(s => {
      const d = s.department || 'Academics & Schools';
      deptCount[d] = (deptCount[d] || 0) + 1;
    });

    // Designation breakdown
    const desigCount: Record<string, number> = {};
    staffList.forEach(s => {
      const des = s.designation || 'Staff Member';
      desigCount[des] = (desigCount[des] || 0) + 1;
    });

    return {
      total,
      active,
      probation,
      onLeave,
      inactive,
      deptCount,
      desigCount
    };
  }, [staffList]);

  // 4. Filtered Staff List
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const name = (s.fullName || s.fullLegalName || s.displayName || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const id = (s.staffId || '').toLowerCase();
        const phone = (s.mobileNumber || s.phoneNumber || '').toLowerCase();
        const desig = (s.designation || '').toLowerCase();
        const dept = (s.department || '').toLowerCase();
        const district = (s.district || s.city || '').toLowerCase();

        const matches = name.includes(query) || email.includes(query) || id.includes(query) || phone.includes(query) || desig.includes(query) || dept.includes(query) || district.includes(query);
        if (!matches) return false;
      }

      // Department filter
      if (selectedDepartment !== 'all') {
        const d = s.department || 'Academics & Schools';
        if (d !== selectedDepartment) return false;
      }

      // Designation filter
      if (selectedDesignation !== 'all') {
        const des = s.designation || 'Staff Member';
        if (des !== selectedDesignation) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const st = s.employmentStatus || 'active';
        if (st !== statusFilter) return false;
      }

      return true;
    });
  }, [staffList, searchTerm, selectedDepartment, selectedDesignation, statusFilter]);

  // Non-staff registered users available for staff enrollment
  const nonStaffUsers = useMemo(() => {
    return allUsers.filter(u => {
      const isAlreadyStaff = staffList.some(s => s.uid === u.uid);
      if (isAlreadyStaff) return false;
      if (enrollSearchTerm.trim()) {
        const q = enrollSearchTerm.toLowerCase();
        const name = (u.fullName || u.displayName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [allUsers, staffList, enrollSearchTerm]);

  // Handlers
  const handleOpenEditProfile = (staff: UserProfile) => {
    setSelectedStaff(staff);
    setEditFormData({
      fullName: staff.fullName || staff.displayName || '',
      fatherName: staff.fatherName || staff.guardianName || '',
      motherName: staff.motherName || '',
      mobileNumber: staff.mobileNumber || staff.phoneNumber || '',
      email: staff.email || '',
      country: staff.country || 'India',
      state: staff.state || 'Maharashtra',
      district: staff.district || 'Mumbai',
      address: staff.address || staff.fullAddress || '',
      pincode: staff.pincode || '',
      emergencyContact: staff.emergencyContact || '',
      bloodGroup: staff.bloodGroup || 'B+',
      dateOfBirth: staff.dateOfBirth || '1990-01-01',
      educationalQualification: staff.educationalQualification || staff.qualification || 'Graduate (B.Ed / Masters)',
      staffId: staff.staffId || `FET-STF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      department: staff.department || 'Academics & Schools',
      designation: staff.designation || 'Senior Educator / Teacher',
      joiningDate: staff.joiningDate || new Date().toISOString().split('T')[0],
      employmentStatus: staff.employmentStatus || 'active',
      employmentType: staff.employmentType || 'full_time',
      workLocation: staff.workLocation || 'Central Secretariat, Mumbai',
      salaryGrade: staff.salaryGrade || 'Grade A (Regular)',
      photoURL: staff.photoURL || '',
      notes: staff.notes || ''
    });
    setIsEditingProfile(true);
    setActiveProfileTab('personal');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !currentUser) return;
    setIsSubmitting(true);

    try {
      await updateStaffMemberProfile(
        selectedStaff.uid,
        editFormData as any,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'admin@fetindia.org',
          role: activeRole || 'hr_admin'
        }
      );
      showToast('Staff profile and credentials updated successfully.');
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error('Error saving staff profile:', err);
      showToast(`Failed to update staff profile: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToEnroll || !currentUser) {
      showToast('Please select a registered user to enroll as staff.');
      return;
    }
    setIsSubmitting(true);

    try {
      const generatedStaffId = await enrollStaffMember(
        selectedUserToEnroll.uid,
        enrollForm,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'admin@fetindia.org',
          role: activeRole || 'hr_admin'
        }
      );
      showToast(`User successfully enrolled as Staff! Assigned Staff ID: ${generatedStaffId}`);
      setIsEnrollModalOpen(false);
      setSelectedUserToEnroll(null);
    } catch (err: any) {
      console.error('Error enrolling staff:', err);
      showToast(`Enrollment failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !currentUser) return;
    if (!docForm.title.trim()) {
      showToast('Please enter a document title.');
      return;
    }
    setIsSubmitting(true);

    try {
      await addStaffDocumentRecord(
        selectedStaff.uid,
        docForm,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'admin@fetindia.org',
          role: activeRole || 'hr_admin'
        }
      );
      showToast('Staff document record attached successfully.');
      setIsAddDocModalOpen(false);
      setDocForm({
        title: '',
        documentType: 'appointment_letter',
        fileUrl: '',
        fileName: '',
        verified: true,
        notes: ''
      });
    } catch (err: any) {
      console.error('Error adding document:', err);
      showToast(`Could not attach document: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedStaff || !currentUser) return;
    if (!confirm('Are you sure you want to remove this document record?')) return;

    try {
      await deleteStaffDocumentRecord(
        selectedStaff.uid,
        docId,
        {
          uid: currentUser.uid,
          email: currentUser.email || 'admin@fetindia.org',
          role: activeRole || 'hr_admin'
        }
      );
      showToast('Document record removed.');
    } catch (err: any) {
      console.error('Error deleting document:', err);
      showToast(`Failed to delete document: ${err.message || 'Unknown error'}`);
    }
  };

  const handleExportCSV = () => {
    if (staffList.length === 0) {
      showToast('No staff records to export.');
      return;
    }

    const headers = [
      'Staff ID',
      'Full Name',
      'Father Name',
      'Email',
      'Mobile Number',
      'Department',
      'Designation',
      'Employment Status',
      'Employment Type',
      'Joining Date',
      'Work Location',
      'Blood Group',
      'Educational Qualification',
      'District',
      'State'
    ];

    const rows = staffList.map(s => [
      `"${s.staffId || ''}"`,
      `"${s.fullName || s.displayName || ''}"`,
      `"${s.fatherName || ''}"`,
      `"${s.email || ''}"`,
      `"${s.mobileNumber || s.phoneNumber || ''}"`,
      `"${s.department || 'Academics & Schools'}"`,
      `"${s.designation || 'Staff'}"`,
      `"${s.employmentStatus || 'active'}"`,
      `"${s.employmentType || 'full_time'}"`,
      `"${s.joiningDate || ''}"`,
      `"${s.workLocation || ''}"`,
      `"${s.bloodGroup || ''}"`,
      `"${s.educationalQualification || s.qualification || ''}"`,
      `"${s.district || ''}"`,
      `"${s.state || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FET_India_Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Staff Directory exported as CSV.');
  };

  return (
    <div className="space-y-6" id="admin-hrms-staff-view">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <p className="text-xs font-semibold">{notification}</p>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-900 text-indigo-100 flex items-center justify-center font-black shadow-xs">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                HRMS & Staff Management Console
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                  Step 47
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Trust educators directory, personnel records, organizational designations, ID cards, and statutory credentials.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Export full staff roster to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Directory</span>
          </button>

          <button
            onClick={() => {
              setEnrollForm({
                staffId: `FET-STF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                department: 'Academics & Schools',
                designation: 'Senior Educator / Teacher',
                joiningDate: new Date().toISOString().split('T')[0],
                employmentStatus: 'active',
                employmentType: 'full_time',
                workLocation: 'Central Secretariat, Mumbai',
                notes: ''
              });
              setIsEnrollModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 flex items-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-300" />
            <span>Enroll Staff Member</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Staff Roster</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-950 mt-2 font-mono">{stats.total}</p>
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3 h-3 text-indigo-600" /> Verified Trust Personnel
          </span>
        </div>

        {/* Active Staff */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Working Staff</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-800 mt-2 font-mono">{stats.active}</p>
          <span className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% Operational` : 'Ready'}
          </span>
        </div>

        {/* In Probation / On Leave */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Probation & On Leave</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-800 mt-2 font-mono">
            {stats.probation + stats.onLeave}
          </p>
          <span className="text-[11px] text-amber-700 flex items-center gap-1 mt-1">
            <span>{stats.probation} Probation • {stats.onLeave} On Leave</span>
          </span>
        </div>

        {/* Inactive / Relieved */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Inactive / Relieved</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700 mt-2 font-mono">{stats.inactive}</p>
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
            Archived Staff Records
          </span>
        </div>
      </div>

      {/* 3. Departmental Distribution Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-700" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Departmental Hierarchy & Distribution
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Click any department to filter roster</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {TRUST_DEPARTMENTS.map((dept) => {
            const count = stats.deptCount[dept] || 0;
            const isSelected = selectedDepartment === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(isSelected ? 'all' : dept)}
                className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-900 text-white border-indigo-800 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80'
                }`}
              >
                <div className="text-[10px] font-bold truncate" title={dept}>
                  {dept.split('&')[0]}
                </div>
                <div className={`text-base font-black font-mono mt-1 ${isSelected ? 'text-indigo-200' : 'text-indigo-900'}`}>
                  {count}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Staff Name, Staff ID (e.g. FET-STF), Designation, Email, Mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-700/20"
          >
            <option value="all">All Departments ({stats.total})</option>
            {TRUST_DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d} ({stats.deptCount[d] || 0})</option>
            ))}
          </select>

          {/* Designation Filter */}
          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-700/20 max-w-[200px]"
          >
            <option value="all">All Designations</option>
            {COMMON_DESIGNATIONS.map(des => (
              <option key={des} value={des}>{des}</option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setViewLayout('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewLayout('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cards View
            </button>
          </div>
        </div>

        {/* Status Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          {(['all', 'active', 'probation', 'on_leave', 'inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
          <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
            Showing <strong>{filteredStaff.length}</strong> of {stats.total} staff members
          </span>
        </div>
      </div>

      {/* 5. Main Staff Roster View */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-700">Loading FET India Staff Directory...</p>
          <p className="text-[11px] text-slate-400 mt-1">Connecting to Firestore Personnel Subsystem</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Staff Members Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchTerm || selectedDepartment !== 'all' || statusFilter !== 'all'
                ? 'No staff records matched your search filters. Try adjusting your search keywords or resetting filters.'
                : 'No users have been enrolled into the staff directory yet. Click "Enroll Staff Member" above to onboard teachers, coordinators, or administrators.'}
            </p>
          </div>
          {(searchTerm || selectedDepartment !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('all');
                setSelectedDesignation('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 bg-indigo-50 text-indigo-800 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : viewLayout === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Staff ID</th>
                  <th className="py-3.5 px-4">Department & Campus</th>
                  <th className="py-3.5 px-4">Organizational Designation</th>
                  <th className="py-3.5 px-4">System Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joining Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => {
                  const staffName = staff.fullName || staff.fullLegalName || staff.displayName || 'Staff Member';
                  const staffId = staff.staffId || 'FET-STF-PENDING';
                  const dept = staff.department || 'Academics & Schools';
                  const desig = staff.designation || 'Staff Member';
                  const status = staff.employmentStatus || 'active';
                  const roleMeta = getRoleMetadata(staff.primaryRole || 'user');
                  const docCount = staff.staffDocuments?.length || 0;

                  return (
                    <tr key={staff.uid} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center text-slate-700 font-bold">
                            {staff.photoURL ? (
                              <img src={staff.photoURL} alt={staffName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span>{staffName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{staffName}</span>
                              {docCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200" title={`${docCount} documents attached`}>
                                  {docCount} docs
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{staff.email}</span>
                              {staff.mobileNumber && <span>• {staff.mobileNumber}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Staff ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                          {staffId}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{dept}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{staff.workLocation || 'Central Secretariat'}</span>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                          {desig}
                        </span>
                      </td>

                      {/* System Role */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${roleMeta.badgeColor}`}>
                          {roleMeta.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                          status === 'active' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : status === 'probation'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : status === 'on_leave'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Joining Date */}
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {staff.joiningDate || '01 Jan 2026'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Digital ID Card */}
                          <button
                            onClick={() => setIdCardTargetStaff(staff)}
                            className="p-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                            title="Generate Official Staff ID Card"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit / View Profile */}
                          <button
                            onClick={() => handleOpenEditProfile(staff)}
                            className="p-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="View & Edit Full Personnel File"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => {
            const staffName = staff.fullName || staff.fullLegalName || staff.displayName || 'Staff Member';
            const staffId = staff.staffId || 'FET-STF-PENDING';
            const dept = staff.department || 'Academics & Schools';
            const desig = staff.designation || 'Staff Member';
            const status = staff.employmentStatus || 'active';
            const docCount = staff.staffDocuments?.length || 0;

            return (
              <div key={staff.uid} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-700 text-base shadow-xs">
                        {staff.photoURL ? (
                          <img src={staff.photoURL} alt={staffName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{staffName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{staffName}</h4>
                        <div className="text-[11px] text-indigo-900 font-mono font-bold mt-0.5">{staffId}</div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                      status === 'active' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : status === 'probation'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : status === 'on_leave'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Designation:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[180px]">{desig}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[180px]">{dept}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Joining Date:</span>
                      <span className="font-mono text-slate-600">{staff.joiningDate || '01 Jan 2026'}</span>
                    </div>
                    <div className="flex justify-between py-1 text-[11px]">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-slate-600 truncate max-w-[180px]">{staff.workLocation || 'Central Secretariat'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {docCount > 0 ? `${docCount} Documents` : 'No docs'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIdCardTargetStaff(staff)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> ID Card
                    </button>
                    <button
                      onClick={() => handleOpenEditProfile(staff)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Profile
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT STAFF PROFILE & PERSONNEL FILE                              */}
      {/* ========================================================================= */}
      {isEditingProfile && selectedStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between gap-4 shrink-0 border-b border-indigo-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-800/80 border border-indigo-700 flex items-center justify-center font-bold text-indigo-200">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    Personnel File: {selectedStaff.fullName || selectedStaff.displayName}
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Staff ID: {selectedStaff.staffId || 'Unassigned'} • {selectedStaff.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="w-8 h-8 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveProfileTab('personal')}
                className={`py-2 px-3 border-b-2 transition-all cursor-pointer ${
                  activeProfileTab === 'personal'
                    ? 'border-indigo-800 text-indigo-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Personal & Identity
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab('employment')}
                className={`py-2 px-3 border-b-2 transition-all cursor-pointer ${
                  activeProfileTab === 'employment'
                    ? 'border-indigo-800 text-indigo-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Employment Particulars
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab('documents')}
                className={`py-2 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeProfileTab === 'documents'
                    ? 'border-indigo-800 text-indigo-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>3. Private Documents</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
                  {selectedStaff.staffDocuments?.length || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab('idcard')}
                className={`py-2 px-3 border-b-2 transition-all cursor-pointer ${
                  activeProfileTab === 'idcard'
                    ? 'border-indigo-800 text-indigo-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                4. Identity Card Preview
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: PERSONAL & IDENTITY */}
              {activeProfileTab === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        value={editFormData.fullName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-700/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Father's / Parent's Name *</label>
                      <input
                        type="text"
                        value={editFormData.fatherName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                        placeholder="e.g. Mohammed Hussain"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-700/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mother's Name</label>
                      <input
                        type="text"
                        value={editFormData.motherName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                        placeholder="e.g. Fatima Bi"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-700/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        value={editFormData.mobileNumber || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, mobileNumber: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-700/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                      <select
                        value={editFormData.bloodGroup || 'B+'}
                        onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-700/20"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={editFormData.dateOfBirth || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-700/20"
                      />
                    </div>
                  </div>

                  {/* Address & Residential Particulars */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contact & Address Particulars</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Country</label>
                        <input
                          type="text"
                          value={editFormData.country || 'India'}
                          onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">State</label>
                        <input
                          type="text"
                          value={editFormData.state || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                          placeholder="e.g. Maharashtra"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">District / City</label>
                        <input
                          type="text"
                          value={editFormData.district || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                          placeholder="e.g. Mumbai"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Residential Address</label>
                      <textarea
                        rows={2}
                        value={editFormData.address || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        placeholder="House / Street / Area address..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Contact Number</label>
                        <input
                          type="tel"
                          value={editFormData.emergencyContact || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                          placeholder="+91 98765 00000"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Profile Photo URL</label>
                        <input
                          type="url"
                          value={editFormData.photoURL || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, photoURL: e.target.value })}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EMPLOYMENT PARTICULARS */}
              {activeProfileTab === 'employment' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    <strong>Notice on Role Separation:</strong> The <em>Organizational Designation</em> describes the staff member's academic/trust job title (e.g. Senior Educator, Hifz Ustadh), while the <em>System Role</em> controls platform security clearance and admin scopes.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Staff ID *</label>
                      <input
                        type="text"
                        value={editFormData.staffId || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, staffId: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Department *</label>
                      <select
                        value={editFormData.department || 'Academics & Schools'}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        {TRUST_DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Organizational Designation *</label>
                      <input
                        type="text"
                        value={editFormData.designation || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                        placeholder="e.g. Senior Mathematics Educator"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date *</label>
                      <input
                        type="date"
                        value={editFormData.joiningDate || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Employment Status *</label>
                      <select
                        value={editFormData.employmentStatus || 'active'}
                        onChange={(e) => setEditFormData({ ...editFormData, employmentStatus: e.target.value as StaffEmploymentStatus })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="active">Active (Full Service)</option>
                        <option value="probation">Probationary Period</option>
                        <option value="on_leave">On Authorized Leave</option>
                        <option value="inactive">Inactive / Relieved</option>
                        <option value="resigned">Resigned</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                      <select
                        value={editFormData.employmentType || 'full_time'}
                        onChange={(e) => setEditFormData({ ...editFormData, employmentType: e.target.value as StaffEmploymentType })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="full_time">Full-Time Regular</option>
                        <option value="part_time">Part-Time</option>
                        <option value="contract">Contractual</option>
                        <option value="honorary">Honorary / Volunteer Faculty</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Work Location / Campus</label>
                      <input
                        type="text"
                        value={editFormData.workLocation || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, workLocation: e.target.value })}
                        placeholder="e.g. Central Secretariat, Mumbai"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Educational Qualification</label>
                      <input
                        type="text"
                        value={editFormData.educationalQualification || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, educationalQualification: e.target.value })}
                        placeholder="e.g. M.Sc. B.Ed, Alimiyyah Degree"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Administrative HR Notes</label>
                    <textarea
                      rows={2}
                      value={editFormData.notes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      placeholder="Internal trust remarks, qualifications review, or performance records..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: PRIVATE DOCUMENTS */}
              {activeProfileTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Private Staff Documents & Credentials
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Protected records accessible only to authorized administrators and the staff member.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddDocModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Attach Document
                    </button>
                  </div>

                  {(!selectedStaff.staffDocuments || selectedStaff.staffDocuments.length === 0) ? (
                    <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No Documents Attached</p>
                      <p className="text-[11px] text-slate-400">
                        Click "Attach Document" to record appointment letters, certificates, or KYC proofs.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                      {selectedStaff.staffDocuments.map((docItem) => (
                        <div key={docItem.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center shrink-0">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <span>{docItem.title}</span>
                                <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 uppercase">
                                  {docItem.documentType.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Uploaded: {new Date(docItem.uploadedAt).toLocaleDateString()} {docItem.notes && `• Note: ${docItem.notes}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {docItem.fileUrl && (
                              <a
                                href={docItem.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-indigo-700 hover:bg-indigo-50"
                                title="Open Document"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(docItem.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: IDENTITY CARD PREVIEW */}
              {activeProfileTab === 'idcard' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Official FET Staff Identity Card
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Front & back PVC card layout with non-sensitive QR verification.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIdCardTargetStaff(selectedStaff)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print / Export PDF
                    </button>
                  </div>

                  <div className="max-w-md mx-auto py-2">
                    <FETIdentityCard
                      category="staff"
                      cardId={selectedStaff.staffId || 'FET-STF-PREVIEW'}
                      fullName={selectedStaff.fullName || selectedStaff.displayName || 'Staff Member'}
                      fatherName={selectedStaff.fatherName || selectedStaff.guardianName}
                      photoURL={selectedStaff.photoURL}
                      department={selectedStaff.department || 'Academics & Operations'}
                      designation={selectedStaff.designation || 'Official Staff'}
                      bloodGroup={selectedStaff.bloodGroup || 'B+'}
                      issueDate={selectedStaff.joiningDate || '2026-01-01'}
                      district={selectedStaff.district || 'Mumbai'}
                      state={selectedStaff.state || 'Maharashtra'}
                      mobileNumber={selectedStaff.mobileNumber}
                      email={selectedStaff.email}
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Personnel Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ENROLL STAFF MEMBER                                              */}
      {/* ========================================================================= */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between gap-4 shrink-0 border-b border-indigo-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-800/80 border border-indigo-700 flex items-center justify-center font-bold text-indigo-200">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Enroll Staff Member</h3>
                  <p className="text-xs text-indigo-300">
                    Elevate a registered user to official trust faculty or administrative staff.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEnrollStaffSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Step 1: Select Registered User */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Select Registered Account *
                </label>
                {!selectedUserToEnroll ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search registered users by name or email..."
                      value={enrollSearchTerm}
                      onChange={(e) => setEnrollSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                      {nonStaffUsers.slice(0, 8).map(u => (
                        <div
                          key={u.uid}
                          onClick={() => setSelectedUserToEnroll(u)}
                          className="p-2.5 hover:bg-indigo-50/80 flex items-center justify-between cursor-pointer text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{u.fullName || u.displayName}</span>
                            <span className="text-slate-500 ml-2 text-[11px]">({u.email})</span>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                            Select
                          </span>
                        </div>
                      ))}
                      {nonStaffUsers.length === 0 && (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No eligible registered users found.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-indigo-950 text-xs">
                        {selectedUserToEnroll.fullName || selectedUserToEnroll.displayName}
                      </div>
                      <div className="text-[11px] text-indigo-800">{selectedUserToEnroll.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUserToEnroll(null)}
                      className="text-xs text-indigo-700 font-bold hover:underline cursor-pointer"
                    >
                      Change User
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Staff Particulars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Staff ID *</label>
                  <input
                    type="text"
                    value={enrollForm.staffId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, staffId: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={enrollForm.department}
                    onChange={(e) => setEnrollForm({ ...enrollForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {TRUST_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation *</label>
                  <select
                    value={enrollForm.designation}
                    onChange={(e) => setEnrollForm({ ...enrollForm, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {COMMON_DESIGNATIONS.map(des => (
                      <option key={des} value={des}>{des}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date *</label>
                  <input
                    type="date"
                    value={enrollForm.joiningDate}
                    onChange={(e) => setEnrollForm({ ...enrollForm, joiningDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employment Status</label>
                  <select
                    value={enrollForm.employmentStatus}
                    onChange={(e) => setEnrollForm({ ...enrollForm, employmentStatus: e.target.value as StaffEmploymentStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="probation">Probation</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={enrollForm.workLocation}
                    onChange={(e) => setEnrollForm({ ...enrollForm, workLocation: e.target.value })}
                    placeholder="e.g. Central Secretariat, Mumbai"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={enrollForm.notes}
                  onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                  placeholder="Onboarding remarks..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedUserToEnroll}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Enrolling...' : 'Complete Staff Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ATTACH PRIVATE STAFF DOCUMENT                                    */}
      {/* ========================================================================= */}
      {isAddDocModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-950 text-white p-4 flex items-center justify-between border-b border-indigo-900">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-300" />
                Attach Private Document Record
              </h3>
              <button
                onClick={() => setIsAddDocModalOpen(false)}
                className="text-indigo-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocumentSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="e.g. Appointment Letter 2026-27"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Classification *</label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value as StaffDocumentType })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="appointment_letter">Official Appointment Letter</option>
                  <option value="qualification">Educational / Degree Certificate</option>
                  <option value="identity_proof">Government ID / KYC Proof (Aadhaar / PAN)</option>
                  <option value="police_verification">Police / Character Verification</option>
                  <option value="service_record">Service Record / Appraisal</option>
                  <option value="other">Other Supporting Document</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document File URL / Cloud Reference</label>
                <input
                  type="url"
                  value={docForm.fileUrl}
                  onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                  placeholder="https://drive.google.com/... or https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Verification Status</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docForm.verified}
                    onChange={(e) => setDocForm({ ...docForm, verified: e.target.checked })}
                    className="rounded text-indigo-700 focus:ring-indigo-700"
                  />
                  <span className="font-bold text-slate-700">Verified by Trust HR Authority</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                  placeholder="Issuing authority, verification reference number..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl font-bold text-white bg-indigo-900 hover:bg-indigo-950 shadow-xs"
                >
                  Attach Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: OFFICIAL ID CARD PRINT / PDF / PNG MODAL                         */}
      {/* ========================================================================= */}
      {idCardTargetStaff && (
        <IDCardPrintDownloadModal
          isOpen={true}
          onClose={() => setIdCardTargetStaff(null)}
          category="staff"
          cardId={idCardTargetStaff.staffId || 'FET-STF-PENDING'}
          fullName={idCardTargetStaff.fullName || idCardTargetStaff.fullLegalName || idCardTargetStaff.displayName || 'Staff Member'}
          fatherName={idCardTargetStaff.fatherName || idCardTargetStaff.guardianName}
          motherName={idCardTargetStaff.motherName}
          photoURL={idCardTargetStaff.photoURL}
          department={idCardTargetStaff.department || 'Academics & Operations'}
          designation={idCardTargetStaff.designation || 'Official Staff'}
          bloodGroup={idCardTargetStaff.bloodGroup || 'B+'}
          issueDate={idCardTargetStaff.joiningDate || '2026-01-01'}
          validUntil="AY 2026-2027"
          district={idCardTargetStaff.district || 'Mumbai'}
          state={idCardTargetStaff.state || 'Maharashtra'}
          country={idCardTargetStaff.country || 'India'}
          email={idCardTargetStaff.email}
          mobileNumber={idCardTargetStaff.mobileNumber || idCardTargetStaff.phoneNumber}
          onNotify={showToast}
        />
      )}

    </div>
  );
};
