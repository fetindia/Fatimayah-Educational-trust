/**
 * @license
 * Membership Application Module (Registered Users -> General Members)
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Public Brand: FET India
 * Tagline: Education • Service • Empowerment
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
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
  GraduationCap, 
  Award, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Edit3,
  Send,
  ArrowLeft,
  X,
  Briefcase,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MembershipApplication, MembershipApplicationStatus } from '../../types';
import { submitMembershipApplication, updateMembershipApplication, db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface MembershipApplicationFormProps {
  onClose?: () => void;
  onSuccess?: (msg: string) => void;
}

const INTEREST_AREAS = [
  'Education & Scholarship Aid',
  'Healthcare & Medical Relief',
  'Youth Mentorship & Career Guidance',
  'Women Skill Development & Empowerment',
  'Community Welfare & Disaster Relief',
  'Madrasa & Modern Curriculum Integration',
  'Legal & Civic Awareness Outreach',
  'Digital Skills & IT Infrastructure'
];

export const MembershipApplicationForm: React.FC<MembershipApplicationFormProps> = ({
  onClose,
  onSuccess
}) => {
  const { currentUser, userProfile } = useAuth();

  const [existingApplication, setExistingApplication] = useState<MembershipApplication | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReviewStep, setIsReviewStep] = useState<boolean>(false);

  // Form State with all 11 required fields
  const [formData, setFormData] = useState({
    state: '',
    district: '',
    fullAddress: '',
    dateOfBirth: '',
    gender: 'Male',
    qualification: '',
    occupation: '',
    areasOfInterest: [] as string[],
    reasonForJoining: '',
    declarationAccepted: false,
    termsAccepted: false
  });

  // 1. Subscribe to existing membership application in Firestore for this user
  useEffect(() => {
    if (!currentUser) {
      setIsLoadingExisting(false);
      return;
    }

    const q = query(
      collection(db, 'membershipApplications'),
      where('applicantUid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const appData = { id: docSnap.id, ...docSnap.data() } as MembershipApplication;
          setExistingApplication(appData);

          // Populate form for editing or viewing
          setFormData({
            state: appData.state || '',
            district: appData.district || '',
            fullAddress: appData.fullAddress || '',
            dateOfBirth: appData.dateOfBirth || '',
            gender: appData.gender || 'Male',
            qualification: appData.qualification || appData.educationalQualification || '',
            occupation: appData.occupation || '',
            areasOfInterest: Array.isArray(appData.areasOfInterest) ? appData.areasOfInterest : [],
            reasonForJoining: appData.reasonForJoining || appData.motivationStatement || '',
            declarationAccepted: appData.declarationAccepted || false,
            termsAccepted: appData.termsAccepted || appData.declarationAccepted || false
          });
        } else {
          setExistingApplication(null);

          // Prepopulate from userProfile
          if (userProfile) {
            setFormData(prev => ({
              ...prev,
              state: userProfile.state || prev.state,
              district: (userProfile as any).district || userProfile.city || prev.district,
              fullAddress: userProfile.address || prev.fullAddress,
              dateOfBirth: userProfile.dateOfBirth || prev.dateOfBirth,
              gender: userProfile.gender || prev.gender,
              qualification: userProfile.educationalQualification || userProfile.qualification || prev.qualification,
              occupation: userProfile.occupation || prev.occupation
            }));
          }
        }
        setIsLoadingExisting(false);
      },
      (err) => {
        console.warn('Membership application listener notice:', err);
        setIsLoadingExisting(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  // Profile Auto-filled Values (from existing authenticated user profile)
  const fullLegalName = userProfile?.fullLegalName || userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || 'Registered User';
  const emailAddress = currentUser?.email || userProfile?.email || '';
  const mobileNumber = userProfile?.mobileNumber || userProfile?.phoneNumber || '';
  const country = userProfile?.country || 'India';

  const toggleInterest = (area: string) => {
    setFormData(prev => {
      const exists = prev.areasOfInterest.includes(area);
      if (exists) {
        return { ...prev, areasOfInterest: prev.areasOfInterest.filter(a => a !== area) };
      } else {
        return { ...prev, areasOfInterest: [...prev.areasOfInterest, area] };
      }
    });
  };

  const validateForm = (): boolean => {
    setErrorMessage(null);

    if (!formData.state.trim()) {
      setErrorMessage('Please specify your State / Province.');
      return false;
    }
    if (!formData.district.trim()) {
      setErrorMessage('Please specify your District / City.');
      return false;
    }
    if (!formData.fullAddress.trim()) {
      setErrorMessage('Please provide your complete Full Residential Postal Address.');
      return false;
    }
    if (!formData.dateOfBirth) {
      setErrorMessage('Please select your Date of Birth.');
      return false;
    }
    if (!formData.gender) {
      setErrorMessage('Please select your Gender.');
      return false;
    }
    if (!formData.qualification.trim()) {
      setErrorMessage('Please state your Educational Qualification.');
      return false;
    }
    if (!formData.occupation.trim()) {
      setErrorMessage('Please specify your current Occupation / Profession.');
      return false;
    }
    if (!formData.reasonForJoining.trim() || formData.reasonForJoining.trim().length < 20) {
      setErrorMessage('Please provide a reason for joining FET India (minimum 20 characters).');
      return false;
    }
    if (!formData.declarationAccepted) {
      setErrorMessage('You must accept the FET India Trust Membership Declaration to proceed.');
      return false;
    }
    if (!formData.termsAccepted) {
      setErrorMessage('You must agree to the Terms & Conditions of FET India.');
      return false;
    }

    return true;
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsReviewStep(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitFinal = async () => {
    if (!currentUser) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (existingApplication && (existingApplication.status === 'pending' || existingApplication.status === 'rejected') && isEditing) {
        await updateMembershipApplication(existingApplication.id!, {
          membershipType: 'general_member',
          state: formData.state.trim(),
          district: formData.district.trim(),
          fullAddress: formData.fullAddress.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          qualification: formData.qualification.trim(),
          educationalQualification: formData.qualification.trim(),
          occupation: formData.occupation.trim(),
          areasOfInterest: formData.areasOfInterest,
          reasonForJoining: formData.reasonForJoining.trim(),
          motivationStatement: formData.reasonForJoining.trim(),
          declarationAccepted: formData.declarationAccepted,
          termsAccepted: formData.termsAccepted
        }, { uid: currentUser.uid, email: currentUser.email || '' });

        if (onSuccess) onSuccess('Your Membership Application has been updated successfully.');
        setIsEditing(false);
        setIsReviewStep(false);
      } else {
        await submitMembershipApplication({
          applicantUid: currentUser.uid,
          applicantEmail: currentUser.email || '',
          fullLegalName,
          mobileNumber,
          country,
          membershipType: 'general_member',
          requestedTier: 'general_member',
          state: formData.state.trim(),
          district: formData.district.trim(),
          fullAddress: formData.fullAddress.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          qualification: formData.qualification.trim(),
          educationalQualification: formData.qualification.trim(),
          occupation: formData.occupation.trim(),
          areasOfInterest: formData.areasOfInterest,
          reasonForJoining: formData.reasonForJoining.trim(),
          motivationStatement: formData.reasonForJoining.trim(),
          declarationAccepted: formData.declarationAccepted,
          termsAccepted: formData.termsAccepted
        }, { uid: currentUser.uid, email: currentUser.email || '' });

        if (onSuccess) onSuccess('Membership Application submitted! The Trust Secretariat will review your credentials.');
        setIsReviewStep(false);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMessage(err?.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: MembershipApplicationStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved General Member
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-300">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            Pending
          </span>
        );
    }
  };

  if (isLoadingExisting) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500">Checking membership records...</p>
      </div>
    );
  }

  // If already has an application and not in edit mode, display the Status Tracker Card
  if (existingApplication && !isEditing) {
    return (
      <div className="space-y-6" id="membership-application-status-view">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CreditCard className="w-5 h-5" />
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  General Membership Application
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Official accreditation pathway from Registered User to General Trust Member.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {renderStatusBadge(existingApplication.status)}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Tracker Banner */}
          <div className="mt-6">
            {existingApplication.status === 'approved' && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  Congratulations! Your General Membership has been officially approved.
                </div>
                <p className="text-xs leading-relaxed text-emerald-800">
                  You are now recognized as an accredited General Member of Fatimyah Educational Trust India. You can access your official Digital ID Card, participate in member assemblies, and receive official trust communications.
                </p>
                {existingApplication.membershipIdAssigned && (
                  <div className="pt-2 text-xs font-mono font-bold text-emerald-900">
                    Assigned Member ID: <span className="bg-emerald-200/70 px-2.5 py-1 rounded-md">{existingApplication.membershipIdAssigned}</span>
                  </div>
                )}
                {existingApplication.reviewNotes && (
                  <div className="text-xs italic bg-white/70 p-3 rounded-xl border border-emerald-200 mt-2">
                    <span className="font-bold">Secretariat Note:</span> {existingApplication.reviewNotes}
                  </div>
                )}
              </div>
            )}

            {existingApplication.status === 'under_review' && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  <Clock className="w-5 h-5 text-amber-700" />
                  Application Under Review
                </div>
                <p className="text-xs leading-relaxed text-amber-800">
                  The Trust Secretariat is reviewing your application details and credentials. You will be notified once the review is completed.
                </p>
                {existingApplication.reviewNotes && (
                  <div className="text-xs italic bg-white/70 p-3 rounded-xl border border-amber-200 mt-2">
                    <span className="font-bold">Review Note:</span> {existingApplication.reviewNotes}
                  </div>
                )}
              </div>
            )}

            {existingApplication.status === 'pending' && (
              <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <Clock className="w-5 h-5 text-sky-700" />
                    Application Submitted & Pending Review
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-800 hover:bg-sky-100 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Application</span>
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-sky-800">
                  Your membership application has been received and is currently in the intake queue. Authorized administrators will review your application shortly.
                </p>
              </div>
            )}

            {existingApplication.status === 'rejected' && (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <XCircle className="w-5 h-5 text-rose-700" />
                    Application Rejected
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update & Re-Submit</span>
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-rose-800">
                  {existingApplication.reviewNotes || existingApplication.rejectionReason ? (
                    <>
                      <strong className="block mb-0.5">Reason for Rejection:</strong>
                      <span>{existingApplication.reviewNotes || existingApplication.rejectionReason}</span>
                    </>
                  ) : (
                    'Your application was not approved. Please review your details and re-submit with updated information.'
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Submitted Application Summary Grid */}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
              Submitted Application Particulars
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Applicant Legal Name</span>
                <div className="font-bold text-slate-900 mt-0.5">{existingApplication.fullLegalName}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Membership Category</span>
                <div className="font-bold text-slate-900 mt-0.5">General Member</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                <div className="font-bold text-slate-900 mt-0.5 truncate">{existingApplication.applicantEmail}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Mobile Number</span>
                <div className="font-bold text-slate-900 mt-0.5">{existingApplication.mobileNumber}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">State / District</span>
                <div className="font-bold text-slate-900 mt-0.5">{existingApplication.district}, {existingApplication.state}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Date of Birth & Gender</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {existingApplication.dateOfBirth || 'N/A'} • {existingApplication.gender || 'N/A'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Occupation</span>
                <div className="font-bold text-slate-900 mt-0.5">{existingApplication.occupation || 'N/A'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Qualification</span>
                <div className="font-bold text-slate-900 mt-0.5">{existingApplication.qualification || existingApplication.educationalQualification || 'N/A'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Country</span>
                <div className="font-bold text-slate-900 mt-0.5">{existingApplication.country || 'India'}</div>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Residential Postal Address</span>
                <div className="font-medium text-slate-800 mt-0.5">{existingApplication.fullAddress}</div>
              </div>

              {existingApplication.areasOfInterest && existingApplication.areasOfInterest.length > 0 && (
                <div className="sm:col-span-2 lg:col-span-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Areas of Interest</span>
                  <div className="flex flex-wrap gap-1.5">
                    {existingApplication.areasOfInterest.map((area, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(existingApplication.reasonForJoining || existingApplication.motivationStatement) && (
                <div className="sm:col-span-2 lg:col-span-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Reason for Joining FET India</span>
                  <div className="font-medium text-slate-800 mt-0.5 leading-relaxed">
                    {existingApplication.reasonForJoining || existingApplication.motivationStatement}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Submitted: {new Date(existingApplication.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {existingApplication.updatedAt && (
                <span>Last Updated: {new Date(existingApplication.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Application Input Form & Review Step
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6" id="membership-application-form-view">
      
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CreditCard className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {isEditing ? 'Edit Membership Application' : 'Apply for General Membership'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Apply to become an official accredited General Member of Fatimyah Educational Trust India.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer self-start sm:self-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* REVIEW STEP */}
      {isReviewStep ? (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Please review your application details carefully before final transmission to the Trust Secretariat.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Full Legal Name</span>
              <div className="font-black text-slate-900 mt-0.5">{fullLegalName}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Membership Category</span>
              <div className="font-black text-slate-900 mt-0.5">General Member</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
              <div className="font-bold text-slate-900 mt-0.5">{emailAddress}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Mobile Number</span>
              <div className="font-bold text-slate-900 mt-0.5">{mobileNumber}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">State & District</span>
              <div className="font-bold text-slate-900 mt-0.5">{formData.district}, {formData.state}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Date of Birth & Gender</span>
              <div className="font-bold text-slate-900 mt-0.5">{formData.dateOfBirth} • {formData.gender}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Occupation</span>
              <div className="font-bold text-slate-900 mt-0.5">{formData.occupation}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Qualification</span>
              <div className="font-bold text-slate-900 mt-0.5">{formData.qualification}</div>
            </div>

            <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Residential Postal Address</span>
              <div className="font-medium text-slate-800 mt-0.5">{formData.fullAddress}</div>
            </div>

            {formData.areasOfInterest.length > 0 && (
              <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Areas of Interest</span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.areasOfInterest.map((a, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Reason for Joining FET India</span>
              <div className="font-medium text-slate-800 mt-0.5 leading-relaxed">{formData.reasonForJoining}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReviewStep(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Edit</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitFinal}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{isEditing ? 'Confirm & Update Application' : 'Submit Application'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* INPUT FORM STEP */
        <form onSubmit={handleProceedToReview} className="space-y-6">
          
          {/* Section 1: Auto-populated Profile Information */}
          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-600">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>Existing Profile Information (Auto-Populated)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Full Legal Name</span>
                <span className="font-bold text-slate-900 truncate block">{fullLegalName}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Email Address</span>
                <span className="font-bold text-slate-900 truncate block">{emailAddress}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Mobile Number</span>
                <span className="font-bold text-slate-900 block">{mobileNumber || 'Please update profile'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Country</span>
                <span className="font-bold text-slate-900 block">{country}</span>
              </div>
            </div>
          </div>

          {/* Membership Tier Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            <div>
              <strong className="block font-black text-emerald-900">Application Tier: General Member</strong>
              <p className="text-emerald-800 mt-0.5 leading-relaxed text-[11px]">
                Registered users apply for General Membership. (Note: Core Membership is granted by administrative appointment and trust governance nomination).
              </p>
            </div>
          </div>

          {/* Section 2: Membership-Specific Information (11 Required Fields) */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Membership Information & Particulars
            </h3>

            {/* 1. State / Province & 2. District / City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  1. State / Province <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telangana, Maharashtra, Karnataka"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  2. District / City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad, Mumbai, Bangalore"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 3. Full Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                3. Full Residential Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="House / Flat No., Street, Landmark, Area, Postal PIN Code"
                value={formData.fullAddress}
                onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            {/* 4. Date of Birth & 5. Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  4. Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  5. Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* 6. Education/Qualification & 7. Occupation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  6. Education / Qualification <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech, M.Ed, MBBS, MBA, M.A., Graduate"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  7. Occupation / Profession <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Educator, Software Engineer, Healthcare, Business, Student"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 8. Areas of Interest */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                8. Areas of Interest
              </label>
              <p className="text-[11px] text-slate-500 mb-2">Select trust focus areas you are passionate about contributing to:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INTEREST_AREAS.map((area) => {
                  const isChecked = formData.areasOfInterest.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleInterest(area)}
                      className={`p-2.5 rounded-xl border text-xs text-left flex items-center gap-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{area}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 9. Reason for Joining FET India */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                9. Reason for Joining FET India <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe your motivation for seeking membership and how you envision supporting FET India's educational, welfare, or humanitarian mission..."
                value={formData.reasonForJoining}
                onChange={(e) => setFormData({ ...formData, reasonForJoining: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 10. Membership Declaration */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={formData.declarationAccepted}
                onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })}
                className="mt-1 w-4 h-4 rounded-sm border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
              />
              <span className="text-xs text-slate-800 leading-relaxed">
                <strong className="text-slate-900 block mb-0.5">10. Membership Declaration:</strong>
                I solemnly declare that the information provided in this application is accurate and authentic to the best of my knowledge. I commit to honoring the principles, non-profit objectives, and ethical standards of Fatimyah Educational Trust India.
              </span>
            </label>
          </div>

          {/* 11. Terms & Conditions */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={formData.termsAccepted}
                onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                className="mt-1 w-4 h-4 rounded-sm border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
              />
              <span className="text-xs text-slate-800 leading-relaxed">
                <strong className="text-slate-900 block mb-0.5">11. Terms & Conditions:</strong>
                I agree to the Terms of Service, Privacy Policy, and governance regulations of FET India. I acknowledge that membership status is granted subject to administrative approval by the Trust Secretariat and does not replace existing volunteer or donor roles.
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="ml-auto px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>Review Application</span>
              <ChevronRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
