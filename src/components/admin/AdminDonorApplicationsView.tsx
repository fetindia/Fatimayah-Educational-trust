/**
 * @license
 * Admin Donor Applications Intake & Scrutiny Console
 * Fatimyah Educational Trust India (FET India)
 * Module: Super Admin / Trustee Donor Review & Patron Approval
 */

import React, { useState, useEffect } from 'react';
import { 
  BadgeDollarSign, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  Check, 
  X, 
  Download, 
  RefreshCw, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  User, 
  Sparkles,
  ChevronRight,
  Send,
  Trash2,
  Lock,
  Heart
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, adminReviewDonorApplication } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { DonorApplication, DonorApplicationStatus } from '../../types';

export const AdminDonorApplicationsView: React.FC = () => {
  const { currentUser, userProfile, isSuperAdmin } = useAuth();
  
  const [applications, setApplications] = useState<DonorApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | DonorApplicationStatus>('all');
  const [selectedApp, setSelectedApp] = useState<DonorApplication | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewAction, setReviewAction] = useState<DonorApplicationStatus>('approved');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setStatusNotice({ type, text });
    setTimeout(() => setStatusNotice(null), 4500);
  };

  // 1. Subscribe to donorApplications collection
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'donorApplications'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: DonorApplication[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as DonorApplication);
        });
        setApplications(list);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching donor applications:', err);
        notify('error', 'Failed to load donor applications from Firestore.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtered applications list
  const filteredApps = applications.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const queryLower = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !queryLower ||
      app.fullLegalName?.toLowerCase().includes(queryLower) ||
      app.applicantEmail?.toLowerCase().includes(queryLower) ||
      app.district?.toLowerCase().includes(queryLower) ||
      app.state?.toLowerCase().includes(queryLower) ||
      app.organizationName?.toLowerCase().includes(queryLower) ||
      app.id?.toLowerCase().includes(queryLower);

    return matchesStatus && matchesSearch;
  });

  // Metrics computation
  const totalCount = applications.length;
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const underReviewCount = applications.filter(a => a.status === 'under_review').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  // Open Detailed Review Modal
  const handleOpenReview = (app: DonorApplication, action: DonorApplicationStatus) => {
    setSelectedApp(app);
    setReviewAction(action);
    setReviewNotes(app.reviewNotes || '');
    setIsReviewModalOpen(true);
  };

  // 1-Click Quick Approve Handler
  const handleQuickApprove = async (app: DonorApplication) => {
    if (!currentUser || !app.id) return;
    setProcessingAppId(app.id);

    try {
      const adminRole = isSuperAdmin ? 'super_admin' : (userProfile?.primaryRole || 'administrator');
      await adminReviewDonorApplication(
        app.id,
        app.applicantUid,
        'approved',
        'Directly verified and certified as Active Patron by Super Admin.',
        {
          uid: currentUser.uid,
          email: currentUser.email || 'admin@fetindia.org',
          role: adminRole as any
        }
      );

      // Optimistic local update
      setApplications(prev => prev.map(item => item.id === app.id ? { ...item, status: 'approved', approvedBy: currentUser.uid } : item));
      notify('success', `Donor ${app.fullLegalName} approved and accredited successfully!`);
    } catch (err: any) {
      console.error('Quick approve error:', err);
      notify('error', err?.message || 'Could not approve donor application.');
    } finally {
      setProcessingAppId(null);
    }
  };

  // Confirm Detailed Status Change
  const handleConfirmReview = async () => {
    if (!selectedApp || !selectedApp.id || !currentUser) return;
    setIsSubmittingReview(true);

    try {
      const adminRole = isSuperAdmin ? 'super_admin' : (userProfile?.primaryRole || 'administrator');
      await adminReviewDonorApplication(
        selectedApp.id,
        selectedApp.applicantUid,
        reviewAction,
        reviewNotes.trim(),
        {
          uid: currentUser.uid,
          email: currentUser.email || 'admin@fetindia.org',
          role: adminRole as any
        }
      );

      // Optimistic local state update
      setApplications(prev => prev.map(item => item.id === selectedApp.id ? { 
        ...item, 
        status: reviewAction, 
        reviewNotes: reviewNotes.trim(),
        reviewedByUid: currentUser.uid,
        reviewedByEmail: currentUser.email || undefined,
        reviewedAt: new Date().toISOString()
      } : item));

      notify('success', `Donor application status updated to "${reviewAction}".`);
      setIsReviewModalOpen(false);
      setSelectedApp(null);
    } catch (err: any) {
      console.error('Error reviewing donor application:', err);
      notify('error', err?.message || 'Failed to update application status.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (applications.length === 0) {
      notify('error', 'No donor records to export.');
      return;
    }

    const headers = ['Application ID', 'Full Name', 'Email', 'Phone', 'Donor Type', 'Organization', 'State', 'District', 'Frequency', 'Pledge Amount', 'Status', 'Submitted Date'];
    const rows = applications.map(a => [
      a.id || '',
      `"${a.fullLegalName || ''}"`,
      a.applicantEmail || '',
      a.mobileNumber || '',
      a.donorType || 'individual',
      `"${a.organizationName || ''}"`,
      `"${a.state || ''}"`,
      `"${a.district || ''}"`,
      a.preferredFrequency || '',
      `"${a.donationInterestAmount || ''}"`,
      a.status,
      a.createdAt ? new Date(a.createdAt).toISOString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FET_India_Donor_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify('success', 'Donor registry exported to CSV.');
  };

  return (
    <div className="space-y-6" id="admin-donor-applications-view">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-extrabold text-slate-900">Donor & Patron Applications Scrutiny</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review inbound patron filings, verify donor jurisdictions, and certify regular educational sponsors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Dynamic Status Notification Alert */}
      {statusNotice && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in ${
          statusNotice.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          {statusNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusNotice.text}</span>
        </div>
      )}

      {/* KPI Stats Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[11px] font-semibold block ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            Total Submissions
          </span>
          <p className="text-xl font-black mt-0.5">{totalCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
          }`}
        >
          <span className={`text-[11px] font-semibold block ${statusFilter === 'pending' ? 'text-amber-100' : 'text-amber-800'}`}>
            Pending Scrutiny
          </span>
          <p className={`text-xl font-black mt-0.5 ${statusFilter === 'pending' ? 'text-white' : 'text-amber-900'}`}>
            {pendingCount}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter('under_review')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'under_review'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-blue-50/60 border-blue-200 hover:border-blue-300'
          }`}
        >
          <span className={`text-[11px] font-semibold block ${statusFilter === 'under_review' ? 'text-blue-100' : 'text-blue-800'}`}>
            Under Scrutiny
          </span>
          <p className={`text-xl font-black mt-0.5 ${statusFilter === 'under_review' ? 'text-white' : 'text-blue-900'}`}>
            {underReviewCount}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <span className={`text-[11px] font-semibold block ${statusFilter === 'approved' ? 'text-emerald-100' : 'text-emerald-800'}`}>
            Accredited Patrons
          </span>
          <p className={`text-xl font-black mt-0.5 ${statusFilter === 'approved' ? 'text-white' : 'text-emerald-900'}`}>
            {approvedCount}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
              : 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
          }`}
        >
          <span className={`text-[11px] font-semibold block ${statusFilter === 'rejected' ? 'text-rose-100' : 'text-rose-800'}`}>
            Rejected / Closed
          </span>
          <p className={`text-xl font-black mt-0.5 ${statusFilter === 'rejected' ? 'text-white' : 'text-rose-900'}`}>
            {rejectedCount}
          </p>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patron name, organization, email, district, or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
          >
            <option value="all">All Statuses ({totalCount})</option>
            <option value="pending">Pending Queue ({pendingCount})</option>
            <option value="under_review">Under Scrutiny ({underReviewCount})</option>
            <option value="approved">Approved / Active ({approvedCount})</option>
            <option value="rejected">Rejected ({rejectedCount})</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">Loading donor applications...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <BadgeDollarSign className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Donor Applications Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' 
                ? 'No applications match your active search filter.' 
                : 'No donor registrations logged in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-600 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Patron & Contact</th>
                  <th className="py-3.5 px-4">Classification</th>
                  <th className="py-3.5 px-4">Location / Address</th>
                  <th className="py-3.5 px-4">Pledge & Frequency</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Applied Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{app.fullLegalName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{app.applicantEmail}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{app.mobileNumber}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.donorType === 'organization'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {app.donorType === 'organization' ? <Building className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span>{app.donorType === 'organization' ? (app.organizationName || 'Organization') : 'Individual'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{app.district}, {app.state}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{app.country}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-amber-900 capitalize">{app.preferredFrequency?.replace('_', ' ')}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{app.donationInterestAmount || 'Flexible'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        app.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        app.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        app.status === 'under_review' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {app.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {app.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                        {app.status === 'under_review' && <Clock className="w-3 h-3 text-blue-600" />}
                        {app.status === 'pending' && <Clock className="w-3 h-3 text-amber-700" />}
                        <span className="capitalize">{app.status.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setIsReviewModalOpen(false);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                          title="View Full Patron Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {app.status !== 'approved' && (
                          <button
                            onClick={() => handleQuickApprove(app)}
                            disabled={processingAppId === app.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] shadow-xs cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1"
                            title="Quick Approve as Verified Patron"
                          >
                            <Check className="w-3 h-3" />
                            <span>{processingAppId === app.id ? 'Approving...' : 'Approve'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenReview(app, app.status === 'approved' ? 'under_review' : 'approved')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer transition-colors"
                        >
                          Review...
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILED APPLICATION DRAWER / VIEW MODAL */}
      {selectedApp && !isReviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Patron Application Scrutiny
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedApp.id?.slice(0, 8)}
                  </span>
                </div>
                <h3 className="text-xl font-bold mt-1 text-white">{selectedApp.fullLegalName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Applied on {new Date(selectedApp.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
              {/* Status Header Bar */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700">Current Status:</span>
                <span className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] ${
                  selectedApp.status === 'approved' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                  selectedApp.status === 'rejected' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                  selectedApp.status === 'under_review' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                  'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {selectedApp.status.replace('_', ' ')}
                </span>
              </div>

              {/* Patron Profile Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Email Address</span>
                  <p className="text-slate-900 font-bold mt-0.5">{selectedApp.applicantEmail}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Mobile Phone</span>
                  <p className="text-slate-900 font-bold mt-0.5">{selectedApp.mobileNumber}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Donor Classification</span>
                  <p className="text-slate-900 font-bold mt-0.5 capitalize">
                    {selectedApp.donorType === 'organization' ? `Organization (${selectedApp.organizationName || 'Entity'})` : 'Individual Patron'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Pledge Frequency</span>
                  <p className="text-slate-900 font-bold mt-0.5 capitalize">
                    {selectedApp.preferredFrequency.replace('_', ' ')}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                  <span className="text-slate-400 block font-semibold">Intended Pledge / Amount</span>
                  <p className="text-emerald-800 font-bold mt-0.5 text-sm">
                    {selectedApp.donationInterestAmount || 'Flexible / To be confirmed'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                  <span className="text-slate-400 block font-semibold">Full Address & Jurisdiction</span>
                  <p className="text-slate-900 font-medium mt-0.5">
                    {selectedApp.fullAddress}, {selectedApp.district}, {selectedApp.state}, {selectedApp.country}
                  </p>
                </div>
              </div>

              {/* Areas of Support */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">Areas of Support / Philanthropic Interests:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.areasOfSupport?.map((area, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[11px]">
                      ✓ {area}
                    </span>
                  ))}
                </div>
              </div>

              {selectedApp.additionalNotes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Additional Remarks / Message:</span>
                  <p className="text-slate-700 italic">{selectedApp.additionalNotes}</p>
                </div>
              )}

              {/* Audit & Review History */}
              {selectedApp.reviewedAt && (
                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 text-indigo-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-indigo-700" />
                    <span>Prior Review Audit Log</span>
                  </div>
                  <p className="text-[11px]">
                    Reviewed by: <strong>{selectedApp.reviewedByEmail || selectedApp.reviewedByUid}</strong> on {new Date(selectedApp.reviewedAt).toLocaleString()}
                  </p>
                  {selectedApp.reviewNotes && (
                    <p className="text-[11px] italic mt-1 bg-white p-2 rounded-lg border border-indigo-100">
                      "{selectedApp.reviewNotes}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Action Controls */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Close View
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {selectedApp.status !== 'approved' ? (
                  <>
                    <button
                      onClick={() => handleOpenReview(selectedApp, 'under_review')}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer transition-colors"
                      id="donor-modal-btn-under-review"
                    >
                      Mark Under Review
                    </button>

                    <button
                      onClick={() => handleOpenReview(selectedApp, 'rejected')}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-colors"
                      id="donor-modal-btn-reject"
                    >
                      Reject Application
                    </button>

                    <button
                      onClick={() => handleOpenReview(selectedApp, 'approved')}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 cursor-pointer transition-colors"
                      id="donor-modal-btn-approve-with-notes"
                    >
                      Approve with Notes...
                    </button>

                    <button
                      onClick={() => {
                        handleQuickApprove(selectedApp);
                        setSelectedApp(null);
                      }}
                      disabled={processingAppId === selectedApp.id}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                      id="donor-modal-btn-quick-approve"
                    >
                      <Check className="w-4 h-4" />
                      <span>{processingAppId === selectedApp.id ? 'Approving...' : '✓ Approve & Accredit Patron'}</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Application Verified & Certified Patron</span>
                    </span>
                    <button
                      onClick={() => handleOpenReview(selectedApp, 'under_review')}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                    >
                      Change Status
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED REVIEW & STATUS CHANGE FORM MODAL */}
      {isReviewModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
            <div className="border-b border-slate-100 pb-4 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Trustee Decision
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Update Patron Status: {selectedApp.fullLegalName}
                </h3>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Select Target Status */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">Select New Administrative Status *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('under_review')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      reviewAction === 'under_review'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Under Review
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('approved')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      reviewAction === 'approved'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Approve Patron
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('rejected')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      reviewAction === 'rejected'
                        ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Reject Filing
                  </button>
                </div>
              </div>

              {/* Review Notes / Scrutiny Remarks */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Scrutiny Remarks / Trustee Review Notes
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    reviewAction === 'approved'
                      ? 'e.g., Contact verified and registered under the Annual Scholarship Patronage scheme.'
                      : reviewAction === 'rejected'
                      ? 'e.g., Address documentation incomplete. Please update details and resubmit.'
                      : 'e.g., Awaiting confirmation from state chapter coordinator.'
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-[10px] text-slate-400 block">
                  * These remarks will be logged to immutable audit records and shown to the member in their tracking portal.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={isSubmittingReview}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                id="btn-confirm-donor-review-decision"
              >
                {isSubmittingReview ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Commit Status Change</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
