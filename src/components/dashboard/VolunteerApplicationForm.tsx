/**
 * @license
 * Volunteer Application Form & Status Tracker
 * Fatimyah Educational Trust India (FET India)
 * Module: Become a Volunteer (Authenticated Members)
 */

import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
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
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { VolunteerApplication, VolunteerApplicationStatus } from '../../types';
import { submitVolunteerApplication, updateVolunteerApplication, db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface VolunteerApplicationFormProps {
  onClose?: () => void;
  onSuccess?: (msg: string) => void;
}

const AVAILABLE_AREAS_OF_INTEREST = [
  'Education & Child Literacy',
  'Healthcare Camps & Medical Relief',
  'Emergency & Disaster Welfare',
  'Orphan Support & Family Aid',
  'Youth Mentorship & Career Guidance',
  'Events Logistics & Operations',
  'Digital Media & Tech Support',
  'Community Legal & Financial Literacy'
];

const PRESET_SKILLS = [
  'Teaching / Tutoring',
  'Medical / First Aid',
  'Event Management',
  'Social Work / Counseling',
  'Graphic Design / Video',
  'Web / Software Development',
  'Logistics / Driving',
  'Translation (Urdu/Hindi/English)',
  'Accounting / Bookkeeping',
  'Fundraising Outreach'
];

const AVAILABILITY_OPTIONS = [
  'Weekends Only (Saturday/Sunday)',
  'Weekday Evenings (2-4 hrs/day)',
  'Flexible / As Needed',
  'Emergency Response Call-out Only',
  'Full-Time Dedicated Corps'
];

export const VolunteerApplicationForm: React.FC<VolunteerApplicationFormProps> = ({
  onClose,
  onSuccess
}) => {
  const { currentUser, userProfile } = useAuth();

  const [existingApplication, setExistingApplication] = useState<VolunteerApplication | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReviewStep, setIsReviewStep] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    fatherOrMotherName: '',
    photoURL: '',
    state: '',
    district: '',
    fullAddress: '',
    dateOfBirth: '',
    educationQualification: '',
    skills: [] as string[],
    customSkill: '',
    areasOfInterest: [] as string[],
    preferredActivities: [] as string[],
    previousExperience: '',
    availability: AVAILABILITY_OPTIONS[0],
    preferredLocation: '',
    statementOfPurpose: '',
    declarationAccepted: false
  });

  // 1. Subscribe to existing volunteer application in Firestore for this user
  useEffect(() => {
    if (!currentUser) {
      setIsLoadingExisting(false);
      return;
    }

    const q = query(
      collection(db, 'volunteerApplications'),
      where('applicantUid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const appData = { id: docSnap.id, ...docSnap.data() } as VolunteerApplication;
          setExistingApplication(appData);

          // Populate form in case user edits pending application
          setFormData({
            fatherOrMotherName: appData.fatherName || appData.motherName || appData.guardianName || (userProfile?.fatherName || userProfile?.guardianName || ''),
            photoURL: appData.photoURL || appData.profilePhotoUrl || userProfile?.photoURL || currentUser?.photoURL || '',
            state: appData.state || userProfile?.state || '',
            district: appData.district || userProfile?.city || userProfile?.district || '',
            fullAddress: appData.fullAddress || userProfile?.address || '',
            dateOfBirth: appData.dateOfBirth || userProfile?.dateOfBirth || '',
            educationQualification: appData.educationQualification || userProfile?.educationalQualification || userProfile?.qualification || '',
            skills: appData.skills || [],
            customSkill: '',
            areasOfInterest: appData.areasOfInterest || [],
            preferredActivities: appData.preferredActivities || [],
            previousExperience: appData.previousExperience || '',
            availability: appData.availability || AVAILABILITY_OPTIONS[0],
            preferredLocation: appData.preferredLocation || '',
            statementOfPurpose: appData.statementOfPurpose || '',
            declarationAccepted: appData.declarationAccepted || false
          });
        } else {
          setExistingApplication(null);

          // Prepopulate from userProfile if available
          if (userProfile || currentUser) {
            setFormData(prev => ({
              ...prev,
              fatherOrMotherName: userProfile?.fatherName || userProfile?.guardianName || userProfile?.motherName || '',
              photoURL: userProfile?.photoURL || currentUser?.photoURL || '',
              state: userProfile?.state || prev.state,
              district: userProfile?.city || userProfile?.district || prev.district,
              fullAddress: userProfile?.address || userProfile?.fullAddress || prev.fullAddress,
              dateOfBirth: userProfile?.dateOfBirth || prev.dateOfBirth,
              educationQualification: userProfile?.educationalQualification || userProfile?.qualification || prev.educationQualification
            }));
          }
        }
        setIsLoadingExisting(false);
      },
      (error) => {
        console.warn('Volunteer application listener error:', error);
        setIsLoadingExisting(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  const toggleInterest = (interest: string) => {
    setFormData(prev => {
      const exists = prev.areasOfInterest.includes(interest);
      return {
        ...prev,
        areasOfInterest: exists
          ? prev.areasOfInterest.filter(i => i !== interest)
          : [...prev.areasOfInterest, interest]
      };
    });
  };

  const toggleActivity = (activity: string) => {
    setFormData(prev => {
      const exists = prev.preferredActivities.includes(activity);
      return {
        ...prev,
        preferredActivities: exists
          ? prev.preferredActivities.filter(a => a !== activity)
          : [...prev.preferredActivities, activity]
      };
    });
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists
          ? prev.skills.filter(s => s !== skill)
          : [...prev.skills, skill]
      };
    });
  };

  const handleAddCustomSkill = () => {
    if (!formData.customSkill.trim()) return;
    const trimmed = formData.customSkill.trim();
    if (!formData.skills.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmed],
        customSkill: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, customSkill: '' }));
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Validation
  const validateForm = () => {
    if (!formData.state.trim()) return 'Please enter your State / Province.';
    if (!formData.district.trim()) return 'Please enter your District / City.';
    if (!formData.fullAddress.trim()) return 'Please provide your Full Residential Address.';
    if (!formData.dateOfBirth.trim()) return 'Please select your Date of Birth.';
    if (!formData.educationQualification.trim()) return 'Please state your Educational Qualification.';
    if (formData.skills.length === 0) return 'Please select at least one skill or capability.';
    if (formData.areasOfInterest.length === 0) return 'Please select at least one Area of Interest.';
    if (!formData.preferredLocation.trim()) return 'Please specify your Preferred Volunteer Location / City / Chapter.';
    if (!formData.statementOfPurpose.trim() || formData.statementOfPurpose.trim().length < 20) {
      return 'Please write at least 20 characters explaining why you want to volunteer with FET India.';
    }
    if (!formData.declarationAccepted) {
      return 'You must accept the FET India Volunteer Code of Conduct and Declaration.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!currentUser) {
      setErrorMessage('User session expired. Please sign in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        applicantUid: currentUser.uid,
        applicantEmail: currentUser.email || userProfile?.email || '',
        fullLegalName: userProfile?.fullLegalName || userProfile?.displayName || currentUser.displayName || 'Member',
        fatherName: formData.fatherOrMotherName.trim(),
        photoURL: formData.photoURL.trim() || userProfile?.photoURL || currentUser?.photoURL || '',
        profilePhotoUrl: formData.photoURL.trim() || userProfile?.photoURL || currentUser?.photoURL || '',
        mobileNumber: userProfile?.mobileNumber || userProfile?.phoneNumber || '',
        country: userProfile?.country || 'India',
        state: formData.state.trim(),
        district: formData.district.trim(),
        fullAddress: formData.fullAddress.trim(),
        dateOfBirth: formData.dateOfBirth,
        educationQualification: formData.educationQualification.trim(),
        skills: formData.skills,
        areasOfInterest: formData.areasOfInterest,
        preferredActivities: formData.preferredActivities,
        memberId: userProfile?.membershipId || userProfile?.memberId || '',
        previousExperience: formData.previousExperience.trim(),
        availability: formData.availability,
        preferredLocation: formData.preferredLocation.trim(),
        statementOfPurpose: formData.statementOfPurpose.trim(),
        declarationAccepted: formData.declarationAccepted
      };

      if (existingApplication?.id && existingApplication.status === 'pending') {
        // Update existing pending application
        await updateVolunteerApplication(existingApplication.id, payload, {
          uid: currentUser.uid,
          email: currentUser.email || ''
        });
        setIsEditing(false);
        setIsReviewStep(false);
        if (onSuccess) onSuccess('Volunteer Application successfully updated!');
      } else {
        // Submit new volunteer application
        await submitVolunteerApplication(payload, {
          uid: currentUser.uid,
          email: currentUser.email || ''
        });
        setIsReviewStep(false);
        if (onSuccess) onSuccess('Volunteer Application successfully submitted for review!');
      }
    } catch (err: any) {
      console.error('Error submitting volunteer application:', err);
      setErrorMessage(err?.message || 'Failed to submit volunteer application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: VolunteerApplicationStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Pending Review</span>
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            <span>Under Scrutiny</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Approved • Active Volunteer</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>Application Rejected</span>
          </span>
        );
    }
  };

  if (isLoadingExisting) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">Checking volunteer corps records...</p>
      </div>
    );
  }

  // View Mode: Display Existing Submitted Application
  if (existingApplication && !isEditing) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6" id="volunteer-application-status-card">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Official FET Volunteer Corps
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Volunteer Service Application
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted on {new Date(existingApplication.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • Linked to Firebase UID: <span className="font-mono text-slate-700">{currentUser?.uid.slice(0, 10)}...</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {getStatusBadge(existingApplication.status)}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Administrative Status Banner & Review Notes */}
        {existingApplication.status === 'pending' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900">Application Submitted • Awaiting Super Admin Review</p>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                Your volunteer application has been received into the Trust Secretariat queue. Our volunteer committee is verifying capacity in your requested district. You will be notified once status updates.
              </p>
            </div>
          </div>
        )}

        {existingApplication.status === 'under_review' && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-3">
            <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-blue-900">Stage 2: Active Evaluation & Chapter Assignment</p>
              <p className="text-[11px] text-blue-900/90 leading-relaxed">
                Your application is currently under formal scrutiny by the Chapter Coordinator and Secretariat.
              </p>
            </div>
          </div>
        )}

        {existingApplication.status === 'approved' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-emerald-900">Volunteer Corps Induction Approved!</p>
              <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                Congratulations! You are officially recognized as a certified FET India Volunteer. Your profile has been assigned field volunteer credentials.
              </p>
            </div>
          </div>
        )}

        {existingApplication.status === 'rejected' && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-3">
            <XCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900">Application Decision Notice</p>
              <p className="text-[11px] text-rose-900/90 leading-relaxed">
                The Trust Secretariat could not approve this volunteer application for the current operational cycle.
              </p>
            </div>
          </div>
        )}

        {/* Official Secretariat Review Notes */}
        {existingApplication.reviewNotes && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Official Secretariat Review Notes:</span>
            </div>
            <p className="text-slate-700 italic pl-5 leading-relaxed">
              "{existingApplication.reviewNotes}"
            </p>
            {existingApplication.reviewedAt && (
              <p className="text-[10px] text-slate-400 pl-5">
                Reviewed on {new Date(existingApplication.reviewedAt).toLocaleString()} by {existingApplication.reviewedByEmail || 'Secretariat Admin'}
              </p>
            )}
          </div>
        )}

        {/* Application Details Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Submitted Profile & Application Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            
            {/* Full Legal Name */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Full Legal Name</span>
              <p className="font-bold text-slate-900">{existingApplication.fullLegalName}</p>
            </div>

            {/* Email Address */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
              <p className="font-mono text-slate-800">{existingApplication.applicantEmail}</p>
            </div>

            {/* Mobile Number */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</span>
              <p className="font-semibold text-slate-900">{existingApplication.mobileNumber || 'Not provided'}</p>
            </div>

            {/* Country & State */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Country & State</span>
              <p className="font-semibold text-slate-900">{existingApplication.country} • {existingApplication.state}</p>
            </div>

            {/* District / City */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">District / City</span>
              <p className="font-semibold text-slate-900">{existingApplication.district}</p>
            </div>

            {/* Date of Birth */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</span>
              <p className="font-semibold text-slate-900">{existingApplication.dateOfBirth || 'Not provided'}</p>
            </div>

            {/* Education / Qualification */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Education / Qualification</span>
              <p className="font-semibold text-slate-900">{existingApplication.educationQualification}</p>
            </div>

            {/* Availability */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Availability Schedule</span>
              <p className="font-semibold text-slate-900">{existingApplication.availability}</p>
            </div>

            {/* Preferred Volunteer Location */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Preferred Volunteer Location / Chapter</span>
              <p className="font-semibold text-slate-900">{existingApplication.preferredLocation}</p>
            </div>

            {/* Full Residential Address */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Full Residential Address</span>
              <p className="text-slate-700 leading-relaxed">{existingApplication.fullAddress}</p>
            </div>

            {/* Skills */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 sm:col-span-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Skills & Capabilities</span>
              <div className="flex flex-wrap gap-1.5">
                {existingApplication.skills?.map((skill, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Areas of Interest */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 sm:col-span-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Areas of Interest / Programs</span>
              <div className="flex flex-wrap gap-1.5">
                {existingApplication.areasOfInterest?.map((area, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-700 text-white shadow-2xs">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* Previous Experience */}
            {existingApplication.previousExperience && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Previous Volunteer Experience</span>
                <p className="text-slate-700 leading-relaxed">{existingApplication.previousExperience}</p>
              </div>
            )}

            {/* Why do you want to volunteer? */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-1 sm:col-span-3">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">Statement of Purpose: Why do you want to volunteer?</span>
              <p className="text-slate-800 text-xs leading-relaxed italic">
                "{existingApplication.statementOfPurpose}"
              </p>
            </div>

          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            Last Updated: {new Date(existingApplication.updatedAt || existingApplication.createdAt).toLocaleString()}
          </div>

          <div className="flex items-center gap-3">
            {existingApplication.status === 'pending' && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Application</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>

      </div>
    );
  }

  // Edit / Creation Form Mode
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6" id="volunteer-application-form-container">
      
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                FET India Volunteer Corps
              </span>
              {isEditing && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                  Editing Pending Application
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Become a FET India Volunteer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
              Join thousands of dedicated volunteers serving in education, healthcare, disaster relief, and youth empowerment. Your application will be reviewed by the Trust Secretariat.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Review Step Modal / Screen */}
      {isReviewStep ? (
        <div className="space-y-6" id="volunteer-application-review-summary">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-emerald-900">Please Review Your Application Details</p>
              <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                Confirm that all contact and location information is accurate before submitting to the Trust Secretariat.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Full Legal Name:</span>
              <p className="font-bold text-slate-900">{userProfile?.fullLegalName || userProfile?.displayName || currentUser?.displayName}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address:</span>
              <p className="font-mono text-slate-800">{userProfile?.email || currentUser?.email}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number:</span>
              <p className="font-semibold text-slate-900">{userProfile?.mobileNumber || userProfile?.phoneNumber || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Country & State:</span>
              <p className="font-semibold text-slate-900">{userProfile?.country || 'India'} • {formData.state}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">District / City:</span>
              <p className="font-semibold text-slate-900">{formData.district}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth:</span>
              <p className="font-semibold text-slate-900">{formData.dateOfBirth}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Education / Qualification:</span>
              <p className="font-semibold text-slate-900">{formData.educationQualification}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Preferred Location / Chapter:</span>
              <p className="font-semibold text-slate-900">{formData.preferredLocation}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Availability:</span>
              <p className="font-semibold text-slate-900">{formData.availability}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Skills:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {formData.skills.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Areas of Interest:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {formData.areasOfInterest.map((a, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-emerald-700 text-white text-[11px] font-semibold">
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Statement of Purpose:</span>
              <p className="text-slate-800 italic mt-0.5 leading-relaxed">"{formData.statementOfPurpose}"</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReviewStep(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Edit</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer shadow-md transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting Application...' : 'Confirm & Submit Application'}</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); const err = validateForm(); if (err) { setErrorMessage(err); } else { setErrorMessage(null); setIsReviewStep(true); } }} className="space-y-6">
          
          {/* Section 1: Member Identity (Read from Profile) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-700" />
                <span>1. Applicant Identity & Verification Info</span>
              </h3>
              <div className="flex items-center gap-2">
                {(userProfile?.membershipId || userProfile?.memberId) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                    FET Member ID: {userProfile?.membershipId || userProfile?.memberId}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-mono">UID: {currentUser?.uid.slice(0, 8)}...</span>
              </div>
            </div>

            {/* Profile Photo & Identity Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                {formData.photoURL ? (
                  <img
                    src={formData.photoURL}
                    alt="Volunteer Profile"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center border border-emerald-300">
                    {(userProfile?.fullLegalName || currentUser?.displayName || 'V')[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5 w-full">
                <label className="block text-xs font-bold text-slate-700">
                  Profile Photograph URL / Image Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg or leave blank to use account photo"
                  value={formData.photoURL}
                  onChange={(e) => setFormData(prev => ({ ...prev, photoURL: e.target.value }))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400">Preloaded from your FET India account profile.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Full Legal Name */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Full Legal Name</label>
                <div className="font-bold text-slate-900 text-xs">
                  {userProfile?.fullLegalName || userProfile?.displayName || currentUser?.displayName || 'Member Name'}
                </div>
              </div>

              {/* Father's Name OR Mother's Name */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase block">
                  Father's / Mother's Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. S. M. Razvi"
                  value={formData.fatherOrMotherName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatherOrMotherName: e.target.value }))}
                  className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>

              {/* Mobile Number */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Mobile Number</label>
                <div className="font-semibold text-slate-900 text-xs">
                  {userProfile?.mobileNumber || userProfile?.phoneNumber || 'Not provided'}
                </div>
              </div>

              {/* Country */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Country</label>
                <div className="font-semibold text-slate-900 text-xs">
                  {userProfile?.country || 'India'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Location & Residential Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>2. Location & Residential Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  State / Province <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maharashtra, Uttar Pradesh, Delhi..."
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  District / City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai, Lucknow, Hyderabad..."
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Residential Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="House/Flat No, Street, Locality, Pincode..."
                  value={formData.fullAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Volunteer Location / Chapter <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Chapter, Local District Field, Remote Digital..."
                  value={formData.preferredLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredLocation: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Education, Skills & Availability */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>3. Qualifications, Skills & Availability</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Education / Qualification <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech / B.A. / MBBS / MBA / High School..."
                  value={formData.educationQualification}
                  onChange={(e) => setFormData(prev => ({ ...prev, educationQualification: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Availability Schedule <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden cursor-pointer"
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Skills Multi-Selection */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Skills & Capabilities (Select all that apply) <span className="text-rose-500">*</span>
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SKILLS.map((sk) => {
                    const isSelected = formData.skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleSkill(sk)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {sk}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Skill */}
                <div className="flex items-center gap-2 pt-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Add other custom skill..."
                    value={formData.customSkill}
                    onChange={(e) => setFormData(prev => ({ ...prev, customSkill: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSkill(); } }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    Add Skill
                  </button>
                </div>

                {/* Selected Custom Skills List */}
                {formData.skills.some(s => !PRESET_SKILLS.includes(s)) && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {formData.skills.filter(s => !PRESET_SKILLS.includes(s)).map((csk) => (
                      <span key={csk} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                        <span>{csk}</span>
                        <button type="button" onClick={() => handleRemoveSkill(csk)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-1">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Areas of Interest */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Areas of Interest / Trust Programs <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_AREAS_OF_INTEREST.map((interest) => {
                    const isSelected = formData.areasOfInterest.includes(interest);
                    return (
                      <div
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 text-xs'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs">{interest}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Previous Experience */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Previous Volunteer Experience (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail any prior NGO, madrasa, community, or youth leadership experience..."
                  value={formData.previousExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, previousExperience: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Statement of Purpose & Declaration */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>4. Statement of Purpose & Trust Declaration</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Why do you want to volunteer with Fatimyah Educational Trust? <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Share your motivation, mission alignment, and what you hope to contribute to the community..."
                value={formData.statementOfPurpose}
                onChange={(e) => setFormData(prev => ({ ...prev, statementOfPurpose: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Minimum 20 characters required.</span>
            </div>

            {/* Volunteer Declaration / Ethics Agreement */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="declaration-checkbox"
                  checked={formData.declarationAccepted}
                  onChange={(e) => setFormData(prev => ({ ...prev, declarationAccepted: e.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="declaration-checkbox" className="text-slate-700 text-xs leading-relaxed cursor-pointer select-none">
                  <strong className="text-slate-900 block font-bold mb-0.5">Volunteer Code of Conduct & Declaration:</strong>
                  I hereby pledge to uphold the principles of integrity, respect, and altruism as an official volunteer of Fatimyah Educational Trust India. I confirm that all information provided is accurate and truthful. I understand that volunteer appointments are honorary, subject to administrative review, and governed by the Trust Secretariat.
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancel Edit
              </button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-98"
                id="review-volunteer-application-btn"
              >
                <span>Review & Submit Application</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </form>
      )}

    </div>
  );
};
