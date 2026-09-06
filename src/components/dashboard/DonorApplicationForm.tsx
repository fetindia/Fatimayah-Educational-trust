/**
 * @license
 * Donor Application Form & Status Tracker
 * Fatimyah Educational Trust India (FET India)
 * Module: Become a Donor / Patron Enrollment (Authenticated Members)
 */

import React, { useState, useEffect } from 'react';
import { 
  BadgeDollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  ChevronRight, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Building, 
  Layers, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Info,
  Edit3,
  CheckSquare,
  Square,
  Send,
  ArrowLeft,
  X,
  Heart,
  Briefcase,
  Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DonorApplication, DonorApplicationStatus, DonorType, DonationFrequency } from '../../types';
import { submitDonorApplication, updateDonorApplication, db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { DigitalDonorCard } from '../donor/DigitalDonorCard';
import { DonorVerificationModal } from '../donor/DonorVerificationModal';

interface DonorApplicationFormProps {
  onClose?: () => void;
  onSuccess?: (msg: string) => void;
}

export const DONOR_AREAS_OF_SUPPORT = [
  'Higher Education Scholarships (Merit-cum-Need)',
  'Healthcare Camps, Dialysis & Medical Aid',
  'Orphan Support & Underprivileged Child Welfare',
  'Emergency Relief & Humanitarian Disaster Welfare',
  'Madrasa Modernization & Islamic Studies Support',
  'Women Skill Empowerment & Vocational Centers',
  'Community Water, Sanitation & Infrastructure',
  'General Trust Endowment Fund (Zakat / Sadaqah / General Fund)'
];

export const DONATION_FREQUENCIES: { value: DonationFrequency; label: string; description: string }[] = [
  { value: 'one_time', label: 'One-Time Contribution', description: 'Occasional support for specific appeals or seasonal campaigns' },
  { value: 'monthly', label: 'Monthly Sustaining Donor', description: 'Regular monthly sponsorship to support recurring student stipends' },
  { value: 'quarterly', label: 'Quarterly Patron', description: 'Quarterly grant commitment for ongoing welfare projects' },
  { value: 'yearly', label: 'Annual / Fiscal Year Patron', description: 'Annual commitment aligned with financial year & tax planning' }
];

export const DonorApplicationForm: React.FC<DonorApplicationFormProps> = ({
  onClose,
  onSuccess
}) => {
  const { currentUser, userProfile } = useAuth();

  const [existingApplication, setExistingApplication] = useState<DonorApplication | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReviewStep, setIsReviewStep] = useState<boolean>(false);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [verifyingId, setVerifyingId] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    state: '',
    district: '',
    fullAddress: '',
    donorType: 'individual' as DonorType,
    organizationName: '',
    areasOfSupport: [] as string[],
    preferredFrequency: 'monthly' as DonationFrequency,
    donationInterestAmount: '',
    additionalNotes: '',
    declarationAccepted: false
  });

  // 1. Subscribe to existing donor application in Firestore for this user
  useEffect(() => {
    if (!currentUser) {
      setIsLoadingExisting(false);
      return;
    }

    const q = query(
      collection(db, 'donorApplications'),
      where('applicantUid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const appData = { id: docSnap.id, ...docSnap.data() } as DonorApplication;
          setExistingApplication(appData);

          // Populate form in case user edits pending application
          setFormData({
            state: appData.state || '',
            district: appData.district || '',
            fullAddress: appData.fullAddress || '',
            donorType: appData.donorType || 'individual',
            organizationName: appData.organizationName || '',
            areasOfSupport: appData.areasOfSupport || [],
            preferredFrequency: appData.preferredFrequency || 'monthly',
            donationInterestAmount: appData.donationInterestAmount || '',
            additionalNotes: appData.additionalNotes || '',
            declarationAccepted: appData.declarationAccepted || false
          });
        } else {
          setExistingApplication(null);

          // Prepopulate state/district from userProfile if available
          if (userProfile) {
            setFormData(prev => ({
              ...prev,
              state: userProfile.state || (userProfile.city ? '' : prev.state),
              district: (userProfile as any).district || userProfile.city || prev.district,
              fullAddress: userProfile.address || prev.fullAddress
            }));
          }
        }
        setIsLoadingExisting(false);
      },
      (err) => {
        console.warn('Donor applications listener error:', err);
        setIsLoadingExisting(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  // Derived user profile data (auto-filled, read-only)
  const fullLegalName = userProfile?.fullLegalName || currentUser?.displayName || 'FET India Member';
  const emailAddress = currentUser?.email || userProfile?.email || 'N/A';
  const mobileNumber = userProfile?.mobileNumber || userProfile?.phoneNumber || 'Not provided in profile';
  const country = userProfile?.country || 'India';

  const toggleAreaOfSupport = (area: string) => {
    setFormData(prev => {
      const exists = prev.areasOfSupport.includes(area);
      if (exists) {
        return { ...prev, areasOfSupport: prev.areasOfSupport.filter(a => a !== area) };
      } else {
        return { ...prev, areasOfSupport: [...prev.areasOfSupport, area] };
      }
    });
  };

  const validateForm = (): boolean => {
    setErrorMessage(null);

    if (!formData.state.trim()) {
      setErrorMessage('Please enter your State / Province.');
      return false;
    }
    if (!formData.district.trim()) {
      setErrorMessage('Please enter your District / City.');
      return false;
    }
    if (!formData.fullAddress.trim()) {
      setErrorMessage('Please provide your complete residential or postal address.');
      return false;
    }
    if (formData.donorType === 'organization' && !formData.organizationName.trim()) {
      setErrorMessage('Please enter your Organization / Entity Name.');
      return false;
    }
    if (formData.areasOfSupport.length === 0) {
      setErrorMessage('Please select at least one Area of Support.');
      return false;
    }
    if (!formData.declarationAccepted) {
      setErrorMessage('You must accept the Donor Declaration & Terms to proceed.');
      return false;
    }

    return true;
  };

  const handleReviewStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsReviewStep(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setErrorMessage('Authentication session expired. Please sign in again.');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (existingApplication && existingApplication.id && (existingApplication.status === 'pending' || isEditing)) {
        // Update existing application
        await updateDonorApplication(
          existingApplication.id,
          {
            fullLegalName,
            mobileNumber,
            country,
            state: formData.state.trim(),
            district: formData.district.trim(),
            fullAddress: formData.fullAddress.trim(),
            donorType: formData.donorType,
            organizationName: formData.donorType === 'organization' ? formData.organizationName.trim() : '',
            areasOfSupport: formData.areasOfSupport,
            preferredFrequency: formData.preferredFrequency,
            donationInterestAmount: formData.donationInterestAmount.trim(),
            additionalNotes: formData.additionalNotes.trim(),
            declarationAccepted: formData.declarationAccepted
          },
          {
            uid: currentUser.uid,
            email: currentUser.email || emailAddress
          }
        );

        setIsEditing(false);
        setIsReviewStep(false);
        if (onSuccess) onSuccess('Donor application updated successfully!');
      } else {
        // Create new application
        await submitDonorApplication(
          {
            applicantUid: currentUser.uid,
            applicantEmail: currentUser.email || emailAddress,
            fullLegalName,
            mobileNumber,
            country,
            state: formData.state.trim(),
            district: formData.district.trim(),
            fullAddress: formData.fullAddress.trim(),
            donorType: formData.donorType,
            organizationName: formData.donorType === 'organization' ? formData.organizationName.trim() : '',
            areasOfSupport: formData.areasOfSupport,
            preferredFrequency: formData.preferredFrequency,
            donationInterestAmount: formData.donationInterestAmount.trim(),
            additionalNotes: formData.additionalNotes.trim(),
            declarationAccepted: formData.declarationAccepted
          },
          {
            uid: currentUser.uid,
            email: currentUser.email || emailAddress
          }
        );

        setIsReviewStep(false);
        if (onSuccess) onSuccess('Your Donor application has been submitted successfully! The Trust Secretariat will review your patron profile.');
      }
    } catch (err: any) {
      console.error('Error submitting donor application:', err);
      setErrorMessage(err?.message || 'Failed to submit application. Please check your internet connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // LOADING STATE
  // -------------------------------------------------------------
  if (isLoadingExisting) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-600">Retrieving donor records...</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 1: EXISTING APPLICATION STATUS TRACKER (IF NOT IN EDIT MODE)
  // -------------------------------------------------------------
  if (existingApplication && !isEditing) {
    const status = existingApplication.status;
    const isPending = status === 'pending';
    const isUnderReview = status === 'under_review';
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';

    return (
      <div className="space-y-6" id="donor-application-status-view">
        {/* Header Navigation Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
              <BadgeDollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  FET India Patronage
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Ref: FET/DNR/{existingApplication.id?.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                Donor Registration & Patron Profile
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Status Stage Card */}
        <div className={`p-6 rounded-3xl border shadow-xs ${
          isApproved ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' :
          isRejected ? 'bg-rose-50/80 border-rose-300 text-rose-950' :
          isUnderReview ? 'bg-blue-50/80 border-blue-300 text-blue-950' :
          'bg-amber-50/80 border-amber-300 text-amber-950'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                isApproved ? 'bg-emerald-700 text-white' :
                isRejected ? 'bg-rose-700 text-white' :
                isUnderReview ? 'bg-blue-700 text-white' :
                'bg-amber-700 text-white'
              }`}>
                {isApproved && <CheckCircle2 className="w-6 h-6" />}
                {isRejected && <XCircle className="w-6 h-6" />}
                {isUnderReview && <Clock className="w-6 h-6" />}
                {isPending && <Clock className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight">
                    {isApproved && 'Patron Status: Verified & Approved Donor'}
                    {isRejected && 'Application Decision: Unsuccessful / Revisions Requested'}
                    {isUnderReview && 'Application Status: Under Active Scrutiny'}
                    {isPending && 'Application Status: Pending Verification Queue'}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed opacity-90 max-w-2xl">
                  {isApproved && 'Your patron registration has been certified by the FET India Board of Trustees. You have been accorded registered donor status and are authorized to access dedicated 80G tax exemption receipts and direct beneficiary progress bulletins.'}
                  {isRejected && (existingApplication.reviewNotes || 'The application could not be approved at this time based on verification criteria. You may update and resubmit your details below.')}
                  {isUnderReview && 'Your patron profile is currently under review by the Central Finance & Donor Relations Secretariat. We verify contact information and philanthropic alignment.'}
                  {isPending && 'Your donor application has been logged into the Super Admin intake queue. Official verification is typically completed within 1-2 business days.'}
                </p>
              </div>
            </div>

            {/* Actions for editable states */}
            <div className="flex items-center gap-2 shrink-0">
              {(isPending || isRejected) && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  id="btn-edit-donor-app"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isRejected ? 'Revise & Re-Apply' : 'Edit Application'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Review Details Metadata if Reviewed */}
          {(existingApplication.reviewedAt || existingApplication.reviewedByEmail) && (
            <div className="mt-4 pt-4 border-t border-current/10 text-xs flex flex-wrap items-center gap-4 opacity-85">
              <span>
                <strong>Reviewed on:</strong> {new Date(existingApplication.reviewedAt || '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              {existingApplication.reviewedByEmail && (
                <span>
                  <strong>Authorized Officer:</strong> {existingApplication.reviewedByEmail}
                </span>
              )}
              {existingApplication.reviewNotes && (
                <div className="w-full mt-1 p-3 bg-white/70 rounded-xl border border-current/20 font-sans">
                  <span className="font-bold block text-[11px] uppercase tracking-wider mb-0.5">Trust Review Notes:</span>
                  <p className="text-xs italic leading-relaxed">{existingApplication.reviewNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Digital Donor Card Display for Approved Donors */}
        {isApproved && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-amber-950 p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-lg text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Official FET India Credential
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Digital Patron Identity Card
                </h3>
              </div>
              <button
                onClick={() => {
                  setVerifyingId(userProfile?.donorId || existingApplication.donorIdAssigned || (existingApplication as any).donorId || 'FET-DNR');
                  setShowVerifyModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors self-start sm:self-auto"
              >
                <span>Verify Credential QR</span>
              </button>
            </div>

            <div className="max-w-md mx-auto py-2">
              <DigitalDonorCard 
                donorId={userProfile?.donorId || existingApplication.donorIdAssigned || (existingApplication as any).donorId || 'FET-DNR-2026-0101'}
                fullName={existingApplication.fullLegalName || userProfile?.fullLegalName || currentUser?.displayName || 'Registered Patron'}
                donorType={existingApplication.donorType}
                organizationName={existingApplication.organizationName}
                donorStatus="approved"
                issueDate={existingApplication.reviewedAt || 'Jan 2026'}
                photoURL={userProfile?.photoURL}
                district={existingApplication.district}
                state={existingApplication.state}
                onOpenVerification={(id) => {
                  setVerifyingId(id);
                  setShowVerifyModal(true);
                }}
                onNotify={onSuccess}
                showActions={true}
              />
            </div>
          </div>
        )}

        {/* 4-Step Progress Indicator */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
            Patron Intake Lifecycle
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className={`p-3.5 rounded-2xl border ${
              isPending || isUnderReview || isApproved || isRejected 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>1. Submission</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Application logged</p>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              isUnderReview || isApproved || isRejected 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : isPending ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                {isUnderReview || isApproved || isRejected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600" />
                )}
                <span>2. Secretariat Scrutiny</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Verification queue</p>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              isApproved 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : isUnderReview ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                {isApproved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                )}
                <span>3. Trustee Approval</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Role authorization</p>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              isApproved 
                ? 'bg-emerald-700 text-white font-bold' 
                : isRejected ? 'bg-rose-50 border-rose-200 text-rose-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                {isApproved ? <Sparkles className="w-4 h-4 text-amber-300" /> : <Award className="w-4 h-4" />}
                <span>4. Patron Certified</span>
              </div>
              <p className={`text-[11px] mt-1 ${isApproved ? 'text-emerald-100' : 'text-slate-500'}`}>
                {isApproved ? '80G & Donor Access' : 'Certification'}
              </p>
            </div>
          </div>
        </div>

        {/* Application Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Submitted Patron Profile Details</h3>
              <p className="text-xs text-slate-500">Official details registered with Fatimyah Educational Trust</p>
            </div>
            <span className="text-xs text-slate-400">
              Submitted on {new Date(existingApplication.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Full Legal Name</span>
              <p className="text-slate-900 font-bold text-sm mt-0.5">{existingApplication.fullLegalName}</p>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold">Email Address</span>
              <p className="text-slate-900 font-bold mt-0.5">{existingApplication.applicantEmail}</p>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold">Mobile Number</span>
              <p className="text-slate-900 font-bold mt-0.5">{existingApplication.mobileNumber}</p>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold">Donor Classification</span>
              <p className="text-slate-900 font-bold mt-0.5 capitalize">
                {existingApplication.donorType === 'organization' ? `Organization (${existingApplication.organizationName || 'Entity'})` : 'Individual Patron'}
              </p>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold">Pledge Frequency</span>
              <p className="text-slate-900 font-bold mt-0.5 capitalize">
                {existingApplication.preferredFrequency.replace('_', ' ')}
              </p>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold">Intended Pledge / Amount</span>
              <p className="text-emerald-800 font-bold mt-0.5">
                {existingApplication.donationInterestAmount || 'To be specified per cause'}
              </p>
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <span className="text-slate-400 block font-semibold">Jurisdiction & Address</span>
              <p className="text-slate-900 font-medium mt-0.5">
                {existingApplication.fullAddress}, {existingApplication.district}, {existingApplication.state}, {existingApplication.country}
              </p>
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <span className="text-slate-400 block font-semibold mb-1.5">Causes & Areas of Support</span>
              <div className="flex flex-wrap gap-1.5">
                {existingApplication.areasOfSupport?.map((area, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                    ✓ {area}
                  </span>
                ))}
              </div>
            </div>

            {existingApplication.additionalNotes && (
              <div className="sm:col-span-2 md:col-span-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block font-bold text-[11px] mb-1">Additional Remarks / Dedication:</span>
                <p className="text-slate-700 italic">{existingApplication.additionalNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification Modal */}
        <DonorVerificationModal 
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          initialDonorId={verifyingId}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: APPLICATION FORM / EDIT FORM / REVIEW STEP
  // -------------------------------------------------------------
  return (
    <div className="space-y-6" id="donor-application-form-container">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Patron & Donor Network
              </span>
              {isEditing && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Editing Saved Application
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Become a FET India Donor & Patron
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Join visionary patrons dedicated to empowering underprivileged students through merit scholarships, modern educational infrastructure, and transparent 80G tax-exempt charitable welfare.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-amber-900 block">
            Official Non-Payment Registration Process
          </span>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            This application registers your philanthropic pledge and patron profile with the Fatimyah Educational Trust. <strong>No payment or bank details are collected on this form.</strong> Once your patron profile is reviewed, authorized receipt ledgers and verified payment links for specific educational causes will be enabled on your dashboard.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Review Step Modal / Screen */}
      {isReviewStep ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Review Your Donor Application</h2>
              <p className="text-xs text-slate-500">Please verify all submitted details before sending to the Trust Secretariat.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsReviewStep(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-400 font-semibold block">Full Legal Name</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{fullLegalName}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Email Address</span>
              <p className="font-bold text-slate-900 mt-0.5">{emailAddress}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Mobile Number</span>
              <p className="font-bold text-slate-900 mt-0.5">{mobileNumber}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Donor Category</span>
              <p className="font-bold text-slate-900 mt-0.5 capitalize">
                {formData.donorType === 'organization' ? `Organization (${formData.organizationName})` : 'Individual Patron'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Pledge Frequency</span>
              <p className="font-bold text-slate-900 mt-0.5 capitalize">{formData.preferredFrequency.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Intended Pledge / Amount</span>
              <p className="font-bold text-emerald-800 mt-0.5">{formData.donationInterestAmount || 'Flexible / As required'}</p>
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <span className="text-slate-400 font-semibold block">Address & Jurisdiction</span>
              <p className="font-medium text-slate-900 mt-0.5">
                {formData.fullAddress}, {formData.district}, {formData.state}, {country}
              </p>
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <span className="text-slate-400 font-semibold block mb-1">Selected Areas of Support:</span>
              <div className="flex flex-wrap gap-1.5">
                {formData.areasOfSupport.map((area, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold text-[11px]">
                    ✓ {area}
                  </span>
                ))}
              </div>
            </div>
            {formData.additionalNotes && (
              <div className="sm:col-span-2 md:col-span-3">
                <span className="text-slate-400 font-semibold block">Additional Notes:</span>
                <p className="text-slate-700 italic mt-0.5">{formData.additionalNotes}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReviewStep(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              Modify Details
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              id="btn-confirm-submit-donor-app"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting to Trust...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirm & Submit Donor Application</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleReviewStep} className="space-y-6" id="donor-intake-form">
          {/* SECTION 1: AUTO-FILLED PROFILE INFORMATION */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-black text-slate-900">1. Member Profile Verification (Auto-Filled)</h3>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified Member Account
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold block">Full Legal Name</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                  {fullLegalName}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold block">Email Address</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 truncate">
                  {emailAddress}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold block">Mobile Number</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                  {mobileNumber}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold block">Country</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                  {country}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              * Profile contact details are linked to your authenticated FET India account. To update name or phone, visit the My Profile tab.
            </p>
          </div>

          {/* SECTION 2: DONOR CLASSIFICATION & JURISDICTION */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-black text-slate-900">2. Donor Classification & Jurisdiction</h3>
            </div>

            {/* Donor Type Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Donor Classification Type *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, donorType: 'individual' }))}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                    formData.donorType === 'individual'
                      ? 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <User className={`w-5 h-5 mt-0.5 shrink-0 ${formData.donorType === 'individual' ? 'text-amber-700' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-slate-900">Individual Philanthropist</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Contributing as an individual patron or family trust</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, donorType: 'organization' }))}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                    formData.donorType === 'organization'
                      ? 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Briefcase className={`w-5 h-5 mt-0.5 shrink-0 ${formData.donorType === 'organization' ? 'text-amber-700' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-slate-900">Corporate / Trust / Foundation</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Institutional CSR grants, registered trusts, or company patronage</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Organization Name Field (Conditional) */}
            {formData.donorType === 'organization' && (
              <div className="space-y-1 animate-in fade-in">
                <label className="text-xs font-bold text-slate-800 block">
                  Organization / Entity / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Al-Madina CSR Foundation / Apex Educational Trust"
                  value={formData.organizationName}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}

            {/* State & District & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">State / Province *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Maharashtra, Telangana, Delhi, Karnataka"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">District / City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mumbai, Hyderabad, Bengaluru, Pune"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-800 block">Full Residential / Office Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Street, Landmark, Postal Code (used for official 80G postal correspondence)"
                  value={formData.fullAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: AREAS OF SUPPORT & PLEDGE PREFERENCES */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-black text-slate-900">3. Philanthropic Interests & Support Areas</h3>
              </div>
              <span className="text-[11px] text-slate-400">Select one or more</span>
            </div>

            {/* Areas of Support Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {DONOR_AREAS_OF_SUPPORT.map((area, idx) => {
                const isSelected = formData.areasOfSupport.includes(area);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleAreaOfSupport(area)}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-400 text-amber-950 font-bold shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-700" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[11px] leading-snug">{area}</span>
                  </button>
                );
              })}
            </div>

            {/* Preferred Donation Frequency */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-800 block">
                Preferred Donation Frequency *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {DONATION_FREQUENCIES.map((freq) => {
                  const isSelected = formData.preferredFrequency === freq.value;
                  return (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, preferredFrequency: freq.value }))}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{freq.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1 leading-snug">{freq.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Donation Interest / Amount & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Optional Intended Support / Amount (INR / Scope)
                </label>
                <input
                  type="text"
                  placeholder="e.g., ₹50,000 / year or 2 Full Student Scholarships"
                  value={formData.donationInterestAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, donationInterestAmount: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-[10px] text-slate-400 block">Non-binding reference for trust planning</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Special Dedication or Message (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., In loving memory of Late Dr. S. K. Rizvi / Zakat allocation"
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: DONOR DECLARATION & CODE OF INTEGRITY */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-black text-slate-900">4. Patron Declaration & Legal Undertaking</h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 text-xs leading-relaxed space-y-2">
              <p>
                1. I hereby confirm my bona fide intention to participate as a registered donor/patron with <strong>Fatimyah Educational Trust India (FET India)</strong>.
              </p>
              <p>
                2. I declare that all funds contributed towards educational grants, healthcare relief, or charitable endowment originate from legitimate, lawful sources in full compliance with Indian tax legislation and Trust By-laws.
              </p>
              <p>
                3. I acknowledge that the Trust provides official 80G tax exemption receipts for eligible contributions, and that patron accreditation does not confer commercial ownership or executive trust management rights.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none pt-2">
              <input
                type="checkbox"
                required
                checked={formData.declarationAccepted}
                onChange={(e) => setFormData(prev => ({ ...prev, declarationAccepted: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-900 leading-snug">
                I have read and unconditionally accept the FET India Patron Declaration, Code of Integrity, and Trust Terms. *
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-7 py-3 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-2"
              id="btn-review-donor-app"
            >
              <span>Review & Submit Patron Profile</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
