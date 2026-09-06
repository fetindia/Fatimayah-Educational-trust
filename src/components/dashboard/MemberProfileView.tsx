/**
 * @license
 * Official User Profile & Account Management System
 * Fatimyah Educational Trust India (FET India)
 * Organization Legal Name: Fatimyah Educational Trust
 * Tagline: Education • Service • Empowerment
 * Regn. No. E-19842 (BOM) • Section 80G & 12A Certified
 *
 * Step 41 Compliance:
 * - Comprehensive Profile Overview & Official Accreditation
 * - Full Profile Editing (Legal Name, Father/Parent, Mother, Address, District, State, PIN, Phone, DOB, Gender, Bio)
 * - Profile Photo Studio (Upload, Replace, Remove, Live Preview, Canvas Optimization & Resizing)
 * - Safe Firebase Storage User-Specific Paths (profile_photos/{userId}/...)
 * - Synchronized Integration with Digital Membership, Volunteer, and Donor ID Cards
 * - Strict Non-Privileged Field Sanitization (Guarantees Auth & Role Immutability)
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  Heart, 
  Shield, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Save, 
  RefreshCw, 
  ExternalLink,
  Lock,
  Sparkles,
  Info,
  Building,
  UserCheck,
  Crown,
  Award,
  CreditCard,
  QrCode,
  HeartHandshake,
  BadgeDollarSign,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Edit3,
  Eye,
  ArrowRight,
  HelpCircle,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../../types';
import { DigitalMembershipCard } from '../membership/DigitalMembershipCard';
import { DigitalVolunteerCard } from '../volunteer/DigitalVolunteerCard';
import { DigitalDonorCard } from '../donor/DigitalDonorCard';
import { MembershipVerificationModal } from '../membership/MembershipVerificationModal';
import { 
  uploadUserProfilePhoto, 
  validateImageFile, 
  processAndOptimizeAvatarImage 
} from '../../lib/storage';

export type ProfileSubView = 'overview' | 'edit' | 'photo';

interface MemberProfileViewProps {
  onNotify?: (message: string) => void;
  onOpenMembershipCard?: () => void;
  initialSubView?: ProfileSubView;
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({ 
  onNotify,
  onOpenMembershipCard,
  initialSubView = 'overview'
}) => {
  const { 
    currentUser, 
    userProfile, 
    updateProfileData, 
    refreshProfile, 
    checkEmailVerification,
    sendVerification
  } = useAuth();

  // Active Sub-view Tab (Overview | Edit Profile | Photo Management)
  const [activeSubView, setActiveSubView] = useState<ProfileSubView>(initialSubView);

  // Membership & Tier Status
  const membershipStatus = userProfile?.membershipStatus || 'none';
  const isCoreMember = membershipStatus === 'core_member' || userProfile?.role === 'core_member';
  const isApprovedMember = membershipStatus === 'general_member' || isCoreMember;
  
  // Volunteer & Donor Accreditation
  const volunteerStatus = userProfile?.volunteerStatus || 'none';
  const donorStatus = userProfile?.donorStatus || 'none';
  const isApprovedVolunteer = 
    volunteerStatus === 'approved' || 
    volunteerStatus === 'active_volunteer' || 
    userProfile?.roles?.includes('volunteer') || 
    userProfile?.role === 'volunteer' ||
    userProfile?.primaryRole === 'volunteer';
  const isApprovedDonor = 
    donorStatus === 'approved' || 
    donorStatus === 'active_donor' || 
    userProfile?.roles?.includes('donor') || 
    userProfile?.role === 'donor';

  // Primary Member ID / User ID
  const memberId = userProfile?.membershipId || `FET-MBR-${new Date().getFullYear()}-${currentUser?.uid ? currentUser.uid.slice(0, 4).toUpperCase() : '8492'}`;
  
  // Dates & Validity
  const approvalDate = userProfile?.membershipApprovedAt || userProfile?.promotedAt || userProfile?.createdAt;
  const formattedApprovalDate = approvalDate 
    ? new Date(approvalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'AY 2026-2027';
  const validityPeriod = userProfile?.membershipValidUntil || 'AY 2026-2027 (Annual Trust Cycle)';

  // Verification modal state
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Form State for Demographic & Contact Profile
  const [formData, setFormData] = useState<{
    fullLegalName: string;
    fatherName: string;
    motherName: string;
    guardianName: string;
    mobileNumber: string;
    country: string;
    district: string;
    city: string;
    state: string;
    address: string;
    pincode: string;
    occupation: string;
    educationalQualification: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup: string;
    emergencyContact: string;
    bio: string;
  }>({
    fullLegalName: '',
    fatherName: '',
    motherName: '',
    guardianName: '',
    mobileNumber: '',
    country: 'India',
    district: '',
    city: '',
    state: '',
    address: '',
    pincode: '',
    occupation: '',
    educationalQualification: '',
    gender: 'prefer_not_to_say',
    dateOfBirth: '',
    bloodGroup: '',
    emergencyContact: '',
    bio: ''
  });

  // Validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Loading & Action States
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedMemberId, setCopiedMemberId] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  
  // Photo Studio & Upload State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoStudioInputRef = useRef<HTMLInputElement>(null);

  // Sync initial subview if prop changes
  useEffect(() => {
    if (initialSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView]);

  // Sync form data from userProfile and currentUser
  useEffect(() => {
    if (userProfile || currentUser) {
      setFormData({
        fullLegalName: userProfile?.fullLegalName || userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || '',
        fatherName: userProfile?.fatherName || userProfile?.guardianName || '',
        motherName: userProfile?.motherName || '',
        guardianName: userProfile?.guardianName || userProfile?.fatherName || '',
        mobileNumber: userProfile?.mobileNumber || userProfile?.phoneNumber || currentUser?.phoneNumber || '',
        country: userProfile?.country || 'India',
        district: userProfile?.district || userProfile?.city || '',
        city: userProfile?.city || userProfile?.district || '',
        state: userProfile?.state || '',
        address: userProfile?.address || userProfile?.fullAddress || '',
        pincode: userProfile?.pincode || '',
        occupation: userProfile?.occupation || '',
        educationalQualification: userProfile?.educationalQualification || userProfile?.qualification || '',
        gender: userProfile?.gender || 'prefer_not_to_say',
        dateOfBirth: userProfile?.dateOfBirth || '',
        bloodGroup: userProfile?.bloodGroup || '',
        emergencyContact: userProfile?.emergencyContact || '',
        bio: userProfile?.bio || ''
      });
    }
  }, [userProfile, currentUser]);

  // Handle Photo Selection for Studio Preview
  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setPhotoSuccess(null);

    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      setPhotoError(validation.error || 'Invalid photograph format. Please choose a JPG, PNG or WebP image.');
      if (onNotify) onNotify(validation.error || 'Invalid photograph format.');
      return;
    }

    try {
      // Create high-res optimized preview data URL
      const optimized = await processAndOptimizeAvatarImage(file, 800, 0.88);
      setSelectedPhotoFile(optimized.file);
      setPreviewPhotoUrl(optimized.dataUrl);
    } catch (err: any) {
      setPhotoError('Could not process image for preview. Please try another file.');
    }
  };

  // Commit & Upload Selected Photo
  const handleSavePhoto = async () => {
    if (!selectedPhotoFile || !currentUser) return;

    setIsUploadingPhoto(true);
    setPhotoUploadProgress(15);
    setPhotoError(null);
    setPhotoSuccess(null);

    try {
      const result = await uploadUserProfilePhoto(currentUser.uid, selectedPhotoFile, (prog) => {
        setPhotoUploadProgress(prog);
      });

      await updateProfileData({
        photoURL: result.url
      });
      await refreshProfile();

      setPhotoSuccess('Profile photograph successfully updated and linked across all Trust identity cards.');
      setPreviewPhotoUrl(null);
      setSelectedPhotoFile(null);
      if (onNotify) onNotify('Profile photograph updated successfully.');
      setTimeout(() => setPhotoSuccess(null), 5000);
    } catch (err: any) {
      console.error('Failed to upload profile photograph:', err);
      setPhotoError(err?.message || 'Failed to upload photo. Please check your connection and try again.');
      if (onNotify) onNotify('Failed to upload photograph.');
    } finally {
      setIsUploadingPhoto(false);
      setPhotoUploadProgress(0);
      if (photoInputRef.current) photoInputRef.current.value = '';
      if (photoStudioInputRef.current) photoStudioInputRef.current.value = '';
    }
  };

  // Remove Profile Photo
  const handleRemovePhoto = async () => {
    if (!currentUser) return;
    if (!window.confirm('Are you sure you want to remove your profile photograph? Your profile and ID cards will revert to your official initials.')) {
      return;
    }

    setIsRemovingPhoto(true);
    setPhotoError(null);
    setPhotoSuccess(null);

    try {
      await updateProfileData({
        photoURL: ''
      });
      await refreshProfile();
      setPreviewPhotoUrl(null);
      setSelectedPhotoFile(null);
      setPhotoSuccess('Profile photograph removed successfully.');
      if (onNotify) onNotify('Profile photograph removed.');
      setTimeout(() => setPhotoSuccess(null), 4000);
    } catch (err: any) {
      setPhotoError('Failed to remove photograph. Please try again.');
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  // Direct quick upload from banner camera icon
  const handleQuickPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      if (onNotify) onNotify(validation.error || 'Invalid photo format.');
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoUploadProgress(20);
    try {
      const result = await uploadUserProfilePhoto(currentUser.uid, file, (prog) => {
        setPhotoUploadProgress(prog);
      });

      await updateProfileData({
        photoURL: result.url
      });
      await refreshProfile();
      if (onNotify) onNotify('Profile photograph updated.');
    } catch (err: any) {
      console.error('Failed to upload quick photo:', err);
      if (onNotify) onNotify('Failed to upload photograph. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      setPhotoUploadProgress(0);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Copy helper methods
  const handleCopyMemberId = () => {
    navigator.clipboard.writeText(memberId);
    setCopiedMemberId(true);
    if (onNotify) onNotify(`Member ID ${memberId} copied.`);
    setTimeout(() => setCopiedMemberId(false), 2000);
  };

  const handleCopyUid = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      if (onNotify) onNotify('Firebase UID copied.');
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      await checkEmailVerification();
      if (onNotify) onNotify('Profile synchronized with database.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    try {
      await sendVerification();
      if (onNotify) onNotify('Verification email dispatched. Please check your inbox.');
    } catch (err: any) {
      if (onNotify) onNotify(err?.message || 'Could not send verification email.');
    } finally {
      setResendingEmail(false);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.fullLegalName.trim() || formData.fullLegalName.trim().length < 2) {
      errors.fullLegalName = 'Full Legal Name is required (minimum 2 characters).';
    }

    if (formData.mobileNumber.trim()) {
      const cleanedPhone = formData.mobileNumber.replace(/[\s\-()]/g, '');
      if (cleanedPhone.length < 7 || cleanedPhone.length > 15) {
        errors.mobileNumber = 'Please enter a valid mobile phone number with country code.';
      }
    }

    if (formData.pincode.trim() && formData.country.toLowerCase() === 'india') {
      const pin = formData.pincode.trim();
      if (!/^\d{6}$/.test(pin)) {
        errors.pincode = 'Please enter a valid 6-digit Indian Postal PIN code.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Profile Form Updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!validateForm()) {
      setSaveError('Please correct the highlighted validation errors before saving.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateProfileData({
        fullLegalName: formData.fullLegalName.trim(),
        fullName: formData.fullLegalName.trim(),
        displayName: formData.fullLegalName.trim(),
        fatherName: formData.fatherName.trim(),
        motherName: formData.motherName.trim(),
        guardianName: formData.fatherName.trim() || formData.guardianName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        phoneNumber: formData.mobileNumber.trim(),
        country: formData.country.trim(),
        district: formData.district.trim(),
        city: formData.district.trim() || formData.city.trim(),
        state: formData.state.trim(),
        address: formData.address.trim(),
        fullAddress: formData.address.trim(),
        pincode: formData.pincode.trim(),
        occupation: formData.occupation.trim(),
        educationalQualification: formData.educationalQualification.trim(),
        qualification: formData.educationalQualification.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        bloodGroup: formData.bloodGroup.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        bio: formData.bio.trim()
      });

      await refreshProfile();
      setSaveSuccess(true);
      if (onNotify) onNotify('Profile details updated and synchronized with cloud records.');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setSaveError(err?.message || 'Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isEmailVerified = currentUser?.emailVerified || userProfile?.emailVerified || false;
  const currentPhotoUrl = userProfile?.photoURL || '';

  return (
    <div className="space-y-6 max-w-5xl" id="member-profile-page">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP IDENTITY & ACCREDITATION BANNER                        */}
      {/* ------------------------------------------------------------- */}
      <div className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border ${
        isCoreMember
          ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 border-amber-500/30'
          : isApprovedMember
          ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 border-emerald-500/30'
          : 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 border-slate-700'
      }`}>
        {/* Ambient Glow */}
        <div className={`absolute -right-10 -bottom-10 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isCoreMember ? 'bg-amber-500/20' : isApprovedMember ? 'bg-emerald-500/15' : 'bg-slate-600/10'
        }`} />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4 sm:gap-5">
            
            {/* Member Photograph / Avatar with Quick Camera Trigger */}
            <div className="relative group shrink-0">
              <input
                type="file"
                ref={photoInputRef}
                onChange={handleQuickPhotoUpload}
                accept="image/*"
                className="hidden"
                id="member-profile-quick-photo-upload"
              />
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl shrink-0 relative overflow-hidden border-2 transition-transform group-hover:scale-105 ${
                isCoreMember
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 border-amber-300'
                  : isApprovedMember
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {currentPhotoUrl ? (
                  <img 
                    src={currentPhotoUrl} 
                    alt={formData.fullLegalName} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{formData.fullLegalName ? formData.fullLegalName.charAt(0).toUpperCase() : 'M'}</span>
                )}
                {isApprovedMember && !isUploadingPhoto && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-xs py-0.5 text-center">
                    <span className="text-[7.5px] font-mono text-emerald-300 font-bold">ACCREDITED</span>
                  </div>
                )}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
                    <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="text-[9px] font-bold mt-1">{photoUploadProgress}%</span>
                  </div>
                )}
              </div>

              {/* Camera Trigger */}
              <button
                type="button"
                onClick={() => setActiveSubView('photo')}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-slate-900 shadow-md cursor-pointer transition-colors"
                title="Open Photograph Management Studio"
                aria-label="Manage profile photograph"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Member Title, Parent Name & Accreditation Badges */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {formData.fullLegalName || 'FET India User'}
                </h2>
                
                {/* Membership Badge */}
                {isCoreMember ? (
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 border border-amber-300 shadow-xs flex items-center gap-1">
                    <Crown className="w-3 h-3 text-slate-950" /> CORE MEMBER
                  </span>
                ) : isApprovedMember ? (
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-emerald-400 text-slate-950 border border-emerald-300 shadow-xs flex items-center gap-1">
                    <Award className="w-3 h-3 text-slate-950" /> GENERAL MEMBER
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Registered User
                  </span>
                )}

                {/* Volunteer Badge */}
                {isApprovedVolunteer && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-400 text-slate-950 border border-sky-300 shadow-xs flex items-center gap-1">
                    <HeartHandshake className="w-3 h-3 text-slate-950" /> VOLUNTEER CORPS
                  </span>
                )}

                {/* Donor Badge */}
                {isApprovedDonor && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 border border-amber-300 shadow-xs flex items-center gap-1">
                    <BadgeDollarSign className="w-3 h-3 text-slate-950" /> PATRON DONOR
                  </span>
                )}
              </div>

              {/* Father's / Parent's Name Sub-heading for unambiguous identification */}
              {(formData.fatherName || formData.motherName) && (
                <p className="text-xs text-amber-200/90 font-medium">
                  {formData.fatherName && <span>S/D/W of: <strong className="text-white">{formData.fatherName}</strong></span>}
                  {formData.fatherName && formData.motherName && <span className="mx-1.5">•</span>}
                  {formData.motherName && <span>Mother: <strong className="text-white">{formData.motherName}</strong></span>}
                </p>
              )}

              {/* Contact Email & Mobile */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser?.email}</span>
                  {isEmailVerified ? (
                    <span title="Email Verified" className="inline-flex items-center">
                      <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                    </span>
                  ) : (
                    <button
                      onClick={handleResendEmail}
                      disabled={resendingEmail}
                      className="text-[10px] text-amber-400 hover:underline font-bold ml-1 cursor-pointer"
                    >
                      {resendingEmail ? 'Sending...' : '(Verify Email)'}
                    </button>
                  )}
                </span>

                {formData.mobileNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formData.mobileNumber}</span>
                  </span>
                )}

                {(formData.district || formData.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{[formData.district, formData.state, formData.country].filter(Boolean).join(', ')}</span>
                  </span>
                )}
              </div>

              {/* Identifiers (Member ID + Volunteer/Donor ID + Auth UID) */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-1 text-xs font-mono">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    {isApprovedMember ? 'Member ID:' : 'User ID:'}
                  </span>
                  <span className="text-amber-300 font-black tracking-tight">{memberId}</span>
                  <button
                    type="button"
                    onClick={handleCopyMemberId}
                    className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer"
                    title="Copy Permanent Member ID"
                  >
                    {copiedMemberId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                {userProfile?.volunteerId && (
                  <div className="inline-flex items-center gap-1 bg-sky-950/80 border border-sky-700/80 rounded-xl px-2.5 py-1 text-xs font-mono text-sky-300">
                    <span className="text-[9px] uppercase font-bold text-sky-400">Vol ID:</span>
                    <span className="font-bold">{userProfile.volunteerId}</span>
                  </div>
                )}

                {userProfile?.donorId && (
                  <div className="inline-flex items-center gap-1 bg-amber-950/80 border border-amber-700/80 rounded-xl px-2.5 py-1 text-xs font-mono text-amber-300">
                    <span className="text-[9px] uppercase font-bold text-amber-400">Donor ID:</span>
                    <span className="font-bold">{userProfile.donorId}</span>
                  </div>
                )}

                <div className="inline-flex items-center gap-1 bg-slate-950/60 border border-slate-700/80 rounded-xl px-2.5 py-1 text-[11px] font-mono text-slate-400">
                  <span className="text-[9px] uppercase font-bold text-slate-500">Auth UID:</span>
                  <span className="truncate max-w-[110px] text-slate-300">{currentUser?.uid}</span>
                  <button
                    type="button"
                    onClick={handleCopyUid}
                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    title="Copy Firebase Auth UID"
                  >
                    {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Banner Action Controls */}
          <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0 w-full md:w-auto">
            {isApprovedMember && (
              <button
                type="button"
                onClick={() => setIsVerificationModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors w-full sm:w-auto"
              >
                <QrCode className="w-4 h-4 text-slate-950" />
                <span>Verify Credential QR</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Cloud Record'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. THREE-TAB SUB-NAVIGATION SWITCHER                          */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex items-center gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubView('overview')}
          className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubView === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          id="tab-subview-overview"
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Profile Overview & ID Cards</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('edit')}
          className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubView === 'edit'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          id="tab-subview-edit"
        >
          <Edit3 className="w-4 h-4 text-amber-300" />
          <span>Edit Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('photo')}
          className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubView === 'photo'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          id="tab-subview-photo"
        >
          <ImageIcon className="w-4 h-4 text-sky-400" />
          <span>Profile Photograph</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* SUB-VIEW 1: PROFILE OVERVIEW & OFFICIAL ATTRIBUTES GRID        */}
      {/* ============================================================= */}
      {activeSubView === 'overview' && (
        <div className="space-y-6 animate-in fade-in" id="profile-subview-overview">
          
          {/* Official Trust Membership Attributes Grid */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Official Trust Identity & Membership Attributes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Permanent statutory registration parameters and demographic verification credentials.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubView('edit')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Comprehensive Field Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              
              {/* 1. Full Legal Name */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  1. Full Legal Name
                </span>
                <div className="font-extrabold text-slate-900 text-sm">
                  {formData.fullLegalName || 'Registered User'}
                </div>
              </div>

              {/* 2. Father's / Parent's Name */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  2. Father's / Parent's Name
                </span>
                <div className="font-bold text-slate-800 text-sm">
                  {formData.fatherName || formData.guardianName || <span className="text-slate-400 italic">Not recorded (Click Edit)</span>}
                </div>
              </div>

              {/* 3. Mother's Name */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  3. Mother's Name
                </span>
                <div className="font-bold text-slate-800 text-sm">
                  {formData.motherName || <span className="text-slate-400 italic">Not recorded</span>}
                </div>
              </div>

              {/* 4. Unique Member ID */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  4. Unique Identification ID
                </span>
                <div className="font-mono font-black text-amber-600 text-sm">
                  {memberId}
                </div>
              </div>

              {/* 5. Membership Status */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  5. Membership Status
                </span>
                <div className={`font-black text-sm flex items-center gap-1.5 ${
                  isCoreMember ? 'text-amber-700' : isApprovedMember ? 'text-emerald-800' : 'text-slate-600'
                }`}>
                  {isCoreMember ? <Crown className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  <span>{isCoreMember ? 'Core Member' : isApprovedMember ? 'General Member' : 'Registered User'}</span>
                </div>
              </div>

              {/* 6. Email Address & Verification */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  6. Official Email Address
                </span>
                <div className="font-bold text-slate-900 truncate flex items-center gap-1" title={currentUser?.email || ''}>
                  <span className="truncate">{currentUser?.email}</span>
                  {isEmailVerified ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">VERIFIED</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold shrink-0">UNVERIFIED</span>
                  )}
                </div>
              </div>

              {/* 7. Mobile Number */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  7. Mobile Contact Number
                </span>
                <div className="font-bold text-slate-900">
                  {formData.mobileNumber || <span className="text-slate-400 italic">Not provided</span>}
                </div>
              </div>

              {/* 8. Country */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  8. Country of Residence
                </span>
                <div className="font-bold text-slate-900">
                  {formData.country || 'India'}
                </div>
              </div>

              {/* 9. State / Province */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  9. State / Province
                </span>
                <div className="font-bold text-slate-900">
                  {formData.state || <span className="text-slate-400 italic">Not specified</span>}
                </div>
              </div>

              {/* 10. District / City */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  10. District / City
                </span>
                <div className="font-bold text-slate-900">
                  {formData.district || formData.city || <span className="text-slate-400 italic">Not specified</span>}
                </div>
              </div>

              {/* 11. Postal PIN Code */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  11. Postal PIN Code
                </span>
                <div className="font-mono font-bold text-slate-900">
                  {formData.pincode || <span className="text-slate-400 italic">Not specified</span>}
                </div>
              </div>

              {/* 12. Date of Birth & Gender */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  12. Date of Birth & Gender
                </span>
                <div className="font-bold text-slate-900">
                  {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not provided'}
                  {formData.gender && formData.gender !== 'prefer_not_to_say' && (
                    <span className="capitalize text-slate-500 ml-1">({formData.gender})</span>
                  )}
                </div>
              </div>

              {/* 13. Residential Address */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2 lg:col-span-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  13. Official Residential / Postal Address
                </span>
                <div className="font-bold text-slate-900 leading-relaxed">
                  {formData.address || <span className="text-slate-400 italic">No street address entered yet. Click "Edit Profile" to add complete KYC address.</span>}
                </div>
              </div>

            </div>
          </div>

          {/* Digital Membership Card Preview */}
          {isApprovedMember ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <CreditCard className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Official Digital Membership Card
                    </h3>
                    <p className="text-xs text-slate-500">
                      Synchronized real-time with your profile photograph, father/parent name, and member ID.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Verify QR</span>
                </button>
              </div>

              <div className="max-w-xl mx-auto py-2">
                <DigitalMembershipCard
                  memberId={memberId}
                  fullName={formData.fullLegalName || 'FET India Member'}
                  fatherName={formData.fatherName}
                  guardianName={formData.guardianName}
                  motherName={formData.motherName}
                  membershipType={isCoreMember ? 'core_member' : 'general_member'}
                  membershipStatus={isCoreMember ? 'core_member' : 'general_member'}
                  issueDate={userProfile?.membershipIssueDate || approvalDate || '2026-01-01'}
                  validUntil={validityPeriod}
                  photoURL={currentPhotoUrl}
                  district={formData.district || formData.city}
                  state={formData.state}
                  country={formData.country}
                  email={currentUser?.email || ''}
                  bloodGroup={formData.bloodGroup}
                  onOpenVerification={() => setIsVerificationModalOpen(true)}
                  onNotify={onNotify}
                  showActions={true}
                />
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
              <CreditCard className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-black text-slate-800 text-sm">
                Digital Membership Card Not Activated
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Official Digital Membership Cards are generated for accredited General Members and Core Members upon Trust Secretariat verification.
              </p>
            </div>
          )}

          {/* Volunteer Corps Card if Approved */}
          {isApprovedVolunteer && (
            <div className="bg-white border border-sky-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-sky-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                    <HeartHandshake className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Official Volunteer Corps Identity Card
                    </h3>
                    <p className="text-xs text-slate-500">
                      Field deployment credential for educational, medical, and community aid drives.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                  {userProfile?.volunteerId || 'FET-VOL'}
                </div>
              </div>

              <div className="max-w-xl mx-auto py-2">
                <DigitalVolunteerCard
                  volunteerId={userProfile?.volunteerId || 'FET-VOL-2026-0101'}
                  fullName={formData.fullLegalName}
                  fatherName={formData.fatherName}
                  guardianName={formData.guardianName}
                  motherName={formData.motherName}
                  volunteerWing="Education & Community Relief"
                  volunteerStatus="approved"
                  issueDate={userProfile?.volunteerApprovedAt || '2026-01-01'}
                  photoURL={currentPhotoUrl}
                  bloodGroup={formData.bloodGroup}
                  district={formData.district || formData.city}
                  state={formData.state}
                  country={formData.country}
                  onOpenVerification={() => setIsVerificationModalOpen(true)}
                  onNotify={onNotify}
                  showActions={true}
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-VIEW 2: EDIT PROFILE DETAILS FORM                         */}
      {/* ============================================================= */}
      {activeSubView === 'edit' && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in" id="profile-edit-form">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Edit3 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Edit Personal & Contact Information
                </h3>
                <p className="text-xs text-slate-500">
                  Update your official KYC coordinates and parent details for institutional records and ID cards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubView('overview')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-colors disabled:opacity-50"
                id="save-profile-btn"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>

          {/* Success / Error Alerts */}
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Profile records updated successfully and synchronized across all digital identity cards.</span>
            </div>
          )}

          {saveError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Section A: Core Legal Identity & Parent Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-emerald-700" />
              <span>1. Legal Name & Parent Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Full Legal Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullLegalName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullLegalName: e.target.value });
                    if (formErrors.fullLegalName) setFormErrors({ ...formErrors, fullLegalName: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium ${
                    formErrors.fullLegalName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                  placeholder="As per Government ID (Aadhaar / Passport)"
                  id="input-full-legal-name"
                />
                {formErrors.fullLegalName && (
                  <span className="text-[10px] text-rose-600 font-semibold block mt-1">{formErrors.fullLegalName}</span>
                )}
              </div>

              {/* Father's / Parent's Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Father's / Parent's Name <span className="text-amber-600">(For Identity Cards)</span>
                </label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value, guardianName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  placeholder="Father's full name"
                  id="input-father-name"
                />
                <span className="text-[9.5px] text-slate-500 block mt-0.5">
                  Helps uniquely distinguish members with identical names.
                </span>
              </div>

              {/* Mother's Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Mother's Name
                </label>
                <input
                  type="text"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  placeholder="Mother's full name"
                  id="input-mother-name"
                />
              </div>

            </div>
          </div>

          {/* Section B: Contact & Communication */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <Phone className="w-4 h-4 text-emerald-700" />
              <span>2. Contact & Communication Channels</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Mobile Number */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Primary Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, mobileNumber: e.target.value });
                    if (formErrors.mobileNumber) setFormErrors({ ...formErrors, mobileNumber: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium ${
                    formErrors.mobileNumber ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                  placeholder="+91 98765 43210"
                  id="input-mobile-number"
                />
                {formErrors.mobileNumber && (
                  <span className="text-[10px] text-rose-600 font-semibold block mt-1">{formErrors.mobileNumber}</span>
                )}
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Emergency Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  placeholder="Family / Guardian phone"
                  id="input-emergency-contact"
                />
              </div>

              {/* Email (Read-only Auth Email) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Authentication Email <span className="text-slate-400">(Account Login)</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono cursor-not-allowed"
                />
                <span className="text-[9.5px] text-slate-400 block mt-0.5">
                  Managed via Firebase Authentication settings.
                </span>
              </div>

            </div>
          </div>

          {/* Section C: Residential Address & Regional Coordinates */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>3. Residential & Regional KYC Address</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Country */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  placeholder="India"
                  id="input-country"
                />
              </div>

              {/* State */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  placeholder="e.g. Maharashtra, Uttar Pradesh, Telangana"
                  id="input-state"
                />
              </div>

              {/* District / City */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  District / City
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  placeholder="e.g. Mumbai, Lucknow, Hyderabad"
                  id="input-district"
                />
              </div>

              {/* Postal PIN Code */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Postal PIN Code
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => {
                    setFormData({ ...formData, pincode: e.target.value });
                    if (formErrors.pincode) setFormErrors({ ...formErrors, pincode: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium ${
                    formErrors.pincode ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                  placeholder="6-digit Postal PIN"
                  id="input-pincode"
                />
                {formErrors.pincode && (
                  <span className="text-[10px] text-rose-600 font-semibold block mt-1">{formErrors.pincode}</span>
                )}
              </div>

              {/* House & Street Address */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  House / Street / Flat / Landmark Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  placeholder="Building name, Flat No., Street, Area"
                  id="input-address"
                />
              </div>

            </div>
          </div>

          {/* Section D: Demographics & Education */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>4. Demographics, Education & Profession</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Date of Birth */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  id="input-dob"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium cursor-pointer"
                  id="input-gender"
                >
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Blood Group <span className="text-slate-400">(For ID Card)</span>
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium cursor-pointer"
                  id="input-blood-group"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* Occupation */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Occupation / Profession
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  placeholder="e.g. Teacher, Engineer, Student"
                  id="input-occupation"
                />
              </div>

              {/* Educational Qualification */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Highest Educational Qualification
                </label>
                <input
                  type="text"
                  value={formData.educationalQualification}
                  onChange={(e) => setFormData({ ...formData, educationalQualification: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  placeholder="e.g. B.Tech, M.A., MBBS, Higher Secondary"
                  id="input-education"
                />
              </div>

              {/* Short Bio */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Brief Bio / Social Service Interest
                </label>
                <input
                  type="text"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  placeholder="Short introduction about your social and educational interests"
                  id="input-bio"
                />
              </div>

            </div>
          </div>

          {/* Form Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveSubView('overview')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              ← Back to Overview
            </button>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>

        </form>
      )}

      {/* ============================================================= */}
      {/* SUB-VIEW 3: PROFILE PHOTOGRAPH STUDIO & LIVE PREVIEWS          */}
      {/* ============================================================= */}
      {activeSubView === 'photo' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in" id="profile-photo-studio">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                <ImageIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Profile Photograph Studio
                </h3>
                <p className="text-xs text-slate-500">
                  Upload, adjust, replace or remove your official identity photograph.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubView('overview')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              ← Back to Overview
            </button>
          </div>

          {/* Alert Messages */}
          {photoSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{photoSuccess}</span>
            </div>
          )}

          {photoError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{photoError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left Upload & Actions Controls (5 Cols) */}
            <div className="md:col-span-5 space-y-4">
              
              <input
                type="file"
                ref={photoStudioInputRef}
                onChange={handlePhotoSelected}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                id="photo-studio-file-input"
              />

              {/* Upload Trigger Drop Zone */}
              <div 
                onClick={() => photoStudioInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-3xl bg-slate-50 hover:bg-emerald-50/30 text-center transition-all cursor-pointer group space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-emerald-700 group-hover:scale-110 transition-all mx-auto shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {previewPhotoUrl ? 'Select a Different Photo' : 'Select Photograph from Device'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Click to browse camera, gallery or storage
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-mono font-bold">
                  JPG, PNG, WebP • Up to 10MB
                </div>
              </div>

              {/* Photo Requirements Checklist */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Photograph Guidelines</span>
                </div>
                <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                  <li>Front-facing clear portrait with good lighting</li>
                  <li>Plain background is recommended for ID cards</li>
                  <li>Automatically optimized (~800x800) for crisp printing without distortion</li>
                  <li>Linked immediately to your Digital Membership Card and Volunteer Card</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {previewPhotoUrl && (
                  <button
                    type="button"
                    onClick={handleSavePhoto}
                    disabled={isUploadingPhoto}
                    className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors disabled:opacity-50"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-emerald-300 animate-spin" />
                        <span>Uploading & Processing ({photoUploadProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-amber-300" />
                        <span>Apply & Save Profile Photograph</span>
                      </>
                    )}
                  </button>
                )}

                {currentPhotoUrl && !previewPhotoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isRemovingPhoto}
                    className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>{isRemovingPhoto ? 'Removing...' : 'Remove Current Photo'}</span>
                  </button>
                )}
              </div>

            </div>

            {/* Right Live Visual Preview Grid (7 Cols) */}
            <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-5">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>Live Rendering Preview</span>
              </h4>

              {/* Dual Preview Box (Circular Avatar + Physical ID Card Simulation) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                
                {/* 1. Circular Avatar Preview */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Avatar View</span>
                  <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-3 border-emerald-600 shadow-md bg-slate-100 flex items-center justify-center">
                    {previewPhotoUrl || currentPhotoUrl ? (
                      <img 
                        src={previewPhotoUrl || currentPhotoUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-2xl font-black text-slate-400">
                        {formData.fullLegalName ? formData.fullLegalName.charAt(0).toUpperCase() : 'M'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {previewPhotoUrl ? 'New Pending Photo' : (currentPhotoUrl ? 'Current Active Photo' : 'Default Monogram')}
                  </span>
                </div>

                {/* 2. Identity Card Portrait Preview */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">ID Card Portrait Box</span>
                  <div className="w-20 h-24 rounded-xl mx-auto overflow-hidden border-2 border-slate-400 shadow-md bg-slate-100 flex items-center justify-center relative">
                    {previewPhotoUrl || currentPhotoUrl ? (
                      <img 
                        src={previewPhotoUrl || currentPhotoUrl} 
                        alt="ID Portrait" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-xl font-black text-slate-400">
                        {formData.fullLegalName ? formData.fullLegalName.charAt(0).toUpperCase() : 'M'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    FET Official Signatory Box
                  </span>
                </div>

              </div>

              {previewPhotoUrl && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>New photograph selected. Click <strong>Apply & Save</strong> to update your records.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewPhotoUrl(null);
                      setSelectedPhotoFile(null);
                    }}
                    className="text-xs font-bold text-amber-900 hover:underline cursor-pointer shrink-0"
                  >
                    Discard
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. VERIFICATION MODAL COMPONENT                               */}
      {/* ------------------------------------------------------------- */}
      <MembershipVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        initialMemberId={memberId}
      />

    </div>
  );
};
