/**
 * @license
 * Specialized Role Administrator Consoles
 * Fatimyah Educational Trust India
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  HeartHandshake, 
  BadgeDollarSign, 
  Award, 
  GraduationCap, 
  BookOpen, 
  Landmark, 
  UserCog, 
  Newspaper, 
  ShoppingBag, 
  Plane, 
  LineChart, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ShieldCheck, 
  AlertCircle,
  Calendar,
  DollarSign,
  Tag,
  Briefcase
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { AdminCampaignManagementView } from './AdminCampaignManagementView';
import { AdminCompetitionsExamsView } from './AdminCompetitionsExamsView';
import { 
  DonationRecord, 
  ScholarshipApplication, 
  VolunteerRecord, 
  VolunteerServiceLog, 
  CrowdfundingCampaign, 
  StoreProduct, 
  TravelPackage, 
  ExamCompetition,
  UserProfile
} from '../../types';
import { AdminVolunteerApplicationsView } from './AdminVolunteerApplicationsView';
import { AdminCoreMembersView } from './AdminCoreMembersView';
import { AdminReportsAnalyticsView } from './AdminReportsAnalyticsView';
import { AdminDonorsManagementView } from './AdminDonorsManagementView';
import { AdminFinanceAccountingView } from './AdminFinanceAccountingView';
import { AdminStaffHRMSView } from './AdminStaffHRMSView';
import { BlogPressAdminConsole } from './BlogPressAdminConsole';

interface SpecializedConsolesProps {
  currentTab: string;
}

export const AdminSpecializedConsoles: React.FC<SpecializedConsolesProps> = ({ currentTab }) => {
  const { isSuperAdmin, activeRole, currentUser } = useAuth();
  const { config } = useConfig();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (currentTab === 'members') {
      const unsub = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const fetched: UserProfile[] = [];
          snapshot.forEach((doc) => {
            fetched.push({ uid: doc.id, ...doc.data() } as UserProfile);
          });
          setUsersList(fetched);
        },
        (err) => {
          console.error('Error fetching users for member console:', err);
        }
      );
      return () => unsub();
    }
  }, [currentTab]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // -------------------------------------------------------------
  // 1. VOLUNTEER ADMINISTRATOR CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'volunteers') {
    return <AdminVolunteerApplicationsView />;
  }

  // -------------------------------------------------------------
  // 2. MEMBER ADMINISTRATOR CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'members') {
    return (
      <div className="space-y-6" id="admin-members-console">
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
          </div>
        )}
        <AdminCoreMembersView 
          users={usersList} 
          onNotify={(msg) => showNotification(msg)} 
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. DONOR & 80G ADMINISTRATOR CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'donors') {
    return <AdminDonorsManagementView />;
  }

  // -------------------------------------------------------------
  // 4. CROWDFUNDING & APPEALS ADMINISTRATOR CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'crowdfunding') {
    return (
      <div className="space-y-6" id="admin-crowdfunding-console">
        <AdminCampaignManagementView />
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. EXAMINATION, COMPETITION & CERTIFICATION CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'exams' || currentTab === 'competitions' || currentTab === 'certificates') {
    return (
      <div className="space-y-6" id="admin-exams-console">
        <AdminCompetitionsExamsView />
      </div>
    );
  }

  // -------------------------------------------------------------
  // 6. SCHOOL ERP ADMINISTRATOR CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'school') {
    return (
      <div className="space-y-6" id="admin-school-console">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-extrabold text-slate-900">School ERP Administrator Console</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage academic student admissions, class timetables, fee tracking, and teacher allocations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Affiliated Trust Schools</span>
            <p className="text-xl font-black text-slate-900 mt-1">14 Institutions</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Total Enrolled Students</span>
            <p className="text-xl font-black text-blue-700 mt-1">8,450</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Fee Concessions Disbursed</span>
            <p className="text-xl font-black text-emerald-700 mt-1">₹42.5 Lakhs</p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 7. MADRASA ERP ADMINISTRATOR CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'madrasa') {
    return (
      <div className="space-y-6" id="admin-madrasa-console">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-extrabold text-slate-900">Madrasa ERP Administrator Console</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specialized management for affiliated madrasas: Hifz, Tajweed, Alim courses, and student boarding.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Affiliated Madrasas</span>
            <p className="text-xl font-black text-slate-900 mt-1">8 Centers</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Hifz Students</span>
            <p className="text-xl font-black text-teal-700 mt-1">420</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Boarding Capacity</span>
            <p className="text-xl font-black text-slate-900 mt-1">600 Beds</p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 8. FINANCE & ACCOUNTING ADMINISTRATOR CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'finance') {
    return <AdminFinanceAccountingView />;
  }

  // -------------------------------------------------------------
  // 9. HRMS ADMINISTRATOR CONSOLE (STEP 47)
  // -------------------------------------------------------------
  if (currentTab === 'hrms') {
    return <AdminStaffHRMSView />;
  }

  // -------------------------------------------------------------
  // 10. BLOG / MEDIA ADMINISTRATOR CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'blog') {
    return <BlogPressAdminConsole onNotify={showNotification} />;
  }

  // -------------------------------------------------------------
  // 11. PRE-ARCHITECTED FET STORE CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'store') {
    return (
      <div className="space-y-6" id="admin-store-console">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-extrabold text-slate-900">Official FET Store Console (Pre-Architected)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pre-architected catalog initially supporting: Garments, Islamic Garments, Perfumes, and Books. Module safely isolated in <span className="font-mono text-amber-700">DISABLED</span> lifecycle state.
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold">
            Series 3 Launch Pipeline
          </span>
        </div>

        {/* 4 Core Initial Categories Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-bold">
              Category 1
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-2">Garments</h3>
            <p className="text-xs text-slate-500 mt-1">General daily modest attire and ethical clothing lines.</p>
            <div className="mt-3 text-[11px] font-bold text-slate-600">Schema Ready • 0 Published</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
              Category 2
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-2">Islamic Garments</h3>
            <p className="text-xs text-slate-500 mt-1">Abayas, Thobes, Hijabs, Kurtas, Prayer caps, and scarves.</p>
            <div className="mt-3 text-[11px] font-bold text-slate-600">Schema Ready • 0 Published</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
              Category 3
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-2">Perfumes (Attars)</h3>
            <p className="text-xs text-slate-500 mt-1">Non-alcoholic fragrances, traditional pure oudh, and attars.</p>
            <div className="mt-3 text-[11px] font-bold text-slate-600">Schema Ready • 0 Published</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
              Category 4
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-2">Books & Literature</h3>
            <p className="text-xs text-slate-500 mt-1">Islamic literature, academic textbooks, ethics guides, and FET publications.</p>
            <div className="mt-3 text-[11px] font-bold text-slate-600">Schema Ready • 0 Published</div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 12. PRE-ARCHITECTED FET TRAVEL CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'travel') {
    return (
      <div className="space-y-6" id="admin-travel-console">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-600" />
              <h2 className="text-xl font-extrabold text-slate-900">FET Travel & Pilgrimage Console (Pre-Architected)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilgrimage services initially focusing on Umrah and Ziyarat, extensible to future destinations. Safely isolated in <span className="font-mono text-amber-700">DISABLED</span> state.
            </p>
          </div>
          <span className="px-3 py-1 bg-sky-100 text-sky-900 border border-sky-300 rounded-full text-xs font-bold">
            Series 3 Launch Pipeline
          </span>
        </div>

        {/* 2 Core Initial Focus Packages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                Focus 1
              </span>
              <span className="text-xs font-mono text-slate-400">STATUS: DISABLED</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-2">Umrah Group Packages</h3>
            <p className="text-xs text-slate-500 mt-1">Guided spiritual journeys to Makkah and Madinah with group scholar guidance, verified accommodations, and visa processing assistance.</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Extensible Schema Loaded</span>
              <span className="font-bold text-slate-900">Makkah / Madinah</span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-[10px] font-bold">
                Focus 2
              </span>
              <span className="text-xs font-mono text-slate-400">STATUS: DISABLED</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-2">Ziyarat Holy Sites Tours</h3>
            <p className="text-xs text-slate-500 mt-1">Dignified tours to sacred historical sites in Iraq (Karbala, Najaf, Kadhmain), Iran (Mashhad, Qom), and Syria.</p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Extensible Schema Loaded</span>
              <span className="font-bold text-slate-900">Iraq / Iran Holy Sites</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 13. REPORTS & ANALYTICS ADMINISTRATOR CONSOLE
  // -------------------------------------------------------------
  if (currentTab === 'reports') {
    return <AdminReportsAnalyticsView />;
  }

  return null;
};
